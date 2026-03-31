import { useEffect, useState, useMemo, lazy, Suspense, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOfferingCounts } from "@/hooks/use-offering-counts";
import { useTreeMapData } from "@/hooks/use-tree-map-data";
import { useQuery } from "@tanstack/react-query";

// The single active renderer — owns all map lifecycle, deep-links, markers, layers
const LeafletFallbackMap = lazy(() => import("./LeafletFallbackMap"));

interface MapProps {
  initialView?: string;
  initialSpecies?: string;
  initialW3w?: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
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

const Map = memo(({
  initialView,
  initialSpecies,
  initialW3w,
  initialLat,
  initialLng,
  initialZoom,
  initialTreeId,
  initialCountry,
  initialHive,
  initialOrigin,
  initialJourney,
  initialBbox,
  onFullscreenToggle,
  isFullscreen,
  onJourneyEnd,
}: MapProps) => {
  const [searchParams] = useSearchParams();
  const autoAddTree = searchParams.get("addTree") === "true";

  // Tree data via React Query — cached, realtime-invalidated
  const { trees, birdsongCounts, birdsongHeatPoints, bloomedSeeds } = useTreeMapData();

  // Unified offering counts from shared hook
  const { counts: offeringCounts, photos: treePhotos } = useOfferingCounts();

  // Heart pool counts for map popup CTAs
  const { data: heartPoolCounts = {} } = useQuery({
    queryKey: ["heart-pool-counts-map"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("tree_heart_pools")
        .select("tree_id, total_hearts")
        .gt("total_hearts", 0);
      const map: Record<string, number> = {};
      for (const row of data || []) map[row.tree_id] = row.total_hearts;
      return map;
    },
  });

  // Get current user
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);


  return (
    <div className="absolute inset-0 z-[1]" style={{ height: "100svh" }}>
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <p className="font-serif text-sm text-foreground">Loading map…</p>
          </div>
        }
      >
        <LeafletFallbackMap
          trees={trees}
          offeringCounts={offeringCounts}
          treePhotos={treePhotos}
          birdsongCounts={birdsongCounts}
          birdsongHeatPoints={birdsongHeatPoints}
          bloomedSeeds={bloomedSeeds}
          userId={userId}
          initialLat={initialLat}
          initialLng={initialLng}
          initialZoom={initialZoom}
          initialW3w={initialW3w}
          initialTreeId={initialTreeId}
          initialCountry={initialCountry}
          initialHive={initialHive}
          initialOrigin={initialOrigin}
          initialJourney={initialJourney}
          initialBbox={initialBbox}
          onFullscreenToggle={onFullscreenToggle}
          isFullscreen={isFullscreen}
          onJourneyEnd={onJourneyEnd}
        />
      </Suspense>
    </div>
  );
});

Map.displayName = "Map";

export default Map;
