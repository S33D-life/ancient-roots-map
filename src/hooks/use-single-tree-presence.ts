/**
 * useSingleTreePresence — lightweight presence signal for a single tree.
 * Used on the tree detail page to show "Someone is here now" / "Recently met".
 * Polls every 30s. Returns null when no signals exist.
 */
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SingleTreePresence {
  state: "here_now" | "recently_met";
  count: number;
}

const POLL_MS = 30_000;
const HERE_NOW_MINUTES = 15;

export function useSingleTreePresence(treeId: string | undefined | null): SingleTreePresence | null {
  const [presence, setPresence] = useState<SingleTreePresence | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!treeId) { setPresence(null); return; }

    const fetch = async () => {
      const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("tree_checkins")
        .select("created_at")
        .eq("tree_id", treeId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!data || data.length === 0) { setPresence(null); return; }

      const now = Date.now();
      const mostRecent = new Date(data[0].created_at).getTime();
      const isHereNow = (now - mostRecent) < HERE_NOW_MINUTES * 60 * 1000;

      setPresence({
        state: isHereNow ? "here_now" : "recently_met",
        count: data.length,
      });
    };

    fetch();
    timerRef.current = setInterval(fetch, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [treeId]);

  return presence;
}
