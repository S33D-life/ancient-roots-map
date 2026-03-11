/**
 * SpeciesBadgeList — displays species discovery badges.
 * Compact grid for profile display.
 */
import type { SpeciesBadge } from "@/hooks/use-species-badges";
import { Badge } from "@/components/ui/badge";
import { getHiveInfo } from "@/utils/hiveUtils";

interface Props {
  badges: SpeciesBadge[];
  maxDisplay?: number;
}

const SpeciesBadgeList = ({ badges, maxDisplay = 12 }: Props) => {
  if (!badges || badges.length === 0) return null;

  const displayed = badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  return (
    <div className="space-y-2">
      <p className="text-xs font-serif text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        🏅 Species Discoveries ({badges.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {displayed.map(b => {
          const hive = getHiveInfo(b.species_name);
          return (
            <Badge
              key={b.id}
              variant="outline"
              className="text-[10px] font-serif gap-1 cursor-default"
              style={{ borderColor: `hsl(${hive.accentHsl} / 0.4)` }}
            >
              <span>{hive.icon}</span>
              <span>{b.badge_name}</span>
              {b.trees_mapped > 1 && (
                <span className="text-muted-foreground">×{b.trees_mapped}</span>
              )}
            </Badge>
          );
        })}
        {remaining > 0 && (
          <Badge variant="secondary" className="text-[10px] font-serif">
            +{remaining} more
          </Badge>
        )}
      </div>
    </div>
  );
};

export default SpeciesBadgeList;
