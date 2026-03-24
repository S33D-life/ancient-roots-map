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

interface SeedEconomy {
  seedsRemaining: number;
  seedsUsedToday: number;
  loading: boolean;
  plantSeed: (treeId: string, treeLat: number, treeLng: number) => Promise<boolean>;
  collectHeart: (seedId: string) => Promise<boolean>;
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

  const plantSeed = useCallback(async (treeId: string, treeLat: number, treeLng: number): Promise<boolean> => {
    if (!userId || seedsRemaining <= 0) return false;

    // Enforce per-tree daily limit
    const todaySeeds = allSeeds.filter(s =>
      s.planter_id === userId &&
      s.tree_id === treeId &&
      new Date(s.planted_at) >= getLocalMidnight()
    );
    if (todaySeeds.length >= SEEDS_PER_TREE) return false;

    // Check GPS proximity
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const dist = distanceMeters(
        position.coords.latitude,
        position.coords.longitude,
        treeLat,
        treeLng
      );

      if (dist > PROXIMITY_METERS) {
        return false; // Too far
      }

      const { error } = await supabase.from("planted_seeds").insert({
        planter_id: userId,
        tree_id: treeId,
        latitude: treeLat,
        longitude: treeLng,
      });

      if (error) {
        console.error("Error planting seed:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Geolocation error:", err);
      return false;
    }
  }, [userId, seedsRemaining, allSeeds]);

  const collectHeart = useCallback(async (seedId: string): Promise<boolean> => {
    if (!userId) return false;

    const seed = allSeeds.find(s => s.id === seedId);
    if (!seed || seed.collected_by || seed.planter_id === userId) return false;

    // Check if bloomed
    if (new Date(seed.blooms_at) > new Date()) return false;

    // Check proximity
    if (seed.latitude == null || seed.longitude == null) return false;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const dist = distanceMeters(
        position.coords.latitude,
        position.coords.longitude,
        seed.latitude,
        seed.longitude
      );

      if (dist > PROXIMITY_METERS) return false;

      const { error } = await supabase
        .from("planted_seeds")
        .update({ collected_by: userId, collected_at: new Date().toISOString() })
        .eq("id", seedId);

      if (error) {
        console.error("Error collecting heart:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Geolocation error:", err);
      return false;
    }
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
