import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WindfallCelebrationProps {
  /** Set to true to trigger the celebration */
  active: boolean;
  /** Called when animation finishes */
  onComplete?: () => void;
}

const HEART_EMOJIS = ["❤️", "💚", "🌳", "✨", "🌿", "💛", "🍃", "🌟"];

interface Particle {
  id: number;
  emoji: string;
  x: number;
  angle: number;
  distance: number;
  delay: number;
  scale: number;
  rotation: number;
}

const WindfallCelebration = ({ active, onComplete }: WindfallCelebrationProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      emoji: HEART_EMOJIS[i % HEART_EMOJIS.length],
      x: 50 + (Math.random() - 0.5) * 20,
      angle: (i / 24) * 360 + Math.random() * 15,
      distance: 60 + Math.random() * 100,
      delay: Math.random() * 0.4,
      scale: 0.6 + Math.random() * 0.6,
      rotation: Math.random() * 360,
    }));

    setParticles(newParticles);

    timeoutRef.current = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-50 overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Central flash */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 120,
              height: 120,
              background: "radial-gradient(circle, hsla(42, 95%, 60%, 0.6), hsla(120, 50%, 50%, 0.2), transparent)",
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Ring pulse */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 80,
              height: 80,
              border: "2px solid hsla(42, 80%, 55%, 0.6)",
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
          />

          {/* Particles */}
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const endX = Math.cos(rad) * p.distance;
            const endY = Math.sin(rad) * p.distance;

            return (
              <motion.span
                key={p.id}
                className="absolute left-1/2 top-1/2 text-base select-none"
                style={{ fontSize: `${p.scale * 1.2}rem` }}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 0,
                  rotate: 0,
                }}
                animate={{
                  x: endX,
                  y: endY - 30,
                  opacity: [1, 1, 0],
                  scale: [0, p.scale, p.scale * 0.5],
                  rotate: p.rotation,
                }}
                transition={{
                  duration: 2,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              >
                {p.emoji}
              </motion.span>
            );
          })}

          {/* Banner text */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 font-serif text-center whitespace-nowrap"
            style={{
              color: "hsl(42, 90%, 65%)",
              textShadow: "0 0 20px hsla(42, 90%, 55%, 0.6), 0 2px 8px hsla(0, 0%, 0%, 0.5)",
            }}
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: -20, opacity: [0, 1, 1, 0], scale: [0.8, 1.1, 1, 0.9] }}
            transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
          >
            <p className="text-lg font-bold tracking-wider">🌳 Windfall Released!</p>
            <p className="text-xs mt-1 tracking-wide" style={{ color: "hsl(45, 80%, 75%)" }}>
              12 Hearts gifted to wanderers
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WindfallCelebration;
