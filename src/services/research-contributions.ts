/**
 * Research Contributions — contribution logging, validation, and reward readiness
 * for the research pipeline. Review-first: nothing auto-promotes.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/* ── Research pipeline task categories ── */
export const RESEARCH_TASK_CATEGORIES = [
  "discover_sources",
  "review_candidates",
  "check_duplicates",
  "enrich_tree_metadata",
  "generate_verification_invites",
  "review_verification_results",
  "suggest_af_promotion",
] as const;

export type ResearchTaskCategory = typeof RESEARCH_TASK_CATEGORIES[number];

/* ── Contribution event types for the pipeline ── */
export type ResearchContributionType =
  | "candidate_promoted"
  | "candidate_rejected"
  | "duplicate_marked"
  | "verification_tasks_generated"
  | "verification_completed"
  | "research_tree_promoted_to_af";

/* ── Heart reward class (for future economy) ── */
export type RewardClass = "minor" | "standard" | "significant" | "major";

const REWARD_MAP: Record<ResearchContributionType, { hearts: number; rewardClass: RewardClass }> = {
  candidate_promoted: { hearts: 2, rewardClass: "standard" },
  candidate_rejected: { hearts: 1, rewardClass: "minor" },
  duplicate_marked: { hearts: 1, rewardClass: "minor" },
  verification_tasks_generated: { hearts: 1, rewardClass: "minor" },
  verification_completed: { hearts: 3, rewardClass: "standard" },
  research_tree_promoted_to_af: { hearts: 5, rewardClass: "major" },
};

interface LogContributionParams {
  agentId: string;
  contributionType: ResearchContributionType;
  sourceId?: string | null;
  datasetId?: string | null;
  researchTreeRecordId?: string | null;
  payload?: Record<string, unknown>;
}

/**
 * Log a research pipeline contribution event.
 * Respects review-first: sets validation_status to 'pending'.
 */
export async function logResearchContribution(params: LogContributionParams) {
  const reward = REWARD_MAP[params.contributionType];

  const { data, error } = await supabase
    .from("agent_contribution_events")
    .insert({
      agent_id: params.agentId,
      contribution_type: params.contributionType,
      source_id: params.sourceId || null,
      dataset_id: params.datasetId || null,
      research_tree_record_id: params.researchTreeRecordId || null,
      hearts_awarded: reward.hearts,
      validation_status: "pending",
      reward_status: "pending",
      payload_json: {
        ...params.payload,
        reward_class: reward.rewardClass,
      } as unknown as Json,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[research-contributions] Failed to log:", error.message);
    return null;
  }
  return data?.id || null;
}

/* ── Curator Validation Actions ── */

/**
 * Accept a contribution: sets validation to accepted, reward to ready.
 * No hearts are distributed — just marked as ready for future distribution.
 */
export async function validateContribution(eventId: string, curatorId: string) {
  const { error } = await supabase
    .from("agent_contribution_events")
    .update({
      validation_status: "accepted",
      validated_by: curatorId,
      validated_at: new Date().toISOString(),
      reward_status: "ready",
    })
    .eq("id", eventId);

  if (error) {
    console.warn("[research-contributions] Validate failed:", error.message);
    return false;
  }
  return true;
}

/**
 * Reject a contribution: sets validation to rejected, reward stays pending.
 * Optionally stores rejection reason in payload_json.
 */
export async function rejectContribution(eventId: string, curatorId: string, reason?: string) {
  // If reason provided, merge into payload_json
  let payloadUpdate: Record<string, unknown> | undefined;
  if (reason) {
    const { data: existing } = await supabase
      .from("agent_contribution_events")
      .select("payload_json")
      .eq("id", eventId)
      .single();

    const existingPayload = (existing?.payload_json as Record<string, unknown>) || {};
    payloadUpdate = { ...existingPayload, rejection_reason: reason };
  }

  const updateData: Record<string, unknown> = {
    validation_status: "rejected",
    validated_by: curatorId,
    validated_at: new Date().toISOString(),
    reward_status: "pending",
  };
  if (payloadUpdate) {
    updateData.payload_json = payloadUpdate as unknown as Json;
  }

  const { error } = await supabase
    .from("agent_contribution_events")
    .update(updateData)
    .eq("id", eventId);

  if (error) {
    console.warn("[research-contributions] Reject failed:", error.message);
    return false;
  }
  return true;
}

/**
 * Fetch recent research-related contribution events.
 */
export async function fetchRecentResearchContributions(limit = 20, statusFilter?: string) {
  const researchTypes: ResearchContributionType[] = [
    "candidate_promoted", "candidate_rejected", "duplicate_marked",
    "verification_tasks_generated", "verification_completed", "research_tree_promoted_to_af",
  ];

  let query = supabase
    .from("agent_contribution_events")
    .select("*, agent_profiles(agent_name, avatar_emoji)")
    .in("contribution_type", researchTypes)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("validation_status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("[research-contributions] Fetch failed:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Get aggregate counts of research contributions by type and status.
 */
export async function fetchResearchContributionStats() {
  const researchTypes = [
    "candidate_promoted", "candidate_rejected", "duplicate_marked",
    "verification_tasks_generated", "verification_completed", "research_tree_promoted_to_af",
  ];

  const { data, error } = await supabase
    .from("agent_contribution_events")
    .select("contribution_type, validation_status, reward_status")
    .in("contribution_type", researchTypes);

  if (error) return { total: 0, accepted: 0, pending: 0, rejected: 0, rewardReady: 0, byType: {} as Record<string, number> };

  const items = data || [];
  const byType: Record<string, number> = {};
  let accepted = 0;
  let pending = 0;
  let rejected = 0;
  let rewardReady = 0;
  for (const item of items) {
    byType[item.contribution_type] = (byType[item.contribution_type] || 0) + 1;
    if (item.validation_status === "accepted" || item.validation_status === "validated") accepted++;
    if (item.validation_status === "pending") pending++;
    if (item.validation_status === "rejected") rejected++;
    if (item.reward_status === "ready") rewardReady++;
  }

  return { total: items.length, accepted, pending, rejected, rewardReady, byType };
}

/**
 * Fetch count of pending contributions (for badges).
 */
export async function fetchPendingContributionCount(): Promise<number> {
  const researchTypes = [
    "candidate_promoted", "candidate_rejected", "duplicate_marked",
    "verification_tasks_generated", "verification_completed", "research_tree_promoted_to_af",
  ];

  const { count, error } = await supabase
    .from("agent_contribution_events")
    .select("id", { count: "exact", head: true })
    .in("contribution_type", researchTypes)
    .eq("validation_status", "pending");

  if (error) return 0;
  return count ?? 0;
}
