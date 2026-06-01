import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AtlasCountryStats {
  country: string;
  total_research_records: number;
  research_records_with_coordinates: number;
  research_records_missing_coordinates: number;
  exact_precision_count: number;
  approximate_precision_count: number;
  unknown_precision_count: number;
  distinct_species_count: number;
  linked_ancient_friends_count: number;
  verification_task_open_count: number;
  verification_task_completed_count: number;
  source_count: number;
  data_confidence_score: number;
}

export function useAtlasCountryStats(country?: string | null, enabled = true) {
  const countryFilter = country?.trim() || null;

  return useQuery<AtlasCountryStats[]>({
    queryKey: ["atlas-country-stats", countryFilter],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)("public_atlas_country_stats", {
        country_filter: countryFilter,
      });
      if (error) throw error;
      return ((data || []) as unknown) as AtlasCountryStats[];
    },
  });
}
