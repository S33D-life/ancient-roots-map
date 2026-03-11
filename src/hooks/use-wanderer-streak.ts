import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WandererStreak {
  current_streak: number;
  longest_streak: number;
  last_mapped_date: string | null;
  streak_tier: string;
}

const TIER_META: Record<string, { label: string; emoji: string; color: string; threshold: number }> = {
  none: { label: "No streak", emoji: "🌑", color: "hsl(var(--muted-foreground))", threshold: 0 },
  seedling: { label: "Seedling", emoji: "🌱", color: "hsl(120, 40%, 50%)", threshold: 3 },
  sapling: { label: "Sapling", emoji: "🌿", color: "hsl(100, 50%, 45%)", threshold: 7 },
  young_tree: { label: "Young Tree", emoji: "🌳", color: "hsl(80, 55%, 40%)", threshold: 21 },
  guardian: { label: "Forest Guardian", emoji: "👑", color: "hsl(45, 80%, 50%)", threshold: 90 },
};

export function getTierMeta(tier: string) {
  return TIER_META[tier] || TIER_META.none;
}

export function useWandererStreak(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["wanderer-streak", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<WandererStreak | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("wanderer_streaks" as any)
        .select("current_streak, longest_streak, last_mapped_date, streak_tier")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) { console.error("Streak fetch error:", error); return null; }
      return data as unknown as WandererStreak | null;
    },
  });
}
