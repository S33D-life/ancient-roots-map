import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { TreeDeciduous, BookOpen, Leaf, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { to: "/map", icon: TreeDeciduous, label: "Roots", matchPrefixes: ["/map", "/atlas", "/hives", "/hive/"] },
  { to: "/library", icon: BookOpen, label: "Trunk", matchPrefixes: ["/library", "/vault", "/heartwood", "/dashboard"] },
  { to: "/council-of-life", icon: Leaf, label: "Canopy", matchPrefixes: ["/council"] },
  { to: "/golden-dream", icon: Sparkles, label: "Crown", matchPrefixes: ["/golden-dream", "/value-tree"] },
] as const;

const BottomNav = () => {
  const { pathname } = useLocation();

  // Hide only on the fullscreen map
  if (pathname === "/map") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[80] md:hidden border-t"
      style={{
        background: "hsl(var(--card) / 0.92)",
        borderColor: "hsl(var(--border) / 0.3)",
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
              className="relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-0"
              style={{
                color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.55)",
              }}
            >
              <motion.div
                animate={active ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <span className="text-[10px] font-serif tracking-wider">{label}</span>
              {active && (
                <motion.span
                  layoutId="bottomnav-indicator"
                  className="absolute -bottom-1 w-8 h-0.5 rounded-full"
                  style={{ background: "hsl(var(--primary))" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
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
