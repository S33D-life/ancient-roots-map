import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  user_id: string;
  trees_mapped: number;
  offerings_count: number;
  species_hearts: number;
  display_name?: string;
  avatar_url?: string;
}

export function useHiveLeaderboard(family: string | undefined) {
  return useQuery({
    queryKey: ["hive-leaderboard", family],
    enabled: Boolean(family),
    staleTime: 120_000,
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!family) return [];
      const { data, error } = await supabase.rpc("get_hive_leaderboard", {
        p_family: family,
        p_limit: 10,
      });
      if (error) { console.error("Leaderboard fetch error:", error); return []; }
      
      const entries = (data || []) as LeaderboardEntry[];
      
      // Resolve profiles
      if (entries.length > 0) {
        const ids = entries.map(e => e.user_id);
        const { data: profiles } = await supabase.rpc("get_safe_profiles", { p_ids: ids });
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        entries.forEach(e => {
          const p = profileMap.get(e.user_id) as any;
          if (p) {
            e.display_name = p.full_name || "Wanderer";
            e.avatar_url = p.avatar_url;
          }
        });
      }
      
      return entries;
    },
  });
}
