import { beforeEach, describe, expect, it, vi } from "vitest";
import { enrichSpecies, getFamilyForSpecies, matchSpecies, searchSpecies } from "@/data/treeSpecies";
import { getHiveForSpecies } from "@/utils/hiveUtils";

const { from, invoke } = vi.hoisted(() => ({ from: vi.fn(), invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, functions: { invoke } } }));

beforeEach(() => {
  vi.resetModules();
  from.mockReset();
  invoke.mockReset();
  from.mockImplementation(() => {
    const query = { select: vi.fn(), eq: vi.fn(), contains: vi.fn(), maybeSingle: vi.fn() };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.contains.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    return query;
  });
});

describe("Mulberry names: no false species precision", () => {
  it.each([
    ["White Mulberry", "Morus alba"], ["white mulberry", "Morus alba"],
    ["Morus alba", "Morus alba"], ["Morus alba L.", "Morus alba"],
    ["Black Mulberry", "Morus nigra"], ["Morus nigra", "Morus nigra"],
    ["Morus nigra L.", "Morus nigra"], ["  MORUS ALBA L.  ", "Morus alba"],
  ])("matches explicit %s only to %s", async (input, scientific) => {
    expect(matchSpecies(input)?.scientific).toBe(scientific);
    expect(enrichSpecies(input).lineage).toBe(scientific);
    const { resolveSpeciesSync, resolveSpecies } = await import("@/services/speciesResolver");
    expect(resolveSpeciesSync(input)).toMatchObject({ scientificName: scientific, family: "Moraceae", speciesKey: null, confidence: "fuzzy" });
    expect(await resolveSpecies(input)).toMatchObject({ scientificName: scientific, family: "Moraceae", speciesKey: null });
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each(["Mulberry", "mulberries", "Morus", " MULBERRY "])("keeps %s broad even if a DB common-name row could supply a species", async input => {
    expect(matchSpecies(input)).toBeUndefined();
    expect(enrichSpecies(input)).toEqual({ species: input });
    expect(getFamilyForSpecies(input)).toBe("Moraceae");
    expect(getHiveForSpecies(input)?.family).toBe("Moraceae");
    const { resolveSpeciesSync, resolveSpecies } = await import("@/services/speciesResolver");
    const expected = { displayName: input, scientificName: null, speciesKey: null, genus: null, family: "Moraceae", confidence: "unresolved" };
    expect(resolveSpeciesSync(input)).toMatchObject(expected);
    expect(await resolveSpecies(input)).toMatchObject(expected);
    expect(from).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each(["Paper Mulberry", "Indian Mulberry", "White Mulberry hybrid", "Morus sp.", "Mulberry (unconfirmed)", "Morus alba × Morus nigra"])("does not narrow qualified/uncertain wording %s through substring matching", async input => {
    expect(matchSpecies(input)).toBeUndefined();
    expect(enrichSpecies(input)).toEqual({ species: input });
    const { resolveSpeciesSync } = await import("@/services/speciesResolver");
    expect(resolveSpeciesSync(input)).toMatchObject({ displayName: input, scientificName: null, speciesKey: null, confidence: "unresolved" });
  });

  it("offers both named species as choices for a broad search", () => {
    const choices = searchSpecies("Mulberry");
    expect(choices.map(choice => choice.scientific)).toEqual(expect.arrayContaining(["Morus alba", "Morus nigra"]));
    expect(choices.filter(choice => choice.family === "Moraceae")).toHaveLength(2);
  });

  it.each(["Morus alba", "Morus nigra"])("respects a recorded canonical key for %s even when the stored label is broad", async scientific => {
    const row = { species_key: `fixture-${scientific.split(" ")[1]}`, common_name: "Mulberry", scientific_name: scientific, family: "Moraceae", genus: "Morus" };
    const eq = vi.fn();
    const select = vi.fn();
    const query = { eq, select, maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }) };
    eq.mockReturnValue(query); select.mockReturnValue(query); from.mockReturnValue(query);
    const { resolveSpecies, resolveSpeciesSync } = await import("@/services/speciesResolver");
    expect(await resolveSpecies("Mulberry", row.species_key)).toMatchObject({ speciesKey: row.species_key, scientificName: scientific, source: "db", confidence: "exact" });
    expect(eq).toHaveBeenCalledWith("species_key", row.species_key);
    expect(resolveSpeciesSync("Mulberry", row.species_key).scientificName).toBe(scientific);
    // A previous keyed lookup must not contaminate unkeyed broad-name resolution.
    expect(await resolveSpecies("Mulberry")).toMatchObject({ speciesKey: null, scientificName: null, confidence: "unresolved" });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("keeps the normal unrelated-species fallback unchanged", () => {
    expect(matchSpecies("English Oak")?.scientific).toBe("Quercus robur");
    expect(matchSpecies("Cork Oak")?.scientific).toBe("Quercus suber");
  });
});
