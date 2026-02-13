import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { escapeHtml } from "@/utils/escapeHtml";
import {
  fetchAllSourceTrees,
  getEnabledSources,
  getSourceById,
  type ExternalTreeCandidate,
  type BBox,
} from "@/utils/externalTreeSources";
import { Navigation, Loader2, Compass, TreePine, Plus, Layers } from "lucide-react";
import LiteMapFilters, { LitePerspective } from "./LiteMapFilters";
import LiteMapSearch from "./LiteMapSearch";
import AddTreeDialog from "./AddTreeDialog";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  what3words: string;
  description?: string;
  estimated_age?: number | null;
  created_by?: string;
}

interface TreeOfferings {
  [treeId: string]: number;
}

interface BirdsongCounts {
  [treeId: string]: number;
}

interface BirdsongHeatPoint {
  tree_id: string;
  season: string | null;
  latitude: number;
  longitude: number;
}

interface BloomedSeed {
  id: string;
  tree_id: string;
  latitude: number | null;
  longitude: number | null;
  blooms_at: string;
  planter_id: string;
}

interface TreePhotos {
  [treeId: string]: string;
}

interface LeafletFallbackMapProps {
  trees: Tree[];
  offeringCounts?: TreeOfferings;
  treePhotos?: TreePhotos;
  birdsongCounts?: BirdsongCounts;
  birdsongHeatPoints?: BirdsongHeatPoint[];
  className?: string;
  userId?: string | null;
  bloomedSeeds?: BloomedSeed[];
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  initialW3w?: string;
}

/* ── Marker tier ── */
type Tier = "ancient" | "storied" | "notable" | "seedling";

function getTreeTier(age: number, offerings: number): Tier {
  if (age >= 100) return "ancient";
  if (offerings >= 3) return "storied";
  if (offerings >= 1 || age >= 50) return "notable";
  return "seedling";
}

/* ── Species-aware canopy hue ── */
const SPECIES_HUE: Record<string, number> = {
  oak: 120, yew: 145, ash: 110, beech: 130, birch: 90, cherry: 340,
  holly: 150, pine: 155, willow: 100, rowan: 25, hawthorn: 115,
  hazel: 80, sycamore: 105, alder: 135, apple: 95,
};

function getSpeciesHue(species: string): number {
  return SPECIES_HUE[species.toLowerCase()] ?? 120;
}

/* ── SVG with species-aware coloring ── */
const SVG_CACHE: Record<string, string> = {};

function getSvgDataUri(tier: Tier, species?: string): string {
  const hue = species ? getSpeciesHue(species) : 120;
  const key = `${tier}-${hue}`;
  if (SVG_CACHE[key]) return SVG_CACHE[key];

  const sat = tier === "ancient" ? 50 : tier === "storied" ? 45 : tier === "notable" ? 40 : 35;
  const light = tier === "ancient" ? 30 : tier === "storied" ? 32 : tier === "notable" ? 34 : 38;
  const canopy = `hsl(${hue},${sat}%,${light}%)`;

  const palette = {
    ancient:  { trunk: "hsl(30,35%,28%)", stroke: "hsl(42,90%,55%)", ring: "hsl(42,80%,50%)" },
    storied:  { trunk: "hsl(30,30%,30%)", stroke: "hsl(42,70%,48%)", ring: "hsl(42,60%,45%)" },
    notable:  { trunk: "hsl(28,25%,32%)", stroke: "hsl(45,55%,42%)", ring: "" },
    seedling: { trunk: "hsl(25,20%,35%)", stroke: "hsl(45,40%,38%)", ring: "" },
  }[tier];

  const crownRing = palette.ring
    ? `<circle cx="20" cy="20" r="19" fill="none" stroke="${palette.ring}" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.5"/>`
    : "";
  const dot = tier === "ancient"
    ? `<circle cx="20" cy="5" r="2.5" fill="hsl(42,95%,60%)" opacity="0.85"/>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${crownRing}<circle cx="20" cy="20" r="16" fill="${canopy}" stroke="${palette.stroke}" stroke-width="2"/><ellipse cx="15" cy="15" rx="6" ry="5" fill="${canopy}" opacity="0.6" transform="rotate(-15 15 15)"/><ellipse cx="25" cy="14" rx="5" ry="4.5" fill="${canopy}" opacity="0.5" transform="rotate(10 25 14)"/><ellipse cx="20" cy="12" rx="7" ry="5" fill="${canopy}" opacity="0.4"/><rect x="17.5" y="26" width="5" height="8" rx="1.5" fill="${palette.trunk}"/><line x1="17" y1="33" x2="13" y2="36" stroke="${palette.trunk}" stroke-width="1.2" stroke-linecap="round"/><line x1="23" y1="33" x2="27" y2="36" stroke="${palette.trunk}" stroke-width="1.2" stroke-linecap="round"/>${dot}</svg>`;

  SVG_CACHE[key] = `data:image/svg+xml;base64,${btoa(svg)}`;
  return SVG_CACHE[key];
}

const MARKER_SIZES: Record<Tier, number> = { ancient: 40, storied: 34, notable: 30, seedling: 24 };

/* ── Icon cache (module-level) ── */
const ICON_CACHE: Record<string, L.DivIcon> = {};

function getOrCreateIcon(tier: Tier, species: string, birdsongCount?: number): L.DivIcon {
  const hue = getSpeciesHue(species);
  const hasBirdsong = (birdsongCount ?? 0) > 0;
  const cacheKey = `${tier}-${hue}-${hasBirdsong ? birdsongCount : 0}`;
  if (ICON_CACHE[cacheKey]) return ICON_CACHE[cacheKey];

  const size = MARKER_SIZES[tier];
  const uri = getSvgDataUri(tier, species);
  const birdBadge = hasBirdsong
    ? `<span class="birdsong-badge" style="position:absolute;top:-4px;right:-6px;display:flex;align-items:center;gap:1px;background:hsla(200,60%,18%,0.92);border:1.5px solid hsla(200,50%,45%,0.6);border-radius:99px;padding:1px 4px;font-size:9px;font-family:sans-serif;color:hsl(200,60%,70%);line-height:1;white-space:nowrap;pointer-events:none;"><span style="font-size:10px;">🐦</span>${birdsongCount! > 1 ? birdsongCount : ''}</span>`
    : '';
  const icon = L.divIcon({
    className: "leaflet-tree-marker",
    html: `<div style="position:relative;display:inline-block;"><div class="marker-wrap ${tier === 'ancient' ? 'marker-ancient' : ''}" style="width:${size}px;height:${size}px;background-image:url('${uri}');background-size:contain;cursor:pointer;transition:transform .15s ease-out;"></div>${birdBadge}</div>`,
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
  });
  ICON_CACHE[cacheKey] = icon;
  return icon;
}

/* ── Popup HTML ── */
function buildPopupHtml(tree: Tree, offerings: number, age: number, photoUrl?: string, birdsongCount?: number): string {
  const ageText = age > 0 ? `~${age} years` : "Age unknown";
  const offeringText = offerings > 0
    ? `<span style="color:hsl(42,80%,60%);">✦ ${offerings}</span> offering${offerings !== 1 ? "s" : ""}`
    : `<span style="color:hsl(0,0%,50%);font-style:italic;">No offerings yet</span>`;
  const birdsongLine = (birdsongCount ?? 0) > 0
    ? `<span style="display:flex;align-items:center;gap:3px;">🐦 <span style="color:hsl(200,60%,65%);">${birdsongCount} birdsong${birdsongCount !== 1 ? 's' : ''}</span></span>`
    : "";
  const desc = tree.description
    ? `<p style="margin:0;font-size:11px;color:hsl(0,0%,62%);line-height:1.5;font-family:sans-serif;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${escapeHtml(tree.description.substring(0, 120))}${tree.description.length > 120 ? "…" : ""}</p>`
    : "";

  const thumbnail = photoUrl
    ? `<div style="position:relative;width:100%;height:100px;overflow:hidden;border-radius:12px 12px 0 0;">
        <img src="${escapeHtml(photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
        <div style="position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(to top,hsl(30,15%,10%),transparent);pointer-events:none;"></div>
      </div>`
    : `<div style="position:relative;width:100%;height:90px;overflow:hidden;border-radius:12px 12px 0 0;background:linear-gradient(135deg,hsl(30,20%,14%),hsl(25,18%,10%));display:flex;align-items:center;justify-content:center;">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="opacity:0.35;">
          <path d="M24 6C24 6 14 16 14 26a10 10 0 0020 0C34 16 24 6 24 6z" fill="hsl(42,50%,45%)" />
          <rect x="22" y="30" width="4" height="10" rx="2" fill="hsl(30,30%,35%)" />
          <circle cx="24" cy="22" r="3" fill="hsl(42,70%,55%)" opacity="0.5" />
        </svg>
        <div style="position:absolute;bottom:0;left:0;right:0;height:30px;background:linear-gradient(to top,hsl(30,15%,10%),transparent);pointer-events:none;"></div>
      </div>`;

  return `<div style="padding:0;font-family:'Cinzel',serif;width:240px;background:hsl(30,15%,10%);border-radius:12px;border:1px solid hsla(42,40%,30%,0.5);overflow:hidden;animation:popIn .2s ease-out;">
    ${thumbnail}
    <div style="padding:14px 14px 10px;display:flex;flex-direction:column;gap:6px;">
      <h3 style="margin:0;font-size:15px;color:hsl(45,80%,60%);line-height:1.3;font-weight:700;">${escapeHtml(tree.name)}</h3>
      <p style="margin:0;font-size:11px;color:hsl(${getSpeciesHue(tree.species)},45%,62%);font-style:italic;">${escapeHtml(tree.species)}</p>
      <div style="display:flex;gap:10px;font-size:11px;font-family:sans-serif;color:hsl(0,0%,58%);">
        <span style="display:flex;align-items:center;gap:3px;">🌿 ${ageText}</span>
        <span style="display:flex;align-items:center;gap:3px;">${offeringText}</span>
        ${birdsongLine}
      </div>
      ${tree.what3words ? `<p style="margin:0;font-size:10px;color:hsl(45,40%,48%);font-family:sans-serif;">📍 ${escapeHtml(tree.what3words)}</p>` : ""}
      ${desc}
    </div>
    <div style="padding:0 14px 12px;display:flex;gap:6px;">
      <a href="/tree/${encodeURIComponent(tree.id)}" style="flex:1;display:flex;align-items:center;justify-content:center;padding:9px 0;font-size:12px;color:hsl(80,20%,8%);background:linear-gradient(135deg,hsl(42,88%,50%),hsl(45,100%,60%));border-radius:8px;text-decoration:none;letter-spacing:0.04em;font-weight:700;font-family:sans-serif;">View Details ⟶</a>
    </div>
    <div style="padding:0 14px 12px;display:flex;gap:6px;justify-content:center;">
      <a href="/tree/${encodeURIComponent(tree.id)}?add=photo" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;font-size:15px;text-decoration:none;background:hsla(120,30%,30%,0.15);border:1px solid hsla(120,40%,40%,0.2);border-radius:8px;" title="Add Photo">📷</a>
      <a href="/tree/${encodeURIComponent(tree.id)}?add=song" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;font-size:15px;text-decoration:none;background:hsla(200,30%,30%,0.15);border:1px solid hsla(200,40%,40%,0.2);border-radius:8px;" title="Add Song">🎵</a>
      <a href="/tree/${encodeURIComponent(tree.id)}?add=birdsong" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;font-size:15px;text-decoration:none;background:hsla(180,30%,30%,0.15);border:1px solid hsla(180,40%,40%,0.2);border-radius:8px;" title="Record Birdsong">🐦</a>
      <a href="/tree/${encodeURIComponent(tree.id)}?add=story" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;font-size:15px;text-decoration:none;background:hsla(280,30%,30%,0.15);border:1px solid hsla(280,40%,40%,0.2);border-radius:8px;" title="Add Musing">💭</a>
    </div>
  </div>`;
}

/* ── External tree popup (registry-aware) ── */
function buildExternalPopupHtml(tree: ExternalTreeCandidate): string {
  const displayName = tree.title || tree.species || tree.genus || "Unknown Tree";
  const source = getSourceById(tree.source);
  const sourceName = source?.attribution || tree.source;
  const dotColor = source?.style.color || "hsl(180,60%,50%)";
  const speciesLine = tree.species
    ? `<p style="margin:0;font-size:11px;color:hsl(180,40%,55%);font-style:italic;">${escapeHtml(tree.species)}</p>`
    : tree.genus
    ? `<p style="margin:0;font-size:11px;color:hsl(180,40%,55%);font-style:italic;">Genus: ${escapeHtml(tree.genus)}</p>`
    : "";
  const heightLine = tree.height
    ? `<span style="display:flex;align-items:center;gap:3px;">📏 ~${tree.height}m tall</span>`
    : "";
  const classLine = tree.classification
    ? `<span style="display:flex;align-items:center;gap:3px;">🏛️ ${escapeHtml(tree.classification)}</span>`
    : "";

  return `<div style="padding:0;font-family:'Cinzel',serif;width:220px;background:hsl(200,15%,12%);border-radius:12px;border:1px solid hsla(180,40%,30%,0.5);overflow:hidden;animation:popIn .2s ease-out;">
    <div style="padding:12px 14px 8px;display:flex;flex-direction:column;gap:5px;">
      <div style="display:flex;align-items:center;gap-6px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};margin-right:6px;flex-shrink:0;"></span>
        <h3 style="margin:0;font-size:14px;color:hsl(180,50%,70%);line-height:1.3;font-weight:700;">${escapeHtml(displayName)}</h3>
      </div>
      ${speciesLine}
      <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:11px;font-family:sans-serif;color:hsl(0,0%,55%);">
        ${heightLine}
        ${classLine}
        <span style="display:flex;align-items:center;gap:3px;">🗺️ ${escapeHtml(sourceName)}</span>
      </div>
    </div>
    <div style="padding:6px 14px 12px;">
      <p style="margin:0;font-size:10px;color:hsl(180,30%,45%);font-family:sans-serif;line-height:1.4;">
        Discover recorded elders nearby. Bloom hearts with this Ancient Friend.
      </p>
    </div>
    <div style="padding:0 14px 12px;">
      <a href="/map?lat=${tree.lat}&lng=${tree.lng}&zoom=18" style="display:flex;align-items:center;justify-content:center;padding:9px 0;font-size:12px;color:hsl(200,15%,12%);background:linear-gradient(135deg,hsl(180,60%,45%),hsl(180,70%,55%));border-radius:8px;text-decoration:none;letter-spacing:0.04em;font-weight:700;font-family:sans-serif;">🌱 Bloom Hearts Here</a>
    </div>
  </div>`;
}

/* ── Haversine (km) ── */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Convex hull (Graham scan) ── */
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  function cross(O: [number, number], A: [number, number], B: [number, number]) {
    return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
  }
  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (const p of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/* ── CSS ── */
const LITE_CSS = `
.leaflet-tree-marker{background:transparent!important;border:none!important}
.marker-wrap{transition:transform .15s ease-out,filter .2s ease-out}
.marker-wrap:hover{transform:scale(1.15)!important}
.tree-cluster{display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:'Cinzel',serif;font-weight:700;color:hsl(45,80%,60%);text-shadow:0 1px 2px rgba(0,0,0,0.5);border:2px solid hsla(42,70%,50%,0.55);transition:transform .15s ease-out,box-shadow .15s ease-out}
.tree-cluster:active{transform:scale(0.95)}
.tree-cluster-sm{width:34px;height:34px;font-size:11px;background:hsla(120,40%,20%,0.85);box-shadow:0 0 8px hsla(42,60%,45%,0.2)}
.tree-cluster-md{width:42px;height:42px;font-size:13px;background:hsla(120,45%,18%,0.88);box-shadow:0 0 10px hsla(42,60%,45%,0.25)}
.tree-cluster-lg{width:50px;height:50px;font-size:14px;background:hsla(120,50%,16%,0.9);box-shadow:0 0 14px hsla(42,60%,45%,0.3)}
.tree-cluster-xl{width:56px;height:56px;font-size:15px;background:hsla(120,55%,14%,0.92);box-shadow:0 0 18px hsla(42,60%,45%,0.35)}
@keyframes ancientGlow{0%,100%{filter:drop-shadow(0 0 3px hsla(42,90%,55%,0.25))}50%{filter:drop-shadow(0 0 8px hsla(42,90%,55%,0.6))}}
@keyframes popIn{0%{opacity:0;transform:scale(0.92) translateY(4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes userPulse{0%,100%{box-shadow:0 0 10px hsla(42,90%,55%,0.5),0 0 20px hsla(42,90%,55%,0.15)}50%{box-shadow:0 0 14px hsla(42,90%,55%,0.7),0 0 28px hsla(42,90%,55%,0.25)}}
.marker-ancient{animation:ancientGlow 3.5s ease-in-out infinite;will-change:filter}
.user-dot{animation:userPulse 2.5s ease-in-out infinite}
.atlas-leaflet-popup .leaflet-popup-content-wrapper{background:hsl(30,15%,10%)!important;border:1px solid hsla(42,40%,30%,0.4)!important;border-radius:12px!important;box-shadow:0 6px 24px rgba(0,0,0,0.5),0 0 12px hsla(42,60%,40%,0.08)!important;padding:0!important}
@keyframes seedHeartGlow{0%,100%{transform:scale(1);filter:drop-shadow(0 0 4px hsla(120,60%,50%,0.4))}50%{transform:scale(1.15);filter:drop-shadow(0 0 10px hsla(120,60%,50%,0.7))}}
.seed-heart-leaflet{background:transparent!important;border:none!important;display:flex;align-items:center;justify-content:center;position:relative;animation:seedHeartGlow 2s ease-in-out infinite;cursor:pointer}
.seed-heart-leaflet .seed-count{position:absolute;top:-4px;right:-6px;background:hsl(120,50%,40%);color:#fff;font-size:9px;font-weight:700;font-family:sans-serif;min-width:16px;height:16px;line-height:16px;text-align:center;border-radius:99px;border:1.5px solid hsl(120,40%,15%)}
.atlas-leaflet-popup .leaflet-popup-content{margin:0!important}
.atlas-leaflet-popup .leaflet-popup-tip{background:hsl(30,15%,10%)!important;border:1px solid hsla(42,40%,30%,0.4)!important}
.atlas-leaflet-popup .leaflet-popup-close-button{color:hsl(42,60%,55%)!important;font-size:18px!important;top:6px!important;right:8px!important}
.leaflet-tile-pane{filter:sepia(0.25) saturate(0.85) brightness(0.9)}
@media(max-width:768px){.leaflet-tile-pane{filter:sepia(0.1) brightness(0.95)}}
.leaflet-control-zoom a{background:hsla(30,30%,12%,0.9)!important;color:hsl(42,60%,60%)!important;border:1px solid hsla(42,40%,30%,0.4)!important;border-radius:8px!important;width:34px!important;height:34px!important;line-height:34px!important;font-size:16px!important;transition:background .15s!important}
.leaflet-control-zoom a:active{background:hsla(42,40%,20%,0.9)!important}
.leaflet-control-zoom{border:none!important;border-radius:8px!important;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.25)!important}
@media(max-width:768px){.leaflet-control-zoom{display:none!important}}
.leaflet-control-attribution{font-size:9px!important;background:hsla(30,20%,10%,0.7)!important;color:hsl(42,40%,50%)!important;border-radius:4px 0 0 0!important;padding:2px 6px!important}
.leaflet-control-attribution a{color:hsl(42,50%,55%)!important}
.external-tree-marker{background:transparent!important;border:none!important}
@keyframes extPulse{0%,100%{opacity:0.6}50%{opacity:1}}
.ext-dot{border-radius:50%;transition:transform .15s ease-out;cursor:pointer}
.ext-dot:hover{transform:scale(1.3)!important}
`;

const btnBase: React.CSSProperties = {
  background: "hsla(30, 30%, 12%, 0.92)",
  border: "1px solid hsla(42, 40%, 30%, 0.5)",
  backdropFilter: "blur(6px)",
  boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
};

const LeafletFallbackMap = ({ trees, offeringCounts = {}, treePhotos = {}, birdsongCounts = {}, birdsongHeatPoints = [], className, userId, bloomedSeeds = [], initialLat, initialLng, initialZoom, initialW3w }: LeafletFallbackMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyRef = useRef<L.Circle | null>(null);
  const groveLayerRef = useRef<L.LayerGroup | null>(null);
  const seedLayerRef = useRef<L.LayerGroup | null>(null);
  const rootThreadLayerRef = useRef<L.LayerGroup | null>(null);
  const offeringGlowLayerRef = useRef<L.LayerGroup | null>(null);
  const birdsongHeatLayerRef = useRef<L.LayerGroup | null>(null);
  const externalLayerRef = useRef<L.LayerGroup | null>(null);
  const externalAbortRef = useRef<AbortController | null>(null);
  const prevTreeIdsRef = useRef<Set<string>>(new Set());
  const hasFittedRef = useRef(false);
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);
  const [userLatLng, setUserLatLng] = useState<[number, number] | null>(null);
  const [discoveryCount, setDiscoveryCount] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTreeCoords, setAddTreeCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Filter state
  const [species, setSpecies] = useState("all");
  const [perspective, setPerspective] = useState<LitePerspective>("collective");
  const [lineageFilter, setLineageFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  // Layer visibility toggles
  const [showSeeds, setShowSeeds] = useState(true);
  const [showGroves, setShowGroves] = useState(false);
  const [showRootThreads, setShowRootThreads] = useState(false);
  const [showOfferingGlow, setShowOfferingGlow] = useState(false);
  const [showExternalTrees, setShowExternalTrees] = useState(false);
  const [showBirdsongHeat, setShowBirdsongHeat] = useState(false);
  const [birdsongSeason, setBirdsongSeason] = useState<string>("all");
  const [externalTreeCount, setExternalTreeCount] = useState(0);
  const [externalLoading, setExternalLoading] = useState(false);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);

  const speciesCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trees.forEach((t) => {
      counts[t.species.toLowerCase()] = (counts[t.species.toLowerCase()] || 0) + 1;
    });
    return counts;
  }, [trees]);

  const availableLineages = useMemo(() => {
    const set = new Set<string>();
    trees.forEach((t: any) => { if (t.lineage) set.add(t.lineage); });
    return Array.from(set).sort();
  }, [trees]);

  const availableProjects = useMemo(() => {
    const set = new Set<string>();
    trees.forEach((t: any) => { if (t.project_name) set.add(t.project_name); });
    return Array.from(set).sort();
  }, [trees]);

  const filteredTrees = useMemo(() => {
    let result = trees;
    if (perspective === "personal" && userId) {
      result = result.filter((t) => t.created_by === userId);
    }
    if (species !== "all") {
      result = result.filter((t) => t.species.toLowerCase() === species.toLowerCase());
    }
    if (lineageFilter !== "all") {
      result = result.filter((t: any) => t.lineage === lineageFilter);
    }
    if (projectFilter !== "all") {
      result = result.filter((t: any) => t.project_name === projectFilter);
    }
    return result;
  }, [trees, species, perspective, lineageFilter, projectFilter, userId]);

  // Stable references for offering counts and photos
  const offeringCountsRef = useRef(offeringCounts);
  offeringCountsRef.current = offeringCounts;
  const treePhotosRef = useRef(treePhotos);
  treePhotosRef.current = treePhotos;
  const birdsongCountsRef = useRef(birdsongCounts);
  birdsongCountsRef.current = birdsongCounts;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [30, 0],
      zoom: 2,
      attributionControl: false,
      zoomControl: false,
      preferCanvas: true,
      tap: true,
      tapTolerance: 15,
      zoomAnimation: true,
      markerZoomAnimation: true,
    } as any);

    const isRetina = window.devicePixelRatio > 1;
    L.tileLayer(
      isRetina
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { attribution: '&copy; OSM &copy; CARTO', maxZoom: 19, subdomains: "abcd", keepBuffer: 4 }
    ).addTo(map);

    // Tile error handling — show toast-style overlay on sustained failure
    let tileErrors = 0;
    map.on('tileerror', () => {
      tileErrors++;
      if (tileErrors > 10) {
        console.warn('[Lite] Sustained tile errors:', tileErrors);
      }
    });

    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    // Deep-link: fly to coordinates or w3w if provided
    let deepLinked = false;
    if (initialLat !== undefined && initialLng !== undefined) {
      deepLinked = true;
      setTimeout(() => map.setView([initialLat, initialLng], initialZoom ?? 16), 300);
    } else if (initialW3w) {
      deepLinked = true;
      import("@/utils/what3words").then(({ convertToCoordinates }) => {
        convertToCoordinates(initialW3w).then((result) => {
          if (result && result.coordinates) {
            map.setView([result.coordinates.lat, result.coordinates.lng], initialZoom ?? 16);
          }
        }).catch(() => {});
      });
    }

    // Auto-locate on first load (skip if deep-linked)
    if (!deepLinked && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLatLng(latlng);
          setLocated(true);
          placeUserMarker(map, latlng, pos.coords.accuracy);
        },
        () => { /* silent */ },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      userMarkerRef.current = null;
      userAccuracyRef.current = null;
      groveLayerRef.current = null;
      seedLayerRef.current = null;
    };
  }, []);

  function placeUserMarker(map: L.Map, latlng: [number, number], accuracy?: number) {
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (userAccuracyRef.current) map.removeLayer(userAccuracyRef.current);

    if (accuracy && accuracy < 2000) {
      userAccuracyRef.current = L.circle(latlng, {
        radius: Math.min(accuracy, 500),
        color: "hsla(42, 80%, 55%, 0.2)",
        fillColor: "hsla(42, 80%, 55%, 0.06)",
        fillOpacity: 1,
        weight: 1,
        interactive: false,
      }).addTo(map);
    }

    const userIcon = L.divIcon({
      className: "leaflet-tree-marker",
      html: `<div class="user-dot" style="width:14px;height:14px;border-radius:50%;background:hsl(42,90%,55%);border:2.5px solid hsl(30,15%,10%);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    userMarkerRef.current = L.marker(latlng, { icon: userIcon, zIndexOffset: 1000, interactive: false })
      .addTo(map);
  }

  // Discovery detection
  useEffect(() => {
    const currentIds = new Set(filteredTrees.map((t) => t.id));
    const prev = prevTreeIdsRef.current;
    let newCount = 0;
    currentIds.forEach((id) => { if (!prev.has(id)) newCount++; });
    prevTreeIdsRef.current = currentIds;

    if (prev.size > 0 && newCount > 0) {
      setDiscoveryCount(newCount);
      const t = setTimeout(() => setDiscoveryCount(0), 2500);
      return () => clearTimeout(t);
    }
  }, [filteredTrees]);

  // Update tree markers when filteredTrees change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: (zoom: number) => {
        // Dynamic radius: tighter clusters at higher zoom for grove-scale feel
        if (zoom <= 4) return 80;   // continental — large clusters
        if (zoom <= 8) return 65;   // national/bioregional
        if (zoom <= 11) return 50;  // regional
        if (zoom <= 14) return 35;  // local
        return 25;                  // hyper-local — only very close trees cluster
      },
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: 18,
      chunkedLoading: true,
      chunkInterval: 80,
      chunkDelay: 8,
      spiderfyDistanceMultiplier: 1.8,
      spiderLegPolylineOptions: {
        weight: 1.5,
        color: "hsla(42, 60%, 50%, 0.4)",
        opacity: 0.6,
      },
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        const childMarkers = cluster.getAllChildMarkers();

        // Determine dominant tier in cluster
        let ancientCount = 0;
        let storiedCount = 0;
        childMarkers.forEach((m: any) => {
          const html = m.options?.icon?.options?.html || "";
          if (html.includes("marker-ancient")) ancientCount++;
          else if (html.includes("storied")) storiedCount++;
        });

        const hasAncient = ancientCount > 0;
        const hasMajorStory = storiedCount >= count * 0.3;

        // Size classes
        const sizeClass = count >= 50
          ? "tree-cluster-xl"
          : count >= 20
          ? "tree-cluster-lg"
          : count >= 5
          ? "tree-cluster-md"
          : "tree-cluster-sm";
        const dim = count >= 50 ? 56 : count >= 20 ? 50 : count >= 5 ? 42 : 34;

        // Golden ring for clusters containing ancient trees
        const ringStyle = hasAncient
          ? "border-color:hsl(42,90%,55%);box-shadow:0 0 12px hsla(42,90%,55%,0.4)"
          : hasMajorStory
          ? "border-color:hsl(42,70%,48%);box-shadow:0 0 8px hsla(42,70%,48%,0.25)"
          : "";

        // Label: count + ancient badge
        const badge = hasAncient
          ? `<span style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:hsl(42,95%,60%);border:1.5px solid hsl(30,15%,10%);"></span>`
          : "";

        return L.divIcon({
          html: `<div class="tree-cluster ${sizeClass}" style="${ringStyle};position:relative;">${count}${badge}</div>`,
          className: "leaflet-tree-marker",
          iconSize: L.point(dim, dim),
        });
      },
    });

    const currentOfferings = offeringCountsRef.current;
    const currentBirdsong = birdsongCountsRef.current;

    filteredTrees.forEach((tree) => {
      const offerings = currentOfferings[tree.id] || 0;
      const age = tree.estimated_age || 0;
      const bCount = currentBirdsong[tree.id] || 0;
      const tier = getTreeTier(age, offerings);
      const icon = getOrCreateIcon(tier, tree.species, bCount);

      const marker = L.marker([tree.latitude, tree.longitude], { icon });
      marker.bindPopup(() => buildPopupHtml(tree, currentOfferings[tree.id] || 0, age, treePhotosRef.current[tree.id], currentBirdsong[tree.id] || 0), {
        className: "atlas-leaflet-popup",
        maxWidth: 280,
        closeButton: true,
        autoPanPadding: L.point(20, 60),
      });
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterRef.current = clusterGroup;

    // Only auto-fit on first load
    if (!hasFittedRef.current && filteredTrees.length > 0) {
      hasFittedRef.current = true;
      if (userLatLng && filteredTrees.length > 3) {
        const nearby = filteredTrees.filter(
          (t) => haversineKm(userLatLng[0], userLatLng[1], t.latitude, t.longitude) < 50
        );
        if (nearby.length >= 2) {
          const bounds = L.latLngBounds(nearby.map((t) => [t.latitude, t.longitude]));
          bounds.extend(userLatLng);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true, duration: 1 });
          return;
        }
      }
      const bounds = L.latLngBounds(filteredTrees.map((t) => [t.latitude, t.longitude]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5, animate: true, duration: 0.8 });
    }
  }, [filteredTrees, userLatLng]);

  // Render bloomed seed heart markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up previous seed layer
    if (seedLayerRef.current) {
      map.removeLayer(seedLayerRef.current);
      seedLayerRef.current = null;
    }

    if (!showSeeds || bloomedSeeds.length === 0) return;

    const seedLayer = L.layerGroup();

    const treeCoordMap: Record<string, { lat: number; lng: number }> = {};
    trees.forEach((t) => {
      if (t.latitude && t.longitude) treeCoordMap[t.id] = { lat: t.latitude, lng: t.longitude };
    });

    const seedsByTree: Record<string, number> = {};
    bloomedSeeds.forEach((s) => {
      seedsByTree[s.tree_id] = (seedsByTree[s.tree_id] || 0) + 1;
    });

    Object.entries(seedsByTree).forEach(([treeId, count]) => {
      const coords = treeCoordMap[treeId];
      if (!coords) return;

      const icon = L.divIcon({
        className: 'seed-heart-leaflet',
        html: `<span style="font-size:22px;">💚</span>${count > 1 ? `<span class="seed-count">${count}</span>` : ''}`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const popupHtml = `<div style="padding:12px;font-family:'Cinzel',serif;min-width:180px;text-align:center;">
        <p style="margin:0;font-size:20px;">💚</p>
        <p style="margin:6px 0 2px;font-size:14px;color:hsl(120,50%,60%);font-weight:700;">${count} Bloomed Heart${count !== 1 ? 's' : ''}</p>
        <p style="margin:0 0 8px;font-size:11px;color:hsl(42,50%,55%);">Ready to collect — visit this tree!</p>
        <a href="/tree/${encodeURIComponent(treeId)}" style="display:block;padding:8px 0;text-align:center;font-size:12px;color:hsl(80,20%,8%);background:linear-gradient(135deg,hsl(120,50%,45%),hsl(80,60%,50%));border-radius:6px;text-decoration:none;letter-spacing:0.06em;font-weight:600;">Collect Hearts ⟶</a>
      </div>`;

      L.marker([coords.lat, coords.lng], { icon, zIndexOffset: 500 })
        .bindPopup(popupHtml, { className: 'atlas-leaflet-popup', maxWidth: 240, closeButton: true })
        .addTo(seedLayer);
    });

    seedLayer.addTo(map);
    seedLayerRef.current = seedLayer;

    return () => {
      if (map.hasLayer(seedLayer)) map.removeLayer(seedLayer);
    };
  }, [bloomedSeeds, trees, showSeeds]);

  // Draw grove boundary polygons when showGroves is on
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (groveLayerRef.current) {
      map.removeLayer(groveLayerRef.current);
      groveLayerRef.current = null;
    }

    if (!showGroves || filteredTrees.length < 3) return;

    const groveLayer = L.layerGroup();

    // Group by species
    const bySpecies: Record<string, Tree[]> = {};
    filteredTrees.forEach((t) => {
      const key = t.species.toLowerCase();
      if (!bySpecies[key]) bySpecies[key] = [];
      bySpecies[key].push(t);
    });

    Object.entries(bySpecies).forEach(([speciesKey, group]) => {
      if (group.length < 3) return;

      const points: [number, number][] = group.map((t) => [t.longitude, t.latitude]);
      const hull = convexHull(points);
      if (hull.length < 3) return;

      // Convert to Leaflet [lat, lng] and close the ring
      const latlngs = hull.map(([lng, lat]) => [lat, lng] as [number, number]);
      latlngs.push(latlngs[0]);

      const hue = getSpeciesHue(speciesKey);

      L.polygon(latlngs, {
        color: `hsla(${hue}, 50%, 45%, 0.5)`,
        fillColor: `hsla(${hue}, 40%, 35%, 0.12)`,
        fillOpacity: 1,
        weight: 2,
        dashArray: "6 4",
        interactive: false,
      }).addTo(groveLayer);
    });

    groveLayer.addTo(map);
    groveLayerRef.current = groveLayer;

    return () => {
      if (map.hasLayer(groveLayer)) map.removeLayer(groveLayer);
    };
  }, [filteredTrees, showGroves]);

  // Draw root threads — golden dashed lines between same-species trees within 80km
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (rootThreadLayerRef.current) {
      map.removeLayer(rootThreadLayerRef.current);
      rootThreadLayerRef.current = null;
    }

    if (!showRootThreads || filteredTrees.length < 2) return;

    const threadLayer = L.layerGroup();

    const bySpecies: Record<string, Tree[]> = {};
    filteredTrees.forEach((t) => {
      const key = t.species.toLowerCase();
      if (!bySpecies[key]) bySpecies[key] = [];
      bySpecies[key].push(t);
    });

    const MAX_DIST_KM = 80;
    const drawn = new Set<string>();

    Object.entries(bySpecies).forEach(([, group]) => {
      if (group.length < 2) return;

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i];
          const b = group[j];
          const dist = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
          if (dist > MAX_DIST_KM) continue;

          const pairKey = [a.id, b.id].sort().join("-");
          if (drawn.has(pairKey)) continue;
          drawn.add(pairKey);

          const opacity = Math.max(0.15, 0.6 * (1 - dist / MAX_DIST_KM));
          const weight = dist < 20 ? 2 : 1.5;

          L.polyline(
            [[a.latitude, a.longitude], [b.latitude, b.longitude]],
            {
              color: "hsl(42, 80%, 55%)",
              weight,
              opacity,
              dashArray: "6 8",
              interactive: false,
            }
          ).addTo(threadLayer);
        }
      }
    });

    threadLayer.addTo(map);
    rootThreadLayerRef.current = threadLayer;

    return () => {
      if (map.hasLayer(threadLayer)) map.removeLayer(threadLayer);
    };
  }, [filteredTrees, showRootThreads]);

  // Offering glow layer — golden pulsing circles on trees with recent offerings
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (offeringGlowLayerRef.current) {
      map.removeLayer(offeringGlowLayerRef.current);
      offeringGlowLayerRef.current = null;
    }

    if (!showOfferingGlow) return;

    const glowLayer = L.layerGroup();
    const currentOfferings = offeringCountsRef.current;

    filteredTrees.forEach((tree) => {
      const count = currentOfferings[tree.id] || 0;
      if (count === 0) return;

      // Radius scales with offering count, capped
      const radius = Math.min(12 + count * 3, 36);
      const intensity = Math.min(0.25 + count * 0.08, 0.7);

      // Outer glow ring
      L.circleMarker([tree.latitude, tree.longitude], {
        radius: radius + 6,
        color: "hsl(42, 85%, 55%)",
        fillColor: "hsl(42, 90%, 60%)",
        fillOpacity: intensity * 0.3,
        weight: 0,
        interactive: false,
        className: "offering-glow-outer",
      }).addTo(glowLayer);

      // Inner glow
      L.circleMarker([tree.latitude, tree.longitude], {
        radius,
        color: "hsl(42, 85%, 55%)",
        fillColor: "hsl(42, 90%, 65%)",
        fillOpacity: intensity,
        weight: 1.5,
        opacity: 0.6,
        interactive: false,
        className: "offering-glow-inner",
      }).addTo(glowLayer);

      // Count badge
      const badgeIcon = L.divIcon({
        html: `<span style="
          background: hsl(42, 80%, 50%);
          color: hsl(30, 10%, 10%);
          font-size: 9px;
          font-weight: 700;
          border-radius: 50%;
          width: 18px; height: 18px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 6px hsla(42, 90%, 55%, 0.6);
          font-family: monospace;
        ">${count}</span>`,
        className: "offering-count-badge",
        iconSize: L.point(18, 18),
        iconAnchor: L.point(9, -4),
      });
      L.marker([tree.latitude, tree.longitude], { icon: badgeIcon, interactive: false }).addTo(glowLayer);
    });

    glowLayer.addTo(map);
    offeringGlowLayerRef.current = glowLayer;

    return () => {
      if (map.hasLayer(glowLayer)) map.removeLayer(glowLayer);
    };
  }, [filteredTrees, showOfferingGlow]);

  // Birdsong seasonal heatmap layer
  const SEASON_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
    spring: { fill: "hsla(120, 55%, 50%, 0.35)", stroke: "hsl(120, 55%, 50%)", label: "Spring" },
    summer: { fill: "hsla(45, 80%, 50%, 0.35)", stroke: "hsl(45, 80%, 50%)", label: "Summer" },
    autumn: { fill: "hsla(25, 75%, 50%, 0.35)", stroke: "hsl(25, 75%, 50%)", label: "Autumn" },
    winter: { fill: "hsla(200, 60%, 55%, 0.35)", stroke: "hsl(200, 60%, 55%)", label: "Winter" },
    unknown: { fill: "hsla(270, 40%, 55%, 0.3)", stroke: "hsl(270, 40%, 55%)", label: "Unknown" },
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (birdsongHeatLayerRef.current) {
      map.removeLayer(birdsongHeatLayerRef.current);
      birdsongHeatLayerRef.current = null;
    }

    if (!showBirdsongHeat || birdsongHeatPoints.length === 0) return;

    const heatLayer = L.layerGroup();

    // Aggregate by tree+season
    const grouped: Record<string, { lat: number; lng: number; seasons: Record<string, number> }> = {};
    birdsongHeatPoints.forEach((pt) => {
      const key = pt.tree_id;
      if (!grouped[key]) grouped[key] = { lat: pt.latitude, lng: pt.longitude, seasons: {} };
      const s = pt.season || "unknown";
      grouped[key].seasons[s] = (grouped[key].seasons[s] || 0) + 1;
    });

    Object.values(grouped).forEach((g) => {
      const totalAtTree = Object.values(g.seasons).reduce((a, b) => a + b, 0);
      const baseRadius = Math.min(8 + totalAtTree * 2, 28);

      // Draw a circle per season at slight offset for visibility, or stacked
      let ringIndex = 0;
      Object.entries(g.seasons).forEach(([season, count]) => {
        if (birdsongSeason !== "all" && birdsongSeason !== season) return;
        const colors = SEASON_COLORS[season] || SEASON_COLORS.unknown;
        const r = baseRadius - ringIndex * 3;
        const intensity = Math.min(0.2 + count * 0.1, 0.7);

        L.circleMarker([g.lat, g.lng], {
          radius: r,
          color: colors.stroke,
          fillColor: colors.fill,
          fillOpacity: intensity,
          weight: 1.5,
          opacity: 0.7,
          interactive: false,
        }).addTo(heatLayer);

        ringIndex++;
      });

      // Count label
      const filteredTotal = birdsongSeason === "all"
        ? totalAtTree
        : (g.seasons[birdsongSeason] || 0);
      if (filteredTotal > 0) {
        const badgeIcon = L.divIcon({
          html: `<span style="
            background: hsla(200, 50%, 15%, 0.9);
            color: hsl(200, 60%, 75%);
            font-size: 9px;
            font-weight: 700;
            border-radius: 50%;
            width: 18px; height: 18px;
            display: flex; align-items: center; justify-content: center;
            border: 1px solid hsla(200, 50%, 45%, 0.5);
            font-family: monospace;
          ">🐦${filteredTotal > 1 ? filteredTotal : ''}</span>`,
          className: "birdsong-heat-badge",
          iconSize: L.point(18, 18),
          iconAnchor: L.point(9, -6),
        });
        L.marker([g.lat, g.lng], { icon: badgeIcon, interactive: false }).addTo(heatLayer);
      }
    });

    heatLayer.addTo(map);
    birdsongHeatLayerRef.current = heatLayer;

    return () => {
      if (map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    };
  }, [birdsongHeatPoints, showBirdsongHeat, birdsongSeason]);

  // External trees layer — registry-driven multi-source system
  const enabledSources = useMemo(() => getEnabledSources(), []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (externalLayerRef.current) {
      map.removeLayer(externalLayerRef.current);
      externalLayerRef.current = null;
    }

    if (!showExternalTrees) {
      setExternalTreeCount(0);
      return;
    }

    const extLayer = L.layerGroup();
    extLayer.addTo(map);
    externalLayerRef.current = extLayer;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const loadTrees = async () => {
      if (externalAbortRef.current) externalAbortRef.current.abort();
      const ac = new AbortController();
      externalAbortRef.current = ac;

      // Use the lowest minZoom across all enabled sources
      const minZoom = Math.min(...enabledSources.map((s) => s.minZoom));
      const zoom = map.getZoom();
      if (zoom < minZoom) {
        setExternalTreeCount(-1);
        extLayer.clearLayers();
        setExternalLoading(false);
        return;
      }

      setExternalLoading(true);
      const bounds = map.getBounds();
      const bbox: BBox = {
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      };

      const activeSourceIds = enabledSources.map((s) => s.id);
      const trees = await fetchAllSourceTrees(bbox, activeSourceIds, ac.signal);

      if (ac.signal.aborted) return;
      setExternalLoading(false);
      setExternalTreeCount(trees.length);
      extLayer.clearLayers();

      const afSet = new Set(
        filteredTrees.map((t) => `${t.latitude.toFixed(5)},${t.longitude.toFixed(5)}`)
      );

      trees.forEach((et) => {
        if (afSet.has(`${et.lat.toFixed(5)},${et.lng.toFixed(5)}`)) return;

        const source = getSourceById(et.source);
        const style = source?.style;
        const sz = style?.size || 12;
        const half = sz / 2;

        const icon = L.divIcon({
          className: `external-tree-marker ext-${style?.cssClass || "default"}`,
          html: `<div class="ext-dot" style="width:${sz}px;height:${sz}px;background:${style?.color || "hsl(180,60%,45%)"};border:2px solid ${style?.borderColor || "hsl(180,40%,30%)"};box-shadow:0 0 6px ${style?.glowColor || "hsla(180,60%,50%,0.4)"};"></div>`,
          iconSize: [sz, sz],
          iconAnchor: [half, half],
        });

        const marker = L.marker([et.lat, et.lng], { icon });
        marker.bindPopup(() => buildExternalPopupHtml(et), {
          className: "atlas-leaflet-popup",
          closeButton: true,
          maxWidth: 240,
          offset: L.point(0, -4),
        });
        marker.addTo(extLayer);
      });
    };

    const onMoveEnd = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadTrees, 600);
    };

    map.on("moveend", onMoveEnd);
    loadTrees();

    return () => {
      clearTimeout(debounceTimer);
      map.off("moveend", onMoveEnd);
      if (externalAbortRef.current) externalAbortRef.current.abort();
      if (map.hasLayer(extLayer)) map.removeLayer(extLayer);
    };
  }, [showExternalTrees, filteredTrees]);

  const handleFindMe = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLatLng(latlng);
        setLocated(true);
        placeUserMarker(mapRef.current!, latlng, pos.coords.accuracy);
        mapRef.current?.flyTo(latlng, 14, { duration: 1.2 });
        setLocating(false);
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  const handleCompassReset = useCallback(() => {
    if (!mapRef.current) return;
    if (filteredTrees.length > 0) {
      const bounds = L.latLngBounds(filteredTrees.map((t) => [t.latitude, t.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 5, animate: true, duration: 0.8 });
    } else {
      mapRef.current.flyTo([30, 0], 2, { duration: 0.8 });
    }
  }, [filteredTrees]);

  const handleSearchSelect = useCallback((tree: Tree) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([tree.latitude, tree.longitude], 16, { duration: 1.2 });
    // Open popup after flyTo completes
    setTimeout(() => {
      const map = mapRef.current;
      if (!map || !clusterRef.current) return;
      // Find and open the marker popup
      clusterRef.current.eachLayer((layer: any) => {
        const ll = layer.getLatLng?.();
        if (ll && Math.abs(ll.lat - tree.latitude) < 0.0001 && Math.abs(ll.lng - tree.longitude) < 0.0001) {
          // Zoom to see individual markers then open popup
          clusterRef.current.zoomToShowLayer(layer, () => {
            layer.openPopup();
          });
        }
      });
    }, 1300);
  }, []);

  return (
    <div className={className || "absolute inset-0"} style={{ height: '100dvh' }}>
      <div ref={containerRef} className="w-full h-full" style={{ background: '#f0ede6' }} />
      <style>{LITE_CSS}</style>

      {/* Search */}
      <LiteMapSearch trees={trees} onSelect={handleSearchSelect} />

      {/* Filters */}
      <LiteMapFilters
        species={species}
        onSpeciesChange={setSpecies}
        perspective={perspective}
        onPerspectiveChange={setPerspective}
        speciesCounts={speciesCounts}
        totalVisible={filteredTrees.length}
        lineageFilter={lineageFilter}
        onLineageChange={setLineageFilter}
        availableLineages={availableLineages}
        projectFilter={projectFilter}
        onProjectChange={setProjectFilter}
        availableProjects={availableProjects}
      />

      {/* Discovery cue */}
      {discoveryCount > 0 && (
        <div
          className="absolute top-[6.5rem] left-1/2 -translate-x-1/2 z-[1001] px-3 py-1.5 rounded-full font-serif text-[11px] animate-fade-in"
          style={{
            background: "hsla(120, 40%, 15%, 0.9)",
            color: "hsl(42, 80%, 60%)",
            border: "1px solid hsla(42, 60%, 45%, 0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          ✦ {discoveryCount} new {discoveryCount === 1 ? "tree" : "trees"} discovered
        </div>
      )}

      {/* Empty state */}
      {filteredTrees.length === 0 && trees.length > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] flex flex-col items-center gap-2 animate-fade-in">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "hsla(30, 30%, 12%, 0.9)", border: "1px solid hsla(42, 40%, 30%, 0.4)" }}
          >
            <TreePine className="w-6 h-6" style={{ color: "hsl(42, 55%, 55%)" }} />
          </div>
          <p className="font-serif text-[12px] text-center max-w-[200px]" style={{ color: "hsl(42, 55%, 55%)" }}>
            No trees match this view.
            <br />
            <button
              onClick={() => { setSpecies("all"); setPerspective("collective"); }}
              className="underline mt-1 inline-block transition-colors"
              style={{ color: "hsl(42, 80%, 60%)" }}
            >
              Show all trees
            </button>
          </p>
        </div>
      )}

      {/* Layer toggles panel */}
      <div className="absolute bottom-20 right-3 z-[1001] flex flex-col items-end gap-2">

        {layerPanelOpen && (
          <div
            className="rounded-xl overflow-hidden animate-fade-in"
            style={{
              background: "hsla(30, 20%, 8%, 0.96)",
              border: "1px solid hsla(42, 40%, 30%, 0.4)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              minWidth: "160px",
            }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: "hsla(42, 40%, 30%, 0.2)" }}>
              <p className="text-[10px] font-serif" style={{ color: "hsl(42, 50%, 55%)" }}>Map Layers</p>
            </div>
            {[
              { label: "💚 Bloomed Seeds", active: showSeeds, toggle: () => setShowSeeds(!showSeeds) },
              { label: "🌿 Grove Boundaries", active: showGroves, toggle: () => setShowGroves(!showGroves) },
              { label: "✦ Root Threads", active: showRootThreads, toggle: () => setShowRootThreads(!showRootThreads) },
              { label: "✨ Offering Glow", active: showOfferingGlow, toggle: () => setShowOfferingGlow(!showOfferingGlow) },
              { label: "🗺️ External Trees", active: showExternalTrees, toggle: () => setShowExternalTrees(!showExternalTrees), extra: showExternalTrees ? (externalLoading ? "loading…" : externalTreeCount === -1 ? "zoom in" : externalTreeCount > 0 ? `${externalTreeCount} found` : "no catalogued trees here") : `${enabledSources.length} source${enabledSources.length !== 1 ? "s" : ""}` },
              { label: "🐦 Birdsong Heat", active: showBirdsongHeat, toggle: () => setShowBirdsongHeat(!showBirdsongHeat), extra: showBirdsongHeat ? `${birdsongHeatPoints.length} rec.` : "" },
            ].map((layer) => (
              <button
                key={layer.label}
                onClick={layer.toggle}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
                style={{ color: layer.active ? "hsl(42, 80%, 60%)" : "hsl(42, 40%, 45%)" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "hsla(42, 50%, 40%, 0.1)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  className="w-4 h-4 rounded-sm border flex items-center justify-center transition-all"
                  style={{
                    borderColor: layer.active ? "hsl(42, 80%, 55%)" : "hsla(42, 40%, 30%, 0.5)",
                    background: layer.active ? "hsla(42, 80%, 50%, 0.2)" : "transparent",
                  }}
                >
                  {layer.active && <span className="text-[10px]">✓</span>}
                </div>
                <span className="text-[12px] font-serif">{layer.label}</span>
                {(layer as any).extra && (
                  <span className="text-[9px] font-sans ml-auto" style={{ color: "hsl(180, 50%, 55%)" }}>
                    {(layer as any).extra}
                  </span>
                )}
              </button>
            ))}

            {/* Season filter sub-panel */}
            {showBirdsongHeat && (
              <div className="border-t px-3 py-2 flex flex-wrap gap-1" style={{ borderColor: "hsla(42, 40%, 30%, 0.2)" }}>
                <p className="w-full text-[9px] font-serif mb-1" style={{ color: "hsl(200, 50%, 55%)" }}>Season</p>
                {[
                  { key: "all", label: "All", color: "hsl(200, 60%, 60%)" },
                  { key: "spring", label: "🌱", color: "hsl(120, 55%, 50%)" },
                  { key: "summer", label: "☀️", color: "hsl(45, 80%, 50%)" },
                  { key: "autumn", label: "🍂", color: "hsl(25, 75%, 50%)" },
                  { key: "winter", label: "❄️", color: "hsl(200, 60%, 55%)" },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setBirdsongSeason(s.key)}
                    className="px-2 py-1 rounded-md text-[11px] transition-all"
                    style={{
                      background: birdsongSeason === s.key ? "hsla(200, 50%, 40%, 0.3)" : "transparent",
                      color: birdsongSeason === s.key ? s.color : "hsl(42, 30%, 45%)",
                      border: birdsongSeason === s.key ? `1px solid ${s.color}` : "1px solid transparent",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Birdsong seasonal legend */}
      {showBirdsongHeat && (
        <div
          className="absolute bottom-24 left-3 z-[1000] flex flex-col gap-1.5 px-3 py-2.5 rounded-lg"
          style={{
            background: "hsla(30, 15%, 10%, 0.92)",
            border: "1px solid hsla(42, 40%, 30%, 0.5)",
            backdropFilter: "blur(8px)",
            animation: "popIn .2s ease-out",
          }}
        >
          <p className="text-[10px] font-serif tracking-wider" style={{ color: "hsl(42, 50%, 55%)" }}>
            Birdsong Seasons
          </p>
          {[
            { key: "spring", color: "hsl(120, 55%, 50%)", label: "Spring" },
            { key: "summer", color: "hsl(45, 80%, 50%)", label: "Summer" },
            { key: "autumn", color: "hsl(25, 75%, 50%)", label: "Autumn" },
            { key: "winter", color: "hsl(200, 60%, 55%)", label: "Winter" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setBirdsongSeason(birdsongSeason === s.key ? "all" : s.key)}
              className="flex items-center gap-2 transition-opacity"
              style={{ opacity: birdsongSeason === "all" || birdsongSeason === s.key ? 1 : 0.4 }}
            >
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{
                  background: s.color,
                  boxShadow: birdsongSeason === s.key ? `0 0 6px ${s.color}` : "none",
                  border: birdsongSeason === s.key ? `1.5px solid ${s.color}` : "1px solid hsla(0,0%,100%,0.15)",
                }}
              />
              <span className="text-[11px] font-serif" style={{ color: birdsongSeason === s.key ? s.color : "hsl(0, 0%, 62%)" }}>
                {s.label}
              </span>
            </button>
          ))}
          {birdsongSeason !== "all" && (
            <button
              onClick={() => setBirdsongSeason("all")}
              className="text-[9px] font-sans mt-0.5 transition-colors"
              style={{ color: "hsl(42, 50%, 55%)" }}
            >
              Show all seasons
            </button>
          )}
        </div>
      )}

      {/* Bottom controls: add-tree left, locate centred, layers right — above attribution */}
      <div className="absolute bottom-8 left-3 z-[1000]">
        <button
          onClick={() => {
            const map = mapRef.current;
            if (map) {
              const c = map.getCenter();
              setAddTreeCoords({ lat: c.lat, lng: c.lng });
            } else {
              setAddTreeCoords(userLatLng ? { lat: userLatLng[0], lng: userLatLng[1] } : null);
            }
            setAddDialogOpen(true);
          }}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90"
          style={{ ...btnBase, color: "hsl(42, 80%, 55%)" }}
          title="Add Ancient Friend"
        >
          <Plus className="w-[20px] h-[20px]" />
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
        <button
          onClick={handleFindMe}
          disabled={locating}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90"
          style={{ ...btnBase, color: locating ? "hsl(42, 40%, 45%)" : located ? "hsl(42, 90%, 55%)" : "hsl(42, 60%, 60%)" }}
          title="Find my location"
        >
          {locating ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Navigation className="w-[18px] h-[18px]" />}
        </button>
        <button
          onClick={handleCompassReset}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90"
          style={{ ...btnBase, color: "hsl(42, 60%, 60%)" }}
          title="Reset view"
        >
          <Compass className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => setLayerPanelOpen(!layerPanelOpen)}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90"
          style={{
            ...btnBase,
            color: layerPanelOpen ? "hsl(42, 90%, 55%)" : "hsl(42, 60%, 60%)",
            background: layerPanelOpen ? "hsla(42, 50%, 20%, 0.95)" : btnBase.background,
          }}
          title="Toggle Layers"
        >
          <Layers className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Add Tree Dialog */}
      <AddTreeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        latitude={addTreeCoords?.lat ?? null}
        longitude={addTreeCoords?.lng ?? null}
      />
    </div>
  );
};

export default LeafletFallbackMap;
