import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OfferingCelebrationProps {
  active: boolean;
  emoji?: string;
  message?: string;
  subtitle?: string;
  onComplete?: () => void;
}

const PARTICLES = ["✨", "🌿", "💚", "🍃", "🌳", "💛", "🌟", "❤️"];

interface Particle {
  id: number;
  emoji: string;
  angle: number;
  distance: number;
  delay: number;
  scale: number;
}

const OfferingCelebration = ({ active, emoji = "✨", message = "Offering sealed!", subtitle, onComplete }: OfferingCelebrationProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!active) { setParticles([]); return; }

    setParticles(
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        emoji: PARTICLES[i % PARTICLES.length],
        angle: (i / 16) * 360 + Math.random() * 20,
        distance: 50 + Math.random() * 80,
        delay: Math.random() * 0.3,
        scale: 0.5 + Math.random() * 0.5,
      }))
    );

    timeoutRef.current = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 2200);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Flash */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 80, height: 80,
              background: "radial-gradient(circle, hsla(42, 95%, 60%, 0.5), hsla(120, 50%, 50%, 0.15), transparent)",
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />

          {/* Particles */}
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <motion.span
                key={p.id}
                className="absolute text-base select-none"
                style={{ fontSize: `${p.scale * 1.1}rem` }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: Math.cos(rad) * p.distance,
                  y: Math.sin(rad) * p.distance - 20,
                  opacity: [1, 1, 0],
                  scale: [0, p.scale, p.scale * 0.4],
                }}
                transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
              >
                {p.emoji}
              </motion.span>
            );
          })}

          {/* Banner */}
          <motion.div
            className="absolute font-serif text-center whitespace-nowrap"
            style={{
              color: "hsl(42, 90%, 65%)",
              textShadow: "0 0 16px hsla(42, 90%, 55%, 0.5), 0 2px 6px hsla(0, 0%, 0%, 0.5)",
            }}
            initial={{ y: 16, opacity: 0, scale: 0.85 }}
            animate={{ y: -10, opacity: [0, 1, 1, 0], scale: [0.85, 1.05, 1, 0.95] }}
            transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
          >
            <p className="text-base font-bold tracking-wider">{emoji} {message}</p>
            {subtitle && (
              <p className="text-[11px] mt-0.5 tracking-wide" style={{ color: "hsl(45, 80%, 75%)" }}>
                {subtitle}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfferingCelebration;
