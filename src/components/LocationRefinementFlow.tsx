/**
 * LocationRefinementFlow — modal/inline flow for proposing a better tree position.
 * Works for both manual refinement and post-check-in passive refinement.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, TreeDeciduous, Camera, Check, Loader2, Navigation, X } from "lucide-react";
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
  const { position, status, error, locate, isLocating } = useGeolocation();
  const { toast } = useToast();

  const distanceM = position
    ? Math.round(haversineKm(treeLat, treeLng, position.lat, position.lng) * 1000)
    : null;

  const handleLocate = useCallback(async () => {
    const result = await locate("refinement-flow");
    if (result) setStep("confirm");
  }, [locate]);

  const handleSubmit = useCallback(async () => {
    if (!position) return;
    setSubmitting(true);

    try {
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
  }, [position, atTrunk, note, treeId, userId, sourceType, checkinId, treeName, toast, onComplete]);

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
            Stand near the trunk and share your GPS to help the atlas learn.
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
            <Switch
              id="at-trunk"
              checked={atTrunk}
              onCheckedChange={setAtTrunk}
            />
            <Label htmlFor="at-trunk" className="text-xs font-serif cursor-pointer flex items-center gap-1.5">
              <TreeDeciduous className="h-3.5 w-3.5 text-primary" />
              I'm standing at the trunk
            </Label>
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
