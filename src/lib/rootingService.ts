/**
 * Heart Rooting Service — plant hearts at trees, grow over time, collect on return.
 *
 * Reuses existing heart balance/transaction system for debits and credits.
 * Growth is calculated on-demand (open / collect), never polled.
 * Planting uses an atomic DB function to prevent race conditions.
 */
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────
export interface TreeRoot {
  id: string;
  user_id: string;
  tree_id: string;
  asset_type: string;
  amount: number;
  species_key: string | null;
  created_at: string;
  last_accrual_at: string;
  last_visit_at: string | null;
}

// ── Growth engine ──────────────────────────────────────────
// Base rate: ~1 heart per 24h per 11 planted hearts (very slow)
const BASE_RATE_PER_HOUR = 0.004; // per heart planted
const SOFT_CAP_MULTIPLIER = 0.5; // halve rate after this ratio
const SOFT_CAP_RATIO = 2.0; // when growth >= 2× planted, slow down

export function calculateGrowth(root: TreeRoot): number {
  const hoursElapsed =
    (Date.now() - new Date(root.last_accrual_at).getTime()) / (1000 * 60 * 60);

  if (hoursElapsed < 1 || root.amount <= 0) return 0;

  let rawGrowth = root.amount * BASE_RATE_PER_HOUR * hoursElapsed;

  // Soft cap: slow down if accumulated growth would exceed planted × ratio
  if (rawGrowth > root.amount * SOFT_CAP_RATIO) {
    const uncapped = root.amount * SOFT_CAP_RATIO;
    const excess = rawGrowth - uncapped;
    rawGrowth = uncapped + excess * SOFT_CAP_MULTIPLIER;
  }

  return Math.floor(rawGrowth);
}

// ── In-flight guards ───────────────────────────────────────
const _inflightPlant = new Set<string>();
const _inflightCollect = new Set<string>();

// ── Queries ────────────────────────────────────────────────
export async function getUserRoots(userId: string): Promise<TreeRoot[]> {
  const { data } = await supabase
    .from("tree_value_roots")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data || []) as unknown as TreeRoot[];
}

export async function getTreeRoot(
  userId: string,
  treeId: string
): Promise<TreeRoot | null> {
  const { data } = await supabase
    .from("tree_value_roots")
    .select("*")
    .eq("user_id", userId)
    .eq("tree_id", treeId)
    .eq("asset_type", "s33d_heart")
    .maybeSingle();

  return (data as unknown as TreeRoot) || null;
}

// ── Plant (atomic) ─────────────────────────────────────────
export async function plantHearts(params: {
  userId: string;
  treeId: string;
  amount: number;
  speciesKey?: string;
}): Promise<TreeRoot | null> {
  const key = `${params.userId}:${params.treeId}`;
  if (_inflightPlant.has(key)) return null;
  _inflightPlant.add(key);

  try {
    // Atomic: balance check + debit + stake — all in one RPC.
    // Returns structured envelope: { ok, error, root } where error ∈
    // 'unauthenticated' | 'invalid_amount' | 'tree_not_found' | 'insufficient_hearts'
    const { data, error } = await supabase.rpc("plant_hearts_at_tree", {
      p_user_id: params.userId,
      p_tree_id: params.treeId,
      p_amount: params.amount,
      p_species_key: params.speciesKey || null,
    });

    if (error) {
      console.warn("[rootingService.plantHearts] RPC error", error.message);
      return null;
    }

    const envelope = (Array.isArray(data) ? data[0] : data) as
      | { ok: boolean; error: string | null; root: TreeRoot | null }
      | null;

    if (!envelope || !envelope.ok) {
      console.warn(
        "[rootingService.plantHearts] refused:",
        envelope?.error || "unknown"
      );
      return null;
    }

    return envelope.root;
  } finally {
    _inflightPlant.delete(key);
  }
}

/** Structured error code returned by plant_hearts_at_tree RPC. */
export type PlantHeartsError =
  | "unauthenticated"
  | "invalid_amount"
  | "tree_not_found"
  | "insufficient_hearts";

/** Detailed variant of plantHearts that surfaces the structured error code. */
export async function plantHeartsDetailed(params: {
  userId: string;
  treeId: string;
  amount: number;
  speciesKey?: string;
}): Promise<
  | { ok: true; root: TreeRoot }
  | { ok: false; error: PlantHeartsError | "rpc_error"; balance?: number; required?: number }
> {
  const { data, error } = await supabase.rpc("plant_hearts_at_tree", {
    p_user_id: params.userId,
    p_tree_id: params.treeId,
    p_amount: params.amount,
    p_species_key: params.speciesKey || null,
  });

  if (error) return { ok: false, error: "rpc_error" };

  const envelope = (Array.isArray(data) ? data[0] : data) as {
    ok: boolean;
    error: string | null;
    root: TreeRoot | null;
    balance?: number;
    required?: number;
  } | null;

  if (!envelope || !envelope.ok) {
    return {
      ok: false,
      error: (envelope?.error as PlantHeartsError) || "rpc_error",
      balance: envelope?.balance,
      required: envelope?.required,
    };
  }

  return { ok: true, root: envelope.root as TreeRoot };
}

// ── Collect growth ─────────────────────────────────────────
export async function collectGrowth(
  userId: string,
  treeId: string
): Promise<{ growth: number; root: TreeRoot } | null> {
  const key = `${userId}:${treeId}`;
  if (_inflightCollect.has(key)) return null;
  _inflightCollect.add(key);

  try {
    const root = await getTreeRoot(userId, treeId);
    if (!root) return null;

    const growth = calculateGrowth(root);
    if (growth <= 0) return { growth: 0, root };

    // Reset accrual baseline FIRST to prevent double-credit
    const now = new Date().toISOString();
    const { data: updatedRoot, error: updateErr } = await supabase
      .from("tree_value_roots")
      .update({ last_accrual_at: now, last_visit_at: now })
      .eq("id", root.id)
      .eq("user_id", userId) // ensure ownership
      .select()
      .single();

    if (updateErr) {
      console.warn("[rootingService.collectGrowth] reset failed", updateErr.message);
      return null;
    }

    // Credit growth to user's balance
    const earned = await earnHearts({
      userId,
      amount: growth,
      transactionType: "earn_root_growth",
      entityType: "tree_root_growth",
      entityId: treeId,
      source: "rooting",
      metadata: { root_id: root.id, planted: root.amount },
    });

    if (!earned) {
      // Rollback accrual reset on earn failure
      await supabase
        .from("tree_value_roots")
        .update({ last_accrual_at: root.last_accrual_at })
        .eq("id", root.id)
        .eq("user_id", userId);
      return null;
    }

    return {
      growth,
      root: (updatedRoot as unknown as TreeRoot) || root,
    };
  } finally {
    _inflightCollect.delete(key);
  }
}