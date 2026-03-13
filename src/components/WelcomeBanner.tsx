/**
 * WelcomeBanner — shown once to first-time visitors.
 * Clear orientation: what S33D is → what to do first.
 * Dismisses permanently after interaction.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { TreeDeciduous, X, MapPin, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISS_KEY = "s33d_welcome_dismissed";

function isDismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}

function dismiss() {
  try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* noop */ }
}

const WelcomeBanner = () => {
  const [visible, setVisible] = useState(() => !isDismissed());

  if (!visible) return null;

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="relative border-b border-border/20"
          style={{ background: "hsl(var(--card) / 0.6)" }}
        >
          <div className="container mx-auto px-4 py-4 flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "hsl(var(--primary) / 0.12)" }}
            >
              <TreeDeciduous className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-sm font-serif text-foreground/90 leading-snug">
                Welcome to <span className="text-primary font-semibold">S33D</span>
              </p>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                A living atlas of the world's most ancient trees. Explore the map, discover stories, and contribute your own.
              </p>
            </div>
            <Link
              to="/map"
              onClick={handleDismiss}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-serif bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0 mt-0.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              Explore
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
              aria-label="Dismiss welcome"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeBanner;
