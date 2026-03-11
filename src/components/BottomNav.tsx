import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { TreeDeciduous, BookOpen, Leaf, Globe, Plus } from "lucide-react";

const NAV_ITEMS = [
  { to: "/map", icon: TreeDeciduous, label: "Map", matchPrefixes: ["/map", "/hives", "/hive/"] },
  { to: "/atlas", icon: Globe, label: "Atlas", matchPrefixes: ["/atlas"] },
  // Center slot reserved for Add button
  { to: "/library", icon: BookOpen, label: "Library", matchPrefixes: ["/library", "/vault", "/heartwood", "/dashboard"] },
  { to: "/council-of-life", icon: Leaf, label: "Council", matchPrefixes: ["/council"] },
] as const;

const BottomNav = () => {
  const { pathname } = useLocation();
  const isMap = pathname === "/map";

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[80] md:hidden border-t transition-all duration-300 will-change-transform ${isMap ? "opacity-85 hover:opacity-100 focus-within:opacity-100" : ""}`}
      style={{
        background: isMap ? "hsl(var(--card) / 0.88)" : "hsl(var(--card) / 0.96)",
        borderColor: "hsl(var(--border) / 0.15)",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 6px)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        boxShadow: "0 -2px 16px hsl(var(--background) / 0.4)",
        transform: "translate3d(0,0,0)",
      }}
    >
      <div className="flex items-center justify-around py-1.5">
        {/* First two nav items */}
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavItem key={item.to} item={item} pathname={pathname} />
        ))}

        {/* Center: Add Tree FAB */}
        <Link
          to="/add-tree"
          className="relative flex flex-col items-center gap-0.5 px-3 py-1 justify-center min-w-[44px] min-h-[44px]"
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
      className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] justify-center"
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

export default BottomNav;
