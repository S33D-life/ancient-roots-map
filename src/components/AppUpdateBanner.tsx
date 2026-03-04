/**
 * AppUpdateBanner — minimal, non-intrusive update notification.
 * Sits at the very top of the viewport as a slim strip.
 */
import { RefreshCw, X } from "lucide-react";
import { useAppUpdate } from "@/hooks/use-app-update";
import { motion, AnimatePresence } from "framer-motion";
import { Z } from "@/lib/z-index";

const AppUpdateBanner = () => {
  const { updateAvailable, applyUpdate, dismissUpdate } = useAppUpdate();

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ y: -28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -28, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="fixed top-0 left-0 right-0 flex items-center justify-center gap-2 px-3 py-1 text-[11px] font-medium tracking-wide"
          style={{
            zIndex: Z.UPDATE_BANNER,
            background: "hsl(var(--muted))",
            color: "hsl(var(--muted-foreground))",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <RefreshCw className="w-3 h-3 opacity-60" />
          <span className="opacity-80">New version available</span>
          <button
            onClick={applyUpdate}
            className="px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            Update
          </button>
          <button
            onClick={dismissUpdate}
            className="p-0.5 rounded-full opacity-50 hover:opacity-80 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppUpdateBanner;
