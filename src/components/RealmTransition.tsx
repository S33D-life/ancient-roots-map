/**
 * RealmTransition — Lightweight route-level wrapper that applies
 * a directional enter animation based on the TETOL tree layer.
 *
 * Implemented with a CSS keyframe animation rather than a JS-driven one so
 * that a route which suspends (lazy section loading below the fold) can never
 * leave the page stuck at its invisible start state. If the animation never
 * runs — reduced motion, suspended subtree, animation disabled — the content
 * is still rendered at its natural, fully visible styles.
 *
 * Respects prefers-reduced-motion. Duration kept short (0.32s).
 * No layout shift — uses opacity + small translate/scale only.
 */
import { type CSSProperties, type ReactNode } from "react";

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
  const d = directionVariants[direction];

  return (
    <div
      className="realm-enter"
      style={
        {
          "--realm-enter-y": `${d.y}px`,
          "--realm-enter-scale": String(d.scale),
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
};

export default RealmTransition;
