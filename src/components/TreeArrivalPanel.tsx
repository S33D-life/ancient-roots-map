/**
 * TreeArrivalPanel — Unified staggered reveal of what awaits at this tree.
 * Shows check-in → hearts → whispers in a calm, progressive sequence.
 * Only appears when the user is authenticated and something is available.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Wind, MapPin, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkWhispersAtTree, type TreeWhisper, collectPrivateWhisper, collectSharedWhisper } from "@/hooks/use-whispers";
import { toast } from "sonner";

interface TreeArrivalPanelProps {
  treeId: string;
  treeName: string;
  treeSpecies: string;
  userId: string | null;
  isNearby: boolean; // proximity-gated: user is within ~500m
  isCheckedIn: boolean; // user has active check-in / grace period
  onCheckIn?: () => void;
  onWhisperCollected?: () => void;
}

interface HeartPoolData {
  total_hearts: number;
  windfall_count: number;
}

export default function TreeArrivalPanel({
  treeId,
  treeName,
  treeSpecies,
  userId,
  isNearby,
  isCheckedIn,
  onCheckIn,
  onWhisperCollected,
}: TreeArrivalPanelProps) {
  const [whispers, setWhispers] = useState<TreeWhisper[]>([]);
  const [heartPool, setHeartPool] = useState<HeartPoolData | null>(null);
  const [claimedHearts, setClaimedHearts] = useState<number | null>(null);
  const [claimingHearts, setClaimingHearts] = useState(false);
  const [whisperRevealed, setWhisperRevealed] = useState(false);
  const [collectingWhisper, setCollectingWhisper] = useState(false);
  const [collectedWhisperIds, setCollectedWhisperIds] = useState<Set<string>>(new Set());
  const [whisperIndex, setWhisperIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Stagger animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Fetch whispers
  useEffect(() => {
    if (!userId) return;
    checkWhispersAtTree(userId, treeId, treeSpecies).then(setWhispers);
  }, [userId, treeId, treeSpecies]);

  // Fetch heart pool
  useEffect(() => {
    supabase
      .from("tree_heart_pools")
      .select("total_hearts, windfall_count")
      .eq("tree_id", treeId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setHeartPool(data);
      });
  }, [treeId]);

  const uncollectedWhispers = useMemo(
    () => whispers.filter(w => !collectedWhisperIds.has(w.id)),
    [whispers, collectedWhisperIds]
  );
  const currentWhisper = uncollectedWhispers[whisperIndex] || uncollectedWhispers[0];

  const hasHearts = heartPool && heartPool.total_hearts > 0;
  const hasWhispers = uncollectedWhispers.length > 0;
  const hasAnything = hasHearts || hasWhispers;

  // Gather hearts
  const handleGatherHearts = async () => {
    if (!userId || claimingHearts) return;
    setClaimingHearts(true);
    try {
      const { data, error } = await supabase.rpc("claim_windfall_hearts", {
        p_tree_id: treeId,
        p_user_id: userId,
      });
      if (!error && data && data > 0) {
        setClaimedHearts(data);
        toast.success(`${data} hearts gathered from this tree`, { icon: "💚" });
        setTimeout(() => setClaimedHearts(null), 4000);
      } else if (!error) {
        toast("No hearts ready to gather yet", { icon: "🌳", description: "Hearts accumulate as wanderers visit this tree" });
      }
    } catch {
      toast.error("Could not gather hearts");
    }
    setClaimingHearts(false);
  };

  // Collect whisper
  const handleCollectWhisper = async () => {
    if (!currentWhisper || collectingWhisper) return;
    setCollectingWhisper(true);
    let error;
    if (currentWhisper.recipient_scope === "PRIVATE") {
      ({ error } = await collectPrivateWhisper(currentWhisper.id, treeId));
    } else {
      ({ error } = await collectSharedWhisper(currentWhisper.id, userId!, treeId));
    }
    if (error) {
      toast.error("Could not collect this whisper");
    } else {
      setCollectedWhisperIds(prev => new Set([...prev, currentWhisper.id]));
      toast.success("Whisper received", { icon: "🍃" });
      if (whisperIndex < uncollectedWhispers.length - 1) {
        setWhisperIndex(i => i + 1);
      }
      onWhisperCollected?.();
    }
    setCollectingWhisper(false);
  };

  if (!userId || !hasAnything) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 12 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid hsl(var(--primary) / 0.12)",
        background: "linear-gradient(135deg, hsl(var(--card) / 0.7), hsl(var(--card) / 0.5))",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1))",
          }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-serif text-foreground/80 tracking-wide">
            {isNearby ? "This tree holds something for you" : "Waiting at this tree"}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2.5">
        {/* Hearts row — stagger delay 0 */}
        {hasHearts && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <button
              onClick={handleGatherHearts}
              disabled={claimingHearts}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-primary/5"
              style={{ border: "1px solid hsl(120 40% 45% / 0.12)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(120 50% 40% / 0.2), hsl(42 60% 45% / 0.15))",
                }}
              >
                {claimingHearts ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <Heart className="w-4 h-4" style={{ color: "hsl(120 45% 55%)" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif" style={{ color: "hsl(120 45% 55%)" }}>
                  {claimedHearts ? `${claimedHearts} hearts gathered ✨` : "Hearts waiting here"}
                </p>
                <p className="text-[10px] text-muted-foreground font-serif mt-0.5">
                  {heartPool!.total_hearts} hearts in this tree's reservoir
                </p>
              </div>
              {!claimedHearts && (
                <span className="text-[10px] font-serif text-primary/50 shrink-0">Gather</span>
              )}
            </button>
          </motion.div>
        )}

        {/* Whisper row — stagger delay 1 */}
        {hasWhispers && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: hasHearts ? 0.6 : 0.3, duration: 0.4 }}
          >
            {!whisperRevealed ? (
              /* Pre-reveal: hint only */
              <button
                onClick={() => {
                  if (isNearby || isCheckedIn) {
                    setWhisperRevealed(true);
                  } else {
                    toast("Come closer to this tree to receive its whispers", {
                      icon: "🌬️",
                      description: "Whispers reveal when you are nearby",
                    });
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-primary/5"
                style={{ border: "1px solid hsl(260 40% 55% / 0.12)" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, hsl(260 40% 50% / 0.15), hsl(200 40% 50% / 0.1))",
                  }}
                >
                  <Wind className="w-4 h-4" style={{ color: "hsl(260 40% 60%)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif" style={{ color: "hsl(260 40% 65%)" }}>
                    A whisper waits in this tree…
                  </p>
                  <p className="text-[10px] text-muted-foreground font-serif mt-0.5">
                    {isNearby || isCheckedIn
                      ? "Tap to reveal"
                      : "Visit this tree to receive"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "hsl(260 40% 55% / 0.4)" }} />
              </button>
            ) : (
              /* Post-reveal: show whisper content */
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentWhisper?.id || "done"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-lg space-y-3"
                  style={{ border: "1px solid hsl(260 40% 55% / 0.12)", background: "hsl(260 40% 50% / 0.04)" }}
                >
                  <div className="flex items-center gap-2">
                    <Wind className="w-3.5 h-3.5" style={{ color: "hsl(260 40% 60%)" }} />
                    <span className="text-[10px] font-serif text-muted-foreground tracking-wider uppercase">
                      Whisper from the Canopy
                    </span>
                    <span className="ml-auto text-[9px] font-serif px-2 py-0.5 rounded-full"
                      style={{
                        background: "hsl(260 40% 55% / 0.08)",
                        color: "hsl(260 40% 60%)",
                        border: "1px solid hsl(260 40% 55% / 0.15)",
                      }}
                    >
                      {currentWhisper?.recipient_scope === "PUBLIC" ? "Shared" : "Private"}
                    </span>
                  </div>

                  {currentWhisper && (
                    <>
                      <div className="pl-4" style={{ borderLeft: "2px solid hsl(260 40% 55% / 0.2)" }}>
                        <p className="text-sm font-serif text-foreground/85 leading-relaxed italic">
                          "{currentWhisper.message_content}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground/60 font-serif">
                          Through {treeName}
                        </span>
                        <Button
                          onClick={handleCollectWhisper}
                          disabled={collectingWhisper}
                          size="sm"
                          variant="outline"
                          className="font-serif text-xs gap-1.5 border-primary/20"
                        >
                          {collectingWhisper ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wind className="w-3 h-3" />}
                          Receive Whisper
                        </Button>
                      </div>

                      {uncollectedWhispers.length > 1 && (
                        <p className="text-[9px] text-muted-foreground/40 font-serif text-center">
                          {whisperIndex + 1} of {uncollectedWhispers.length}
                        </p>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
