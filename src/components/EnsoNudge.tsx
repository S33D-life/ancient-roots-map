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
import { useQuietMode } from "@/contexts/QuietModeContext";

const STORAGE_KEY = "s33d-enso-interacted";

/**
 * Irregular ensō path — intentionally imperfect for organic brush feel.
 * Drawn as a near-complete circle with slight wobble.
 */
const ENSO_PATH =
  "M 24 2 C 36 1.5 46 8 49 18 C 52 28 47 40 37 46 C 27 52 13 49 6 39 C -1 29 1.5 14 11 6 C 16 2.5 21 2 24 2.2";

const ENSO_LENGTH = 180;

/**
 * Brush-texture filter ID — applied to the ensō stroke for an organic,
 * ink-on-paper feel via SVG feTurbulence displacement.
 */
const BRUSH_FILTER_ID = "enso-brush-texture";

interface EnsoNudgeProps {
  /** Size of the ensō ring (px). Should be larger than the logo. */
  size?: number;
  /** Vertical offset to center the ring on a specific element (px). Negative = shift up. */
  offsetY?: number;
  children: React.ReactNode;
  onInteract?: () => void;
}

export default function EnsoNudge({ size = 52, offsetY = 0, children, onInteract }: EnsoNudgeProps) {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showMicroCopy, setShowMicroCopy] = useState(false);
  const { showOnboardingNudges } = useQuietMode();

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Show micro-copy "Begin here" only for truly first-time visitors
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

  const showEnso = isFirstVisit && !hasInteracted && showOnboardingNudges;
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
              {/* Brush texture filter — organic ink displacement */}
              <defs>
                <filter id={BRUSH_FILTER_ID} x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="turbulence" baseFrequency="0.65" numOctaves="3" seed="2" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
              <motion.path
                d={ENSO_PATH}
                stroke="hsl(42, 75%, 58%)"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
                filter={`url(#${BRUSH_FILTER_ID})`}
                strokeDasharray={ENSO_LENGTH}
                initial={reducedMotion ? { strokeDashoffset: 0 } : { strokeDashoffset: ENSO_LENGTH }}
                animate={{
                  strokeDashoffset: [ENSO_LENGTH, 0, 0, 0],
                  opacity: [0.3, 1, 1, 0.85],
                }}
                transition={{
                  duration: 3,
                  ease: "easeOut",
                  times: [0, 0.5, 0.8, 1],
                }}
              />
            </svg>

            {/* Halo glow — appears after ensō draws, pulses to invite click */}
            <motion.div
              className="absolute rounded-full"
              style={{
                inset: "-18%",
                background: "radial-gradient(circle, hsl(42 80% 55% / 0.18) 0%, hsl(42 70% 50% / 0.08) 45%, transparent 72%)",
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 2.8 }}
            />
            {/* Inner warm glow hugging the icon */}
            <motion.div
              className="absolute rounded-full"
              style={{
                inset: "15%",
                background: "radial-gradient(circle, hsl(42 90% 60% / 0.12), transparent 65%)",
                boxShadow: "0 0 20px hsl(42 80% 55% / 0.25), inset 0 0 12px hsl(42 80% 55% / 0.15)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0.5, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 3 }}
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
            className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-[8px] font-serif tracking-[0.2em] uppercase select-none pointer-events-none"
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
