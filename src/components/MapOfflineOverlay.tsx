/**
 * MapOfflineOverlay — subtle indicator when the map is being used offline.
 * Shows cached tile availability hint and lets users know data is from cache.
 */
import { WifiOff, Database } from "lucide-react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { motion, AnimatePresence } from "framer-motion";

const MapOfflineOverlay = () => {
  const { online, pendingCount } = useConnectivity();

  if (online) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-[25] pointer-events-auto"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/50 shadow-lg text-xs font-serif text-muted-foreground">
          <WifiOff className="w-3.5 h-3.5 text-destructive/70" />
          <span>Offline — showing cached map &amp; trees</span>
          {pendingCount > 0 && (
            <>
              <span className="text-border">·</span>
              <Database className="w-3 h-3" />
              <span>{pendingCount} queued</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapOfflineOverlay;
