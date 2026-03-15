/**
 * Hearts Repository — centralises the most-duplicated heart/tree/seed
 * balance queries so components can call a typed helper instead of
 * building raw Supabase queries and reducing arrays inline.
 *
 * Uses the materialised `user_heart_balances` table for heart balance
 * (O(1) instead of scanning all transactions). Falls back to
 * heart_transactions sum only for callers that need the raw total.
 *
 * Pattern: pure async functions, no hooks — wrap in useQuery/useEffect
 * at the call-site for reactivity.
 */
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────
export interface UserQuickStats {
  hearts: number;
  trees: number;
  seeds: number;
}

export interface HeartBalanceSummary {
  s33dHearts: number;
  speciesHearts: number;
  influenceTokens: number;
}

// ── Balance (materialised — fast) ──────────────────────────

/**
 * Returns the user's heart balance from the materialised table.
 * This is the preferred read path — O(1) lookup.
 */
export async function getHeartBalanceFast(userId: string): Promise<HeartBalanceSummary> {
  const { data } = await supabase
    .from("user_heart_balances")
    .select("s33d_hearts, species_hearts, influence_tokens")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    s33dHearts: data?.s33d_hearts ?? 0,
    speciesHearts: data?.species_hearts ?? 0,
    influenceTokens: data?.influence_tokens ?? 0,
  };
}

/**
 * Returns the user's S33D heart total by scanning heart_transactions.
 * Use only when user_heart_balances hasn't materialised yet (new accounts)
 * or when you need a consistency check.
 */
export async function getHeartTotalFromTransactions(userId: string): Promise<number> {
  const { data } = await supabase
    .from("heart_transactions")
    .select("amount")
    .eq("user_id", userId);

  return (data || []).reduce((sum, row) => sum + (row.amount || 0), 0);
}

// ── Tree count ─────────────────────────────────────────────

/** Count of trees mapped by this user. */
export async function getUserTreeCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("trees")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId);

  return count ?? 0;
}

// ── Seed count ─────────────────────────────────────────────

/** Count of seeds planted by this user. */
export async function getUserSeedCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("planted_seeds")
    .select("*", { count: "exact", head: true })
    .eq("planter_id", userId);

  return count ?? 0;
}

// ── Composite: quick stats (hearts + trees + seeds) ────────

/**
 * Fetches the 3 most commonly co-queried user stats in parallel.
 * Replaces the pattern duplicated across GrovePulse, MapJourneyIndicator,
 * JourneyPulse, LibraryVaultPreview, JourneyStatusBar, etc.
 */
export async function getUserQuickStats(userId: string): Promise<UserQuickStats> {
  const [balance, trees, seeds] = await Promise.all([
    getHeartBalanceFast(userId),
    getUserTreeCount(userId),
    getUserSeedCount(userId),
  ]);

  return {
    hearts: balance.s33dHearts,
    trees,
    seeds,
  };
}

// ── Global counts (no user filter) ─────────────────────────

/** Total heart transactions globally (e.g. ecosystem pulse). */
export async function getGlobalHeartTotal(): Promise<number> {
  const { data } = await supabase
    .from("heart_transactions")
    .select("amount");

  return (data || []).reduce((sum, row) => sum + (row.amount || 0), 0);
}

/** Total heart transaction count (for unauthenticated overview). */
export async function getGlobalHeartCount(): Promise<number> {
  const { count } = await supabase
    .from("heart_transactions")
    .select("*", { count: "exact", head: true });

  return count ?? 0;
}
