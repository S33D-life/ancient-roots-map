/**
 * TreeSpine — a single, continuous tree drawn vertically through the entire page.
 *
 * Not decoration, not a divider — an orienting organism. The visitor should feel,
 * without reading any label, where they are inside the tree:
 *   top    → crown + sunlight
 *   upper  → branching limbs
 *   middle → thick trunk (rooms appear carved into it)
 *   lower  → buttress flare
 *   bottom → roots fanning into soil
 *
 * Render rules:
 *   • absolutely positioned, stretches the full height of its parent
 *   • preserveAspectRatio="none" so the SVG flows with page length
 *   • very low opacity — it must never dominate the content
 *   • pointer-events-none, aria-hidden
 *   • respects prefers-reduced-motion (no shimmer)
 */
import { memo } from "react";

interface Props {
  /** Override the default subtle opacity (0.14). */
  opacity?: number;
  className?: string;
}

const C = {
  bark:      "hsl(28 30% 16%)",
  barkSoft:  "hsl(28 22% 12%)",
  grain:     "hsl(28 35% 22%)",
  branch:    "hsl(32 24% 18%)",
  twig:      "hsl(35 28% 24%)",
  root:      "hsl(22 26% 14%)",
  fibre:     "hsl(22 22% 11%)",
  heartwood: "hsl(22 40% 22%)",
  light:     "hsl(45 80% 65%)",
  leaf:      "hsl(140 30% 28%)",
} as const;

const TreeSpine = ({ opacity = 0.14, className = "" }: Props) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <svg
        className="absolute left-1/2 top-0 h-full -translate-x-1/2 tree-spine-svg"
        // Narrow column centered on the page, stretching full page height
        style={{
          width: "min(38vw, 520px)",
          // Subtle living breath: tiny vertical drift + lateral sway driven by global scroll depth.
          // Variables --tree-depth (0..1) and --tree-crown/--tree-roots are published by useTreeDepthChannel.
          transform:
            "translateX(calc(-50% + (var(--tree-depth, 0) - 0.5) * 6px)) translateY(calc((var(--tree-depth, 0) - 0.5) * -14px))",
          transition: "transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          willChange: "transform",
        }}
        viewBox="0 0 200 2000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle vertical gradient — sunlight up top, loam at the base */}
          <linearGradient id="spineHue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.light} stopOpacity="0.35" />
            <stop offset="8%" stopColor={C.leaf} stopOpacity="0.5" />
            <stop offset="20%" stopColor={C.branch} stopOpacity="0.85" />
            <stop offset="45%" stopColor={C.bark} stopOpacity="1" />
            <stop offset="70%" stopColor={C.bark} stopOpacity="1" />
            <stop offset="82%" stopColor={C.heartwood} stopOpacity="0.95" />
            <stop offset="100%" stopColor={C.root} stopOpacity="0.9" />
          </linearGradient>

          {/* Heartwood ring tint for the trunk core */}
          <linearGradient id="heartCore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.heartwood} stopOpacity="0" />
            <stop offset="30%" stopColor={C.heartwood} stopOpacity="0.35" />
            <stop offset="70%" stopColor={C.heartwood} stopOpacity="0.35" />
            <stop offset="100%" stopColor={C.heartwood} stopOpacity="0" />
          </linearGradient>

          {/* Crown sun halo */}
          <radialGradient id="crownHalo" cx="50%" cy="0%" r="60%">
            <stop offset="0%" stopColor={C.light} stopOpacity="0.55" />
            <stop offset="60%" stopColor={C.light} stopOpacity="0.08" />
            <stop offset="100%" stopColor={C.light} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ───────── CROWN (0 → 180) — soft halo + dissolving twigs ───────── */}
        <ellipse cx="100" cy="20" rx="120" ry="120" fill="url(#crownHalo)" />
        <g fill="none" stroke={C.twig} strokeLinecap="round" opacity="0.55">
          <path d="M100,180 Q98,140 88,108 Q80,84 72,60" strokeWidth="0.7" />
          <path d="M100,180 Q102,140 112,108 Q120,84 128,60" strokeWidth="0.7" />
          <path d="M100,180 Q100,130 100,80 Q100,50 100,28" strokeWidth="1" />
          <path d="M100,150 Q86,124 70,98 Q58,78 50,58" strokeWidth="0.55" opacity="0.7" />
          <path d="M100,150 Q114,124 130,98 Q142,78 150,58" strokeWidth="0.55" opacity="0.7" />
          <path d="M100,170 Q80,140 60,114 Q44,90 34,68" strokeWidth="0.4" opacity="0.55" />
          <path d="M100,170 Q120,140 140,114 Q156,90 166,68" strokeWidth="0.4" opacity="0.55" />
        </g>
        {/* Tiny dissolving light motes at the crown tips */}
        <g fill={C.light}>
          <circle cx="72" cy="60" r="0.8" opacity="0.7" />
          <circle cx="128" cy="60" r="0.8" opacity="0.7" />
          <circle cx="50" cy="58" r="0.6" opacity="0.55" />
          <circle cx="150" cy="58" r="0.6" opacity="0.55" />
          <circle cx="100" cy="28" r="0.9" opacity="0.75" />
          <circle cx="34" cy="68" r="0.5" opacity="0.5" />
          <circle cx="166" cy="68" r="0.5" opacity="0.5" />
        </g>

        {/* ───────── BRANCHES (180 → 420) — main limbs splitting from trunk ───────── */}
        <g fill="none" stroke={C.branch} strokeLinecap="round">
          {/* Central limb continuing into trunk */}
          <path d="M100,180 Q100,300 100,420" strokeWidth="6" opacity="0.85" />
          {/* Primary outward limbs */}
          <path d="M100,220 Q70,250 46,290 Q30,318 22,348" strokeWidth="4" opacity="0.75" />
          <path d="M100,220 Q130,250 154,290 Q170,318 178,348" strokeWidth="4" opacity="0.75" />
          {/* Secondary limbs */}
          <path d="M100,260 Q82,294 70,332" strokeWidth="2.4" opacity="0.65" />
          <path d="M100,260 Q118,294 130,332" strokeWidth="2.4" opacity="0.65" />
          <path d="M100,300 Q90,344 86,388" strokeWidth="1.8" opacity="0.55" />
          <path d="M100,300 Q110,344 114,388" strokeWidth="1.8" opacity="0.55" />
          {/* Twigs off primaries */}
          <path d="M46,290 Q34,280 24,272" strokeWidth="0.8" opacity="0.5" />
          <path d="M154,290 Q166,280 176,272" strokeWidth="0.8" opacity="0.5" />
          <path d="M70,332 Q60,322 50,318" strokeWidth="0.6" opacity="0.45" />
          <path d="M130,332 Q140,322 150,318" strokeWidth="0.6" opacity="0.45" />
        </g>

        {/* ───────── TRUNK (420 → 1480) — thick living column with grain ───────── */}
        {/* Outer bark silhouette — gently undulating */}
        <path
          d="M88,420
             C 86,560 84,720 84,880
             C 84,1040 86,1200 88,1360
             L 88,1480
             L 112,1480
             C 114,1320 116,1160 116,1000
             C 116,840 114,680 112,540
             L 112,420 Z"
          fill="url(#spineHue)"
        />
        {/* Bark edges — darker outline on each side */}
        <g fill="none" stroke={C.barkSoft} strokeWidth="0.6" opacity="0.8">
          <path d="M88,420 C 86,560 84,720 84,880 C 84,1040 86,1200 88,1360 L 88,1480" />
          <path d="M112,420 C 114,560 116,720 116,880 C 116,1040 114,1200 112,1360 L 112,1480" />
        </g>
        {/* Heartwood core glow inside trunk */}
        <rect x="92" y="430" width="16" height="1040" fill="url(#heartCore)" />
        {/* Wood grain — long vertical filaments */}
        <g stroke={C.grain} strokeWidth="0.35" fill="none" opacity="0.45" strokeLinecap="round">
          <path d="M92,440 Q94,720 92,1000 Q90,1280 92,1470" />
          <path d="M96,440 Q98,720 96,1000 Q94,1280 96,1470" />
          <path d="M100,440 Q100,720 100,1000 Q100,1280 100,1470" strokeWidth="0.45" />
          <path d="M104,440 Q102,720 104,1000 Q106,1280 104,1470" />
          <path d="M108,440 Q106,720 108,1000 Q110,1280 108,1470" />
        </g>
        {/* A few horizontal heartwood ring-knots — felt as memory marks */}
        <g fill="none" stroke={C.heartwood} strokeWidth="0.5" opacity="0.55">
          <ellipse cx="100" cy="620" rx="8" ry="3" />
          <ellipse cx="100" cy="820" rx="9" ry="3.5" />
          <ellipse cx="100" cy="1020" rx="8" ry="3" />
          <ellipse cx="100" cy="1220" rx="9" ry="3.5" />
          <ellipse cx="100" cy="1400" rx="8" ry="3" />
        </g>

        {/* ───────── BUTTRESS FLARE (1480 → 1680) — trunk widens to meet earth ───────── */}
        <path
          d="M88,1480
             C 78,1540 60,1610 36,1680
             L 164,1680
             C 140,1610 122,1540 112,1480 Z"
          fill={C.bark}
          opacity="0.85"
        />
        <g fill="none" stroke={C.barkSoft} strokeWidth="0.6" opacity="0.7">
          <path d="M88,1480 C 78,1540 60,1610 36,1680" />
          <path d="M112,1480 C 122,1540 140,1610 164,1680" />
        </g>
        {/* Inner buttress folds */}
        <g fill="none" stroke={C.grain} strokeWidth="0.4" opacity="0.4" strokeLinecap="round">
          <path d="M92,1490 Q78,1560 60,1670" />
          <path d="M108,1490 Q122,1560 140,1670" />
          <path d="M100,1490 Q100,1580 100,1680" strokeWidth="0.6" opacity="0.55" />
        </g>

        {/* ───────── ROOTS (1680 → 2000) — fanning into soil ───────── */}
        <g fill="none" stroke={C.root} strokeLinecap="round" opacity="0.85">
          {/* Tap root */}
          <path d="M100,1680 Q100,1800 100,2000" strokeWidth="3.2" />
          {/* Major lateral roots */}
          <path d="M88,1700 Q60,1820 24,1980" strokeWidth="2.4" />
          <path d="M112,1700 Q140,1820 176,1980" strokeWidth="2.4" />
          <path d="M80,1720 Q44,1850 6,1990" strokeWidth="1.6" opacity="0.8" />
          <path d="M120,1720 Q156,1850 194,1990" strokeWidth="1.6" opacity="0.8" />
          {/* Inner secondary roots */}
          <path d="M94,1700 Q80,1840 70,2000" strokeWidth="1.2" opacity="0.75" />
          <path d="M106,1700 Q120,1840 130,2000" strokeWidth="1.2" opacity="0.75" />
        </g>
        {/* Fine fibre rootlets */}
        <g fill="none" stroke={C.fibre} strokeWidth="0.4" opacity="0.6" strokeLinecap="round">
          <path d="M60,1820 Q52,1860 44,1900" />
          <path d="M140,1820 Q148,1860 156,1900" />
          <path d="M44,1900 Q36,1930 30,1970" />
          <path d="M156,1900 Q164,1930 170,1970" />
          <path d="M70,2000 Q66,1980 60,1970" />
          <path d="M130,2000 Q134,1980 140,1970" />
          <path d="M100,1900 Q92,1930 84,1970" />
          <path d="M100,1900 Q108,1930 116,1970" />
        </g>
      </svg>
    </div>
  );
};

export default memo(TreeSpine);
