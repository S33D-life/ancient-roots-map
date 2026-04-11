/**
 * useMapOverlayLayers — Manages secondary visual layers on the map:
 * Seeds, Root Threads, Offering Glow, Harvest, Ancient Highlight,
 * Birdsong Heat, Bloomed Seeds, Seed Trail, Heart Glow (hex-bins),
 * Event Pulses, and Mycelial Network.
 *
 * Extracted from LeafletFallbackMap to reduce the monolith by ~800 lines.
 * Each layer follows the same pattern: create on toggle-on, destroy on toggle-off.
 */
import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import { getVisibleTrees, getTreeTier } from "@/components/map/mapMarkerUtils";
import { haversineKm } from "@/utils/mapGeometry";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  what3words: string;
  description?: string;
  estimated_age?: number | null;
  created_by?: string;
}

interface BloomedSeed {
  id: string;
  tree_id: string;
  latitude: number | null;
  longitude: number | null;
  blooms_at: string;
  planter_id: string;
}

interface BirdsongHeatPoint {
  tree_id: string;
  season: string | null;
  latitude: number;
  longitude: number;
}

interface OverlayLayerOptions {
  map: L.Map | null;
  trees: Tree[];
  filteredTrees: Tree[];
  bloomedSeeds: BloomedSeed[];
  birdsongHeatPoints: BirdsongHeatPoint[];
  offeringCounts: Record<string, number>;
  treeLookup: Map<string, { lat: number; lng: number }>;
  userId?: string | null;
  // Layer visibility
  showSeeds: boolean;
  showRootThreads: boolean;
  showOfferingGlow: boolean;
  showHarvestLayer: boolean;
  showAncientHighlight: boolean;
  showBirdsongHeat: boolean;
  showBloomedSeeds: boolean;
  showSeedTrail: boolean;
  showHeartGlow: boolean;
  birdsongSeason: string;
}

const SEASON_COLORS: Record<string, { fill: string; stroke: string }> = {
  spring: { fill: "hsla(120, 55%, 50%, 0.35)", stroke: "hsl(120, 55%, 50%)" },
  summer: { fill: "hsla(45, 80%, 50%, 0.35)", stroke: "hsl(45, 80%, 50%)" },
  autumn: { fill: "hsla(25, 75%, 50%, 0.35)", stroke: "hsl(25, 75%, 50%)" },
  winter: { fill: "hsla(200, 60%, 55%, 0.35)", stroke: "hsl(200, 60%, 55%)" },
  unknown: { fill: "hsla(270, 40%, 55%, 0.3)", stroke: "hsl(270, 40%, 55%)" },
};

export function useMapOverlayLayers({
  map,
  trees,
  filteredTrees,
  bloomedSeeds,
  birdsongHeatPoints,
  offeringCounts,
  treeLookup,
  userId,
  showSeeds,
  showRootThreads,
  showOfferingGlow,
  showHarvestLayer,
  showAncientHighlight,
  showBirdsongHeat,
  showBloomedSeeds,
  showSeedTrail,
  showHeartGlow,
  birdsongSeason,
}: OverlayLayerOptions) {
  const seedLayerRef = useRef<L.LayerGroup | null>(null);
  const rootThreadLayerRef = useRef<L.LayerGroup | null>(null);
  const offeringGlowLayerRef = useRef<L.LayerGroup | null>(null);
  const harvestLayerRef = useRef<L.LayerGroup | null>(null);
  const ancientHighlightLayerRef = useRef<L.LayerGroup | null>(null);
  const birdsongHeatLayerRef = useRef<L.LayerGroup | null>(null);
  const bloomedSeedLayerRef = useRef<L.LayerGroup | null>(null);
  const seedTrailLayerRef = useRef<L.LayerGroup | null>(null);
  const hexBinLayerRef = useRef<L.LayerGroup | null>(null);
  const harvestTreeIdsRef = useRef<Set<string>>(new Set());
  const bloomedSeedCountRef = useRef(0);
  const seedTrailCountRef = useRef(0);

  // ── Seeds layer ──
  useEffect(() => {
    if (!map) return;
    if (seedLayerRef.current) { map.removeLayer(seedLayerRef.current); seedLayerRef.current = null; }
    if (!showSeeds || bloomedSeeds.length === 0) return;

    const seedLayer = L.layerGroup();
    const treeCoordMap: Record<string, { lat: number; lng: number }> = {};
    trees.forEach((t) => { if (t.latitude && t.longitude) treeCoordMap[t.id] = { lat: t.latitude, lng: t.longitude }; });

    const seedsByTree: Record<string, number> = {};
    bloomedSeeds.forEach((s) => { seedsByTree[s.tree_id] = (seedsByTree[s.tree_id] || 0) + 1; });

    Object.entries(seedsByTree).forEach(([treeId, count]) => {
      const coords = treeCoordMap[treeId];
      if (!coords) return;
      const icon = L.divIcon({
        className: 'seed-heart-leaflet',
        html: `<span style="font-size:22px;">💚</span>${count > 1 ? `<span class="seed-count">${count}</span>` : ''}`,
        iconSize: [28, 28], iconAnchor: [14, 28],
      });
      const popupHtml = `<div style="padding:12px;font-family:'Cinzel',serif;min-width:180px;text-align:center;">
        <p style="margin:0;font-size:20px;">💚</p>
        <p style="margin:6px 0 2px;font-size:14px;color:hsl(120,50%,60%);font-weight:700;">${count} Bloomed Heart${count !== 1 ? 's' : ''}</p>
        <p style="margin:0 0 8px;font-size:11px;color:hsl(42,50%,55%);">Ready to collect — visit this tree!</p>
        <a href="/tree/${encodeURIComponent(treeId)}" style="display:block;padding:8px 0;text-align:center;font-size:12px;color:hsl(80,20%,8%);background:linear-gradient(135deg,hsl(120,50%,45%),hsl(80,60%,50%));border-radius:6px;text-decoration:none;letter-spacing:0.06em;font-weight:600;">Collect Hearts ⟶</a>
      </div>`;
      L.marker([coords.lat, coords.lng], { icon, zIndexOffset: 500 })
        .bindPopup(popupHtml, { className: 'atlas-leaflet-popup', maxWidth: 240, closeButton: true })
        .addTo(seedLayer);
    });

    seedLayer.addTo(map);
    seedLayerRef.current = seedLayer;
    return () => { if (map.hasLayer(seedLayer)) map.removeLayer(seedLayer); };
  }, [bloomedSeeds, trees, showSeeds, map]);

  // ── Root Threads ──
  useEffect(() => {
    if (!map) return;
    if (rootThreadLayerRef.current) { map.removeLayer(rootThreadLayerRef.current); rootThreadLayerRef.current = null; }
    if (!showRootThreads || filteredTrees.length < 2) return;

    const threadLayer = L.layerGroup();
    const visible = getVisibleTrees(map, filteredTrees, 0.2);
    if (visible.length < 2 || visible.length > 400) { threadLayer.addTo(map); rootThreadLayerRef.current = threadLayer; return; }

    const bySpecies: Record<string, Tree[]> = {};
    visible.forEach((t) => { const key = t.species.toLowerCase(); if (!bySpecies[key]) bySpecies[key] = []; bySpecies[key].push(t); });

    const MAX_DIST_KM = 80;
    const drawn = new Set<string>();
    const MAX_THREADS = 300;
    let threadCount = 0;

    Object.entries(bySpecies).forEach(([, group]) => {
      if (group.length < 2 || threadCount >= MAX_THREADS) return;
      for (let i = 0; i < group.length && threadCount < MAX_THREADS; i++) {
        for (let j = i + 1; j < group.length && threadCount < MAX_THREADS; j++) {
          const a = group[i], b = group[j];
          const dist = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
          if (dist > MAX_DIST_KM) continue;
          const pairKey = [a.id, b.id].sort().join("-");
          if (drawn.has(pairKey)) continue;
          drawn.add(pairKey);
          const opacity = Math.max(0.15, 0.6 * (1 - dist / MAX_DIST_KM));
          L.polyline([[a.latitude, a.longitude], [b.latitude, b.longitude]], {
            color: "hsl(42, 80%, 55%)", weight: dist < 20 ? 2 : 1.5, opacity, dashArray: "6 8", interactive: false,
          }).addTo(threadLayer);
          threadCount++;
        }
      }
    });

    threadLayer.addTo(map);
    rootThreadLayerRef.current = threadLayer;
    return () => { if (map.hasLayer(threadLayer)) map.removeLayer(threadLayer); };
  }, [filteredTrees, showRootThreads, map]);

  // ── Offering Glow ──
  useEffect(() => {
    if (!map) return;
    if (offeringGlowLayerRef.current) { map.removeLayer(offeringGlowLayerRef.current); offeringGlowLayerRef.current = null; }
    if (!showOfferingGlow) return;

    const glowLayer = L.layerGroup();
    const visible = getVisibleTrees(map, filteredTrees, 0.05);

    visible.forEach((tree) => {
      const count = offeringCounts[tree.id] || 0;
      if (count === 0) return;
      const radius = Math.min(12 + count * 3, 36);
      const intensity = Math.min(0.25 + count * 0.08, 0.7);

      L.circleMarker([tree.latitude, tree.longitude], {
        radius: radius + 6, color: "hsl(42, 85%, 55%)", fillColor: "hsl(42, 90%, 60%)",
        fillOpacity: intensity * 0.3, weight: 0, interactive: false,
      }).addTo(glowLayer);

      L.circleMarker([tree.latitude, tree.longitude], {
        radius, color: "hsl(42, 85%, 55%)", fillColor: "hsl(42, 90%, 65%)",
        fillOpacity: intensity, weight: 1.5, opacity: 0.6, interactive: false,
      }).addTo(glowLayer);

      const badgeIcon = L.divIcon({
        html: `<span style="background:hsl(42,80%,50%);color:hsl(30,10%,10%);font-size:9px;font-weight:700;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px hsla(42,90%,55%,0.6);font-family:monospace;">${count}</span>`,
        className: "offering-count-badge", iconSize: L.point(18, 18), iconAnchor: L.point(9, -4),
      });
      L.marker([tree.latitude, tree.longitude], { icon: badgeIcon, interactive: false }).addTo(glowLayer);
    });

    glowLayer.addTo(map);
    offeringGlowLayerRef.current = glowLayer;
    return () => { if (map.hasLayer(glowLayer)) map.removeLayer(glowLayer); };
  }, [filteredTrees, showOfferingGlow, map]);

  // ── Harvest Layer ──
  useEffect(() => {
    if (!showHarvestLayer) return;
    (async () => {
      const { data } = await supabase.from("harvest_listings").select("tree_id").not("tree_id", "is", null).in("status", ["available", "upcoming"]);
      if (data) harvestTreeIdsRef.current = new Set(data.map(d => d.tree_id).filter(Boolean) as string[]);
    })();
  }, [showHarvestLayer]);

  useEffect(() => {
    if (!map) return;
    if (harvestLayerRef.current) { map.removeLayer(harvestLayerRef.current); harvestLayerRef.current = null; }
    if (!showHarvestLayer || harvestTreeIdsRef.current.size === 0) return;

    const layer = L.layerGroup();
    const visible = getVisibleTrees(map, filteredTrees, 0.05);
    visible.forEach((tree) => {
      if (!harvestTreeIdsRef.current.has(tree.id)) return;
      L.circleMarker([tree.latitude, tree.longitude], {
        radius: 18, color: "hsl(25, 75%, 50%)", fillColor: "hsl(30, 80%, 55%)",
        fillOpacity: 0.2, weight: 1.5, opacity: 0.5, interactive: false,
      }).addTo(layer);
      const badgeIcon = L.divIcon({
        html: `<span style="background:hsl(25,70%,45%);color:hsl(45,95%,90%);font-size:11px;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px hsla(25,80%,50%,0.5);pointer-events:none;">🍎</span>`,
        className: "harvest-badge", iconSize: L.point(22, 22), iconAnchor: L.point(11, -6),
      });
      L.marker([tree.latitude, tree.longitude], { icon: badgeIcon, interactive: false }).addTo(layer);
    });
    layer.addTo(map);
    harvestLayerRef.current = layer;
    return () => { if (map.hasLayer(layer)) map.removeLayer(layer); };
  }, [filteredTrees, showHarvestLayer, map]);

  // ── Ancient Highlight ──
  useEffect(() => {
    if (!map) return;
    if (ancientHighlightLayerRef.current) { map.removeLayer(ancientHighlightLayerRef.current); ancientHighlightLayerRef.current = null; }
    if (!showAncientHighlight) return;

    const layer = L.layerGroup();
    const visible = getVisibleTrees(map, filteredTrees, 0.05);
    visible.forEach((tree) => {
      const age = tree.estimated_age || 0;
      const offerings = offeringCounts[tree.id] || 0;
      if (getTreeTier(age, offerings) !== "ancient") return;

      L.circleMarker([tree.latitude, tree.longitude], {
        radius: 24, color: "hsl(42, 90%, 55%)", fillColor: "hsl(42, 85%, 60%)",
        fillOpacity: 0.15, weight: 2, opacity: 0.6, interactive: false,
      }).addTo(layer);
      L.circleMarker([tree.latitude, tree.longitude], {
        radius: 16, color: "hsl(42, 80%, 50%)", fillColor: "hsl(42, 90%, 65%)",
        fillOpacity: 0.25, weight: 1.5, opacity: 0.7, interactive: false,
      }).addTo(layer);
      const crownIcon = L.divIcon({
        html: `<span style="font-size:13px;filter:drop-shadow(0 0 4px hsla(42,90%,55%,0.7));pointer-events:none;">👑</span>`,
        className: "ancient-crown-badge", iconSize: L.point(18, 18), iconAnchor: L.point(9, 28),
      });
      L.marker([tree.latitude, tree.longitude], { icon: crownIcon, interactive: false }).addTo(layer);
    });
    layer.addTo(map);
    ancientHighlightLayerRef.current = layer;
    return () => { if (map.hasLayer(layer)) map.removeLayer(layer); };
  }, [filteredTrees, showAncientHighlight, map]);

  // ── Birdsong Heatmap ──
  useEffect(() => {
    if (!map) return;
    if (birdsongHeatLayerRef.current) { map.removeLayer(birdsongHeatLayerRef.current); birdsongHeatLayerRef.current = null; }
    if (!showBirdsongHeat || birdsongHeatPoints.length === 0) return;

    const heatLayer = L.layerGroup();
    const grouped: Record<string, { lat: number; lng: number; seasons: Record<string, number> }> = {};
    birdsongHeatPoints.forEach((pt) => {
      if (!grouped[pt.tree_id]) grouped[pt.tree_id] = { lat: pt.latitude, lng: pt.longitude, seasons: {} };
      const s = pt.season || "unknown";
      grouped[pt.tree_id].seasons[s] = (grouped[pt.tree_id].seasons[s] || 0) + 1;
    });

    Object.values(grouped).forEach((g) => {
      const totalAtTree = Object.values(g.seasons).reduce((a, b) => a + b, 0);
      const baseRadius = Math.min(8 + totalAtTree * 2, 28);
      let ringIndex = 0;
      Object.entries(g.seasons).forEach(([season, count]) => {
        if (birdsongSeason !== "all" && birdsongSeason !== season) return;
        const colors = SEASON_COLORS[season] || SEASON_COLORS.unknown;
        const r = baseRadius - ringIndex * 3;
        const intensity = Math.min(0.2 + count * 0.1, 0.7);
        L.circleMarker([g.lat, g.lng], {
          radius: r, color: colors.stroke, fillColor: colors.fill,
          fillOpacity: intensity, weight: 1.5, opacity: 0.7, interactive: false,
        }).addTo(heatLayer);
        ringIndex++;
      });

      const filteredTotal = birdsongSeason === "all" ? totalAtTree : (g.seasons[birdsongSeason] || 0);
      if (filteredTotal > 0) {
        const badgeIcon = L.divIcon({
          html: `<span style="background:hsla(200,50%,15%,0.9);color:hsl(200,60%,75%);font-size:9px;font-weight:700;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;border:1px solid hsla(200,50%,45%,0.5);font-family:monospace;">🐦${filteredTotal > 1 ? filteredTotal : ''}</span>`,
          className: "birdsong-heat-badge", iconSize: L.point(18, 18), iconAnchor: L.point(9, -6),
        });
        L.marker([g.lat, g.lng], { icon: badgeIcon, interactive: false }).addTo(heatLayer);
      }
    });

    heatLayer.addTo(map);
    birdsongHeatLayerRef.current = heatLayer;
    return () => { if (map.hasLayer(heatLayer)) map.removeLayer(heatLayer); };
  }, [birdsongHeatPoints, showBirdsongHeat, birdsongSeason, map]);

  // ── Bloomed Seeds (from DB) ──
  useEffect(() => {
    if (!map) return;
    if (bloomedSeedLayerRef.current) { map.removeLayer(bloomedSeedLayerRef.current); bloomedSeedLayerRef.current = null; }
    if (!showBloomedSeeds) { bloomedSeedCountRef.current = 0; return; }

    (async () => {
      const now = new Date().toISOString();
      const { data } = await supabase.from("planted_seeds")
        .select("id, latitude, longitude, tree_id, blooms_at, planter_id")
        .is("collected_at", null).lte("blooms_at", now)
        .not("latitude", "is", null).not("longitude", "is", null).limit(200);

      if (!data || data.length === 0) { bloomedSeedCountRef.current = 0; return; }
      bloomedSeedCountRef.current = data.length;

      const layer = L.layerGroup();
      data.forEach((seed: any) => {
        const seedIcon = L.divIcon({
          className: "bloomed-seed-marker",
          html: `<div style="width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,hsla(120,70%,60%,0.9),hsla(120,60%,40%,0.5));box-shadow:0 0 12px hsla(120,70%,55%,0.6);animation:seedPulse 2s ease-in-out infinite;border:2px solid hsla(120,80%,70%,0.7);"></div>`,
          iconSize: [18, 18], iconAnchor: [9, 9],
        });
        L.marker([seed.latitude, seed.longitude], { icon: seedIcon })
          .bindPopup(`<div style="font-family:serif;text-align:center;"><div style="font-size:13px;color:hsl(120,50%,40%)">🌱 Bloomed Seed</div><div style="font-size:10px;color:#888;margin-top:2px">Ready to collect</div></div>`)
          .addTo(layer);
      });
      layer.addTo(map);
      bloomedSeedLayerRef.current = layer;
    })();

    return () => { if (bloomedSeedLayerRef.current && map.hasLayer(bloomedSeedLayerRef.current)) map.removeLayer(bloomedSeedLayerRef.current); };
  }, [showBloomedSeeds, map]);

  // ── Seed Trail ──
  useEffect(() => {
    if (!map) return;
    if (seedTrailLayerRef.current) { map.removeLayer(seedTrailLayerRef.current); seedTrailLayerRef.current = null; }
    if (!showSeedTrail || !userId) { seedTrailCountRef.current = 0; return; }

    (async () => {
      const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
      const { data: seeds } = await supabase.from("planted_seeds")
        .select("id, tree_id, planted_at, latitude, longitude")
        .eq("planter_id", userId).gte("planted_at", midnight.toISOString())
        .order("planted_at", { ascending: true }).limit(100);

      if (!seeds || seeds.length === 0) { seedTrailCountRef.current = 0; return; }

      const needsCoords = seeds.filter((s: any) => !s.latitude || !s.longitude);
      let treeCoordMap: Record<string, { lat: number; lng: number }> = {};
      if (needsCoords.length > 0) {
        const treeIds = [...new Set(needsCoords.map((s: any) => s.tree_id))];
        const { data: treeData } = await supabase.from("trees").select("id, latitude, longitude").in("id", treeIds);
        (treeData || []).forEach((t: any) => { if (t.latitude && t.longitude) treeCoordMap[t.id] = { lat: t.latitude, lng: t.longitude }; });
      }

      const points: [number, number][] = [];
      const layer = L.layerGroup();
      seedTrailCountRef.current = seeds.length;

      seeds.forEach((seed: any, idx: number) => {
        const lat = seed.latitude || treeCoordMap[seed.tree_id]?.lat;
        const lng = seed.longitude || treeCoordMap[seed.tree_id]?.lng;
        if (!lat || !lng) return;
        points.push([lat, lng]);
        const age = (Date.now() - new Date(seed.planted_at).getTime()) / 3600000;
        const opacity = Math.max(0.4, 1 - age / 24);
        const sproutIcon = L.divIcon({
          className: "seed-trail-marker",
          html: `<div style="width:14px;height:14px;border-radius:50%;background:radial-gradient(circle,hsla(42,85%,60%,${opacity}),hsla(42,70%,45%,${opacity*0.4}));box-shadow:0 0 8px hsla(42,80%,55%,${opacity*0.5});border:1.5px solid hsla(42,90%,70%,${opacity*0.6});animation:seedTrailPulse 3s ease-in-out infinite;animation-delay:${idx*0.2}s;"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7],
        });
        L.marker([lat, lng], { icon: sproutIcon, zIndexOffset: 600 }).addTo(layer);
      });

      if (points.length >= 2) {
        L.polyline(points, { color: "hsla(42,75%,55%,0.3)", weight: 2, dashArray: "6,8", lineCap: "round", lineJoin: "round" }).addTo(layer);
      }
      layer.addTo(map);
      seedTrailLayerRef.current = layer;
    })();

    return () => { if (seedTrailLayerRef.current && map.hasLayer(seedTrailLayerRef.current)) map.removeLayer(seedTrailLayerRef.current); };
  }, [showSeedTrail, userId, map]);

  // ── Heart Glow (tree-anchored offering density) ──
  useEffect(() => {
    if (!map) return;
    if (!showHeartGlow) {
      if (hexBinLayerRef.current && map.hasLayer(hexBinLayerRef.current)) { map.removeLayer(hexBinLayerRef.current); hexBinLayerRef.current = null; }
      return;
    }

    const loadHeartGlow = async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from("offerings").select("tree_id").gte("created_at", cutoff).limit(500);
      if (!data || data.length === 0) return;

      // Count offerings per tree — only render at valid tree coordinates
      const countByTree: Record<string, number> = {};
      for (const o of data) {
        if (!o.tree_id) continue;
        countByTree[o.tree_id] = (countByTree[o.tree_id] || 0) + 1;
      }

      if (hexBinLayerRef.current) map.removeLayer(hexBinLayerRef.current);
      const hexLayer = L.layerGroup();
      const maxCount = Math.max(...Object.values(countByTree), 1);

      Object.entries(countByTree).forEach(([treeId, count]) => {
        const loc = treeLookup.get(treeId);
        if (!loc) return; // Skip hearts with no valid tree anchor

        const intensity = Math.min(count / maxCount, 1);
        const radius = 8 + intensity * 20;
        const opacity = 0.15 + intensity * 0.45;
        const icon = L.divIcon({
          className: "heart-glow-tree-marker",
          html: `<div style="width:${radius*2}px;height:${radius*2}px;border-radius:50%;background:radial-gradient(circle,hsla(42,80%,55%,${opacity}) 0%,hsla(42,70%,45%,${opacity*0.3}) 60%,transparent 100%);box-shadow:0 0 ${radius}px hsla(42,80%,55%,${opacity*0.4});transform:translate(-50%,-50%);pointer-events:none;"></div>`,
          iconSize: [radius * 2, radius * 2], iconAnchor: [radius, radius],
        });
        L.marker([loc.lat, loc.lng], { icon, interactive: false }).addTo(hexLayer);
      });

      hexLayer.addTo(map);
      hexBinLayerRef.current = hexLayer;
    };

    loadHeartGlow();
    const debounced = (() => { let t: ReturnType<typeof setTimeout>; return () => { clearTimeout(t); t = setTimeout(loadHeartGlow, 800); }; })();
    map.on("moveend", debounced);

    return () => {
      map.off("moveend", debounced);
      if (hexBinLayerRef.current && map.hasLayer(hexBinLayerRef.current)) { map.removeLayer(hexBinLayerRef.current); hexBinLayerRef.current = null; }
    };
  }, [showHeartGlow, treeLookup, map]);

  return {
    harvestTreeIds: harvestTreeIdsRef.current,
    bloomedSeedCount: bloomedSeedCountRef.current,
    seedTrailCount: seedTrailCountRef.current,
  };
}
