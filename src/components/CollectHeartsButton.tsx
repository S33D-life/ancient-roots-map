/**
 * CollectHeartsButton — reusable CTA for heart collection.
 * Renders appropriate state: eligible, collecting, collected, disabled.
 * Used on tree detail page, preview cards, and arrival panel.
 */
import { Heart, Loader2, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useHeartCollection, type HeartCollectionState } from "@/hooks/use-heart-collection";
import { useCallback } from "react";

interface CollectHeartsButtonProps {
  treeId: string;
  treeName: string;
  userId: string | null;
  isEligible: boolean;
  /** "full" = prominent block, "compact" = inline button, "inline" = text-only */
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
      toast.success(`You collected ${amount} heart${amount !== 1 ? "s" : ""} from ${treeName}`, {
        icon: "💚",
      });
      window.dispatchEvent(new CustomEvent("s33d-hearts-earned", { detail: { amount } }));
    } else if (amount === 0) {
      toast("No hearts ready to collect yet", {
        icon: "🌳",
        description: "Hearts accumulate as wanderers visit",
      });
    } else {
      toast.error("Could not collect hearts");
    }
  }, [collect, treeName]);

  // Don't render anything for loading or when there's nothing to show
  if (state === "loading") return null;
  if (state === "not_eligible" && variant === "inline") return null;

  if (variant === "compact") {
    return <CompactButton state={state} pool={pool} collectedAmount={collectedAmount} onCollect={handleCollect} className={className} />;
  }

  if (variant === "inline") {
    return <InlineButton state={state} pool={pool} collectedAmount={collectedAmount} onCollect={handleCollect} className={className} />;
  }

  return <FullButton state={state} pool={pool} collectedAmount={collectedAmount} onCollect={handleCollect} className={className} />;
}

/* ── Full variant — prominent block CTA ── */
function FullButton({ state, pool, collectedAmount, onCollect, className }: {
  state: HeartCollectionState;
  pool: { totalHearts: number } | null;
  collectedAmount: number | null;
  onCollect: () => void;
  className: string;
}) {
  if (state === "not_eligible") {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-border/20 bg-muted/10 ${className}`}>
        <MapPin className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <p className="text-[11px] font-serif text-muted-foreground/60">
          Visit this tree to collect hearts
        </p>
      </div>
    );
  }

  if (state === "no_hearts") {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-border/20 bg-muted/10 ${className}`}>
        <Heart className="w-4 h-4 text-muted-foreground/30 shrink-0" />
        <p className="text-[11px] font-serif text-muted-foreground/50">
          No hearts available right now
        </p>
      </div>
    );
  }

  if (state === "collected") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-primary/5 border-primary/20 ${className}`}
      >
        <Heart className="w-4 h-4 text-primary shrink-0 fill-primary/30" />
        <p className="text-sm font-serif text-primary">
          {collectedAmount} heart{collectedAmount !== 1 ? "s" : ""} collected ✨
        </p>
      </motion.div>
    );
  }

  const isCollecting = state === "collecting";

  return (
    <button
      onClick={onCollect}
      disabled={isCollecting}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors text-left group ${className}`}
      style={{
        background: "hsl(120 50% 40% / 0.06)",
        borderColor: "hsl(120 40% 45% / 0.2)",
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "hsl(120 50% 40% / 0.12)" }}
      >
        {isCollecting ? (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(120 45% 55%)" }} />
        ) : (
          <Heart className="w-4 h-4" style={{ color: "hsl(120 45% 55%)" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-serif" style={{ color: "hsl(120 45% 55%)" }}>
          Collect Hearts
        </p>
        <p className="text-[10px] text-muted-foreground/60 font-serif mt-0.5">
          {pool?.totalHearts ?? 0} hearts in this tree's reservoir
        </p>
      </div>
      <span className="text-[11px] font-serif shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: "hsl(120 45% 55%)" }}>
        💚
      </span>
    </button>
  );
}

/* ── Compact variant — for preview cards ── */
function CompactButton({ state, pool, collectedAmount, onCollect, className }: {
  state: HeartCollectionState;
  pool: { totalHearts: number } | null;
  collectedAmount: number | null;
  onCollect: () => void;
  className: string;
}) {
  if (state === "not_eligible" || state === "no_hearts") {
    if (!pool || pool.totalHearts === 0) return null;
    return (
      <div className={`flex items-center gap-1.5 text-[10px] font-serif text-muted-foreground/50 ${className}`}>
        <Heart className="w-3 h-3" />
        <span>{pool.totalHearts} hearts</span>
        {state === "not_eligible" && <span>· visit to collect</span>}
      </div>
    );
  }

  if (state === "collected") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-1.5 text-[10px] font-serif ${className}`}
        style={{ color: "hsl(120 45% 55%)" }}
      >
        <Heart className="w-3 h-3 fill-current" />
        <span>{collectedAmount} collected ✨</span>
      </motion.div>
    );
  }

  const isCollecting = state === "collecting";

  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCollect(); }}
      disabled={isCollecting}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-serif transition-colors ${className}`}
      style={{
        background: "hsl(120 50% 40% / 0.08)",
        color: "hsl(120 45% 55%)",
        border: "1px solid hsl(120 40% 45% / 0.15)",
      }}
    >
      {isCollecting ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Heart className="w-3 h-3" />
      )}
      <span>Collect {pool?.totalHearts ?? 0} hearts</span>
    </button>
  );
}

/* ── Inline variant — minimal text ── */
function InlineButton({ state, pool, collectedAmount, onCollect, className }: {
  state: HeartCollectionState;
  pool: { totalHearts: number } | null;
  collectedAmount: number | null;
  onCollect: () => void;
  className: string;
}) {
  if (state === "collected") {
    return (
      <span className={`text-[10px] font-serif ${className}`} style={{ color: "hsl(120 45% 55%)" }}>
        💚 {collectedAmount} hearts collected
      </span>
    );
  }

  if (state !== "eligible") return null;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCollect(); }}
      disabled={state !== "eligible"}
      className={`text-[10px] font-serif underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-80 ${className}`}
      style={{ color: "hsl(120 45% 55%)" }}
    >
      💚 Collect {pool?.totalHearts ?? 0} hearts
    </button>
  );
}
