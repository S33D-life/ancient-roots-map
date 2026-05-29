import { describe, it, expect } from "vitest";
import {
  seasonStage,
  SEASON_STAGE_BY_MONTH,
  type SeasonStage,
} from "@/lib/encounters/encounterSeason";

/**
 * Guards the C1 extraction: `seasonStage()` must return exactly what the old
 * inline `seasonMap[new Date().getMonth()] || "other"` returned in
 * TreeCheckinButton / QuickCheckinButton / mapWishHandler.
 */
const LEGACY_SEASON_MAP: Record<number, string> = {
  0: "bare", 1: "bare", 2: "bud", 3: "bud", 4: "leaf", 5: "blossom",
  6: "leaf", 7: "leaf", 8: "fruit", 9: "fruit", 10: "bare", 11: "bare",
};

describe("encounterSeason.seasonStage", () => {
  it("matches the legacy inline seasonMap for every month, byte-for-byte", () => {
    for (let month = 0; month < 12; month += 1) {
      // mid-month UTC date to avoid any timezone edge at month boundaries
      const date = new Date(Date.UTC(2026, month, 15, 12, 0, 0));
      const expected = LEGACY_SEASON_MAP[date.getMonth()] || "other";
      expect(seasonStage(date)).toBe(expected);
    }
  });

  it("returns the documented stage for each canopy phase", () => {
    expect(seasonStage(new Date(2026, 0, 15))).toBe("bare");    // Jan
    expect(seasonStage(new Date(2026, 2, 15))).toBe("bud");     // Mar
    expect(seasonStage(new Date(2026, 4, 15))).toBe("leaf");    // May
    expect(seasonStage(new Date(2026, 5, 15))).toBe("blossom"); // Jun
    expect(seasonStage(new Date(2026, 8, 15))).toBe("fruit");   // Sep
    expect(seasonStage(new Date(2026, 10, 15))).toBe("bare");   // Nov
  });

  it("defaults to the current date when called with no argument", () => {
    const expected = LEGACY_SEASON_MAP[new Date().getMonth()] || "other";
    expect(seasonStage()).toBe(expected);
  });

  it("the exported map covers all 12 months (so 'other' is unreachable for valid months)", () => {
    for (let month = 0; month < 12; month += 1) {
      expect(SEASON_STAGE_BY_MONTH[month]).toBeDefined();
    }
    const stages: SeasonStage[] = Object.values(SEASON_STAGE_BY_MONTH);
    expect(stages).toHaveLength(12);
  });
});
