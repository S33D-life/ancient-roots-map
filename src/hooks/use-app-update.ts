/**
 * useAppUpdate — detects service worker updates and version.json mismatches.
 * Persists dismissed/installed build IDs so the banner only appears once per
 * session for each genuinely new version.
 *
 * Key guarantees:
 * - Banner never shows if current __BUILD_ID__ === remote build
 * - After "Update" click: all SW caches cleared → hard reload
 * - Fetch failures silently hide the banner (no spam)
 */
import { useState, useEffect, useCallback, useRef } from "react";

declare const __BUILD_ID__: string;

const VERSION_CHECK_INTERVAL = 60 * 60 * 1000; // 60 min
const INSTALLED_KEY = "app-update-installed-build";
const DISMISSED_KEY = "app-update-dismissed";
const VERSION_URL = "/version.json";
const MAX_FETCH_FAILURES = 3;

const fetchVersion = () =>
  fetch(`${VERSION_URL}?t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

/* ── Storage helpers (never throw) ── */
const getDismissedBuild = (): string | null => {
  try { return sessionStorage.getItem(DISMISSED_KEY); } catch { return null; }
};
const setDismissedBuild = (build: string) => {
  try { sessionStorage.setItem(DISMISSED_KEY, build); } catch {}
};
const getInstalledBuild = (): string | null => {
  try { return localStorage.getItem(INSTALLED_KEY); } catch { return null; }
};
const setInstalledBuild = (build: string) => {
  try { localStorage.setItem(INSTALLED_KEY, build); } catch {}
};

interface UpdateState {
  available: boolean;
  source: "sw" | "version" | null;
  remoteBuild: string | null;
}

const IDLE: UpdateState = { available: false, source: null, remoteBuild: null };

export function useAppUpdate() {
  const [update, setUpdate] = useState<UpdateState>(IDLE);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const fetchFailures = useRef(0);

  // Stamp current build as installed on mount
  useEffect(() => {
    if (typeof __BUILD_ID__ !== "undefined" && __BUILD_ID__ !== "dev") {
      setInstalledBuild(__BUILD_ID__);
    }
  }, []);

  // Only surface update if genuinely new (not dismissed, not current build)
  const surfaceIfNew = useCallback((source: "sw" | "version", remoteBuild?: string) => {
    const build = remoteBuild ?? "sw-update";
    // Never show banner if remote build matches the running app
    if (typeof __BUILD_ID__ !== "undefined" && build === __BUILD_ID__) return;
    if (getDismissedBuild() === build || getInstalledBuild() === build) return;
    setUpdate(prev => prev.available ? prev : { available: true, source, remoteBuild: build });
  }, []);

  // ── Service Worker listener ──
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleSW = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        const awaitStateChange = (worker: ServiceWorker) => {
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed") {
              waitingWorkerRef.current = worker;
              surfaceIfNew("sw");
            }
          });
        };

        if (reg.waiting) {
          waitingWorkerRef.current = reg.waiting;
          surfaceIfNew("sw");
        }
        if (reg.installing) awaitStateChange(reg.installing);

        reg.addEventListener("updatefound", () => {
          if (reg.installing) awaitStateChange(reg.installing);
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch { /* SW blocked */ }
    };

    handleSW();
  }, [surfaceIfNew]);

  // ── version.json polling ──
  useEffect(() => {
    if (typeof __BUILD_ID__ === "undefined") return;

    const checkVersion = async () => {
      // Stop polling after too many failures
      if (fetchFailures.current >= MAX_FETCH_FAILURES) return;
      try {
        const res = await fetchVersion();
        if (!res.ok) { fetchFailures.current++; return; }
        const data = await res.json();
        if (data.build && data.build !== __BUILD_ID__) {
          surfaceIfNew("version", data.build);
        }
        fetchFailures.current = 0; // reset on success
      } catch {
        fetchFailures.current++;
      }
    };

    const initial = setTimeout(checkVersion, 10_000);
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [surfaceIfNew]);

  // ── Apply: clear ALL caches then hard-reload ──
  const applyUpdate = useCallback(async () => {
    // Mark build as handled
    if (update.remoteBuild) {
      setDismissedBuild(update.remoteBuild);
      setInstalledBuild(update.remoteBuild);
    }
    setUpdate(IDLE);

    // 1. Tell waiting SW to activate
    const worker = waitingWorkerRef.current;
    if (worker) {
      worker.postMessage({ type: "SKIP_WAITING" });
    }

    // 2. Clear all SW caches so no stale assets remain
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch { /* caches API unavailable */ }

    // 3. Unregister SW so next load gets fresh registration
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    } catch { /* no SW */ }

    // 4. Hard reload from network (bypass cache)
    window.location.reload();
  }, [update.remoteBuild]);

  const dismissUpdate = useCallback(() => {
    if (update.remoteBuild) setDismissedBuild(update.remoteBuild);
    setUpdate(IDLE);
  }, [update.remoteBuild]);

  const manualCheck = useCallback(async () => {
    try { sessionStorage.removeItem(DISMISSED_KEY); } catch {}
    fetchFailures.current = 0;

    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          waitingWorkerRef.current = reg.waiting;
          setUpdate({ available: true, source: "sw", remoteBuild: "sw-update" });
          return true;
        }
      }
    }
    try {
      const res = await fetchVersion();
      if (res.ok) {
        const data = await res.json();
        if (data.build && data.build !== __BUILD_ID__) {
          setUpdate({ available: true, source: "version", remoteBuild: data.build });
          return true;
        }
      }
    } catch { /* ignore */ }
    return false;
  }, []);

  return {
    updateAvailable: update.available,
    updateSource: update.source,
    applyUpdate,
    dismissUpdate,
    manualCheck,
  };
}
