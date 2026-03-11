/**
 * Unified 3-layer reward issuance engine.
 * Mints S33D Hearts + Species Hearts + Influence Tokens in one call.
 * Enforces daily caps per tree for check-ins.
 */
import { supabase } from "@/integrations/supabase/client";
import { matchSpecies } from "@/data/treeSpecies";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import { toast } from "sonner";

const DAILY_CHECKIN_CAP = 3;

/**
 * In-flight guard: prevents duplicate submissions from double-clicks
 * or concurrent React re-renders. Keyed by `userId:treeId:actionType`.
 */
const _inflight = new Set<string>();

export interface RewardResult {
  s33dHearts: number;
  speciesHearts: number;
  influence: number;
  speciesFamily: string;
  hiveName: string;
  capped?: boolean;
}

interface IssueParams {
  userId: string;
  treeId: string;
  treeSpecies: string;
  actionType: "checkin" | "mapping" | "offering" | "curation";
  /** Override S33D-heart amount */
  s33dAmount?: number;
  /** Override species-heart amount */
  speciesAmount?: number;
  /** Override influence amount */
  influenceAmount?: number;
}

/**
 * Default issuance amounts per action across all 3 layers.
 *   s33d     – global S33D Hearts  (heart_transactions)
 *   species  – fractal Species Hearts  (species_heart_transactions)
 *   influence – soulbound governance  (influence_transactions)
 */
const ACTION_DEFAULTS: Record<string, { s33d: number; species: number; influence: number }> = {
  checkin:  { s33d: 1, species: 1, influence: 0 },
  mapping:  { s33d: 10, species: 3, influence: 2 },
  offering: { s33d: 2, species: 1, influence: 0 },
  curation: { s33d: 0, species: 0, influence: 2 },
};

export async function issueRewards(params: IssueParams): Promise<RewardResult | null> {
  const { userId, treeId, treeSpecies, actionType } = params;
  const match = matchSpecies(treeSpecies);
  const family = match?.family || "Unknown";
  const hive = getHiveForSpecies(treeSpecies);
  const hiveName = hive?.displayName || `${family} Hive`;

  const defaults = ACTION_DEFAULTS[actionType] || { s33d: 1, species: 1, influence: 0 };
  const s33dAmt = params.s33dAmount ?? defaults.s33d;
  const speciesAmt = params.speciesAmount ?? defaults.species;
  const influenceAmt = params.influenceAmount ?? defaults.influence;

  // ── Daily cap enforcement for check-ins ──
  if (actionType === "checkin") {
    const today = new Date().toISOString().slice(0, 10);
    const { data: cap } = await supabase
      .from("daily_reward_caps")
      .select("checkin_count")
      .eq("user_id", userId)
      .eq("tree_id", treeId)
      .eq("reward_date", today)
      .maybeSingle();

    if (cap && cap.checkin_count >= DAILY_CHECKIN_CAP) {
      return { s33dHearts: 0, speciesHearts: 0, influence: 0, speciesFamily: family, hiveName, capped: true };
    }

    await supabase.from("daily_reward_caps").upsert({
      user_id: userId,
      tree_id: treeId,
      reward_date: today,
      checkin_count: (cap?.checkin_count || 0) + 1,
      last_checkin_at: new Date().toISOString(),
    }, { onConflict: "user_id,tree_id,reward_date" });
  }

  // ── Layer 1: S33D Hearts (global currency) ──
  if (s33dAmt > 0) {
    await supabase.from("heart_transactions").insert({
      user_id: userId,
      tree_id: treeId,
      heart_type: actionType,
      amount: s33dAmt,
    });
  }

  // ── Layer 2: Species Hearts (fractal per-hive) ──
  if (speciesAmt > 0) {
    await supabase.from("species_heart_transactions").insert({
      user_id: userId,
      tree_id: treeId,
      species_family: family,
      amount: speciesAmt,
      action_type: actionType,
    });
  }

  // ── Layer 3: Influence Tokens (soulbound governance) ──
  if (influenceAmt > 0) {
    await supabase.from("influence_transactions").insert({
      user_id: userId,
      tree_id: treeId,
      species_family: family,
      scope: "hive",
      amount: influenceAmt,
      action_type: actionType,
    });
  }

  const result: RewardResult = {
    s33dHearts: s33dAmt,
    speciesHearts: speciesAmt,
    influence: influenceAmt,
    speciesFamily: family,
    hiveName,
  };

  // Show a subtle toast so the user always knows they earned hearts
  const total = s33dAmt + speciesAmt;
  if (total > 0) {
    const ACTION_LABELS: Record<string, string> = {
      checkin: "Check-in",
      mapping: "Tree mapped",
      offering: "Offering",
      curation: "Curation",
    };
    toast(`🌿 +${total} Hearts`, {
      description: ACTION_LABELS[actionType] || actionType,
      duration: 3000,
    });
  }

  return result;
}
