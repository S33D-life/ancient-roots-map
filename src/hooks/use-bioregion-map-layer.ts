/**
 * useBioregionMapLayer — Renders soft bioregion boundary circles
 * on the Leaflet map when the Bioregions gateway mode is active.
 *
 * Uses existing bio_regions table data (center_lat, center_lon, name, type).
 * Renders lightweight circle overlays — no heavy GeoJSON boundaries.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";

interface BioregionMarker {
  id: string;
  name: string;
  type: string;
  center_lat: number;
  center_lon: number;
  countries: string[];
}

export function useBioregionMapLayer(
  map: L.Map | null,
  active: boolean,
  onNavigate?: (slug: string) => void,
) {
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [regions, setRegions] = useState<BioregionMarker[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch bioregion data once
  useEffect(() => {
    if (!active || regions.length > 0) return;
    setLoading(true);
    supabase
      .from("bio_regions")
      .select("id, name, type, center_lat, center_lon, countries")
      .not("center_lat", "is", null)
      .not("center_lon", "is", null)
      .then(({ data }) => {
        if (data) {
          setRegions(
            data
              .filter((r) => r.center_lat != null && r.center_lon != null)
              .map((r) => ({
                id: r.id,
                name: r.name,
                type: r.type,
                center_lat: r.center_lat!,
                center_lon: r.center_lon!,
                countries: r.countries || [],
              }))
          );
        }
        setLoading(false);
      });
  }, [active, regions.length]);

  // Render / remove layer
  useEffect(() => {
    if (!map) return;

    if (!active) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    if (regions.length === 0) return;

    const group = L.layerGroup();

    regions.forEach((r) => {
      // Soft translucent circle — radius varies by type
      const radiusKm =
        r.type === "mountain_range" ? 80 :
        r.type === "river_valley" ? 60 :
        r.type === "coastal" ? 50 :
        r.type === "island_group" ? 40 :
        70; // default

      const circle = L.circle([r.center_lat, r.center_lon], {
        radius: radiusKm * 1000,
        color: "hsla(140, 45%, 50%, 0.35)",
        fillColor: "hsla(140, 40%, 40%, 0.08)",
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: "6 4",
        interactive: true,
      });

      // Label marker at centre
      const label = L.marker([r.center_lat, r.center_lon], {
        icon: L.divIcon({
          className: "bioregion-label",
          html: `<div style="
            background: hsla(140, 30%, 12%, 0.88);
            border: 1px solid hsla(140, 40%, 40%, 0.35);
            backdrop-filter: blur(8px);
            border-radius: 9999px;
            padding: 4px 10px;
            font-family: var(--font-serif, Georgia, serif);
            font-size: 10px;
            color: hsl(140, 50%, 70%);
            white-space: nowrap;
            cursor: pointer;
            pointer-events: auto;
            text-align: center;
            box-shadow: 0 2px 8px hsla(0,0%,0%,0.3);
          ">🌿 ${r.name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: true,
      });

      label.on("click", () => {
        onNavigate?.(r.id);
      });

      circle.on("click", () => {
        onNavigate?.(r.id);
      });

      circle.bindTooltip(
        `<div style="font-family: var(--font-serif, Georgia, serif); font-size: 11px;">
          <strong>🌿 ${r.name}</strong><br/>
          <span style="opacity:0.7">${r.type.replace(/_/g, " ")} · ${r.countries.slice(0, 3).join(", ")}</span>
        </div>`,
        { direction: "top", offset: [0, -10] }
      );

      group.addLayer(circle);
      group.addLayer(label);
    });

    layerRef.current = group;
    group.addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, active, regions, onNavigate]);

  return { count: regions.length, loading };
}
