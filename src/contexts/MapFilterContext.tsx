/**
 * MapFilterContext — persists all data filter selections across pages
 * AND syncs to URL search params so filters survive navigation & deep-linking.
 *
 * Visual layer toggles (showSeeds, showGroves etc.) remain local to each map
 * component since they control renderer-specific Leaflet/MapLibre layers.
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

/* ── Types ── */
export type AgeBand = "all" | "under100" | "100-300" | "300-800" | "800-1500" | "1500+";
export type GirthBand = "all" | "under200" | "200-400" | "400-600" | "600-800" | "800+";
export type GroveScale = "all" | "hyper_local" | "local" | "regional";
export type Perspective = "collective" | "personal" | "tribe";

export const AGE_BANDS: { key: AgeBand; label: string; min: number; max: number }[] = [
  { key: "under100", label: "Under 100y", min: 0, max: 99 },
  { key: "100-300", label: "100–300y", min: 100, max: 300 },
  { key: "300-800", label: "300–800y", min: 300, max: 800 },
  { key: "800-1500", label: "800–1,500y", min: 800, max: 1500 },
  { key: "1500+", label: "1,500y+", min: 1500, max: Infinity },
];

export const GIRTH_BANDS: { key: GirthBand; label: string; minCm: number; maxCm: number }[] = [
  { key: "under200", label: "Under 2m", minCm: 0, maxCm: 199 },
  { key: "200-400", label: "2–4m", minCm: 200, maxCm: 400 },
  { key: "400-600", label: "4–6m", minCm: 400, maxCm: 600 },
  { key: "600-800", label: "6–8m", minCm: 600, maxCm: 800 },
  { key: "800+", label: "8m+", minCm: 800, maxCm: Infinity },
];

export const GROVE_SCALES: { key: GroveScale; label: string; radiusKm: number; icon: string }[] = [
  { key: "all", label: "TETOL", radiusKm: Infinity, icon: "🌍" },
  { key: "hyper_local", label: "33m", radiusKm: 0.033, icon: "📍" },
  { key: "local", label: "1km", radiusKm: 1, icon: "🌿" },
  { key: "regional", label: "100km", radiusKm: 100, icon: "🗺️" },
];

export const PERSPECTIVES: { key: Perspective; label: string; icon: string; accent: string }[] = [
  { key: "personal", label: "I AM", icon: "🌱", accent: "120, 50%, 45%" },
  { key: "collective", label: "TETOL", icon: "🌍", accent: "42, 90%, 55%" },
  { key: "tribe", label: "TRIBE", icon: "👥", accent: "200, 55%, 50%" },
];

interface MapFilters {
  species: string;
  country: string;
  hive: string;
  bioRegion: string;
  ageBand: AgeBand;
  girthBand: GirthBand;
  groveScale: GroveScale;
  perspective: Perspective;
}

interface MapFilterContextValue extends MapFilters {
  setSpecies: (v: string) => void;
  setCountry: (v: string) => void;
  setHive: (v: string) => void;
  setBioRegion: (v: string) => void;
  setAgeBand: (v: AgeBand) => void;
  setGirthBand: (v: GirthBand) => void;
  setGroveScale: (v: GroveScale) => void;
  setPerspective: (v: Perspective) => void;
  resetFilters: () => void;
  /** True when any filter is not default */
  hasActiveFilters: boolean;
  /** Count of active non-default filters */
  activeFilterCount: number;
  /** Returns array of active filter labels for display */
  activeFilterLabels: { key: string; label: string; value: string }[];
}

const DEFAULTS: MapFilters = {
  species: "all",
  country: "all",
  hive: "all",
  bioRegion: "all",
  ageBand: "all",
  girthBand: "all",
  groveScale: "all",
  perspective: "collective",
};

const PARAM_MAP: Record<keyof MapFilters, string> = {
  species: "species",
  country: "country",
  hive: "hive",
  bioRegion: "bio",
  ageBand: "age",
  girthBand: "girth",
  groveScale: "scale",
  perspective: "view",
};

const MapFilterContext = createContext<MapFilterContextValue>({
  ...DEFAULTS,
  setSpecies: () => {},
  setCountry: () => {},
  setHive: () => {},
  setBioRegion: () => {},
  setAgeBand: () => {},
  setGirthBand: () => {},
  setGroveScale: () => {},
  setPerspective: () => {},
  resetFilters: () => {},
  hasActiveFilters: false,
  activeFilterCount: 0,
  activeFilterLabels: [],
});

export const MapFilterProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<MapFilters>(() => ({
    species: searchParams.get(PARAM_MAP.species) || DEFAULTS.species,
    country: searchParams.get(PARAM_MAP.country) || DEFAULTS.country,
    hive: searchParams.get(PARAM_MAP.hive) || DEFAULTS.hive,
    bioRegion: searchParams.get(PARAM_MAP.bioRegion) || DEFAULTS.bioRegion,
    ageBand: (searchParams.get(PARAM_MAP.ageBand) as AgeBand) || DEFAULTS.ageBand,
    girthBand: (searchParams.get(PARAM_MAP.girthBand) as GirthBand) || DEFAULTS.girthBand,
    groveScale: (searchParams.get(PARAM_MAP.groveScale) as GroveScale) || DEFAULTS.groveScale,
    perspective: (searchParams.get(PARAM_MAP.perspective) as Perspective) || DEFAULTS.perspective,
  }));

  // Sync filters → URL
  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, param] of Object.entries(PARAM_MAP)) {
        const val = filters[key as keyof MapFilters];
        const def = DEFAULTS[key as keyof MapFilters];
        if (val && val !== def) {
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
  const setAgeBand = useCallback((v: AgeBand) => setFilters(f => ({ ...f, ageBand: v })), []);
  const setGirthBand = useCallback((v: GirthBand) => setFilters(f => ({ ...f, girthBand: v })), []);
  const setGroveScale = useCallback((v: GroveScale) => setFilters(f => ({ ...f, groveScale: v })), []);
  const setPerspective = useCallback((v: Perspective) => setFilters(f => ({ ...f, perspective: v })), []);
  const resetFilters = useCallback(() => setFilters(DEFAULTS), []);

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => v !== DEFAULTS[k as keyof MapFilters]
  );

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v !== DEFAULTS[k as keyof MapFilters]
  ).length;

  const LABEL_MAP: Record<keyof MapFilters, string> = {
    species: "Species",
    country: "Country",
    hive: "Hive",
    bioRegion: "Bio-Region",
    ageBand: "Age",
    girthBand: "Girth",
    groveScale: "Scale",
    perspective: "View",
  };

  const activeFilterLabels = Object.entries(filters)
    .filter(([k, v]) => v !== DEFAULTS[k as keyof MapFilters])
    .map(([k, v]) => ({
      key: k,
      label: LABEL_MAP[k as keyof MapFilters],
      value: v,
    }));

  return (
    <MapFilterContext.Provider value={{
      ...filters,
      setSpecies, setCountry, setHive, setBioRegion,
      setAgeBand, setGirthBand, setGroveScale, setPerspective,
      resetFilters, hasActiveFilters, activeFilterCount, activeFilterLabels,
    }}>
      {children}
    </MapFilterContext.Provider>
  );
};

export const useMapFilters = () => useContext(MapFilterContext);
