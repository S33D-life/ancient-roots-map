/**
 * CollectHeartsButton — reusable CTA for heart collection.
 * Uses unified HeartPoolStatus from heartPoolState.ts.
 * Consistent copy across all surfaces via getHeartPoolGuidance().
 */
import { Heart, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useHeartCollection } from "@/hooks/use-heart-collection";
import { canCollect, getHeartPoolGuidance, type HeartPoolStatus } from "@/utils/heartPoolState";
import { useCallback } from "react";

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
    const amount = await collect();
    if (amount && amount > 0) {
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
    return <CompactVariant state={state} hearts={hearts} collectedAmount={collectedAmount} onCollect={handleCollect} isCollectable={isCollectable} className={className} />;
  }

  return <FullVariant state={state} hearts={hearts} collectedAmount={collectedAmount} onCollect={handleCollect} isCollectable={isCollectable} guidance={guidance} className={className} />;
}

/* ── Full variant ── */
function FullVariant({ state, hearts, collectedAmount, onCollect, isCollectable, guidance, className }: {
  state: HeartPoolStatus; hearts: number; collectedAmount: number | null; onCollect: () => void; isCollectable: boolean; guidance: string; className: string;
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
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-border/20 bg-muted/10 ${className}`}>
        {hearts > 0 ? <Heart className="w-4 h-4 text-muted-foreground/40 shrink-0" /> : <MapPin className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
        <p className="text-[11px] font-serif text-muted-foreground/60">{guidance}</p>
      </div>
    );
  }

  const isCollecting = state === "collecting";

  return (
    <button onClick={onCollect} disabled={isCollecting}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left group ${className}`}
      style={{ background: "hsla(140, 35%, 30%, 0.06)", borderColor: "hsla(140, 35%, 40%, 0.18)" }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsla(140, 35%, 35%, 0.12)" }}>
        {isCollecting
          ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(140 40% 55%)" }} />
          : <Heart className="w-4 h-4" style={{ color: "hsl(140 40% 55%)" }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-serif" style={{ color: "hsl(140 40% 55%)" }}>
          {state === "available_here_now" ? "Collect Hearts" : "Collect Hearts"}
        </p>
        <p className="text-[10px] text-muted-foreground/60 font-serif mt-0.5">{guidance}</p>
      </div>
    </button>
  );
}

/* ── Compact variant ── */
function CompactVariant({ state, hearts, collectedAmount, onCollect, isCollectable, className }: {
  state: HeartPoolStatus; hearts: number; collectedAmount: number | null; onCollect: () => void; isCollectable: boolean; className: string;
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
    <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCollect(); }}
      disabled={isCollecting}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-serif transition-colors ${className}`}
      style={{ background: "hsla(140, 35%, 30%, 0.08)", color: "hsl(140 40% 55%)", border: "1px solid hsla(140, 35%, 40%, 0.15)" }}>
      {isCollecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Heart className="w-3 h-3" />}
      <span>Collect {hearts} heart{hearts !== 1 ? "s" : ""}</span>
    </button>
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
