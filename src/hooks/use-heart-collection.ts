/**
 * useHeartCollection — unified hook for heart collection eligibility + action.
 * Now delegates to heartPoolState.ts for the single eligibility function.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  deriveHeartPoolStatus,
  canCollect,
  type HeartPoolStatus,
  isWithinGracePeriod,
} from "@/utils/heartPoolState";

export type HeartCollectionState = HeartPoolStatus;

export interface HeartPoolInfo {
  totalHearts: number;
  windfallCount: number;
}

export function useHeartCollection(
  treeId: string | undefined,
  userId: string | null,
  /** True when proximity gate says user is near or checked in */
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

  // Derive state using the unified function
  useEffect(() => {
    if (poolLoading) { setState("loading"); return; }
    if (collectedAmount !== null) { setState("collected"); return; }

    const status = deriveHeartPoolStatus({
      userId,
      treeId,
      poolHearts: pool?.totalHearts ?? 0,
      isNearTree: isEligible,
    });
    setState(status);
  }, [poolLoading, userId, treeId, pool, isEligible, collectedAmount]);

  // Collect action
  const collect = useCallback(async () => {
    if (!userId || !treeId || state === "collecting") return null;
    
    // Double-check eligibility before attempting
    const currentStatus = deriveHeartPoolStatus({
      userId,
      treeId,
      poolHearts: pool?.totalHearts ?? 0,
      isNearTree: isEligible,
    });
    if (!canCollect(currentStatus)) return null;

    setState("collecting");
    try {
      const { data, error } = await supabase.rpc("claim_windfall_hearts", {
        p_tree_id: treeId,
        p_user_id: userId,
      });
      if (error) {
        setState("visible_not_collectable");
        return null;
      }
      const amount = typeof data === "number" ? data : 0;
      if (amount > 0) {
        setCollectedAmount(amount);
        setState("collected");
        setTimeout(fetchPool, 1500);
        return amount;
      } else {
        setState("no_hearts");
        return 0;
      }
    } catch {
      setState("visible_not_collectable");
      return null;
    }
  }, [userId, treeId, state, fetchPool, pool, isEligible]);

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
 */
export async function getTreeHeartPoolCount(treeId: string): Promise<number> {
  const { data } = await supabase
    .from("tree_heart_pools")
    .select("total_hearts")
    .eq("tree_id", treeId)
    .maybeSingle();
  return data?.total_hearts ?? 0;
}
