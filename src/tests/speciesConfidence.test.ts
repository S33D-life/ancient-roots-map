import { describe, it, expect } from "vitest";
import { speciesCertainty } from "@/lib/species/speciesConfidence";

describe("speciesCertainty — gentle, read-only mapping", () => {
  it("'Known' when resolver confidence is exact", () => {
    const r = speciesCertainty({ confidence: "exact", speciesLabel: "Pedunculate Oak" });
    expect(r.certainty).toBe("known");
    expect(r.label).toBe("Known");
  });

  it("'Known' when a species_key is present (even without exact confidence)", () => {
    const r = speciesCertainty({ confidence: "fuzzy", speciesKey: "quercus-robur", speciesLabel: "oak" });
    expect(r.certainty).toBe("known");
  });

  it("'Broad group' for a genus concept like 'oak' (no key)", () => {
    const r = speciesCertainty({ confidence: "fuzzy", speciesLabel: "oak" });
    expect(r.certainty).toBe("broad");
    expect(r.label).toBe("Broad group");
  });

  it("'Broad group' for a mythic concept like 'ancient elders'", () => {
    const r = speciesCertainty({ confidence: "unresolved", speciesLabel: "ancient elders" });
    expect(r.certainty).toBe("broad");
  });

  it("'Likely' for a plausible specific name (fuzzy, not a broad concept)", () => {
    const r = speciesCertainty({ confidence: "fuzzy", speciesLabel: "Pedunculate Oak" });
    expect(r.certainty).toBe("likely");
    expect(r.label).toBe("Likely");
  });

  it("'Needs refinement' when unresolved and not a concept", () => {
    const r = speciesCertainty({ confidence: "unresolved", speciesLabel: "the gnarled giant by the river" });
    expect(r.certainty).toBe("unresolved");
    expect(r.label).toBe("Needs refinement");
  });

  it("'Needs refinement' for empty/absent species", () => {
    expect(speciesCertainty({ speciesLabel: "" }).certainty).toBe("unresolved");
    expect(speciesCertainty({ confidence: null }).certainty).toBe("unresolved");
  });

  it("does not fabricate precision: a broad label never reads as 'Known' without a key", () => {
    const r = speciesCertainty({ confidence: "fuzzy", speciesLabel: "willow" });
    expect(r.certainty).not.toBe("known");
    expect(r.certainty).toBe("broad");
  });

  it("every certainty carries a gentle, non-empty hint", () => {
    for (const input of [
      { confidence: "exact" as const },
      { confidence: "fuzzy" as const, speciesLabel: "Silver Birch" },
      { speciesLabel: "oak" },
      { confidence: "unresolved" as const },
    ]) {
      expect(speciesCertainty(input).hint.length).toBeGreaterThan(0);
    }
  });
});
