/**
 * Hook for tree check-in data — fetching, creating, and stats.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TreeCheckin {
  id: string;
  tree_id: string;
  user_id: string;
  checked_in_at: string;
  latitude: number | null;
  longitude: number | null;
  season_stage: string;
  weather: string | null;
  reflection: string | null;
  media_url: string | null;
  mood_score: number | null;
  canopy_proof: boolean;
  birdsong_heard: boolean | null;
  fungi_present: boolean | null;
  health_notes: string | null;
  minted_status: string;
  accuracy_m: number | null;
  proof_types: string[] | null;
  confidence_score: number | null;
}

export interface CheckinStats {
  totalVisits: number;
  firstVisit: string | null;
  lastVisit: string | null;
  seasonsCovered: string[];
  seasonPercent: number;
  currentStreak: number;
  longestStreak: number;
}

const ALL_SEASONS = ["bud", "leaf", "blossom", "fruit", "bare"];

export function useTreeCheckins(treeId?: string) {
  const [checkins, setCheckins] = useState<TreeCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckins = useCallback(async () => {
    if (!treeId) { setCheckins([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("tree_checkins")
      .select("*")
      .eq("tree_id", treeId)
      .order("checked_in_at", { ascending: false })
      .limit(200);
    setCheckins((data as TreeCheckin[]) || []);
    setLoading(false);
  }, [treeId]);

  useEffect(() => { fetchCheckins(); }, [fetchCheckins]);

  return { checkins, loading, refetch: fetchCheckins };
}

/** Stats for a specific user + tree relationship */
export function useCheckinStats(treeId?: string, userId?: string | null): CheckinStats {
  const [stats, setStats] = useState<CheckinStats>({
    totalVisits: 0, firstVisit: null, lastVisit: null,
    seasonsCovered: [], seasonPercent: 0, currentStreak: 0, longestStreak: 0,
  });

  useEffect(() => {
    if (!treeId || !userId) return;
    supabase
      .from("tree_checkins")
      .select("checked_in_at, season_stage")
      .eq("tree_id", treeId)
      .eq("user_id", userId)
      .order("checked_in_at", { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const seasons = [...new Set(data.map(d => d.season_stage).filter(s => ALL_SEASONS.includes(s)))];

        // Calculate streaks (consecutive days with check-ins)
        const daySet = new Set(data.map(d => d.checked_in_at.split("T")[0]));
        const sortedDays = [...daySet].sort();
        let currentStreak = 0;
        let longestStreak = 0;
        let streak = 1;
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        for (let i = 1; i < sortedDays.length; i++) {
          const prev = new Date(sortedDays[i - 1]).getTime();
          const curr = new Date(sortedDays[i]).getTime();
          if (curr - prev <= 86400000) { streak++; } else { longestStreak = Math.max(longestStreak, streak); streak = 1; }
        }
        longestStreak = Math.max(longestStreak, streak);

        const lastDay = sortedDays[sortedDays.length - 1];
        currentStreak = (lastDay === today || lastDay === yesterday) ? streak : 0;

        setStats({
          totalVisits: data.length,
          firstVisit: data[0].checked_in_at,
          lastVisit: data[data.length - 1].checked_in_at,
          seasonsCovered: seasons,
          seasonPercent: Math.round((seasons.length / ALL_SEASONS.length) * 100),
          currentStreak,
          longestStreak,
        });
      });
  }, [treeId, userId]);

  return stats;
}

/** All trees a user has checked into, with stats */
export function useUserCanopyTrees(userId?: string | null) {
  const [trees, setTrees] = useState<Array<{
    tree_id: string;
    tree_name: string;
    tree_species: string;
    totalVisits: number;
    firstVisit: string;
    lastVisit: string;
    seasonsCovered: string[];
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setTrees([]); setLoading(false); return; }
    setLoading(true);

    supabase
      .from("tree_checkins")
      .select("tree_id, checked_in_at, season_stage")
      .eq("user_id", userId)
      .order("checked_in_at", { ascending: false })
      .then(async ({ data: checkins }) => {
        if (!checkins || checkins.length === 0) { setTrees([]); setLoading(false); return; }

        // Group by tree
        const grouped = new Map<string, typeof checkins>();
        checkins.forEach(c => {
          const arr = grouped.get(c.tree_id) || [];
          arr.push(c);
          grouped.set(c.tree_id, arr);
        });

        const treeIds = [...grouped.keys()];
        const { data: treesData } = await supabase
          .from("trees")
          .select("id, name, species")
          .in("id", treeIds);

        const treeMap = new Map((treesData || []).map(t => [t.id, t]));

        const result = treeIds.map(tid => {
          const visits = grouped.get(tid)!;
          const tree = treeMap.get(tid);
          const seasons = [...new Set(visits.map(v => v.season_stage).filter(s => ALL_SEASONS.includes(s)))];
          return {
            tree_id: tid,
            tree_name: tree?.name || "Unknown",
            tree_species: tree?.species || "",
            totalVisits: visits.length,
            firstVisit: visits[visits.length - 1].checked_in_at,
            lastVisit: visits[0].checked_in_at,
            seasonsCovered: seasons,
          };
        });

        setTrees(result);
        setLoading(false);
      });
  }, [userId]);

  return { trees, loading };
}
