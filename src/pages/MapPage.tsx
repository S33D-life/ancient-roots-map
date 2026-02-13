import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Map from "@/components/Map";
import ContextualWhisper from "@/components/ContextualWhisper";
import MapOnboardingRitual from "@/components/MapOnboardingRitual";
import MapJourneyIndicator from "@/components/MapJourneyIndicator";
import RootsEntrance from "@/components/RootsEntrance";
import { useEntranceOnce } from "@/hooks/use-entrance-once";

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const paramW3w = searchParams.get("w3w") || undefined;
  const paramLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const paramLng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;
  const paramZoom = searchParams.get("zoom") ? parseFloat(searchParams.get("zoom")!) : undefined;
  const paramSpecies = searchParams.get("species") || undefined;

  const [selectedView, setSelectedView] = useState("collective");
  const [selectedSpecies, setSelectedSpecies] = useState(paramSpecies || "all");
  const { showEntrance, dismissEntrance } = useEntranceOnce("map");

  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);

  if (showEntrance) {
    return <RootsEntrance onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="fixed inset-0 z-[10] bg-background">
      <Map initialView={selectedView} initialSpecies={selectedSpecies} initialW3w={paramW3w} initialLat={paramLat} initialLng={paramLng} initialZoom={paramZoom} />
      <Header />
      {/* Journey indicator — shows user's stats on map */}
      <MapJourneyIndicator />
      {/* Immersive first-visit ritual */}
      <MapOnboardingRitual />
      <ContextualWhisper
        id="map-first-tree"
        message="Tap any marker to meet an Ancient Friend, or long-press the map to claim a new encounter."
        delay={8000}
        position="bottom-center"
      />
    </div>
  );
};

export default MapPage;
