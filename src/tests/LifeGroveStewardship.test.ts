/**
 * Life Grove stewardship guards.
 *
 * The database is authoritative for every rule below; these tests lock in the
 * client-side contract so a future change cannot quietly widen it.
 */
import { describe, it, expect } from "vitest";
import {
  GROVE_CONTENT_FIELDS,
  GROVE_FIELD_KEYS,
  isGroveContentField,
  groveFieldLabel,
  tendingSourceLabel,
} from "@/lib/life-groves/stewardship";

describe("grove content field allow-list", () => {
  it("never exposes ownership, tokens or administrative fields", () => {
    const forbidden = [
      "id",
      "created_by",
      "invite_token",
      "created_at",
      "updated_at",
      "linked_tree_id",
      "privacy",
      "hearts_applied",
      "package_price_pence",
      "planting_status",
    ];
    for (const key of forbidden) {
      expect(GROVE_FIELD_KEYS).not.toContain(key);
      expect(isGroveContentField(key)).toBe(false);
    }
  });

  it("only contains grove content fields", () => {
    expect(GROVE_CONTENT_FIELDS.length).toBe(15);
    for (const f of GROVE_CONTENT_FIELDS) {
      expect(isGroveContentField(f.key)).toBe(true);
      expect(f.label.length).toBeGreaterThan(0);
    }
  });

  it("rejects an arbitrary column name from the client", () => {
    expect(isGroveContentField("created_by; drop table life_groves")).toBe(false);
    expect(isGroveContentField("")).toBe(false);
  });

  it("labels the rooted tree and stewardship without database wording", () => {
    expect(groveFieldLabel("linked_tree_id")).toBe("Rooted Ancient Friend");
    expect(groveFieldLabel("stewardship")).toBe("Stewardship");
    expect(groveFieldLabel("grove_title")).toBe("Grove name");
  });

  it("describes how a change happened", () => {
    expect(tendingSourceLabel("accepted_proposal")).toBe("accepted proposal");
    expect(tendingSourceLabel("rooted_tree_change")).toBe("rooted tree");
    expect(tendingSourceLabel("steward_tending")).toBe("tended directly");
  });
});
