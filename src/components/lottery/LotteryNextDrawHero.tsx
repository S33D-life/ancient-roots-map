/**
 * LotteryNextDrawHero — ceremonial countdown hero card for the next lunar draw.
 * Subtle moon glow background depending on phase; warm S33D tone.
 */
import { motion } from "framer-motion";
import { useCountdown } from "@/hooks/use-countdown";
import { drawEmoji, drawLabel, type NextDraw } from "@/hooks/use-lottery";

interface Props {
  draw: NextDraw | null;
}

const LotteryNextDrawHero = ({ draw }: Props) => {
  const countdown = useCountdown(draw?.scheduled_at ?? null);

  if (!draw) {
    return (
      <div className="rounded-3xl border border-border/30 bg-card/40 backdrop-blur-sm p-8 text-center">
        <div className="text-3xl mb-3">🌙</div>
        <p className="text-sm font-serif text-muted-foreground italic">
          The next draw is being scheduled.
        </p>
      </div>
    );
  }

  const yieldPct = (draw.yield_bps / 100).toFixed(1);
  const phase = draw.draw_type;
  const isSolar = phase.startsWith("solar_");
  // Subtle glow color per phase
  const glow =
    phase === "lunar_full"
      ? "hsl(48 60% 70%)"
      : phase === "lunar_new"
      ? "hsl(240 30% 35%)"
      : phase === "solar_equinox_spring"
      ? "hsl(340 55% 75%)"
      : phase === "solar_solstice_summer"
      ? "hsl(38 80% 65%)"
      : phase === "solar_equinox_autumn"
      ? "hsl(22 60% 55%)"
      : phase === "solar_solstice_winter"
      ? "hsl(210 40% 70%)"
      : "hsl(200 40% 60%)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/40 backdrop-blur-sm"
    >
      {/* Moon glow background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${glow} 0%, transparent 55%)`,
        }}
      />
      <div className="relative px-6 py-10 text-center space-y-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 font-serif">
          Next Draw
        </div>

        <div className="space-y-2">
          <div className="text-6xl leading-none" aria-hidden>
            {drawEmoji(phase)}
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-foreground tracking-wide">
            {drawLabel(phase)}
          </h2>
        </div>

        {/* Countdown */}
        {countdown.isPast ? (
          <p className="text-sm font-serif text-muted-foreground italic">
            The moment has arrived — the draw will execute shortly.
          </p>
        ) : (
          <div className="flex justify-center gap-3 sm:gap-5">
            {[
              { label: "days", value: countdown.days },
              { label: "hrs", value: countdown.hours },
              { label: "min", value: countdown.minutes },
              { label: "sec", value: countdown.seconds },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center min-w-[3rem]">
                <span className="text-3xl sm:text-4xl font-serif text-foreground tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 font-serif mt-1">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-serif text-foreground/80">
            {draw.prize_count} prizes of{" "}
            <span className="text-foreground">{draw.prize_amount} Hearts</span>
          </p>
          <p className="text-[11px] font-serif text-muted-foreground/80 italic">
            plus {yieldPct}% yield to all stakers
          </p>
        </div>

        <p className="text-[10px] font-serif text-muted-foreground/60">
          {new Date(draw.scheduled_at).toLocaleString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          })}
        </p>
      </div>
    </motion.div>
  );
};

export default LotteryNextDrawHero;
