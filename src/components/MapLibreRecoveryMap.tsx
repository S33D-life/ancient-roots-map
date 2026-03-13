/**
 * MapLibreRecoveryMap — emergency minimal map using MapLibre GL JS.
 * No atmosphere, no seasonal tint, no clustering, no custom overlays.
 * Just a working basemap + tree markers from the existing dataset.
 *
 * To switch back: set ENABLE_ADVANCED_MAP_EFFECTS = true in Map.tsx
 */
import { useEffect, useRef, useState, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTreeMapData, type MapTree } from "@/hooks/use-tree-map-data";

interface Props {
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

const DEFAULT_CENTER: [number, number] = [0, 10]; // [lng, lat] for MapLibre
const DEFAULT_ZOOM = 2;

// Free raster tile style — no API key needed
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const MapLibreRecoveryMap = ({ initialLat, initialLng, initialZoom }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [debug, setDebug] = useState({
    mounted: false,
    styleLoaded: false,
    container: "0x0",
    error: "",
    treeCount: 0,
  });

  // Tree data from shared React Query hook
  const { trees } = useTreeMapData();

  // Init map
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    let cancelled = false;

    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const size = `${w}x${h}`;
    console.info("[MapLibre] container size:", size);
    setDebug((d) => ({ ...d, container: size }));

    if (w === 0 || h === 0) {
      console.warn("[MapLibre] container is 0-sized, will retry in 300ms");
    }

    const initTimeout = w === 0 || h === 0 ? 300 : 0;

    const timer = window.setTimeout(() => {
      if (cancelled || mapRef.current) return;

      try {
        const hasCenter = Number.isFinite(initialLat) && Number.isFinite(initialLng);
        const center: [number, number] = hasCenter
          ? [initialLng as number, initialLat as number]
          : DEFAULT_CENTER;
        const zoom = Number.isFinite(initialZoom) ? (initialZoom as number) : DEFAULT_ZOOM;

        const map = new maplibregl.Map({
          container: el,
          style: STYLE,
          center,
          zoom,
          attributionControl: true,
        });

        mapRef.current = map;

        map.addControl(new maplibregl.NavigationControl(), "bottom-right");

        map.on("load", () => {
          if (cancelled) return;
          console.info("[MapLibre] style loaded ✓");
          setDebug((d) => ({ ...d, mounted: true, styleLoaded: true }));

          // Proof-of-life marker
          new maplibregl.Marker({ color: "#D4A24E" })
            .setLngLat(center)
            .setPopup(new maplibregl.Popup().setText("Recovery marker — map is alive"))
            .addTo(map);
        });

        map.on("error", (e) => {
          console.error("[MapLibre] map error", e.error?.message || e);
          setDebug((d) => ({ ...d, error: e.error?.message || "unknown map error" }));
        });

        // Resize safety
        map.once("idle", () => map.resize());
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[MapLibre] init failed:", msg);
        setDebug((d) => ({ ...d, error: msg }));
      }
    }, initTimeout);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialLat, initialLng, initialZoom]);

  // Render tree markers once map + data are ready
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !debug.styleLoaded || trees.length === 0) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Cap at 2000 markers for performance in recovery mode
    const subset = trees.slice(0, 2000);

    subset.forEach((tree) => {
      if (!Number.isFinite(tree.latitude) || !Number.isFinite(tree.longitude)) return;

      const el = document.createElement("div");
      el.style.cssText =
        "width:12px;height:12px;border-radius:50%;background:hsl(120,40%,35%);border:2px solid hsl(42,70%,55%);cursor:pointer;";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([tree.longitude, tree.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 12, closeButton: true }).setHTML(
            `<div style="font-family:'Cinzel',serif;padding:8px;max-width:200px;">
              <strong style="color:hsl(42,70%,45%)">${escapeForPopup(tree.name)}</strong>
              <div style="font-size:11px;color:#666;margin-top:2px;">${escapeForPopup(tree.species)}</div>
              <a href="/tree/${tree.id}" style="display:inline-block;margin-top:6px;font-size:11px;color:hsl(120,40%,35%)">View tree →</a>
            </div>`
          )
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    console.info(`[MapLibre] rendered ${subset.length} tree markers`);
    setDebug((d) => ({ ...d, treeCount: subset.length }));

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [trees, debug.styleLoaded]);

  return (
    <div className="absolute inset-0" style={{ height: "100dvh" }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Dev debug badge */}
      <div
        className="absolute top-2 left-2 z-[1000] rounded-md border border-border px-2 py-1 font-mono text-[10px] leading-snug shadow-sm"
        style={{ background: "hsla(0,0%,0%,0.7)", color: "#0f0" }}
      >
        <div>provider: maplibre</div>
        <div>mounted: {debug.mounted ? "yes" : "no"}</div>
        <div>style: {debug.styleLoaded ? "loaded" : "pending"}</div>
        <div>container: {debug.container}</div>
        <div>trees: {debug.treeCount}</div>
        {debug.error && <div style={{ color: "#f55" }}>error: {debug.error}</div>}
      </div>
    </div>
  );
};

function escapeForPopup(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default MapLibreRecoveryMap;
