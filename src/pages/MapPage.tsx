import { useState, useCallback, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Map from "@/components/Map";
import RootsEntrance from "@/components/RootsEntrance";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { useFullscreenMap } from "@/hooks/use-fullscreen-map";
import { Maximize2 } from "lucide-react";

// Non-critical overlays — lazy-loaded after the map is interactive
const ContextualWhisper = lazy(() => import("@/components/ContextualWhisper"));
const MapOnboardingRitual = lazy(() => import("@/components/MapOnboardingRitual"));
const FullscreenMapControls = lazy(() => import("@/components/FullscreenMapControls"));


const MapPage = () => {
  const [searchParams] = useSearchParams();
  const paramW3w = searchParams.get("w3w") || undefined;
  const paramLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const paramLng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;
  const paramZoom = searchParams.get("zoom") ? parseFloat(searchParams.get("zoom")!) : undefined;
  const paramSpecies = searchParams.get("species") || undefined;
  const paramTreeId = searchParams.get("treeId") || undefined;

  const [selectedView, setSelectedView] = useState("collective");
  const [selectedSpecies, setSelectedSpecies] = useState(paramSpecies || "all");
  const { showEntrance, dismissEntrance } = useEntranceOnce("map");
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreenMap();

  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);

  if (showEntrance) {
    return <RootsEntrance onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="fixed inset-0 z-[10] bg-background">
      <Map initialView={selectedView} initialSpecies={selectedSpecies} initialW3w={paramW3w} initialLat={paramLat} initialLng={paramLng} initialZoom={paramZoom} initialTreeId={paramTreeId} />
      
      {/* Standard header — hidden in fullscreen */}
      {!isFullscreen && <Header />}

      {/* Fullscreen: compact floating nav */}
      {isFullscreen && (
        <Suspense fallback={null}>
          <FullscreenMapControls onExit={exitFullscreen} />
        </Suspense>
      )}

      {/* Fullscreen toggle button — shown when NOT in fullscreen */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-16 right-3 z-[51] flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-serif transition-all hover:brightness-125 active:scale-95"
          style={{
            background: "hsl(var(--card) / 0.75)",
            color: "hsl(var(--foreground) / 0.8)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid hsl(var(--border) / 0.25)",
            boxShadow: "0 2px 12px hsl(0 0% 0% / 0.2)",
          }}
          title="Enter Full Screen"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden md:inline">Full Screen</span>
        </button>
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
