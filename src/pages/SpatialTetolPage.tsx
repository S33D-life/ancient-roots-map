import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { HEARTWOOD_ROOMS } from "@/config/heartwoodRooms";

const appDoorways = new Set<string>([...Object.values(ROUTES).flatMap(route => typeof route === "string" ? [route] : []), ...HEARTWOOD_ROOMS.flatMap(room => [room.route, ...(room.aliases ?? [])])]);

/** One doorway, one existing renderer. Its own validated node hashes remain authoritative. */
export default function SpatialTetolPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialHash = useRef(/^#[a-zA-Z0-9_-]{1,80}$/.test(location.hash) ? location.hash : "#overview");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const cleanup = useRef<() => void>();
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 20000);
    return () => { window.clearTimeout(timer); cleanup.current?.(); };
  }, []);
  return <main aria-label="Fullscreen Spatial TETOL" style={{ position: "fixed", inset: 0, zIndex: 100, background: "#101b1a", color: "#f3ead1", display: "grid", gridTemplateRows: "minmax(0, 1fr) auto" }}>
    <iframe ref={frameRef} title="Spatial TETOL — the living Tree" allow="fullscreen" allowFullScreen
      src={`/tetol/circle-235/pre-fire/tetol.html?welcome=0${initialHash.current}`}
      style={{ width: "100%", height: "100%", border: 0 }} onLoad={event => {
        cleanup.current?.();
        const frame = event.currentTarget;
        const doc = frame.contentDocument;
        const win = frame.contentWindow;
        if (!doc || !win) return;
        let started = false;
        const inspect = () => { if (!started && ((doc.getElementById("mlist") as HTMLButtonElement | null)?.onclick)) { started = true; setReady(true); if (new URLSearchParams(window.location.search).get("spatialMode") === "list") (doc.getElementById("mlist") as HTMLButtonElement).click(); } };
        const observer = new MutationObserver(inspect);
        observer.observe(doc, { childList: true, subtree: true });
        inspect();
        const readiness = window.setInterval(() => { inspect(); if (started) window.clearInterval(readiness); }, 500);
        const hash = () => {
          if (/^#[a-zA-Z0-9_-]{1,80}$/.test(win.location.hash)) navigate(`${ROUTES.TETOL}${window.location.search}${win.location.hash}`, { replace: true });
        };
        win.addEventListener("hashchange", hash);
        win.addEventListener("tetol:place", hash);
        const returnToTree = (click: MouseEvent) => {
          if (click.button || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return;
          const mode = (click.target as Element)?.closest?.("#mlist, #m3d");
          if (mode) navigate(`${ROUTES.TETOL}${mode.id === "mlist" ? "?spatialMode=list" : ""}${win.location.hash}`, { replace: true });
          const link = (click.target as Element)?.closest?.("a#council-return");
          if (link) { click.preventDefault(); navigate(ROUTES.COUNCIL, { state: { from: `${ROUTES.TETOL}${window.location.search}${win.location.hash}` } }); return; }
          const doorway = (click.target as Element)?.closest?.("a[href]") as HTMLAnchorElement | null;
          if (!doorway) return;
          const url = new URL(doorway.href);
          if (url.username || url.password || url.port && url.origin !== window.location.origin) return;
          if (![window.location.origin, "https://www.s33d.life", "https://s33d.life"].includes(url.origin) || !appDoorways.has(url.pathname)) return;
          click.preventDefault();
          const from = `${ROUTES.TETOL}${window.location.search}${win.location.hash}`;
          navigate(url.pathname + url.search + url.hash, { state: { from, hallOrigin: from } });
        };
        doc.addEventListener("click", returnToTree);
        cleanup.current = () => { window.clearInterval(readiness); observer.disconnect(); win.removeEventListener("hashchange", hash); win.removeEventListener("tetol:place", hash); doc.removeEventListener("click", returnToTree); };
      }} />
    <nav aria-label="Spatial exit" style={{ padding: 8, paddingBottom: "max(8px, env(safe-area-inset-bottom))", borderTop: "1px solid #58634f", display: "flex", gap: 8, flexWrap: "wrap" }}><Link to={ROUTES.S33D} style={{ display: "inline-flex", alignItems: "center", padding: "12px 12px", minHeight: 48, color: "#f3ead1", border: "1px solid #9eae96", borderRadius: 8 }}>Return to the Tree</Link><button type="button" disabled={!ready} style={{ padding: "12px 12px", minHeight: 48, color: "#f3ead1", border: "1px solid #9eae96", borderRadius: 8 }} onClick={() => { (frameRef.current?.contentDocument?.getElementById("mlist") as HTMLButtonElement | null)?.click(); }}>Readable Tree</button></nav>
    {!ready && <div role="status" style={{ position: "absolute", bottom: 80, left: 16, right: 16, padding: 16, background: "#101b1a" }}>{slow ? "The spatial Tree is taking longer to open. You can return to the exterior at any time." : "Opening the spatial Tree…"}</div>}
  </main>;
}
