/**
 * Heart Rooting Service — plant hearts at trees, grow over time, collect on return.
 *
 * Reuses existing heart balance/transaction system for debits and credits.
 * Growth is calculated on-demand (open / collect), never polled.
 */
import { supabase } from "@/integrations/supabase/client";
import { spendHearts, earnHearts } from "@/lib/heartService";

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

// ── Plant ──────────────────────────────────────────────────
export async function plantHearts(params: {
  userId: string;
  treeId: string;
  amount: number;
  speciesKey?: string;
}): Promise<TreeRoot | null> {
  // 1. Deduct from balance via existing spend system
  const spent = await spendHearts({
    userId: params.userId,
    amount: params.amount,
    transactionType: "lock_stake", // reuse existing type
    entityType: "tree_root",
    entityId: params.treeId,
    metadata: { action: "plant_hearts", species_key: params.speciesKey },
  });

  if (!spent) return null;

  // 2. Upsert root record
  const { data, error } = await supabase
    .from("tree_value_roots")
    .upsert(
      {
        user_id: params.userId,
        tree_id: params.treeId,
        asset_type: "s33d_heart",
        amount: params.amount,
        species_key: params.speciesKey || null,
        last_accrual_at: new Date().toISOString(),
        last_visit_at: new Date().toISOString(),
      } as any,
      { onConflict: "user_id,tree_id,asset_type" }
    )
    .select()
    .single();

  if (error) {
    console.warn("[rootingService.plantHearts]", error.message);
    return null;
  }

  // If user already had a root, add to existing amount
  if (data && (data as any).amount !== params.amount) {
    const { data: updated } = await supabase
      .from("tree_value_roots")
      .update({ amount: (data as any).amount + params.amount } as any)
      .eq("id", (data as any).id)
      .select()
      .single();
    return (updated as unknown as TreeRoot) || (data as unknown as TreeRoot);
  }

  return data as unknown as TreeRoot;
}

// ── Collect growth ─────────────────────────────────────────
export async function collectGrowth(
  userId: string,
  treeId: string
): Promise<{ growth: number; root: TreeRoot } | null> {
  const root = await getTreeRoot(userId, treeId);
  if (!root) return null;

  const growth = calculateGrowth(root);
  if (growth <= 0) return { growth: 0, root };

  // Credit growth to user's balance
  const earned = await earnHearts({
    userId,
    amount: growth,
    transactionType: "earn_contribution",
    entityType: "tree_root_growth",
    entityId: treeId,
    source: "rooting",
    metadata: { root_id: root.id, planted: root.amount },
  });

  if (!earned) return null;

  // Reset accrual baseline
  const { data } = await supabase
    .from("tree_value_roots")
    .update({
      last_accrual_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
    } as any)
    .eq("id", root.id)
    .select()
    .single();

  return {
    growth,
    root: (data as unknown as TreeRoot) || root,
  };
}
