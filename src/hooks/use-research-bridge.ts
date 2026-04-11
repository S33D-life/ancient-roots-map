/**
 * useResearchBridge — React hook for the Research Forest bridge pipeline.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  promoteCandidateToResearch,
  promoteResearchToAncientFriend,
  generateVerificationTasks,
  fetchPipelineStats,
  type PipelineStats,
} from "@/services/research-bridge";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type SourceCandidate = Database["public"]["Tables"]["source_tree_candidates"]["Row"];
type CrawlRun = Database["public"]["Tables"]["dataset_crawl_runs"]["Row"];
type VerificationTask = Database["public"]["Tables"]["verification_tasks"]["Row"];

export function useResearchBridge() {
  const [candidates, setCandidates] = useState<SourceCandidate[]>([]);
  const [crawlRuns, setCrawlRuns] = useState<CrawlRun[]>([]);
  const [verificationTasks, setVerificationTasks] = useState<VerificationTask[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [candRes, crawlRes, taskRes, pipeStats] = await Promise.all([
      supabase.from("source_tree_candidates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("dataset_crawl_runs")
        .select("*, tree_data_sources(name)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("verification_tasks")
        .select("*, research_trees(tree_name, species_scientific)")
        .order("created_at", { ascending: false })
        .limit(50),
      fetchPipelineStats(),
    ]);

    setCandidates((candRes.data || []) as unknown as SourceCandidate[]);
    setCrawlRuns((crawlRes.data || []) as unknown as CrawlRun[]);
    setVerificationTasks((taskRes.data || []) as unknown as VerificationTask[]);
    setStats(pipeStats);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const promoteCandidate = useCallback(async (candidateId: string, sourceId: string) => {
    const { researchTreeId, error } = await promoteCandidateToResearch(candidateId, sourceId);
    if (error) {
      toast.error(`Promotion failed: ${error}`);
      return null;
    }
    toast.success("Candidate promoted to Research Forest");
    await fetchAll();
    return researchTreeId;
  }, [fetchAll]);

  const rejectCandidate = useCallback(async (candidateId: string, notes?: string) => {
    await supabase.from("source_tree_candidates").update({
      normalization_status: "rejected",
      reviewer_notes: notes || "Rejected by curator",
      reviewed_at: new Date().toISOString(),
    }).eq("id", candidateId);
    toast.success("Candidate rejected");
    await fetchAll();
  }, [fetchAll]);

  const markDuplicate = useCallback(async (candidateId: string, duplicateOfId: string) => {
    await supabase.from("source_tree_candidates").update({
      normalization_status: "duplicate",
      duplicate_of_candidate_id: duplicateOfId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", candidateId);
    toast.success("Marked as duplicate");
    await fetchAll();
  }, [fetchAll]);

  const promoteToAncientFriend = useCallback(async (researchTreeId: string, userId: string) => {
    const { treeId, error } = await promoteResearchToAncientFriend(researchTreeId, userId);
    if (error) {
      toast.error(`Promotion failed: ${error}`);
      return null;
    }
    toast.success("Research tree promoted to Ancient Friend! 🌳");
    await fetchAll();
    return treeId;
  }, [fetchAll]);

  const createVerificationTasks = useCallback(async (researchTreeId: string, userId: string) => {
    const { count, error } = await generateVerificationTasks(researchTreeId, userId);
    if (error) {
      toast.error(`Task creation failed: ${error}`);
      return 0;
    }
    toast.success(`Created ${count} verification task(s)`);
    await fetchAll();
    return count;
  }, [fetchAll]);

  const claimTask = useCallback(async (taskId: string, userId: string) => {
    await supabase.from("verification_tasks").update({
      claimed_by: userId,
      status: "claimed",
    }).eq("id", taskId);
    toast.success("Task claimed!");
    await fetchAll();
  }, [fetchAll]);

  const completeTask = useCallback(async (taskId: string, notes: string) => {
    await supabase.from("verification_tasks").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completion_notes: notes,
    }).eq("id", taskId);
    toast.success("Task completed! 🎉");
    await fetchAll();
  }, [fetchAll]);

  return {
    candidates, crawlRuns, verificationTasks, stats, loading,
    promoteCandidate, rejectCandidate, markDuplicate,
    promoteToAncientFriend, createVerificationTasks,
    claimTask, completeTask, refetch: fetchAll,
  };
}
