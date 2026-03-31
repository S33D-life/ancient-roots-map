/**
 * useHeartCollection — unified hook for heart collection eligibility + action.
 * Checks 12-hour visit window + available hearts in tree pool.
 * Used across map popups, preview cards, and tree detail page.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

const GRACE_HOURS = 12;
const GRACE_MS = GRACE_HOURS * 60 * 60 * 1000;
const VISITS_KEY = "s33d-tree-visits";

export type HeartCollectionState =
  | "loading"
  | "eligible"           // at tree or within 12h, hearts available
  | "no_hearts"          // eligible but no hearts in pool
  | "not_eligible"       // not at tree / window expired
  | "collected"          // just collected
  | "collecting"         // in progress
  | "error";

export interface HeartPoolInfo {
  totalHearts: number;
  windfallCount: number;
}

function getLastVisit(treeId: string): number | null {
  try {
    const visits = JSON.parse(localStorage.getItem(VISITS_KEY) || "{}");
    return visits[treeId] ?? null;
  } catch {
    return null;
  }
}

function isWithinGrace(treeId: string): boolean {
  const lastVisit = getLastVisit(treeId);
  if (!lastVisit) return false;
  return (Date.now() - lastVisit) < GRACE_MS;
}

export function useHeartCollection(
  treeId: string | undefined,
  userId: string | null,
  /** True when proximity gate says user is near or in grace */
  isEligible: boolean,
) {
  const [pool, setPool] = useState<HeartPoolInfo | null>(null);
  const [state, setState] = useState<HeartCollectionState>("loading");
  const [collectedAmount, setCollectedAmount] = useState<number | null>(null);
  const [poolLoading, setPoolLoading] = useState(true);

  // Fetch heart pool
  const fetchPool = useCallback(async () => {
    if (!treeId) { setPoolLoading(false); return; }
    const { data } = await supabase
      .from("tree_heart_pools")
      .select("total_hearts, windfall_count")
      .eq("tree_id", treeId)
      .maybeSingle();
    setPool(data ? { totalHearts: data.total_hearts, windfallCount: data.windfall_count } : null);
    setPoolLoading(false);
  }, [treeId]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  // Derive state
  useEffect(() => {
    if (poolLoading) { setState("loading"); return; }
    if (!userId || !treeId) { setState("not_eligible"); return; }
    if (collectedAmount !== null) { setState("collected"); return; }

    const hasHearts = pool && pool.totalHearts > 0;
    // Check eligibility: either proximity-gate says yes, or localStorage grace
    const eligible = isEligible || isWithinGrace(treeId);

    if (!eligible) {
      setState("not_eligible");
    } else if (hasHearts) {
      setState("eligible");
    } else {
      setState("no_hearts");
    }
  }, [poolLoading, userId, treeId, pool, isEligible, collectedAmount]);

  // Collect action — deduplicated
  const collect = useCallback(async () => {
    if (!userId || !treeId || state === "collecting") return null;
    setState("collecting");
    try {
      const { data, error } = await supabase.rpc("claim_windfall_hearts", {
        p_tree_id: treeId,
        p_user_id: userId,
      });
      if (error) {
        setState("error");
        return null;
      }
      const amount = typeof data === "number" ? data : 0;
      if (amount > 0) {
        setCollectedAmount(amount);
        setState("collected");
        // Refresh pool after collection
        setTimeout(fetchPool, 1500);
        return amount;
      } else {
        // No hearts actually claimable (already claimed or threshold not met)
        setState("no_hearts");
        return 0;
      }
    } catch {
      setState("error");
      return null;
    }
  }, [userId, treeId, state, fetchPool]);

  // Reset collected state after timeout
  useEffect(() => {
    if (collectedAmount !== null) {
      const t = setTimeout(() => setCollectedAmount(null), 5000);
      return () => clearTimeout(t);
    }
  }, [collectedAmount]);

  return {
    state,
    pool,
    collectedAmount,
    collect,
    refetchPool: fetchPool,
  };
}

/**
 * Lightweight check for map popups — no hook, just async function.
 * Returns number of available hearts for a tree.
 */
export async function getTreeHeartPoolCount(treeId: string): Promise<number> {
  const { data } = await supabase
    .from("tree_heart_pools")
    .select("total_hearts")
    .eq("tree_id", treeId)
    .maybeSingle();
  return data?.total_hearts ?? 0;
}
