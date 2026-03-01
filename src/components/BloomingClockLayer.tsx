/**
 * BloomingClockLayer — Global Seasonal Atlas
 * 
 * "A collaboration between blossom and algorithm."
 * 
 * Renders food cycle regions as breathing organic overlays.
 * Every animation answers: "Does this feel like wind?"
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  type FoodCycle,
  type CycleStage,
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
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(1.03); }
}
@keyframes petalDrift {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
  50% { opacity: 0.5; }
  100% { transform: translate(12px, 28px) rotate(120deg); opacity: 0; }
}
@keyframes fruitShimmer {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
@keyframes peakWarmth {
  0%, 100% { opacity: 0.45; box-shadow: 0 0 18px hsla(42, 70%, 55%, 0.15); }
  50% { opacity: 0.65; box-shadow: 0 0 28px hsla(42, 70%, 55%, 0.25); }
}
.bloom-marker { background: transparent !important; border: none !important; pointer-events: auto !important; }
.bloom-breath { border-radius: 50%; animation: seasonalBreathe 6s ease-in-out infinite; }
.bloom-peak-breath { border-radius: 50%; animation: peakWarmth 5s ease-in-out infinite; }
.bloom-petal { position: absolute; animation: petalDrift 4s ease-in-out infinite; pointer-events: none; }
.bloom-fruit-dot { position: absolute; border-radius: 50%; animation: fruitShimmer 3s ease-in-out infinite; pointer-events: none; }
.bloom-label { font-family: serif; white-space: nowrap; pointer-events: none; letter-spacing: 0.03em; }
.bloom-constellation-node { cursor: pointer; transition: transform 0.4s ease, opacity 0.4s ease; }
.bloom-constellation-node:hover { transform: scale(1.1) !important; }
.bloom-insight { font-family: serif; line-height: 1.5; }
.bloom-insight .attribution { font-size: 8px; opacity: 0.5; font-style: italic; margin-top: 8px; border-top: 1px solid hsla(42, 30%, 40%, 0.2); padding-top: 6px; }
`;

/* ── Stage-specific gradient builders ── */
function stageGradient(stage: CycleStage, isPeak: boolean): string {
  if (isPeak) {
    return "radial-gradient(circle, hsla(42, 70%, 55%, 0.25) 0%, hsla(42, 60%, 50%, 0.08) 50%, transparent 80%)";
  }
  switch (stage) {
    case "flowering":
      return "radial-gradient(circle, hsla(340, 50%, 70%, 0.2) 0%, hsla(340, 40%, 65%, 0.06) 50%, transparent 80%)";
    case "fruiting":
      return "radial-gradient(circle, hsla(120, 35%, 55%, 0.18) 0%, hsla(120, 30%, 50%, 0.05) 50%, transparent 80%)";
    case "harvest":
      return "radial-gradient(circle, hsla(35, 60%, 55%, 0.22) 0%, hsla(35, 50%, 50%, 0.07) 50%, transparent 80%)";
    case "dormant":
      return "radial-gradient(circle, hsla(220, 15%, 50%, 0.1) 0%, hsla(220, 10%, 45%, 0.03) 50%, transparent 80%)";
    case "peak":
      return "radial-gradient(circle, hsla(42, 70%, 55%, 0.25) 0%, hsla(42, 60%, 50%, 0.08) 50%, transparent 80%)";
  }
}

/* ── Seasonal particles (restrained) ── */
function particleHTML(stage: CycleStage, isPeak: boolean): string {
  if (stage === "dormant") return ""; // Stillness.

  if (stage === "flowering" || (isPeak && stage === "peak")) {
    // Light petal drift — 2-3 tiny petals
    const petals = [0, 1, 2].map(i => `
      <span class="bloom-petal" style="
        left:${8 + i * 12}px; top:${4 + i * 6}px;
        font-size:${7 + i}px; opacity:${0.5 - i * 0.1};
        animation-delay:${i * 1.2}s;
      ">✿</span>
    `).join("");
    return petals;
  }

  if (stage === "fruiting") {
    // Soft dot shimmer
    return [0, 1].map(i => `
      <span class="bloom-fruit-dot" style="
        width:3px; height:3px;
        left:${15 + i * 18}px; top:${20 + i * 8}px;
        background:hsla(120, 40%, 55%, 0.4);
        animation-delay:${i * 1.5}s;
      "></span>
    `).join("");
  }

  if (stage === "harvest") {
    // Warm tone — single subtle icon
    return `<span class="bloom-petal" style="left:20px;top:10px;font-size:8px;opacity:0.35;animation-delay:0.5s;">🍂</span>`;
  }

  return "";
}

/* ── Poetic insight popup ── */
function insightPopup(info: { region: any; food: FoodCycle; stage: CycleStage; isPeak: boolean }, month: number): string {
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
    <div class="bloom-insight" style="padding:10px 12px;min-width:180px;max-width:240px;background:hsla(30,18%,8%,0.95);color:hsl(42,50%,72%);border-radius:10px;border:1px solid hsla(42,30%,30%,0.25);">
      <div style="font-size:15px;margin-bottom:2px;">${food.icon} ${food.name}</div>
      ${food.scientific_name ? `<div style="font-size:10px;color:hsl(42,35%,52%);font-style:italic;margin-bottom:8px;">${food.scientific_name}</div>` : ''}
      
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="color:${visual.color};font-size:13px;">${visual.icon}</span>
        <span style="font-size:12px;color:${visual.color};">${visual.label}</span>
        ${isPeak ? `<span style="font-size:10px;color:hsl(42,75%,60%);margin-left:4px;">✦ Peak</span>` : ''}
      </div>

      <div style="font-size:10px;color:hsl(42,35%,55%);font-style:italic;margin-bottom:6px;line-height:1.4;">
        ${stagePoetry[stage]}
      </div>

      <div style="font-size:9px;color:hsl(42,25%,48%);margin-bottom:4px;">
        📍 ${region.name}${region.country ? `, ${region.country}` : ''} · ${seasonName}
      </div>

      ${food.cultural_associations ? `
        <div style="font-size:9px;color:hsl(42,30%,52%);line-height:1.4;margin-top:6px;padding-top:6px;border-top:1px solid hsla(42,25%,35%,0.2);">
          "${food.cultural_associations}"
        </div>
      ` : ''}

      ${food.notes ? `
        <div style="font-size:9px;color:hsl(42,20%,48%);line-height:1.3;margin-top:4px;">
          ${food.notes}
        </div>
      ` : ''}

      <div class="attribution">
        Seasonal data woven from climate records, grower insights, and regional knowledge.
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
}: BloomingClockLayerProps) {
  const layerRef = useRef<L.LayerGroup | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!map) return;

    // Inject CSS once
    if (!styleRef.current) {
      const style = document.createElement("style");
      style.textContent = BLOOM_CSS;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    // Clear previous
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!active || foods.length === 0) return;

    const month = monthOverride ?? (new Date().getMonth() + 1);
    const regionStages = computeRegionStages(foods, selectedFoodIds, stageFilter, month);
    if (regionStages.length === 0) return;

    const layer = L.layerGroup();
    const zoom = map.getZoom();

    regionStages.forEach(info => {
      const { region, food, stage, isPeak } = info;
      const visual = STAGE_VISUALS[stage];

      if (constellationMode) {
        /* ── Constellation: quiet nodes ── */
        const size = 32;
        const icon = L.divIcon({
          className: "bloom-marker",
          html: `
            <div class="bloom-constellation-node" style="
              width:${size}px;height:${size}px;
              display:flex;align-items:center;justify-content:center;
              border-radius:50%;
              background:hsla(30,20%,10%,0.85);
              border:1px solid ${visual.color.replace(')', ', 0.4)')};
              font-size:16px;
              position:relative;
              opacity:0.85;
            ">
              ${food.icon}
              <span style="
                position:absolute;bottom:-10px;
                font-size:7px;font-family:serif;
                color:${visual.color};
                opacity:0.7;
                white-space:nowrap;
              ">${visual.label}</span>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([region.lat, region.lng], { icon });
        marker.bindPopup(insightPopup(info, month), {
          className: "atlas-leaflet-popup",
          maxWidth: 260,
          closeButton: false,
        });
        marker.addTo(layer);

      } else {
        /* ── Organic breath mode ── */
        const baseRadius = zoom >= 8 ? 28 : zoom >= 5 ? 45 : 65;
        const radius = isPeak ? baseRadius * 1.2 : baseRadius;
        const breathClass = isPeak ? "bloom-peak-breath" : "bloom-breath";
        const showParticles = zoom >= 5;
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
              ${showParticles ? `<div style="position:absolute;inset:0;pointer-events:none;">${particleHTML(stage, isPeak)}</div>` : ''}
              <div style="position:relative;z-index:2;text-align:center;">
                <span style="font-size:${zoom >= 5 ? 18 : 14}px;opacity:0.85;">${food.icon}</span>
                ${showLabel ? `<div class="bloom-label" style="font-size:${zoom >= 6 ? 9 : 7}px;color:${visual.color};margin-top:2px;opacity:0.75;">${food.name}</div>` : ''}
                ${showRegion ? `<div class="bloom-label" style="font-size:7px;color:${visual.color};opacity:0.45;">${region.name}</div>` : ''}
              </div>
            </div>
          `,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });

        const marker = L.marker([region.lat, region.lng], { icon, interactive: true });
        marker.bindPopup(insightPopup(info, month), {
          className: "atlas-leaflet-popup",
          maxWidth: 260,
          closeButton: false,
        });
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
