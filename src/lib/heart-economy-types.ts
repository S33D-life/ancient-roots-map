/**
 * Heart Economy — Type definitions for the 3-layer architecture.
 *
 * Layer 1: Experience (UI, jar, animations)
 * Layer 2: Internal Ledger (off-chain, instant)
 * Layer 3: Blockchain Settlement (optional, future)
 */

// ── Transaction types ──────────────────────────────────────
export type HeartTransactionType =
  // Earning
  | "earn_tree_mapping"
  | "earn_checkin"
  | "earn_offering"
  | "earn_curation"
  | "earn_council"
  | "earn_contribution"
  | "earn_referral"
  | "earn_bug_report"
  | "earn_streak_bonus"
  | "earn_windfall"
  | "earn_patron_grant"
  // Purchasing
  | "purchase_bundle"
  | "purchase_single"
  // Spending
  | "spend_nftree_generation"
  | "spend_room_customisation"
  | "spend_skin_unlock"
  | "spend_gift"
  | "spend_market_stake"
  // Admin / System
  | "refund"
  | "admin_grant"
  | "admin_debit"
  // Claims (future bridge)
  | "claim_reward"
  | "claim_founder"
  // Staking (future)
  | "lock_stake"
  | "unlock_stake"
  // Minting (future)
  | "mint_prepare"
  | "mint_confirmed"
  // Bridging (future)
  | "bridge_to_chain"
  | "bridge_from_chain";

export type CurrencyType = "S33D" | "SPECIES" | "INFLUENCE";

export type LedgerStatus = "pending" | "confirmed" | "failed" | "reversed" | "locked";

export type ChainState = "offchain" | "claimable" | "claiming" | "onchain" | "bridging";

export type ClaimType =
  | "earned_reward"
  | "founder_benefit"
  | "patron_bonus"
  | "staking_yield"
  | "nft_mint_eligibility"
  | "dao_voting_right"
  | "campaign_reward"
  | "referral_bonus";

export type ClaimStatus =
  | "available"
  | "pending_wallet"
  | "claiming"
  | "claimed"
  | "expired"
  | "revoked";

// ── Ledger entry ───────────────────────────────────────────
export interface HeartLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: HeartTransactionType;
  currency_type: CurrencyType;
  source?: string;
  destination?: string;
  entity_type?: string;
  entity_id?: string;
  status: LedgerStatus;
  chain_state: ChainState;
  chain_tx_hash?: string;
  idempotency_key?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ── Claim ──────────────────────────────────────────────────
export interface HeartClaim {
  id: string;
  user_id: string;
  claim_type: ClaimType;
  amount: number;
  status: ClaimStatus;
  source_ledger_id?: string;
  wallet_address?: string;
  chain?: string;
  chain_tx_hash?: string;
  expires_at?: string;
  claimed_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ── Wallet link ────────────────────────────────────────────
export interface WalletLink {
  id: string;
  user_id: string;
  wallet_address: string;
  chain: string;
  label?: string;
  is_primary: boolean;
  verified_at?: string;
  created_at: string;
}

// ── Balances (convenience view) ────────────────────────────
export interface HeartBalance {
  s33d: number;
  species: number;
  influence: number;
  locked: number;        // hearts in staking/locked state
  claimable: number;     // hearts available for on-chain claim
}

// ── Spend check result ─────────────────────────────────────
export interface SpendCheck {
  allowed: boolean;
  currentBalance: number;
  shortfall: number;
}

// ── Action-to-transaction-type map ─────────────────────────
export const ACTION_TO_TXN_TYPE: Record<string, HeartTransactionType> = {
  checkin: "earn_checkin",
  mapping: "earn_tree_mapping",
  offering: "earn_offering",
  curation: "earn_curation",
};
