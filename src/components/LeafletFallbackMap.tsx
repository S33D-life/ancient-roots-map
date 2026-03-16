import { useEffect, useRef, useCallback, useState, useMemo, memo } from "react";
import { useTreeMarkerLayer } from "@/hooks/use-tree-marker-layer";
import { useMapLayerState, type LayerKey } from "@/hooks/use-map-layer-state";
import { useGeolocation } from "@/hooks/use-geolocation";
import { saveMapMemory, restoreMapMemory, clearMapMemory } from "@/hooks/use-map-memory";
import { useMapInit } from "@/hooks/use-map-init";
import MapContextIndicator from "./MapContextIndicator";
import { getEntryBySlug, type CountryRegistryEntry } from "@/config/countryRegistry";
import { getHiveBySlug } from "@/utils/hiveUtils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "@/styles/map-markers.css";
import "@/styles/grove-map.css";
import { useGroveMapLayer } from "@/hooks/use-grove-map-layer";
import { escapeHtml } from "@/utils/escapeHtml";
import { useTreeFocus } from "@/hooks/use-tree-focus";
import { haversineKm, convexHull } from "@/utils/mapGeometry";
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
import {
  buildPopupHtml,
  buildExternalPopupHtml,
  buildResearchPopupHtml,
  buildRootstonePopupHtml,
  type ResearchTree,
} from "@/utils/mapPopups";
import { applySeasonalTint } from "@/utils/mapSeasonalTint";
import { markTreeVisited, applyVisitedClass } from "@/utils/mapVisitedTracker";
import { setupPopupActions } from "@/utils/mapWishHandler";
import { useMapDeepLinks } from "@/hooks/use-map-deep-links";

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

/* ── Shared tier & species logic — now from extracted module ── */
import {
  type Tier,
  getTreeTier,
  getSpeciesHue,
  getVisibleTrees,
  getOrCreateIcon,
  hslStringToHue,
  MARKER_SIZES,
} from "@/components/map/mapMarkerUtils";
import { TIER_LABELS } from "@/utils/treeCardTypes";


/* ── Popup builders + CSS now imported from @/utils/mapPopups and @/styles/map-markers.css ── */


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
  const focusHaloRef = useRef<L.Marker | null>(null);
  const focusFallbackMarkerRef = useRef<L.Marker | null>(null);
  const geo = useGeolocation();
  const locating = geo.isLocating;
  const [located, setLocated] = useState(false);
  const [userLatLng, setUserLatLng] = useState<[number, number] | null>(null);
  const [discoveryCount, setDiscoveryCount] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTreeCoords, setAddTreeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const safeMapFlags = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const SAFE_MAP_DEBUG = import.meta.env.DEV && params.get("mapDebug") === "1";
    const SAFE_BARE_MAP_MODE = SAFE_MAP_DEBUG && params.get("bareMap") === "1";
    const SAFE_DISABLE_NONESSENTIAL_OVERLAYS = SAFE_MAP_DEBUG && params.get("hideOverlays") !== "0";
    return { SAFE_MAP_DEBUG, SAFE_BARE_MAP_MODE, SAFE_DISABLE_NONESSENTIAL_OVERLAYS };
  }, [location.search]);

  const { SAFE_MAP_DEBUG, SAFE_BARE_MAP_MODE, SAFE_DISABLE_NONESSENTIAL_OVERLAYS } = safeMapFlags;

  const debugEnabled = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get("debug") === "1" || SAFE_MAP_DEBUG;
    } catch {
      return SAFE_MAP_DEBUG;
    }
  }, [location.search, SAFE_MAP_DEBUG]);

  // Map init — extracted into useMapInit hook
  const { renderDebug: mapInitDebug, atmosphereReady } = useMapInit({
    containerRef,
    mapRef,
    clusterRef,
    userMarkerRef,
    userAccuracyRef,
    focusHaloRef,
    focusFallbackMarkerRef,
    groveLayerRef,
    seedLayerRef,
    mycelialNetworkLayerRef,
    mycelialAnimatedLayerRef,
    initialLat,
    initialLng,
    initialZoom,
    initialW3w,
    safeBareMapMode: SAFE_BARE_MAP_MODE,
    safeMapDebug: SAFE_MAP_DEBUG,
    onAutoLocate: () => {
      if (navigator.geolocation) {
        geo.locate("map-auto-init").then((result) => {
          if (result && mapRef.current) {
            const latlng: [number, number] = [result.lat, result.lng];
            setUserLatLng(latlng);
            setLocated(true);
            placeUserMarker(mapRef.current, latlng, result.accuracy);
          }
        });
      }
    },
  });
  const renderDebug = { ...mapInitDebug, container: mapInitDebug.containerSize };

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

  // Layer visibility toggles — consolidated via useMapLayerState reducer
  const { layers, toggle, setLayer, batchUpdate } = useMapLayerState();

  // Override initial state for bare-map mode
  useEffect(() => {
    if (SAFE_BARE_MAP_MODE) {
      batchUpdate({ seeds: false, mycelialNetwork: false, researchLayer: false });
    }
  }, [SAFE_BARE_MAP_MODE, batchUpdate]);

  // Convenience aliases for readability (zero-cost: just property reads)
  const showSeeds = layers.seeds;
  const showGroves = layers.groves;
  const showRootThreads = layers.rootThreads;
  const showMycelialNetwork = layers.mycelialNetwork;
  const showOfferingGlow = layers.offeringGlow;
  const showHarvestLayer = layers.harvestLayer;
  const showAncientHighlight = layers.ancientHighlight;
  const showExternalTrees = layers.externalTrees;
  const showBirdsongHeat = layers.birdsongHeat;
  const showHiveLayer = layers.hiveLayer;
  const showResearchLayer = layers.researchLayer;
  const showRootstones = layers.rootstones;
  const showRootstoneTrees = layers.rootstoneTrees;
  const showRootstoneGroves = layers.rootstoneGroves;
  const showImmutableLayer = layers.immutableLayer;
  const showRecentVisits = layers.recentVisits;
  const showSeedTraces = layers.seedTraces;
  const showSharedTrees = layers.sharedTrees;
  const showTribeActivity = layers.tribeActivity;
  const showBloomedSeeds = layers.bloomedSeeds;
  const showSeedTrail = layers.seedTrail;
  const showHeartGlow = layers.heartGlow;
  const showChurchyards = layers.churchyards;
  const showWaterways = layers.waterways;
  const showFootpaths = layers.footpaths;
  const showHeritage = layers.heritage;
  const showCastles = layers.castles;
  const showLibraries = layers.libraries;
  const showBookshops = layers.bookshops;
  const showBotanicalGardens = layers.botanicalGardens;
  const showBloomingClock = layers.bloomingClock;
  const bloomConstellationMode = layers.bloomConstellationMode;
  const clearView = layers.clearView;
  const groveViewActive = layers.groveView;

  // Non-boolean layer state (not part of reducer)
  const [mycelialConnections, setMycelialConnections] = useState<MycelialConnection[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [harvestTreeIds, setHarvestTreeIds] = useState<Set<string>>(new Set());
  const harvestLayerRef = useRef<L.LayerGroup | null>(null);
  const ancientHighlightLayerRef = useRef<L.LayerGroup | null>(null);
  const [rootstoneCountryFilter, setRootstoneCountryFilter] = useState<string | null>(null);
  const [rootstoneTagFilter, setRootstoneTagFilter] = useState<string[]>([]);
  const [rootstoneCount, setRootstoneCount] = useState(0);
  const [researchTreeCount, setResearchTreeCount] = useState(0);
  const [researchLoading, setResearchLoading] = useState(false);
  const [immutableTreeCount, setImmutableTreeCount] = useState(0);
  const [immutableLoading, setImmutableLoading] = useState(false);
  const immutableLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const [birdsongSeason, setBirdsongSeason] = useState<string>("all");
  const [externalTreeCount, setExternalTreeCount] = useState(0);
  const [externalLoading, setExternalLoading] = useState(false);
  const [atlasFilterOpen, setAtlasFilterOpen] = useState(false);
  const [seedTrailCount, setSeedTrailCount] = useState(0);
  const seedTrailLayerRef = useRef<L.LayerGroup | null>(null);
  const [bloomedSeedCount, setBloomedSeedCount] = useState(0);
  const bloomedSeedLayerRef = useRef<L.LayerGroup | null>(null);

  // Blooming Clock — Global Seasonal Atlas
  const { foods: foodCycles, loading: foodCyclesLoading } = useFoodCycles();
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [bloomStageFilter, setBloomStageFilter] = useState<CycleStage | "all">("all");
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
    batchUpdate({ harvestLayer: true, offeringGlow: true, bloomingClock: true });
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

  const showWatersCommons = layers.watersCommons;
  const [watersCommonsCollapsed, setWatersCommonsCollapsed] = useState(true);
  const watersCommonsLayerRef = useRef<L.LayerGroup | null>(null);
  const watersCommonsAbortRef = useRef<AbortController | null>(null);
  const [watersCommonsCount, setWatersCommonsCount] = useState(0);
  const [watersCommonsLoading, setWatersCommonsLoading] = useState(false);
  const [watersCommonsPois, setWatersCommonsPois] = useState<LandscapePOI[]>([]);
  const [watersCommonsWhisper, setWatersCommonsWhisper] = useState<string | null>(null);

  // Deep-link context state
  const [contextLabel, setContextLabel] = useState<string | null>(null);

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
        { key: "ancient-highlight", label: "👑 Ancient Trees", description: "Golden halos on the oldest, most storied trees", active: showAncientHighlight, toggle: () => toggle("ancientHighlight"), accent: "42, 80%, 55%" },
        { key: "harvest-layer", label: "🍎 Harvest Available", description: "Trees with active produce listings", active: showHarvestLayer, toggle: () => toggle("harvestLayer"), extra: showHarvestLayer ? (harvestTreeIds.size > 0 ? `${harvestTreeIds.size}` : "—") : undefined, accent: "25, 70%, 50%" },
        { key: "offering-glow", label: "✦ Offerings", description: "Warm glow on trees with community contributions", active: showOfferingGlow, toggle: () => toggle("offeringGlow"), accent: "42, 85%, 55%" },
      ],
    },
    {
      key: "signals",
      title: "Mycelial Whispers",
      icon: "✦",
      layers: [
        { key: "seeds", label: "💚 Bloomed Seeds", active: showSeeds, toggle: () => toggle("seeds") },
        { key: "heart-glow", label: "❤️ Heart Glow", active: showHeartGlow, toggle: () => toggle("heartGlow"), accent: "0, 65%, 55%" },
        { key: "birdsong", label: "🐦 Birdsong Heat", active: showBirdsongHeat, toggle: () => toggle("birdsongHeat"), extra: showBirdsongHeat ? `${birdsongHeatPoints.length} rec.` : "" },
        { key: "mycelial-network", label: "🕸️ Mycelial Network", active: showMycelialNetwork, toggle: () => toggle("mycelialNetwork"), extra: showMycelialNetwork ? `${mycelialConnections.length}` : "off" },
        { key: "hive-layer", label: "🐝 Species Hives", active: showHiveLayer, toggle: () => toggle("hiveLayer"), accent: "42, 70%, 55%" },
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
        { key: "groves", label: "🌿 Grove Boundaries", active: showGroves, toggle: () => toggle("groves") },
        { key: "root-threads", label: "✦ Root Threads", active: showRootThreads, toggle: () => toggle("rootThreads") },
        { key: "research", label: "📜 Elder Archives", active: showResearchLayer, toggle: () => toggle("researchLayer"), extra: showResearchLayer ? (researchLoading ? "loading…" : researchTreeCount > 0 ? `${researchTreeCount}` : "—") : "1,020" },
        { key: "champion", label: "🏆 🇿🇦 Champion Trees", active: showResearchLayer, toggle: () => toggle("researchLayer"), extra: "DFFE" },
        { key: "rootstones", label: "🪨 Rootstones", active: showRootstones, toggle: () => toggle("rootstones"), extra: showRootstones ? `${rootstoneCount}` : "198" },
        { key: "rootstones-trees", label: "🌳 Rootstone Trees", active: showRootstoneTrees, toggle: () => toggle("rootstoneTrees"), extra: "33x3" },
        { key: "rootstones-groves", label: "🌲 Rootstone Groves", active: showRootstoneGroves, toggle: () => toggle("rootstoneGroves"), extra: "33x3" },
        { key: "immutable", label: "🔱 Minted Sigils", active: showImmutableLayer, toggle: () => toggle("immutableLayer"), extra: showImmutableLayer ? (immutableLoading ? "loading…" : immutableTreeCount > 0 ? `${immutableTreeCount}` : "—") : "—" },
        { key: "external", label: "🗺️ Distant Groves", active: showExternalTrees, toggle: () => toggle("externalTrees"), extra: showExternalTrees ? (externalLoading ? "loading…" : externalTreeCount === -1 ? "zoom in" : externalTreeCount > 0 ? `${externalTreeCount}` : "—") : "sources" },
      ],
    },
    {
      key: "nature",
      title: "Nature & Waterways",
      icon: "🌊",
      accent: "hsl(210, 35%, 75%)",
      description: "Silver rivers, streams, and springs that shape the land.",
      layers: [
        { key: "waters", label: "🌊 Rivers & Waterways", active: showWaterways, toggle: () => { toggle("waterways"); if (!showWatersCommons) setLayer("watersCommons", true); }, extra: showWatersCommons ? (watersCommonsLoading ? "loading…" : watersCommonsCount === -1 ? "zoom in" : watersCommonsCount > 0 ? `${watersCommonsCount}` : "—") : "OSM", accent: "210, 35%, 75%" },
        { key: "parklands", label: "🏛️ Parkland Elders", active: showWatersCommons, toggle: () => toggle("watersCommons"), accent: "145, 50%, 50%" },
        { key: "commons", label: "🌾 Commons & Greens", active: showWatersCommons, toggle: () => toggle("watersCommons"), accent: "75, 50%, 50%" },
      ],
    },
    {
      key: "walking",
      title: "Walking Network",
      icon: "🥾",
      accent: "hsl(42, 75%, 52%)",
      description: "Golden paths, bridleways, and trails across the land.",
      layers: [
        { key: "footpaths", label: "🥾 Footpaths & Paths", active: showFootpaths, toggle: () => { toggle("footpaths"); if (!showWatersCommons) setLayer("watersCommons", true); }, accent: "42, 75%, 52%" },
      ],
    },
    {
      key: "knowledge",
      title: "Knowledge Places",
      icon: "📚",
      accent: "hsl(270, 45%, 55%)",
      description: "Libraries, bookshops, and botanical gardens — places where knowledge takes root.",
      layers: [
        { key: "libraries", label: "📚 Libraries", active: showLibraries, toggle: () => { toggle("libraries"); if (!showWatersCommons) setLayer("watersCommons", true); }, accent: "270, 45%, 55%" },
        { key: "bookshops", label: "📖 Bookshops", active: showBookshops, toggle: () => { toggle("bookshops"); if (!showWatersCommons) setLayer("watersCommons", true); }, accent: "310, 40%, 55%" },
        { key: "botanical", label: "🌺 Botanical Gardens", active: showBotanicalGardens, toggle: () => { toggle("botanicalGardens"); if (!showWatersCommons) setLayer("watersCommons", true); }, accent: "160, 50%, 50%" },
      ],
    },
    {
      key: "culture",
      title: "Culture & Heritage",
      icon: "⛪",
      accent: "hsl(35, 65%, 55%)",
      description: "Churches, castles, heritage buildings, and sacred places.",
      layers: [
        { key: "churchyards", label: "⛪ Churches & Sacred Sites", active: showChurchyards, toggle: () => { toggle("churchyards"); if (!showWatersCommons) setLayer("watersCommons", true); }, accent: "35, 65%, 55%" },
        { key: "heritage", label: "🏛️ Heritage Buildings", active: showHeritage, toggle: () => { toggle("heritage"); if (!showWatersCommons) setLayer("watersCommons", true); }, accent: "25, 55%, 55%" },
        { key: "castles", label: "🏰 Castles & Monuments", active: showCastles, toggle: () => { toggle("castles"); if (!showWatersCommons) setLayer("watersCommons", true); }, accent: "0, 35%, 55%" },
      ],
    },
    {
      key: "wanderer",
      title: "Wanderer Activity",
      icon: "◎",
      accent: "hsl(260, 35%, 60%)",
      description: "Sense the presence of others — gently, like traces in a forest.",
      layers: [
        { key: "bloomed-seeds", label: "🌱 Bloomed Seeds", description: "Collectible seeds glowing on the map", active: showBloomedSeeds, toggle: () => toggle("bloomedSeeds"), extra: showBloomedSeeds ? (bloomedSeedCount > 0 ? `${bloomedSeedCount}` : "—") : undefined, accent: "260, 55%, 70%" },
        { key: "recent-visits", label: "◎ Recent Visits", description: "Soft glows near recently visited trees", active: showRecentVisits, toggle: () => toggle("recentVisits"), accent: "260, 55%, 70%" },
        { key: "seed-traces", label: "✿ Seed & Offering Traces", description: "Subtle pulses that fade over time", active: showSeedTraces, toggle: () => toggle("seedTraces"), accent: "260, 55%, 70%" },
        { key: "seed-trail", label: "🌱 My Seed Trail", description: "Golden trail of seeds you planted today", active: showSeedTrail, toggle: () => toggle("seedTrail"), extra: showSeedTrail ? (seedTrailCount > 0 ? `${seedTrailCount}` : "—") : undefined, accent: "42, 80%, 60%" },
        { key: "shared-trees", label: "◐ Shared Trees", description: "Indicates others who visited the same tree", active: showSharedTrees, toggle: () => toggle("sharedTrees"), accent: "260, 55%, 70%" },
        { key: "tribe-activity", label: "⊛ Tribe Activity", description: "Opt-in visibility for invited wanderers", active: showTribeActivity, toggle: () => toggle("tribeActivity"), accent: "260, 55%, 70%" },
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
        { key: "seasonal-foods", label: "🌸 Seasonal Foods", active: showBloomingClock, toggle: () => toggle("bloomingClock"), accent: "340, 55%, 65%" },
        { key: "constellation", label: "🌾 Constellation Mode", active: bloomConstellationMode, toggle: () => { toggle("bloomConstellationMode"); if (!showBloomingClock) setLayer("bloomingClock", true); }, accent: "42, 70%, 55%" },
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

  // atmosphereReady and renderDebug are now provided by useMapInit (declared above)
  const [seasonClass, setSeasonClass] = useState("");

  // Deep-link: auto-apply country/hive/species filters and zoom (extracted hook)
  useMapDeepLinks({
    mapRef,
    initialCountry,
    initialHive,
    initialOrigin,
    initialLat,
    initialLng,
    initialZoom,
    initialJourney,
    initialBbox,
    treesLength: trees.length,
    trees: trees as any,
    onSpeciesChange: setSpecies,
    onContextLabel: setContextLabel,
    onShowRootstones: (v: boolean) => setLayer("rootstones", v),
    onRootstoneCountryFilter: setRootstoneCountryFilter,
    onRootstoneTagFilter: setRootstoneTagFilter,
    onShowRootstoneTrees: (v: boolean) => setLayer("rootstoneTrees", v),
    onShowRootstoneGroves: (v: boolean) => setLayer("rootstoneGroves", v),
    onJourneyEnd,
  });

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

  // ── Tree markers — delegated to useTreeMarkerLayer hook ──
  const onClusterRefCb = useCallback((cluster: any) => {
    clusterRef.current = cluster;
  }, []);
  const onPerfUpdateCb = useCallback((stats: { markerCount: number; clusterCount: number; renderMs: number }) => {
    if (!debugEnabled) return;
    setPerfDebug((prev) => ({
      ...prev,
      markerCount: stats.markerCount,
      clusterCount: stats.clusterCount,
      renderMs: stats.renderMs,
      lastRenderAt: new Date().toISOString(),
    }));
  }, [debugEnabled]);

  useTreeMarkerLayer({
    map: mapRef.current,
    filteredTrees,
    config: {
      lineageFilter,
      groveScale,
      showHiveLayer,
    },
    refs: {
      offeringCounts: offeringCountsRef.current,
      birdsongCounts: birdsongCountsRef.current,
      whisperCounts: whisperCountsRef.current,
      treePhotos: treePhotosRef.current,
      userLatLng,
    },
    userLatLng,
    debugEnabled,
    onClusterRef: onClusterRefCb,
    onPerfUpdate: onPerfUpdateCb,
  });

  // ── Focus on a specific tree when navigated via "View on Map" — delegated to useTreeFocus hook ──
  useTreeFocus({
    mapRef,
    clusterRef,
    focusHaloRef,
    focusFallbackMarkerRef,
    initialTreeId,
    initialZoom,
    initialJourney,
    trees,
    filteredTrees,
    onJourneyEnd,
  });

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
        const isStoneWall = rt.source_program === 'hk-stone-wall-trees' || rt.designation_type === 'Stone Wall Tree';
        const sz = isStoneWall ? 20 : 16;
        const half = sz / 2;
        const precColor = rt.geo_precision === 'exact' ? 'hsl(120,50%,45%)' : rt.geo_precision === 'approx' ? 'hsl(35,70%,50%)' : 'hsl(0,50%,50%)';

        const dotStyle = isStoneWall
          ? `width:${sz}px;height:${sz}px;background:hsla(28,45%,30%,0.92);border:2.5px solid hsl(42,55%,50%);box-shadow:0 0 10px hsla(28,50%,40%,0.5);border-radius:4px;position:relative;`
          : `width:${sz}px;height:${sz}px;background:hsla(35,50%,25%,0.85);border:2.5px solid hsl(35,65%,50%);box-shadow:0 0 8px hsla(35,70%,50%,0.4);position:relative;`;

        const rootLines = isStoneWall
          ? `<span style="position:absolute;bottom:-4px;left:3px;width:1.5px;height:6px;background:hsl(28,40%,35%);transform:rotate(-15deg);"></span><span style="position:absolute;bottom:-4px;right:3px;width:1.5px;height:6px;background:hsl(28,40%,35%);transform:rotate(15deg);"></span><span style="position:absolute;bottom:-3px;left:50%;width:1.5px;height:5px;background:hsl(28,40%,35%);transform:translateX(-50%);"></span>`
          : '';

        const icon = L.divIcon({
          className: isStoneWall ? 'research-marker stone-wall-marker' : 'research-marker',
          html: `<div class="research-dot" style="${dotStyle}">
            <span style="position:absolute;top:-3px;right:-3px;width:5px;height:5px;border-radius:50%;background:${precColor};border:1px solid hsl(25,18%,10%);"></span>
            ${rootLines}
          </div>`,
          iconSize: [sz + 4, sz + 8],
          iconAnchor: [(sz + 4) / 2, (sz + 8) / 2],
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

  // Guided first tap — after onboarding dismissal, auto-locate and pulse nearest markers
  useEffect(() => {
    const handler = () => {
      // Trigger locate
      handleFindMe().then(() => {
        // After locate completes, pulse the 3 nearest markers
        setTimeout(() => {
          const map = mapRef.current;
          const cluster = clusterRef.current;
          if (!map || !cluster || !userLatLng) return;

          const nearest = [...filteredTrees]
            .map(t => ({ ...t, dist: haversineKm(userLatLng[0], userLatLng[1], t.latitude, t.longitude) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 3);

          cluster.eachLayer((layer: any) => {
            if (nearest.some(t => t.id === layer._treeId)) {
              const el = layer._icon;
              if (el) {
                const wrap = el.closest(".leaflet-tree-marker") || el;
                wrap.classList.add("marker-guided");
                setTimeout(() => wrap.classList.remove("marker-guided"), 6000);
              }
            }
          });
        }, 2000);
      });
    };
    window.addEventListener("s33d-onboarding-complete", handler);
    return () => window.removeEventListener("s33d-onboarding-complete", handler);
  }, [handleFindMe, filteredTrees, userLatLng]);

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

      {/* Atmospheric overlay — rendered as React sibling, NOT injected into Leaflet DOM.
          This avoids mix-blend-mode compositing issues on iOS Safari that hide tiles. */}
      {atmosphereReady && !SAFE_BARE_MAP_MODE && (
        <div className="map-atmosphere-overlay" aria-hidden="true" />
      )}

      {/* Debug badge — visible when SAFE_MAP_DEBUG is active */}
      {SAFE_MAP_DEBUG && (
        <div
          className="absolute top-2 left-2 z-[9999] px-2 py-1 rounded text-[9px] font-mono leading-tight"
          style={{ background: "hsla(0,0%,0%,0.75)", color: "#0f0" }}
        >
          <div>map:{renderDebug.mapMounted ? "✓" : "✗"} tiles:{renderDebug.tileStatus} [{renderDebug.provider}]</div>
          <div>loads:{renderDebug.tileLoads} errs:{renderDebug.tileErrors} imgs:{renderDebug.tilePaneImages}</div>
          <div>container:{renderDebug.container}</div>
        </div>
      )}

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
            setLayer("hiveLayer", preset.hiveEmphasis);
            if (preset.bloomingClockVisible && !showBloomingClock) setLayer("bloomingClock", true);
            // Map preset layer keys to LayerKey values
            const presetKeyMap: Record<string, LayerKey> = {
              "seeds": "seeds",
              "offering-glow": "offeringGlow",
              "heart-glow": "heartGlow",
              "hive-layer": "hiveLayer",
              "groves": "groves",
              "bloomed-seeds": "bloomedSeeds",
              "recent-visits": "recentVisits",
              "seed-traces": "seedTraces",
              "seed-trail": "seedTrail",
              "shared-trees": "sharedTrees",
              "tribe-activity": "tribeActivity",
            };
            // Reset all preset layers to false, then enable the ones in the preset
            const updates: Partial<Record<LayerKey, boolean>> = {};
            Object.values(presetKeyMap).forEach(k => { updates[k] = false; });
            preset.layers.forEach(k => { if (presetKeyMap[k]) updates[presetKeyMap[k]] = true; });
            batchUpdate(updates);
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
        onToggle={() => toggle("groveView")}
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
                onClick={() => toggle("clearView")}
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
                      onClick={() => toggle("groveView")}
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
                      onClick={() => toggle("mycelialNetwork")}
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
                {/* Add tree button — desktop only (mobile uses bottom nav FAB) */}
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
                  className={`hidden md:flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 ${addEmphasis ? 'glow-button--emerald' : ''} glow-button`}
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

export default memo(LeafletFallbackMap);
