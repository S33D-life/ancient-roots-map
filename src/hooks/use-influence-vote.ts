/**
 * Hook for Influence Upvoting on Offerings.
 * Uses atomic RPC for cast/retract, supports optimistic UI,
 * and can optionally consume pre-fetched token data from InfluenceTokenContext.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInfluenceTokens } from "@/contexts/InfluenceTokenContext";

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

  // Try to use pre-fetched tokens from context (eliminates N+1 queries)
  const tokenCtx = useInfluenceTokens();
  const hasContextTokens = tokenCtx.tokens.loaded;

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
      // Build scopes from context tokens (single query at page level) or fallback
      let treeTotal: number, speciesTotal: number, placeTotal: number;

      if (hasContextTokens) {
        treeTotal = tokenCtx.getTreeTotal(treeId);
        speciesTotal = treeSpecies ? tokenCtx.getSpeciesTotal(treeSpecies) : 0;
        placeTotal = treeNation ? tokenCtx.getPlaceTotal(treeNation) : 0;
      } else {
        // Fallback: fetch directly (for pages without InfluenceTokenProvider)
        const { data: txns } = await supabase
          .from("influence_transactions")
          .select("tree_id, species_family, scope, amount")
          .eq("user_id", userId);

        const tokens = txns || [];
        treeTotal = tokens.filter((t) => t.tree_id === treeId).reduce((s, t) => s + t.amount, 0);
        speciesTotal = treeSpecies
          ? tokens.filter((t) => t.species_family === treeSpecies).reduce((s, t) => s + t.amount, 0)
          : 0;
        placeTotal = treeNation
          ? tokens.filter((t) => t.scope === "global" || t.scope === treeNation).reduce((s, t) => s + t.amount, 0) * 0.1
          : 0;
      }

      const scopes: InfluenceScope[] = [];
      if (treeTotal > 0) {
        scopes.push({
          type: "tree", key: treeId, label: "Tree",
          availableInfluence: treeTotal, computedWeight: computeWeight(treeTotal, "tree"),
        });
      }
      if (speciesTotal > 0 && treeSpecies) {
        scopes.push({
          type: "species", key: treeSpecies, label: "Species Hive",
          availableInfluence: speciesTotal, computedWeight: computeWeight(speciesTotal, "species"),
        });
      }
      if (placeTotal > 0 && treeNation) {
        scopes.push({
          type: "place", key: `country_${treeNation}`, label: treeNation,
          availableInfluence: Math.round(placeTotal), computedWeight: computeWeight(placeTotal, "place"),
        });
      }

      setAvailableScopes(scopes);

      // Fetch existing votes + daily budget in parallel
      const [votesRes, budgetRes] = await Promise.all([
        supabase
          .from("influence_votes")
          .select("*")
          .eq("offering_id", offeringId)
          .eq("user_id", userId)
          .is("revoked_at", null),
        supabase
          .from("influence_vote_budgets")
          .select("spent")
          .eq("user_id", userId)
          .eq("vote_date", new Date().toISOString().split("T")[0])
          .maybeSingle(),
      ]);

      setExistingVotes((votesRes.data as InfluenceVote[]) || []);
      setDailySpent(budgetRes.data?.spent || 0);
    } catch (err) {
      console.error("Error fetching influence state:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, offeringId, treeId, treeSpecies, treeNation, hasContextTokens, tokenCtx]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const hasVotedInScope = useCallback(
    (scopeKey: string) => existingVotes.some((v) => v.scope_key === scopeKey),
    [existingVotes]
  );

  const castVote = useCallback(
    async (scope: InfluenceScope): Promise<{ success: boolean; weight: number }> => {
      if (!userId || voting) return { success: false, weight: 0 };
      if (hasVotedInScope(scope.key)) return { success: false, weight: 0 };

      const weight = Math.min(scope.computedWeight, dailyRemaining);
      if (weight <= 0) return { success: false, weight: 0 };

      setVoting(true);
      try {
        // Use atomic RPC
        const { data, error } = await supabase.rpc("cast_influence_vote", {
          p_offering_id: offeringId,
          p_user_id: userId,
          p_scope_type: scope.type,
          p_scope_key: scope.key,
          p_weight: weight,
        });

        if (error) throw error;

        await fetchState();
        return { success: true, weight };
      } catch (err) {
        console.error("Error casting influence vote:", err);
        return { success: false, weight: 0 };
      } finally {
        setVoting(false);
      }
    },
    [userId, voting, offeringId, dailyRemaining, fetchState, hasVotedInScope]
  );

  const retractVote = useCallback(
    async (scopeKey: string): Promise<boolean> => {
      if (!userId || voting) return false;
      const vote = existingVotes.find((v) => v.scope_key === scopeKey);
      if (!vote) return false;

      setVoting(true);
      try {
        // Use atomic RPC
        const { error } = await supabase.rpc("retract_influence_vote", {
          p_vote_id: vote.id,
          p_user_id: userId,
        });
        if (error) throw error;

        await fetchState();
        return true;
      } catch (err) {
        console.error("Error retracting vote:", err);
        return false;
      } finally {
        setVoting(false);
      }
    },
    [userId, voting, existingVotes, fetchState]
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
