/**
 * MapSeedNudge — watches user location on the map and shows a gentle
 * seed-planting prompt when the user is near an Ancient Friend and has seeds.
 * Renders as a floating card near the bottom of the map viewport.
 */
import { useState, useEffect, useMemo } from "react";
import SeedNudge from "@/components/SeedNudge";

interface NearbyTree {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface MapSeedNudgeProps {
  trees: NearbyTree[];
  userLatLng: [number, number] | null;
  userId: string | null;
  proximityMeters?: number;
}

/** Haversine distance in meters */
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

const MapSeedNudge = ({
  trees,
  userLatLng,
  userId,
  proximityMeters = 100,
}: MapSeedNudgeProps) => {
  const [dismissed, setDismissed] = useState(false);

  // Find nearest tree within proximity
  const nearestTree = useMemo(() => {
    if (!userLatLng) return null;
    let best: (NearbyTree & { dist: number }) | null = null;
    for (const t of trees) {
      if (t.latitude == null || t.longitude == null) continue;
      const d = haversineM(userLatLng[0], userLatLng[1], t.latitude, t.longitude);
      if (d <= proximityMeters && (!best || d < best.dist)) {
        best = { ...t, dist: d };
      }
    }
    return best;
  }, [userLatLng, trees, proximityMeters]);

  // Reset dismissed when nearest tree changes
  useEffect(() => {
    setDismissed(false);
  }, [nearestTree?.id]);

  if (!nearestTree || !userId || dismissed) return null;

  return (
    <div className="absolute bottom-28 left-3 right-3 z-[800] pointer-events-auto max-w-sm mx-auto">
      <SeedNudge
        treeId={nearestTree.id}
        treeName={nearestTree.name}
        treeLat={nearestTree.latitude}
        treeLng={nearestTree.longitude}
        userId={userId}
        context="proximity"
        onDismiss={() => setDismissed(true)}
      />
    </div>
  );
};

export default MapSeedNudge;
