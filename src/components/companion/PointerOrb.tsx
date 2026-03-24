import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Desktop-side pointer orb overlay controlled by the mobile companion.
 * Renders a glowing orb at normalised (0-1) coordinates.
 * pointer-events: none so it never blocks UI interactions.
 *
 * Refined: smoother spring, elegant idle fade, pulse on click.
 */

interface PointerOrbProps {
  x: number;
  y: number;
  visible: boolean;
}

export default function PointerOrb({ x, y, visible }: PointerOrbProps) {
  const [idle, setIdle] = useState(false);
  const [clicking, setClicking] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  // Idle detection
  useEffect(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 3000);
    return () => clearTimeout(idleTimer.current);
  }, [x, y]);

  // Listen for click events to show pulse
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === "pointer_click" || detail?.type === "click") {
        setClicking(true);
        setTimeout(() => setClicking(false), 300);
      }
    };
    window.addEventListener("s33d-companion-cmd", handler);
    return () => window.removeEventListener("s33d-companion-cmd", handler);
  }, []);

  const px = x * 100;
  const py = y * 100;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: idle ? 0.2 : 0.9,
            scale: idle ? 0.6 : 1,
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            opacity: { duration: idle ? 1.5 : 0.15 },
            scale: { type: "spring", stiffness: 200, damping: 25 },
          }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: 0,
            left: 0,
            transform: `translate(${px}vw, ${py}vh) translate(-50%, -50%)`,
            willChange: "transform",
          }}
        >
          {/* Outer glow ring */}
          <motion.div
            animate={{
              scale: clicking ? 1.8 : 1,
              opacity: clicking ? 0.4 : idle ? 0.1 : 0.25,
            }}
            transition={{ duration: 0.3 }}
            className="absolute -inset-2 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)",
              filter: "blur(6px)",
            }}
          />

          {/* Core dot */}
          <motion.div
            animate={{
              scale: clicking ? 1.3 : 1,
              boxShadow: clicking
                ? "0 0 20px 4px hsl(var(--primary) / 0.6)"
                : idle
                  ? "0 0 6px 1px hsl(var(--primary) / 0.2)"
                  : "0 0 12px 2px hsl(var(--primary) / 0.4)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="w-3.5 h-3.5 rounded-full bg-primary"
          />

          {/* Click ripple */}
          <AnimatePresence>
            {clicking && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-primary"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
