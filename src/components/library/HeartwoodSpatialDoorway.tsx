import { useEffect, useRef, useState } from "react";
import { ROOM_BY_KEY } from "@/config/heartwoodRooms";
import { ROUTES } from "@/lib/routes";
import { CURRENT_CIRCLE, approvedCircleUrl } from "../../../supabase/functions/_shared/currentCircle";
import oak from "@/assets/parchment/plate-holm-oak.png";

/** Canopy's inline entry/return grammar, wrapped around the existing Heartwood interior. */
export default function HeartwoodSpatialDoorway() {
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState<{ path: string; label: string } | null>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const spatial = useRef<HTMLIFrameElement>(null);
  const readingDetach = useRef<(() => void) | undefined>();
  const detach = useRef<(() => void) | undefined>();
  const approved = CURRENT_CIRCLE.approval === "approved" ? approvedCircleUrl(CURRENT_CIRCLE.links.tetol) : undefined;
  useEffect(() => () => { detach.current?.(); readingDetach.current?.(); }, []);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      closer.current?.focus({ preventScroll: true });
      closer.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, reading]);
  if (!approved) return null;
  const close = () => {
    detach.current?.(); readingDetach.current?.(); setReading(null); setOpen(false);
    requestAnimationFrame(() => { opener.current?.focus({ preventScroll: true }); opener.current?.scrollIntoView({ block: "center", behavior: "instant" }); });
  };
  return <div className="heartwood-spatial-doorway">
    <div className="heartwood-homecoming">
      <img className="heartwood-bark-window" src={oak} alt="" />
      <div><p className="heartwood-welcome">Come home with what you have found.</p><p>Seeds, songs and stories have a place here.</p>
        <div className="heartwood-two-ways"><button ref={opener} type="button" className="heartwood-enter" aria-controls="heartwood-interior" aria-expanded={open} onClick={() => setOpen(true)}>Enter the trunk <span aria-hidden="true">→</span></button><a className="parchment-action" href="#heartwood-direct">Explore Heartwood ↓</a></div>
        <p className="heartwood-way-note">Wander inside, or go straight to a room.</p>
      </div>
    </div>
    {open && <section aria-label="Inside Heartwood" id="heartwood-interior" className="heartwood-hollow">
      <button ref={closer} type="button" className="parchment-action" onClick={reading ? () => setReading(null) : close}>{reading ? "Return to Spatial Heartwood ↑" : "Return to the Living Field ↑"}</button>
      {reading && <iframe key="reading" onLoad={event => {
        readingDetach.current?.(); const doc = event.currentTarget.contentDocument; if (!doc) return;
        const returnClick = (click: MouseEvent) => {
          if (click.button !== 0 || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey) return;
          const link = (click.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]"); if (!link) return;
          const url = new URL(link.href, window.location.href);
          if (url.origin === window.location.origin && url.pathname === ROUTES.LIBRARY) { click.preventDefault(); click.stopPropagation(); setReading(null); }
        };
        doc.addEventListener("click", returnClick, true); readingDetach.current = () => doc.removeEventListener("click", returnClick, true);
      }} title={`${reading.label} · Heartwood reading room`} src={reading.path} />}
      <iframe key="spatial" ref={spatial} hidden={!!reading} title="TETOL spatial Heartwood" src={`${new URL(approved).pathname}?welcome=0#hwroom`} allow="fullscreen" allowFullScreen onLoad={event => {
        detach.current?.(); const doc = event.currentTarget.contentDocument; if (!doc) return;
        const back = doc.querySelector<HTMLAnchorElement>("#council-return");
        if (back) { const url = new URL(back.href, window.location.href); if (url.origin === window.location.origin && url.pathname === "/council-of-life" && url.searchParams.get("from") === "spatial-council") { back.href = ROUTES.LIBRARY; back.textContent = "Return to Heartwood"; back.setAttribute("aria-label", "Return to Heartwood"); } }
        const onClick = (click: MouseEvent) => {
          if (click.button !== 0 || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey) return;
          const target = click.target as Element | null; const link = target?.closest?.<HTMLAnchorElement>("a[href]"); if (!link) return;
          const url = new URL(link.href, window.location.href);
          if (url.origin !== window.location.origin && url.origin !== "https://www.s33d.life") return;
          if (link.id === "council-return" && url.pathname === ROUTES.LIBRARY) { click.preventDefault(); close(); return; }
          const room = Object.values(ROOM_BY_KEY).find(room => room.route === url.pathname && !["tap-root", "vault", "rhythms"].includes(room.key));
          if (room || url.pathname === ROUTES.ATLAS) { click.preventDefault(); setReading({ path: room?.route || ROUTES.ATLAS, label: room?.label || "Map Room" }); }
          else if (url.pathname === ROUTES.LIBRARY) { click.preventDefault(); close(); }
        };
        doc.addEventListener("click", onClick); detach.current = () => doc.removeEventListener("click", onClick);
      }} />
    </section>}
  </div>;
}
