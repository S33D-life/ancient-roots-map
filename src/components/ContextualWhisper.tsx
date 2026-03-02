import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { usePopupGate } from "@/contexts/UIFlowContext";

const WHISPER_STORE_KEY = "s33d-whispers-seen";

export type WhisperConfig = {
  id: string;
  message: string;
  cta?: { label: string; to: string };
  /** Delay before appearing (ms) */
  delay?: number;
  /** Position on screen */
  position?: "bottom-center" | "bottom-left" | "bottom-right" | "top-center";
};

function getSeenWhispers(): Set<string> {
  try {
    const raw = localStorage.getItem(WHISPER_STORE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markSeen(id: string) {
  const seen = getSeenWhispers();
  seen.add(id);
  localStorage.setItem(WHISPER_STORE_KEY, JSON.stringify([...seen]));
}

const positionClasses: Record<string, string> = {
  "bottom-center": "bottom-20 md:bottom-6 left-1/2 -translate-x-1/2",
  "bottom-left": "bottom-20 md:bottom-6 left-4",
  "bottom-right": "bottom-20 md:bottom-6 right-4",
  "top-center": "top-20 left-1/2 -translate-x-1/2",
};

const ContextualWhisper = ({ id, message, cta, delay = 2000, position = "bottom-center" }: WhisperConfig) => {
  const popupsAllowed = usePopupGate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getSeenWhispers().has(id)) return;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [id, delay]);

  const dismiss = () => {
    setVisible(false);
    markSeen(id);
  };

  const shouldShow = visible && popupsAllowed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`fixed z-[60] max-w-xs w-auto ${positionClasses[position]}`}
        >
          <div
            className="rounded-xl px-4 py-3 border backdrop-blur-md shadow-lg flex items-start gap-3"
            style={{
              background: "hsl(var(--popover) / 0.92)",
              borderColor: "hsl(var(--primary) / 0.25)",
            }}
          >
            <p className="text-sm font-serif text-card-foreground/90 leading-relaxed flex-1">
              {message}
              {cta && (
                <Link
                  to={cta.to}
                  onClick={dismiss}
                  className="ml-1.5 text-primary hover:underline underline-offset-2 font-medium"
                >
                  {cta.label} →
                </Link>
              )}
            </p>
            <button
              onClick={dismiss}
              className="mt-0.5 p-1 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** Resets all seen whispers (for dev/testing) */
export function resetWhispers() {
  localStorage.removeItem(WHISPER_STORE_KEY);
}

export default ContextualWhisper;
