/**
 * BloomingClockLayer — Global Seasonal Atlas
 *
 * "A collaboration between blossom and algorithm."
 *
 * Renders food cycle regions as quiet breathing markers on the map.
 * Particles are handled by BloomingClockParticles (Canvas).
 * Every animation answers: "Does this feel like wind?"
 */
import { useEffect, useRef } from "react";
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
  monthOverride?: number;
  onRegionStages?: (stages: RegionStageInfo[]) => void;
}

/* ── Poetic month names ── */
const MONTH_POETRY: Record<number, string> = {
  1: "Deep Winter", 2: "Late Winter", 3: "Early Spring",
  4: "Spring", 5: "Late Spring", 6: "Early Summer",
  7: "Midsummer", 8: "Late Summer", 9: "Early Autumn",
  10: "Autumn", 11: "Late Autumn", 12: "Early Winter",
};

/* ── CSS: breathing, not flashing ── */
const BLOOM_CSS = `
@keyframes seasonalBreathe {
  0%, 100% { opacity: 0.22; transform: scale(1); }
  50% { opacity: 0.38; transform: scale(1.02); }
}
@keyframes peakWarmth {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.48; }
}
.bloom-marker { background: transparent !important; border: none !important; pointer-events: auto !important; }
.bloom-breath { border-radius: 50%; animation: seasonalBreathe 7s ease-in-out infinite; }
.bloom-peak-breath { border-radius: 50%; animation: peakWarmth 5.5s ease-in-out infinite; }
.bloom-label { font-family: serif; white-space: nowrap; pointer-events: none; letter-spacing: 0.04em; }
.bloom-constellation-node { cursor: pointer; transition: transform 0.5s ease, opacity 0.5s ease; }
.bloom-constellation-node:hover { transform: scale(1.08) !important; }
.bloom-insight { font-family: serif; line-height: 1.55; }
.bloom-insight .attribution {
  font-size: 7.5px; opacity: 0.45; font-style: italic;
  margin-top: 8px; border-top: 1px solid hsla(42, 25%, 35%, 0.15);
  padding-top: 6px; line-height: 1.4;
}
`;

/* ── Subtle gradient per stage ── */
function stageGradient(stage: CycleStage, isPeak: boolean): string {
  if (isPeak) return "radial-gradient(circle, hsla(42, 60%, 55%, 0.18) 0%, hsla(42, 50%, 50%, 0.04) 60%, transparent 85%)";
  switch (stage) {
    case "flowering": return "radial-gradient(circle, hsla(340, 45%, 72%, 0.14) 0%, hsla(340, 35%, 65%, 0.03) 60%, transparent 85%)";
    case "fruiting": return "radial-gradient(circle, hsla(120, 30%, 55%, 0.12) 0%, hsla(120, 25%, 50%, 0.03) 60%, transparent 85%)";
    case "harvest": return "radial-gradient(circle, hsla(35, 55%, 55%, 0.16) 0%, hsla(35, 45%, 50%, 0.04) 60%, transparent 85%)";
    case "dormant": return "radial-gradient(circle, hsla(220, 12%, 50%, 0.06) 0%, transparent 70%)";
    case "peak": return "radial-gradient(circle, hsla(42, 60%, 55%, 0.18) 0%, hsla(42, 50%, 50%, 0.04) 60%, transparent 85%)";
  }
}

/* ── Poetic insight popup ── */
function insightPopup(info: RegionStageInfo, month: number): string {
  const { region, food, stage, isPeak } = info;
  const visual = STAGE_VISUALS[stage];
  const seasonName = MONTH_POETRY[month] || "";

  const stagePoetry: Record<CycleStage, string> = {
    flowering: "Blossoms are opening across this region",
    fruiting: "Fruit is forming quietly on the branch",
    harvest: "The land is offering its yield",
    dormant: "The roots rest, gathering strength",
    peak: "This is the fullest expression of the season",
  };

  return `
    <div class="bloom-insight" style="padding:12px 14px;min-width:180px;max-width:240px;background:hsla(30,18%,7%,0.96);color:hsl(42,45%,72%);border-radius:12px;border:1px solid hsla(42,25%,28%,0.2);">
      <div style="font-size:15px;margin-bottom:3px;">${food.icon} ${food.name}</div>
      ${food.scientific_name ? `<div style="font-size:9.5px;color:hsl(42,30%,50%);font-style:italic;margin-bottom:8px;">${food.scientific_name}</div>` : ''}

      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span style="color:${visual.color};font-size:12px;">${visual.icon}</span>
        <span style="font-size:11px;color:${visual.color};">${visual.label}</span>
        ${isPeak ? `<span style="font-size:9px;color:hsl(42,70%,60%);margin-left:2px;">✦ Peak</span>` : ''}
      </div>

      <div style="font-size:10px;color:hsl(42,30%,55%);font-style:italic;margin-bottom:8px;line-height:1.45;">
        ${stagePoetry[stage]}
      </div>

      <div style="font-size:8.5px;color:hsl(42,22%,48%);">
        📍 ${region.name}${region.country ? ` · ${region.country}` : ''} · ${seasonName}
      </div>

      ${food.cultural_associations ? `
        <div style="font-size:9px;color:hsl(42,28%,52%);line-height:1.45;margin-top:8px;padding-top:7px;border-top:1px solid hsla(42,20%,32%,0.15);">
          "${food.cultural_associations}"
        </div>
      ` : ''}

      ${food.notes ? `
        <div style="font-size:8.5px;color:hsl(42,18%,48%);line-height:1.35;margin-top:5px;">${food.notes}</div>
      ` : ''}

      <div class="attribution">
        Seasonal data woven from climate records,<br/>grower insights, and regional knowledge.
      </div>
    </div>
  `;
}

export default function BloomingClockLayer({
  map,
  foods,
  selectedFoodIds,
  stageFilter,
  active,
  constellationMode = false,
  monthOverride,
  onRegionStages,
}: BloomingClockLayerProps) {
  const layerRef = useRef<L.LayerGroup | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!styleRef.current) {
      const style = document.createElement("style");
      style.textContent = BLOOM_CSS;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!active || foods.length === 0) {
      onRegionStages?.([]);
      return;
    }

    const month = monthOverride ?? (new Date().getMonth() + 1);
    const regionStages = computeRegionStages(foods, selectedFoodIds, stageFilter, month);
    onRegionStages?.(regionStages);

    if (regionStages.length === 0) return;

    const layer = L.layerGroup();
    const zoom = map.getZoom();

    regionStages.forEach(info => {
      const { region, food, stage, isPeak } = info;
      const visual = STAGE_VISUALS[stage];

      if (constellationMode) {
        const size = 30;
        const icon = L.divIcon({
          className: "bloom-marker",
          html: `
            <div class="bloom-constellation-node" style="
              width:${size}px;height:${size}px;
              display:flex;align-items:center;justify-content:center;
              border-radius:50%;
              background:hsla(30,18%,10%,0.8);
              border:1px solid ${visual.color.replace(')', ', 0.3)')};
              font-size:14px;
              opacity:0.8;
            ">
              ${food.icon}
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const marker = L.marker([region.lat, region.lng], { icon });
        marker.bindPopup(insightPopup(info, month), { className: "atlas-leaflet-popup", maxWidth: 260, closeButton: false });
        marker.addTo(layer);

      } else {
        /* Organic breath mode — the region gently breathes */
        const baseRadius = zoom >= 8 ? 24 : zoom >= 5 ? 40 : 60;
        const radius = isPeak ? baseRadius * 1.15 : baseRadius;
        const breathClass = isPeak ? "bloom-peak-breath" : "bloom-breath";
        const showLabel = zoom >= 4;
        const showRegion = zoom >= 6;

        const icon = L.divIcon({
          className: "bloom-marker",
          html: `
            <div style="position:relative;width:${radius * 2}px;height:${radius * 2}px;display:flex;align-items:center;justify-content:center;">
              <div class="${breathClass}" style="
                position:absolute;inset:0;
                background:${stageGradient(stage, isPeak)};
              "></div>
              <div style="position:relative;z-index:2;text-align:center;">
                <span style="font-size:${zoom >= 5 ? 16 : 13}px;opacity:0.75;">${food.icon}</span>
                ${showLabel ? `<div class="bloom-label" style="font-size:${zoom >= 6 ? 8 : 7}px;color:${visual.color};margin-top:1px;opacity:0.6;">${food.name}</div>` : ''}
                ${showRegion ? `<div class="bloom-label" style="font-size:6.5px;color:${visual.color};opacity:0.35;">${region.name}</div>` : ''}
              </div>
            </div>
          `,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });

        const marker = L.marker([region.lat, region.lng], { icon, interactive: true });
        marker.bindPopup(insightPopup(info, month), { className: "atlas-leaflet-popup", maxWidth: 260, closeButton: false });
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
  }, [map, foods, selectedFoodIds, stageFilter, active, constellationMode, monthOverride]);

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
