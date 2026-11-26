import { describe, expect, it } from "vitest";
import { fieldSpeciesChoices, fieldSpeciesSuggestions, speciesCatalogueQueries, speciesSearchKey } from "@/lib/species/speciesSearch";
import { fieldIdentificationPayload } from "@/lib/species/fieldIdentification";
import type { SpeciesSearchHit } from "@/hooks/use-treeasurus";

export const cambridge = [
  ["Common Walnut", "Juglans regia"], ["Chestnut-leaved Oak", "Quercus castaneifolia"],
  ["European Hop-Hornbeam", "Ostrya carpinifolia"], ["Wollemi Pine", "Wollemia nobilis"],
  ["Cork Oak", "Quercus suber"], ["Argan", "Argania spinosa"], ["Sausage Tree", "Kigelia africana"],
];
const chestnut: SpeciesSearchHit = { species_id: "existing-chestnut-id", species_key: "gbif-7930013", slug: null,
  scientific_name: "Quercus castaneifolia C.A.Mey.", canonical_common_name: "Oak", family: "Fagaceae",
  matched_name: "Quercus castaneifolia C.A.Mey.", matched_language: null, match_kind: "scientific_prefix" };

describe("field species search, without imports or inferred identities", () => {
  it.each(cambridge)("keeps %s available locally and queries its scientific name", (common, scientific) => {
    expect(fieldSpeciesSuggestions(common).map(s => s.scientific)).toContain(scientific);
    expect(speciesCatalogueQueries(common)).toContain(scientific);
    expect(fieldSpeciesSuggestions(scientific).map(s => s.scientific)).toContain(scientific);
  });
  it("normalises Unicode hyphens, apostrophes, accents and partial names only for comparison", () => {
    expect(speciesSearchKey("  CHÊNE—D’EUROPE  ")).toBe("chene deurope");
    expect(fieldSpeciesSuggestions("chestnut leaved oak")[0].scientific).toBe("Quercus castaneifolia");
    expect(fieldSpeciesSuggestions("European Hop‑Hornbeam")[0].scientific).toBe("Ostrya carpinifolia");
    expect(fieldSpeciesSuggestions("Quercus cast")[0].scientific).toBe("Quercus castaneifolia");
    expect(speciesCatalogueQueries("x")).toEqual([]);
    expect(speciesCatalogueQueries("Oak")).toEqual(["Oak"]);
  });
  it("keeps all ambiguous Oak choices without supplying an identity for unselected local names", () => {
    const choices = fieldSpeciesChoices("Oak", []);
    expect(choices.length).toBeGreaterThan(1);
    expect(choices.every(c => c.speciesKey === null)).toBe(true);
    expect(fieldIdentificationPayload("Oak", null).species_key).toBeNull();
  });
  it("deduplicates scientific/common/alias hits by canonical ID and replaces the local binomial with the DB identity", () => {
    const choices = fieldSpeciesChoices("Chestnut-leaved Oak", [chestnut, { ...chestnut, matched_name: "Chestnut-leaved Oak" }]);
    expect(choices).toHaveLength(1);
    expect(choices[0].speciesKey).toBe("gbif-7930013");
    expect(choices[0].scientificName).toBe("Quercus castaneifolia C.A.Mey.");
    const other = { ...chestnut, species_id: "different-id", species_key: "another-key" };
    expect(fieldSpeciesChoices("Oak", [chestnut, other]).filter(c => c.speciesKey)).toHaveLength(2);
  });
  it("preserves an explicitly selected canonical key on a new tree and clears it after editing", () => {
    const selected = { species: "Oak", certainty: "exact" as const, canonicalSpeciesKey: "gbif-7930013",
      scientificName: chestnut.scientific_name, identificationRank: "species" as const };
    expect(fieldIdentificationPayload("Oak", selected)).toMatchObject({ species_key: "gbif-7930013", lineage: chestnut.scientific_name });
    expect(fieldIdentificationPayload("Other oak", selected)).toMatchObject({ species_key: null, lineage: null });
  });
  it("does not treat a genus-only catalogue hit as a species", () => {
    const [choice] = fieldSpeciesChoices("Quercus", [{ ...chestnut, scientific_name: "Quercus", canonical_common_name: "Oaks" }]);
    expect(choice.identificationRank).toBe("genus");
    expect(fieldIdentificationPayload(choice.label, { species: choice.label, certainty: "uncertain",
      identificationRank: choice.identificationRank, canonicalSpeciesKey: choice.speciesKey }).species_key).toBeNull();
  });
  it.each(["family", "genus"] as const)("records %s-only identification without a species assertion", rank => {
    const label = `${rank === "family" ? "Fagaceae" : "Quercus"} (${rank}; species unconfirmed)`;
    const payload = fieldIdentificationPayload(label, { species: label, certainty: "uncertain", identificationRank: rank });
    expect(payload).toMatchObject({ species_key: null, lineage: null,
      metadata: { identification: { entered_name: label, rank, certainty: "uncertain", source: "manual" } } });
  });
  it("does not forge canonical keys for offline suggestions, AI or unconfirmed hive labels", () => {
    expect(fieldIdentificationPayload("Sausage Tree", { species: "Sausage Tree", certainty: "exact", scientificName: "Kigelia africana" }).species_key).toBeNull();
    expect(fieldIdentificationPayload("Oak", { species: "Oak", certainty: "ai_confirmed", canonicalSpeciesKey: "unexpected" }).species_key).toBeNull();
    expect(fieldIdentificationPayload("Unknown species", null).metadata.identification.certainty).toBe("uncertain");
  });
});
