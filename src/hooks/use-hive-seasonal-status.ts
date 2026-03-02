/**
 * useHiveSeasonalStatus — Bridges food_cycles seasonal data to Hive families.
 * 
 * Computes which hives are currently in which seasonal phase (flowering, fruiting,
 * harvest, dormant) by matching food_cycle species names against hive family patterns.
 * 
 * This is the SINGLE source of truth for hive seasonal state.
 * The Blooming Clock and Map both read from this hook.
 */
import { useMemo } from "react";
import { useFoodCycles, type FoodCycle, type CycleStage } from "@/hooks/use-food-cycles";
import { getAllHives, getHiveForSpecies, type HiveInfo } from "@/utils/hiveUtils";

export interface HiveSeasonalStatus {
  hive: HiveInfo;
  stage: CycleStage | null;
  /** All food cycles that matched this hive */
  matchedFoods: FoodCycle[];
  /** Human label */
  label: string;
  /** Emoji for the phase */
  emoji: string;
  /** Whether the hive is in an active (non-dormant) phase */
  isActive: boolean;
  /** Fruit icon to show on map */
  fruitIcon: string;
}

const STAGE_META: Record<CycleStage, { label: string; emoji: string; fruitIcon: string }> = {
  peak:      { label: "Peak Season",         emoji: "✦", fruitIcon: "✦" },
  flowering: { label: "Currently Flowering",  emoji: "🌸", fruitIcon: "🌸" },
  fruiting:  { label: "Currently Fruiting",   emoji: "🍎", fruitIcon: "🍎" },
  harvest:   { label: "Harvest Season",       emoji: "🌾", fruitIcon: "🌾" },
  dormant:   { label: "Dormant",              emoji: "💤", fruitIcon: "" },
};

function getBestStage(food: FoodCycle, month: number): CycleStage | null {
  if (food.peak_months.includes(month)) return "peak";
  if (food.harvest_months.includes(month)) return "harvest";
  if (food.fruiting_months.includes(month)) return "fruiting";
  if (food.flowering_months.includes(month)) return "flowering";
  if (food.dormant_months.includes(month)) return "dormant";
  return null;
}

/**
 * Returns seasonal status for all hives, computed once per session.
 * Uses optional monthOverride for time-travel (Blooming Clock dial).
 */
export function useHiveSeasonalStatus(monthOverride?: number): {
  statuses: HiveSeasonalStatus[];
  loading: boolean;
  /** Get status for a specific hive family */
  getStatusForFamily: (family: string) => HiveSeasonalStatus | undefined;
  /** Get all hives currently fruiting */
  fruitingHives: HiveSeasonalStatus[];
  /** Get all hives currently in any active phase */
  activeHives: HiveSeasonalStatus[];
} {
  const { foods, loading } = useFoodCycles();

  const statuses = useMemo(() => {
    if (foods.length === 0) return [];
    
    const month = monthOverride ?? (new Date().getMonth() + 1);
    const allHives = getAllHives();
    const hiveStatusMap = new Map<string, HiveSeasonalStatus>();

    // Initialize all hives
    for (const hive of allHives) {
      hiveStatusMap.set(hive.family, {
        hive,
        stage: null,
        matchedFoods: [],
        label: "No seasonal data",
        emoji: "🌿",
        isActive: false,
        fruitIcon: "",
      });
    }

    // Match food cycles to hives by species name
    for (const food of foods) {
      const hive = getHiveForSpecies(food.name) || 
                   (food.scientific_name ? getHiveForSpecies(food.scientific_name) : null);
      if (!hive) continue;

      const existing = hiveStatusMap.get(hive.family);
      if (!existing) continue;

      const stage = getBestStage(food, month);
      if (!stage) continue;

      existing.matchedFoods.push(food);

      // Pick the most "active" stage (priority: peak > fruiting > harvest > flowering > dormant)
      const PRIORITY: CycleStage[] = ["peak", "fruiting", "harvest", "flowering", "dormant"];
      const currentPriority = existing.stage ? PRIORITY.indexOf(existing.stage) : 999;
      const newPriority = PRIORITY.indexOf(stage);
      
      if (newPriority < currentPriority) {
        const meta = STAGE_META[stage];
        existing.stage = stage;
        existing.label = meta.label;
        existing.emoji = meta.emoji;
        existing.isActive = stage !== "dormant";
        existing.fruitIcon = meta.fruitIcon;
      }
    }

    return Array.from(hiveStatusMap.values());
  }, [foods, monthOverride]);

  const getStatusForFamily = useMemo(() => {
    const map = new Map(statuses.map(s => [s.hive.family, s]));
    return (family: string) => map.get(family);
  }, [statuses]);

  const fruitingHives = useMemo(
    () => statuses.filter(s => s.stage === "fruiting" || s.stage === "peak" || s.stage === "harvest"),
    [statuses]
  );

  const activeHives = useMemo(
    () => statuses.filter(s => s.isActive),
    [statuses]
  );

  return { statuses, loading, getStatusForFamily, fruitingHives, activeHives };
}
