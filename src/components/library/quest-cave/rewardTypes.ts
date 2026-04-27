/**
 * Quest reward metadata — shape of bonus heart-flow without backend claiming.
 *
 * Reward status vocabulary (no "Claimable" — claiming requires a safe ledger):
 *   - Locked                 → quest not complete
 *   - Prepared               → reward shape exists but backend claiming not live
 *   - Earned                 → quest complete, visual-only reward recognised
 *   - Requires Verification  → quest complete but needs higher trust
 *   - Claiming Coming Soon   → bonus hearts shown but cannot yet be claimed
 */
export type RewardStatus =
  | "Locked"
  | "Prepared"
  | "Earned"
  | "Requires Verification"
  | "Claiming Coming Soon";

export type VerificationLevel = "Seed" | "Rooted" | "Ancient" | "Council Verified";

export interface QuestRewardFlow {
  baseHeartsLabel?: string;
  bonusHearts?: number;
  speciesHearts?: { species: string; amount: number };
  hearthHearts?: number;
  circleHearts?: number;
  valueTreeBranch?: string;
  verificationLevel?: VerificationLevel;
}

/** Microcopy shown beneath the Heart Flow card. */
export const HEART_FLOW_MICROCOPY =
  "Bonus hearts are prepared here. Safe claiming will open once quest rewards are ledgered.";

/** Pick a button label for the current reward status. */
export function rewardButtonLabel(status: RewardStatus): string {
  switch (status) {
    case "Locked":                return "Continue Quest";
    case "Prepared":              return "Reward Prepared";
    case "Earned":                return "View Heart Flow";
    case "Requires Verification": return "Requires Verification";
    case "Claiming Coming Soon":  return "Claiming Coming Soon";
  }
}

/** Buttons for non-Earned states are disabled until safe claim logic exists. */
export function isRewardButtonDisabled(status: RewardStatus): boolean {
  return status !== "Earned";
}
