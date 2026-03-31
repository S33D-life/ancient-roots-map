/**
 * LocationRefinementFlow — modal/inline flow for proposing a better tree position.
 * Works for both manual refinement and post-check-in passive refinement.
 */
import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, TreeDeciduous, Camera, Check, Loader2, Navigation, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useGeolocation, GEO_ERROR_CONFIG } from "@/hooks/use-geolocation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { computeRefinementWeight } from "@/utils/locationRefinement";
import { haversineKm } from "@/utils/mapGeometry";

interface LocationRefinementFlowProps {
  treeId: string;
  treeName: string;
  treeLat: number;
  treeLng: number;
  userId: string;
  sourceType?: "checkin_passive" | "manual_refinement";
  checkinId?: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

async function uploadRefinementPhoto(
  file: File,
  treeId: string,
  userId: string,
  label: string,
): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `refinements/${treeId}/${userId}-${label}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("tree-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return null;
  const { data } = supabase.storage.from("tree-photos").getPublicUrl(path);
  return data.publicUrl;
}

export default function LocationRefinementFlow({
  treeId,
  treeName,
  treeLat,
  treeLng,
  userId,
  sourceType = "manual_refinement",
  checkinId,
  onComplete,
  onDismiss,
}: LocationRefinementFlowProps) {
  const [step, setStep] = useState<"locate" | "confirm" | "done">("locate");
  const [atTrunk, setAtTrunk] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [trunkPhoto, setTrunkPhoto] = useState<File | null>(null);
  const [contextPhoto, setContextPhoto] = useState<File | null>(null);
  const [trunkPreview, setTrunkPreview] = useState<string | null>(null);
  const [contextPreview, setContextPreview] = useState<string | null>(null);
  const trunkInputRef = useRef<HTMLInputElement>(null);
  const contextInputRef = useRef<HTMLInputElement>(null);
  const { position, error, locate, isLocating } = useGeolocation();
  const { toast } = useToast();

  const distanceM = position
    ? Math.round(haversineKm(treeLat, treeLng, position.lat, position.lng) * 1000)
    : null;

  const handleFileSelect = useCallback((file: File, type: "trunk" | "context") => {
    const url = URL.createObjectURL(file);
    if (type === "trunk") { setTrunkPhoto(file); setTrunkPreview(url); }
    else { setContextPhoto(file); setContextPreview(url); }
  }, []);

  const handleLocate = useCallback(async () => {
    const result = await locate("refinement-flow");
    if (result) setStep("confirm");
  }, [locate]);

  const handleSubmit = useCallback(async () => {
    if (!position) return;
    setSubmitting(true);

    try {
      // Upload photos in parallel
      const [trunkUrl, contextUrl] = await Promise.all([
        trunkPhoto ? uploadRefinementPhoto(trunkPhoto, treeId, userId, "trunk") : null,
        contextPhoto ? uploadRefinementPhoto(contextPhoto, treeId, userId, "context") : null,
      ]);

      const weight = computeRefinementWeight({
        accuracy_m: position.accuracy,
        at_trunk: atTrunk,
        source_type: sourceType,
      });

      const { error: insertError } = await supabase
        .from("tree_location_refinements" as any)
        .insert({
          tree_id: treeId,
          user_id: userId,
          latitude: position.lat,
          longitude: position.lng,
          accuracy_m: position.accuracy,
          source_type: sourceType,
          at_trunk: atTrunk,
          note: note.trim() || null,
          checkin_id: checkinId || null,
          weight,
          trunk_photo_url: trunkUrl,
          context_photo_url: contextUrl,
        });

      if (insertError) throw insertError;

      setStep("done");
      toast({
        title: "🌳 Location refinement submitted",
        description: `Thank you for helping pin ${treeName} more precisely.`,
      });
      onComplete?.();
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [position, atTrunk, note, treeId, userId, sourceType, checkinId, treeName, toast, onComplete, trunkPhoto, contextPhoto]);

  if (step === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2"
      >
        <Check className="h-6 w-6 mx-auto text-primary" />
        <p className="font-serif text-sm text-primary">Refinement recorded</p>
        <p className="text-xs text-muted-foreground">
          Your observation helps the atlas learn.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-serif text-sm font-semibold tracking-wide flex items-center gap-2">
            <Navigation className="h-3.5 w-3.5 text-primary" />
            {sourceType === "checkin_passive" ? "Help refine this location" : "Propose better location"}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Stand as close to the trunk as you can and capture your location.
          </p>
        </div>
        {onDismiss && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {step === "locate" && (
        <div className="space-y-3">
          <Button
            onClick={handleLocate}
            disabled={isLocating}
            className="w-full gap-2 font-serif text-xs tracking-wider"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MapPin className="h-3.5 w-3.5" />
            )}
            {isLocating ? "Getting your position…" : "Capture my location"}
          </Button>

          {error && (
            <p className="text-xs text-destructive">
              {GEO_ERROR_CONFIG[error.code]?.message || error.message}
            </p>
          )}
        </div>
      )}

      {step === "confirm" && position && (
        <div className="space-y-4">
          {/* Distance indicator */}
          <div className="rounded-lg bg-secondary/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Distance from mapped position</span>
              <span className="font-mono text-xs font-semibold text-primary">
                {distanceM != null ? `${distanceM}m` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">GPS accuracy</span>
              <span className="font-mono text-xs">
                ±{Math.round(position.accuracy)}m
              </span>
            </div>
          </div>

          {/* At trunk toggle */}
          <div className="flex items-center gap-3">
            <Switch id="at-trunk" checked={atTrunk} onCheckedChange={setAtTrunk} />
            <Label htmlFor="at-trunk" className="text-xs font-serif cursor-pointer flex items-center gap-1.5">
              <TreeDeciduous className="h-3.5 w-3.5 text-primary" />
              I'm standing at the trunk
            </Label>
          </div>

          {/* Photo uploads */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-serif">Optional photos (strengthen confidence)</p>
            <div className="flex gap-2">
              {/* Trunk photo */}
              <div className="flex-1">
                <input
                  ref={trunkInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f, "trunk");
                  }}
                />
                {trunkPreview ? (
                  <button
                    type="button"
                    onClick={() => trunkInputRef.current?.click()}
                    className="w-full h-16 rounded-lg overflow-hidden border border-primary/20 relative"
                  >
                    <img src={trunkPreview} alt="Trunk" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white text-center py-0.5">Trunk</span>
                  </button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-16 flex-col gap-1 text-[10px] font-serif"
                    onClick={() => trunkInputRef.current?.click()}
                  >
                    <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                    Trunk photo
                  </Button>
                )}
              </div>

              {/* Context photo */}
              <div className="flex-1">
                <input
                  ref={contextInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f, "context");
                  }}
                />
                {contextPreview ? (
                  <button
                    type="button"
                    onClick={() => contextInputRef.current?.click()}
                    className="w-full h-16 rounded-lg overflow-hidden border border-primary/20 relative"
                  >
                    <img src={contextPreview} alt="Context" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white text-center py-0.5">Context</span>
                  </button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-16 flex-col gap-1 text-[10px] font-serif"
                    onClick={() => contextInputRef.current?.click()}
                  >
                    <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
                    Context photo
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Note */}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (e.g. 'large oak by the river path')"
            className="text-xs font-serif min-h-[60px] resize-none"
            maxLength={1000}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("locate")}
              className="flex-1 font-serif text-xs"
            >
              Retake
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 gap-2 font-serif text-xs"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Submit refinement
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
