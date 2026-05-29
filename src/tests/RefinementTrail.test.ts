import { describe, it, expect } from "vitest";
import {
  fromEditHistory,
  fromChangeLog,
  fromProposals,
  fromLocationHistory,
  fromMergeHistory,
  mergeTrail,
  type EditHistoryRow,
  type ChangeLogRow,
  type ProposalRow,
  type LocationHistoryRow,
  type MergeHistoryRow,
} from "@/utils/refinementTrail";

describe("refinementTrail normalisers", () => {
  it("coalesces a multi-field direct edit (same actor+timestamp+reason) into one entry", () => {
    const rows: EditHistoryRow[] = [
      { id: "1", field_name: "name", old_value: "Old", new_value: "New", edit_reason: "fix", edit_type: "direct", user_id: "u1", created_at: "2026-05-01T10:00:00Z" },
      { id: "2", field_name: "species", old_value: "Oak", new_value: "Beech", edit_reason: "fix", edit_type: "direct", user_id: "u1", created_at: "2026-05-01T10:00:00Z" },
    ];
    const entries = fromEditHistory(rows);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("direct_edit");
    expect(entries[0].fields).toHaveLength(2);
    expect(entries[0].fields.map((f) => f.field)).toEqual(["name", "species"]);
    expect(entries[0].actorId).toBe("u1");
  });

  it("keeps separate edits (different timestamps) as separate entries", () => {
    const rows: EditHistoryRow[] = [
      { id: "1", field_name: "name", old_value: "A", new_value: "B", edit_reason: null, edit_type: "direct", user_id: "u1", created_at: "2026-05-01T10:00:00Z" },
      { id: "2", field_name: "name", old_value: "B", new_value: "C", edit_reason: null, edit_type: "direct", user_id: "u1", created_at: "2026-05-02T10:00:00Z" },
    ];
    expect(fromEditHistory(rows)).toHaveLength(2);
  });

  it("skips mirrored edit_types (proposal_accepted/merge/location_refined) to avoid double-display", () => {
    const rows: EditHistoryRow[] = [
      { id: "1", field_name: "name", old_value: "A", new_value: "B", edit_reason: null, edit_type: "direct", user_id: "u1", created_at: "2026-05-01T10:00:00Z" },
      { id: "2", field_name: "species", old_value: "Oak", new_value: "Beech", edit_reason: "accepted", edit_type: "proposal_accepted", user_id: "c1", created_at: "2026-05-02T10:00:00Z" },
      { id: "3", field_name: "merge", old_value: null, new_value: "tB", edit_reason: null, edit_type: "merge", user_id: "c1", created_at: "2026-05-03T10:00:00Z" },
      { id: "4", field_name: "location", old_value: "1,1", new_value: "2,2", edit_reason: null, edit_type: "location_refined", user_id: "c1", created_at: "2026-05-04T10:00:00Z" },
    ];
    const entries = fromEditHistory(rows);
    // Only the "direct" row survives; the three mirrored rows are surfaced by their
    // dedicated-table mappers instead.
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("edit:1");
    expect(entries[0].kind).toBe("direct_edit");
  });

  it("maps an accepted change_log row to a proposal_accepted entry with from/to diffs", () => {
    const rows: ChangeLogRow[] = [
      {
        id: "c1",
        change_set: { name: "Grandmother Oak", estimated_age: 800 },
        previous_values: { name: "Old Oak", estimated_age: 700 },
        merged_from_proposal_id: "p1",
        merged_by: "curator1",
        merged_at: "2026-05-03T10:00:00Z",
      },
    ];
    const entries = fromChangeLog(rows);
    expect(entries[0].kind).toBe("proposal_accepted");
    const nameDiff = entries[0].fields.find((f) => f.field === "name");
    expect(nameDiff).toEqual({ field: "name", from: "Old Oak", to: "Grandmother Oak" });
    expect(entries[0].meta?.proposalId).toBe("p1");
  });

  it("excludes accepted proposals (they are represented by change_log) but keeps others", () => {
    const rows: ProposalRow[] = [
      { id: "p1", proposed_changes: { species: "Beech" }, reason: "looks like beech", confidence: "high", status: "accepted", proposed_by: "u2", reviewer_id: "c1", reviewer_note: null, flags: ["species_change"], created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-02T00:00:00Z" },
      { id: "p2", proposed_changes: { name: "X" }, reason: "typo", confidence: "low", status: "pending", proposed_by: "u3", reviewer_id: null, reviewer_note: null, flags: [], created_at: "2026-05-04T00:00:00Z", updated_at: null },
      { id: "p3", proposed_changes: { name: "Y" }, reason: "wrong", confidence: "low", status: "rejected", proposed_by: "u4", reviewer_id: "c1", reviewer_note: "no evidence", flags: [], created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-05T00:00:00Z" },
    ];
    const entries = fromProposals(rows);
    expect(entries.map((e) => e.id)).toEqual(["proposal:p2", "proposal:p3"]);
    // pending dated by created_at; resolved dated by updated_at
    expect(entries.find((e) => e.id === "proposal:p2")?.at).toBe("2026-05-04T00:00:00Z");
    expect(entries.find((e) => e.id === "proposal:p3")?.at).toBe("2026-05-05T00:00:00Z");
    // proposed values render as to-only (no historical "from")
    expect(entries[0].fields[0].from).toBeNull();
  });

  it("formats a location refinement diff with coordinates + confidence", () => {
    const rows: LocationHistoryRow[] = [
      { id: "l1", old_latitude: 51.5, old_longitude: -0.1, new_latitude: 51.50012, new_longitude: -0.10005, old_confidence: "approximate", new_confidence: "refined", reason: "3 wanderer pins", changed_by: "c1", refinement_ids: ["r1", "r2", "r3"], created_at: "2026-05-06T10:00:00Z" },
    ];
    const entries = fromLocationHistory(rows);
    expect(entries[0].kind).toBe("location_refined");
    expect(entries[0].fields[0].to).toContain("refined");
    expect(entries[0].meta?.refinementCount).toBe(3);
  });

  it("maps a merge into a merge entry", () => {
    const rows: MergeHistoryRow[] = [
      { id: "m1", primary_tree_id: "tA", secondary_tree_id: "tB", merge_reason: "same tree", merged_by: "c1", created_at: "2026-05-07T10:00:00Z" },
    ];
    const entries = fromMergeHistory(rows);
    expect(entries[0].kind).toBe("merge");
    expect(entries[0].fields[0]).toEqual({ field: "merged", from: "tB", to: "tA" });
  });

  it("mergeTrail interleaves all sources newest-first", () => {
    const trail = mergeTrail(
      fromEditHistory([{ id: "1", field_name: "name", old_value: "A", new_value: "B", edit_reason: null, edit_type: "direct", user_id: "u1", created_at: "2026-05-01T00:00:00Z" }]),
      fromMergeHistory([{ id: "m1", primary_tree_id: "tA", secondary_tree_id: "tB", merge_reason: null, merged_by: "c1", created_at: "2026-05-09T00:00:00Z" }]),
      fromLocationHistory([{ id: "l1", old_latitude: 1, old_longitude: 1, new_latitude: 2, new_longitude: 2, old_confidence: null, new_confidence: "good", reason: null, changed_by: "c1", refinement_ids: [], created_at: "2026-05-05T00:00:00Z" }]),
    );
    expect(trail.map((e) => e.id)).toEqual(["merge:m1", "loc:l1", "edit:1"]);
  });
});
