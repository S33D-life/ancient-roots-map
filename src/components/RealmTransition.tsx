/**
 * RealmTransition — Lightweight route-level wrapper that applies
 * a directional enter/exit animation based on the TETOL tree layer.
 *
 * Respects prefers-reduced-motion. Durations kept short (0.28–0.4s).
 * No layout shift — uses opacity + small translate/scale only.
 */
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export type RealmDirection = "roots" | "trunk" | "canopy" | "crown" | "seed" | "tetol-out";

interface RealmTransitionProps {
  children: ReactNode;
  direction?: RealmDirection;
}

/** Small directional offsets that feel spatial without being disorienting */
const directionVariants: Record<RealmDirection, { y: number; scale: number }> = {
  roots:      { y: 18,  scale: 0.97 },   // descend into roots
  trunk:      { y: 0,   scale: 0.96 },   // centered inward zoom
  canopy:     { y: -16, scale: 0.97 },   // lift upward
  crown:      { y: -20, scale: 0.98 },   // soft upward bloom
  seed:       { y: 0,   scale: 0.95 },   // zoom into heart
  "tetol-out": { y: 0,  scale: 1.04 },   // zoom back out
};

const RealmTransition = ({ children, direction = "seed" }: RealmTransitionProps) => {
  const prefersReduced = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/map") return;
    console.info("[MapDebug] RealmTransition mount", {
      path: location.pathname,
      direction,
      prefersReduced,
    });
    return () => console.info("[MapDebug] RealmTransition unmount", { path: location.pathname, direction });
  }, [direction, location.pathname, prefersReduced]);

  if (prefersReduced) {
    if (location.pathname === "/map") {
      console.info("[MapDebug] RealmTransition branch", { branch: "prefers-reduced-motion (no motion wrapper)" });
    }
    return <>{children}</>;
  }

  const d = directionVariants[direction];

  return (
    <motion.div
      initial={{ opacity: 0, y: d.y, scale: d.scale }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.32,
        ease: [0.25, 0.1, 0.25, 1], // smooth cubic
      }}
      style={{ willChange: "opacity, transform" }}
      onAnimationStart={() => {
        if (location.pathname === "/map") {
          console.info("[MapDebug] RealmTransition animation start", { direction, initial: d });
        }
      }}
      onAnimationComplete={() => {
        if (location.pathname === "/map") {
          console.info("[MapDebug] RealmTransition animation complete", { direction });
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default RealmTransition;
