/**
 * TreeDepthBackground — a fixed, scroll-driven atmospheric background
 * that transitions through tree zones as the user climbs or descends.
 *
 * Layers:
 * 1. Base gradient that shifts hue/luminosity per zone
 * 2. SVG root tendrils (visible at bottom / roots zone)
 * 3. SVG branch/canopy silhouettes (visible at top / crown zone)
 * 4. Parallax particles (fireflies in trunk, spores in roots, light rays in crown)
 *
 * All layers are pointer-events-none. Respects prefers-reduced-motion.
 * User can toggle off via a small button.
 */
import { memo, useEffect, useState, useMemo } from "react";
import { useScrollDepth, type TreeZone } from "@/hooks/use-scroll-depth";

// ── Zone color definitions (HSL components) ──
const ZONE_COLORS: Record<TreeZone, { h: number; s: number; l: number }> = {
  crown: { h: 45, s: 70, l: 12 },
  canopy: { h: 140, s: 30, l: 10 },
  trunk: { h: 28, s: 35, l: 10 },
  ground: { h: 80, s: 15, l: 10 },
  roots: { h: 20, s: 20, l: 6 },
};

function lerpColor(a: typeof ZONE_COLORS.crown, b: typeof ZONE_COLORS.crown, t: number) {
  return {
    h: a.h + (b.h - a.h) * t,
    s: a.s + (b.s - a.s) * t,
    l: a.l + (b.l - a.l) * t,
  };
}

function getInterpolatedColor(progress: number) {
  const zones: TreeZone[] = ["crown", "canopy", "trunk", "ground", "roots"];
  const stops = [0, 0.2, 0.45, 0.65, 1];

  for (let i = 0; i < stops.length - 1; i++) {
    if (progress <= stops[i + 1]) {
      const t = (progress - stops[i]) / (stops[i + 1] - stops[i]);
      return lerpColor(ZONE_COLORS[zones[i]], ZONE_COLORS[zones[i + 1]], t);
    }
  }
  return ZONE_COLORS.roots;
}

// ── SVG Layers ──
const RootTendrils = ({ opacity }: { opacity: number }) => (
  <svg
    className="absolute bottom-0 left-0 w-full"
    style={{ height: "45%", opacity, transition: "opacity 0.8s ease" }}
    viewBox="0 0 1200 400"
    preserveAspectRatio="xMidYMax slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main root tendrils growing upward from bottom */}
    <path d="M200 400 Q180 320 220 260 Q200 200 240 160 Q220 120 250 80" stroke="hsl(120 25% 20%)" strokeWidth="2" fill="none" opacity="0.3" />
    <path d="M200 400 Q230 340 210 280 Q240 220 220 170" stroke="hsl(100 20% 18%)" strokeWidth="1.5" fill="none" opacity="0.2" />
    <path d="M600 400 Q580 300 620 240 Q590 180 630 120 Q610 80 640 40" stroke="hsl(90 30% 22%)" strokeWidth="2.5" fill="none" opacity="0.25" />
    <path d="M600 400 Q640 330 610 260 Q650 200 620 150" stroke="hsl(110 20% 19%)" strokeWidth="1.5" fill="none" opacity="0.18" />
    <path d="M1000 400 Q980 310 1020 250 Q990 190 1030 130" stroke="hsl(120 22% 20%)" strokeWidth="2" fill="none" opacity="0.22" />
    <path d="M1000 400 Q1030 350 1010 290 Q1040 230 1020 180" stroke="hsl(100 18% 17%)" strokeWidth="1.2" fill="none" opacity="0.15" />
    {/* Mycelium web at base */}
    <path d="M100 390 Q300 370 500 385 Q700 375 900 390 Q1050 380 1200 395" stroke="hsl(120 30% 25%)" strokeWidth="0.8" fill="none" opacity="0.12" />
    <path d="M0 395 Q200 380 400 392 Q600 382 800 395 Q1000 385 1200 398" stroke="hsl(110 25% 22%)" strokeWidth="0.6" fill="none" opacity="0.1" />
    {/* Node dots */}
    <circle cx="220" cy="260" r="3" fill="hsl(120 40% 35%)" opacity="0.2" />
    <circle cx="620" cy="240" r="4" fill="hsl(90 35% 30%)" opacity="0.15" />
    <circle cx="1020" cy="250" r="3" fill="hsl(110 30% 28%)" opacity="0.18" />
  </svg>
);

const CanopyBranches = ({ opacity }: { opacity: number }) => (
  <svg
    className="absolute top-0 left-0 w-full"
    style={{ height: "40%", opacity, transition: "opacity 0.8s ease" }}
    viewBox="0 0 1200 350"
    preserveAspectRatio="xMidYMin slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Branch silhouettes reaching down from top */}
    <path d="M150 0 Q180 60 160 120 Q190 170 170 220 Q200 260 180 300" stroke="hsl(140 25% 22%)" strokeWidth="3" fill="none" opacity="0.2" />
    <path d="M150 0 Q120 50 140 100 Q110 140 130 180" stroke="hsl(150 20% 20%)" strokeWidth="2" fill="none" opacity="0.15" />
    {/* Leaf clusters */}
    <ellipse cx="170" cy="130" rx="25" ry="15" fill="hsl(140 30% 25%)" opacity="0.06" />
    <ellipse cx="130" cy="100" rx="18" ry="10" fill="hsl(150 25% 22%)" opacity="0.05" />

    <path d="M700 0 Q720 80 690 150 Q720 210 700 280" stroke="hsl(130 28% 20%)" strokeWidth="2.5" fill="none" opacity="0.18" />
    <path d="M700 0 Q670 60 690 120 Q660 170 680 220" stroke="hsl(145 22% 19%)" strokeWidth="1.8" fill="none" opacity="0.12" />
    <ellipse cx="700" cy="160" rx="30" ry="18" fill="hsl(140 28% 23%)" opacity="0.05" />

    <path d="M1050 0 Q1070 70 1040 140 Q1060 200 1040 260" stroke="hsl(135 25% 21%)" strokeWidth="2" fill="none" opacity="0.15" />
    <ellipse cx="1040" cy="150" rx="20" ry="12" fill="hsl(145 25% 20%)" opacity="0.04" />

    {/* Light rays filtering through */}
    <line x1="400" y1="0" x2="420" y2="350" stroke="hsl(45 60% 60%)" strokeWidth="1" opacity="0.04" />
    <line x1="850" y1="0" x2="830" y2="350" stroke="hsl(50 55% 55%)" strokeWidth="0.8" opacity="0.03" />
  </svg>
);

/** Floating particles layer — fireflies / spores / light motes */
const FloatingParticles = ({ zone, reducedMotion }: { zone: TreeZone; reducedMotion: boolean }) => {
  if (reducedMotion) return null;

  const particles = useMemo(() => {
    const configs: Record<TreeZone, { count: number; color: string; size: [number, number]; yRange: [string, string] }> = {
      crown: { count: 5, color: "hsl(45 80% 65%)", size: [2, 4], yRange: ["10%", "40%"] },
      canopy: { count: 4, color: "hsl(140 35% 50%)", size: [1.5, 3], yRange: ["15%", "45%"] },
      trunk: { count: 3, color: "hsl(30 50% 55%)", size: [2, 3.5], yRange: ["35%", "65%"] },
      ground: { count: 2, color: "hsl(42 60% 50%)", size: [1.5, 2.5], yRange: ["50%", "70%"] },
      roots: { count: 4, color: "hsl(120 30% 40%)", size: [1, 2.5], yRange: ["60%", "90%"] },
    };
    const cfg = configs[zone];
    return Array.from({ length: cfg.count }, (_, i) => ({
      id: i,
      left: `${15 + (i * 70) / cfg.count + Math.random() * 10}%`,
      top: `${parseInt(cfg.yRange[0]) + Math.random() * (parseInt(cfg.yRange[1]) - parseInt(cfg.yRange[0]))}%`,
      size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
      color: cfg.color,
      delay: i * 1.2 + Math.random() * 2,
      duration: 4 + Math.random() * 4,
    }));
  }, [zone]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={`${zone}-${p.id}`}
          className="absolute rounded-full tree-depth-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  );
};

/** Toggle button for accessibility */
const ToggleButton = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="fixed bottom-20 right-3 z-50 w-7 h-7 rounded-full flex items-center justify-center text-[10px] border transition-all duration-300 md:bottom-4"
    style={{
      background: enabled ? "hsl(var(--card) / 0.6)" : "hsl(var(--card) / 0.9)",
      borderColor: "hsl(var(--border) / 0.2)",
      color: "hsl(var(--muted-foreground) / 0.5)",
      backdropFilter: "blur(8px)",
    }}
    aria-label={enabled ? "Disable background effects" : "Enable background effects"}
    title={enabled ? "Disable background effects" : "Enable background effects"}
  >
    {enabled ? "🌿" : "○"}
  </button>
);

const TreeDepthBackground = () => {
  const { progress, zone } = useScrollDepth();
  const [enabled, setEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Persist toggle preference
  useEffect(() => {
    const saved = localStorage.getItem("tree-depth-bg");
    if (saved === "off") setEnabled(false);
  }, []);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("tree-depth-bg", next ? "on" : "off");
  };

  // Compute interpolated background color
  const bgColor = getInterpolatedColor(progress);

  // Compute layer opacities based on progress
  const rootOpacity = Math.max(0, (progress - 0.5) / 0.5); // fade in past ground
  const canopyOpacity = Math.max(0, 1 - progress / 0.4);    // fade out past canopy

  if (!enabled && !reducedMotion) {
    return <ToggleButton enabled={enabled} onToggle={handleToggle} />;
  }
  if (reducedMotion && !enabled) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-[background] duration-700"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse at 50% ${30 + progress * 40}%, hsl(${bgColor.h} ${bgColor.s}% ${bgColor.l + 5}% / 0.15), transparent 60%),
            radial-gradient(ellipse at ${30 + progress * 20}% ${50 + progress * 30}%, hsl(${bgColor.h} ${Math.max(10, bgColor.s - 10)}% ${bgColor.l + 2}% / 0.08), transparent 50%),
            linear-gradient(to bottom, hsl(${bgColor.h} ${bgColor.s}% ${bgColor.l}% / 0.03), hsl(${bgColor.h} ${bgColor.s}% ${Math.max(4, bgColor.l - 3)}% / 0.12))
          `,
        }}
      >
        {/* Root tendrils — emerge when descending past ground */}
        <RootTendrils opacity={rootOpacity * 0.7} />

        {/* Canopy branches — visible when near crown */}
        <CanopyBranches opacity={canopyOpacity * 0.6} />

        {/* Floating particles — zone-specific */}
        {!reducedMotion && <FloatingParticles zone={zone} reducedMotion={reducedMotion} />}

        {/* Parallax depth vignette */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `inset 0 0 ${150 + progress * 100}px ${40 + progress * 40}px hsl(${bgColor.h} ${bgColor.s}% ${Math.max(3, bgColor.l - 4)}% / ${0.2 + progress * 0.3})`,
            transition: "box-shadow 0.8s ease",
          }}
        />
      </div>

      <ToggleButton enabled={enabled} onToggle={handleToggle} />
    </>
  );
};

export default memo(TreeDepthBackground);
