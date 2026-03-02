import { useState, useCallback, lazy, Suspense } from "react";
import ActiveFilterChips from "@/components/ActiveFilterChips";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Map from "@/components/Map";
import LevelEntrance from "@/components/LevelEntrance";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { useFullscreenMap } from "@/hooks/use-fullscreen-map";
import { Locate } from "lucide-react";
import { toast } from "sonner";

// Non-critical overlays — lazy-loaded after the map is interactive
const ContextualWhisper = lazy(() => import("@/components/ContextualWhisper"));
const MapOnboardingRitual = lazy(() => import("@/components/MapOnboardingRitual"));
const FullscreenMapControls = lazy(() => import("@/components/FullscreenMapControls"));



const MapPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramW3w = searchParams.get("w3w") || undefined;
  const paramLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const paramLng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;
  const paramZoom = searchParams.get("zoom") ? parseFloat(searchParams.get("zoom")!) : undefined;
  const paramSpecies = searchParams.get("species") || undefined;
  const paramTreeId = searchParams.get("treeId") || undefined;
  const paramCountry = searchParams.get("country") || undefined;
  const paramHive = searchParams.get("hive") || undefined;
  const paramOrigin = searchParams.get("origin") || undefined;

  const [selectedView, setSelectedView] = useState("collective");
  const [selectedSpecies, setSelectedSpecies] = useState(paramSpecies || "all");
  const [locating, setLocating] = useState(false);
  const { showEntrance, dismissEntrance } = useEntranceOnce("map");
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreenMap();

  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        navigate(`/map?lat=${pos.coords.latitude.toFixed(5)}&lng=${pos.coords.longitude.toFixed(5)}&zoom=14`, { replace: true });
      },
      () => {
        setLocating(false);
        toast.error("Could not get your location");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [navigate]);

  if (showEntrance) {
    return <LevelEntrance phases={[{ src: "/images/hero-trees/ancient-oak-mist.jpeg", alt: "The Roots" }]} phaseDuration={1200} fadeDuration={600} onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="fixed inset-0 z-[10] bg-background">
      <Map initialView={selectedView} initialSpecies={selectedSpecies} initialW3w={paramW3w} initialLat={paramLat} initialLng={paramLng} initialZoom={paramZoom} initialTreeId={paramTreeId} initialCountry={paramCountry} initialHive={paramHive} initialOrigin={paramOrigin} onFullscreenToggle={toggleFullscreen} isFullscreen={isFullscreen} />
      
      {/* Standard header — hidden in fullscreen */}
      {!isFullscreen && (
        <>
          <Header />
          <div className="absolute top-14 left-0 right-0 z-[20]">
            <ActiveFilterChips />
          </div>
        </>
      )}

      {/* Trees near me — floating button */}
      <button
        onClick={handleLocateMe}
        disabled={locating}
        className="absolute bottom-24 right-4 z-[25] flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-serif shadow-lg transition-all hover:scale-105 disabled:opacity-50 border border-border/30"
        style={{
          background: 'hsl(var(--card) / 0.9)',
          backdropFilter: 'blur(8px)',
          color: 'hsl(var(--foreground))',
        }}
        title="Trees near me"
      >
        <Locate className={`h-3.5 w-3.5 ${locating ? "animate-pulse" : ""}`} />
        {locating ? "Locating…" : "Trees near me"}
      </button>

      {/* Fullscreen: compact floating nav */}
      {isFullscreen && (
        <Suspense fallback={null}>
          <FullscreenMapControls onExit={exitFullscreen} />
        </Suspense>
      )}

      {/* Non-critical overlays deferred until after map is interactive */}
      <Suspense fallback={null}>
        
        <MapOnboardingRitual />
        <ContextualWhisper
          id="map-first-tree"
          message="Tap any marker to meet an Ancient Friend, or long-press the map to claim a new encounter."
          delay={8000}
          position="bottom-center"
        />
      </Suspense>
    </div>
  );
};

export default MapPage;
