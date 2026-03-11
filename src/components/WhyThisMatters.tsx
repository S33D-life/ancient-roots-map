/**
 * WhyThisMatters — contextual explanations that appear during a user's
 * first 3 sessions on a page, then fade permanently.
 *
 * Unlike ContextualWhisper (one-time), these repeat for the first N visits
 * to help understanding settle in gradually.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { usePopupGate } from "@/contexts/UIFlowContext";

const STORAGE_PREFIX = "s33d_wtm_";
const MAX_SHOWS = 3;

interface Props {
  /** Unique ID for this explanation */
  id: string;
  /** The explanation text */
  message: string;
  /** Delay before showing (ms) */
  delay?: number;
}

function getShowCount(id: string): number {
  try {
    return parseInt(localStorage.getItem(`${STORAGE_PREFIX}${id}`) || "0", 10);
  } catch { return 0; }
}

function incrementCount(id: string) {
  try {
    const c = getShowCount(id) + 1;
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, String(c));
  } catch { /* noop */ }
}

const WhyThisMatters = ({ id, message, delay = 3000 }: Props) => {
  const popupsAllowed = usePopupGate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const count = getShowCount(id);
    if (count >= MAX_SHOWS) return;
    const timer = setTimeout(() => {
      setVisible(true);
      incrementCount(id);
    }, delay);
    return () => clearTimeout(timer);
  }, [id, delay]);

  const dismiss = () => setVisible(false);

  if (!visible || !popupsAllowed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg border px-3.5 py-2.5 flex items-start gap-2.5 max-w-sm mx-auto my-4"
          style={{
            background: "hsl(var(--card) / 0.7)",
            borderColor: "hsl(var(--sacred-gold) / 0.2)",
          }}
        >
          <Lightbulb className="w-4 h-4 text-mystical-gold shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">{message}</p>
          <button
            onClick={dismiss}
            className="p-0.5 rounded-full text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhyThisMatters;
