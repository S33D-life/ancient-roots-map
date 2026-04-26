/**
 * LotteryPositionCards — three cards showing the user's stake, tickets, and lifetime totals.
 * Stacks on mobile; grid on tablet+.
 */
import { Link } from "react-router-dom";
import { Sprout, Ticket, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LotteryStats } from "@/hooks/use-lottery";

interface Props {
  stats: LotteryStats;
}

const breakdownRows = (b: LotteryStats["ticketsBreakdown"]) => [
  { emoji: "🌱", label: "Collections", value: b.collections },
  { emoji: "🎁", label: "Offerings", value: b.offerings },
  { emoji: "👣", label: "Presence", value: b.presence },
  { emoji: "🌳", label: "Council", value: b.council },
  { emoji: "💛", label: "Contributions", value: b.contributions },
];

const LotteryPositionCards = ({ stats }: Props) => {
  const rows = breakdownRows(stats.ticketsBreakdown);
  const lifetimeTotal = stats.lifetimePrizes + stats.lifetimeYield;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Card 1 — Your Stake */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[hsl(140_35%_45%)]" />
            <h3 className="text-xs font-serif uppercase tracking-[0.15em] text-muted-foreground">
              Your Stake
            </h3>
          </div>

          {stats.totalStaked > 0 ? (
            <>
              <p className="text-2xl font-serif text-foreground tabular-nums">
                {stats.totalStaked}{" "}
                <span className="text-sm text-muted-foreground">hearts staked</span>
              </p>
              <p className="text-xs font-serif text-foreground/80">
                Estimated yield at next moon:{" "}
                <span className="text-[hsl(140_35%_45%)] tabular-nums">
                  ~{stats.estimatedYieldNext}
                </span>{" "}
                hearts
              </p>
              <p className="text-[10px] font-serif text-muted-foreground/70 italic leading-relaxed">
                Yield is paid every two weeks — at every new moon and full moon.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-serif text-foreground/80">
                You have no hearts staked yet.
              </p>
              <Link
                to="/map"
                className="inline-flex text-xs font-serif text-primary hover:underline"
              >
                Stake hearts at any ancient friend to earn yield →
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card 2 — Your Tickets */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-serif uppercase tracking-[0.15em] text-muted-foreground">
              Your Tickets
            </h3>
          </div>

          {stats.tickets > 0 ? (
            <>
              <p className="text-2xl font-serif text-foreground tabular-nums">
                {stats.tickets}{" "}
                <span className="text-sm text-muted-foreground">
                  ticket{stats.tickets === 1 ? "" : "s"}
                </span>
              </p>
              <ul className="space-y-1">
                {rows
                  .filter((r) => r.value > 0)
                  .map((r) => (
                    <li
                      key={r.label}
                      className="flex items-center justify-between text-[11px] font-serif text-muted-foreground"
                    >
                      <span>
                        <span className="mr-1.5">{r.emoji}</span>
                        {r.label}
                      </span>
                      <span className="tabular-nums text-foreground/70">{r.value}</span>
                    </li>
                  ))}
              </ul>
              <p className="text-[10px] font-serif text-muted-foreground/70 italic">
                Each heart earned in this cycle = 1 ticket.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-serif text-foreground/80">
                You haven't earned hearts in this cycle yet.
              </p>
              <Link
                to="/map"
                className="inline-flex text-xs font-serif text-primary hover:underline"
              >
                Plant a seed, leave an offering, or visit a tree →
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card 3 — Lifetime */}
      <Card className="bg-card/30 backdrop-blur-sm border-border/20">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-serif uppercase tracking-[0.15em] text-muted-foreground">
              Lifetime
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-serif">
              <span className="text-muted-foreground">Yield earned</span>
              <span className="text-foreground tabular-nums">{stats.lifetimeYield}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-serif">
              <span className="text-muted-foreground">Prizes won</span>
              <span className="text-foreground tabular-nums">{stats.lifetimePrizes}</span>
            </div>
            {lifetimeTotal > 0 && (
              <div className="flex items-center justify-between text-xs font-serif pt-2 border-t border-border/20">
                <span className="text-muted-foreground">Total</span>
                <span className="text-foreground tabular-nums">{lifetimeTotal} hearts</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LotteryPositionCards;
