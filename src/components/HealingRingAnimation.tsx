import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HealingRingAnimationProps {
  /** Number of wishes accumulated under this anchor node */
  wishCount: number;
  /** Threshold to trigger the healing ring (default 12) */
  threshold?: number;
}

/**
 * When wish count reaches the threshold (12), a golden
 * "Healing Ring" animation expands once — a soft ring
 * radiating outward.
 */
const HealingRingAnimation = ({ wishCount, threshold = 12 }: HealingRingAnimationProps) => {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (wishCount >= threshold && !triggered) {
      setTriggered(true);
    }
  }, [wishCount, threshold, triggered]);

  const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced || !triggered) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative flex items-center justify-center py-6"
      >
        {/* Expanding ring */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute w-24 h-24 rounded-full border-2"
          style={{ borderColor: "hsl(42 95% 55% / 0.5)" }}
        />
        {/* Inner glow */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
          className="absolute w-16 h-16 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(42 95% 55% / 0.2), transparent 70%)" }}
        />
        {/* Center text */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center z-10"
        >
          <p className="text-primary font-serif text-sm tracking-widest">✦ Healing Ring ✦</p>
          <p className="text-muted-foreground text-[10px] font-serif mt-1">
            12 wishes gathered — a ring of healing expands
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HealingRingAnimation;
