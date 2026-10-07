/**
 * Read-only Agent Garden relationship for a Crown growth.
 *
 * Uses the existing `agent_garden_tasks.roadmap_feature_slug` link (public
 * read). Selects public task fields only; never reads submissions or proof,
 * and never writes.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrowthTask { id: string; title: string; status: string }

export function useGrowthTasks(roadmapFeatureSlug: string) {
  return useQuery({
    queryKey: ["crown-growth-tasks", roadmapFeatureSlug],
    queryFn: async (): Promise<GrowthTask[]> => {
      const { data, error } = await supabase
        .from("agent_garden_tasks")
        .select("id, title, status")
        .eq("roadmap_feature_slug", roadmapFeatureSlug)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as GrowthTask[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
