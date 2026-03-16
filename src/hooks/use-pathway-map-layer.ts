/**
 * usePathwayMapLayer — renders mycelial pathway threads between groves
 * as organic curved lines on the Leaflet map.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import { usePathwayDetection } from "@/hooks/use-pathway-detection";
import type { PathwayStrength } from "@/utils/pathwayDetection";

const STRENGTH_OPACITY: Record<PathwayStrength, { line: number; glow: number }> = {
  seed:             { line: 0.15, glow: 0.05 },
  forming:          { line: 0.25, glow: 0.10 },
  rooted:           { line: 0.35, glow: 0.15 },
  thriving:         { line: 0.50, glow: 0.22 },
  ancient_corridor: { line: 0.65, glow: 0.30 },
};

const TYPE_HUE: Record<string, number> = {
  local: 42,
  species: 120,
  migration: 200,
  story: 280,
  restoration: 85,
};

const STRENGTH_ANIM: Record<PathwayStrength, string> = {
  seed: "",
  forming: "pathway-pulse-forming",
  rooted: "pathway-pulse-rooted",
  thriving: "pathway-pulse-thriving",
  ancient_corridor: "pathway-pulse-ancient",
};

export function usePathwayMapLayer(
  map: L.Map | null,
  showPathways: boolean,
  navigate: (path: string) => void,
) {
  const layerRef = useRef<L.LayerGroup | null>(null);
  const { data } = usePathwayDetection();

  useEffect(() => {
    if (!map) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!showPathways || !data?.all?.length) return;

    const layer = L.layerGroup();
    const zoom = map.getZoom();

    // Filter by zoom — show fewer at low zoom
    const maxPathways = zoom < 8 ? 10 : zoom < 12 ? 25 : 50;
    const pathways = data.all.slice(0, maxPathways);

    pathways.forEach((pathway) => {
      const hue = TYPE_HUE[pathway.pathway_type] || 42;
      const op = STRENGTH_OPACITY[pathway.strength];
      const animClass = STRENGTH_ANIM[pathway.strength];

      // Draw organic curved thread using waypoints
      const latlngs = pathway.waypoints.map(p => [p.lat, p.lng] as [number, number]);

      // Glow line (wider, fainter)
      L.polyline(latlngs, {
        color: `hsla(${hue}, 40%, 55%, ${op.glow})`,
        weight: 6,
        smoothFactor: 2,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
        className: animClass ? `pathway-glow ${animClass}` : "pathway-glow",
      }).addTo(layer);

      // Main thread
      const thread = L.polyline(latlngs, {
        color: `hsla(${hue}, 50%, 55%, ${op.line})`,
        weight: 2,
        smoothFactor: 2,
        lineCap: "round",
        lineJoin: "round",
        dashArray: pathway.pathway_type === "species" ? "6 4" : undefined,
        className: animClass ? `pathway-thread ${animClass}` : "pathway-thread",
      }).addTo(layer);

      // Popup on thread
      const typeLabel = {
        local: "Local Pathway",
        species: "Species Corridor",
        migration: "Migration Route",
        story: "Story Path",
        restoration: "Restoration Corridor",
      }[pathway.pathway_type] || "Pathway";

      const groveNames = pathway.groves.map(g => g.name).join(" → ");

      thread.bindPopup(`
        <div style="font-family:serif;min-width:180px;text-align:center;padding:4px 0">
          <p style="font-size:13px;font-weight:500;margin:0 0 4px">${pathway.suggested_name}</p>
          <p style="font-size:10px;color:#888;margin:0 0 4px">
            ${typeLabel} · ${pathway.distance_km} km
          </p>
          <p style="font-size:9px;color:#999;margin:0 0 6px">${groveNames}</p>
          ${pathway.species_common ? `<p style="font-size:9px;color:#888;margin:0 0 6px">🌿 ${pathway.species_common}</p>` : ""}
          <a href="/pathways"
             onclick="event.preventDefault();window.dispatchEvent(new CustomEvent('s33d-navigate',{detail:'/pathways'}))"
             style="display:inline-block;padding:3px 10px;border-radius:6px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));font-size:10px;text-decoration:none;cursor:pointer">
            Explore Pathway
          </a>
        </div>
      `, { className: "pathway-popup", maxWidth: 220 });

      // Center marker (small mycelium knot)
      const centerIcon = L.divIcon({
        className: "pathway-center-marker",
        html: `<div style="
          width:8px;height:8px;border-radius:50%;
          background:hsla(${hue},45%,50%,${op.line * 0.6});
          box-shadow:0 0 6px hsla(${hue},45%,50%,${op.glow});
        "></div>`,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      });

      L.marker([pathway.center.lat, pathway.center.lng], {
        icon: centerIcon,
        interactive: false,
        zIndexOffset: 300,
      }).addTo(layer);
    });

    layer.addTo(map);
    layerRef.current = layer;

    // Navigation handler
    const handleNav = (e: Event) => {
      const path = (e as CustomEvent).detail;
      if (path) navigate(path);
    };
    window.addEventListener("s33d-navigate", handleNav);

    return () => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
      window.removeEventListener("s33d-navigate", handleNav);
    };
  }, [map, showPathways, data, navigate]);
}
