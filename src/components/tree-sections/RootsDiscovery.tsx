import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { readRootsPresence } from "./roots-presence";
import { ROUTES } from "@/lib/routes";
import TreeSpine from "./TreeSpine";
import "./roots-discovery.css";

const origin = { from: "/s33d#atlas-content" };

/** One exterior region unfolds; it does not become another room or data store. */
export default function RootsDiscovery() {
  const [open, setOpen] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const reveal = useRef<HTMLButtonElement>(null);
  const savedScroll = useRef(0);
  const { data, isPending } = useQuery({
    queryKey: ["roots-exterior-presence"], queryFn: readRootsPresence,
    enabled: open, staleTime: 5 * 60 * 1000, retry: false,
    refetchOnWindowFocus: false,
  });

  function close() {
    setOpen(false);
    requestAnimationFrame(() => {
      reveal.current?.focus({ preventScroll: true });
      window.scrollTo({ top: savedScroll.current, behavior: "instant" });
    });
  }

  return <div className={`roots-proof ${open ? "roots-proof-open" : ""}`}>
    <div className="exterior-roots">
      <span className="parchment-kicker">The Roots</span>
      <h2>Ancient Friends</h2>
      <p>Lived encounter. Earth. Place.</p>
      <div className="roots-thresholds">
        <button ref={reveal} type="button" aria-expanded={open} aria-controls="roots-discovery"
          className="roots-reveal" onClick={() => {
            if (open) close();
            else { savedScroll.current = window.scrollY; setOpen(true); }
          }}>
          <svg aria-hidden="true" viewBox="0 0 64 40" width="64" height="40" fill="none">
            <path d="M32 2v13m0 0C23 20 18 24 9 35m23-20c9 5 14 9 23 20M32 15v23M21 23l-9 2m31-2 9 2M27 29l-8 9m18-9 8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>{open ? "Return to the wider Tree" : "Look closer at the Roots"}</span>
        </button>
        <Link to={ROUTES.MAP} state={origin} className="exterior-doorway">Enter the Roots →</Link>
      </div>
    </div>
    <section id="roots-discovery" aria-label="Life among the Roots" hidden={!open}>
      {open && <>
        <div className="roots-near-layer" aria-hidden="true"><TreeSpine opacity={0.14} /></div>
        <div className="roots-life">
          <p className="roots-field-note">Among the Roots · still outside the Tree</p>
          {isPending && <p role="status">Looking for a remembered tree…</p>}
          {data?.friend && !photoFailed && <figure>
            <Link to={ROUTES.TREE(data.friend.id)} state={origin} aria-label={`Meet ${data.friend.name}`}>
              <img src={data.friend.photo} alt={`Photograph attached to ${data.friend.name}'s tree record`}
                width="640" height="480" decoding="async" onError={() => setPhotoFailed(true)} />
              <figcaption><span className="roots-field-note">An Ancient Friend</span>
                <strong>{data.friend.name}</strong>
                <span>A photograph held with this tree. Meet this Friend →</span>
              </figcaption>
            </Link>
          </figure>}
          {!isPending && (!data?.friend || photoFailed) && <p>No photographed Friend to reveal here just now.</p>}
          {data?.count != null && data.count > 0 && <p className="roots-evidence">{data.count.toLocaleString()} Ancient Friends recorded in the shared atlas.</p>}
          <p className="roots-invitation">Begin with a tree near you. Notice, listen, and carry something back.</p>
          <button type="button" className="roots-fold" onClick={close}>Return to the wider Tree ↑</button>
        </div>
      </>}
    </section>
  </div>;
}
