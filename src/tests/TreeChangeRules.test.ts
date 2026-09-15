import { describe, it, expect } from "vitest";
import {
  TREE_EDITABLE_FIELDS,
  TREE_TEXT_FIELDS,
  TREE_GROWTH_EVENT_SOURCES,
} from "@/lib/tree-change/fields";

const FORBIDDEN = [
  "id",
  "created_by",
  "created_at",
  "updated_at",
  "merged_into_tree_id",
  "verification_status",
  "accessibility_tier",
  "location_confidence",
  "refinement_count",
];

describe("tree change allow-list", () => {
  it("never exposes ownership, identity or administrative fields", () => {
    for (const field of FORBIDDEN) {
      expect(TREE_EDITABLE_FIELDS).not.toContain(field as never);
    }
  });

  it("mirrors the database allow-list exactly", () => {
    expect([...TREE_EDITABLE_FIELDS].sort()).toEqual(
      [
        "access_notes",
        "description",
        "estimated_age",
        "girth_cm",
        "latitude",
        "longitude",
        "lore_text",
        "name",
        "planted_year",
        "species",
        "variety_name",
        "what3words",
      ],
    );
  });

  it("offers only allow-listed fields on the details form", () => {
    for (const field of TREE_TEXT_FIELDS) {
      expect(TREE_EDITABLE_FIELDS).toContain(field.key);
    }
    // Location is corrected on the map, never as a free-text details field.
    expect(TREE_TEXT_FIELDS.map((f) => f.key)).not.toContain("latitude" as never);
    expect(TREE_TEXT_FIELDS.map((f) => f.key)).not.toContain("longitude" as never);
  });

  it("gives every field a readable label without database wording", () => {
    for (const field of TREE_TEXT_FIELDS) {
      expect(field.label.length).toBeGreaterThan(2);
      expect(field.label).not.toContain("_");
    }
  });

  it("counts only intentional, persisted contributions as growth", () => {
    expect(TREE_GROWTH_EVENT_SOURCES).toContain("offering");
    expect(TREE_GROWTH_EVENT_SOURCES).toContain("checkin");
    // Passive reading of a tree page must never count.
    expect(TREE_GROWTH_EVENT_SOURCES).not.toContain("page_view" as never);
    expect(TREE_GROWTH_EVENT_SOURCES).not.toContain("view" as never);
  });
});
