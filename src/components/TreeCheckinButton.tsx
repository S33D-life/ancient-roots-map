/**
 * Check-in CTA button for tree pages.
 * Privacy selection + optional GPS + weather attachment.
 */
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin, Check, Loader2, Locate, Shield, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWeather, weatherSummary } from "@/hooks/use-weather";
import { createOrReuseSkystamp } from "@/hooks/use-skystamp";
import { useUIFlow } from "@/contexts/UIFlowContext";

interface TreeCheckinButtonProps {
  treeId: string;
  treeName: string;
  treeLat: number | null;
  treeLng: number | null;
  userId: string | null;
  onCheckinComplete?: () => void;
}

const TreeCheckinButton = ({ treeId, treeName, treeLat, treeLng, userId, onCheckinComplete }: TreeCheckinButtonProps) => {
  const [open, setOpen] = useState(false);
  const [privacy, setPrivacy] = useState<string>("public");
  const [note, setNote] = useState("");
  const [useGps, setUseGps] = useState(false);
  const [attachWeather, setAttachWeather] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const { enterFlow, exitFlow } = useUIFlow();
  const { weather } = useWeather(treeLat, treeLng);

  const handleOpen = useCallback(() => {
    if (!userId) {
      toast({ title: "Sign in to check in", variant: "destructive" });
      return;
    }
    enterFlow("form");
    setOpen(true);
    setDone(false);
  }, [userId, enterFlow, toast]);

  const handleClose = useCallback(() => {
    setOpen(false);
    exitFlow();
  }, [exitFlow]);

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);

    try {
      let lat: number | null = null;
      let lng: number | null = null;
      let accuracy: number | null = null;

      if (useGps && "geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          accuracy = pos.coords.accuracy;
        } catch { /* GPS optional */ }
      }

      // Get season stage based on month
      const month = new Date().getMonth();
      const seasonMap: Record<number, string> = { 0: "bare", 1: "bare", 2: "bud", 3: "bud", 4: "leaf", 5: "blossom", 6: "leaf", 7: "leaf", 8: "fruit", 9: "fruit", 10: "bare", 11: "bare" };
      const seasonStage = seasonMap[month] || "other";

      const weatherStr = attachWeather && weather ? weatherSummary(weather) : null;

      const { data: checkinData, error } = await supabase.from("tree_checkins").insert({
        tree_id: treeId,
        user_id: userId,
        latitude: lat,
        longitude: lng,
        season_stage: seasonStage,
        weather: weatherStr,
        reflection: note.trim() || null,
        checkin_method: useGps ? "gps" : "manual",
        privacy,
        canopy_proof: !!lat,
      }).select("id").single();

      if (error) throw error;

      // Attach Skystamp (fire-and-forget)
      if (checkinData && treeLat && treeLng) {
        createOrReuseSkystamp({
          lat: treeLat,
          lng: treeLng,
          userId,
          treeId,
          checkinId: checkinData.id,
          weather: attachWeather ? weather : null,
        }).then(async (stampId) => {
          if (stampId) {
            await supabase.from("tree_checkins").update({ sky_stamp_id: stampId } as any).eq("id", checkinData.id);
          }
        });
      }

      setDone(true);
      toast({ title: "Checked in! 🌳", description: `You're at ${treeName}` });
      onCheckinComplete?.();

      setTimeout(() => handleClose(), 1500);
    } catch (err: any) {
      toast({ title: "Check-in failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 font-serif text-xs tracking-wider border-primary/30 hover:bg-primary/10"
        onClick={handleOpen}
      >
        <MapPin className="w-3.5 h-3.5" />
        Check In
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg tracking-wide">
              {done ? "✓ Checked In" : `Check In at ${treeName}`}
            </DialogTitle>
          </DialogHeader>

          {done ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/15 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-serif">Your visit has been recorded.</p>
              {weather && attachWeather && (
                <Badge variant="outline" className="text-[10px] font-serif gap-1">
                  <Cloud className="w-3 h-3" />
                  {weather.weatherIcon} {Math.round(weather.temp)}°C
                </Badge>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Privacy */}
              <div className="space-y-1.5">
                <Label className="text-xs font-serif tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Privacy
                </Label>
                <Select value={privacy} onValueChange={setPrivacy}>
                  <SelectTrigger className="font-serif text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public" className="font-serif">Shared with the forest</SelectItem>
                    <SelectItem value="friends" className="font-serif">Shared with your grove</SelectItem>
                    <SelectItem value="private" className="font-serif">Held in Heartwood</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-serif tracking-wider text-muted-foreground">Note (optional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 280))}
                  placeholder="A thought from beneath the branches..."
                  rows={2}
                  maxLength={280}
                  className="font-serif resize-none text-sm"
                />
              </div>

              {/* GPS */}
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/10 p-3">
                <div className="flex items-center gap-2">
                  <Locate className="w-4 h-4 text-primary/60" />
                  <div>
                    <p className="text-xs font-serif">Attach GPS location</p>
                    <p className="text-[9px] text-muted-foreground">Proves canopy proximity</p>
                  </div>
                </div>
                <Switch checked={useGps} onCheckedChange={setUseGps} />
              </div>

              {/* Weather attachment */}
              {weather && (
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/10 p-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-primary/60" />
                    <div>
                      <p className="text-xs font-serif">Attach weather</p>
                      <p className="text-[9px] text-muted-foreground">{weather.weatherIcon} {Math.round(weather.temp)}°C, {weather.weatherDesc}</p>
                    </div>
                  </div>
                  <Switch checked={attachWeather} onCheckedChange={setAttachWeather} />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full gap-2 font-serif tracking-wider"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {submitting ? "Checking in..." : "Check In"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TreeCheckinButton;
