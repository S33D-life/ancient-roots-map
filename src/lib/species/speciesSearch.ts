import TREE_SPECIES, { type TreeSpecies } from "@/data/treeSpecies";
import type { SpeciesSearchHit } from "@/hooks/use-treeasurus";

/** Comparison key only: never rewrite the name a Wanderer records. */
export function speciesSearchKey(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[‐‑‒–—−-]/g, " ").replace(/[’‘']/g, "")
    .replace(/\s+/g, " ").trim();
}

export function fieldSpeciesSuggestions(query: string): TreeSpecies[] {
  const key = speciesSearchKey(query);
  if (key.length < 2) return [];
  return TREE_SPECIES.map(species => {
    const names = [species.common, species.scientific, ...(species.aliases || [])].map(speciesSearchKey);
    const score = Math.max(...names.map(name => name === key ? 3 : name.startsWith(key) ? 2 : name.includes(key) ? 1 : 0));
    return { species, score };
  }).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score)
    .slice(0, 12).map(hit => hit.species);
}

/** Bounded read-only query hints, not a second catalogue or an identification. */
export function speciesCatalogueQueries(query: string): string[] {
  const trimmed = query.trim().slice(0, 200);
  const key = speciesSearchKey(trimmed);
  if (key.length < 2) return [];
  const exact = fieldSpeciesSuggestions(trimmed).filter(species =>
    [species.common, species.scientific, ...(species.aliases || [])].some(name => speciesSearchKey(name) === key));
  // Expand only exact documented local names. Never turn a broad "Oak" into Q. robur.
  return [...new Set([trimmed, ...(key !== trimmed.toLowerCase() ? [key] : []),
    ...exact.slice(0, 2).map(species => species.scientific)])].slice(0, 3);
}

export interface FieldSpeciesChoice {
  label: string;
  scientificName: string | null;
  family: string | null;
  speciesKey: string | null;
  identificationRank: "species" | "genus" | "unresolved";
  matchedName?: string;
}

export function fieldSpeciesChoices(query: string, hits: SpeciesSearchHit[]): FieldSpeciesChoice[] {
  const choices: FieldSpeciesChoice[] = [];
  const ids = new Set<string>();
  const scientific = new Set<string>();
  for (const hit of hits) {
    if (ids.has(hit.species_id)) continue;
    ids.add(hit.species_id);
    const nameKey = hit.scientific_name ? speciesSearchKey(hit.scientific_name) : "";
    if (nameKey) scientific.add(nameKey);
    choices.push({ label: hit.canonical_common_name || hit.scientific_name || hit.matched_name,
      scientificName: hit.scientific_name, family: hit.family,
      // The legacy RPC omits rank. Be conservative about genus-only results.
      identificationRank: /^[A-Z][a-z]+$/.test(hit.scientific_name || "") ? "genus"
        : /^[A-Z][a-z]+ (?:[a-z][a-z-]+|[×x] [a-z][a-z-]+)(?: |$)/.test(hit.scientific_name || "") ? "species" : "unresolved",
      speciesKey: hit.species_key, matchedName: hit.matched_name });
  }
  for (const species of fieldSpeciesSuggestions(query)) {
    const key = speciesSearchKey(species.scientific);
    // Catalogue authorship can follow the local binomial. Prefer the actual catalogue identity.
    if ([...scientific].some(name => name === key || name.startsWith(`${key} `))) continue;
    choices.push({ label: species.common, scientificName: species.scientific,
      family: species.family, speciesKey: null, identificationRank: "species" });
  }
  return choices;
}
