/**
 * Hook for Species Hearts + Influence token balances and issuance.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getHiveForSpecies, getHiveInfo, type HiveInfo } from "@/utils/hiveUtils";
import { matchSpecies } from "@/data/treeSpecies";

export interface SpeciesBalance {
  family: string;
  hive: HiveInfo;
  amount: number;
}

export interface InfluenceBalance {
  scope: string; // 'global' or species_family
  amount: number;
}

export interface TokenHistoryEntry {
  id: string;
  type: "species_heart" | "influence";
  amount: number;
  species_family: string | null;
  action_type: string;
  tree_id: string;
  tree_name?: string;
  created_at: string;
}

interface SpeciesTokens {
  speciesBalances: SpeciesBalance[];
  influenceGlobal: number;
  influenceByHive: Record<string, number>;
  totalSpeciesHearts: number;
  history: TokenHistoryEntry[];
  loading: boolean;
  issueTokens: (params: {
    treeId: string;
    treeSpecies: string;
    actionType: string;
    speciesAmount?: number;
    influenceAmount?: number;
    influenceReason?: string;
  }) => Promise<{ speciesEarned: number; influenceEarned: number; hiveName: string } | null>;
  refresh: () => Promise<void>;
}

const DAILY_CHECKIN_CAP = 3;

export function useSpeciesTokens(userId: string | null): SpeciesTokens {
  const [speciesBalances, setSpeciesBalances] = useState<SpeciesBalance[]>([]);
  const [influenceGlobal, setInfluenceGlobal] = useState(0);
  const [influenceByHive, setInfluenceByHive] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<TokenHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    const [speciesRes, influenceRes] = await Promise.all([
      supabase
        .from("species_heart_transactions")
        .select("species_family, amount, tree_id, action_type, created_at, id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("influence_transactions")
        .select("species_family, scope, amount, tree_id, action_type, created_at, id, reason")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    // Aggregate species hearts by family
    const familyMap = new Map<string, number>();
    for (const tx of speciesRes.data || []) {
      familyMap.set(tx.species_family, (familyMap.get(tx.species_family) || 0) + tx.amount);
    }
    const balances: SpeciesBalance[] = [];
    for (const [family, amount] of familyMap) {
      const hive = getHiveForSpecies(family) || {
        family, slug: family.toLowerCase(), displayName: `${family} Hive`,
        description: "", accentHsl: "200 30% 45%", icon: "🌱", representativeSpecies: [],
      };
      balances.push({ family, hive: getHiveInfo(family), amount });
    }
    balances.sort((a, b) => b.amount - a.amount);
    setSpeciesBalances(balances);

    // Aggregate influence
    let globalInf = 0;
    const hiveInf: Record<string, number> = {};
    for (const tx of influenceRes.data || []) {
      if (tx.scope === "global" || !tx.species_family) {
        globalInf += tx.amount;
      } else {
        hiveInf[tx.species_family] = (hiveInf[tx.species_family] || 0) + tx.amount;
      }
    }
    setInfluenceGlobal(globalInf);
    setInfluenceByHive(hiveInf);

    // Build unified history
    const hist: TokenHistoryEntry[] = [
      ...(speciesRes.data || []).map(tx => ({
        id: tx.id,
        type: "species_heart" as const,
        amount: tx.amount,
        species_family: tx.species_family,
        action_type: tx.action_type,
        tree_id: tx.tree_id,
        created_at: tx.created_at,
      })),
      ...(influenceRes.data || []).map(tx => ({
        id: tx.id,
        type: "influence" as const,
        amount: tx.amount,
        species_family: tx.species_family,
        action_type: tx.action_type,
        tree_id: tx.tree_id,
        created_at: tx.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setHistory(hist);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const issueTokens = useCallback(async (params: {
    treeId: string;
    treeSpecies: string;
    actionType: string;
    speciesAmount?: number;
    influenceAmount?: number;
    influenceReason?: string;
  }) => {
    if (!userId) return null;

    const match = matchSpecies(params.treeSpecies);
    const family = match?.family || "Unknown";
    const hive = getHiveForSpecies(params.treeSpecies);
    const hiveName = hive?.displayName || `${family} Hive`;
    const speciesAmt = params.speciesAmount ?? 1;
    const influenceAmt = params.influenceAmount ?? 0;

    // Check daily cap for checkins
    if (params.actionType === "checkin") {
      const today = new Date().toISOString().slice(0, 10);
      const { data: cap } = await supabase
        .from("daily_reward_caps")
        .select("checkin_count")
        .eq("user_id", userId)
        .eq("tree_id", params.treeId)
        .eq("reward_date", today)
        .maybeSingle();

      if (cap && cap.checkin_count >= DAILY_CHECKIN_CAP) {
        return null; // Capped
      }

      // Upsert cap
      await supabase.from("daily_reward_caps").upsert({
        user_id: userId,
        tree_id: params.treeId,
        reward_date: today,
        checkin_count: (cap?.checkin_count || 0) + 1,
        last_checkin_at: new Date().toISOString(),
      }, { onConflict: "user_id,tree_id,reward_date" });
    }

    // Issue species hearts
    if (speciesAmt > 0) {
      await supabase.from("species_heart_transactions").insert({
        user_id: userId,
        tree_id: params.treeId,
        species_family: family,
        amount: speciesAmt,
        action_type: params.actionType,
      });
    }

    // Issue influence tokens
    if (influenceAmt > 0) {
      await supabase.from("influence_transactions").insert({
        user_id: userId,
        tree_id: params.treeId,
        species_family: family,
        scope: "hive",
        amount: influenceAmt,
        action_type: params.actionType,
        reason: params.influenceReason || null,
      });
    }

    await fetchAll();
    return { speciesEarned: speciesAmt, influenceEarned: influenceAmt, hiveName };
  }, [userId, fetchAll]);

  const totalSpeciesHearts = speciesBalances.reduce((s, b) => s + b.amount, 0);

  return {
    speciesBalances,
    influenceGlobal,
    influenceByHive,
    totalSpeciesHearts,
    history,
    loading,
    issueTokens,
    refresh: fetchAll,
  };
}
