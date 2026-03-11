/**
 * useSeedTrail — Fetches the user's planted seeds with tree metadata
 * for "today" and optionally the last 7 days.
 * Lightweight: single query per range, 2-min stale time.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNowStrict } from "date-fns";

export interface SeedTrailEntry {
  id: string;
  treeId: string;
  treeName: string;
  treeSpecies: string | null;
  treeNation: string | null;
  latitude: number | null;
  longitude: number | null;
  plantedAt: string;
  relativeTime: string;
  bloomsAt: string;
  isBloomed: boolean;
  isCollected: boolean;
}

export interface SeedTrailDay {
  date: string; // YYYY-MM-DD
  seeds: SeedTrailEntry[];
}

async function fetchSeedTrail(userId: string, daysBack: number): Promise<SeedTrailEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  since.setHours(0, 0, 0, 0);

  const { data: seeds, error } = await supabase
    .from("planted_seeds")
    .select("id, tree_id, planted_at, blooms_at, collected_by, collected_at, latitude, longitude")
    .eq("planter_id", userId)
    .gte("planted_at", since.toISOString())
    .order("planted_at", { ascending: false })
    .limit(200);

  if (error || !seeds?.length) return [];

  const treeIds = [...new Set(seeds.map((s: any) => s.tree_id))];
  const { data: trees } = await supabase
    .from("trees")
    .select("id, name, species, nation, latitude, longitude")
    .in("id", treeIds);

  const treeMap = new Map(
    (trees || []).map((t: any) => [t.id, t])
  );

  const now = new Date();

  return seeds.map((s: any) => {
    const tree = treeMap.get(s.tree_id);
    return {
      id: s.id,
      treeId: s.tree_id,
      treeName: tree?.name || "Ancient Friend",
      treeSpecies: tree?.species || null,
      treeNation: tree?.nation || null,
      latitude: s.latitude ?? tree?.latitude ?? null,
      longitude: s.longitude ?? tree?.longitude ?? null,
      plantedAt: s.planted_at,
      relativeTime: formatDistanceToNowStrict(new Date(s.planted_at), { addSuffix: true }),
      bloomsAt: s.blooms_at,
      isBloomed: new Date(s.blooms_at) <= now,
      isCollected: !!s.collected_by,
    };
  });
}

export function useSeedTrail(userId: string | null, daysBack = 1) {
  return useQuery({
    queryKey: ["seed-trail", userId, daysBack],
    queryFn: () => fetchSeedTrail(userId!, daysBack),
    enabled: !!userId,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Group trail entries by date string */
export function groupByDay(entries: SeedTrailEntry[]): SeedTrailDay[] {
  const map = new Map<string, SeedTrailEntry[]>();
  entries.forEach((e) => {
    const day = e.plantedAt.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(e);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, seeds]) => ({ date, seeds }));
}
