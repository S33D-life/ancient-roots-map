/**
 * useGroveMapLayer — renders detected groves on the Leaflet map
 * as soft radial halos with center markers. Strength scales opacity.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import { useGroveDetection } from "@/hooks/use-grove-detection";
import type { GroveCandidate, GroveStrength } from "@/utils/groveDetection";

const STRENGTH_OPACITY: Record<GroveStrength, { fill: number; stroke: number; center: number }> = {
  seed:         { fill: 0.06, stroke: 0.15, center: 0.5 },
  forming:      { fill: 0.10, stroke: 0.22, center: 0.6 },
  rooted:       { fill: 0.14, stroke: 0.30, center: 0.7 },
  thriving:     { fill: 0.18, stroke: 0.38, center: 0.8 },
  ancient_grove:{ fill: 0.24, stroke: 0.50, center: 1.0 },
};

const SPECIES_HUES: Record<string, number> = {
  oak: 35, olive: 85, yew: 150, banyan: 130, cedar: 160,
  pine: 140, birch: 50, maple: 25, cherry: 340, beech: 45,
  elm: 100, ash: 110, fig: 70, baobab: 30, chestnut: 40,
};

function getGroveHue(grove: GroveCandidate): number {
  if (grove.grove_type === "species_grove" && grove.species_common) {
    const key = grove.species_common.toLowerCase().split(" ")[0];
    if (SPECIES_HUES[key]) return SPECIES_HUES[key];
  }
  // Default warm woodland green-gold
  return grove.grove_type === "local_grove" ? 55 : 120;
}

function createCenterIcon(grove: GroveCandidate): L.DivIcon {
  const opacity = STRENGTH_OPACITY[grove.grove_strength].center;
  const hue = getGroveHue(grove);
  const isSpecies = grove.grove_type === "species_grove";
  const symbol = isSpecies ? "🌿" : "🌳";
  
  return L.divIcon({
    className: "grove-center-marker",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:50%;
      background:hsla(${hue},45%,35%,${opacity * 0.3});
      border:1.5px solid hsla(${hue},50%,45%,${opacity * 0.5});
      box-shadow:0 0 12px hsla(${hue},50%,50%,${opacity * 0.3});
      font-size:14px;cursor:pointer;
      transition:all 0.3s ease;
    " title="${grove.suggested_name}">${symbol}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function useGroveMapLayer(
  map: L.Map | null,
  showGroves: boolean,
  navigate: (path: string) => void,
) {
  const layerRef = useRef<L.LayerGroup | null>(null);
  const { data } = useGroveDetection();

  useEffect(() => {
    if (!map) return;

    // Clean up
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!showGroves || !data) return;

    const layer = L.layerGroup();
    const allGroves = [...data.local, ...data.species];

    allGroves.forEach((grove) => {
      const { center, radius_m, grove_strength, suggested_name, grove_type, trees, compactness_score } = grove;
      const hue = getGroveHue(grove);
      const op = STRENGTH_OPACITY[grove_strength];

      // Soft halo circle
      const displayRadius = Math.max(radius_m, 100); // min 100m for visibility
      L.circle([center.lat, center.lng], {
        radius: displayRadius,
        color: `hsla(${hue}, 50%, 45%, ${op.stroke})`,
        fillColor: `hsla(${hue}, 40%, 40%, ${op.fill})`,
        fillOpacity: 1,
        weight: 1.5,
        dashArray: grove_type === "species_grove" ? "4 6" : undefined,
        interactive: false,
        className: `grove-halo grove-${grove_strength}`,
      }).addTo(layer);

      // Second inner glow for stronger groves
      if (grove_strength !== "seed") {
        L.circle([center.lat, center.lng], {
          radius: displayRadius * 0.6,
          color: "transparent",
          fillColor: `hsla(${hue}, 50%, 50%, ${op.fill * 0.5})`,
          fillOpacity: 1,
          weight: 0,
          interactive: false,
        }).addTo(layer);
      }

      // Center marker
      const marker = L.marker([center.lat, center.lng], {
        icon: createCenterIcon(grove),
        zIndexOffset: 500,
      }).addTo(layer);

      // Popup
      const isSpecies = grove_type === "species_grove";
      const strengthLabel = {
        seed: "Seed Grove", forming: "Forming", rooted: "Rooted",
        thriving: "Thriving", ancient_grove: "Ancient Grove",
      }[grove_strength];

      marker.bindPopup(`
        <div style="font-family:serif;min-width:180px;text-align:center;padding:4px 0">
          <p style="font-size:14px;font-weight:500;margin:0 0 4px">${suggested_name}</p>
          <p style="font-size:10px;color:#888;margin:0 0 6px">
            ${isSpecies ? "Species Grove" : "Local Grove"} · ${trees.length} trees
          </p>
          <p style="font-size:10px;color:#888;margin:0 0 6px">
            Strength: <strong>${strengthLabel}</strong> · Compactness: ${Math.round(compactness_score * 100)}%
          </p>
          <a href="/groves" 
             onclick="event.preventDefault();window.dispatchEvent(new CustomEvent('s33d-navigate',{detail:'/groves'}))"
             style="display:inline-block;margin-top:4px;padding:4px 12px;border-radius:6px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));font-size:11px;text-decoration:none;cursor:pointer">
            Explore Grove
          </a>
        </div>
      `, { className: "grove-popup", maxWidth: 220 });
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
  }, [map, showGroves, data, navigate]);

  return layerRef;
}
