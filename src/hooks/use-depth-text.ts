/**
 * useDepthText — depth-aware text behaviour for /s33d gateway.
 *
 * Combines scroll-depth with @chenglou/pretext to create
 * living, spatially responsive text that subtly shifts with the
 * user's position in the tree.
 *
 * SCOPED: only used on tree-section components within /s33d.
 */
import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { usePretextLayout } from "./use-pretext-layout";

/* ── Zone type (matches TreeDepthBackground zones) ── */
export type DepthZone = "crown" | "canopy" | "trunk" | "ground" | "roots";

/* ── Scroll depth (lightweight internal hook) ── */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const last = useRef(-1);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (Math.abs(p - last.current) > 0.005) {
        last.current = p;
        setProgress(p);
      }
      raf.current = 0;
    };
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return progress;
}

function progressToZone(p: number): DepthZone {
  if (p <= 0.15) return "crown";
  if (p <= 0.35) return "canopy";
  if (p <= 0.55) return "trunk";
  if (p <= 0.7) return "ground";
  return "roots";
}

/* ── Depth-responsive style parameters ── */
interface DepthTextStyle {
  /** Letter spacing adjustment in em */
  letterSpacing: string;
  /** Line height multiplier */
  lineHeight: number;
  /** Max width scale factor (1 = natural, <1 = tighter) */
  widthScale: number;
  /** Current zone */
  zone: DepthZone;
  /** Raw scroll progress 0→1 */
  progress: number;
}

export function useDepthStyle(): DepthTextStyle {
  const progress = useScrollProgress();
  const zone = progressToZone(progress);

  return useMemo(() => {
    // Crown: spacious, airy
    // Trunk/ground: balanced, clear
    // Roots: compact, grounded
    const letterSpacing =
      progress < 0.2 ? "0.04em" :
      progress < 0.5 ? "0.02em" :
      progress < 0.7 ? "0.01em" :
      "0em";

    const lineHeight =
      progress < 0.2 ? 1.9 :
      progress < 0.5 ? 1.7 :
      progress < 0.7 ? 1.65 :
      1.55;

    const widthScale =
      progress < 0.2 ? 0.88 :
      progress < 0.5 ? 0.95 :
      1;

    return { letterSpacing, lineHeight, widthScale, zone, progress };
  }, [progress, zone]);
}

/* ── Viewport reveal hook ── */
interface RevealOptions {
  /** Threshold for IntersectionObserver (0-1) */
  threshold?: number;
  /** Root margin */
  margin?: string;
}

interface RevealResult {
  ref: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  /** 0→1 interpolation once visible */
  revealProgress: number;
}

export function useViewportReveal({ threshold = 0.15, margin = "-40px" }: RevealOptions = {}): RevealResult {
  const ref = useRef<HTMLDivElement>(null!);
  const [isVisible, setIsVisible] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const animRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            // Animate reveal 0→1 over 800ms
            const start = performance.now();
            const dur = 800;
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / dur);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - t, 3);
              setRevealProgress(eased);
              if (t < 1) animRef.current = requestAnimationFrame(tick);
            };
            animRef.current = requestAnimationFrame(tick);
          }
        }
      },
      { threshold, rootMargin: margin },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [threshold, margin, isVisible]);

  return { ref, isVisible, revealProgress };
}

/* ── Balanced Pretext layout with depth awareness ── */
interface DepthBalancedTextOptions {
  text: string;
  font: string;
  lineHeight: number;
  zone?: DepthZone;
}

export function useDepthBalancedText({ text, font, lineHeight, zone }: DepthBalancedTextOptions) {
  const layout = usePretextLayout({ text, font, lineHeight });

  return useMemo(() => {
    if (!layout.ready || !layout.balancedWidth) return layout;
    // Adjust balanced width based on zone
    let scale = 1;
    if (zone === "crown" || zone === "canopy") scale = 0.92; // tighter for elegance
    if (zone === "roots") scale = 1.02; // slightly wider for density
    return {
      ...layout,
      balancedWidth: Math.ceil(layout.balancedWidth * scale),
    };
  }, [layout, zone]);
}

/* ── Wonder line styles ── */
export function getWonderLineStyle(zone: DepthZone): React.CSSProperties {
  const base: React.CSSProperties = {
    fontStyle: "italic",
    transition: "all 0.6s ease",
  };
  switch (zone) {
    case "crown":
      return { ...base, color: "hsl(45 70% 62% / 0.9)", letterSpacing: "0.05em" };
    case "canopy":
      return { ...base, color: "hsl(150 35% 55% / 0.9)", letterSpacing: "0.03em" };
    case "trunk":
      return { ...base, color: "hsl(30 50% 55% / 0.9)", letterSpacing: "0.02em" };
    case "ground":
      return { ...base, color: "hsl(var(--foreground) / 0.8)", letterSpacing: "0.01em" };
    case "roots":
      return { ...base, color: "hsl(150 20% 40% / 0.85)", letterSpacing: "0em" };
  }
}
