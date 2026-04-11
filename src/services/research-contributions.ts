/**
 * Research Contributions — lightweight contribution logging for the research pipeline.
 * Creates agent_contribution_events when meaningful pipeline actions occur.
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

/**
 * Fetch recent research-related contribution events.
 */
export async function fetchRecentResearchContributions(limit = 20) {
  const researchTypes: ResearchContributionType[] = [
    "candidate_promoted", "candidate_rejected", "duplicate_marked",
    "verification_tasks_generated", "verification_completed", "research_tree_promoted_to_af",
  ];

  const { data, error } = await supabase
    .from("agent_contribution_events")
    .select("*, agent_profiles(agent_name, avatar_emoji)")
    .in("contribution_type", researchTypes)
    .order("created_at", { ascending: false })
    .limit(limit);

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
    .select("contribution_type, validation_status")
    .in("contribution_type", researchTypes);

  if (error) return { total: 0, accepted: 0, pending: 0, byType: {} as Record<string, number> };

  const items = data || [];
  const byType: Record<string, number> = {};
  let accepted = 0;
  let pending = 0;
  for (const item of items) {
    byType[item.contribution_type] = (byType[item.contribution_type] || 0) + 1;
    if (item.validation_status === "accepted" || item.validation_status === "validated") accepted++;
    if (item.validation_status === "pending") pending++;
  }

  return { total: items.length, accepted, pending, byType };
}
