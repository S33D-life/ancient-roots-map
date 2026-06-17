/**
 * TrunkChamberDoor — compact chamber doorway used inside the Trunk section.
 * Each room reads as an alcove carved into living oak: arched threshold,
 * warm wood grain, iron hinges, a hung carved sign (icon), and a faint
 * interior light bleed unique to the chamber's character.
 *
 * Tonal hue is set per room so the trunk feels inhabited by different rooms,
 * while the oak frame stays consistent — one trunk, many chambers.
 */
import { memo } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export type ChamberDepth = "canopy-leaning" | "heartwood" | "root-leaning";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  /** Tonal hue for the interior glow (degrees). 38 amber, 128 green, 205 blue, 268 violet, 22 ember */
  tempH?: number;
  /** Where the chamber sits in the trunk — shifts wood lightness so depth feels real */
  depth?: ChamberDepth;
}

function depthOffset(depth: ChamberDepth) {
  switch (depth) {
    case "canopy-leaning": return { l1: 26, l2: 18, glow: 0.5 };  // higher = lighter oak, more light
    case "heartwood":      return { l1: 22, l2: 14, glow: 0.42 };
    case "root-leaning":   return { l1: 16, l2: 9,  glow: 0.32 }; // deeper = darker, more ember
  }
}

const TrunkChamberDoor = memo(({ icon: Icon, title, description, to, tempH = 38, depth = "heartwood" }: Props) => {
  const d = depthOffset(depth);
  const wood1 = `hsl(28 38% ${d.l1}%)`;
  const wood2 = `hsl(26 42% ${d.l2}%)`;
  const woodEdge = `hsl(24 30% ${Math.max(5, d.l2 - 6)}%)`;
  const sill = `hsl(20 25% ${Math.max(4, d.l2 - 8)}%)`;
  const threshold = `hsl(${tempH} 85% 55% / ${d.glow})`;
  const thresholdSoft = `hsl(${tempH} 70% 45% / ${d.glow * 0.5})`;
  const sign = `hsl(${tempH} 70% 70%)`;

  return (
    <Link
      to={to}
      className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
      aria-label={`Enter ${title}`}
    >
      <div
        className="relative overflow-hidden transition-transform duration-700 ease-out group-hover:-translate-y-[2px]"
        style={{
          // Doorway shape: arched top, flat sill
          borderRadius: "44% 44% 6px 6px / 28% 28% 6px 6px",
          aspectRatio: "0.7 / 1",
          background: `linear-gradient(180deg, ${wood1} 0%, ${wood2} 70%, ${woodEdge} 100%)`,
          boxShadow: `
            inset 0 0 0 1px ${woodEdge},
            inset 0 -6px 12px ${sill},
            0 1px 2px hsl(0 0% 0% / 0.4)
          `,
        }}
      >
        {/* Wood grain — faint vertical ridges */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
          viewBox="0 0 70 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g fill="none" stroke={woodEdge} strokeWidth="0.4">
            <path d="M14 4 Q16 30 13 60 Q15 90 14 100" />
            <path d="M28 2 Q30 25 27 55 Q29 85 28 100" />
            <path d="M42 3 Q44 28 41 58 Q43 88 42 100" />
            <path d="M56 5 Q58 32 55 62 Q57 92 56 100" />
          </g>
          {/* A knot */}
          <ellipse cx="22" cy="38" rx="2.4" ry="1.6" fill={woodEdge} opacity="0.6" />
        </svg>

        {/* Iron hinges — left edge */}
        <span
          className="absolute left-[6%] top-[28%] w-[6px] h-[6px] rounded-sm pointer-events-none"
          style={{ background: "hsl(24 14% 14%)", boxShadow: `0 0 2px hsl(0 0% 0% / 0.6)` }}
          aria-hidden="true"
        />
        <span
          className="absolute left-[6%] top-[64%] w-[6px] h-[6px] rounded-sm pointer-events-none"
          style={{ background: "hsl(24 14% 14%)", boxShadow: `0 0 2px hsl(0 0% 0% / 0.6)` }}
          aria-hidden="true"
        />

        {/* Hung carved sign — icon at upper third */}
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none">
          <span className="block w-[1px] h-3" style={{ background: woodEdge }} aria-hidden="true" />
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{
              background: `radial-gradient(circle at 50% 35%, hsl(${tempH} 50% 22%), hsl(${tempH} 40% 14%))`,
              boxShadow: `
                inset 0 0 0 1px hsl(${tempH} 40% 30% / 0.6),
                0 1px 2px hsl(0 0% 0% / 0.5),
                0 0 12px ${thresholdSoft}
              `,
            }}
          >
            <Icon className="w-[18px] h-[18px] transition-colors duration-500" style={{ color: sign }} />
          </span>
        </div>

        {/* Threshold light — warm spill beneath the door */}
        <div
          className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none transition-opacity duration-700 group-hover:opacity-100"
          style={{
            opacity: 0.85,
            background: `
              radial-gradient(ellipse 80% 70% at 50% 100%, ${threshold}, transparent 70%),
              radial-gradient(ellipse 60% 40% at 50% 95%, ${thresholdSoft}, transparent 75%)
            `,
            mixBlendMode: "screen",
          }}
        />

        {/* Faint interior glimpse — silhouette bar at the floor */}
        <div
          className="absolute inset-x-[14%] bottom-[10%] h-[3px] rounded-full pointer-events-none"
          style={{ background: `hsl(${tempH} 60% 55% / 0.35)`, filter: "blur(1px)" }}
          aria-hidden="true"
        />
      </div>

      {/* Carved name plate beneath the door */}
      <div className="mt-2 text-center">
        <p
          className="font-serif text-[12px] tracking-wide transition-colors duration-500"
          style={{ color: "hsl(35 25% 78%)" }}
        >
          {title}
        </p>
        <p className="text-[9px] leading-snug text-foreground/40 mt-0.5">{description}</p>
      </div>
    </Link>
  );
});

TrunkChamberDoor.displayName = "TrunkChamberDoor";
export default TrunkChamberDoor;
