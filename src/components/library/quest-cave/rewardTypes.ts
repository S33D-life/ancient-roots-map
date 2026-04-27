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

/**
 * Canonical Value Tree branch names.
 * Quest configs should use one of these to avoid near-duplicates drifting in.
 */
export type ValueTreeBranch =
  | "Creator Path"
  | "Pilgrim Path"
  | "Collector Path"
  | "Curator Path"
  | "Spark Path"
  | "Family Hearth"
  | "Species Hives"
  | "Oak Hive"
  | "Spring Bloom"
  | "Place-Based Pilgrimage"
  | "Four Seasons"
  | "Great Quest"
  /** Compound branches kept narrow for clarity */
  | "Spring Pilgrim Branch"
  | "Spring Bloom Branch"
  | "Four Seasons Branch"
  | "Creator Path / Tree Radio"
  | "Collector Path / Seed Cellar"
  | "Collective Spring Bloom"
  | "Species Hive Canopy"
  | "Great Quest / Spring Encounters"
  /** Spark / Bug Bounty branches — Builder & Trust lineage */
  | "Spark Path / Builder Branch"
  | "Bug Garden / Curator Branch"
  | "Quality / Pilgrim / Builder"
  | "Creator / Curator"
  | "Trust / Curator"
  | "Builder / Agentic Garden";

export interface QuestRewardFlow {
  baseHeartsLabel?: string;
  bonusHearts?: number;
  speciesHearts?: { species: string; amount: number };
  hearthHearts?: number;
  circleHearts?: number;
  valueTreeBranch?: ValueTreeBranch;
  verificationLevel?: VerificationLevel;
}

/** Microcopy shown beneath the Heart Flow card. */
export const HEART_FLOW_MICROCOPY =
  "Bonus hearts are prepared here. Safe claiming will open once quest rewards are ledgered.";

/** Secondary note clarifying that prepared flows are not minted yet. */
export const HEART_FLOW_NOTE =
  "Prepared flows are not yet minted. They show how quest rewards will move once the ledger opens.";

/** Native S33D copy for each verification level — used as tooltip / helper text. */
export const VERIFICATION_COPY: Record<VerificationLevel, string> = {
  Seed:               "Basic action complete.",
  Rooted:             "Strengthened by photo, place, species, or offering.",
  Ancient:            "Supported by age, source, lineage, or stronger evidence.",
  "Council Verified": "Reviewed by a curator, council, or trusted steward.",
};

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
