/**
 * useSeasonalEvents — Unified seasonal event stream.
 *
 * Merges food_cycles (blooming/fruiting/harvest), harvest_listings,
 * and bioregion seasonal markers into a single event interface.
 * 
 * Consumed by:
 *   - Cosmic Calendar (date-level event rendering)
 *   - TEOTAG (contextual seasonal awareness)
 *   - Map (seasonal layer indicators)
 *   - Harvest page (seasonal discovery sidebar)
 */
import { useMemo } from "react";
import { useFoodCycles, type FoodCycle, type CycleStage, STAGE_VISUALS } from "@/hooks/use-food-cycles";
import { useHarvestListings, CATEGORY_LABELS, AVAILABILITY_LABELS, MONTHS, type HarvestListing } from "@/hooks/use-harvest-listings";

export type SeasonalEventSource = "food_cycle" | "harvest_listing" | "bioregion_marker";
export type SeasonalEventType = "flowering" | "fruiting" | "harvest" | "peak" | "dormant" | "listing_available" | "listing_upcoming" | "listing_finished";

export interface SeasonalEvent {
  id: string;
  source: SeasonalEventSource;
  type: SeasonalEventType;
  title: string;
  subtitle?: string;
  emoji: string;
  /** Month range (1-12) */
  monthStart: number;
  monthEnd: number;
  /** Optional links for cross-navigation */
  links?: {
    harvestId?: string;
    treeId?: string;
    mapLocation?: { lat: number; lng: number };
    calendarMonth?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Returns all seasonal events for a given month, merged from multiple sources.
 */
export function useSeasonalEvents(month?: number) {
  const currentMonth = month ?? (new Date().getMonth() + 1);
  const { foods, loading: foodsLoading } = useFoodCycles();
  const { data: listings, isLoading: harvestLoading } = useHarvestListings();

  const allEvents = useMemo(() => {
    const events: SeasonalEvent[] = [];

    // 1. Food cycles → seasonal events
    for (const food of foods) {
      addFoodCycleEvents(food, events);
    }

    // 2. Harvest listings → seasonal events
    if (listings) {
      for (const listing of listings) {
        addHarvestListingEvents(listing, events);
      }
    }

    return events;
  }, [foods, listings]);

  // Filter to active events for the given month
  const activeEvents = useMemo(() => {
    return allEvents.filter(e => isMonthInRange(currentMonth, e.monthStart, e.monthEnd));
  }, [allEvents, currentMonth]);

  // Group by type
  const groupedEvents = useMemo(() => {
    const groups: Record<string, SeasonalEvent[]> = {};
    for (const e of activeEvents) {
      const key = e.source;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }
    return groups;
  }, [activeEvents]);

  // Harvest-specific events (for calendar integration)
  const harvestEvents = useMemo(() => {
    return activeEvents.filter(e => e.source === "harvest_listing");
  }, [activeEvents]);

  // Blooming/fruiting events (for calendar integration)
  const bloomEvents = useMemo(() => {
    return activeEvents.filter(e => e.source === "food_cycle" && (e.type === "flowering" || e.type === "fruiting" || e.type === "peak"));
  }, [activeEvents]);

  return {
    allEvents,
    activeEvents,
    groupedEvents,
    harvestEvents,
    bloomEvents,
    loading: foodsLoading || harvestLoading,
    /** Get events for any arbitrary month */
    getEventsForMonth: (m: number) => allEvents.filter(e => isMonthInRange(m, e.monthStart, e.monthEnd)),
  };
}

/* ── Helpers ── */

function addFoodCycleEvents(food: FoodCycle, events: SeasonalEvent[]) {
  const baseId = `fc-${food.id}`;

  if (food.flowering_months.length > 0) {
    const start = Math.min(...food.flowering_months);
    const end = Math.max(...food.flowering_months);
    events.push({
      id: `${baseId}-flowering`,
      source: "food_cycle",
      type: "flowering",
      title: `${food.name} flowering`,
      subtitle: food.scientific_name || undefined,
      emoji: food.icon || "🌸",
      monthStart: start,
      monthEnd: end,
      metadata: { foodId: food.id, stage: "flowering" },
    });
  }

  if (food.fruiting_months.length > 0) {
    const start = Math.min(...food.fruiting_months);
    const end = Math.max(...food.fruiting_months);
    events.push({
      id: `${baseId}-fruiting`,
      source: "food_cycle",
      type: "fruiting",
      title: `${food.name} fruiting`,
      subtitle: food.scientific_name || undefined,
      emoji: food.icon || "🌿",
      monthStart: start,
      monthEnd: end,
      metadata: { foodId: food.id, stage: "fruiting" },
    });
  }

  if (food.harvest_months.length > 0) {
    const start = Math.min(...food.harvest_months);
    const end = Math.max(...food.harvest_months);
    events.push({
      id: `${baseId}-harvest`,
      source: "food_cycle",
      type: "harvest",
      title: `${food.name} harvest`,
      subtitle: food.scientific_name || undefined,
      emoji: food.icon || "🌾",
      monthStart: start,
      monthEnd: end,
      metadata: { foodId: food.id, stage: "harvest" },
    });
  }

  if (food.peak_months.length > 0) {
    const start = Math.min(...food.peak_months);
    const end = Math.max(...food.peak_months);
    events.push({
      id: `${baseId}-peak`,
      source: "food_cycle",
      type: "peak",
      title: `${food.name} peak season`,
      subtitle: food.scientific_name || undefined,
      emoji: food.icon || "✦",
      monthStart: start,
      monthEnd: end,
      metadata: { foodId: food.id, stage: "peak" },
    });
  }
}

function addHarvestListingEvents(listing: HarvestListing, events: SeasonalEvent[]) {
  if (!listing.harvest_month_start) return;

  const cat = CATEGORY_LABELS[listing.category];
  const avail = AVAILABILITY_LABELS[listing.availability_type];
  const statusType: SeasonalEventType =
    listing.status === "available" ? "listing_available"
      : listing.status === "upcoming" ? "listing_upcoming"
        : "listing_finished";

  events.push({
    id: `hl-${listing.id}`,
    source: "harvest_listing",
    type: statusType,
    title: listing.produce_name,
    subtitle: listing.location_name || undefined,
    emoji: cat?.emoji || "🌿",
    monthStart: listing.harvest_month_start,
    monthEnd: listing.harvest_month_end || listing.harvest_month_start,
    links: {
      harvestId: listing.id,
      treeId: listing.tree_id || undefined,
      mapLocation: listing.latitude && listing.longitude
        ? { lat: listing.latitude, lng: listing.longitude }
        : undefined,
      calendarMonth: listing.harvest_month_start,
    },
    metadata: {
      category: listing.category,
      availabilityType: listing.availability_type,
      status: listing.status,
      guardianId: listing.guardian_id,
      availLabel: avail?.label,
    },
  });
}

function isMonthInRange(month: number, start: number, end: number): boolean {
  if (start <= end) return month >= start && month <= end;
  return month >= start || month <= end;
}
