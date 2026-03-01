/**
 * BloomingClockLayer — renders food cycle regions on the Leaflet map
 * as organic gradient overlays with stage-appropriate visual language.
 */
import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import {
  type FoodCycle,
  type CycleStage,
  type RegionStageInfo,
  computeRegionStages,
  STAGE_VISUALS,
} from "@/hooks/use-food-cycles";

interface BloomingClockLayerProps {
  map: L.Map | null;
  foods: FoodCycle[];
  selectedFoodIds: string[];
  stageFilter: CycleStage | "all";
  active: boolean;
  constellationMode?: boolean;
}

const BLOOM_CSS = `
@keyframes bloomPulse{0%,100%{transform:scale(1);opacity:0.7}50%{transform:scale(1.08);opacity:1}}
@keyframes peakHalo{0%,100%{box-shadow:0 0 20px hsla(42,80%,55%,0.3),0 0 40px hsla(42,80%,55%,0.1)}50%{box-shadow:0 0 30px hsla(42,80%,55%,0.5),0 0 60px hsla(42,80%,55%,0.2)}}
@keyframes blossomDrift{0%{transform:translateY(0) rotate(0deg);opacity:0.8}100%{transform:translateY(40px) rotate(180deg);opacity:0}}
.bloom-region-marker{background:transparent!important;border:none!important;pointer-events:auto!important}
.bloom-glow{border-radius:50%;transition:all 0.8s ease-in-out;animation:bloomPulse 4s ease-in-out infinite}
.bloom-peak{animation:bloomPulse 3s ease-in-out infinite,peakHalo 3.5s ease-in-out infinite!important}
.bloom-label{font-family:serif;white-space:nowrap;pointer-events:none}
.bloom-constellation{cursor:pointer;transition:transform 0.2s}
.bloom-constellation:hover{transform:scale(1.15)!important}
`;

export default function BloomingClockLayer({
  map,
  foods,
  selectedFoodIds,
  stageFilter,
  active,
  constellationMode = false,
}: BloomingClockLayerProps) {
  const layerRef = useRef<L.LayerGroup | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!map) return;

    // Inject CSS
    if (!styleRef.current) {
      const style = document.createElement("style");
      style.textContent = BLOOM_CSS;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    // Clear previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!active || foods.length === 0) return;

    const regionStages = computeRegionStages(foods, selectedFoodIds, stageFilter);
    if (regionStages.length === 0) return;

    const layer = L.layerGroup();

    regionStages.forEach(info => {
      const { region, food, stage, isPeak } = info;
      const visual = STAGE_VISUALS[stage];
      const zoom = map.getZoom();

      if (constellationMode) {
        // Constellation mode: food icons clustered
        const size = 36;
        const icon = L.divIcon({
          className: "bloom-region-marker",
          html: `
            <div class="bloom-constellation" style="
              width:${size}px;height:${size}px;
              display:flex;align-items:center;justify-content:center;
              border-radius:50%;
              background:hsla(30,25%,10%,0.9);
              border:1.5px solid ${visual.color};
              box-shadow:0 0 8px ${visual.glowColor};
              font-size:18px;
              position:relative;
            ">
              ${food.icon}
              <span style="
                position:absolute;top:-6px;right:-6px;
                font-size:8px;font-family:serif;
                background:${visual.color};color:hsl(30,20%,10%);
                padding:1px 4px;border-radius:8px;
                font-weight:bold;
              ">${visual.label}</span>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([region.lat, region.lng], { icon });
        marker.bindPopup(`
          <div style="font-family:serif;padding:8px;min-width:160px;background:hsl(30,15%,10%);color:hsl(42,60%,70%);border-radius:8px;">
            <div style="font-size:16px;margin-bottom:4px;">${food.icon} ${food.name}</div>
            <div style="font-size:11px;color:hsl(42,40%,55%);font-style:italic;margin-bottom:6px;">${food.scientific_name || ''}</div>
            <div style="font-size:12px;margin-bottom:4px;">
              <span style="color:${visual.color}">${visual.icon} ${visual.label}</span>
              ${isPeak ? ' <span style="color:hsl(42,85%,60%)">✦ Peak</span>' : ''}
            </div>
            <div style="font-size:10px;color:hsl(42,30%,50%);">${region.name}</div>
            ${food.cultural_associations ? `<div style="font-size:9px;color:hsl(42,25%,45%);margin-top:4px;font-style:italic;line-height:1.3;">"${food.cultural_associations}"</div>` : ''}
          </div>
        `, { className: "atlas-leaflet-popup", maxWidth: 220 });

        marker.addTo(layer);
      } else {
        // Organic glow mode: soft regional circles
        const baseRadius = zoom >= 8 ? 30 : zoom >= 5 ? 50 : 70;
        const radius = isPeak ? baseRadius * 1.3 : baseRadius;
        const glowClass = isPeak ? "bloom-glow bloom-peak" : "bloom-glow";

        const icon = L.divIcon({
          className: "bloom-region-marker",
          html: `
            <div style="position:relative;width:${radius * 2}px;height:${radius * 2}px;display:flex;align-items:center;justify-content:center;">
              <div class="${glowClass}" style="
                position:absolute;inset:0;
                background:radial-gradient(circle, ${visual.glowColor} 0%, ${visual.glowColor.replace(/[\d.]+\)$/, '0.05)')} 70%, transparent 100%);
              "></div>
              <div style="position:relative;z-index:2;text-align:center;">
                <span style="font-size:${zoom >= 5 ? 20 : 16}px;">${food.icon}</span>
                ${zoom >= 4 ? `<div class="bloom-label" style="font-size:${zoom >= 6 ? 10 : 8}px;color:${visual.color};margin-top:2px;">${food.name}</div>` : ''}
                ${zoom >= 6 ? `<div class="bloom-label" style="font-size:8px;color:${visual.color};opacity:0.7;">${region.name}</div>` : ''}
              </div>
            </div>
          `,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });

        const marker = L.marker([region.lat, region.lng], { icon, interactive: true });
        marker.bindPopup(`
          <div style="font-family:serif;padding:8px;min-width:160px;background:hsl(30,15%,10%);color:hsl(42,60%,70%);border-radius:8px;">
            <div style="font-size:16px;margin-bottom:4px;">${food.icon} ${food.name}</div>
            <div style="font-size:11px;color:hsl(42,40%,55%);font-style:italic;margin-bottom:6px;">${food.scientific_name || ''}</div>
            <div style="font-size:12px;margin-bottom:4px;">
              <span style="color:${visual.color}">${visual.icon} ${visual.label}</span>
              ${isPeak ? ' <span style="color:hsl(42,85%,60%)">✦ Peak Season</span>' : ''}
            </div>
            <div style="font-size:10px;color:hsl(42,30%,50%);margin-bottom:4px;">${region.name}</div>
            ${food.notes ? `<div style="font-size:9px;color:hsl(42,25%,45%);line-height:1.3;margin-top:4px;">${food.notes}</div>` : ''}
            ${food.cultural_associations ? `<div style="font-size:9px;color:hsl(42,25%,45%);margin-top:4px;font-style:italic;border-top:1px solid hsla(42,30%,30%,0.3);padding-top:4px;">"${food.cultural_associations}"</div>` : ''}
          </div>
        `, { className: "atlas-leaflet-popup", maxWidth: 240 });

        marker.addTo(layer);
      }
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, foods, selectedFoodIds, stageFilter, active, constellationMode]);

  // Cleanup CSS on unmount
  useEffect(() => {
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, []);

  return null;
}
