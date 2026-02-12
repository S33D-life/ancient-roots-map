import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { escapeHtml } from "@/utils/escapeHtml";
import { useSearchParams } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyle } from "@/config/mapbox";
import { supabase } from "@/integrations/supabase/client";
import { convertToCoordinates } from "@/utils/what3words";
import MapSearch from "./MapSearch";
import MapFilters, { GroveScale } from "./MapFilters";
import TreeImportExport from "./TreeImportExport";
import TreeRadio from "./TreeRadio";
import ConversionStatus from "./ConversionStatus";
import FindMeButton from "./FindMeButton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import MistOverlay from "./MistOverlay";
import MapIdleNudge from "./MapIdleNudge";
import { lazy, Suspense } from "react";

const LeafletFallbackMap = lazy(() => import("./LeafletFallbackMap"));

/* ── WebGL detection ── */
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("webgl2") || canvas.getContext("experimental-webgl"));
  } catch { return false; }
}

type TimeOfDay = "dawn" | "day" | "dusk" | "night";

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

const TIME_ATMOSPHERES: Record<TimeOfDay, {
  mapFilter: string;
  vignette: string;
  vignetteBoxShadow: string;
  ambientGlow: string;
  label: string;
}> = {
  dawn: {
    mapFilter: 'sepia(0.08) brightness(1.0)',
    vignette: 'radial-gradient(ellipse at center, transparent 70%, hsla(25, 50%, 25%, 0.08) 90%, hsla(20, 45%, 15%, 0.15) 100%)',
    vignetteBoxShadow: 'inset 0 0 40px 15px hsla(25, 45%, 18%, 0.1)',
    ambientGlow: 'none',
    label: 'Dawn',
  },
  day: {
    mapFilter: 'none',
    vignette: 'radial-gradient(ellipse at center, transparent 75%, hsla(35, 45%, 20%, 0.05) 95%, hsla(30, 40%, 12%, 0.1) 100%)',
    vignetteBoxShadow: 'inset 0 0 30px 10px hsla(30, 40%, 15%, 0.08)',
    ambientGlow: 'none',
    label: 'Day',
  },
  dusk: {
    mapFilter: 'sepia(0.1) brightness(0.95)',
    vignette: 'radial-gradient(ellipse at center, transparent 60%, hsla(20, 55%, 18%, 0.1) 85%, hsla(15, 50%, 10%, 0.2) 100%)',
    vignetteBoxShadow: 'inset 0 0 60px 20px hsla(20, 50%, 12%, 0.15)',
    ambientGlow: 'none',
    label: 'Dusk',
  },
  night: {
    mapFilter: 'sepia(0.1) brightness(0.85) hue-rotate(-5deg)',
    vignette: 'radial-gradient(ellipse at center, transparent 55%, hsla(240, 30%, 10%, 0.15) 80%, hsla(240, 35%, 5%, 0.3) 100%)',
    vignetteBoxShadow: 'inset 0 0 80px 30px hsla(240, 30%, 6%, 0.25)',
    ambientGlow: 'none',
    label: 'Starlight',
  },
};

interface TreeOfferings {
  [treeId: string]: number;
}

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  what3words: string;
  description?: string;
  created_by?: string;
  nation?: string;
  estimated_age?: number | null;
}

const GROVE_SOURCE_ID = 'grove-boundary-source';
const ROOT_THREADS_SOURCE = 'root-threads-source';
const ROOT_THREADS_LAYER = 'root-threads-layer';
const CREATOR_PATHS_SOURCE = 'creator-paths-source';
const CREATOR_PATHS_LAYER = 'creator-paths-layer';
const CREATOR_PATHS_GLOW_LAYER = 'creator-paths-glow-layer';

// Max distance (km) for root thread connections
const ROOT_THREAD_MAX_KM = 80;
const GROVE_FILL_ID = 'grove-boundary-fill';
const GROVE_LINE_ID = 'grove-boundary-line';

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Compute convex hull of [lng, lat] points using Graham scan
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;

  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  function cross(O: [number, number], A: [number, number], B: [number, number]) {
    return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
  }

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (const p of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// Create a buffered boundary around points (expand hull outward)
function createGroveBoundary(trees: Tree[], bufferKm: number): GeoJSON.Feature | null {
  const points: [number, number][] = trees.map((t) => [t.longitude, t.latitude]);

  if (points.length === 0) return null;

  if (points.length === 1) {
    const [lng, lat] = points[0];
    const coords: [number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * 2 * Math.PI;
      const dLat = (bufferKm / 111.32) * Math.cos(angle);
      const dLng = (bufferKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
      coords.push([lng + dLng, lat + dLat]);
    }
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [coords] },
    };
  }

  if (points.length === 2) {
    const hull = points;
    const expanded = expandHull(hull, bufferKm);
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [expanded] },
    };
  }

  const hull = convexHull(points);
  const expanded = expandHull(hull, bufferKm);
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [expanded] },
  };
}

// Expand a hull outward by bufferKm, smoothing corners
function expandHull(hull: [number, number][], bufferKm: number): [number, number][] {
  if (hull.length < 2) return hull;

  const result: [number, number][] = [];
  const n = hull.length;

  for (let i = 0; i < n; i++) {
    const [lng, lat] = hull[i];
    const cx = hull.reduce((s, p) => s + p[0], 0) / n;
    const cy = hull.reduce((s, p) => s + p[1], 0) / n;
    const dx = lng - cx;
    const dy = lat - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const normDx = dx / dist;
    const normDy = dy / dist;

    const baseAngle = Math.atan2(normDy, normDx);
    for (let j = -2; j <= 2; j++) {
      const angle = baseAngle + (j * Math.PI) / 10;
      const aLat = (bufferKm / 111.32) * Math.sin(angle);
      const aLng = (bufferKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(angle);
      result.push([lng + aLng, lat + aLat]);
    }
  }

  const finalHull = convexHull(result);
  finalHull.push(finalHull[0]);
  return finalHull;
}

// Determine continent from coordinates (rough bounding boxes)
function getContinent(lat: number, lng: number): string {
  if (lat > 15 && lat < 72 && lng > -25 && lng < 45) return "Europe";
  if (lat > -35 && lat < 37 && lng > -20 && lng < 55) return "Africa";
  if (lat > 5 && lat < 78 && lng > 45 && lng < 180) return "Asia";
  if (lat > -50 && lat < 5 && lng > 90 && lng < 180) return "Oceania";
  if (lat > -60 && lat < -10 && lng > 110 && lng < 180) return "Oceania";
  if (lat > 15 && lat < 85 && lng > -170 && lng < -50) return "North America";
  if (lat > -60 && lat < 15 && lng > -90 && lng < -30) return "South America";
  return "Other";
}

interface MapProps {
  initialView?: string;
  initialSpecies?: string;
  initialW3w?: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

const Map = ({ initialView, initialSpecies, initialW3w, initialLat, initialLng, initialZoom }: MapProps) => {
  const [searchParams] = useSearchParams();
  const autoAddTree = searchParams.get("addTree") === "true";
  const deepLinkHandled = useRef(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [offeringCounts, setOfferingCounts] = useState<TreeOfferings>({});
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error" | "leaflet">("loading");
  const mapStatusRef = useRef(mapStatus);
  // Keep ref in sync so timeouts/callbacks read current value
  useEffect(() => { mapStatusRef.current = mapStatus; }, [mapStatus]);
  // Auto-redirect error to leaflet — never leave user on a broken screen
  useEffect(() => {
    if (mapStatus === "error") {
      console.warn('[Atlas] Error state detected — auto-switching to Leaflet');
      setMapStatus("leaflet");
    }
  }, [mapStatus]);
  const [mapError, setMapError] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState({ style: false, webgl: false, width: 0, height: 0, error: "" });
  const [showDebug, setShowDebug] = useState(false);
  const [viewMode, setViewMode] = useState<string>(initialView || "collective");
  const [speciesFilter, setSpeciesFilter] = useState<string>(initialSpecies || "all");
  const [groveScale, setGroveScale] = useState<GroveScale>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [timeOfDay] = useState<TimeOfDay>(getTimeOfDay);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const atmosphere = TIME_ATMOSPHERES[timeOfDay];
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Get user location for local grove
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      );
    }
  }, []);

  // Fetch trees and offering counts from database
  useEffect(() => {
    const fetchTrees = async () => {
      const [treesResult, offeringsResult] = await Promise.all([
        supabase
          .from('trees')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null),
        supabase
          .from('offerings')
          .select('tree_id'),
      ]);

      if (treesResult.error) {
        console.error('Error fetching trees:', treesResult.error);
        toast({ title: "Error loading trees", description: "Failed to load tree data", variant: "destructive" });
      } else {
        setTrees(treesResult.data || []);
      }

      if (!offeringsResult.error && offeringsResult.data) {
        const counts: TreeOfferings = {};
        offeringsResult.data.forEach((o) => {
          counts[o.tree_id] = (counts[o.tree_id] || 0) + 1;
        });
        setOfferingCounts(counts);
      }
    };

    fetchTrees();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trees' }, () => fetchTrees())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offerings' }, () => fetchTrees())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  // Species counts for filter panel
  const treeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trees.forEach((t) => {
      const key = t.species.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [trees]);

  // Apply filters
  const filteredTrees = useMemo(() => {
    let filtered = trees;

    if (viewMode === "personal" && userId) {
      filtered = filtered.filter((t) => t.created_by === userId);
    }

    if (speciesFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.species.toLowerCase() === speciesFilter.toLowerCase()
      );
    }

    if (groveScale !== "all" && speciesFilter !== "all") {
      const speciesTrees = filtered;

      if (groveScale === "local") {
        const mc = map.current ? map.current.getCenter() : null;
        const center = userLocation || (mc ? { lat: mc.lat, lng: mc.lng } : null);
        if (center) {
          const withDist = speciesTrees.map((t) => ({
            ...t,
            dist: haversineKm(center.lat, center.lng, t.latitude, t.longitude),
          }));
          withDist.sort((a, b) => a.dist - b.dist);
          filtered = withDist.slice(0, 12);
        }
      } else if (groveScale === "regional") {
        const mc = map.current ? map.current.getCenter() : null;
        const center = userLocation || (mc ? { lat: mc.lat, lng: mc.lng } : null);
        if (center) {
          filtered = speciesTrees.filter(
            (t) => haversineKm(center.lat, center.lng, t.latitude, t.longitude) <= 200
          );
        }
      } else if (groveScale === "national") {
        const mc = map.current ? map.current.getCenter() : null;
        const center = userLocation || (mc ? { lat: mc.lat, lng: mc.lng } : null);
        if (center && speciesTrees.length > 0) {
          let nearest = speciesTrees[0];
          let nearestDist = Infinity;
          speciesTrees.forEach((t) => {
            const d = haversineKm(center.lat, center.lng, t.latitude, t.longitude);
            if (d < nearestDist) { nearestDist = d; nearest = t; }
          });
          if (nearest.nation) {
            filtered = speciesTrees.filter((t) => t.nation === nearest.nation);
          }
        }
      } else if (groveScale === "continental") {
        const mc = map.current ? map.current.getCenter() : null;
        const center = userLocation || (mc ? { lat: mc.lat, lng: mc.lng } : null);
        if (center) {
          const userContinent = getContinent(center.lat, center.lng);
          filtered = speciesTrees.filter(
            (t) => getContinent(t.latitude, t.longitude) === userContinent
          );
        }
      }
    }

    return filtered;
  }, [trees, viewMode, speciesFilter, groveScale, userId, userLocation]);

  // Initialize map — MapLibre GL (no token needed)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Detect iOS for immediate Leaflet default
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const webgl = isWebGLSupported();

    if (!webgl) {
      console.warn('[Atlas] WebGL unsupported — using Leaflet');
      setDebugInfo(prev => ({ ...prev, webgl: false, error: 'WebGL unsupported' }));
      setMapStatus("leaflet");
      return;
    }

    // On iOS, default to Leaflet instantly for reliability.
    // Only attempt WebGL if user explicitly clicked "Try WebGL".
    if (isIOS && !sessionStorage.getItem('atlas-try-webgl')) {
      console.log('[Atlas] iOS — instant Leaflet for reliability');
      setMapStatus("leaflet");
      return;
    }
    // Clear the flag after use
    sessionStorage.removeItem('atlas-try-webgl');

    setDebugInfo(prev => ({ ...prev, webgl: true }));

    // Use rAF to ensure layout is settled before init
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let aborted = false;
    const rafId = requestAnimationFrame(() => {
      if (aborted) return;
      const container = mapContainer.current;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      setDebugInfo(prev => ({ ...prev, width, height }));

      if (width === 0 || height === 0) {
        console.warn(`[Atlas] Container has zero dimensions: ${width}×${height}`);
        setMapStatus("leaflet");
        return;
      }

      function fallbackToLeaflet(reason: string) {
        if (aborted) return;
        aborted = true;
        console.warn(`[Atlas] Auto-fallback to Leaflet: ${reason}`);
        clearTimeout(timeoutId);
        setMapStatus("leaflet");
        try { m?.remove(); } catch {}
        map.current = null;
      }

      let m: maplibregl.Map;
      try {
        const style = getMapStyle();
        m = new maplibregl.Map({
          container,
          style: style as any,
          center: [0, 20],
          zoom: 2,
          attributionControl: false,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Atlas] Map initialization failed:', msg);
        setMapStatus("leaflet");
        return;
      }

      // Handle WebGL context loss (common on iOS under memory pressure)
      const canvas = m.getCanvas();
      if (canvas) {
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          fallbackToLeaflet("WebGL context lost");
        });
      }

      // Faster timeout on iOS (5s) vs desktop (8s)
      const timeoutMs = isIOS ? 5000 : 8000;
      timeoutId = setTimeout(() => {
        if (mapStatusRef.current === "loading") {
          fallbackToLeaflet("MapLibre timed out");
        }
      }, timeoutMs);

      // Track tile data arrival
      let tileDataReceived = false;
      m.on('sourcedata', (e) => {
        if (e.isSourceLoaded && !tileDataReceived) {
          tileDataReceived = true;
          console.log('[Atlas] Tile source data received');
        }
      });

      m.on('load', () => {
        if (aborted) return;
        clearTimeout(timeoutId);
        setDebugInfo(prev => ({ ...prev, style: true }));
        const c = m.getCenter();
        setMapCenter({ lat: c.lat, lng: c.lng });
        m.resize();
        console.log('[Atlas] MapLibre style loaded');

        // Validate tiles rendered — use idle event + tile data check
        const checkDelay = isIOS ? 2000 : 3000;

        // Wait for map to go idle (all tiles rendered) or timeout
        let idleFired = false;
        m.once('idle', () => { idleFired = true; });

        // Canvas pixel validation — catches iOS blank-but-initialized state
        function canvasHasContent(): boolean {
          try {
            const cvs = m.getCanvas();
            if (!cvs) return false;
            const gl = cvs.getContext("webgl2") || cvs.getContext("webgl");
            if (!gl) return false;
            const w = gl.drawingBufferWidth;
            const h = gl.drawingBufferHeight;
            // Sample 5 points across the canvas
            const points = [
              [Math.floor(w / 2), Math.floor(h / 2)],
              [Math.floor(w / 4), Math.floor(h / 4)],
              [Math.floor(3 * w / 4), Math.floor(h / 4)],
              [Math.floor(w / 4), Math.floor(3 * h / 4)],
              [Math.floor(3 * w / 4), Math.floor(3 * h / 4)],
            ];
            for (const [sx, sy] of points) {
              const px = new Uint8Array(4);
              gl.readPixels(sx, sy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
              // Non-black, non-transparent pixel = content rendered
              if (px[0] > 10 || px[1] > 10 || px[2] > 10) return true;
            }
            return false;
          } catch { return false; }
        }

        setTimeout(() => {
          if (aborted) return;

          // Primary check: did tile source data arrive?
          if (!tileDataReceived) {
            fallbackToLeaflet("No tile data received after style load");
            return;
          }

          // Secondary check: did the map reach idle (tiles painted)?
          if (idleFired) {
            // On iOS, also verify canvas has actual pixel content
            if (isIOS && !canvasHasContent()) {
              console.warn('[Atlas] iOS: idle fired but canvas is blank — retrying');
              // Give one more second for tiles to paint
              setTimeout(() => {
                if (aborted) return;
                if (canvasHasContent()) {
                  setMapStatus("ready");
                  console.log('[Atlas] iOS: MapLibre ready after pixel recheck');
                } else {
                  fallbackToLeaflet("iOS: canvas blank despite idle");
                }
              }, 1500);
              return;
            }
            setMapStatus("ready");
            console.log('[Atlas] MapLibre ready — idle confirmed');
            return;
          }

          // Idle hasn't fired yet — give more time, then fallback
          console.warn('[Atlas] Map not idle yet — waiting 3s more');
          const retryTimeout = setTimeout(() => {
            if (aborted) return;
            if (idleFired) {
              if (isIOS && !canvasHasContent()) {
                fallbackToLeaflet("iOS: canvas blank after extended wait");
                return;
              }
              setMapStatus("ready");
              console.log('[Atlas] MapLibre ready after extended wait');
            } else {
              fallbackToLeaflet("Map never reached idle state");
            }
          }, 3000);

          // If idle fires during the retry window, clear the timeout
          m.once('idle', () => {
            if (aborted) return;
            clearTimeout(retryTimeout);
            if (isIOS && !canvasHasContent()) {
              setTimeout(() => {
                if (aborted) return;
                if (canvasHasContent()) {
                  setMapStatus("ready");
                } else {
                  fallbackToLeaflet("iOS: late idle but canvas still blank");
                }
              }, 1000);
              return;
            }
            setMapStatus("ready");
            console.log('[Atlas] MapLibre ready — late idle');
          });
        }, checkDelay);
      });

      m.on('moveend', () => {
        const c = m.getCenter();
        setMapCenter({ lat: c.lat, lng: c.lng });
      });

      m.on('error', (e) => {
        if (aborted) return;
        console.error('[Atlas] MapLibre error:', e);
        const msg = (e as any)?.error?.message || (e as any)?.message || "Unknown map error";
        setMapError(msg);
        setDebugInfo(prev => ({ ...prev, error: msg }));
        if (msg.includes('Source') || msg.includes('AJAXError')) {
          console.warn('[Atlas] Non-critical tile error, map may still function');
        } else {
          fallbackToLeaflet(msg);
        }
      });

      m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      m.addControl(new maplibregl.AttributionControl({ compact: true }));

      map.current = m;
    });

    return () => {
      aborted = true;
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Resize map on visibility/tab changes
  useEffect(() => {
    const handleResize = () => { map.current?.resize(); };
    const handleVisibility = () => { if (!document.hidden) map.current?.resize(); };
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Handle deep-link params (w3w, lat/lng/zoom)
  useEffect(() => {
    if (!map.current || mapStatus !== "ready" || deepLinkHandled.current) return;
    deepLinkHandled.current = true;

    if (initialLat !== undefined && initialLng !== undefined) {
      map.current.flyTo({
        center: [initialLng, initialLat],
        zoom: initialZoom ?? 15,
        duration: 2000,
      });
    } else if (initialW3w) {
      convertToCoordinates(initialW3w).then((result) => {
        if (result && map.current) {
          map.current.flyTo({
            center: [result.coordinates.lng, result.coordinates.lat],
            zoom: initialZoom ?? 16,
            duration: 2000,
          });
          toast({ title: `///${initialW3w}`, description: "Navigated to what3words location" });
        } else {
          toast({ title: "Could not resolve address", description: `///${initialW3w}`, variant: "destructive" });
        }
      }).catch(() => {
        toast({ title: "What3words unavailable", description: "Could not resolve the address right now", variant: "destructive" });
      });
    }
  }, [mapStatus, initialLat, initialLng, initialZoom, initialW3w, toast]);


  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredTrees.forEach((tree) => {
      const offerings = offeringCounts[tree.id] || 0;
      const age = tree.estimated_age || 0;

      const isAncient = age >= 100;
      const isStoried = offerings >= 3;
      const isNotable = offerings >= 1 || age >= 50;

      const size = isAncient ? 40 : isStoried ? 36 : isNotable ? 32 : 28;
      const strokeColor = isAncient ? 'hsl(42, 90%, 55%)' : isStoried ? 'hsl(42, 70%, 50%)' : 'hsl(45, 60%, 40%)';
      const strokeWidth = isAncient ? 2.5 : 2;
      const fillColor = isAncient ? 'hsl(120, 45%, 28%)' : 'hsl(120, 40%, 25%)';
      const leafColor = isAncient ? 'hsl(120, 55%, 40%)' : 'hsl(120, 60%, 35%)';

      const crownRing = isStoried ? `<circle cx="16" cy="16" r="15.5" fill="none" stroke="${strokeColor}" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.6"/>` : '';
      const ageDot = isAncient ? `<circle cx="16" cy="5" r="2" fill="hsl(42, 95%, 60%)" opacity="0.9"/>` : '';

      const svgContent = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${crownRing}
        <circle cx="16" cy="16" r="14" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <path d="M16 8C13.8 8 12 9.8 12 12C12 13.5 12.7 14.8 13.8 15.6C12.7 16.4 12 17.7 12 19.2C12 21.4 13.8 23.2 16 23.2C18.2 23.2 20 21.4 20 19.2C20 17.7 19.3 16.4 18.2 15.6C19.3 14.8 20 13.5 20 12C20 9.8 18.2 8 16 8Z" fill="${leafColor}"/>
        <rect x="14.5" y="22" width="3" height="6" fill="hsl(30, 40%, 30%)"/>
        ${ageDot}
      </svg>`;

      const el = document.createElement('div');
      el.className = 'tree-marker';
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-image: url('data:image/svg+xml;base64,${btoa(svgContent)}');
        background-size: contain;
        cursor: pointer;
        transition: filter 0.3s, transform 0.3s;
        ${isAncient ? 'animation: ancientPulse 4s ease-in-out infinite;' : ''}
      `;

      el.addEventListener('mouseenter', () => {
        el.style.filter = `brightness(1.4) drop-shadow(0 0 ${isAncient ? '8' : '4'}px ${strokeColor})`;
        el.style.transform = 'scale(1.15)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.filter = 'none';
        el.style.transform = 'scale(1)';
      });

      const offeringBadge = offerings > 0
        ? `<div style="margin: 6px 0 0; display: flex; align-items: center; gap: 4px;">
             <span style="font-size: 10px; color: hsl(42, 80%, 60%);">✦</span>
             <span style="font-size: 10px; color: hsl(42, 60%, 55%);">${offerings} offering${offerings !== 1 ? 's' : ''} left here</span>
           </div>`
        : `<div style="margin: 6px 0 0;">
             <span style="font-size: 10px; color: hsl(0, 0%, 50%); font-style: italic;">No offerings yet — be the first</span>
           </div>`;

      const ageBadge = age > 0
        ? `<span style="display: inline-block; margin-left: 6px; padding: 1px 6px; font-size: 9px; border-radius: 999px; background: hsla(42, 80%, 50%, 0.15); color: hsl(42, 80%, 60%); border: 1px solid hsla(42, 80%, 50%, 0.3);">~${age} years</span>`
        : '';

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        className: 'tree-popup',
      }).setHTML(`
        <div style="padding: 12px; font-family: 'Cinzel', serif; min-width: 230px;">
          <h3 style="margin: 0 0 2px 0; font-size: 16px; color: hsl(45, 80%, 60%); line-height: 1.3;">${escapeHtml(tree.name)}${ageBadge}</h3>
          <p style="margin: 0 0 2px 0; font-size: 12px; color: hsl(120, 40%, 70%);">${escapeHtml(tree.species)}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(45, 60%, 50%);">📍 ${escapeHtml(tree.what3words || '')}</p>
          ${tree.description ? `<p style="margin: 6px 0 0 0; font-size: 11px; color: hsl(0, 0%, 70%); line-height: 1.4;">${escapeHtml(tree.description.substring(0, 120))}${tree.description.length > 120 ? '\u2026' : ''}</p>` : ''}
          ${offeringBadge}
          <a href="/tree/${encodeURIComponent(tree.id)}" style="display: block; margin-top: 10px; padding: 8px 0; text-align: center; font-size: 12px; color: hsl(80, 20%, 8%); background: linear-gradient(135deg, hsl(42, 88%, 50%), hsl(45, 100%, 60%)); border-radius: 6px; text-decoration: none; letter-spacing: 0.1em; font-weight: 600;">View Ancient Friend &#10230;</a>
          <div style="margin-top: 8px; display: flex; gap: 8px; justify-content: center;">
            <a href="/tree/${encodeURIComponent(tree.id)}?add=photo" style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; font-size: 16px; color: hsl(120, 60%, 50%); text-decoration: none; border: 1px solid hsla(120,60%,50%,0.3); border-radius: 8px; transition: background 0.2s;" title="Add Memory">📷</a>
            <a href="/tree/${encodeURIComponent(tree.id)}?add=song" style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; font-size: 16px; color: hsl(200, 60%, 50%); text-decoration: none; border: 1px solid hsla(200,60%,50%,0.3); border-radius: 8px; transition: background 0.2s;" title="Add Song">🎵</a>
            <a href="/tree/${encodeURIComponent(tree.id)}?add=story" style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; font-size: 16px; color: hsl(280, 60%, 50%); text-decoration: none; border: 1px solid hsla(280,60%,50%,0.3); border-radius: 8px; transition: background 0.2s;" title="Add Musing">💭</a>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([tree.longitude, tree.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        map.current?.flyTo({ center: [tree.longitude, tree.latitude], zoom: 15, duration: 2000 });
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if grove scale is active and we have trees
    if (groveScale !== "all" && filteredTrees.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      filteredTrees.forEach((t) => bounds.extend([t.longitude, t.latitude]));
      map.current.fitBounds(bounds, { padding: 80, duration: 1500 });
    }
  }, [filteredTrees, groveScale, offeringCounts]);

  // Draw grove boundary polygon
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const drawBoundary = () => {
      if (m.getLayer(GROVE_FILL_ID)) m.removeLayer(GROVE_FILL_ID);
      if (m.getLayer(GROVE_LINE_ID)) m.removeLayer(GROVE_LINE_ID);
      if (m.getSource(GROVE_SOURCE_ID)) m.removeSource(GROVE_SOURCE_ID);

      if (groveScale === "all" || filteredTrees.length === 0) return;

      const bufferKm =
        groveScale === "local" ? 5 :
        groveScale === "regional" ? 20 :
        groveScale === "national" ? 50 : 100;

      const feature = createGroveBoundary(filteredTrees, bufferKm);
      if (!feature) return;

      m.addSource(GROVE_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [feature],
        },
      });

      m.addLayer({
        id: GROVE_FILL_ID,
        type: 'fill',
        source: GROVE_SOURCE_ID,
        paint: {
          'fill-color': groveScale === 'local' ? 'hsl(120, 60%, 35%)' :
                         groveScale === 'regional' ? 'hsl(45, 80%, 50%)' :
                         groveScale === 'national' ? 'hsl(200, 60%, 45%)' :
                         'hsl(280, 50%, 45%)',
          'fill-opacity': 0.12,
        },
      });

      m.addLayer({
        id: GROVE_LINE_ID,
        type: 'line',
        source: GROVE_SOURCE_ID,
        paint: {
          'line-color': groveScale === 'local' ? 'hsl(120, 60%, 50%)' :
                         groveScale === 'regional' ? 'hsl(45, 80%, 60%)' :
                         groveScale === 'national' ? 'hsl(200, 60%, 60%)' :
                         'hsl(280, 50%, 60%)',
          'line-width': 2.5,
          'line-opacity': 0.7,
          'line-dasharray': [4, 2],
        },
      });
    };

    if (m.isStyleLoaded()) {
      drawBoundary();
    } else {
      m.once('load', drawBoundary);
    }

    return () => {
      try {
        if (m.getStyle()) {
          if (m.getLayer(GROVE_FILL_ID)) m.removeLayer(GROVE_FILL_ID);
          if (m.getLayer(GROVE_LINE_ID)) m.removeLayer(GROVE_LINE_ID);
          if (m.getSource(GROVE_SOURCE_ID)) m.removeSource(GROVE_SOURCE_ID);
        }
      } catch {
        // Map already removed
      }
    };
  }, [filteredTrees, groveScale]);

  // Draw golden root threads between nearby same-species trees
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const drawThreads = () => {
      if (m.getLayer(ROOT_THREADS_LAYER)) m.removeLayer(ROOT_THREADS_LAYER);
      if (m.getSource(ROOT_THREADS_SOURCE)) m.removeSource(ROOT_THREADS_SOURCE);

      const bySpecies: Record<string, Tree[]> = {};
      filteredTrees.forEach((t) => {
        const key = t.species.toLowerCase();
        if (!bySpecies[key]) bySpecies[key] = [];
        bySpecies[key].push(t);
      });

      const features: GeoJSON.Feature[] = [];
      Object.values(bySpecies).forEach((group) => {
        if (group.length < 2) return;
        for (let i = 0; i < group.length; i++) {
          const a = group[i];
          const neighbours = group
            .map((b, j) => ({ b, j, dist: i === j ? Infinity : haversineKm(a.latitude, a.longitude, b.latitude, b.longitude) }))
            .filter((n) => n.dist <= ROOT_THREAD_MAX_KM && n.j > i)
            .sort((x, y) => x.dist - y.dist)
            .slice(0, 3);

          neighbours.forEach(({ b, dist }) => {
            features.push({
              type: 'Feature',
              properties: { distance: dist, species: a.species },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [a.longitude, a.latitude],
                  [b.longitude, b.latitude],
                ],
              },
            });
          });
        }
      });

      if (features.length === 0) return;

      m.addSource(ROOT_THREADS_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      m.addLayer({
        id: ROOT_THREADS_LAYER,
        type: 'line',
        source: ROOT_THREADS_SOURCE,
        minzoom: 5,
        paint: {
          'line-color': 'hsla(220, 15%, 65%, 0.4)',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            5, 0.2,
            10, 0.8,
            14, 1.5,
          ],
          'line-opacity': [
            'interpolate', ['linear'], ['zoom'],
            5, 0,
            7, 0.1,
            10, 0.25,
            14, 0.4,
          ],
          'line-dasharray': [6, 4],
        },
      });
    };

    if (m.isStyleLoaded()) {
      drawThreads();
    } else {
      m.once('load', drawThreads);
    }

    return () => {
      try {
        if (m.getStyle()) {
          if (m.getLayer(ROOT_THREADS_LAYER)) m.removeLayer(ROOT_THREADS_LAYER);
          if (m.getSource(ROOT_THREADS_SOURCE)) m.removeSource(ROOT_THREADS_SOURCE);
        }
      } catch {
        // Map already removed
      }
    };
  }, [filteredTrees]);

  // Draw golden Creator's Paths
  useEffect(() => {
    const m = map.current;
    if (!m || mapStatus !== 'ready') return;

    const drawCreatorPaths = async () => {
      if (m.getLayer(CREATOR_PATHS_GLOW_LAYER)) m.removeLayer(CREATOR_PATHS_GLOW_LAYER);
      if (m.getLayer(CREATOR_PATHS_LAYER)) m.removeLayer(CREATOR_PATHS_LAYER);
      if (m.getSource(CREATOR_PATHS_SOURCE)) m.removeSource(CREATOR_PATHS_SOURCE);

      const { data: offerings, error } = await supabase
        .from('offerings')
        .select('tree_id, created_by, created_at')
        .not('created_by', 'is', null)
        .order('created_at', { ascending: true });

      if (error || !offerings || offerings.length === 0) return;

      const treeLookup: Record<string, Tree> = {};
      trees.forEach((t) => { treeLookup[t.id] = t; });

      const byCreator: Record<string, string[]> = {};
      offerings.forEach((o) => {
        if (!o.created_by) return;
        if (!byCreator[o.created_by]) byCreator[o.created_by] = [];
        const last = byCreator[o.created_by];
        if (treeLookup[o.tree_id] && (last.length === 0 || last[last.length - 1] !== o.tree_id)) {
          last.push(o.tree_id);
        }
      });

      const features: GeoJSON.Feature[] = [];
      const isCurrentUser = (id: string) => id === userId;

      Object.entries(byCreator).forEach(([creatorId, treeIds]) => {
        if (treeIds.length < 2) return;
        const coords: [number, number][] = [];
        treeIds.forEach((tid) => {
          const t = treeLookup[tid];
          if (t) coords.push([t.longitude, t.latitude]);
        });
        if (coords.length < 2) return;

        const smoothCoords: [number, number][] = [coords[0]];
        for (let i = 0; i < coords.length - 1; i++) {
          const [x1, y1] = coords[i];
          const [x2, y2] = coords[i + 1];
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const offset = dist * 0.08 * (i % 2 === 0 ? 1 : -1);
          const perpX = -dy / (dist || 1) * offset;
          const perpY = dx / (dist || 1) * offset;
          smoothCoords.push([mx + perpX, my + perpY]);
          smoothCoords.push(coords[i + 1]);
        }

        features.push({
          type: 'Feature',
          properties: {
            isWalked: isCurrentUser(creatorId) ? 1 : 0,
            creatorId,
          },
          geometry: {
            type: 'LineString',
            coordinates: smoothCoords,
          },
        });
      });

      if (features.length === 0) return;

      m.addSource(CREATOR_PATHS_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      m.addLayer({
        id: CREATOR_PATHS_GLOW_LAYER,
        type: 'line',
        source: CREATOR_PATHS_SOURCE,
        minzoom: 3,
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'isWalked'], 1],
            'hsla(42, 90%, 55%, 0.25)',
            'hsla(220, 20%, 70%, 0.15)',
          ],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            3, 2,
            8, 6,
            14, 10,
          ],
          'line-blur': [
            'interpolate', ['linear'], ['zoom'],
            3, 2,
            8, 4,
            14, 6,
          ],
          'line-opacity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.15,
            6, 0.3,
            10, 0.5,
          ],
        },
      });

      m.addLayer({
        id: CREATOR_PATHS_LAYER,
        type: 'line',
        source: CREATOR_PATHS_SOURCE,
        minzoom: 3,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'isWalked'], 1],
            'hsl(42, 90%, 58%)',
            'hsl(220, 15%, 72%)',
          ],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.5,
            8, 1.5,
            14, 3,
          ],
          'line-opacity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.3,
            6, 0.5,
            10, 0.75,
            14, 0.9,
          ],
        },
      });
    };

    if (m.isStyleLoaded()) {
      drawCreatorPaths();
    } else {
      m.once('load', drawCreatorPaths);
    }

    return () => {
      try {
        if (m.getStyle()) {
          if (m.getLayer(CREATOR_PATHS_GLOW_LAYER)) m.removeLayer(CREATOR_PATHS_GLOW_LAYER);
          if (m.getLayer(CREATOR_PATHS_LAYER)) m.removeLayer(CREATOR_PATHS_LAYER);
          if (m.getSource(CREATOR_PATHS_SOURCE)) m.removeSource(CREATOR_PATHS_SOURCE);
        }
      } catch {
        // Map already removed
      }
    };
  }, [trees, userId, mapStatus]);

  const handleLocationSelect = (lat: number, lng: number, what3words: string) => {
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 15, duration: 2000 });
    }
  };

  // Leaflet fallback mode
  if (mapStatus === "leaflet") {
    return (
      <div className="fixed inset-0 z-[1]" style={{ height: '100dvh' }}>
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-serif text-sm text-foreground">Loading Lite Mode…</p>
          </div>
        }>
          <LeafletFallbackMap trees={trees} offeringCounts={offeringCounts} userId={userId} />
        </Suspense>
        <button
          onClick={() => {
            sessionStorage.setItem('atlas-try-webgl', '1');
            map.current = null;
            setMapStatus("loading");
          }}
          className="absolute top-2 right-2 z-[1002] flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-serif text-[11px] transition-all hover:brightness-125 active:scale-95"
          style={{ background: "hsla(30,30%,12%,0.88)", color: "hsl(42,60%,60%)", border: "1px solid hsla(42,40%,30%,0.5)", backdropFilter: "blur(6px)" }}
          title="Switch to WebGL mode"
        >
          🗺️ Try WebGL
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[1]">
      {/* Map canvas — no opaque background so WebGL canvas is always visible */}
      <div ref={mapContainer} className="absolute inset-0" style={{ zIndex: 0, background: '#faf7f0' }} />

      {/* Loading / Error overlay (kept non-occluding) */}
      {mapStatus !== "ready" && (
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-4 pointer-events-none" style={{
          background: mapStatus === "loading"
            ? 'radial-gradient(ellipse at center, hsla(30, 20%, 8%, 0.95) 0%, hsla(30, 20%, 6%, 0.98) 100%)'
            : 'transparent',
        }}>
          {mapStatus === "loading" && (
            <div className="flex flex-col items-center gap-5 animate-fade-in">
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
                  background: 'radial-gradient(circle, hsla(120, 40%, 25%, 0.4), transparent 70%)',
                }}>
                  <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px hsla(42, 80%, 50%, 0.4))' }}>🌳</span>
                </div>
                <div className="absolute inset-[-8px] rounded-full border-2 border-transparent animate-spin" style={{
                  borderTopColor: 'hsl(42, 80%, 55%)',
                  borderRightColor: 'hsla(42, 80%, 55%, 0.15)',
                  animationDuration: '2.5s',
                }} />
                <div className="absolute inset-[-16px] rounded-full border border-transparent animate-spin" style={{
                  borderTopColor: 'hsla(120, 50%, 45%, 0.3)',
                  animationDuration: '4s',
                  animationDirection: 'reverse',
                }} />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <p className="font-serif text-sm tracking-wide" style={{ color: 'hsl(42, 70%, 60%)' }}>
                  Awakening the Atlas…
                </p>
                <p className="font-serif text-xs" style={{ color: 'hsla(42, 40%, 55%, 0.6)' }}>
                  Preparing ancient cartography
                </p>
              </div>
              <div className="flex gap-1.5 mt-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{
                    background: 'hsl(42, 70%, 55%)',
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: '1.2s',
                  }} />
                ))}
              </div>
              {/* Quick escape back to Lite Mode while WebGL is loading */}
              <button
                onClick={() => {
                  map.current?.remove();
                  map.current = null;
                  setMapStatus("leaflet");
                }}
                className="mt-3 pointer-events-auto px-4 py-2 rounded-full font-serif text-xs transition-all hover:brightness-125"
                style={{ background: "hsla(120,30%,18%,0.6)", color: "hsl(42,60%,60%)", border: "1px solid hsla(42,40%,30%,0.4)" }}
              >
                🍃 Back to Lite Mode
              </button>
            </div>
          )}
          {mapStatus === "error" && (
            <div className="flex flex-col items-center gap-3 pointer-events-auto px-6 text-center max-w-sm">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-card border border-border">
                <span className="text-xl">🌿</span>
              </div>
              <p className="font-serif text-base text-foreground">The Atlas could not awaken</p>
              <p className="text-xs text-muted-foreground">
                {mapError || "Map tiles failed to load. This may be a network issue or WebGL compatibility problem."}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2 rounded-lg font-serif text-sm transition-colors bg-primary text-primary-foreground border border-border"
                >
                  Retry
                </button>
                <button
                  onClick={() => setMapStatus("leaflet")}
                  className="px-4 py-2 rounded-lg font-serif text-sm transition-colors bg-secondary text-secondary-foreground border border-border"
                >
                  Lite Mode
                </button>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="px-3 py-2 rounded-lg font-serif text-xs transition-colors bg-card text-foreground border border-border"
                >
                  Debug
                </button>
              </div>
              {showDebug && (
                <div className="mt-3 text-left text-[10px] font-mono p-3 rounded-lg w-full bg-card text-foreground border border-border">
                  <p>renderer: MapLibre GL (open-source)</p>
                  <p>style: {debugInfo.style ? "✓ loaded" : "✗ not loaded"}</p>
                  <p>webgl: {debugInfo.webgl ? "✓" : "✗ unsupported"}</p>
                  <p>container: {debugInfo.width}×{debugInfo.height}</p>
                  <p>error: {debugInfo.error || "none"}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Atmospheric overlays disabled to ensure unobstructed map visibility */}

      <ConversionStatus />

      {/* Top bar — desktop: full toolbar, mobile: minimal floating pills */}
      <div className="hidden md:block absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <Card className="bg-card/95 backdrop-blur border-border shadow-lg text-card-foreground">
          <div className="flex items-center gap-3 p-3">
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="bg-muted">
                <TabsTrigger value="collective" className="text-sm">Collective</TabsTrigger>
                <TabsTrigger value="personal" className="text-sm">Personal Groves</TabsTrigger>
              </TabsList>
            </Tabs>
            <MapFilters
              speciesFilter={speciesFilter}
              onSpeciesChange={setSpeciesFilter}
              groveScale={groveScale}
              onGroveScaleChange={setGroveScale}
              treeCounts={treeCounts}
              totalTrees={trees.length}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredTrees.length} {filteredTrees.length === 1 ? 'tree' : 'trees'}
            </span>
          </div>
        </Card>
      </div>

      <div className="flex md:hidden absolute top-[52px] left-2 right-2 z-10 items-center gap-1.5">
        <button
          onClick={() => setViewMode(viewMode === 'collective' ? 'personal' : 'collective')}
          className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-serif backdrop-blur-md border border-border bg-card/80 text-foreground transition-colors"
        >
          {viewMode === 'collective' ? '🌍 All' : '🌿 Mine'}
        </button>
        <div className="shrink-0">
          <MapFilters
            speciesFilter={speciesFilter}
            onSpeciesChange={setSpeciesFilter}
            groveScale={groveScale}
            onGroveScaleChange={setGroveScale}
            treeCounts={treeCounts}
            totalTrees={trees.length}
          />
        </div>
        <span className="ml-auto text-[11px] font-serif px-2 py-1 rounded-full backdrop-blur-md border border-border bg-card/70 text-muted-foreground">
          {filteredTrees.length} trees
        </span>
      </div>

      {/* Time-of-day whisper — desktop only */}
      <div className="absolute top-[72px] right-4 z-10 animate-fade-in hidden md:block" style={{ animationDelay: '1s', animationFillMode: 'backwards' }}>
        <span className="font-serif text-xs px-2.5 py-1 rounded-full border border-border bg-card/70 text-muted-foreground backdrop-blur-sm">
          {timeOfDay === 'dawn' && '🌅'}
          {timeOfDay === 'day' && '☀️'}
          {timeOfDay === 'dusk' && '🌇'}
          {timeOfDay === 'night' && '✦'}
          {' '}{atmosphere.label}
        </span>
      </div>

      <MapSearch onLocationSelect={handleLocationSelect} />

      {/* Bottom controls — hidden on mobile, shown on desktop */}
      <div className="absolute bottom-2 left-2 z-10 hidden md:block">
        <FindMeButton
          autoOpen={autoAddTree}
          onLocationFound={(lat, lng) => {
            setUserLocation({ lat, lng });
            map.current?.flyTo({ center: [lng, lat], zoom: 18, duration: 2000 });
          }}
        />
      </div>

      <div className="absolute bottom-4 right-4 z-10 hidden md:flex flex-col items-end gap-2">
        <div className="relative">
          <TreeRadio speciesFilter={speciesFilter} />
        </div>
        <TreeImportExport />
        <button
          onClick={() => { map.current?.remove(); map.current = null; setMapStatus("leaflet"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-serif text-xs transition-all hover:brightness-125"
          style={{ background: "hsla(30,30%,12%,0.85)", color: "hsl(42,60%,60%)", border: "1px solid hsla(42,40%,30%,0.5)", backdropFilter: "blur(4px)" }}
          title="Switch to Lite Mode (Leaflet)"
        >
          🍃 Lite Mode
        </button>
      </div>

      {/* Mobile: compact bottom bar */}
      <div className="absolute bottom-3 left-2 right-2 z-10 flex md:hidden items-center gap-2">
        <div className="shrink-0">
          <FindMeButton
            autoOpen={autoAddTree}
            onLocationFound={(lat, lng) => {
              setUserLocation({ lat, lng });
              map.current?.flyTo({ center: [lng, lat], zoom: 18, duration: 2000 });
            }}
          />
        </div>
        <div className="ml-auto shrink-0">
          <TreeRadio speciesFilter={speciesFilter} />
        </div>
      </div>

      <MapIdleNudge trees={filteredTrees} offeringCounts={offeringCounts} mapCenter={mapCenter} />

      <style>{`
        @keyframes ancientPulse {
          0%, 100% { filter: drop-shadow(0 0 2px hsla(42, 80%, 50%, 0.3)); }
          50% { filter: drop-shadow(0 0 8px hsla(42, 80%, 50%, 0.6)); }
        }
        @keyframes vignetteBreath {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes ambientDrift {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.05); }
        }
        .tree-popup .maplibregl-popup-content {
          background: hsl(120, 40%, 15%);
          border: 1px solid hsl(45, 60%, 40%);
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px hsla(45, 60%, 40%, 0.1);
          padding: 0;
        }
        .tree-popup .maplibregl-popup-tip {
          border-top-color: hsl(120, 40%, 15%);
        }
        .tree-popup .maplibregl-popup-close-button {
          color: hsl(45, 60%, 50%);
          font-size: 18px;
          padding: 4px 8px;
        }
      `}</style>
    </div>
  );
};

export default Map;
