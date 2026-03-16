/**
 * usePulseMapLayer — renders Forest Pulse signals as soft breathing halos on the Leaflet map.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import { useForestPulse, type PulseTimeRange } from "@/hooks/use-forest-pulse";
import { PULSE_OPACITY, PULSE_ANIM_DURATION, type PulseLevel } from "@/utils/forestPulse";

const PULSE_HUE: Record<string, number> = {
  tree: 42,
  grove: 120,
  species: 85,
  region: 200,
};

export function usePulseMapLayer(
  map: L.Map | null,
  showPulse: boolean,
  range: PulseTimeRange = "7d",
) {
  const layerRef = useRef<L.LayerGroup | null>(null);
  const { data } = useForestPulse(range);

  useEffect(() => {
    if (!map) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!showPulse || !data) return;

    const layer = L.layerGroup();

    // Render pulse signals — trees + groves (skip quiet)
    const signals = [...data.trees.slice(0, 30), ...data.groves.slice(0, 20)];

    signals.forEach((signal) => {
      if (!signal.lat || !signal.lng || signal.pulse === "quiet") return;

      const hue = PULSE_HUE[signal.type] || 42;
      const opacity = PULSE_OPACITY[signal.pulse];
      const radius = signal.type === "tree" ? 150 : (signal.radius_m || 500);
      const animDur = PULSE_ANIM_DURATION[signal.pulse];

      // Outer breathing halo
      L.circle([signal.lat, signal.lng], {
        radius: radius * 1.3,
        color: `hsla(${hue}, 50%, 55%, ${opacity * 0.5})`,
        fillColor: `hsla(${hue}, 45%, 50%, ${opacity})`,
        fillOpacity: 1,
        weight: 0.5,
        interactive: false,
        className: animDur ? `pulse-halo pulse-${signal.pulse}` : "pulse-halo",
      }).addTo(layer);

      // Inner glow for vibrant+
      if (signal.score >= 55) {
        L.circle([signal.lat, signal.lng], {
          radius: radius * 0.5,
          color: "transparent",
          fillColor: `hsla(${hue}, 55%, 60%, ${opacity * 0.6})`,
          fillOpacity: 1,
          weight: 0,
          interactive: false,
        }).addTo(layer);
      }

      // Center indicator with popup
      const icon = L.divIcon({
        className: "pulse-center-marker",
        html: `<div style="
          width:10px;height:10px;border-radius:50%;
          background:hsla(${hue},50%,55%,${0.4 + opacity});
          box-shadow:0 0 8px hsla(${hue},50%,55%,${opacity});
          cursor:pointer;
        " title="${signal.name}"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const marker = L.marker([signal.lat, signal.lng], { icon, zIndexOffset: 400 }).addTo(layer);

      const signalDetails = signal.signals
        .filter(s => s.value > 0)
        .map(s => `${s.icon} ${s.value} ${s.label}`)
        .join("<br>");

      marker.bindPopup(`
        <div style="font-family:serif;min-width:160px;text-align:center;padding:4px 0">
          <p style="font-size:12px;font-weight:500;margin:0 0 2px">${signal.name}</p>
          <p style="font-size:9px;color:#888;margin:0 0 4px;font-style:italic">${signal.story}</p>
          <div style="font-size:10px;line-height:1.6;color:#999">${signalDetails}</div>
        </div>
      `, { className: "pulse-popup", maxWidth: 200 });
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    };
  }, [map, showPulse, data]);
}
