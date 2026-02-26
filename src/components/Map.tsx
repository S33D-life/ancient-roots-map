import { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { escapeHtml } from "@/utils/escapeHtml";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { convertToCoordinates } from "@/utils/what3words";
import { useOfferingCounts } from "@/hooks/use-offering-counts";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  haversineKm, convexHull, expandHull, createGroveBoundary, getContinent,
  getTimeOfDay, TIME_ATMOSPHERES,
  type TreeCoord, type TimeOfDay,
} from "@/utils/mapGeometry";
import type { GroveScale } from "./MapFilters";

// ── Lazy-loaded modules ──
// Core map renderer
const LeafletFallbackMap = lazy(() => import("./LeafletFallbackMap"));

// Overlay widgets — deferred to keep critical bundle small
const MapSearch = lazy(() => import("./MapSearch"));
const MapFilters = lazy(() => import("./MapFilters").then(m => ({ default: m.default })));
const ConversionStatus = lazy(() => import("./ConversionStatus"));
const FindMeButton = lazy(() => import("./FindMeButton"));
const MistOverlay = lazy(() => import("./MistOverlay"));
const TreeImportExport = lazy(() => import("./TreeImportExport"));
const TreeRadio = lazy(() => import("./TreeRadio"));


// Defer the massive maplibre-gl bundle — only imported if WebGL path is ever activated
const maplibreglPromise = () => import("maplibre-gl");
let maplibregl: any = null;
const getMapStylePromise = () => import("@/config/mapbox").then(m => m.getMapStyle);

/* ── WebGL detection ── */
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("webgl2") || canvas.getContext("experimental-webgl"));
  } catch { return false; }
}

interface TreeOfferings {
  [treeId: string]: number;
}

interface TreePhotos {
  [treeId: string]: string;
}

interface BirdsongCounts {
  [treeId: string]: number;
}

interface BirdsongHeatPoint {
  tree_id: string;
  season: string | null;
  latitude: number;
  longitude: number;
}

interface BloomedSeed {
  id: string;
  tree_id: string;
  latitude: number | null;
  longitude: number | null;
  blooms_at: string;
  planter_id: string;
}

type Tree = TreeCoord;

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

interface MapProps {
  initialView?: string;
  initialSpecies?: string;
  initialW3w?: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  initialTreeId?: string;
  initialCountry?: string;
  initialHive?: string;
  initialOrigin?: string;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
}

const Map = ({ initialView, initialSpecies, initialW3w, initialLat, initialLng, initialZoom, initialTreeId, initialCountry, initialHive, initialOrigin, onFullscreenToggle, isFullscreen }: MapProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoAddTree = searchParams.get("addTree") === "true";
  const deepLinkHandled = useRef(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [offeringCounts, setOfferingCounts] = useState<TreeOfferings>({});
  const [treePhotos, setTreePhotos] = useState<TreePhotos>({});
  // Unified offering counts from shared hook
  const { counts: sharedOfferingCounts, photos: sharedOfferingPhotos } = useOfferingCounts();
  const [birdsongCounts, setBirdsongCounts] = useState<BirdsongCounts>({});
  const [birdsongHeatPoints, setBirdsongHeatPoints] = useState<BirdsongHeatPoint[]>([]);
  const [bloomedSeeds, setBloomedSeeds] = useState<BloomedSeed[]>([]);
  const seedMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error" | "leaflet">("loading");
  const mapStatusRef = useRef(mapStatus);
  useEffect(() => { mapStatusRef.current = mapStatus; }, [mapStatus]);
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
  const [lineageFilter, setLineageFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
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
        () => {}
      );
    }
  }, []);

  // Sync offering counts from shared hook whenever they update
  useEffect(() => {
    setOfferingCounts(sharedOfferingCounts);
    setTreePhotos(sharedOfferingPhotos);
  }, [sharedOfferingCounts, sharedOfferingPhotos]);

  // Fetch trees and birdsong from database (offerings handled by shared hook)
  useEffect(() => {
    const fetchTrees = async () => {
      const [treesResult, birdsongResult] = await Promise.all([
        supabase.from('trees').select('*').not('latitude', 'is', null).not('longitude', 'is', null),
        supabase.from('birdsong_offerings').select('tree_id, season'),
      ]);

      if (treesResult.error) {
        console.error('Error fetching trees:', treesResult.error);
        toast({ title: "Error loading trees", description: "Failed to load tree data", variant: "destructive" });
      } else {
        setTrees(treesResult.data || []);
      }

      const { data: seedData } = await supabase
        .from('planted_seeds')
        .select('id, tree_id, latitude, longitude, blooms_at, planter_id')
        .is('collected_by', null)
        .lte('blooms_at', new Date().toISOString());
      setBloomedSeeds(seedData || []);

      if (!birdsongResult.error && birdsongResult.data) {
        const bCounts: BirdsongCounts = {};
        birdsongResult.data.forEach((b: any) => {
          bCounts[b.tree_id] = (bCounts[b.tree_id] || 0) + 1;
        });
        setBirdsongCounts(bCounts);

        const treeMap: Record<string, any> = {};
        (treesResult.data || []).forEach((t: any) => { treeMap[t.id] = t; });
        const heatPts: BirdsongHeatPoint[] = [];
        birdsongResult.data.forEach((b: any) => {
          const tree = treeMap[b.tree_id];
          if (tree?.latitude && tree?.longitude) {
            heatPts.push({ tree_id: b.tree_id, season: b.season, latitude: tree.latitude, longitude: tree.longitude });
          }
        });
        setBirdsongHeatPoints(heatPts);
      }
    };

    fetchTrees();

    let realtimeDebounce: ReturnType<typeof setTimeout>;
    const debouncedFetch = () => {
      clearTimeout(realtimeDebounce);
      realtimeDebounce = setTimeout(fetchTrees, 2000);
    };

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trees' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planted_seeds' }, debouncedFetch)
      .subscribe();

    return () => {
      clearTimeout(realtimeDebounce);
      supabase.removeChannel(channel);
    };
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

  const availableLineages = useMemo(() => {
    const set = new Set<string>();
    trees.forEach((t: any) => { if (t.lineage) set.add(t.lineage); });
    return Array.from(set).sort();
  }, [trees]);

  const availableProjects = useMemo(() => {
    const set = new Set<string>();
    trees.forEach((t: any) => { if (t.project_name) set.add(t.project_name); });
    return Array.from(set).sort();
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

    if (lineageFilter !== "all") {
      filtered = filtered.filter((t: any) => t.lineage === lineageFilter);
    }

    if (projectFilter !== "all") {
      filtered = filtered.filter((t: any) => t.project_name === projectFilter);
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
  }, [trees, viewMode, speciesFilter, groveScale, lineageFilter, projectFilter, userId, userLocation]);

  // Initialize map — default to Leaflet
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    console.log('[Atlas] Defaulting to Leaflet — WebGL rendering under investigation');
    setMapStatus("leaflet");
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

  // Render glowing seed heart markers for bloomed, uncollected seeds
  useEffect(() => {
    if (!map.current) return;

    seedMarkersRef.current.forEach((m) => m.remove());
    seedMarkersRef.current = [];

    const treeCoordMap: Record<string, { lat: number; lng: number }> = {};
    trees.forEach((t) => {
      if (t.latitude && t.longitude) treeCoordMap[t.id] = { lat: t.latitude, lng: t.longitude };
    });

    const seedsByTree: Record<string, number> = {};
    bloomedSeeds.forEach((s) => {
      seedsByTree[s.tree_id] = (seedsByTree[s.tree_id] || 0) + 1;
    });

    Object.entries(seedsByTree).forEach(([treeId, count]) => {
      const coords = treeCoordMap[treeId];
      if (!coords) return;

      const safeCount = Number(count) || 0;
      const el = document.createElement('div');
      el.className = 'seed-heart-marker';
      const icon = document.createElement('span');
      icon.className = 'seed-heart-icon';
      icon.textContent = '💚';
      el.appendChild(icon);
      if (safeCount > 1) {
        const badge = document.createElement('span');
        badge.className = 'seed-heart-count';
        badge.textContent = String(safeCount);
        el.appendChild(badge);
      }
      el.title = `${safeCount} bloomed heart${safeCount !== 1 ? 's' : ''} ready to collect!`;

      const popupDiv = document.createElement('div');
      popupDiv.style.cssText = 'padding: 12px; font-family: "Cinzel", serif; min-width: 180px; text-align: center;';
      const pEmoji = document.createElement('p');
      pEmoji.style.cssText = 'margin: 0; font-size: 20px;';
      pEmoji.textContent = '💚';
      const pCount = document.createElement('p');
      pCount.style.cssText = 'margin: 6px 0 2px; font-size: 14px; color: hsl(120, 50%, 60%); font-weight: 700;';
      pCount.textContent = `${safeCount} Bloomed Heart${safeCount !== 1 ? 's' : ''}`;
      const pHint = document.createElement('p');
      pHint.style.cssText = 'margin: 0 0 8px; font-size: 11px; color: hsl(42, 50%, 55%);';
      pHint.textContent = 'Ready to collect — visit this tree!';
      const link = document.createElement('a');
      link.href = `/tree/${encodeURIComponent(treeId)}`;
      link.style.cssText = 'display: block; padding: 8px 0; text-align: center; font-size: 12px; color: hsl(80, 20%, 8%); background: linear-gradient(135deg, hsl(120, 50%, 45%), hsl(80, 60%, 50%)); border-radius: 6px; text-decoration: none; letter-spacing: 0.06em; font-weight: 600;';
      link.textContent = 'Collect Hearts ⟶';
      popupDiv.append(pEmoji, pCount, pHint, link);

      const popup = new maplibregl.Popup({ offset: 20, closeButton: true, className: 'tree-popup' })
        .setDOMContent(popupDiv);

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup)
        .addTo(map.current!);

      seedMarkersRef.current.push(marker);
    });
  }, [bloomedSeeds, trees]);

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
        data: { type: 'FeatureCollection', features: [feature] },
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
      } catch {}
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
                coordinates: [[a.longitude, a.latitude], [b.longitude, b.latitude]],
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
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.2, 10, 0.8, 14, 1.5],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0, 7, 0.1, 10, 0.25, 14, 0.4],
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
      } catch {}
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
          properties: { isWalked: isCurrentUser(creatorId) ? 1 : 0, creatorId },
          geometry: { type: 'LineString', coordinates: smoothCoords },
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
          'line-color': ['case', ['==', ['get', 'isWalked'], 1], 'hsla(42, 90%, 55%, 0.25)', 'hsla(220, 20%, 70%, 0.15)'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 2, 8, 6, 14, 10],
          'line-blur': ['interpolate', ['linear'], ['zoom'], 3, 2, 8, 4, 14, 6],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.15, 6, 0.3, 10, 0.5],
        },
      });

      m.addLayer({
        id: CREATOR_PATHS_LAYER,
        type: 'line',
        source: CREATOR_PATHS_SOURCE,
        minzoom: 3,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['case', ['==', ['get', 'isWalked'], 1], 'hsl(42, 90%, 58%)', 'hsl(220, 15%, 72%)'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 8, 1.5, 14, 3],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.3, 6, 0.5, 10, 0.75, 14, 0.9],
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
      } catch {}
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
          <LeafletFallbackMap trees={trees} offeringCounts={offeringCounts} treePhotos={treePhotos} birdsongCounts={birdsongCounts} birdsongHeatPoints={birdsongHeatPoints} userId={userId} bloomedSeeds={bloomedSeeds} initialLat={initialLat} initialLng={initialLng} initialZoom={initialZoom} initialW3w={initialW3w} initialTreeId={initialTreeId} initialCountry={initialCountry} initialHive={initialHive} initialOrigin={initialOrigin} onFullscreenToggle={onFullscreenToggle} isFullscreen={isFullscreen} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="absolute inset-0" style={{ zIndex: 1 }}>
      <div ref={mapContainer} className="absolute inset-0" style={{ zIndex: 0, background: '#faf7f0' }} />

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
                <p className="font-serif text-sm tracking-wide" style={{ color: 'hsl(42, 70%, 60%)' }}>Awakening the Atlas…</p>
                <p className="font-serif text-xs" style={{ color: 'hsla(42, 40%, 55%, 0.6)' }}>Preparing ancient cartography</p>
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
              <button
                onClick={() => { map.current?.remove(); map.current = null; setMapStatus("leaflet"); }}
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
                <button onClick={() => window.location.reload()} className="px-5 py-2 rounded-lg font-serif text-sm transition-colors bg-primary text-primary-foreground border border-border">Retry</button>
                <button onClick={() => setMapStatus("leaflet")} className="px-4 py-2 rounded-lg font-serif text-sm transition-colors bg-secondary text-secondary-foreground border border-border">Lite Mode</button>
                <button onClick={() => setShowDebug(!showDebug)} className="px-3 py-2 rounded-lg font-serif text-xs transition-colors bg-card text-foreground border border-border">Debug</button>
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

      <Suspense fallback={null}>
        <ConversionStatus />
      </Suspense>

      {/* Top bar — desktop: full toolbar, mobile: minimal floating pills */}
      <div className="hidden md:block absolute top-[72px] left-1/2 -translate-x-1/2 z-10">
        <Card className="bg-card/95 backdrop-blur border-border shadow-lg text-card-foreground">
          <div className="flex items-center gap-3 p-3">
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="bg-muted">
                <TabsTrigger value="collective" className="text-sm">Collective</TabsTrigger>
                <TabsTrigger value="personal" className="text-sm">Personal Groves</TabsTrigger>
              </TabsList>
            </Tabs>
            <Suspense fallback={<span className="text-xs text-muted-foreground">…</span>}>
              <MapFilters
                speciesFilter={speciesFilter}
                onSpeciesChange={setSpeciesFilter}
                groveScale={groveScale}
                onGroveScaleChange={setGroveScale}
                treeCounts={treeCounts}
                totalTrees={trees.length}
                lineageFilter={lineageFilter}
                onLineageChange={setLineageFilter}
                availableLineages={availableLineages}
                projectFilter={projectFilter}
                onProjectChange={setProjectFilter}
                availableProjects={availableProjects}
              />
            </Suspense>
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
          <Suspense fallback={null}>
            <MapFilters
              speciesFilter={speciesFilter}
              onSpeciesChange={setSpeciesFilter}
              groveScale={groveScale}
              onGroveScaleChange={setGroveScale}
              treeCounts={treeCounts}
              totalTrees={trees.length}
              lineageFilter={lineageFilter}
              onLineageChange={setLineageFilter}
              availableLineages={availableLineages}
              projectFilter={projectFilter}
              onProjectChange={setProjectFilter}
              availableProjects={availableProjects}
            />
          </Suspense>
        </div>
        <span className="ml-auto text-[11px] font-serif px-2 py-1 rounded-full backdrop-blur-md border border-border bg-card/70 text-muted-foreground">
          {filteredTrees.length} trees
        </span>
      </div>

      {/* Time-of-day whisper — desktop only */}
      <div className="absolute top-[130px] right-4 z-10 animate-fade-in hidden md:block" style={{ animationDelay: '1s', animationFillMode: 'backwards' }}>
        <span className="font-serif text-xs px-2.5 py-1 rounded-full border border-border bg-card/70 text-muted-foreground backdrop-blur-sm">
          {timeOfDay === 'dawn' && '🌅'}
          {timeOfDay === 'day' && '☀️'}
          {timeOfDay === 'dusk' && '🌇'}
          {timeOfDay === 'night' && '✦'}
          {' '}{atmosphere.label}
        </span>
      </div>

      <Suspense fallback={null}>
        <MapSearch onLocationSelect={handleLocationSelect} />
      </Suspense>

      {/* Bottom controls — hidden on mobile, shown on desktop */}
      <div className="absolute bottom-2 left-2 z-10 hidden md:block">
        <Suspense fallback={null}>
          <FindMeButton
            autoOpen={autoAddTree}
            onLocationFound={(lat, lng) => {
              setUserLocation({ lat, lng });
              map.current?.flyTo({ center: [lng, lat], zoom: 18, duration: 2000 });
            }}
          />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <div className="absolute bottom-4 right-16 z-10 hidden md:flex flex-col items-end gap-2">
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
      </Suspense>

      {/* Mobile: compact bottom bar */}
      <div className="absolute bottom-14 left-2 right-2 z-10 flex md:hidden items-center gap-2">
        <div className="shrink-0">
          <Suspense fallback={null}>
            <FindMeButton
              autoOpen={autoAddTree}
              onLocationFound={(lat, lng) => {
                setUserLocation({ lat, lng });
                map.current?.flyTo({ center: [lng, lat], zoom: 18, duration: 2000 });
              }}
            />
          </Suspense>
        </div>
        <div className="ml-auto shrink-0 flex items-center gap-2">
          <button
            onClick={() => { map.current?.remove(); map.current = null; setMapStatus("leaflet"); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full font-serif text-[11px] transition-all active:scale-95"
            style={{ background: "hsla(30,30%,12%,0.88)", color: "hsl(42,60%,60%)", border: "1px solid hsla(42,40%,30%,0.5)", backdropFilter: "blur(6px)" }}
          >
            🍃 Lite
          </button>
          <Suspense fallback={null}>
            <TreeRadio speciesFilter={speciesFilter} />
          </Suspense>
        </div>
      </div>


      {/* Staff Room button */}
      <button
        onClick={() => navigate("/library/staff-room")}
        className="absolute bottom-2 right-2 z-10 w-8 h-14 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        title="Staff Room"
        aria-label="Staff Room"
        style={{ background: "transparent", border: "none" }}
      >
        <div
          className="w-[2px] h-10 rounded-full"
          style={{
            background: "linear-gradient(to bottom, hsla(42,80%,60%,0.9), hsla(42,60%,35%,0.4))",
            boxShadow: "0 0 6px 1px hsla(42,80%,50%,0.5), 0 0 14px 2px hsla(42,80%,50%,0.2)",
          }}
        />
      </button>

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
        .tree-popup .maplibregl-popup-tip { border-top-color: hsl(120, 40%, 15%); }
        .tree-popup .maplibregl-popup-close-button { color: hsl(45, 60%, 50%); font-size: 18px; padding: 4px 8px; }
        .seed-heart-marker {
          position: relative; cursor: pointer;
          animation: seedHeartPulse 2s ease-in-out infinite;
          z-index: 5;
          filter: drop-shadow(0 0 6px hsla(120, 60%, 50%, 0.5));
        }
        .seed-heart-icon { font-size: 22px; display: block; }
        .seed-heart-count {
          position: absolute; top: -4px; right: -8px;
          background: hsl(120, 50%, 40%); color: hsl(0, 0%, 100%);
          font-size: 9px; font-weight: 700; font-family: sans-serif;
          min-width: 16px; height: 16px; line-height: 16px;
          text-align: center; border-radius: 99px;
          border: 1.5px solid hsl(120, 40%, 15%);
        }
        @keyframes seedHeartPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px hsla(120, 60%, 50%, 0.4)); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 10px hsla(120, 60%, 50%, 0.7)); }
        }
        .staff-glow-btn { animation: staffGlow 3s ease-in-out infinite; }
        @keyframes staffGlow {
          0%, 100% { box-shadow: 0 0 8px hsla(42,80%,50%,0.3), inset 0 0 6px hsla(42,80%,50%,0.1); }
          50% { box-shadow: 0 0 18px hsla(42,80%,50%,0.6), inset 0 0 10px hsla(42,80%,50%,0.2); }
        }
      `}</style>
    </div>
  );
};

export default Map;
