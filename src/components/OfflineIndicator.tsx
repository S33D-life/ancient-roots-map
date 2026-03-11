/**
 * OfflineIndicator — compact badge shown in the header.
 *
 * States:
 * 1. Offline — red pill with WifiOff
 * 2. Reconnecting — amber pill with spinner
 * 3. Syncing — primary pill with spinner  
 * 4. Pending items — accent pill with upload button
 * 5. Failed items — warning pill with retry
 * 6. Online + no pending — hidden (null)
 */
import { WifiOff, Upload, Loader2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { runSync } from "@/utils/syncEngine";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type IndicatorMode = "offline" | "reconnecting" | "syncing" | "pending" | "failed" | "synced" | "hidden";

const OfflineIndicator = () => {
  const { status, pendingCount, failedCount, pendingByType, lastSyncedAt } = useConnectivity();
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  // Determine display mode
  let mode: IndicatorMode = "hidden";
  if (status === "offline") mode = "offline";
  else if (status === "reconnecting") mode = "reconnecting";
  else if (syncing) mode = "syncing";
  else if (failedCount > 0) mode = "failed";
  else if (pendingCount > 0) mode = "pending";
  else if (justSynced) mode = "synced";

  // Brief "synced" confirmation after sync completes
  useEffect(() => {
    if (justSynced) {
      const t = setTimeout(() => setJustSynced(false), 2500);
      return () => clearTimeout(t);
    }
  }, [justSynced]);

  const handleSync = useCallback(async () => {
    if (syncing || status === "offline") return;
    setSyncing(true);
    try {
      const result = await runSync();
      if (result.synced > 0) setJustSynced(true);
    } finally {
      setSyncing(false);
    }
  }, [syncing, status]);

  // Build type summary for tooltip
  const parts: string[] = [];
  if (pendingByType.tree > 0) parts.push(`${pendingByType.tree} tree${pendingByType.tree > 1 ? "s" : ""}`);
  if (pendingByType.offering > 0) parts.push(`${pendingByType.offering} offering${pendingByType.offering > 1 ? "s" : ""}`);
  if (pendingByType.checkin > 0) parts.push(`${pendingByType.checkin} check-in${pendingByType.checkin > 1 ? "s" : ""}`);
  if (pendingByType.note > 0) parts.push(`${pendingByType.note} note${pendingByType.note > 1 ? "s" : ""}`);

  // Format last synced
  const lastSyncLabel = lastSyncedAt
    ? `Last synced ${formatRelativeTime(lastSyncedAt)}`
    : undefined;

  return (
    <AnimatePresence mode="wait">
      {mode !== "hidden" && (
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.85, x: 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.85, x: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center"
        >
          {mode === "offline" && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-[10px] font-serif"
              title={pendingCount > 0 ? `${pendingCount} queued — will sync when back online` : "You're offline — browsing cached data"}
            >
              <WifiOff className="w-3 h-3" />
              <span>Offline{pendingCount > 0 ? ` · ${pendingCount} queued` : ""}</span>
            </div>
          )}

          {mode === "reconnecting" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-serif">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Reconnecting…</span>
            </div>
          )}

          {mode === "syncing" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-serif">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Syncing…</span>
            </div>
          )}

          {mode === "pending" && (
            <button
              onClick={handleSync}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent-foreground text-[10px] font-serif hover:bg-accent/30 transition-colors"
              title={[...parts, lastSyncLabel].filter(Boolean).join("\n")}
            >
              <Upload className="w-3 h-3" />
              <span>{pendingCount} pending</span>
            </button>
          )}

          {mode === "failed" && (
            <button
              onClick={handleSync}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-serif hover:bg-amber-500/25 transition-colors"
              title={`${failedCount} failed — tap to retry`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{failedCount} failed · retry</span>
            </button>
          )}

          {mode === "synced" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-serif">
              <CheckCircle2 className="w-3 h-3" />
              <span>Synced</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** Format an ISO date as relative time (e.g., "2m ago", "1h ago") */
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default OfflineIndicator;
