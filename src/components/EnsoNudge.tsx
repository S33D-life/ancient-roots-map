/**
 * EnsoNudge — a hand-drawn ensō circle that draws itself around the S33D logo
 * to gently guide first-time users toward clicking it.
 *
 * First visit: full draw-in animation → breathing glow loop
 * Returning: subtle static glow only
 * After interaction: fades away permanently
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "s33d-enso-interacted";

/**
 * Irregular ensō path — intentionally imperfect for organic brush feel.
 * Drawn as a near-complete circle with slight wobble.
 */
const ENSO_PATH =
  "M 24 2 C 36 1.5 46 8 49 18 C 52 28 47 40 37 46 C 27 52 13 49 6 39 C -1 29 1.5 14 11 6 C 16 2.5 21 2 24 2.2";

const ENSO_LENGTH = 180; // approximate path length

interface EnsoNudgeProps {
  /** Size of the ensō ring (px). Should be larger than the logo. */
  size?: number;
  children: React.ReactNode;
  onInteract?: () => void;
}

export default function EnsoNudge({ size = 52, children, onInteract }: EnsoNudgeProps) {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showMicroCopy, setShowMicroCopy] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setIsFirstVisit(true);
      // Show micro-copy after delay
      const t = setTimeout(() => setShowMicroCopy(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleInteract = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowMicroCopy(false);
      localStorage.setItem(STORAGE_KEY, "1");
      onInteract?.();
    }
  }, [hasInteracted, onInteract]);

  const showEnso = isFirstVisit && !hasInteracted;
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onPointerDown={handleInteract}
      onMouseEnter={() => !reducedMotion && handleInteract}
    >
      {/* The ensō ring */}
      <AnimatePresence>
        {showEnso && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              width: size,
              height: size,
              left: "50%",
              top: "50%",
              marginLeft: -size / 2,
              marginTop: -size / 2,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.6 }}
          >
            <svg
              viewBox="0 0 52 52"
              fill="none"
              className="w-full h-full"
              style={{ filter: "drop-shadow(0 0 6px hsl(42 80% 55% / 0.35))" }}
            >
              <motion.path
                d={ENSO_PATH}
                stroke="hsl(42, 75%, 58%)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={ENSO_LENGTH}
                initial={reducedMotion ? { strokeDashoffset: 0 } : { strokeDashoffset: ENSO_LENGTH }}
                animate={{
                  strokeDashoffset: [ENSO_LENGTH, 0, 0, ENSO_LENGTH],
                  opacity: [0.4, 1, 0.7, 0.4],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.3, 0.7, 1],
                }}
              />
            </svg>

            {/* Glow breathing layer */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(42 80% 55% / 0.08), transparent 70%)",
              }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover / tap micro-interaction wrapper */}
      <motion.div
        whileHover={showEnso && !reducedMotion ? { scale: 1.04 } : undefined}
        whileTap={showEnso ? { scale: 0.97 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {children}
      </motion.div>

      {/* Micro-copy: "Begin here" — fades in after 3s, fades out on interact */}
      <AnimatePresence>
        {showMicroCopy && showEnso && !reducedMotion && (
          <motion.span
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-serif tracking-[0.2em] uppercase select-none pointer-events-none"
            style={{ color: "hsl(42, 70%, 60%)" }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.8 }}
          >
            Begin here
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
