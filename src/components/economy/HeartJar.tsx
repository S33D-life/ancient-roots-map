/**
 * HeartJar — Unified living balance vessel.
 * Compact header indicator showing hearts + influence + seeds.
 * Expands into a full balance panel on tap.
 */
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Sun, Moon, ScrollText } from "lucide-react";
import { useHeartEconomy } from "@/hooks/use-heart-economy";
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import HeartJarOverview from "./HeartJarOverview";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  userId: string | null;
  className?: string;
}

const HeartJar = ({ userId, className = "" }: Props) => {
  const { balance, isLoading } = useHeartEconomy(userId);
  const { seedsRemaining } = useSeedEconomy(userId);
  const [open, setOpen] = useState(false);
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
              className="fixed bottom-0 left-0 right-0 z-[9999] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t"
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const root = document.documentElement;
                      const isDark = root.classList.contains("dark");
                      root.classList.toggle("dark", !isDark);
                      root.classList.toggle("light", isDark);
                      localStorage.setItem("s33d-theme", isDark ? "light" : "dark");
                      // Force re-render for icon swap
                      setOpen(o => { setTimeout(() => setOpen(true), 0); return false; });
                    }}
                    className="p-1.5 rounded-full transition-colors hover:bg-accent/20 md:hidden"
                    aria-label="Toggle theme"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400 dark:block hidden" />
                    <Moon className="w-3.5 h-3.5 text-muted-foreground dark:hidden block" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-full transition-colors"
                    style={{ background: "transparent" }}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Content — Phase 1: single overview, no tabs */}
              <div className="px-5 pt-2 pb-8">
                <HeartJarOverview userId={userId!} hearts={balance.s33d} />

                {/* Quiet secondary link — full ledger lives in /vault */}
                <Link
                  to="/vault?tab=ledger"
                  onClick={() => setOpen(false)}
                  className="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-serif text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ScrollText className="w-3 h-3" />
                  View full ledger
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeartJar;
