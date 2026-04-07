/**
 * useSpeciesResonance — lightweight per-user species affinity.
 *
 * Aggregates visits + hearts by species from existing data.
 * Single query, cached in state, no polling.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isFeatureEnabled } from "@/lib/featureFlags";

export interface SpeciesAffinity {
  species: string;
  visits: number;
  hearts: number;
  total: number; // combined weight
}

interface SpeciesResonanceResult {
  affinities: SpeciesAffinity[];
  topSpecies: string | null;
  loading: boolean;
}

export function useSpeciesResonance(userId: string | null): SpeciesResonanceResult {
  const [affinities, setAffinities] = useState<SpeciesAffinity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isFeatureEnabled("species-resonance")) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      // Get check-ins with species
      const { data: checkins } = await supabase
        .from("tree_checkins")
        .select("tree_id, trees!inner(species)")
        .eq("user_id", userId)
        .limit(200);

      // Get heart transactions with species
      const { data: hearts } = await supabase
        .from("heart_transactions")
        .select("tree_id, amount, trees!inner(species)")
        .eq("user_id", userId)
        .gt("amount", 0)
        .limit(200);

      const speciesMap = new Map<string, { visits: number; hearts: number }>();

      // Count visits per species
      (checkins || []).forEach((c: any) => {
        const sp = c.trees?.species;
        if (!sp) return;
        const existing = speciesMap.get(sp) || { visits: 0, hearts: 0 };
        existing.visits++;
        speciesMap.set(sp, existing);
      });

      // Count hearts per species
      (hearts || []).forEach((h: any) => {
        const sp = h.trees?.species;
        if (!sp) return;
        const existing = speciesMap.get(sp) || { visits: 0, hearts: 0 };
        existing.hearts += h.amount || 0;
        speciesMap.set(sp, existing);
      });

      // Sort by combined weight
      const sorted = Array.from(speciesMap.entries())
        .map(([species, data]) => ({
          species,
          visits: data.visits,
          hearts: data.hearts,
          total: data.visits * 2 + data.hearts, // visits weighted more
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // top 5

      setAffinities(sorted);
      setLoading(false);
    };

    fetch();
  }, [userId]);

  return {
    affinities,
    topSpecies: affinities.length > 0 ? affinities[0].species : null,
    loading,
  };
}

/**
 * Get a human-readable affinity hint for a given species.
 */
export function getSpeciesHint(species: string, affinities: SpeciesAffinity[]): string | null {
  const match = affinities.find(a =>
    a.species.toLowerCase() === species.toLowerCase()
  );
  if (!match || match.visits < 2) return null;

  const speciesName = species.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  if (match.visits >= 10) return `You have a deep connection with ${speciesName}s`;
  if (match.visits >= 5) return `You often return to ${speciesName}s`;
  return `You've visited ${match.visits} ${speciesName}s`;
}
