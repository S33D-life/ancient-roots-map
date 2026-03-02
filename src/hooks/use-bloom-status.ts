/**
 * useBloomStatus — Determines whether a tree species is currently
 * in bloom, fruiting, harvest, or dormant based on food_cycles data.
 */
import { useMemo } from "react";
import { useFoodCycles, type CycleStage } from "@/hooks/use-food-cycles";

export interface BloomStatus {
  stage: CycleStage | null;
  label: string;
  emoji: string;
  isActive: boolean;
}

const STAGE_DISPLAY: Record<CycleStage, { label: string; emoji: string }> = {
  peak:      { label: "Peak bloom", emoji: "✦" },
  flowering: { label: "Currently flowering", emoji: "🌸" },
  fruiting:  { label: "Fruiting", emoji: "🍎" },
  harvest:   { label: "Harvest season", emoji: "🌾" },
  dormant:   { label: "Dormant phase", emoji: "💤" },
};

export function useBloomStatus(speciesName: string | null | undefined): BloomStatus {
  const { foods } = useFoodCycles();

  return useMemo(() => {
    if (!speciesName || foods.length === 0) {
      return { stage: null, label: "Unknown", emoji: "🌿", isActive: false };
    }

    const month = new Date().getMonth() + 1;
    const lower = speciesName.toLowerCase();

    // Try to match species name against food cycle names
    const match = foods.find(f =>
      f.name.toLowerCase().includes(lower) ||
      lower.includes(f.name.toLowerCase()) ||
      (f.scientific_name && f.scientific_name.toLowerCase().includes(lower))
    );

    if (!match) {
      return { stage: null, label: "No seasonal data", emoji: "🌿", isActive: false };
    }

    // Determine current stage
    if (match.peak_months.includes(month)) {
      const d = STAGE_DISPLAY.peak;
      return { stage: "peak", ...d, isActive: true };
    }
    if (match.flowering_months.includes(month)) {
      const d = STAGE_DISPLAY.flowering;
      return { stage: "flowering", ...d, isActive: true };
    }
    if (match.fruiting_months.includes(month)) {
      const d = STAGE_DISPLAY.fruiting;
      return { stage: "fruiting", ...d, isActive: true };
    }
    if (match.harvest_months.includes(month)) {
      const d = STAGE_DISPLAY.harvest;
      return { stage: "harvest", ...d, isActive: true };
    }
    if (match.dormant_months.includes(month)) {
      const d = STAGE_DISPLAY.dormant;
      return { stage: "dormant", ...d, isActive: false };
    }

    return { stage: null, label: "Between cycles", emoji: "🌿", isActive: false };
  }, [speciesName, foods]);
}
