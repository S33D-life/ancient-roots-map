/**
 * useTreeVitality — fetches aggregate ecosystem stats to determine
 * the "vitality" level of the Living Tree visualization.
 *
 * Returns a 0–1 vitality score based on total trees, offerings, etc.
 * Cached via React Query with 5-minute stale time.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreeVitality {
  totalTrees: number;
  totalOfferings: number;
  totalVisits: number;
  /** 0–1 normalized vitality score */
  vitality: number;
  /** "sparse" | "growing" | "thriving" | "flourishing" */
  stage: "sparse" | "growing" | "thriving" | "flourishing";
}

function computeVitality(trees: number, offerings: number): TreeVitality {
  // Logarithmic scaling so early growth feels impactful
  const treeScore = Math.min(1, Math.log10(Math.max(1, trees)) / 4); // 10k trees = 1.0
  const offeringScore = Math.min(1, Math.log10(Math.max(1, offerings)) / 4);
  const vitality = treeScore * 0.6 + offeringScore * 0.4;

  let stage: TreeVitality["stage"] = "sparse";
  if (vitality > 0.7) stage = "flourishing";
  else if (vitality > 0.45) stage = "thriving";
  else if (vitality > 0.2) stage = "growing";

  return {
    totalTrees: trees,
    totalOfferings: offerings,
    totalVisits: 0,
    vitality,
    stage,
  };
}

export function useTreeVitality() {
  return useQuery({
    queryKey: ["tree-vitality"],
    queryFn: async (): Promise<TreeVitality> => {
      const [treesRes, offeringsRes] = await Promise.all([
        supabase.from("trees").select("id", { count: "exact", head: true }),
        supabase.from("offerings").select("id", { count: "exact", head: true }),
      ]);

      const trees = treesRes.count ?? 0;
      const offerings = offeringsRes.count ?? 0;

      return computeVitality(trees, offerings);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
