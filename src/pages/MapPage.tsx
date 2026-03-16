import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useNavigate, useSearchParams } from "react-router-dom";
import ActiveFilterChips from "@/components/ActiveFilterChips";
import Header from "@/components/Header";
import Map from "@/components/Map";
import SeasonalLensBanner from "@/components/seasonal/SeasonalLensBanner";
import MapErrorBoundary from "@/components/MapErrorBoundary";
import LevelEntrance from "@/components/LevelEntrance";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { useFullscreenMap } from "@/hooks/use-fullscreen-map";
import PublicTesterBlessing, { isBlessingDismissed } from "@/components/PublicTesterBlessing";
import MapJourneyOverlay from "@/components/MapJourneyOverlay";
import MapArrivalBanner from "@/components/MapArrivalBanner";
import MapOfflineOverlay from "@/components/MapOfflineOverlay";
import type { ArrivalOrigin } from "@/hooks/use-map-focus";
import { parseMapFocusParams } from "@/utils/mapNavigation";
const MapHeartBadge = lazy(() => import("@/components/MapHeartBadge"));
const SendWhisperModal = lazy(() => import("@/components/SendWhisperModal"));

// Non-critical overlays — lazy-loaded after the map is interactive
const ContextualWhisper = lazy(() => import("@/components/ContextualWhisper"));
const TeotagWhisper = lazy(() => import("@/components/TeotagWhisper"));
const MapOnboardingRitual = lazy(() => import("@/components/MapOnboardingRitual"));
const FullscreenMapControls = lazy(() => import("@/components/FullscreenMapControls"));
const MapTreePanel = lazy(() => import("@/components/MapTreePanel"));

const VALID_ARRIVALS = new Set<string>(["tree", "country", "region", "county", "hive", "clock", "search", "nearby", "featured", "species", "collection"]);

const MapPage = () => <MapPageFull />;

const MapPageFull = () => {
  useDocumentTitle("Ancient Friends Map");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapFocus = parseMapFocusParams(searchParams);
  const paramW3w = searchParams.get("w3w") || undefined;
  const paramLat = mapFocus.lat;
  const paramLng = mapFocus.lng;
  const paramZoom = mapFocus.zoom;
  const paramSpecies = searchParams.get("species") || undefined;
  const paramTreeId = mapFocus.treeId || undefined;
  const paramCountry = mapFocus.country;
  const paramHive = mapFocus.hive;
  const rawArrival = mapFocus.arrival;
  const paramArrival: ArrivalOrigin | null = rawArrival && VALID_ARRIVALS.has(rawArrival) ? (rawArrival as ArrivalOrigin) : null;
  const paramJourney = mapFocus.journey;
  const paramBbox = mapFocus.bbox?.join(",") || undefined;
  const [journeyActive, setJourneyActive] = useState(paramJourney);
  const safeMapDebug = searchParams.get("mapDebug") === "1";
  const safeDisableNonessentialOverlays = safeMapDebug && searchParams.get("hideOverlays") !== "0";

  const [selectedView] = useState("collective");
  const [selectedSpecies] = useState(paramSpecies || "all");
  const { showEntrance, dismissEntrance } = useEntranceOnce("map");
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreenMap();
  const [showBlessing, setShowBlessing] = useState(() => !safeDisableNonessentialOverlays && !isBlessingDismissed());
  const [blessingJustDismissed, setBlessingJustDismissed] = useState(false);

  // Innovation #3: Whisper to Research Trees from map popup
  const [researchWhisper, setResearchWhisper] = useState<{ treeId: string; treeName: string; species: string } | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.treeId) setResearchWhisper({ treeId: detail.treeId, treeName: detail.treeName || "Research Tree", species: detail.species || "" });
    };
    window.addEventListener("s33d-whisper-research", handler);
    return () => window.removeEventListener("s33d-whisper-research", handler);
  }, []);

  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);

  if (showEntrance) {
    return <LevelEntrance phases={[{ src: "/images/hero-trees/ancient-oak-mist.jpeg", alt: "The Roots" }]} phaseDuration={1200} fadeDuration={600} onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="fixed inset-0 z-[10] bg-background">
      {/* Map renders immediately — preloads while blessing is visible */}
      <MapErrorBoundary>
        <Map initialView={selectedView} initialSpecies={selectedSpecies} initialW3w={paramW3w} initialLat={paramLat} initialLng={paramLng} initialZoom={paramZoom} initialTreeId={paramTreeId} initialCountry={paramCountry} initialHive={paramHive} initialOrigin={paramArrival || undefined} initialJourney={paramJourney} initialBbox={paramBbox} onFullscreenToggle={toggleFullscreen} isFullscreen={isFullscreen} onJourneyEnd={() => setJourneyActive(false)} />
      </MapErrorBoundary>
      <MapOfflineOverlay />
      <MapJourneyOverlay active={journeyActive} />
      
      {/* Heart balance badge */}
      {!safeDisableNonessentialOverlays && !showBlessing && !isFullscreen && (
        <Suspense fallback={null}>
          <MapHeartBadge />
        </Suspense>
      )}
      
      {/* Arrival banner — contextual breadcrumb showing how you arrived */}
      {!safeDisableNonessentialOverlays && !showBlessing && !isFullscreen && paramArrival && (
        <MapArrivalBanner arrival={paramArrival} countrySlug={paramCountry} hiveSlug={paramHive} />
      )}

      {/* Public Tester Blessing — overlays map, shown once */}
      {!safeDisableNonessentialOverlays && showBlessing && (
        <PublicTesterBlessing onComplete={() => { setShowBlessing(false); setBlessingJustDismissed(true); setTimeout(() => setBlessingJustDismissed(false), 15000); window.dispatchEvent(new Event("s33d-map-layout-changed")); }} />
      )}

      {/* Standard header — hidden in fullscreen and during blessing */}
      {!safeDisableNonessentialOverlays && !isFullscreen && !showBlessing && (
        <>
          <Header />
           <div className="absolute left-0 right-0 z-[20]" style={{ top: "calc(var(--header-height, 3.5rem) + env(safe-area-inset-top, 0px))" }}>
            <ActiveFilterChips />
            <div className="px-3 mt-1">
              <SeasonalLensBanner context="map" />
            </div>
          </div>
        </>
      )}

      {/* Fullscreen: compact floating nav */}
      {isFullscreen && (
        <Suspense fallback={null}>
          <FullscreenMapControls onExit={exitFullscreen} />
        </Suspense>
      )}

      {/* Tree discovery panel — combined Recent + Awaiting */}
      {!safeDisableNonessentialOverlays && !showBlessing && !isFullscreen && (
        <Suspense fallback={null}>
          <MapTreePanel onTreeClick={(treeId) => navigate(`/tree/${treeId}`)} />
        </Suspense>
      )}

      {/* Non-critical overlays deferred until after map is interactive */}
      {!safeDisableNonessentialOverlays && !showBlessing && !blessingJustDismissed && (
        <Suspense fallback={null}>
          <MapOnboardingRitual />
          <ContextualWhisper
            id="map-first-tree"
            message="Tap any marker to meet an Ancient Friend, or long-press the map to claim a new encounter."
            delay={8000}
            position="bottom-center"
          />
          <TeotagWhisper />
        </Suspense>
      )}

      {/* Research tree whisper modal */}
      {researchWhisper && (
        <Suspense fallback={null}>
          <SendWhisperModal
            open={!!researchWhisper}
            onOpenChange={(open) => { if (!open) setResearchWhisper(null); }}
            treeId={researchWhisper.treeId}
            treeName={researchWhisper.treeName}
            treeSpecies={researchWhisper.species}
            contextLabel="Research Layer"
          />
        </Suspense>
      )}
    </div>
  );
};

export default MapPage;
