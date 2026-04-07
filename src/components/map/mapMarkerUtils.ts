/**
 * Map marker utilities — extracted from LeafletFallbackMap.
 * Contains SVG generation, icon caching, tier classification,
 * and viewport-culling helpers.
 */
import L from "leaflet";
import { type TreeTier, getTreeTier, getSpeciesHue } from "@/utils/treeCardTypes";

export type Tier = TreeTier;
export { getTreeTier, getSpeciesHue };

/* ── Viewport-cull helper ── */
export function getVisibleTrees<T extends { latitude: number; longitude: number }>(
  map: L.Map,
  trees: T[],
  pad = 0.1
): T[] {
  const b = map.getBounds();
  const s = b.getSouth() - pad;
  const n = b.getNorth() + pad;
  const w = b.getWest() - pad;
  const e = b.getEast() + pad;
  return trees.filter(
    (t) =>
      t.latitude >= s &&
      t.latitude <= n &&
      t.longitude >= w &&
      t.longitude <= e
  );
}

/* ── SVG cache ── */
const SVG_CACHE: Record<string, string> = {};

export function getSvgDataUri(
  tier: Tier,
  species?: string,
  hueOverride?: number
): string {
  const hue =
    hueOverride !== undefined
      ? hueOverride
      : species
      ? getSpeciesHue(species)
      : 120;
  const key = `${tier}-${hue}`;
  if (SVG_CACHE[key]) return SVG_CACHE[key];

  const sat =
    tier === "ancient"
      ? 50
      : tier === "storied"
      ? 45
      : tier === "notable"
      ? 40
      : 35;
  const light =
    tier === "ancient"
      ? 30
      : tier === "storied"
      ? 32
      : tier === "notable"
      ? 34
      : 38;
  const canopy = `hsl(${hue},${sat}%,${light}%)`;

  const palette = {
    ancient: {
      trunk: "hsl(30,35%,28%)",
      stroke: "hsl(42,90%,55%)",
      ring: "hsl(42,80%,50%)",
    },
    storied: {
      trunk: "hsl(30,30%,30%)",
      stroke: "hsl(42,70%,48%)",
      ring: "hsl(42,60%,45%)",
    },
    notable: {
      trunk: "hsl(28,25%,32%)",
      stroke: "hsl(45,55%,42%)",
      ring: "",
    },
    seedling: {
      trunk: "hsl(25,20%,35%)",
      stroke: "hsl(45,40%,38%)",
      ring: "",
    },
  }[tier];

  const crownRing = palette.ring
    ? `<circle cx="20" cy="20" r="19" fill="none" stroke="${palette.ring}" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.5"/>`
    : "";
  const dot =
    tier === "ancient"
      ? `<circle cx="20" cy="5" r="2.5" fill="hsl(42,95%,60%)" opacity="0.85"/>`
      : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${crownRing}<circle cx="20" cy="20" r="16" fill="${canopy}" stroke="${palette.stroke}" stroke-width="2"/><ellipse cx="15" cy="15" rx="6" ry="5" fill="${canopy}" opacity="0.6" transform="rotate(-15 15 15)"/><ellipse cx="25" cy="14" rx="5" ry="4.5" fill="${canopy}" opacity="0.5" transform="rotate(10 25 14)"/><ellipse cx="20" cy="12" rx="7" ry="5" fill="${canopy}" opacity="0.4"/><rect x="17.5" y="26" width="5" height="8" rx="1.5" fill="${palette.trunk}"/><line x1="17" y1="33" x2="13" y2="36" stroke="${palette.trunk}" stroke-width="1.2" stroke-linecap="round"/><line x1="23" y1="33" x2="27" y2="36" stroke="${palette.trunk}" stroke-width="1.2" stroke-linecap="round"/>${dot}</svg>`;

  SVG_CACHE[key] = `data:image/svg+xml;base64,${btoa(svg)}`;
  return SVG_CACHE[key];
}

/* ── Marker sizes ── */
export const MARKER_SIZES: Record<Tier, number> = {
  ancient: 40,
  storied: 34,
  notable: 30,
  seedling: 24,
};

/* ── Icon cache ── */
const ICON_CACHE: Record<string, L.DivIcon> = {};

export function getOrCreateIcon(
  tier: Tier,
  species: string,
  birdsongCount?: number,
  hiveHue?: number,
  heartPoolCount?: number
): L.DivIcon {
  const hue = hiveHue !== undefined ? hiveHue : getSpeciesHue(species);
  const hasBirdsong = (birdsongCount ?? 0) > 0;
  const hearts = heartPoolCount ?? 0;
  const cacheKey = `${tier}-${hue}-${hasBirdsong ? birdsongCount : 0}-${
    hiveHue !== undefined ? "h" : "s"
  }-hp${hearts > 0 ? (hearts > 10 ? "hi" : "lo") : "0"}`;
  if (ICON_CACHE[cacheKey]) return ICON_CACHE[cacheKey];

  const size = MARKER_SIZES[tier];
  const uri = getSvgDataUri(tier, species, hiveHue);
  const birdBadge = hasBirdsong
    ? `<span class="birdsong-badge" style="position:absolute;top:-4px;right:-6px;display:flex;align-items:center;gap:1px;background:hsla(200,60%,18%,0.92);border:1.5px solid hsla(200,50%,45%,0.6);border-radius:99px;padding:1px 4px;font-size:9px;font-family:sans-serif;color:hsl(200,60%,70%);line-height:1;white-space:nowrap;pointer-events:none;"><span style="font-size:10px;">🐦</span>${
        birdsongCount! > 1 ? birdsongCount : ""
      }</span>`
    : "";

  // Heart pool glow — rendered as a CSS class + count badge
  const heartGlowClass = hearts > 0 ? (hearts > 10 ? " heart-pool-strong" : " heart-pool-soft") : "";
  const heartBadge = hearts > 0
    ? `<span class="heart-pool-badge" style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:2px;background:hsla(120,45%,18%,0.92);border:1px solid hsla(120,45%,40%,0.5);border-radius:99px;padding:1px 5px;font-size:8px;font-family:sans-serif;color:hsl(120,55%,65%);line-height:1;white-space:nowrap;pointer-events:none;">💚${hearts > 1 ? hearts : ""}</span>`
    : "";

  const icon = L.divIcon({
    className: "leaflet-tree-marker",
    html: `<div style="position:relative;display:inline-block;"><div class="marker-wrap marker-${tier}${heartGlowClass} ${
      tier === "ancient" ? "marker-ancient" : ""
    }" style="width:${size}px;height:${size}px;background-image:url('${uri}');background-size:contain;cursor:pointer;"></div>${birdBadge}${heartBadge}</div>`,
    iconSize: [size + 8, size + 12],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
  });
  ICON_CACHE[cacheKey] = icon;
  return icon;
}

/** Parse "H S% L%" accentHsl → numeric hue */
export function hslStringToHue(hslStr: string): number {
  const parts = hslStr.split(/[\s]+/);
  return parseInt(parts[0], 10) || 120;
}
