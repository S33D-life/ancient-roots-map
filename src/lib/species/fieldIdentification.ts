import type { SpeciesResult } from "@/components/encounter/SpeciesIdentifier";

/** New-tree payload only. Never infer a species key from a typed/common name. */
export function fieldIdentificationPayload(species: string, selected: SpeciesResult | null) {
  const result = selected?.species === species ? selected : null;
  const rank = result?.identificationRank || (result?.certainty === "exact" ? "species" : "unresolved");
  const specific = rank === "species" && result?.certainty === "exact";
  return {
    species_key: specific ? result.canonicalSpeciesKey || null : null,
    lineage: specific ? result.scientificName || null : null,
    metadata: {
      identification: {
        entered_name: species,
        rank,
        certainty: result?.certainty || "uncertain",
        source: specific ? result.canonicalSpeciesKey ? "catalogue_selection" : "local_selection" : "manual",
      },
    },
  };
}
