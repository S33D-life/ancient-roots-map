import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MarketType = "binary" | "date_range" | "numeric";
export type MarketScope = "tree" | "grove" | "species" | "region";
export type MarketStatus = "draft" | "open" | "closed" | "resolved" | "cancelled";

export interface Market {
  id: string;
  creator_user_id: string;
  title: string;
  description: string | null;
  rules_text: string | null;
  evidence_policy: string | null;
  resolution_source: string | null;
  market_type: MarketType;
  scope: MarketScope;
  linked_tree_ids: string[];
  linked_hive_id: string | null;
  status: MarketStatus;
  open_time: string;
  close_time: string;
  resolve_time: string | null;
  winner_pool_percent: number;
  grove_fund_percent: number;
  research_pot_percent: number;
  max_stake_per_user: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketOutcome {
  id: string;
  market_id: string;
  label: string;
  sort_order: number;
  is_winning: boolean | null;
  created_at: string;
}

export interface MarketStake {
  id: string;
  market_id: string;
  outcome_id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

export interface MarketWithMeta extends Market {
  outcomes: MarketOutcome[];
  stakes: MarketStake[];
  totalStaked: number;
  // implied probability for binary: YES probability 0–1
  impliedProb: number | null;
}

export function useMarkets(filters?: { treeId?: string; hiveId?: string; status?: MarketStatus }) {
  const [markets, setMarkets] = useState<MarketWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("markets").select("*").order("open_time", { ascending: false });

    if (filters?.status) q = q.eq("status", filters.status);
    if (filters?.hiveId) q = q.eq("linked_hive_id", filters.hiveId);

    const { data: marketsData, error } = await q.limit(100);
    if (error || !marketsData) { setLoading(false); return; }

    let filtered = marketsData as Market[];
    if (filters?.treeId) {
      filtered = filtered.filter(m => m.linked_tree_ids?.includes(filters.treeId!));
    }

    if (filtered.length === 0) { setMarkets([]); setLoading(false); return; }

    const ids = filtered.map(m => m.id);
    const [outcomesRes, stakesRes] = await Promise.all([
      supabase.from("market_outcomes").select("*").in("market_id", ids),
      supabase.from("market_stakes").select("*").in("market_id", ids),
    ]);

    const outcomes = (outcomesRes.data || []) as MarketOutcome[];
    const stakes = (stakesRes.data || []) as MarketStake[];

    const enriched: MarketWithMeta[] = filtered.map(m => {
      const mOutcomes = outcomes.filter(o => o.market_id === m.id).sort((a, b) => a.sort_order - b.sort_order);
      const mStakes = stakes.filter(s => s.market_id === m.id);
      const totalStaked = mStakes.reduce((s, st) => s + st.amount, 0);

      let impliedProb: number | null = null;
      if (m.market_type === "binary" && mOutcomes.length >= 2) {
        const yesOutcome = mOutcomes[0];
        const yesStakes = mStakes.filter(s => s.outcome_id === yesOutcome.id).reduce((s, st) => s + st.amount, 0);
        impliedProb = totalStaked > 0 ? yesStakes / totalStaked : 0.5;
      }

      return { ...m, outcomes: mOutcomes, stakes: mStakes, totalStaked, impliedProb };
    });

    setMarkets(enriched);
    setLoading(false);
  }, [filters?.treeId, filters?.hiveId, filters?.status]);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  return { markets, loading, refetch: fetchMarkets };
}

export function useMarket(marketId: string | undefined) {
  const [market, setMarket] = useState<MarketWithMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!marketId) return;
    setLoading(true);
    const [mRes, outRes, stRes] = await Promise.all([
      supabase.from("markets").select("*").eq("id", marketId).single(),
      supabase.from("market_outcomes").select("*").eq("market_id", marketId),
      supabase.from("market_stakes").select("*").eq("market_id", marketId),
    ]);
    if (mRes.error || !mRes.data) { setLoading(false); return; }
    const m = mRes.data as Market;
    const outcomes = ((outRes.data || []) as MarketOutcome[]).sort((a, b) => a.sort_order - b.sort_order);
    const stakes = (stRes.data || []) as MarketStake[];
    const totalStaked = stakes.reduce((s, st) => s + st.amount, 0);
    let impliedProb: number | null = null;
    if (m.market_type === "binary" && outcomes.length >= 2) {
      const yesStakes = stakes.filter(s => s.outcome_id === outcomes[0].id).reduce((s, st) => s + st.amount, 0);
      impliedProb = totalStaked > 0 ? yesStakes / totalStaked : 0.5;
    }
    setMarket({ ...m, outcomes, stakes, totalStaked, impliedProb });
    setLoading(false);
  }, [marketId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { market, loading, refetch: fetch };
}

/** Compute time-left string */
export function timeLeft(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m left`;
}

/** Percent of total staked on each outcome */
export function outcomePercent(stakes: MarketStake[], outcomeId: string, total: number): number {
  if (total === 0) return 0;
  const outcomeTotal = stakes.filter(s => s.outcome_id === outcomeId).reduce((s, st) => s + st.amount, 0);
  return Math.round((outcomeTotal / total) * 100);
}
