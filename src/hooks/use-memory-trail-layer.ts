/**
 * useMemoryTrailLayer — draws a soft polyline connecting
 * the user's recently visited trees on the map.
 *
 * Deduplicates repeat visits to the same tree.
 * Uses a dedicated pane so trails render below markers.
 * Single query on mount, cached, no polling.
 */
import { useEffect, useRef, useState } from "react";
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

const TRAIL_PANE = "memoryTrailPane";
const TRAIL_PANE_Z = 350; // Above tiles + signal field, below markers (400+)

export function useMemoryTrailLayer({ map, userId, enabled }: MemoryTrailOptions) {
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const fetchedRef = useRef(false);

  // Create dedicated pane
  useEffect(() => {
    if (!map) return;
    if (!map.getPane(TRAIL_PANE)) {
      map.createPane(TRAIL_PANE);
      const pane = map.getPane(TRAIL_PANE)!;
      pane.style.zIndex = String(TRAIL_PANE_Z);
      pane.style.pointerEvents = "none";
    }
  }, [map]);

  // Fetch recent check-ins once
  useEffect(() => {
    if (!userId || !enabled || !isFeatureEnabled("memory-trails")) return;
    if (fetchedRef.current) return; // Don't re-fetch on toggle

    const loadTrail = async () => {
      const { data } = await supabase
        .from("tree_checkins")
        .select("tree_id, checked_in_at, trees!inner(latitude, longitude)")
        .eq("user_id", userId)
        .order("checked_in_at", { ascending: false })
        .limit(30);

      if (!data) return;
      fetchedRef.current = true;

      // Deduplicate: keep the most recent visit per tree, maintain chronological order
      const seen = new Set<string>();
      const unique: TrailPoint[] = [];
      for (const d of data as any[]) {
        if (!d.trees?.latitude || !d.trees?.longitude) continue;
        if (seen.has(d.tree_id)) continue;
        seen.add(d.tree_id);
        unique.push({
          lat: Number(d.trees.latitude),
          lng: Number(d.trees.longitude),
          treeId: d.tree_id,
          checkedInAt: d.checked_in_at,
        });
      }

      // Reverse to oldest-first for path drawing
      unique.reverse();
      setTrail(unique);
    };

    loadTrail();
  }, [userId, enabled]);

  // Draw the trail on the map
  useEffect(() => {
    // Always clean up first
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!map || !enabled || trail.length < 2) return;

    const latlngs = trail.map(p => [p.lat, p.lng] as [number, number]);

    // Soft polyline — warm amber, dashed
    const polyline = L.polyline(latlngs, {
      color: "hsl(38, 50%, 48%)",
      weight: 1.5,
      opacity: 0.3,
      dashArray: "5 7",
      lineCap: "round",
      lineJoin: "round",
      pane: TRAIL_PANE,
    });
    polyline.addTo(map);
    polylineRef.current = polyline;

    // Small dots at each point — fade older ones
    const count = trail.length;
    const markers: L.CircleMarker[] = trail.map((p, i) => {
      const progress = i / (count - 1); // 0 = oldest, 1 = newest
      const isLast = i === count - 1;
      const opacity = 0.15 + progress * 0.45;

      return L.circleMarker([p.lat, p.lng], {
        radius: isLast ? 4.5 : 2.5,
        fillColor: isLast ? "hsl(38, 70%, 55%)" : "hsl(38, 40%, 45%)",
        fillOpacity: opacity,
        stroke: isLast,
        color: "hsl(38, 60%, 58%)",
        weight: isLast ? 1.5 : 0,
        pane: TRAIL_PANE,
      }).addTo(map);
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
