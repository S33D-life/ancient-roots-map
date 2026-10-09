import type { CSSProperties } from "react";
import "./mantle.css";

/** Material threshold. Supply an approved, non-repeating photograph when available. */
export default function Mantle({ material = "olive", textureUrl }: {
  material?: "olive";
  textureUrl?: string;
}) {
  const style = textureUrl ? { "--mantle-texture": `url(${JSON.stringify(textureUrl)})` } as CSSProperties : undefined;
  return <span aria-hidden="true" className="mantle" data-material={material} style={style}>
    <svg className="mantle-edge" viewBox="0 0 1440 12" preserveAspectRatio="none">
      <path d="M0 0H1440V5C1360 8 1310 3 1220 6S1100 11 1010 7S870 4 790 9S660 7 580 6S460 11 370 7S250 3 180 6S65 10 0 5Z" />
    </svg>
  </span>;
}
