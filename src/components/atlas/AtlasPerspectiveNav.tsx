/**
 * AtlasPerspectiveNav — Shared toggle for switching between atlas perspectives.
 * Used on WorldAtlas, HivesIndex, and BioRegionsIndex pages.
 */
import { Link, useLocation } from "react-router-dom";
import { Globe, TreeDeciduous, Layers } from "lucide-react";

interface AtlasPerspectiveNavProps {
  /** Show one-line descriptions below the pills */
  showDescriptions?: boolean;
}

const PERSPECTIVES = [
  { path: "/atlas", label: "Countries", icon: Globe, desc: "Cultural & political gateways" },
  { path: "/hives", label: "Hives", icon: TreeDeciduous, desc: "Species & botanical families" },
  { path: "/atlas/bio-regions", label: "Bioregions", icon: Layers, desc: "Ecological landscapes" },
] as const;

const AtlasPerspectiveNav = ({ showDescriptions = false }: AtlasPerspectiveNavProps) => {
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === "/atlas") return pathname === "/atlas" || pathname === "/atlas/countries";
    return pathname.startsWith(path);
  };

  const nav = (
    <nav className="flex items-center justify-center gap-1 py-1" aria-label="Atlas perspective">
      {PERSPECTIVES.map((p) => {
        const active = isActive(p.path);
        return (
          <Link
            key={p.path}
            to={p.path}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif transition-all ${
              active
                ? "bg-primary/12 text-primary border border-primary/25"
                : "text-muted-foreground/60 hover:text-muted-foreground border border-transparent hover:border-border/30"
            }`}
          >
            <p.icon className="w-3 h-3" />
            <span className={active ? "font-medium" : ""}>{p.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  if (!showDescriptions) return nav;

  return (
    <div className="space-y-2">
      {nav}
      <div className="flex justify-center gap-4 text-[9px] font-serif text-muted-foreground/50">
        {PERSPECTIVES.map((p) => (
          <span key={p.path} className="flex items-center gap-1">
            <p.icon className="w-2.5 h-2.5" />
            {p.desc}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AtlasPerspectiveNav;
