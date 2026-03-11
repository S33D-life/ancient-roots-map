import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StewardshipAction {
  id: string;
  tree_id: string;
  user_id: string;
  action_type: string;
  notes: string | null;
  photo_url: string | null;
  season: string | null;
  created_at: string;
}

export interface TreeGuardian {
  id: string;
  tree_id: string;
  user_id: string;
  role: string;
  earned_at: string;
  contribution_count: number;
}

const ACTION_META: Record<string, { emoji: string; label: string }> = {
  pruning: { emoji: "✂️", label: "Pruning" },
  mulching: { emoji: "🍂", label: "Mulching" },
  watering: { emoji: "💧", label: "Watering" },
  seed_gathering: { emoji: "🌰", label: "Seed Gathering" },
  soil_care: { emoji: "🪱", label: "Soil Care" },
  planting_sapling: { emoji: "🌱", label: "Planting Sapling" },
  monitoring: { emoji: "👁️", label: "Monitoring" },
  cleaning: { emoji: "🧹", label: "Cleaning" },
  fencing: { emoji: "🪵", label: "Fencing" },
  documenting: { emoji: "📝", label: "Documenting" },
  other: { emoji: "🌿", label: "Other" },
};

const ROLE_META: Record<string, { emoji: string; label: string; color: string }> = {
  tree_guardian: { emoji: "🛡️", label: "Tree Guardian", color: "hsl(var(--primary))" },
  seasonal_observer: { emoji: "🔭", label: "Seasonal Observer", color: "hsl(200, 50%, 50%)" },
  seed_keeper: { emoji: "🌰", label: "Seed Keeper", color: "hsl(30, 60%, 50%)" },
  harvest_steward: { emoji: "🍎", label: "Harvest Steward", color: "hsl(0, 55%, 50%)" },
};

export function getActionMeta(type: string) {
  return ACTION_META[type] || ACTION_META.other;
}

export function getRoleMeta(role: string) {
  return ROLE_META[role] || ROLE_META.tree_guardian;
}

export function useStewardshipActions(treeId: string | undefined) {
  return useQuery({
    queryKey: ["stewardship-actions", treeId],
    enabled: Boolean(treeId),
    staleTime: 60_000,
    queryFn: async (): Promise<StewardshipAction[]> => {
      if (!treeId) return [];
      const { data, error } = await supabase
        .from("stewardship_actions" as any)
        .select("*")
        .eq("tree_id", treeId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) { console.error("Stewardship fetch:", error); return []; }
      return (data || []) as unknown as StewardshipAction[];
    },
  });
}

export function useTreeGuardians(treeId: string | undefined) {
  return useQuery({
    queryKey: ["tree-guardians", treeId],
    enabled: Boolean(treeId),
    staleTime: 60_000,
    queryFn: async (): Promise<TreeGuardian[]> => {
      if (!treeId) return [];
      const { data, error } = await supabase
        .from("tree_guardians" as any)
        .select("*")
        .eq("tree_id", treeId)
        .order("earned_at", { ascending: false })
        .limit(20);
      if (error) { console.error("Guardians fetch:", error); return []; }
      return (data || []) as unknown as TreeGuardian[];
    },
  });
}

export function useLogStewardshipAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tree_id: string;
      user_id: string;
      action_type: string;
      notes?: string;
      season?: string;
    }) => {
      const { error } = await supabase.from("stewardship_actions" as any).insert({
        tree_id: input.tree_id,
        user_id: input.user_id,
        action_type: input.action_type,
        notes: input.notes?.trim() || null,
        season: input.season || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["stewardship-actions", vars.tree_id] });
      qc.invalidateQueries({ queryKey: ["tree-guardians", vars.tree_id] });
    },
  });
}

export { ACTION_META, ROLE_META };
