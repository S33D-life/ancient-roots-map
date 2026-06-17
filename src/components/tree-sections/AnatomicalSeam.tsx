/**
 * AnatomicalSeam — physical hand-off between two zones of the Living Tree.
 *
 * Each seam is a continuous slice of the same organism, not a divider:
 *   • crown-to-canopy  — sunlight bleeding into leafy silhouettes
 *   • canopy-to-trunk  — branches tapering into bark
 *   • trunk-to-ground  — heartwood flaring into buttress roots and soil
 *   • ground-to-roots  — soil dissolving into mycelial filaments
 *
 * Visual language adapted from the user-selected "Anatomical botanical seams" direction,
 * tuned to the existing warm-earth + forest-green palette of the page (not bright tailwind tones).
 * Respects prefers-reduced-motion. Pointer-events-none. No layout impact beyond its own height.
 */
import { memo } from "react";

type SeamVariant =
  | "crown-canopy"
  | "canopy-trunk"
  | "trunk-ground"
  | "ground-roots";

interface Props {
  variant: SeamVariant;
  /** Optional whispered descent label — set to null/"" to hide */
  label?: string | null;
  className?: string;
}

// Palette anchors — matched to TreeDepthBackground zone colors
const COLORS = {
  crown:  "hsl(45 55% 14%)",   // warm gold-earth
  canopyTop: "hsl(45 35% 12%)",
  canopy: "hsl(140 22% 10%)",  // forest green
  trunkTop: "hsl(90 14% 9%)",
  trunk:  "hsl(28 28% 11%)",   // warm amber wood
  groundTop: "hsl(28 22% 9%)",
  ground: "hsl(35 14% 8%)",    // neutral earth
  rootsTop: "hsl(25 14% 7%)",
  roots:  "hsl(18 18% 5%)",    // deep loam
  light:  "hsl(45 75% 60%)",   // sunlight accent
  leaf:   "hsl(140 28% 22%)",  // leaf silhouette
  bark:   "hsl(28 22% 8%)",    // bark silhouette
  buttress: "hsl(20 18% 5%)",
  mycelium: "hsl(120 35% 50%)",
} as const;

const AnatomicalSeam = ({ variant, label, className = "" }: Props) => {
  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none ${className}`}
      style={{ height: "clamp(96px, 14vw, 160px)" }}
      aria-hidden="true"
    >
      {variant === "crown-canopy" && <CrownCanopy />}
      {variant === "canopy-trunk" && <CanopyTrunk />}
      {variant === "trunk-ground" && <TrunkGround />}
      {variant === "ground-roots" && <GroundRoots />}

      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-serif text-[10px] md:text-[11px] tracking-[0.35em] uppercase"
            style={{ color: "hsl(var(--foreground) / 0.35)" }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

/** Sunlight bleeding into leafy canopy */
const CrownCanopy = () => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.crown} 0%, ${COLORS.canopyTop} 55%, ${COLORS.canopy} 100%)`,
      }}
    />
    {/* Soft sun-glow at top */}
    <div
      className="absolute inset-0 opacity-60 mix-blend-soft-light"
      style={{
        background: `radial-gradient(ellipse 60% 90% at 50% -10%, ${COLORS.light}, transparent 65%)`,
      }}
    />
    {/* Dappled leaf silhouettes — two layered organic edges */}
    <svg
      className="absolute bottom-0 left-0 w-full h-[78%]"
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
    >
      <path
        d="M-2,60 C8,48 14,55 22,42 C30,32 40,50 50,38 C60,28 70,46 80,34 C90,24 100,42 102,60 Z"
        fill={COLORS.leaf}
        opacity="0.55"
      />
      <path
        d="M-4,60 C6,40 16,52 26,32 C36,20 46,42 56,26 C66,12 76,34 88,20 C96,12 102,30 104,60 Z"
        fill={COLORS.leaf}
        opacity="0.35"
      />
    </svg>
  </>
);

/** Branches tapering into bark */
const CanopyTrunk = () => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.canopy} 0%, ${COLORS.trunkTop} 55%, ${COLORS.trunk} 100%)`,
      }}
    />
    {/* Branch limbs tapering downward and meeting bark */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
    >
      <g fill="none" stroke={COLORS.bark} strokeLinecap="round" opacity="0.5">
        <path d="M30,0 Q50,40 60,100" strokeWidth="6" />
        <path d="M170,0 Q150,40 140,100" strokeWidth="6" />
        <path d="M100,0 L100,100" strokeWidth="8" />
        <path d="M10,0 Q35,30 50,80" strokeWidth="3" opacity="0.7" />
        <path d="M190,0 Q165,30 150,80" strokeWidth="3" opacity="0.7" />
        <path d="M70,0 Q80,40 85,100" strokeWidth="2" opacity="0.5" />
        <path d="M130,0 Q120,40 115,100" strokeWidth="2" opacity="0.5" />
      </g>
    </svg>
    {/* Soft fade to bark at bottom */}
    <div
      className="absolute inset-x-0 bottom-0 h-1/2"
      style={{
        background: `linear-gradient(to top, ${COLORS.trunk}, transparent)`,
      }}
    />
  </>
);

/** Heartwood flaring into buttress roots and soil */
const TrunkGround = () => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.trunk} 0%, ${COLORS.groundTop} 55%, ${COLORS.ground} 100%)`,
      }}
    />
    {/* Buttress flare silhouette */}
    <svg
      className="absolute bottom-0 left-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        d="M0,100 C18,100 28,28 34,0 L66,0 C72,28 82,100 100,100 Z"
        fill={COLORS.buttress}
        opacity="0.75"
      />
      <path
        d="M28,100 C34,55 40,30 40,0 L60,0 C60,30 66,55 72,100 Z"
        fill={COLORS.bark}
        opacity="0.6"
      />
      {/* Faint heartwood rings showing through */}
      <ellipse cx="50" cy="0" rx="22" ry="10" fill="none" stroke={COLORS.trunk} strokeWidth="0.4" opacity="0.5" />
      <ellipse cx="50" cy="0" rx="14" ry="6" fill="none" stroke={COLORS.trunk} strokeWidth="0.3" opacity="0.4" />
    </svg>
    {/* Soil shadow line */}
    <div
      className="absolute inset-x-0 bottom-0 h-3"
      style={{
        background: `linear-gradient(to top, ${COLORS.roots}, transparent)`,
        opacity: 0.7,
      }}
    />
  </>
);

/** Soil dissolving into mycelial filaments */
const GroundRoots = () => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.ground} 0%, ${COLORS.rootsTop} 55%, ${COLORS.roots} 100%)`,
      }}
    />
    {/* Fine soil grain */}
    <div
      className="absolute inset-0 opacity-25"
      style={{
        backgroundImage: `radial-gradient(${COLORS.bark} 0.6px, transparent 0)`,
        backgroundSize: "9px 9px",
      }}
    />
    {/* Mycelial filaments + pulsing nodes */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <g stroke={COLORS.mycelium} strokeWidth="0.35" fill="none" opacity="0.35">
        <path d="M20,0 Q22,30 12,60 T6,100" />
        <path d="M40,0 Q44,30 38,55 T46,100" />
        <path d="M60,0 Q56,28 64,55 T58,100" />
        <path d="M82,0 Q78,30 88,60 T84,100" />
        <path d="M0,40 Q30,46 50,42 T100,46" opacity="0.5" />
        <path d="M0,70 Q35,76 55,72 T100,76" opacity="0.4" />
      </g>
      <g fill={COLORS.mycelium} className="mycelium-pulse">
        <circle cx="38" cy="30" r="0.7" opacity="0.7" />
        <circle cx="64" cy="55" r="0.5" opacity="0.55" />
        <circle cx="18" cy="70" r="0.6" opacity="0.6" />
        <circle cx="86" cy="40" r="0.45" opacity="0.5" />
      </g>
    </svg>
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .mycelium-pulse circle { animation: mycelium-pulse 6s ease-in-out infinite; }
        .mycelium-pulse circle:nth-child(2) { animation-delay: 1.5s; }
        .mycelium-pulse circle:nth-child(3) { animation-delay: 3s; }
        .mycelium-pulse circle:nth-child(4) { animation-delay: 4.5s; }
        @keyframes mycelium-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.85; }
        }
      }
    `}</style>
  </>
);

export default memo(AnatomicalSeam);
