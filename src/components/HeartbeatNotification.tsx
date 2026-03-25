/**
 * HeartbeatNotification — global heart-earned notification overlay.
 * Renders a batched, pulsing notification at the top of the viewport.
 * Mount once in the app shell (outside map) for non-map pages.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useQuietMode } from "@/contexts/QuietModeContext";

const BATCH_WINDOW = 1500;
const FADE_DELAY = 1200;

const HeartbeatNotification = () => {
  const [batchTotal, setBatchTotal] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const { showCelebrations } = useQuietMode();
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const amount = e.detail?.amount;
      if (typeof amount !== "number" || amount <= 0) return;

      setBatchTotal((prev) => prev + amount);
      setVisible(true);
      setIsPulsing(true);

      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        setIsPulsing(false);
        setVisible(false);
        setTimeout(() => setBatchTotal(0), 600);
      }, FADE_DELAY);
    };

    window.addEventListener("s33d-hearts-earned", handler as EventListener);
    return () => {
      window.removeEventListener("s33d-hearts-earned", handler as EventListener);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && batchTotal > 0 && showCelebrations && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-[env(safe-area-inset-top,0px)] left-1/2 -translate-x-1/2 mt-16 z-50
                     flex items-center gap-2 px-4 py-2 rounded-full
                     bg-card/90 border border-primary/20 backdrop-blur-md shadow-xl pointer-events-none"
        >
          {/* Pulsing heart */}
          <motion.span
            animate={isPulsing ? {
              scale: [1, 1.35, 1],
              filter: [
                "drop-shadow(0 0 0px hsl(var(--primary) / 0))",
                "drop-shadow(0 0 10px hsl(var(--primary) / 0.5))",
                "drop-shadow(0 0 2px hsl(var(--primary) / 0.1))",
              ],
            } : {}}
            transition={isPulsing ? {
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              repeat: Infinity,
              repeatDelay: 0.4,
            } : {}}
            className="inline-flex"
          >
            <Heart className="w-4 h-4 text-primary fill-primary/40" />
          </motion.span>

          {/* Animated total */}
          <motion.span
            key={batchTotal}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-sm font-serif text-primary font-medium tabular-nums"
          >
            +{batchTotal}
          </motion.span>

          {/* Ripple */}
          {isPulsing && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0.4 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6 }}
              className="absolute inset-0 rounded-full border border-primary/20 pointer-events-none"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HeartbeatNotification;
