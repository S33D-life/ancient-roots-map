/**
 * BetaGardenBanner — a calm, dismissible banner that sets the tone
 * for early-access visitors. Shown once, stored in localStorage.
 * Reappears for new users.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sprout } from "lucide-react";
import { useIsNewUser } from "@/hooks/use-is-new-user";

const LS_KEY = "s33d-beta-banner-dismissed";

function isDismissed(): boolean {
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
}

const BetaGardenBanner = () => {
  const [visible, setVisible] = useState(() => !isDismissed());

  if (!visible) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative border-b"
          style={{
            background: "linear-gradient(135deg, hsl(var(--card) / 0.7), hsl(80 20% 12% / 0.5))",
            borderColor: "hsl(var(--primary) / 0.12)",
          }}
        >
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--primary) / 0.1)" }}
            >
              <Sprout className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-serif leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>
                You are exploring an early garden of{" "}
                <span className="text-primary font-semibold">S33D</span>.{" "}
                <span className="text-muted-foreground">The forest is still growing.</span>
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full transition-colors shrink-0"
              style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BetaGardenBanner;
