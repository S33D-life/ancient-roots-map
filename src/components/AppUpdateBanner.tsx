/**
 * AppUpdateBanner — persistent banner shown when a new version is detected.
 * Non-blocking; user can dismiss or refresh immediately.
 */
import { RefreshCw, X } from "lucide-react";
import { useAppUpdate } from "@/hooks/use-app-update";
import { motion, AnimatePresence } from "framer-motion";

const AppUpdateBanner = () => {
  const { updateAvailable, applyUpdate, dismissUpdate } = useAppUpdate();

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-serif shadow-lg"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
          <span>A new version is available.</span>
          <button
            onClick={applyUpdate}
            className="px-3 py-1 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground font-medium transition-colors"
          >
            Refresh now
          </button>
          <button
            onClick={dismissUpdate}
            className="px-2 py-1 rounded-full hover:bg-primary-foreground/15 text-primary-foreground/70 transition-colors"
            aria-label="Dismiss update"
          >
            Later
          </button>
          <button
            onClick={dismissUpdate}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-primary-foreground/15 transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppUpdateBanner;
