import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { TreeDeciduous, BookOpen, Leaf, Globe, Plus } from "lucide-react";
import { Z, SAFE_ZONES } from "@/lib/z-index";
import { ROUTES } from "@/lib/routes";

const NAV_ITEMS = [
  { to: ROUTES.MAP, icon: TreeDeciduous, label: "Map", matchPrefixes: ["/map", "/hives", "/hive/", "/tree/", "/discovery", "/add-tree"] },
  { to: ROUTES.VALUE_TREE, icon: Leaf, label: "Value Tree", matchPrefixes: ["/value-tree", "/harvest", "/cosmic", "/how-hearts-work", "/patron-offering"] },
  // Center slot reserved for Add button
  { to: ROUTES.LIBRARY, icon: BookOpen, label: "Heartwood", matchPrefixes: ["/library", "/vault", "/dashboard", "/wanderer/", "/staff/", "/ledger"] },
  { to: ROUTES.COUNCIL, icon: Globe, label: "Council", matchPrefixes: ["/council", "/bug-garden", "/roadmap", "/atlas", "/support", "/press", "/groves", "/pulse", "/pathways"] },
] as const;

const BottomNav = () => {
  const { pathname } = useLocation();
  const isMap = pathname === "/map";

  return (
    <nav
      className={`md:hidden border-t transition-all duration-300 ${isMap ? "opacity-85 hover:opacity-100 focus-within:opacity-100" : ""}`}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: Z.BOTTOM_NAV,
        background: isMap ? "hsl(var(--card) / 0.88)" : "hsl(var(--card) / 0.96)",
        borderColor: "hsl(var(--border) / 0.15)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        boxShadow: "0 -2px 16px hsl(var(--background) / 0.4)",
        /* Prevent any parent transform/filter/will-change from creating new stacking context */
        contain: "layout",
        transform: "none",
        willChange: "auto",
      }}
    >
      <div className="flex items-center justify-around py-1">
        {/* First two nav items */}
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavItem key={item.to} item={item} pathname={pathname} />
        ))}

        {/* Center: Add Tree FAB */}
        <Link
          to={ROUTES.ADD_TREE}
          className="relative flex flex-col items-center gap-0.5 px-3 py-1 justify-center min-w-[48px] min-h-[48px] active:scale-95"
          aria-label="Add a tree"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center -mt-4 shadow-lg border-2"
            style={{
              background: "hsl(var(--primary))",
              borderColor: "hsl(var(--card) / 0.9)",
              boxShadow: "0 2px 12px hsl(var(--primary) / 0.3)",
            }}
          >
            <Plus className="w-5 h-5" style={{ color: "hsl(var(--primary-foreground))" }} />
          </div>
          <span className="text-[9px] font-serif tracking-wider text-primary">Add</span>
        </Link>

        {/* Last two nav items */}
        {NAV_ITEMS.slice(2).map((item) => (
          <NavItem key={item.to} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
};

interface NavItemProps {
  item: typeof NAV_ITEMS[number];
  pathname: string;
}

const NavItem = ({ item, pathname }: NavItemProps) => {
  const { to, icon: Icon, label } = item;
  const active = item.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <Link
      to={to}
      className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[48px] min-h-[48px] justify-center active:scale-95"
      style={{
        color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)",
      }}
    >
      <div
        className={`relative rounded-full p-1.5 ${active ? "glow-button" : ""}`}
        style={active ? { boxShadow: "inset 0 0 8px rgba(255,215,120,0.2), 0 0 12px rgba(255,200,80,0.25)" } : {}}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-serif tracking-wider">{label}</span>
      {active && (
        <motion.span
          layoutId="bottomnav-indicator"
          className="absolute -bottom-0.5 w-6 h-0.5 rounded-full"
          style={{ background: "hsl(var(--primary) / 0.7)" }}
          transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }}
        />
      )}
    </Link>
  );
};

/**
 * Spacer component to add at the bottom of scrollable page content
 * so nothing is hidden behind the fixed bottom nav on mobile.
 */
export const BottomNavSpacer = () => (
  <div
    className="md:hidden"
    style={{
      height: `calc(${SAFE_ZONES.BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
    }}
    aria-hidden
  />
);

export default memo(BottomNav);
