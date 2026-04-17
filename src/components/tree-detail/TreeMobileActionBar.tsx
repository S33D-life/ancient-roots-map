/**
 * TreeMobileActionBar — above-the-fold primary action stack for /tree/:id on mobile.
 *
 * Surfaces, in priority order:
 *   1. 🌳 Meet Tree / Check-in   (or active meeting state)
 *   2. 💛 Hearts pill            (only when hearts are available — pulses)
 *   3. ✦ Make Offering           (secondary)
 *
 * Whisper / Wish are intentionally NOT here — they live below as tertiary actions.
 *
 * Shows a soft "Met" badge when the user has any prior interaction
 * (visit, offering, whisper, witness) so the page never feels cold.
 */
import { Sparkles, TreeDeciduous, Heart, Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useHeartCollection } from "@/hooks/use-heart-collection";
import { canCollect } from "@/utils/heartPoolState";
import { toast } from "sonner";
import { useCallback } from "react";
import type { RelationshipProgress } from "@/lib/relationship-types";

interface Props {
  treeId: string;
  treeName: string;
  userId: string | null;
  proximityGate: {
    status: string;
    isUnlocked: boolean;
    canCheckin?: boolean;
  };
  meetingStatus: string;
  relationship: RelationshipProgress | null;
  onCheckin: () => void;
  onMakeOffering: () => void;
}

export default function TreeMobileActionBar({
  treeId,
  treeName,
  userId,
  proximityGate,
  meetingStatus,
  relationship,
  onCheckin,
  onMakeOffering,
}: Props) {
  // Hearts
  const { state, pool, collect } = useHeartCollection(treeId, userId, proximityGate.isUnlocked);
  const heartsAvailable = pool?.totalHearts ?? 0;
  const heartsCollectable = canCollect(state) && heartsAvailable > 0;

  const handleCollect = useCallback(async () => {
    if (navigator.vibrate) navigator.vibrate(40);
    const amount = await collect();
    if (amount && amount > 0) {
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      toast.success(`${amount} heart${amount !== 1 ? "s" : ""} gathered from ${treeName}`, { icon: "🌿" });
      window.dispatchEvent(new CustomEvent("s33d-hearts-earned", { detail: { amount } }));
    }
  }, [collect, treeName]);

  // Met state — generous: any interaction counts
  const stats = relationship?.stats;
  const hasMet = !!(
    stats &&
    (stats.totalVisits > 0 ||
      stats.offeringCount > 0 ||
      stats.coWitnessCount > 0 ||
      stats.stewardshipActions > 0)
  );

  // Meeting state
  const isActive = meetingStatus === "active" || meetingStatus === "expiring";
  const canCheckin = proximityGate.canCheckin ?? proximityGate.status === "unlocked_present";
  const isLocked = !proximityGate.isUnlocked && proximityGate.status !== "checking";

  // Primary button copy
  let primaryLabel = "Meet this tree";
  let primaryHint: string | null = "Mark your arrival beneath the canopy";
  let primaryDisabled = false;

  if (isActive) {
    primaryLabel = "Meeting in progress";
    primaryHint = "You are present with this tree";
    primaryDisabled = true;
  } else if (isLocked) {
    primaryLabel = "Find this tree first";
    primaryHint = "Stand near the tree to begin";
    primaryDisabled = true;
  } else if (canCheckin) {
    primaryLabel = hasMet ? "Check in again" : "Check in — you're here";
    primaryHint = hasMet ? "Continue your path with this tree" : "Mark your arrival";
  } else if (proximityGate.status === "unlocked_nearby") {
    primaryLabel = "You're nearby — move closer";
    primaryHint = "Within 100m to check in";
    primaryDisabled = true;
  } else if (hasMet) {
    primaryLabel = "Visit again";
    primaryHint = "This tree remembers you";
    primaryDisabled = true;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="md:hidden -mt-4 mb-3 px-1 space-y-2"
    >
      {/* Met badge — soft, immediate */}
      {hasMet && (
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-serif text-primary/80 tracking-wide">
            <span className="text-[11px]">🌿</span> Met
            {stats!.totalVisits > 0 && (
              <span className="text-muted-foreground/60">· {stats!.totalVisits} visit{stats!.totalVisits !== 1 ? "s" : ""}</span>
            )}
          </span>
        </div>
      )}

      {/* Primary: Meet / Check-in */}
      <button
        onClick={primaryDisabled ? undefined : onCheckin}
        disabled={primaryDisabled}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
          isActive
            ? "border-primary/30 bg-primary/10"
            : primaryDisabled
              ? "border-border/30 bg-secondary/10 opacity-70"
              : "border-primary/30 bg-primary/5 hover:bg-primary/10 active:scale-[0.99]"
        }`}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {isActive ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </>
          ) : canCheckin ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ background: "hsl(120, 50%, 50%)" }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "hsl(120, 50%, 50%)" }} />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "hsl(42, 50%, 50%)", opacity: 0.5 }} />
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-serif text-foreground/90 leading-tight">{primaryLabel}</span>
          {primaryHint && (
            <span className="block text-[10.5px] font-serif text-muted-foreground/70 mt-0.5">{primaryHint}</span>
          )}
        </span>
        {isLocked ? <Lock className="w-4 h-4 text-muted-foreground/50 shrink-0" /> : <TreeDeciduous className="w-4 h-4 text-primary/40 shrink-0" />}
      </button>

      {/* Secondary row: Hearts (if available) + Make Offering */}
      <div className="flex items-stretch gap-2">
        {heartsCollectable ? (
          <motion.button
            onClick={handleCollect}
            disabled={state === "collecting"}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-emerald-400/40 text-sm font-serif transition-colors"
            style={{
              background: "linear-gradient(135deg, hsl(140 50% 50% / 0.12), hsl(42 70% 55% / 0.08))",
              boxShadow: "0 0 16px hsl(140 50% 50% / 0.15)",
            }}
          >
            {state === "collecting" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className="w-4 h-4 fill-emerald-400/30" style={{ color: "hsl(140 60% 50%)" }} />
            )}
            <span style={{ color: "hsl(140 50% 35%)" }}>
              Collect {heartsAvailable} heart{heartsAvailable !== 1 ? "s" : ""}
            </span>
          </motion.button>
        ) : (
          <Button
            onClick={onMakeOffering}
            variant="outline"
            disabled={isLocked}
            className="flex-1 font-serif gap-2 h-auto py-2.5 rounded-xl border-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            {isLocked ? "Offerings locked" : "Make offering"}
          </Button>
        )}
        {heartsCollectable && (
          <Button
            onClick={onMakeOffering}
            variant="outline"
            disabled={isLocked}
            className="font-serif gap-1.5 h-auto py-2.5 px-3 rounded-xl border-primary/20"
            aria-label="Make offering"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
