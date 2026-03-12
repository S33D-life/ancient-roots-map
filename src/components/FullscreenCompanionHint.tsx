import { useState, useEffect, useCallback } from "react";
import { Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompanion } from "@/contexts/CompanionContext";
import CompanionPairDialog from "@/components/companion/CompanionPairDialog";

const STORAGE_KEY = "s33d_fs_companion_hint_dismissed";
const DISPLAY_DURATION = 6000;

/**
 * FullscreenCompanionHint — transient prompt shown once when entering
 * fullscreen, encouraging users to pair their phone as a companion controller.
 */
export default function FullscreenCompanionHint() {
  const { paired } = useCompanion();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });

  // Show hint briefly when mounted (i.e. fullscreen activated)
  useEffect(() => {
    if (dismissed || paired) return;
    // Small delay so the fullscreen animation settles first
    const showTimer = setTimeout(() => setVisible(true), 600);
    const hideTimer = setTimeout(() => setVisible(false), 600 + DISPLAY_DURATION);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [dismissed, paired]);

  const dismissPermanently = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  }, []);

  if (dismissed || paired) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] hidden md:flex items-center gap-3
            rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-md shadow-xl px-5 py-3"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <Smartphone className="w-4 h-4 text-primary" />
          </div>

          <p className="text-sm font-serif text-foreground/90 whitespace-nowrap">
            Use your phone as a Companion controller.
          </p>

          <CompanionPairDialog
            className="px-3.5 py-1.5 rounded-full text-xs font-serif bg-primary/15 border border-primary/30
              text-primary hover:bg-primary/25 transition-colors min-h-[36px]"
          />

          <button
            onClick={dismissPermanently}
            className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors ml-1 whitespace-nowrap"
            aria-label="Don't show again"
          >
            Don't show again
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
