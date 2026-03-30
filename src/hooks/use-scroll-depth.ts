/**
 * useScrollDepth — maps scroll position to a 0→1 normalized depth value
 * and identifies the current tree zone for background transitions.
 *
 * Uses requestAnimationFrame throttling for smooth 60fps updates.
 */
import { useEffect, useState, useCallback, useRef } from "react";

export type TreeZone = "crown" | "canopy" | "trunk" | "ground" | "roots";

interface ScrollDepth {
  /** 0 = top of page (crown), 1 = bottom (roots) */
  progress: number;
  /** Current tree zone name */
  zone: TreeZone;
  /** 0→1 progress within the current zone */
  zoneProgress: number;
}

const ZONE_BREAKPOINTS: { zone: TreeZone; start: number; end: number }[] = [
  { zone: "crown", start: 0, end: 0.15 },
  { zone: "canopy", start: 0.15, end: 0.35 },
  { zone: "trunk", start: 0.35, end: 0.55 },
  { zone: "ground", start: 0.55, end: 0.7 },
  { zone: "roots", start: 0.7, end: 1 },
];

function getZone(progress: number): { zone: TreeZone; zoneProgress: number } {
  for (const bp of ZONE_BREAKPOINTS) {
    if (progress <= bp.end) {
      const zoneProgress = Math.min(1, Math.max(0, (progress - bp.start) / (bp.end - bp.start)));
      return { zone: bp.zone, zoneProgress };
    }
  }
  return { zone: "roots", zoneProgress: 1 };
}

export function useScrollDepth(): ScrollDepth {
  const [depth, setDepth] = useState<ScrollDepth>({ progress: 0, zone: "ground", zoneProgress: 0 });
  const rafRef = useRef<number>(0);
  const lastProgress = useRef(-1);

  const update = useCallback(() => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;

    // Only update state if progress changed meaningfully (avoid re-renders)
    if (Math.abs(progress - lastProgress.current) > 0.002) {
      lastProgress.current = progress;
      const { zone, zoneProgress } = getZone(progress);
      setDepth({ progress, zone, zoneProgress });
    }
    rafRef.current = 0;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial measurement
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [update]);

  return depth;
}
