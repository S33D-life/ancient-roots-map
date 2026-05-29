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
import { enrichSpecies } from "@/data/treeSpecies";
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
 * GBIF enrichment via the gbif-enrich edge function.
 * Parses scientific names and creates species_index entries + links trees.
 */
export async function enrichFromGBIF(
  speciesStrings: string[]
): Promise<{
  summary: { created: number; updated: number; low_confidence: number; skipped: number; trees_linked: number };
  results: Array<{
    original: string;
    parsed_scientific: string;
    confidence: number;
    match_type: string;
    action: string;
    species_key: string | null;
    trees_updated: number;
  }>;
} | null> {
  try {
    const { data, error } = await supabase.functions.invoke("gbif-enrich", {
      body: { species_strings: speciesStrings },
    });
    if (error) {
      console.error("GBIF enrich error:", error);
      return null;
    }
    // Clear cache so new species_index entries are picked up
    cache.clear();
    return data;
  } catch (err) {
    console.error("GBIF enrich failed:", err);
    return null;
  }
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

  // Try DB lookup by key or normalized_name
  const norm = speciesString.toLowerCase().trim();
  let data: { species_key: string; common_name: string; scientific_name: string | null; family: string | null; genus: string | null } | null = null;

  if (speciesKey) {
    const res = await supabase
      .from("species_index")
      .select("species_key, common_name, scientific_name, family, genus")
      .eq("species_key", speciesKey)
      .maybeSingle();
    data = res.data;
  } else {
    // Try normalized_name first
    const res = await supabase
      .from("species_index")
      .select("species_key, common_name, scientific_name, family, genus")
      .eq("normalized_name", norm)
      .maybeSingle();
    data = res.data;

    // If not found, try synonym_names (jsonb array contains the string)
    if (!data) {
      const synRes = await supabase
        .from("species_index")
        .select("species_key, common_name, scientific_name, family, genus")
        .contains("synonym_names", JSON.stringify([norm]))
        .maybeSingle();
      data = synRes.data;
    }
  }

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
