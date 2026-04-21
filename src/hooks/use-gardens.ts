/**
 * useGardens — react-query hook for the Gardens / Orchards layer.
 *
 * Returns the list of gardens visible to the current user (RLS handles
 * public vs. private access). Cached for the lifetime of the session,
 * with a 60s stale window — gardens change rarely.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Garden = Database["public"]["Tables"]["gardens"]["Row"];

export function useGardens() {
  return useQuery<Garden[]>({
    queryKey: ["gardens"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gardens")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Garden[];
    },
  });
}

/** Single garden by id — used by the garden detail page. */
export function useGarden(id: string | undefined) {
  return useQuery<Garden | null>({
    queryKey: ["garden", id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("gardens")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Garden) || null;
    },
  });
}

/** Garden by slug — used by /garden/:slug. */
export function useGardenBySlug(slug: string | undefined) {
  return useQuery<Garden | null>({
    queryKey: ["garden-by-slug", slug],
    enabled: !!slug,
    staleTime: 60_000,
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("gardens")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as Garden) || null;
    },
  });
}

/** Trees that belong to a given garden. */
export function useGardenTrees(gardenId: string | undefined) {
  return useQuery({
    queryKey: ["garden-trees", gardenId],
    enabled: !!gardenId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!gardenId) return [];
      const { data, error } = await supabase
        .from("trees")
        .select("id, name, species, latitude, longitude, photo_thumb_url, photo_processed_url, variety_name, propagation_type, planted_year")
        .eq("garden_id", gardenId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

/** URL-safe slug from a garden name. */
export function gardenSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}
