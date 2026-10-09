import { useId, useLayoutEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ParchmentGrain } from "@/components/crown/MaturityGlyph";
import oak from "@/assets/parchment/plate-holm-oak.png";
import teotag from "@/assets/teotag-small.webp";
import "./parchment.css";

export function ParchmentGround({ children, realm, className = "" }: { children: ReactNode; realm: "crown" | "canopy" | "heartwood"; className?: string }) {
  const location = useLocation();
  useLayoutEffect(() => {
    if (!location.hash && !new URLSearchParams(location.search).has("from")) window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  const id = useId().replace(/:/g, "");
  return <div className={`parchment-ground parchment-${realm} ${className}`}><ParchmentGrain id={`paper-${id}`} />{children}</div>;
}

export function TreePlate({ realm = "crown" }: { realm?: "crown" | "canopy" | "heartwood" }) {
  return <figure className={`parchment-plate parchment-plate-${realm}`}><img src={oak} alt="An illustrated view of an ancient tree with light opening through its branches" /><figcaption>Illustrated study · {realm === "crown" ? "Light above the canopy" : realm === "canopy" ? "Where branches gather" : "Memory within the trunk"}</figcaption></figure>;
}

export function TeotagMarginNote({ children }: { children: ReactNode }) {
  return <aside className="teotag-margin" aria-label="A note from TEOTAG"><img src={teotag} alt="" /><div><p>{children}</p><span className="teotag-signature">TEOTAG, in the margin</span></div></aside>;
}
