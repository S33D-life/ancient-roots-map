/**
 * Shared encounter season resolver — the single source of truth for the
 * month → `season_stage` mapping that was previously copy-pasted, byte-identical,
 * across TreeCheckinButton, QuickCheckinButton, and mapWishHandler.
 *
 * Pure + dependency-free. No behaviour change: `seasonStage()` returns exactly
 * what the old inline `seasonMap[month] || "other"` returned (the map covers all
 * 12 months, so the "other" fallback is only reachable for an out-of-range month).
 *
 * Part of Encounter convergence step C1 (see docs/ENCOUNTER_CONVERGENCE_PLAN.md):
 * extract shared logic; the check-in surfaces stay distinct.
 */

export type SeasonStage = "bare" | "bud" | "leaf" | "blossom" | "fruit" | "other";

/** Month index (0 = January … 11 = December) → canopy season stage. */
export const SEASON_STAGE_BY_MONTH: Record<number, SeasonStage> = {
  0: "bare",
  1: "bare",
  2: "bud",
  3: "bud",
  4: "leaf",
  5: "blossom",
  6: "leaf",
  7: "leaf",
  8: "fruit",
  9: "fruit",
  10: "bare",
  11: "bare",
};

/**
 * Resolve the canopy season stage for a date (defaults to now).
 * Mirrors the previous inline `seasonMap[new Date().getMonth()] || "other"`.
 */
export function seasonStage(date: Date = new Date()): SeasonStage {
  return SEASON_STAGE_BY_MONTH[date.getMonth()] ?? "other";
}
