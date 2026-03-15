/**
 * OfflineSyncBanner — shows pending offline submissions
 * and triggers sync when connectivity returns.
 *
 * Uses the unified offlineSync queue (pending_actions) as single source of truth.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Upload, Loader2 } from "lucide-react";
import { pendingActionCount } from "@/utils/offlineSync";
import { runSync } from "@/utils/syncEngine";

const OfflineSyncBanner = () => {
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const refreshCount = useCallback(async () => {
    try {
      const c = await pendingActionCount();
      setCount(c);
    } catch {
      // IndexedDB not available
    }
  }, []);

  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      setOnline(true);
      triggerSync();
    };
    const handleOffline = () => setOnline(false);
    const handleQueueChange = () => refreshCount();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("s33d-queue-change", handleQueueChange);

    const interval = setInterval(refreshCount, 10_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("s33d-queue-change", handleQueueChange);
      clearInterval(interval);
    };
  }, [refreshCount]);

  const triggerSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await runSync();
      await refreshCount();
    } finally {
      setSyncing(false);
    }
  }, [syncing, refreshCount]);

  // Auto-sync when coming online
  useEffect(() => {
    if (online && count > 0) {
      triggerSync();
    }
  }, [online, count]);

  if (count === 0 && online) return null;

  return (
    <AnimatePresence>
      {(count > 0 || !online) && (
        <motion.div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[65]"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-lg text-xs font-serif"
            style={{
              background: online ? "hsl(var(--card) / 0.95)" : "hsl(var(--destructive) / 0.15)",
              borderColor: online ? "hsl(var(--border))" : "hsl(var(--destructive) / 0.3)",
              color: online ? "hsl(var(--foreground))" : "hsl(var(--destructive))",
            }}
          >
            {!online ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline{count > 0 ? ` · ${count} queued` : ""}</span>
              </>
            ) : syncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing {count} item{count !== 1 ? "s" : ""}…</span>
              </>
            ) : count > 0 ? (
              <button onClick={triggerSync} className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>{count} item{count !== 1 ? "s" : ""} ready to sync</span>
              </button>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineSyncBanner;
