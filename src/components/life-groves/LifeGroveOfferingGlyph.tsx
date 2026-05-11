/**
 * LifeGroveOfferingGlyph — bespoke SVG glyphs for offering types.
 *
 * Goal: replace emoji with small illuminated tokens that feel native to
 * Heartwood (leaf / scroll / lantern / acorn). Pure inline SVG so they
 * scale crisply at 24–48px and theme cleanly.
 *
 * Palette is intentionally narrow: warm gold + heartwood green + parchment.
 * Strokes use semi-transparent ink so glyphs sit softly on the canopy.
 */
import { OFFERING_TYPES, type OfferingType } from "@/lib/life-groves/types";

interface Props {
  type: OfferingType;
  size?: number;
  /** "tree" = the small luminous token used hanging in branches.
   *  "card" = the larger flat token used in library cards/tabs. */
  variant?: "tree" | "card";
  className?: string;
  /** Decorative-only? When true, the SVG is aria-hidden. Default true; the
   *  containing button/card supplies the accessible name. */
  decorative?: boolean;
}

// Shared palette so all glyphs share Heartwood warmth.
const INK = "hsl(var(--foreground) / 0.78)";
const INK_SOFT = "hsl(var(--foreground) / 0.45)";
const GOLD = "hsl(38 90% 62%)";
const GOLD_SOFT = "hsl(38 90% 78%)";
const LEAF = "hsl(95 40% 48%)";
const LEAF_SOFT = "hsl(95 45% 70%)";
const PARCH = "hsl(40 50% 92%)";

export default function LifeGroveOfferingGlyph({
  type,
  size = 28,
  variant = "tree",
  className,
  decorative = true,
}: Props) {
  const meta = OFFERING_TYPES.find((m) => m.value === type);
  const ariaProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": `${meta?.label ?? "Offering"} glyph` };

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      {...ariaProps}
    >
      {variant === "tree" && (
        <defs>
          <radialGradient id={`halo-${type}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={GOLD_SOFT} stopOpacity="0.65" />
            <stop offset="70%" stopColor={GOLD} stopOpacity="0.18" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
        </defs>
      )}
      {variant === "tree" && <circle cx="16" cy="16" r="15" fill={`url(#halo-${type})`} />}
      <Glyph type={type} variant={variant} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Individual glyphs                                                           */
/* -------------------------------------------------------------------------- */

function Glyph({ type, variant }: { type: OfferingType; variant: "tree" | "card" }) {
  switch (type) {
    case "story":
      return <Leaf />;
    case "photo":
      return <FramedLeaf />;
    case "song":
      return <SoundSeed />;
    case "book":
      return <Acorn />;
    case "poem":
      return <Scroll />;
    case "letter":
      return <Letter />;
    case "recipe":
      return <Fruit />;
    case "voice_note":
      return <Lantern variant={variant} />;
    case "video":
      return <Window />;
    default:
      return <Leaf />;
  }
}

function Leaf() {
  return (
    <g>
      <path
        d="M16 6 C 22 8, 25 14, 22 22 C 18 25, 12 24, 9 19 C 8 13, 11 8, 16 6 Z"
        fill={LEAF_SOFT}
        stroke={LEAF}
        strokeWidth="1"
      />
      <path d="M14 22 C 15 17, 17 12, 20 9" stroke={INK_SOFT} strokeWidth="0.8" fill="none" />
    </g>
  );
}

function FramedLeaf() {
  return (
    <g>
      <rect
        x="6.5"
        y="7.5"
        width="19"
        height="17"
        rx="2"
        fill={PARCH}
        stroke={INK}
        strokeWidth="1"
      />
      <path
        d="M16 11 C 20 12, 21 16, 19 20 C 16 21, 13 20, 12 17 C 12 13, 14 11, 16 11 Z"
        fill={LEAF_SOFT}
        stroke={LEAF}
        strokeWidth="0.8"
      />
      <circle cx="22" cy="11" r="0.9" fill={GOLD} />
    </g>
  );
}

function SoundSeed() {
  return (
    <g>
      <path
        d="M13 22 C 13 23.5, 11 24, 10 23 C 9 22, 10 20, 12 20 L 13 20 Z"
        fill={GOLD}
      />
      <path d="M13 20 L 13 9 L 22 7 L 22 18" stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path
        d="M22 18 C 22 19.5, 20 20, 19 19 C 18 18, 19 16, 21 16 L 22 16 Z"
        fill={GOLD}
      />
      <path d="M13 13 L 22 11" stroke={INK_SOFT} strokeWidth="0.7" />
    </g>
  );
}

function Acorn() {
  return (
    <g>
      <path
        d="M10 14 C 10 11, 22 11, 22 14 L 21 15 L 11 15 Z"
        fill={INK}
        opacity="0.85"
      />
      <path
        d="M11 15 C 11 21, 13 24, 16 25 C 19 24, 21 21, 21 15 Z"
        fill={GOLD_SOFT}
        stroke={GOLD}
        strokeWidth="0.8"
      />
      <path d="M16 11 L 16 8" stroke={INK} strokeWidth="1" strokeLinecap="round" />
      <path d="M14 14 L 18 14" stroke={INK_SOFT} strokeWidth="0.6" />
    </g>
  );
}

function Scroll() {
  return (
    <g>
      <path
        d="M8 9 C 8 7, 11 7, 11 9 L 11 22 C 11 24, 8 24, 8 22 Z"
        fill={PARCH}
        stroke={INK}
        strokeWidth="0.9"
      />
      <rect x="11" y="8" width="13" height="16" fill={PARCH} stroke={INK} strokeWidth="0.9" />
      <path
        d="M24 9 C 24 7, 21 7, 21 9 L 21 22 C 21 24, 24 24, 24 22 Z"
        fill={PARCH}
        stroke={INK}
        strokeWidth="0.9"
      />
      <path d="M13 13 L 21 13" stroke={INK_SOFT} strokeWidth="0.6" />
      <path d="M13 16 L 21 16" stroke={INK_SOFT} strokeWidth="0.6" />
      <path d="M13 19 L 19 19" stroke={INK_SOFT} strokeWidth="0.6" />
    </g>
  );
}

function Letter() {
  return (
    <g>
      <rect x="6" y="10" width="20" height="13" rx="1.2" fill={PARCH} stroke={INK} strokeWidth="0.9" />
      <path d="M6 10 L 16 18 L 26 10" fill="none" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M16 18 L 16 19" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="16" cy="20" r="1.4" fill={GOLD} stroke={INK} strokeWidth="0.4" />
    </g>
  );
}

function Fruit() {
  return (
    <g>
      <path
        d="M16 11 C 21 11, 24 14, 24 18 C 24 23, 20 26, 16 26 C 12 26, 8 23, 8 18 C 8 14, 11 11, 16 11 Z"
        fill={GOLD_SOFT}
        stroke={GOLD}
        strokeWidth="0.9"
      />
      <path d="M16 11 C 16 9, 17 7, 19 6" stroke={INK} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M19 8 C 21 8, 22 9, 22 11" stroke={LEAF} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M14 16 C 13 19, 14 22, 16 23" stroke={INK_SOFT} strokeWidth="0.6" fill="none" />
    </g>
  );
}

function Lantern({ variant }: { variant: "tree" | "card" }) {
  return (
    <g>
      <path d="M16 5 L 16 8" stroke={INK} strokeWidth="1" strokeLinecap="round" />
      <path d="M11 8 L 21 8" stroke={INK} strokeWidth="1" strokeLinecap="round" />
      <path
        d="M12 9 L 20 9 L 22 22 L 10 22 Z"
        fill={GOLD_SOFT}
        stroke={INK}
        strokeWidth="0.9"
      />
      <circle cx="16" cy="16" r="3.2" fill={GOLD} opacity={variant === "tree" ? "1" : "0.85"}>
        {variant === "tree" && (
          <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
        )}
      </circle>
      <path d="M10 22 L 22 22 L 21 24 L 11 24 Z" fill={INK} opacity="0.8" />
    </g>
  );
}

function Window() {
  return (
    <g>
      <rect x="7" y="7" width="18" height="18" rx="2" fill={PARCH} stroke={INK} strokeWidth="0.9" />
      <path d="M16 7 L 16 25" stroke={INK_SOFT} strokeWidth="0.6" />
      <path d="M7 16 L 25 16" stroke={INK_SOFT} strokeWidth="0.6" />
      <circle cx="16" cy="16" r="3.5" fill={GOLD} opacity="0.55">
        <animate attributeName="opacity" values="0.3;0.65;0.3" dur="4s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}
