import { useState, useCallback, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Map from "@/components/Map";
import RootsEntrance from "@/components/RootsEntrance";
import { useEntranceOnce } from "@/hooks/use-entrance-once";

// Non-critical overlays — lazy-loaded after the map is interactive
const ContextualWhisper = lazy(() => import("@/components/ContextualWhisper"));
const MapOnboardingRitual = lazy(() => import("@/components/MapOnboardingRitual"));


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

  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);

  if (showEntrance) {
    return <RootsEntrance onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="fixed inset-0 z-[10] bg-background">
      <Map initialView={selectedView} initialSpecies={selectedSpecies} initialW3w={paramW3w} initialLat={paramLat} initialLng={paramLng} initialZoom={paramZoom} initialTreeId={paramTreeId} />
      <Header />
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
