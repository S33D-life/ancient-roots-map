import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import raw from "@/data/relationships/council-appearances/c235_holmoak.json";
import { appearancesForSubject, appearanceKey, resolveCouncilAppearance, type CouncilAppearance, type AppearanceReader } from "@/lib/relationships/councilAppearance";

const appearance = raw as CouncilAppearance;
const tree = { id: "924453c0-f4f5-4ed4-88fe-5b2ed6570af0", name: "Holm Oak", species_key: "quercus-ilex" };
const species = { id: "aa782ed4-1b80-46ff-890b-e3d30dd2383c", species_key: "quercus-ilex", slug: "quercus-ilex", scientific_name: "Quercus ilex", family: "Fagaceae" };
const hive = { id: "e5b8b38b-6b0b-4542-bec0-db119f89ac99", slug: "fagaceae", family_name: "Fagaceae", display_name: "Oak & Beech Hive" };
const reader = () => ({ tree: vi.fn(async () => ({ data: tree, error: null })), species: vi.fn(async () => ({ data: species, error: null })), hive: vi.fn(async () => ({ data: hive, error: null })) });

describe("Holm Oak reference-only pilot", () => {
  it("reuses exact identities, follows existing keys and does not mutate the index", async () => {
    const before = JSON.stringify(appearance);
    const r = reader();
    const p = await resolveCouncilAppearance(appearance, r, "review");
    expect(p.status).toBe("RESOLVED");
    expect(p.tree.id).toBe(tree.id);
    expect(p.species.id).toBe(species.id);
    expect(p.hive.id).toBe(hive.id);
    expect(r.tree).toHaveBeenCalledWith(tree.id);
    expect(r.species).toHaveBeenCalledWith("quercus-ilex");
    expect(r.hive).toHaveBeenCalledWith("Fagaceae");
    expect(JSON.stringify(appearance)).toBe(before);
    expect(JSON.stringify(appearance)).not.toContain(species.id);
    expect(JSON.stringify(appearance)).not.toContain(hive.id);
  });
  it("derives onward links from changed canonical relationships without editing the appearance", async () => {
    const r: AppearanceReader = {
      tree: async () => ({ data: { ...tree, species_key: "changed-existing-key" }, error: null }),
      species: vi.fn(async () => ({ data: { ...species, species_key: "changed-existing-key", family: "ExistingFamily" }, error: null })),
      hive: vi.fn(async () => ({ data: { ...hive, family_name: "ExistingFamily" }, error: null })),
    };
    expect((await resolveCouncilAppearance(appearance, r, "review")).status).toBe("RESOLVED");
    expect(r.species).toHaveBeenCalledWith("changed-existing-key");
    expect(r.hive).toHaveBeenCalledWith("ExistingFamily");
  });
  it("keeps represented_by separate from supported_by and retains all state qualifiers", async () => {
    const p = await resolveCouncilAppearance(appearance, reader(), "review");
    expect(p.representedBy[0].kind).toBe("illustrated_learning_artefact");
    expect(p.supportedBy).toEqual([]);
    expect(p.encounterState.code).toBe("ENCOUNTERED_DOCUMENTATION_PARTIAL");
    expect(p.encounterState.label).toBe("Encountered · documentation partial");
    expect(p.encounterRef.version).toBe("235.6.0");
    expect(p.harvestRef).toBeNull();
    expect(p.editions[0]).toMatchObject({ review_state: "CANDIDATE", edition: "PRE_FIRE", visibility: "REVIEW_ONLY" });
    expect(p.provenance.individual_identification_state).toBe("PROPOSAL");
    expect(p.consent.personal_material).toBe("NOT_VERIFIED_FOR_PUBLIC_REUSE");
    expect(JSON.stringify(p)).not.toMatch(/words_leo|words_bruna|noticed|photos\/holm/);
  });
  it("preserves unresolved appearance identity without any lookup or creation", async () => {
    const r = reader();
    const p = await resolveCouncilAppearance({ ...appearance, subject_binding: { state: "UNRESOLVED", ref: null } }, r, "review");
    expect(p).toMatchObject({ status: "UNRESOLVED", companionId: "c235_holmoak", circle: { id: "council-of-life/circle-235" }, tree: null });
    expect(r.tree).not.toHaveBeenCalled();
  });
  it.each(["tree", "species", "hive"] as const)("fails closed for missing %s without inventing a record", async stage => {
    const r = reader();
    r[stage] = vi.fn(async () => ({ data: null, error: null })) as never;
    const p = await resolveCouncilAppearance(appearance, r, "review");
    expect(p.status).toBe({ tree: "SUBJECT_MISSING", species: "SPECIES_MISSING", hive: "HIVE_MISSING" }[stage]);
    expect(p[stage]).toBeNull();
    if (stage === "tree") expect(r.species).not.toHaveBeenCalled();
    if (stage !== "hive") expect(r.hive).not.toHaveBeenCalled();
  });
  it("does not replace query errors or a wrong individual with a plausible match", async () => {
    const r = reader();
    r.tree.mockResolvedValueOnce({ data: { ...tree, id: "another-tree" }, error: null });
    expect((await resolveCouncilAppearance(appearance, r, "review")).status).toBe("SUBJECT_MISSING");
    r.tree.mockRejectedValueOnce(new Error("network"));
    expect((await resolveCouncilAppearance(appearance, r, "review")).status).toBe("UNAVAILABLE");
    r.tree.mockResolvedValueOnce({ data: null, error: { message: "permission denied" } } as never);
    expect((await resolveCouncilAppearance(appearance, r, "review")).status).toBe("UNAVAILABLE");
  });
  it("returns no public projection, media paths or private provenance and performs no reads", async () => {
    const r = reader();
    expect(await resolveCouncilAppearance(appearance, r, "public")).toBeNull();
    expect(r.tree).not.toHaveBeenCalled();
  });
  it("finds the reciprocal appearance by qualified existing subject identity", () => {
    expect(appearancesForSubject([appearance], appearance.subject_binding.ref)).toEqual([appearance]);
    expect(appearancesForSubject([appearance], { ...appearance.subject_binding.ref, provider: "other" })).toEqual([]);
  });
  it("can describe repeated Amanita appearances without any Amanita-specific fields or real records", () => {
    // Structural fixtures only; no production identity or record is created.
    const unresolved = { ...appearance, companion_id: "c235_flyagaric", subject_binding: { state: "UNRESOLVED", ref: null } };
    const next = { ...unresolved, companion_id: "fixture_flyagaric", circle_ref: { provider: "council_manifest", id: "fixture/circle-next" } };
    expect(appearanceKey(unresolved)).not.toBe(appearanceKey(next));
    const futureRef = { provider: "fixture", record_type: "species_strand", id: "same-existing-subject" };
    const bound = [unresolved, next].map(a => ({ ...a, subject_binding: { state: "BOUND_TO_EXISTING_RECORD", ref: futureRef } }));
    expect(appearancesForSubject(bound, futureRef)).toHaveLength(2);
  });
});

describe("SELECT-only production adapter", () => {
  it("makes the complete read traversal using existing filters; write methods are forbidden", async () => {
    const calls: unknown[][] = [];
    const fixtures = { trees: tree, species_index: species, species_hives: hive };
    const forbidden = vi.fn(() => { throw new Error("WRITE FORBIDDEN"); });
    vi.doMock("@/integrations/supabase/client", () => ({ supabase: {
      from: (table: keyof typeof fixtures) => ({
        select: (fields: string) => ({ eq: (key: string, value: string) => {
          calls.push([table, key, value, fields]);
          return { maybeSingle: async () => ({ data: fixtures[table], error: null }) };
        } }), insert: forbidden, upsert: forbidden, update: forbidden, delete: forbidden,
      }), rpc: forbidden,
    } }));
    const { councilAppearanceReader } = await import("@/lib/relationships/councilAppearanceReader");
    expect((await resolveCouncilAppearance(appearance, councilAppearanceReader, "review")).status).toBe("RESOLVED");
    expect(calls.map(c => c.slice(0, 3))).toEqual([["trees", "id", tree.id], ["species_index", "species_key", species.species_key], ["species_hives", "family_name", species.family]]);
    expect(forbidden).not.toHaveBeenCalled();
    vi.doUnmock("@/integrations/supabase/client");
  });
  it("gates both lazy UI entrypoints before loading review-only data", () => {
    for (const path of ["src/pages/CouncilOfLifePage.tsx", "src/pages/TreeDetailPage.tsx"]) {
      const source = readFileSync(path, "utf8");
      expect(source).toMatch(/import\.meta\.env\.DEV\s*\? lazy\(\(\) => import\("@\/components\/council\/CouncilAppearancePilot"\)\) : null/);
    }
  });
});
