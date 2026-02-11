import { useState, useEffect, useRef, useCallback } from "react";
import { getMapStyle } from "@/config/mapbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LocateFixed, Search, MapPin, Check, TreeDeciduous, Feather, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { convertToCoordinates, convertToWhat3Words } from "@/utils/what3words";
import maplibregl from "maplibre-gl";

interface AddTreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  what3words?: string;
}

type RitualStep = "encounter" | "reflection" | "offering";

const STEPS: { key: RitualStep; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "encounter", label: "Encounter", icon: MapPin, desc: "Where did you find this ancient friend?" },
  { key: "reflection", label: "Reflection", icon: Feather, desc: "What do you see? What do you feel?" },
  { key: "offering", label: "Offering", icon: Sparkles, desc: "Leave a gift for those who follow" },
];

const MAX_ADJUST_METERS = 43.9;

const AddTreeDialog = ({ open, onOpenChange, latitude: initLat, longitude: initLng, what3words: initialW3w }: AddTreeDialogProps) => {
  const [step, setStep] = useState<RitualStep>("encounter");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedAge, setEstimatedAge] = useState("");
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
  const [savedTreeId, setSavedTreeId] = useState<string | null>(null);
  const [transitionDir, setTransitionDir] = useState<"forward" | "back">("forward");
  const { toast } = useToast();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const circleAddedRef = useRef(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("encounter");
      setName("");
      setSpecies("");
      setDescription("");
      setEstimatedAge("");
      setWhat3words(initialW3w || "");
      setLat(initLat);
      setLng(initLng);
      setAdjustMode(false);
      setSavedTreeId(null);
    }
  }, [open]);

  // Sync initial coords
  useEffect(() => {
    if (open && initLat && initLng) {
      setLat(initLat);
      setLng(initLng);
      if (!what3words) fetchWhat3words(initLat, initLng);
    }
  }, [open, initLat, initLng]);

  const fetchWhat3words = async (latitude: number, longitude: number) => {
    setFetchingW3w(true);
    try {
      const result = await convertToWhat3Words(latitude, longitude);
      if (result) setWhat3words(result);
    } catch (err) {
      console.error('Failed to fetch what3words:', err);
    } finally {
      setFetchingW3w(false);
    }
  };

  const startAdjustMode = useCallback((latitude: number, longitude: number) => {
    setOriginLat(latitude);
    setOriginLng(longitude);
    setLat(latitude);
    setLng(longitude);
    setAdjustMode(true);
  }, []);

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const clampPosition = useCallback(
    (newLat: number, newLng: number): [number, number] => {
      if (originLat === null || originLng === null) return [newLat, newLng];
      const dist = getDistance(originLat, originLng, newLat, newLng);
      if (dist <= MAX_ADJUST_METERS) return [newLat, newLng];
      const ratio = MAX_ADJUST_METERS / dist;
      return [originLat + (newLat - originLat) * ratio, originLng + (newLng - originLng) * ratio];
    },
    [originLat, originLng]
  );

  // Satellite map for adjustment
  useEffect(() => {
    if (!adjustMode || !mapContainerRef.current || lat === null || lng === null) return;
    circleAddedRef.current = false;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle() as any,
      center: [lng, lat],
      zoom: 19,
      maxZoom: 22,
    });

    const markerEl = document.createElement('div');
    markerEl.style.cssText = 'width:24px;height:24px;border-radius:50%;background:hsl(42,95%,55%);border:2px solid white;cursor:grab;';
    const marker = new maplibregl.Marker({ element: markerEl, draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      const [clampedLat, clampedLng] = clampPosition(pos.lat, pos.lng);
      if (clampedLat !== pos.lat || clampedLng !== pos.lng) marker.setLngLat([clampedLng, clampedLat]);
      setLat(clampedLat);
      setLng(clampedLng);
    });

    map.on("load", () => {
      if (circleAddedRef.current) return;
      circleAddedRef.current = true;
      const circleGeoJSON = createCircleGeoJSON(lng, lat, MAX_ADJUST_METERS);
      map.addSource("adjust-radius", { type: "geojson", data: circleGeoJSON });
      map.addLayer({ id: "adjust-radius-fill", type: "fill", source: "adjust-radius", paint: { "fill-color": "hsl(42, 95%, 55%)", "fill-opacity": 0.1 } });
      map.addLayer({ id: "adjust-radius-border", type: "line", source: "adjust-radius", paint: { "line-color": "hsl(42, 95%, 55%)", "line-width": 2, "line-dasharray": [3, 2], "line-opacity": 0.6 } });
    });

    mapRef.current = map;
    markerRef.current = marker;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, [adjustMode]);

  const confirmAdjustment = () => {
    setAdjustMode(false);
    if (lat !== null && lng !== null) fetchWhat3words(lat, lng);
    toast({ title: "Location confirmed", description: `${lat?.toFixed(6)}, ${lng?.toFixed(6)}` });
  };

  const handleFindMe = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Your browser doesn't support geolocation", variant: "destructive" });
      return;
    }
    setFindingMe(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setFindingMe(false); startAdjustMode(pos.coords.latitude, pos.coords.longitude); },
      (err) => { setFindingMe(false); toast({ title: "Location error", description: err.message, variant: "destructive" }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
      toast({ title: "Lookup failed", description: err.message === 'quota_exceeded' ? "what3words API quota reached" : "Could not look up the address", variant: "destructive" });
    } finally {
      setLookingUpW3w(false);
    }
  };

  const handleSubmit = async () => {
    if (!species.trim()) {
      toast({ title: "Missing fields", description: "Please fill in species", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not authenticated", description: "Please sign in to add trees", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.from('trees').insert({
        name: name.trim() || species.trim(),
        species: species.trim(),
        description: description.trim() || null,
        what3words: what3words.trim() || '',
        latitude: lat,
        longitude: lng,
        estimated_age: estimatedAge ? parseInt(estimatedAge) : null,
        created_by: user.id,
      }).select('id').single();

      if (error) throw error;
      setSavedTreeId(data.id);

      toast({ title: "Tree added! 🌳", description: `${name} has joined the Ancient Friends` });

      // Auto-advance to offering step
      setTransitionDir("forward");
      setStep("offering");
    } catch (err: any) {
      toast({ title: "Error adding tree", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    setTransitionDir("forward");
    if (step === "encounter") {
      if (!species.trim()) {
        toast({ title: "Species required", description: "Please enter the species before continuing", variant: "destructive" });
        return;
      }
      setStep("reflection");
    } else if (step === "reflection") {
      handleSubmit();
    }
  };

  const goBack = () => {
    setTransitionDir("back");
    if (step === "reflection") setStep("encounter");
    else if (step === "offering") setStep("reflection");
  };

  const currentStepIndex = STEPS.findIndex(s => s.key === step);
  const currentStepConfig = STEPS[currentStepIndex];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setAdjustMode(false); onOpenChange(v); }}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto p-0">
        {/* Ritual Header */}
        <div className="px-6 pt-6 pb-4" style={{
          background: 'linear-gradient(135deg, hsla(120, 30%, 12%, 0.95), hsla(30, 25%, 10%, 0.95))',
          borderBottom: '1px solid hsla(42, 50%, 30%, 0.3)',
        }}>
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1 mb-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              return (
                <div key={s.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
                    isActive ? 'scale-110' : ''
                  }`} style={{
                    background: isActive
                      ? 'linear-gradient(135deg, hsla(42, 80%, 50%, 0.3), hsla(42, 70%, 40%, 0.15))'
                      : isDone
                        ? 'hsla(120, 40%, 30%, 0.4)'
                        : 'hsla(0, 0%, 100%, 0.05)',
                    border: `1.5px solid ${isActive ? 'hsla(42, 80%, 55%, 0.6)' : isDone ? 'hsla(120, 50%, 45%, 0.4)' : 'hsla(0, 0%, 100%, 0.1)'}`,
                  }}>
                    {isDone ? (
                      <Check className="w-3.5 h-3.5" style={{ color: 'hsl(120, 50%, 55%)' }} />
                    ) : (
                      <Icon className="w-3.5 h-3.5" style={{ color: isActive ? 'hsl(42, 80%, 60%)' : 'hsla(0, 0%, 100%, 0.3)' }} />
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-8 h-px mx-1" style={{
                      background: isDone ? 'hsla(120, 50%, 45%, 0.4)' : 'hsla(0, 0%, 100%, 0.08)',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          <h2 className="text-center font-serif text-lg tracking-wide" style={{ color: 'hsl(42, 75%, 60%)' }}>
            {currentStepConfig.label}
          </h2>
          <p className="text-center text-xs mt-1 font-serif" style={{ color: 'hsla(42, 40%, 55%, 0.7)' }}>
            {currentStepConfig.desc}
          </p>
        </div>

        {/* Step Content */}
        <div className="px-6 py-5 space-y-4" key={step} style={{
          animation: `${transitionDir === 'forward' ? 'slideInRight' : 'slideInLeft'} 0.35s ease-out`,
        }}>
          {/* ─── ENCOUNTER STEP ─── */}
          {step === "encounter" && !adjustMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Name of this Ancient Friend</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value.slice(0, 200))} placeholder="e.g., The Old Oak of Glastonbury (optional)" maxLength={200} className="font-serif" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="species" className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Species *</Label>
                <Input id="species" value={species} onChange={(e) => setSpecies(e.target.value.slice(0, 200))} placeholder="e.g., Quercus robur (English Oak)" maxLength={200} required className="font-serif" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="what3words" className="text-xs uppercase tracking-widest text-muted-foreground font-serif">
                  what3words {fetchingW3w && <Loader2 className="inline ml-1 h-3 w-3 animate-spin" />}
                </Label>
                <div className="flex gap-2">
                  <Input id="what3words" value={what3words} onChange={(e) => setWhat3words(e.target.value)} placeholder="filled.count.soap" className="flex-1 font-serif" />
                  <Button type="button" variant="outline" size="icon" onClick={handleLookupW3w} disabled={lookingUpW3w || !what3words.trim()}>
                    {lookingUpW3w ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full gap-2 font-serif" onClick={handleFindMe} disabled={findingMe}>
                {findingMe ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                Find Me — Use My Location
              </Button>

              {lat && lng && (
                <div className="flex items-center justify-between text-xs text-muted-foreground rounded-lg p-2" style={{ background: 'hsla(120, 30%, 20%, 0.3)', border: '1px solid hsla(120, 30%, 30%, 0.3)' }}>
                  <span className="font-mono">📍 {lat.toFixed(6)}, {lng.toFixed(6)}</span>
                  <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => startAdjustMode(lat, lng)}>
                    <MapPin className="h-3 w-3 mr-1" /> Adjust
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ─── ADJUST MAP (within encounter) ─── */}
          {step === "encounter" && adjustMode && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-serif">
                Drag the marker to fine-tune. Up to <strong>144 feet</strong> (≈44m) from your GPS fix.
              </p>
              <div ref={mapContainerRef} className="w-full rounded-lg border border-border overflow-hidden" style={{ height: 260 }} />
              {lat !== null && lng !== null && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span className="font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                  {originLat !== null && originLng !== null && (
                    <span className="ml-auto">{Math.round(getDistance(originLat, originLng, lat, lng) * 3.28084)} ft from GPS</span>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 font-serif" onClick={() => { setAdjustMode(false); setLat(originLat); setLng(originLng); }}>Skip</Button>
                <Button className="flex-1 gap-1.5 font-serif" onClick={confirmAdjustment}>
                  <Check className="h-4 w-4" /> Confirm Location
                </Button>
              </div>
            </div>
          )}

          {/* ─── REFLECTION STEP ─── */}
          {step === "reflection" && (
            <>
              <div className="text-center py-2">
                <TreeDeciduous className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(120, 50%, 45%)' }} />
                <p className="font-serif text-sm text-foreground">{name}</p>
                <p className="font-serif text-xs text-muted-foreground">{species}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Estimated Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="10000"
                  value={estimatedAge}
                  onChange={(e) => setEstimatedAge(e.target.value)}
                  placeholder="How many rings might it hold?"
                  className="font-serif"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Your Reflection</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                  placeholder="What did you notice? How did you feel standing beside it? What story does it seem to hold?"
                  maxLength={2000}
                  rows={5}
                  className="font-serif"
                />
              </div>

              <p className="text-[10px] text-center font-serif" style={{ color: 'hsla(42, 40%, 55%, 0.5)' }}>
                Take your time. This tree has waited centuries.
              </p>
            </>
          )}

          {/* ─── OFFERING STEP ─── */}
          {step === "offering" && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{
                background: 'radial-gradient(circle, hsla(42, 80%, 50%, 0.2), hsla(120, 40%, 20%, 0.3))',
                border: '2px solid hsla(42, 70%, 50%, 0.4)',
                animation: 'ancientPulse 4s ease-in-out infinite',
              }}>
                <Sparkles className="w-7 h-7" style={{ color: 'hsl(42, 80%, 60%)' }} />
              </div>

              <div>
                <h3 className="font-serif text-base" style={{ color: 'hsl(42, 75%, 60%)' }}>
                  {name} has been planted in the Atlas
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-serif">
                  Would you like to leave an offering for those who visit?
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {[
                  { emoji: "📷", label: "Memory", type: "photo" },
                  { emoji: "🎵", label: "Song", type: "song" },
                  { emoji: "💭", label: "Story", type: "story" },
                ].map((o) => (
                  <a
                    key={o.type}
                    href={savedTreeId ? `/tree/${encodeURIComponent(savedTreeId)}?add=${o.type}` : '#'}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105"
                    style={{
                      background: 'hsla(0, 0%, 100%, 0.04)',
                      border: '1px solid hsla(42, 50%, 40%, 0.2)',
                    }}
                  >
                    <span className="text-2xl">{o.emoji}</span>
                    <span className="text-[10px] font-serif text-muted-foreground">{o.label}</span>
                  </a>
                ))}
              </div>

              <Button
                variant="ghost"
                className="text-xs font-serif text-muted-foreground"
                onClick={() => onOpenChange(false)}
              >
                Perhaps another time
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        {step !== "offering" && !adjustMode && (
          <div className="px-6 pb-5 flex gap-2">
            {step !== "encounter" ? (
              <Button variant="outline" className="flex-1 gap-1.5 font-serif" onClick={goBack}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <Button variant="outline" className="flex-1 font-serif" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            <Button
              className="flex-1 gap-1.5 font-serif"
              onClick={goNext}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, hsl(42, 60%, 30%), hsl(42, 70%, 25%))',
                color: 'hsl(42, 90%, 65%)',
                border: '1px solid hsla(42, 60%, 45%, 0.4)',
              }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {step === "encounter" ? (
                <>Continue <ChevronRight className="h-4 w-4" /></>
              ) : (
                <>Plant this Tree <TreeDeciduous className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}

        <style>{`
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes ancientPulse {
            0%, 100% { box-shadow: 0 0 4px hsla(42, 80%, 50%, 0.2); }
            50% { box-shadow: 0 0 20px hsla(42, 80%, 50%, 0.4); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

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
