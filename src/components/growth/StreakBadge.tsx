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

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/60">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
        style={{
          background: `radial-gradient(circle, ${tier.color}30, transparent 80%)`,
          boxShadow: `0 0 20px ${tier.color}20`,
        }}
      >
        {tier.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm font-medium" style={{ color: tier.color }}>
          {tier.label}
        </p>
        <p className="text-[10px] text-muted-foreground font-serif">
          {streak.current_streak} day streak • Best: {streak.longest_streak}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Flame className="w-4 h-4" style={{ color: tier.color }} />
        <span className="text-lg font-serif tabular-nums font-bold" style={{ color: tier.color }}>
          {streak.current_streak}
        </span>
      </div>
    </div>
  );
};

export default StreakBadge;
