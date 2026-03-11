/**
 * StreakBadge — displays the user's current mapping streak tier.
 * Compact badge for profile display.
 */
import { getTierMeta } from "@/hooks/use-wanderer-streak";
import type { WandererStreak } from "@/hooks/use-wanderer-streak";
import { Flame } from "lucide-react";

interface Props {
  streak: WandererStreak | null | undefined;
  compact?: boolean;
}

const StreakBadge = ({ streak, compact }: Props) => {
  if (!streak || streak.current_streak === 0) return null;

  const tier = getTierMeta(streak.streak_tier);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-serif px-2 py-0.5 rounded-full border border-border/50 bg-card/60">
        <span>{tier.emoji}</span>
        <span className="tabular-nums font-bold" style={{ color: tier.color }}>
          {streak.current_streak}
        </span>
        <Flame className="w-3 h-3" style={{ color: tier.color }} />
      </span>
    );
  }

  // Find next tier
  const tiers = ["seedling", "sapling", "young_tree", "guardian"];
  const currentIdx = tiers.indexOf(streak.streak_tier);
  const nextTier = currentIdx < tiers.length - 1 ? getTierMeta(tiers[currentIdx + 1]) : null;
  const nextThreshold = nextTier ? nextTier.threshold : tier.threshold;
  const progress = nextTier
    ? Math.min(100, Math.round((streak.current_streak / nextThreshold) * 100))
    : 100;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/60">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
        style={{
          background: `radial-gradient(circle, ${tier.color}30, transparent 80%)`,
          boxShadow: `0 0 20px ${tier.color}20`,
        }}
      >
        {tier.emoji}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-serif text-sm font-medium" style={{ color: tier.color }}>
          {tier.label}
        </p>
        <p className="text-[10px] text-muted-foreground font-serif">
          {streak.current_streak} day streak • Best: {streak.longest_streak}
        </p>
        {nextTier && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: nextTier.color }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground font-serif whitespace-nowrap">
              {nextThreshold - streak.current_streak}d to {nextTier.label}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Flame className="w-4 h-4" style={{ color: tier.color }} />
        <span className="text-lg font-serif tabular-nums font-bold" style={{ color: tier.color }}>
          {streak.current_streak}
        </span>
      </div>
    </div>
  );
};

export default StreakBadge;
