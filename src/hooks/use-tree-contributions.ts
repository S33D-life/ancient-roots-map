import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContributionType =
  | "photo"
  | "seasonal_observation"
  | "offering"
  | "stewardship_note"
  | "harvest_record"
  | "local_story"
  | "correction";

export type ContributionState =
  | "new"
  | "community_supported"
  | "curator_reviewed"
  | "guardian_confirmed";

export interface TreeContribution {
  id: string;
  tree_id: string;
  user_id: string;
  contribution_type: ContributionType;
  title: string | null;
  content: string | null;
  media_url: string | null;
  metadata: Record<string, unknown>;
  state: ContributionState;
  support_count: number;
  created_at: string;
  updated_at: string;
}

export const CONTRIBUTION_META: Record<
  ContributionType,
  { emoji: string; label: string; placeholder: string }
> = {
  photo: { emoji: "📷", label: "Photo", placeholder: "Describe what you see…" },
  seasonal_observation: { emoji: "🌿", label: "Seasonal Observation", placeholder: "What season stage is the tree in?" },
  offering: { emoji: "✨", label: "Offering", placeholder: "A poem, reflection, or memory…" },
  stewardship_note: { emoji: "🛡️", label: "Stewardship Note", placeholder: "What care did you provide?" },
  harvest_record: { emoji: "🍎", label: "Harvest Record", placeholder: "What was harvested and when?" },
  local_story: { emoji: "📖", label: "Local Story", placeholder: "Share a story about this tree…" },
  correction: { emoji: "🔍", label: "Correction", placeholder: "What needs updating?" },
};

export const STATE_LABELS: Record<ContributionState, { label: string; color: string }> = {
  new: { label: "New", color: "hsl(var(--muted-foreground))" },
  community_supported: { label: "Community Supported", color: "hsl(var(--primary))" },
  curator_reviewed: { label: "Curator Reviewed", color: "hsl(45, 80%, 50%)" },
  guardian_confirmed: { label: "Guardian Confirmed", color: "hsl(120, 50%, 45%)" },
};

export function useTreeContributions(treeId: string | undefined) {
  return useQuery({
    queryKey: ["tree-contributions", treeId],
    enabled: Boolean(treeId),
    staleTime: 30_000,
    queryFn: async (): Promise<TreeContribution[]> => {
      if (!treeId) return [];
      const { data, error } = await supabase
        .from("tree_contributions" as any)
        .select("*")
        .eq("tree_id", treeId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) { console.error("Contributions fetch:", error); return []; }
      return (data || []) as unknown as TreeContribution[];
    },
  });
}

export function useUserContributions(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-contributions", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<TreeContribution[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("tree_contributions" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) { console.error("User contributions fetch:", error); return []; }
      return (data || []) as unknown as TreeContribution[];
    },
  });
}

export function useAddContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tree_id: string;
      user_id: string;
      contribution_type: ContributionType;
      title?: string;
      content?: string;
      media_url?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from("tree_contributions" as any).insert({
        tree_id: input.tree_id,
        user_id: input.user_id,
        contribution_type: input.contribution_type,
        title: input.title?.trim() || null,
        content: input.content?.trim() || null,
        media_url: input.media_url || null,
        metadata: input.metadata || {},
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tree-contributions", vars.tree_id] });
      qc.invalidateQueries({ queryKey: ["user-contributions", vars.user_id] });
    },
  });
}

export function useSupportContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contribution_id: string; user_id: string; tree_id: string }) => {
      const { error } = await supabase.from("contribution_supports" as any).insert({
        contribution_id: input.contribution_id,
        user_id: input.user_id,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tree-contributions", vars.tree_id] });
    },
  });
}
