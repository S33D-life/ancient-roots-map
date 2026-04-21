/**
 * useTreePresenceWindow — is the user currently "at" a tree for whisper-send purposes?
 *
 * A whisper is sent ACTIVE when the user has presence at the anchor tree.
 * Otherwise it is created as DORMANT (is_active=false) and waits for a future
 * check-in to be activated by future tooling.
 *
 * Presence rule (matches Rules of Presence):
 *   1) Most recent tree_checkin for this (user, tree) within 12h → at-tree
 *   2) OR live geolocation within 100m of the tree → at-tree
 *
 * Returns { atTree, source, loading, refresh } so the UI can hint dormancy.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const GRACE_WINDOW_MS = 12 * 60 * 60 * 1000;
const GEO_RADIUS_M = 100;

export type PresenceSource = "checkin" | "geo" | "none";

interface Args {
  userId: string | null;
  treeId: string | null;
  treeLat?: number | null;
  treeLng?: number | null;
  /** Try live geolocation as a secondary signal. Default true. */
  useGeo?: boolean;
  /** Skip the lookup entirely (e.g. when the modal is closed). */
  enabled?: boolean;
}

export function useTreePresenceWindow({
  userId, treeId, treeLat, treeLng, useGeo = true, enabled = true,
}: Args) {
  const [atTree, setAtTree] = useState(false);
  const [source, setSource] = useState<PresenceSource>("none");
  const [loading, setLoading] = useState(true);

  const evaluate = useCallback(async () => {
    if (!enabled || !userId || !treeId) {
      setAtTree(false); setSource("none"); setLoading(false);
      return;
    }
    setLoading(true);

    // 1) recent check-in within grace window
    const since = new Date(Date.now() - GRACE_WINDOW_MS).toISOString();
    const { data: checkins } = await supabase
      .from("tree_checkins")
      .select("id, checked_in_at")
      .eq("user_id", userId)
      .eq("tree_id", treeId)
      .gte("checked_in_at", since)
      .order("checked_in_at", { ascending: false })
      .limit(1);

    if (checkins && checkins.length > 0) {
      setAtTree(true); setSource("checkin"); setLoading(false);
      return;
    }

    // 2) live geolocation within radius
    if (useGeo && treeLat != null && treeLng != null && typeof navigator !== "undefined" && "geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 4000,
            maximumAge: 60_000,
            enableHighAccuracy: false,
          })
        );
        const dist = haversineMeters(pos.coords.latitude, pos.coords.longitude, treeLat, treeLng);
        if (dist <= GEO_RADIUS_M) {
          setAtTree(true); setSource("geo"); setLoading(false);
          return;
        }
      } catch {
        // permission denied / timeout → fall through
      }
    }

    setAtTree(false); setSource("none"); setLoading(false);
  }, [enabled, userId, treeId, treeLat, treeLng, useGeo]);

  useEffect(() => { evaluate(); }, [evaluate]);

  return { atTree, source, loading, refresh: evaluate };
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
