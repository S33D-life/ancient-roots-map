import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LocateFixed, Search, MapPin, Check } from "lucide-react";
import { convertToCoordinates } from "@/utils/what3words";
import mapboxgl from "mapbox-gl";

interface AddTreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  what3words?: string;
}

const MAX_ADJUST_METERS = 43.9; // 144 feet

const AddTreeDialog = ({ open, onOpenChange, latitude: initLat, longitude: initLng, what3words: initialW3w }: AddTreeDialogProps) => {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [what3words, setWhat3words] = useState(initialW3w || "");
  const [lat, setLat] = useState<number | null>(initLat);
  const [lng, setLng] = useState<number | null>(initLng);
  const [loading, setLoading] = useState(false);
  const [fetchingW3w, setFetchingW3w] = useState(false);
  const [findingMe, setFindingMe] = useState(false);
  const [lookingUpW3w, setLookingUpW3w] = useState(false);
  const [adjustMode, setAdjustMode] = useState(false);
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const { toast } = useToast();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const circleAddedRef = useRef(false);

  // Fetch what3words from coordinates
  const fetchWhat3words = async (latitude: number, longitude: number) => {
    setFetchingW3w(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-what3words', {
        body: { mode: 'coordinates-to-words', latitude, longitude }
      });
      if (!error && data?.words) {
        setWhat3words(data.words);
      }
    } catch (err) {
      console.error('Failed to fetch what3words:', err);
    } finally {
      setFetchingW3w(false);
    }
  };

  // Auto-fetch what3words when dialog opens with coordinates
  useState(() => {
    if (open && initLat && initLng && !what3words) {
      setLat(initLat);
      setLng(initLng);
      fetchWhat3words(initLat, initLng);
    }
  });

  // Start adjust mode after Find Me
  const startAdjustMode = useCallback((latitude: number, longitude: number) => {
    setOriginLat(latitude);
    setOriginLng(longitude);
    setLat(latitude);
    setLng(longitude);
    setAdjustMode(true);
  }, []);

  // Haversine distance in meters
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Clamp position to within MAX_ADJUST_METERS of origin
  const clampPosition = useCallback(
    (newLat: number, newLng: number): [number, number] => {
      if (originLat === null || originLng === null) return [newLat, newLng];
      const dist = getDistance(originLat, originLng, newLat, newLng);
      if (dist <= MAX_ADJUST_METERS) return [newLat, newLng];
      // Scale back to boundary
      const ratio = MAX_ADJUST_METERS / dist;
      return [
        originLat + (newLat - originLat) * ratio,
        originLng + (newLng - originLng) * ratio,
      ];
    },
    [originLat, originLng]
  );

  // Init satellite map for adjustment
  useEffect(() => {
    if (!adjustMode || !mapContainerRef.current || lat === null || lng === null) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZWR0aHVybG93IiwiYSI6ImNtaHVqYmpodzAwaTEybHNiejQ0dWF1dTcifQ.4hKTe_0HtkKJa3CCjbHMMg';
    circleAddedRef.current = false;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [lng, lat],
      zoom: 19,
      maxZoom: 22,
    });

    const marker = new mapboxgl.Marker({
      color: "hsl(42, 95%, 55%)",
      draggable: true,
    })
      .setLngLat([lng, lat])
      .addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      const [clampedLat, clampedLng] = clampPosition(pos.lat, pos.lng);
      if (clampedLat !== pos.lat || clampedLng !== pos.lng) {
        marker.setLngLat([clampedLng, clampedLat]);
      }
      setLat(clampedLat);
      setLng(clampedLng);
    });

    map.on("load", () => {
      if (circleAddedRef.current) return;
      circleAddedRef.current = true;
      // Draw 144ft radius circle
      const circleGeoJSON = createCircleGeoJSON(lng, lat, MAX_ADJUST_METERS);
      map.addSource("adjust-radius", { type: "geojson", data: circleGeoJSON });
      map.addLayer({
        id: "adjust-radius-fill",
        type: "fill",
        source: "adjust-radius",
        paint: {
          "fill-color": "hsl(42, 95%, 55%)",
          "fill-opacity": 0.1,
        },
      });
      map.addLayer({
        id: "adjust-radius-border",
        type: "line",
        source: "adjust-radius",
        paint: {
          "line-color": "hsl(42, 95%, 55%)",
          "line-width": 2,
          "line-dasharray": [3, 2],
          "line-opacity": 0.6,
        },
      });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [adjustMode]);

  const confirmAdjustment = () => {
    setAdjustMode(false);
    if (lat !== null && lng !== null) {
      fetchWhat3words(lat, lng);
    }
    toast({ title: "Location confirmed", description: `${lat?.toFixed(6)}, ${lng?.toFixed(6)}` });
  };

  // Find Me — use geolocation to get current position
  const handleFindMe = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Your browser doesn't support geolocation", variant: "destructive" });
      return;
    }
    setFindingMe(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFindingMe(false);
        startAdjustMode(latitude, longitude);
      },
      (err) => {
        setFindingMe(false);
        toast({ title: "Location error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Look up what3words address to get coordinates
  const handleLookupW3w = async () => {
    const trimmed = what3words.trim();
    if (!trimmed) return;
    setLookingUpW3w(true);
    try {
      const result = await convertToCoordinates(trimmed);
      if (result?.coordinates) {
        setLat(result.coordinates.lat);
        setLng(result.coordinates.lng);
        setWhat3words(result.words);
        toast({ title: "Location found!", description: `${result.coordinates.lat.toFixed(6)}, ${result.coordinates.lng.toFixed(6)}` });
      } else {
        toast({ title: "Not found", description: "Could not resolve that what3words address", variant: "destructive" });
      }
    } catch (err: any) {
      if (err.message === 'quota_exceeded') {
        toast({ title: "Quota exceeded", description: "what3words API quota reached. Try again later.", variant: "destructive" });
      } else {
        toast({ title: "Lookup failed", description: "Could not look up the address", variant: "destructive" });
      }
    } finally {
      setLookingUpW3w(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !species.trim()) {
      toast({ title: "Missing fields", description: "Please fill in name and species", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({ title: "Not authenticated", description: "Please sign in to add trees", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from('trees').insert({
        name: name.trim(),
        species: species.trim(),
        description: description.trim() || null,
        what3words: what3words.trim() || '',
        latitude: lat,
        longitude: lng,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Tree added! 🌳",
        description: `${name} has been added to the map`,
        action: (
          <Button variant="outline" size="sm" className="font-serif text-xs" onClick={() => {
            // Bridge prompt to add an offering
            window.dispatchEvent(new CustomEvent('open-offering-prompt', { detail: { treeName: name } }));
          }}>
            Leave an offering →
          </Button>
        ),
      });
      setName("");
      setSpecies("");
      setDescription("");
      setWhat3words("");
      setLat(null);
      setLng(null);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error adding tree", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setAdjustMode(false); onOpenChange(v); }}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary font-serif">
            {adjustMode ? "Adjust Tree Location" : "Add a Tree"}
          </DialogTitle>
        </DialogHeader>

        {adjustMode ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-serif">
              Drag the marker to fine-tune the tree's location. You can adjust up to <strong>144 feet</strong> (≈44m) from your GPS position.
            </p>
            <div
              ref={mapContainerRef}
              className="w-full rounded-lg border border-border overflow-hidden"
              style={{ height: 300 }}
            />
            {lat !== null && lng !== null && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                {originLat !== null && originLng !== null && (
                  <span className="ml-auto">
                    {Math.round(getDistance(originLat, originLng, lat, lng) * 3.28084)} ft from GPS
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setAdjustMode(false); setLat(originLat); setLng(originLng); }}>
                Skip
              </Button>
              <Button className="flex-1 gap-1.5" onClick={confirmAdjustment}>
                <Check className="h-4 w-4" />
                Confirm Location
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tree Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value.slice(0, 200))} placeholder="e.g., The Old Oak" maxLength={200} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
              <Input id="species" value={species} onChange={(e) => setSpecies(e.target.value.slice(0, 200))} placeholder="e.g., Quercus robur" maxLength={200} required />
            </div>

            {/* what3words with lookup */}
            <div className="space-y-2">
              <Label htmlFor="what3words">
                what3words
                {fetchingW3w && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="what3words"
                  value={what3words}
                  onChange={(e) => setWhat3words(e.target.value)}
                  placeholder="e.g., filled.count.soap"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleLookupW3w}
                  disabled={lookingUpW3w || !what3words.trim()}
                  title="Look up what3words address"
                >
                  {lookingUpW3w ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Find Me button */}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleFindMe}
              disabled={findingMe}
            >
              {findingMe ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              Find Me — Use My Location
            </Button>

            {lat && lng && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>📍 {lat.toFixed(6)}, {lng.toFixed(6)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => startAdjustMode(lat, lng)}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Adjust on map
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 2000))} placeholder="Tell us about this tree..." maxLength={2000} rows={3} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Tree
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Generate a GeoJSON circle polygon
function createCircleGeoJSON(lng: number, lat: number, radiusMeters: number, steps = 64) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const dLng = dx / (111320 * Math.cos((lat * Math.PI) / 180));
    const dLat = dy / 110540;
    coords.push([lng + dLng, lat + dLat]);
  }
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coords] },
    properties: {},
  };
}

export default AddTreeDialog;
