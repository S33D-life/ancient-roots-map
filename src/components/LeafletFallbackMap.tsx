import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { saveMapMemory, restoreMapMemory, clearMapMemory } from "@/hooks/use-map-memory";
import MapContextIndicator from "./MapContextIndicator";
import { getEntryBySlug, type CountryRegistryEntry } from "@/config/countryRegistry";
import { getHiveBySlug } from "@/utils/hiveUtils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { escapeHtml } from "@/utils/escapeHtml";
import {
  fetchLandscapePOIs,
  GUARDIAN_TAGS,
  getNearbyLandscapeContext,
  type LandscapePOI,
  type LandscapeCategory,
} from "@/utils/watersAndCommons";
import {
  fetchAllSourceTrees,
  getEnabledSources,
  getSourceById,
  type ExternalTreeCandidate,
  type BBox,
} from "@/utils/externalTreeSources";
import { Navigation, Loader2, Globe, TreePine, Plus, Layers, Eye, Crosshair, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import GroveViewOverlay from "./GroveViewOverlay";
import BloomingClockLayer from "./BloomingClockLayer";
import BloomingClockDial from "./BloomingClockDial";
import BloomingClockFace from "./BloomingClockFace";
import BloomingClockParticles from "./BloomingClockParticles";
import BloomingClockSigils from "./BloomingClockSigils";
import BloomingClockHivePanel from "./BloomingClockHivePanel";
import AtlasFilter, { type VisualLayerSection, type PerspectivePreset } from "./AtlasFilter";

import { useMapFilters, AGE_BANDS, GIRTH_BANDS, GROVE_SCALES } from "@/contexts/MapFilterContext";
import { getHiveForSpecies, type HiveInfo } from "@/utils/hiveUtils";
import LiteMapSearch from "./LiteMapSearch";
import AddTreeDialog from "./AddTreeDialog";
import { supabase } from "@/integrations/supabase/client";
import { useWhisperCounts } from "@/hooks/use-whisper-counts";
import { fetchRecentWhisperConnections } from "@/hooks/use-whispers";
import { useFoodCycles, type CycleStage, type RegionStageInfo, STAGE_VISUALS } from "@/hooks/use-food-cycles";
import { useHiveSeasonalStatus } from "@/hooks/use-hive-seasonal-status";
import { useSeasonalLens, LENS_CONFIGS, type SeasonalLensType } from "@/contexts/SeasonalLensContext";
import { useHiveSeasonFilter } from "@/contexts/HiveSeasonContext";
import HiveFruitLayer from "./HiveFruitLayer";
import HiveFruitPreview from "./HiveFruitPreview";
import NearbyDiscoveryPanel from "./NearbyDiscoveryPanel";
import { ALL_ROOTSTONES, getRootstoneById } from "@/data/rootstones";
import type { Rootstone } from "@/data/rootstones";
import { consumeQueuedMycelialThreads, onMycelialThread, type MycelialPoint, type MycelialThreadEvent } from "@/lib/mycelial-network";

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
  initialTreeId?: string;
  initialCountry?: string;
  initialHive?: string;
  initialOrigin?: string;
  initialJourney?: boolean;
  initialBbox?: string;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
  onJourneyEnd?: () => void;
}

interface MycelialConnection {
  id: string;
  created_at: string;
  type: "whisper";
  from: MycelialPoint;
  to: MycelialPoint;
  targetTreeId?: string;
}

interface MapPerfDebugStats {
  fps: number | null;
  frameDeltaMs: number | null;
  markerCount: number;
  clusterCount: number;
  renderMs: number | null;
  lastRenderAt: string | null;
  activeFilters: string[];
}

/* ── Shared tier & species logic ── */
import { type TreeTier, getTreeTier, TIER_LABELS, getSpeciesHue, SPECIES_HUE } from "@/utils/treeCardTypes";

type Tier = TreeTier;

/** Viewport-cull helper — returns only trees within current map bounds + padding */
function getVisibleTrees(map: L.Map, trees: Tree[], pad = 0.1): Tree[] {
  const b = map.getBounds();
  const s = b.getSouth() - pad, n = b.getNorth() + pad;
  const w = b.getWest() - pad, e = b.getEast() + pad;
  return trees.filter(t => t.latitude >= s && t.latitude <= n && t.longitude >= w && t.longitude <= e);
}

/* ── SVG with species-aware coloring ── */
const SVG_CACHE: Record<string, string> = {};

function getSvgDataUri(tier: Tier, species?: string, hueOverride?: number): string {
  const hue = hueOverride !== undefined ? hueOverride : (species ? getSpeciesHue(species) : 120);
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

/** Parse "H S% L%" accentHsl → numeric hue */
function hslStringToHue(hslStr: string): number {
  const parts = hslStr.split(/[\s]+/);
  return parseInt(parts[0], 10) || 120;
}

const MARKER_SIZES: Record<Tier, number> = { ancient: 40, storied: 34, notable: 30, seedling: 24 };

/* ── Icon cache (module-level) ── */
const ICON_CACHE: Record<string, L.DivIcon> = {};

function getOrCreateIcon(tier: Tier, species: string, birdsongCount?: number, hiveHue?: number): L.DivIcon {
  const hue = hiveHue !== undefined ? hiveHue : getSpeciesHue(species);
  const hasBirdsong = (birdsongCount ?? 0) > 0;
  const cacheKey = `${tier}-${hue}-${hasBirdsong ? birdsongCount : 0}-${hiveHue !== undefined ? 'h' : 's'}`;
  if (ICON_CACHE[cacheKey]) return ICON_CACHE[cacheKey];

  const size = MARKER_SIZES[tier];
  const uri = getSvgDataUri(tier, species, hiveHue);
  const birdBadge = hasBirdsong
    ? `<span class="birdsong-badge" style="position:absolute;top:-4px;right:-6px;display:flex;align-items:center;gap:1px;background:hsla(200,60%,18%,0.92);border:1.5px solid hsla(200,50%,45%,0.6);border-radius:99px;padding:1px 4px;font-size:9px;font-family:sans-serif;color:hsl(200,60%,70%);line-height:1;white-space:nowrap;pointer-events:none;"><span style="font-size:10px;">🐦</span>${birdsongCount! > 1 ? birdsongCount : ''}</span>`
    : '';
  const icon = L.divIcon({
    className: "leaflet-tree-marker",
    html: `<div style="position:relative;display:inline-block;"><div class="marker-wrap marker-${tier} ${tier === 'ancient' ? 'marker-ancient' : ''}" style="width:${size}px;height:${size}px;background-image:url('${uri}');background-size:contain;cursor:pointer;"></div>${birdBadge}</div>`,
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
  });
  ICON_CACHE[cacheKey] = icon;
  return icon;
}

/* ── Popup HTML (aligned with TreeCard visual language) ── */
function buildPopupHtml(tree: Tree, offerings: number, age: number, photoUrl?: string, birdsongCount?: number, whisperCount?: number): string {
  if (!tree?.name && !tree?.species) return '<div style="padding:12px;font-family:sans-serif;color:#999;">Tree data unavailable</div>';
  const tier = getTreeTier(age, offerings);
  const tierLabel = TIER_LABELS[tier];
  const tierBg = tier === "ancient" ? "hsla(42,80%,55%,0.15)" : tier === "storied" ? "hsla(42,60%,50%,0.1)" : "hsla(0,0%,50%,0.08)";
  const tierColor = tier === "ancient" ? "hsl(42,80%,60%)" : tier === "storied" ? "hsl(42,60%,55%)" : "hsl(0,0%,55%)";
  const speciesHue = getSpeciesHue(tree.species);

  const ageText = age > 0 ? `🌿 ~${age}y` : "";
  const offeringText = offerings > 0
    ? `<span style="color:hsl(42,80%,60%);">✦ ${offerings}</span>`
    : "";
  const birdsongLine = (birdsongCount ?? 0) > 0
    ? `<span>🐦 ${birdsongCount}</span>`
    : "";
  const whisperLine = (whisperCount ?? 0) > 0
    ? `<span style="color:hsl(200,30%,55%);">🌬️ ${whisperCount}</span>`
    : "";
  const desc = tree.description
    ? `<p style="margin:0;font-size:11px;color:hsl(0,0%,62%);line-height:1.5;font-family:sans-serif;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${escapeHtml(tree.description.substring(0, 120))}${tree.description.length > 120 ? "…" : ""}</p>`
    : "";

  const thumbnail = photoUrl
    ? `<div style="position:relative;width:100%;height:100px;overflow:hidden;border-radius:12px 12px 0 0;">
        <img src="${escapeHtml(photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
        <div style="position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(to top,hsl(30,15%,10%),transparent);pointer-events:none;"></div>
        <span style="position:absolute;top:6px;left:6px;font-size:9px;font-family:'Cinzel',serif;letter-spacing:0.05em;padding:2px 7px;border-radius:4px;background:${tierBg};color:${tierColor};border:1px solid ${tierColor}33;backdrop-filter:blur(4px);">${tierLabel}</span>
      </div>`
    : `<div style="position:relative;width:100%;height:80px;overflow:hidden;border-radius:12px 12px 0 0;background:linear-gradient(135deg,hsl(30,20%,14%),hsl(25,18%,10%));display:flex;align-items:center;justify-content:center;">
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" style="opacity:0.3;"><path d="M24 6C24 6 14 16 14 26a10 10 0 0020 0C34 16 24 6 24 6z" fill="hsl(42,50%,45%)"/><rect x="22" y="30" width="4" height="10" rx="2" fill="hsl(30,30%,35%)"/></svg>
        <div style="position:absolute;bottom:0;left:0;right:0;height:30px;background:linear-gradient(to top,hsl(30,15%,10%),transparent);pointer-events:none;"></div>
        <span style="position:absolute;top:6px;left:6px;font-size:9px;font-family:'Cinzel',serif;letter-spacing:0.05em;padding:2px 7px;border-radius:4px;background:${tierBg};color:${tierColor};border:1px solid ${tierColor}33;">${tierLabel}</span>
      </div>`;

  const whisperHref = `/tree/${encodeURIComponent(tree.id)}?whisper=1&context=map`;

  return `<div style="padding:0;font-family:'Cinzel',serif;width:240px;background:hsl(30,15%,10%);border-radius:12px;border:1px solid hsla(42,40%,30%,0.4);overflow:hidden;animation:popIn .2s ease-out;">
    ${thumbnail}
    <div style="padding:12px 14px 8px;display:flex;flex-direction:column;gap:5px;position:relative;">
      <a href="${whisperHref}" aria-label="Whisper to this tree" title="Whisper to this tree" style="position:absolute;top:0;right:0;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;border:1px solid hsla(42,70%,55%,0.35);background:hsla(42,25%,14%,0.75);color:hsl(42,70%,62%);text-decoration:none;font-size:12px;backdrop-filter:blur(4px);">🌬️</a>
      <h3 style="margin:0;padding-right:34px;font-size:15px;color:hsl(45,80%,60%);line-height:1.3;font-weight:700;letter-spacing:0.03em;">${escapeHtml(tree.name)}</h3>
      <p style="margin:0;font-size:11px;color:hsl(${speciesHue},45%,55%);font-style:italic;">${escapeHtml(tree.species)}</p>
      <div style="display:flex;gap:10px;font-size:11px;font-family:sans-serif;color:hsl(0,0%,55%);">
        ${ageText ? `<span>${ageText}</span>` : ""}
        ${offeringText ? `<span>${offeringText}</span>` : ""}
        ${birdsongLine}
        ${whisperLine}
      </div>
      ${tree.what3words ? `<p style="margin:0;font-size:10px;color:hsl(45,40%,48%);font-family:sans-serif;">📍 /${escapeHtml(tree.what3words)}</p>` : ""}
      ${desc}
    </div>
    <div style="padding:0 14px 10px;display:flex;gap:6px;">
      <a href="/tree/${encodeURIComponent(tree.id)}" style="flex:1;display:flex;align-items:center;justify-content:center;padding:8px 0;font-size:11px;color:hsl(80,20%,8%);background:linear-gradient(135deg,hsl(42,88%,50%),hsl(45,100%,60%));border-radius:8px;text-decoration:none;letter-spacing:0.04em;font-weight:700;font-family:sans-serif;">View Details ⟶</a>
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
      <a href="/map?tree=${encodeURIComponent(tree.id)}&treeId=${encodeURIComponent(tree.id)}&lat=${tree.lat}&lng=${tree.lng}&zoom=18&arrival=tree&journey=1" style="display:flex;align-items:center;justify-content:center;padding:9px 0;font-size:12px;color:hsl(200,15%,12%);background:linear-gradient(135deg,hsl(180,60%,45%),hsl(180,70%,55%));border-radius:8px;text-decoration:none;letter-spacing:0.04em;font-weight:700;font-family:sans-serif;">🌱 Bloom Hearts Here</a>
    </div>
  </div>`;
}

/* ── Research tree types ── */
interface ResearchTree {
  id: string;
  species_scientific: string;
  species_common: string | null;
  tree_name: string | null;
  locality_text: string;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  geo_precision: string;
  description: string | null;
  height_m: number | null;
  girth_or_stem: string | null;
  crown_spread: string | null;
  designation_type: string;
  source_doc_title: string;
  source_doc_url: string;
  source_doc_year: number;
  source_program: string;
  status: string;
}

/* ── Research Tree Card popup ── */
function buildResearchPopupHtml(rt: ResearchTree): string {
  const name = rt.tree_name || rt.species_common || rt.species_scientific;
  const precisionBadge = rt.geo_precision === 'exact'
    ? '<span style="color:hsl(120,55%,50%);font-size:9px;">● Exact</span>'
    : rt.geo_precision === 'approx'
    ? '<span style="color:hsl(45,70%,50%);font-size:9px;">◐ Approx</span>'
    : '<span style="color:hsl(0,50%,55%);font-size:9px;">○ Unverified</span>';

  const measurements = [
    rt.height_m ? `📏 ${rt.height_m}m tall` : '',
    rt.girth_or_stem ? `⊙ ${escapeHtml(rt.girth_or_stem)}` : '',
    rt.crown_spread ? `🌳 ${escapeHtml(rt.crown_spread)}` : '',
  ].filter(Boolean).join(' · ');

  const desc = rt.description
    ? `<p style="margin:4px 0 0;font-size:11px;color:hsl(0,0%,62%);line-height:1.5;font-family:sans-serif;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">${escapeHtml(rt.description.substring(0, 200))}${rt.description.length > 200 ? '…' : ''}</p>`
    : '';

  return `<div style="padding:0;font-family:'Cinzel',serif;width:260px;background:hsl(25,18%,10%);border-radius:12px;border:1px solid hsla(35,60%,40%,0.5);overflow:hidden;animation:popIn .2s ease-out;">
    <div style="padding:10px 14px 6px;background:linear-gradient(135deg,hsla(35,50%,30%,0.15),hsla(35,60%,20%,0.05));">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="font-size:16px;">📜</span>
        <span style="font-size:9px;font-family:sans-serif;padding:2px 6px;border-radius:4px;background:hsla(35,60%,40%,0.15);color:hsl(35,70%,60%);border:1px solid hsla(35,60%,40%,0.3);">Research Layer</span>
        ${precisionBadge}
      </div>
      <h3 style="margin:0;font-size:15px;color:hsl(35,70%,60%);line-height:1.3;font-weight:700;letter-spacing:0.03em;">${escapeHtml(name)}</h3>
      <p style="margin:2px 0 0;font-size:11px;color:hsl(35,45%,50%);font-style:italic;">${escapeHtml(rt.species_scientific)}</p>
      ${rt.species_common && rt.species_common !== name ? `<p style="margin:0;font-size:10px;color:hsl(35,40%,45%);">(${escapeHtml(rt.species_common)})</p>` : ''}
    </div>
    <div style="padding:6px 14px 8px;display:flex;flex-direction:column;gap:4px;">
      <p style="margin:0;font-size:10px;color:hsl(35,40%,48%);font-family:sans-serif;">📍 ${escapeHtml(rt.locality_text)}${rt.province ? `, ${escapeHtml(rt.province)}` : ''}</p>
      ${measurements ? `<p style="margin:0;font-size:10px;color:hsl(0,0%,55%);font-family:sans-serif;">${measurements}</p>` : ''}
      ${desc}
      <div style="margin-top:6px;padding:6px 8px;background:hsla(35,40%,20%,0.3);border-radius:6px;border:1px solid hsla(35,40%,30%,0.2);">
        <p style="margin:0;font-size:9px;color:hsl(35,50%,55%);font-family:sans-serif;line-height:1.4;">
          <strong>Lineage:</strong> This is a Research Layer record from ${escapeHtml(rt.source_program)}. It becomes an Ancient Friend only after a wanderer verifies it in person.
        </p>
        <p style="margin:4px 0 0;font-size:9px;color:hsl(35,40%,48%);font-family:sans-serif;">
          📄 <a href="${escapeHtml(rt.source_doc_url)}" target="_blank" rel="noopener" style="color:hsl(35,60%,55%);text-decoration:underline;">${escapeHtml(rt.source_doc_title)}</a> (${rt.source_doc_year})
        </p>
      </div>
    </div>
    <div style="padding:0 14px 12px;">
      <a href="/map?tree=${encodeURIComponent(rt.id)}&treeId=${encodeURIComponent(rt.id)}&lat=${rt.latitude}&lng=${rt.longitude}&zoom=18&arrival=tree&journey=1&research=on" style="display:flex;align-items:center;justify-content:center;padding:9px 0;font-size:12px;color:hsl(25,15%,8%);background:linear-gradient(135deg,hsl(35,70%,45%),hsl(40,80%,55%));border-radius:8px;text-decoration:none;letter-spacing:0.04em;font-weight:700;font-family:sans-serif;">🔍 Verify This Tree In Person</a>
    </div>
  </div>`;
}

function buildRootstonePopupHtml(stone: Rootstone): string {
  const title = escapeHtml(stone.name);
  const lore = escapeHtml(stone.lore);
  const place = escapeHtml(stone.location.place || stone.country);
  const sourceName = escapeHtml(stone.source.name);
  const sourceUrl = escapeHtml(stone.source.url);
  const mapsUrl = stone.location.mapsUrl ? escapeHtml(stone.location.mapsUrl) : "";
  const tags = stone.tags.slice(0, 5).map((tag) => `#${escapeHtml(tag)}`).join(" ");
  const badge = stone.type === "tree" ? "🌳 Rootstone Tree" : "🌲 Rootstone Grove";

  return `<div style="padding:0;font-family:'Cinzel',serif;width:260px;background:hsl(28,16%,10%);border-radius:12px;border:1.5px solid hsla(42,70%,45%,0.45);overflow:hidden;">
    <div style="padding:10px 14px 6px;background:linear-gradient(135deg,hsla(42,45%,24%,0.18),hsla(42,55%,16%,0.06));">
      <span style="font-size:9px;font-family:sans-serif;padding:2px 6px;border-radius:4px;background:hsla(42,80%,50%,0.15);color:hsl(42,80%,60%);border:1px solid hsla(42,80%,50%,0.3);">${badge}</span>
      <h3 style="margin:6px 0 2px;font-size:14px;color:hsl(42,80%,60%);line-height:1.35;">${title}</h3>
      <p style="margin:0;font-size:11px;color:hsl(42,45%,52%);font-family:sans-serif;">${place}</p>
    </div>
    <div style="padding:8px 14px 10px;display:flex;flex-direction:column;gap:6px;">
      <p style="margin:0;font-size:11px;color:hsl(0,0%,75%);font-family:sans-serif;line-height:1.45;white-space:pre-line;">${lore}</p>
      <p style="margin:0;font-size:10px;color:hsl(42,45%,52%);font-family:sans-serif;">${tags}</p>
      <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:hsl(190,60%,65%);text-decoration:none;font-family:sans-serif;">Source: ${sourceName}</a>
      ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:hsl(145,55%,60%);text-decoration:none;font-family:sans-serif;">Open maps ↗</a>` : ""}
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
.marker-wrap{transition:transform .2s cubic-bezier(0.34,1.56,0.64,1),filter .2s ease-out}
.marker-wrap:hover{transform:scale(1.2)!important;filter:brightness(1.15) drop-shadow(0 0 6px hsla(42,80%,55%,0.4))!important}
.marker-wrap:active{transform:scale(0.92)!important;transition:transform .1s ease-out}
@keyframes markerBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.marker-seedling .marker-wrap{animation:markerBreathe 4s ease-in-out infinite}
.marker-notable .marker-wrap{animation:markerBreathe 3.5s ease-in-out infinite}
/* Living Groves — calm, organic cluster styling */
.tree-cluster{display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:'Cinzel',serif;font-weight:600;color:hsla(45,60%,60%,0.9);text-shadow:0 1px 3px rgba(0,0,0,0.4);border:1.5px solid hsla(42,50%,45%,0.35);transition:transform .2s ease-out,box-shadow .3s ease-out;position:relative}
.tree-cluster:active{transform:scale(0.96)}
.tree-cluster::before{content:'';position:absolute;inset:-4px;border-radius:50%;border:1px solid transparent;pointer-events:none;transition:border-color .6s}
/* Grove tiers — restrained earth palette, generous breathing cycles */
.grove-seedling{width:30px;height:30px;font-size:10px;background:hsla(130,25%,22%,0.8);box-shadow:0 0 4px hsla(120,30%,35%,0.1)}
.grove-small{width:36px;height:36px;font-size:11px;background:hsla(128,30%,20%,0.82);box-shadow:0 0 6px hsla(120,30%,35%,0.12)}
.grove-small::before{border-color:hsla(120,30%,40%,0.08)}
.grove-established{width:44px;height:44px;font-size:12px;background:hsla(125,32%,18%,0.85);box-shadow:0 0 8px hsla(120,30%,35%,0.15);animation:groveBreathe 14s ease-in-out infinite}
.grove-established::before{border-color:hsla(120,30%,40%,0.12);animation:groveRingPulse 14s ease-in-out infinite}
.grove-flourishing{width:50px;height:50px;font-size:13px;background:hsla(122,35%,16%,0.88);box-shadow:0 0 10px hsla(120,30%,35%,0.18),inset 0 0 6px hsla(120,25%,35%,0.06);animation:groveBreathe 18s ease-in-out infinite}
.grove-flourishing::before{border-color:hsla(120,30%,40%,0.15);animation:groveRingPulse 18s ease-in-out infinite}
.grove-ancient{width:56px;height:56px;font-size:14px;background:hsla(120,38%,14%,0.9);box-shadow:0 0 12px hsla(42,40%,45%,0.15),0 0 24px hsla(120,25%,30%,0.1),inset 0 0 8px hsla(42,30%,35%,0.05);animation:groveBreathe 22s ease-in-out infinite}
.grove-ancient::before{border-color:hsla(42,40%,45%,0.18);animation:groveRingPulse 22s ease-in-out infinite}
/* Mycelium thread ring — faint dashed aura on established+ groves */
.grove-mycelium{position:absolute;inset:-6px;border-radius:50%;pointer-events:none;opacity:0.25}
/* Breathing: barely perceptible scale + brightness shifts */
@keyframes groveBreathe{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.02);filter:brightness(1.03)}}
@keyframes groveRingPulse{0%,100%{opacity:0.15;transform:scale(1)}50%{opacity:0.35;transform:scale(1.04)}}
@media(prefers-reduced-motion:reduce){.grove-established,.grove-flourishing,.grove-ancient,.grove-established::before,.grove-flourishing::before,.grove-ancient::before{animation:none}}
@keyframes ancientGlow{0%,100%{filter:drop-shadow(0 0 3px hsla(42,90%,55%,0.25))}50%{filter:drop-shadow(0 0 8px hsla(42,90%,55%,0.6))}}
@keyframes popIn{0%{opacity:0;transform:scale(0.88) translateY(8px)}60%{transform:scale(1.02) translateY(-2px)}100%{opacity:1;transform:scale(1) translateY(0)}}
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
.leaflet-tile-pane{filter:sepia(0.25) saturate(0.85) brightness(0.9);transition:filter 1.2s ease-in-out}
.grove-view-active .leaflet-tile-pane{filter:sepia(0.35) saturate(0.7) brightness(0.65) hue-rotate(-10deg)}
@media(max-width:768px){.leaflet-tile-pane{filter:sepia(0.1) brightness(0.95)}}
@media(max-width:768px){.grove-view-active .leaflet-tile-pane{filter:sepia(0.3) saturate(0.7) brightness(0.7) hue-rotate(-10deg)}}
@keyframes groveBreath{0%,100%{filter:drop-shadow(0 0 3px hsla(120,40%,40%,0.15)) brightness(1)}50%{filter:drop-shadow(0 0 6px hsla(120,40%,40%,0.3)) brightness(1.03)}}
.grove-view-active .marker-wrap{animation:groveBreath 8s ease-in-out infinite!important}
.grove-view-active .marker-ancient{animation:groveBreath 6s ease-in-out infinite,ancientGlow 8s ease-in-out infinite!important}
.grove-view-active .tree-cluster{box-shadow:0 0 10px hsla(120,35%,40%,0.2),0 0 4px hsla(42,40%,45%,0.12)!important;transition:box-shadow 1.5s ease-in-out}
.grove-view-active .grove-mycelium{opacity:0.4!important;border-color:hsla(120,35%,40%,0.2)!important}
@keyframes eventPulseGold{0%{transform:scale(0.3);opacity:0.9}100%{transform:scale(3);opacity:0}}
@keyframes eventPulseHeart{0%{transform:scale(0.3);opacity:0.8}100%{transform:scale(2.5);opacity:0}}
.event-pulse-marker{background:transparent!important;border:none!important;pointer-events:none}
.event-pulse-gold{width:24px;height:24px;border-radius:50%;background:hsla(42,80%,55%,0.6);animation:eventPulseGold 2s ease-out forwards;box-shadow:0 0 12px hsla(42,80%,55%,0.4)}
.event-pulse-heart{width:20px;height:20px;border-radius:50%;background:hsla(0,70%,55%,0.5);animation:eventPulseHeart 2s ease-out forwards;box-shadow:0 0 10px hsla(0,70%,55%,0.3)}
.hex-bin-marker{background:transparent!important;border:none!important;pointer-events:none}
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
@keyframes researchLantern{0%,100%{box-shadow:0 0 6px hsla(35,80%,55%,0.3),0 0 12px hsla(35,80%,55%,0.1)}50%{box-shadow:0 0 10px hsla(35,80%,55%,0.5),0 0 20px hsla(35,80%,55%,0.2)}}
.research-marker{background:transparent!important;border:none!important}
.research-dot{border-radius:50%;transition:transform .15s ease-out;cursor:pointer;animation:researchLantern 3s ease-in-out infinite}
.research-dot:hover{transform:scale(1.3)!important}
@keyframes focusHalo{0%{transform:scale(0.5);opacity:0}30%{opacity:0.7}100%{transform:scale(2.8);opacity:0}}
.tree-focus-halo{position:absolute;top:50%;left:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;background:hsla(42,90%,55%,0.35);pointer-events:none;animation:focusHalo 2.5s ease-out forwards}
.tree-focus-label{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);white-space:nowrap;font-family:'Cinzel',serif;font-size:12px;color:hsl(45,80%,60%);text-shadow:0 1px 4px rgba(0,0,0,0.8);padding:3px 10px;background:hsla(30,20%,10%,0.85);border:1px solid hsla(42,50%,40%,0.4);border-radius:6px;pointer-events:none;animation:popIn .3s ease-out;margin-bottom:6px}
.mycelial-thread-animated{pointer-events:none}
@keyframes mycelialPulse{0%{box-shadow:0 0 0 0 hsla(180,80%,70%,0.7)}70%{box-shadow:0 0 0 12px hsla(180,80%,70%,0)}100%{box-shadow:0 0 0 0 hsla(180,80%,70%,0)}}
.mycelial-target-pulse .marker-wrap{filter:brightness(1.2) drop-shadow(0 0 7px hsla(180,80%,70%,0.6));animation:mycelialPulse 1.4s ease-out 1}
@media(prefers-reduced-motion:reduce){.mycelial-target-pulse .marker-wrap{animation:none}}
.wc-poi-marker{background:transparent!important;border:none!important}
.wc-dot{transition:transform .15s ease-out,opacity .15s}
.wc-dot:hover{transform:scale(1.4)!important;opacity:1!important}
@keyframes wcGlow{0%,100%{opacity:0.5}50%{opacity:0.8}}
.wc-waterway{animation:wcGlow 4s ease-in-out infinite}
@keyframes wcShimmer{0%,100%{opacity:0.55;filter:brightness(1)}50%{opacity:0.85;filter:brightness(1.15)}}
.wc-waterway-line{animation:wcShimmer 5s ease-in-out infinite}
@keyframes pathGlow{0%,100%{opacity:0.35}50%{opacity:0.6}}
.wc-footpath-glow{animation:pathGlow 4s ease-in-out infinite}
@keyframes treeNearPathPulse{0%,100%{box-shadow:0 0 6px hsla(42,80%,55%,0.3);transform:scale(1)}50%{box-shadow:0 0 14px hsla(42,80%,55%,0.6);transform:scale(1.08)}}
.tree-near-path{animation:treeNearPathPulse 2.5s ease-in-out infinite;border-radius:50%}
@media(prefers-reduced-motion:reduce){.wc-waterway-line,.wc-footpath-glow,.tree-near-path{animation:none}}
@keyframes seedPulse{0%,100%{transform:scale(1);opacity:0.8}50%{transform:scale(1.2);opacity:1}}
`;

const btnBase: React.CSSProperties = {
  background: "hsla(30, 30%, 12%, 0.92)",
  border: "1px solid hsla(42, 40%, 30%, 0.5)",
  backdropFilter: "blur(6px)",
};
const BTN_GLOW_CLASS = "glow-button";

/** Globe resting on an open book – compact SVG icon for Atlas */
const GlobeOnBookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="9" r="6" />
    <ellipse cx="12" cy="9" rx="2.4" ry="6" />
    <line x1="6" y1="9" x2="18" y2="9" />
    <path d="M4 20 C4 18, 8 17.5, 12 18.5 C16 17.5, 20 18, 20 20" />
    <line x1="12" y1="18.5" x2="12" y2="21" />
    <path d="M4 20 C4 21, 8 21.5, 12 21" />
    <path d="M20 20 C20 21, 16 21.5, 12 21" />
  </svg>
);

/** Atlas nav button — inline in the map control column */
function AtlasNavButton({ btnBase }: { btnBase: React.CSSProperties }) {
  const navigate = useNavigate();
  const guardRef = useRef(false);
  const handleClick = useCallback(() => {
    if (guardRef.current) return;
    guardRef.current = true;
    try { navigate("/atlas"); } catch { /* silent */ }
    setTimeout(() => { guardRef.current = false; }, 400);
  }, [navigate]);
  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 ${BTN_GLOW_CLASS}`}
      style={{ ...btnBase, color: "hsl(42, 60%, 60%)" }}
      title="World Atlas"
      aria-label="Open World Atlas"
    >
      <GlobeOnBookIcon className="w-[18px] h-[18px]" />
    </button>
  );
}

const LeafletFallbackMap = ({ trees, offeringCounts = {}, treePhotos = {}, birdsongCounts = {}, birdsongHeatPoints = [], className, userId, bloomedSeeds = [], initialLat, initialLng, initialZoom, initialW3w, initialTreeId, initialCountry, initialHive, initialOrigin, initialJourney, initialBbox, onFullscreenToggle, isFullscreen, onJourneyEnd }: LeafletFallbackMapProps) => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyRef = useRef<L.Circle | null>(null);
  const groveLayerRef = useRef<L.LayerGroup | null>(null);
  const seedLayerRef = useRef<L.LayerGroup | null>(null);
  const rootThreadLayerRef = useRef<L.LayerGroup | null>(null);
  const mycelialNetworkLayerRef = useRef<L.LayerGroup | null>(null);
  const mycelialAnimatedLayerRef = useRef<L.LayerGroup | null>(null);
  const offeringGlowLayerRef = useRef<L.LayerGroup | null>(null);
  const birdsongHeatLayerRef = useRef<L.LayerGroup | null>(null);
  const externalLayerRef = useRef<L.LayerGroup | null>(null);
  const researchLayerRef = useRef<L.LayerGroup | null>(null);
  const rootstoneLayerRef = useRef<L.LayerGroup | null>(null);
  const externalAbortRef = useRef<AbortController | null>(null);
  const prevTreeIdsRef = useRef<Set<string>>(new Set());
  const hasFittedRef = useRef(false);
  const focusHandledRef = useRef<string | null>(null);
  const focusHaloRef = useRef<L.Marker | null>(null);
  const focusFetchAttemptRef = useRef<string | null>(null);
  const focusFallbackMarkerRef = useRef<L.Marker | null>(null);
  const geo = useGeolocation();
  const locating = geo.isLocating;
  const [located, setLocated] = useState(false);
  const [userLatLng, setUserLatLng] = useState<[number, number] | null>(null);
  const [discoveryCount, setDiscoveryCount] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTreeCoords, setAddTreeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const debugEnabled = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get("debug") === "1";
    } catch {
      return false;
    }
  }, [location.search]);
  const [perfDebug, setPerfDebug] = useState<MapPerfDebugStats>({
    fps: null,
    frameDeltaMs: null,
    markerCount: 0,
    clusterCount: 0,
    renderMs: null,
    lastRenderAt: null,
    activeFilters: [],
  });

  // Filter state — species remains local (multi-select), others from context
  const [species, setSpecies] = useState<string[]>([]);
  const { perspective, setPerspective, ageBand, girthBand, groveScale } = useMapFilters();
  const [lineageFilter, setLineageFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  // Layer visibility toggles
  const [showSeeds, setShowSeeds] = useState(true);
  const [showGroves, setShowGroves] = useState(false);
  const [showRootThreads, setShowRootThreads] = useState(false);
  const [showMycelialNetwork, setShowMycelialNetwork] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("mycelial") === "on";
    } catch {
      return false;
    }
  });
  const [mycelialConnections, setMycelialConnections] = useState<MycelialConnection[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showOfferingGlow, setShowOfferingGlow] = useState(false);
  const [showHarvestLayer, setShowHarvestLayer] = useState(false);
  const [showAncientHighlight, setShowAncientHighlight] = useState(false);
  const [harvestTreeIds, setHarvestTreeIds] = useState<Set<string>>(new Set());
  const harvestLayerRef = useRef<L.LayerGroup | null>(null);
  const ancientHighlightLayerRef = useRef<L.LayerGroup | null>(null);
  const [showExternalTrees, setShowExternalTrees] = useState(false);
  const [showBirdsongHeat, setShowBirdsongHeat] = useState(false);
  const [showHiveLayer, setShowHiveLayer] = useState(false);
  const [showResearchLayer, setShowResearchLayer] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('research') === 'off') return false;
      return true; // On by default so all country data is visible
    } catch { return true; }
  });
  const [showRootstones, setShowRootstones] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("rootstones") === "on" || Boolean(params.get("rootstoneId"));
    } catch { return false; }
  });
  const [showRootstoneTrees, setShowRootstoneTrees] = useState(true);
  const [showRootstoneGroves, setShowRootstoneGroves] = useState(true);
  const [rootstoneCountryFilter, setRootstoneCountryFilter] = useState<string | null>(null);
  const [rootstoneTagFilter, setRootstoneTagFilter] = useState<string[]>([]);
  const [rootstoneCount, setRootstoneCount] = useState(0);
  const [researchTreeCount, setResearchTreeCount] = useState(0);
  const [researchLoading, setResearchLoading] = useState(false);
  const [showImmutableLayer, setShowImmutableLayer] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('immutable') === 'on';
    } catch { return false; }
  });
  const [immutableTreeCount, setImmutableTreeCount] = useState(0);
  const [immutableLoading, setImmutableLoading] = useState(false);
  const immutableLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const [birdsongSeason, setBirdsongSeason] = useState<string>("all");
  const [externalTreeCount, setExternalTreeCount] = useState(0);
  const [externalLoading, setExternalLoading] = useState(false);
  const [atlasFilterOpen, setAtlasFilterOpen] = useState(false);
  // (collapsed state now managed inside AtlasFilter)
  const [showRecentVisits, setShowRecentVisits] = useState(false);
  const [showSeedTraces, setShowSeedTraces] = useState(false);
  const [showSharedTrees, setShowSharedTrees] = useState(false);
  const [showTribeActivity, setShowTribeActivity] = useState(false);
  const [showBloomedSeeds, setShowBloomedSeeds] = useState(false);
  const [showSeedTrail, setShowSeedTrail] = useState(false);
  const [seedTrailCount, setSeedTrailCount] = useState(0);
  const seedTrailLayerRef = useRef<L.LayerGroup | null>(null);
  const [showHeartGlow, setShowHeartGlow] = useState(false);
  const [showChurchyards, setShowChurchyards] = useState(false);
  const [showWaterways, setShowWaterways] = useState(false);
  const [showFootpaths, setShowFootpaths] = useState(false);
  const [showHeritage, setShowHeritage] = useState(false);
  const [showCastles, setShowCastles] = useState(false);
  const [showLibraries, setShowLibraries] = useState(false);
  const [showBookshops, setShowBookshops] = useState(false);
  const [showBotanicalGardens, setShowBotanicalGardens] = useState(false);
  const [bloomedSeedCount, setBloomedSeedCount] = useState(0);
  const bloomedSeedLayerRef = useRef<L.LayerGroup | null>(null);
  
  // Clear View — hide non-essential UI overlays for distraction-free browsing
  const [clearView, setClearView] = useState(false);

  // GroveView — Living Earth Mode
  const [groveViewActive, setGroveViewActive] = useState(false);

  // Blooming Clock — Global Seasonal Atlas
  const { foods: foodCycles, loading: foodCyclesLoading } = useFoodCycles();
  const [showBloomingClock, setShowBloomingClock] = useState(false);
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [bloomStageFilter, setBloomStageFilter] = useState<CycleStage | "all">("all");
  const [bloomConstellationMode, setBloomConstellationMode] = useState(false);
  const [bloomMonth, setBloomMonth] = useState(new Date().getMonth() + 1);
  const [bloomRegionStages, setBloomRegionStages] = useState<RegionStageInfo[]>([]);

  // Seasonal Lens — harmonises calendar, blooming clock, and map layers
  const { activeLens, setLens, lensConfig } = useSeasonalLens();

  // When a seasonal lens is activated, auto-enable relevant map layers and set blooming clock month
  useEffect(() => {
    if (!activeLens) return;
    const config = LENS_CONFIGS[activeLens];
    if (!config) return;
    // Auto-enable harvest + offering + blooming clock layers
    setShowHarvestLayer(true);
    setShowOfferingGlow(true);
    setShowBloomingClock(true);
    // Set blooming clock to the middle month of the season
    const midMonth = config.months[Math.floor(config.months.length / 2)];
    setBloomMonth(midMonth);
    // Set appropriate stage filter based on season
    const stageMap: Record<string, CycleStage | "all"> = {
      spring: "flowering",
      summer: "fruiting",
      autumn: "harvest",
      winter: "dormant",
    };
    setBloomStageFilter(stageMap[activeLens] || "all");
  }, [activeLens]);


  const { fruitingHives, getStatusForFamily } = useHiveSeasonalStatus(bloomMonth);
  const { activeHiveFamily, setActiveHive } = useHiveSeasonFilter();
  const [fruitPreview, setFruitPreview] = useState<{
    hive: HiveInfo;
    treeCount: number;
    status: { stage: string; label: string; emoji: string };
  } | null>(null);

  const handleFruitClick = useCallback((
    hive: HiveInfo,
    treeCount: number,
    _lat: number,
    _lng: number,
    status: { stage: string | null; label: string; emoji: string },
  ) => {
    setFruitPreview({
      hive,
      treeCount,
      status: { stage: status.stage || "fruiting", label: status.label, emoji: status.emoji },
    });
  }, []);

  const [showWatersCommons, setShowWatersCommons] = useState(false);
  const [watersCommonsCollapsed, setWatersCommonsCollapsed] = useState(true);
  const watersCommonsLayerRef = useRef<L.LayerGroup | null>(null);
  const watersCommonsAbortRef = useRef<AbortController | null>(null);
  const [watersCommonsCount, setWatersCommonsCount] = useState(0);
  const [watersCommonsLoading, setWatersCommonsLoading] = useState(false);
  const [watersCommonsPois, setWatersCommonsPois] = useState<LandscapePOI[]>([]);
  const [watersCommonsWhisper, setWatersCommonsWhisper] = useState<string | null>(null);

  // Deep-link context state
  const [contextLabel, setContextLabel] = useState<string | null>(null);
  const deepLinkAppliedRef = useRef<string | null>(null);
  const deepLinkSignature = useMemo(
    () =>
      [
        initialCountry || "",
        initialHive || "",
        initialOrigin || "",
        initialLat ?? "",
        initialLng ?? "",
        initialZoom ?? "",
        initialBbox || "",
        initialJourney ? "1" : "0",
        typeof window !== "undefined" ? window.location.search : "",
      ].join("|"),
    [initialCountry, initialHive, initialOrigin, initialLat, initialLng, initialZoom, initialBbox, initialJourney],
  );

  // hiveMap moved after filteredTrees declaration

  // Tree lookup for realtime coordinate pulses
  const treeLookup = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }>();
    trees.forEach(t => m.set(t.id, { lat: t.latitude, lng: t.longitude }));
    return m;
  }, [trees]);

  // Event pulse layer ref
  const eventPulseLayerRef = useRef<L.LayerGroup | null>(null);
  const hexBinLayerRef = useRef<L.LayerGroup | null>(null);
  const [currentEventPulses, setCurrentEventPulses] = useState<any[]>([]);

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

  // Compute map center for grove scale filtering
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // Track map center changes for grove scale
  useEffect(() => {
    const map = mapRef.current;
    if (!map || groveScale === "all") return;
    const update = () => {
      const c = map.getCenter();
      setMapCenter([c.lat, c.lng]);
    };
    update();
    map.on("moveend", update);
    return () => { map.off("moveend", update); };
  }, [groveScale]);

  const filteredTrees = useMemo(() => {
    let result = trees;
    if (perspective === "personal" && userId) {
      result = result.filter((t) => t.created_by === userId);
    }
    // Multi-select species filter
    if (species.length > 0) {
      const lowerSpecies = species.map(s => s.toLowerCase());
      result = result.filter((t) => lowerSpecies.includes(t.species.toLowerCase()));
    }
    if (lineageFilter !== "all") {
      result = result.filter((t: any) => t.lineage === lineageFilter);
    }
    if (projectFilter !== "all") {
      result = result.filter((t: any) => t.project_name === projectFilter);
    }
    // Age band filter — trees with unknown age remain visible unless a band is selected
    if (ageBand !== "all") {
      const band = AGE_BANDS.find(b => b.key === ageBand);
      if (band) {
        result = result.filter((t) => {
          const age = (t as any).estimated_age;
          if (age == null) return true;
          return age >= band.min && age <= band.max;
        });
      }
    }
    // Girth band filter — trees with unknown girth remain visible
    if (girthBand !== "all") {
      const band = GIRTH_BANDS.find(b => b.key === girthBand);
      if (band) {
        result = result.filter((t) => {
          const girth = (t as any).girth_cm;
          if (girth == null) return true;
          return girth >= band.minCm && girth <= band.maxCm;
        });
      }
    }
    // Grove scale distance filter — uses map center (or user location as fallback)
    if (groveScale !== "all") {
      const scaleInfo = GROVE_SCALES.find((g) => g.key === groveScale);
      const center = mapCenter || userLatLng;
      if (scaleInfo && center) {
        const maxKm = scaleInfo.radiusKm;
        result = result.filter((t) =>
          haversineKm(center[0], center[1], t.latitude, t.longitude) <= maxKm
        );
      }
    }
    return result;
  }, [trees, species, perspective, lineageFilter, projectFilter, userId, groveScale, mapCenter, userLatLng, ageBand, girthBand]);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (perspective !== "collective") labels.push(`perspective:${perspective}`);
    if (species.length > 0) labels.push(`species:${species.length}`);
    if (ageBand !== "all") labels.push(`age:${ageBand}`);
    if (girthBand !== "all") labels.push(`girth:${girthBand}`);
    if (lineageFilter !== "all") labels.push(`lineage:${lineageFilter}`);
    if (projectFilter !== "all") labels.push(`project:${projectFilter}`);
    if (groveScale !== "all") labels.push(`grove:${groveScale}`);
    if (showResearchLayer) labels.push("layer:research");
    if (showRootstones) labels.push("layer:rootstones");
    if (showMycelialNetwork) labels.push("layer:mycelial");
    return labels;
  }, [
    perspective,
    species,
    ageBand,
    girthBand,
    lineageFilter,
    projectFilter,
    groveScale,
    showResearchLayer,
    showRootstones,
    showMycelialNetwork,
  ]);

  useEffect(() => {
    if (!debugEnabled) return;
    setPerfDebug((prev) => ({ ...prev, activeFilters: activeFilterLabels }));
  }, [debugEnabled, activeFilterLabels]);

  useEffect(() => {
    if (!debugEnabled || typeof window === "undefined") return;

    let raf = 0;
    let previousTs = 0;
    let sampleFrames = 0;
    let sampleDeltaTotal = 0;
    let lastFlushTs = 0;

    const tick = (ts: number) => {
      if (previousTs > 0) {
        const delta = ts - previousTs;
        sampleFrames += 1;
        sampleDeltaTotal += delta;
      }
      previousTs = ts;

      if (sampleFrames >= 12 && ts - lastFlushTs >= 450) {
        const avgDelta = sampleDeltaTotal / sampleFrames;
        const fps = avgDelta > 0 ? 1000 / avgDelta : 0;
        setPerfDebug((prev) => ({
          ...prev,
          fps: Number(fps.toFixed(1)),
          frameDeltaMs: Number(avgDelta.toFixed(2)),
        }));
        sampleFrames = 0;
        sampleDeltaTotal = 0;
        lastFlushTs = ts;
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [debugEnabled]);

  useEffect(() => {
    if (!debugEnabled || typeof window === "undefined") return;
    const map = mapRef.current;
    if (!map) return;

    const refreshClusterCount = () => {
      const clusterCount = containerRef.current?.querySelectorAll(".tree-cluster").length ?? 0;
      setPerfDebug((prev) => ({ ...prev, clusterCount }));
    };

    map.on("zoomend", refreshClusterCount);
    map.on("moveend", refreshClusterCount);
    const timer = window.setTimeout(refreshClusterCount, 120);

    return () => {
      window.clearTimeout(timer);
      map.off("zoomend", refreshClusterCount);
      map.off("moveend", refreshClusterCount);
    };
  }, [debugEnabled, filteredTrees.length]);

  /** Compute per-hive data from ALL trees so the legend stays stable when filtering */
  const hiveMap = useMemo(() => {
    const m = new Map<string, { hive: HiveInfo; count: number; speciesList: string[] }>();
    trees.forEach((t) => {
      const hive = getHiveForSpecies(t.species);
      if (!hive) return;
      const existing = m.get(hive.family);
      if (existing) {
        existing.count++;
        if (!existing.speciesList.includes(t.species)) existing.speciesList.push(t.species);
      } else {
        m.set(hive.family, { hive, count: 1, speciesList: [t.species] });
      }
    });
    return Array.from(m.values()).sort((a, b) => b.count - a.count);
  }, [trees]);

  /** Visual layer sections for AtlasFilter — renderer-specific toggles passed as props */
  const visualSections: VisualLayerSection[] = useMemo(() => [
    {
      key: "discovery",
      title: "Discovery Filters",
      icon: "🔍",
      accent: "hsl(42, 80%, 55%)",
      description: "Highlight trees by significance, harvest availability, or community offerings.",
      layers: [
        { key: "ancient-highlight", label: "👑 Ancient Trees", description: "Golden halos on the oldest, most storied trees", active: showAncientHighlight, toggle: () => setShowAncientHighlight(v => !v), accent: "42, 80%, 55%" },
        { key: "harvest-layer", label: "🍎 Harvest Available", description: "Trees with active produce listings", active: showHarvestLayer, toggle: () => setShowHarvestLayer(v => !v), extra: showHarvestLayer ? (harvestTreeIds.size > 0 ? `${harvestTreeIds.size}` : "—") : undefined, accent: "25, 70%, 50%" },
        { key: "offering-glow", label: "✦ Offerings", description: "Warm glow on trees with community contributions", active: showOfferingGlow, toggle: () => setShowOfferingGlow(v => !v), accent: "42, 85%, 55%" },
      ],
    },
    {
      key: "signals",
      title: "Mycelial Whispers",
      icon: "✦",
      layers: [
        { key: "seeds", label: "💚 Bloomed Seeds", active: showSeeds, toggle: () => setShowSeeds(v => !v) },
        { key: "heart-glow", label: "❤️ Heart Glow", active: showHeartGlow, toggle: () => setShowHeartGlow(v => !v), accent: "0, 65%, 55%" },
        { key: "birdsong", label: "🐦 Birdsong Heat", active: showBirdsongHeat, toggle: () => setShowBirdsongHeat(v => !v), extra: showBirdsongHeat ? `${birdsongHeatPoints.length} rec.` : "" },
        { key: "mycelial-network", label: "🕸️ Mycelial Network", active: showMycelialNetwork, toggle: () => setShowMycelialNetwork(v => !v), extra: showMycelialNetwork ? `${mycelialConnections.length}` : "off" },
        { key: "hive-layer", label: "🐝 Species Hives", active: showHiveLayer, toggle: () => setShowHiveLayer(v => !v), accent: "42, 70%, 55%" },
      ],
      subContent: showBirdsongHeat ? (
        <div className="pl-7 pt-1 flex flex-wrap gap-1">
          <p className="w-full text-[9px] font-serif mb-0.5" style={{ color: "hsl(200, 50%, 55%)" }}>Season</p>
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
      ) : undefined,
    },
    {
      key: "structures",
      title: "Grove Borders & Archives",
      icon: "🌿",
      layers: [
        { key: "groves", label: "🌿 Grove Boundaries", active: showGroves, toggle: () => setShowGroves(v => !v) },
        { key: "root-threads", label: "✦ Root Threads", active: showRootThreads, toggle: () => setShowRootThreads(v => !v) },
        { key: "research", label: "📜 Elder Archives", active: showResearchLayer, toggle: () => setShowResearchLayer(v => !v), extra: showResearchLayer ? (researchLoading ? "loading…" : researchTreeCount > 0 ? `${researchTreeCount}` : "—") : "1,020" },
        { key: "champion", label: "🏆 🇿🇦 Champion Trees", active: showResearchLayer, toggle: () => setShowResearchLayer(v => !v), extra: "DFFE" },
        { key: "rootstones", label: "🪨 Rootstones", active: showRootstones, toggle: () => setShowRootstones(v => !v), extra: showRootstones ? `${rootstoneCount}` : "198" },
        { key: "rootstones-trees", label: "🌳 Rootstone Trees", active: showRootstoneTrees, toggle: () => setShowRootstoneTrees(v => !v), extra: "33x3" },
        { key: "rootstones-groves", label: "🌲 Rootstone Groves", active: showRootstoneGroves, toggle: () => setShowRootstoneGroves(v => !v), extra: "33x3" },
        { key: "immutable", label: "🔱 Minted Sigils", active: showImmutableLayer, toggle: () => setShowImmutableLayer(v => !v), extra: showImmutableLayer ? (immutableLoading ? "loading…" : immutableTreeCount > 0 ? `${immutableTreeCount}` : "—") : "—" },
        { key: "external", label: "🗺️ Distant Groves", active: showExternalTrees, toggle: () => setShowExternalTrees(v => !v), extra: showExternalTrees ? (externalLoading ? "loading…" : externalTreeCount === -1 ? "zoom in" : externalTreeCount > 0 ? `${externalTreeCount}` : "—") : "sources" },
      ],
    },
    {
      key: "nature",
      title: "Nature & Waterways",
      icon: "🌊",
      accent: "hsl(200, 55%, 55%)",
      description: "Rivers, streams, and springs that shape the land.",
      layers: [
        { key: "waters", label: "🌊 Rivers & Waterways", active: showWaterways, toggle: () => { setShowWaterways(v => !v); if (!showWatersCommons) setShowWatersCommons(true); }, extra: showWatersCommons ? (watersCommonsLoading ? "loading…" : watersCommonsCount === -1 ? "zoom in" : watersCommonsCount > 0 ? `${watersCommonsCount}` : "—") : "OSM", accent: "200, 60%, 65%" },
        { key: "parklands", label: "🏛️ Parkland Elders", active: showWatersCommons, toggle: () => setShowWatersCommons(v => !v), accent: "145, 50%, 50%" },
        { key: "commons", label: "🌾 Commons & Greens", active: showWatersCommons, toggle: () => setShowWatersCommons(v => !v), accent: "75, 50%, 50%" },
      ],
    },
    {
      key: "walking",
      title: "Walking Network",
      icon: "🥾",
      accent: "hsl(130, 45%, 50%)",
      description: "Footpaths, bridleways, and trails across the land.",
      layers: [
        { key: "footpaths", label: "🥾 Footpaths & Paths", active: showFootpaths, toggle: () => { setShowFootpaths(v => !v); if (!showWatersCommons) setShowWatersCommons(true); }, accent: "130, 50%, 50%" },
      ],
    },
    {
      key: "knowledge",
      title: "Knowledge Places",
      icon: "📚",
      accent: "hsl(270, 45%, 55%)",
      description: "Libraries, bookshops, and botanical gardens — places where knowledge takes root.",
      layers: [
        { key: "libraries", label: "📚 Libraries", active: showLibraries, toggle: () => { setShowLibraries(v => !v); if (!showWatersCommons) setShowWatersCommons(true); }, accent: "270, 45%, 55%" },
        { key: "bookshops", label: "📖 Bookshops", active: showBookshops, toggle: () => { setShowBookshops(v => !v); if (!showWatersCommons) setShowWatersCommons(true); }, accent: "310, 40%, 55%" },
        { key: "botanical", label: "🌺 Botanical Gardens", active: showBotanicalGardens, toggle: () => { setShowBotanicalGardens(v => !v); if (!showWatersCommons) setShowWatersCommons(true); }, accent: "160, 50%, 50%" },
      ],
    },
    {
      key: "culture",
      title: "Culture & Heritage",
      icon: "⛪",
      accent: "hsl(35, 65%, 55%)",
      description: "Churches, castles, heritage buildings, and sacred places.",
      layers: [
        { key: "churchyards", label: "⛪ Churches & Sacred Sites", active: showChurchyards, toggle: () => { setShowChurchyards(v => !v); if (!showWatersCommons) setShowWatersCommons(true); }, accent: "35, 65%, 55%" },
        { key: "heritage", label: "🏛️ Heritage Buildings", active: showHeritage, toggle: () => { setShowHeritage(v => !v); if (!showWatersCommons) setShowWatersCommons(true); }, accent: "25, 55%, 55%" },
        { key: "castles", label: "🏰 Castles & Monuments", active: showCastles, toggle: () => { setShowCastles(v => !v); if (!showWatersCommons) setShowWatersCommons(true); }, accent: "0, 35%, 55%" },
      ],
    },
    {
      key: "wanderer",
      title: "Wanderer Activity",
      icon: "◎",
      accent: "hsl(260, 35%, 60%)",
      description: "Sense the presence of others — gently, like traces in a forest.",
      layers: [
        { key: "bloomed-seeds", label: "🌱 Bloomed Seeds", description: "Collectible seeds glowing on the map", active: showBloomedSeeds, toggle: () => setShowBloomedSeeds(v => !v), extra: showBloomedSeeds ? (bloomedSeedCount > 0 ? `${bloomedSeedCount}` : "—") : undefined, accent: "260, 55%, 70%" },
        { key: "recent-visits", label: "◎ Recent Visits", description: "Soft glows near recently visited trees", active: showRecentVisits, toggle: () => setShowRecentVisits(v => !v), accent: "260, 55%, 70%" },
        { key: "seed-traces", label: "✿ Seed & Offering Traces", description: "Subtle pulses that fade over time", active: showSeedTraces, toggle: () => setShowSeedTraces(v => !v), accent: "260, 55%, 70%" },
        { key: "seed-trail", label: "🌱 My Seed Trail", description: "Golden trail of seeds you planted today", active: showSeedTrail, toggle: () => setShowSeedTrail(v => !v), extra: showSeedTrail ? (seedTrailCount > 0 ? `${seedTrailCount}` : "—") : undefined, accent: "42, 80%, 60%" },
        { key: "shared-trees", label: "◐ Shared Trees", description: "Indicates others who visited the same tree", active: showSharedTrees, toggle: () => setShowSharedTrees(v => !v), accent: "260, 55%, 70%" },
        { key: "tribe-activity", label: "⊛ Tribe Activity", description: "Opt-in visibility for invited wanderers", active: showTribeActivity, toggle: () => setShowTribeActivity(v => !v), accent: "260, 55%, 70%" },
      ],
    },
    {
      key: "seasonal-lens",
      title: "🌿 Seasonal Lens",
      icon: "🌿",
      accent: activeLens ? `hsl(${({ spring: "340, 55%, 65%", summer: "45, 80%, 55%", autumn: "25, 70%, 55%", winter: "200, 55%, 60%" } as Record<string, string>)[activeLens] || "42, 50%, 55%"})` : "hsl(42, 50%, 55%)",
      description: "Harmonise the map with the Blooming Clock — highlight seasonal harvests, blooming trees, and council gatherings.",
      layers: (["spring", "summer", "autumn", "winter"] as const).map(season => ({
        key: `lens-${season}`,
        label: `${LENS_CONFIGS[season].emoji} ${LENS_CONFIGS[season].label}`,
        description: `Months ${LENS_CONFIGS[season].months.join(", ")} — ${season === "spring" ? "Blossom & planting" : season === "summer" ? "Fruiting & canopy" : season === "autumn" ? "Harvest & seed gathering" : "Rest & dormancy"}`,
        active: activeLens === season,
        toggle: () => setLens(activeLens === season ? null : season),
        accent: ({ spring: "340, 55%, 65%", summer: "45, 80%, 55%", autumn: "25, 70%, 55%", winter: "200, 55%, 60%" } as Record<string, string>)[season],
      })),
      subContent: activeLens && lensConfig ? (
        <div className="pl-7 pt-1 pb-1">
          <p className="text-[10px] font-serif" style={{ color: `hsl(${({ spring: "340, 55%, 65%", summer: "45, 80%, 55%", autumn: "25, 70%, 55%", winter: "200, 55%, 60%" } as Record<string, string>)[activeLens] || "42, 50%, 55%"})` }}>
            {lensConfig.emoji} Active — highlighting {activeLens} harvests, blooming trees & offerings
          </p>
        </div>
      ) : undefined,
    },
    {
      key: "blooming-clock",
      title: "🌸 Blooming Clock",
      icon: "🌸",
      accent: "hsl(340, 55%, 65%)",
      layers: [
        { key: "seasonal-foods", label: "🌸 Seasonal Foods", active: showBloomingClock, toggle: () => setShowBloomingClock(v => !v), accent: "340, 55%, 65%" },
        { key: "constellation", label: "🌾 Constellation Mode", active: bloomConstellationMode, toggle: () => { setBloomConstellationMode(v => !v); if (!showBloomingClock) setShowBloomingClock(true); }, accent: "42, 70%, 55%" },
      ],
      subContent: showBloomingClock ? (
        <div className="pt-2 flex flex-col items-center">
          <BloomingClockFace
            currentMonth={bloomMonth}
            onMonthChange={setBloomMonth}
            stageFilter={bloomStageFilter}
            onStageChange={setBloomStageFilter}
            foods={foodCycles}
            selectedFoodIds={selectedFoodIds}
            onFoodToggle={(id) => setSelectedFoodIds(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )}
            onFoodClear={() => setSelectedFoodIds([])}
          />
          <BloomingClockHivePanel monthOverride={bloomMonth} />
        </div>
      ) : undefined,
    },
  ], [showSeeds, showOfferingGlow, showAncientHighlight, showHarvestLayer, harvestTreeIds.size,
      showBirdsongHeat, birdsongHeatPoints.length, birdsongSeason,
      showMycelialNetwork, mycelialConnections.length,
      showGroves, showRootThreads, showResearchLayer, researchLoading, researchTreeCount,
      showRootstones, showRootstoneTrees, showRootstoneGroves, rootstoneCount,
      showImmutableLayer, immutableLoading, immutableTreeCount, showExternalTrees, externalLoading,
      externalTreeCount, showWatersCommons, watersCommonsLoading, showWaterways, showChurchyards, showFootpaths, showHeritage, showCastles,
      showLibraries, showBookshops, showBotanicalGardens,
      watersCommonsCount, showBloomedSeeds, bloomedSeedCount, showRecentVisits, showSeedTraces,
      showSeedTrail, seedTrailCount,
      showSharedTrees, showTribeActivity, showHiveLayer, showHeartGlow,
      activeLens, lensConfig, setLens,
      showBloomingClock, bloomConstellationMode, bloomStageFilter, selectedFoodIds, bloomMonth, foodCycles]);

  const offeringCountsRef = useRef(offeringCounts);
  offeringCountsRef.current = offeringCounts;
  const treePhotosRef = useRef(treePhotos);
  treePhotosRef.current = treePhotos;
  const birdsongCountsRef = useRef(birdsongCounts);
  birdsongCountsRef.current = birdsongCounts;

  // Whisper counts for map markers
  const { counts: whisperCountsMap } = useWhisperCounts();
  const whisperCountsRef = useRef(whisperCountsMap);
  whisperCountsRef.current = whisperCountsMap;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Use higher zoom on tall/mobile viewports so tiles fill the screen
    const isTall = window.innerHeight > window.innerWidth;
    const defaultZoom = isTall ? 3 : 2;

    const map = L.map(containerRef.current, {
      center: [25, 10],
      zoom: defaultZoom,
      minZoom: isTall ? 3 : 2,
      maxBounds: [[-85, -200], [85, 200]],
      maxBoundsViscosity: 0.8,
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
    // Robust invalidateSize — ensure container is fully laid out before sizing
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);
    // Also re-invalidate on window resize
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    const originalCleanup = () => window.removeEventListener('resize', onResize);

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

    // Restore MapMemory when no deep-link params — return to where user left off
    if (!deepLinked) {
      const memory = restoreMapMemory();
      if (memory) {
        setTimeout(() => map.setView([memory.lat, memory.lng], memory.zoom, { animate: true }), 300);
      }
    }

    // Save MapMemory on every moveend (debounced) + publish TEOTAG context
    let saveTimer: ReturnType<typeof setTimeout>;
    const onMoveEndSave = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const c = map.getCenter();
        const z = map.getZoom();
        saveMapMemory({ lat: c.lat, lng: c.lng, zoom: z });
        // Publish to TEOTAG context via custom event
        window.dispatchEvent(new CustomEvent("teotag-map-context", {
          detail: { center: { lat: c.lat, lng: c.lng }, zoom: z },
        }));
      }, 500);
    };
    map.on("moveend", onMoveEndSave);

    // Auto-locate on first load (skip if deep-linked or memory-restored)
    if (!deepLinked && !restoreMapMemory() && navigator.geolocation) {
      geo.locate("map-auto-init").then((result) => {
        if (result && mapRef.current) {
          const latlng: [number, number] = [result.lat, result.lng];
          setUserLatLng(latlng);
          setLocated(true);
          placeUserMarker(mapRef.current, latlng, result.accuracy);
        }
      });
    }

    return () => {
      clearTimeout(saveTimer);
      map.off("moveend", onMoveEndSave);
      originalCleanup();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      userMarkerRef.current = null;
      userAccuracyRef.current = null;
      focusHaloRef.current = null;
      focusFallbackMarkerRef.current = null;
      groveLayerRef.current = null;
      seedLayerRef.current = null;
      mycelialNetworkLayerRef.current = null;
      mycelialAnimatedLayerRef.current = null;
    };
  }, []);

  // Deep-link: auto-apply country/hive/species filters and zoom
  useEffect(() => {
    if (deepLinkAppliedRef.current === deepLinkSignature) return;
    const map = mapRef.current;
    if (!map) return;
    // Wait a tick for map to be ready
    const timer = setTimeout(() => {
      if (deepLinkAppliedRef.current === deepLinkSignature) return;
      deepLinkAppliedRef.current = deepLinkSignature;

      let label: string | null = null;

      // Country deep-link: zoom to bounding box with optional area highlight
      if (initialCountry) {
        const entry = getEntryBySlug(initialCountry);
        if (initialLat != null && initialLng != null) {
          map.flyTo(
            [initialLat, initialLng],
            initialZoom ?? 7,
            { animate: true, duration: initialJourney ? 1.8 : 1.2 },
          );
          label = `${entry?.flag || "🌍"} ${entry?.country || initialCountry}`;
          if (initialJourney) {
            setTimeout(() => onJourneyEnd?.(), 1800);
          } else {
            onJourneyEnd?.();
          }
        } else if (entry?.bbox) {
          const [south, west, north, east] = entry.bbox;
          const bounds: L.LatLngBoundsExpression = [[south, west], [north, east]];
          map.fitBounds(bounds, { padding: [20, 20], animate: true, duration: initialJourney ? 1.8 : 1.5 });
          label = `${entry.flag} ${entry.country}`;

          // Subtle area highlight rectangle — fades out after 4s
          if (initialJourney) {
            const rect = L.rectangle(bounds, {
              color: 'hsl(42, 80%, 55%)',
              weight: 1.5,
              fillColor: 'hsl(42, 80%, 55%)',
              fillOpacity: 0.06,
              opacity: 0.5,
              interactive: false,
            }).addTo(map);
            setTimeout(() => {
              try { map.removeLayer(rect); } catch {}
              onJourneyEnd?.();
            }, 4000);
          } else {
            onJourneyEnd?.();
          }
        }
      } else if (initialBbox) {
        // Generic bbox from URL params
        const parts = initialBbox.split(",").map(Number);
        if (parts.length === 4 && parts.every(n => !isNaN(n))) {
          const [south, west, north, east] = parts;
          map.fitBounds([[south, west], [north, east]], { padding: [20, 20], animate: true, duration: 1.5 });
          onJourneyEnd?.();
        }
      }

      // Hive deep-link: auto-apply species filter + fly to densest region
      if (initialHive) {
        const hive = getHiveBySlug(initialHive);
        if (hive) {
          const speciesNames = hive.representativeSpecies.slice(0, 10);
          if (speciesNames.length > 0) {
            setSpecies(speciesNames);
          }
          label = label ? `${label} · ${hive.displayName}` : `${hive.icon} ${hive.displayName}`;

          // If arriving from hive origin and no country set, find trees for this hive and fly to them
          if (initialOrigin === "hive" && !initialCountry && trees.length > 0) {
            const hiveTrees = trees.filter(t =>
              speciesNames.some(s => t.species.toLowerCase().includes(s.toLowerCase()))
            );
            if (hiveTrees.length > 0) {
              const bounds = L.latLngBounds(hiveTrees.map(t => [t.latitude, t.longitude] as [number, number]));
              map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8, animate: true, duration: 1.8 });
              setTimeout(() => onJourneyEnd?.(), 2000);
            }
          }
        }
      }

      // Species deep-link (from URL param, single species)
      const params = new URLSearchParams(window.location.search);
      if (!initialHive && trees.length > 0) {
        const speciesParam = params.get("species");
        if (speciesParam) {
          setSpecies([speciesParam]);
          label = label || `🌿 ${speciesParam}`;
        }
      }

      const rootstoneId = params.get("rootstoneId");
      const rootstoneCountry = params.get("rootstoneCountry");
      const rootstoneType = params.get("rootstoneType");
      const rootstoneTags = params.get("rootstoneTags");

      if (rootstoneId || rootstoneCountry || rootstoneType || rootstoneTags) {
        setShowRootstones(true);
        if (rootstoneCountry) setRootstoneCountryFilter(rootstoneCountry);
        if (rootstoneTags) setRootstoneTagFilter(rootstoneTags.split(",").filter(Boolean));
        if (rootstoneType === "tree") {
          setShowRootstoneTrees(true);
          setShowRootstoneGroves(false);
        } else if (rootstoneType === "grove") {
          setShowRootstoneTrees(false);
          setShowRootstoneGroves(true);
        }
      }

      if (rootstoneId) {
        const stone = getRootstoneById(rootstoneId);
        if (stone?.bounds) {
          map.fitBounds(
            [[stone.bounds.south, stone.bounds.west], [stone.bounds.north, stone.bounds.east]],
            { padding: [24, 24], animate: true, duration: 1.4 }
          );
        } else if (stone?.location.lat != null && stone.location.lng != null) {
          map.flyTo([stone.location.lat, stone.location.lng], 10, { duration: 1.2 });
        }
      }

      if (label) {
        setContextLabel(label);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [deepLinkSignature, initialCountry, initialHive, initialOrigin, trees.length, initialLat, initialLng, initialZoom, initialJourney, initialBbox, onJourneyEnd]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let active = true;
    const fallbackOrigin = (id: string, to: MycelialPoint): MycelialPoint => {
      const seed = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const angle = (seed % 360) * (Math.PI / 180);
      const radius = 0.16 + (seed % 13) * 0.01;
      return {
        lat: to.lat + Math.sin(angle) * radius,
        lng: to.lng + Math.cos(angle) * radius,
      };
    };
    (async () => {
      const recent = await fetchRecentWhisperConnections(200);
      if (!active || recent.length === 0) return;
      const mapped: MycelialConnection[] = recent
        .filter((item) => item.to != null)
        .map((item) => ({
          id: item.id,
          created_at: item.created_at,
          type: "whisper",
          from: item.from || fallbackOrigin(item.id, item.to as MycelialPoint),
          to: item.to as MycelialPoint,
          targetTreeId: item.target_tree_id,
        }));
      if (mapped.length > 0) {
        setMycelialConnections((prev) => [...mapped, ...prev].slice(0, 200));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const pulseTreeMarker = useCallback((treeId?: string) => {
    if (!treeId || !clusterRef.current) return;
    clusterRef.current.eachLayer((layer: any) => {
      if (layer?._treeId !== treeId) return;
      const el = layer?._icon as HTMLElement | undefined;
      if (!el) return;
      el.classList.add("mycelial-target-pulse");
      window.setTimeout(() => el.classList.remove("mycelial-target-pulse"), 1500);
    });
  }, []);

  const animateMycelialThread = useCallback((from: MycelialPoint, to: MycelialPoint) => {
    const map = mapRef.current;
    if (!map) return;
    if (!mycelialAnimatedLayerRef.current) {
      mycelialAnimatedLayerRef.current = L.layerGroup().addTo(map);
    }

    const line = L.polyline(
      [[from.lat, from.lng], [to.lat, to.lng]],
      {
        color: "hsl(178, 72%, 64%)",
        weight: 2.5,
        opacity: 0.9,
        dashArray: "7 10",
        dashOffset: "0",
        className: "mycelial-thread-animated",
        interactive: false,
      },
    ).addTo(mycelialAnimatedLayerRef.current);

    let frame = 0;
    const steps = 10;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = frame / steps;
      line.setStyle({
        opacity: Math.max(0.08, 0.9 - progress * 0.95),
        dashOffset: `${Math.round(progress * 90)}`,
      });
      if (frame >= steps) {
        window.clearInterval(timer);
        mycelialAnimatedLayerRef.current?.removeLayer(line);
      }
    }, 120);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const resolveToPoint = (event: MycelialThreadEvent): MycelialPoint | null => {
      if (event.to) return event.to;
      if (event.targetTreeId) {
        const target = treeLookup.get(event.targetTreeId);
        if (target) return target;
      }
      return null;
    };

    const resolveFromPoint = (event: MycelialThreadEvent): MycelialPoint => {
      if (event.from) return event.from;
      const c = map.getCenter();
      return { lat: c.lat, lng: c.lng };
    };

    const handleEvent = (event: MycelialThreadEvent) => {
      if (event.source !== "whisper") return;
      const to = resolveToPoint(event);
      if (!to) return;
      const from = resolveFromPoint(event);
      const connection: MycelialConnection = {
        id: event.id || `${event.createdAt || Date.now()}:${to.lat}:${to.lng}`,
        created_at: event.createdAt || new Date().toISOString(),
        type: "whisper",
        from,
        to,
        targetTreeId: event.targetTreeId,
      };
      setMycelialConnections((prev) => [connection, ...prev].slice(0, 200));
      if (!prefersReducedMotion) animateMycelialThread(from, to);
      pulseTreeMarker(event.targetTreeId);
    };

    const queued = consumeQueuedMycelialThreads();
    queued.forEach(handleEvent);
    return onMycelialThread(handleEvent);
  }, [animateMycelialThread, prefersReducedMotion, pulseTreeMarker, treeLookup]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (mycelialNetworkLayerRef.current) {
      map.removeLayer(mycelialNetworkLayerRef.current);
      mycelialNetworkLayerRef.current = null;
    }

    if (!showMycelialNetwork || mycelialConnections.length === 0) return;

    const layer = L.layerGroup().addTo(map);
    mycelialNetworkLayerRef.current = layer;

    const render = () => {
      layer.clearLayers();
      const bounds = map.getBounds().pad(0.25);
      let rendered = 0;
      for (const connection of mycelialConnections) {
        if (rendered >= 120) break;
        const fromIn = bounds.contains([connection.from.lat, connection.from.lng]);
        const toIn = bounds.contains([connection.to.lat, connection.to.lng]);
        if (!fromIn && !toIn) continue;
        L.polyline(
          [[connection.from.lat, connection.from.lng], [connection.to.lat, connection.to.lng]],
          {
            color: "hsl(178, 64%, 62%)",
            weight: 1.2,
            opacity: 0.2,
            dashArray: "3 9",
            interactive: false,
          },
        ).addTo(layer);
        rendered += 1;
      }
    };

    let redrawTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRender = () => {
      if (redrawTimer) clearTimeout(redrawTimer);
      redrawTimer = setTimeout(render, 180);
    };

    render();
    map.on("moveend", scheduleRender);
    map.on("zoomend", scheduleRender);

    return () => {
      map.off("moveend", scheduleRender);
      map.off("zoomend", scheduleRender);
      if (redrawTimer) clearTimeout(redrawTimer);
      if (map.hasLayer(layer)) map.removeLayer(layer);
    };
  }, [showMycelialNetwork, mycelialConnections]);

  // ── Event pulse rendering on map (gold shimmers at tree coords) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !groveViewActive) {
      if (eventPulseLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(eventPulseLayerRef.current);
        eventPulseLayerRef.current = null;
      }
      return;
    }

    if (!eventPulseLayerRef.current) {
      eventPulseLayerRef.current = L.layerGroup().addTo(map);
    }

    const layer = eventPulseLayerRef.current;
    layer.clearLayers();

    currentEventPulses.forEach(pulse => {
      const cssClass = pulse.type === "offering" ? "event-pulse-gold" : "event-pulse-heart";
      const icon = L.divIcon({
        className: "event-pulse-marker",
        html: `<div class="${cssClass}"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([pulse.lat, pulse.lng], { icon, interactive: false }).addTo(layer);
    });

    return () => {
      if (eventPulseLayerRef.current && map.hasLayer(eventPulseLayerRef.current)) {
        map.removeLayer(eventPulseLayerRef.current);
        eventPulseLayerRef.current = null;
      }
    };
  }, [groveViewActive, currentEventPulses]);

  // ── H3-like hex-binned wanderer presence heatmap ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showHeartGlow) {
      if (hexBinLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(hexBinLayerRef.current);
        hexBinLayerRef.current = null;
      }
      return;
    }

    const loadHexBins = async () => {
      // Fetch recent offering locations for density visualization
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("offerings")
        .select("tree_id")
        .gte("created_at", cutoff)
        .limit(500);

      if (!data || data.length === 0) return;

      // Resolve coordinates via tree lookup
      const points: { lat: number; lng: number }[] = [];
      for (const o of data) {
        const loc = treeLookup.get(o.tree_id);
        if (loc) points.push(loc);
      }

      if (points.length === 0) return;

      // Import computeHexBins
      const { computeHexBins } = await import("@/hooks/use-grove-events");
      const zoom = map.getZoom();
      const resolution = zoom >= 10 ? 0.05 : zoom >= 7 ? 0.2 : zoom >= 4 ? 0.5 : 2;
      const bins = computeHexBins(points, resolution);

      if (hexBinLayerRef.current) map.removeLayer(hexBinLayerRef.current);
      const hexLayer = L.layerGroup();

      bins.forEach(bin => {
        const radius = 8 + bin.intensity * 24;
        const opacity = 0.15 + bin.intensity * 0.45;
        const icon = L.divIcon({
          className: "hex-bin-marker",
          html: `<div style="
            width:${radius * 2}px;height:${radius * 2}px;border-radius:50%;
            background:radial-gradient(circle,hsla(42,80%,55%,${opacity}) 0%,hsla(42,70%,45%,${opacity * 0.3}) 60%,transparent 100%);
            box-shadow:0 0 ${radius}px hsla(42,80%,55%,${opacity * 0.4});
            transform:translate(-50%,-50%);
          "></div>`,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });
        L.marker([bin.lat, bin.lng], { icon, interactive: false }).addTo(hexLayer);
      });

      hexLayer.addTo(map);
      hexBinLayerRef.current = hexLayer;
    };

    loadHexBins();

    // Refresh on zoom/pan
    const onMove = () => loadHexBins();
    const debounced = (() => {
      let t: ReturnType<typeof setTimeout>;
      return () => { clearTimeout(t); t = setTimeout(onMove, 800); };
    })();
    map.on("moveend", debounced);

    return () => {
      map.off("moveend", debounced);
      if (hexBinLayerRef.current && map.hasLayer(hexBinLayerRef.current)) {
        map.removeLayer(hexBinLayerRef.current);
        hexBinLayerRef.current = null;
      }
    };
  }, [showHeartGlow, treeLookup]);

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
    const renderStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    // When filtering by lineage or tight grove scale, tighten clustering
    const isLineageFocused = lineageFilter !== "all";
    const isGroveFocused = groveScale !== "all";
    const tightCluster = isLineageFocused || isGroveFocused;
    const treeCount = filteredTrees.length;

    // Dynamically choose disableClusteringAtZoom based on visible tree count + context
    const disableZoom = groveScale === "hyper_local"
      ? 14
      : groveScale === "local"
      ? 15
      : tightCluster
      ? 16
      : treeCount <= 50
      ? 15   // Few trees — uncluster earlier for detail
      : treeCount <= 200
      ? 16
      : treeCount <= 500
      ? 17
      : 18;  // Many trees — keep clustered longer for performance

    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: (zoom: number) => {
        // Density-aware continuous curve with safe breakpoints
        // densityFactor smoothly scales with tree count via clamped log curve
        const df = Math.min(1.35, Math.max(0.7, 0.55 + Math.log10(Math.max(treeCount, 1)) * 0.25));

        if (groveScale === "hyper_local") {
          // Tight view — collapse quickly
          return zoom <= 12 ? 35 : zoom <= 14 ? 20 : 10;
        }
        if (groveScale === "local") {
          const base = zoom <= 8 ? 50 : zoom <= 10 ? 42 : zoom <= 12 ? 32 : zoom <= 14 ? 24 : zoom <= 16 ? 16 : 12;
          return Math.round(base * df);
        }
        if (tightCluster) {
          const base = zoom <= 4 ? 60 : zoom <= 6 ? 52 : zoom <= 8 ? 44 : zoom <= 10 ? 36 : zoom <= 12 ? 26 : zoom <= 14 ? 20 : zoom <= 16 ? 14 : 10;
          return Math.round(base * df);
        }

        // Default — smooth piecewise-linear curve with 2-zoom-level steps for stable transitions
        // Breakpoints: z2→80, z4→72, z6→62, z8→52, z10→42, z12→34, z14→26, z16→18, z18+→14
        const breakpoints: [number, number][] = [
          [2, 80], [4, 72], [6, 62], [8, 52], [10, 42], [12, 34], [14, 26], [16, 18], [18, 14],
        ];

        // Interpolate between breakpoints for smooth transitions (no popping)
        let base: number;
        if (zoom <= breakpoints[0][0]) {
          base = breakpoints[0][1];
        } else if (zoom >= breakpoints[breakpoints.length - 1][0]) {
          base = breakpoints[breakpoints.length - 1][1];
        } else {
          let lo = breakpoints[0], hi = breakpoints[breakpoints.length - 1];
          for (let i = 0; i < breakpoints.length - 1; i++) {
            if (zoom >= breakpoints[i][0] && zoom <= breakpoints[i + 1][0]) {
              lo = breakpoints[i];
              hi = breakpoints[i + 1];
              break;
            }
          }
          const t = (zoom - lo[0]) / (hi[0] - lo[0]);
          base = lo[1] + (hi[1] - lo[1]) * t;
        }

        return Math.round(base * df);
      },
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: disableZoom,
      chunkedLoading: true,
      chunkInterval: treeCount > 500 ? 100 : treeCount > 200 ? 80 : 50,
      chunkDelay: treeCount > 500 ? 12 : 8,
      spiderfyDistanceMultiplier: 2.0,
      spiderLegPolylineOptions: {
        weight: 1.5,
        color: tightCluster ? "hsla(120, 50%, 45%, 0.45)" : "hsla(42, 60%, 50%, 0.4)",
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

        // Species analysis for dominant-species tinting
        const speciesCounts: Record<string, number> = {};
        childMarkers.forEach((m: any) => {
          const sp = m._treeSpecies;
          if (sp) speciesCounts[sp] = (speciesCounts[sp] || 0) + 1;
        });
        const speciesEntries = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1]);
        const dominantSpecies = speciesEntries.length > 0 ? speciesEntries[0] : null;
        const speciesDiversity = speciesEntries.length;
        const isMonoSpecies = dominantSpecies && dominantSpecies[1] >= count * 0.7;

        // Lineage analysis for cluster labelling
        const lineageCounts: Record<string, number> = {};
        childMarkers.forEach((m: any) => {
          const lin = m._treeLineage;
          if (lin) lineageCounts[lin] = (lineageCounts[lin] || 0) + 1;
        });
        const lineageEntries = Object.entries(lineageCounts).sort((a, b) => b[1] - a[1]);
        const dominantLineage = lineageEntries.length > 0 ? lineageEntries[0] : null;
        const isMonoLineage = dominantLineage && dominantLineage[1] === count;

        // Grove tier — organic thresholds
        const groveTier = count >= 50
          ? "grove-ancient"     // 50+ = ancient grove
          : count >= 16
          ? "grove-flourishing"  // 16-49 = flourishing
          : count >= 6
          ? "grove-established"  // 6-15 = established
          : count >= 3
          ? "grove-small"        // 3-5 = small grove
          : "grove-seedling";    // 1-2 = seedling cluster
        const dim = count >= 50 ? 60 : count >= 16 ? 54 : count >= 6 ? 46 : count >= 3 ? 38 : 32;

        // Ring styling — species-focused, lineage, or tier-based
        let ringStyle = "";
        // Species-dominant tinting: warm hues per family
        if (isMonoSpecies && dominantSpecies) {
          const spLower = dominantSpecies[0].toLowerCase();
          if (spLower.includes("yew") || spLower.includes("taxus")) {
            ringStyle = "border-color:hsla(280,30%,40%,0.35);--grove-accent:280,30%,40%";
          } else if (spLower.includes("oak") || spLower.includes("quercus")) {
            ringStyle = "border-color:hsla(90,35%,35%,0.35);--grove-accent:90,35%,35%";
          } else if (spLower.includes("beech") || spLower.includes("fagus")) {
            ringStyle = "border-color:hsla(35,40%,38%,0.35);--grove-accent:35,40%,38%";
          } else if (spLower.includes("pine") || spLower.includes("pinus")) {
            ringStyle = "border-color:hsla(150,35%,30%,0.35);--grove-accent:150,35%,30%";
          } else if (spLower.includes("lime") || spLower.includes("tilia") || spLower.includes("linden")) {
            ringStyle = "border-color:hsla(80,40%,40%,0.35);--grove-accent:80,40%,40%";
          }
        }
        if (isLineageFocused && isMonoLineage) {
          ringStyle = "border-color:hsla(120,35%,40%,0.4);box-shadow:0 0 6px hsla(120,35%,40%,0.15)";
        } else if (hasAncient) {
          ringStyle += ";border-color:hsla(42,60%,50%,0.4);box-shadow:0 0 8px hsla(42,60%,50%,0.15)";
        } else if (hasMajorStory) {
          ringStyle += ";border-color:hsla(42,45%,45%,0.3);box-shadow:0 0 5px hsla(42,45%,45%,0.1)";
        }

        // Badge: ancient golden dot, species count, or lineage indicator
        let badge = "";
        if (hasAncient) {
          badge = `<span style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:hsl(42,95%,60%);border:1.5px solid hsl(30,15%,10%);"></span>`;
        } else if (speciesDiversity >= 3) {
          badge = `<span style="position:absolute;top:-4px;right:-4px;font-size:8px;line-height:1;opacity:0.7" title="${speciesDiversity} species">🌿</span>`;
        } else if (dominantLineage && dominantLineage[1] >= 3 && !isLineageFocused) {
          badge = `<span style="position:absolute;top:-4px;right:-4px;font-size:9px;line-height:1;" title="${dominantLineage[0]}">🌿</span>`;
        }

        // Whisper echo — count whispers in this grove cluster
        let groveWhisperCount = 0;
        childMarkers.forEach((m: any) => {
          groveWhisperCount += (m._whisperCount || 0);
        });

        // Mycelium thread ring for established+ groves
        const myceliumRing = count >= 6
          ? `<span class="grove-mycelium" style="border:1px dashed hsla(${isMonoSpecies && ringStyle.includes('--grove-accent') ? 'var(--grove-accent)' : '120,50%,40%'},0.25);"></span>`
          : "";

        // Grove label — species name for mono-species, or "Grove" for mixed
        const groveLabel = count >= 5
          ? isMonoSpecies && dominantSpecies
            ? `<span style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8px;font-family:'Cinzel',serif;color:hsl(42,50%,60%);text-shadow:0 1px 3px rgba(0,0,0,0.7);letter-spacing:0.04em;opacity:0.8;">${dominantSpecies[0].length > 14 ? dominantSpecies[0].slice(0, 12) + "…" : dominantSpecies[0]}</span>`
            : isMonoLineage && dominantLineage && count >= 8
            ? `<span style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8px;font-family:'Cinzel',serif;color:hsl(42,50%,60%);text-shadow:0 1px 3px rgba(0,0,0,0.7);letter-spacing:0.04em;opacity:0.8;">${dominantLineage[0].length > 14 ? dominantLineage[0].slice(0, 12) + "…" : dominantLineage[0]}</span>`
            : ""
          : "";

        const whisperEcho = groveWhisperCount > 0
          ? `<span style="position:absolute;bottom:${groveLabel ? -2 : -12}px;left:50%;transform:translateX(-50%);font-size:8px;color:hsla(200,40%,65%,0.7);white-space:nowrap;pointer-events:none;">🌬️ ${groveWhisperCount}</span>`
          : "";

        const groveGlowClass = groveWhisperCount > 0 ? ' whisper-glow' : '';

        return L.divIcon({
          html: `<div class="tree-cluster ${groveTier}${groveGlowClass}" style="${ringStyle};position:relative;">${count}${badge}${myceliumRing}${groveLabel}${whisperEcho}</div>`,
          className: "leaflet-tree-marker",
          iconSize: L.point(dim, dim + (groveLabel || whisperEcho ? 14 : 0)),
        });
      },
    });

    const currentOfferings = offeringCountsRef.current;
    const currentBirdsong = birdsongCountsRef.current;
    const currentWhispers = whisperCountsRef.current;

    filteredTrees.forEach((tree) => {
      const offerings = currentOfferings[tree.id] || 0;
      const age = tree.estimated_age || 0;
      const bCount = currentBirdsong[tree.id] || 0;
      const tier = getTreeTier(age, offerings);
      const hiveHue = showHiveLayer ? (() => {
        const h = getHiveForSpecies(tree.species);
        return h ? hslStringToHue(h.accentHsl) : undefined;
      })() : undefined;
      const icon = getOrCreateIcon(tier, tree.species, bCount, hiveHue);
      const wCount = currentWhispers[tree.id] || 0;

      const marker = L.marker([tree.latitude, tree.longitude], { icon });
      // If tree has whispers, add a subtle glow class to marker element after add
      if (wCount > 0) {
        marker.on('add', () => {
          const el = (marker as any)._icon;
          if (el) el.classList.add('whisper-glow');
        });
      }
      // Attach metadata for cluster analysis and tree focus
      (marker as any)._treeLineage = (tree as any).lineage || null;
      (marker as any)._treeSpecies = tree.species || null;
      (marker as any)._treeId = tree.id;
      (marker as any)._treeName = tree.name;
      (marker as any)._whisperCount = wCount;
      marker.bindPopup(() => buildPopupHtml(tree, currentOfferings[tree.id] || 0, age, treePhotosRef.current[tree.id], currentBirdsong[tree.id] || 0, whisperCountsRef.current[tree.id] || 0), {
        className: "atlas-leaflet-popup",
        maxWidth: 280,
        closeButton: true,
        autoPanPadding: L.point(20, 60),
      });
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterRef.current = clusterGroup;
    const renderMetricsTimer =
      typeof window !== "undefined"
        ? window.setTimeout(() => {
            if (!debugEnabled) return;
            const markerCount = typeof clusterGroup.getLayers === "function" ? clusterGroup.getLayers().length : treeCount;
            const clusterCount = containerRef.current?.querySelectorAll(".tree-cluster").length ?? 0;
            const renderEndedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
            const renderMs = Number((renderEndedAt - renderStartedAt).toFixed(2));
            console.info(
              `[MapPerf] Leaflet render ${renderMs}ms | markers=${markerCount} | clusters=${clusterCount}`,
            );
            setPerfDebug((prev) => ({
              ...prev,
              markerCount,
              clusterCount,
              renderMs,
              lastRenderAt: new Date().toISOString(),
            }));
          }, 80)
        : 0;

    // ── Per-geo-spiderfy preload with jitter prevention ──
    // Cache last computed state to skip redundant recalculations during rapid zoom
    const lastSpiderfyState = { zoom: -1, densityBand: -1, disableZoom: -1, timerHandle: 0 as any };

    const computeDensityBand = (count: number): number =>
      count > 200 ? 4 : count > 80 ? 3 : count > 30 ? 2 : 1;

    const applyClusteringUpdate = (z: number, visibleCount: number, densityBand: number) => {
      const opts = (clusterGroup as any).options;

      // Spiderfy distance — ramp with zoom but cap at 2.8 to prevent extreme spread
      const MAX_SPIDERFY = 2.8;
      const rawSpiderfy = z >= 18 ? 3.0 : z >= 16 ? 2.5 : z >= 14 ? 2.2 : 2.0;
      opts.spiderfyDistanceMultiplier = Math.min(rawSpiderfy, MAX_SPIDERFY);

      // Density-aware uncluster threshold
      const newDisable = densityBand >= 4 ? 18 : densityBand >= 3 ? 17 : densityBand >= 2 ? 16 : 15;

      if (opts.disableClusteringAtZoom !== newDisable) {
        opts.disableClusteringAtZoom = newDisable;
        lastSpiderfyState.disableZoom = newDisable;
        // Lightweight re-process by toggling layer
        map.removeLayer(clusterGroup);
        map.addLayer(clusterGroup);
      }

      // Adjust chunked loading params for current density
      opts.chunkInterval = visibleCount > 300 ? 120 : visibleCount > 100 ? 80 : 50;
      opts.chunkDelay = visibleCount > 300 ? 14 : visibleCount > 100 ? 10 : 6;

      lastSpiderfyState.zoom = z;
      lastSpiderfyState.densityBand = densityBand;
    };

    const adjustClusteringOnZoom = () => {
      const z = map.getZoom();

      // Quick bail-out: if zoom hasn't changed, skip expensive viewport scan
      // (moveend without zoom change only matters if density might shift significantly)
      const zoomChanged = Math.abs(z - lastSpiderfyState.zoom) >= 0.5;

      // Debounce rapid zooms — cancel any pending update, schedule a new one
      if (lastSpiderfyState.timerHandle) {
        clearTimeout(lastSpiderfyState.timerHandle);
        lastSpiderfyState.timerHandle = 0;
      }

      // For rapid zoom sequences, defer the heavy work by 120ms
      // This prevents jitter from repeated cluster toggling mid-animation
      const delay = zoomChanged ? 120 : 200;

      lastSpiderfyState.timerHandle = setTimeout(() => {
        lastSpiderfyState.timerHandle = 0;
        const currentZ = map.getZoom();
        const bounds = map.getBounds();
        let visibleCount = 0;
        filteredTrees.forEach(t => {
          if (bounds.contains([t.latitude, t.longitude])) visibleCount++;
        });
        const band = computeDensityBand(visibleCount);

        // Skip if nothing meaningful changed (same zoom band + same density band)
        const zoomBand = Math.floor(currentZ);
        const prevZoomBand = Math.floor(lastSpiderfyState.zoom);
        if (zoomBand === prevZoomBand && band === lastSpiderfyState.densityBand) return;

        applyClusteringUpdate(currentZ, visibleCount, band);
      }, delay);
    };

    map.on("zoomend", adjustClusteringOnZoom);
    map.on("moveend", adjustClusteringOnZoom);
    // Initial calculation — run immediately without debounce
    const bounds0 = map.getBounds();
    let vc0 = 0;
    filteredTrees.forEach(t => { if (bounds0.contains([t.latitude, t.longitude])) vc0++; });
    applyClusteringUpdate(map.getZoom(), vc0, computeDensityBand(vc0));

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
        } else {
          const bounds = L.latLngBounds(filteredTrees.map((t) => [t.latitude, t.longitude]));
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5, animate: true, duration: 0.8 });
        }
      } else {
        const bounds = L.latLngBounds(filteredTrees.map((t) => [t.latitude, t.longitude]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5, animate: true, duration: 0.8 });
      }
    }

    return () => {
      map.off("zoomend", adjustClusteringOnZoom);
      map.off("moveend", adjustClusteringOnZoom);
      if (lastSpiderfyState.timerHandle) {
        clearTimeout(lastSpiderfyState.timerHandle);
      }
      if (renderMetricsTimer) {
        window.clearTimeout(renderMetricsTimer);
      }
    };
  }, [filteredTrees, userLatLng, lineageFilter, groveScale, showHiveLayer, debugEnabled]);

  // ── Focus on a specific tree when navigated via "View on Map" ──
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster || !initialTreeId) return;
    const focusKey = `${initialTreeId}:${initialZoom ?? ""}:${initialJourney ? "1" : "0"}`;
    if (focusHandledRef.current === focusKey) return;
    if (trees.length === 0) return;

    const clearFallbackMarker = () => {
      if (focusFallbackMarkerRef.current) {
        map.removeLayer(focusFallbackMarkerRef.current);
        focusFallbackMarkerRef.current = null;
      }
    };

    const showDetachedFocus = (
      lat: number,
      lng: number,
      treeName: string,
      treeSpecies?: string | null,
    ) => {
      clearFallbackMarker();

      const targetLatLng = L.latLng(lat, lng);
      map.flyTo(targetLatLng, Math.max(initialZoom ?? 17, 16), {
        duration: initialJourney ? 1.2 : 0.9,
        easeLinearity: 0.35,
      });

      const popupHtml = `<div style="font-family:'Cinzel',serif;min-width:190px;padding:10px 12px;text-align:center">
        <div style="font-size:13px;color:hsl(42,80%,60%);margin-bottom:3px">${escapeHtml(treeName || "Tree")}</div>
        ${treeSpecies ? `<div style="font-size:11px;color:hsl(120,30%,60%);margin-bottom:6px">${escapeHtml(treeSpecies)}</div>` : ""}
        <div style="font-size:10px;color:hsl(42,18%,72%)">Focused from deep link</div>
      </div>`;

      const marker = L.marker(targetLatLng, { zIndexOffset: 900 }).addTo(map);
      marker.bindPopup(popupHtml, { className: "atlas-leaflet-popup", maxWidth: 250 }).openPopup();
      focusFallbackMarkerRef.current = marker;

      setTimeout(() => {
        if (focusFallbackMarkerRef.current === marker) {
          map.removeLayer(marker);
          focusFallbackMarkerRef.current = null;
        }
      }, 8000);

      onJourneyEnd?.();
    };

    // Find target tree from loaded in-memory dataset first.
    const targetTree = trees.find((tree) => tree.id === initialTreeId);
    if (!targetTree) {
      // Fallback: fetch by tree ID so deep links still work even if current dataset is partial.
      if (focusFetchAttemptRef.current === focusKey) return;
      focusFetchAttemptRef.current = focusKey;

      void (async () => {
        const { data, error } = await supabase
          .from("trees")
          .select("id,name,species,latitude,longitude")
          .eq("id", initialTreeId)
          .maybeSingle();
        if (error || !data || data.latitude == null || data.longitude == null) return;
        if (focusHandledRef.current === focusKey) return;
        focusHandledRef.current = focusKey;
        showDetachedFocus(data.latitude, data.longitude, data.name, data.species);
      })();
      return;
    }

    focusHandledRef.current = focusKey;
    const targetLatLng = L.latLng(targetTree.latitude, targetTree.longitude);

    // Find the rendered marker in the cluster group.
    let targetMarker: L.Marker | null = null;
    cluster.eachLayer((layer: any) => {
      if (layer?._treeId === initialTreeId) {
        targetMarker = layer as L.Marker;
      }
    });

    // Marker may be filtered out. Keep focus behavior by dropping a temporary marker.
    if (!targetMarker) {
      showDetachedFocus(targetTree.latitude, targetTree.longitude, targetTree.name, targetTree.species);
      return;
    }

    // --- Multi-stage ceremonial journey ---
    const targetZoom = Math.max(initialZoom ?? 17, 17);
    const currentZoom = map.getZoom();
    const useJourney = initialJourney && currentZoom < 10;

    if (useJourney) {
      // Stage 1: Regional context (zoom ~9)
      const regionalZoom = Math.min(9, Math.floor((currentZoom + targetZoom) / 2.5));
      map.flyTo(targetLatLng, regionalZoom, {
        duration: 0.8,
        easeLinearity: 0.35,
      });
      
      const onRegionalEnd = () => {
        map.off('moveend', onRegionalEnd);
        // Stage 2: Final descent to tree
        setTimeout(() => {
          map.flyTo(targetLatLng, targetZoom, {
            duration: 0.9,
            easeLinearity: 0.3,
          });

          const onFinalEnd = () => {
            map.off('moveend', onFinalEnd);
            finishTreeFocus(map, cluster, targetMarker!, targetTree);
            onJourneyEnd?.();
          };
          setTimeout(() => map.once('moveend', onFinalEnd), 80);
        }, 150);
      };
      setTimeout(() => map.once('moveend', onRegionalEnd), 80);
    } else {
      // Standard single flyTo
      map.flyTo(targetLatLng, targetZoom, {
        duration: 1.2,
        easeLinearity: 0.4,
      });

      const onFlyEnd = () => {
        map.off('moveend', onFlyEnd);
        finishTreeFocus(map, cluster, targetMarker!, targetTree);
        onJourneyEnd?.();
      };
      setTimeout(() => map.once('moveend', onFlyEnd), 100);
    }

    function finishTreeFocus(map: L.Map, cluster: any, marker: L.Marker, tree: Tree) {
      // Expand cluster if needed
      const visibleParent = cluster.getVisibleParent(marker);
      if (visibleParent && visibleParent !== marker) {
        cluster.zoomToShowLayer(marker, () => {
          showHighlight(map, marker, tree.name);
        });
      } else {
        showHighlight(map, marker, tree.name);
      }
    }

    function showHighlight(map: L.Map, marker: L.Marker, treeName: string) {
      // Center precisely on the marker
      map.panTo(marker.getLatLng(), { animate: true, duration: 0.4 });

      // Add a pulsing halo
      const haloEl = document.createElement('div');
      haloEl.style.position = 'relative';
      haloEl.style.width = '40px';
      haloEl.style.height = '40px';
      const halo1 = document.createElement('div');
      halo1.className = 'tree-focus-halo';
      haloEl.appendChild(halo1);

      const halo2 = document.createElement('div');
      halo2.className = 'tree-focus-halo';
      halo2.style.animationDelay = '0.4s';
      haloEl.appendChild(halo2);

      const halo3 = document.createElement('div');
      halo3.className = 'tree-focus-halo';
      halo3.style.animationDelay = '0.8s';
      haloEl.appendChild(halo3);

      const label = document.createElement('div');
      label.className = 'tree-focus-label';
      label.textContent = treeName;
      haloEl.appendChild(label);

      const haloIcon = L.divIcon({
        className: 'leaflet-tree-marker',
        html: haloEl.innerHTML,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Remove previous halo if any
      if (focusHaloRef.current) {
        map.removeLayer(focusHaloRef.current);
      }
      clearFallbackMarker();

      const haloMarker = L.marker(marker.getLatLng(), {
        icon: haloIcon,
        interactive: false,
        zIndexOffset: -10,
      }).addTo(map);
      focusHaloRef.current = haloMarker;

      // Open the popup after a brief pause
      setTimeout(() => {
        marker.openPopup();
      }, 600);

      // Remove halo after 3 seconds
      setTimeout(() => {
        if (focusHaloRef.current) {
          map.removeLayer(focusHaloRef.current);
          focusHaloRef.current = null;
        }
      }, 3000);
    }
  }, [filteredTrees, trees, initialTreeId, initialZoom, initialJourney, onJourneyEnd]);

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

    // Viewport-cull: only group trees visible on screen
    const visible = getVisibleTrees(map, filteredTrees, 0.3);
    const bySpecies: Record<string, Tree[]> = {};
    visible.forEach((t) => {
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
  // Viewport-culled + O(n²) capped to prevent jank with large datasets
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (rootThreadLayerRef.current) {
      map.removeLayer(rootThreadLayerRef.current);
      rootThreadLayerRef.current = null;
    }

    if (!showRootThreads || filteredTrees.length < 2) return;

    const threadLayer = L.layerGroup();

    // Only draw threads for trees visible in the viewport (+ padding)
    const visible = getVisibleTrees(map, filteredTrees, 0.2);
    if (visible.length < 2 || visible.length > 400) {
      // Too many — skip to keep panning smooth
      threadLayer.addTo(map);
      rootThreadLayerRef.current = threadLayer;
      return;
    }

    const bySpecies: Record<string, Tree[]> = {};
    visible.forEach((t) => {
      const key = t.species.toLowerCase();
      if (!bySpecies[key]) bySpecies[key] = [];
      bySpecies[key].push(t);
    });

    const MAX_DIST_KM = 80;
    const drawn = new Set<string>();
    const MAX_THREADS = 300; // hard cap for performance
    let threadCount = 0;

    Object.entries(bySpecies).forEach(([, group]) => {
      if (group.length < 2 || threadCount >= MAX_THREADS) return;

      for (let i = 0; i < group.length && threadCount < MAX_THREADS; i++) {
        for (let j = i + 1; j < group.length && threadCount < MAX_THREADS; j++) {
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
          threadCount++;
        }
      }
    });

    threadLayer.addTo(map);
    rootThreadLayerRef.current = threadLayer;

    return () => {
      if (map.hasLayer(threadLayer)) map.removeLayer(threadLayer);
    };
  }, [filteredTrees, showRootThreads]);

  // Offering glow layer — viewport-culled for performance
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

    // Only render glow for trees visible in viewport
    const visible = getVisibleTrees(map, filteredTrees, 0.05);

    visible.forEach((tree) => {
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

  // Fetch harvest tree IDs for the harvest layer
  useEffect(() => {
    if (!showHarvestLayer) return;
    const fetchHarvestTrees = async () => {
      const { data } = await supabase
        .from("harvest_listings")
        .select("tree_id")
        .not("tree_id", "is", null)
        .in("status", ["available", "upcoming"]);
      if (data) {
        setHarvestTreeIds(new Set(data.map(d => d.tree_id).filter(Boolean) as string[]));
      }
    };
    fetchHarvestTrees();
  }, [showHarvestLayer]);

  // Harvest layer — 🍎 badges on trees with active harvest listings
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (harvestLayerRef.current) {
      map.removeLayer(harvestLayerRef.current);
      harvestLayerRef.current = null;
    }

    if (!showHarvestLayer || harvestTreeIds.size === 0) return;

    const layer = L.layerGroup();
    const visible = getVisibleTrees(map, filteredTrees, 0.05);

    visible.forEach((tree) => {
      if (!harvestTreeIds.has(tree.id)) return;

      // Warm glow ring
      L.circleMarker([tree.latitude, tree.longitude], {
        radius: 18,
        color: "hsl(25, 75%, 50%)",
        fillColor: "hsl(30, 80%, 55%)",
        fillOpacity: 0.2,
        weight: 1.5,
        opacity: 0.5,
        interactive: false,
        className: "harvest-glow",
      }).addTo(layer);

      // Harvest badge
      const badgeIcon = L.divIcon({
        html: `<span style="
          background: hsl(25, 70%, 45%);
          color: hsl(45, 95%, 90%);
          font-size: 11px;
          border-radius: 50%;
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 8px hsla(25, 80%, 50%, 0.5);
          pointer-events: none;
        ">🍎</span>`,
        className: "harvest-badge",
        iconSize: L.point(22, 22),
        iconAnchor: L.point(11, -6),
      });
      L.marker([tree.latitude, tree.longitude], { icon: badgeIcon, interactive: false }).addTo(layer);
    });

    layer.addTo(map);
    harvestLayerRef.current = layer;

    return () => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    };
  }, [filteredTrees, showHarvestLayer, harvestTreeIds]);

  // Ancient tree highlight layer — golden pulse ring around ancient-tier trees
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (ancientHighlightLayerRef.current) {
      map.removeLayer(ancientHighlightLayerRef.current);
      ancientHighlightLayerRef.current = null;
    }

    if (!showAncientHighlight) return;

    const layer = L.layerGroup();
    const currentOfferings = offeringCountsRef.current;
    const visible = getVisibleTrees(map, filteredTrees, 0.05);

    visible.forEach((tree) => {
      const age = tree.estimated_age || 0;
      const offerings = currentOfferings[tree.id] || 0;
      const tier = getTreeTier(age, offerings);

      if (tier !== "ancient") return;

      // Outer golden pulse ring
      L.circleMarker([tree.latitude, tree.longitude], {
        radius: 24,
        color: "hsl(42, 90%, 55%)",
        fillColor: "hsl(42, 85%, 60%)",
        fillOpacity: 0.15,
        weight: 2,
        opacity: 0.6,
        interactive: false,
        className: "ancient-highlight-outer",
      }).addTo(layer);

      // Inner ring
      L.circleMarker([tree.latitude, tree.longitude], {
        radius: 16,
        color: "hsl(42, 80%, 50%)",
        fillColor: "hsl(42, 90%, 65%)",
        fillOpacity: 0.25,
        weight: 1.5,
        opacity: 0.7,
        interactive: false,
        className: "ancient-highlight-inner",
      }).addTo(layer);

      // Crown badge
      const crownIcon = L.divIcon({
        html: `<span style="
          font-size: 13px;
          filter: drop-shadow(0 0 4px hsla(42, 90%, 55%, 0.7));
          pointer-events: none;
        ">👑</span>`,
        className: "ancient-crown-badge",
        iconSize: L.point(18, 18),
        iconAnchor: L.point(9, 28),
      });
      L.marker([tree.latitude, tree.longitude], { icon: crownIcon, interactive: false }).addTo(layer);
    });

    layer.addTo(map);
    ancientHighlightLayerRef.current = layer;

    return () => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    };
  }, [filteredTrees, showAncientHighlight]);

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

    // Use a cluster group for external trees to prevent DOM overload
    const extCluster = (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      disableClusteringAtZoom: 17,
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 10,
      animateAddingMarkers: false,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        const dim = count >= 20 ? 36 : count >= 5 ? 30 : 24;
        return L.divIcon({
          html: `<div style="width:${dim}px;height:${dim}px;border-radius:50%;background:hsla(180,50%,35%,0.85);border:2px solid hsl(180,40%,25%);color:hsl(180,80%,85%);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:monospace;box-shadow:0 0 8px hsla(180,60%,50%,0.3);">${count}</div>`,
          className: "leaflet-tree-marker",
          iconSize: L.point(dim, dim),
        });
      },
    });
    extCluster.addTo(map);
    externalLayerRef.current = extCluster;

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
        extCluster.clearLayers();
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
      extCluster.clearLayers();

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
        extCluster.addLayer(marker);
      });
    };

    const onMoveEnd = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadTrees, 1000); // longer debounce to reduce Overpass load
    };

    map.on("moveend", onMoveEnd);
    loadTrees();

    return () => {
      clearTimeout(debounceTimer);
      map.off("moveend", onMoveEnd);
      if (externalAbortRef.current) externalAbortRef.current.abort();
      if (map.hasLayer(extCluster)) map.removeLayer(extCluster);
    };
  }, [showExternalTrees, filteredTrees]);

  // Research Layer — DFFE Champion Trees from Supabase
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (researchLayerRef.current) {
      map.removeLayer(researchLayerRef.current);
      researchLayerRef.current = null;
    }

    if (!showResearchLayer) {
      setResearchTreeCount(0);
      return;
    }

    const researchCluster = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 14,
      chunkedLoading: true,
      animateAddingMarkers: false,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        const dim = count >= 10 ? 40 : count >= 5 ? 34 : 28;
        return L.divIcon({
          html: `<div style="width:${dim}px;height:${dim}px;border-radius:50%;background:hsla(35,40%,18%,0.9);border:2px solid hsl(35,60%,45%);color:hsl(35,70%,65%);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;box-shadow:0 0 10px hsla(35,70%,50%,0.3);"><span style="font-size:8px;margin-right:2px;">📜</span>${count}</div>`,
          className: "leaflet-tree-marker",
          iconSize: L.point(dim, dim),
        });
      },
    });
    researchCluster.addTo(map);
    researchLayerRef.current = researchCluster;

    setResearchLoading(true);

    (async () => {
      const countryName = initialCountry ? getEntryBySlug(initialCountry)?.country : null;
      let query = supabase
        .from('research_trees')
        .select('id,species_scientific,species_common,tree_name,locality_text,province,latitude,longitude,geo_precision,description,height_m,girth_or_stem,crown_spread,designation_type,source_doc_title,source_doc_url,source_doc_year,source_program,status,country')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5000);

      if (countryName) {
        query = query.eq('country', countryName);
      }

      const { data, error } = await query;

      setResearchLoading(false);

      if (error || !data) {
        console.warn('[ResearchLayer] fetch error:', error?.message);
        return;
      }

      setResearchTreeCount(data.length);

      data.forEach((rt: any) => {
        const sz = 16;
        const half = sz / 2;
        const precColor = rt.geo_precision === 'exact' ? 'hsl(120,50%,45%)' : rt.geo_precision === 'approx' ? 'hsl(35,70%,50%)' : 'hsl(0,50%,50%)';

        const icon = L.divIcon({
          className: 'research-marker',
          html: `<div class="research-dot" style="width:${sz}px;height:${sz}px;background:hsla(35,50%,25%,0.85);border:2.5px solid hsl(35,65%,50%);box-shadow:0 0 8px hsla(35,70%,50%,0.4);position:relative;">
            <span style="position:absolute;top:-3px;right:-3px;width:5px;height:5px;border-radius:50%;background:${precColor};border:1px solid hsl(25,18%,10%);"></span>
          </div>`,
          iconSize: [sz, sz],
          iconAnchor: [half, half],
        });

        const marker = L.marker([rt.latitude, rt.longitude], { icon });
        marker.bindPopup(() => buildResearchPopupHtml(rt as ResearchTree), {
          className: 'atlas-leaflet-popup',
          closeButton: true,
          maxWidth: 280,
          offset: L.point(0, -4),
        });
        researchCluster.addLayer(marker);
      });
    })();

    return () => {
      if (map.hasLayer(researchCluster)) map.removeLayer(researchCluster);
    };
  }, [showResearchLayer, initialCountry]);

  // Rootstones layer — notable trees + groves by country
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (rootstoneLayerRef.current) {
      map.removeLayer(rootstoneLayerRef.current);
      rootstoneLayerRef.current = null;
    }

    if (!showRootstones) {
      setRootstoneCount(0);
      return;
    }

    const layer = L.layerGroup().addTo(map);
    rootstoneLayerRef.current = layer;

    const normalizedCountry = rootstoneCountryFilter?.toLowerCase();
    const visible = ALL_ROOTSTONES.filter((stone) => {
      if (normalizedCountry && !stone.country.toLowerCase().includes(normalizedCountry.replace("-", " "))) return false;
      if (rootstoneTagFilter.length > 0 && !rootstoneTagFilter.every((tag) => stone.tags.includes(tag))) return false;
      if (stone.type === "tree" && !showRootstoneTrees) return false;
      if (stone.type === "grove" && !showRootstoneGroves) return false;
      return true;
    });

    setRootstoneCount(visible.length);

    visible.forEach((stone) => {
      if (stone.location.lat == null || stone.location.lng == null) return;

      const isTree = stone.type === "tree";
      const size = isTree ? 15 : 18;
      const color = isTree ? "hsl(145,65%,45%)" : "hsl(210,70%,55%)";
      const border = isTree ? "hsl(145,55%,30%)" : "hsl(210,60%,35%)";
      const glyph = isTree ? "T" : "G";
      const icon = L.divIcon({
        className: "rootstone-marker",
        html: `<div style="width:${size}px;height:${size}px;border-radius:${isTree ? "50%" : "4px"};background:${color};border:2px solid ${border};box-shadow:0 0 10px ${color}66;display:flex;align-items:center;justify-content:center;color:#fff;font-size:8px;font-weight:700;font-family:sans-serif;">${glyph}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([stone.location.lat, stone.location.lng], { icon });
      marker.bindPopup(() => buildRootstonePopupHtml(stone), {
        className: "atlas-leaflet-popup",
        closeButton: true,
        maxWidth: 280,
        offset: L.point(0, -4),
      });
      layer.addLayer(marker);

      if (stone.bounds) {
        const rect = L.rectangle(
          [[stone.bounds.south, stone.bounds.west], [stone.bounds.north, stone.bounds.east]],
          {
            color: isTree ? "hsl(145,55%,40%)" : "hsl(210,70%,55%)",
            weight: 1,
            fillOpacity: 0.04,
            opacity: 0.5,
          },
        );
        layer.addLayer(rect);
      }
    });

    return () => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    };
  }, [showRootstones, showRootstoneTrees, showRootstoneGroves, rootstoneCountryFilter, rootstoneTagFilter]);

  // ── Immutable Ancient Friends layer ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (immutableLayerRef.current) {
      map.removeLayer(immutableLayerRef.current);
      immutableLayerRef.current = null;
    }

    if (!showImmutableLayer) {
      setImmutableTreeCount(0);
      return;
    }

    const immutableCluster = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 14,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        const dim = count >= 10 ? 42 : count >= 5 ? 36 : 30;
        return L.divIcon({
          html: `<div style="width:${dim}px;height:${dim}px;border-radius:50%;background:hsla(42,30%,12%,0.95);border:2.5px solid hsl(42,80%,50%);color:hsl(42,80%,60%);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;box-shadow:0 0 14px hsla(42,80%,50%,0.4);"><span style="font-size:8px;margin-right:2px;">🔱</span>${count}</div>`,
          className: "leaflet-tree-marker",
          iconSize: L.point(dim, dim),
        });
      },
    });
    immutableCluster.addTo(map);
    immutableLayerRef.current = immutableCluster;

    setImmutableLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('research_trees')
        .select('id,species_scientific,species_common,tree_name,locality_text,province,latitude,longitude,geo_precision,description,height_m,girth_or_stem,crown_spread,designation_type,source_doc_title,source_doc_url,source_doc_year,source_program,status,record_status,immutable_record_id,anchored_at,metadata_hash')
        .eq('record_status', 'immutable')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5000);

      setImmutableLoading(false);

      if (error || !data) {
        console.warn('[ImmutableLayer] fetch error:', error?.message);
        return;
      }

      setImmutableTreeCount(data.length);

      data.forEach((rt: any) => {
        const sz = 22;
        const half = sz / 2;

        const icon = L.divIcon({
          className: 'research-marker',
          html: `<div style="width:${sz}px;height:${sz}px;background:hsla(42,30%,15%,0.95);border:3px solid hsl(42,80%,50%);border-radius:50%;box-shadow:0 0 12px hsla(42,80%,50%,0.5),0 0 24px hsla(42,80%,50%,0.2);position:relative;animation:markerBreathe 4s ease-in-out infinite;">
            <span style="position:absolute;top:-5px;right:-5px;font-size:9px;">🔱</span>
          </div>`,
          iconSize: [sz, sz],
          iconAnchor: [half, half],
        });

        const name = rt.tree_name || rt.species_common || rt.species_scientific;
        const anchorDate = rt.anchored_at ? new Date(rt.anchored_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

        const popupHtml = `<div style="padding:0;font-family:'Cinzel',serif;width:260px;background:hsl(25,18%,10%);border-radius:12px;border:1.5px solid hsla(42,80%,50%,0.5);overflow:hidden;">
          <div style="padding:10px 14px 6px;background:linear-gradient(135deg,hsla(42,50%,30%,0.2),hsla(42,60%,20%,0.05));">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:16px;">🔱</span>
              <span style="font-size:9px;font-family:sans-serif;padding:2px 6px;border-radius:4px;background:hsla(42,80%,50%,0.15);color:hsl(42,80%,55%);border:1px solid hsla(42,80%,50%,0.3);">Immutable Ancient Friend</span>
            </div>
            <h3 style="margin:0;font-size:15px;color:hsl(42,80%,60%);line-height:1.3;font-weight:700;letter-spacing:0.03em;">${escapeHtml(name)}</h3>
            <p style="margin:2px 0 0;font-size:11px;color:hsl(42,50%,50%);font-style:italic;">${escapeHtml(rt.species_scientific)}</p>
          </div>
          <div style="padding:6px 14px 8px;display:flex;flex-direction:column;gap:4px;">
            <p style="margin:0;font-size:10px;color:hsl(35,40%,48%);font-family:sans-serif;">📍 ${escapeHtml(rt.locality_text)}${rt.province ? `, ${escapeHtml(rt.province)}` : ''}</p>
            ${rt.description ? `<p style="margin:0;font-size:11px;color:hsl(0,0%,62%);font-family:sans-serif;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${escapeHtml(rt.description.substring(0, 150))}</p>` : ''}
            <div style="margin-top:6px;padding:6px 8px;background:hsla(42,30%,15%,0.4);border-radius:6px;border:1px solid hsla(42,80%,50%,0.2);">
              <p style="margin:0;font-size:9px;color:hsl(42,80%,55%);font-family:sans-serif;">✦ Recorded in the Eternal Grove</p>
              ${rt.immutable_record_id ? `<p style="margin:2px 0 0;font-size:9px;color:hsl(42,50%,50%);font-family:monospace;">Record: ${escapeHtml(rt.immutable_record_id)}</p>` : ''}
              ${anchorDate ? `<p style="margin:2px 0 0;font-size:9px;color:hsl(42,50%,50%);font-family:sans-serif;">Anchored: ${anchorDate}</p>` : ''}
            </div>
          </div>
        </div>`;

        const marker = L.marker([rt.latitude, rt.longitude], { icon });
        marker.bindPopup(popupHtml, {
          className: 'atlas-leaflet-popup',
          closeButton: true,
          maxWidth: 280,
          offset: L.point(0, -4),
        });
        immutableCluster.addLayer(marker);
      });
    })();

    return () => {
      if (map.hasLayer(immutableCluster)) map.removeLayer(immutableCluster);
    };
  }, [showImmutableLayer]);

  // ── Waters & Commons pilgrimage lens layer ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (watersCommonsLayerRef.current) {
      map.removeLayer(watersCommonsLayerRef.current);
      watersCommonsLayerRef.current = null;
    }

    if (!showWatersCommons) {
      setWatersCommonsCount(0);
      setWatersCommonsPois([]);
      return;
    }

    const wcLayer = L.layerGroup();
    wcLayer.addTo(map);
    watersCommonsLayerRef.current = wcLayer;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const loadPOIs = async () => {
      if (watersCommonsAbortRef.current) watersCommonsAbortRef.current.abort();
      const ac = new AbortController();
      watersCommonsAbortRef.current = ac;

      const zoom = map.getZoom();
      if (zoom < 10) {
        setWatersCommonsCount(-1);
        wcLayer.clearLayers();
        setWatersCommonsLoading(false);
        return;
      }

      setWatersCommonsLoading(true);
      const bounds = map.getBounds();
      const pois = await fetchLandscapePOIs(
        bounds.getSouth(), bounds.getWest(),
        bounds.getNorth(), bounds.getEast(),
        ac.signal,
        {
          includeWaterways: showWaterways,
          includeChurches: showChurchyards,
          includeCommons: true,
          includeParklands: true,
          includeFootpaths: showFootpaths,
          includeHeritage: showHeritage,
          includeCastles: showCastles,
          includeLibraries: showLibraries,
          includeBookshops: showBookshops,
          includeBotanicalGardens: showBotanicalGardens,
        }
      );

      if (ac.signal.aborted) return;
      setWatersCommonsLoading(false);
      setWatersCommonsCount(pois.length);
      setWatersCommonsPois(pois);
      wcLayer.clearLayers();

      pois.forEach((poi) => {
        const meta = GUARDIAN_TAGS[poi.category];

        // Render line geometries (rivers, footpaths, coastlines, etc.)
        if (poi.geometry && poi.geometry.length > 1) {
          const isPath = poi.category === "footpath";
          const isWater = poi.category === "waterway";
          const zoom = map.getZoom();

          // Outer glow layer — wider, low-opacity halo beneath the main line
          if (isPath || isWater) {
            const glowColor = isPath ? "hsla(42, 80%, 55%, 0.18)" : "hsla(210, 40%, 78%, 0.15)";
            const glowWeight = isPath ? 10 : 12;
            L.polyline(poi.geometry, {
              color: glowColor,
              weight: glowWeight,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
              interactive: false,
              className: isPath ? "wc-footpath-glow" : "wc-waterway-line",
            }).addTo(wcLayer);
          }

          // Main line
          const mainColor = isPath ? "hsl(42, 75%, 52%)" : isWater ? "hsl(210, 35%, 75%)" : meta.color;
          const mainWeight = isPath ? 3 : isWater ? (zoom >= 14 ? 4 : 3) : 2;
          L.polyline(poi.geometry, {
            color: mainColor,
            weight: mainWeight,
            opacity: isPath ? 0.75 : isWater ? 0.65 : 0.6,
            dashArray: isPath ? "6, 8" : undefined,
            lineCap: "round",
            lineJoin: "round",
            interactive: true,
          })
            .bindPopup(
              `<div style="padding:10px 12px;font-family:'Cinzel',serif;width:200px;background:hsl(30,15%,10%);border-radius:10px;border:1px solid ${meta.color}44;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                  <span style="font-size:16px;">${meta.icon}</span>
                  <span style="font-size:9px;padding:2px 6px;border-radius:4px;background:${meta.color}22;color:${meta.color};border:1px solid ${meta.color}44;font-family:sans-serif;">${meta.tag}</span>
                </div>
                <h3 style="margin:0;font-size:13px;color:${meta.color};font-weight:700;">${escapeHtml(poi.name || meta.tag)}</h3>
                ${poi.subtype ? `<p style="margin:2px 0 0;font-size:10px;color:hsl(0,0%,55%);font-style:italic;">${escapeHtml(poi.subtype)}</p>` : ""}
              </div>`,
              { className: "atlas-leaflet-popup", closeButton: true, maxWidth: 220, offset: L.point(0, -4) }
            )
            .addTo(wcLayer);
          return; // don't also add a point marker for lines
        }

        const sz = poi.category === "waterway" ? 10 : poi.category === "footpath" ? 8 : 14;
        const half = sz / 2;

        const icon = L.divIcon({
          className: "wc-poi-marker",
          html: `<div class="wc-dot wc-${poi.category}" style="width:${sz}px;height:${sz}px;border-radius:50%;background:${meta.color};border:2px solid ${meta.color};opacity:0.7;box-shadow:0 0 8px ${meta.glowColor};cursor:pointer;transition:transform .15s;" title="${escapeHtml(poi.name || meta.tag)}"></div>`,
          iconSize: [sz, sz],
          iconAnchor: [half, half],
        });

        const nameStr = poi.name ? escapeHtml(poi.name) : meta.tag;
        const subtypeStr = poi.subtype ? escapeHtml(poi.subtype) : "";
        const popupHtml = `<div style="padding:12px 14px;font-family:'Cinzel',serif;width:220px;background:hsl(30,15%,10%);border-radius:12px;border:1px solid ${meta.color}44;overflow:hidden;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:18px;">${meta.icon}</span>
            <span style="font-size:9px;padding:2px 6px;border-radius:4px;background:${meta.color}22;color:${meta.color};border:1px solid ${meta.color}44;font-family:sans-serif;">${meta.tag}</span>
          </div>
          <h3 style="margin:0;font-size:14px;color:${meta.color};line-height:1.3;font-weight:700;">${nameStr}</h3>
          ${subtypeStr ? `<p style="margin:2px 0 0;font-size:10px;color:hsl(0,0%,55%);font-style:italic;">${subtypeStr}</p>` : ""}
          <p style="margin:8px 0 0;font-size:11px;color:hsl(42,40%,55%);font-family:sans-serif;line-height:1.5;font-style:italic;">${escapeHtml(meta.whisper)}</p>
        </div>`;

        L.marker([poi.lat, poi.lng], { icon })
          .bindPopup(popupHtml, {
            className: "atlas-leaflet-popup",
            closeButton: true,
            maxWidth: 240,
            offset: L.point(0, -4),
          })
          .addTo(wcLayer);
      });

      // Draw soft proximity glow around trees near landscape features
      const currentZoom = map.getZoom();
      if (currentZoom >= 13) {
        filteredTrees.forEach((tree) => {
          const context = getNearbyLandscapeContext(tree.latitude, tree.longitude, pois);
          if (context) {
            const isPathNearby = context.category === "footpath";
            const isWaterNearby = context.category === "waterway";
            const glowColor = isPathNearby
              ? "hsla(42, 80%, 55%, 0.25)"
              : isWaterNearby
              ? "hsla(210, 40%, 78%, 0.20)"
              : GUARDIAN_TAGS[context.category].glowColor;
            const ringColor = isPathNearby
              ? "hsl(42, 75%, 52%)"
              : isWaterNearby
              ? "hsl(210, 35%, 75%)"
              : GUARDIAN_TAGS[context.category].color;

            // Pulsing outer ring for trees near paths/water (zoom >= 14)
            if ((isPathNearby || isWaterNearby) && currentZoom >= 14) {
              const pulseDiv = L.divIcon({
                className: "tree-near-path-marker",
                html: `<div class="tree-near-path" style="width:28px;height:28px;background:${glowColor};border:1.5px solid ${ringColor}60;"></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              });
              L.marker([tree.latitude, tree.longitude], { icon: pulseDiv, interactive: false }).addTo(wcLayer);
            }

            L.circleMarker([tree.latitude, tree.longitude], {
              radius: 18,
              color: ringColor,
              fillColor: glowColor,
              fillOpacity: 0.25,
              weight: 1.5,
              opacity: 0.5,
              interactive: false,
            }).addTo(wcLayer);
          }
        });
      }
    };

    const onMoveEnd = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadPOIs, 1200);
    };

    map.on("moveend", onMoveEnd);
    loadPOIs();

    return () => {
      clearTimeout(debounceTimer);
      map.off("moveend", onMoveEnd);
      if (watersCommonsAbortRef.current) watersCommonsAbortRef.current.abort();
      if (map.hasLayer(wcLayer)) map.removeLayer(wcLayer);
    };
  }, [showWatersCommons, filteredTrees, showWaterways, showChurchyards, showFootpaths, showHeritage, showCastles, showLibraries, showBookshops, showBotanicalGardens]);

  // Show contextual whisper when adding a tree near a W&C landmark
  useEffect(() => {
    if (!showWatersCommons || !addTreeCoords || watersCommonsPois.length === 0) {
      setWatersCommonsWhisper(null);
      return;
    }
    const context = getNearbyLandscapeContext(
      addTreeCoords.lat, addTreeCoords.lng, watersCommonsPois
    );
    if (context) {
      setWatersCommonsWhisper(GUARDIAN_TAGS[context.category].whisper);
    } else {
      setWatersCommonsWhisper(null);
    }
  }, [addTreeCoords, watersCommonsPois, showWatersCommons]);

  // ── Bloomed Seeds layer ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (bloomedSeedLayerRef.current) {
      map.removeLayer(bloomedSeedLayerRef.current);
      bloomedSeedLayerRef.current = null;
    }

    if (!showBloomedSeeds) { setBloomedSeedCount(0); return; }

    const loadSeeds = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("planted_seeds")
        .select("id, latitude, longitude, tree_id, blooms_at, planter_id")
        .is("collected_at", null)
        .lte("blooms_at", now)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(200);

      if (!data || data.length === 0) { setBloomedSeedCount(0); return; }
      setBloomedSeedCount(data.length);

      const layer = L.layerGroup();
      data.forEach((seed: any) => {
        const seedIcon = L.divIcon({
          className: "bloomed-seed-marker",
          html: `<div style="
            width: 18px; height: 18px; border-radius: 50%;
            background: radial-gradient(circle, hsla(120, 70%, 60%, 0.9), hsla(120, 60%, 40%, 0.5));
            box-shadow: 0 0 12px hsla(120, 70%, 55%, 0.6), 0 0 24px hsla(120, 60%, 50%, 0.3);
            animation: seedPulse 2s ease-in-out infinite;
            border: 2px solid hsla(120, 80%, 70%, 0.7);
          "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([seed.latitude, seed.longitude], { icon: seedIcon });
        const popup = document.createElement("div");
        popup.style.cssText = "font-family: serif; text-align: center;";
        popup.innerHTML = `<div style="font-size:13px;color:hsl(120,50%,40%)">🌱 Bloomed Seed</div>
          <div style="font-size:10px;color:#888;margin-top:2px">Ready to collect</div>`;
        marker.bindPopup(popup);
        layer.addLayer(marker);
      });

      layer.addTo(map);
      bloomedSeedLayerRef.current = layer;
    };
    loadSeeds();

    return () => {
      if (bloomedSeedLayerRef.current && map.hasLayer(bloomedSeedLayerRef.current)) {
        map.removeLayer(bloomedSeedLayerRef.current);
      }
    };
  }, [showBloomedSeeds]);

  // ── Seed Trail layer — user's planted seeds today ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (seedTrailLayerRef.current) {
      map.removeLayer(seedTrailLayerRef.current);
      seedTrailLayerRef.current = null;
    }

    if (!showSeedTrail || !userId) { setSeedTrailCount(0); return; }

    const loadTrail = async () => {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);

      const { data: seeds } = await supabase
        .from("planted_seeds")
        .select("id, tree_id, planted_at, latitude, longitude")
        .eq("planter_id", userId)
        .gte("planted_at", midnight.toISOString())
        .order("planted_at", { ascending: true })
        .limit(100);

      if (!seeds || seeds.length === 0) { setSeedTrailCount(0); return; }

      // Get tree coords for seeds without lat/lng
      const needsCoords = seeds.filter((s: any) => !s.latitude || !s.longitude);
      let treeCoordMap: Record<string, { lat: number; lng: number }> = {};
      if (needsCoords.length > 0) {
        const treeIds = [...new Set(needsCoords.map((s: any) => s.tree_id))];
        const { data: treeData } = await supabase
          .from("trees")
          .select("id, latitude, longitude")
          .in("id", treeIds);
        (treeData || []).forEach((t: any) => {
          if (t.latitude && t.longitude) treeCoordMap[t.id] = { lat: t.latitude, lng: t.longitude };
        });
      }

      const points: [number, number][] = [];
      const layer = L.layerGroup();

      setSeedTrailCount(seeds.length);

      seeds.forEach((seed: any, idx: number) => {
        const lat = seed.latitude || treeCoordMap[seed.tree_id]?.lat;
        const lng = seed.longitude || treeCoordMap[seed.tree_id]?.lng;
        if (!lat || !lng) return;

        points.push([lat, lng]);

        // Golden sprout marker
        const age = (Date.now() - new Date(seed.planted_at).getTime()) / 3600000; // hours
        const opacity = Math.max(0.4, 1 - age / 24);

        const sproutIcon = L.divIcon({
          className: "seed-trail-marker",
          html: `<div style="
            width: 14px; height: 14px; border-radius: 50%;
            background: radial-gradient(circle, hsla(42, 85%, 60%, ${opacity}), hsla(42, 70%, 45%, ${opacity * 0.4}));
            box-shadow: 0 0 8px hsla(42, 80%, 55%, ${opacity * 0.5}), 0 0 16px hsla(42, 70%, 50%, ${opacity * 0.2});
            border: 1.5px solid hsla(42, 90%, 70%, ${opacity * 0.6});
            animation: seedTrailPulse 3s ease-in-out infinite;
            animation-delay: ${idx * 0.2}s;
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        L.marker([lat, lng], { icon: sproutIcon, zIndexOffset: 600 }).addTo(layer);
      });

      // Draw faint trail line connecting seeds in chronological order
      if (points.length >= 2) {
        const trail = L.polyline(points, {
          color: "hsla(42, 75%, 55%, 0.3)",
          weight: 2,
          dashArray: "6,8",
          lineCap: "round",
          lineJoin: "round",
        });
        layer.addLayer(trail);
      }

      layer.addTo(map);
      seedTrailLayerRef.current = layer;
    };

    loadTrail();

    return () => {
      if (seedTrailLayerRef.current && map.hasLayer(seedTrailLayerRef.current)) {
        map.removeLayer(seedTrailLayerRef.current);
      }
    };
  }, [showSeedTrail, userId]);

  const handleFindMe = useCallback(async () => {
    if (!mapRef.current) return;
    const result = await geo.locate("map-locate-button");
    if (result && mapRef.current) {
      const map = mapRef.current;
      const latlng: [number, number] = [result.lat, result.lng];
      setUserLatLng(latlng);
      setLocated(true);
      placeUserMarker(map, latlng, result.accuracy);
      // "Awakening" profile — gentle zoom, slightly slower
      map.flyTo(latlng, 14, { duration: 1.4, easeLinearity: 0.3 });

      // Soft awakening ripple at user location
      const ripple = L.circleMarker(latlng, {
        radius: 0,
        color: 'hsl(120, 40%, 50%)',
        fillColor: 'hsl(120, 40%, 50%)',
        fillOpacity: 0.15,
        weight: 1.5,
        opacity: 0.4,
        interactive: false,
      }).addTo(map);

      // Animate radius expansion via CSS (Leaflet circles don't animate natively)
      let frame = 0;
      const maxFrames = 40;
      const expandRipple = () => {
        frame++;
        const r = (frame / maxFrames) * 60;
        const opacity = 0.4 * (1 - frame / maxFrames);
        ripple.setRadius(r);
        ripple.setStyle({ fillOpacity: 0.15 * (1 - frame / maxFrames), opacity });
        if (frame < maxFrames) requestAnimationFrame(expandRipple);
        else { try { map.removeLayer(ripple); } catch {} }
      };
      requestAnimationFrame(expandRipple);
    }
  }, [geo]);

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
    // "Seeking Line" profile — direct, intentional, shorter duration
    mapRef.current.flyTo([tree.latitude, tree.longitude], 16, {
      duration: 0.9,
      easeLinearity: 0.25,
    });
    // Open popup after flyTo settles
    setTimeout(() => {
      const map = mapRef.current;
      if (!map || !clusterRef.current) return;
      clusterRef.current.eachLayer((layer: any) => {
        const ll = layer.getLatLng?.();
        if (ll && Math.abs(ll.lat - tree.latitude) < 0.0001 && Math.abs(ll.lng - tree.longitude) < 0.0001) {
          clusterRef.current.zoomToShowLayer(layer, () => {
            layer.openPopup();
          });
        }
      });
    }, 1100);
  }, []);

  return (
    <div className={`${className || "absolute inset-0"} ${groveViewActive ? "grove-view-active" : ""}`} style={{ height: '100dvh' }}>
      <div ref={containerRef} className="w-full h-full" style={{ background: groveViewActive ? '#0a120a' : '#f0ede6', transition: 'background 1.2s ease-in-out' }} />
      <style>{LITE_CSS}</style>

      {/* Search */}
      <LiteMapSearch
        trees={trees}
        onSelect={handleSearchSelect}
        onSearchResult={(result) => {
          if (result.type === "rootstone" && result.url) {
            window.location.href = result.url;
          } else if (result.mapContext?.lat && result.mapContext?.lng && mapRef.current) {
            mapRef.current.flyTo(
              [result.mapContext.lat, result.mapContext.lng],
              result.mapContext.zoom || 14,
              { duration: 0.9, easeLinearity: 0.25 }
            );
          } else if (result.url) {
            window.location.href = result.url;
          }
        }}
      />

      {/* Unified Atlas Filter — hidden in clear view */}
      {!clearView && (
        <AtlasFilter
          speciesCounts={speciesCounts}
          totalVisible={filteredTrees.length}
          selectedSpecies={species}
          onSpeciesChange={setSpecies}
          lineageFilter={lineageFilter}
          onLineageChange={setLineageFilter}
          availableLineages={availableLineages}
          projectFilter={projectFilter}
          onProjectChange={setProjectFilter}
          availableProjects={availableProjects}
          hiveMap={hiveMap}
          visualSections={visualSections}
          panelOpen={atlasFilterOpen}
          onPanelOpenChange={setAtlasFilterOpen}
          onFullscreenToggle={onFullscreenToggle}
          isFullscreen={isFullscreen}
          onPerspectivePreset={(preset: PerspectivePreset) => {
            setShowHiveLayer(preset.hiveEmphasis);
            if (preset.bloomingClockVisible && !showBloomingClock) setShowBloomingClock(true);
            const layerMap: Record<string, (v: boolean) => void> = {
              "seeds": (v) => setShowSeeds(v),
              "offering-glow": (v) => setShowOfferingGlow(v),
              "heart-glow": (v) => setShowHeartGlow(v),
              "hive-layer": (v) => setShowHiveLayer(v),
              "groves": (v) => setShowGroves(v),
              "bloomed-seeds": (v) => setShowBloomedSeeds(v),
              "recent-visits": (v) => setShowRecentVisits(v),
              "seed-traces": (v) => setShowSeedTraces(v),
              "seed-trail": (v) => setShowSeedTrail(v),
              "shared-trees": (v) => setShowSharedTrees(v),
              "tribe-activity": (v) => setShowTribeActivity(v),
            };
            Object.values(layerMap).forEach(fn => fn(false));
            preset.layers.forEach(k => { if (layerMap[k]) layerMap[k](true); });
          }}
          onAddTree={() => {
            const map = mapRef.current;
            if (map) {
              const c = map.getCenter();
              setAddTreeCoords({ lat: c.lat, lng: c.lng });
            } else {
              setAddTreeCoords(userLatLng ? { lat: userLatLng[0], lng: userLatLng[1] } : null);
            }
            setAddDialogOpen(true);
          }}
        />
      )}

      {/* Discovery cue — hidden in clear view */}
      {discoveryCount > 0 && !clearView && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[1001] px-3 py-1.5 rounded-full font-serif text-[11px] animate-fade-in"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 4rem)",
            background: "hsla(120, 40%, 15%, 0.9)",
            color: "hsl(42, 80%, 60%)",
            border: "1px solid hsla(42, 60%, 45%, 0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          ✦ {discoveryCount} new {discoveryCount === 1 ? "tree" : "trees"} discovered
        </div>
      )}

      {/* Context indicator for deep-linked views — hidden in clear view */}
      {!clearView && (
        <MapContextIndicator
          label={contextLabel}
          treeCount={filteredTrees.length}
          origin={initialOrigin}
          onClear={() => {
            setContextLabel(null);
            setSpecies([]);
            clearMapMemory();
            const map = mapRef.current;
            if (map) map.setView([25, 10], 3, { animate: true });
            window.history.replaceState(null, "", "/map");
          }}
        />
      )}

      {/* Nearby Ancient Friends discovery panel */}
      {!clearView && (
        <NearbyDiscoveryPanel
          trees={filteredTrees}
          userLat={userLatLng?.[0] ?? null}
          userLng={userLatLng?.[1] ?? null}
          visible={!!userLatLng && !atlasFilterOpen}
          onTreeSelect={(lat, lng, treeId) => {
            const map = mapRef.current;
            if (map) {
              map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 1.2 });
              // Trigger marker focus after fly
              setTimeout(() => {
                const cluster = clusterRef.current;
                if (cluster) {
                  cluster.eachLayer((layer: any) => {
                    if (layer?.options?.treeData?.id === treeId) {
                      layer.openPopup();
                    }
                  });
                }
              }, 1400);
            }
          }}
        />
      )}

      {debugEnabled && (
        <div
          className="absolute right-3 z-[1002] max-w-[260px] rounded-xl border px-3 py-2.5 text-[11px] shadow-xl backdrop-blur-md"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 4rem)",
            background: "hsla(210, 20%, 12%, 0.85)",
            borderColor: "hsla(190, 35%, 45%, 0.45)",
            color: "hsl(185, 35%, 82%)",
          }}
        >
          <p className="font-semibold tracking-wide">Map Debug</p>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px]">
            <span>fps</span>
            <span>{perfDebug.fps ?? "—"}</span>
            <span>frame</span>
            <span>{perfDebug.frameDeltaMs != null ? `${perfDebug.frameDeltaMs}ms` : "—"}</span>
            <span>render</span>
            <span>{perfDebug.renderMs != null ? `${perfDebug.renderMs}ms` : "—"}</span>
            <span>markers</span>
            <span>{perfDebug.markerCount}</span>
            <span>clusters</span>
            <span>{perfDebug.clusterCount}</span>
            <span>filtered</span>
            <span>{filteredTrees.length}</span>
            <span>total</span>
            <span>{trees.length}</span>
          </div>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide opacity-80">Active filters</p>
          <p className="mt-1 text-[10px] leading-relaxed opacity-90">
            {perfDebug.activeFilters.length > 0 ? perfDebug.activeFilters.join(" · ") : "none"}
          </p>
        </div>
      )}

      {/* GroveView Living Earth Mode */}
      <GroveViewOverlay
        active={groveViewActive}
        onToggle={() => setGroveViewActive(v => !v)}
        userLat={userLatLng?.[0]}
        treeLookup={treeLookup}
        onEventPulses={setCurrentEventPulses}
      />

      {/* Blooming Clock — Global Seasonal Atlas */}
      <BloomingClockLayer
        map={mapRef.current}
        foods={foodCycles}
        selectedFoodIds={selectedFoodIds}
        stageFilter={bloomStageFilter}
        active={showBloomingClock}
        constellationMode={bloomConstellationMode}
        monthOverride={bloomMonth}
        onRegionStages={setBloomRegionStages}
      />

      {/* Blooming Clock — Canvas particle system */}
      <BloomingClockParticles
        map={mapRef.current}
        active={showBloomingClock && !bloomConstellationMode}
        sources={bloomRegionStages.map(rs => ({
          lat: rs.region.lat,
          lng: rs.region.lng,
          stage: rs.stage,
          isPeak: rs.isPeak,
          foodIcon: rs.food.icon,
          foodName: rs.food.name,
        }))}
      />

      {/* Blooming Clock — Seasonal sigils legend (hidden in clear view) */}
      {showBloomingClock && bloomRegionStages.length > 0 && !clearView && (
        <BloomingClockSigils
          activeStages={[...new Set(bloomRegionStages.map(rs => rs.stage))]}
          currentMonth={bloomMonth}
          foodCount={bloomRegionStages.length}
        />
      )}

      {/* Hive Fruit Layer — seasonal fruit indicators */}
      <HiveFruitLayer
        map={mapRef.current}
        trees={filteredTrees}
        fruitingHives={fruitingHives}
        activeHiveFamily={activeHiveFamily}
        onFruitClick={handleFruitClick}
      />

      {/* Hive Fruit Preview — mini card on fruit click (hidden in clear view) */}
      {!clearView && (
        <HiveFruitPreview
          visible={!!fruitPreview}
          hive={fruitPreview?.hive || { family: "", slug: "", displayName: "", description: "", accentHsl: "0 0% 50%", icon: "🌿", representativeSpecies: [] }}
          stage={fruitPreview?.status.stage || ""}
          stageLabel={fruitPreview?.status.label || ""}
          stageEmoji={fruitPreview?.status.emoji || ""}
          treeCount={fruitPreview?.treeCount || 0}
          onClose={() => setFruitPreview(null)}
        />
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
              onClick={() => { setSpecies([]); setPerspective("collective"); }}
              className="underline mt-1 inline-block transition-colors"
              style={{ color: "hsl(42, 80%, 60%)" }}
            >
              Show all trees
            </button>
          </p>
        </div>
      )}

      {/* Bottom controls: unified Atlas Filter + locate + add + compass */}
      {(() => {
        const modeAccent = perspective === "personal" ? "120, 50%, 45%" : perspective === "tribe" ? "200, 55%, 50%" : "42, 90%, 55%";
        const addEmphasis = perspective === "personal";
        const globeEmphasis = perspective === "collective";
        return (
          <>
            {/* Clear View toggle — always visible, right side */}
            <div className="absolute right-3 z-[1000]" style={{ bottom: "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px)" }}>
              <button
                onClick={() => setClearView(v => !v)}
                className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 active:scale-90 glow-button`}
                style={{
                  ...btnBase,
                  color: clearView ? "hsl(200, 60%, 70%)" : "hsl(var(--muted-foreground) / 0.6)",
                  background: clearView ? "hsla(200, 40%, 15%, 0.95)" : btnBase.background,
                  border: clearView ? "1px solid hsla(200, 50%, 50%, 0.4)" : btnBase.border,
                }}
                title={clearView ? "Show controls" : "Clear view"}
                aria-label={clearView ? "Show map controls" : "Hide map controls for clear view"}
              >
                {clearView ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
              </button>
            </div>

            {/* Left column — hidden in clear view */}
            {!clearView && (
              <div className="absolute left-3 z-[1000] flex flex-col-reverse gap-2" style={{ bottom: "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px)" }}>
                <button
                  onClick={() => setAtlasFilterOpen(!atlasFilterOpen)}
                  className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 ${atlasFilterOpen ? 'glow-button--emerald' : ''} glow-button`}
                  style={{
                    ...btnBase,
                    color: atlasFilterOpen ? `hsl(${modeAccent})` : "hsl(42, 60%, 60%)",
                    background: atlasFilterOpen ? `hsla(${modeAccent.split(',')[0]}, 50%, 20%, 0.95)` : btnBase.background,
                  }}
                  title="Filters & Layers"
                >
                  <Layers className="w-[18px] h-[18px]" />
                  {(() => {
                    const activeLayers = visualSections.reduce((s, sec) => s + sec.layers.filter(l => l.active).length, 0);
                    const totalActive = activeLayers + (species.length > 0 ? 1 : 0) + (ageBand !== "all" ? 1 : 0) + (girthBand !== "all" ? 1 : 0) + (lineageFilter !== "all" ? 1 : 0) + (projectFilter !== "all" ? 1 : 0);
                    return totalActive > 0 ? (
                      <span
                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold"
                        style={{
                          background: `hsl(${modeAccent})`,
                          color: "hsl(30, 20%, 10%)",
                          boxShadow: `0 0 6px hsla(${modeAccent}, 0.4)`,
                        }}
                      >
                        {totalActive}
                      </span>
                    ) : null;
                  })()}
                </button>
                {/* Secondary controls — compact size on mobile, hidden when atlas filter is open */}
                {!atlasFilterOpen && (
                  <>
                    <button
                      onClick={() => setGroveViewActive(v => !v)}
                      className={`relative flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full transition-all duration-200 active:scale-90 ${groveViewActive ? 'glow-button--emerald' : ''} glow-button`}
                      style={{
                        ...btnBase,
                        color: groveViewActive ? "hsl(120, 55%, 65%)" : "hsl(42, 60%, 60%)",
                        background: groveViewActive ? "hsla(120, 30%, 12%, 0.95)" : btnBase.background,
                        border: groveViewActive ? "1px solid hsla(120, 40%, 40%, 0.5)" : btnBase.border,
                      }}
                      title="Living Earth Mode"
                    >
                      <Eye className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                      {groveViewActive && (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                          style={{
                            background: "hsl(120, 55%, 50%)",
                            boxShadow: "0 0 6px hsla(120, 55%, 50%, 0.6)",
                            animation: "ancientGlow 3s ease-in-out infinite",
                          }}
                        />
                      )}
                    </button>
                    <button
                      onClick={() => setShowMycelialNetwork((v) => !v)}
                      className={`relative flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full transition-all duration-200 active:scale-90 glow-button`}
                      style={{
                        ...btnBase,
                        color: showMycelialNetwork ? "hsl(178, 72%, 68%)" : "hsl(42, 60%, 60%)",
                        border: showMycelialNetwork ? "1px solid hsla(178, 65%, 55%, 0.5)" : btnBase.border,
                      }}
                      title="Toggle Mycelial Network"
                      aria-label="Toggle Mycelial Network"
                    >
                      <TreePine className="w-4 h-4 md:w-[16px] md:h-[16px]" />
                      {showMycelialNetwork && (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                          style={{
                            background: "hsl(178, 72%, 62%)",
                            boxShadow: "0 0 6px hsla(178, 72%, 62%, 0.6)",
                          }}
                        />
                      )}
                    </button>
                    {/* Atlas portal — above layers & eye */}
                    <AtlasNavButton btnBase={btnBase} />
                  </>
                )}
              </div>
            )}

            {/* Bottom center — hidden in clear view */}
            {!clearView && (
              <div className="absolute left-1/2 -translate-x-1/2 z-[1000] flex gap-2" style={{ bottom: "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px)" }}>
                <button
                  onClick={handleFindMe}
                  disabled={locating}
                  className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 glow-button`}
                  style={{
                    ...btnBase,
                    color: locating ? "hsl(42, 40%, 45%)" : geo.error ? "hsl(0, 50%, 55%)" : located ? `hsl(${modeAccent})` : "hsl(42, 60%, 60%)",
                  }}
                  title={geo.error ? `Location: ${geo.error.message}` : "Locate me"}
                >
                  {locating ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Crosshair className="w-[18px] h-[18px]" />}
                </button>
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
                  className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 ${addEmphasis ? 'glow-button--emerald' : ''} glow-button`}
                  style={{
                    ...btnBase,
                    color: addEmphasis ? `hsl(${modeAccent})` : "hsl(120, 50%, 55%)",
                  }}
                  title="Add tree"
                >
                  <Plus className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={handleCompassReset}
                  className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 glow-button`}
                  style={{
                    ...btnBase,
                    color: globeEmphasis ? `hsl(${modeAccent})` : "hsl(42, 60%, 60%)",
                  }}
                  title="Reset view"
                >
                  <Globe className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}
          </>
        );
      })()}

      {/* Waters & Commons contextual whisper */}
      {watersCommonsWhisper && addDialogOpen && (
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 z-[1010] px-4 py-2.5 rounded-xl font-serif text-[12px] max-w-[300px] text-center animate-fade-in"
          style={{
            background: "hsla(200, 25%, 12%, 0.92)",
            color: "hsl(200, 55%, 70%)",
            border: "1px solid hsla(200, 45%, 40%, 0.3)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <span className="text-base mr-1">🌊</span>
          <span className="italic">{watersCommonsWhisper}</span>
        </div>
      )}


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
