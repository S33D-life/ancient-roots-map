import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Heart, Loader2, MapPin, Clock, Compass, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  useSeedEconomy,
  PROXIMITY_METERS,
  type ActionResult,
  type GpsConfidence,
} from "@/hooks/use-seed-economy";
import type { PlantedSeed } from "@/hooks/use-seed-economy";
import { formatDistanceToNow } from "date-fns";
import RewardReceipt from "@/components/RewardReceipt";
import SeedBurst from "@/components/SeedBurst";
import { getFamilyForSpecies } from "@/data/treeSpecies";
import { useHasRole } from "@/hooks/use-role";

function explainFailure(r: ActionResult): { title: string; description?: string } {
  const d = r.distance != null ? `${Math.round(r.distance)}m` : null;
  const a = r.accuracy != null ? `±${Math.round(r.accuracy)}m` : null;
  switch (r.reason) {
    case "no_user":
      return { title: "Sign in required", description: "Please sign in to collect Hearts." };
    case "no_seeds":
      return { title: "No seeds remaining today", description: "They refresh at midnight." };
    case "per_tree_limit":
      return { title: "Daily limit reached at this tree", description: "Try another tree today." };
    case "seed_missing":
      return { title: "This Heart is no longer here", description: "It may have just been collected." };
    case "tree_missing":
      return { title: "This tree is no longer registered", description: "Please report this to a keeper." };
    case "already_collected":
      return { title: "This Heart was already collected" };
    case "own_seed":
      return { title: "This is your own Seed", description: "Another wanderer must collect it." };
    case "not_bloomed":
      return { title: "This Seed hasn't bloomed yet", description: "Come back when it's ready." };
    case "no_seed_coords":
      return { title: "This Heart has no location", description: "Please report this tree." };
    case "no_user_coords":
    case "no_target_coords":
      return { title: "Location data missing", description: "Please try again or report this tree." };
    case "geo_unsupported":
      return { title: "Location isn't supported on this device" };
    case "geo_denied":
      return { title: "Please enable location access for S33D" };
    case "geo_unavailable":
      return { title: "Signal uncertain beneath the canopy", description: "Try stepping into a clearer patch of sky." };
    case "geo_timeout":
      return { title: "Seeking a clearer signal beneath the canopy…", description: "Try stepping into a clearer patch of sky." };
    case "geo_poor_accuracy":
      return {
        title: "You appear nearby, but GPS confidence is low",
        description: a ? `GPS uncertain ${a} — try stepping into a clearer patch of sky.` : undefined,
      };
    case "too_far":
      return { title: `You appear to be ${d ?? "some distance"} away`, description: a ? `GPS accuracy ${a}` : undefined };
    case "override_too_far":
      return {
        title: "Too far for an approximate-location encounter",
        description: d ? `You're ~${d} from this tree — the override only works when you're nearby.` : undefined,
      };
    case "override_disabled":
      return {
        title: "Approximate-location override is currently off",
        description: "A keeper has paused this option. Please try again with a clearer GPS signal.",
      };
    case "rpc_error":
      return { title: "Something went wrong on our side", description: r.error };
    default:
      return { title: "Couldn't collect Heart" };
  }
}

function confidenceLabel(c: GpsConfidence | undefined): string {
  if (c === "high") return "High";
  if (c === "medium") return "Medium";
  if (c === "low") return "Low";
  return "—";
}

function accuracyTone(c: GpsConfidence | undefined): string {
  // returns Tailwind text color class
  if (c === "high") return "text-emerald-600";
  if (c === "medium") return "text-amber-600";
  if (c === "low") return "text-red-600";
  return "text-muted-foreground";
}

function getPlatform(): string {
  if (typeof navigator === "undefined") return "ssr";
  const ua = navigator.userAgent;
  const isiOS = /iP(hone|ad|od)/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isStandalone = (window.matchMedia?.("(display-mode: standalone)").matches) ||
    // @ts-expect-error iOS Safari
    !!window.navigator.standalone;
  const browser = /CriOS/.test(ua) ? "Chrome iOS"
    : /FxiOS/.test(ua) ? "Firefox iOS"
    : /Safari/.test(ua) && !/Chrome/.test(ua) ? "Safari"
    : /Chrome/.test(ua) ? "Chrome"
    : /Firefox/.test(ua) ? "Firefox"
    : "Browser";
  const os = isiOS ? "iOS" : isAndroid ? "Android" : "Desktop";
  return `${os} · ${browser}${isStandalone ? " · PWA" : ""}`;
}
interface SeedPlanterProps {
  treeId: string;
  treeLat: number | null;
  treeLng: number | null;
  userId: string | null;
  treeSpecies?: string;
}

const SeedPlanter = ({ treeId, treeLat, treeLng, userId, treeSpecies }: SeedPlanterProps) => {
  const {
    seedsRemaining,
    plantSeed,
    collectHeart,
    getSeedsAtTree,
    getBloomedSeedsAtTree,
  } = useSeedEconomy(userId);

  const [planting, setPlanting] = useState(false);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [showPlanted, setShowPlanted] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<{ s33dHearts: number; speciesHearts: number; speciesFamily?: string }>({ s33dHearts: 0, speciesHearts: 0 });
  const [lastResult, setLastResult] = useState<ActionResult | null>(null);
  const [locatingMessage, setLocatingMessage] = useState<string | null>(null);
  const [overrideEnabled, setOverrideEnabled] = useState(false);

  const { hasRole: isKeeper } = useHasRole("keeper");
  // The override is now available to anyone — keepers/dev see it always; everyone else
  // sees it once an attempt has hinted at GPS uncertainty so we don't tempt misuse.
  const lastReason = lastResult?.reason;
  const lastConfidence = lastResult?.confidence;
  const gpsUncertaintyHinted =
    lastReason === "geo_poor_accuracy" ||
    lastReason === "geo_timeout" ||
    lastReason === "geo_unavailable" ||
    (lastReason === "too_far" && (lastConfidence === "low" || lastConfidence === "medium"));
  const showOverrideToggle = import.meta.env.DEV || isKeeper || gpsUncertaintyHinted;

  const seedsHere = getSeedsAtTree(treeId);
  const bloomedSeeds = getBloomedSeedsAtTree(treeId);
  const sproutingSeeds = seedsHere.filter(
    (s) => !s.collected_by && new Date(s.blooms_at) > new Date()
  );

  const collectibleSeeds = bloomedSeeds.filter(
    (s) => s.planter_id !== userId
  );

  if (!userId || treeLat == null || treeLng == null) return null;

  const onAttempt = (attempt: number) => {
    setLocatingMessage(
      attempt === 1
        ? "Locating your position…"
        : "Seeking a clearer signal beneath the canopy…",
    );
  };

  const refineForToast = (result: ActionResult): ActionResult => {
    // "Too far" with low confidence is really a signal-quality issue, not user position.
    if (result.reason === "too_far" && result.confidence === "low") {
      return { ...result, reason: "geo_poor_accuracy" };
    }
    return result;
  };

  const handlePlant = async () => {
    setPlanting(true);
    setLocatingMessage("Locating your position…");
    const result = await plantSeed(treeId, treeLat, treeLng, {
      onAttempt,
      override: overrideEnabled,
    });
    setPlanting(false);
    setLocatingMessage(null);
    setLastResult(result);

    if (result.ok) {
      setShowBurst(true);
      setShowPlanted(true);
      if (result.overrideUsed) {
        setOverrideEnabled(false);
        toast.success("🌱 Seed planted (approximate location)", {
          description: "Recorded with your true distance — thank you for being honest.",
        });
      } else {
        toast.success("🌱 Seed planted! It carries 33 hearts — blooming in 24 hours.");
      }
      setTimeout(() => { setShowPlanted(false); setShowBurst(false); }, 2500);
    } else {
      const { title, description } = explainFailure(refineForToast(result));
      toast.error(title, description ? { description } : undefined);
      if (import.meta.env.DEV) console.warn("[SeedPlanter] plant failed", result);
    }
  };

  const handleCollect = async (seed: PlantedSeed) => {
    setCollecting(seed.id);
    setLocatingMessage("Locating your position…");
    const result = await collectHeart(seed.id, {
      onAttempt,
      override: overrideEnabled,
    });
    setCollecting(null);
    setLocatingMessage(null);
    setLastResult(result);

    if (result.ok) {
      const family = treeSpecies ? getFamilyForSpecies(treeSpecies) : undefined;
      setReceiptData({ s33dHearts: 11, speciesHearts: family ? 1 : 0, speciesFamily: family || undefined });
      setReceiptVisible(true);
      if (result.overrideUsed) {
        setOverrideEnabled(false);
        toast.success("Heart collected (approximate location)", {
          description: "Recorded with your true distance — thank you for being honest.",
        });
      }
    } else {
      const { title, description } = explainFailure(refineForToast(result));
      toast.error(title, description ? { description } : undefined);
      if (import.meta.env.DEV) console.warn("[SeedPlanter] collect failed", result);
    }
  };

  return (
    <div className="space-y-4">
      {/* Seed Planter Card */}
      <Card className="border-primary/30 bg-card/60 backdrop-blur overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <CardContent className="py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center border border-primary/25">
                <Sprout className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-serif text-foreground">Plant a Seed</p>
                <p className="text-[11px] text-muted-foreground font-serif">
                  {seedsRemaining} seed{seedsRemaining !== 1 ? "s" : ""} remaining today
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handlePlant}
              disabled={planting || seedsRemaining <= 0}
              className="font-serif text-xs gap-1.5"
            >
              {planting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sprout className="w-3.5 h-3.5" />
              )}
              Plant
            </Button>
          </div>

          {/* Planted animation */}
          <AnimatePresence>
            {showPlanted && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 text-center text-sm font-serif text-primary"
              >
                🌱 Seed planted — blooms in 24 hours
              </motion.div>
            )}
          </AnimatePresence>

          {/* Seeds sprouting here */}
          {sproutingSeeds.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Sprouting
              </p>
              {sproutingSeeds.slice(0, 3).map((seed) => (
                <div
                  key={seed.id}
                  className="flex items-center gap-2 text-[11px] text-muted-foreground font-serif"
                >
                  <span className="text-base">🌱</span>
                  <span>
                    Blooms{" "}
                    {formatDistanceToNow(new Date(seed.blooms_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {seed.planter_id === userId && (
                    <span className="text-primary/60 text-[9px]">· yours</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collectible Hearts */}
      {collectibleSeeds.length > 0 && (
        <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 backdrop-blur overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          <CardContent className="py-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center border border-accent/25 animate-pulse">
                <Heart className="w-5 h-5 text-accent fill-accent/30" />
              </div>
              <div>
                <p className="text-sm font-serif text-accent">
                  {collectibleSeeds.length} Bloomed Heart{collectibleSeeds.length !== 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-muted-foreground font-serif flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Be within {PROXIMITY_METERS}m to collect
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {collectibleSeeds.map((seed) => (
                <motion.div
                  key={seed.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-card/40 border border-border/20"
                >
                  <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground">
                    <span className="text-lg">💚</span>
                    <span>
                      Planted{" "}
                      {formatDistanceToNow(new Date(seed.planted_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-serif text-[11px] gap-1 border-accent/30 text-accent hover:bg-accent/10"
                    disabled={collecting === seed.id}
                    onClick={() => handleCollect(seed)}
                  >
                    {collecting === seed.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Heart className="w-3 h-3" />
                    )}
                    Collect
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live "locating" pulse — shown while GPS is being acquired */}
      <AnimatePresence>
        {locatingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-[11px] font-serif text-muted-foreground italic px-1"
            role="status"
            aria-live="polite"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/70" />
            </span>
            <Compass className="w-3 h-3 opacity-60" />
            {locatingMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approximate-location override — visible to keepers/dev always, and to anyone
          once GPS uncertainty has shown up in the last attempt. */}
      {showOverrideToggle && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <div className="flex items-start gap-2">
            <Radio className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-[11px] font-serif text-amber-700 dark:text-amber-400">
                Mark this as an approximate-location encounter
              </p>
              <p className="text-[10px] font-serif text-muted-foreground leading-snug">
                Use this only if you're truly beside this tree but GPS is shaky.
                Your real distance and accuracy are recorded with the action.
                {isKeeper ? " · keeper override" : import.meta.env.DEV ? " · dev override" : ""}
              </p>
            </div>
          </div>
          <Switch
            checked={overrideEnabled}
            onCheckedChange={setOverrideEnabled}
            aria-label="Mark this as an approximate-location encounter"
          />
        </div>
      )}

      {/* Diagnostics — DEV or keeper, shown after an attempt */}
      {(import.meta.env.DEV || isKeeper) && lastResult && (() => {
        const r = lastResult;
        const tone = accuracyTone(r.confidence);
        const within = r.effectiveDistance != null && r.effectiveDistance <= PROXIMITY_METERS;
        return (
          <div className="rounded-md border border-dashed border-border/40 bg-muted/30 p-3 text-[10px] font-mono text-muted-foreground space-y-0.5">
            <div className="font-semibold text-foreground/80 flex items-center justify-between">
              <span>Heart Collection Diagnostics</span>
              <span className={tone}>GPS confidence: {confidenceLabel(r.confidence)}</span>
            </div>
            <div>device: {getPlatform()}</div>
            <div>user: {r.userLat?.toFixed(6) ?? "—"}, {r.userLng?.toFixed(6) ?? "—"}</div>
            <div>tree: {r.treeLat?.toFixed(6) ?? treeLat?.toFixed(6) ?? "—"}, {r.treeLng?.toFixed(6) ?? treeLng?.toFixed(6) ?? "—"}</div>
            <div>
              distance: {r.distance != null ? `${r.distance.toFixed(1)}m` : "—"}
              {" · effective: "}
              {r.effectiveDistance != null ? `${r.effectiveDistance.toFixed(1)}m` : "—"}
              {" · radius: "}{PROXIMITY_METERS}m
            </div>
            <div className={tone}>
              accuracy: {r.accuracy != null ? `±${r.accuracy.toFixed(0)}m` : "—"}
            </div>
            <div>
              gps fix: {r.gpsTimestamp ? new Date(r.gpsTimestamp).toLocaleTimeString() : "—"}
              {" · age: "}{r.gpsAgeMs != null ? `${(r.gpsAgeMs / 1000).toFixed(1)}s` : "—"}
              {" · "}{r.gpsAgeMs != null && r.gpsAgeMs < 5000 ? "fresh" : "cached?"}
            </div>
            <div>retries: {r.retries ?? 0} · within radius (with tolerance): {within ? "yes" : "no"}</div>
            <div>result: {r.ok ? `ok${r.overrideUsed ? " (override)" : ""}` : `blocked (${r.reason ?? "unknown"})`}</div>
            {r.error && <div className="text-destructive/80 break-all">error: {r.error}</div>}
          </div>
        );
      })()}


      <RewardReceipt
        visible={receiptVisible}
        onClose={() => setReceiptVisible(false)}
        s33dHearts={receiptData.s33dHearts}
        speciesHearts={receiptData.speciesHearts}
        speciesFamily={receiptData.speciesFamily}
        actionLabel="Heart Collected from Bloomed Seed"
      />

      {/* Seed Burst celebration */}
      <SeedBurst visible={showBurst} />
    </div>
  );
};

export default SeedPlanter;
