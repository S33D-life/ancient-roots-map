/**
 * useTreeasurus — react-query hooks for the species knowledge layer.
 *
 * Reads from species_index + tree_species_names + tree_species_lore.
 * Search uses the SECURITY DEFINER `search_species_multilingual` RPC
 * so a user can find Quercus robur whether they type Oak, Roble or
 * Chêne.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SpeciesRow = Database["public"]["Tables"]["species_index"]["Row"];
export type SpeciesName = Database["public"]["Tables"]["tree_species_names"]["Row"];
export type SpeciesLore = Database["public"]["Tables"]["tree_species_lore"]["Row"];

export type SpeciesSearchHit = {
  species_id: string;
  species_key: string;
  slug: string | null;
  scientific_name: string | null;
  canonical_common_name: string | null;
  family: string | null;
  matched_name: string;
  matched_language: string | null;
  match_kind: string;
};

/** Single species by slug — primary entry point for /species/:slug. */
export function useSpeciesBySlug(slug: string | undefined) {
  return useQuery<SpeciesRow | null>({
    queryKey: ["species", "by-slug", slug],
    enabled: !!slug,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("species_index")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as SpeciesRow) || null;
    },
  });
}

/** All names (multilingual) for a species. */
export function useSpeciesNames(speciesId: string | undefined) {
  return useQuery<SpeciesName[]>({
    queryKey: ["species-names", speciesId],
    enabled: !!speciesId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!speciesId) return [];
      const { data, error } = await supabase
        .from("tree_species_names")
        .select("*")
        .eq("species_id", speciesId)
        .order("is_primary", { ascending: false })
        .order("language_code", { ascending: true });
      if (error) throw error;
      return (data as SpeciesName[]) || [];
    },
  });
}

/** Lore entries for a species. */
export function useSpeciesLore(speciesId: string | undefined) {
  return useQuery<SpeciesLore[]>({
    queryKey: ["species-lore", speciesId],
    enabled: !!speciesId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!speciesId) return [];
      const { data, error } = await supabase
        .from("tree_species_lore")
        .select("*")
        .eq("species_id", speciesId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as SpeciesLore[]) || [];
    },
  });
}

/**
 * Lightweight: just a couple of alternate names for inline use on tree pages.
 * Skips the primary English one if it duplicates the canonical common name.
 */
export function useSpeciesAlternateNames(speciesId: string | undefined, limit = 3) {
  return useQuery<SpeciesName[]>({
    queryKey: ["species-alt-names", speciesId, limit],
    enabled: !!speciesId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!speciesId) return [];
      const { data, error } = await supabase
        .from("tree_species_names")
        .select("*")
        .eq("species_id", speciesId)
        .order("is_primary", { ascending: false })
        .limit(limit + 2);
      if (error) throw error;
      return (data as SpeciesName[]) || [];
    },
  });
}

/** Mapped trees (user trees) of this species — by species_key. */
export function useSpeciesTrees(speciesKey: string | null | undefined, limit = 24) {
  return useQuery({
    queryKey: ["species-trees", speciesKey, limit],
    enabled: !!speciesKey,
    staleTime: 60_000,
    queryFn: async () => {
      if (!speciesKey) return [];
      const { data, error } = await supabase
        .from("trees")
        .select("id, name, species, latitude, longitude, photo_thumb_url, photo_processed_url, variety_name, propagation_type, planted_year, country")
        .eq("species_key", speciesKey)
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

/** Multilingual species search via the SECURITY DEFINER RPC. */
export function useSpeciesSearch(query: string, enabled = true) {
  return useQuery<SpeciesSearchHit[]>({
    queryKey: ["species-search", query],
    enabled: enabled && query.trim().length >= 2,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_species_multilingual", {
        query: query.trim(),
        max_results: 20,
      });
      if (error) throw error;
      return (data as SpeciesSearchHit[]) || [];
    },
  });
}

/** Resolve species by species_key — used to translate a tree's key → slug for navigation. */
export function useSpeciesByKey(speciesKey: string | null | undefined) {
  return useQuery<Pick<SpeciesRow, "id" | "slug" | "species_key" | "scientific_name" | "canonical_common_name" | "family" | "common_name"> | null>({
    queryKey: ["species-by-key", speciesKey],
    enabled: !!speciesKey,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      if (!speciesKey) return null;
      const { data, error } = await supabase
        .from("species_index")
        .select("id, slug, species_key, scientific_name, canonical_common_name, family, common_name")
        .eq("species_key", speciesKey)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
  });
}

/** Permission flag — only curators / species stewards can write names + lore. */
export function useCanEditTreeasurus() {
  return useQuery({
    queryKey: ["can-edit-treeasurus"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["curator", "species_steward"]);
      if (error) return false;
      return (data?.length || 0) > 0;
    },
  });
}
