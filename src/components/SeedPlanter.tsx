import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Heart, Loader2, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useSeedEconomy, PROXIMITY_METERS, type ActionResult, type ActionFailureReason } from "@/hooks/use-seed-economy";
import type { PlantedSeed } from "@/hooks/use-seed-economy";
import { formatDistanceToNow } from "date-fns";
import RewardReceipt from "@/components/RewardReceipt";
import SeedBurst from "@/components/SeedBurst";
import { getFamilyForSpecies } from "@/data/treeSpecies";

const POOR_GPS_ACCURACY_M = 75; // accuracy worse than this is "uncertain"

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
    case "already_collected":
      return { title: "This Heart was already collected" };
    case "own_seed":
      return { title: "This is your own Seed", description: "Another wanderer must collect it." };
    case "not_bloomed":
      return { title: "This Seed hasn't bloomed yet", description: "Come back when it's ready." };
    case "no_seed_coords":
      return { title: "This Heart has no location", description: "Please report this tree." };
    case "geo_unsupported":
      return { title: "Location isn't supported on this device" };
    case "geo_denied":
      return { title: "Please enable location access for S33D" };
    case "geo_unavailable":
      return { title: "Location access is needed to collect this Heart", description: r.error };
    case "geo_timeout":
      return { title: "Couldn't get a GPS fix in time", description: "Try stepping outside and try again." };
    case "geo_poor_accuracy":
      return { title: `GPS is uncertain ${a ?? ""} — try stepping outside` };
    case "too_far":
      return { title: `You appear to be ${d ?? "too far"} away`, description: a ? `GPS accuracy ${a}` : undefined };
    case "rpc_error":
      return { title: "Something went wrong on our side", description: r.error };
    default:
      return { title: "Couldn't collect Heart" };
  }
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

  const seedsHere = getSeedsAtTree(treeId);
  const bloomedSeeds = getBloomedSeedsAtTree(treeId);
  const sproutingSeeds = seedsHere.filter(
    (s) => !s.collected_by && new Date(s.blooms_at) > new Date()
  );

  // Collectible = bloomed & not planted by current user
  const collectibleSeeds = bloomedSeeds.filter(
    (s) => s.planter_id !== userId
  );

  if (!userId || treeLat == null || treeLng == null) return null;

  const [lastResult, setLastResult] = useState<ActionResult | null>(null);

  const handlePlant = async () => {
    setPlanting(true);
    const result = await plantSeed(treeId, treeLat, treeLng);
    setPlanting(false);
    setLastResult(result);

    // Soft-warn on poor accuracy when too_far
    if (result.ok) {
      setShowBurst(true);
      setShowPlanted(true);
      toast.success("🌱 Seed planted! It carries 33 hearts — blooming in 24 hours.");
      setTimeout(() => { setShowPlanted(false); setShowBurst(false); }, 2500);
    } else {
      // Surface poor-accuracy hint when user is "too far" but GPS is unreliable
      const refined: ActionResult =
        result.reason === "too_far" && (result.accuracy ?? 0) > POOR_GPS_ACCURACY_M
          ? { ...result, reason: "geo_poor_accuracy" }
          : result;
      const { title, description } = explainFailure(refined);
      toast.error(title, description ? { description } : undefined);
      if (import.meta.env.DEV) console.warn("[SeedPlanter] plant failed", result);
    }
  };

  const handleCollect = async (seed: PlantedSeed) => {
    setCollecting(seed.id);
    const result = await collectHeart(seed.id);
    setCollecting(null);
    setLastResult(result);

    if (result.ok) {
      const family = treeSpecies ? getFamilyForSpecies(treeSpecies) : undefined;
      setReceiptData({ s33dHearts: 11, speciesHearts: family ? 1 : 0, speciesFamily: family || undefined });
      setReceiptVisible(true);
    } else {
      const refined: ActionResult =
        result.reason === "too_far" && (result.accuracy ?? 0) > POOR_GPS_ACCURACY_M
          ? { ...result, reason: "geo_poor_accuracy" }
          : result;
      const { title, description } = explainFailure(refined);
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
      {/* Reward Receipt */}
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
