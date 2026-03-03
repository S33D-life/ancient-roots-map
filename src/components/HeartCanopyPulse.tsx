import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeartCanopyPulseProps {
  /** Only triggers once on mount */
  treeName: string;
}

/**
 * A one-time heart-shaped canopy glow that fades in
 * when the tree profile is first opened.
 * Subtle, atmospheric, no interaction.
 */
const HeartCanopyPulse = ({ treeName }: HeartCanopyPulseProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  // Respect reduced motion
  const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl z-0"
          aria-hidden
        >
          <div
            className="w-48 h-48 md:w-64 md:h-64 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle, hsl(42 95% 55% / 0.12), hsl(42 95% 55% / 0.04), transparent 70%)",
              animation: "canopy-heart-glow 3s ease-in-out",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HeartCanopyPulse;
