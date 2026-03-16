/**
 * usePathwayDetection — detects mycelial pathway candidates between groves.
 * Uses grove detection data + saved groves to find corridor opportunities.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGroveDetection, useGroves } from "@/hooks/use-grove-detection";
import {
  detectAllPathways,
  type PathwayCandidate,
  type PathwayGroveRef,
} from "@/utils/pathwayDetection";

function groveToRef(g: any): PathwayGroveRef | null {
  const lat = Number(g.center?.lat ?? g.center_latitude);
  const lng = Number(g.center?.lng ?? g.center_longitude);
  if (!lat || !lng) return null;

  return {
    grove_id: g.id || `detected-${lat}-${lng}`,
    name: g.grove_name || g.suggested_name || "Unnamed Grove",
    grove_type: g.grove_type || "local_grove",
    lat,
    lng,
    radius_m: g.radius_m || 1000,
    tree_count: g.tree_count || g.trees?.length || 0,
    grove_strength_score: g.grove_strength_score || 0,
    species_common: g.species_common || undefined,
    visit_count: g.visit_count || 0,
    offering_count: g.offering_count || 0,
  };
}

export function usePathwayDetection() {
  const { data: detected } = useGroveDetection();
  const { data: savedGroves } = useGroves();

  return useQuery({
    queryKey: ["pathway-detection", detected?.totalTrees, savedGroves?.length],
    queryFn: () => {
      const refs: PathwayGroveRef[] = [];

      // Add saved (blessed) groves
      savedGroves?.forEach(g => {
        const ref = groveToRef(g);
        if (ref) refs.push(ref);
      });

      // Add detected candidates (if not already saved)
      const savedIds = new Set(refs.map(r => r.grove_id));
      [...(detected?.local || []), ...(detected?.species || [])].forEach(g => {
        const ref = groveToRef(g);
        if (ref && !savedIds.has(ref.grove_id)) refs.push(ref);
      });

      if (refs.length < 2) return { local: [], species: [], all: [] };

      return detectAllPathways(refs);
    },
    enabled: !!(detected || savedGroves),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSavedPathways() {
  return useQuery({
    queryKey: ["pathways-saved"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mycelial_pathways")
        .select("*")
        .order("pathway_strength_score", { ascending: false });
      return (data || []) as any[];
    },
    staleTime: 2 * 60 * 1000,
  });
}
