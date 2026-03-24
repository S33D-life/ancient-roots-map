/**
 * useTreeMapData — React Query-based hook for fetching tree, birdsong, and seed
 * data for the Atlas map.
 *
 * OPTIMISED: 10-minute stale time, longer cache, debounced realtime (5s).
 * The full dataset is fetched once and cached — viewport filtering happens client-side.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
  what3words: string;
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
const STALE_TIME = 10 * 60 * 1000; // 10 minutes (up from 5)

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
    gcTime: 30 * 60 * 1000, // keep in cache 30 min (up from 10)
    refetchOnWindowFocus: false, // disable auto-refetch on tab focus
    refetchOnReconnect: false,
  });

  // Realtime invalidation — debounced to 5 seconds (up from 2)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedInvalidate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: TREE_MAP_KEY });
      }, 5000);
    };

    const channel = supabase
      .channel("tree-map-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trees" },
        debouncedInvalidate
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "planted_seeds" },
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
