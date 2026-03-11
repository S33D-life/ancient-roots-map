/**
 * SeasonalLensBanner — Contextual banner shown when ANY seasonal lens is active.
 * Generalized from the former SpringLensBanner to support all four seasons.
 * Displays season-relevant event counts for the current view context.
 */
import { useSeasonalLens } from "@/contexts/SeasonalLensContext";
import { useSeasonalEvents } from "@/hooks/use-seasonal-events";
import { Flower2, Sun, Leaf, Snowflake, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SeasonalLensBannerProps {
  /** Which view context — adjusts messaging */
  context?: "calendar" | "harvest" | "map" | "general";
}

/** Map season to icon component */
const SEASON_ICONS: Record<string, typeof Flower2> = {
  spring: Flower2,
  summer: Sun,
  autumn: Leaf,
  winter: Snowflake,
};

const SeasonalLensBanner = ({ context = "general" }: SeasonalLensBannerProps) => {
  const { activeLens, lensConfig, setLens } = useSeasonalLens();
  const { getEventsForMonth } = useSeasonalEvents();

  if (!activeLens || !lensConfig) return null;

  // Gather events across all lens months
  const lensEvents = lensConfig.months.flatMap(m => getEventsForMonth(m));
  const bloomCount = lensEvents.filter(e => e.type === "flowering" || e.type === "fruiting" || e.type === "peak").length;
  const harvestCount = lensEvents.filter(e => e.source === "harvest_listing").length;

  const Icon = SEASON_ICONS[activeLens] || Flower2;

  const contextMessages: Record<string, string> = {
    calendar: `${bloomCount} bloom events and ${harvestCount} harvest listings across ${lensConfig.label.toLowerCase().replace(" lens", "")} months`,
    harvest: `Showing ${lensConfig.label.toLowerCase().replace(" lens", "")} harvests first · ${harvestCount} seasonal listings`,
    map: `Highlighting ${lensConfig.label.toLowerCase().replace(" lens", "")}-active trees and seasonal locations`,
    general: `${bloomCount} seasonal events · ${harvestCount} harvests`,
  };

  return (
    <AnimatePresence>
      {activeLens && (
        <motion.div
          key={activeLens}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 flex items-center gap-2"
        >
          <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-serif text-primary/80">
              {lensConfig.emoji} {lensConfig.label} active
            </p>
            <p className="text-[9px] text-muted-foreground/60">
              {contextMessages[context]}
            </p>
          </div>
          <button
            onClick={() => setLens(null)}
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
            aria-label="Deactivate seasonal lens"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeasonalLensBanner;
