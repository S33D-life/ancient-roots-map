/**
 * useDreamConstellationLayer — Renders Dream Tree glows and Dream Offering
 * particles on the Leaflet map. Viewport-bounded, debounced fetching.
 */
import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";

interface DreamTreePoint {
  tree_id: string;
  lat: number;
  lng: number;
  dreamer_count: number;
}

interface DreamOfferingPoint {
  tree_id: string;
  lat: number;
  lng: number;
  offering_count: number;
}

interface UseDreamConstellationOptions {
  map: L.Map | null;
  showDreamTrees: boolean;
  showDreamOfferings: boolean;
}

export function useDreamConstellationLayer({
  map,
  showDreamTrees,
  showDreamOfferings,
}: UseDreamConstellationOptions) {
  const dreamTreeLayerRef = useRef<L.LayerGroup | null>(null);
  const dreamOfferingLayerRef = useRef<L.LayerGroup | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [dreamTreeCount, setDreamTreeCount] = useState(0);
  const [dreamOfferingCount, setDreamOfferingCount] = useState(0);

  const fetchAndRender = useCallback(async () => {
    if (!map) return;

    const bounds = map.getBounds();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    // Clean previous layers
    if (dreamTreeLayerRef.current) {
      map.removeLayer(dreamTreeLayerRef.current);
      dreamTreeLayerRef.current = null;
    }
    if (dreamOfferingLayerRef.current) {
      map.removeLayer(dreamOfferingLayerRef.current);
      dreamOfferingLayerRef.current = null;
    }

    if (!showDreamTrees && !showDreamOfferings) return;

    // Fetch dream trees within viewport
    if (showDreamTrees) {
      const { data } = await supabase
        .from("tree_wishlist")
        .select("tree_id, trees!inner(latitude, longitude)")
        .gte("trees.latitude", south)
        .lte("trees.latitude", north)
        .gte("trees.longitude", west)
        .lte("trees.longitude", east)
        .limit(500);

      if (data && data.length > 0) {
        // Aggregate by tree_id
        const treeMap = new Map<string, DreamTreePoint>();
        data.forEach((d: any) => {
          const t = Array.isArray(d.trees) ? d.trees[0] : d.trees;
          if (!t?.latitude || !t?.longitude) return;
          const existing = treeMap.get(d.tree_id);
          if (existing) {
            existing.dreamer_count++;
          } else {
            treeMap.set(d.tree_id, {
              tree_id: d.tree_id,
              lat: t.latitude,
              lng: t.longitude,
              dreamer_count: 1,
            });
          }
        });

        const points = Array.from(treeMap.values());
        setDreamTreeCount(points.length);

        const layer = L.layerGroup();
        points.forEach((pt) => {
          const intensity = Math.min(pt.dreamer_count / 5, 1);
          const radius = 18 + intensity * 14;
          const opacity = 0.25 + intensity * 0.35;

          const icon = L.divIcon({
            className: "",
            iconSize: [radius * 2, radius * 2],
            iconAnchor: [radius, radius],
            html: `<div style="
              width: ${radius * 2}px;
              height: ${radius * 2}px;
              border-radius: 50%;
              background: radial-gradient(circle, hsla(280, 60%, 70%, ${opacity}) 0%, hsla(280, 50%, 60%, ${opacity * 0.4}) 50%, transparent 70%);
              box-shadow: 0 0 ${12 + intensity * 10}px hsla(280, 55%, 65%, ${opacity * 0.5});
              animation: pulse 3s ease-in-out infinite;
              animation-delay: ${Math.random() * 2}s;
              pointer-events: none;
            "></div>`,
          });

          L.marker([pt.lat, pt.lng], { icon, interactive: false }).addTo(layer);

          // Count badge
          if (pt.dreamer_count > 1) {
            const badge = L.divIcon({
              className: "",
              iconSize: [20, 14],
              iconAnchor: [10, -radius + 4],
              html: `<div style="
                font-size: 9px;
                font-family: serif;
                color: hsl(280, 70%, 80%);
                text-align: center;
                text-shadow: 0 0 4px hsla(280, 60%, 50%, 0.6);
                pointer-events: none;
              ">${pt.dreamer_count} ✦</div>`,
            });
            L.marker([pt.lat, pt.lng], { icon: badge, interactive: false }).addTo(layer);
          }
        });

        layer.addTo(map);
        dreamTreeLayerRef.current = layer;
      } else {
        setDreamTreeCount(0);
      }
    }

    // Fetch dream offerings (tree_wishlist entries with notes = expressions)
    if (showDreamOfferings) {
      const { data } = await supabase
        .from("tree_wishlist")
        .select("tree_id, notes, trees!inner(latitude, longitude)")
        .not("notes", "is", null)
        .gte("trees.latitude", south)
        .lte("trees.latitude", north)
        .gte("trees.longitude", west)
        .lte("trees.longitude", east)
        .limit(500);

      if (data && data.length > 0) {
        const treeMap = new Map<string, DreamOfferingPoint>();
        data.forEach((d: any) => {
          const t = Array.isArray(d.trees) ? d.trees[0] : d.trees;
          if (!t?.latitude || !t?.longitude) return;
          const existing = treeMap.get(d.tree_id);
          if (existing) {
            existing.offering_count++;
          } else {
            treeMap.set(d.tree_id, {
              tree_id: d.tree_id,
              lat: t.latitude,
              lng: t.longitude,
              offering_count: 1,
            });
          }
        });

        const points = Array.from(treeMap.values());
        setDreamOfferingCount(points.length);

        const layer = L.layerGroup();
        points.forEach((pt) => {
          const count = Math.min(pt.offering_count, 8);
          // Create small floating star particles
          for (let i = 0; i < Math.min(count, 4); i++) {
            const offsetX = (Math.random() - 0.5) * 24;
            const offsetY = (Math.random() - 0.5) * 24;
            const size = 4 + Math.random() * 4;
            const delay = Math.random() * 4;

            const icon = L.divIcon({
              className: "",
              iconSize: [size, size],
              iconAnchor: [size / 2 - offsetX, size / 2 - offsetY],
              html: `<div style="
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: hsla(42, 85%, 70%, 0.7);
                box-shadow: 0 0 ${size + 2}px hsla(42, 80%, 65%, 0.5);
                animation: pulse ${2.5 + Math.random()}s ease-in-out infinite;
                animation-delay: ${delay}s;
                pointer-events: none;
              "></div>`,
            });

            L.marker([pt.lat, pt.lng], { icon, interactive: false }).addTo(layer);
          }

          // Soft ethereal glow underneath
          if (count >= 2) {
            const glowSize = 20 + count * 3;
            const glowIcon = L.divIcon({
              className: "",
              iconSize: [glowSize, glowSize],
              iconAnchor: [glowSize / 2, glowSize / 2],
              html: `<div style="
                width: ${glowSize}px;
                height: ${glowSize}px;
                border-radius: 50%;
                background: radial-gradient(circle, hsla(42, 70%, 65%, 0.15) 0%, transparent 70%);
                pointer-events: none;
              "></div>`,
            });
            L.marker([pt.lat, pt.lng], { icon: glowIcon, interactive: false }).addTo(layer);
          }
        });

        layer.addTo(map);
        dreamOfferingLayerRef.current = layer;
      } else {
        setDreamOfferingCount(0);
      }
    }
  }, [map, showDreamTrees, showDreamOfferings]);

  // Debounced viewport listener
  useEffect(() => {
    if (!map) return;
    if (!showDreamTrees && !showDreamOfferings) {
      // Clean up
      if (dreamTreeLayerRef.current) { map.removeLayer(dreamTreeLayerRef.current); dreamTreeLayerRef.current = null; }
      if (dreamOfferingLayerRef.current) { map.removeLayer(dreamOfferingLayerRef.current); dreamOfferingLayerRef.current = null; }
      setDreamTreeCount(0);
      setDreamOfferingCount(0);
      return;
    }

    const onMove = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchAndRender, 400);
    };

    // Initial render
    fetchAndRender();

    map.on("moveend", onMove);
    return () => {
      map.off("moveend", onMove);
      clearTimeout(debounceRef.current);
      if (dreamTreeLayerRef.current) { map.removeLayer(dreamTreeLayerRef.current); dreamTreeLayerRef.current = null; }
      if (dreamOfferingLayerRef.current) { map.removeLayer(dreamOfferingLayerRef.current); dreamOfferingLayerRef.current = null; }
    };
  }, [map, showDreamTrees, showDreamOfferings, fetchAndRender]);

  return { dreamTreeCount, dreamOfferingCount };
}
