import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Map from "@/components/Map";
import RootsEntrance from "@/components/RootsEntrance";

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const paramW3w = searchParams.get("w3w") || undefined;
  const paramLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const paramLng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;
  const paramZoom = searchParams.get("zoom") ? parseFloat(searchParams.get("zoom")!) : undefined;
  const paramSpecies = searchParams.get("species") || undefined;

  const [selectedView, setSelectedView] = useState("collective");
  const [selectedSpecies, setSelectedSpecies] = useState(paramSpecies || "all");
  const [showEntrance, setShowEntrance] = useState(true);

  const handleEntranceComplete = useCallback(() => setShowEntrance(false), []);

  if (showEntrance) {
    return <RootsEntrance onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="fixed inset-0 z-[1]" style={{ background: 'hsl(100 20% 10%)' }}>
      <Map initialView={selectedView} initialSpecies={selectedSpecies} initialW3w={paramW3w} initialLat={paramLat} initialLng={paramLng} initialZoom={paramZoom} />
      <Header />
    </div>
  );
};

export default MapPage;
