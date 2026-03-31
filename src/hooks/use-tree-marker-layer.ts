/**
 * useTreeMarkerLayer — Manages the Leaflet MarkerClusterGroup with
 * diff-based updates instead of full destroy/rebuild on every filter change.
 *
 * Performance improvement:
 * - Previous: O(n) marker creation on every filter toggle
 * - Now: O(delta) — only adds/removes changed markers
 * - Full rebuild only when clustering config changes
 */
import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import {
  type Tier,
  getTreeTier,
  getOrCreateIcon,
  hslStringToHue,
} from "@/components/map/mapMarkerUtils";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import { buildPopupHtml, getPopupStatusLight } from "@/utils/mapPopups";
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

interface MarkerLayerConfig {
  lineageFilter: string;
  groveScale: string;
  showHiveLayer: boolean;
}

interface MarkerLayerRefs {
  offeringCounts: Record<string, number>;
  birdsongCounts: Record<string, number>;
  whisperCounts: Record<string, number>;
  treePhotos: Record<string, string>;
  heartPoolCounts: Record<string, number>;
  userLatLng: [number, number] | null;
}

interface UseTreeMarkerLayerOptions {
  map: L.Map | null;
  filteredTrees: Tree[];
  config: MarkerLayerConfig;
  refs: MarkerLayerRefs;
  userLatLng: [number, number] | null;
  debugEnabled: boolean;
  onClusterRef?: (cluster: any) => void;
  onPerfUpdate?: (stats: { markerCount: number; clusterCount: number; renderMs: number }) => void;
}

/**
 * Compute a config key that determines when the cluster group needs full rebuild
 * vs when a diff-based update suffices.
 */
function getClusterConfigKey(config: MarkerLayerConfig, treeCount: number): string {
  // Cluster config depends on these values
  return `${config.lineageFilter}|${config.groveScale}|${config.showHiveLayer}|${
    treeCount > 500 ? "hi" : treeCount > 200 ? "med" : "lo"
  }`;
}

export function useTreeMarkerLayer({
  map,
  filteredTrees,
  config,
  refs,
  userLatLng,
  debugEnabled,
  onClusterRef,
  onPerfUpdate,
}: UseTreeMarkerLayerOptions) {
  const clusterRef = useRef<any>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());
  const configKeyRef = useRef<string>("");
  const hasFittedRef = useRef(false);

  // Create a marker for a tree
  const createMarker = useCallback(
    (tree: Tree) => {
      const offerings = refs.offeringCounts[tree.id] || 0;
      const age = tree.estimated_age || 0;
      const bCount = refs.birdsongCounts[tree.id] || 0;
      const tier = getTreeTier(age, offerings);
      const hiveHue = config.showHiveLayer
        ? (() => {
            const h = getHiveForSpecies(tree.species);
            return h ? hslStringToHue(h.accentHsl) : undefined;
          })()
        : undefined;
      const icon = getOrCreateIcon(tier, tree.species, bCount, hiveHue);
      const wCount = refs.whisperCounts[tree.id] || 0;
      const hCount = refs.heartPoolCounts[tree.id] || 0;

      const marker = L.marker([tree.latitude, tree.longitude], { icon });
      marker.on("add", () => {
        const el = (marker as any)._icon;
        if (!el) return;
        if (wCount > 0) el.classList.add("whisper-glow");
        if (hCount > 0) el.classList.add("heart-available");
      });
      (marker as any)._treeLineage = (tree as any).lineage || null;
      (marker as any)._treeSpecies = tree.species || null;
      (marker as any)._treeId = tree.id;
      (marker as any)._treeName = tree.name;
      (marker as any)._whisperCount = wCount;
      marker.bindPopup(
        () =>
          buildPopupHtml(
            tree,
            refs.offeringCounts[tree.id] || 0,
            age,
            refs.treePhotos[tree.id],
            refs.birdsongCounts[tree.id] || 0,
            refs.whisperCounts[tree.id] || 0,
            refs.userLatLng,
            getPopupStatusLight(tree.id, tree.latitude, tree.longitude, refs.userLatLng),
            refs.heartPoolCounts[tree.id] || 0,
          ),
        {
          className: "atlas-leaflet-popup",
          maxWidth: 280,
          closeButton: true,
          autoPanPadding: L.point(20, 60),
        }
      );
      return marker;
    },
    [config.showHiveLayer, refs]
  );

  // Build cluster group with current config
  const createClusterGroup = useCallback(
    (treeCount: number) => {
      const isLineageFocused = config.lineageFilter !== "all";
      const isGroveFocused = config.groveScale !== "all";
      const tightCluster = isLineageFocused || isGroveFocused;

      const disableZoom =
        config.groveScale === "hyper_local"
          ? 14
          : config.groveScale === "local"
          ? 15
          : tightCluster
          ? 16
          : treeCount <= 50
          ? 15
          : treeCount <= 200
          ? 16
          : treeCount <= 500
          ? 17
          : 18;

      return (L as any).markerClusterGroup({
        maxClusterRadius: (zoom: number) => {
          const df = Math.min(
            1.35,
            Math.max(0.7, 0.55 + Math.log10(Math.max(treeCount, 1)) * 0.25)
          );

          if (config.groveScale === "hyper_local") {
            return zoom <= 12 ? 35 : zoom <= 14 ? 20 : 10;
          }
          if (config.groveScale === "local") {
            const base =
              zoom <= 8 ? 50 : zoom <= 10 ? 42 : zoom <= 12 ? 32 : zoom <= 14 ? 24 : zoom <= 16 ? 16 : 12;
            return Math.round(base * df);
          }
          if (tightCluster) {
            const base =
              zoom <= 4
                ? 60
                : zoom <= 6
                ? 52
                : zoom <= 8
                ? 44
                : zoom <= 10
                ? 36
                : zoom <= 12
                ? 26
                : zoom <= 14
                ? 20
                : zoom <= 16
                ? 14
                : 10;
            return Math.round(base * df);
          }

          const breakpoints: [number, number][] = [
            [2, 80], [4, 72], [6, 62], [8, 52], [10, 42],
            [12, 34], [14, 26], [16, 18], [18, 14],
          ];

          let base: number;
          if (zoom <= breakpoints[0][0]) {
            base = breakpoints[0][1];
          } else if (zoom >= breakpoints[breakpoints.length - 1][0]) {
            base = breakpoints[breakpoints.length - 1][1];
          } else {
            let lo = breakpoints[0],
              hi = breakpoints[breakpoints.length - 1];
            for (let i = 0; i < breakpoints.length - 1; i++) {
              if (zoom >= breakpoints[i][0] && zoom <= breakpoints[i + 1][0]) {
                lo = breakpoints[i];
                hi = breakpoints[i + 1];
                break;
              }
            }
            const t = (zoom - lo[0]) / (hi[0] - lo[0]);
            base = lo[1] + (hi[1] - lo[1]) * t;
          }

          return Math.round(base * df);
        },
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        animate: true,
        animateAddingMarkers: false,
        disableClusteringAtZoom: disableZoom,
        chunkedLoading: true,
        chunkInterval: treeCount > 500 ? 100 : treeCount > 200 ? 80 : 50,
        chunkDelay: treeCount > 500 ? 12 : 8,
        spiderfyDistanceMultiplier: 2.0,
        spiderLegPolylineOptions: {
          weight: 1.5,
          color: tightCluster
            ? "hsla(120, 50%, 45%, 0.45)"
            : "hsla(42, 60%, 50%, 0.4)",
          opacity: 0.6,
        },
        iconCreateFunction: (cluster: any) => createClusterIcon(cluster, isLineageFocused),
      });
    },
    [config.lineageFilter, config.groveScale]
  );

  useEffect(() => {
    if (!map) return;
    const renderStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    const newConfigKey = getClusterConfigKey(config, filteredTrees.length);
    const configChanged = newConfigKey !== configKeyRef.current;
    configKeyRef.current = newConfigKey;

    const currentMarkers = markerMapRef.current;
    const newTreeIds = new Set(filteredTrees.map((t) => t.id));

    // If config changed or no cluster exists → full rebuild
    if (configChanged || !clusterRef.current) {
      // Clean up old cluster
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
      currentMarkers.clear();

      const clusterGroup = createClusterGroup(filteredTrees.length);

      filteredTrees.forEach((tree) => {
        const marker = createMarker(tree);
        currentMarkers.set(tree.id, marker);
        clusterGroup.addLayer(marker);
      });

      map.addLayer(clusterGroup);
      clusterRef.current = clusterGroup;
      onClusterRef?.(clusterGroup);
    } else {
      // Diff-based update — only add/remove changed markers
      const cluster = clusterRef.current;
      const existingIds = new Set(currentMarkers.keys());

      // Removed trees
      const toRemove: L.Marker[] = [];
      existingIds.forEach((id) => {
        if (!newTreeIds.has(id)) {
          const marker = currentMarkers.get(id);
          if (marker) {
            toRemove.push(marker);
            currentMarkers.delete(id);
          }
        }
      });

      // Added trees
      const toAdd: L.Marker[] = [];
      const treeMap = new Map(filteredTrees.map((t) => [t.id, t]));
      newTreeIds.forEach((id) => {
        if (!existingIds.has(id)) {
          const tree = treeMap.get(id);
          if (tree) {
            const marker = createMarker(tree);
            currentMarkers.set(id, marker);
            toAdd.push(marker);
          }
        }
      });

      // Batch remove then add for efficiency
      if (toRemove.length > 0) {
        cluster.removeLayers(toRemove);
      }
      if (toAdd.length > 0) {
        cluster.addLayers(toAdd);
      }

      if (debugEnabled && (toRemove.length > 0 || toAdd.length > 0)) {
        console.log(
          `[MapPerf] Diff update: +${toAdd.length} -${toRemove.length} (total: ${currentMarkers.size})`
        );
      }
    }

    // Clustering adjustment on zoom/move
    const lastState = { zoom: -1, densityBand: -1, timerHandle: 0 as any };
    const computeDensityBand = (count: number) =>
      count > 200 ? 4 : count > 80 ? 3 : count > 30 ? 2 : 1;

    const adjustClustering = () => {
      if (!clusterRef.current) return;
      const z = map.getZoom();
      const zoomChanged = Math.abs(z - lastState.zoom) >= 0.5;

      if (lastState.timerHandle) clearTimeout(lastState.timerHandle);

      const delay = zoomChanged ? 120 : 200;
      lastState.timerHandle = setTimeout(() => {
        lastState.timerHandle = 0;
        const currentZ = map.getZoom();
        const bounds = map.getBounds();
        let visibleCount = 0;
        filteredTrees.forEach((t) => {
          if (bounds.contains([t.latitude, t.longitude])) visibleCount++;
        });
        const band = computeDensityBand(visibleCount);
        const zoomBand = Math.floor(currentZ);
        const prevZoomBand = Math.floor(lastState.zoom);
        if (zoomBand === prevZoomBand && band === lastState.densityBand) return;

        const opts = (clusterRef.current as any).options;
        const MAX_SPIDERFY = 2.8;
        const rawSpiderfy =
          currentZ >= 18 ? 3.0 : currentZ >= 16 ? 2.5 : currentZ >= 14 ? 2.2 : 2.0;
        opts.spiderfyDistanceMultiplier = Math.min(rawSpiderfy, MAX_SPIDERFY);

        const newDisable =
          band >= 4 ? 18 : band >= 3 ? 17 : band >= 2 ? 16 : 15;
        if (opts.disableClusteringAtZoom !== newDisable) {
          opts.disableClusteringAtZoom = newDisable;
          map.removeLayer(clusterRef.current);
          map.addLayer(clusterRef.current);
        }

        opts.chunkInterval = visibleCount > 300 ? 120 : visibleCount > 100 ? 80 : 50;
        opts.chunkDelay = visibleCount > 300 ? 14 : visibleCount > 100 ? 10 : 6;

        lastState.zoom = currentZ;
        lastState.densityBand = band;
      }, delay);
    };

    map.on("zoomend", adjustClustering);
    map.on("moveend", adjustClustering);

    // Initial clustering calculation
    const bounds0 = map.getBounds();
    let vc0 = 0;
    filteredTrees.forEach((t) => {
      if (bounds0.contains([t.latitude, t.longitude])) vc0++;
    });
    const initBand = computeDensityBand(vc0);
    lastState.zoom = map.getZoom();
    lastState.densityBand = initBand;

    // Auto-fit on first load only
    if (!hasFittedRef.current && filteredTrees.length > 0) {
      hasFittedRef.current = true;
      if (userLatLng && filteredTrees.length > 3) {
        const nearby = filteredTrees.filter(
          (t) =>
            haversineKm(userLatLng[0], userLatLng[1], t.latitude, t.longitude) <
            50
        );
        if (nearby.length >= 2) {
          const bounds = L.latLngBounds(
            nearby.map((t) => [t.latitude, t.longitude])
          );
          bounds.extend(userLatLng);
          map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 13,
            animate: true,
            duration: 1,
          });
        } else {
          const bounds = L.latLngBounds(
            filteredTrees.map((t) => [t.latitude, t.longitude])
          );
          map.fitBounds(bounds, {
            padding: [30, 30],
            maxZoom: 5,
            animate: true,
            duration: 0.8,
          });
        }
      } else {
        const bounds = L.latLngBounds(
          filteredTrees.map((t) => [t.latitude, t.longitude])
        );
        map.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: 5,
          animate: true,
          duration: 0.8,
        });
      }
    }

    // Perf metrics
    if (debugEnabled && onPerfUpdate) {
      setTimeout(() => {
        const renderMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - renderStart;
        const markerCount =
          typeof clusterRef.current?.getLayers === "function"
            ? clusterRef.current.getLayers().length
            : filteredTrees.length;
        const clusterCount =
          document.querySelectorAll(".tree-cluster").length;
        onPerfUpdate({
          markerCount,
          clusterCount,
          renderMs: Number(renderMs.toFixed(1)),
        });
        if (debugEnabled) {
          console.log(
            `[MapPerf] Leaflet render ${renderMs.toFixed(1)}ms | markers=${markerCount} | clusters=${clusterCount}`
          );
        }
      }, 80);
    }

    return () => {
      map.off("zoomend", adjustClustering);
      map.off("moveend", adjustClustering);
      if (lastState.timerHandle) clearTimeout(lastState.timerHandle);
    };
  }, [
    map,
    filteredTrees,
    config.lineageFilter,
    config.groveScale,
    config.showHiveLayer,
    debugEnabled,
    createMarker,
    createClusterGroup,
    onClusterRef,
    onPerfUpdate,
    userLatLng,
  ]);

  return {
    clusterRef,
    markerMap: markerMapRef,
    hasFittedRef,
  };
}

/* ── Cluster icon factory — extracted for reuse ── */
function createClusterIcon(cluster: any, isLineageFocused = false) {
  const count = cluster.getChildCount();
  const childMarkers = cluster.getAllChildMarkers();

  let ancientCount = 0;
  let storiedCount = 0;
  childMarkers.forEach((m: any) => {
    const html = m.options?.icon?.options?.html || "";
    if (html.includes("marker-ancient")) ancientCount++;
    else if (html.includes("storied")) storiedCount++;
  });

  const hasAncient = ancientCount > 0;
  const hasMajorStory = storiedCount >= count * 0.3;

  const speciesCounts: Record<string, number> = {};
  childMarkers.forEach((m: any) => {
    const sp = m._treeSpecies;
    if (sp) speciesCounts[sp] = (speciesCounts[sp] || 0) + 1;
  });
  const speciesEntries = Object.entries(speciesCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const dominantSpecies = speciesEntries.length > 0 ? speciesEntries[0] : null;
  const speciesDiversity = speciesEntries.length;
  const isMonoSpecies =
    dominantSpecies && dominantSpecies[1] >= count * 0.7;

  const lineageCounts: Record<string, number> = {};
  childMarkers.forEach((m: any) => {
    const lin = m._treeLineage;
    if (lin) lineageCounts[lin] = (lineageCounts[lin] || 0) + 1;
  });
  const lineageEntries = Object.entries(lineageCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const dominantLineage =
    lineageEntries.length > 0 ? lineageEntries[0] : null;
  const isMonoLineage = dominantLineage && dominantLineage[1] === count;

  const groveTier =
    count >= 50
      ? "grove-ancient"
      : count >= 16
      ? "grove-flourishing"
      : count >= 6
      ? "grove-established"
      : count >= 3
      ? "grove-small"
      : "grove-seedling";
  const dim =
    count >= 50 ? 60 : count >= 16 ? 54 : count >= 6 ? 46 : count >= 3 ? 38 : 32;

  let ringStyle = "";
  if (isMonoSpecies && dominantSpecies) {
    const spLower = dominantSpecies[0].toLowerCase();
    if (spLower.includes("yew") || spLower.includes("taxus")) {
      ringStyle = "border-color:hsla(280,30%,40%,0.35);--grove-accent:280,30%,40%";
    } else if (spLower.includes("oak") || spLower.includes("quercus")) {
      ringStyle = "border-color:hsla(90,35%,35%,0.35);--grove-accent:90,35%,35%";
    } else if (spLower.includes("beech") || spLower.includes("fagus")) {
      ringStyle = "border-color:hsla(35,40%,38%,0.35);--grove-accent:35,40%,38%";
    } else if (spLower.includes("pine") || spLower.includes("pinus")) {
      ringStyle = "border-color:hsla(150,35%,30%,0.35);--grove-accent:150,35%,30%";
    } else if (
      spLower.includes("lime") ||
      spLower.includes("tilia") ||
      spLower.includes("linden")
    ) {
      ringStyle = "border-color:hsla(80,40%,40%,0.35);--grove-accent:80,40%,40%";
    }
  }
  if (isLineageFocused && isMonoLineage) {
    ringStyle = "border-color:hsla(120,35%,40%,0.4);box-shadow:0 0 6px hsla(120,35%,40%,0.15)";
  } else if (hasAncient) {
    ringStyle +=
      ";border-color:hsla(42,60%,50%,0.4);box-shadow:0 0 8px hsla(42,60%,50%,0.15)";
  } else if (hasMajorStory) {
    ringStyle +=
      ";border-color:hsla(42,45%,45%,0.3);box-shadow:0 0 5px hsla(42,45%,45%,0.1)";
  }

  let badge = "";
  if (hasAncient) {
    badge = `<span style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:hsl(42,95%,60%);border:1.5px solid hsl(30,15%,10%);"></span>`;
  } else if (speciesDiversity >= 3) {
    badge = `<span style="position:absolute;top:-4px;right:-4px;font-size:8px;line-height:1;opacity:0.7" title="${speciesDiversity} species">🌿</span>`;
  } else if (dominantLineage && dominantLineage[1] >= 3 && !isLineageFocused) {
    badge = `<span style="position:absolute;top:-4px;right:-4px;font-size:9px;line-height:1;" title="${dominantLineage[0]}">🌿</span>`;
  }

  let groveWhisperCount = 0;
  childMarkers.forEach((m: any) => {
    groveWhisperCount += m._whisperCount || 0;
  });

  const myceliumRing =
    count >= 6
      ? `<span class="grove-mycelium" style="border:1px dashed hsla(${
          isMonoSpecies && ringStyle.includes("--grove-accent")
            ? "var(--grove-accent)"
            : "120,50%,40%"
        },0.25);"></span>`
      : "";

  const groveLabel =
    count >= 5
      ? isMonoSpecies && dominantSpecies
        ? `<span style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8px;font-family:'Cinzel',serif;color:hsl(42,50%,60%);text-shadow:0 1px 3px rgba(0,0,0,0.7);letter-spacing:0.04em;opacity:0.8;">${
            dominantSpecies[0].length > 14
              ? dominantSpecies[0].slice(0, 12) + "…"
              : dominantSpecies[0]
          }</span>`
        : isMonoLineage && dominantLineage && count >= 8
        ? `<span style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8px;font-family:'Cinzel',serif;color:hsl(42,50%,60%);text-shadow:0 1px 3px rgba(0,0,0,0.7);letter-spacing:0.04em;opacity:0.8;">${
            dominantLineage[0].length > 14
              ? dominantLineage[0].slice(0, 12) + "…"
              : dominantLineage[0]
          }</span>`
        : ""
      : "";

  const whisperEcho =
    groveWhisperCount > 0
      ? `<span style="position:absolute;bottom:${
          groveLabel ? -2 : -12
        }px;left:50%;transform:translateX(-50%);font-size:8px;color:hsla(200,40%,65%,0.7);white-space:nowrap;pointer-events:none;">🌬️ ${groveWhisperCount}</span>`
      : "";

  const groveGlowClass = groveWhisperCount > 0 ? " whisper-glow" : "";

  return L.divIcon({
    html: `<div class="tree-cluster ${groveTier}${groveGlowClass}" style="${ringStyle};position:relative;">${count}${badge}${myceliumRing}${groveLabel}${whisperEcho}</div>`,
    className: "leaflet-tree-marker",
    iconSize: L.point(dim, dim + (groveLabel || whisperEcho ? 14 : 0)),
  });
}
