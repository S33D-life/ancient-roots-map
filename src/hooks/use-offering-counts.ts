import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight hook that fetches offering counts per tree (and optionally first photo).
 * OPTIMISED: Uses React Query with 10-min stale time instead of manual state + realtime refetch.
 */
export interface OfferingCountMap {
  [treeId: string]: number;
}

export interface TreePhotoMap {
  [treeId: string]: string;
}

const OFFERING_COUNTS_KEY = ["offering-counts"] as const;

async function fetchOfferingCounts() {
  const { data, error } = await supabase.rpc("get_offering_counts");
  if (error) {
    console.error("Error fetching offering counts:", error);
    return { counts: {} as OfferingCountMap, photos: {} as TreePhotoMap };
  }
  const c: OfferingCountMap = {};
  const p: TreePhotoMap = {};
  (data || []).forEach((row: { tree_id: string; cnt: number; first_photo: string | null }) => {
    c[row.tree_id] = row.cnt;
    if (row.first_photo) p[row.tree_id] = row.first_photo;
  });
  return { counts: c, photos: p };
}

export function useOfferingCounts({ realtime = true }: { realtime?: boolean } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: OFFERING_COUNTS_KEY,
    queryFn: fetchOfferingCounts,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Realtime invalidation — only on INSERT, debounced 5s
  useEffect(() => {
    if (!realtime) return;
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedInvalidate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: OFFERING_COUNTS_KEY });
      }, 5000);
    };
    const channel = supabase
      .channel("offering-counts-global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "offerings" }, debouncedInvalidate)
      .subscribe();
    return () => { clearTimeout(debounceTimer); supabase.removeChannel(channel); };
  }, [realtime, queryClient]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: OFFERING_COUNTS_KEY });
  }, [queryClient]);

  return {
    counts: query.data?.counts ?? {},
    photos: query.data?.photos ?? {},
    loading: query.isLoading,
    refetch,
  };
}

/**
 * Hook for fetching the total offering count for a specific user.
 * Used by Dashboard to show a consistent count.
 */
export function useUserOfferingCount(userId: string | null) {
  const query = useQuery({
    queryKey: ["user-offering-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("offerings")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    let debounceTimer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel(`user-offering-count-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "offerings", filter: `created_by=eq.${userId}` }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["user-offering-count", userId] });
        }, 5000);
      })
      .subscribe();
    return () => { clearTimeout(debounceTimer); supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  return { count: query.data ?? 0, loading: query.isLoading, refetch: () => queryClient.invalidateQueries({ queryKey: ["user-offering-count", userId] }) };
}
