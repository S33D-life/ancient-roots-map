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
  variant?: "full" | "compact" | "inline";
  className?: string;
}

export default function CollectHeartsButton({
  treeId,
  treeName,
  userId,
  isEligible,
  variant = "full",
  className = "",
}: CollectHeartsButtonProps) {
  const { state, pool, collectedAmount, collect } = useHeartCollection(treeId, userId, isEligible);

  const handleCollect = useCallback(async () => {
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(40);

    const amount = await collect();
    if (amount && amount > 0) {
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      toast.success(`${amount} heart${amount !== 1 ? "s" : ""} gathered from ${treeName}`, { icon: "🌿" });
      window.dispatchEvent(new CustomEvent("s33d-hearts-earned", { detail: { amount } }));
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

  return <FullVariant state={state} hearts={hearts} collectedAmount={collectedAmount} onCollect={handleCollect} isCollectable={isCollectable} guidance={guidance} className={className} treeId={treeId} />;
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

/* ── Full variant ── */
function FullVariant({ state, hearts, collectedAmount, onCollect, isCollectable, guidance, className, treeId }: {
  state: HeartPoolStatus; hearts: number; collectedAmount: number | null; onCollect: () => void; isCollectable: boolean; guidance: string; className: string; treeId: string;
}) {
  if (state === "collected") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-border/20 ${className}`}
        style={{ background: "hsla(140, 35%, 30%, 0.06)" }}>
        <Heart className="w-4 h-4 shrink-0 fill-current" style={{ color: "hsl(140 40% 50%)" }} />
        <p className="text-sm font-serif" style={{ color: "hsl(140 40% 55%)" }}>
          {collectedAmount} heart{collectedAmount !== 1 ? "s" : ""} gathered ✨
        </p>
      </motion.div>
    );
  }

  if (!isCollectable) {
    if (hearts === 0) return null;
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-border/20 bg-muted/10 ${className}`}>
        <Heart className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <p className="text-[11px] font-serif text-muted-foreground/60">{guidance}</p>
      </div>
    );
  }

  const isCollecting = state === "collecting";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      <HeartGlowAura />
      <button onClick={onCollect} disabled={isCollecting}
        className="relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left group active:scale-[0.98]"
        style={{
          background: "hsla(140, 35%, 30%, 0.08)",
          borderColor: "hsla(140, 35%, 40%, 0.22)",
        }}>
        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "hsla(140, 35%, 35%, 0.14)" }}
          animate={!isCollecting ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {isCollecting
            ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(140 40% 55%)" }} />
            : <Heart className="w-5 h-5" style={{ color: "hsl(140 40% 55%)" }} />
          }
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-serif font-semibold" style={{ color: "hsl(140 40% 55%)" }}>
            Collect {hearts} Heart{hearts !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-muted-foreground/60 font-serif">{guidance}</p>
            {state === "available_within_12h" && <GraceTimer treeId={treeId} />}
          </div>
        </div>
        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs shrink-0"
          style={{ color: "hsl(140 40% 55% / 0.6)" }}
        >
          →
        </motion.div>
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