/**
 * Canopy Check-In — automatic proximity-based recognition.
 * 
 * Watches the user's geolocation and triggers a silent check-in
 * when they enter the canopy radius (~40m) of a tree they created.
 * Local event cooldown mirrors server cooldown intent.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { haversineKm } from "@/utils/mapGeometry";
import type { RewardResult } from "@/utils/issueRewards";

const CANOPY_RADIUS_KM = 0.04; // ~40 metres
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const WATCH_INTERVAL_MS = 15_000; // poll every 15s
const MIN_ACCURACY_M = 80; // ignore inaccurate readings

interface CanopyTree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
}

interface CanopyEvent {
  tree: CanopyTree;
  reward: RewardResult | null;
  timestamp: number;
}

export function useCanopyCheckIn() {
  const [lastEvent, setLastEvent] = useState<CanopyEvent | null>(null);
  const [active, setActive] = useState(false);
  const cooldownMapRef = useRef<Map<string, number>>(new Map());
  const treesRef = useRef<CanopyTree[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const userIdRef = useRef<string | null>(null);
  const processingRef = useRef(false);
  const dailyCappedRef = useRef(false);

  // Load user's trees that qualify for canopy check-in
  const loadTrees = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    userIdRef.current = session.user.id;

    // Trees the user created that have coordinates
    const { data } = await supabase
      .from("trees")
      .select("id, name, species, latitude, longitude")
      .eq("created_by", session.user.id)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (data) {
      treesRef.current = data.filter(
        (t) => t.latitude != null && t.longitude != null
      ) as CanopyTree[];
    }
  }, []);

  const handlePosition = useCallback(async (pos: GeolocationPosition) => {
    if (pos.coords.accuracy > MIN_ACCURACY_M) return;
    if (!userIdRef.current || treesRef.current.length === 0) return;
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const { latitude, longitude } = pos.coords;
      const now = Date.now();

      for (const tree of treesRef.current) {
        const dist = haversineKm(latitude, longitude, tree.latitude, tree.longitude);
        if (dist > CANOPY_RADIUS_KM) continue;

        // Check cooldown
        const lastCheckin = cooldownMapRef.current.get(tree.id) || 0;
        if (now - lastCheckin < COOLDOWN_MS) continue;

        // Set cooldown immediately to prevent duplicate calls
        cooldownMapRef.current.set(tree.id, now);

        const { data, error } = await supabase.functions.invoke("canopy-checkin", {
          body: {
            action: "checkin",
            tree_id: tree.id,
            season_stage: "other",
            soft_mode: false,
            has_offering: false,
            latitude,
            longitude,
            accuracy_m: pos.coords.accuracy,
          },
        });

        if (error) continue;

        const result = (data || {}) as { accepted?: boolean; hearts_awarded?: number };
        if (result.accepted && Number(result.hearts_awarded || 0) > 0) {
          const hearts = Math.max(0, Number(result.hearts_awarded || 0));
          setLastEvent({
            tree,
            reward: {
              s33dHearts: hearts,
              speciesHearts: 0,
              influence: 0,
              speciesFamily: tree.species || "Unknown",
              hiveName: "Canopy",
              capped: hearts === 0,
            } as RewardResult,
            timestamp: now,
          });
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    loadTrees();

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      () => {}, // silent fail
      {
        enableHighAccuracy: true,
        maximumAge: WATCH_INTERVAL_MS,
        timeout: 30_000,
      }
    );
    setActive(true);
  }, [loadTrees, handlePosition]);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setActive(false);
  }, []);

  // Auto-start when user is authenticated
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          start();
        } else {
          stop();
        }
      }
    );

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) start();
    });

    return () => {
      subscription.unsubscribe();
      stop();
    };
  }, [start, stop]);

  // Clear the event after display
  const dismissEvent = useCallback(() => setLastEvent(null), []);

  return { lastEvent, dismissEvent, active };
}
