import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight hook that fetches offering counts per tree (and optionally first photo).
 * Used by Map and Gallery surfaces that need aggregate data without full offering rows.
 * Subscribes to realtime changes for automatic updates.
 */
export interface OfferingCountMap {
  [treeId: string]: number;
}

export interface TreePhotoMap {
  [treeId: string]: string;
}

export function useOfferingCounts({ realtime = true }: { realtime?: boolean } = {}) {
  const [counts, setCounts] = useState<OfferingCountMap>({});
  const [photos, setPhotos] = useState<TreePhotoMap>({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_offering_counts");
    if (error) {
      console.error("Error fetching offering counts:", error);
      return;
    }
    const c: OfferingCountMap = {};
    const p: TreePhotoMap = {};
    (data || []).forEach((row: { tree_id: string; cnt: number; first_photo: string | null }) => {
      c[row.tree_id] = row.cnt;
      if (row.first_photo) p[row.tree_id] = row.first_photo;
    });
    setCounts(c);
    setPhotos(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!realtime) return;
    const channel = supabase
      .channel("offering-counts-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "offerings" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [realtime, fetch]);

  return { counts, photos, loading, refetch: fetch };
}

/**
 * Hook for fetching the total offering count for a specific user.
 * Used by Dashboard to show a consistent count.
 */
export function useUserOfferingCount(userId: string | null) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) { setCount(0); return; }
    setLoading(true);
    const { count: c, error } = await supabase
      .from("offerings")
      .select("*", { count: "exact", head: true })
      .eq("created_by", userId);
    if (!error) setCount(c || 0);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`user-offering-count-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offerings", filter: `created_by=eq.${userId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetch]);

  return { count, loading, refetch: fetch };
}
