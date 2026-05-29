/**
 * buildCheckinPayload — shared composer for the spatial / method / proof CORE of
 * a `tree_checkins` insert. Encounter convergence step C2 (see
 * docs/ENCOUNTER_C2_SPEC.md). Pure; no schema change — every field already exists.
 *
 * Surfaces spread the result and add their own emotional extras (weather,
 * reflection, sky_stamp_id, refinement nudge, offline media). This standardises:
 *   - accuracy_m    — always written when available (TreeCheckinButton previously dropped it)
 *   - canopy_proof  — one stricter formula: a GPS fix accurate to < 100 m
 *   - season_stage  — via the C1 `seasonStage()` helper
 *   - checkin_method / privacy — safe defaults, with overrides where a surface differs
 */
import { seasonStage } from "@/lib/encounters/encounterSeason";

/** Accuracy (metres) strictly under which a GPS fix counts as canopy proof. */
export const CANOPY_PROOF_MAX_ACCURACY_M = 100;

export type CheckinMethod = "gps" | "manual";

export interface CheckinCoreInput {
  treeId: string;
  userId: string;
  lat?: number | null;
  lng?: number | null;
  accuracyM?: number | null;
  /** Defaults to "public" — the prior default on every path that didn't let the user choose. */
  privacy?: string;
  /** Override the derived method. TreeCheckinButton keys off the user's GPS toggle, not the fix. */
  checkinMethod?: CheckinMethod;
  /** Date used for season_stage; defaults to now. */
  at?: Date;
}

export interface CheckinCorePayload {
  tree_id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  season_stage: string;
  checkin_method: CheckinMethod;
  canopy_proof: boolean;
  privacy: string;
}

export function buildCheckinPayload(input: CheckinCoreInput): CheckinCorePayload {
  const latitude = input.lat ?? null;
  const longitude = input.lng ?? null;
  const accuracy_m = input.accuracyM ?? null;
  const hasFix = latitude !== null && longitude !== null;

  return {
    tree_id: input.treeId,
    user_id: input.userId,
    latitude,
    longitude,
    accuracy_m,
    season_stage: seasonStage(input.at),
    checkin_method: input.checkinMethod ?? (hasFix ? "gps" : "manual"),
    canopy_proof:
      hasFix && accuracy_m !== null && accuracy_m < CANOPY_PROOF_MAX_ACCURACY_M,
    privacy: input.privacy ?? "public",
  };
}
