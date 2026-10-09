import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/lib/routes";
import { CURRENT_CIRCLE, approvedCircleUrl } from "../../../supabase/functions/_shared/currentCircle";

/** Hall-only presentation adapter for the existing spatial Trunk. No new scene or return URL. */
export default function HeartwoodSpatialDoorway() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const detach = useRef<(() => void) | undefined>();
  const approved = CURRENT_CIRCLE.approval === "approved" ? approvedCircleUrl(CURRENT_CIRCLE.links.tetol) : undefined;
  useEffect(() => () => detach.current?.(), []);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      closer.current?.focus({ preventScroll: true });
      closer.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
  if (!approved) return null;
  const close = () => { detach.current?.(); setOpen(false); requestAnimationFrame(() => opener.current?.focus()); };
  return <div className="heartwood-spatial-doorway">
    <button ref={opener} type="button" className="parchment-action" aria-expanded={open} onClick={() => setOpen(true)}>Wander into spatial Heartwood →</button>
    {open && <section aria-label="Spatial Heartwood" className="parchment-deck-frame">
      <button ref={closer} type="button" className="parchment-action" onClick={close}>Return to the Living Field ↑</button>
      <iframe title="TETOL spatial Heartwood" src={`${new URL(approved).pathname}?welcome=0#trunk`} allow="fullscreen" allowFullScreen onLoad={event => {
        detach.current?.();
        const doc = event.currentTarget.contentDocument;
        if (!doc) return;
        const back = doc.querySelector<HTMLAnchorElement>("#council-return");
        if (!back) return;
        const url = new URL(back.href, window.location.href);
        if (url.origin !== window.location.origin || url.pathname !== "/council-of-life" || url.searchParams.get("from") !== "spatial-council") return;
        // Context belongs to this embedded Hall, not the source deck's default Council arrival.
        back.href = ROUTES.LIBRARY;
        back.textContent = "Return to Heartwood";
        back.setAttribute("aria-label", "Return to Heartwood");
        const onClick = (click: MouseEvent) => {
          if (click.button !== 0 || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey) return;
          click.preventDefault(); close();
        };
        back.addEventListener("click", onClick);
        detach.current = () => back.removeEventListener("click", onClick);
      }} />
    </section>}
  </div>;
}
