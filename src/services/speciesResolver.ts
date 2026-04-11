/**
 * Unified Species Resolver — the single source of truth for species lookups.
 *
 * Attempts resolution in order:
 * 1. species_key (if the tree already has one)
 * 2. DB lookup against species_index (normalized_name, scientific_name, synonyms)
 * 3. Hardcoded fallback via treeSpecies.ts + hiveUtils.ts
 *
 * Returns a SpeciesResolution containing canonical data + hive info.
 */
import { supabase } from "@/integrations/supabase/client";
import { matchSpecies, enrichSpecies } from "@/data/treeSpecies";
import { getHiveForSpecies, getHiveInfo, type HiveInfo } from "@/utils/hiveUtils";

export type MatchConfidence = "exact" | "fuzzy" | "unresolved";

export interface SpeciesResolution {
  speciesKey: string | null;
  displayName: string;
  scientificName: string | null;
  family: string | null;
  genus: string | null;
  hive: HiveInfo | null;
  source: "db" | "hardcoded" | "unresolved";
  confidence: MatchConfidence;
}

/**
 * GBIF enrichment stub — future integration point.
 * When implemented, will fetch taxonomy from GBIF API by scientific name.
 */
export async function enrichFromGBIF(
  _scientificName: string
): Promise<Partial<SpeciesResolution> | null> {
  // TODO: Implement GBIF species/match?name= lookup
  // Returns { genus, family, scientificName, speciesKey (gbif taxon id) }
  return null;
}

// In-memory cache: normalized string → resolution
const cache = new Map<string, SpeciesResolution>();

/**
 * Resolve species from a tree's species string and optional species_key.
 * Uses cache for repeated lookups in the same session.
 */
export function resolveSpeciesSync(
  speciesString: string,
  speciesKey?: string | null
): SpeciesResolution {
  // Fast path: if we have a cached key
  const cacheKey = speciesKey || speciesString.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Hardcoded fallback (always available synchronously)
  const enriched = enrichSpecies(speciesString);
  const hive = getHiveForSpecies(speciesString);

  const resolution: SpeciesResolution = {
    speciesKey: speciesKey || null,
    displayName: enriched.species,
    scientificName: enriched.lineage || null,
    family: enriched.family || hive?.family || null,
    genus: enriched.lineage?.split(" ")[0] || null,
    hive,
    source: enriched.lineage ? "hardcoded" : "unresolved",
    confidence: enriched.lineage ? "fuzzy" : "unresolved",
  };

  cache.set(cacheKey, resolution);
  return resolution;
}

/**
 * Async resolver that checks the DB species_index first.
 * Falls back to hardcoded data if not found.
 */
export async function resolveSpecies(
  speciesString: string,
  speciesKey?: string | null
): Promise<SpeciesResolution> {
  const cacheKey = speciesKey || speciesString.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && cached.source === "db") return cached;

  // Try DB lookup
  let query = supabase
    .from("species_index")
    .select("species_key, common_name, scientific_name, family, genus");

  if (speciesKey) {
    query = query.eq("species_key", speciesKey);
  } else {
    query = query.eq("normalized_name", speciesString.toLowerCase().trim());
  }

  const { data } = await query.maybeSingle();

  if (data) {
    const hive = data.family ? getHiveInfo(data.family) : null;
    const resolution: SpeciesResolution = {
      speciesKey: data.species_key,
      displayName: data.common_name,
      scientificName: data.scientific_name,
      family: data.family,
      genus: data.genus,
      hive,
      source: "db",
      confidence: "exact",
    };
    cache.set(cacheKey, resolution);
    if (data.species_key) cache.set(data.species_key, resolution);
    return resolution;
  }

  // Fallback to sync/hardcoded
  return resolveSpeciesSync(speciesString, speciesKey);
}

/**
 * Batch resolve for map/list views — resolves multiple species strings at once.
 */
export async function resolveSpeciesBatch(
  entries: Array<{ species: string; speciesKey?: string | null }>
): Promise<Map<string, SpeciesResolution>> {
  const results = new Map<string, SpeciesResolution>();
  const toResolve: string[] = [];

  for (const e of entries) {
    const key = e.speciesKey || e.species.toLowerCase().trim();
    const cached = cache.get(key);
    if (cached) {
      results.set(key, cached);
    } else {
      toResolve.push(e.species.toLowerCase().trim());
    }
  }

  if (toResolve.length > 0) {
    const { data } = await supabase
      .from("species_index")
      .select("species_key, common_name, scientific_name, family, genus, normalized_name")
      .in("normalized_name", toResolve);

    const dbMap = new Map<string, typeof data extends Array<infer T> ? T : never>();
    data?.forEach((d) => dbMap.set(d.normalized_name!, d));

    for (const e of entries) {
      const norm = e.species.toLowerCase().trim();
      const key = e.speciesKey || norm;
      if (results.has(key)) continue;

      const dbEntry = dbMap.get(norm);
      if (dbEntry) {
        const hive = dbEntry.family ? getHiveInfo(dbEntry.family) : null;
        const resolution: SpeciesResolution = {
          speciesKey: dbEntry.species_key,
          displayName: dbEntry.common_name,
          scientificName: dbEntry.scientific_name,
          family: dbEntry.family,
          genus: dbEntry.genus,
          hive,
          source: "db",
          confidence: "exact",
        };
        cache.set(key, resolution);
        results.set(key, resolution);
      } else {
        const resolution = resolveSpeciesSync(e.species, e.speciesKey);
        results.set(key, resolution);
      }
    }
  }

  return results;
}

/**
 * Get hive by species_key — preferred over getHiveForSpecies(string).
 * Falls back to string matching if key is not available.
 */
export function getHiveForSpeciesKey(speciesKey: string | null, speciesString?: string): HiveInfo | null {
  if (speciesKey) {
    const cached = cache.get(speciesKey);
    if (cached?.hive) return cached.hive;
  }
  if (speciesString) {
    return getHiveForSpecies(speciesString);
  }
  return null;
}

/** Clear cache (e.g. on logout or data refresh) */
export function clearSpeciesCache(): void {
  cache.clear();
}
