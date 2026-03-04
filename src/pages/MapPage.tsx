import { useState, useCallback, lazy, Suspense } from "react";
import ActiveFilterChips from "@/components/ActiveFilterChips";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Map from "@/components/Map";
import LevelEntrance from "@/components/LevelEntrance";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { useFullscreenMap } from "@/hooks/use-fullscreen-map";
import PublicTesterBlessing, { isBlessingDismissed } from "@/components/PublicTesterBlessing";
import MapJourneyOverlay from "@/components/MapJourneyOverlay";
import MapArrivalBanner from "@/components/MapArrivalBanner";
import type { ArrivalOrigin } from "@/hooks/use-map-focus";
import { getEntryBySlug } from "@/config/countryRegistry";
import { ArrowLeft } from "lucide-react";

// Non-critical overlays — lazy-loaded after the map is interactive
const ContextualWhisper = lazy(() => import("@/components/ContextualWhisper"));
const MapOnboardingRitual = lazy(() => import("@/components/MapOnboardingRitual"));
const FullscreenMapControls = lazy(() => import("@/components/FullscreenMapControls"));

const VALID_ARRIVALS = new Set<string>(["tree", "country", "region", "county", "hive", "clock", "search", "nearby", "featured", "species", "collection"]);

const MapPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramW3w = searchParams.get("w3w") || undefined;
  const paramLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const paramLng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;
  const paramZoom = searchParams.get("zoom") ? parseFloat(searchParams.get("zoom")!) : undefined;
  const paramSpecies = searchParams.get("species") || undefined;
  const paramTreeId = searchParams.get("treeId") || undefined;
  const paramCountry = searchParams.get("country") || undefined;
  const paramHive = searchParams.get("hive") || undefined;
  const paramContextLabel = searchParams.get("context") || undefined;
  // Support both "arrival" (new) and "origin" (legacy) params
  const rawArrival = searchParams.get("arrival") || searchParams.get("origin") || undefined;
  const paramArrival: ArrivalOrigin | null = rawArrival && VALID_ARRIVALS.has(rawArrival) ? (rawArrival as ArrivalOrigin) : null;
  const paramJourney = searchParams.get("journey") === "1";
  const paramBbox = searchParams.get("bbox") || undefined;
  const [journeyActive, setJourneyActive] = useState(paramJourney);

  const [selectedView, setSelectedView] = useState("collective");
  const [selectedSpecies, setSelectedSpecies] = useState(paramSpecies || "all");
  const { showEntrance, dismissEntrance } = useEntranceOnce("map");
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreenMap();
  const [showBlessing, setShowBlessing] = useState(() => !isBlessingDismissed());
  const countryEntry = paramCountry ? getEntryBySlug(paramCountry) : undefined;
  const countryLabel = countryEntry?.country || (paramCountry ? paramCountry.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) : "");

  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);

  if (showEntrance) {
    return <LevelEntrance phases={[{ src: "/images/hero-trees/ancient-oak-mist.jpeg", alt: "The Roots" }]} phaseDuration={1200} fadeDuration={600} onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="fixed inset-0 z-[10] bg-background">
      {/* Map renders immediately — preloads while blessing is visible */}
      <Map initialView={selectedView} initialSpecies={selectedSpecies} initialW3w={paramW3w} initialLat={paramLat} initialLng={paramLng} initialZoom={paramZoom} initialTreeId={paramTreeId} initialCountry={paramCountry} initialHive={paramHive} initialOrigin={paramArrival || undefined} initialJourney={paramJourney} initialBbox={paramBbox} onFullscreenToggle={toggleFullscreen} isFullscreen={isFullscreen} onJourneyEnd={() => setJourneyActive(false)} />
      <MapJourneyOverlay active={journeyActive} />
      
      {/* Arrival banner — contextual breadcrumb showing how you arrived */}
      {!showBlessing && !isFullscreen && paramArrival && (
        <MapArrivalBanner arrival={paramArrival} contextLabel={paramContextLabel} countrySlug={paramCountry} hiveSlug={paramHive} />
      )}

      {/* Persistent return path for country-focused map journeys */}
      {!showBlessing && !isFullscreen && paramCountry && (
        <button
          type="button"
          onClick={() => navigate(`/atlas/${paramCountry}`)}
          className="absolute left-1/2 -translate-x-1/2 z-[24] inline-flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 text-[11px] font-serif tracking-wide text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 6.25rem)" }}
          aria-label={`Return to ${countryLabel}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to {countryLabel}
        </button>
      )}

      {/* Public Tester Blessing — overlays map, shown once */}
      {showBlessing && (
        <PublicTesterBlessing onComplete={() => setShowBlessing(false)} />
      )}

      {/* Standard header — hidden in fullscreen and during blessing */}
      {!isFullscreen && !showBlessing && (
        <>
          <Header />
          <div className="absolute top-14 left-0 right-0 z-[20]">
            <ActiveFilterChips />
          </div>
        </>
      )}

      {/* Fullscreen: compact floating nav */}
      {isFullscreen && (
        <Suspense fallback={null}>
          <FullscreenMapControls onExit={exitFullscreen} />
        </Suspense>
      )}

      {/* Non-critical overlays deferred until after map is interactive */}
      {!showBlessing && (
        <Suspense fallback={null}>
          <MapOnboardingRitual />
          <ContextualWhisper
            id="map-first-tree"
            message="Tap any marker to meet an Ancient Friend, or long-press the map to claim a new encounter."
            delay={8000}
            position="bottom-center"
          />
        </Suspense>
      )}
    </div>
  );
};

export default MapPage;
