/**
 * HeartJar — Unified living balance vessel.
 * Compact header indicator showing hearts + influence + seeds.
 * Expands into a full balance panel on tap.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, ArrowRight, X, Shield, Sprout } from "lucide-react";
import { useHeartEconomy } from "@/hooks/use-heart-economy";
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import HeartLedgerPanel from "./HeartLedgerPanel";
import HeartClaimsPanel from "./HeartClaimsPanel";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  userId: string | null;
  className?: string;
}

const HeartJar = ({ userId, className = "" }: Props) => {
  const { balance, isLoading } = useHeartEconomy(userId);
  const { seedsRemaining } = useSeedEconomy(userId);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "ledger" | "claims">("overview");
  const prevBalance = useRef(balance.s33d);
  const [pulse, setPulse] = useState(false);

  // Detect balance changes → trigger glow
  useEffect(() => {
    if (balance.s33d !== prevBalance.current && prevBalance.current !== 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1200);
      return () => clearTimeout(t);
    }
    prevBalance.current = balance.s33d;
  }, [balance.s33d]);

  if (!userId) return null;

  // Skeleton state while loading
  if (isLoading) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border/20 bg-card/60 ${className}`}>
        <Skeleton className="w-6 h-7 rounded-b-lg rounded-t-sm" />
        <Skeleton className="w-8 h-3 rounded" />
      </div>
    );
  }

  const fillPct = Math.min(100, Math.max(8, (balance.s33d / Math.max(balance.s33d, 100)) * 100));

  return (
    <>
      {/* Compact jar button */}
      <button
        onClick={() => setOpen(true)}
        className={`relative group flex items-center gap-1.5 px-2 py-1 md:px-2.5 md:py-1.5 rounded-full border transition-all ${className}`}
        style={{
          borderColor: "hsl(var(--primary) / 0.2)",
          background: "hsl(var(--card) / 0.6)",
          backdropFilter: "blur(8px)",
        }}
        aria-label="Open Heart Jar — your living balances"
      >
        {/* Mini jar */}
        <div className="relative w-5 h-6 md:w-6 md:h-7 rounded-b-lg rounded-t-sm overflow-hidden"
          style={{
            border: "1px solid hsl(var(--primary) / 0.3)",
            background: "hsl(var(--card) / 0.8)",
          }}
        >
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: `${fillPct}%`,
              background: "linear-gradient(to top, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.3))",
            }}
            animate={{
              opacity: pulse ? [1, 0.5, 1] : 1,
              boxShadow: pulse
                ? ["0 0 8px hsl(var(--primary) / 0.5)", "0 0 16px hsl(var(--primary) / 0.8)", "0 0 8px hsl(var(--primary) / 0.5)"]
                : "0 0 4px hsl(var(--primary) / 0.2)",
            }}
            transition={{ duration: 0.6 }}
          />
          {balance.s33d > 0 && (
            <>
              <motion.div
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ left: "30%", bottom: `${fillPct * 0.4}%`, background: "hsl(var(--primary) / 0.6)" }}
                animate={{ y: [-1, 1, -1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute w-1 h-1 rounded-full"
                style={{ left: "60%", bottom: `${fillPct * 0.6}%`, background: "hsl(var(--primary) / 0.5)" }}
                animate={{ y: [1, -1, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            </>
          )}
        </div>

        {/* Compact stats — hearts primary, seeds as dot */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-serif font-bold tabular-nums text-primary">
            {balance.s33d.toLocaleString()}
          </span>
          {/* Seeds dot indicator */}
          {seedsRemaining > 0 && (
            <span
              className="flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-serif font-bold tabular-nums"
              style={{
                background: "hsl(var(--primary) / 0.15)",
                color: "hsl(var(--primary) / 0.8)",
              }}
            >
              {seedsRemaining}
            </span>
          )}
        </div>
      </button>

      {/* Panel overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[9998]"
              style={{ background: "hsl(var(--background) / 0.6)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t"
              style={{
                borderColor: "hsl(var(--border))",
                background: "hsl(var(--card))",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: "hsl(var(--muted-foreground) / 0.2)" }} />
              </div>

              {/* Header */}
              <div className="px-5 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary fill-primary/20" />
                  <div>
                    <h2 className="font-serif text-lg text-foreground">Heart Jar</h2>
                    <p className="text-[10px] font-serif text-muted-foreground">Your living balances</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full transition-colors"
                  style={{ background: "transparent" }}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Quick summary strip */}
              <div className="px-5 py-3 flex gap-2">
                <QuickStat icon={<Heart className="w-3.5 h-3.5 text-primary" />} label="Hearts" value={balance.s33d} />
                <QuickStat icon={<Shield className="w-3.5 h-3.5 text-muted-foreground" />} label="Influence" value={balance.influence} />
                <QuickStat icon={<Sprout className="w-3.5 h-3.5 text-primary" />} label="Seeds today" value={seedsRemaining} suffix="/3" />
              </div>

              {/* Tab bar */}
              <div className="px-5 flex gap-1 mb-3">
                {(["overview", "ledger", "claims"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2 text-xs font-serif rounded-lg transition-all ${
                      tab === t
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground hover:bg-secondary/20 border border-transparent"
                    }`}
                  >
                    {t === "overview" ? "Balance" : t === "ledger" ? "Ledger" : "Claimable"}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="px-5 pb-8">
                <AnimatePresence mode="wait">
                  {tab === "overview" && (
                    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <JarOverview balance={balance} seedsRemaining={seedsRemaining} />
                    </motion.div>
                  )}
                  {tab === "ledger" && (
                    <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <HeartLedgerPanel userId={userId!} />
                    </motion.div>
                  )}
                  {tab === "claims" && (
                    <motion.div key="claims" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <HeartClaimsPanel userId={userId!} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Quick stat chip ── */
const QuickStat = ({ icon, label, value, suffix = "" }: { icon: React.ReactNode; label: string; value: number; suffix?: string }) => (
  <div
    className="flex-1 flex items-center gap-1.5 px-2.5 py-2 rounded-xl"
    style={{
      background: "hsl(var(--secondary) / 0.15)",
      border: "1px solid hsl(var(--border) / 0.15)",
    }}
  >
    {icon}
    <div className="min-w-0">
      <p className="text-sm font-serif font-bold tabular-nums text-foreground">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-[8px] font-serif text-muted-foreground uppercase tracking-wider truncate">{label}</p>
    </div>
  </div>
);

/* ── Overview tab ── */
import type { HeartBalance } from "@/lib/heart-economy-types";
import { Link } from "react-router-dom";

const JarOverview = ({ balance, seedsRemaining }: { balance: HeartBalance; seedsRemaining: number }) => (
  <div className="space-y-4">
    {/* Big jar visualization */}
    <div className="flex flex-col items-center py-4">
      <div
        className="relative w-24 h-32 rounded-b-2xl rounded-t-lg overflow-hidden"
        style={{
          border: "2px solid hsl(var(--primary) / 0.3)",
          background: "hsl(var(--card) / 0.8)",
        }}
      >
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ height: 0 }}
          animate={{ height: `${Math.min(95, Math.max(5, (balance.s33d / Math.max(balance.s33d, 100)) * 95))}%` }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          style={{
            background: "linear-gradient(to top, hsl(var(--primary) / 0.7), hsl(var(--primary) / 0.3))",
            boxShadow: "inset 0 -4px 12px hsl(var(--primary) / 0.3)",
          }}
        />
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              opacity: 0.4 + i * 0.1,
              left: `${15 + i * 15}%`,
              background: "hsl(var(--primary))",
            }}
            animate={{
              y: [0, -8, 0],
              opacity: [0.3, 0.8, 0.3],
              bottom: [`${10 + i * 12}%`, `${18 + i * 12}%`, `${10 + i * 12}%`],
            }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <p className="text-3xl font-serif font-bold tabular-nums text-primary mt-3">
        {balance.s33d.toLocaleString()}
      </p>
      <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-[0.15em]">
        S33D Hearts
      </p>
    </div>

    {/* Balance grid */}
    <div className="grid grid-cols-2 gap-2">
      <BalanceCard label="Species Hearts" value={balance.species} icon="🌿" />
      <BalanceCard label="Influence" value={balance.influence} icon="🛡️" />
      <BalanceCard label="Seeds Today" value={seedsRemaining} icon="🌱" suffix="/3" />
      {balance.locked > 0 && (
        <BalanceCard label="Locked (Staking)" value={balance.locked} icon="🔒" />
      )}
      {balance.claimable > 0 && (
        <BalanceCard label="Claimable" value={balance.claimable} icon="✨" />
      )}
    </div>

    {/* Action links */}
    <div className="space-y-1.5 pt-2">
      <Link
        to="/vault"
        className="flex items-center justify-between px-3 py-3 rounded-xl transition-all group"
        style={{
          background: "hsl(var(--primary) / 0.08)",
          border: "1px solid hsl(var(--primary) / 0.25)",
        }}
      >
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-sm font-serif font-medium text-foreground">Enter Heartwood Vault</span>
        </div>
        <ArrowRight className="w-4 h-4 text-primary/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </Link>
      <Link
        to="/how-hearts-work"
        className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group"
        style={{
          border: "1px solid hsl(var(--border) / 0.3)",
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-serif text-foreground">How to Earn Hearts</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </Link>
      <Link
        to="/value-tree?tab=economy"
        className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group"
        style={{
          border: "1px solid hsl(var(--border) / 0.3)",
        }}
      >
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-serif text-foreground">Living Economy</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </Link>
    </div>
  </div>
);

const BalanceCard = ({ label, value, icon, suffix = "" }: { label: string; value: number; icon: string; suffix?: string }) => (
  <div
    className="flex items-center gap-2 p-3 rounded-xl"
    style={{
      border: "1px solid hsl(var(--border) / 0.2)",
      background: "hsl(var(--secondary) / 0.05)",
    }}
  >
    <span className="text-base">{icon}</span>
    <div className="min-w-0">
      <p className="text-sm font-serif font-bold tabular-nums text-foreground">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-[9px] font-serif text-muted-foreground truncate">{label}</p>
    </div>
  </div>
);

export default HeartJar;
