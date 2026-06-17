/**
 * AnatomicalSeam — tree-ring transitions between zones of the Living Tree.
 *
 * Not section dividers. Each seam is a continuous ecological transition,
 * carrying the visitor through age, growth and memory:
 *
 *   • crown-canopy  — branches dissolve into light (motes, halo, fading limb tips)
 *   • canopy-trunk  — tree rings widen and split into branching structures
 *   • trunk-ground  — heartwood rings flare downward into root buttresses
 *   • ground-roots  — concentric rings unravel into root fibres + mycelial threads
 *
 * No hard edges. Gradient backbone + top/bottom feather dissolves the seam
 * into adjacent habitats. Pointer-events-none. Respects prefers-reduced-motion.
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
  crown:     "hsl(45 55% 14%)",
  canopyTop: "hsl(45 35% 12%)",
  canopy:    "hsl(140 22% 10%)",
  trunkTop:  "hsl(90 14% 9%)",
  trunk:     "hsl(28 28% 11%)",
  groundTop: "hsl(28 22% 9%)",
  ground:    "hsl(35 14% 8%)",
  rootsTop:  "hsl(25 14% 7%)",
  roots:     "hsl(18 18% 5%)",
  light:     "hsl(45 80% 65%)",
  lightSoft: "hsl(45 60% 50%)",
  leaf:      "hsl(140 30% 22%)",
  branch:    "hsl(32 22% 14%)",
  ring:      "hsl(30 35% 24%)",
  ringSoft:  "hsl(30 28% 18%)",
  heartwood: "hsl(22 38% 18%)",
  fibre:     "hsl(22 28% 14%)",
  mycelium:  "hsl(120 35% 50%)",
} as const;

const AnatomicalSeam = ({ variant, label, className = "" }: Props) => {
  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none ${className}`}
      // Tall seams so transitions read as drift, not breaks
      style={{ height: "clamp(200px, 30vw, 360px)" }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-[0.7]">
        {variant === "crown-canopy" && <CrownCanopy />}
        {variant === "canopy-trunk" && <CanopyTrunk />}
        {variant === "trunk-ground" && <TrunkGround />}
        {variant === "ground-roots" && <GroundRoots />}
      </div>

      {/* Top + bottom feather — dissolves the seam into adjacent habitats */}
      <div
        className="absolute inset-x-0 top-0 h-1/3"
        style={{ background: "linear-gradient(to bottom, hsl(var(--background) / 0.6), transparent)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, hsl(var(--background) / 0.6), transparent)" }}
      />

      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-serif text-[10px] md:text-[11px] tracking-[0.35em] uppercase"
            style={{ color: "hsl(var(--foreground) / 0.3)" }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   CROWN ↔ CANOPY — branches dissolve into light
   (top of page; reading top→down: light → fading branch tips)
   ───────────────────────────────────────────────────────────── */
const CrownCanopy = () => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.crown} 0%, ${COLORS.canopyTop} 60%, ${COLORS.canopy} 100%)`,
      }}
    />
    {/* High halo — sunlight bleeding down */}
    <div
      className="absolute inset-0 mix-blend-soft-light"
      style={{
        background: `radial-gradient(ellipse 70% 100% at 50% -20%, ${COLORS.light} 0%, ${COLORS.lightSoft} 30%, transparent 70%)`,
        opacity: 0.7,
      }}
    />
    {/* Branch tips dissolving upward into specks of light */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="branchDissolve" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={COLORS.branch} stopOpacity="0.85" />
          <stop offset="55%" stopColor={COLORS.branch} stopOpacity="0.35" />
          <stop offset="100%" stopColor={COLORS.light} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#branchDissolve)" strokeLinecap="round">
        <path d="M40,100 Q44,70 50,40 Q53,22 56,8" strokeWidth="2.2" />
        <path d="M40,100 Q42,72 38,52 Q34,38 30,22" strokeWidth="1.4" opacity="0.8" />
        <path d="M100,100 Q100,68 100,32 Q100,18 100,4" strokeWidth="2.8" />
        <path d="M100,60 Q90,46 80,30 Q72,20 66,10" strokeWidth="1.2" opacity="0.7" />
        <path d="M100,55 Q112,42 124,28 Q132,18 138,8" strokeWidth="1.2" opacity="0.7" />
        <path d="M160,100 Q156,70 150,40 Q146,22 142,8" strokeWidth="2.2" />
        <path d="M160,100 Q162,72 168,52 Q172,38 176,22" strokeWidth="1.4" opacity="0.8" />
      </g>
      {/* Light motes where branch tips dissolve */}
      <g fill={COLORS.light} className="branch-motes">
        <circle cx="30" cy="18" r="0.6" opacity="0.8" />
        <circle cx="56" cy="8" r="0.5" opacity="0.7" />
        <circle cx="66" cy="10" r="0.45" opacity="0.6" />
        <circle cx="100" cy="4" r="0.7" opacity="0.85" />
        <circle cx="138" cy="8" r="0.5" opacity="0.7" />
        <circle cx="142" cy="8" r="0.55" opacity="0.75" />
        <circle cx="176" cy="22" r="0.5" opacity="0.65" />
      </g>
    </svg>
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .branch-motes circle { animation: light-shimmer 5s ease-in-out infinite; }
        .branch-motes circle:nth-child(2n) { animation-delay: 1.4s; }
        .branch-motes circle:nth-child(3n) { animation-delay: 2.6s; }
        @keyframes light-shimmer {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-1px); }
        }
      }
    `}</style>
  </>
);

/* ─────────────────────────────────────────────────────────────
   CANOPY ↔ TRUNK — tree rings widen and become branching structures
   (reading top→down on page: branches above narrow into rings;
    reading climb-up: rings widen and split into branches)
   ───────────────────────────────────────────────────────────── */
const CanopyTrunk = () => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.canopy} 0%, ${COLORS.trunkTop} 55%, ${COLORS.trunk} 100%)`,
      }}
    />
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 200 120"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="ringGlow" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor={COLORS.heartwood} stopOpacity="0.55" />
          <stop offset="100%" stopColor={COLORS.heartwood} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Heartwood glow rising from bottom (trunk side) */}
      <rect width="200" height="120" fill="url(#ringGlow)" />

      {/* Tree rings — concentric arcs growing from trunk, widening upward,
          then splitting into branches that reach into the canopy */}
      <g fill="none" stroke={COLORS.ring} strokeLinecap="round">
        {/* tight rings near trunk (bottom) */}
        <ellipse cx="100" cy="118" rx="18" ry="6" strokeWidth="0.5" opacity="0.55" />
        <ellipse cx="100" cy="118" rx="32" ry="11" strokeWidth="0.5" opacity="0.5" />
        <ellipse cx="100" cy="118" rx="48" ry="17" strokeWidth="0.55" opacity="0.45" />
        <ellipse cx="100" cy="118" rx="68" ry="25" strokeWidth="0.6" opacity="0.4" />
        <ellipse cx="100" cy="118" rx="92" ry="36" strokeWidth="0.6" opacity="0.32" stroke={COLORS.ringSoft} />
        <ellipse cx="100" cy="118" rx="120" ry="50" strokeWidth="0.55" opacity="0.22" stroke={COLORS.ringSoft} />
      </g>

      {/* Rings tearing open into branches — vertical limbs rising from the widest arcs */}
      <g fill="none" stroke={COLORS.branch} strokeLinecap="round" opacity="0.7">
        {/* central trunk-into-branch */}
        <path d="M100,118 Q100,80 100,46 Q100,28 100,4" strokeWidth="3" />
        {/* primary limbs splitting outward */}
        <path d="M100,72 Q86,56 70,38 Q58,22 50,6" strokeWidth="1.8" />
        <path d="M100,72 Q114,56 130,38 Q142,22 150,6" strokeWidth="1.8" />
        {/* secondary limbs from outer rings */}
        <path d="M68,92 Q56,72 44,52 Q34,34 28,16" strokeWidth="1.2" opacity="0.8" />
        <path d="M132,92 Q144,72 156,52 Q166,34 172,16" strokeWidth="1.2" opacity="0.8" />
        {/* fine twigs */}
        <path d="M50,6 Q44,2 38,0" strokeWidth="0.6" opacity="0.6" />
        <path d="M70,38 Q64,30 60,22" strokeWidth="0.6" opacity="0.6" />
        <path d="M130,38 Q136,30 140,22" strokeWidth="0.6" opacity="0.6" />
        <path d="M150,6 Q156,2 162,0" strokeWidth="0.6" opacity="0.6" />
      </g>
    </svg>
  </>
);

/* ─────────────────────────────────────────────────────────────
   TRUNK ↔ GROUND — heartwood rings flare into root buttresses
   (reading climb-up: roots/buttresses expand into heartwood rings)
   ───────────────────────────────────────────────────────────── */
const TrunkGround = () => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.trunk} 0%, ${COLORS.groundTop} 60%, ${COLORS.ground} 100%)`,
      }}
    />
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 200 120"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="heartGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={COLORS.heartwood} stopOpacity="0.6" />
          <stop offset="100%" stopColor={COLORS.heartwood} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="48" rx="120" ry="50" fill="url(#heartGlow)" />

      {/* Heartwood rings — concentric, centered in upper half */}
      <g fill="none" stroke={COLORS.ring} strokeLinecap="round">
        <ellipse cx="100" cy="44" rx="10" ry="5" strokeWidth="0.5" opacity="0.7" />
        <ellipse cx="100" cy="44" rx="20" ry="9" strokeWidth="0.5" opacity="0.6" />
        <ellipse cx="100" cy="44" rx="34" ry="15" strokeWidth="0.55" opacity="0.5" />
        <ellipse cx="100" cy="44" rx="52" ry="22" strokeWidth="0.55" opacity="0.42" stroke={COLORS.ringSoft} />
        <ellipse cx="100" cy="44" rx="74" ry="30" strokeWidth="0.5" opacity="0.32" stroke={COLORS.ringSoft} />
        <ellipse cx="100" cy="44" rx="100" ry="40" strokeWidth="0.5" opacity="0.22" stroke={COLORS.ringSoft} />
      </g>

      {/* Rings flaring downward into buttress fibres — root structures expanding from heartwood */}
      <g fill="none" stroke={COLORS.fibre} strokeLinecap="round" opacity="0.8">
        <path d="M100,44 Q100,80 100,120" strokeWidth="2.6" />
        <path d="M86,50 Q72,80 56,120" strokeWidth="1.6" />
        <path d="M114,50 Q128,80 144,120" strokeWidth="1.6" />
        <path d="M70,58 Q52,84 30,120" strokeWidth="1.2" opacity="0.75" />
        <path d="M130,58 Q148,84 170,120" strokeWidth="1.2" opacity="0.75" />
        <path d="M52,68 Q38,90 18,120" strokeWidth="0.8" opacity="0.6" />
        <path d="M148,68 Q162,90 182,120" strokeWidth="0.8" opacity="0.6" />
        {/* tiny fibre branches */}
        <path d="M56,120 Q50,110 44,104" strokeWidth="0.5" opacity="0.55" />
        <path d="M144,120 Q150,110 156,104" strokeWidth="0.5" opacity="0.55" />
        <path d="M30,120 Q24,112 16,108" strokeWidth="0.5" opacity="0.5" />
        <path d="M170,120 Q176,112 184,108" strokeWidth="0.5" opacity="0.5" />
      </g>
    </svg>
  </>
);

/* ─────────────────────────────────────────────────────────────
   GROUND ↔ ROOTS — rings unravel into root fibres + mycelium
   ───────────────────────────────────────────────────────────── */
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
        backgroundImage: `radial-gradient(${COLORS.fibre} 0.6px, transparent 0)`,
        backgroundSize: "9px 9px",
      }}
    />
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 200 120"
      preserveAspectRatio="none"
    >
      {/* Faint last rings near the top — heartwood fading into earth */}
      <g fill="none" stroke={COLORS.ringSoft} strokeLinecap="round">
        <ellipse cx="100" cy="10" rx="40" ry="10" strokeWidth="0.4" opacity="0.35" />
        <ellipse cx="100" cy="10" rx="70" ry="16" strokeWidth="0.4" opacity="0.25" />
        <ellipse cx="100" cy="10" rx="110" ry="24" strokeWidth="0.4" opacity="0.18" />
      </g>

      {/* Root fibres descending and branching */}
      <g fill="none" stroke={COLORS.fibre} strokeLinecap="round" opacity="0.8">
        <path d="M100,0 Q100,40 96,80 Q92,100 88,120" strokeWidth="1.6" />
        <path d="M80,4 Q72,40 60,72 Q50,98 42,120" strokeWidth="1.2" />
        <path d="M120,4 Q128,40 140,72 Q150,98 158,120" strokeWidth="1.2" />
        <path d="M60,8 Q50,44 36,76 Q24,102 14,120" strokeWidth="0.9" opacity="0.7" />
        <path d="M140,8 Q150,44 164,76 Q176,102 186,120" strokeWidth="0.9" opacity="0.7" />
        <path d="M30,16 Q22,52 12,88 Q6,108 2,120" strokeWidth="0.6" opacity="0.55" />
        <path d="M170,16 Q178,52 188,88 Q194,108 198,120" strokeWidth="0.6" opacity="0.55" />
      </g>

      {/* Mycelial filaments + pulsing nodes */}
      <g stroke={COLORS.mycelium} strokeWidth="0.3" fill="none" opacity="0.35">
        <path d="M0,60 Q30,66 50,62 T100,66 T150,62 T200,68" />
        <path d="M0,86 Q35,92 55,88 T110,92 T160,88 T200,90" opacity="0.7" />
      </g>
      <g fill={COLORS.mycelium} className="mycelium-pulse">
        <circle cx="38" cy="50" r="0.7" opacity="0.7" />
        <circle cx="64" cy="74" r="0.55" opacity="0.55" />
        <circle cx="18" cy="96" r="0.6" opacity="0.6" />
        <circle cx="136" cy="60" r="0.5" opacity="0.6" />
        <circle cx="174" cy="86" r="0.5" opacity="0.55" />
      </g>
    </svg>
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .mycelium-pulse circle { animation: mycelium-pulse 6s ease-in-out infinite; }
        .mycelium-pulse circle:nth-child(2) { animation-delay: 1.2s; }
        .mycelium-pulse circle:nth-child(3) { animation-delay: 2.4s; }
        .mycelium-pulse circle:nth-child(4) { animation-delay: 3.6s; }
        .mycelium-pulse circle:nth-child(5) { animation-delay: 4.8s; }
        @keyframes mycelium-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.85; }
        }
      }
    `}</style>
  </>
);

export default memo(AnatomicalSeam);
