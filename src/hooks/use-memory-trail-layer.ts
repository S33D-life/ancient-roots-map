/**
 * useMemoryTrailLayer — draws a soft polyline connecting
 * the user's recently visited trees on the map.
 *
 * Data source: tree_checkins (last 20).
 * Single query on mount, cached, no polling.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import { isFeatureEnabled } from "@/lib/featureFlags";

interface TrailPoint {
  lat: number;
  lng: number;
  treeId: string;
  checkedInAt: string;
}

interface MemoryTrailOptions {
  map: L.Map | null;
  userId: string | null;
  enabled: boolean;
}

export function useMemoryTrailLayer({ map, userId, enabled }: MemoryTrailOptions) {
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [trail, setTrail] = useState<TrailPoint[]>([]);

  // Fetch recent check-ins once
  useEffect(() => {
    if (!userId || !enabled || !isFeatureEnabled("memory-trails")) return;

    const fetchTrail = async () => {
      const { data } = await supabase
        .from("tree_checkins")
        .select("tree_id, checked_in_at, trees!inner(latitude, longitude)")
        .eq("user_id", userId)
        .order("checked_in_at", { ascending: false })
        .limit(20);

      if (!data) return;

      const points: TrailPoint[] = data
        .filter((d: any) => d.trees?.latitude && d.trees?.longitude)
        .map((d: any) => ({
          lat: Number(d.trees.latitude),
          lng: Number(d.trees.longitude),
          treeId: d.tree_id,
          checkedInAt: d.checked_in_at,
        }))
        .reverse(); // oldest first for path drawing

      setTrail(points);
    };

    fetchTrail();
  }, [userId, enabled]);

  // Draw the trail on the map
  useEffect(() => {
    if (!map || !enabled || trail.length < 2) {
      // Clean up
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      return;
    }

    const latlngs = trail.map(p => [p.lat, p.lng] as [number, number]);

    // Soft polyline
    const polyline = L.polyline(latlngs, {
      color: "hsl(42, 60%, 50%)",
      weight: 2,
      opacity: 0.35,
      dashArray: "6 8",
      lineCap: "round",
      lineJoin: "round",
    });
    polyline.addTo(map);
    polylineRef.current = polyline;

    // Small dots at each point — fade older ones
    const markers: L.CircleMarker[] = trail.map((p, i) => {
      const opacity = 0.2 + (i / trail.length) * 0.5; // older = fainter
      const isLast = i === trail.length - 1;
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: isLast ? 5 : 3,
        fillColor: isLast ? "hsl(42, 80%, 55%)" : "hsl(42, 50%, 45%)",
        fillOpacity: opacity,
        stroke: isLast,
        color: "hsl(42, 80%, 60%)",
        weight: isLast ? 1.5 : 0,
      });
      marker.addTo(map);
      return marker;
    });
    markersRef.current = markers;

    return () => {
      polyline.remove();
      markers.forEach(m => m.remove());
      polylineRef.current = null;
      markersRef.current = [];
    };
  }, [map, trail, enabled]);

  return { trail, hasTrail: trail.length >= 2 };
}
