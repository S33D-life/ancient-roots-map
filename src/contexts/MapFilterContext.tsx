/**
 * MapFilterContext — persists species/country/hive filter selections
 * across pages so navigating between Hive → Map → Atlas preserves state.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

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
}

const DEFAULTS: MapFilters = { species: "all", country: "all", hive: "all", bioRegion: "all" };

const MapFilterContext = createContext<MapFilterContextValue>({
  ...DEFAULTS,
  setSpecies: () => {},
  setCountry: () => {},
  setHive: () => {},
  setBioRegion: () => {},
  resetFilters: () => {},
});

export const MapFilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<MapFilters>(DEFAULTS);

  const setSpecies = useCallback((v: string) => setFilters(f => ({ ...f, species: v })), []);
  const setCountry = useCallback((v: string) => setFilters(f => ({ ...f, country: v })), []);
  const setHive = useCallback((v: string) => setFilters(f => ({ ...f, hive: v })), []);
  const setBioRegion = useCallback((v: string) => setFilters(f => ({ ...f, bioRegion: v })), []);
  const resetFilters = useCallback(() => setFilters(DEFAULTS), []);

  return (
    <MapFilterContext.Provider value={{ ...filters, setSpecies, setCountry, setHive, setBioRegion, resetFilters }}>
      {children}
    </MapFilterContext.Provider>
  );
};

export const useMapFilters = () => useContext(MapFilterContext);
