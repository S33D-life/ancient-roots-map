/**
 * useSpeciesPresence — read-only: a short ecological "presence" whisper for a
 * species, drawn from existing `tree_species_lore` (the Treeasurus lore layer).
 *
 * Resolves species_key → species_index.id → the latest lore entry, then shortens it
 * via toPresenceWhisper. Returns null when there is no canonical key or no lore, so
 * callers omit gracefully (no placeholder clutter). Never writes, never generates copy.
 *
 * Only fires when a species_key is present (most "broad"/"likely" trees have none), and
 * react-query caches per key, so a gallery of cards sharing a species makes one request.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toPresenceWhisper } from "@/lib/species/speciesPresence";

export function useSpeciesPresence(speciesKey: string | null | undefined): string | null {
  const { data } = useQuery<string | null>({
    queryKey: ["species-presence", speciesKey],
    enabled: !!speciesKey,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      if (!speciesKey) return null;

      // species_key → species_index.id (lore is keyed by species_id)
      const { data: species, error: spErr } = await supabase
        .from("species_index")
        .select("id")
        .eq("species_key", speciesKey)
        .maybeSingle();
      if (spErr || !species?.id) return null;

      // latest lore entry for this species
      const { data: lore, error: loreErr } = await supabase
        .from("tree_species_lore")
        .select("body, title")
        .eq("species_id", species.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (loreErr || !lore) return null;

      return toPresenceWhisper(lore.body || lore.title || null);
    },
  });

  return data ?? null;
}
