import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { processTreePhoto } from "@/utils/backgroundPhotoProcessor";
import NearbyDuplicateWarning from "@/components/NearbyDuplicateWarning";
import { extractExifDate } from "@/utils/exifDate";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LocateFixed, Search, MapPin, Check, TreeDeciduous, Feather, Sparkles, ChevronRight, ChevronLeft, ImagePlus, Users, AlertTriangle, Camera, Navigation, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { convertToCoordinates, convertToWhat3Words } from "@/utils/what3words";
// maplibre-gl is dynamically imported in adjustMode useEffect
import { searchSpecies, type TreeSpecies } from "@/data/treeSpecies";
import OfferingCelebration from "@/components/OfferingCelebration";
import NearbyTreesSheet from "@/components/NearbyTreesSheet";
import CanopyCheckinModal from "@/components/CanopyCheckinModal";
import SpeciesIdentifier, { type SpeciesResult, type SpeciesCertainty } from "@/components/encounter/SpeciesIdentifier";
import {
  identifyTreeSpeciesFromPhoto,
  type SpeciesVisionPrediction,
  type SpeciesVisionResult,
} from "@/services/speciesVision";
import SeedNudge from "@/components/SeedNudge";

interface AddTreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  what3words?: string;
}

type RitualStep = "encounter" | "reflection" | "offering";
type SpeciesDecision = "none" | "pending" | "confirmed" | "overridden";

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
  const [savedUserId, setSavedUserId] = useState<string | null>(null);
  const [transitionDir, setTransitionDir] = useState<"forward" | "back">("forward");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFirstTreeMilestone, setShowFirstTreeMilestone] = useState(false);
  const [collectiveCount, setCollectiveCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractingPhoto, setExtractingPhoto] = useState(false);
  const [photoDate, setPhotoDate] = useState<string | null>(null);
  const [droppedPhotoFile, setDroppedPhotoFile] = useState<File | null>(null);
  const [uploadingOffering, setUploadingOffering] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [nearbySheetOpen, setNearbySheetOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkinTreeData, setCheckinTreeData] = useState<{ id: string; name: string; species: string; latitude: number; longitude: number } | null>(null);
  const [showDuplicateGuard, setShowDuplicateGuard] = useState(false);
  const [duplicateTree, setDuplicateTree] = useState<{ id: string; name: string; distanceM: number } | null>(null);
  const [isIdentifyingSpecies, setIsIdentifyingSpecies] = useState(false);
  const [speciesVisionResult, setSpeciesVisionResult] = useState<SpeciesVisionResult | null>(null);
  const [speciesDecision, setSpeciesDecision] = useState<SpeciesDecision>("none");
  const [selectedSpeciesPrediction, setSelectedSpeciesPrediction] = useState<SpeciesVisionPrediction | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [speciesCertainty, setSpeciesCertainty] = useState<SpeciesCertainty>("exact");
  const [speciesHiveFamily, setSpeciesHiveFamily] = useState<string | undefined>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const dragCounter = useRef(0);
  const w3wInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
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
      setDroppedPhotoFile(null);
      setUploadingOffering(false);
      setIsIdentifyingSpecies(false);
      setSpeciesVisionResult(null);
      setSpeciesDecision("none");
      setSelectedSpeciesPrediction(null);
      setLocationConfirmed(false);
      setGpsAccuracy(null);
      setSpeciesCertainty("exact");
      setSpeciesHiveFamily(undefined);
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

  // Keyboard shortcut: "/" focuses what3words input
  useEffect(() => {
    if (!open || step !== "encounter" || adjustMode) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "/") {
        e.preventDefault();
        w3wInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, step, adjustMode]);


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
    setLocationConfirmed(false);
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
    let cancelled = false;

    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !mapContainerRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: SATELLITE_STYLE,
        center: [lng, lat],
        zoom: 19,
        maxZoom: 22,
        doubleClickZoom: false,
      });

      const markerEl = document.createElement('div');
      markerEl.className = 'encounter-map-pin';
      markerEl.style.cssText = `
        width: 32px; height: 32px; border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, hsl(42, 95%, 65%), hsl(42, 90%, 45%));
        border: 2.5px solid white;
        cursor: grab;
        box-shadow: 0 0 0 0 hsla(42, 90%, 55%, 0.4), 0 2px 8px hsla(0, 0%, 0%, 0.3);
        animation: pinPulse 2s ease-in-out infinite;
        transition: transform 0.15s ease, left 0s, top 0s;
      `;
      const marker = new maplibregl.Marker({ element: markerEl, draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);

      marker.on("dragstart", () => {
        markerEl.style.transform = 'scale(1.2)';
        markerEl.style.cursor = 'grabbing';
      });

      marker.on("dragend", () => {
        markerEl.style.transform = 'scale(1)';
        markerEl.style.cursor = 'grab';
        const pos = marker.getLngLat();
        const [clampedLat, clampedLng] = clampPosition(pos.lat, pos.lng);
        if (clampedLat !== pos.lat || clampedLng !== pos.lng) marker.setLngLat([clampedLng, clampedLat]);
        setLat(clampedLat);
        setLng(clampedLng);
      });

      // Tap-to-place: click anywhere on the map to move the marker
      let lastClickTime = 0;
      map.on("click", (e: any) => {
        const now = Date.now();
        // Ignore rapid successive clicks (debounce accidental taps)
        if (now - lastClickTime < 300) return;
        lastClickTime = now;

        const clickLat = e.lngLat.lat;
        const clickLng = e.lngLat.lng;

        if (originLat !== null && originLng !== null) {
          const dist = getDistance(originLat, originLng, clickLat, clickLng);
          if (dist > MAX_ADJUST_METERS) {
            // Out of range — gentle feedback
            toast({
              title: "Outside your range",
              description: `That point is ${Math.round(dist)}m away. Max allowed is ${Math.round(MAX_ADJUST_METERS)}m from your GPS fix.`,
            });
            return;
          }
        }

        marker.setLngLat([clickLng, clickLat]);
        setLat(clickLat);
        setLng(clickLng);
      });

      map.on("load", () => {
        if (circleAddedRef.current) return;
        circleAddedRef.current = true;
        const circleGeoJSON = createCircleGeoJSON(lng, lat, MAX_ADJUST_METERS);
        map.addSource("adjust-radius", { type: "geojson", data: circleGeoJSON });
        map.addLayer({ id: "adjust-radius-fill", type: "fill", source: "adjust-radius", paint: { "fill-color": "hsl(42, 95%, 55%)", "fill-opacity": 0.08 } });
        map.addLayer({ id: "adjust-radius-border", type: "line", source: "adjust-radius", paint: { "line-color": "hsl(42, 95%, 55%)", "line-width": 1.5, "line-dasharray": [4, 3], "line-opacity": 0.45 } });

        // Show GPS accuracy radius if available
        if (gpsAccuracy && gpsAccuracy > 5) {
          const accuracyCircle = createCircleGeoJSON(lng, lat, Math.min(gpsAccuracy, MAX_ADJUST_METERS * 2));
          map.addSource("gps-accuracy", { type: "geojson", data: accuracyCircle });
          map.addLayer({ id: "gps-accuracy-fill", type: "fill", source: "gps-accuracy", paint: { "fill-color": "hsl(200, 80%, 60%)", "fill-opacity": 0.06 } });
          map.addLayer({ id: "gps-accuracy-border", type: "line", source: "gps-accuracy", paint: { "line-color": "hsl(200, 80%, 60%)", "line-width": 1, "line-opacity": 0.3 } });
        }
      });

      mapRef.current = map;
      markerRef.current = marker;
    });

    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; markerRef.current = null; };
  }, [adjustMode]);

  const confirmAdjustment = () => {
    setAdjustMode(false);
    setLocationConfirmed(true);
    if (lat !== null && lng !== null) fetchWhat3words(lat, lng);
    toast({ title: "📍 Location confirmed", description: `This is where the tree stands` });
  };

  const handleFindMe = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Your browser doesn't support geolocation", variant: "destructive" });
      return;
    }
    setFindingMe(true);
    setGpsAccuracy(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFindingMe(false);
        const foundLat = pos.coords.latitude;
        const foundLng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        setGpsAccuracy(Math.round(accuracy));
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
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    setExtractingPhoto(true);
    setIsIdentifyingSpecies(true);
    setDroppedPhotoFile(file);
    setSpeciesVisionResult(null);
    setSpeciesDecision("none");
    setSelectedSpeciesPrediction(null);
    try {
      // Extract EXIF date from photo
      const exifDate = await extractExifDate(file);
      if (exifDate) {
        setPhotoDate(exifDate);
      }

      toast({ title: "📷 Photo added", description: "This will become your first offering" });

      // Silently try to extract what3words from photo as a bonus
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const { data, error } = await supabase.functions.invoke('extract-what3words-from-image', {
          body: { imageData: base64 },
        });
        if (!error && data?.success && data.what3words) {
          const w3w = data.what3words;
          setWhat3words(w3w);
          toast({ title: "Bonus: address detected!", description: `///​${w3w}` });
          try {
            const result = await convertToCoordinates(w3w);
            if (result?.coordinates) {
              setLat(result.coordinates.lat);
              setLng(result.coordinates.lng);
            }
          } catch {
            // silently ignore
          }
        }
      } catch {
        // w3w extraction is optional
      }

      const identifyResult = await identifyTreeSpeciesFromPhoto(file);
      setSpeciesVisionResult(identifyResult);

      if (identifyResult.predictions.length > 0) {
        setSpeciesDecision("pending");
        toast({
          title: "AI species suggestions ready",
          description: "Choose one suggestion or type your own species before saving.",
        });
      } else if (identifyResult.error) {
        toast({
          title: "AI suggestions unavailable",
          description: "You can continue with manual species entry.",
        });
      }
    } catch (err) {
      console.error('Photo processing error:', err);
    } finally {
      setExtractingPhoto(false);
      setIsIdentifyingSpecies(false);
    }
  }, [toast]);

  // Photo processing is now handled by backgroundPhotoProcessor — uploadPhotoOffering removed

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

  const handleConfirmSpeciesSuggestion = useCallback((prediction: SpeciesVisionPrediction) => {
    setSelectedSpeciesPrediction(prediction);
    setSpecies(prediction.commonName || prediction.scientificName);
    setSpeciesDecision("confirmed");
    setShowSpeciesSuggestions(false);
  }, []);

  // Check for nearby duplicates before creating
  const checkForDuplicates = useCallback(async (): Promise<boolean> => {
    if (lat === null || lng === null) return false;

    const EXACT_RADIUS_M = 25;
    const WIDE_RADIUS_M = 2000;
    const degLatWide = WIDE_RADIUS_M / 110540;
    const degLngWide = WIDE_RADIUS_M / (111320 * Math.cos((lat * Math.PI) / 180));

    try {
      const { data } = await supabase
        .from("trees")
        .select("id, name, species, latitude, longitude")
        .gte("latitude", lat - degLatWide)
        .lte("latitude", lat + degLatWide)
        .gte("longitude", lng - degLngWide)
        .lte("longitude", lng + degLngWide)
        .limit(20);

      if (data && data.length > 0) {
        const withDist = data
          .filter((t) => t.latitude != null && t.longitude != null)
          .map((t) => ({
            ...t,
            distanceM: getDistance(lat, lng, t.latitude!, t.longitude!),
          }))
          .sort((a, b) => a.distanceM - b.distanceM);

        const exactMatch = withDist.find((t) => t.distanceM <= EXACT_RADIUS_M);
        if (exactMatch) {
          setDuplicateTree({ id: exactMatch.id, name: exactMatch.name, distanceM: Math.round(exactMatch.distanceM) });
          setShowDuplicateGuard(true);
          return true;
        }

        const trimName = (name.trim() || "").toLowerCase();
        const trimSpecies = (species.trim() || "").toLowerCase();
        const nameOrSpeciesMatch = withDist.find((t) => {
          if (t.distanceM > WIDE_RADIUS_M) return false;
          const sameName = trimName && t.name?.toLowerCase().includes(trimName);
          const sameSpecies = trimSpecies && t.species?.toLowerCase() === trimSpecies;
          return sameName || sameSpecies;
        });

        if (nameOrSpeciesMatch) {
          setDuplicateTree({ id: nameOrSpeciesMatch.id, name: nameOrSpeciesMatch.name, distanceM: Math.round(nameOrSpeciesMatch.distanceM) });
          setShowDuplicateGuard(true);
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }, [lat, lng, name, species]);

  const handleSubmit = async () => {
    // Species is no longer strictly required — uncertainty is allowed
    const speciesValue = species.trim() || "Unknown species";

    const aiPredictions = speciesVisionResult?.predictions ?? [];

    const normalizedAiPredictions = aiPredictions.map((prediction) => ({
      scientificName: prediction.scientificName,
      commonName: prediction.commonName,
      confidence: prediction.confidence,
      source: prediction.source,
      sourceUrl: prediction.sourceUrl,
      identifiedAt: speciesVisionResult?.identifiedAt || null,
      rawSnapshot: speciesVisionResult?.rawSnapshot || null,
    }));
    const resolvedProvider =
      speciesVisionResult?.provider && speciesVisionResult.provider !== "none"
        ? speciesVisionResult.provider
        : null;
    const resolvedAiConfidence =
      selectedSpeciesPrediction?.confidence ??
      normalizedAiPredictions[0]?.confidence ??
      null;
    const aiConfirmed =
      normalizedAiPredictions.length > 0 &&
      (speciesDecision === "confirmed" || speciesDecision === "overridden");

    setLoading(true);
    try {
      // Duplicate guard
      if (!showDuplicateGuard) {
        const hasDuplicate = await checkForDuplicates();
        if (hasDuplicate) {
          setLoading(false);
          return;
        }
      }
      setShowDuplicateGuard(false);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const pendingTree: Record<string, unknown> = {
          name: name.trim() || speciesValue,
          species: speciesValue,
          description: description.trim() || null,
          what3words: what3words.trim() || '',
          latitude: lat,
          longitude: lng,
          estimated_age: estimatedAge ? parseInt(estimatedAge) : null,
          species_ai_predictions: normalizedAiPredictions.length > 0 ? normalizedAiPredictions : null,
          species_ai_selected: selectedSpeciesPrediction
            ? {
                scientificName: selectedSpeciesPrediction.scientificName,
                commonName: selectedSpeciesPrediction.commonName,
                confidence: selectedSpeciesPrediction.confidence,
                source: selectedSpeciesPrediction.source,
                sourceUrl: selectedSpeciesPrediction.sourceUrl,
                identifiedAt: speciesVisionResult?.identifiedAt || null,
                rawSnapshot: speciesVisionResult?.rawSnapshot || null,
              }
            : null,
          species_ai_provider: resolvedProvider,
          species_ai_confidence: resolvedAiConfidence,
          species_ai_confirmed: aiConfirmed,
          ...(photoDate ? { created_at: photoDate } : {}),
        };

        // Preserve dropped photo as base64 so it survives the auth redirect
        if (droppedPhotoFile) {
          try {
            const reader = new FileReader();
            const photoBase64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(droppedPhotoFile);
            });
            pendingTree._photoBase64 = photoBase64;
            pendingTree._photoDate = photoDate;
          } catch {
            // Photo preservation is best-effort
          }
        }

        localStorage.setItem("s33d_pending_tree", JSON.stringify(pendingTree));
        onOpenChange(false);
        toast({ title: "Sign in to save your tree", description: "Your encounter has been preserved — sign in to plant it in the Atlas" });
        navigate("/auth?returnTo=/map");
        return;
      }

      const { data, error } = await supabase.from('trees').insert({
        name: name.trim() || speciesValue,
        species: speciesValue,
        description: description.trim() || null,
        what3words: what3words.trim() || '',
        latitude: lat,
        longitude: lng,
        estimated_age: estimatedAge ? parseInt(estimatedAge) : null,
        created_by: user.id,
        photo_status: droppedPhotoFile ? 'pending' : 'none',
        ...(photoDate ? { created_at: photoDate } : {}),
      } as any).select('id').single();

      if (error) throw error;
      setSavedTreeId(data.id);
      setSavedUserId(user.id);

      setShowCelebration(true);

      const { count: userTreeCount } = await supabase
        .from("trees")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);
      
      const { count: totalTrees } = await supabase
        .from("trees")
        .select("*", { count: "exact", head: true });
      setCollectiveCount(totalTrees || 0);

      if (userTreeCount === 1) {
        setTimeout(() => setShowFirstTreeMilestone(true), 2400);
      }

      sessionStorage.setItem("s33d_last_tree", JSON.stringify({
        id: data.id,
        name: name.trim() || speciesValue,
        species: speciesValue,
      }));

      // Fire-and-forget background photo processing
      if (droppedPhotoFile) {
        const photoFile = droppedPhotoFile;
        processTreePhoto({
          treeId: data.id,
          userId: user.id,
          file: photoFile,
          onStatusChange: (status) => {
            if (status === "ready") {
              toast({ title: "📷 Photo processed", description: "Your tree's photo is now ready" });
            } else if (status === "failed") {
              toast({ title: "Photo processing issue", description: "Original photo was preserved. You can retry from the tree page.", variant: "destructive" });
            }
          },
        });
      }

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
      // Species is no longer hard-required — uncertainty is welcome
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

  const distanceFromGps = (originLat !== null && originLng !== null && lat !== null && lng !== null)
    ? Math.round(getDistance(originLat, originLng, lat, lng) * 3.28084)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setAdjustMode(false); onOpenChange(v); }}>
      <DialogContent
        className="bg-card border-border/40 max-w-md p-0 overflow-hidden flex flex-col"
        style={{
          maxHeight: 'min(92dvh, 720px)',
          background: 'linear-gradient(180deg, hsl(var(--card)), hsl(var(--card) / 0.97))',
        }}
      >
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

        {/* ─── Compact Ritual Header ─── */}
        <div className="px-5 pt-5 pb-3 shrink-0" style={{
          background: 'linear-gradient(135deg, hsla(120, 30%, 12%, 0.95), hsla(30, 25%, 10%, 0.95))',
          borderBottom: '1px solid hsla(42, 50%, 30%, 0.2)',
        }}>
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1 mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              return (
                <div key={s.key} className="flex items-center">
                  <motion.div
                    className="flex items-center justify-center w-7 h-7 rounded-full"
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, hsla(42, 80%, 50%, 0.3), hsla(42, 70%, 40%, 0.15))'
                        : isDone
                          ? 'hsla(120, 40%, 30%, 0.4)'
                          : 'hsla(0, 0%, 100%, 0.04)',
                      border: `1.5px solid ${isActive ? 'hsla(42, 80%, 55%, 0.6)' : isDone ? 'hsla(120, 50%, 45%, 0.4)' : 'hsla(0, 0%, 100%, 0.08)'}`,
                    }}
                  >
                    {isDone ? (
                      <Check className="w-3 h-3" style={{ color: 'hsl(120, 50%, 55%)' }} />
                    ) : (
                      <Icon className="w-3 h-3" style={{ color: isActive ? 'hsl(42, 80%, 60%)' : 'hsla(0, 0%, 100%, 0.25)' }} />
                    )}
                  </motion.div>
                  {i < STEPS.length - 1 && (
                    <div className="w-6 h-px mx-0.5" style={{
                      background: isDone ? 'hsla(120, 50%, 45%, 0.4)' : 'hsla(0, 0%, 100%, 0.06)',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          <h2 className="text-center font-serif text-base tracking-wide" style={{ color: 'hsl(42, 75%, 60%)' }}>
            {currentStepConfig.label}
          </h2>
          <p className="text-center text-[11px] mt-0.5 font-serif" style={{ color: 'hsla(42, 40%, 55%, 0.6)' }}>
            {currentStepConfig.desc}
          </p>
        </div>

        {/* ─── Scrollable Step Content ─── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-5 py-4 space-y-3" key={step} style={{
            animation: `${transitionDir === 'forward' ? 'slideInRight' : 'slideInLeft'} 0.3s ease-out`,
          }}>
            {/* ─── ENCOUNTER STEP ─── */}
            {step === "encounter" && !adjustMode && (
              <div
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
              >
                <div className="space-y-3">
                  {/* Hidden file inputs */}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoDrop(file);
                      e.target.value = '';
                    }}
                  />
                  <input
                    id="photo-library-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoDrop(file);
                      e.target.value = '';
                    }}
                  />

                  {/* Photo area — compact */}
                  <div
                    className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                      isDragging
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : droppedPhotoFile
                          ? 'border-green-600/30'
                          : 'border-border/40 hover:border-border/60'
                    }`}
                    style={{
                      background: isDragging
                        ? 'hsla(42, 80%, 50%, 0.06)'
                        : droppedPhotoFile
                          ? 'hsla(120, 30%, 15%, 0.2)'
                          : 'hsla(0, 0%, 100%, 0.015)',
                    }}
                  >
                    {extractingPhoto ? (
                      <div className="flex flex-col items-center gap-2 py-1">
                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(42, 80%, 55%)' }} />
                        <span className="text-xs font-serif text-muted-foreground">Processing photo…</span>
                      </div>
                    ) : droppedPhotoFile ? (
                      <div className="flex items-center gap-3 py-0.5" onClick={() => photoInputRef.current?.click()}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{
                          background: 'hsla(120, 40%, 30%, 0.3)',
                          border: '1px solid hsla(120, 40%, 40%, 0.3)',
                        }}>
                          <Check className="h-4 w-4" style={{ color: 'hsl(120, 50%, 55%)' }} />
                        </div>
                        <div className="text-left min-w-0">
                          <span className="text-xs font-serif block truncate" style={{ color: 'hsl(120, 40%, 55%)' }}>
                            Photo added — your first offering
                          </span>
                          <span className="text-[10px] font-serif text-muted-foreground/50">Tap to change</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2.5 py-1">
                        <ImagePlus className="h-5 w-5" style={{ color: isDragging ? 'hsl(42, 80%, 55%)' : 'hsl(42, 55%, 48%)' }} />
                        <span className="text-xs font-serif" style={{ color: isDragging ? 'hsl(42, 80%, 60%)' : 'hsl(42, 45%, 52%)' }}>
                          {isDragging ? 'Drop photo here' : 'Add a photo of your tree'}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              photoInputRef.current?.click();
                            }}
                          >
                            <Camera className="h-3.5 w-3.5 mr-1" />
                            Take Photo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById('photo-library-input')?.click();
                            }}
                          >
                            <ImagePlus className="h-3.5 w-3.5 mr-1" />
                            Library
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── Species Identifier ─── */}
                  <SpeciesIdentifier
                    species={species}
                    onSpeciesChange={(result: SpeciesResult) => {
                      setSpecies(result.species);
                      setSpeciesCertainty(result.certainty);
                      setSpeciesHiveFamily(result.hiveFamily);
                      if (result.aiPrediction) {
                        setSelectedSpeciesPrediction(result.aiPrediction);
                        setSpeciesDecision("confirmed");
                      }
                      if (result.certainty === "exact" || result.certainty === "ai_confirmed") {
                        setSpeciesDecision("confirmed");
                      }
                    }}
                    photoFile={droppedPhotoFile}
                    onRequestPhoto={() => photoInputRef.current?.click()}
                    externalAiResult={speciesVisionResult}
                    isIdentifyingSpecies={isIdentifyingSpecies}
                  />

                  {/* Divider */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: 'hsla(42, 30%, 30%, 0.2)' }} />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 text-[9px] uppercase tracking-[0.2em] font-serif" style={{
                        color: 'hsla(42, 40%, 50%, 0.5)',
                        background: 'hsl(var(--card))',
                      }}>Location</span>
                    </div>
                  </div>

                  {/* Find Me button — primary location action */}
                  <Button
                    type="button"
                    className="w-full gap-2 font-serif h-10 text-sm"
                    onClick={handleFindMe}
                    disabled={findingMe}
                    style={{
                      background: findingMe
                        ? 'hsla(42, 40%, 20%, 0.6)'
                        : 'linear-gradient(135deg, hsla(42, 60%, 25%, 0.8), hsla(120, 25%, 18%, 0.8))',
                      color: 'hsl(42, 80%, 65%)',
                      border: '1px solid hsla(42, 50%, 35%, 0.4)',
                    }}
                  >
                    {findingMe ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    {findingMe ? 'Finding your location…' : 'Find Me — Use My Location'}
                  </Button>

                  {/* GPS accuracy + coordinates (when location is known but not in adjust mode) */}
                  {gpsAccuracy !== null && !adjustMode && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                      style={{
                        background: gpsAccuracy <= 15 ? 'hsla(120, 30%, 20%, 0.25)' : 'hsla(42, 30%, 20%, 0.25)',
                        border: `1px solid ${gpsAccuracy <= 15 ? 'hsla(120, 30%, 30%, 0.25)' : 'hsla(42, 40%, 30%, 0.25)'}`,
                      }}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{
                        background: gpsAccuracy <= 15 ? 'hsl(120, 50%, 50%)' : gpsAccuracy <= 30 ? 'hsl(42, 80%, 55%)' : 'hsl(0, 60%, 55%)',
                        boxShadow: `0 0 6px ${gpsAccuracy <= 15 ? 'hsla(120, 50%, 50%, 0.4)' : 'hsla(42, 80%, 55%, 0.4)'}`,
                      }} />
                      <span className="font-serif text-muted-foreground">
                        GPS ~{gpsAccuracy}m
                        {gpsAccuracy > 20 && " · drag pin for precision"}
                      </span>
                    </motion.div>
                  )}

                  {/* Location confirmed badge */}
                  {locationConfirmed && lat && lng && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl p-3"
                      style={{
                        background: 'linear-gradient(135deg, hsla(120, 30%, 15%, 0.4), hsla(42, 25%, 12%, 0.3))',
                        border: '1px solid hsla(120, 40%, 35%, 0.3)',
                        boxShadow: '0 0 20px hsla(120, 40%, 40%, 0.08)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: 'hsla(120, 40%, 30%, 0.4)',
                            border: '1px solid hsla(120, 45%, 40%, 0.4)',
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.2, 1] }}
                          transition={{ duration: 0.4 }}
                        >
                          <Check className="w-4 h-4" style={{ color: 'hsl(120, 50%, 55%)' }} />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-serif" style={{ color: 'hsl(120, 45%, 60%)' }}>
                            Location confirmed
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground/60 truncate">
                            📍 {lat.toFixed(6)}, {lng.toFixed(6)}
                          </p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="text-[10px] h-6 px-2 shrink-0" onClick={() => startAdjustMode(lat, lng)}>
                          Adjust
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Coordinates shown (before adjustment / no confirmation yet) */}
                  {!locationConfirmed && lat && lng && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground rounded-lg px-3 py-2" style={{ background: 'hsla(120, 30%, 20%, 0.2)', border: '1px solid hsla(120, 30%, 30%, 0.2)' }}>
                      <span className="font-mono text-[11px]">📍 {lat.toFixed(6)}, {lng.toFixed(6)}</span>
                      <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => startAdjustMode(lat, lng)}>
                        <MapPin className="h-3 w-3 mr-1" /> Fine-tune
                      </Button>
                    </div>
                  )}

                  {/* Nearby Duplicate Detection */}
                  <NearbyDuplicateWarning
                    latitude={lat}
                    longitude={lng}
                    name={name}
                    species={species}
                    onSelectExisting={(treeId) => {
                      onOpenChange(false);
                      navigate(`/tree/${treeId}`);
                    }}
                    onDismiss={() => {/* user chose to create anyway */}}
                  />

                  {/* ─── Check in to existing tree ─── */}
                  <div
                    className="rounded-xl p-3.5 cursor-pointer group transition-all hover:scale-[1.01]"
                    style={{
                      background: 'linear-gradient(135deg, hsla(120, 25%, 14%, 0.4), hsla(42, 20%, 12%, 0.3))',
                      border: '1px solid hsla(120, 35%, 30%, 0.25)',
                    }}
                    onClick={() => setNearbySheetOpen(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all group-hover:scale-105" style={{
                        background: 'hsla(120, 35%, 25%, 0.4)',
                        border: '1px solid hsla(120, 40%, 35%, 0.3)',
                      }}>
                        <Leaf className="w-4 h-4" style={{ color: 'hsl(120, 45%, 55%)' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-serif" style={{ color: 'hsl(120, 45%, 58%)' }}>
                          Visit an Ancient Friend already mapped
                        </p>
                        <p className="text-[10px] font-serif text-muted-foreground/50 mt-0.5">
                          Check in to a tree the grove already knows
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                    </div>
                  </div>

                  {/* what3words — compact */}
                  <div className="space-y-1.5">
                    <Label htmlFor="what3words" className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
                      what3words {fetchingW3w && <Loader2 className="inline ml-1 h-3 w-3 animate-spin" />}
                      <kbd className="ml-1.5 inline-flex items-center rounded border border-border/40 px-1 py-0.5 text-[8px] font-mono text-muted-foreground/50">/</kbd>
                    </Label>
                    <div className="flex gap-2">
                      <Input ref={w3wInputRef} id="what3words" value={what3words} onChange={(e) => setWhat3words(e.target.value)} placeholder="filled.count.soap" className="flex-1 font-serif h-9 text-sm" />
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleLookupW3w} disabled={lookingUpW3w || !what3words.trim()}>
                        {lookingUpW3w ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── ADJUST MAP (within encounter) ─── */}
            {step === "encounter" && adjustMode && (
              <div className="space-y-3 -mx-5 -my-4">
                {/* Header bar over map */}
                <div className="px-5 pt-4 pb-2">
                  <p className="text-xs text-muted-foreground font-serif leading-relaxed">
                    Drag the golden pin to fine-tune — up to <strong style={{ color: 'hsl(42, 75%, 60%)' }}>144 ft</strong> (≈44m) from your GPS fix.
                  </p>
                </div>

                {/* Map container — fills available space */}
                <div
                  ref={mapContainerRef}
                  className="w-full border-y overflow-hidden"
                  style={{
                    height: 'clamp(200px, 40dvh, 340px)',
                    borderColor: 'hsla(42, 40%, 30%, 0.2)',
                  }}
                />

                {/* Location info bar */}
                <div className="px-5 space-y-3 pb-4">
                  {lat !== null && lng !== null && (
                    <motion.div
                      className="flex items-center justify-between text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" style={{ color: 'hsl(42, 80%, 55%)' }} />
                        <span className="font-mono text-[11px]">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                      </div>
                      {originLat !== null && originLng !== null && (
                        <span className="text-muted-foreground/60 font-serif text-[10px]">
                          {distanceFromGps} ft from GPS
                        </span>
                      )}
                    </motion.div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 font-serif h-11 text-sm"
                      onClick={() => { setAdjustMode(false); setLat(originLat); setLng(originLng); }}
                    >
                      Skip
                    </Button>
                    <Button
                      className="flex-1 gap-2 font-serif h-11 text-sm"
                      onClick={confirmAdjustment}
                      style={{
                        background: 'linear-gradient(135deg, hsl(120, 30%, 22%), hsl(120, 25%, 18%))',
                        color: 'hsl(120, 50%, 70%)',
                        border: '1px solid hsla(120, 40%, 35%, 0.4)',
                      }}
                    >
                      <Check className="h-4 w-4" /> Confirm Location
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── REFLECTION STEP ─── */}
            {step === "reflection" && (
              <>
                <div className="text-center py-2">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <TreeDeciduous className="w-7 h-7 mx-auto mb-1.5" style={{ color: 'hsl(120, 50%, 45%)' }} />
                  </motion.div>
                  <p className="font-serif text-sm text-foreground">{species}</p>
                  {what3words && <p className="font-serif text-[10px] text-muted-foreground/50">/{what3words}</p>}
                  {lat && lng && (
                    <p className="font-mono text-[10px] text-muted-foreground/40 mt-0.5">
                      {lat.toFixed(5)}, {lng.toFixed(5)}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="age" className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">Estimated Age (years)</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="10000"
                    value={estimatedAge}
                    onChange={(e) => setEstimatedAge(e.target.value)}
                    placeholder="How many rings might it hold?"
                    className="font-serif h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">Your Reflection</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                    placeholder="What did you notice? How did you feel standing beside it?"
                    maxLength={2000}
                    rows={4}
                    className="font-serif text-sm"
                  />
                </div>

                <p className="text-[10px] text-center font-serif" style={{ color: 'hsla(42, 40%, 55%, 0.4)' }}>
                  Take your time. This tree has waited centuries.
                </p>
              </>
            )}

            {/* ─── OFFERING STEP ─── */}
            {step === "offering" && (
              <div className="text-center space-y-4 py-3">
                <motion.div
                  className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, hsla(42, 80%, 50%, 0.2), hsla(120, 40%, 20%, 0.3))',
                    border: '2px solid hsla(42, 70%, 50%, 0.4)',
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 4px hsla(42, 80%, 50%, 0.2)',
                      '0 0 20px hsla(42, 80%, 50%, 0.35)',
                      '0 0 4px hsla(42, 80%, 50%, 0.2)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: 'hsl(42, 80%, 60%)' }} />
                </motion.div>

                <div>
                  <h3 className="font-serif text-sm" style={{ color: 'hsl(42, 75%, 60%)' }}>
                    {name || species} has been planted in the Atlas
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 font-serif">
                    Give this ancient friend a name, then leave an offering
                  </p>
                  {uploadingOffering && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'hsl(42, 80%, 55%)' }} />
                      <span className="text-[10px] font-serif" style={{ color: 'hsl(42, 60%, 55%)' }}>Uploading photo offering…</span>
                    </div>
                  )}
                  {!uploadingOffering && droppedPhotoFile && (
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <Check className="h-3 w-3" style={{ color: 'hsl(120, 50%, 55%)' }} />
                      <span className="text-[10px] font-serif" style={{ color: 'hsl(120, 40%, 55%)' }}>Photo offering saved</span>
                    </div>
                  )}
                </div>

                {/* Name field */}
                <div className="space-y-1.5 text-left max-w-xs mx-auto">
                  <Label htmlFor="tree-name" className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">Name this Ancient Friend</Label>
                  <Input
                    id="tree-name"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 200))}
                    placeholder="e.g., The Old Oak of Glastonbury"
                    maxLength={200}
                    className="font-serif h-9 text-sm"
                  />
                  {name.trim() && name.trim() !== species.trim() && savedTreeId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-serif gap-1.5 h-8"
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

                <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                  {[
                    { emoji: "📷", label: "Memory", type: "photo" },
                    { emoji: "🎵", label: "Song", type: "song" },
                    { emoji: "💭", label: "Story", type: "story" },
                  ].map((o) => (
                    <a
                      key={o.type}
                      href={savedTreeId ? `/tree/${encodeURIComponent(savedTreeId)}?add=${o.type}` : '#'}
                      className="flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all hover:scale-105"
                      style={{
                        background: 'hsla(0, 0%, 100%, 0.03)',
                        border: '1px solid hsla(42, 50%, 40%, 0.15)',
                      }}
                    >
                      <span className="text-xl">{o.emoji}</span>
                      <span className="text-[10px] font-serif text-muted-foreground">{o.label}</span>
                    </a>
                  ))}
                </div>

                {/* Seed nudge after tree creation */}
                {savedTreeId && lat != null && lng != null && (
                  <div className="max-w-xs mx-auto w-full">
                    <SeedNudge
                      treeId={savedTreeId}
                      treeName={name || species || "this tree"}
                      treeLat={lat}
                      treeLng={lng}
                      userId={savedUserId}
                      context="new_tree"
                    />
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="text-xs font-serif text-muted-foreground/60"
                  onClick={() => onOpenChange(false)}
                >
                  Perhaps another time
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Navigation Footer ─── */}
        {step !== "offering" && !adjustMode && (
          <div className="px-5 pb-5 pt-2 flex gap-2 shrink-0" style={{
            borderTop: '1px solid hsla(42, 30%, 25%, 0.15)',
            background: 'hsl(var(--card))',
          }}>
            {step !== "encounter" ? (
              <Button variant="outline" className="flex-1 gap-1.5 font-serif h-11" onClick={goBack}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <Button variant="outline" className="flex-1 font-serif h-11" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            <Button
              className="flex-1 gap-1.5 font-serif h-11"
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
            from { opacity: 0; transform: translateX(16px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-16px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pinPulse {
            0%, 100% { box-shadow: 0 0 0 0 hsla(42, 90%, 55%, 0.4), 0 2px 8px hsla(0, 0%, 0%, 0.3); }
            50% { box-shadow: 0 0 0 8px hsla(42, 90%, 55%, 0), 0 2px 8px hsla(0, 0%, 0%, 0.3); }
          }
        `}</style>

        {/* Duplicate guard overlay */}
        <AnimatePresence>
          {showDuplicateGuard && duplicateTree && (
            <motion.div
              className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mx-6 p-5 rounded-xl max-w-sm" style={{
                background: 'linear-gradient(135deg, hsla(30, 25%, 12%, 0.98), hsla(25, 20%, 8%, 0.98))',
                border: '1px solid hsla(42, 50%, 35%, 0.4)',
              }}>
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(42, 80%, 55%)' }} />
                  <div>
                    <p className="font-serif text-sm" style={{ color: 'hsl(42, 75%, 65%)' }}>
                      An Ancient Friend may already be mapped here
                    </p>
                    <p className="font-serif text-xs text-muted-foreground mt-1">
                      "{duplicateTree.name}" is {duplicateTree.distanceM}m away. Would you like to check in instead?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-serif h-9"
                    style={{
                      background: 'linear-gradient(135deg, hsl(120, 30%, 22%), hsl(120, 25%, 18%))',
                      color: 'hsl(120, 50%, 65%)',
                      border: '1px solid hsla(120, 40%, 35%, 0.4)',
                    }}
                    onClick={() => {
                      setShowDuplicateGuard(false);
                      navigate(`/tree/${encodeURIComponent(duplicateTree.id)}`);
                      onOpenChange(false);
                    }}
                  >
                    <MapPin className="w-3 h-3 mr-1" /> Check In Instead
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-serif h-9"
                    onClick={() => {
                      setShowDuplicateGuard(false);
                      handleSubmit();
                    }}
                  >
                    Create Anyway
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {/* Nearby trees sheet for check-in */}
      <NearbyTreesSheet
        open={nearbySheetOpen}
        onOpenChange={setNearbySheetOpen}
        userLat={lat}
        userLng={lng}
        onSelectTree={(tree) => {
          setNearbySheetOpen(false);
          setCheckinTreeData({
            id: tree.id,
            name: tree.name,
            species: tree.species,
            latitude: tree.latitude,
            longitude: tree.longitude,
          });
          setCheckinModalOpen(true);
        }}
      />

      {/* Canopy check-in modal */}
      {checkinTreeData && (
        <CanopyCheckinModal
          open={checkinModalOpen}
          onOpenChange={(v) => {
            setCheckinModalOpen(v);
            if (!v) {
              onOpenChange(false);
              navigate(`/tree/${encodeURIComponent(checkinTreeData.id)}`);
            }
          }}
          treeId={checkinTreeData.id}
          treeName={checkinTreeData.name}
          treeSpecies={checkinTreeData.species}
          treeLat={checkinTreeData.latitude}
          treeLng={checkinTreeData.longitude}
        />
      )}
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
