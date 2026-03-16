/**
 * Hook: useGroveDetection — detects grove candidates from loaded trees.
 * Uses React Query for caching and the grove detection engine.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  detectAllGroves,
  type GroveCandidate,
  type GroveTreeRef,
} from "@/utils/groveDetection";

async function fetchTreesForGroveDetection(): Promise<GroveTreeRef[]> {
  const refs: GroveTreeRef[] = [];

  // Fetch verified trees
  const { data: trees } = await supabase
    .from("trees")
    .select("id, name, species, latitude, longitude, nation")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(1000);

  if (trees) {
    trees.forEach((t: any) => {
      refs.push({
        id: t.id,
        name: t.name || "Unnamed Tree",
        species: t.species || undefined,
        lat: Number(t.latitude),
        lng: Number(t.longitude),
        source: "trees",
        visited: true,
        verified: true,
      });
    });
  }

  // Fetch research trees
  const { data: research } = await supabase
    .from("research_trees")
    .select("id, tree_name, species_scientific, species_common, latitude, longitude, country")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(1000);

  if (research) {
    research.forEach((rt: any) => {
      refs.push({
        id: rt.id,
        name: rt.tree_name || rt.species_common || rt.species_scientific || "Research Tree",
        species: rt.species_scientific || undefined,
        species_common: rt.species_common || undefined,
        lat: Number(rt.latitude),
        lng: Number(rt.longitude),
        source: "research_trees",
        visited: false,
        verified: false,
      });
    });
  }

  return refs;
}

export function useGroveDetection() {
  return useQuery({
    queryKey: ["grove-detection"],
    queryFn: async () => {
      const trees = await fetchTreesForGroveDetection();
      const { local, species } = detectAllGroves(trees);
      return { local, species, totalTrees: trees.length };
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useGroves() {
  return useQuery({
    queryKey: ["groves-saved"],
    queryFn: async () => {
      const { data } = await supabase
        .from("groves")
        .select("*")
        .order("grove_strength_score", { ascending: false });
      return (data || []) as any[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useGroveById(groveId: string | undefined) {
  return useQuery({
    queryKey: ["grove", groveId],
    queryFn: async () => {
      if (!groveId) return null;
      const { data } = await supabase
        .from("groves")
        .select("*")
        .eq("id", groveId)
        .maybeSingle();
      if (!data) return null;

      // Fetch member trees
      const { data: members } = await supabase
        .from("grove_trees")
        .select("tree_id, tree_source")
        .eq("grove_id", groveId);

      return { grove: data, members: members || [] };
    },
    enabled: !!groveId,
  });
}
