import { describe, it, expect } from "vitest";
import {
  classifyImageTarget,
  toSpeciesMediaSubject,
  impliesExactSpecies,
  validateAttribution,
  chooseBestImage,
  mediaFallbackTier,
  getSpeciesMediaFallbackOrder,
  GENERIC_BOTANICAL_PLACEHOLDER,
  SpeciesMediaSubjectError,
  type SpeciesImage,
} from "@/lib/species/speciesMedia";

const attr = { license: "CC-BY-4.0", licenseUrl: "https://x", creator: "A. Photographer", sourceProvider: "wikimedia" as const };

function img(over: Partial<SpeciesImage>): SpeciesImage {
  return {
    id: "i",
    subject: { kind: "species_key", speciesKey: "quercus-robur" },
    kind: "hero",
    url: "https://img",
    alt: "alt",
    representativeness: "exact",
    attribution: attr,
    status: "approved",
    ...over,
  };
}

describe("classifyImageTarget — exactly one trunk anchor", () => {
  it("classifies each single anchor", () => {
    expect(classifyImageTarget({ speciesKey: "quercus-robur" })).toBe("species_key");
    expect(classifyImageTarget({ conceptId: "oak" })).toBe("concept_id");
    expect(classifyImageTarget({ rawLabel: "big old tree" })).toBe("raw_label");
  });

  it("rejects an image target that is BOTH species_key and concept_id", () => {
    expect(() => classifyImageTarget({ speciesKey: "quercus-robur", conceptId: "oak" }))
      .toThrow(SpeciesMediaSubjectError);
  });

  it("rejects an empty target", () => {
    expect(() => classifyImageTarget({})).toThrow(SpeciesMediaSubjectError);
    expect(() => classifyImageTarget({ speciesKey: "   " })).toThrow(SpeciesMediaSubjectError);
  });

  it("toSpeciesMediaSubject builds a validated discriminated union", () => {
    expect(toSpeciesMediaSubject({ conceptId: "oak" })).toEqual({ kind: "concept_id", conceptId: "oak" });
  });
});

describe("impliesExactSpecies — a concept image is not an exact species", () => {
  it("true only for an exact-species photo on a species_key", () => {
    expect(impliesExactSpecies(img({ subject: { kind: "species_key", speciesKey: "quercus-robur" }, representativeness: "exact" }))).toBe(true);
  });
  it("false for a concept image", () => {
    expect(impliesExactSpecies(img({ subject: { kind: "concept_id", conceptId: "oak" }, representativeness: "concept" }))).toBe(false);
  });
  it("false for a representative species photo standing in for a concept", () => {
    expect(impliesExactSpecies(img({ representativeness: "representative" }))).toBe(false);
  });
});

describe("validateAttribution — required for non-placeholder", () => {
  it("valid when license + creator/provider present", () => {
    expect(validateAttribution(img({})).valid).toBe(true);
  });
  it("invalid when attribution missing on a live image", () => {
    const r = validateAttribution(img({ attribution: null }));
    expect(r.valid).toBe(false);
    expect(r.missing).toContain("attribution");
  });
  it("invalid when license missing", () => {
    const r = validateAttribution(img({ attribution: { license: "", creator: "x" } as any }));
    expect(r.valid).toBe(false);
    expect(r.missing).toContain("license");
  });
  it("placeholders need no attribution", () => {
    expect(validateAttribution(GENERIC_BOTANICAL_PLACEHOLDER).valid).toBe(true);
  });
});

describe("fallback hierarchy", () => {
  it("documents the 6-tier order, exact before concept", () => {
    const order = getSpeciesMediaFallbackOrder();
    expect(order.indexOf("exact_species")).toBeLessThan(order.indexOf("concept"));
    expect(order.indexOf("concept")).toBeLessThan(order.indexOf("generic_botanical"));
    expect(order.indexOf("raw_unresolved")).toBeLessThan(order.indexOf("generic_botanical"));
  });

  it("maps images to the right tier", () => {
    expect(mediaFallbackTier(img({ representativeness: "exact" }))).toBe("exact_species");
    expect(mediaFallbackTier(img({ representativeness: "representative" }))).toBe("representative_exact_species");
    expect(mediaFallbackTier(img({ subject: { kind: "concept_id", conceptId: "oak" }, representativeness: "concept" }))).toBe("concept");
    expect(mediaFallbackTier(img({ subject: { kind: "concept_id", conceptId: "ancient-elders" }, representativeness: "broad" }))).toBe("broad_concept");
    expect(mediaFallbackTier(img({ subject: { kind: "raw_label", rawLabel: "x" }, representativeness: "representative" }))).toBe("raw_unresolved");
  });

  it("chooseBestImage picks exact species before concept", () => {
    const concept = img({ id: "c", subject: { kind: "concept_id", conceptId: "oak" }, representativeness: "concept" });
    const exact = img({ id: "e", representativeness: "exact" });
    expect(chooseBestImage([concept, exact]).id).toBe("e");
  });

  it("chooseBestImage preserves a raw-label image rather than inventing exactness", () => {
    const raw = img({ id: "r", subject: { kind: "raw_label", rawLabel: "gnarled giant" }, representativeness: "representative" });
    const chosen = chooseBestImage([raw]);
    expect(chosen.id).toBe("r");
    expect(chosen.subject.kind).toBe("raw_label");
    expect(impliesExactSpecies(chosen)).toBe(false);
  });

  it("falls back to the generic placeholder when nothing usable", () => {
    expect(chooseBestImage([]).id).toBe(GENERIC_BOTANICAL_PLACEHOLDER.id);
    // a live image with broken attribution is not usable → generic
    const broken = img({ attribution: null });
    expect(chooseBestImage([broken]).id).toBe(GENERIC_BOTANICAL_PLACEHOLDER.id);
  });

  it("skips pending/rejected unless placeholder", () => {
    const pending = img({ id: "p", status: "pending" });
    expect(chooseBestImage([pending]).id).toBe(GENERIC_BOTANICAL_PLACEHOLDER.id);
  });

  it("prefers the requested kind when a usable one exists", () => {
    const hero = img({ id: "h", kind: "hero" });
    const leaf = img({ id: "l", kind: "leaf" });
    expect(chooseBestImage([hero, leaf], { kind: "leaf" }).id).toBe("l");
    // but if requested kind absent, still returns best of the rest
    expect(chooseBestImage([hero], { kind: "bark" }).id).toBe("h");
  });
});
