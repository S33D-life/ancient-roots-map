/**
 * useParallaxDepth — lightweight scroll-driven vertical offset for spatial depth.
 * Returns a ref and a style object. Attach ref to the section container;
 * apply style to the inner content wrapper.
 *
 * Uses IntersectionObserver ratio (not scroll events) for performance.
 * Respects prefers-reduced-motion.
 */
import { useEffect, useRef, useState, useMemo } from "react";

interface ParallaxDepthOptions {
  /** Max vertical offset in px (default 4) */
  maxOffset?: number;
  /** Starting direction: 1 = starts pushed down, -1 = starts pushed up (default 1) */
  direction?: 1 | -1;
}

export function useParallaxDepth({ maxOffset = 4, direction = 1 }: ParallaxDepthOptions = {}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced.current) return;

    const el = sectionRef.current;
    if (!el) return;

    // Build an array of thresholds for smooth interpolation
    const thresholds: number[] = [];
    for (let i = 0; i <= 20; i++) thresholds.push(i / 20);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setRatio(entry.intersectionRatio);
      },
      { threshold: thresholds },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = useMemo(() => {
    if (prefersReduced.current) return {};
    // ratio goes 0 → 1 as section enters viewport center
    // offset goes from maxOffset*direction → 0 as ratio increases
    const offset = (1 - ratio) * maxOffset * direction;
    return {
      transform: `translateY(${offset}px)`,
      willChange: "transform" as const,
    };
  }, [ratio, maxOffset, direction]);

  return { sectionRef, style };
}
