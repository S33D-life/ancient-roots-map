import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY = "s33d_home_meetings";

interface HomeMeetingsState {
  count: number;
  metTreeIds: string[];
  isNewMeeting: boolean;
}

/**
 * Tracks unique "home meetings" — the first time a user sees a specific
 * tree on the Home hero. Uses the `meetings` table for logged-in users,
 * localStorage for anonymous visitors.
 */
export function useHomeMeetings(treeId: string | null) {
  const [state, setState] = useState<HomeMeetingsState>({ count: 0, metTreeIds: [], isNewMeeting: false });
  const recorded = useRef<Set<string>>(new Set());

  // Load met tree IDs from localStorage (works for all users as a cache)
  const getLocal = useCallback((): string[] => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);

  const saveLocal = useCallback((ids: string[]) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  }, []);

  // Record a meeting
  const recordMeeting = useCallback(async (tid: string) => {
    if (recorded.current.has(tid)) return;
    recorded.current.add(tid);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if already met
      const { data: existing } = await supabase
        .from("meetings")
        .select("id")
        .eq("user_id", user.id)
        .eq("tree_id", tid)
        .limit(1);

      const isNew = !existing || existing.length === 0;

      if (isNew) {
        await supabase.from("meetings").insert({
          user_id: user.id,
          tree_id: tid,
          notes: "home_meeting",
        });
      }

      // Fetch total unique meetings count
      const { count } = await supabase
        .from("meetings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get all met tree IDs for picker bias
      const { data: allMeetings } = await supabase
        .from("meetings")
        .select("tree_id")
        .eq("user_id", user.id);

      const metIds = [...new Set((allMeetings || []).map(m => m.tree_id))];
      saveLocal(metIds);

      setState({ count: count || 0, metTreeIds: metIds, isNewMeeting: isNew });
    } else {
      // Anonymous: localStorage only
      const ids = getLocal();
      const isNew = !ids.includes(tid);
      const updated = isNew ? [...ids, tid] : ids;
      if (isNew) saveLocal(updated);
      setState({ count: updated.length, metTreeIds: updated, isNewMeeting: isNew });
    }
  }, [getLocal, saveLocal]);

  // On mount, load cached count
  useEffect(() => {
    const ids = getLocal();
    setState(prev => ({ ...prev, count: ids.length, metTreeIds: ids }));
  }, [getLocal]);

  // Record when treeId changes
  useEffect(() => {
    if (treeId) recordMeeting(treeId);
  }, [treeId, recordMeeting]);

  return state;
}
