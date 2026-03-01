/**
 * MapFilterContext — persists species/country/hive/bioRegion filter selections
 * across pages AND syncs to URL search params so filters survive navigation.
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

interface MapFilters {
  species: string;
  country: string;
  hive: string;
  bioRegion: string;
}

interface MapFilterContextValue extends MapFilters {
  setSpecies: (v: string) => void;
  setCountry: (v: string) => void;
  setHive: (v: string) => void;
  setBioRegion: (v: string) => void;
  resetFilters: () => void;
  /** True when any filter is not "all" */
  hasActiveFilters: boolean;
  /** Returns array of active filter labels for display */
  activeFilterLabels: { key: string; label: string; value: string }[];
}

const DEFAULTS: MapFilters = { species: "all", country: "all", hive: "all", bioRegion: "all" };

const PARAM_MAP: Record<keyof MapFilters, string> = {
  species: "species",
  country: "country",
  hive: "hive",
  bioRegion: "bio",
};

const MapFilterContext = createContext<MapFilterContextValue>({
  ...DEFAULTS,
  setSpecies: () => {},
  setCountry: () => {},
  setHive: () => {},
  setBioRegion: () => {},
  resetFilters: () => {},
  hasActiveFilters: false,
  activeFilterLabels: [],
});

export const MapFilterProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialise from URL params, falling back to defaults
  const [filters, setFilters] = useState<MapFilters>(() => ({
    species: searchParams.get(PARAM_MAP.species) || DEFAULTS.species,
    country: searchParams.get(PARAM_MAP.country) || DEFAULTS.country,
    hive: searchParams.get(PARAM_MAP.hive) || DEFAULTS.hive,
    bioRegion: searchParams.get(PARAM_MAP.bioRegion) || DEFAULTS.bioRegion,
  }));

  // Sync filters → URL (merge, don't replace other params)
  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, param] of Object.entries(PARAM_MAP)) {
        const val = filters[key as keyof MapFilters];
        if (val && val !== "all") {
          next.set(param, val);
        } else {
          next.delete(param);
        }
      }
      return next;
    }, { replace: true });
  }, [filters, setSearchParams]);

  const setSpecies = useCallback((v: string) => setFilters(f => ({ ...f, species: v })), []);
  const setCountry = useCallback((v: string) => setFilters(f => ({ ...f, country: v })), []);
  const setHive = useCallback((v: string) => setFilters(f => ({ ...f, hive: v })), []);
  const setBioRegion = useCallback((v: string) => setFilters(f => ({ ...f, bioRegion: v })), []);
  const resetFilters = useCallback(() => setFilters(DEFAULTS), []);

  const hasActiveFilters = Object.values(filters).some(v => v !== "all");

  const LABEL_MAP: Record<keyof MapFilters, string> = {
    species: "Species",
    country: "Country",
    hive: "Hive",
    bioRegion: "Bio-Region",
  };

  const activeFilterLabels = Object.entries(filters)
    .filter(([, v]) => v !== "all")
    .map(([k, v]) => ({
      key: k,
      label: LABEL_MAP[k as keyof MapFilters],
      value: v,
    }));

  return (
    <MapFilterContext.Provider value={{
      ...filters,
      setSpecies, setCountry, setHive, setBioRegion, resetFilters,
      hasActiveFilters, activeFilterLabels,
    }}>
      {children}
    </MapFilterContext.Provider>
  );
};

export const useMapFilters = () => useContext(MapFilterContext);
