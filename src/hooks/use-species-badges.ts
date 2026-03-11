import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SpeciesBadge {
  id: string;
  species_key: string;
  species_name: string;
  badge_name: string;
  trees_mapped: number;
  earned_at: string;
}

export function useSpeciesBadges(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["species-badges", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<SpeciesBadge[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("species_badges" as any)
        .select("id, species_key, species_name, badge_name, trees_mapped, earned_at")
        .eq("user_id", userId)
        .order("trees_mapped", { ascending: false });
      if (error) { console.error("Badges fetch error:", error); return []; }
      return (data || []) as SpeciesBadge[];
    },
  });
}
