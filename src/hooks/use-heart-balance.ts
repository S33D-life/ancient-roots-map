/**
 * Unified heart balance hook — single source of truth.
 * Replaces duplicated calculations in Header, DashboardVault, and useSeedEconomy.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeartBalance {
  totalHearts: number;
  baseHearts: number;
  milestoneHearts: number;
  transactionHearts: number;
  photoBonus: number;
  breakdown: { wanderer: number; sower: number; windfall: number };
  counts: { trees: number; offerings: number; plants: number; wishlist: number };
  loading: boolean;
  streak: number;
  lastActivity: string | null;
  refresh: () => Promise<void>;
}

// Milestone tiers — shared definition
const MILESTONES = (tc: number, oc: number, pc: number, wc: number): [number, number, number][] => [
  [tc, 1, 10], [tc, 5, 25], [tc, 10, 50],
  [tc, 25, 100], [tc, 50, 200], [tc, 100, 500], [tc, 250, 1000],
  [oc, 1, 5], [oc, 10, 30], [oc, 25, 75],
  [oc, 50, 200], [oc, 100, 500],
  [pc, 1, 5], [pc, 5, 20], [pc, 15, 60],
  [wc, 3, 15], [wc, 10, 50],
];

/** Calculate consecutive days with heart_transactions (Living Streak) */
function computeStreak(dates: string[]): { streak: number; lastActivity: string | null } {
  if (dates.length === 0) return { streak: 0, lastActivity: null };

  // Get unique dates (YYYY-MM-DD) sorted desc
  const unique = [...new Set(dates.map(d => d.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Streak must include today or yesterday
  if (unique[0] !== today && unique[0] !== yesterday) {
    return { streak: 0, lastActivity: unique[0] };
  }

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return { streak, lastActivity: unique[0] };
}

export function useHeartBalance(userId: string | null): HeartBalance {
  const [data, setData] = useState<HeartBalance>({
    totalHearts: 0, baseHearts: 0, milestoneHearts: 0, transactionHearts: 0,
    photoBonus: 0,
    breakdown: { wanderer: 0, sower: 0, windfall: 0 },
    counts: { trees: 0, offerings: 0, plants: 0, wishlist: 0 },
    loading: true, streak: 0, lastActivity: null,
    refresh: async () => {},
  });
  const fetchingRef = useRef(false);

  const fetchBalance = useCallback(async () => {
    if (!userId || fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // Use materialized balance when available, fall back to full query
      const [treesRes, offeringsRes, plantsRes, wishlistRes, balanceRes, heartTxRes, photoRes] = await Promise.all([
        supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId),
        supabase.from("offerings").select("*", { count: "exact", head: true }).eq("created_by", userId),
        supabase.from("greenhouse_plants").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("tree_wishlist").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("user_heart_balances").select("s33d_hearts").eq("user_id", userId).maybeSingle(),
        supabase.from("heart_transactions").select("heart_type, amount, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
        supabase.from("offerings").select("tree_id").eq("created_by", userId).eq("type", "photo"),
      ]);

      const tc = treesRes.count || 0;
      const oc = offeringsRes.count || 0;
      const pc = plantsRes.count || 0;
      const wc = wishlistRes.count || 0;
      const txData = heartTxRes.data || [];

      // Base: 10 per tree
      const baseHearts = tc * 10;

      // Photo bonus: +1 per unique tree with photo
      const photoTreeIds = new Set((photoRes.data || []).map((o: any) => o.tree_id));
      const photoBonus = photoTreeIds.size;

      // Milestones
      const milestones = MILESTONES(tc, oc, pc, wc);
      const milestoneHearts = milestones.reduce(
        (sum, [count, threshold, hearts]) => count >= threshold ? sum + hearts : sum, 0
      );

      // Transaction totals + breakdown
      const bd = { wanderer: 0, sower: 0, windfall: 0 };
      let txTotal = 0;
      for (const h of txData as { heart_type: string; amount: number; created_at: string }[]) {
        txTotal += h.amount || 0;
        if (h.heart_type === "wanderer") bd.wanderer += h.amount;
        else if (h.heart_type === "sower") bd.sower += h.amount;
        else if (h.heart_type === "windfall") bd.windfall += h.amount;
      }

      // Living Streak
      const txDates = txData.map((h: any) => h.created_at);
      const { streak, lastActivity } = computeStreak(txDates);

      const totalHearts = baseHearts + milestoneHearts + txTotal + photoBonus;

      setData({
        totalHearts, baseHearts, milestoneHearts, transactionHearts: txTotal, photoBonus,
        breakdown: bd,
        counts: { trees: tc, offerings: oc, plants: pc, wishlist: wc },
        loading: false, streak, lastActivity,
        refresh: fetchBalance,
      });
    } finally {
      fetchingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Realtime updates for heart_transactions
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`heart-balance-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "heart_transactions", filter: `user_id=eq.${userId}` },
        () => { fetchBalance(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchBalance]);

  return data;
}
