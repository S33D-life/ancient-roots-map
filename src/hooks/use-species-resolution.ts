/**
 * useSpeciesResolution — React hook for resolving species data.
 * Provides both sync (instant, hardcoded) and async (DB-backed) resolution.
 */
import { useState, useEffect, useMemo } from "react";
import {
  resolveSpeciesSync,
  resolveSpecies,
  type SpeciesResolution,
} from "@/services/speciesResolver";

/**
 * Resolve a species string + optional species_key.
 * Returns immediately with hardcoded data, then upgrades to DB data when available.
 */
export function useSpeciesResolution(
  speciesString: string | undefined | null,
  speciesKey?: string | null
): SpeciesResolution | null {
  const syncResult = useMemo(() => {
    if (!speciesString) return null;
    return resolveSpeciesSync(speciesString, speciesKey);
  }, [speciesString, speciesKey]);

  const [result, setResult] = useState<SpeciesResolution | null>(syncResult);

  useEffect(() => {
    if (!speciesString) {
      setResult(null);
      return;
    }

    // Set sync result immediately
    setResult(resolveSpeciesSync(speciesString, speciesKey));

    // Then attempt async upgrade
    resolveSpecies(speciesString, speciesKey).then(setResult);
  }, [speciesString, speciesKey]);

  return result;
}
