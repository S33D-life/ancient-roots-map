/**
 * useMapInit — Handles Leaflet map creation, tile layer setup, tile fallback,
 * initial view restoration (deep-link coords, what3words, session memory),
 * and cleanup.
 *
 * Extracted from LeafletFallbackMap to reduce its responsibilities.
 * The hook waits for the container to have non-zero dimensions (via
 * ResizeObserver) before initialising, and defers final init for 2s
 * as an ultimate fallback.
 */
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import L from "leaflet";
import { saveMapMemory, restoreMapMemory } from "@/hooks/use-map-memory";
import { applySeasonalTint } from "@/utils/mapSeasonalTint";
import { markTreeVisited, applyVisitedClass } from "@/utils/mapVisitedTracker";
import { setupPopupActions } from "@/utils/mapWishHandler";

export interface MapInitOptions {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  mapRef: MutableRefObject<L.Map | null>;
  clusterRef: MutableRefObject<any>;
  userMarkerRef: MutableRefObject<L.Marker | null>;
  userAccuracyRef: MutableRefObject<L.Circle | null>;
  focusHaloRef: MutableRefObject<L.Marker | null>;
  focusFallbackMarkerRef: MutableRefObject<L.Marker | null>;
  groveLayerRef: MutableRefObject<L.LayerGroup | null>;
  seedLayerRef: MutableRefObject<L.LayerGroup | null>;
  mycelialNetworkLayerRef: MutableRefObject<L.LayerGroup | null>;
  mycelialAnimatedLayerRef: MutableRefObject<L.LayerGroup | null>;
  /** Initial view props (from URL params / route state) */
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  initialW3w?: string;
  /** Safe-mode flags */
  safeBareMapMode: boolean;
  safeMapDebug: boolean;
  /** Geolocation auto-locate callback — called once if no deep-link or memory */
  onAutoLocate?: () => void;
}

export interface MapInitResult {
  mapMounted: boolean;
  tileStatus: "idle" | "loading" | "loaded" | "failed";
  provider: "carto" | "osm";
  tileLoads: number;
  tileErrors: number;
  tilePaneImages: number;
  containerSize: string;
}

const EMPTY_INIT_RESULT: MapInitResult = {
  mapMounted: false,
  tileStatus: "idle",
  provider: "carto",
  tileLoads: 0,
  tileErrors: 0,
  tilePaneImages: 0,
  containerSize: "0x0",
};

export function useMapInit({
  containerRef,
  mapRef,
  clusterRef,
  userMarkerRef,
  userAccuracyRef,
  focusHaloRef,
  focusFallbackMarkerRef,
  groveLayerRef,
  seedLayerRef,
  mycelialNetworkLayerRef,
  mycelialAnimatedLayerRef,
  initialLat,
  initialLng,
  initialZoom,
  initialW3w,
  safeBareMapMode,
  safeMapDebug,
  onAutoLocate,
}: MapInitOptions) {
  const [renderDebug, setRenderDebug] = useState<MapInitResult>(EMPTY_INIT_RESULT);
  const [atmosphereReady, setAtmosphereReady] = useState(false);
  const mapCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const container = containerRef.current;
    let disposed = false;

    const containerReady = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === 0 || h === 0) {
        console.warn("[MapInit] Container zero dimensions, deferring…", w, h);
        return false;
      }
      console.info("[MapInit] Container measurable:", w, "x", h);
      return true;
    };

    function doMapInit() {
      if (disposed || !container || mapRef.current) return;

      const isTall = window.innerHeight > window.innerWidth;
      const defaultZoom = isTall ? 3 : 2;

      const map = L.map(container, {
        center: [25, 10],
        zoom: defaultZoom,
        minZoom: isTall ? 3 : 2,
        maxBounds: [[-85, -200], [85, 200]],
        maxBoundsViscosity: 0.8,
        attributionControl: false,
        zoomControl: false,
        preferCanvas: true,
        tap: true,
        tapTolerance: 15,
        zoomAnimation: true,
        markerZoomAnimation: true,
      } as any);

      // Atmosphere rendered via React overlay, NOT DOM-injected into Leaflet
      if (!safeBareMapMode) setAtmosphereReady(true);
      if (safeBareMapMode) container.classList.add("safe-bare-map");

      const logPrefix = "[MapTiles]";
      const containerSize = `${container.offsetWidth}x${container.offsetHeight}`;
      console.info(`${logPrefix} Leaflet map created, container ${containerSize}`);
      setRenderDebug({
        mapMounted: true,
        tileStatus: "idle",
        provider: safeBareMapMode ? "osm" : "carto",
        tileLoads: 0,
        tileErrors: 0,
        tilePaneImages: 0,
        containerSize,
      });

      const isRetina = window.devicePixelRatio > 1;
      const primaryTileLayer = L.tileLayer(
        safeBareMapMode
          ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          : isRetina
          ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: safeBareMapMode ? '&copy; OpenStreetMap contributors' : '&copy; OSM &copy; CARTO',
          maxZoom: 19,
          subdomains: safeBareMapMode ? "abc" : "abcd",
          keepBuffer: 4,
        }
      ).addTo(map);

      const fallbackTileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: "abc",
        keepBuffer: 4,
      });

      let tileLoadCount = 0;
      let tileErrorCount = 0;
      primaryTileLayer.on("loading", () => {
        console.info(`${logPrefix} tiles loading…`);
        setRenderDebug((prev) => ({ ...prev, tileStatus: "loading" }));
      });
      primaryTileLayer.on("load", () => {
        console.info(`${logPrefix} tiles loaded (${tileLoadCount} tiles, ${tileErrorCount} errors)`);
        setRenderDebug((prev) => ({ ...prev, tileStatus: "loaded", tileLoads: tileLoadCount, tileErrors: tileErrorCount }));
      });
      primaryTileLayer.on("tileloadstart", (e: any) => {
        if (safeMapDebug && e?.tile?.src) {
          console.info(`${logPrefix} tileloadstart`, e.tile.src);
        }
      });

      let tileErrors = 0;
      let usingFallbackTiles = false;
      const TILE_ERROR_THRESHOLD = 8;

      const activateFallbackTiles = () => {
        if (usingFallbackTiles) return;
        usingFallbackTiles = true;
        try {
          if (map.hasLayer(primaryTileLayer)) map.removeLayer(primaryTileLayer);
          fallbackTileLayer.addTo(map);
          console.warn(`${logPrefix} Switched to OSM fallback tiles`);
        } catch {}
      };

      primaryTileLayer.on("tileload", () => {
        tileLoadCount += 1;
        if (tileErrors > 0) tileErrors -= 1;
      });

      primaryTileLayer.on("tileerror", (e: any) => {
        tileErrors += 1;
        tileErrorCount += 1;
        setRenderDebug((prev) => ({ ...prev, tileStatus: "failed", tileErrors: tileErrorCount }));
        console.warn(`${logPrefix} tileerror #${tileErrorCount}`, e?.tile?.src?.slice(0, 160));
        if (tileErrors >= (safeMapDebug ? 1 : TILE_ERROR_THRESHOLD)) {
          activateFallbackTiles();
        }
      });

      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;

      container.style.backgroundColor = "hsl(30, 15%, 10%)";

      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 500);
      setTimeout(() => {
        map.invalidateSize();
        const imgCount = container?.querySelectorAll(".leaflet-tile-pane img").length ?? 0;
        setRenderDebug((prev) => ({ ...prev, tilePaneImages: imgCount }));
        console.info(`${logPrefix} late invalidateSize, ${container?.offsetWidth}x${container?.offsetHeight}, tiles=${imgCount}`);
      }, 1500);
      const sizeObserver = new ResizeObserver(() => map.invalidateSize());
      sizeObserver.observe(container);
      const onResize = () => map.invalidateSize();
      window.addEventListener('resize', onResize);

      const cleanupSeasonalTint = applySeasonalTint(container);
      const cleanupPopupActions = setupPopupActions(container);

      map.on("popupopen", (e: any) => {
        const marker = e.popup?._source;
        if (marker?._treeId) markTreeVisited(marker._treeId, marker._icon);
      });

      map.on("layeradd", (e: any) => {
        const layer = e.layer;
        if (layer?._treeId && layer._icon) applyVisitedClass(layer._treeId, layer._icon);
      });

      // ── Initial view: deep-link coords > w3w > session memory > auto-locate ──
      let deepLinked = false;
      if (initialLat !== undefined && initialLng !== undefined) {
        deepLinked = true;
        setTimeout(() => map.setView([initialLat, initialLng], initialZoom ?? 16), 300);
      } else if (initialW3w) {
        deepLinked = true;
        import("@/utils/what3words").then(({ convertToCoordinates }) => {
          convertToCoordinates(initialW3w).then((result) => {
            if (result && result.coordinates) {
              map.setView([result.coordinates.lat, result.coordinates.lng], initialZoom ?? 16);
            }
          }).catch(() => {});
        });
      }

      if (!deepLinked) {
        const memory = restoreMapMemory();
        if (memory) {
          setTimeout(() => map.setView([memory.lat, memory.lng], memory.zoom, { animate: true }), 300);
        }
      }

      // Persist map position on move
      let saveTimer: ReturnType<typeof setTimeout>;
      const onMoveEndSave = () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const c = map.getCenter();
          const z = map.getZoom();
          saveMapMemory({ lat: c.lat, lng: c.lng, zoom: z });
          window.dispatchEvent(new CustomEvent("teotag-map-context", {
            detail: { center: { lat: c.lat, lng: c.lng }, zoom: z },
          }));
        }, 500);
      };
      map.on("moveend", onMoveEndSave);

      // Auto-locate if no deep-link and no session memory
      if (!deepLinked && !restoreMapMemory()) {
        onAutoLocate?.();
      }

      mapCleanupRef.current = () => {
        clearTimeout(saveTimer);
        map.off("moveend", onMoveEndSave);
        cleanupSeasonalTint();
        cleanupPopupActions();
        sizeObserver.disconnect();
        window.removeEventListener('resize', onResize);
        map.remove();
        mapRef.current = null;
        clusterRef.current = null;
        userMarkerRef.current = null;
        userAccuracyRef.current = null;
        focusHaloRef.current = null;
        focusFallbackMarkerRef.current = null;
        groveLayerRef.current = null;
        seedLayerRef.current = null;
        mycelialNetworkLayerRef.current = null;
        mycelialAnimatedLayerRef.current = null;
      };
    } // end doMapInit

    if (containerReady()) {
      doMapInit();
    } else {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) { ro.disconnect(); doMapInit(); }
        }
      });
      ro.observe(container);
      const fallback = setTimeout(() => { ro.disconnect(); doMapInit(); }, 2000);
      return () => { disposed = true; ro.disconnect(); clearTimeout(fallback); mapCleanupRef.current?.(); };
    }

    return () => { disposed = true; mapCleanupRef.current?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { renderDebug, atmosphereReady };
}
