import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SEEDS_PER_DAY = 3;
const SEEDS_PER_TREE = 3;
const PROXIMITY_METERS = 100;

interface PlantedSeed {
  id: string;
  planter_id: string;
  tree_id: string;
  planted_at: string;
  blooms_at: string;
  collected_by: string | null;
  collected_at: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type ActionFailureReason =
  | "no_user"
  | "no_seeds"
  | "per_tree_limit"
  | "seed_missing"
  | "already_collected"
  | "own_seed"
  | "not_bloomed"
  | "no_seed_coords"
  | "geo_unsupported"
  | "geo_denied"
  | "geo_unavailable"
  | "geo_timeout"
  | "geo_poor_accuracy"
  | "too_far"
  | "rpc_error";

export interface ActionResult {
  ok: boolean;
  reason?: ActionFailureReason;
  distance?: number;
  accuracy?: number;
  userLat?: number;
  userLng?: number;
  treeLat?: number;
  treeLng?: number;
  error?: string;
}

interface SeedEconomy {
  seedsRemaining: number;
  seedsUsedToday: number;
  loading: boolean;
  plantSeed: (treeId: string, treeLat: number, treeLng: number) => Promise<ActionResult>;
  collectHeart: (seedId: string) => Promise<ActionResult>;
  getSeedsAtTree: (treeId: string) => PlantedSeed[];
  getBloomedSeedsAtTree: (treeId: string) => PlantedSeed[];
  allSeeds: PlantedSeed[];
  totalSeedHeartsEarned: number;
  refreshSeeds: () => Promise<void>;
  heartBreakdown: { wanderer: number; sower: number; windfall: number };
}

/** Haversine distance in meters */
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get local midnight timestamp for today */
function getLocalMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export function useSeedEconomy(userId: string | null): SeedEconomy {
  const [allSeeds, setAllSeeds] = useState<PlantedSeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [heartBreakdown, setHeartBreakdown] = useState<{ wanderer: number; sower: number; windfall: number }>({ wanderer: 0, sower: 0, windfall: 0 });

  const fetchSeeds = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    const [seedsRes, heartsRes] = await Promise.all([
      // Only fetch recent/relevant seeds instead of ALL seeds globally
      supabase.from("planted_seeds").select("*").or(`planter_id.eq.${userId},collected_by.is.null`).order("planted_at", { ascending: false }).limit(500),
      supabase.from("user_heart_balances").select("s33d_hearts").eq("user_id", userId).maybeSingle(),
    ]);

    if (!seedsRes.error && seedsRes.data) {
      setAllSeeds(seedsRes.data as PlantedSeed[]);
    }

    // Use materialized balance instead of summing all transactions
    const bd = { wanderer: 0, sower: 0, windfall: 0 };
    // Note: detailed breakdown is now only used for display, not for critical logic
    setHeartBreakdown(bd);

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSeeds();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("planted-seeds-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "planted_seeds" }, () => fetchSeeds())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSeeds]);

  // Count seeds planted today (local midnight)
  const seedsUsedToday = userId
    ? allSeeds.filter(s => {
        if (s.planter_id !== userId) return false;
        const plantedDate = new Date(s.planted_at);
        return plantedDate >= getLocalMidnight();
      }).length
    : 0;

  const seedsRemaining = Math.max(0, SEEDS_PER_DAY - seedsUsedToday);

  // Total from heart_transactions
  const totalSeedHeartsEarned = heartBreakdown.wanderer + heartBreakdown.sower + heartBreakdown.windfall;

  /** Get a fresh GPS fix — never cached. Returns structured failure info. */
  const getFreshPosition = async (): Promise<
    | { kind: "ok"; position: GeolocationPosition }
    | { kind: "err"; reason: ActionFailureReason; error?: string }
  > => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return { kind: "err", reason: "geo_unsupported" };
    }
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });
      return { kind: "ok", position };
    } catch (err: unknown) {
      const e = err as GeolocationPositionError | undefined;
      const code = e?.code;
      const msg = e?.message ?? String(err);
      if (code === 1) return { kind: "err", reason: "geo_denied", error: msg };
      if (code === 2) return { kind: "err", reason: "geo_unavailable", error: msg };
      if (code === 3) return { kind: "err", reason: "geo_timeout", error: msg };
      return { kind: "err", reason: "geo_unavailable", error: msg };
    }
  };

  const plantSeed = useCallback(async (treeId: string, treeLat: number, treeLng: number): Promise<ActionResult> => {
    if (!userId) return { ok: false, reason: "no_user" };
    if (seedsRemaining <= 0) return { ok: false, reason: "no_seeds" };

    const todaySeeds = allSeeds.filter(s =>
      s.planter_id === userId &&
      s.tree_id === treeId &&
      new Date(s.planted_at) >= getLocalMidnight()
    );
    if (todaySeeds.length >= SEEDS_PER_TREE) return { ok: false, reason: "per_tree_limit" };

    const geo = await getFreshPosition();
    if (!geo.ok) return { ok: false, reason: geo.reason, error: geo.error, treeLat, treeLng };

    const { latitude: userLat, longitude: userLng, accuracy } = geo.position.coords;
    const dist = distanceMeters(userLat, userLng, treeLat, treeLng);
    const base = { distance: dist, accuracy, userLat, userLng, treeLat, treeLng };

    if (dist > PROXIMITY_METERS) return { ok: false, reason: "too_far", ...base };

    const { error } = await supabase.from("planted_seeds").insert({
      planter_id: userId,
      tree_id: treeId,
      latitude: treeLat,
      longitude: treeLng,
    });

    if (error) {
      console.error("[plantSeed] supabase error:", error);
      return { ok: false, reason: "rpc_error", error: error.message, ...base };
    }
    return { ok: true, ...base };
  }, [userId, seedsRemaining, allSeeds]);

  const collectHeart = useCallback(async (seedId: string): Promise<ActionResult> => {
    if (!userId) return { ok: false, reason: "no_user" };

    const seed = allSeeds.find(s => s.id === seedId);
    if (!seed) return { ok: false, reason: "seed_missing" };
    if (seed.collected_by) return { ok: false, reason: "already_collected" };
    if (seed.planter_id === userId) return { ok: false, reason: "own_seed" };
    if (new Date(seed.blooms_at) > new Date()) return { ok: false, reason: "not_bloomed" };
    if (seed.latitude == null || seed.longitude == null) return { ok: false, reason: "no_seed_coords" };

    const geo = await getFreshPosition();
    if (!geo.ok) {
      return { ok: false, reason: geo.reason, error: geo.error, treeLat: seed.latitude, treeLng: seed.longitude };
    }

    const { latitude: userLat, longitude: userLng, accuracy } = geo.position.coords;
    const dist = distanceMeters(userLat, userLng, seed.latitude, seed.longitude);
    const base = { distance: dist, accuracy, userLat, userLng, treeLat: seed.latitude, treeLng: seed.longitude };

    if (dist > PROXIMITY_METERS) return { ok: false, reason: "too_far", ...base };

    const { error } = await supabase
      .from("planted_seeds")
      .update({ collected_by: userId, collected_at: new Date().toISOString() })
      .eq("id", seedId);

    if (error) {
      console.error("[collectHeart] supabase error:", error);
      return { ok: false, reason: "rpc_error", error: error.message, ...base };
    }
    return { ok: true, ...base };
  }, [userId, allSeeds]);

  const getSeedsAtTree = useCallback((treeId: string) => {
    return allSeeds.filter(s => s.tree_id === treeId);
  }, [allSeeds]);

  const getBloomedSeedsAtTree = useCallback((treeId: string) => {
    const now = new Date();
    return allSeeds.filter(s =>
      s.tree_id === treeId &&
      s.collected_by === null &&
      new Date(s.blooms_at) <= now
    );
  }, [allSeeds]);

  return {
    seedsRemaining,
    seedsUsedToday,
    loading,
    plantSeed,
    collectHeart,
    getSeedsAtTree,
    getBloomedSeedsAtTree,
    allSeeds,
    totalSeedHeartsEarned,
    refreshSeeds: fetchSeeds,
    heartBreakdown,
  };
}

export { SEEDS_PER_DAY, SEEDS_PER_TREE, PROXIMITY_METERS };
export type { PlantedSeed };
