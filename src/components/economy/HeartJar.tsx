/**
 * HeartJar — Unified living balance vessel.
 * Compact header indicator showing hearts + influence + seeds.
 * Expands into a full balance panel on tap.
 */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
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
  const { seedsRemaining } = useSeedEconomy(userId); // shown as small dot on the trigger pill
  const [open, setOpen] = useState(false);
  const [tapPulse, setTapPulse] = useState(false);
  const prevBalance = useRef(balance.s33d);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();
  const [pulse, setPulse] = useState(false);
  // Sustained glow that turns on when new hearts arrive and turns off only
  // when the wanderer opens the jar (or after a long max window).
  const [awaitingAcknowledge, setAwaitingAcknowledge] = useState(false);

  // Detect balance changes → trigger short pulse + sustained glow
  useEffect(() => {
    if (balance.s33d !== prevBalance.current && prevBalance.current !== 0) {
      setPulse(true);
      setAwaitingAcknowledge(true);
      const t = setTimeout(() => setPulse(false), 1200);
      return () => clearTimeout(t);
    }
    prevBalance.current = balance.s33d;
  }, [balance.s33d]);

  // Listen for explicit "hearts earned/available" signals — covers the case
  // where the balance hook hasn't refreshed yet but rewards have flowed.
  useEffect(() => {
    const onEarned = () => setAwaitingAcknowledge(true);
    window.addEventListener("s33d-hearts-earned", onEarned as EventListener);
    return () => window.removeEventListener("s33d-hearts-earned", onEarned as EventListener);
  }, []);

  // Safety cap so the glow never runs forever if the user ignores it.
  useEffect(() => {
    if (!awaitingAcknowledge) return;
    const t = setTimeout(() => setAwaitingAcknowledge(false), 60_000);
    return () => clearTimeout(t);
  }, [awaitingAcknowledge]);

  // Listen for global request to open the jar (from HeartbeatNotification taps).
  useEffect(() => {
    const open = () => {
      setOpen(true);
      setAwaitingAcknowledge(false);
    };
    window.addEventListener("s33d-open-heart-jar", open as EventListener);
    return () => window.removeEventListener("s33d-open-heart-jar", open as EventListener);
  }, []);

  // Lock background scroll while the jar overlay is open (mobile portrait fix).
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevOverscroll = body.style.overscrollBehavior;
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "contain";
    return () => {
      body.style.overflow = prevOverflow;
      body.style.overscrollBehavior = prevOverscroll;
    };
  }, [open]);

  // Focus trap: when the jar opens, move focus into the panel and cycle Tab
  // within it. Restore focus to the trigger when it closes. Escape closes.
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = (document.activeElement as HTMLElement) ?? null;

    const getFocusable = (): HTMLElement[] => {
      const root = panelRef.current;
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null);
    };

    // Move focus to first focusable inside the panel after mount/animation.
    const focusTimer = window.setTimeout(() => {
      const focusables = getFocusable();
      (focusables[0] ?? panelRef.current)?.focus();
    }, 60);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = getFocusable();
      if (focusables.length === 0) {
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panelRef.current?.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panelRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKey);
      // Restore focus to trigger (or last focused element) on close.
      const restore = triggerRef.current ?? lastFocusedRef.current;
      restore?.focus?.();
    };
  }, [open]);

  /**
   * Tap handler — let the jar animate in place BEFORE the overlay covers it.
   * Sequence: tap → jar pulse/burst (~280ms) → sheet slides up.
   * Fixes the bug where the modal overlay rendered over the jar so users
   * never saw their action register.
   */
  const handleTap = () => {
    if (open) return;
    if (navigator.vibrate) navigator.vibrate(20);
    setTapPulse(true);
    setAwaitingAcknowledge(false);
    window.setTimeout(() => {
      setOpen(true);
      window.setTimeout(() => setTapPulse(false), 400);
    }, 280);
  };

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
      <motion.button
        ref={triggerRef}
        onClick={handleTap}
        animate={
          tapPulse
            ? { scale: [1, 1.18, 1] }
            : awaitingAcknowledge
            ? { scale: [1, 1.06, 1] }
            : { scale: 1 }
        }
        transition={
          tapPulse
            ? { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }
            : awaitingAcknowledge
            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.3 }
        }
        className={`relative group flex items-center gap-1.5 px-2 py-1 md:px-2.5 md:py-1.5 rounded-full border transition-all ${className}`}
        style={{
          borderColor: tapPulse || awaitingAcknowledge
            ? "hsl(var(--primary) / 0.65)"
            : "hsl(var(--primary) / 0.2)",
          background: "hsl(var(--card) / 0.6)",
          backdropFilter: "blur(8px)",
          boxShadow: tapPulse
            ? "0 0 24px hsl(var(--primary) / 0.45)"
            : awaitingAcknowledge
            ? "0 0 18px hsl(var(--primary) / 0.55)"
            : undefined,
        }}
        aria-label={
          awaitingAcknowledge
            ? "Open Heart Jar — new hearts have arrived"
            : "Open Heart Jar — your living balances"
        }
      >
        {/* Sustained glow ring while hearts await acknowledgement */}
        {awaitingAcknowledge && !tapPulse && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 0 2px hsl(var(--primary) / 0.45)" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* Small "new" dot */}
        {awaitingAcknowledge && (
          <motion.span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ background: "hsl(var(--primary))", boxShadow: "0 0 8px hsl(var(--primary) / 0.8)" }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
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
      </motion.button>

      {/* Panel overlay — portaled to body so it escapes any transformed/clipped ancestor */}
      {createPortal(
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
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Heart Jar"
                tabIndex={-1}
                className="fixed left-0 right-0 z-[9999] flex flex-col rounded-t-2xl border-t outline-none"
                style={{
                  bottom: 0,
                  maxHeight: "min(85dvh, calc(100dvh - env(safe-area-inset-top, 0px) - 24px))",
                  borderColor: "hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                drag="y"
                dragListener={false}
                dragControls={dragControls}
                dragDirectionLock
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 120 || info.velocity.y > 600) setOpen(false);
                }}
              >
                {/* Drag handle — swipe down to dismiss */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Drag handle — swipe down to close Heart Jar"
                  onPointerDown={(e) => dragControls.start(e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "Escape") {
                      e.preventDefault();
                      setOpen(false);
                    }
                  }}
                  className="flex flex-col items-center justify-center pt-2.5 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-t-2xl"
                  style={{ touchAction: "none" }}
                >
                  <div
                    className="w-12 h-1.5 rounded-full transition-colors"
                    style={{ background: "hsl(var(--muted-foreground) / 0.35)" }}
                  />
                  <span className="sr-only">Swipe down to close</span>
                </div>

                {/* Header — also acts as a drag zone (but only when starting on empty area, not on buttons) */}
                <div
                  className="px-5 pb-1 flex items-center justify-between shrink-0 touch-none"
                  onPointerDown={(e) => {
                    // Only initiate drag from non-interactive areas of the header.
                    const target = e.target as HTMLElement;
                    if (target.closest("button, a, input, [role='button']")) return;
                    dragControls.start(e);
                  }}
                >
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
                      aria-label="Close Heart Jar"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Scrollable content */}
                <div
                  className="px-5 pt-2 overflow-y-auto overscroll-contain flex-1"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
                  }}
                >
                  <HeartJarOverview userId={userId!} hearts={balance.s33d} />

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
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default HeartJar;
