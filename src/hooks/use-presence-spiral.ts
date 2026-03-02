/**
 * usePresenceSpiral — fetches all presence sessions and streak data for a user.
 * Used by PresenceSpiral visualization, Hearth dashboard, and profile.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PresenceSession {
  id: string;
  tree_id: string;
  completed_at: string;
  duration_seconds: number;
  geo_validated: boolean;
}

export interface PresenceStreakData {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  sessions: PresenceSession[];
  loading: boolean;
}

export function usePresenceSpiral(userId: string | null): PresenceStreakData {
  const [sessions, setSessions] = useState<PresenceSession[]>([]);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetch = async () => {
      // Fetch all sessions (up to 1000)
      const { data: sessionData } = await supabase
        .from("tree_presence_completions")
        .select("id, tree_id, completed_at, duration_seconds, geo_validated")
        .eq("user_id", userId)
        .order("completed_at", { ascending: true });

      // Fetch streak
      const { data: streakData } = await supabase
        .from("presence_streaks")
        .select("current_streak, longest_streak, total_sessions")
        .eq("user_id", userId)
        .maybeSingle();

      setSessions((sessionData as PresenceSession[]) || []);
      setStreak({
        currentStreak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
        totalSessions: streakData?.total_sessions || (sessionData?.length || 0),
      });
      setLoading(false);
    };
    fetch();
  }, [userId]);

  return { ...streak, sessions, loading };
}

/**
 * useTreePresenceCount — lightweight hook for showing presence count on a specific tree.
 */
export function useTreePresenceCount(userId: string | null, treeId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId || !treeId) return;
    supabase
      .from("tree_presence_completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("tree_id", treeId)
      .then(({ count: c }) => setCount(c || 0));
  }, [userId, treeId]);

  return count;
}
