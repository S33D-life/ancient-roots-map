/**
 * MapOfflineOverlay — subtle indicator when the map is being used offline.
 * Shows cached tile availability hint and pending queue count.
 * Dismisses properly when back online. User can dismiss with X.
 */
import { WifiOff, Database, Loader2, X } from "lucide-react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const MapOfflineOverlay = () => {
  const { status, pendingCount } = useConnectivity();
  const [dismissed, setDismissed] = useState(false);

  const isOffline = status === "offline";
  const isReconnecting = status === "reconnecting";

  // Reset dismissed when back online
  useEffect(() => {
    if (status === "online") setDismissed(false);
  }, [status]);

  return (
    <AnimatePresence>
      {!dismissed && (isOffline || isReconnecting) && (
        <motion.div
          key={isReconnecting ? "reconnecting" : "offline"}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-[25] pointer-events-auto"
        >
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg text-xs font-serif ${
            isReconnecting
              ? "bg-secondary border-border text-muted-foreground"
              : "bg-card/90 border-border/50 text-muted-foreground"
          }`}>
            {isReconnecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reconnecting…</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-destructive/70" />
                <span>Offline — showing cached map &amp; trees</span>
              </>
            )}
            {pendingCount > 0 && !isReconnecting && (
              <>
                <span className="text-border">·</span>
                <Database className="w-3 h-3" />
                <span>{pendingCount} queued</span>
              </>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="ml-1 p-0.5 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Dismiss offline notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapOfflineOverlay;
