/**
 * CollectHeartsButton — reusable CTA for heart collection.
 * Uses unified HeartPoolStatus from heartPoolState.ts.
 * Consistent copy across all surfaces via getHeartPoolGuidance().
 * 
 * Includes living emerald-gold glow when hearts are available to collect.
 */
import { Heart, Loader2, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useHeartCollection } from "@/hooks/use-heart-collection";
import { canCollect, getHeartPoolGuidance, getGraceTimeRemaining, type HeartPoolStatus } from "@/utils/heartPoolState";
import { useCallback, useEffect, useState } from "react";

interface CollectHeartsButtonProps {
  treeId: string;
  treeName: string;
  userId: string | null;
  isEligible: boolean;
  /** Live distance to tree in meters — drives progressive states (idle / approaching / ready). */
  distanceMeters?: number | null;
  variant?: "full" | "compact" | "inline";
  className?: string;
}

export default function CollectHeartsButton({
  treeId,
  treeName,
  userId,
  isEligible,
  distanceMeters = null,
  variant = "full",
  className = "",
}: CollectHeartsButtonProps) {
  const { state, pool, collectedAmount, collect, proximityTier } = useHeartCollection(
    treeId,
    userId,
    isEligible,
    distanceMeters,
  );

  const handleCollect = useCallback(async () => {
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(40);

    const amount = await collect();
    if (amount && amount > 0) {
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      toast.success(`${amount} heart${amount !== 1 ? "s" : ""} gathered from ${treeName}`, { icon: "🌿" });
      window.dispatchEvent(new CustomEvent("s33d-hearts-earned", { detail: { amount, source: "collect" } }));
    } else if (amount === 0) {
      toast("No hearts available right now", { icon: "🌳", description: "Hearts accumulate as wanderers visit" });
    } else {
      toast.error("Could not collect hearts");
    }
  }, [collect, treeName]);

  if (state === "loading") return null;

  const isCollectable = canCollect(state);
  const hearts = pool?.totalHearts ?? 0;
  const guidance = getHeartPoolGuidance(state, hearts);

  if (variant === "inline") {
    return <InlineVariant state={state} hearts={hearts} collectedAmount={collectedAmount} onCollect={handleCollect} className={className} />;
  }

  if (variant === "compact") {
    return <CompactVariant state={state} hearts={hearts} collectedAmount={collectedAmount} onCollect={handleCollect} isCollectable={isCollectable} className={className} treeId={treeId} />;
  }

  return (
    <FullVariant
      state={state}
      hearts={hearts}
      collectedAmount={collectedAmount}
      onCollect={handleCollect}
      isCollectable={isCollectable}
      guidance={guidance}
      className={className}
      treeId={treeId}
      proximityTier={proximityTier}
      distanceMeters={distanceMeters}
    />
  );
}

/* ── Grace timer ── */
function GraceTimer({ treeId }: { treeId: string }) {
  const [remaining, setRemaining] = useState(() => getGraceTimeRemaining(treeId));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getGraceTimeRemaining(treeId));
    }, 30_000);
    return () => clearInterval(interval);
  }, [treeId]);

  if (remaining <= 0) return null;
  const hours = Math.floor(remaining / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  return (
    <span className="text-[9px] font-serif" style={{ color: "hsl(42 70% 55%)" }}>
      {hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`}
    </span>
  );
}

/* ── Living glow aura for collectable hearts ── */
function HeartGlowAura() {
  return (
    <motion.div
      className="absolute inset-0 rounded-xl pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        background: "linear-gradient(135deg, hsla(140, 50%, 45%, 0.06) 0%, hsla(42, 70%, 50%, 0.06) 100%)",
        boxShadow: "inset 0 0 20px hsla(140, 40%, 50%, 0.08), 0 0 24px hsla(42, 70%, 50%, 0.1)",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          boxShadow: "0 0 16px hsla(140, 45%, 50%, 0.15), 0 0 32px hsla(42, 70%, 55%, 0.08)",
        }}
      />
    </motion.div>
  );
}

/* ── Full variant — with progressive proximity states ── */
type ProximityTier = "ready" | "approaching" | "far" | "unknown";

function FullVariant({
  state, hearts, collectedAmount, onCollect, isCollectable, guidance, className, treeId,
  proximityTier, distanceMeters,
}: {
  state: HeartPoolStatus; hearts: number; collectedAmount: number | null; onCollect: () => void;
  isCollectable: boolean; guidance: string; className: string; treeId: string;
  proximityTier: ProximityTier; distanceMeters: number | null;
}) {
  /* ── COLLECTED state — celebratory afterglow ── */
  if (state === "collected") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${className}`}
        style={{
          background: "hsla(140, 35%, 30%, 0.1)",
          borderColor: "hsla(140, 40%, 50%, 0.4)",
          boxShadow: "0 0 20px hsla(140, 50%, 50%, 0.15)",
        }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Heart className="w-5 h-5 shrink-0 fill-current" style={{ color: "hsl(140 50% 55%)" }} />
        </motion.div>
        <p className="text-sm font-serif" style={{ color: "hsl(140 40% 55%)" }}>
          {collectedAmount} heart{collectedAmount !== 1 ? "s" : ""} gathered ✨
        </p>
      </motion.div>
    );
  }

  /* ── IDLE / APPROACHING — hearts visible but not collectable ── */
  if (!isCollectable) {
    if (hearts === 0) return null;

    // APPROACHING (within 200m, warming up) — subtle glow + closer-distance copy
    if (proximityTier === "approaching") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border ${className}`}
          style={{
            background: "hsla(42, 60%, 45%, 0.06)",
            borderColor: "hsla(42, 60%, 50%, 0.25)",
          }}
        >
          <motion.div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "hsla(42, 60%, 45%, 0.14)" }}
            animate={{
              boxShadow: [
                "0 0 8px hsla(42, 70%, 55%, 0.2)",
                "0 0 16px hsla(42, 70%, 55%, 0.4)",
                "0 0 8px hsla(42, 70%, 55%, 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="w-4 h-4" style={{ color: "hsl(42 70% 55%)" }} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif" style={{ color: "hsl(42 70% 55%)" }}>
              {hearts} heart{hearts !== 1 ? "s" : ""} warming up
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-serif mt-0.5">
              {distanceMeters ? `${Math.round(distanceMeters)}m — almost in range` : "almost in range"}
            </p>
          </div>
        </motion.div>
      );
    }

    // IDLE / FAR — dim, reads like a marker
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-border/15 ${className}`}
        style={{ background: "hsla(0, 0%, 0%, 0.02)", opacity: 0.7 }}
      >
        <Heart className="w-4 h-4 text-muted-foreground/30 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-serif text-muted-foreground/70">
            {hearts} heart{hearts !== 1 ? "s" : ""} resting at this tree
          </p>
          <p className="text-[10px] font-serif text-muted-foreground/50 mt-0.5">
            {distanceMeters
              ? `You're ${Math.round(distanceMeters)}m away — walk closer to collect`
              : guidance}
          </p>
        </div>
      </div>
    );
  }

  /* ── READY / COLLECTING — fully active CTA ── */
  const isCollecting = state === "collecting";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      <HeartGlowAura />
      <button onClick={onCollect} disabled={isCollecting}
        className="relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left group active:scale-[0.98] overflow-hidden"
        style={{
          background: "hsla(140, 35%, 30%, 0.08)",
          borderColor: "hsla(140, 40%, 50%, 0.35)",
          boxShadow: !isCollecting ? "0 0 16px hsla(140, 45%, 50%, 0.12)" : undefined,
        }}>
        {/* Fill bar that sweeps across during COLLECTING — mirrors the photo upload progress feel */}
        {isCollecting && (
          <motion.div
            className="absolute inset-y-0 left-0 pointer-events-none"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              background: "linear-gradient(90deg, hsla(140, 50%, 45%, 0.18), hsla(42, 70%, 55%, 0.22))",
            }}
          />
        )}
        <motion.div
          className="relative w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "hsla(140, 40%, 40%, 0.18)" }}
          animate={!isCollecting ? { scale: [1, 1.08, 1] } : { scale: [1, 1.25, 1] }}
          transition={{
            duration: isCollecting ? 0.6 : 2.5,
            repeat: isCollecting ? Infinity : Infinity,
            ease: "easeInOut",
          }}
        >
          {isCollecting
            ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(140 50% 55%)" }} />
            : <Heart className="w-5 h-5 fill-current" style={{ color: "hsl(140 50% 55%)" }} />
          }
        </motion.div>
        <div className="relative flex-1 min-w-0">
          <p className="text-sm font-serif font-semibold" style={{ color: "hsl(140 50% 55%)" }}>
            {isCollecting
              ? `Gathering ${hearts} heart${hearts !== 1 ? "s" : ""}…`
              : `Collect ${hearts} Heart${hearts !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-muted-foreground/70 font-serif">
              {isCollecting ? "Hearts flowing into your jar" : "You've arrived — tap to gather"}
            </p>
            {state === "available_within_12h" && <GraceTimer treeId={treeId} />}
          </div>
        </div>
        {!isCollecting && (
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative text-xs shrink-0"
            style={{ color: "hsl(140 50% 55% / 0.7)" }}
          >
            →
          </motion.div>
        )}
      </button>
    </motion.div>
  );
}

/* ── Compact variant ── */
function CompactVariant({ state, hearts, collectedAmount, onCollect, isCollectable, className, treeId }: {
  state: HeartPoolStatus; hearts: number; collectedAmount: number | null; onCollect: () => void; isCollectable: boolean; className: string; treeId: string;
}) {
  if (state === "collected") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-1.5 text-[10px] font-serif ${className}`} style={{ color: "hsl(140 40% 55%)" }}>
        <Heart className="w-3 h-3 fill-current" />
        <span>{collectedAmount} gathered ✨</span>
      </motion.div>
    );
  }

  if (!isCollectable) {
    if (hearts === 0) return null;
    return (
      <div className={`flex items-center gap-1.5 text-[10px] font-serif text-muted-foreground/50 ${className}`}>
        <Heart className="w-3 h-3" />
        <span>{hearts} heart{hearts !== 1 ? "s" : ""} · visit to collect</span>
      </div>
    );
  }

  const isCollecting = state === "collecting";

  return (
    <motion.button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCollect(); }}
      disabled={isCollecting}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-serif font-semibold transition-colors active:scale-95 ${className}`}
      style={{
        background: "hsla(140, 35%, 30%, 0.1)",
        color: "hsl(140 40% 55%)",
        border: "1px solid hsla(140, 35%, 40%, 0.2)",
        boxShadow: "0 0 12px hsla(140, 40%, 50%, 0.08), 0 0 4px hsla(42, 70%, 50%, 0.06)",
      }}
      animate={!isCollecting ? { boxShadow: [
        "0 0 12px hsla(140, 40%, 50%, 0.08), 0 0 4px hsla(42, 70%, 50%, 0.06)",
        "0 0 18px hsla(140, 40%, 50%, 0.15), 0 0 8px hsla(42, 70%, 50%, 0.1)",
        "0 0 12px hsla(140, 40%, 50%, 0.08), 0 0 4px hsla(42, 70%, 50%, 0.06)",
      ] } : {}}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {isCollecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Heart className="w-3 h-3" />}
      <span>Collect {hearts}</span>
      {state === "available_within_12h" && <GraceTimer treeId={treeId} />}
    </motion.button>
  );
}

/* ── Inline variant ── */
function InlineVariant({ state, hearts, collectedAmount, onCollect, className }: {
  state: HeartPoolStatus; hearts: number; collectedAmount: number | null; onCollect: () => void; className: string;
}) {
  if (state === "collected") {
    return <span className={`text-[10px] font-serif ${className}`} style={{ color: "hsl(140 40% 55%)" }}>{collectedAmount} hearts gathered</span>;
  }
  if (!canCollect(state)) return null;
  return (
    <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCollect(); }}
      className={`text-[10px] font-serif underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-80 ${className}`}
      style={{ color: "hsl(140 40% 55%)" }}>
      Collect {hearts} heart{hearts !== 1 ? "s" : ""}
    </button>
  );
}