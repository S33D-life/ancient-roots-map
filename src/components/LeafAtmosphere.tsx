/**
 * LeafAtmosphere — Pure CSS drifting leaf motes.
 * 
 * Sparse, slow, atmospheric. Never more than 5 visible at once.
 * Each leaf: fade in → drift down → fade out → regenerate via CSS infinite.
 * 
 * Variants: heartwood (gold-dominant), canopy (green-dominant),
 *           crown (airy gold, upward bias), map (sparse, dark green)
 */

type LeafVariant = "heartwood" | "canopy" | "crown" | "map";

interface Props {
  variant?: LeafVariant;
}

// Fixed leaf configs — no JS randomness at runtime, just CSS custom properties
const LEAVES = [
  { type: "gold",    left: "12%", dur: "9s",  delay: "0s",    sway: "25px",  rot: "10deg",  size: "5px" },
  { type: "green",   left: "38%", dur: "11s", delay: "4s",    sway: "-20px", rot: "-15deg", size: "7px" },
  { type: "gold",    left: "65%", dur: "8s",  delay: "8.5s",  sway: "30px",  rot: "25deg",  size: "4px" },
  { type: "green",   left: "82%", dur: "10s", delay: "13s",   sway: "-15px", rot: "5deg",   size: "8px" },
  { type: "distant", left: "50%", dur: "13s", delay: "18s",   sway: "10px",  rot: "-8deg",  size: "10px" },
] as const;

const sectionClass: Record<LeafVariant, string> = {
  heartwood: "leaf-section-heartwood",
  canopy:    "leaf-section-canopy",
  crown:     "leaf-section-crown",
  map:       "leaf-section-map",
};

const LeafAtmosphere = ({ variant = "heartwood" }: Props) => (
  <div className={`leaf-atmosphere-layer ${sectionClass[variant]}`} aria-hidden="true">
    {LEAVES.map((leaf, i) => (
      <div
        key={i}
        className={`leaf-mote leaf-mote--${leaf.type}`}
        style={{
          left: leaf.left,
          top: "-10px",
          ["--leaf-dur" as string]: leaf.dur,
          ["--leaf-delay" as string]: leaf.delay,
          ["--leaf-sway" as string]: leaf.sway,
          ["--leaf-rot" as string]: leaf.rot,
          ["--leaf-size" as string]: leaf.size,
        }}
      />
    ))}
  </div>
);

export default LeafAtmosphere;
