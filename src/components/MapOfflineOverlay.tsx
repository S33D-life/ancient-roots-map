/**
 * MapOfflineOverlay — subtle indicator when the map is being used offline.
 * Shows cached tile availability hint and pending queue count.
 * Dismisses properly when back online.
 */
import { WifiOff, Database, Loader2 } from "lucide-react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { motion, AnimatePresence } from "framer-motion";

const MapOfflineOverlay = () => {
  const { status, pendingCount } = useConnectivity();

  const isOffline = status === "offline";
  const isReconnecting = status === "reconnecting";

  return (
    <AnimatePresence>
      {(isOffline || isReconnecting) && (
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
              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapOfflineOverlay;
