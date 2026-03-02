/**
 * HiveFruitLayer — Renders subtle fruit indicators over tree clusters
 * that belong to hives currently in a fruiting/harvest/peak phase.
 * 
 * Clicking a fruit indicator opens HiveFruitPreview.
 * Seasonal calculations cached per session (computed once from food_cycles).
 */
import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import { getHiveForSpecies, type HiveInfo } from "@/utils/hiveUtils";
import type { HiveSeasonalStatus } from "@/hooks/use-hive-seasonal-status";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
}

interface HiveFruitLayerProps {
  map: L.Map | null;
  trees: Tree[];
  fruitingHives: HiveSeasonalStatus[];
  activeHiveFamily: string | null;
  onFruitClick: (hive: HiveInfo, treeCount: number, lat: number, lng: number, status: HiveSeasonalStatus) => void;
}

export default function HiveFruitLayer({
  map,
  trees,
  fruitingHives,
  activeHiveFamily,
  onFruitClick,
}: HiveFruitLayerProps) {
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Compute which trees belong to fruiting hives
  const fruitData = useMemo(() => {
    if (fruitingHives.length === 0) return [];

    const fruitingFamilies = new Set(fruitingHives.map(h => h.hive.family));
    
    // If activeHiveFamily is set, only show that hive
    const targetFamilies = activeHiveFamily 
      ? new Set([activeHiveFamily].filter(f => fruitingFamilies.has(f)))
      : fruitingFamilies;

    if (targetFamilies.size === 0) return [];

    // Group trees by hive family
    const hiveGroups = new Map<string, { hive: HiveInfo; trees: Tree[]; status: HiveSeasonalStatus }>();

    for (const tree of trees) {
      const hive = getHiveForSpecies(tree.species);
      if (!hive || !targetFamilies.has(hive.family)) continue;

      if (!hiveGroups.has(hive.family)) {
        const status = fruitingHives.find(h => h.hive.family === hive.family)!;
        hiveGroups.set(hive.family, { hive, trees: [], status });
      }
      hiveGroups.get(hive.family)!.trees.push(tree);
    }

    // Create cluster centroids for each hive group
    const clusters: Array<{
      lat: number;
      lng: number;
      hive: HiveInfo;
      status: HiveSeasonalStatus;
      treeCount: number;
      emoji: string;
    }> = [];

    for (const [, group] of hiveGroups) {
      if (group.trees.length === 0) continue;

      // Simple centroid
      const lat = group.trees.reduce((s, t) => s + t.latitude, 0) / group.trees.length;
      const lng = group.trees.reduce((s, t) => s + t.longitude, 0) / group.trees.length;

      clusters.push({
        lat,
        lng,
        hive: group.hive,
        status: group.status,
        treeCount: group.trees.length,
        emoji: group.status.fruitIcon || group.status.emoji,
      });
    }

    return clusters;
  }, [trees, fruitingHives, activeHiveFamily]);

  useEffect(() => {
    if (!map) return;

    // Clean up previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (fruitData.length === 0) return;

    const layer = L.layerGroup();

    for (const cluster of fruitData) {
      const icon = L.divIcon({
        className: "hive-fruit-indicator",
        html: `<div class="hive-fruit-dot" style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: hsla(${cluster.hive.accentHsl} / 0.2);
          border: 1.5px solid hsla(${cluster.hive.accentHsl} / 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 0 12px hsla(${cluster.hive.accentHsl} / 0.3);
          transition: transform 0.2s ease, box-shadow 0.3s ease;
          pointer-events: auto;
        " title="${cluster.hive.displayName} — ${cluster.status.label}">
          ${cluster.emoji}
        </div>`,
        iconSize: L.point(28, 28),
        iconAnchor: L.point(14, 14),
      });

      const marker = L.marker([cluster.lat, cluster.lng], {
        icon,
        interactive: true,
        zIndexOffset: 500,
      });

      marker.on("click", () => {
        onFruitClick(
          cluster.hive,
          cluster.treeCount,
          cluster.lat,
          cluster.lng,
          cluster.status,
        );
      });

      layer.addLayer(marker);
    }

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, fruitData, onFruitClick]);

  return null;
}
