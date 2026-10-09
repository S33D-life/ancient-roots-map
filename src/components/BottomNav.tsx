import { SAFE_ZONES } from "@/lib/z-index";
import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Crown, Circle } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { internalRealm } from "@/components/parchment/ParchmentHeader";

function RealmSymbol({ realm }: { realm: string }) {
  if (realm === "crown") return <Crown size={27} aria-hidden="true" />;
  if (realm === "canopy") return <Circle size={27} aria-hidden="true" />;
  if (realm === "heartwood") return <svg width="29" height="29" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><ellipse cx="16" cy="7" rx="9" ry="3" /><path d="M7 7v15l-3 5h24l-3-5V7M10 25l1-3M22 25l-1-3" /><path d="M16 21s-5-3.2-5-6a2.6 2.6 0 0 1 5-1 2.6 2.6 0 0 1 5 1c0 2.8-5 6-5 6Z" /></svg>;
  return <svg width="29" height="29" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 4v8l-4 5-5 2M19 4v8l4 5 5 2M16 10v11l-4 7M16 21l5 7M9 17l1 7M23 17l-1 7M16 15l-4 2M16 18l5 2" /></svg>;
}

const BottomNav = () => {
  const { pathname } = useLocation();
  const realm = internalRealm(pathname) ?? (/^\/(map|atlas|tree|hive)(\/|$)/.test(pathname) ? "roots" : undefined);
  return <nav className="parchment-bottom-nav" aria-label="Continue through the Tree">{[
    { to: ROUTES.GOLDEN_DREAM, label: "Crown", realm: "crown" },
    { to: ROUTES.COUNCIL, label: "Canopy", realm: "canopy" },
    { to: ROUTES.LIBRARY, label: "Heartwood", realm: "heartwood" },
    { to: ROUTES.MAP, label: "Roots", realm: "roots" },
  ].map(item => <Link key={item.to} to={item.to} aria-current={realm === item.realm ? "page" : undefined} aria-label={item.label} title={item.label}><RealmSymbol realm={item.realm} /></Link>)}</nav>;

};

export const BottomNavSpacer = () => <div className="md:hidden" style={{ height: `calc(${SAFE_ZONES.BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }} aria-hidden />;

export default memo(BottomNav);
