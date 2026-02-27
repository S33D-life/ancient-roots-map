import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_platform_overview");
      if (error) throw error;
      return data as Record<string, number>;
    },
    staleTime: 60_000,
  });
}

export function useAdminDailySignups(daysBack = 90) {
  return useQuery({
    queryKey: ["admin-daily-signups", daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_daily_signups", { days_back: daysBack });
      if (error) throw error;
      return (data as { day: string; signups: number }[]) || [];
    },
    staleTime: 60_000,
  });
}

export function useAdminDailyTrees(daysBack = 90) {
  return useQuery({
    queryKey: ["admin-daily-trees", daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_daily_trees", { days_back: daysBack });
      if (error) throw error;
      return (data as { day: string; trees_mapped: number }[]) || [];
    },
    staleTime: 60_000,
  });
}

export function useAdminFeatureHealth() {
  return useQuery({
    queryKey: ["admin-feature-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_feature_health");
      if (error) throw error;
      return data as Record<string, number>;
    },
    staleTime: 60_000,
  });
}

export function useAdminEconomyHealth() {
  return useQuery({
    queryKey: ["admin-economy-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_economy_health");
      if (error) throw error;
      return data as {
        total_hearts: number;
        total_species_hearts: number;
        total_influence: number;
        hearts_by_type: { heart_type: string; total: number; txn_count: number }[];
        avg_hearts_per_user: number;
        top_heart_holders: { user_id: string; name: string; s33d_hearts: number }[];
        windfall_count: number;
        daily_hearts_7d: { day: string; hearts: number }[];
      };
    },
    staleTime: 60_000,
  });
}

export function useAdminSpeciesCoverage() {
  return useQuery({
    queryKey: ["admin-species-coverage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_species_coverage");
      if (error) throw error;
      return (data as { species: string; tree_count: number; offering_count: number; checkin_count: number; unique_visitors: number }[]) || [];
    },
    staleTime: 120_000,
  });
}

export function useAdminGeoCoverage() {
  return useQuery({
    queryKey: ["admin-geo-coverage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_geographic_coverage");
      if (error) throw error;
      return (data as { nation: string; tree_count: number; wanderer_count: number; offering_count: number }[]) || [];
    },
    staleTime: 120_000,
  });
}
