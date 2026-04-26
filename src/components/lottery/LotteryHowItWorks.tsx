/**
 * LotteryHowItWorks — warm, plain-language explainer.
 * Pulls live values from lottery_config so percentages/prizes stay accurate.
 */
import { useLotteryConfig } from "@/hooks/use-lottery";

const LotteryHowItWorks = () => {
  const { data: cfg } = useLotteryConfig();

  const yieldPct = cfg ? (cfg.lunar_yield_bps / 100).toFixed(1) : "3.3";
  const prizeAmt = cfg?.lunar_prize_amount ?? 333;
  const prizeCount = cfg?.lunar_prize_count ?? 3;
  const windowDays = cfg?.ticket_window_days ?? 14;

  return (
    <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 space-y-4">
      <h3 className="text-sm font-serif uppercase tracking-[0.18em] text-muted-foreground">
        How the moons work
      </h3>

      <div className="space-y-3 text-sm font-serif text-foreground/85 leading-relaxed">
        <p>
          Twice every month — at the <span className="text-foreground">new moon</span>{" "}
          and the <span className="text-foreground">full moon</span> — the forest pauses
          and shares what has gathered.
        </p>

        <p>
          There are two ways to take part. You can <span className="text-foreground">stake</span>{" "}
          hearts at trees you love, and they will return{" "}
          <span className="text-foreground">{yieldPct}%</span> yield at every moon — quietly,
          like roots drawing water. You can also simply{" "}
          <span className="text-foreground">earn</span> hearts in the days before a draw —
          through collections, offerings, presence, council, or contributions — and every
          heart earned becomes a ticket.
        </p>

        <p>
          When the moon arrives, three wanderers are chosen at random, weighted by how many
          tickets they hold. Each receives{" "}
          <span className="text-foreground">{prizeAmt} hearts</span> — {prizeCount} prizes in
          all.
        </p>

        <p>
          The ticket window is the {windowDays} days leading up to each moon. Yield hearts
          and prize hearts do not themselves count as tickets — only the hearts you earned
          through your own movements.
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
