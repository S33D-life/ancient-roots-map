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
  | "tree_missing"
  | "already_collected"
  | "own_seed"
  | "not_bloomed"
  | "no_seed_coords"
  | "no_user_coords"
  | "no_target_coords"
  | "geo_unsupported"
  | "geo_denied"
  | "geo_unavailable"
  | "geo_timeout"
  | "geo_poor_accuracy"
  | "too_far"
  | "override_too_far"
  | "override_disabled"
  | "rpc_error";

export type GpsConfidence = "high" | "medium" | "low" | "unknown";

export interface ActionResult {
  ok: boolean;
  reason?: ActionFailureReason;
  distance?: number;
  /** Distance after subtracting GPS accuracy tolerance — what we actually gate on. */
  effectiveDistance?: number;
  accuracy?: number;
  confidence?: GpsConfidence;
  userLat?: number;
  userLng?: number;
  treeLat?: number;
  treeLng?: number;
  /** Browser-reported coords timestamp (ms since epoch). */
  gpsTimestamp?: number;
  /** Age of the GPS fix in ms at the time it was used. */
  gpsAgeMs?: number;
  /** Number of GPS retries that occurred. */
  retries?: number;
  /** True if the encounter was allowed via an approximate-location / keeper override. */
  overrideUsed?: boolean;
  /** Which kind of override was applied server-side, if any. */
  overrideKind?: "manual" | "keeper";
  /** Maximum distance allowed when using the manual approximate-location override. */
  manualOverrideRadiusM?: number;
  error?: string;
}

export interface ActionOptions {
  /** Bypass distance gate (DEV or keeper role only — enforced at UI). */
  override?: boolean;
  /** Optional callback fired between GPS attempts so the UI can show progress. */
  onAttempt?: (attempt: number) => void;
}

interface SeedEconomy {
  seedsRemaining: number;
  seedsUsedToday: number;
  loading: boolean;
  plantSeed: (treeId: string, treeLat: number, treeLng: number, opts?: ActionOptions) => Promise<ActionResult>;
  collectHeart: (seedId: string, opts?: ActionOptions) => Promise<ActionResult>;
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
  function getConfidence(accuracy: number | undefined): GpsConfidence {
    if (accuracy == null) return "unknown";
    if (accuracy < 20) return "high";
    if (accuracy <= 75) return "medium";
    return "low";
  }

  /** Tolerance: subtract up to 40m of accuracy uncertainty from raw distance. */
  function applyTolerance(distance: number, accuracy: number | undefined): number {
    const slack = Math.min((accuracy ?? 0) * 0.5, 40);
    return Math.max(0, distance - slack);
  }

  /**
   * Get a fresh GPS fix with auto-retry. Up to 3 total attempts.
   * Retries on timeout / unavailable / poor accuracy.
   */
  const getFreshPosition = async (
    onAttempt?: (attempt: number) => void,
  ): Promise<
    | { kind: "ok"; position: GeolocationPosition; retries: number }
    | { kind: "err"; reason: ActionFailureReason; error?: string; retries: number }
  > => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return { kind: "err", reason: "geo_unsupported", retries: 0 };
    }

    const MAX_ATTEMPTS = 3;
    let lastErr: { reason: ActionFailureReason; error?: string } | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      onAttempt?.(attempt);
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: attempt === 1 ? 8000 : 14000,
            maximumAge: 0,
          });
        });

        // Treat very poor accuracy as a retryable signal
        if (position.coords.accuracy > 75 && attempt < MAX_ATTEMPTS) {
          lastErr = { reason: "geo_poor_accuracy" };
          await new Promise(r => setTimeout(r, 800));
          continue;
        }

        return { kind: "ok", position, retries: attempt - 1 };
      } catch (err: unknown) {
        const e = err as GeolocationPositionError | undefined;
        const code = e?.code;
        const msg = e?.message ?? String(err);
        if (code === 1) {
          // Permission denied — never retry
          return { kind: "err", reason: "geo_denied", error: msg, retries: attempt - 1 };
        }
        if (code === 2) lastErr = { reason: "geo_unavailable", error: msg };
        else if (code === 3) lastErr = { reason: "geo_timeout", error: msg };
        else lastErr = { reason: "geo_unavailable", error: msg };
        if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 800));
      }
    }

    return {
      kind: "err",
      reason: lastErr?.reason ?? "geo_unavailable",
      error: lastErr?.error,
      retries: MAX_ATTEMPTS - 1,
    };
  };

  function buildBase(position: GeolocationPosition, treeLat: number, treeLng: number, retries: number) {
    const { latitude: userLat, longitude: userLng, accuracy } = position.coords;
    const dist = distanceMeters(userLat, userLng, treeLat, treeLng);
    const effective = applyTolerance(dist, accuracy);
    const gpsTimestamp = position.timestamp;
    return {
      distance: dist,
      effectiveDistance: effective,
      accuracy,
      confidence: getConfidence(accuracy),
      userLat,
      userLng,
      treeLat,
      treeLng,
      gpsTimestamp,
      gpsAgeMs: Date.now() - gpsTimestamp,
      retries,
    };
  }

  const plantSeed = useCallback(async (
    treeId: string, treeLat: number, treeLng: number, opts?: ActionOptions,
  ): Promise<ActionResult> => {
    if (!userId) return { ok: false, reason: "no_user" };
    if (seedsRemaining <= 0) return { ok: false, reason: "no_seeds" };

    const todaySeeds = allSeeds.filter(s =>
      s.planter_id === userId &&
      s.tree_id === treeId &&
      new Date(s.planted_at) >= getLocalMidnight()
    );
    if (todaySeeds.length >= SEEDS_PER_TREE) return { ok: false, reason: "per_tree_limit" };

    const geo = await getFreshPosition(opts?.onAttempt);
    if (geo.kind === "err") {
      return { ok: false, reason: geo.reason, error: geo.error, treeLat, treeLng, retries: geo.retries };
    }

    const base = buildBase(geo.position, treeLat, treeLng, geo.retries);

    // Server is the source of truth — pass live coords + accuracy + optional override.
    const { data, error } = await supabase.rpc("plant_seed_with_proximity", {
      p_tree_id: treeId,
      p_user_lat: base.userLat,
      p_user_lng: base.userLng,
      p_user_accuracy: base.accuracy ?? null,
      p_override: opts?.override === true,
    });

    if (error) {
      console.error("[plantSeed] rpc error:", error);
      return { ok: false, reason: "rpc_error", error: error.message, ...base };
    }

    const r = (data ?? {}) as Record<string, unknown>;
    const serverDistance = typeof r.distance === "number" ? r.distance : base.distance;
    const serverEffective = typeof r.effective_distance === "number" ? r.effective_distance : base.effectiveDistance;

    if (!r.ok) {
      const reason = (r.reason as ActionFailureReason) ?? "too_far";
      return {
        ok: false, reason,
        ...base,
        distance: serverDistance,
        effectiveDistance: serverEffective,
        error: typeof r.error === "string" ? r.error : undefined,
      };
    }

    return {
      ok: true,
      ...base,
      distance: serverDistance,
      effectiveDistance: serverEffective,
      overrideUsed: !!r.override_used,
    };
  }, [userId, seedsRemaining, allSeeds]);

  const collectHeart = useCallback(async (
    seedId: string, opts?: ActionOptions,
  ): Promise<ActionResult> => {
    if (!userId) return { ok: false, reason: "no_user" };

    const seed = allSeeds.find(s => s.id === seedId);
    if (!seed) return { ok: false, reason: "seed_missing" };
    if (seed.collected_by) return { ok: false, reason: "already_collected" };
    if (seed.planter_id === userId) return { ok: false, reason: "own_seed" };
    if (new Date(seed.blooms_at) > new Date()) return { ok: false, reason: "not_bloomed" };
    if (seed.latitude == null || seed.longitude == null) return { ok: false, reason: "no_seed_coords" };

    const geo = await getFreshPosition(opts?.onAttempt);
    if (geo.kind === "err") {
      return {
        ok: false, reason: geo.reason, error: geo.error,
        treeLat: seed.latitude, treeLng: seed.longitude, retries: geo.retries,
      };
    }

    const base = buildBase(geo.position, seed.latitude, seed.longitude, geo.retries);

    const { data, error } = await supabase.rpc("collect_planted_heart_with_proximity", {
      p_seed_id: seedId,
      p_user_lat: base.userLat,
      p_user_lng: base.userLng,
      p_user_accuracy: base.accuracy ?? null,
      p_override: opts?.override === true,
    });

    if (error) {
      console.error("[collectHeart] rpc error:", error);
      return { ok: false, reason: "rpc_error", error: error.message, ...base };
    }

    const r = (data ?? {}) as Record<string, unknown>;
    const serverDistance = typeof r.distance === "number" ? r.distance : base.distance;
    const serverEffective = typeof r.effective_distance === "number" ? r.effective_distance : base.effectiveDistance;

    if (!r.ok) {
      const reason = (r.reason as ActionFailureReason) ?? "too_far";
      return {
        ok: false, reason,
        ...base,
        distance: serverDistance,
        effectiveDistance: serverEffective,
        error: typeof r.error === "string" ? r.error : undefined,
      };
    }

    return {
      ok: true,
      ...base,
      distance: serverDistance,
      effectiveDistance: serverEffective,
      overrideUsed: !!r.override_used,
    };
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
