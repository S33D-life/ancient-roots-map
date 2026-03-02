/**
 * usePhenology — React hook for consuming phenology data.
 * Wraps PhenologyService for component use.
 */
import { useState, useEffect, useCallback } from "react";
import { phenologyService, type PhenologySignal, type PhenologyRegion } from "@/services/phenology";

export interface UsePhenologyOptions {
  speciesKey?: string;
  region?: PhenologyRegion;
  enabled?: boolean;
}

export function usePhenology({ speciesKey, region, enabled = true }: UsePhenologyOptions = {}) {
  const [signal, setSignal] = useState<PhenologySignal | null>(null);
  const [signals, setSignals] = useState<PhenologySignal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const r = region || { hemisphere: "north" as const };

    if (speciesKey) {
      setLoading(true);
      phenologyService.getSpeciesPhase(speciesKey, r)
        .then(s => setSignal(s))
        .catch(() => setSignal(null))
        .finally(() => setLoading(false));
    } else {
      // Get all signals for today
      const today = new Date();
      setLoading(true);
      phenologyService.getSignals(r, { from: today, to: today })
        .then(s => setSignals(s))
        .catch(() => setSignals([]))
        .finally(() => setLoading(false));
    }
  }, [speciesKey, region?.bioregionId, enabled]);

  return { signal, signals, loading };
}

/** Phase display helpers */
const PHASE_DISPLAY: Record<string, { label: string; emoji: string; color: string }> = {
  dormant:   { label: "Dormant",   emoji: "💤", color: "hsl(220, 20%, 50%)" },
  budding:   { label: "Budding",   emoji: "🌱", color: "hsl(120, 50%, 45%)" },
  flowering: { label: "Flowering", emoji: "🌸", color: "hsl(340, 60%, 65%)" },
  fruiting:  { label: "Fruiting",  emoji: "🍎", color: "hsl(30, 70%, 50%)" },
  leaf_fall: { label: "Leaf fall", emoji: "🍂", color: "hsl(35, 60%, 45%)" },
  peak:      { label: "Peak",      emoji: "✦",  color: "hsl(42, 85%, 60%)" },
  unknown:   { label: "Unknown",   emoji: "🌿", color: "hsl(150, 30%, 50%)" },
};

export function getPhaseDisplay(phase: string) {
  return PHASE_DISPLAY[phase] || PHASE_DISPLAY.unknown;
}

const CONFIDENCE_LABELS: Record<string, string> = {
  low: "Estimated",
  medium: "Likely",
  high: "Confirmed",
};

export function getConfidenceLabel(confidence: string) {
  return CONFIDENCE_LABELS[confidence] || "Estimated";
}
