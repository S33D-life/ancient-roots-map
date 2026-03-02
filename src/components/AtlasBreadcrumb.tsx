/**
 * AtlasBreadcrumb — hierarchical navigation for Atlas pages.
 *
 * Usage:
 *   <AtlasBreadcrumb segments={[
 *     { label: "🇨🇭 Switzerland", to: "/atlas/switzerland" },
 *     { label: "Valais", to: "/atlas/switzerland/valais" },
 *     { label: "King of Bavleux" },
 *   ]} />
 */
import { Link } from "react-router-dom";
import { ChevronRight, Globe } from "lucide-react";

export interface BreadcrumbSegment {
  label: string;
  to?: string;
}

interface Props {
  segments: BreadcrumbSegment[];
}

const AtlasBreadcrumb = ({ segments }: Props) => (
  <nav
    aria-label="Atlas breadcrumb"
    className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap sticky top-14 z-30 py-2 px-3 md:static md:z-auto md:p-0 backdrop-blur-md md:backdrop-blur-none"
    style={{ background: 'hsl(var(--background) / 0.85)' }}
  >
    <Link
      to="/atlas"
      className="hover:text-primary transition-colors flex items-center gap-1 shrink-0"
    >
      <Globe className="w-3 h-3" /> Atlas
    </Link>
    {segments.map((seg, i) => (
      <span key={i} className="flex items-center gap-1">
        <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
        {seg.to ? (
          <Link to={seg.to} className="hover:text-primary transition-colors">
            {seg.label}
          </Link>
        ) : (
          <span className="text-foreground">{seg.label}</span>
        )}
      </span>
    ))}
  </nav>
);

export default AtlasBreadcrumb;
