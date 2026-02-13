import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { extractExifDate } from "@/utils/exifDate";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LocateFixed, Search, MapPin, Check, TreeDeciduous, Feather, Sparkles, ChevronRight, ChevronLeft, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { convertToCoordinates, convertToWhat3Words } from "@/utils/what3words";
import maplibregl from "maplibre-gl";
import { searchSpecies, type TreeSpecies } from "@/data/treeSpecies";
import OfferingCelebration from "@/components/OfferingCelebration";

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
  const [showSpeciesSuggestions, setShowSpeciesSuggestions] = useState(false);
  const speciesSuggestions = useMemo(() => searchSpecies(species), [species]);
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFirstTreeMilestone, setShowFirstTreeMilestone] = useState(false);
  const [collectiveCount, setCollectiveCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractingPhoto, setExtractingPhoto] = useState(false);
  const [photoDate, setPhotoDate] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const dragCounter = useRef(0);

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
      setPhotoDate(null);
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

  // Auto-lookup what3words when user types a valid-looking address
  useEffect(() => {
    const trimmed = what3words.trim().replace(/^\/+/, "");
    const isValid = /^[a-z]+\.[a-z]+\.[a-z]+$/i.test(trimmed);
    if (!isValid || lookingUpW3w || fetchingW3w) return;
    if (lat !== null && lng !== null) return;

    const timer = setTimeout(async () => {
      setLookingUpW3w(true);
      try {
        const result = await convertToCoordinates(trimmed);
        if (result?.coordinates) {
          setLat(result.coordinates.lat);
          setLng(result.coordinates.lng);
          setWhat3words(result.words);
        }
      } catch {
        // silently fail for auto-lookup
      } finally {
        setLookingUpW3w(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [what3words]);

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
  const SATELLITE_STYLE: any = {
    version: 8,
    name: "Satellite",
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri, Maxar, Earthstar Geographics",
        maxzoom: 19,
      },
    },
    layers: [
      { id: "satellite-tiles", type: "raster", source: "satellite", minzoom: 0, maxzoom: 22 },
    ],
  };

  useEffect(() => {
    if (!adjustMode || !mapContainerRef.current || lat === null || lng === null) return;
    circleAddedRef.current = false;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: SATELLITE_STYLE,
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
      (pos) => {
        setFindingMe(false);
        const foundLat = pos.coords.latitude;
        const foundLng = pos.coords.longitude;
        startAdjustMode(foundLat, foundLng);
        fetchWhat3words(foundLat, foundLng);
      },
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

  // Drag-and-drop what3words photo extraction
  const handlePhotoDrop = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please drop an image file", variant: "destructive" });
      return;
    }
    setExtractingPhoto(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extract EXIF date from photo
      const exifDate = await extractExifDate(file);
      if (exifDate) {
        setPhotoDate(exifDate);
        toast({ title: "Photo date found", description: new Date(exifDate).toLocaleDateString() });
      }

      toast({ title: "Analyzing image…", description: "Extracting what3words address from photo" });

      const { data, error } = await supabase.functions.invoke('extract-what3words-from-image', {
        body: { imageData: base64 },
      });
      if (error) throw error;
      if (!data.success) {
        toast({ title: "No address found", description: data.error || "Could not find a what3words address in the image", variant: "destructive" });
        return;
      }

      const w3w = data.what3words;
      setWhat3words(w3w);
      toast({ title: "Address detected!", description: `///​${w3w}` });

      // Auto-convert to coordinates
      try {
        const result = await convertToCoordinates(w3w);
        if (result?.coordinates) {
          setLat(result.coordinates.lat);
          setLng(result.coordinates.lng);
        }
      } catch (coordErr: any) {
        if (coordErr?.message === 'quota_exceeded') {
          toast({ title: "Quota reached", description: "Coordinates will be converted later", variant: "destructive" });
        }
      }
    } catch (err) {
      console.error('Photo drop error:', err);
      toast({ title: "Extraction failed", description: "Could not process the image", variant: "destructive" });
    } finally {
      setExtractingPhoto(false);
    }
  }, [toast]);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoDrop(file);
  }, [handlePhotoDrop]);

  const handleSubmit = async () => {
    if (!species.trim()) {
      toast({ title: "Missing fields", description: "Please fill in species", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // If not logged in, store tree data and redirect to auth
      if (!user) {
        const pendingTree = {
          name: name.trim() || species.trim(),
          species: species.trim(),
          description: description.trim() || null,
          what3words: what3words.trim() || '',
          latitude: lat,
          longitude: lng,
          estimated_age: estimatedAge ? parseInt(estimatedAge) : null,
          ...(photoDate ? { created_at: photoDate } : {}),
        };
        localStorage.setItem("s33d_pending_tree", JSON.stringify(pendingTree));
        onOpenChange(false);
        toast({ title: "Sign in to save your tree", description: "Your encounter has been preserved — sign in to plant it in the Atlas" });
        navigate("/auth?returnTo=/map");
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
        ...(photoDate ? { created_at: photoDate } : {}),
      }).select('id').single();

      if (error) throw error;
      setSavedTreeId(data.id);

      setShowCelebration(true);

      // Check if this is the user's first tree for milestone moment
      const { count: userTreeCount } = await supabase
        .from("trees")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);
      
      // Fetch collective count for echo
      const { count: totalTrees } = await supabase
        .from("trees")
        .select("*", { count: "exact", head: true });
      setCollectiveCount(totalTrees || 0);

      if (userTreeCount === 1) {
        // First tree — show milestone after celebration
        setTimeout(() => setShowFirstTreeMilestone(true), 2400);
      }

      // Store last visited tree for Hearth return pill
      sessionStorage.setItem("s33d_last_tree", JSON.stringify({
        id: data.id,
        name: name.trim() || species.trim(),
        species: species.trim(),
      }));

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
        <OfferingCelebration
          active={showCelebration}
          emoji="🌳"
          message="Tree planted in the Atlas!"
          subtitle={collectiveCount ? `Now part of ${collectiveCount} Ancient Friends` : `${name || species} has joined the Ancient Friends`}
          onComplete={() => setShowCelebration(false)}
        />

        {/* First-tree milestone overlay */}
        <AnimatePresence>
          {showFirstTreeMilestone && (
            <motion.div
              className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => setShowFirstTreeMilestone(false)}
            >
              <motion.div
                className="text-center px-8 py-10 rounded-2xl max-w-sm"
                style={{
                  background: "linear-gradient(135deg, hsla(120, 25%, 12%, 0.95), hsla(42, 30%, 10%, 0.95))",
                  border: "1px solid hsla(42, 60%, 40%, 0.3)",
                  boxShadow: "0 0 60px hsla(42, 80%, 50%, 0.15)",
                }}
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <motion.p
                  className="text-3xl mb-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  🌱
                </motion.p>
                <h2
                  className="font-serif text-xl tracking-wider mb-2"
                  style={{ color: "hsl(42, 80%, 65%)" }}
                >
                  Your grove has begun
                </h2>
                <p
                  className="font-serif text-sm leading-relaxed"
                  style={{ color: "hsl(42, 40%, 60%)" }}
                >
                  This is the first tree in your personal grove. Every offering you give, every seed you plant, will grow from this root.
                </p>
                <p
                  className="font-serif text-[10px] tracking-[0.2em] uppercase mt-4"
                  style={{ color: "hsl(42, 30%, 45%)" }}
                >
                  Tap to continue
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <div
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="species" className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Species *</Label>
                  <Input
                    id="species"
                    value={species}
                    onChange={(e) => {
                      setSpecies(e.target.value.slice(0, 200));
                      setShowSpeciesSuggestions(true);
                    }}
                    onFocus={() => setShowSpeciesSuggestions(true)}
                    placeholder="Start typing… e.g. Oak, Yew, Birch"
                    maxLength={200}
                    required
                    className="font-serif"
                    autoComplete="off"
                  />
                  {showSpeciesSuggestions && speciesSuggestions.length > 0 && (
                    <div
                      className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg"
                      style={{
                        background: "hsl(30, 15%, 12%)",
                        borderColor: "hsla(42, 40%, 30%, 0.5)",
                      }}
                    >
                      {speciesSuggestions.map((sp) => (
                        <button
                          key={sp.scientific}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/5 flex flex-col gap-0.5"
                          onClick={() => {
                            setSpecies(sp.common);
                            setShowSpeciesSuggestions(false);
                          }}
                        >
                          <span className="font-serif" style={{ color: "hsl(42, 75%, 60%)" }}>{sp.common}</span>
                          <span className="text-[11px] italic" style={{ color: "hsla(42, 40%, 55%, 0.7)" }}>
                            {sp.scientific} · {sp.family}
                          </span>
                          {sp.aliases && sp.aliases.length > 0 && (
                            <span className="text-[10px]" style={{ color: "hsla(0, 0%, 100%, 0.35)" }}>
                              Also: {sp.aliases.join(", ")}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
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

                {/* Drop zone for what3words photo */}
                <div
                  className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-primary bg-primary/10 scale-[1.02]'
                      : 'border-border/50 hover:border-border'
                  }`}
                  style={{
                    background: isDragging
                      ? 'hsla(42, 80%, 50%, 0.08)'
                      : 'hsla(0, 0%, 100%, 0.02)',
                  }}
                  onClick={() => {
                    if (!extractingPhoto) {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handlePhotoDrop(file);
                      };
                      input.click();
                    }
                  }}
                >
                  {extractingPhoto ? (
                    <div className="flex flex-col items-center gap-2 py-1">
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(42, 80%, 55%)' }} />
                      <span className="text-xs font-serif text-muted-foreground">Extracting address from photo…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <ImagePlus className="h-5 w-5" style={{ color: isDragging ? 'hsl(42, 80%, 55%)' : 'hsl(0, 0%, 45%)' }} />
                      <span className="text-xs font-serif" style={{ color: isDragging ? 'hsl(42, 80%, 60%)' : 'hsl(0, 0%, 50%)' }}>
                        {isDragging ? 'Drop photo here' : 'Drag a what3words photo here, or tap to browse'}
                      </span>
                    </div>
                  )}
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
              </div>
            </div>
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
                <p className="font-serif text-sm text-foreground">{species}</p>
                {what3words && <p className="font-serif text-xs text-muted-foreground">/{what3words}</p>}
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
                  {name || species} has been planted in the Atlas
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-serif">
                  Give this ancient friend a name, then leave an offering
                </p>
              </div>

              {/* Name field — now in the offering step */}
              <div className="space-y-2 text-left max-w-xs mx-auto">
                <Label htmlFor="tree-name" className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Name this Ancient Friend</Label>
                <Input
                  id="tree-name"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 200))}
                  placeholder="e.g., The Old Oak of Glastonbury"
                  maxLength={200}
                  className="font-serif"
                />
                {name.trim() && name.trim() !== species.trim() && savedTreeId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-serif gap-1.5"
                    onClick={async () => {
                      try {
                        const { error } = await supabase.from('trees').update({ name: name.trim() }).eq('id', savedTreeId);
                        if (error) throw error;
                        toast({ title: "Name saved ✨", description: `Now known as "${name.trim()}"` });
                      } catch (err: any) {
                        toast({ title: "Could not save name", description: err.message, variant: "destructive" });
                      }
                    }}
                  >
                    <Check className="h-3 w-3" /> Save Name
                  </Button>
                )}
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
