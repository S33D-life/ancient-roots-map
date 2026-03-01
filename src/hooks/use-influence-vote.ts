/**
 * Hook for Influence Upvoting on Offerings.
 * Handles weight calculation, budget tracking, vote/retract, and scope resolution.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ScopeType = "tree" | "species" | "place";

export interface InfluenceScope {
  type: ScopeType;
  key: string;
  label: string;
  availableInfluence: number;
  computedWeight: number;
}

export interface InfluenceVote {
  id: string;
  offering_id: string;
  user_id: string;
  scope_type: string;
  scope_key: string;
  weight_applied: number;
  created_at: string;
  revoked_at: string | null;
}

const SCOPE_MULTIPLIER: Record<ScopeType, number> = {
  tree: 1.0,
  species: 0.7,
  place: 0.5,
};

const MAX_PER_VOTE_CAP = 10;
const DAILY_BUDGET = 50;

/** Compute weight: sqrt(tokens) * multiplier, capped at 10 */
export function computeWeight(tokenAmount: number, scopeType: ScopeType): number {
  const base = Math.sqrt(Math.max(0, tokenAmount));
  const weighted = base * SCOPE_MULTIPLIER[scopeType];
  return Math.round(Math.min(MAX_PER_VOTE_CAP, weighted) * 100) / 100;
}

interface UseInfluenceVoteOptions {
  offeringId: string;
  treeId: string;
  treeSpecies?: string | null;
  treeNation?: string | null;
  userId: string | null;
}

export function useInfluenceVote({
  offeringId,
  treeId,
  treeSpecies,
  treeNation,
  userId,
}: UseInfluenceVoteOptions) {
  const [availableScopes, setAvailableScopes] = useState<InfluenceScope[]>([]);
  const [existingVotes, setExistingVotes] = useState<InfluenceVote[]>([]);
  const [dailySpent, setDailySpent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);

  const dailyRemaining = DAILY_BUDGET - dailySpent;

  const fetchState = useCallback(async () => {
    if (!userId) {
      setAvailableScopes([]);
      setExistingVotes([]);
      setDailySpent(0);
      return;
    }
    setLoading(true);
    try {
      // Fetch user's influence tokens grouped by scope
      const { data: txns } = await supabase
        .from("influence_transactions")
        .select("tree_id, species_family, scope, amount")
        .eq("user_id", userId);

      const tokens = txns || [];

      // Aggregate by scope
      const treeTotal = tokens
        .filter((t) => t.tree_id === treeId)
        .reduce((s, t) => s + t.amount, 0);

      const speciesTotal = treeSpecies
        ? tokens
            .filter((t) => t.species_family === treeSpecies)
            .reduce((s, t) => s + t.amount, 0)
        : 0;

      const placeTotal = treeNation
        ? tokens
            .filter(
              (t) =>
                t.scope === "global" || t.scope === treeNation
            )
            .reduce((s, t) => s + t.amount, 0) * 0.1 // place influence is a fraction of global
        : 0;

      const scopes: InfluenceScope[] = [];
      if (treeTotal > 0) {
        scopes.push({
          type: "tree",
          key: treeId,
          label: "Tree",
          availableInfluence: treeTotal,
          computedWeight: computeWeight(treeTotal, "tree"),
        });
      }
      if (speciesTotal > 0 && treeSpecies) {
        scopes.push({
          type: "species",
          key: treeSpecies,
          label: "Species Hive",
          availableInfluence: speciesTotal,
          computedWeight: computeWeight(speciesTotal, "species"),
        });
      }
      if (placeTotal > 0 && treeNation) {
        scopes.push({
          type: "place",
          key: `country_${treeNation}`,
          label: treeNation,
          availableInfluence: Math.round(placeTotal),
          computedWeight: computeWeight(placeTotal, "place"),
        });
      }

      setAvailableScopes(scopes);

      // Fetch existing votes for this offering by this user
      const { data: votes } = await supabase
        .from("influence_votes")
        .select("*")
        .eq("offering_id", offeringId)
        .eq("user_id", userId)
        .is("revoked_at", null);

      setExistingVotes((votes as InfluenceVote[]) || []);

      // Fetch daily budget
      const today = new Date().toISOString().split("T")[0];
      const { data: budget } = await supabase
        .from("influence_vote_budgets")
        .select("spent")
        .eq("user_id", userId)
        .eq("vote_date", today)
        .maybeSingle();

      setDailySpent(budget?.spent || 0);
    } catch (err) {
      console.error("Error fetching influence state:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, offeringId, treeId, treeSpecies, treeNation]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const hasVotedInScope = useCallback(
    (scopeKey: string) => existingVotes.some((v) => v.scope_key === scopeKey),
    [existingVotes]
  );

  const castVote = useCallback(
    async (scope: InfluenceScope): Promise<boolean> => {
      if (!userId || voting) return false;
      if (hasVotedInScope(scope.key)) return false;

      const weight = Math.min(scope.computedWeight, dailyRemaining);
      if (weight <= 0) return false;

      setVoting(true);
      try {
        // Insert vote
        const { error: voteErr } = await supabase.from("influence_votes").insert({
          offering_id: offeringId,
          user_id: userId,
          scope_type: scope.type,
          scope_key: scope.key,
          weight_applied: weight,
        });
        if (voteErr) throw voteErr;

        // Update daily budget
        const today = new Date().toISOString().split("T")[0];
        const { error: budgetErr } = await supabase
          .from("influence_vote_budgets")
          .upsert(
            { user_id: userId, vote_date: today, spent: dailySpent + weight },
            { onConflict: "user_id,vote_date" }
          );
        if (budgetErr) console.warn("Budget update failed:", budgetErr);

        await fetchState();
        return true;
      } catch (err) {
        console.error("Error casting influence vote:", err);
        return false;
      } finally {
        setVoting(false);
      }
    },
    [userId, voting, offeringId, dailyRemaining, dailySpent, fetchState, hasVotedInScope]
  );

  const retractVote = useCallback(
    async (scopeKey: string): Promise<boolean> => {
      if (!userId || voting) return false;
      const vote = existingVotes.find((v) => v.scope_key === scopeKey);
      if (!vote) return false;

      setVoting(true);
      try {
        const { error } = await supabase
          .from("influence_votes")
          .update({ revoked_at: new Date().toISOString() })
          .eq("id", vote.id);
        if (error) throw error;

        // Refund budget
        const today = new Date().toISOString().split("T")[0];
        const newSpent = Math.max(0, dailySpent - vote.weight_applied);
        await supabase
          .from("influence_vote_budgets")
          .upsert(
            { user_id: userId, vote_date: today, spent: newSpent },
            { onConflict: "user_id,vote_date" }
          );

        await fetchState();
        return true;
      } catch (err) {
        console.error("Error retracting vote:", err);
        return false;
      } finally {
        setVoting(false);
      }
    },
    [userId, voting, existingVotes, dailySpent, fetchState]
  );

  return {
    availableScopes,
    existingVotes,
    dailySpent,
    dailyRemaining,
    dailyBudget: DAILY_BUDGET,
    loading,
    voting,
    hasVotedInScope,
    castVote,
    retractVote,
    hasAnyInfluence: availableScopes.length > 0,
    totalVotedWeight: existingVotes.reduce((s, v) => s + v.weight_applied, 0),
  };
}

/** Fetch influence votes for an offering (for ledger display) */
export async function fetchInfluenceLedger(offeringId: string) {
  const { data } = await supabase
    .from("influence_votes")
    .select("id, scope_type, scope_key, weight_applied, created_at")
    .eq("offering_id", offeringId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data || []) as Array<{
    id: string;
    scope_type: string;
    scope_key: string;
    weight_applied: number;
    created_at: string;
  }>;
}
