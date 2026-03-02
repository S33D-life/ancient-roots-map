/**
 * useTreePresence — manages 333-second presence ritual state,
 * anti-farm checks (1 rewarded per tree per 24h), heart rewards (+333 base),
 * streak tracking, and geo-validation.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { issueRewards } from "@/utils/issueRewards";

const PRESENCE_DURATION = 333;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// Heart reward constants
const BASE_HEARTS = 10;        // S33D hearts per presence
const SPECIES_HEARTS = 3;      // Species hearts per presence
const INFLUENCE_HEARTS = 1;    // Influence per presence
const STREAK_7_BONUS = 33;     // Extra S33D at 7-day streak
const STREAK_33_BONUS = 111;   // Extra S33D at 33-day streak
const MILESTONE_33_BONUS = 33; // Extra S33D at every 33 total sessions

interface UseTreePresenceOptions {
  treeId: string | undefined;
  treeSpecies: string;
  userId: string | null;
  /** Tree lat/lng for geo-validation */
  treeLat?: number | null;
  treeLng?: number | null;
}

export function useTreePresence({ treeId, treeSpecies, userId, treeLat, treeLng }: UseTreePresenceOptions) {
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

  /** Attempt lightweight geo-validation: is user near the tree? */
  const checkGeoValidation = useCallback(async (): Promise<boolean> => {
    if (!treeLat || !treeLng) return false;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      const dist = haversine(pos.coords.latitude, pos.coords.longitude, treeLat, treeLng);
      return dist < 500; // within 500m
    } catch {
      return false;
    }
  }, [treeLat, treeLng]);

  const recordCompletion = useCallback(async (reflection?: string) => {
    if (!userId || !treeId) return null;

    // Double-check server-side anti-farm
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
    let geoValidated = false;

    // Geo-validation (best-effort, doesn't block completion)
    geoValidated = await checkGeoValidation();

    if (!alreadyDone) {
      // Base reward
      const reward = await issueRewards({
        userId,
        treeId,
        treeSpecies,
        actionType: "checkin",
        s33dAmount: BASE_HEARTS,
        speciesAmount: SPECIES_HEARTS,
        influenceAmount: INFLUENCE_HEARTS,
      });
      heartsAwarded = reward ? reward.s33dHearts + reward.speciesHearts : 0;

      // Update streak (pass treeId for bonus heart transactions)
      await updateStreak(userId, treeId);
    }

    // Get current streak for the record
    const { data: streakRow } = await supabase
      .from("presence_streaks")
      .select("current_streak, total_sessions")
      .eq("user_id", userId)
      .maybeSingle();

    const streakDay = streakRow?.current_streak || 0;

    // Record completion
    await supabase.from("tree_presence_completions").insert({
      user_id: userId,
      tree_id: treeId,
      duration_seconds: PRESENCE_DURATION,
      reflection: reflection || null,
      hearts_awarded: heartsAwarded,
      geo_validated: geoValidated,
      streak_day: streakDay,
    });

    setPresenceCompleted(true);
    setCompletedToday(!alreadyDone);

    return {
      heartsAwarded,
      alreadyRewarded: alreadyDone,
      geoValidated,
      streakDay,
      totalSessions: streakRow?.total_sessions || 1,
    };
  }, [userId, treeId, treeSpecies, checkGeoValidation]);

  return {
    presenceCompleted,
    completedToday,
    loading,
    recordCompletion,
    PRESENCE_DURATION,
  };
}

/** Update presence_streaks and issue streak/milestone bonuses */
async function updateStreak(userId: string, treeId: string) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("presence_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let currentStreak = 1;
  let longestStreak = 1;
  let totalSessions = 1;

  if (existing) {
    const lastDate = existing.last_presence_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (lastDate === today) {
      // Already counted today
      currentStreak = existing.current_streak;
      totalSessions = existing.total_sessions + 1;
    } else if (lastDate === yesterday) {
      // Continuing streak
      currentStreak = existing.current_streak + 1;
      totalSessions = existing.total_sessions + 1;
    } else {
      // Streak broken
      currentStreak = 1;
      totalSessions = existing.total_sessions + 1;
    }
    longestStreak = Math.max(existing.longest_streak, currentStreak);
  }

  await supabase.from("presence_streaks").upsert({
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_sessions: totalSessions,
    last_presence_date: today,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  // Streak bonuses (only award once per milestone crossing)
  // These are issued via heart_transactions directly to bypass daily cap
  const bonuses: Array<{ amount: number; type: string }> = [];

  if (currentStreak === 7) bonuses.push({ amount: STREAK_7_BONUS, type: "streak_7" });
  if (currentStreak === 33) bonuses.push({ amount: STREAK_33_BONUS, type: "streak_33" });
  if (totalSessions % 33 === 0) bonuses.push({ amount: MILESTONE_33_BONUS, type: "milestone_33" });

  for (const bonus of bonuses) {
    await supabase.from("heart_transactions").insert({
      user_id: userId,
      tree_id: treeId,
      heart_type: bonus.type,
      amount: bonus.amount,
    });
  }
}

/** Haversine distance in meters */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
