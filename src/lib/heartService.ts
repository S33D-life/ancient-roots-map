/**
 * Heart Economy Service — single abstraction for all heart operations.
 *
 * Writes to BOTH the legacy heart_transactions table (backward compat)
 * AND the new heart_ledger (rich, blockchain-ready).
 *
 * All balance reads use the materialized user_heart_balances table.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  HeartBalance,
  HeartLedgerEntry,
  HeartClaim,
  WalletLink,
  HeartTransactionType,
  CurrencyType,
  SpendCheck,
} from "@/lib/heart-economy-types";

// ── In-flight dedup ────────────────────────────────────────
const _inflight = new Set<string>();

function idempotencyKey(userId: string, type: string, entityId?: string): string {
  const ts = Math.floor(Date.now() / 1000); // 1-second window
  return `${userId}:${type}:${entityId || "none"}:${ts}`;
}

// ── Balance ────────────────────────────────────────────────
export async function getHeartBalance(userId: string): Promise<HeartBalance> {
  const { data } = await supabase
    .from("user_heart_balances")
    .select("s33d_hearts, species_hearts, influence_tokens")
    .eq("user_id", userId)
    .maybeSingle();

  const bal = data as Record<string, number> | null;

  // Locked & claimable from ledger
  const { data: locked } = await supabase
    .from("heart_ledger")
    .select("amount")
    .eq("user_id", userId)
    .eq("status", "locked")
    .eq("currency_type", "S33D");

  const { data: claims } = await supabase
    .from("heart_claims")
    .select("amount")
    .eq("user_id", userId)
    .eq("status", "available");

  return {
    s33d: bal?.s33d_hearts ?? 0,
    species: bal?.species_hearts ?? 0,
    influence: bal?.influence_tokens ?? 0,
    locked: (locked || []).reduce((s, r) => s + (r.amount || 0), 0),
    claimable: (claims || []).reduce((s, r) => s + (r.amount || 0), 0),
  };
}

// ── Ledger history ─────────────────────────────────────────
export async function getHeartLedger(
  userId: string,
  opts?: { limit?: number; offset?: number; currencyType?: CurrencyType }
): Promise<HeartLedgerEntry[]> {
  let q = supabase
    .from("heart_ledger")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);
  if (opts?.currencyType) q = q.eq("currency_type", opts.currencyType);

  const { data } = await q;
  return (data || []) as unknown as HeartLedgerEntry[];
}

// ── Earn ───────────────────────────────────────────────────
export async function earnHearts(params: {
  userId: string;
  amount: number;
  transactionType: HeartTransactionType;
  currencyType?: CurrencyType;
  entityType?: string;
  entityId?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}): Promise<HeartLedgerEntry | null> {
  const key = idempotencyKey(params.userId, params.transactionType, params.entityId);
  if (_inflight.has(key)) return null;
  _inflight.add(key);

  try {
    const { data, error } = await supabase
      .from("heart_ledger")
      .insert({
        user_id: params.userId,
        amount: Math.abs(params.amount),
        transaction_type: params.transactionType,
        currency_type: params.currencyType || "S33D",
        source: params.source,
        entity_type: params.entityType,
        entity_id: params.entityId,
        status: "confirmed",
        chain_state: "offchain",
        idempotency_key: key,
        metadata: params.metadata || {},
      } as any)
      .select()
      .single();

    if (error) {
      // Idempotency conflict → already processed
      if (error.code === "23505") return null;
      console.warn("[heartService.earnHearts]", error.message);
      return null;
    }
    return data as unknown as HeartLedgerEntry;
  } finally {
    _inflight.delete(key);
  }
}

// ── Spend ──────────────────────────────────────────────────
export async function canSpend(userId: string, amount: number): Promise<SpendCheck> {
  const balance = await getHeartBalance(userId);
  const available = balance.s33d - balance.locked;
  return {
    allowed: available >= amount,
    currentBalance: available,
    shortfall: Math.max(0, amount - available),
  };
}

export async function spendHearts(params: {
  userId: string;
  amount: number;
  transactionType: HeartTransactionType;
  entityType?: string;
  entityId?: string;
  destination?: string;
  metadata?: Record<string, unknown>;
}): Promise<HeartLedgerEntry | null> {
  const check = await canSpend(params.userId, params.amount);
  if (!check.allowed) return null;

  const key = idempotencyKey(params.userId, params.transactionType, params.entityId);
  if (_inflight.has(key)) return null;
  _inflight.add(key);

  try {
    // Insert negative amount into legacy table for balance trigger
    const { error: legacyErr } = await supabase.from("heart_transactions").insert({
      user_id: params.userId,
      tree_id: params.entityId || null,
      heart_type: params.transactionType,
      amount: -Math.abs(params.amount),
    });
    if (legacyErr) {
      console.warn("[heartService.spendHearts] legacy insert failed:", legacyErr.message);
    }

    const { data, error } = await supabase
      .from("heart_ledger")
      .insert({
        user_id: params.userId,
        amount: -Math.abs(params.amount),
        transaction_type: params.transactionType,
        currency_type: "S33D",
        destination: params.destination,
        entity_type: params.entityType,
        entity_id: params.entityId,
        status: "confirmed",
        chain_state: "offchain",
        idempotency_key: key,
        metadata: params.metadata || {},
      } as any)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return null;
      console.error("[heartService.spendHearts] ledger insert failed:", error.message);
      return null;
    }

    return (data as unknown as HeartLedgerEntry) || null;
  } finally {
    _inflight.delete(key);
  }
}

// ── Claims ─────────────────────────────────────────────────
export async function getClaimableRewards(userId: string): Promise<HeartClaim[]> {
  const { data } = await supabase
    .from("heart_claims")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "available")
    .order("created_at", { ascending: false });

  return (data || []) as unknown as HeartClaim[];
}

export async function prepareOnchainClaim(
  userId: string,
  claimId: string,
  walletAddress: string
): Promise<HeartClaim | null> {
  const { data } = await supabase
    .from("heart_claims")
    .update({
      status: "pending_wallet",
      wallet_address: walletAddress,
    })
    .eq("id", claimId)
    .eq("user_id", userId)
    .eq("status", "available")
    .select()
    .single();

  return (data as unknown as HeartClaim) || null;
}

// ── Wallet ─────────────────────────────────────────────────
export async function getWallets(userId: string): Promise<WalletLink[]> {
  const { data } = await supabase
    .from("wallet_links")
    .select("*")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false });

  return (data || []) as unknown as WalletLink[];
}

export async function linkWallet(
  userId: string,
  walletAddress: string,
  chain = "ethereum",
  label?: string
): Promise<WalletLink | null> {
  const { data } = await supabase
    .from("wallet_links")
    .insert({
      user_id: userId,
      wallet_address: walletAddress.toLowerCase(),
      chain,
      label,
      is_primary: true,
    })
    .select()
    .single();

  return (data as unknown as WalletLink) || null;
}

export async function unlinkWallet(userId: string, walletId: string): Promise<boolean> {
  const { error } = await supabase
    .from("wallet_links")
    .delete()
    .eq("id", walletId)
    .eq("user_id", userId);

  return !error;
}

// ── Purchase (hardened — server-only confirmation) ──────────
/**
 * purchaseHearts is a CLIENT STUB only.
 * In production, hearts from purchases MUST be credited server-side
 * (e.g. via a Stripe webhook → Edge Function) to prevent spoofing.
 *
 * This stub creates a PENDING ledger entry. A server-side function
 * must update it to 'confirmed' after verifying payment.
 */
export async function purchaseHearts(params: {
  userId: string;
  bundleId: string;
  amount: number;
  paymentIntentId?: string;
}): Promise<HeartLedgerEntry | null> {
  if (!params.paymentIntentId) {
    console.warn("[heartService.purchaseHearts] No paymentIntentId — refusing client-only credit");
    return null;
  }

  const key = `purchase:${params.userId}:${params.paymentIntentId}`;
  if (_inflight.has(key)) return null;
  _inflight.add(key);

  try {
    // Create as PENDING — server webhook confirms
    const { data, error } = await supabase
      .from("heart_ledger")
      .insert({
        user_id: params.userId,
        amount: Math.abs(params.amount),
        transaction_type: "purchase_bundle",
        currency_type: "S33D",
        source: "stripe",
        status: "pending", // NOT confirmed — awaits webhook
        chain_state: "offchain",
        idempotency_key: key,
        metadata: {
          bundle_id: params.bundleId,
          payment_intent: params.paymentIntentId,
        },
      } as any)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return null; // duplicate
      console.warn("[heartService.purchaseHearts]", error.message);
      return null;
    }
    return data as unknown as HeartLedgerEntry;
  } finally {
    _inflight.delete(key);
  }
}
