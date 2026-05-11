/**
 * useLivingProgression — derives gentle, ecological progression counters
 * from the user's actual visits and mapped trees.
 *
 * Returns:
 * - speciesEncountered: distinct species set (string[])
 * - hiveCounts: per-hive count of distinct trees encountered
 * - ancientCount: trees with estimated_age >= 200 that the user has met
 * - regionCount: distinct first-token of location_text on visited trees
 * - recentSpecies: last 5 species labels encountered
 * - seasonalVisits: visits made this season
 *
 * All queries fail-soft: any error returns empty data so the UI never crashes.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HIVES, speciesMatchesHive, currentSeason } from "@/lib/quest-cave/livingPaths";

export interface LivingProgression {
  speciesEncountered: string[];
  hiveCounts: Record<string, number>;
  ancientCount: number;
  regionCount: number;
  recentSpecies: string[];
  seasonalVisits: number;
  isLoading: boolean;
}

const EMPTY: LivingProgression = {
  speciesEncountered: [],
  hiveCounts: {},
  ancientCount: 0,
  regionCount: 0,
  recentSpecies: [],
  seasonalVisits: 0,
  isLoading: false,
};

function seasonRange(season: ReturnType<typeof currentSeason>) {
  const now = new Date();
  const y = now.getFullYear();
  const map: Record<typeof season, [number, number]> = {
    Spring: [2, 4],
    Summer: [5, 7],
    Autumn: [8, 10],
    Winter: [11, 1], // crosses year boundary, handled below
  } as const;
  const [a, b] = map[season];
  if (season === "Winter") {
    return { from: new Date(y, 11, 1), to: new Date(y + 1, 1, 28) };
  }
  return { from: new Date(y, a, 1), to: new Date(y, b + 1, 0) };
}

export function useLivingProgression(userId: string | null) {
  const query = useQuery<LivingProgression>({
    queryKey: ["living-progression", userId ?? "anon"],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) return EMPTY;
      try {
        // Visits — pull tree_id + checked_in_at
        const { data: checkins } = await supabase
          .from("tree_checkins")
          .select("tree_id, checked_in_at")
          .eq("user_id", userId)
          .limit(1000);

        const visitedIds = Array.from(new Set((checkins ?? []).map((c) => c.tree_id))).filter(
          Boolean,
        ) as string[];

        // Trees the user has met (visited) plus mapped
        let trees:
          | Array<{ id: string; species: string | null; estimated_age: number | null; location_text: string | null }>
          | null = null;

        if (visitedIds.length > 0) {
          const { data } = await supabase
            .from("trees")
            .select("id, species, estimated_age, location_text")
            .in("id", visitedIds);
          trees = (data ?? []) as typeof trees;
        }

        const { data: mapped } = await supabase
          .from("trees")
          .select("id, species, estimated_age, location_text")
          .eq("created_by", userId)
          .limit(500);

        const all = new Map<string, { id: string; species: string | null; estimated_age: number | null; location_text: string | null }>();
        for (const t of trees ?? []) all.set(t.id, t);
        for (const t of mapped ?? []) all.set(t.id, t as never);

        const speciesSet = new Set<string>();
        const hiveCounts: Record<string, number> = {};
        for (const h of HIVES) hiveCounts[h.id] = 0;
        let ancientCount = 0;
        const regions = new Set<string>();

        for (const t of all.values()) {
          const sp = (t.species ?? "").trim();
          if (sp) speciesSet.add(sp.toLowerCase());
          for (const h of HIVES) {
            if (speciesMatchesHive(sp, h)) hiveCounts[h.id] += 1;
          }
          if ((t.estimated_age ?? 0) >= 200) ancientCount += 1;
          if (t.location_text) {
            const region = t.location_text.split(/[,/·]/)[0]?.trim().toLowerCase();
            if (region) regions.add(region);
          }
        }

        // Recent species — last 5 distinct from checkins (most recent first)
        const recentSet: string[] = [];
        if (checkins && trees) {
          const idToSpecies = new Map(trees.map((t) => [t.id, (t.species ?? "").trim()]));
          const sorted = [...checkins].sort(
            (a, b) =>
              new Date(b.checked_in_at).getTime() -
              new Date(a.checked_in_at).getTime(),
          );
          for (const c of sorted) {
            const s = idToSpecies.get(c.tree_id) ?? "";
            if (s && !recentSet.includes(s)) recentSet.push(s);
            if (recentSet.length >= 5) break;
          }
        }

        // Seasonal visits
        const { from, to } = seasonRange(currentSeason());
        const seasonalVisits =
          (checkins ?? []).filter((c) => {
            const t = new Date(c.checked_in_at).getTime();
            return t >= from.getTime() && t <= to.getTime();
          }).length;

        return {
          speciesEncountered: Array.from(speciesSet),
          hiveCounts,
          ancientCount,
          regionCount: regions.size,
          recentSpecies: recentSet,
          seasonalVisits,
          isLoading: false,
        };
      } catch {
        return EMPTY;
      }
    },
  });

  return {
    ...(query.data ?? EMPTY),
    isLoading: query.isLoading,
  };
}
