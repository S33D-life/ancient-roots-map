/**
 * useSeasonalSummary — Derived seasonal sub-counts for the active lens.
 *
 * Provides event totals (bloom, harvest, dormant) scoped to the active
 * seasonal lens months. Consumed by GrovePulse, HivePage, Roadmap,
 * and FireflyGuidance for contextual seasonal overlays.
 */
import { useMemo } from "react";
import { useSeasonalLens } from "@/contexts/SeasonalLensContext";
import { useSeasonalEvents } from "@/hooks/use-seasonal-events";

export interface SeasonalSummary {
  active: boolean;
  season: string | null;
  emoji: string;
  label: string;
  bloomCount: number;
  harvestCount: number;
  dormantCount: number;
  totalEvents: number;
  /** Short human-readable line, e.g. "3 blooms · 5 harvests" */
  summaryLine: string;
}

const EMPTY: SeasonalSummary = {
  active: false,
  season: null,
  emoji: "",
  label: "",
  bloomCount: 0,
  harvestCount: 0,
  dormantCount: 0,
  totalEvents: 0,
  summaryLine: "",
};

export function useSeasonalSummary(): SeasonalSummary {
  const { activeLens, lensConfig } = useSeasonalLens();
  const { getEventsForMonth } = useSeasonalEvents();

  return useMemo(() => {
    if (!activeLens || !lensConfig) return EMPTY;

    const events = lensConfig.months.flatMap(m => getEventsForMonth(m));
    const bloomCount = events.filter(e => e.type === "flowering" || e.type === "fruiting" || e.type === "peak").length;
    const harvestCount = events.filter(e => e.source === "harvest_listing").length;
    const dormantCount = events.filter(e => e.type === "dormant").length;

    const parts: string[] = [];
    if (bloomCount > 0) parts.push(`${bloomCount} bloom${bloomCount !== 1 ? "s" : ""}`);
    if (harvestCount > 0) parts.push(`${harvestCount} harvest${harvestCount !== 1 ? "s" : ""}`);
    if (dormantCount > 0) parts.push(`${dormantCount} dormant`);
    if (parts.length === 0) parts.push("No seasonal events");

    return {
      active: true,
      season: activeLens,
      emoji: lensConfig.emoji,
      label: lensConfig.label,
      bloomCount,
      harvestCount,
      dormantCount,
      totalEvents: events.length,
      summaryLine: parts.join(" · "),
    };
  }, [activeLens, lensConfig, getEventsForMonth]);
}
