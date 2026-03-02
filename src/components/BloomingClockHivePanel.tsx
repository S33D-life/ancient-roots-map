/**
 * BloomingClockHivePanel — Shows which hives are active in the selected month.
 * Sits below the BloomingClockFace in the atlas filter panel.
 * Clicking a hive navigates to the hive page or focuses the map.
 */
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useHiveSeasonalStatus, type HiveSeasonalStatus } from "@/hooks/use-hive-seasonal-status";
import { useHiveSeasonFilter } from "@/contexts/HiveSeasonContext";

interface BloomingClockHivePanelProps {
  monthOverride?: number;
}

export default function BloomingClockHivePanel({ monthOverride }: BloomingClockHivePanelProps) {
  const navigate = useNavigate();
  const { activeHives, fruitingHives } = useHiveSeasonalStatus(monthOverride);
  const { activeHiveFamily, setActiveHive } = useHiveSeasonFilter();

  // Show fruiting hives first, then other active hives
  const displayHives = [...fruitingHives];
  for (const h of activeHives) {
    if (!displayHives.find(d => d.hive.family === h.hive.family)) {
      displayHives.push(h);
    }
  }

  if (displayHives.length === 0) return null;

  const handleHiveClick = (status: HiveSeasonalStatus) => {
    if (activeHiveFamily === status.hive.family) {
      setActiveHive(null); // toggle off
    } else {
      setActiveHive(status.hive.family);
    }
  };

  return (
    <div className="pt-2 space-y-1.5">
      <p className="text-[9px] font-serif text-muted-foreground uppercase tracking-widest text-center">
        Active Hives
      </p>
      <div className="flex flex-wrap gap-1 justify-center max-h-24 overflow-y-auto">
        {displayHives.slice(0, 12).map(status => {
          const isSelected = activeHiveFamily === status.hive.family;
          return (
            <button
              key={status.hive.family}
              onClick={() => handleHiveClick(status)}
              onDoubleClick={() => navigate(`/hive/${status.hive.slug}`)}
              title={`${status.hive.displayName} — ${status.label}. Double-click to visit.`}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-serif
                border transition-all cursor-pointer
                ${isSelected
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/40 bg-card/40 text-muted-foreground hover:border-primary/30"
                }
              `}
            >
              <span>{status.emoji}</span>
              <span className="truncate max-w-[60px]">{status.hive.displayName.replace(" Hive", "")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
