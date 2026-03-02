import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { TreeDeciduous, BookOpen, Leaf, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { to: "/map", icon: TreeDeciduous, label: "Map", matchPrefixes: ["/map", "/atlas", "/hives", "/hive/"] },
  { to: "/library", icon: BookOpen, label: "Library", matchPrefixes: ["/library", "/vault", "/heartwood", "/dashboard"] },
  { to: "/council-of-life", icon: Leaf, label: "Council", matchPrefixes: ["/council"] },
  { to: "/golden-dream", icon: Sparkles, label: "Dream", matchPrefixes: ["/golden-dream", "/value-tree"] },
] as const;

const BottomNav = () => {
  const { pathname } = useLocation();

  // Always show on mobile — map has its own controls but needs nav back
  const isMap = pathname === "/map";

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[80] md:hidden border-t transition-all duration-300 ${isMap ? "opacity-70 hover:opacity-100" : ""}`}
      style={{
        background: isMap ? "hsl(var(--card) / 0.8)" : "hsl(var(--card) / 0.92)",
        borderColor: "hsl(var(--border) / 0.2)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="flex items-center justify-around py-1.5">
        {NAV_ITEMS.map((item) => {
          const { to, icon: Icon, label } = item;
          const active = item.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] justify-center"
              style={{
                color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)",
              }}
            >
              <Icon className="w-5 h-5" />
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
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
