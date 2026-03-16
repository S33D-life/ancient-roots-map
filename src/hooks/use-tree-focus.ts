/**
 * useTreeFocus — Handles "View on Map" deep-link focus:
 * - Fly-to animation (single-stage or multi-stage journey)
 * - Cluster expansion
 * - Focus halo + label
 * - Popup opening
 * - Fallback marker for filtered-out trees
 *
 * Extracted from LeafletFallbackMap.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import { escapeHtml } from "@/utils/escapeHtml";
import { supabase } from "@/integrations/supabase/client";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
}

interface UseTreeFocusOptions {
  mapRef: React.MutableRefObject<L.Map | null>;
  clusterRef: React.MutableRefObject<any>;
  /** Shared with useMapInit for cleanup */
  focusHaloRef: React.MutableRefObject<L.Marker | null>;
  /** Shared with useMapInit for cleanup */
  focusFallbackMarkerRef: React.MutableRefObject<L.Marker | null>;
  initialTreeId?: string;
  initialZoom?: number;
  initialJourney?: boolean;
  trees: Tree[];
  filteredTrees: Tree[];
  onJourneyEnd?: () => void;
}

export function useTreeFocus({
  mapRef,
  clusterRef,
  focusHaloRef,
  focusFallbackMarkerRef,
  initialTreeId,
  initialZoom,
  initialJourney,
  trees,
  filteredTrees,
  onJourneyEnd,
}: UseTreeFocusOptions) {
  const focusHandledRef = useRef<string | null>(null);
  const focusFetchAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster || !initialTreeId) return;

    const focusKey = `${initialTreeId}:${initialZoom ?? ""}:${initialJourney ? "1" : "0"}`;
    if (focusHandledRef.current === focusKey) return;
    if (trees.length === 0) return;

    const clearFallbackMarker = () => {
      if (focusFallbackMarkerRef.current) {
        map.removeLayer(focusFallbackMarkerRef.current);
        focusFallbackMarkerRef.current = null;
      }
    };

    const showDetachedFocus = (
      lat: number,
      lng: number,
      treeName: string,
      treeSpecies?: string | null
    ) => {
      clearFallbackMarker();
      const targetLatLng = L.latLng(lat, lng);
      map.flyTo(targetLatLng, Math.max(initialZoom ?? 17, 16), {
        duration: initialJourney ? 1.2 : 0.9,
        easeLinearity: 0.35,
      });

      const popupHtml = `<div style="font-family:'Cinzel',serif;min-width:190px;padding:10px 12px;text-align:center">
        <div style="font-size:13px;color:hsl(42,80%,60%);margin-bottom:3px">${escapeHtml(treeName || "Tree")}</div>
        ${treeSpecies ? `<div style="font-size:11px;color:hsl(120,30%,60%);margin-bottom:6px">${escapeHtml(treeSpecies)}</div>` : ""}
        <div style="font-size:10px;color:hsl(42,18%,72%)">Focused from deep link</div>
      </div>`;

      const marker = L.marker(targetLatLng, { zIndexOffset: 900 }).addTo(map);
      marker.bindPopup(popupHtml, { className: "atlas-leaflet-popup", maxWidth: 250 }).openPopup();
      focusFallbackMarkerRef.current = marker;

      setTimeout(() => {
        if (focusFallbackMarkerRef.current === marker) {
          map.removeLayer(marker);
          focusFallbackMarkerRef.current = null;
        }
      }, 8000);

      onJourneyEnd?.();
    };

    const targetTree = trees.find((t) => t.id === initialTreeId);
    if (!targetTree) {
      if (focusFetchAttemptRef.current === focusKey) return;
      focusFetchAttemptRef.current = focusKey;

      void (async () => {
        const { data, error } = await supabase
          .from("trees")
          .select("id,name,species,latitude,longitude")
          .eq("id", initialTreeId)
          .maybeSingle();
        if (error || !data || data.latitude == null || data.longitude == null) return;
        if (focusHandledRef.current === focusKey) return;
        focusHandledRef.current = focusKey;
        showDetachedFocus(data.latitude, data.longitude, data.name, data.species);
      })();
      return;
    }

    focusHandledRef.current = focusKey;
    const targetLatLng = L.latLng(targetTree.latitude, targetTree.longitude);

    let targetMarker: L.Marker | null = null;
    cluster.eachLayer((layer: any) => {
      if (layer?._treeId === initialTreeId) {
        targetMarker = layer as L.Marker;
      }
    });

    if (!targetMarker) {
      showDetachedFocus(targetTree.latitude, targetTree.longitude, targetTree.name, targetTree.species);
      return;
    }

    const targetZoom = Math.max(initialZoom ?? 17, 17);
    const currentZoom = map.getZoom();
    const useJourney = initialJourney && currentZoom < 10;

    if (useJourney) {
      const regionalZoom = Math.min(9, Math.floor((currentZoom + targetZoom) / 2.5));
      map.flyTo(targetLatLng, regionalZoom, { duration: 0.8, easeLinearity: 0.35 });

      const onRegionalEnd = () => {
        map.off("moveend", onRegionalEnd);
        setTimeout(() => {
          map.flyTo(targetLatLng, targetZoom, { duration: 0.9, easeLinearity: 0.3 });
          const onFinalEnd = () => {
            map.off("moveend", onFinalEnd);
            finishTreeFocus(map, cluster, targetMarker!, targetTree);
            onJourneyEnd?.();
          };
          setTimeout(() => map.once("moveend", onFinalEnd), 80);
        }, 150);
      };
      setTimeout(() => map.once("moveend", onRegionalEnd), 80);
    } else {
      map.flyTo(targetLatLng, targetZoom, { duration: 1.2, easeLinearity: 0.4 });
      const onFlyEnd = () => {
        map.off("moveend", onFlyEnd);
        finishTreeFocus(map, cluster, targetMarker!, targetTree);
        onJourneyEnd?.();
      };
      setTimeout(() => map.once("moveend", onFlyEnd), 100);
    }

    function finishTreeFocus(map: L.Map, cluster: any, marker: L.Marker, tree: Tree) {
      const visibleParent = cluster.getVisibleParent(marker);
      if (visibleParent && visibleParent !== marker) {
        cluster.zoomToShowLayer(marker, () => showHighlight(map, marker, tree.name));
      } else {
        showHighlight(map, marker, tree.name);
      }
    }

    function showHighlight(map: L.Map, marker: L.Marker, treeName: string) {
      map.panTo(marker.getLatLng(), { animate: true, duration: 0.4 });

      const haloEl = document.createElement("div");
      haloEl.style.position = "relative";
      haloEl.style.width = "40px";
      haloEl.style.height = "40px";
      for (let i = 0; i < 3; i++) {
        const h = document.createElement("div");
        h.className = "tree-focus-halo";
        h.style.animationDelay = `${i * 0.4}s`;
        haloEl.appendChild(h);
      }
      const label = document.createElement("div");
      label.className = "tree-focus-label";
      label.textContent = treeName;
      haloEl.appendChild(label);

      const haloIcon = L.divIcon({
        className: "leaflet-tree-marker",
        html: haloEl.innerHTML,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (focusHaloRef.current) {
        map.removeLayer(focusHaloRef.current);
      }
      clearFallbackMarker();

      const haloMarker = L.marker(marker.getLatLng(), {
        icon: haloIcon,
        interactive: false,
        zIndexOffset: -10,
      }).addTo(map);
      focusHaloRef.current = haloMarker;

      setTimeout(() => marker.openPopup(), 600);
      setTimeout(() => {
        if (focusHaloRef.current) {
          map.removeLayer(focusHaloRef.current);
          focusHaloRef.current = null;
        }
      }, 3000);
    }
  }, [filteredTrees, trees, initialTreeId, initialZoom, initialJourney, onJourneyEnd, mapRef, clusterRef, focusHaloRef, focusFallbackMarkerRef]);
}
