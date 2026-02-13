/**
 * Lightweight reward issuance helper.
 * Inserts species_heart_transactions + influence_transactions + daily_reward_caps.
 * Returns the earned amounts for UI display (RewardReceipt).
 */
import { supabase } from "@/integrations/supabase/client";
import { matchSpecies } from "@/data/treeSpecies";
import { getHiveForSpecies } from "@/utils/hiveUtils";

const DAILY_CHECKIN_CAP = 3;

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
  /** Override species-heart amount (defaults based on actionType) */
  speciesAmount?: number;
  /** Override influence amount (defaults based on actionType) */
  influenceAmount?: number;
}

const ACTION_DEFAULTS: Record<string, { species: number; influence: number }> = {
  checkin: { species: 1, influence: 0 },
  mapping: { species: 3, influence: 2 },
  offering: { species: 1, influence: 0 },
  curation: { species: 0, influence: 2 },
};

export async function issueRewards(params: IssueParams): Promise<RewardResult | null> {
  const { userId, treeId, treeSpecies, actionType } = params;
  const match = matchSpecies(treeSpecies);
  const family = match?.family || "Unknown";
  const hive = getHiveForSpecies(treeSpecies);
  const hiveName = hive?.displayName || `${family} Hive`;

  const defaults = ACTION_DEFAULTS[actionType] || { species: 1, influence: 0 };
  const speciesAmt = params.speciesAmount ?? defaults.species;
  const influenceAmt = params.influenceAmount ?? defaults.influence;

  // Daily cap enforcement for check-ins
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

  // Issue species hearts
  if (speciesAmt > 0) {
    await supabase.from("species_heart_transactions").insert({
      user_id: userId,
      tree_id: treeId,
      species_family: family,
      amount: speciesAmt,
      action_type: actionType,
    });
  }

  // Issue influence tokens
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

  return {
    s33dHearts: 0, // S33D hearts are issued by existing heart_transactions system
    speciesHearts: speciesAmt,
    influence: influenceAmt,
    speciesFamily: family,
    hiveName,
  };
}
