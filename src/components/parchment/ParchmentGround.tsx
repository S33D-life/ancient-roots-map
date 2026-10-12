import { useId, useLayoutEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import oak from "@/assets/parchment/plate-holm-oak.png";
import "./parchment.css";

export function ParchmentGround({ children, realm, className = "" }: { children: ReactNode; realm: "canopy"; className?: string }) {
  const location = useLocation();
  useLayoutEffect(() => {
    if (!location.hash && !new URLSearchParams(location.search).has("from")) window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  const id = useId().replace(/:/g, "");
  return <div className={`parchment-ground parchment-${realm} ${className}`}><ParchmentGrain id={`paper-${id}`} />{children}</div>;
}

export function TreePlate({ realm = "canopy" }: { realm?: "canopy" }) {
  return <figure className={`parchment-plate parchment-plate-${realm}`}><img src={oak} alt="An illustrated view of an ancient tree with light opening through its branches" /><figcaption>Illustrated study · Where branches gather</figcaption></figure>;
}

/** Existing reviewed paper texture, local to the promoted Canopy. */
function ParchmentGrain({ id }: { id: string }) {
  return <svg aria-hidden className="lp-grain"><filter id={id}>
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
    <feColorMatrix values="0 0 0 0 0.36 0 0 0 0 0.27 0 0 0 0 0.14 0 0 0 0.5 0" />
  </filter><rect width="100%" height="100%" filter={`url(#${id})`} /></svg>;
}
