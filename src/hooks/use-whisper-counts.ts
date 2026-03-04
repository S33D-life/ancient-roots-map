import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight hook that fetches whisper counts per tree (anchor).
 * Returns a map of tree_id → whisper count for trees that have recent whispers.
 */
export interface WhisperCountMap {
  [treeId: string]: number;
}

export function useWhisperCounts({ realtime = false }: { realtime?: boolean } = {}) {
  const [counts, setCounts] = useState<WhisperCountMap>({});
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    // Count whispers grouped by tree_anchor_id
    const { data, error } = await supabase
      .from("tree_whispers" as any)
      .select("tree_anchor_id");

    if (error) {
      console.error("Error fetching whisper counts:", error);
      setLoading(false);
      return;
    }

    const c: WhisperCountMap = {};
    (data || []).forEach((row: any) => {
      const tid = row.tree_anchor_id;
      if (tid) c[tid] = (c[tid] || 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    if (!realtime) return;
    const channel = supabase
      .channel("whisper-counts-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "tree_whispers" }, () => fetchCounts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [realtime, fetchCounts]);

  return { counts, loading, refetch: fetchCounts };
}
