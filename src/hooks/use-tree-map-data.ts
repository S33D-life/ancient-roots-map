/**
 * useTreeMapData — React Query-based hook for fetching tree, birdsong, and seed
 * data for the Atlas map. Replaces the manual useEffect + state pattern in Map.tsx.
 *
 * Benefits:
 * - 5-minute stale time prevents redundant fetches
 * - Automatic background refetch on window focus
 * - Realtime invalidation via Supabase channel
 * - Shared cache across components
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */
export interface MapTree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  created_by?: string;
  nation?: string;
  estimated_age?: number | null;
  what3words?: string;
  lineage?: string;
  project_name?: string;
}

export interface BirdsongCounts {
  [treeId: string]: number;
}

export interface BirdsongHeatPoint {
  tree_id: string;
  season: string | null;
  latitude: number;
  longitude: number;
}

export interface BloomedSeed {
  id: string;
  tree_id: string;
  latitude: number | null;
  longitude: number | null;
  blooms_at: string;
  planter_id: string;
}

/* ── Query keys ── */
const TREE_MAP_KEY = ["tree-map-data"] as const;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

/* ── Fetch function ── */
async function fetchTreeMapData() {
  const [treesResult, birdsongResult, seedResult] = await Promise.all([
    supabase
      .from("trees")
      .select(
        "id,name,species,latitude,longitude,created_by,nation,estimated_age,what3words,lineage,project_name"
      )
      .not("latitude", "is", null)
      .not("longitude", "is", null),
    supabase.from("birdsong_offerings").select("tree_id, season"),
    supabase
      .from("planted_seeds")
      .select("id, tree_id, latitude, longitude, blooms_at, planter_id")
      .is("collected_by", null)
      .lte("blooms_at", new Date().toISOString()),
  ]);

  const trees: MapTree[] = treesResult.data ?? [];

  // Birdsong counts
  const birdsongCounts: BirdsongCounts = {};
  const birdsongHeatPoints: BirdsongHeatPoint[] = [];

  if (!birdsongResult.error && birdsongResult.data) {
    const treeMap = new Map<string, MapTree>();
    trees.forEach((t) => treeMap.set(t.id, t));

    birdsongResult.data.forEach((b: any) => {
      birdsongCounts[b.tree_id] = (birdsongCounts[b.tree_id] || 0) + 1;
      const tree = treeMap.get(b.tree_id);
      if (tree?.latitude && tree?.longitude) {
        birdsongHeatPoints.push({
          tree_id: b.tree_id,
          season: b.season,
          latitude: tree.latitude,
          longitude: tree.longitude,
        });
      }
    });
  }

  const bloomedSeeds: BloomedSeed[] = seedResult.data ?? [];

  return { trees, birdsongCounts, birdsongHeatPoints, bloomedSeeds };
}

/* ── Hook ── */
export function useTreeMapData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: TREE_MAP_KEY,
    queryFn: fetchTreeMapData,
    staleTime: STALE_TIME,
    gcTime: 10 * 60 * 1000, // keep in cache 10 min
    refetchOnWindowFocus: true,
  });

  // Realtime invalidation — debounced to 2 seconds
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedInvalidate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: TREE_MAP_KEY });
      }, 2000);
    };

    const channel = supabase
      .channel("tree-map-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trees" },
        debouncedInvalidate
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "planted_seeds" },
        debouncedInvalidate
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Stable derived data
  const trees = query.data?.trees ?? [];
  const birdsongCounts = query.data?.birdsongCounts ?? {};
  const birdsongHeatPoints = query.data?.birdsongHeatPoints ?? [];
  const bloomedSeeds = query.data?.bloomedSeeds ?? [];

  return {
    trees,
    birdsongCounts,
    birdsongHeatPoints,
    bloomedSeeds,
    isLoading: query.isLoading,
    error: query.error,
  };
}
