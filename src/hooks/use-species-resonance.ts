/**
 * useSpeciesResonance — lightweight per-user species affinity.
 *
 * Aggregates visits + hearts by species from existing data.
 * Single query per source, cached in state, no polling.
 */
import { useEffect, useState, useRef } from "react";
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
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!userId || !isFeatureEnabled("species-resonance")) {
      setLoading(false);
      return;
    }
    if (fetchedRef.current) return;

    const loadResonance = async () => {
      // Parallel fetch — check-ins and heart transactions with species
      const [checkinsRes, heartsRes] = await Promise.all([
        supabase
          .from("tree_checkins")
          .select("tree_id, trees!inner(species)")
          .eq("user_id", userId)
          .limit(200),
        supabase
          .from("heart_transactions")
          .select("tree_id, amount, trees!inner(species)")
          .eq("user_id", userId)
          .gt("amount", 0)
          .limit(200),
      ]);

      fetchedRef.current = true;

      const speciesMap = new Map<string, { visits: number; hearts: number }>();

      // Count visits per species
      for (const c of (checkinsRes.data || []) as any[]) {
        const sp = c.trees?.species;
        if (!sp) continue;
        const existing = speciesMap.get(sp) || { visits: 0, hearts: 0 };
        existing.visits++;
        speciesMap.set(sp, existing);
      }

      // Count hearts per species
      for (const h of (heartsRes.data || []) as any[]) {
        const sp = h.trees?.species;
        if (!sp) continue;
        const existing = speciesMap.get(sp) || { visits: 0, hearts: 0 };
        existing.hearts += h.amount || 0;
        speciesMap.set(sp, existing);
      }

      // Sort by combined weight
      const sorted = Array.from(speciesMap.entries())
        .map(([species, data]) => ({
          species,
          visits: data.visits,
          hearts: data.hearts,
          total: data.visits * 2 + data.hearts,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setAffinities(sorted);
      setLoading(false);
    };

    loadResonance();
  }, [userId]);

  return {
    affinities,
    topSpecies: affinities.length > 0 ? affinities[0].species : null,
    loading,
  };
}

/** Format species key to human-readable name */
export function formatSpeciesName(species: string): string {
  return species.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get a human-readable affinity hint for a given species.
 * Language is warm and relational — never gamified.
 */
export function getSpeciesHint(species: string, affinities: SpeciesAffinity[]): string | null {
  const match = affinities.find(a =>
    a.species.toLowerCase() === species.toLowerCase()
  );
  if (!match || match.visits < 2) return null;

  const name = formatSpeciesName(species);
  if (match.visits >= 10) return `You have a deep connection with ${name}`;
  if (match.visits >= 5) return `You often return to ${name}`;
  return `You've visited ${name} ${match.visits} times`;
}
