/**
 * LotteryCountdownCard — compact dashboard widget that mirrors VaultWindfalls
 * styling. Lives next to VaultWindfalls; tapping it opens /lottery.
 */
import { useNavigate } from "react-router-dom";
import { Moon } from "lucide-react";
import { useLotteryStats, drawEmoji, drawLabel } from "@/hooks/use-lottery";
import { useCountdown } from "@/hooks/use-countdown";

const LotteryCountdownCard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useLotteryStats();
  const draw = stats?.nextDraw ?? null;
  const countdown = useCountdown(draw?.scheduled_at ?? null);

  if (isLoading) {
    return <div className="h-32 rounded-2xl bg-card/20 animate-pulse" />;
  }

  return (
    <button
      type="button"
      onClick={() => navigate("/lottery")}
      className="w-full text-left rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden hover:border-primary/40 transition-colors"
      aria-label="Open lottery page"
    >
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-serif tracking-wide text-foreground">
            Moons & Suns
            <span className="text-[9px] text-muted-foreground font-normal ml-1">
              Plant hearts · enter every draw
            </span>
          </h3>
        </div>

        {draw ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-card/30">
            <span className="text-2xl" aria-hidden>{drawEmoji(draw.draw_type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-serif text-foreground">
                {drawLabel(draw.draw_type)}
              </p>
              <p className="text-[10px] font-serif text-muted-foreground tabular-nums mt-0.5">
                {countdown.isPast
                  ? "Drawing now…"
                  : `in ${countdown.days}d ${String(countdown.hours).padStart(2, "0")}h ${String(countdown.minutes).padStart(2, "0")}m`}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 rounded-xl border border-border/40 bg-card/30">
            <p className="text-xs font-serif text-muted-foreground italic">
              The next draw is being scheduled.
            </p>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-2 text-[10px] font-serif">
            <div className="px-3 py-2 rounded-lg bg-card/30 border border-border/20">
              <p className="text-muted-foreground/70">Tickets</p>
              <p className="text-foreground tabular-nums text-sm mt-0.5">{stats.tickets}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-card/30 border border-border/20">
              <p className="text-muted-foreground/70">~ Yield next</p>
              <p className="text-foreground tabular-nums text-sm mt-0.5">
                {stats.estimatedYieldNext}
              </p>
            </div>
          </div>
        )}

        <p className="text-[10px] font-serif text-muted-foreground/60 text-center italic">
          Tap to open the moons →
        </p>
      </div>
    </button>
  );
};

export default LotteryCountdownCard;
