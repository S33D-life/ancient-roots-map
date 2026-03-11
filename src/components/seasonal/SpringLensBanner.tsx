/**
 * SpringLensBanner — Subtle contextual banner shown when Spring Lens is active.
 * Displays spring-relevant data summary for the current view.
 */
import { useSeasonalLens } from "@/contexts/SeasonalLensContext";
import { useSeasonalEvents } from "@/hooks/use-seasonal-events";
import { Flower2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface SpringLensBannerProps {
  /** Which view context — adjusts messaging */
  context?: "calendar" | "harvest" | "map" | "general";
}

const SPRING_MONTHS = [3, 4, 5];

const SpringLensBanner = ({ context = "general" }: SpringLensBannerProps) => {
  const { activeLens, setLens, matchesLens } = useSeasonalLens();
  const { getEventsForMonth } = useSeasonalEvents();

  if (activeLens !== "spring") return null;

  // Gather spring events across all spring months
  const springEvents = SPRING_MONTHS.flatMap(m => getEventsForMonth(m));
  const bloomCount = springEvents.filter(e => e.type === "flowering" || e.type === "fruiting").length;
  const harvestCount = springEvents.filter(e => e.source === "harvest_listing").length;

  const contextMessages: Record<string, string> = {
    calendar: `${bloomCount} bloom events and ${harvestCount} harvest listings across spring months`,
    harvest: `Showing spring harvests first · ${harvestCount} spring listings`,
    map: `Highlighting spring-active trees and bloom locations`,
    general: `${bloomCount} blooming species · ${harvestCount} spring harvests`,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 flex items-center gap-2"
      >
        <Flower2 className="w-3.5 h-3.5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-serif text-primary/80">
            🌸 Spring Lens active
          </p>
          <p className="text-[9px] text-muted-foreground/60">
            {contextMessages[context]}
          </p>
        </div>
        <button
          onClick={() => setLens(null)}
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default SpringLensBanner;
