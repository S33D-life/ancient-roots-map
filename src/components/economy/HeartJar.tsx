/**
 * HeartJar — Glass jar of glowing hearts. Primary balance UI.
 * Tapping opens a sliding panel with balance, ledger, earn/spend options.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Heart, ChevronDown, Sparkles, ShoppingCart, Gift, ArrowRight, X, Wallet } from "lucide-react";
import { useHeartEconomy } from "@/hooks/use-heart-economy";
import HeartLedgerPanel from "./HeartLedgerPanel";
import HeartClaimsPanel from "./HeartClaimsPanel";

interface Props {
  userId: string | null;
  className?: string;
}

const HeartJar = ({ userId, className = "" }: Props) => {
  const { balance, isLoading } = useHeartEconomy(userId);
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

  const fillPct = Math.min(100, Math.max(8, (balance.s33d / Math.max(balance.s33d, 100)) * 100));

  return (
    <>
      {/* Jar button */}
      <button
        onClick={() => setOpen(true)}
        className={`relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-primary/20 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all ${className}`}
        aria-label="Open Heart Jar"
      >
        {/* Mini jar */}
        <div className="relative w-6 h-7 rounded-b-lg rounded-t-sm border border-primary/30 overflow-hidden bg-card/80">
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: `${fillPct}%`,
              background: "linear-gradient(to top, hsl(42 95% 55% / 0.6), hsl(45 100% 70% / 0.3))",
            }}
            animate={{
              opacity: pulse ? [1, 0.5, 1] : 1,
              boxShadow: pulse
                ? ["0 0 8px hsl(42 95% 55% / 0.5)", "0 0 16px hsl(42 95% 55% / 0.8)", "0 0 8px hsl(42 95% 55% / 0.5)"]
                : "0 0 4px hsl(42 95% 55% / 0.2)",
            }}
            transition={{ duration: 0.6 }}
          />
          {/* Floating heart particles inside jar */}
          {balance.s33d > 0 && (
            <>
              <motion.div
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ background: "hsl(42 95% 65%)", left: "30%", bottom: `${fillPct * 0.4}%` }}
                animate={{ y: [-1, 1, -1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute w-1 h-1 rounded-full"
                style={{ background: "hsl(45 100% 70%)", left: "60%", bottom: `${fillPct * 0.6}%` }}
                animate={{ y: [1, -1, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            </>
          )}
        </div>
        <span className="text-xs font-serif font-bold tabular-nums text-primary">
          {isLoading ? "…" : balance.s33d.toLocaleString()}
        </span>
      </button>

      {/* Panel overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary fill-primary/20" />
                  <h2 className="font-serif text-lg text-foreground">Heart Jar</h2>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-secondary/40 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
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
                      <JarOverview balance={balance} />
                    </motion.div>
                  )}
                  {tab === "ledger" && (
                    <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <HeartLedgerPanel userId={userId} />
                    </motion.div>
                  )}
                  {tab === "claims" && (
                    <motion.div key="claims" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <HeartClaimsPanel userId={userId} />
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

/* ── Overview tab ── */
import type { HeartBalance } from "@/lib/heart-economy-types";
import { Link } from "react-router-dom";

const JarOverview = ({ balance }: { balance: HeartBalance }) => (
  <div className="space-y-4">
    {/* Big jar visualization */}
    <div className="flex flex-col items-center py-4">
      <div className="relative w-24 h-32 rounded-b-2xl rounded-t-lg border-2 border-primary/30 overflow-hidden bg-card/80">
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ height: 0 }}
          animate={{ height: `${Math.min(95, Math.max(5, (balance.s33d / Math.max(balance.s33d, 100)) * 95))}%` }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          style={{
            background: "linear-gradient(to top, hsl(42 95% 50% / 0.7), hsl(45 100% 65% / 0.4))",
            boxShadow: "inset 0 -4px 12px hsl(42 95% 55% / 0.3)",
          }}
        />
        {/* Floating particles */}
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `hsl(${42 + i * 3} ${90 - i * 5}% ${55 + i * 3}%)`,
              left: `${15 + i * 15}%`,
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
      <BalanceCard label="Species Hearts" value={balance.species} icon="🌿" accent="150 50% 45%" />
      <BalanceCard label="Influence" value={balance.influence} icon="🛡️" accent="42 80% 50%" />
      {balance.locked > 0 && (
        <BalanceCard label="Locked (Staking)" value={balance.locked} icon="🔒" accent="220 50% 55%" />
      )}
      {balance.claimable > 0 && (
        <BalanceCard label="Claimable" value={balance.claimable} icon="✨" accent="280 60% 55%" />
      )}
    </div>

    {/* Action links */}
    <div className="space-y-1.5 pt-2">
      <Link
        to="/how-hearts-work"
        className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/30 hover:border-primary/20 transition-all group"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-serif text-foreground">How to Earn Hearts</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </Link>
      <Link
        to="/value-tree?tab=economy"
        className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/30 hover:border-primary/20 transition-all group"
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

const BalanceCard = ({ label, value, icon, accent }: { label: string; value: number; icon: string; accent: string }) => (
  <div
    className="flex items-center gap-2 p-3 rounded-xl border"
    style={{ borderColor: `hsl(${accent} / 0.2)`, background: `hsl(${accent} / 0.05)` }}
  >
    <span className="text-base">{icon}</span>
    <div className="min-w-0">
      <p className="text-sm font-serif font-bold tabular-nums" style={{ color: `hsl(${accent})` }}>
        {value.toLocaleString()}
      </p>
      <p className="text-[9px] font-serif text-muted-foreground truncate">{label}</p>
    </div>
  </div>
);

export default HeartJar;
