/**
 * EtherealTreePreview — placeholder visual for a Life Grove's ethereal tree.
 * Pure CSS / SVG. No AI generation yet.
 * TODO(future): replace canopy with generated tree image when available.
 */
import { TREE_ARCHETYPES, type TreeArchetype } from "@/lib/life-groves/types";

interface Props {
  archetype: TreeArchetype;
  treeName?: string | null;
  size?: "sm" | "md" | "lg";
  offeringCount?: number;
}

export default function EtherealTreePreview({
  archetype,
  treeName,
  size = "md",
  offeringCount = 0,
}: Props) {
  const meta = TREE_ARCHETYPES.find((a) => a.value === archetype) ?? TREE_ARCHETYPES[0];
  const dims = size === "sm" ? 140 : size === "lg" ? 320 : 220;

  // Position N firefly orbs around canopy — represent gathered offerings.
  const orbs = Array.from({ length: Math.min(offeringCount, 9) }).map((_, i) => {
    const angle = (i / 9) * Math.PI * 2;
    const r = dims * 0.28;
    const cx = dims / 2 + Math.cos(angle) * r;
    const cy = dims * 0.36 + Math.sin(angle) * r * 0.7;
    return { cx, cy, key: i };
  });

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: dims, height: dims }}
      aria-label={`Ethereal ${meta.label}`}
    >
      {/* halo */}
      <div
        className="absolute inset-0 rounded-full motion-safe:animate-[lifeGroveBreathe_8s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle at 50% 45%, hsl(${meta.hueA} 60% 60% / 0.32), hsl(${meta.hueB} 35% 25% / 0.06) 60%, transparent 75%)`,
          filter: "blur(8px)",
        }}
      />
      <svg viewBox={`0 0 ${dims} ${dims}`} width={dims} height={dims} className="relative">
        <defs>
          <radialGradient id={`canopy-${archetype}`} cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor={`hsl(${meta.hueA} 65% 65%)`} stopOpacity="0.95" />
            <stop offset="55%" stopColor={`hsl(${meta.hueA} 55% 40%)`} stopOpacity="0.85" />
            <stop offset="100%" stopColor={`hsl(${meta.hueA} 45% 22%)`} stopOpacity="0.6" />
          </radialGradient>
          <linearGradient id={`trunk-${archetype}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`hsl(${meta.hueB} 35% 28%)`} />
            <stop offset="100%" stopColor={`hsl(${meta.hueB} 30% 18%)`} />
          </linearGradient>
        </defs>

        {/* ground glow */}
        <ellipse
          cx={dims / 2}
          cy={dims * 0.86}
          rx={dims * 0.32}
          ry={dims * 0.04}
          fill={`hsl(${meta.hueA} 40% 30% / 0.35)`}
        />

        {/* trunk */}
        <path
          d={`M ${dims / 2 - 8} ${dims * 0.85}
              C ${dims / 2 - 10} ${dims * 0.65}, ${dims / 2 - 6} ${dims * 0.55}, ${dims / 2 - 4} ${dims * 0.42}
              L ${dims / 2 + 4} ${dims * 0.42}
              C ${dims / 2 + 6} ${dims * 0.55}, ${dims / 2 + 10} ${dims * 0.65}, ${dims / 2 + 8} ${dims * 0.85}
              Z`}
          fill={`url(#trunk-${archetype})`}
        />

        {/* canopy clusters */}
        <circle cx={dims / 2} cy={dims * 0.36} r={dims * 0.28} fill={`url(#canopy-${archetype})`} />
        <circle cx={dims * 0.34} cy={dims * 0.42} r={dims * 0.16} fill={`url(#canopy-${archetype})`} opacity="0.85" />
        <circle cx={dims * 0.66} cy={dims * 0.42} r={dims * 0.16} fill={`url(#canopy-${archetype})`} opacity="0.85" />

        {/* offering orbs */}
        {orbs.map((o) => (
          <circle
            key={o.key}
            cx={o.cx}
            cy={o.cy}
            r={3}
            fill={`hsl(38 90% 75%)`}
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur={`${3 + (o.key % 3)}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>

      {treeName && (
        <p
          className="absolute bottom-0 left-0 right-0 text-center font-serif text-xs italic"
          style={{ color: `hsl(${meta.hueB} 25% 65% / 0.85)` }}
        >
          {treeName}
        </p>
      )}

      <style>{`
        @keyframes lifeGroveBreathe {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}
