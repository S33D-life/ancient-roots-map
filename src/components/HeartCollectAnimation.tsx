/**
 * HeartCollectAnimation — lightweight particle animation when hearts are collected.
 * Hearts float upward from the trigger point and fade out.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  delay: number;
}

interface HeartCollectAnimationProps {
  /** Number of hearts collected — triggers animation when changes from null */
  amount: number | null;
  className?: string;
}

export default function HeartCollectAnimation({ amount, className = "" }: HeartCollectAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!amount || amount <= 0) return;
    const count = Math.min(amount, 8);
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      delay: i * 0.08,
    }));
    setParticles(newParticles);
    const t = setTimeout(() => setParticles([]), 1500);
    return () => clearTimeout(t);
  }, [amount]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <AnimatePresence>
        {particles.map(p => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, y: 0, x: p.x, scale: 0.5 }}
            animate={{ opacity: 0, y: -60, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: p.delay, ease: "easeOut" }}
            className="absolute bottom-2 left-1/2 text-sm"
            style={{ marginLeft: p.x }}
          >
            💚
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
