/**
 * AddTreeChooser — Bottom-sheet chooser that intercepts the + button
 * and presents two clear paths: Add New Tree vs Check In to Existing.
 * Shows nearby trees preview to reduce duplicate creation.
 */
import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  TreeDeciduous, Plus, MapPin, Loader2, CheckCircle2, Navigation, RefreshCw,
} from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";

interface NearbyTreePreview {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  photo_thumb_url?: string | null;
}

interface AddTreeChooserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user wants to add a brand new tree */
  onAddNew: () => void;
  /** Called when user selects an existing tree to check in */
  onCheckIn: (treeId: string) => void;
  /** Called when user wants the full nearby picker */
  onShowFullNearby: () => void;
  /** Map-center coords as fallback */
  mapCenter?: { lat: number; lng: number } | null;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m: number): string {
  if (m < 100) return `${Math.round(m)}m`;
  if (m < 1000) return `${Math.round(m / 10) * 10}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

const PREVIEW_RADIUS = 100; // meters for preview
const PREVIEW_LIMIT = 5;

export default function AddTreeChooser({
  open,
  onOpenChange,
  onAddNew,
  onCheckIn,
  onShowFullNearby,
  mapCenter,
}: AddTreeChooserProps) {
  const geo = useGeolocation();
  const [trees, setTrees] = useState<NearbyTreePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [locating, setLocating] = useState(false);

  const userLat = geo.position?.lat ?? null;
  const userLng = geo.position?.lng ?? null;

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    const delta = PREVIEW_RADIUS / 111320;
    const { data } = await supabase
      .from("trees")
      .select("id, name, species, latitude, longitude, photo_thumb_url")
      .gte("latitude", lat - delta)
      .lte("latitude", lat + delta)
      .gte("longitude", lng - delta)
      .lte("longitude", lng + delta)
      .limit(50);

    if (data) {
      const withDist = data
        .filter((t: any) => t.latitude && t.longitude)
        .map((t: any) => ({
          ...t,
          distanceM: haversineM(lat, lng, t.latitude, t.longitude),
        }))
        .filter((t: any) => t.distanceM <= PREVIEW_RADIUS)
        .sort((a: any, b: any) => a.distanceM - b.distanceM)
        .slice(0, PREVIEW_LIMIT);
      setTrees(withDist);
    } else {
      setTrees([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (userLat && userLng) {
      setHasLocation(true);
      fetchNearby(userLat, userLng);
    } else if (mapCenter) {
      setHasLocation(false);
      fetchNearby(mapCenter.lat, mapCenter.lng);
    }
  }, [open, userLat, userLng, mapCenter, fetchNearby]);

  const handleLocate = () => {
    setLocating(true);
    geo.locate("add-tree-chooser");
    setTimeout(() => setLocating(false), 3000);
  };

  const handleAddNew = () => {
    onOpenChange(false);
    onAddNew();
  };

  const handleCheckIn = (treeId: string) => {
    onOpenChange(false);
    onCheckIn(treeId);
  };

  const handleFullNearby = () => {
    onOpenChange(false);
    onShowFullNearby();
  };

  const hasNearby = trees.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t max-h-[85dvh] overflow-y-auto"
        style={{
          background: "hsl(var(--card) / 0.97)",
          borderColor: "hsl(var(--border) / 0.2)",
          backdropFilter: "blur(20px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        {/* Header */}
        <div className="text-center pt-2 pb-4">
          <div
            className="w-10 h-1 rounded-full mx-auto mb-4"
            style={{ background: "hsl(var(--muted-foreground) / 0.2)" }}
          />
          <h2 className="text-lg font-serif text-foreground">What would you like to do?</h2>
          <p className="text-xs text-muted-foreground font-serif mt-1">
            See if an Ancient Friend is already nearby before planting a new record.
          </p>
        </div>

        {/* Nearby Trees Preview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-serif text-muted-foreground uppercase tracking-wider">
              Nearby Ancient Friends
              {hasLocation && (
                <span className="ml-1.5 text-primary/60">• GPS</span>
              )}
            </h3>
            {!hasLocation && (
              <button
                onClick={handleLocate}
                className="flex items-center gap-1 text-[10px] font-serif text-primary/70 hover:text-primary transition-colors"
              >
                {locating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                Use GPS
              </button>
            )}
            {hasLocation && (
              <button
                onClick={() => userLat && userLng && fetchNearby(userLat, userLng)}
                className="flex items-center gap-1 text-[10px] font-serif text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : hasNearby ? (
            <div className="space-y-1.5">
              {trees.map((tree) => (
                <button
                  key={tree.id}
                  onClick={() => handleCheckIn(tree.id)}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left group"
                  style={{
                    background: "hsl(var(--secondary) / 0.3)",
                    border: "1px solid hsl(var(--border) / 0.15)",
                  }}
                >
                  {/* Thumbnail or icon */}
                  <div
                    className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
                    style={{
                      background: "hsl(var(--accent) / 0.1)",
                      border: "1px solid hsl(var(--accent) / 0.2)",
                    }}
                  >
                    {tree.photo_thumb_url ? (
                      <img
                        src={tree.photo_thumb_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <TreeDeciduous className="w-5 h-5 text-accent/60" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-serif text-foreground truncate group-hover:text-primary transition-colors">
                      {tree.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {tree.species && (
                        <span className="text-[10px] text-muted-foreground italic truncate">
                          {tree.species}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: "hsl(var(--primary) / 0.7)" }}
                    >
                      {formatDistance(tree.distanceM)}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent/40 group-hover:text-accent transition-colors" />
                  </div>
                </button>
              ))}

              {/* Show more nearby */}
              <button
                onClick={handleFullNearby}
                className="w-full text-center py-2 text-xs font-serif text-primary/60 hover:text-primary transition-colors"
              >
                See more nearby trees →
              </button>
            </div>
          ) : (
            <div
              className="rounded-xl px-4 py-5 text-center"
              style={{
                background: "hsl(var(--secondary) / 0.2)",
                border: "1px dashed hsl(var(--border) / 0.2)",
              }}
            >
              <MapPin className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground/40" />
              <p className="text-xs font-serif text-muted-foreground/60">
                No Ancient Friends found within {PREVIEW_RADIUS}m
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pb-2">
          {hasNearby ? (
            <>
              {/* When nearby trees exist, encourage check-in first */}
              <Button
                onClick={handleFullNearby}
                className="w-full h-12 gap-2.5 font-serif text-sm"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
                Check in to Existing Tree
              </Button>
              <Button
                variant="outline"
                onClick={handleAddNew}
                className="w-full h-12 gap-2.5 font-serif text-sm"
                style={{
                  borderColor: "hsl(var(--border) / 0.3)",
                  color: "hsl(var(--foreground) / 0.8)",
                }}
              >
                <Plus className="w-4.5 h-4.5" />
                Add New Tree
              </Button>
            </>
          ) : (
            <>
              {/* When no nearby trees, emphasise adding new */}
              <Button
                onClick={handleAddNew}
                className="w-full h-12 gap-2.5 font-serif text-sm"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                <Plus className="w-4.5 h-4.5" />
                Add New Tree
              </Button>
              <Button
                variant="outline"
                onClick={handleFullNearby}
                className="w-full h-12 gap-2.5 font-serif text-sm"
                style={{
                  borderColor: "hsl(var(--border) / 0.3)",
                  color: "hsl(var(--foreground) / 0.8)",
                }}
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
                Check in to Existing Tree
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
