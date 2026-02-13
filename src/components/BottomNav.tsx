import { Link, useLocation } from "react-router-dom";
import { TreeDeciduous, BookOpen, Flame, Radio } from "lucide-react";

/**
 * Persistent mobile bottom navigation bar — provides instant access to the
 * four core S33D spaces without opening the full TETOL menu.
 * Only visible on mobile (md:hidden). Hidden on the map page (which is fullscreen).
 */

const NAV_ITEMS = [
  { to: "/map", icon: TreeDeciduous, label: "Atlas" },
  { to: "/library", icon: BookOpen, label: "Library" },
  { to: "/radio", icon: Radio, label: "Radio" },
  { to: "/dashboard", icon: Flame, label: "Hearth" },
] as const;

const BottomNav = () => {
  const { pathname } = useLocation();

  // Hide on fullscreen pages
  if (pathname === "/map" || pathname === "/atlas") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[80] md:hidden border-t backdrop-blur-lg"
      style={{
        background: "hsl(var(--card) / 0.92)",
        borderColor: "hsl(var(--border) / 0.3)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around py-1.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors"
              style={{
                color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.6)",
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-serif tracking-wider">{label}</span>
              {active && (
                <span
                  className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ background: "hsl(var(--primary))" }}
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
