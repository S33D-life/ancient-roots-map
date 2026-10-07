import { describe, expect, it, vi } from "vitest";
import raw from "@/data/relationships/council-appearances/c235_holmoak.json";
import chronology from "./fixtures/amanitaChronologyStress.json";
import { appearanceKey, appearancesForSubject, resolveCouncilAppearance, type CouncilAppearance } from "@/lib/relationships/councilAppearance";

// Test-only query sketch, not an Event API or production Living Thread model.
const ref = chronology.identity.test_subject_ref;
const appearances: CouncilAppearance[] = chronology.sources.map(source => ({
  ...raw as CouncilAppearance,
  circle_ref: { provider: "fixture", id: `council/${source.council_number}` },
  companion_id: `fixture_${source.council_number}_fungi`, role: "Fungi",
  subject_binding: { state: "BOUND_TO_EXISTING_RECORD", ref },
  represented_by: [], supported_by: [{ ...source.ref, selector: source.selector, scope: "listed_as_council_companion_only" }],
  chapter_editions: [], encounter_ref: null, encounter_state: null, harvest_ref: null,
  consent: { personal_material: "NOT_VERIFIED_FOR_PUBLIC_REUSE", source_ref: source.ref },
  provenance: { basis: source.basis, event_date: source.event_date, recorded_date: source.recorded_date },
}));
const emptyReader = () => ({ tree: vi.fn(), species: vi.fn(), hive: vi.fn() });
const reviewView = () => ({
  // Domain records stay separate; no converted gatherings/practices/claims.
  appearances: appearancesForSubject(appearances, ref),
  records: chronology.items,
  sources: chronology.sources,
  coverage: chronology.coverage,
  outward: chronology.outward_roles.map(role => ({ role, ref: null, state: "UNRESOLVED" })),
});

describe("Amanita chronology stress-test — fixtures only", () => {
  it("uses one test subject across three independently sourced Council appearances", () => {
    const view = reviewView();
    expect(view.appearances).toHaveLength(3);
    expect(new Set(view.appearances.map(appearanceKey)).size).toBe(3);
    expect(new Set(view.appearances.map(a => JSON.stringify(a.subject_binding.ref))).size).toBe(1);
    expect(chronology.identity.verified_canonical_ref).toBeNull();
    expect(chronology.status).toBe("TEST_ONLY_NOT_A_CANONICAL_HISTORY");
  });
  it("keeps the actual original document identities and dates without treating copies as new Councils", () => {
    expect(chronology.sources.map(s => [s.council_number, s.event_date])).toEqual([[124, "2022-10-25"], [132, "2022-12-21"], [139, "2023-02-07"]]);
    expect(reviewView().appearances).toHaveLength(3);
    expect(chronology.historical_copy.copied_on).not.toBe(chronology.historical_copy.same_event_date);
    expect(chronology.historical_copy.equivalence).toBe("REVIEW_REQUIRED_NOT_HASH_VERIFIED");
  });
  it("preserves seven documentary kinds rather than turning all items into appearances", () => {
    const kinds = new Set([...reviewView().records.map(r => r.kind), "council_appearance"]);
    expect([...kinds].sort()).toEqual(["encounter", "gathering", "council_appearance", "living_practice", "relationship", "source_artefact", "testimony"].sort());
    expect(appearances.every(a => a.encounter_ref === null && a.encounter_state === null)).toBe(true);
  });
  it("preserves the documentary gap without fabricating negative sightings or continuity", () => {
    const { records, coverage } = reviewView();
    expect(records.filter(r => r.kind === "encounter").map(r => r.when?.value)).toEqual(["2018", "2022"]);
    expect(coverage.gap).toMatchObject({ state: "DOCUMENTARY_GAP", after_year: 2018, before_year: 2022, absence_of_encounters_asserted: false });
    expect(records.some(r => ["2019", "2020", "2021"].includes(r.when?.value))).toBe(false);
    expect(records.find(r => r.fixture_id === "later").when.extent).toContain("not_continuous_observation");
  });
  it("keeps event dates, recording dates and date precision separate; unknown dates remain null", () => {
    expect(chronology.items.find(r => r.fixture_id === "early").when.precision).toBe("year");
    expect(chronology.items.find(r => r.fixture_id === "practice").when).toBeNull();
    expect(chronology.items.find(r => r.fixture_id === "recollection").recorded_when).toBeNull();
    expect(chronology.sources.every(s => s.event_date && s.recorded_date)).toBe(true);
  });
  it.each(chronology.unsupported_promotions)("does not promote %s into %s in the proposed derived view", (basis, unsupported) => {
    // No inference engine: the view preserves input statements and emits no inferred claim.
    const view = reviewView();
    expect(JSON.stringify(view.records)).not.toContain(`"predicate":"${unsupported}"`);
    expect(view.appearances.every(a => a.supported_by.every(s => s.scope === "listed_as_council_companion_only"))).toBe(true);
    expect(chronology.unsupported_promotions.some(pair => pair[0] === basis && pair[1] === unsupported)).toBe(true);
  });
  it("does not infer Birch taxonomy or ecological partnership from a labelled photographic scenario", () => {
    const relation = chronology.items.find(r => r.fixture_id === "beside");
    expect(relation).toMatchObject({ predicate: "photographed_beside", scope: "depicted_co_presence", object_ref: null, source_ref: null });
    expect(relation.basis).toBe("SCENARIO_ONLY_PHOTO_NOT_FETCHED");
  });
  it("can expose outward reference slots without creating people, places, Hives or Chapters", () => {
    expect(reviewView().outward.map(r => r.role)).toEqual(["place", "person", "council", "chapter", "ecological_relationship", "hive"]);
    expect(reviewView().outward.every(r => r.ref === null && r.state === "UNRESOLVED")).toBe(true);
  });
  it("pins the real resolver limitation: a non-tree subject cannot yet traverse to a Hive", async () => {
    const reader = emptyReader();
    const p = await resolveCouncilAppearance(appearances[0], reader, "review");
    expect(p).toMatchObject({ status: "UNSUPPORTED_NAMESPACE", tree: null, species: null, hive: null });
    expect(reader.tree).not.toHaveBeenCalled();
    expect(reader.species).not.toHaveBeenCalled();
  });
  it("preserves role and original subject binding in the projection", async () => {
    const p = await resolveCouncilAppearance(appearances[0], emptyReader(), "review");
    expect(p.role).toBe("Fungi");
    expect(p.subjectBinding).toEqual(appearances[0].subject_binding);
  });
  it("preserves null binding and the Council spatial ID without querying or inventing a species", async () => {
    const a = { ...appearances[0], companion_id: "c235_flyagaric", subject_binding: { state: "UNRESOLVED", ref: null } };
    const reader = emptyReader();
    expect(await resolveCouncilAppearance(a, reader, "review")).toMatchObject({ companionId: "c235_flyagaric", status: "UNRESOLVED" });
    expect(reader.tree).not.toHaveBeenCalled();
    expect(appearancesForSubject([a], ref)).toEqual([]);
  });
  it("rejects incomplete-reference matches without fabricating a subject ID", () => {
    const incomplete = { provider: "fixture", record_type: "species_strand" };
    const a = { ...appearances[0], subject_binding: { state: "BOUND_TO_EXISTING_RECORD", ref: incomplete } };
    expect(appearancesForSubject([a], incomplete)).toEqual([]);
  });
  it("suppresses every historical fixture for the public audience", async () => {
    for (const a of appearances) expect(await resolveCouncilAppearance(a, emptyReader(), "public")).toBeNull();
  });
});
