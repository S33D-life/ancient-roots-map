import { useState, useCallback, lazy, Suspense } from "react";
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

// Non-critical overlays — lazy-loaded after the map is interactive
const ContextualWhisper = lazy(() => import("@/components/ContextualWhisper"));
const TeotagWhisper = lazy(() => import("@/components/TeotagWhisper"));
const MapOnboardingRitual = lazy(() => import("@/components/MapOnboardingRitual"));
const FullscreenMapControls = lazy(() => import("@/components/FullscreenMapControls"));
const RecentlyAddedTrees = lazy(() => import("@/components/RecentlyAddedTrees"));
const TreesAwaitingVisits = lazy(() => import("@/components/TreesAwaitingVisits"));

const VALID_ARRIVALS = new Set<string>(["tree", "country", "region", "county", "hive", "clock", "search", "nearby", "featured", "species", "collection"]);

const MapPage = () => {
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

  const [selectedView, setSelectedView] = useState("collective");
  const [selectedSpecies, setSelectedSpecies] = useState(paramSpecies || "all");
  const { showEntrance, dismissEntrance } = useEntranceOnce("map");
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreenMap();
  const [showBlessing, setShowBlessing] = useState(() => !isBlessingDismissed());
  const [blessingJustDismissed, setBlessingJustDismissed] = useState(false);

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
      
      {/* Arrival banner — contextual breadcrumb showing how you arrived */}
      {!showBlessing && !isFullscreen && paramArrival && (
        <MapArrivalBanner arrival={paramArrival} countrySlug={paramCountry} hiveSlug={paramHive} />
      )}

      {/* Public Tester Blessing — overlays map, shown once */}
      {showBlessing && (
        <PublicTesterBlessing onComplete={() => { setShowBlessing(false); setBlessingJustDismissed(true); setTimeout(() => setBlessingJustDismissed(false), 15000); }} />
      )}

      {/* Standard header — hidden in fullscreen and during blessing */}
      {!isFullscreen && !showBlessing && (
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

      {/* Recently Added Trees — floating panel */}
      {!showBlessing && !isFullscreen && (
        <Suspense fallback={null}>
          <RecentlyAddedTrees onTreeClick={(treeId) => navigate(`/tree/${treeId}`)} />
        </Suspense>
        <Suspense fallback={null}>
          <TreesAwaitingVisits onTreeClick={(treeId) => navigate(`/tree/${treeId}`)} />
        </Suspense>
      )}

      {/* Non-critical overlays deferred until after map is interactive */}
      {!showBlessing && !blessingJustDismissed && (
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
    </div>
  );
};

export default MapPage;
