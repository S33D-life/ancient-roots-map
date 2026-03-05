import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapIcon, Layers, TreeDeciduous } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMapFocus } from "@/hooks/use-map-focus";
import { getRootstonesByCountrySlug } from "@/data/rootstones";
import { buildAreaMapUrl } from "@/utils/map-link";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

type PlaceType = "country" | "region" | "city";

type BBoxInput = {
  south: number;
  west: number;
  north: number;
  east: number;
} | [number, number, number, number];

type LatLng = { lat: number; lng: number };

interface DefaultFilters {
  tags?: string[];
  researchLayer?: "on" | "off";
}

interface Props {
  bbox?: BBoxInput;
  polygon?: number[][][] | number[][][][];
  center?: LatLng;
  placeType: PlaceType;
  placeCode: string;
  defaultFilters?: DefaultFilters;
  countrySlug?: string;
  highlightedSpecies?: string | null;
}

interface PreviewNode {
  id: string;
  lat: number;
  lng: number;
  name: string;
  species?: string | null;
  kind: "tree" | "grove";
  sourceStatus: "verified" | "research";
}

type SourceFilter = "verified" | "research" | "both";

function normalizeBBox(input?: BBoxInput): { south: number; west: number; north: number; east: number } | null {
  if (!input) return null;
  if (Array.isArray(input)) {
    const [south, west, north, east] = input;
    return { south, west, north, east };
  }
  return input;
}

function bboxFromPolygon(polygon?: number[][][] | number[][][][]): { south: number; west: number; north: number; east: number } | null {
  if (!polygon) return null;
  const rings = Array.isArray(polygon[0][0][0]) ? (polygon as number[][][][]).flat() : (polygon as number[][][]);
  const points = rings.flat();
  if (!points.length) return null;
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  points.forEach(([lng, lat]) => {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  });
  if (!Number.isFinite(west) || !Number.isFinite(east) || !Number.isFinite(south) || !Number.isFinite(north)) {
    return null;
  }
  return { south, west, north, east };
}

function inBBox(lat: number, lng: number, bbox: { south: number; west: number; north: number; east: number }) {
  return lat >= bbox.south && lat <= bbox.north && lng >= bbox.west && lng <= bbox.east;
}

export default function PlaceMapPreview({
  bbox,
  polygon,
  center,
  placeType,
  placeCode,
  defaultFilters,
  countrySlug,
  highlightedSpecies,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const markerRefs = useRef<Array<{ marker: any; species: string | null; sourceStatus: SourceFilter; kind: "tree" | "grove" }>>([]);
  const [nodes, setNodes] = useState<PreviewNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("both");
  const navigate = useNavigate();
  const { focusMap } = useMapFocus();

  const normalizedBBox = useMemo(
    () => normalizeBBox(bbox) || bboxFromPolygon(polygon),
    [bbox, polygon],
  );

  const resolvedCountrySlug = countrySlug || (placeType === "country" ? placeCode : undefined);

  const resolvedCenter = useMemo<LatLng | null>(() => {
    if (center) return center;
    if (!normalizedBBox) return null;
    return {
      lat: (normalizedBBox.north + normalizedBBox.south) / 2,
      lng: (normalizedBBox.east + normalizedBBox.west) / 2,
    };
  }, [center, normalizedBBox]);

  useEffect(() => {
    if (!normalizedBBox) {
      setNodes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchNodes = async () => {
      setLoading(true);
      const dedupe = new Set<string>();
      const collected: PreviewNode[] = [];
      try {
        const [verifiedTreesResult, researchTreesResult] = await Promise.all([
          supabase
            .from("trees")
            .select("id,name,species,latitude,longitude")
            .gte("latitude", normalizedBBox.south)
            .lte("latitude", normalizedBBox.north)
            .gte("longitude", normalizedBBox.west)
            .lte("longitude", normalizedBBox.east)
            .limit(400),
          supabase
            .from("research_trees")
            .select("id,tree_name,species_scientific,latitude,longitude")
            .gte("latitude", normalizedBBox.south)
            .lte("latitude", normalizedBBox.north)
            .gte("longitude", normalizedBBox.west)
            .lte("longitude", normalizedBBox.east)
            .limit(300),
        ]);

        if (verifiedTreesResult.error) throw verifiedTreesResult.error;
        if (researchTreesResult.error) throw researchTreesResult.error;

        const verifiedTrees = verifiedTreesResult.data || [];
        verifiedTrees.forEach((tree) => {
          if (tree.latitude == null || tree.longitude == null) return;
          const key = `verified:${tree.name || tree.id}:${tree.latitude.toFixed(4)}:${tree.longitude.toFixed(4)}`;
          if (dedupe.has(key)) return;
          dedupe.add(key);
          collected.push({
            id: `v-${tree.id}`,
            lat: tree.latitude,
            lng: tree.longitude,
            name: tree.name || "Ancient Friend",
            species: tree.species || null,
            kind: "tree",
            sourceStatus: "verified",
          });
        });

        const researchTrees = researchTreesResult.data || [];
        researchTrees.forEach((tree) => {
          if (tree.latitude == null || tree.longitude == null) return;
          const key = `research:${tree.tree_name || tree.id}:${tree.latitude.toFixed(4)}:${tree.longitude.toFixed(4)}`;
          if (dedupe.has(key)) return;
          dedupe.add(key);
          collected.push({
            id: `r-${tree.id}`,
            lat: tree.latitude,
            lng: tree.longitude,
            name: tree.tree_name || tree.species_scientific || "Research Tree",
            species: tree.species_scientific || null,
            kind: "tree",
            sourceStatus: "research",
          });
        });
      } catch (error) {
        console.warn("[PlaceMapPreview] preview node query failed; showing local seed nodes only.", error);
      }

      if (resolvedCountrySlug) {
        const rootstones = getRootstonesByCountrySlug(resolvedCountrySlug);
        rootstones.forEach((stone) => {
          if (stone.location.lat == null || stone.location.lng == null) return;
          if (!inBBox(stone.location.lat, stone.location.lng, normalizedBBox)) return;
          const key = `rootstone:${stone.name}:${stone.location.lat.toFixed(4)}:${stone.location.lng.toFixed(4)}`;
          if (dedupe.has(key)) return;
          dedupe.add(key);
          collected.push({
            id: `s-${stone.id}`,
            lat: stone.location.lat,
            lng: stone.location.lng,
            name: stone.name,
            species: stone.species || null,
            kind: stone.type === "grove" ? "grove" : "tree",
            sourceStatus: "research",
          });
        });
      }

      if (cancelled) return;
      setNodes(collected);
      setLoading(false);
    };
    fetchNodes();
    return () => {
      cancelled = true;
    };
  }, [normalizedBBox, resolvedCountrySlug]);

  useEffect(() => {
    let mounted = true;
    const initMap = async () => {
      if (!containerRef.current || mapRef.current || !resolvedCenter) return;
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet.markercluster");
        if (!mounted || !containerRef.current) return;

        const map = L.map(containerRef.current, {
          center: [resolvedCenter.lat, resolvedCenter.lng],
          zoom: placeType === "city" ? 10 : placeType === "region" ? 8 : 6,
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          dragging: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          tap: false,
        } as any);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        mapRef.current = map;
        setMapReady(true);
      } catch (error) {
        console.error("[PlaceMapPreview] map init failed", error);
        if (mounted) setMapError(true);
      }
    };
    initMap();
    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      clusterRef.current = null;
    };
  }, [resolvedCenter, placeType]);

  const visibleNodes = useMemo(() => {
    if (sourceFilter === "both") return nodes;
    return nodes.filter((node) => node.sourceStatus === sourceFilter);
  }, [nodes, sourceFilter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    let cancelled = false;

    const renderMarkers = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (cancelled) return;

      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }

      const cluster = (L as any).markerClusterGroup({
        maxClusterRadius: 40,
        disableClusteringAtZoom: 13,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
      });

      markerRefs.current = [];

      visibleNodes.forEach((node) => {
        const markerClass = [
          "place-preview-marker",
          node.kind === "grove" ? "is-grove" : "is-tree",
          node.sourceStatus === "verified" ? "is-verified" : "is-research",
        ].join(" ");

        const icon = L.divIcon({
          className: "place-preview-icon-wrapper",
          html: `<div class="${markerClass}"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([node.lat, node.lng], { icon });
        marker.bindPopup(`<div style="font-size:12px;"><strong>${node.name}</strong><br/>${node.kind} · ${node.sourceStatus}</div>`);
        cluster.addLayer(marker);
        markerRefs.current.push({
          marker,
          species: node.species?.toLowerCase() || null,
          sourceStatus: node.sourceStatus,
          kind: node.kind,
        });
      });

      cluster.addTo(map);
      clusterRef.current = cluster;

      if (normalizedBBox) {
        map.fitBounds(
          [
            [normalizedBBox.south, normalizedBBox.west],
            [normalizedBBox.north, normalizedBBox.east],
          ],
          { padding: [12, 12], animate: false },
        );
      }
    };

    renderMarkers();
    return () => {
      cancelled = true;
    };
  }, [visibleNodes, mapReady, normalizedBBox]);

  useEffect(() => {
    const activeSpecies = highlightedSpecies?.toLowerCase().trim();
    markerRefs.current.forEach(({ marker, species }) => {
      const el = marker?._icon as HTMLElement | undefined;
      if (!el) return;
      if (activeSpecies && species && species.includes(activeSpecies)) {
        el.classList.add("preview-species-highlight");
      } else {
        el.classList.remove("preview-species-highlight");
      }
    });
  }, [highlightedSpecies, visibleNodes.length]);

  const openFullMap = useCallback(() => {
    if (!resolvedCenter) return;
    if (resolvedCountrySlug) {
      navigate(
        buildAreaMapUrl({
          countrySlug: resolvedCountrySlug,
          lat: resolvedCenter.lat,
          lng: resolvedCenter.lng,
          zoom: placeType === "city" ? 11 : placeType === "region" ? 8 : 6,
          tags: defaultFilters?.tags,
          researchLayer: sourceFilter === "verified" ? "off" : "on",
          rootstones: sourceFilter === "verified" ? "off" : "on",
          bbox: normalizedBBox
            ? {
                south: normalizedBBox.south,
                west: normalizedBBox.west,
                north: normalizedBBox.north,
                east: normalizedBBox.east,
              }
            : undefined,
        }),
      );
      return;
    }
    focusMap({
      type: "area",
      id: placeCode,
      countrySlug: resolvedCountrySlug,
      source: placeType === "country" ? "country" : placeType === "region" ? "region" : "county",
      center: resolvedCenter,
      bbox: normalizedBBox ? [normalizedBBox.south, normalizedBBox.west, normalizedBBox.north, normalizedBBox.east] : undefined,
      zoom: placeType === "city" ? 11 : placeType === "region" ? 8 : 6,
      tags: defaultFilters?.tags,
      researchLayer: sourceFilter === "verified" ? "off" : "on",
    });
  }, [defaultFilters?.tags, focusMap, navigate, normalizedBBox, placeCode, placeType, resolvedCenter, resolvedCountrySlug, sourceFilter]);

  const jumpToSeedNodes = useCallback(() => {
    if (!resolvedCenter || !resolvedCountrySlug) {
      openFullMap();
      return;
    }
    navigate(
      buildAreaMapUrl({
        countrySlug: resolvedCountrySlug,
        lat: resolvedCenter.lat,
        lng: resolvedCenter.lng,
        zoom: placeType === "city" ? 11 : placeType === "region" ? 8 : 6,
        researchLayer: "on",
        rootstones: "on",
        bbox: normalizedBBox
          ? {
              south: normalizedBBox.south,
              west: normalizedBBox.west,
              north: normalizedBBox.north,
              east: normalizedBBox.east,
            }
          : undefined,
      }),
    );
  }, [navigate, normalizedBBox, openFullMap, placeType, resolvedCenter, resolvedCountrySlug]);

  return (
    <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-serif flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-primary" />
            Map Preview
          </span>
          <Badge variant="outline" className="text-[10px]">
            {visibleNodes.length} nodes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border border-primary/15 overflow-hidden relative">
          {!mapError && (
            <div
              ref={containerRef}
              className="w-full h-52 sm:h-64"
              style={{ touchAction: "pan-y", background: "hsl(var(--muted))" }}
            />
          )}
          {mapError && (
            <div className="w-full h-52 sm:h-64 bg-gradient-to-br from-primary/10 to-muted/60 flex items-center justify-center px-4 text-center">
              <p className="text-xs text-muted-foreground">Map preview unavailable here. Open full map to continue.</p>
            </div>
          )}
          <button
            type="button"
            className="absolute inset-0 bg-transparent"
            onClick={openFullMap}
            aria-label="Open full map"
            title="Open full map"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="mystical" size="sm" onClick={openFullMap}>
            <MapIcon className="w-3.5 h-3.5 mr-1" /> Open Full Map
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSourceFilter("verified")} className={sourceFilter === "verified" ? "border-primary/50" : ""}>
            Show Verified
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSourceFilter("research")} className={sourceFilter === "research" ? "border-primary/50" : ""}>
            Show Research
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSourceFilter("both")} className={sourceFilter === "both" ? "border-primary/50" : ""}>
            Show Both
          </Button>
          <Button variant="sacred" size="sm" onClick={jumpToSeedNodes}>
            <Layers className="w-3.5 h-3.5 mr-1" /> Jump to Seed Nodes (33)
          </Button>
        </div>

        {loading && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <TreeDeciduous className="w-3.5 h-3.5" /> Loading preview nodes…
          </p>
        )}
      </CardContent>

      <style>{`
        .place-preview-icon-wrapper { background: transparent !important; border: none !important; }
        .place-preview-marker {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          border: 2px solid transparent;
          box-shadow: 0 0 8px rgba(0,0,0,0.2);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .place-preview-marker.is-tree.is-verified { background: hsl(145 65% 42%); border-color: hsl(145 55% 30%); }
        .place-preview-marker.is-tree.is-research { background: hsl(42 80% 56%); border-color: hsl(38 70% 40%); }
        .place-preview-marker.is-grove { background: hsl(210 68% 58%); border-color: hsl(210 58% 40%); width: 13px; height: 13px; border-radius: 4px; }
        .preview-species-highlight .place-preview-marker {
          transform: scale(1.28);
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.22), 0 0 14px hsl(var(--primary) / 0.45);
        }
      `}</style>
    </Card>
  );
}
