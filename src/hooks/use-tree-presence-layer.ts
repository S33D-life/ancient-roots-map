/**
 * useTreePresence — fetches presence signals for the current map viewport.
 * Returns trees where someone is "here now" or "recently met" (within 12h).
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PresenceState = "here_now" | "recently_met" | "none";

export interface TreePresenceSignal {
  tree_id: string;
  tree_name: string;
  latitude: number;
  longitude: number;
  species: string | null;
  presence_count: number;
  most_recent: string;
  presence_state: PresenceState;
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function useTreePresence(enabled: boolean = true) {
  const [signals, setSignals] = useState<TreePresenceSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const lastBoundsRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPresence = useCallback(async (bounds: Bounds) => {
    const key = `${bounds.minLat.toFixed(3)},${bounds.maxLat.toFixed(3)},${bounds.minLng.toFixed(3)},${bounds.maxLng.toFixed(3)}`;
    if (key === lastBoundsRef.current) return;
    lastBoundsRef.current = key;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_tree_presence_summary", {
        p_min_lat: bounds.minLat,
        p_max_lat: bounds.maxLat,
        p_min_lng: bounds.minLng,
        p_max_lng: bounds.maxLng,
      });

      if (!error && data) {
        setSignals(data as TreePresenceSignal[]);
      }
    } catch (err) {
      console.warn("[TreePresence] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Debounced update — call from map move handler */
  const updateBounds = useCallback((bounds: Bounds) => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchPresence(bounds), 500);
  }, [enabled, fetchPresence]);

  // Clear signals when disabled
  useEffect(() => {
    if (!enabled) {
      setSignals([]);
      lastBoundsRef.current = "";
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);

  // Realtime: re-fetch on new check-ins (only when enabled)
  const lastBoundsForRealtimeRef = useRef<Bounds | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("presence-checkins")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tree_checkins" },
        () => {
          // Invalidate cache so next fetch gets fresh data
          lastBoundsRef.current = "";
          if (lastBoundsForRealtimeRef.current) {
            fetchPresence(lastBoundsForRealtimeRef.current);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchPresence]);

  // Track latest bounds for realtime refetch
  const updateBoundsWrapped = useCallback((bounds: Bounds) => {
    lastBoundsForRealtimeRef.current = bounds;
    updateBounds(bounds);
  }, [updateBounds]);

  return { signals, loading, updateBounds: updateBoundsWrapped };
}
