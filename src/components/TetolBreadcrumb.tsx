import { Link } from "react-router-dom";
import { useTetolLevel } from "@/contexts/TetolLevelContext";
import { Sprout, TreeDeciduous, BookOpen, Leaf, Sparkles, Flame } from "lucide-react";

const LEVEL_ICONS: Record<string, React.ElementType> = {
  s33d: Sprout,
  roots: TreeDeciduous,
  heartwood: BookOpen,
  canopy: Leaf,
  crown: Sparkles,
  hearth: Flame,
};

const LEVEL_ROUTES: Record<string, string> = {
  s33d: "/",
  roots: "/map",
  heartwood: "/library",
  canopy: "/council-of-life",
  crown: "/golden-dream",
  hearth: "/dashboard",
};

interface TetolBreadcrumbProps {
  /** Optional page-specific label, e.g. tree name */
  pageLabel?: string;
}

const TetolBreadcrumb = ({ pageLabel }: TetolBreadcrumbProps) => {
  const { level, label, subtitle } = useTetolLevel();
  const Icon = LEVEL_ICONS[level];

  if (level === "s33d") return null; // No breadcrumb on home

  return (
    <nav
      aria-label="TETOL breadcrumb"
      className="flex items-center gap-1.5 text-[11px] font-serif text-muted-foreground/70 px-4 py-1.5 select-none"
    >
      <Link to="/" className="hover:text-primary transition-colors">
        <Sprout className="w-3 h-3 inline -mt-px" />
        <span className="ml-1">S33D</span>
      </Link>
      <span className="text-border/50">›</span>
      <Link
        to={LEVEL_ROUTES[level]}
        className="inline-flex items-center gap-1 hover:text-primary transition-colors text-level-accent"
        style={{ color: "hsl(var(--level-accent))" }}
      >
        <Icon className="w-3 h-3" />
        {label}
      </Link>
      {pageLabel && (
        <>
          <span className="text-border/50">›</span>
          <span className="text-foreground/60 truncate max-w-[200px]">{pageLabel}</span>
        </>
      )}
    </nav>
  );
};

export default TetolBreadcrumb;
