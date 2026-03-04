/**
 * useAppUpdate — detects service worker updates and version.json mismatches.
 * Persists dismissed build IDs in sessionStorage so the banner only appears
 * once per session unless a *newer* version lands.
 */
import { useState, useEffect, useCallback, useRef } from "react";

declare const __BUILD_ID__: string;

const VERSION_CHECK_INTERVAL = 60 * 60 * 1000; // 60 min
const INSTALLED_KEY = "app-update-installed-build";
const VERSION_URL = "/version.json";
const DISMISSED_KEY = "app-update-dismissed";

/** Returns the build id that was dismissed this session, if any */
const getDismissedBuild = (): string | null => {
  try { return sessionStorage.getItem(DISMISSED_KEY); } catch { return null; }
};

const setDismissedBuild = (build: string) => {
  try { sessionStorage.setItem(DISMISSED_KEY, build); } catch {}
};

/** Persist the currently-running build so post-refresh we know we're up-to-date */
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

export function useAppUpdate() {
  const [update, setUpdate] = useState<UpdateState>({ available: false, source: null, remoteBuild: null });
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  // Helper: only surface update if this build wasn't already dismissed
  const surfaceIfNew = useCallback((source: "sw" | "version", remoteBuild?: string) => {
    const build = remoteBuild ?? "sw-update";
    const dismissed = getDismissedBuild();
    if (dismissed === build) return; // user already dismissed this version
    setUpdate(prev => prev.available ? prev : { available: true, source, remoteBuild: build });
  }, []);

  // ── 1. Service Worker "prompt" registration ──
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

        if (reg.installing) {
          awaitStateChange(reg.installing);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) awaitStateChange(newWorker);
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch {
        // SW not supported or blocked
      }
    };

    handleSW();
  }, [surfaceIfNew]);

  // ── 2. version.json polling ──
  useEffect(() => {
    if (typeof __BUILD_ID__ === "undefined") return;

    const checkVersion = async () => {
      try {
        const res = await fetch(VERSION_URL, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.build && data.build !== __BUILD_ID__) {
          surfaceIfNew("version", data.build);
        }
      } catch {
        // offline or version.json missing
      }
    };

    const initial = setTimeout(checkVersion, 10_000);
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [surfaceIfNew]);

  // ── Actions ──
  const applyUpdate = useCallback(() => {
    // Mark as handled so it won't flash on reload
    if (update.remoteBuild) setDismissedBuild(update.remoteBuild);

    const worker = waitingWorkerRef.current;
    if (worker) {
      worker.postMessage({ type: "SKIP_WAITING" });
      // controllerchange listener will reload
    } else {
      window.location.reload();
    }
  }, [update.remoteBuild]);

  const dismissUpdate = useCallback(() => {
    // Persist so polling doesn't re-show for this build
    if (update.remoteBuild) setDismissedBuild(update.remoteBuild);
    setUpdate({ available: false, source: null, remoteBuild: null });
  }, [update.remoteBuild]);

  const manualCheck = useCallback(async () => {
    // Clear any previous dismissal so manual check always reports
    try { sessionStorage.removeItem(DISMISSED_KEY); } catch {}

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
      const res = await fetch(VERSION_URL, { cache: "no-store" });
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
