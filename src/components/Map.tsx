import { useEffect, useRef, useState, useMemo } from "react";
import { escapeHtml } from "@/utils/escapeHtml";
import { useSearchParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
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
    mapFilter: 'sepia(0.3) saturate(1.1) brightness(0.88) hue-rotate(-5deg) contrast(1.05)',
    vignette: 'radial-gradient(ellipse at center, transparent 45%, hsla(25, 50%, 25%, 0.3) 75%, hsla(20, 45%, 15%, 0.55) 100%)',
    vignetteBoxShadow: 'inset 0 0 120px 60px hsla(25, 45%, 18%, 0.5), inset 0 0 300px 100px hsla(20, 35%, 12%, 0.25)',
    ambientGlow: 'radial-gradient(ellipse at 30% 80%, hsla(30, 70%, 45%, 0.08) 0%, transparent 60%)',
    label: 'Dawn',
  },
  day: {
    mapFilter: 'sepia(0.35) saturate(1.2) brightness(0.92) hue-rotate(-10deg) contrast(1.05)',
    vignette: 'radial-gradient(ellipse at center, transparent 50%, hsla(35, 45%, 20%, 0.25) 80%, hsla(30, 40%, 12%, 0.5) 100%)',
    vignetteBoxShadow: 'inset 0 0 120px 60px hsla(30, 40%, 15%, 0.6), inset 0 0 300px 100px hsla(30, 30%, 10%, 0.3)',
    ambientGlow: 'none',
    label: 'Day',
  },
  dusk: {
    mapFilter: 'sepia(0.45) saturate(1.15) brightness(0.78) hue-rotate(-15deg) contrast(1.08)',
    vignette: 'radial-gradient(ellipse at center, transparent 35%, hsla(20, 55%, 18%, 0.4) 70%, hsla(15, 50%, 10%, 0.65) 100%)',
    vignetteBoxShadow: 'inset 0 0 140px 80px hsla(20, 50%, 12%, 0.7), inset 0 0 350px 120px hsla(15, 40%, 8%, 0.4)',
    ambientGlow: 'radial-gradient(ellipse at 70% 90%, hsla(25, 80%, 40%, 0.1) 0%, transparent 55%), radial-gradient(ellipse at 20% 60%, hsla(280, 30%, 30%, 0.06) 0%, transparent 50%)',
    label: 'Dusk',
  },
  night: {
    mapFilter: 'sepia(0.25) saturate(0.85) brightness(0.62) hue-rotate(-20deg) contrast(1.12)',
    vignette: 'radial-gradient(ellipse at center, transparent 30%, hsla(240, 30%, 10%, 0.45) 65%, hsla(240, 35%, 5%, 0.75) 100%)',
    vignetteBoxShadow: 'inset 0 0 160px 90px hsla(240, 30%, 6%, 0.8), inset 0 0 400px 140px hsla(240, 25%, 4%, 0.5)',
    ambientGlow: 'radial-gradient(ellipse at 50% 40%, hsla(220, 40%, 30%, 0.06) 0%, transparent 50%)',
    label: 'Starlight',
  },
};

const VINTAGE_MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

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
    // Single point → circle approximation
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
    // Two points → elongated capsule
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
    // Compute outward normal direction from centroid
    const cx = hull.reduce((s, p) => s + p[0], 0) / n;
    const cy = hull.reduce((s, p) => s + p[1], 0) / n;
    const dx = lng - cx;
    const dy = lat - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const normDx = dx / dist;
    const normDy = dy / dist;

    const dLat = (bufferKm / 111.32) * normDy;
    const dLng = (bufferKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * normDx;

    // Add arc points around the corner for smoothness
    const baseAngle = Math.atan2(normDy, normDx);
    for (let j = -2; j <= 2; j++) {
      const angle = baseAngle + (j * Math.PI) / 10;
      const aLat = (bufferKm / 111.32) * Math.sin(angle);
      const aLng = (bufferKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(angle);
      result.push([lng + aLng, lat + aLat]);
    }
  }

  // Close the polygon with a convex hull of the expanded points
  const finalHull = convexHull(result);
  finalHull.push(finalHull[0]); // close ring
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
}

const Map = ({ initialView, initialSpecies }: MapProps) => {
  const [searchParams] = useSearchParams();
  const autoAddTree = searchParams.get("addTree") === "true";
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [offeringCounts, setOfferingCounts] = useState<TreeOfferings>({});
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [viewMode, setViewMode] = useState<string>(initialView || "collective");
  const [speciesFilter, setSpeciesFilter] = useState<string>(initialSpecies || "all");
  const [groveScale, setGroveScale] = useState<GroveScale>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [timeOfDay] = useState<TimeOfDay>(getTimeOfDay);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const atmosphere = TIME_ATMOSPHERES[timeOfDay];
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

      // Count offerings per tree
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

    // View mode
    if (viewMode === "personal" && userId) {
      filtered = filtered.filter((t) => t.created_by === userId);
    }

    // Species filter
    if (speciesFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.species.toLowerCase() === speciesFilter.toLowerCase()
      );
    }

    // Grove scale filtering
    if (groveScale !== "all" && speciesFilter !== "all") {
      const speciesTrees = filtered;

      if (groveScale === "local") {
        // 12 nearest of same species from user location or map center
        const center = userLocation || (map.current ? map.current.getCenter() : null);
        if (center) {
          const withDist = speciesTrees.map((t) => ({
            ...t,
            dist: haversineKm(center.lat, center.lng, t.latitude, t.longitude),
          }));
          withDist.sort((a, b) => a.dist - b.dist);
          filtered = withDist.slice(0, 12);
        }
      } else if (groveScale === "regional") {
        // Within 200km of user/center
        const center = userLocation || (map.current ? map.current.getCenter() : null);
        if (center) {
          filtered = speciesTrees.filter(
            (t) => haversineKm(center.lat, center.lng, t.latitude, t.longitude) <= 200
          );
        }
      } else if (groveScale === "national") {
        // Same nation — requires user location to determine country, or just group by nation
        // We show all of the same species in the same nation as the user's nearest tree
        const center = userLocation || (map.current ? map.current.getCenter() : null);
        if (center && speciesTrees.length > 0) {
          // Find nearest tree to determine nation
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
        const center = userLocation || (map.current ? map.current.getCenter() : null);
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      const m = new mapboxgl.Map({
        container: mapContainer.current,
        style: VINTAGE_MAP_STYLE,
        center: [0, 20],
        zoom: 2,
        attributionControl: false,
      });

      m.on('load', () => {
        setMapStatus("ready");
        const c = m.getCenter();
        setMapCenter({ lat: c.lat, lng: c.lng });
      });
      m.on('moveend', () => {
        const c = m.getCenter();
        setMapCenter({ lat: c.lat, lng: c.lng });
      });
      m.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapStatus("error");
      });

      m.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
      m.addControl(new mapboxgl.AttributionControl({ compact: true }));

      map.current = m;
    } catch (err) {
      console.error('Map initialization failed:', err);
      setMapStatus("error");
    }

    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // Add tree markers with visual hierarchy
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredTrees.forEach((tree) => {
      const offerings = offeringCounts[tree.id] || 0;
      const age = tree.estimated_age || 0;

      // Visual hierarchy tiers
      const isAncient = age >= 100;
      const isStoried = offerings >= 3;
      const isNotable = offerings >= 1 || age >= 50;

      // Size based on significance
      const size = isAncient ? 40 : isStoried ? 36 : isNotable ? 32 : 28;
      const strokeColor = isAncient ? 'hsl(42, 90%, 55%)' : isStoried ? 'hsl(42, 70%, 50%)' : 'hsl(45, 60%, 40%)';
      const strokeWidth = isAncient ? 2.5 : 2;
      const fillColor = isAncient ? 'hsl(120, 45%, 28%)' : 'hsl(120, 40%, 25%)';
      const leafColor = isAncient ? 'hsl(120, 55%, 40%)' : 'hsl(120, 60%, 35%)';

      // Build marker SVG with optional crown ring for storied trees
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

      // Enriched popup with offering indicators
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

      const popup = new mapboxgl.Popup({
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

      const marker = new mapboxgl.Marker(el)
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
      const bounds = new mapboxgl.LngLatBounds();
      filteredTrees.forEach((t) => bounds.extend([t.longitude, t.latitude]));
      map.current.fitBounds(bounds, { padding: 80, duration: 1500 });
    }
  }, [filteredTrees, groveScale, offeringCounts]);

  // Draw grove boundary polygon
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const drawBoundary = () => {
      // Remove existing layers and source
      if (m.getLayer(GROVE_FILL_ID)) m.removeLayer(GROVE_FILL_ID);
      if (m.getLayer(GROVE_LINE_ID)) m.removeLayer(GROVE_LINE_ID);
      if (m.getSource(GROVE_SOURCE_ID)) m.removeSource(GROVE_SOURCE_ID);

      // Only draw when grove scale is active and we have 1+ trees
      if (groveScale === "all" || filteredTrees.length === 0) return;

      // Buffer size scales with grove level
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

      // Translucent fill
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

      // Glowing border line
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

    // If map style is loaded, draw immediately; otherwise wait
    if (m.isStyleLoaded()) {
      drawBoundary();
    } else {
      m.once('style.load', drawBoundary);
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
      // Clean up existing
      if (m.getLayer(ROOT_THREADS_LAYER)) m.removeLayer(ROOT_THREADS_LAYER);
      if (m.getSource(ROOT_THREADS_SOURCE)) m.removeSource(ROOT_THREADS_SOURCE);

      // Group trees by species
      const bySpecies: Record<string, Tree[]> = {};
      filteredTrees.forEach((t) => {
        const key = t.species.toLowerCase();
        if (!bySpecies[key]) bySpecies[key] = [];
        bySpecies[key].push(t);
      });

      // Build line features connecting nearby same-species trees
      const features: GeoJSON.Feature[] = [];
      Object.values(bySpecies).forEach((group) => {
        if (group.length < 2) return;
        // For each tree, connect to its nearest same-species neighbours within range
        for (let i = 0; i < group.length; i++) {
          const a = group[i];
          // Find nearest 3 neighbours to keep lines sparse and organic
          const neighbours = group
            .map((b, j) => ({ b, j, dist: i === j ? Infinity : haversineKm(a.latitude, a.longitude, b.latitude, b.longitude) }))
            .filter((n) => n.dist <= ROOT_THREAD_MAX_KM && n.j > i) // j > i avoids duplicate lines
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
          'line-color': 'hsla(42, 75%, 50%, 0.5)',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            5, 0.3,
            10, 1,
            14, 2,
          ],
          'line-opacity': [
            'interpolate', ['linear'], ['zoom'],
            5, 0,
            7, 0.15,
            10, 0.35,
            14, 0.5,
          ],
          'line-dasharray': [6, 4],
        },
      });
    };

    if (m.isStyleLoaded()) {
      drawThreads();
    } else {
      m.once('style.load', drawThreads);
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

  const handleLocationSelect = (lat: number, lng: number, what3words: string) => {
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 15, duration: 2000 });
    }
  };

  return (
    <div className="relative w-full z-[1]" style={{ height: '100dvh', background: 'hsl(100 20% 10%)' }}>
      {/* Map canvas — rendered first so it sits at the bottom of the stacking order */}
      <div ref={mapContainer} className="absolute inset-0 z-0" style={{ filter: atmosphere.mapFilter, transition: 'filter 2s ease' }} />

      {/* Loading / Error overlay */}
      {mapStatus !== "ready" && (
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-4 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, hsl(120, 30%, 12%), hsl(100, 25%, 8%))' }}>
          {mapStatus === "loading" && (
            <>
              <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'hsl(42, 80%, 55%)', borderRightColor: 'hsl(42, 80%, 55% / 0.3)' }} />
              <p className="font-serif text-sm" style={{ color: 'hsl(42, 60%, 55%)' }}>Summoning the Atlas…</p>
            </>
          )}
          {mapStatus === "error" && (
            <div className="flex flex-col items-center gap-3 pointer-events-auto px-6 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'hsl(0, 40%, 20%)', border: '1px solid hsl(0, 50%, 35%)' }}>
                <span className="text-xl">🌿</span>
              </div>
              <p className="font-serif text-base" style={{ color: 'hsl(42, 60%, 55%)' }}>The Atlas could not awaken</p>
              <p className="text-xs max-w-xs" style={{ color: 'hsl(42, 30%, 50%)' }}>
                Map tiles failed to load. This may be a temporary network issue or a WebGL compatibility problem.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-5 py-2 rounded-lg font-serif text-sm transition-colors"
                style={{ background: 'hsl(42, 60%, 25%)', color: 'hsl(42, 80%, 70%)', border: '1px solid hsl(42, 50%, 35%)' }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Living vignette — breathes with time of day */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        boxShadow: atmosphere.vignetteBoxShadow,
        background: atmosphere.vignette,
        animation: 'vignetteBreath 12s ease-in-out infinite',
        transition: 'box-shadow 2s ease, background 2s ease',
      }} />

      {/* Ambient glow layer — dusk warmth, dawn blush, night coolness */}
      {atmosphere.ambientGlow !== 'none' && (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{
          background: atmosphere.ambientGlow,
          animation: 'ambientDrift 20s ease-in-out infinite alternate',
        }} />
      )}

      {/* Drifting mist */}
      <MistOverlay />

      <ConversionStatus />

      {/* Top bar: view toggle + filters + count */}
      <Card className="absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-10 bg-card/95 backdrop-blur border-border shadow-lg text-card-foreground">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2 sm:p-3">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-muted w-full sm:w-auto">
              <TabsTrigger value="collective" className="flex-1 sm:flex-initial text-xs sm:text-sm">Collective</TabsTrigger>
              <TabsTrigger value="personal" className="flex-1 sm:flex-initial text-xs sm:text-sm">Personal Groves</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 justify-between sm:justify-start">
            <MapFilters
              speciesFilter={speciesFilter}
              onSpeciesChange={setSpeciesFilter}
              groveScale={groveScale}
              onGroveScaleChange={setGroveScale}
              treeCounts={treeCounts}
              totalTrees={trees.length}
            />

            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {filteredTrees.length} {filteredTrees.length === 1 ? 'tree' : 'trees'}
              {groveScale !== "all" && speciesFilter !== "all" && (
                <span className="text-primary ml-1">({groveScale} grove)</span>
              )}
            </span>
          </div>
        </div>
      </Card>

      {/* Time-of-day whisper */}
      <div className="absolute top-[72px] right-4 z-10 animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'backwards' }}>
        <span className="font-serif text-xs px-2.5 py-1 rounded-full" style={{
          background: 'hsla(30, 30%, 12%, 0.7)',
          color: 'hsla(42, 60%, 60%, 0.7)',
          border: '1px solid hsla(42, 40%, 30%, 0.3)',
          backdropFilter: 'blur(4px)',
        }}>
          {timeOfDay === 'dawn' && '🌅'}
          {timeOfDay === 'day' && '☀️'}
          {timeOfDay === 'dusk' && '🌇'}
          {timeOfDay === 'night' && '✦'}
          {' '}{atmosphere.label}
        </span>
      </div>

      <MapSearch onLocationSelect={handleLocationSelect} />

      <div className="absolute bottom-2 left-2 z-10">
        <FindMeButton
          autoOpen={autoAddTree}
          onLocationFound={(lat, lng) => {
            setUserLocation({ lat, lng });
            map.current?.flyTo({ center: [lng, lat], zoom: 18, duration: 2000 });
          }}
        />
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="relative">
          <TreeRadio speciesFilter={speciesFilter} />
        </div>
        <TreeImportExport />
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
        .tree-popup .mapboxgl-popup-content {
          background: hsl(120, 40%, 15%);
          border: 1px solid hsl(45, 60%, 40%);
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px hsla(45, 60%, 40%, 0.1);
          padding: 0;
        }
        .tree-popup .mapboxgl-popup-tip {
          border-top-color: hsl(120, 40%, 15%);
        }
        .tree-popup .mapboxgl-popup-close-button {
          color: hsl(45, 60%, 50%);
          font-size: 18px;
          padding: 4px 8px;
        }
      `}</style>
    </div>
  );
};

export default Map;
