import { SAFE_ZONES } from "@/lib/z-index";
import { memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Crown, Circle, Sprout } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { internalRealm } from "@/components/parchment/ParchmentHeader";

function RealmSymbol({ realm }: { realm: string }) {
  if (realm === "seed") return <Sprout size={27} aria-hidden="true" />;
  if (realm === "crown") return <Crown size={27} aria-hidden="true" />;
  if (realm === "canopy") return <Circle size={27} aria-hidden="true" />;
  if (realm === "heartwood") return <svg width="29" height="29" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><ellipse cx="16" cy="7" rx="9" ry="3" /><path d="M7 7v15l-3 5h24l-3-5V7M10 25l1-3M22 25l-1-3" /><path d="M16 21s-5-3.2-5-6a2.6 2.6 0 0 1 5-1 2.6 2.6 0 0 1 5 1c0 2.8-5 6-5 6Z" /></svg>;
  return <svg width="29" height="29" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3v8c0 5-4 6-6 9l-4 3M18 3v8c0 4 3 6 4 9M16 10v11l-3 7M16 21l4 7M8 20l1 6M12 16l-5-1" />
    <path d="M21 17c.6-3 2.1-5 4-5s3.4 2 4 5c-2.6 1.2-5.4 1.2-8 0ZM25 18v6" />
    <path d="M4 28c4-3 7-1 10-2s6-3 10-1l4 2M24 25l4-3" strokeWidth="1.2" />
  </svg>;
}

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const realm = internalRealm(pathname) ?? (/^\/(map|atlas|tree|hives|hive)(\/|$)/.test(pathname) ? "roots" : undefined);
  return <nav className="parchment-bottom-nav" aria-label="Continue through the Tree">{[
    { to: ROUTES.MAP, label: "Roots", description: "Ancient Friends · Roots", realm: "roots" },
    { to: ROUTES.S33D, label: "Seed", description: "S33D · Seed", realm: "seed" },
    { to: ROUTES.LIBRARY, label: "Heartwood", description: "Heartwood Library · Trunk", realm: "heartwood" },
    { to: ROUTES.COUNCIL, label: "Canopy", description: "Council of Life · Canopy", realm: "canopy" },
    { to: ROUTES.GOLDEN_DREAM, label: "Crown", description: "yOur Golden Dream · Crown", realm: "crown" },
  ].map(item => <Link key={item.to} to={item.to} aria-current={realm === item.realm ? "page" : undefined} aria-label={item.label} title={item.description}><RealmSymbol realm={item.realm} /></Link>)}<button type="button" className="parchment-add-tree" aria-label="Add a tree or encounter" title="Add a tree or encounter" onClick={() => {
    if (pathname === ROUTES.MAP) window.dispatchEvent(new CustomEvent("s33d-add-tree-chooser"));
    else navigate(`${ROUTES.MAP}?addTree=true`);
  }}><svg width="29" height="29" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4 5 14h4l-5 7h7v7h3v-7h6l-5-7h4L12 4Z"/><path d="M25 5v10M20 10h10"/></svg></button></nav>;

};

export const BottomNavSpacer = () => <div className="md:hidden" style={{ height: `calc(${SAFE_ZONES.BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }} aria-hidden />;

export default memo(BottomNav);
