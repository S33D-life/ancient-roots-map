/**
 * TetolQuickShortcuts — Floating shortcut tools resting in the roots of TETOL.
 * Organic, breathing icons with subtle glow — "tools a wanderer keeps close at hand."
 */
import { Link } from "react-router-dom";
import {
  Smartphone, TreePine, Hexagon, Heart, Sparkles, Map as MapIcon,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface Shortcut {
  to: string;
  label: string;
  icon: LucideIcon;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { to: ROUTES.STAFF_ROOM, label: "Staff Room", icon: TreePine },
  { to: "/library/music-room", label: "Tree Radio", icon: Smartphone },
  { to: ROUTES.MAP, label: "Map", icon: MapIcon },
  { to: "/hives", label: "Hives", icon: Hexagon },
  { to: ROUTES.SUPPORT, label: "Support", icon: Heart },
  { to: ROUTES.VAULT, label: "Vault", icon: Sparkles },
  { to: ROUTES.ROADMAP, label: "Roadmap", icon: MapIcon },
];

interface Props {
  shortcuts?: Shortcut[];
  isLight?: boolean;
}

const TetolQuickShortcuts = ({ shortcuts = DEFAULT_SHORTCUTS, isLight = false }: Props) => {
  return (
    <nav
      aria-label="Quick shortcuts"
      className="flex flex-wrap justify-center gap-3 mt-10 max-w-sm md:max-w-md mx-auto px-4"
    >
      {shortcuts.map((s, i) => {
        const Icon = s.icon;
        return (
          <Link
            key={s.to}
            to={s.to}
            className="tetol-shortcut group flex flex-col items-center gap-1 rounded-2xl px-3 py-2.5 min-w-[56px] border transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              borderColor: "hsl(var(--border) / 0.2)",
              background: isLight
                ? "hsl(var(--card) / 0.45)"
                : "hsl(var(--card) / 0.25)",
              backdropFilter: "blur(12px)",
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_0_12px_hsl(var(--primary)_/_0.35)]"
              style={{
                background: isLight
                  ? "hsl(var(--primary) / 0.08)"
                  : "hsl(var(--primary) / 0.12)",
              }}
            >
              <Icon
                className="w-4 h-4 transition-colors duration-300"
                style={{ color: "hsl(var(--primary) / 0.7)" }}
              />
            </div>
            <span
              className="text-[9px] font-serif tracking-[0.12em] leading-none transition-colors duration-300"
              style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}
            >
              {s.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default TetolQuickShortcuts;
