import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Offering = Database["public"]["Tables"]["offerings"]["Row"];
export type OfferingType = Database["public"]["Enums"]["offering_type"];
export type TreeRole = "stewardship" | "anchored" | "none";

export interface OfferingSummary {
  id: string;
  tree_id: string;
  title: string;
  type: string;
  content: string | null;
  media_url: string | null;
  nft_link: string | null;
  created_at: string;
}

/** Offering type metadata used across the app */
export const offeringIcons = {
  photo: "Camera",
  song: "Music",
  poem: "FileText",
  story: "MessageSquare",
  nft: "Sparkles",
  voice: "Mic",
  book: "BookOpen",
} as const;

export const offeringLabels: Record<OfferingType, string> = {
  photo: "Memories",
  song: "Songs",
  poem: "Poems",
  story: "Musings",
  nft: "NFTs",
  voice: "Voices",
  book: "Books",
};

interface UseOfferingsOptions {
  /** Tree ID to fetch offerings for */
  treeId: string | null | undefined;
  /** Enable realtime subscription (default: false) */
  realtime?: boolean;
}

/**
 * Centralized hook for fetching, caching, and subscribing to a tree's offerings.
 * Use across the map detail page, gallery, and anywhere offerings are displayed.
 */
export function useOfferings({ treeId, realtime = false }: UseOfferingsOptions) {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOfferings = useCallback(async () => {
    if (!treeId) {
      setOfferings([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("offerings")
        .select("*")
        .eq("tree_id", treeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOfferings(data || []);
    } catch (err) {
      console.error("Error fetching offerings:", err);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  // Initial fetch
  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  // Optional realtime subscription
  useEffect(() => {
    if (!realtime || !treeId) return;

    const channel = supabase
      .channel(`offerings-${treeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offerings", filter: `tree_id=eq.${treeId}` },
        () => fetchOfferings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtime, treeId, fetchOfferings]);

  const getByType = useCallback(
    (type: OfferingType) => offerings.filter((o) => o.type === type),
    [offerings]
  );

  const getByRole = useCallback(
    (role: TreeRole) => offerings.filter((o) => (o as any).tree_role === role),
    [offerings]
  );

  return { offerings, loading, refetch: fetchOfferings, getByType, getByRole };
}
