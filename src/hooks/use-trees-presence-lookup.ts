/**
 * useTreesPresenceLookup — lightweight presence lookup for card-based views.
 * Takes an array of tree IDs and returns a memoized Record<tree_id, TreeCardPresence>.
 *
 * Uses a single query against tree_checkins (last 12h) grouped by tree_id.
 * Refreshes every 60s while enabled. Does NOT use realtime — that's the map layer's job.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TreeCardPresence } from "@/components/TreeCard";

const POLL_INTERVAL = 60_000; // 60s
const HERE_NOW_MINUTES = 15;

export function useTreesPresenceLookup(treeIds: string[], enabled = true) {
  const [raw, setRaw] = useState<
    { tree_id: string; most_recent: string; cnt: number }[]
  >([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const idsKey = useMemo(() => treeIds.slice().sort().join(","), [treeIds]);

  useEffect(() => {
    if (!enabled || treeIds.length === 0) {
      setRaw([]);
      return;
    }

    const fetchPresence = async () => {
      const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      // Batch in chunks of 200 to stay within PostgREST limits
      const chunks: string[][] = [];
      for (let i = 0; i < treeIds.length; i += 200) {
        chunks.push(treeIds.slice(i, i + 200));
      }

      const results: typeof raw = [];

      for (const chunk of chunks) {
        const { data } = await supabase
          .from("tree_checkins")
          .select("tree_id, created_at")
          .in("tree_id", chunk)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(1000);

        if (data) {
          // Group by tree_id
          const grouped = new Map<string, { cnt: number; most_recent: string }>();
          for (const row of data) {
            const existing = grouped.get(row.tree_id);
            if (existing) {
              existing.cnt++;
            } else {
              grouped.set(row.tree_id, { cnt: 1, most_recent: row.created_at });
            }
          }
          for (const [tid, v] of grouped) {
            results.push({ tree_id: tid, most_recent: v.most_recent, cnt: v.cnt });
          }
        }
      }

      setRaw(results);
    };

    fetchPresence();
    timerRef.current = setInterval(fetchPresence, POLL_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, enabled]);

  /** O(1) lookup keyed by tree_id */
  const presenceByTreeId = useMemo(() => {
    const map: Record<string, TreeCardPresence> = {};
    const now = Date.now();

    for (const r of raw) {
      const ageMs = now - new Date(r.most_recent).getTime();
      const isHereNow = ageMs < HERE_NOW_MINUTES * 60 * 1000;
      map[r.tree_id] = {
        presence_state: isHereNow ? "here_now" : "recently_met",
        presence_count: r.cnt,
      };
    }

    return map;
  }, [raw]);

  return presenceByTreeId;
}
