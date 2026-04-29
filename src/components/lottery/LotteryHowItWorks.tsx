/**
 * LotteryHowItWorks — warm, plain-language explainer.
 * Pulls live values from lottery_config so percentages/prizes stay accurate
 * for both the lunar (twin moons) and solar (four suns) rhythms.
 */
import { useLotteryConfig } from "@/hooks/use-lottery";

const LotteryHowItWorks = () => {
  const { data: cfg } = useLotteryConfig();

  const lunarYieldPct = cfg ? (cfg.lunar_yield_bps / 100).toFixed(1) : "3.3";
  const lunarPrize = cfg?.lunar_prize_amount ?? 333;
  const lunarPrizeCount = cfg?.lunar_prize_count ?? 3;

  const solarYieldPct = cfg ? (cfg.solar_yield_bps / 100).toFixed(1) : "9.9";
  const solarPrize = cfg?.solar_prize_amount ?? 999;
  const solarPrizeCount = cfg?.solar_prize_count ?? 3;

  const windowDays = cfg?.ticket_window_days ?? 14;

  return (
    <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 space-y-4">
      <h3 className="text-sm font-serif uppercase tracking-[0.18em] text-muted-foreground">
        How the moons and suns work
      </h3>

      <div className="space-y-3 text-sm font-serif text-foreground/85 leading-relaxed">
        <p>
          The forest pauses on two rhythms. The{" "}
          <span className="text-foreground">twin moons</span> — every new moon and full moon —
          and the <span className="text-foreground">four suns</span> — every equinox and
          solstice. At each pause, what has gathered is shared.
        </p>

        <p>
          You take part by <span className="text-foreground">planting hearts</span> at trees
          you love. Planted hearts root quietly, return{" "}
          <span className="text-foreground">{lunarYieldPct}%</span> yield at every moon and{" "}
          <span className="text-foreground">{solarYieldPct}%</span> at every sun, and enter
          you in both draws as long as they remain rooted.
        </p>

        <p>
          You can also simply <span className="text-foreground">earn hearts</span> in the days
          before a draw — through collections, offerings, presence, council, or contributions —
          and every heart earned becomes a ticket.
        </p>

        <p>
          When a moon arrives, {lunarPrizeCount} wanderers are chosen at random, weighted by
          tickets, and each receives{" "}
          <span className="text-foreground">{lunarPrize} hearts</span>. When a sun arrives,{" "}
          {solarPrizeCount} wanderers receive{" "}
          <span className="text-foreground">{solarPrize} hearts</span> — a fuller share for the
          longer turning of the year.
        </p>

        <p>
          The ticket window is the {windowDays} days leading up to each draw. Yield hearts and
          prize hearts do not themselves count as tickets — only the hearts you earned through
          your own movements.
        </p>

        <p className="text-xs text-muted-foreground/80 italic">
          Every draw publishes its random seed and its winners openly, so the rhythm stays
          honest.
        </p>
      </div>
    </div>
  );
};

export default LotteryHowItWorks;
