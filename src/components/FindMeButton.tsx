/**
 * FindMeButton — used on the MapLibre map (Map.tsx) for desktop + mobile.
 * Uses the shared useGeolocation hook as single source of truth.
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Crosshair, MapPin, AlertTriangle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation, GEO_ERROR_CONFIG } from "@/hooks/use-geolocation";
import AddTreeDialog from "./AddTreeDialog";
import DiscoveryNudge from "./DiscoveryNudge";

interface FindMeButtonProps {
  onLocationFound?: (lat: number, lng: number) => void;
  autoOpen?: boolean;
}

const FindMeButton = ({ onLocationFound, autoOpen }: FindMeButtonProps) => {
  const geo = useGeolocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualW3w, setManualW3w] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (autoOpen) handleFindMe();
  }, [autoOpen]);

  const handleFindMe = async () => {
    const result = await geo.locate("find-me-button");
    if (result) {
      setLocation({ lat: result.lat, lng: result.lng });
      onLocationFound?.(result.lat, result.lng);
      setShowFallback(false);
      setDialogOpen(true);
    } else {
      setShowFallback(true);
    }
  };

  const handleManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({ title: "Invalid coordinates", description: "Latitude: -90 to 90, Longitude: -180 to 180", variant: "destructive" });
      return;
    }
    setLocation({ lat, lng });
    onLocationFound?.(lat, lng);
    setShowFallback(false);
    setDialogOpen(true);
  };

  const handleManualW3w = () => {
    setLocation(null);
    setShowFallback(false);
    setDialogOpen(true);
  };

  const errorInfo = geo.error ? GEO_ERROR_CONFIG[geo.error.code] : null;

  return (
    <>
      <div className="relative">
        <Button
          onClick={handleFindMe}
          disabled={geo.isLocating}
          variant="mystical"
          className="shadow-lg bg-[hsl(120,30%,15%)] hover:bg-[hsl(120,30%,20%)] text-[hsl(42,95%,55%)] border border-[hsl(42,60%,40%)]"
          style={{ textShadow: '0 0 8px hsla(42, 95%, 55%, 0.6), 0 0 16px hsla(42, 95%, 55%, 0.3)' }}
        >
          {geo.isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : geo.permission === "denied" ? (
            <AlertTriangle className="h-4 w-4 mr-2" />
          ) : (
            <Crosshair className="h-4 w-4 mr-2" />
          )}
          {geo.isLocating ? "Locating..." : "Find Me & Add Tree"}
        </Button>

        {/* Fallback Card */}
        {showFallback && errorInfo && (
          <Card className="absolute bottom-full mb-2 left-0 w-80 z-50 border-border bg-card/95 backdrop-blur shadow-xl animate-fade-in">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-serif font-semibold text-foreground">{errorInfo.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{errorInfo.message}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-lg p-2">
                  💡 {errorInfo.help}
                </p>
              </div>

              {(geo.error?.code === "timeout" || geo.error?.code === "unavailable") && (
                <Button variant="outline" size="sm" className="w-full gap-2 font-serif text-xs" onClick={handleFindMe}>
                  <Crosshair className="h-3 w-3" /> Try Again
                </Button>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">what3words address</Label>
                <div className="flex gap-1.5">
                  <Input value={manualW3w} onChange={(e) => setManualW3w(e.target.value)} placeholder="filled.count.soap" className="text-xs h-8" />
                  <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleManualW3w} disabled={!manualW3w.trim()}>
                    <Search className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">Coordinates</Label>
                <div className="flex gap-1.5">
                  <Input value={manualLat} onChange={(e) => setManualLat(e.target.value)} placeholder="Lat" type="number" step="any" className="text-xs h-8" />
                  <Input value={manualLng} onChange={(e) => setManualLng(e.target.value)} placeholder="Lng" type="number" step="any" className="text-xs h-8" />
                  <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleManualCoords} disabled={!manualLat || !manualLng}>
                    <MapPin className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <button onClick={() => setShowFallback(false)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-center">
                Dismiss
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddTreeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        latitude={location?.lat || null}
        longitude={location?.lng || null}
        what3words={manualW3w.trim() || undefined}
      />
    </>
  );
};

export default FindMeButton;
