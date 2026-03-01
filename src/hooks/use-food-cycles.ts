/**
 * useFoodCycles — Blooming Clock / Global Seasonal Atlas
 *
 * Fetches food cycle data and computes which regions are in which stage
 * based on the current month. Supports hemisphere-aware logic.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CycleStage = "flowering" | "fruiting" | "harvest" | "dormant" | "peak";

export interface FoodCycleRegion {
  country: string;
  name: string;
  lat: number;
  lng: number;
}

export interface FoodCycle {
  id: string;
  name: string;
  scientific_name: string | null;
  icon: string;
  hemisphere: string;
  regions: FoodCycleRegion[];
  flowering_months: number[];
  fruiting_months: number[];
  harvest_months: number[];
  dormant_months: number[];
  peak_months: number[];
  notes: string | null;
  cultural_associations: string | null;
  sort_order: number;
}

export interface RegionStageInfo {
  region: FoodCycleRegion;
  food: FoodCycle;
  stage: CycleStage;
  isPeak: boolean;
}

/** Visual language for each stage */
export const STAGE_VISUALS: Record<CycleStage, {
  color: string;
  glowColor: string;
  label: string;
  icon: string;
}> = {
  flowering: {
    color: "hsl(340, 60%, 70%)",
    glowColor: "hsla(340, 55%, 65%, 0.3)",
    label: "Flowering",
    icon: "🌸",
  },
  fruiting: {
    color: "hsl(120, 45%, 55%)",
    glowColor: "hsla(120, 50%, 50%, 0.25)",
    label: "Fruiting",
    icon: "🌿",
  },
  harvest: {
    color: "hsl(35, 75%, 55%)",
    glowColor: "hsla(35, 70%, 50%, 0.35)",
    label: "Harvest",
    icon: "🌾",
  },
  dormant: {
    color: "hsl(220, 20%, 50%)",
    glowColor: "hsla(220, 20%, 45%, 0.15)",
    label: "Dormant",
    icon: "💤",
  },
  peak: {
    color: "hsl(42, 85%, 60%)",
    glowColor: "hsla(42, 80%, 55%, 0.4)",
    label: "Peak",
    icon: "✦",
  },
};

function getCurrentStage(food: FoodCycle, month: number): CycleStage | null {
  if (food.peak_months.includes(month)) return "peak";
  if (food.harvest_months.includes(month)) return "harvest";
  if (food.fruiting_months.includes(month)) return "fruiting";
  if (food.flowering_months.includes(month)) return "flowering";
  if (food.dormant_months.includes(month)) return "dormant";
  return null;
}

export function useFoodCycles() {
  const [foods, setFoods] = useState<FoodCycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("food_cycles")
        .select("*")
        .order("sort_order");

      if (data) {
        setFoods(data.map(d => ({
          ...d,
          regions: (d.regions as any) || [],
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  return { foods, loading };
}

/**
 * Given selected foods and an optional stage filter, compute which regions
 * should be highlighted and with what visual style.
 */
export function computeRegionStages(
  foods: FoodCycle[],
  selectedFoodIds: string[],
  stageFilter: CycleStage | "all",
  monthOverride?: number,
): RegionStageInfo[] {
  const month = monthOverride ?? (new Date().getMonth() + 1);
  const results: RegionStageInfo[] = [];

  const selectedFoods = selectedFoodIds.length > 0
    ? foods.filter(f => selectedFoodIds.includes(f.id))
    : foods;

  for (const food of selectedFoods) {
    const stage = getCurrentStage(food, month);
    if (!stage) continue;
    if (stageFilter !== "all" && stage !== stageFilter) continue;

    for (const region of food.regions) {
      results.push({
        region,
        food,
        stage,
        isPeak: food.peak_months.includes(month),
      });
    }
  }

  return results;
}
