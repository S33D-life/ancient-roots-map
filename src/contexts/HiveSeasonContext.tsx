/**
 * HiveSeasonContext — Global shared state for hive/season filtering.
 * 
 * Map and Blooming Clock share this state so clicking a fruit on the map
 * or a segment on the clock both update the same filter.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface HiveSeasonState {
  /** Currently focused hive family (e.g. "Rosaceae") */
  activeHiveFamily: string | null;
  /** Currently focused seasonal phase */
  activeSeasonPhase: string | null;
  /** Set active hive — used by map fruit click and blooming clock */
  setActiveHive: (family: string | null) => void;
  /** Set active season phase */
  setActivePhase: (phase: string | null) => void;
  /** Clear all filters */
  clearFilters: () => void;
}

const HiveSeasonContext = createContext<HiveSeasonState>({
  activeHiveFamily: null,
  activeSeasonPhase: null,
  setActiveHive: () => {},
  setActivePhase: () => {},
  clearFilters: () => {},
});

export function HiveSeasonProvider({ children }: { children: ReactNode }) {
  const [activeHiveFamily, setActiveHiveFamily] = useState<string | null>(null);
  const [activeSeasonPhase, setActiveSeasonPhase] = useState<string | null>(null);

  const setActiveHive = useCallback((family: string | null) => {
    setActiveHiveFamily(family);
  }, []);

  const setActivePhase = useCallback((phase: string | null) => {
    setActiveSeasonPhase(phase);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveHiveFamily(null);
    setActiveSeasonPhase(null);
  }, []);

  return (
    <HiveSeasonContext.Provider value={{ activeHiveFamily, activeSeasonPhase, setActiveHive, setActivePhase, clearFilters }}>
      {children}
    </HiveSeasonContext.Provider>
  );
}

export function useHiveSeasonFilter() {
  return useContext(HiveSeasonContext);
}
