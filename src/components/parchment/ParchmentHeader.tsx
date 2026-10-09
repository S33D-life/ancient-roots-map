import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Search, TreeDeciduous, X } from "lucide-react";
import { HEARTWOOD_ROOMS } from "@/config/heartwoodRooms";
import { ROUTES } from "@/lib/routes";
import { returnTarget } from "@/lib/crown/returnPath";
import teotagPortrait from "@/assets/teotag-small.webp";
import s33dHearthLogo from "@/assets/s33d-hearth-logo.png";
import ThemeToggle from "@/components/ThemeToggle";
import MoonGlyph from "@/components/rhythm/MoonGlyph";
import "./parchment.css";

export function internalRealm(path: string) {
  if (path === "/s33d") return "seed";
  if (path === "/golden-dream" || path.startsWith("/golden-dream/")) return "crown";
  if (path === "/library" || path.startsWith("/library/")) return "heartwood";
  if (path === "/council-of-life" || path === "/council" || path.startsWith("/council/")) return "canopy";
  return undefined;
}

const treeLinks = [
  { to: ROUTES.GOLDEN_DREAM, label: "Crown", sub: "yOur Golden Dream", realm: "crown" },
  { to: ROUTES.COUNCIL, label: "Canopy", sub: "Council of Life", realm: "canopy" },
  { to: ROUTES.LIBRARY, label: "Heartwood", sub: "The living library", realm: "heartwood" },
  { to: ROUTES.MAP, label: "Roots", sub: "Ancient Friends", realm: "roots" },
  { to: ROUTES.S33D, label: "S33D", sub: "Return to the Seed", realm: "seed" },
];

export default function ParchmentHeader({ onSearch, signedIn, onGuide }: {
  onSearch: () => void; signedIn: boolean; onGuide: () => void;
}) {
  const location = useLocation();
  const realm = internalRealm(location.pathname);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const isFolio = location.pathname.startsWith("/golden-dream/growth/");
  const back = realm === "seed" ? { to: "/", label: "Return to the Tree" } : isFolio ? returnTarget(location.state) : location.pathname.startsWith("/library/")
    ? { to: ROUTES.LIBRARY, label: "Return to the Hall" }
    : realm === "canopy" ? { to: ROUTES.GOLDEN_DREAM, label: "Return to the Crown" }
    : realm === "heartwood" ? { to: ROUTES.COUNCIL, label: "Return to the Canopy" }
    : { to: ROUTES.S33D, label: "Return to the Seed" };

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", handleKey); document.removeEventListener("pointerdown", outside); };
  }, [open]);

  return <header className="parchment-header">
    <div className="parchment-header-bar">
      <Link to="/" className="parchment-logo" aria-label="S33D — Open the TETOL tree browser"><img src={s33dHearthLogo} alt="S33D" /></Link>
      <Link to={back.to} className="parchment-back"><ArrowLeft size={17} aria-hidden="true" /><span>{"short" in back ? back.short : back.label.replace("Return to the ", "")}</span></Link>
      <span className="parchment-realm">{realm === "canopy" ? "Canopy" : realm}</span>
      <nav className="parchment-desktop-index" aria-label="Tree realms">
        {treeLinks.slice(0, 4).map(link => <Link key={link.to} to={link.to} aria-current={realm === link.realm ? "page" : undefined}>{link.label}</Link>)}
      </nav>
      <div className="parchment-tools">
        <button type="button" onClick={onSearch} aria-label="Search the Tree" className="parchment-search"><Search size={18} /></button>
        <button ref={trigger} type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="parchment-tree-index" className="parchment-tree"><TreeDeciduous size={19} aria-hidden="true" />Tree</button>
      <Link to="/dashboard" className="parchment-hearth-guide" aria-label="TEOTAG — Go to your Hearth"><img src={teotagPortrait} alt="TEOTAG" /></Link></div>
    </div>
    {open && <div ref={menu} id="parchment-tree-index" className="parchment-tree-panel">
      <div className="parchment-menu-heading"><span className="parchment-realm">One Tree</span><button type="button" onClick={close} aria-label="Close Tree index"><X size={20} /></button></div>
      <nav aria-label="Tree index" onClick={() => setOpen(false)}>{treeLinks.map(link => <Link key={link.to} to={link.to} aria-current={realm === link.realm ? "page" : undefined}><span>{link.label}</span><em>{link.sub}</em></Link>)}</nav>
      <details><summary>Heartwood rooms</summary><nav aria-label="Heartwood rooms" onClick={() => setOpen(false)}>{HEARTWOOD_ROOMS.map(room => <Link key={room.key} to={room.route}>{room.label}</Link>)}</nav></details>
      <div className="parchment-menu-utilities"><button type="button" onClick={() => { setOpen(false); onSearch(); }}>Search the Tree</button><ThemeToggle /><MoonGlyph variant="seal" /><button type="button" onClick={() => { setOpen(false); onGuide(); }}>TEOTAG</button><Link to={signedIn ? "/dashboard" : "/auth"}>{signedIn ? "Your Hearth" : "Sign in"}</Link></div>
    </div>}
  </header>;
}
