/**
 * SectionAtmosphere — unified atmospheric background stack for tree scroll sections.
 *
 * Each section gets:
 * 1. Base gradient layer
 * 2. SVG texture/pattern layer (roots, bark, branches, sky geometry)
 * 3. Vignette layer
 * 4. Optional micro-motion layer (CSS-only, low-cost)
 *
 * All layers are pointer-events-none and respect prefers-reduced-motion.
 */
import { memo, useEffect, useState } from "react";

type SectionTheme = "roots" | "ground" | "threshold" | "trunk" | "canopy" | "crown";

interface Props {
  theme: SectionTheme;
  className?: string;
}

/** SVG patterns for each zone — inline, no network requests */
const PATTERNS: Record<SectionTheme, React.ReactNode> = {
  roots: (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="mycelium-web" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          {/* Branching fungal threads */}
          <path d="M0 100 Q50 80 100 100 T200 100" stroke="hsl(120 40% 50%)" strokeWidth="0.5" fill="none" opacity="0.6" />
          <path d="M100 0 Q80 50 100 100 T100 200" stroke="hsl(90 35% 45%)" strokeWidth="0.4" fill="none" opacity="0.5" />
          <path d="M0 50 Q70 30 140 70 T200 50" stroke="hsl(100 30% 40%)" strokeWidth="0.3" fill="none" opacity="0.4" />
          <path d="M50 0 Q30 60 80 120 T50 200" stroke="hsl(110 25% 42%)" strokeWidth="0.3" fill="none" opacity="0.35" />
          {/* Node points */}
          <circle cx="100" cy="100" r="2" fill="hsl(120 45% 55%)" opacity="0.3" />
          <circle cx="50" cy="50" r="1.5" fill="hsl(90 40% 50%)" opacity="0.25" />
          <circle cx="150" cy="150" r="1.5" fill="hsl(100 35% 48%)" opacity="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mycelium-web)" />
    </svg>
  ),

  ground: (
    <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="earth-surface" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
          {/* Subtle soil texture lines */}
          <path d="M0 250 Q75 245 150 250 T300 248" stroke="hsl(30 30% 35%)" strokeWidth="0.5" fill="none" opacity="0.4" />
          <path d="M0 260 Q100 255 200 262 T300 258" stroke="hsl(25 25% 30%)" strokeWidth="0.4" fill="none" opacity="0.3" />
          {/* Base of trunk suggestion */}
          <path d="M140 0 Q145 60 148 120 Q150 180 150 300" stroke="hsl(28 35% 28%)" strokeWidth="1.5" fill="none" opacity="0.15" />
          <path d="M160 0 Q155 60 152 120 Q150 180 150 300" stroke="hsl(28 35% 28%)" strokeWidth="1.5" fill="none" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#earth-surface)" />
    </svg>
  ),

  threshold: (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="stone-moss" x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
          {/* Mossy stone edge blocks */}
          <rect x="20" y="80" width="60" height="30" rx="3" fill="hsl(28 20% 25%)" opacity="0.15" />
          <rect x="160" y="120" width="50" height="25" rx="3" fill="hsl(30 18% 22%)" opacity="0.12" />
          {/* Moss patches */}
          <ellipse cx="50" cy="78" rx="20" ry="4" fill="hsl(120 30% 30%)" opacity="0.15" />
          <ellipse cx="185" cy="118" rx="15" ry="3" fill="hsl(130 25% 28%)" opacity="0.12" />
          {/* Dust motes */}
          <circle cx="120" cy="60" r="1" fill="hsl(40 50% 60%)" opacity="0.2" />
          <circle cx="80" cy="180" r="0.8" fill="hsl(42 45% 55%)" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#stone-moss)" />
    </svg>
  ),

  trunk: (
    <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="bark-texture" x="0" y="0" width="120" height="200" patternUnits="userSpaceOnUse">
          {/* Vertical bark ridges */}
          <path d="M30 0 Q32 50 28 100 Q30 150 32 200" stroke="hsl(28 30% 25%)" strokeWidth="0.8" fill="none" opacity="0.4" />
          <path d="M60 0 Q58 40 62 80 Q60 140 58 200" stroke="hsl(25 28% 22%)" strokeWidth="0.6" fill="none" opacity="0.35" />
          <path d="M90 0 Q92 60 88 120 Q90 160 92 200" stroke="hsl(30 25% 23%)" strokeWidth="0.7" fill="none" opacity="0.3" />
          {/* Moss accent */}
          <ellipse cx="45" cy="100" rx="8" ry="3" fill="hsl(120 25% 28%)" opacity="0.12" />
          {/* Knot */}
          <circle cx="75" cy="60" r="4" fill="none" stroke="hsl(28 35% 30%)" strokeWidth="0.5" opacity="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bark-texture)" />
    </svg>
  ),

  canopy: (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="branch-leaves" x="0" y="0" width="280" height="280" patternUnits="userSpaceOnUse">
          {/* Branch silhouettes */}
          <path d="M0 140 Q70 120 140 140 Q200 130 280 150" stroke="hsl(150 25% 25%)" strokeWidth="1.2" fill="none" opacity="0.2" />
          <path d="M140 0 Q130 50 140 100 Q135 140 140 200" stroke="hsl(140 20% 22%)" strokeWidth="0.8" fill="none" opacity="0.15" />
          {/* Leaf clusters */}
          <ellipse cx="80" cy="80" rx="15" ry="10" fill="hsl(140 35% 30%)" opacity="0.08" />
          <ellipse cx="200" cy="60" rx="12" ry="8" fill="hsl(130 30% 28%)" opacity="0.07" />
          <ellipse cx="140" cy="180" rx="18" ry="11" fill="hsl(145 30% 32%)" opacity="0.06" />
          {/* Light rays */}
          <line x1="100" y1="0" x2="120" y2="280" stroke="hsl(45 60% 70%)" strokeWidth="0.3" opacity="0.08" />
          <line x1="200" y1="0" x2="180" y2="280" stroke="hsl(50 55% 65%)" strokeWidth="0.25" opacity="0.06" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#branch-leaves)" />
    </svg>
  ),

  crown: (
    <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="solarpunk-geo" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          {/* Geometric solarpunk linework */}
          <polygon points="100,20 120,60 80,60" fill="none" stroke="hsl(45 70% 60%)" strokeWidth="0.4" opacity="0.3" />
          <polygon points="100,40 110,55 90,55" fill="none" stroke="hsl(42 65% 55%)" strokeWidth="0.3" opacity="0.25" />
          {/* Sun rays */}
          <line x1="100" y1="10" x2="100" y2="0" stroke="hsl(45 80% 65%)" strokeWidth="0.5" opacity="0.2" />
          <line x1="120" y1="15" x2="130" y2="5" stroke="hsl(45 75% 60%)" strokeWidth="0.4" opacity="0.15" />
          <line x1="80" y1="15" x2="70" y2="5" stroke="hsl(45 75% 60%)" strokeWidth="0.4" opacity="0.15" />
          {/* Horizon suggestion */}
          <path d="M0 180 Q50 175 100 180 T200 178" stroke="hsl(42 50% 50%)" strokeWidth="0.3" fill="none" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#solarpunk-geo)" />
    </svg>
  ),
};

/** Gradient stacks per section theme */
const GRADIENTS: Record<SectionTheme, string> = {
  roots: `
    radial-gradient(ellipse at 50% 80%, hsl(120 25% 8% / 0.12), transparent 60%),
    radial-gradient(ellipse at 30% 50%, hsl(90 20% 10% / 0.08), transparent 50%),
    linear-gradient(to bottom, hsl(80 15% 8% / 0.6), hsl(30 15% 6% / 0.8) 50%, hsl(20 12% 5% / 0.9))
  `,
  ground: `
    radial-gradient(ellipse at 50% 80%, hsl(30 25% 18% / 0.06), transparent 50%),
    radial-gradient(ellipse at 50% 20%, hsl(42 40% 30% / 0.04), transparent 40%)
  `,
  threshold: `
    radial-gradient(ellipse at 50% 60%, hsl(28 35% 20% / 0.08), transparent 50%),
    radial-gradient(ellipse at 50% 30%, hsl(35 30% 18% / 0.05), transparent 40%),
    linear-gradient(to bottom, hsl(var(--background)), hsl(28 18% 10% / 0.12) 50%, hsl(var(--background)))
  `,
  trunk: `
    radial-gradient(ellipse at 50% 45%, hsl(28 40% 22% / 0.1), transparent 55%),
    radial-gradient(ellipse at 55% 25%, hsl(35 30% 18% / 0.06), transparent 45%),
    linear-gradient(to bottom, hsl(var(--background)), hsl(28 15% 9% / 0.2) 50%, hsl(var(--background)))
  `,
  canopy: `
    radial-gradient(ellipse at 50% 20%, hsl(150 30% 28% / 0.08), transparent 55%),
    radial-gradient(ellipse at 35% 65%, hsl(160 25% 18% / 0.06), transparent 45%),
    radial-gradient(ellipse at 70% 30%, hsl(45 50% 55% / 0.03), transparent 40%),
    linear-gradient(to bottom, hsl(var(--background)), hsl(150 15% 9% / 0.15) 50%, hsl(var(--background)))
  `,
  crown: `
    radial-gradient(ellipse at 50% 15%, hsl(45 70% 55% / 0.1), transparent 55%),
    radial-gradient(ellipse at 50% 85%, hsl(42 50% 25% / 0.05), transparent 45%),
    radial-gradient(ellipse at 50% 30%, hsl(45 80% 70% / 0.04), transparent 35%),
    linear-gradient(to bottom, hsl(var(--background)), hsl(45 12% 9% / 0.18) 50%, hsl(var(--background)))
  `,
};

/** Vignette intensity per zone */
const VIGNETTE: Record<SectionTheme, string> = {
  roots: "inset 0 0 200px 80px hsl(20 15% 4% / 0.5)",
  ground: "inset 0 0 150px 60px hsl(var(--background) / 0.3)",
  threshold: "inset 0 0 180px 70px hsl(var(--background) / 0.4)",
  trunk: "inset 0 0 150px 60px hsl(var(--background) / 0.35)",
  canopy: "inset 0 0 120px 50px hsl(var(--background) / 0.25)",
  crown: "inset 0 0 100px 40px hsl(var(--background) / 0.2)",
};

/** CSS animation class per zone (mapped to keyframes in App.css) */
const MOTION_CLASS: Record<SectionTheme, string> = {
  roots: "atmo-roots-drift",
  ground: "atmo-ground-dapple",
  threshold: "atmo-threshold-glow",
  trunk: "atmo-trunk-flicker",
  canopy: "atmo-canopy-sway",
  crown: "atmo-crown-shimmer",
};

const SectionAtmosphere = ({ theme, className = "" }: Props) => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {/* Layer 1: Base gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ background: GRADIENTS[theme] }}
      />

      {/* Layer 2: SVG texture pattern */}
      {PATTERNS[theme]}

      {/* Layer 3: Vignette */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: VIGNETTE[theme] }}
      />

      {/* Layer 4: Micro-motion overlay (CSS-only animation) */}
      {!prefersReduced && (
        <div className={`absolute inset-0 ${MOTION_CLASS[theme]}`} />
      )}
    </div>
  );
};

export default memo(SectionAtmosphere);
