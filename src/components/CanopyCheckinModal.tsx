/**
 * CanopyCheckinModal — the main check-in experience for tree visits.
 * Calm, reverent, scholarly feel. Geo-aware with soft fallback.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { haversineKm } from "@/utils/mapGeometry";
import { issueRewards } from "@/utils/issueRewards";
import type { RewardResult } from "@/utils/issueRewards";
import RewardReceipt from "@/components/RewardReceipt";
import PostEncounterShare from "@/components/PostEncounterShare";
import WhisperCollector from "@/components/WhisperCollector";
import SeasonalBonusBadge, { useSeasonalBonus } from "@/components/SeasonalBonusBadge";
import { checkWhispersAtTree, type TreeWhisper } from "@/hooks/use-whispers";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, MapPin, Leaf, Sun, Cloud, CloudRain,
  Snowflake, Wind, Camera, Heart, TreeDeciduous, CheckCircle2, Share2,
} from "lucide-react";
import { toast } from "sonner";

const CANOPY_RADIUS_KM = 0.1; // 100m

const SEASON_STAGES = [
  { value: "bud", label: "Bud", icon: "🌱" },
  { value: "leaf", label: "Leaf", icon: "🍃" },
  { value: "blossom", label: "Blossom", icon: "🌸" },
  { value: "fruit", label: "Fruit", icon: "🍎" },
  { value: "bare", label: "Bare", icon: "🪵" },
  { value: "other", label: "Other", icon: "🌿" },
];

const WEATHER_OPTIONS = [
  { value: "sunny", label: "Sunny", icon: "☀️" },
  { value: "cloudy", label: "Cloudy", icon: "☁️" },
  { value: "rainy", label: "Rainy", icon: "🌧️" },
  { value: "snowy", label: "Snowy", icon: "❄️" },
  { value: "windy", label: "Windy", icon: "💨" },
  { value: "misty", label: "Misty", icon: "🌫️" },
  { value: "stormy", label: "Stormy", icon: "⛈️" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  treeName: string;
  treeSpecies: string;
  treeLat?: number | null;
  treeLng?: number | null;
  onCheckinComplete?: () => void;
}

export default function CanopyCheckinModal({
  open, onOpenChange, treeId, treeName, treeSpecies,
  treeLat, treeLng, onCheckinComplete,
}: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"checking" | "under_canopy" | "outside" | "unavailable">("checking");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [softMode, setSoftMode] = useState(false);

  // Form
  const [seasonStage, setSeasonStage] = useState("other");
  const [weather, setWeather] = useState("");
  const [reflection, setReflection] = useState("");
  const [moodScore, setMoodScore] = useState([3]);
  const [birdsongHeard, setBirdsongHeard] = useState(false);
  const [fungiPresent, setFungiPresent] = useState(false);
  const [healthNotes, setHealthNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rewardResult, setRewardResult] = useState<RewardResult | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [checkinWhispers, setCheckinWhispers] = useState<TreeWhisper[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSeasonStage("other");
      setWeather("");
      setReflection("");
      setMoodScore([3]);
      setBirdsongHeard(false);
      setFungiPresent(false);
      setHealthNotes("");
      setSubmitted(false);
      setRewardResult(null);
      setSoftMode(false);
      setShowShareOverlay(false);
      checkGeo();
    }
  }, [open]);

  const checkGeo = useCallback(() => {
    if (!treeLat || !treeLng) {
      setGeoStatus("unavailable");
      return;
    }
    if (!("geolocation" in navigator)) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        const dist = haversineKm(pos.coords.latitude, pos.coords.longitude, treeLat, treeLng);
        setGeoStatus(dist <= CANOPY_RADIUS_KM ? "under_canopy" : "outside");
      },
      () => setGeoStatus("unavailable"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [treeLat, treeLng]);

  const canCheckIn = geoStatus === "under_canopy" || softMode;

  const handleSubmit = async () => {
    if (!userId) { toast.error("Please sign in to check in."); return; }
    setSubmitting(true);

    const { error } = await supabase.from("tree_checkins").insert({
      tree_id: treeId,
      user_id: userId,
      latitude: userLat,
      longitude: userLng,
      season_stage: seasonStage,
      weather: weather || null,
      reflection: reflection.trim() || null,
      mood_score: moodScore[0],
      canopy_proof: geoStatus === "under_canopy",
      birdsong_heard: birdsongHeard,
      fungi_present: fungiPresent,
      health_notes: healthNotes.trim() || null,
    } as any);

    if (error) {
      toast.error("Failed to record check-in.");
      console.error("Checkin error:", error);
      setSubmitting(false);
      return;
    }

    // Check for seasonal bloom sync bonus
    let seasonalBonusAmount = 0;
    const currentMonth = new Date().getMonth() + 1;
    const { data: phenoData } = await supabase
      .from("species_phenology")
      .select("season_stage")
      .eq("species", treeSpecies)
      .eq("month", currentMonth)
      .order("observation_count", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (phenoData && phenoData.season_stage === seasonStage) {
      seasonalBonusAmount = 1; // Bloom sync bonus
    }

    // Issue rewards (with optional seasonal bonus)
    const reward = await issueRewards({
      userId,
      treeId,
      treeSpecies,
      actionType: "checkin",
      s33dAmount: 1 + seasonalBonusAmount,
    });
    setRewardResult(reward);

    // Try to claim any pending windfall hearts for this tree
    if (reward && !reward.capped) {
      const { data: windfallAmount } = await supabase.rpc("claim_windfall_hearts", {
        p_tree_id: treeId,
        p_user_id: userId,
      });
      if (windfallAmount && windfallAmount > 0) {
        setRewardResult(prev => prev ? {
          ...prev,
          s33dHearts: prev.s33dHearts + windfallAmount,
        } : prev);
      }
    }

    // Check for whispers at this tree
    if (userId) {
      checkWhispersAtTree(userId, treeId, treeSpecies).then(setCheckinWhispers);
    }

    // Loop closure: check if any Press chapters are linked to this tree
    supabase
      .from("press_chapters")
      .select("id, title, work_id")
      .eq("linked_tree_id", treeId)
      .limit(1)
      .maybeSingle()
      .then(({ data: chapter }) => {
        if (chapter) {
          toast("A new chapter has unfolded 📖", {
            description: `"${chapter.title}" — unlocked by your visit`,
            action: {
              label: "Read",
              onClick: () => window.location.assign("/press"),
            },
            duration: 8000,
          });
        }
      });

    // Loop closure: check if this tree was on the user's wish list
    supabase
      .from("tree_wishlist")
      .select("id")
      .eq("user_id", userId)
      .eq("tree_id", treeId)
      .maybeSingle()
      .then(({ data: wish }) => {
        if (wish) {
          toast("You've arrived at a tree you wished for ⭐", {
            description: "A dream made real.",
            duration: 6000,
          });
        }
      });

    setSubmitted(true);
    setSubmitting(false);
    setShowReceipt(true);
    onCheckinComplete?.();
  };

  // Success state
  if (submitted) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md overflow-hidden">
            {/* Leaf animation overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  initial={{ x: Math.random() * 300 + 50, y: -30, rotate: 0, opacity: 0.7 }}
                  animate={{
                    y: 500,
                    x: Math.random() * 300 + 50 + (Math.random() - 0.5) * 100,
                    rotate: Math.random() * 360,
                    opacity: 0,
                  }}
                  transition={{ duration: 3 + Math.random() * 2, delay: i * 0.3, ease: "easeIn" }}
                >
                  🍃
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 py-8 text-center relative z-10">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.15))",
                    boxShadow: "0 0 30px hsl(var(--primary) / 0.15)",
                  }}
                >
                  <TreeDeciduous className="w-8 h-8 text-primary" />
                </div>
              </motion.div>

              <motion.h3
                className="text-xl font-serif text-primary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Presence Marked
              </motion.h3>

              <motion.p
                className="text-sm text-muted-foreground font-serif max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Your visit to <strong>{treeName}</strong> has been recorded in the canopy ledger.
              </motion.p>

              {rewardResult && !rewardResult.capped && (
                <motion.button
                  className="flex items-center gap-2 text-xs font-serif text-primary/80 hover:text-primary transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => setShowReceipt(true)}
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  +{rewardResult.s33dHearts} Heart{rewardResult.s33dHearts !== 1 ? "s" : ""} earned
                  {rewardResult.speciesHearts > 0 && (
                    <span> · +{rewardResult.speciesHearts} {rewardResult.speciesFamily}</span>
                  )}
                  <span className="text-muted-foreground/50 ml-1">· View receipt</span>
                </motion.button>
              )}

              {rewardResult?.capped && (
                <motion.p
                  className="text-xs text-muted-foreground font-serif"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  Daily heart cap reached for this tree (3 per day).
                </motion.p>
              )}

              {/* Whisper Collector — reveal whispers found at this tree */}
              {checkinWhispers.length > 0 && userId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="w-full max-w-sm"
                >
                  <WhisperCollector
                    whispers={checkinWhispers}
                    userId={userId}
                    treeId={treeId}
                    treeName={treeName}
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex gap-2"
              >
                <Button onClick={() => onOpenChange(false)} variant="outline" className="font-serif mt-2">
                  Return
                </Button>
                <Button
                  onClick={() => setShowShareOverlay(true)}
                  className="font-serif mt-2 gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>

        {rewardResult && !rewardResult.capped && (
          <RewardReceipt
            visible={showReceipt}
            onClose={() => setShowReceipt(false)}
            s33dHearts={rewardResult.s33dHearts}
            speciesHearts={rewardResult.speciesHearts}
            speciesFamily={rewardResult.speciesFamily}
            actionLabel={`Check-in at ${treeName}`}
          />
        )}

        <PostEncounterShare
          visible={showShareOverlay}
          onDismiss={() => setShowShareOverlay(false)}
          treeName={treeName}
          treeSpecies={treeSpecies}
          shareLink={`${window.location.origin}/tree/${treeId}`}
        />
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TreeDeciduous className="h-5 w-5 text-primary" />
            <DialogTitle className="font-serif text-primary tracking-wide">
              Sit Beneath This Canopy
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground font-serif mt-1">
            Mark your presence with {treeName}.
          </p>
        </DialogHeader>

        {/* Geo Status */}
        <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
          {geoStatus === "checking" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-serif">
              <Loader2 className="w-4 h-4 animate-spin" /> Sensing your position…
            </div>
          )}
          {geoStatus === "under_canopy" && (
            <div className="flex items-center gap-2 text-sm font-serif text-primary">
              <MapPin className="w-4 h-4" />
              <span>You are beneath this canopy.</span>
              <Badge variant="outline" className="text-[9px] ml-auto border-primary/30">GPS Verified</Badge>
            </div>
          )}
          {geoStatus === "outside" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-serif text-muted-foreground">
                <MapPin className="w-4 h-4" />
                You are not currently beneath this canopy.
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="soft-mode"
                  checked={softMode}
                  onCheckedChange={(v) => setSoftMode(v === true)}
                />
                <Label htmlFor="soft-mode" className="text-xs font-serif text-muted-foreground cursor-pointer">
                  Record a seasonal reflection instead (soft check-in)
                </Label>
              </div>
            </div>
          )}
          {geoStatus === "unavailable" && (
            <div className="space-y-2">
              <p className="text-sm font-serif text-muted-foreground">
                Location unavailable. You can still record a seasonal reflection.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="soft-mode-2"
                  checked={softMode}
                  onCheckedChange={(v) => setSoftMode(v === true)}
                />
                <Label htmlFor="soft-mode-2" className="text-xs font-serif text-muted-foreground cursor-pointer">
                  Enable soft check-in mode
                </Label>
              </div>
            </div>
          )}
        </div>

        <div className={`space-y-4 py-2 ${!canCheckIn ? "opacity-40 pointer-events-none" : ""}`}>
          {/* Season Stage */}
          <div className="space-y-2">
            <Label className="font-serif text-sm">Seasonal Stage</Label>
            <div className="flex flex-wrap gap-2">
              {SEASON_STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSeasonStage(s.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif border transition-all ${
                    seasonStage === s.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
            <SeasonalBonusBadge species={treeSpecies} currentSeasonStage={seasonStage} />
          </div>

          {/* Weather */}
          <div className="space-y-2">
            <Label className="font-serif text-sm">Weather</Label>
            <div className="flex flex-wrap gap-2">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setWeather(weather === w.value ? "" : w.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif border transition-all ${
                    weather === w.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span>{w.icon}</span> {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood / Resonance */}
          <div className="space-y-2">
            <Label className="font-serif text-sm">
              Resonance
              <span className="ml-2 text-muted-foreground text-xs font-normal">
                {["Quiet", "Gentle", "Present", "Connected", "Transcendent"][moodScore[0] - 1]}
              </span>
            </Label>
            <Slider
              value={moodScore}
              onValueChange={setMoodScore}
              min={1}
              max={5}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/50 font-serif">
              <span>Quiet</span>
              <span>Transcendent</span>
            </div>
          </div>

          {/* Reflection */}
          <div className="space-y-1.5">
            <Label htmlFor="reflection" className="font-serif text-sm">Reflection (optional)</Label>
            <Textarea
              id="reflection"
              placeholder="What did you notice today?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="font-serif text-sm min-h-[80px] resize-none"
              maxLength={2000}
            />
          </div>

          {/* Observations */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="birdsong"
                checked={birdsongHeard}
                onCheckedChange={(v) => setBirdsongHeard(v === true)}
              />
              <Label htmlFor="birdsong" className="text-xs font-serif text-muted-foreground cursor-pointer">
                🐦 Birdsong heard
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="fungi"
                checked={fungiPresent}
                onCheckedChange={(v) => setFungiPresent(v === true)}
              />
              <Label htmlFor="fungi" className="text-xs font-serif text-muted-foreground cursor-pointer">
                🍄 Fungi present
              </Label>
            </div>
          </div>

          {/* Health Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="health" className="font-serif text-sm">Health observations (optional)</Label>
            <Input
              id="health"
              placeholder="Signs of stress, growth, or change…"
              value={healthNotes}
              onChange={(e) => setHealthNotes(e.target.value)}
              className="font-serif text-sm"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-serif">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canCheckIn || !userId}
            className="font-serif gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <Leaf className="h-4 w-4" />
            Witness This Season
          </Button>
        </DialogFooter>

        {!userId && (
          <p className="text-xs text-center text-muted-foreground font-serif mt-2">
            Please <a href="/auth" className="text-primary underline">sign in</a> to check in.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
