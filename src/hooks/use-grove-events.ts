/**
 * useGroveEvents — unified event model for GroveView "Living Earth Mode"
 *
 * Aggregates recent activity across trees, offerings, hearts, and checkins
 * into a single normalized event stream, filtered by mythic timeframe.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MythicTimeframe = "now" | "today" | "moon" | "all_seasons";

export const MYTHIC_TIMEFRAMES: { key: MythicTimeframe; label: string; icon: string }[] = [
  { key: "now", label: "Now", icon: "🌙" },
  { key: "today", label: "Today", icon: "🌗" },
  { key: "moon", label: "This Moon", icon: "🌕" },
  { key: "all_seasons", label: "All Seasons", icon: "🌳" },
];

export interface GroveEvent {
  id: string;
  type: "TREE_MAPPED" | "OFFERING_CREATED" | "HEART_EARNED" | "CHECKIN" | "QUOTE_UPVOTED" | "SEED_PLANTED";
  timestamp: string;
  treeId?: string;
  metadata?: Record<string, any>;
}

export interface GroveSignals {
  treesStirring: number;
  heartsGathered: number;
  offeringsThisMoon: number;
  mostLovedWisdom: string | null;
}

function getTimeframeCutoff(tf: MythicTimeframe): string {
  const now = new Date();
  switch (tf) {
    case "now": return new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // 1h
    case "today": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "moon": return new Date(now.getTime() - 29.5 * 24 * 60 * 60 * 1000).toISOString();
    case "all_seasons": return "1970-01-01T00:00:00Z";
  }
}

export function useGroveEvents(timeframe: MythicTimeframe) {
  const [signals, setSignals] = useState<GroveSignals>({
    treesStirring: 0,
    heartsGathered: 0,
    offeringsThisMoon: 0,
    mostLovedWisdom: null,
  });
  const [loading, setLoading] = useState(true);

  const cutoff = useMemo(() => getTimeframeCutoff(timeframe), [timeframe]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetch = async () => {
      const [treesRes, offeringsRes, heartsRes, quoteRes] = await Promise.all([
        // Trees stirring = trees with any offering/checkin in timeframe
        supabase
          .from("offerings")
          .select("tree_id", { count: "exact", head: true })
          .gte("created_at", cutoff),
        // Offerings this period
        supabase
          .from("offerings")
          .select("id", { count: "exact", head: true })
          .gte("created_at", cutoff),
        // Hearts gathered
        supabase
          .from("heart_transactions")
          .select("amount")
          .gte("created_at", cutoff),
        // Most liked quote (from offerings with quote_text)
        supabase
          .from("offerings")
          .select("quote_text, influence_score")
          .not("quote_text", "is", null)
          .order("influence_score", { ascending: false })
          .limit(1),
      ]);

      if (cancelled) return;

      const heartTotal = heartsRes.data?.reduce((sum, h) => sum + (h.amount || 0), 0) || 0;

      setSignals({
        treesStirring: treesRes.count || 0,
        heartsGathered: heartTotal,
        offeringsThisMoon: offeringsRes.count || 0,
        mostLovedWisdom: quoteRes.data?.[0]?.quote_text || null,
      });
      setLoading(false);
    };

    fetch();
    return () => { cancelled = true; };
  }, [cutoff]);

  return { signals, loading };
}
