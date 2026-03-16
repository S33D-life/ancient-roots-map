/**
 * Global Forest Atlas Map
 *
 * A Leaflet map showing dataset regions as organic forest nodes.
 * Reads from existing datasetIntegration + countryRegistry configs.
 */

import { useEffect, useRef, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TreeDeciduous, ChevronRight, MapPin, Network, Sparkles, BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DATASET_CONFIGS, getDatasetsByCountry, type DatasetConfig } from "@/config/datasetIntegration";
import COUNTRY_REGISTRY from "@/config/countryRegistry";

/* ─── Types ─── */
interface RegionNode {
  slug: string;
  country: string;
  flag: string;
  descriptor: string;
  lat: number;
  lng: number;
  treeCount: number;
  groveCount: number;
  pulseLevel: "quiet" | "stirring" | "growing" | "vibrant" | "forest_awakened";
  portalSubtitle?: string;
  datasets: DatasetConfig[];
  circles: { key: string; label: string; icon: string }[];
  dominantSpecies?: string;
  status: "active" | "growing" | "proposed";
}

interface Props {
  countryStats: {
    country: string;
    slug: string;
    flag: string;
    descriptor: string;
    treeCount: number;
    groveCount: number;
    pulseLevel?: "quiet" | "stirring" | "growing" | "vibrant" | "forest_awakened";
    portalSubtitle?: string;
    datasets: DatasetConfig[];
    dominantSpecies?: string;
    status: "active" | "growing" | "proposed";
  }[];
}

/* ─── Canopy sizing ─── */
function canopyRadius(treeCount: number, groveCount: number): number {
  const activity = treeCount + groveCount * 5;
  if (activity >= 100) return 38;
  if (activity >= 40) return 30;
  if (activity >= 10) return 22;
  if (activity >= 1) return 16;
  return 12;
}

function canopyLabel(treeCount: number, groveCount: number): string {
  const activity = treeCount + groveCount * 5;
  if (activity >= 100) return "Major Forest";
  if (activity >= 40) return "Growing Forest";
  if (activity >= 10) return "Forming Forest";
  if (activity >= 1) return "Small Grove";
  return "Seed";
}

const PULSE_RING_COLORS: Record<string, string> = {
  quiet: "hsla(var(--muted-foreground), 0.15)",
  stirring: "hsla(36, 70%, 55%, 0.25)",
  growing: "hsla(142, 50%, 50%, 0.3)",
  vibrant: "hsla(270, 25%, 55%, 0.35)",
  forest_awakened: "hsla(142, 60%, 45%, 0.4)",
};

const PULSE_FILL_COLORS: Record<string, string> = {
  quiet: "hsla(142, 20%, 40%, 0.12)",
  stirring: "hsla(36, 50%, 50%, 0.18)",
  growing: "hsla(142, 45%, 45%, 0.22)",
  vibrant: "hsla(270, 30%, 50%, 0.25)",
  forest_awakened: "hsla(142, 55%, 40%, 0.3)",
};

const PULSE_ANIMATION: Record<string, string> = {
  quiet: "",
  stirring: "pulse-stirring",
  growing: "pulse-growing",
  vibrant: "pulse-vibrant",
  forest_awakened: "pulse-forest_awakened",
};

/* ─── Component ─── */
export default function GlobalForestAtlasMap({ countryStats }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const layerGroup = useRef<L.LayerGroup | null>(null);
  const [selectedNode, setSelectedNode] = useState<RegionNode | null>(null);
  const navigate = useNavigate();

  /* Build region nodes from stats + configs */
  const regionNodes = useMemo<RegionNode[]>(() => {
    return countryStats
      .map(stat => {
        // Find coordinates from dataset configs or country registry
        const datasets = stat.datasets.length > 0 ? stat.datasets : getDatasetsByCountry(stat.slug);
        const regEntry = COUNTRY_REGISTRY.find(r => r.slug === stat.slug);
        const firstDataset = datasets[0];

        let lat = firstDataset?.center?.lat ?? regEntry?.defaultMapFocus?.center?.lat;
        let lng = firstDataset?.center?.lng ?? regEntry?.defaultMapFocus?.center?.lng;

        // Fallback: approximate from known coordinates
        if (lat == null || lng == null) return null;

        const circles = datasets.flatMap(d => d.circles || []).slice(0, 6);

        return {
          slug: stat.slug,
          country: stat.country,
          flag: stat.flag,
          descriptor: stat.descriptor,
          lat,
          lng,
          treeCount: stat.treeCount,
          groveCount: stat.groveCount,
          pulseLevel: stat.pulseLevel || "quiet",
          portalSubtitle: stat.portalSubtitle,
          datasets,
          circles,
          dominantSpecies: stat.dominantSpecies,
          status: stat.status,
        } as RegionNode;
      })
      .filter(Boolean) as RegionNode[];
  }, [countryStats]);

  /* Initialize Leaflet map */
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [25, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Vintage warm tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19, subdomains: "abcd" }
    ).addTo(map);

    // Warm vignette overlay
    const vignettePane = map.createPane("vignette");
    vignettePane.style.pointerEvents = "none";
    vignettePane.style.zIndex = "350";
    vignettePane.style.background =
      "radial-gradient(ellipse at center, transparent 50%, hsla(36, 30%, 20%, 0.08) 100%)";

    leafletMap.current = map;
    layerGroup.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      leafletMap.current = null;
      layerGroup.current = null;
    };
  }, []);

  /* Render region nodes as markers */
  useEffect(() => {
    if (!layerGroup.current || !leafletMap.current) return;
    layerGroup.current.clearLayers();

    regionNodes.forEach(node => {
      const radius = canopyRadius(node.treeCount, node.groveCount);
      const pulse = PULSE_ANIMATION[node.pulseLevel] || "";
      const fillColor = PULSE_FILL_COLORS[node.pulseLevel] || PULSE_FILL_COLORS.quiet;
      const ringColor = PULSE_RING_COLORS[node.pulseLevel] || PULSE_RING_COLORS.quiet;
      const isActive = node.status === "active";
      const opacity = isActive ? 1 : 0.5;

      // Create a DivIcon with canopy styling
      const iconHtml = `
        <div class="atlas-canopy-node ${pulse}" style="
          width: ${radius * 2}px;
          height: ${radius * 2}px;
          opacity: ${opacity};
          position: relative;
          cursor: pointer;
        ">
          <!-- Outer glow ring -->
          <div style="
            position: absolute; inset: -4px;
            border-radius: 50%;
            border: 1.5px solid ${ringColor};
            background: transparent;
          "></div>
          <!-- Canopy fill -->
          <div style="
            position: absolute; inset: 0;
            border-radius: 50%;
            background: radial-gradient(circle at 40% 35%, ${fillColor}, hsla(142, 30%, 35%, 0.06));
            backdrop-filter: blur(1px);
          "></div>
          <!-- Inner marker -->
          <div style="
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            text-align: center;
          ">
            <span style="font-size: ${radius > 20 ? '18px' : '14px'}; line-height: 1;">${node.flag}</span>
            ${radius >= 22 ? `<span style="font-size: 8px; color: hsl(var(--foreground)); opacity: 0.7; margin-top: 1px; font-family: serif; white-space: nowrap; max-width: ${radius * 2 - 8}px; overflow: hidden; text-overflow: ellipsis;">${node.country}</span>` : ""}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "atlas-forest-node",
        iconSize: [radius * 2, radius * 2],
        iconAnchor: [radius, radius],
      });

      const marker = L.marker([node.lat, node.lng], { icon });

      marker.on("click", () => {
        setSelectedNode(node);
        leafletMap.current?.flyTo([node.lat, node.lng], Math.max(leafletMap.current.getZoom(), 5), {
          duration: 0.8,
        });
      });

      marker.addTo(layerGroup.current!);
    });

    // Draw faint canopy connections between nearby active regions
    const activeNodes = regionNodes.filter(n => n.status === "active");
    for (let i = 0; i < activeNodes.length; i++) {
      for (let j = i + 1; j < activeNodes.length; j++) {
        const a = activeNodes[i];
        const b = activeNodes[j];
        const dist = Math.sqrt(
          Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2)
        );
        // Only connect regions within ~40 degrees (rough proximity)
        if (dist < 40) {
          // Create a subtle curved line
          const midLat = (a.lat + b.lat) / 2 + (Math.random() - 0.5) * 3;
          const midLng = (a.lng + b.lng) / 2 + (Math.random() - 0.5) * 3;

          const curve = L.polyline(
            [
              [a.lat, a.lng],
              [midLat, midLng],
              [b.lat, b.lng],
            ],
            {
              color: "hsla(142, 35%, 50%, 0.1)",
              weight: 1,
              dashArray: "4 6",
              smoothFactor: 3,
              interactive: false,
            }
          );
          curve.addTo(layerGroup.current!);
        }
      }
    }
  }, [regionNodes]);

  /* Close card when clicking map background */
  useEffect(() => {
    if (!leafletMap.current) return;
    const handler = () => setSelectedNode(null);
    leafletMap.current.on("click", handler);
    return () => { leafletMap.current?.off("click", handler); };
  }, []);

  return (
    <div className="relative w-full" style={{ height: "min(65vh, 520px)" }}>
      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0 rounded-xl overflow-hidden border border-border/20" />

      {/* Selected Region Card overlay */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            key={selectedNode.slug}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-[500]"
          >
            <Card className="border-primary/15 bg-card/95 backdrop-blur-md shadow-lg">
              <CardContent className="p-4 space-y-2.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl">{selectedNode.flag}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-serif font-semibold text-foreground truncate">
                        {selectedNode.country}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {selectedNode.descriptor}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-emerald-500/80 border-emerald-400/20 shrink-0">
                    {canopyLabel(selectedNode.treeCount, selectedNode.groveCount)}
                  </Badge>
                </div>

                {/* Story */}
                {selectedNode.portalSubtitle && (
                  <p className="text-[11px] text-muted-foreground/70 italic font-serif leading-snug line-clamp-2">
                    {selectedNode.portalSubtitle}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <TreeDeciduous className="w-3 h-3 text-primary/50" /> {selectedNode.treeCount} trees
                  </span>
                  {selectedNode.groveCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Network className="w-3 h-3 text-emerald-500/60" /> {selectedNode.groveCount} groves
                    </span>
                  )}
                  {selectedNode.dominantSpecies && (
                    <span className="text-[10px] italic">🌿 {selectedNode.dominantSpecies}</span>
                  )}
                </div>

                {/* Circles */}
                {selectedNode.circles.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {selectedNode.circles.slice(0, 4).map(c => (
                      <span key={c.key} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted/40 text-[9px] text-muted-foreground">
                        {c.icon} {c.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {selectedNode.status !== "proposed" ? (
                    <>
                      <Button variant="sacred" size="sm" className="h-7 text-xs flex-1" asChild>
                        <Link to={`/atlas/${selectedNode.slug}`}>
                          <BookOpen className="w-3 h-3 mr-1" /> Explore
                        </Link>
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => navigate(`/map?country=${selectedNode.slug}&arrival=country`)}
                      >
                        <MapPin className="w-3 h-3 mr-1" /> Map
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" disabled>
                      <Sparkles className="w-3 h-3 mr-1" /> Coming soon
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute top-3 left-3 z-[400] pointer-events-none">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/20 px-3 py-2 space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-sans">Forest Canopy</p>
          <div className="flex items-center gap-2">
            {[
              { size: 10, label: "Seed" },
              { size: 14, label: "Grove" },
              { size: 20, label: "Forest" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div
                  className="rounded-full border border-emerald-500/20"
                  style={{
                    width: l.size,
                    height: l.size,
                    background: "radial-gradient(circle, hsla(142, 40%, 45%, 0.2), transparent)",
                  }}
                />
                <span className="text-[8px] text-muted-foreground/50">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
