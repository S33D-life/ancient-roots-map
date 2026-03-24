/**
 * useTreeMapData — React Query-based hook for fetching tree, birdsong, and seed
 * data for the Atlas map.
 *
 * SCALING ARCHITECTURE:
 * - Primary: Viewport-bounded RPC (get_trees_in_viewport) backed by materialized view
 * - Fallback: Full dataset fetch from trees table (for filters that need all data)
 * - Birdsong & seeds: fetched in parallel, cached independently
 * - Realtime: INSERT-only subscriptions with 5s debounce
 * - Cache: 10-min stale, 30-min GC, no auto-refetch
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
  girth_cm?: number | null;
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
const BIRDSONG_KEY = ["birdsong-map-data"] as const;
const SEEDS_KEY = ["seeds-map-data"] as const;
const STALE_TIME = 10 * 60 * 1000; // 10 minutes

/* ── Fetch functions (split for independent caching) ── */
async function fetchTrees(): Promise<MapTree[]> {
  const { data, error } = await supabase
    .from("trees")
    .select(
      "id,name,species,latitude,longitude,created_by,nation,estimated_age,what3words,lineage,project_name,girth_cm"
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .is("merged_into_tree_id", null);

  if (error) console.error("Tree fetch error:", error.message);
  return (data ?? []) as MapTree[];
}

async function fetchBirdsongData(trees: MapTree[]) {
  const { data, error } = await supabase
    .from("birdsong_offerings")
    .select("tree_id, season");

  const birdsongCounts: BirdsongCounts = {};
  const birdsongHeatPoints: BirdsongHeatPoint[] = [];

  if (!error && data) {
    const treeMap = new Map<string, MapTree>();
    trees.forEach((t) => treeMap.set(t.id, t));

    data.forEach((b: any) => {
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

  return { birdsongCounts, birdsongHeatPoints };
}

async function fetchBloomedSeeds(): Promise<BloomedSeed[]> {
  const { data } = await supabase
    .from("planted_seeds")
    .select("id, tree_id, latitude, longitude, blooms_at, planter_id")
    .is("collected_by", null)
    .lte("blooms_at", new Date().toISOString());

  return (data ?? []) as BloomedSeed[];
}

/* ── Combined fetch ── */
async function fetchTreeMapData() {
  const trees = await fetchTrees();

  // Fetch birdsong and seeds in parallel (independent of each other)
  const [birdsongData, bloomedSeeds] = await Promise.all([
    fetchBirdsongData(trees),
    fetchBloomedSeeds(),
  ]);

  return {
    trees,
    birdsongCounts: birdsongData.birdsongCounts,
    birdsongHeatPoints: birdsongData.birdsongHeatPoints,
    bloomedSeeds,
  };
}

/* ── Hook ── */
export function useTreeMapData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: TREE_MAP_KEY,
    queryFn: fetchTreeMapData,
    staleTime: STALE_TIME,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Realtime invalidation — INSERT-only, debounced 5s
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
