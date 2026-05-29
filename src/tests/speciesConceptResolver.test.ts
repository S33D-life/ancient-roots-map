import { describe, expect, it } from "vitest";
import {
  normalizeSpeciesConceptAlias,
  resolveArboriumStarterConcept,
  resolveSpeciesConcept,
  resolveSpeciesConceptFromTaxonomy,
} from "@/services/speciesConceptResolver";
import { ARBORIUM_STARTER_CONCEPTS } from "@/config/speciesConcepts";

describe("species concept resolver", () => {
  it("normalizes aliases without changing the caller's preserved label", () => {
    expect(normalizeSpeciesConceptAlias("  Water-loving   Trees ")).toBe("water loving trees");

    const resolved = resolveSpeciesConcept("  River   Trees ");
    expect(resolved.concept_id).toBe("water-loving-trees");
    expect(resolved.preserved_label).toBe("River   Trees");
    expect(resolved.confidence).toBe("broad");
  });

  it("uses concept_exact for concept IDs without fabricating exact species keys", () => {
    const resolved = resolveSpeciesConcept("oak");

    expect(resolved.concept_id).toBe("oak");
    expect(resolved.confidence).toBe("concept_exact");
    expect(resolved.match_kind).toBe("concept_id");
    expect(resolved.exact_species_key).toBeNull();
    expect(resolved.concept?.concept_type).toBe("genus");
  });

  it("treats representative taxa as representative concept matches, not exact taxonomy", () => {
    const resolved = resolveSpeciesConcept("Quercus robur");

    expect(resolved.concept_id).toBe("oak");
    expect(resolved.confidence).toBe("representative");
    expect(resolved.match_kind).toBe("representative_taxon");
    expect(resolved.exact_species_key).toBeNull();
  });

  it("preserves Treeasurus species keys only when the caller supplies them", () => {
    const resolved = resolveSpeciesConceptFromTaxonomy({
      species_key: "treeasurus:quercus-robur",
      scientific_name: "Quercus robur",
      genus: "Quercus",
    });

    expect(resolved.concept_id).toBe("oak");
    expect(resolved.confidence).toBe("representative");
    expect(resolved.exact_species_key).toBe("treeasurus:quercus-robur");
  });

  it("keeps unresolved raw labels available for future Treeasurus lookup", () => {
    const resolved = resolveSpeciesConcept("mystery moon tree");

    expect(resolved.concept_id).toBeNull();
    expect(resolved.confidence).toBe("unresolved");
    expect(resolved.preserved_label).toBe("mystery moon tree");
    expect(resolved.normalized_label).toBe("mystery moon tree");
  });

  it("exposes Arborium starter mappings without wiring consumers", () => {
    expect(ARBORIUM_STARTER_CONCEPTS.oak).toBe("oak");

    const yew = resolveArboriumStarterConcept("yew");
    expect(yew.concept_id).toBe("yew");
    expect(yew.concept?.related_concept_ids).toContain("yew-hive");
  });

  it("keeps hive concepts separate from genus concepts", () => {
    const oakHive = resolveSpeciesConcept("oak hive");
    const oak = resolveSpeciesConcept("oak");

    expect(oakHive.concept_id).toBe("oak-hive");
    expect(oakHive.concept?.concept_type).toBe("hive");
    expect(oak.concept_id).toBe("oak");
    expect(oak.concept?.concept_type).toBe("genus");
  });
});
