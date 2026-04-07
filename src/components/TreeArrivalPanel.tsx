/**
 * TreeArrivalPanel — Unified staggered reveal of what awaits at this tree.
 * Order: presence/check-in → hearts → whispers.
 * Only appears when the user is authenticated and something is available.
 * Uses unified useHeartCollection hook for heart gathering.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Wind, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkWhispersAtTree, type TreeWhisper, collectPrivateWhisper, collectSharedWhisper } from "@/hooks/use-whispers";
import { useHeartCollection } from "@/hooks/use-heart-collection";
import { canCollect, getHeartPoolGuidance } from "@/utils/heartPoolState";
import { toast } from "sonner";
import { hapticSuccess, hapticTap } from "@/lib/haptics";
import HeartCollectAnimation from "@/components/HeartCollectAnimation";
import GraceCountdown from "@/components/GraceCountdown";

interface TreeArrivalPanelProps {
  treeId: string;
  treeName: string;
  treeSpecies: string;
  userId: string | null;
  isNearby: boolean;
  isCheckedIn: boolean;
  onCheckIn?: () => void;
  onWhisperCollected?: () => void;
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
  const [whisperRevealed, setWhisperRevealed] = useState(false);
  const [collectingWhisper, setCollectingWhisper] = useState(false);
  const [collectedWhisperIds, setCollectedWhisperIds] = useState<Set<string>>(new Set());
  const [whisperIndex, setWhisperIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const heartCollection = useHeartCollection(treeId, userId, isNearby || isCheckedIn);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!userId) return;
    checkWhispersAtTree(userId, treeId, treeSpecies).then(setWhispers);
  }, [userId, treeId, treeSpecies]);

  const uncollectedWhispers = useMemo(
    () => whispers.filter(w => !collectedWhisperIds.has(w.id)),
    [whispers, collectedWhisperIds]
  );
  const currentWhisper = uncollectedWhispers[whisperIndex] || uncollectedWhispers[0];

  const hasHearts = heartCollection.pool && heartCollection.pool.totalHearts > 0;
  const isHeartCollectable = canCollect(heartCollection.state);
  const heartGuidance = getHeartPoolGuidance(heartCollection.state, heartCollection.pool?.totalHearts ?? 0);
  const hasWhispers = uncollectedWhispers.length > 0;
  const hasAnything = hasHearts || hasWhispers;

  const handleGatherHearts = useCallback(async () => {
    hapticTap();
    const amount = await heartCollection.collect();
    if (amount && amount > 0) {
      hapticSuccess();
      toast.success(`${amount} hearts gathered from this tree`, { icon: "💚" });
      window.dispatchEvent(new CustomEvent("s33d-hearts-earned", { detail: { amount } }));
    } else if (amount === 0) {
      toast("No hearts ready to gather yet", {
        icon: "🌳",
        description: "Hearts accumulate as wanderers visit",
      });
    } else {
      toast.error("Could not gather hearts");
    }
  }, [heartCollection.collect]);

  const handleCollectWhisper = async () => {
    if (!currentWhisper || collectingWhisper) return;
    hapticTap();
    setCollectingWhisper(true);
    let error;
    if (currentWhisper.recipient_scope === "PRIVATE") {
      ({ error } = await collectPrivateWhisper(currentWhisper.id, treeId));
    } else {
      ({ error } = await collectSharedWhisper(currentWhisper.id, userId!, treeId));
    }
    if (error) {
      toast.error("Could not receive this whisper");
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

  if (!userId || (!hasAnything && heartCollection.state !== "loading")) return null;

  // Stagger delays: hearts first (0.3s), whispers second (0.5s)
  const heartsDelay = 0.3;
  const whispersDelay = hasHearts ? 0.55 : 0.3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 8 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(var(--card) / 0.5), hsl(var(--card) / 0.35))",
        backdropFilter: "blur(8px)",
        border: "1px solid hsl(var(--border) / 0.25)",
      }}
    >
      {/* Threshold heading */}
      <div className="px-4 pt-4 pb-1">
        <p className="text-[11px] font-serif text-muted-foreground/70 tracking-wide">
          {isNearby || isCheckedIn
            ? "This tree holds something for you"
            : "Waiting at this tree"}
        </p>
      </div>

      <div className="px-4 pb-4 pt-2 space-y-0">
        {/* ── Hearts — stagger 1 ── */}
        {hasHearts && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: heartsDelay, duration: 0.4 }}
            onClick={isHeartCollectable ? handleGatherHearts : undefined}
            disabled={!isHeartCollectable || heartCollection.state === "collecting" || heartCollection.state === "collected"}
            className={`w-full flex items-center gap-3 py-3 px-1 text-left transition-colors rounded-lg ${isHeartCollectable ? "hover:bg-primary/5 cursor-pointer" : "cursor-default"}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "hsl(140 40% 40% / 0.12)",
              }}
            >
              {heartCollection.state === "collecting" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Heart className="w-3.5 h-3.5" style={{ color: "hsl(140 40% 55%)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-serif" style={{ color: "hsl(140 40% 55%)" }}>
                {heartCollection.collectedAmount ? `${heartCollection.collectedAmount} hearts gathered ✨` : heartGuidance}
              </p>
              <p className="text-[10px] text-muted-foreground/60 font-serif mt-0.5">
                {heartCollection.pool!.totalHearts} in this tree's reservoir
              </p>
            </div>
            {isHeartCollectable && !heartCollection.collectedAmount && (
              <span className="text-[10px] font-serif text-primary/40 shrink-0">Gather</span>
            )}
          </motion.button>
        )}

        {/* Soft divider between hearts and whispers */}
        {hasHearts && hasWhispers && (
          <div
            className="mx-6 my-1"
            style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, hsl(var(--border) / 0.2), transparent)",
            }}
          />
        )}

        {/* ── Whispers — stagger 2 ── */}
        {hasWhispers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: whispersDelay, duration: 0.4 }}
          >
            {!whisperRevealed ? (
              <button
                onClick={() => {
                  if (isNearby || isCheckedIn) {
                    setWhisperRevealed(true);
                  } else {
                    toast("Come closer to receive whispers from this tree", {
                      icon: "🌬️",
                    });
                  }
                }}
                className="w-full flex items-center gap-3 py-3 px-1 text-left transition-colors hover:bg-primary/5 rounded-lg"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: "hsl(260 40% 50% / 0.1)",
                  }}
                >
                  <Wind className="w-3.5 h-3.5" style={{ color: "hsl(260 40% 60%)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif" style={{ color: "hsl(260 40% 65%)" }}>
                    A whisper waits in this tree…
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-serif mt-0.5">
                    {isNearby || isCheckedIn ? "Tap to reveal" : "Visit this tree to receive"}
                  </p>
                </div>
              </button>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentWhisper?.id || "done"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="py-3 px-1 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Wind className="w-3 h-3" style={{ color: "hsl(260 40% 60%)" }} />
                    <span className="text-[10px] font-serif text-muted-foreground/60 tracking-wider uppercase">
                      Whisper from the Canopy
                    </span>
                    <span
                      className="ml-auto text-[9px] font-serif px-2 py-0.5 rounded-full"
                      style={{
                        background: "hsl(260 40% 55% / 0.08)",
                        color: "hsl(260 40% 60%)",
                        border: "1px solid hsl(260 40% 55% / 0.12)",
                      }}
                    >
                      {currentWhisper?.recipient_scope === "PUBLIC" ? "Shared" : "Private"}
                    </span>
                  </div>

                  {currentWhisper && (
                    <>
                      <div className="pl-4" style={{ borderLeft: "2px solid hsl(260 40% 55% / 0.15)" }}>
                        <p className="text-sm font-serif text-foreground/80 leading-relaxed italic">
                          "{currentWhisper.message_content}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground/50 font-serif">
                          Through {treeName}
                        </span>
                        <Button
                          onClick={handleCollectWhisper}
                          disabled={collectingWhisper}
                          size="sm"
                          variant="ghost"
                          className="font-serif text-xs gap-1.5 text-primary/70 hover:text-primary hover:bg-primary/5"
                        >
                          {collectingWhisper ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wind className="w-3 h-3" />
                          )}
                          Receive Whisper
                        </Button>
                      </div>

                      {uncollectedWhispers.length > 1 && (
                        <p className="text-[9px] text-muted-foreground/35 font-serif text-center">
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
