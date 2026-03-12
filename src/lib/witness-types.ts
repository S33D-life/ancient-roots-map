/**
 * Witness session types — shared across hooks and components.
 */

export type WitnessSessionStatus =
  | "waiting"
  | "joined"
  | "confirming"
  | "witnessed"
  | "expired"
  | "cancelled";

export interface WitnessSession {
  id: string;
  tree_id: string;
  initiator_id: string;
  joiner_id: string | null;
  companion_channel: string | null;
  status: WitnessSessionStatus;
  initiator_lat: number | null;
  initiator_lng: number | null;
  initiator_accuracy_m: number | null;
  joiner_lat: number | null;
  joiner_lng: number | null;
  joiner_accuracy_m: number | null;
  initiator_confirmed: boolean;
  joiner_confirmed: boolean;
  initiator_checkin_id: string | null;
  joiner_checkin_id: string | null;
  initiator_photos: string[];
  joiner_photos: string[];
  initiator_offerings: string[];
  joiner_offerings: string[];
  hearts_awarded: number;
  verified_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

/** GPS proximity threshold in meters for co-witnessing */
export const WITNESS_PROXIMITY_M = 50;

/** Maximum session duration */
export const WITNESS_SESSION_TTL_MS = 15 * 60 * 1000;

/** Bonus hearts for a co-witnessed scan */
export const WITNESS_BONUS_HEARTS = 3;
