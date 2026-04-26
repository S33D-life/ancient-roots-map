/**
 * Economy Vocabulary Registry
 * ───────────────────────────
 * Single source of truth for every string the heart economy and lottery
 * surfaces share with the database.
 *
 * Why this file exists
 *   Today's heart-ledger discovery surfaced four separate "vocabulary drift"
 *   bugs (heart_transactions vs heart_ledger naming, get_my_lottery_stats
 *   filter mismatch, lunar_full vs full_moon, lunar_prize ticket-counting
 *   exclusion). Each was the same shape: two places that should agree on a
 *   string did not, and the divergence was silent until measured.
 *
 *   Anything that ever shows up in a `.eq('transaction_type', '…')` filter,
 *   a CHECK constraint, an enum, or a switch on draw_type belongs here —
 *   never inline.
 *
 * Pairing
 *   - Database vocabulary lives in:
 *       • heart_ledger.transaction_type        (uses 'earn_*' / 'spend_*' prefix)
 *       • heart_transactions.heart_type        (bare strings, no prefix)
 *       • lottery_draws.draw_type CHECK        ('lunar_new' | 'lunar_full' | 'solar_*')
 *       • get_my_lottery_stats RPC             (filters by these strings)
 *   - Do NOT change the DB string values from this file. This is the
 *     application-side mirror; DB migrations are separate.
 */

// ─── Heart Ledger transaction_type ─────────────────────────────────────────
//
// Authoritative list of every value that can land in
// public.heart_ledger.transaction_type. Mirror of HeartTransactionType
// in heart-economy-types.ts but exposed as a value-level map so we can
// iterate at runtime (e.g. in tests, lints, and the legacy bridge).
export const HEART_LEDGER_TXN_TYPES = {
  // Earning
  earn_tree_mapping: "earn_tree_mapping",
  earn_checkin: "earn_checkin",
  earn_offering: "earn_offering",
  earn_curation: "earn_curation",
  earn_council: "earn_council",
  earn_contribution: "earn_contribution",
  earn_referral: "earn_referral",
  earn_bug_report: "earn_bug_report",
  earn_streak_bonus: "earn_streak_bonus",
  earn_windfall: "earn_windfall",
  earn_patron_grant: "earn_patron_grant",
  earn_root_growth: "earn_root_growth",
  earn_support_gratitude: "earn_support_gratitude",
  // Purchasing
  purchase_bundle: "purchase_bundle",
  purchase_single: "purchase_single",
  // Spending
  spend_nftree_generation: "spend_nftree_generation",
  spend_room_customisation: "spend_room_customisation",
  spend_skin_unlock: "spend_skin_unlock",
  spend_gift: "spend_gift",
  spend_market_stake: "spend_market_stake",
  spend_plant_hearts: "spend_plant_hearts",
  // Admin / system
  refund: "refund",
  admin_grant: "admin_grant",
  admin_debit: "admin_debit",
  // Claims
  claim_reward: "claim_reward",
  claim_founder: "claim_founder",
  // Staking
  lock_stake: "lock_stake",
  unlock_stake: "unlock_stake",
  // Minting
  mint_prepare: "mint_prepare",
  mint_confirmed: "mint_confirmed",
  // Bridging
  bridge_to_chain: "bridge_to_chain",
  bridge_from_chain: "bridge_from_chain",
} as const;

export type HeartLedgerTxnType =
  (typeof HEART_LEDGER_TXN_TYPES)[keyof typeof HEART_LEDGER_TXN_TYPES];

// ─── Legacy heart_transactions.heart_type vocabulary ───────────────────────
//
// Bare strings used by the older table that drives user_heart_balances via
// trigger. The lottery breakdown SQL and daily-cap logic also key off these.
// Spend rows keep their `spend_` prefix; earn rows DO NOT carry the `earn_`
// prefix.
export const LEGACY_HEART_TYPES = {
  // From earn_*
  tree_mapping: "tree_mapping",
  checkin: "checkin",
  offering: "offering",
  curation: "curation",
  council: "council",
  contribution: "contribution",
  referral: "referral",
  bug_report: "bug_report",
  streak_bonus: "streak_bonus",
  windfall: "windfall",
  patron_grant: "patron_grant",
  root_growth: "root_growth",
  support_gratitude: "support_gratitude",
  // From spend_* (kept verbatim)
  spend_nftree_generation: "spend_nftree_generation",
  spend_room_customisation: "spend_room_customisation",
  spend_skin_unlock: "spend_skin_unlock",
  spend_gift: "spend_gift",
  spend_market_stake: "spend_market_stake",
  spend_plant_hearts: "spend_plant_hearts",
  // Admin / system passthrough (no prefix change)
  refund: "refund",
  admin_grant: "admin_grant",
  admin_debit: "admin_debit",
} as const;

export type LegacyHeartType =
  (typeof LEGACY_HEART_TYPES)[keyof typeof LEGACY_HEART_TYPES];

// ─── Bidirectional bridge ──────────────────────────────────────────────────
//
// Used by heartService when dual-writing. Centralised so any future
// addition to HEART_LEDGER_TXN_TYPES forces a conscious decision about
// the legacy string (or omission, for non-balance-affecting types).

/** Convert a heart_ledger transaction_type → heart_transactions.heart_type. */
export function ledgerToLegacy(txnType: HeartLedgerTxnType | string): string {
  if (typeof txnType !== "string") return String(txnType);
  if (txnType.startsWith("earn_")) return txnType.slice("earn_".length);
  if (txnType.startsWith("spend_")) return txnType; // keep spend_ prefix
  return txnType;
}

/** Convert a legacy heart_transactions.heart_type → likely heart_ledger key. */
export function legacyToLedger(heartType: LegacyHeartType | string): string {
  if (typeof heartType !== "string") return String(heartType);
  if (heartType.startsWith("spend_")) return heartType;
  // System-level types pass through unchanged.
  if (heartType === "refund" || heartType === "admin_grant" || heartType === "admin_debit") {
    return heartType;
  }
  // Everything else is an earn_* in the new world.
  return `earn_${heartType}`;
}

// ─── Action shorthand → ledger transaction_type ────────────────────────────
//
// The "action" vocabulary used by issueRewards (mapping/checkin/offering/...).
// Lives here so a contributor adding a new action sees the registry first.
export const ACTION_TO_LEDGER_TXN_TYPE = {
  checkin: HEART_LEDGER_TXN_TYPES.earn_checkin,
  mapping: HEART_LEDGER_TXN_TYPES.earn_tree_mapping,
  offering: HEART_LEDGER_TXN_TYPES.earn_offering,
  curation: HEART_LEDGER_TXN_TYPES.earn_curation,
  plant_hearts: HEART_LEDGER_TXN_TYPES.spend_plant_hearts,
  root_growth: HEART_LEDGER_TXN_TYPES.earn_root_growth,
  support_gratitude: HEART_LEDGER_TXN_TYPES.earn_support_gratitude,
} as const;

export type EarnAction = keyof typeof ACTION_TO_LEDGER_TXN_TYPE;

// ─── Lottery draw_type vocabulary ──────────────────────────────────────────
//
// Mirror of the lottery_draws.draw_type CHECK constraint and the values
// emitted by the lottery-scheduler edge function. UI must never invent
// alternative spellings (e.g. 'full_moon' was a recurring drift bug).
export const LOTTERY_DRAW_TYPES = {
  lunar_new: "lunar_new",
  lunar_full: "lunar_full",
  solar_equinox_spring: "solar_equinox_spring",
  solar_equinox_autumn: "solar_equinox_autumn",
  solar_solstice_summer: "solar_solstice_summer",
  solar_solstice_winter: "solar_solstice_winter",
} as const;

export type LotteryDrawType =
  (typeof LOTTERY_DRAW_TYPES)[keyof typeof LOTTERY_DRAW_TYPES];

/** Heart types emitted as lottery prizes — excluded from ticket counting
 * server-side (see execute_lottery_draw). Front-end breakdown queries that
 * roll up tickets must apply the same filter. */
export const LOTTERY_PRIZE_HEART_TYPES = ["lunar_prize", "solar_prize"] as const;
export type LotteryPrizeHeartType = (typeof LOTTERY_PRIZE_HEART_TYPES)[number];

// ─── Frontend display map ──────────────────────────────────────────────────
export interface DrawDisplay {
  emoji: string;
  label: string;
}

export const DRAW_DISPLAY: Record<LotteryDrawType, DrawDisplay> = {
  lunar_new: { emoji: "🌑", label: "New Moon" },
  lunar_full: { emoji: "🌕", label: "Full Moon" },
  solar_equinox_spring: { emoji: "🌸", label: "Spring Equinox" },
  solar_equinox_autumn: { emoji: "🍂", label: "Autumn Equinox" },
  solar_solstice_summer: { emoji: "☀️", label: "Summer Solstice" },
  solar_solstice_winter: { emoji: "❄️", label: "Winter Solstice" },
};

const FALLBACK_DISPLAY: DrawDisplay = { emoji: "🌙", label: "Next Moon" };

export function drawDisplay(type: LotteryDrawType | string | null | undefined): DrawDisplay {
  if (!type) return FALLBACK_DISPLAY;
  return DRAW_DISPLAY[type as LotteryDrawType] ?? FALLBACK_DISPLAY;
}

export function drawEmoji(type: LotteryDrawType | string | null | undefined): string {
  return drawDisplay(type).emoji;
}

export function drawLabel(type: LotteryDrawType | string | null | undefined): string {
  return drawDisplay(type).label;
}
