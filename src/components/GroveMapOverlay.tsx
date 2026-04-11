/**
 * GroveMapOverlay — renders grove halos on the map.
 * Uses client-side grove detection to show soft canopy circles.
 */
import { useEffect, useRef } from "react";
import type { GroveCandidate } from "@/utils/groveDetection";

/** Species-specific hue mapping */
const SPECIES_HUE: Record<string, number> = {
  oak: 35, olive: 85, beech: 50, pine: 150, yew: 160,
  birch: 60, willow: 100, maple: 25, cedar: 140, ash: 45,
};

function getGroveHue(species?: string): number {
  if (!species) return 120; // default green
  const lower = species.toLowerCase();
  for (const [key, hue] of Object.entries(SPECIES_HUE)) {
    if (lower.includes(key)) return hue;
  }
  return 120;
}

interface Props {
  map: any;
  groves: GroveCandidate[];
  visible: boolean;
  onGroveClick?: (grove: GroveCandidate) => void;
}

export default function GroveMapOverlay({ map, groves, visible, onGroveClick }: Props) {
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !visible) {
      layersRef.current.forEach(l => l.remove());
      layersRef.current = [];
      return;
    }

    import("leaflet").then((L) => {
      layersRef.current.forEach(l => l.remove());
      layersRef.current = [];

      groves.forEach((grove) => {
        const hue = getGroveHue(grove.species_scientific || grove.species_common);
        const strength = grove.grove_strength_score;
        const opacity = Math.min(0.15 + strength * 0.03, 0.35);
        const radiusM = Math.max(grove.radius_m * 1.3, 200); // extend slightly beyond trees

        const circle = L.circle([grove.center.lat, grove.center.lng], {
          radius: radiusM,
          color: `hsla(${hue}, 45%, 50%, ${opacity * 0.6})`,
          fillColor: `hsla(${hue}, 45%, 50%, ${opacity})`,
          fillOpacity: opacity,
          weight: 1.5,
          interactive: !!onGroveClick,
          className: "grove-halo",
        }).addTo(map);

        // Tooltip
        const label = grove.suggested_name || `${grove.species_common || "Mixed"} Grove`;
        circle.bindTooltip(`🌳 ${label} · ${grove.trees.length} trees`, {
          direction: "top",
          className: "grove-tooltip",
          offset: [0, -10],
        });

        if (onGroveClick) {
          circle.on("click", () => onGroveClick(grove));
        }

        layersRef.current.push(circle);
      });
    });

    return () => {
      layersRef.current.forEach(l => l.remove());
      layersRef.current = [];
    };
  }, [map, groves, visible, onGroveClick]);

  return null;
}
