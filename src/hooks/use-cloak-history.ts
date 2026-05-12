/**
 * useCloakHistory — reads and inscribes the wanderer's Regalia ascensions.
 * Each row in `cloak_stage_history` marks a moment the mantle thickened,
 * along with the signals that carried them across the threshold.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export interface CloakHistoryRow {
  id: string;
  stage_label: string;
  stage_min: number;
  score: number;
  species_count: number;
  visits: number;
  affinity_depth: number;
  primary_signal: string | null;
  achieved_at: string;
}

export interface InscribeAscensionInput {
  stage_label: string;
  stage_min: number;
  score: number;
  species_count: number;
  visits: number;
  affinity_depth: number;
}

/** Pick the axis whose weighted contribution was largest. */
export function primarySignal(species: number, visits: number, affinity: number): string {
  const breadth = Math.min(40, species) * 1.5;
  const returns = Math.min(50, visits) * 1.0;
  const affinityScore = Math.min(20, affinity) * 2.0;
  const max = Math.max(breadth, returns, affinityScore);
  if (max === affinityScore && affinityScore > 0) return "affinity";
  if (max === breadth && breadth > 0) return "breadth";
  if (max === returns && returns > 0) return "returns";
  return "breadth";
}

export function useCloakHistory() {
  const { userId } = useCurrentUser();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cloak-history", userId],
    enabled: !!userId,
    queryFn: async (): Promise<CloakHistoryRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("cloak_stage_history")
        .select("*")
        .eq("user_id", userId)
        .order("achieved_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CloakHistoryRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const inscribe = useMutation({
    mutationFn: async (input: InscribeAscensionInput) => {
      if (!userId) return null;
      const signal = primarySignal(
        input.species_count,
        input.visits,
        input.affinity_depth,
      );
      const { error } = await supabase
        .from("cloak_stage_history")
        .insert({
          user_id: userId,
          stage_label: input.stage_label,
          stage_min: input.stage_min,
          score: input.score,
          species_count: input.species_count,
          visits: input.visits,
          affinity_depth: input.affinity_depth,
          primary_signal: signal,
        });
      // Unique-index conflict (already inscribed) is silently fine.
      if (error && !/duplicate key|unique/i.test(error.message)) {
        throw error;
      }
      return signal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cloak-history", userId] });
    },
  });

  return {
    history: query.data ?? [],
    isLoading: query.isLoading,
    inscribeAscension: inscribe.mutate,
  };
}
