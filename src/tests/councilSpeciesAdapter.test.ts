import { describe, expect, it, vi } from "vitest";
import { appearanceKey, appearancesForSubject, resolveCouncilAppearance, type CouncilAppearance, type AppearanceReader } from "@/lib/relationships/councilAppearance";

// Fly Agaric proving case is TEST ONLY: no canonical production ID has been verified.
const species = { id: "fixture-only-canonical-species", species_key: "fixture-amanita", slug: "fixture-amanita", scientific_name: "Amanita muscaria", family: "Amanitaceae" };
const ref = { provider: "s33d", record_type: "species_index", id: species.id };
const appearance: CouncilAppearance = {
  record_type: "council_appearance", circle_ref: { provider: "council_manifest", id: "council-of-life/circle-235" },
  companion_id: "c235_flyagaric", role: "Fungi",
  subject_binding: { state: "BOUND_TO_EXISTING_RECORD", ref },
  represented_by: [], supported_by: [], chapter_editions: [], encounter_ref: null, encounter_state: null,
  consent: { personal_material: "NOT_VERIFIED_FOR_PUBLIC_REUSE", source_ref: { provider: "fixture", id: "test-only" } },
  harvest_ref: null, visibility: "REVIEW_ONLY", provenance: { basis: "TEST_ONLY_NOT_A_PRODUCTION_BINDING" },
};
const reader = () => ({
  tree: vi.fn(), species: vi.fn(), hive: vi.fn(),
  speciesById: vi.fn(async () => ({ data: species, error: null })),
});

describe("generic read-only species subject adapter", () => {
  it("resolves the owning record by exact ID and adds no individual or onward Hive assertion", async () => {
    const r = reader();
    const before = JSON.stringify(appearance);
    const p = await resolveCouncilAppearance(appearance, r, "review");
    expect(p).toMatchObject({ status: "RESOLVED", resolvedSubject: ref, species, tree: null, hive: null, role: "Fungi" });
    expect(r.speciesById).toHaveBeenCalledExactlyOnceWith(ref.id);
    expect(r.tree).not.toHaveBeenCalled();
    expect(r.species).not.toHaveBeenCalled(); // the tree's species-key traversal is not reused as an ID lookup
    expect(r.hive).not.toHaveBeenCalled();
    expect(JSON.stringify(appearance)).toBe(before);
  });
  it("record resolution neither creates encounter evidence nor promotes consent, representation or claims", async () => {
    const p = await resolveCouncilAppearance(appearance, reader(), "review");
    expect(p).toMatchObject({ encounterRef: null, encounterState: null, representedBy: [], supportedBy: [], harvestRef: null,
      consent: appearance.consent, provenance: appearance.provenance, visibility: "REVIEW_ONLY" });
    expect(p.subjectBinding).toEqual(appearance.subject_binding);
    expect(p.tree).toBeNull();
    expect(p).not.toHaveProperty("organismId");
    expect(p).not.toHaveProperty("ecologicalRelationship");
  });
  it("resolves repeated appearances to the same canonical species without any record creation", async () => {
    const other = { ...appearance, circle_ref: { provider: "fixture", id: "fixture/other-circle" }, companion_id: "fixture_fungi" };
    const r = reader();
    const result = await Promise.all([appearance, other].map(a => resolveCouncilAppearance(a, r, "review")));
    expect(appearanceKey(appearance)).not.toBe(appearanceKey(other));
    expect(result.map(p => p.resolvedSubject.id)).toEqual([species.id, species.id]);
    expect(appearancesForSubject([appearance, other], ref)).toHaveLength(2);
    expect(r.speciesById).toHaveBeenCalledTimes(2);
    expect(result.every(p => p.tree === null && p.encounterRef === null)).toBe(true);
  });
  it("does not require family/Hive metadata for canonical species resolution", async () => {
    const r = reader();
    r.speciesById.mockResolvedValueOnce({ data: { ...species, family: null, slug: null, scientific_name: null }, error: null } as never);
    expect((await resolveCouncilAppearance(appearance, r, "review")).status).toBe("RESOLVED");
    expect(r.hive).not.toHaveBeenCalled();
  });
  it.each([
    [{ ...ref, id: "" }, "INVALID_SUBJECT_REFERENCE"],
    [{ ...ref, provider: "other" }, "UNSUPPORTED_NAMESPACE"],
    [{ ...ref, record_type: "unimplemented_owner" }, "UNSUPPORTED_READER"],
  ] as const)("fails safely for %j before any read", async (candidate, status) => {
    const r = reader();
    const p = await resolveCouncilAppearance({ ...appearance, subject_binding: { ...appearance.subject_binding, ref: candidate } }, r, "review");
    expect(p).toMatchObject({ status, resolvedSubject: null });
    expect(r.speciesById).not.toHaveBeenCalled();
    expect(r.tree).not.toHaveBeenCalled();
    expect(r.species).not.toHaveBeenCalled();
    expect(r.hive).not.toHaveBeenCalled();
  });
  it("keeps older readers compatible and reports an absent species adapter without querying", async () => {
    const r: AppearanceReader = { tree: vi.fn(), species: vi.fn(), hive: vi.fn() };
    expect((await resolveCouncilAppearance(appearance, r, "review")).status).toBe("UNSUPPORTED_READER");
    expect(r.species).not.toHaveBeenCalled();
  });
  it.each(["missing", "wrong_id", "error", "exception"])("does not substitute a plausible species when %s", async mode => {
    const r = reader();
    if (mode === "missing") r.speciesById.mockResolvedValueOnce({ data: null, error: null });
    if (mode === "wrong_id") r.speciesById.mockResolvedValueOnce({ data: { ...species, id: "different-record" }, error: null });
    if (mode === "error") r.speciesById.mockResolvedValueOnce({ data: species, error: { message: "denied" } } as never);
    if (mode === "exception") r.speciesById.mockRejectedValueOnce(new Error("network"));
    expect(await resolveCouncilAppearance(appearance, r, "review")).toMatchObject({
      status: mode === "missing" || mode === "wrong_id" ? "SUBJECT_MISSING" : "UNAVAILABLE", resolvedSubject: null, species: null,
    });
  });
  it("keeps unresolved bindings and public projections query-free", async () => {
    const r = reader();
    expect(await resolveCouncilAppearance(appearance, r, "public")).toBeNull();
    const unresolved = { ...appearance, subject_binding: { state: "UNRESOLVED", ref: null } };
    expect(await resolveCouncilAppearance(unresolved, r, "review")).toMatchObject({ status: "UNRESOLVED", companionId: "c235_flyagaric", resolvedSubject: null });
    expect(r.speciesById).not.toHaveBeenCalled();
  });
  it("uses SELECT/id/maybeSingle in the production adapter; every write is forbidden", async () => {
    const calls: unknown[][] = [];
    const forbidden = vi.fn(() => { throw new Error("WRITE FORBIDDEN"); });
    vi.doMock("@/integrations/supabase/client", () => ({ supabase: {
      from: (table: string) => ({
        select: (fields: string) => ({ eq: (key: string, value: string) => {
          calls.push([table, fields, key, value]);
          return { maybeSingle: async () => ({ data: species, error: null }) };
        } }), insert: forbidden, upsert: forbidden, update: forbidden, delete: forbidden,
      }), rpc: forbidden,
    } }));
    const { councilAppearanceReader } = await import("@/lib/relationships/councilAppearanceReader");
    expect((await resolveCouncilAppearance(appearance, councilAppearanceReader, "review")).status).toBe("RESOLVED");
    expect(calls).toEqual([["species_index", "id, species_key, slug, scientific_name, family", "id", ref.id]]);
    expect(forbidden).not.toHaveBeenCalled();
    vi.doUnmock("@/integrations/supabase/client");
  });
});
