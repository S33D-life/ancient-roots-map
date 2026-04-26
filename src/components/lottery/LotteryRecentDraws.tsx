/**
 * LotteryRecentDraws — list of past completed draws with their winners.
 * Click a row to expand details (random seed for transparency, totals).
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRecentDraws, drawEmoji, drawLabel } from "@/hooks/use-lottery";

const PRIZE_MEDAL = ["🥇", "🥈", "🥉"];

const LotteryRecentDraws = ({ noNextHint = false }: { noNextHint?: boolean }) => {
  const { data: draws = [], isLoading } = useRecentDraws(8);
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-card/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (draws.length === 0) {
    return (
      <div className="rounded-2xl border border-border/30 bg-card/30 p-8 text-center">
        <div className="text-3xl mb-3">🌑</div>
        <p className="text-sm font-serif text-foreground italic">
          The first moon is yet to rise.
        </p>
        {!noNextHint && (
          <p className="text-[11px] font-serif text-muted-foreground/70 mt-2">
            Past draws will appear here after the next ceremony.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {draws.map((draw) => {
        const isOpen = openId === draw.id;
        const date = new Date(draw.scheduled_at);
        return (
          <div
            key={draw.id}
            className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : draw.id)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-card/60 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="text-2xl" aria-hidden>{drawEmoji(draw.draw_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-foreground">
                  {drawLabel(draw.draw_type)} ·{" "}
                  <span className="text-muted-foreground">
                    {date.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <p className="text-[10px] font-serif text-muted-foreground/70 mt-0.5">
                  {draw.entries_total} participants ·{" "}
                  {draw.yield_paid_total} hearts yield ·{" "}
                  {draw.prize_pool_total} hearts in prizes
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-border/20"
                >
                  <div className="p-4 space-y-3 bg-card/20">
                    {/* Winners */}
                    <div className="space-y-1.5">
                      {draw.winners.length === 0 ? (
                        <p className="text-xs font-serif text-muted-foreground italic">
                          No winners selected.
                        </p>
                      ) : (
                        draw.winners.map((w) => (
                          <div
                            key={`${draw.id}-${w.prize_rank}`}
                            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-card/40 transition-colors"
                          >
                            <span className="text-base" aria-hidden>
                              {PRIZE_MEDAL[w.prize_rank - 1] ?? "🎖️"}
                            </span>
                            {w.avatar_url ? (
                              <img
                                src={w.avatar_url}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover border border-border/30"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-muted/40 flex items-center justify-center text-xs font-serif text-foreground/70">
                                {(w.full_name ?? "·").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="flex-1 text-xs font-serif text-foreground truncate">
                              {w.full_name ?? "A wanderer"}
                            </span>
                            <span className="text-xs font-serif tabular-nums text-foreground/80">
                              +{w.prize_amount} hearts
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Transparency footer */}
                    {draw.random_seed && (
                      <div className="pt-2 border-t border-border/20 space-y-1">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70 font-serif">
                          Transparency
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 break-all">
                          seed: {draw.random_seed}
                        </p>
                        {draw.executed_at && (
                          <p className="text-[10px] font-serif text-muted-foreground/60">
                            executed{" "}
                            {new Date(draw.executed_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default LotteryRecentDraws;
