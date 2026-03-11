import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GovernanceProposal {
  id: string;
  proposed_by: string;
  title: string;
  description: string;
  why_it_matters: string | null;
  category: string;
  value_tree_branch: string | null;
  hive_family: string | null;
  location_name: string | null;
  suggested_hearts: number;
  funding_target: number;
  funding_current: number;
  funding_type: string;
  support_count: number;
  status: string;
  council_reviewed: boolean;
  council_outcome: string | null;
  council_notes: string | null;
  created_at: string;
}

export function useGovernanceProposals(opts?: {
  category?: string;
  hiveFamily?: string;
  valueBranch?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["governance-proposals", opts],
    staleTime: 60_000,
    queryFn: async (): Promise<GovernanceProposal[]> => {
      let q = supabase
        .from("value_proposals")
        .select("*")
        .order("support_count", { ascending: false })
        .limit(50);

      if (opts?.category) q = q.eq("category" as any, opts.category);
      if (opts?.hiveFamily) q = q.eq("hive_family" as any, opts.hiveFamily);
      if (opts?.valueBranch) q = q.eq("value_tree_branch" as any, opts.valueBranch);
      if (opts?.status) q = q.eq("status", opts.status);
      else q = q.in("status", ["pending", "active"]);

      const { data, error } = await q;
      if (error) { console.error("Proposals fetch:", error); return []; }
      return (data || []) as unknown as GovernanceProposal[];
    },
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      title: string;
      description: string;
      why_it_matters?: string;
      category: string;
      value_tree_branch?: string;
      hive_family?: string;
      location_name?: string;
      suggested_hearts?: number;
      funding_target?: number;
      funding_type?: string;
    }) => {
      const { data, error } = await supabase.from("value_proposals").insert({
        proposed_by: input.userId,
        title: input.title.trim(),
        description: input.description.trim(),
        why_it_matters: input.why_it_matters?.trim() || null,
        category: input.category,
        value_tree_branch: input.value_tree_branch || null,
        hive_family: input.hive_family || null,
        location_name: input.location_name?.trim() || null,
        suggested_hearts: input.suggested_hearts || 10,
        funding_target: input.funding_target || 0,
        funding_type: input.funding_type || "none",
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["governance-proposals"] }),
  });
}

export function usePledgeHearts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { proposalId: string; userId: string; amount: number; note?: string }) => {
      const { error } = await supabase.from("proposal_pledges" as any).upsert({
        proposal_id: input.proposalId,
        user_id: input.userId,
        pledge_type: "hearts",
        amount: input.amount,
        note: input.note || null,
      }, { onConflict: "proposal_id,user_id,pledge_type" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["governance-proposals"] }),
  });
}

export function useHiveStewardshipSignals(hiveFamily: string | undefined) {
  return useQuery({
    queryKey: ["hive-stewardship-signals", hiveFamily],
    enabled: Boolean(hiveFamily),
    staleTime: 60_000,
    queryFn: async () => {
      if (!hiveFamily) return [];
      const { data, error } = await supabase
        .from("hive_stewardship_signals" as any)
        .select("*")
        .eq("hive_family", hiveFamily)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) { console.error("Signals fetch:", error); return []; }
      return (data || []) as any[];
    },
  });
}

export function useCreateStewardshipSignal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      hive_family: string;
      signal_type: string;
      title: string;
      description?: string;
      author_id: string;
    }) => {
      const { error } = await supabase.from("hive_stewardship_signals" as any).insert({
        hive_family: input.hive_family,
        signal_type: input.signal_type,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        author_id: input.author_id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hive-stewardship-signals"] }),
  });
}
