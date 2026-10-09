import oak from "@/assets/parchment/plate-holm-oak.png";
import "./crown-depth.css";

/** One existing illustration; depth changes framing, never navigation or meaning. */
export default function CrownTreeFrame({ depth = "field" }: { depth?: "field" | "folio" }) {
  return (
    <figure className={`crown-tree-frame crown-tree-frame--${depth}`} aria-hidden={depth === "folio" ? true : undefined}>
      <img src={oak} alt={depth === "field" ? "An illustrated view of an ancient tree with light opening through its branches" : ""} width="915" height="602" />
      {depth === "field" && <figcaption>Illustrated study · Light above the canopy</figcaption>}
    </figure>
  );
}
