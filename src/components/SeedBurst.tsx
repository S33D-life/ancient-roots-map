/**
 * SeedBurst — a brief celebratory animation when a seed is planted.
 * Shows a sprout growing from the center with particle sparks.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Sprout } from "lucide-react";

interface SeedBurstProps {
  visible: boolean;
  onComplete?: () => void;
}

const PARTICLES = Array.from({ length: 6 });

const SeedBurst = ({ visible, onComplete }: SeedBurstProps) => (
  <AnimatePresence onExitComplete={onComplete}>
    {visible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
      >
        {/* Central sprout */}
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1], y: [20, -10, 0] }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.2), transparent 70%)",
              boxShadow: "0 0 40px 10px hsl(var(--primary) / 0.15)",
            }}
          >
            <Sprout className="w-8 h-8 text-primary" />
          </div>

          {/* Radiating particles */}
          {PARTICLES.map((_, i) => {
            const angle = (i / PARTICLES.length) * 360;
            const rad = (angle * Math.PI) / 180;
            return (
              <motion.span
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: "hsl(var(--sacred-gold))",
                  top: "50%",
                  left: "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(rad) * 50,
                  y: Math.sin(rad) * 50,
                  opacity: 0,
                  scale: 0.3,
                }}
                transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              />
            );
          })}
        </motion.div>

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="absolute mt-28 text-sm font-serif text-primary/80"
        >
          🌱 Seed planted
        </motion.p>
      </motion.div>
    )}
  </AnimatePresence>
);

export default SeedBurst;
