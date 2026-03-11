/**
 * OfflineIndicator — compact badge shown in the header when offline
 * or when there are pending sync items.
 */
import { WifiOff, CloudOff, Upload, Loader2 } from "lucide-react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { runSync } from "@/utils/syncEngine";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const OfflineIndicator = () => {
  const { online, pendingCount, pendingByType } = useConnectivity();
  const [syncing, setSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    if (syncing || !online) return;
    setSyncing(true);
    try {
      await runSync();
    } finally {
      setSyncing(false);
    }
  }, [syncing, online]);

  // Nothing to show
  if (online && pendingCount === 0) return null;

  // Build type summary
  const parts: string[] = [];
  if (pendingByType.tree > 0) parts.push(`${pendingByType.tree} tree${pendingByType.tree > 1 ? "s" : ""}`);
  if (pendingByType.offering > 0) parts.push(`${pendingByType.offering} offering${pendingByType.offering > 1 ? "s" : ""}`);
  if (pendingByType.checkin > 0) parts.push(`${pendingByType.checkin} check-in${pendingByType.checkin > 1 ? "s" : ""}`);
  if (pendingByType.note > 0) parts.push(`${pendingByType.note} note${pendingByType.note > 1 ? "s" : ""}`);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex items-center"
      >
        {!online ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-[10px] font-serif">
            <WifiOff className="w-3 h-3" />
            <span>Offline{pendingCount > 0 ? ` · ${pendingCount}` : ""}</span>
          </div>
        ) : syncing ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-serif">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Syncing…</span>
          </div>
        ) : pendingCount > 0 ? (
          <button
            onClick={handleSync}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent-foreground text-[10px] font-serif hover:bg-accent/30 transition-colors"
            title={parts.join(", ")}
          >
            <Upload className="w-3 h-3" />
            <span>{pendingCount} pending</span>
          </button>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineIndicator;
