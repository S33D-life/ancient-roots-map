/**
 * Maturity glyph — one botanical CSS shape per public maturity stage.
 * Never gold, never a badge, never computed from engineering state.
 */
import { MATURITY_LABEL, type GrowthMaturity } from "@/data/crown/growths";
import "./living-parchment.css";

export default function MaturityGlyph({ maturity, ring = true }: { maturity: GrowthMaturity; ring?: boolean }) {
  const glyph = <span aria-hidden className={`lp-glyph lp-glyph--${maturity}`} />;
  return (
    <span role="img" aria-label={`Maturity: ${MATURITY_LABEL[maturity]}`} className={ring ? "lp-glyph-ring" : "inline-flex"}>
      {glyph}
    </span>
  );
}

/** Paper grain from the Living Parchment spec: sepia fractal noise, multiplied. */
export function ParchmentGrain({ id }: { id: string }) {
  return (
    <svg aria-hidden className="lp-grain">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0.36 0 0 0 0 0.27 0 0 0 0 0.14 0 0 0 0.5 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}
