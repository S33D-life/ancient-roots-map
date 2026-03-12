import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Desktop-side pointer orb overlay controlled by the mobile companion.
 * Receives normalised coordinates (0-1) and renders a glowing orb.
 * pointer-events: none so it never blocks UI interactions.
 */

interface PointerOrbProps {
  /** normalised x 0-1 */
  x: number;
  /** normalised y 0-1 */
  y: number;
  visible: boolean;
}

export default function PointerOrb({ x, y, visible }: PointerOrbProps) {
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2500);
    return () => clearTimeout(idleTimer.current);
  }, [x, y]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: idle ? 0.3 : 0.85,
            scale: idle ? 0.7 : 1,
            x: `${x * 100}vw`,
            y: `${y * 100}vh`,
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2"
        >
          {/* Outer glow */}
          <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary/20 blur-md" />
          {/* Inner dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
