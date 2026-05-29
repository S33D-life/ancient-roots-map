import { describe, expect, it } from "vitest";
import { ARBORIUM_STARTER_CONCEPTS } from "@/config/speciesConcepts";
import { ID_BRANCHES } from "@/components/arborium/idBranches";
import { STARTER_SPECIES } from "@/components/arborium/starterSpecies";
import {
  ARBORIUM_STARTER_SPECIES_CONCEPTS,
  getArboriumStarterConcept,
  isArboriumStarterSlug,
} from "@/components/arborium/starterSpeciesConcepts";

describe("Arborium starter species concept mapping", () => {
  it("maps every starter species slug to a shared concept", () => {
    expect(ARBORIUM_STARTER_SPECIES_CONCEPTS).toHaveLength(STARTER_SPECIES.length);

    for (const starter of STARTER_SPECIES) {
      expect(isArboriumStarterSlug(starter.slug)).toBe(true);
      if (!isArboriumStarterSlug(starter.slug)) {
        throw new Error(`Missing Species Concept mapping for Arborium starter: ${starter.slug}`);
      }

      const mapped = getArboriumStarterConcept(starter);
      expect(mapped).not.toBeNull();
      expect(mapped?.concept_id).toBe(ARBORIUM_STARTER_CONCEPTS[starter.slug]);
      expect(mapped?.concept.concept_id).toBe(mapped?.concept_id);
      expect(mapped?.concept.source_layer).toContain("arborium");
    }
  });

  it("keeps broad starter concepts distinct from exact species keys", () => {
    for (const starter of STARTER_SPECIES) {
      const mapped = getArboriumStarterConcept(starter);

      expect(mapped?.concept.confidence).toBe("broad");
      expect(mapped?.concept.concept_type).toBe("genus");
      expect(mapped?.resolution.concept_id).toBe(mapped?.concept_id);
      expect(mapped?.resolution.confidence).toBe("concept_exact");
      expect(mapped?.resolution.exact_species_key).toBeNull();
    }
  });

  it("keeps ID branch answer slugs within the mapped starter set", () => {
    const starterSlugs = new Set(STARTER_SPECIES.map((starter) => starter.slug));

    for (const branch of Object.values(ID_BRANCHES)) {
      for (const answer of branch.answers) {
        for (const slug of answer.species) {
          expect(starterSlugs.has(slug)).toBe(true);
          expect(isArboriumStarterSlug(slug)).toBe(true);
        }
      }
    }
  });
});
