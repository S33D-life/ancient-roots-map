import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";

export function fieldMapUrl(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
}

interface Props {
  treeId: string;
  name: string;
  species?: string | null;
  lat?: number | null;
  lng?: number | null;
  signedIn: boolean;
  encounterOpen?: boolean;
  offeringUnlocked: boolean;
  onMap: () => void;
  onEncounter: () => void;
  onOffering: () => void;
}

/** Intention is device-local only. It never changes encounter or relationship records. */
export default function OutwardJourney({ treeId, name, species, lat, lng, signedIn, encounterOpen, offeringUnlocked, onMap, onEncounter, onOffering }: Props) {
  const key = `roots:visit-intention:${treeId}`;
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(key) === "intended"; } catch { return false; }
  });
  const [remembered, setRemembered] = useState(open);
  const [returned, setReturned] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const section = useRef<HTMLElement>(null);
  const scrollBefore = useRef<number | null>(null);
  const encounterTrigger = useRef<HTMLButtonElement>(null);
  const wasEncounterOpen = useRef(false);
  useEffect(() => {
    if (wasEncounterOpen.current && !encounterOpen) encounterTrigger.current?.focus({ preventScroll: true });
    wasEncounterOpen.current = Boolean(encounterOpen);
  }, [encounterOpen]);
  const panelId = useId();
  const mapUrl = fieldMapUrl(lat, lng);
  const toggle = () => {
    if (open) {
      setOpen(false);
      requestAnimationFrame(() => {
        trigger.current?.focus({ preventScroll: true });
        if (scrollBefore.current != null) window.scrollTo({ top: scrollBefore.current, behavior: "instant" });
        else section.current?.scrollIntoView({ block: "start", behavior: "instant" });
      });
    } else {
      scrollBefore.current = window.scrollY;
      setOpen(true);
      try { localStorage.setItem(key, "intended"); setRemembered(true); } catch { /* Browsing still works without storage. */ }
    }
  };
  return <section ref={section} aria-label={`Outward journey to ${name}`} data-tree-id={treeId} className="my-6 border-y border-primary/25 py-6 font-serif scroll-mt-24">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">Roots · a tree to seek</p>
    <h2 className="mt-2 text-2xl text-foreground">Visit {name}</h2>
    {species && <p className="mt-1 text-sm text-muted-foreground">{species} · mapped tree</p>}
    <p className="mt-3 text-foreground">A place on the Map. A relationship begins through encounter.</p>
    <Button ref={trigger} onClick={toggle} aria-expanded={open} aria-controls={panelId} className="mt-4 min-h-12 whitespace-normal">{open ? "Close the field invitation" : "Visit this tree"}</Button>
    {open && <div id={panelId} className="mt-5 space-y-4 text-foreground">
      <p className="text-sm text-muted-foreground">{remembered ? "Your intention is kept on this device for this tree. It is not a recorded visit." : "Keep this page to return to this tree. No visit has been recorded."}</p>
      {mapUrl ? <>
        <p className="text-sm">Recorded location: {lat}, {lng}. Check the location and local access before travelling.</p>
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center underline underline-offset-4">Open this location in a field map ↗<span className="sr-only"> (opens a new tab)</span></a>
      </> : <p>There is no usable recorded location here yet.</p>}
      <div><Button variant="outline" onClick={onMap} className="min-h-12 whitespace-normal">See this tree on the S33D Map</Button></div>
      <p className="text-lg">Notice. Listen. Spend time. Bring back what you actually encountered.</p>
      <p className="text-sm text-muted-foreground">You can put the screen away. This tree will still be here when you return.</p>
      <Button variant="outline" onClick={() => setReturned(true)} aria-expanded={returned} className="min-h-12">Returning from a visit?</Button>
      {returned && <div className="space-y-4 border-l-2 border-primary/30 pl-4">
        <p>Record what happened with {name}.</p>
        <p className="text-sm text-muted-foreground">A recorded encounter is your account of a visit. It does not automatically establish recognised Ancient Friend status.</p>
        <Button ref={encounterTrigger} onClick={onEncounter} className="min-h-12 whitespace-normal">Open encounter recording</Button>
        {!signedIn && <p className="text-sm text-muted-foreground">Recording requires sign-in. The existing encounter form keeps that boundary.</p>}
        <div><Button variant="outline" onClick={onOffering} disabled={!offeringUnlocked} className="min-h-12 whitespace-normal">Offer something to this tree</Button></div>
        {!offeringUnlocked && <p className="text-sm text-muted-foreground">Offerings use the existing presence/proximity gate. Return beneath this tree to check your presence.</p>}
        <Link to={ROUTES.LIBRARY} state={{ from: ROUTES.TREE(treeId) }} className="inline-flex min-h-12 items-center underline underline-offset-4">Continue toward Heartwood Hall →</Link>
        <p className="text-sm text-muted-foreground">The Hall is a doorway into living memory. This link does not create a Heartwood record.</p>
      </div>}
    </div>}
  </section>;
}
