/**
 * useQuestCaveActivity — pulls real counters used by the Quest Cave.
 *
 * Uses simple Supabase head/count queries. All optional tables fall back to 0
 * if they don't exist or RLS hides them, so the UI never crashes.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHeartBalance } from "@/hooks/use-heart-balance";

export interface QuestCaveActivity {
  trees: number;
  visits: number;
  offerings: number;
  whispersSent: number;
  blooms: number;
  totalHearts: number;
  globalTrees: number;
  globalOfferings: number;
  globalBlooms: number;
  loading: boolean;
}

const ZERO: Omit<QuestCaveActivity, "loading"> = {
  trees: 0, visits: 0, offerings: 0, whispersSent: 0, blooms: 0,
  totalHearts: 0, globalTrees: 0, globalOfferings: 0, globalBlooms: 0,
};

async function safeCount(builder: any): Promise<number> {
  try {
    const { count } = await builder;
    return count ?? 0;
  } catch { return 0; }
}

export function useQuestCaveActivity(userId: string | null) {
  const [data, setData] = useState<QuestCaveActivity>({ ...ZERO, loading: true });
  const balance = useHeartBalance(userId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const userScoped = async (run: () => Promise<number>) =>
        userId ? run() : 0;

      const [
        trees, visits, offerings, whispers, blooms,
        gTrees, gOfferings, gBlooms,
      ] = await Promise.all([
        userScoped(() => safeCount(supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId!))),
        userScoped(() => safeCount(supabase.from("tree_checkins").select("*", { count: "exact", head: true }).eq("user_id", userId!))),
        userScoped(() => safeCount(supabase.from("offerings").select("*", { count: "exact", head: true }).eq("created_by", userId!))),
        userScoped(() => safeCount(supabase.from("tree_whispers" as any).select("*", { count: "exact", head: true }).eq("sender_user_id", userId!))),
        userScoped(() => safeCount(supabase.from("bloom_offerings" as any).select("*", { count: "exact", head: true }).eq("user_id", userId!))),
        safeCount(supabase.from("trees").select("*", { count: "exact", head: true })),
        safeCount(supabase.from("offerings").select("*", { count: "exact", head: true })),
        safeCount(supabase.from("bloom_offerings" as any).select("*", { count: "exact", head: true })),
      ]);

      if (cancelled) return;
      setData({
        trees, visits, offerings, whispersSent: whispers, blooms,
        totalHearts: balance.totalHearts || 0,
        globalTrees: gTrees, globalOfferings: gOfferings, globalBlooms: gBlooms,
        loading: false,
      });
    };
    load();
    return () => { cancelled = true; };
  }, [userId, balance.totalHearts]);

  return data;
}
