import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, Clock, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VaultHeartBalanceProps {
  total: number;
  wanderer: number;
  sower: number;
  windfall: number;
  baseHearts: number;
  milestoneHearts: number;
  seedsRemaining: number;
  activeFilter?: string | null;
  onSegmentClick?: (label: string) => void;
  userId?: string;
}

const LABEL_TO_FILTER: Record<string, string> = {
  "Wanderer": "wanderer",
  "Sower": "sower",
  "Windfall": "windfall",
};

/** Calculate hours/minutes until midnight reset */
function getTimeUntilReset(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

const VaultHeartBalance = ({
  total, wanderer, sower, windfall, baseHearts, milestoneHearts, seedsRemaining, activeFilter, onSegmentClick, userId,
}: VaultHeartBalanceProps) => {
  const [lifetimeEarned, setLifetimeEarned] = useState<number | null>(null);
  const [lifetimeSpent, setLifetimeSpent] = useState<number | null>(null);
  const [lastEarnedAt, setLastEarnedAt] = useState<string | null>(null);
  const [resetCountdown, setResetCountdown] = useState(getTimeUntilReset());
  const [earnedToday, setEarnedToday] = useState(0);

  // Fetch lifetime stats
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("user_heart_balances")
        .select("lifetime_earned, lifetime_spent, last_earned_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setLifetimeEarned((data as any).lifetime_earned ?? null);
        setLifetimeSpent((data as any).lifetime_spent ?? null);
        setLastEarnedAt((data as any).last_earned_at ?? null);
      }
      // Today's earnings
      const { data: todayTx } = await supabase
        .from("heart_transactions")
        .select("amount")
        .eq("user_id", userId)
        .gt("amount", 0)
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
      setEarnedToday((todayTx || []).reduce((s, t) => s + (t.amount || 0), 0));
    })();
  }, [userId]);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setResetCountdown(getTimeUntilReset()), 60000);
    return () => clearInterval(interval);
  }, []);

  const segments = [
    { label: "Mapped", value: baseHearts, color: "hsl(42, 95%, 55%)" },
    { label: "Milestones", value: milestoneHearts, color: "hsl(28, 70%, 50%)" },
    { label: "Wanderer", value: wanderer, color: "hsl(0, 65%, 55%)" },
    { label: "Sower", value: sower, color: "hsl(120, 45%, 50%)" },
    { label: "Windfall", value: windfall, color: "hsl(270, 50%, 60%)" },
  ].filter(s => s.value > 0);

  const ringTotal = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-card/40 backdrop-blur-sm">
      {/* Subtle texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, hsl(30, 30%, 40%) 8px, hsl(30, 30%, 40%) 9px)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, hsl(42 80% 50% / 0.06), transparent)" }}
      />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* Ring chart */}
          <div className="relative shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-lg">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(75, 15%, 20%)" strokeWidth="10" opacity="0.3" />
              {segments.map((seg, i) => {
                const segLen = (seg.value / ringTotal) * circumference;
                const offset = cumulativeOffset;
                cumulativeOffset += segLen;
                const filterKey = LABEL_TO_FILTER[seg.label];
                const isActive = activeFilter && filterKey === activeFilter;
                const isDimmed = activeFilter && !isActive && filterKey;
                return (
                  <motion.circle
                    key={seg.label}
                    cx="80" cy="80" r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isActive ? "13" : "10"}
                    strokeLinecap="round"
                    strokeDasharray={`${segLen} ${circumference - segLen}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 80 80)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDimmed ? 0.25 : 1 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                    style={{
                      filter: `drop-shadow(0 0 ${isActive ? "8px" : "4px"} ${seg.color})`,
                      cursor: filterKey ? "pointer" : "default",
                    }}
                    onClick={() => filterKey && onSegmentClick?.(filterKey)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-serif font-bold tabular-nums"
                style={{ color: "hsl(42, 95%, 55%)" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {total}
              </motion.span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-serif mt-0.5">
                S33D Hearts
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-2 w-full">
            {segments.map((seg, i) => {
              const filterKey = LABEL_TO_FILTER[seg.label];
              const isActive = activeFilter && filterKey === activeFilter;
              return (
                <motion.div
                  key={seg.label}
                  className={`flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 transition-all ${filterKey ? "cursor-pointer hover:bg-card/60" : ""} ${isActive ? "bg-card/80 ring-1 ring-primary/30" : ""}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  onClick={() => filterKey && onSegmentClick?.(filterKey)}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}`, transform: isActive ? "scale(1.3)" : "scale(1)" }} />
                  <span className="text-xs font-serif text-muted-foreground flex-1">{seg.label}</span>
                  <span className="text-xs font-serif tabular-nums text-foreground">{seg.value}</span>
                </motion.div>
              );
            })}

            {/* Daily seeds + countdown */}
            <div className="pt-2 mt-2 border-t border-border/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground">
                <span className="text-sm">🌱</span>
                <span>{seedsRemaining} seed{seedsRemaining !== 1 ? "s" : ""} remaining today</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/50">
                  <Clock className="w-3 h-3" /> Resets in {resetCountdown}
                </span>
              </div>
              {earnedToday > 0 && (
                <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground/70">
                  <Heart className="w-3 h-3 text-primary/60" />
                  <span>{earnedToday} hearts earned today</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/40">cap: 100/day</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lifetime stats + integrity */}
        <div className="mt-5 pt-4 border-t border-border/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {lifetimeEarned !== null && (
            <div className="text-center">
              <p className="text-lg font-serif tabular-nums text-foreground">{lifetimeEarned}</p>
              <p className="text-[9px] font-serif uppercase tracking-widest text-muted-foreground/50">Lifetime Earned</p>
            </div>
          )}
          {lifetimeSpent !== null && (
            <div className="text-center">
              <p className="text-lg font-serif tabular-nums text-foreground">{lifetimeSpent}</p>
              <p className="text-[9px] font-serif uppercase tracking-widest text-muted-foreground/50">Lifetime Spent</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-lg font-serif tabular-nums text-foreground">{total}</p>
            <p className="text-[9px] font-serif uppercase tracking-widest text-muted-foreground/50">Current Balance</p>
          </div>
          <div className="text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-[10px] font-serif text-primary/70">Ledger verified</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-[9px] text-muted-foreground/40 font-serif flex items-center gap-0.5 mt-0.5">
                  <Info className="w-2.5 h-2.5" /> How it works
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Every heart is server-validated and recorded in an append-only ledger with unique transaction IDs. Balances cannot be modified client-side.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Link to full explanation */}
        <div className="text-center mt-3">
          <Link
            to="/how-hearts-work"
            className="text-[10px] font-serif text-primary/50 hover:text-primary/80 transition-colors underline underline-offset-2"
          >
            How S33D Hearts Work →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VaultHeartBalance;
