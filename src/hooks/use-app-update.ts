/**
 * useAppUpdate — detects service worker updates and version.json mismatches.
 * Provides a reactive flag + actions for the update banner.
 */
import { useState, useEffect, useCallback, useRef } from "react";

declare const __BUILD_ID__: string;

const VERSION_CHECK_INTERVAL = 60 * 60 * 1000; // 60 min
const VERSION_URL = "/version.json";

interface UpdateState {
  available: boolean;
  source: "sw" | "version" | null;
}

export function useAppUpdate() {
  const [update, setUpdate] = useState<UpdateState>({ available: false, source: null });
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

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
              setUpdate({ available: true, source: "sw" });
            }
          });
        };

        // Already waiting
        if (reg.waiting) {
          waitingWorkerRef.current = reg.waiting;
          setUpdate({ available: true, source: "sw" });
        }

        // Installing
        if (reg.installing) {
          awaitStateChange(reg.installing);
        }

        // Future updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) awaitStateChange(newWorker);
        });

        // When the new SW takes over, reload
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
  }, []);

  // ── 2. version.json polling ──
  useEffect(() => {
    // Skip in dev
    if (typeof __BUILD_ID__ === "undefined") return;

    const checkVersion = async () => {
      try {
        const res = await fetch(VERSION_URL, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.build && data.build !== __BUILD_ID__) {
          setUpdate(prev => prev.available ? prev : { available: true, source: "version" });
        }
      } catch {
        // offline or version.json missing — ignore
      }
    };

    // Check on load (after 10s to not block startup)
    const initial = setTimeout(checkVersion, 10_000);
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  // ── Actions ──
  const applyUpdate = useCallback(() => {
    const worker = waitingWorkerRef.current;
    if (worker) {
      worker.postMessage({ type: "SKIP_WAITING" });
      // controllerchange listener above will reload
    } else {
      // version mismatch — just hard reload
      window.location.reload();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdate({ available: false, source: null });
  }, []);

  const manualCheck = useCallback(async () => {
    // Check SW
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          waitingWorkerRef.current = reg.waiting;
          setUpdate({ available: true, source: "sw" });
          return true;
        }
      }
    }
    // Check version.json
    try {
      const res = await fetch(VERSION_URL, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.build && data.build !== __BUILD_ID__) {
          setUpdate({ available: true, source: "version" });
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
