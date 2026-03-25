/**
 * AtlasPerspectiveNav — Shared toggle for switching between atlas perspectives.
 * Used on WorldAtlas, HivesIndex, and BioRegionsIndex pages.
 */
import { Link, useLocation } from "react-router-dom";
import { Globe, TreeDeciduous, Layers } from "lucide-react";

const PERSPECTIVES = [
  { path: "/atlas", label: "Countries", icon: Globe, desc: "By nation and region" },
  { path: "/hives", label: "Hives", icon: TreeDeciduous, desc: "By species lineage" },
  { path: "/atlas/bio-regions", label: "Bioregions", icon: Layers, desc: "By ecology" },
] as const;

const AtlasPerspectiveNav = () => {
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === "/atlas") return pathname === "/atlas" || pathname === "/atlas/countries";
    return pathname.startsWith(path);
  };

  return (
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
};

export default AtlasPerspectiveNav;
