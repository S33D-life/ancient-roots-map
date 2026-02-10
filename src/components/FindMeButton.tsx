import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LocateFixed, MapPin, AlertTriangle, Navigation, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddTreeDialog from "./AddTreeDialog";

interface FindMeButtonProps {
  onLocationFound?: (lat: number, lng: number) => void;
  autoOpen?: boolean;
}

type GeoState = "idle" | "requesting" | "granted" | "denied" | "unavailable" | "timeout" | "manual";

const FindMeButton = ({ onLocationFound, autoOpen }: FindMeButtonProps) => {
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualW3w, setManualW3w] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const { toast } = useToast();

  // Check permission state on mount (Permissions API supported in Chrome/Edge/Firefox)
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "denied") {
          setGeoState("denied");
        }
        result.addEventListener("change", () => {
          if (result.state === "denied") setGeoState("denied");
          else if (result.state === "granted") setGeoState("idle");
        });
      }).catch(() => {
        // Permissions API not supported for geolocation in this browser — that's fine
      });
    }
  }, []);

  useEffect(() => {
    if (autoOpen) handleFindMe();
  }, [autoOpen]);

  const handleFindMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState("unavailable");
      setShowFallback(true);
      return;
    }

    setGeoState("requesting");
    setShowFallback(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setGeoState("granted");
        onLocationFound?.(latitude, longitude);
        setDialogOpen(true);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoState("denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoState("unavailable");
            break;
          case error.TIMEOUT:
            setGeoState("timeout");
            break;
          default:
            setGeoState("unavailable");
        }
        setShowFallback(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, [onLocationFound]);

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
    // Open dialog with what3words pre-filled, no coordinates
    setLocation(null);
    setShowFallback(false);
    setDialogOpen(true);
  };

  const closeFallback = () => {
    setShowFallback(false);
    setGeoState("idle");
  };

  const errorConfig: Record<string, { title: string; message: string; help: string }> = {
    denied: {
      title: "Location Access Blocked",
      message: "Your browser is blocking location access for this site.",
      help: "To enable: open your browser settings → Privacy/Site Settings → Location → allow this site. Then try again.",
    },
    unavailable: {
      title: "Location Unavailable",
      message: "We couldn't determine your position. This can happen indoors or with weak GPS signal.",
      help: "Try moving outdoors or near a window, or use the manual entry options below.",
    },
    timeout: {
      title: "Location Timed Out",
      message: "Getting your position took too long.",
      help: "This often happens with weak GPS. Try again or use manual entry below.",
    },
  };

  return (
    <>
      <div className="relative">
        <Button
          onClick={handleFindMe}
          disabled={geoState === "requesting"}
          variant="mystical"
          className="shadow-lg bg-[hsl(120,30%,15%)] hover:bg-[hsl(120,30%,20%)] text-[hsl(42,95%,55%)] border border-[hsl(42,60%,40%)]"
          style={{ textShadow: '0 0 8px hsla(42, 95%, 55%, 0.6), 0 0 16px hsla(42, 95%, 55%, 0.3)' }}
        >
          {geoState === "requesting" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : geoState === "denied" ? (
            <AlertTriangle className="h-4 w-4 mr-2" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          {geoState === "requesting" ? "Locating..." : "Find Me & Add Tree"}
        </Button>

        {/* Fallback Card */}
        {showFallback && (
          <Card className="absolute bottom-full mb-2 left-0 w-80 z-50 border-border bg-card/95 backdrop-blur shadow-xl animate-fade-in">
            <CardContent className="p-4 space-y-4">
              {/* Error message */}
              {geoState in errorConfig && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-serif font-semibold text-foreground">
                        {errorConfig[geoState].title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {errorConfig[geoState].message}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-lg p-2">
                    💡 {errorConfig[geoState].help}
                  </p>
                </div>
              )}

              {/* Retry */}
              {(geoState === "timeout" || geoState === "unavailable") && (
                <Button variant="outline" size="sm" className="w-full gap-2 font-serif text-xs" onClick={handleFindMe}>
                  <LocateFixed className="h-3 w-3" />
                  Try Again
                </Button>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
                </div>
              </div>

              {/* Manual what3words */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">what3words address</Label>
                <div className="flex gap-1.5">
                  <Input
                    value={manualW3w}
                    onChange={(e) => setManualW3w(e.target.value)}
                    placeholder="filled.count.soap"
                    className="text-xs h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleManualW3w}
                    disabled={!manualW3w.trim()}
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Manual lat/lng */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">Coordinates</Label>
                <div className="flex gap-1.5">
                  <Input
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="Lat"
                    type="number"
                    step="any"
                    className="text-xs h-8"
                  />
                  <Input
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="Lng"
                    type="number"
                    step="any"
                    className="text-xs h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleManualCoords}
                    disabled={!manualLat || !manualLng}
                  >
                    <MapPin className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Close */}
              <button onClick={closeFallback} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-center">
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
