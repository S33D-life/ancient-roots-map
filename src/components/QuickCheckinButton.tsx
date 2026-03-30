/**
 * QuickCheckinButton — single-click manual check-in for Ancient Friends.
 * Designed to be placed on both map popups and tree detail pages.
 * After check-in, calls onComplete to update parent state.
 */
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CheckinLight } from "@/hooks/use-tree-checkin-status";

interface QuickCheckinButtonProps {
  treeId: string;
  treeName: string;
  userId: string | null;
  light: CheckinLight;
  variant?: "inline" | "full";
  onComplete?: () => void;
}

export default function QuickCheckinButton({
  treeId,
  treeName,
  userId,
  light,
  variant = "full",
  onComplete,
}: QuickCheckinButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleCheckin = useCallback(async () => {
    if (!userId) {
      toast({ title: "Sign in to check in", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    try {
      // Get current season
      const month = new Date().getMonth();
      const seasonMap: Record<number, string> = {
        0: "bare", 1: "bare", 2: "bud", 3: "bud", 4: "leaf",
        5: "blossom", 6: "leaf", 7: "leaf", 8: "fruit", 9: "fruit",
        10: "bare", 11: "bare",
      };

      // Try to get GPS silently (no prompt)
      let lat: number | null = null;
      let lng: number | null = null;
      let accuracy: number | null = null;

      try {
        const permStatus = await navigator.permissions?.query({ name: "geolocation" }).catch(() => null);
        if (permStatus?.state === "granted") {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, {
              enableHighAccuracy: false,
              timeout: 3000,
              maximumAge: 120000,
            })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          accuracy = pos.coords.accuracy;
        }
      } catch {
        // GPS optional
      }

      const { error } = await supabase.from("tree_checkins").insert({
        tree_id: treeId,
        user_id: userId,
        latitude: lat,
        longitude: lng,
        accuracy_m: accuracy,
        season_stage: seasonMap[month] || "other",
        checkin_method: lat ? "gps" : "manual",
        privacy: "public",
        canopy_proof: !!(lat && accuracy && accuracy < 100),
      });

      if (error) throw error;

      setDone(true);
      toast({ title: "🌳 Checked in!", description: `You're at ${treeName}` });
      onComplete?.();

      // Reset after 2s
      setTimeout(() => setDone(false), 2000);
    } catch (err: any) {
      toast({ title: "Check-in failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [userId, treeId, treeName, toast, onComplete]);

  if (done) {
    return (
      <Button
        variant="outline"
        size={variant === "inline" ? "sm" : "default"}
        className="gap-2 font-serif text-xs tracking-wider border-[hsl(142,60%,45%)]/30 text-[hsl(142,60%,45%)]"
        disabled
      >
        <Check className="w-3.5 h-3.5" />
        Checked In
      </Button>
    );
  }

  // Different labels based on status
  const isFirstVisit = light === "red";
  const label = isFirstVisit ? "Check In — First Visit" : "Check In";

  return (
    <Button
      variant={isFirstVisit ? "default" : "outline"}
      size={variant === "inline" ? "sm" : "default"}
      className={`gap-2 font-serif text-xs tracking-wider ${
        isFirstVisit
          ? "bg-primary hover:bg-primary/90"
          : "border-primary/30 hover:bg-primary/10"
      }`}
      onClick={handleCheckin}
      disabled={submitting || !userId}
    >
      {submitting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <MapPin className="w-3.5 h-3.5" />
      )}
      {submitting ? "Checking in..." : label}
    </Button>
  );
}
