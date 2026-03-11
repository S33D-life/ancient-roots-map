/**
 * SeasonalLensContext — Seasonal exploration lens with session persistence.
 * 
 * Supports spring, summer, autumn, winter lenses.
 * The active lens persists across navigation via sessionStorage.
 * The Blooming Clock Dial is the primary activation interface.
 */
import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";

export type SeasonalLensType = "spring" | "summer" | "autumn" | "winter" | null;

export interface SeasonalLensConfig {
  type: SeasonalLensType;
  label: string;
  emoji: string;
  /** Months this lens emphasises (1-12) */
  months: number[];
  /** Keywords to boost in search/discovery */
  keywords: string[];
}

const LENS_CONFIGS: Record<string, SeasonalLensConfig> = {
  spring: {
    type: "spring",
    label: "Spring Lens",
    emoji: "🌸",
    months: [3, 4, 5],
    keywords: ["blossom", "flowering", "planting", "spring", "bloom", "cherry", "apple", "pear", "pollination", "seedling"],
  },
  summer: {
    type: "summer",
    label: "Summer Lens",
    emoji: "☀️",
    months: [6, 7, 8],
    keywords: ["summer", "fruiting", "growth", "canopy", "shade", "ripening", "solstice", "nectar", "pollinator", "abundance"],
  },
  autumn: {
    type: "autumn",
    label: "Autumn Harvest Lens",
    emoji: "🍂",
    months: [9, 10, 11],
    keywords: ["harvest", "autumn", "fall", "nut", "fruit", "walnut", "acorn", "cider", "mushroom", "seed gathering", "equinox"],
  },
  winter: {
    type: "winter",
    label: "Winter Rest Lens",
    emoji: "❄️",
    months: [12, 1, 2],
    keywords: ["winter", "dormant", "rest", "evergreen", "solstice", "bare", "frost", "hibernation", "pruning", "mulch"],
  },
};

const STORAGE_KEY = "s33d-seasonal-lens";

/** Restore persisted lens from sessionStorage */
function restoreLens(): SeasonalLensType {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && (stored === "spring" || stored === "summer" || stored === "autumn" || stored === "winter")) {
      return stored as SeasonalLensType;
    }
  } catch {
    // sessionStorage may be unavailable
  }
  return null;
}

/** Persist lens to sessionStorage */
function persistLens(lens: SeasonalLensType) {
  try {
    if (lens) {
      sessionStorage.setItem(STORAGE_KEY, lens);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

interface SeasonalLensContextValue {
  activeLens: SeasonalLensType;
  lensConfig: SeasonalLensConfig | null;
  setLens: (lens: SeasonalLensType) => void;
  toggleSpringLens: () => void;
  /** Check if a month falls within the active lens */
  isLensMonth: (month: number) => boolean;
  /** Check if content matches lens keywords */
  matchesLens: (text: string) => boolean;
}

const SeasonalLensContext = createContext<SeasonalLensContextValue | null>(null);

export const SeasonalLensProvider = ({ children }: { children: ReactNode }) => {
  const [activeLens, setActiveLens] = useState<SeasonalLensType>(restoreLens);

  // Persist whenever lens changes
  useEffect(() => {
    persistLens(activeLens);
  }, [activeLens]);

  const lensConfig = useMemo(
    () => (activeLens ? LENS_CONFIGS[activeLens] ?? null : null),
    [activeLens]
  );

  const setLens = useCallback((lens: SeasonalLensType) => {
    setActiveLens(lens);
  }, []);

  const toggleSpringLens = useCallback(() => {
    setActiveLens(prev => (prev === "spring" ? null : "spring"));
  }, []);

  const isLensMonth = useCallback(
    (month: number) => lensConfig?.months.includes(month) ?? false,
    [lensConfig]
  );

  const matchesLens = useCallback(
    (text: string) => {
      if (!lensConfig) return false;
      const lower = text.toLowerCase();
      return lensConfig.keywords.some(k => lower.includes(k));
    },
    [lensConfig]
  );

  const value = useMemo<SeasonalLensContextValue>(
    () => ({ activeLens, lensConfig, setLens, toggleSpringLens, isLensMonth, matchesLens }),
    [activeLens, lensConfig, setLens, toggleSpringLens, isLensMonth, matchesLens]
  );

  return (
    <SeasonalLensContext.Provider value={value}>
      {children}
    </SeasonalLensContext.Provider>
  );
};

export const useSeasonalLens = () => {
  const ctx = useContext(SeasonalLensContext);
  if (!ctx) throw new Error("useSeasonalLens must be used within SeasonalLensProvider");
  return ctx;
};

export { LENS_CONFIGS };
