/**
 * SeasonalLensContext — Lightweight seasonal exploration lens.
 * 
 * Provides a simple toggle for seasonal emphasis across the app.
 * Currently supports "spring" lens; designed to extend to summer/autumn/winter.
 */
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

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
  // Future lenses — structure ready
  // summer: { type: "summer", label: "Summer Lens", emoji: "☀️", months: [6, 7, 8], keywords: [...] },
  // autumn: { type: "autumn", label: "Autumn Harvest Lens", emoji: "🍂", months: [9, 10, 11], keywords: [...] },
  // winter: { type: "winter", label: "Winter Rest Lens", emoji: "❄️", months: [12, 1, 2], keywords: [...] },
};

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
  const [activeLens, setActiveLens] = useState<SeasonalLensType>(null);

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
