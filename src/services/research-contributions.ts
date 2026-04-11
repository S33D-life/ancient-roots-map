/**
 * Research Contributions — contribution logging, validation, and reward distribution
 * for the research pipeline. Review-first: nothing auto-promotes or auto-distributes.
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

export type ResearchContributionType =
  | "candidate_promoted"
  | "candidate_rejected"
  | "duplicate_marked"
  | "verification_tasks_generated"
  | "verification_completed"
  | "research_tree_promoted_to_af";

export type RewardClass = "minor" | "standard" | "significant" | "major";

const REWARD_MAP: Record<ResearchContributionType, { hearts: number; rewardClass: RewardClass }> = {
  candidate_promoted: { hearts: 2, rewardClass: "standard" },
  candidate_rejected: { hearts: 1, rewardClass: "minor" },
  duplicate_marked: { hearts: 1, rewardClass: "minor" },
  verification_tasks_generated: { hearts: 1, rewardClass: "minor" },
  verification_completed: { hearts: 3, rewardClass: "standard" },
  research_tree_promoted_to_af: { hearts: 5, rewardClass: "major" },
};

const RESEARCH_TYPES: ResearchContributionType[] = [
  "candidate_promoted", "candidate_rejected", "duplicate_marked",
  "verification_tasks_generated", "verification_completed", "research_tree_promoted_to_af",
];

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
 * Review-first: validation_status = 'pending', reward_status = 'pending'.
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
      payload_json: { ...params.payload, reward_class: reward.rewardClass } as unknown as Json,
    })
    .select("id")
    .single();
  if (error) { console.warn("[research-contributions] Log failed:", error.message); return null; }
  return data?.id || null;
}

/* ── Curator Validation ── */

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
  if (error) { console.warn("[contributions] Validate failed:", error.message); return false; }
  return true;
}

export async function rejectContribution(eventId: string, curatorId: string, reason?: string) {
  let payloadUpdate: Record<string, unknown> | undefined;
  if (reason) {
    const { data: existing } = await supabase
      .from("agent_contribution_events").select("payload_json").eq("id", eventId).single();
    payloadUpdate = { ...((existing?.payload_json as Record<string, unknown>) || {}), rejection_reason: reason };
  }
  const updateData: Record<string, unknown> = {
    validation_status: "rejected",
    validated_by: curatorId,
    validated_at: new Date().toISOString(),
    reward_status: "pending",
  };
  if (payloadUpdate) updateData.payload_json = payloadUpdate as unknown as Json;
  const { error } = await supabase.from("agent_contribution_events").update(updateData).eq("id", eventId);
  if (error) { console.warn("[contributions] Reject failed:", error.message); return false; }
  return true;
}

/* ── Reward Distribution ── */

/**
 * Distribute hearts for an accepted contribution.
 * Guards: must be accepted + reward_status = 'ready'. Prevents double distribution.
 * Writes a ledger entry to agent_reward_ledger.
 */
export async function distributeContributionReward(eventId: string, curatorId: string): Promise<{ ok: boolean; reason?: string }> {
  // Fetch current state
  const { data: evt, error: fetchErr } = await supabase
    .from("agent_contribution_events")
    .select("id, agent_id, validation_status, reward_status, hearts_awarded, contribution_type")
    .eq("id", eventId)
    .single();

  if (fetchErr || !evt) return { ok: false, reason: "Contribution not found" };
  if (evt.validation_status !== "accepted") return { ok: false, reason: "Contribution not validated — must be accepted first" };
  if (evt.reward_status === "distributed") return { ok: false, reason: "Already distributed" };
  if (evt.reward_status !== "ready") return { ok: false, reason: "Reward not ready" };

  // Write ledger entry
  const { error: ledgerErr } = await supabase.from("agent_reward_ledger").insert({
    agent_id: evt.agent_id,
    contribution_event_id: evt.id,
    hearts_amount: evt.hearts_awarded,
    reward_type: "contribution_distribution",
    reason: `Research contribution: ${evt.contribution_type}`,
    status: "issued",
    issued_at: new Date().toISOString(),
  });

  if (ledgerErr) {
    console.warn("[contributions] Ledger write failed:", ledgerErr.message);
    return { ok: false, reason: "Failed to write ledger entry" };
  }

  // Mark event as distributed
  const { error: updateErr } = await supabase
    .from("agent_contribution_events")
    .update({
      reward_status: "distributed",
      rewarded_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("reward_status", "ready"); // extra guard against race

  if (updateErr) {
    console.warn("[contributions] Distribution update failed:", updateErr.message);
    return { ok: false, reason: "Failed to update reward status" };
  }

  return { ok: true };
}

/* ── Fetching ── */

export async function fetchRecentResearchContributions(limit = 20, statusFilter?: string) {
  let query = supabase
    .from("agent_contribution_events")
    .select("*, agent_profiles(agent_name, avatar_emoji)")
    .in("contribution_type", RESEARCH_TYPES)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusFilter && statusFilter !== "all") {
    if (statusFilter === "reward_ready") {
      query = query.eq("reward_status", "ready");
    } else {
      query = query.eq("validation_status", statusFilter);
    }
  }

  const { data, error } = await query;
  if (error) { console.warn("[contributions] Fetch failed:", error.message); return []; }
  return data || [];
}

export async function fetchResearchContributionStats() {
  const { data, error } = await supabase
    .from("agent_contribution_events")
    .select("contribution_type, validation_status, reward_status")
    .in("contribution_type", RESEARCH_TYPES);

  if (error) return { total: 0, accepted: 0, pending: 0, rejected: 0, rewardReady: 0, distributed: 0, byType: {} as Record<string, number> };

  const items = data || [];
  const byType: Record<string, number> = {};
  let accepted = 0, pending = 0, rejected = 0, rewardReady = 0, distributed = 0;
  for (const item of items) {
    byType[item.contribution_type] = (byType[item.contribution_type] || 0) + 1;
    if (item.validation_status === "accepted" || item.validation_status === "validated") accepted++;
    if (item.validation_status === "pending") pending++;
    if (item.validation_status === "rejected") rejected++;
    if (item.reward_status === "ready") rewardReady++;
    if (item.reward_status === "distributed") distributed++;
  }
  return { total: items.length, accepted, pending, rejected, rewardReady, distributed, byType };
}

export async function fetchPendingContributionCount(): Promise<number> {
  const { count, error } = await supabase
    .from("agent_contribution_events")
    .select("id", { count: "exact", head: true })
    .in("contribution_type", RESEARCH_TYPES)
    .eq("validation_status", "pending");
  if (error) return 0;
  return count ?? 0;
}

export async function fetchRewardReadyCount(): Promise<number> {
  const { count, error } = await supabase
    .from("agent_contribution_events")
    .select("id", { count: "exact", head: true })
    .in("contribution_type", RESEARCH_TYPES)
    .eq("reward_status", "ready");
  if (error) return 0;
  return count ?? 0;
}

export async function fetchDistributedCount(): Promise<number> {
  const { count, error } = await supabase
    .from("agent_contribution_events")
    .select("id", { count: "exact", head: true })
    .in("contribution_type", RESEARCH_TYPES)
    .eq("reward_status", "distributed");
  if (error) return 0;
  return count ?? 0;
}
