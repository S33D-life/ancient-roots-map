/**
 * useTreePresence — manages 333-second presence ritual state,
 * anti-farm checks (1 rewarded per tree per 24h), and heart rewards.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { issueRewards } from "@/utils/issueRewards";

const PRESENCE_DURATION = 333;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UseTreePresenceOptions {
  treeId: string | undefined;
  treeSpecies: string;
  userId: string | null;
}

export function useTreePresence({ treeId, treeSpecies, userId }: UseTreePresenceOptions) {
  const [completedToday, setCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [presenceCompleted, setPresenceCompleted] = useState(false);

  // Check if user already completed presence for this tree in the last 24h
  useEffect(() => {
    if (!userId || !treeId) { setLoading(false); return; }

    const check = async () => {
      const since = new Date(Date.now() - COOLDOWN_MS).toISOString();
      const { data } = await supabase
        .from("tree_presence_completions")
        .select("id")
        .eq("user_id", userId)
        .eq("tree_id", treeId)
        .gte("completed_at", since)
        .limit(1);

      const done = !!(data && data.length > 0);
      setCompletedToday(done);
      setPresenceCompleted(done);
      setLoading(false);
    };
    check();
  }, [userId, treeId]);

  const recordCompletion = useCallback(async (reflection?: string) => {
    if (!userId || !treeId) return null;

    // Double-check server-side
    const since = new Date(Date.now() - COOLDOWN_MS).toISOString();
    const { data: existing } = await supabase
      .from("tree_presence_completions")
      .select("id")
      .eq("user_id", userId)
      .eq("tree_id", treeId)
      .gte("completed_at", since)
      .limit(1);

    const alreadyDone = !!(existing && existing.length > 0);
    let heartsAwarded = 0;

    if (!alreadyDone) {
      // Award hearts via the 3-layer engine
      const reward = await issueRewards({
        userId,
        treeId,
        treeSpecies,
        actionType: "checkin",
        s33dAmount: 5,
        speciesAmount: 2,
        influenceAmount: 1,
      });
      heartsAwarded = reward ? reward.s33dHearts + reward.speciesHearts : 0;
    }

    // Record completion (always, even if no hearts — for unlock tracking)
    await supabase.from("tree_presence_completions").insert({
      user_id: userId,
      tree_id: treeId,
      duration_seconds: PRESENCE_DURATION,
      reflection: reflection || null,
      hearts_awarded: heartsAwarded,
    });

    setPresenceCompleted(true);
    setCompletedToday(!alreadyDone);

    return { heartsAwarded, alreadyRewarded: alreadyDone };
  }, [userId, treeId, treeSpecies]);

  return {
    presenceCompleted,
    completedToday,
    loading,
    recordCompletion,
    PRESENCE_DURATION,
  };
}
