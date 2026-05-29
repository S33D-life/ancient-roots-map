/**
 * TreeSeedsHeartsSection — unified Seeds & Hearts action panel.
 *
 * One living card combining the three core gestures of presence at a tree:
 *   1. Plant Seed   — sow a 33-heart seed beneath this tree (24h bloom)
 *   2. Hang Hearts  — plant hearts into the tree's roots, growing while away
 *   3. Collect      — gather hearts the reservoir has released for visitors
 *
 * Both Plant Seed and Hang Hearts expand inline as ritual drawers — no
 * floating modals, no `fixed` overlays nested inside `backdrop-filter`
 * containing blocks (which caused the previous stacking collisions).
 * When one action is expanded, the sibling actions dim softly to bring
 * focus to the active gesture.
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Heart, Sparkles, Loader2, ChevronDown, Moon, X } from "lucide-react";
import { toast } from "sonner";
import { hapticTap, hapticSuccess } from "@/lib/haptics";
import { useHeartCollection } from "@/hooks/use-heart-collection";
import { useTreeRooting, PlantHeartsRefused } from "@/hooks/use-tree-rooting";
import { useHeartEconomy } from "@/hooks/use-heart-economy";
import { useLotteryStats, drawEmoji, drawLabel } from "@/hooks/use-lottery";
import { useCountdown } from "@/hooks/use-countdown";
import { canCollect } from "@/utils/heartPoolState";
import { Button } from "@/components/ui/button";

const SeedPlanter = lazy(() => import("@/components/SeedPlanter"));
const TreeHeartPool = lazy(() => import("@/components/TreeHeartPool"));

const QUICK_AMOUNTS = [1, 3, 11, 33];

type ActionKey = "seed" | "hang" | null;

interface Props {
  treeId: string;
  treeName?: string;
  treeLat: number | null;
  treeLng: number | null;
  treeSpecies: string | null;
  userId: string | null;
  isNearby?: boolean;
  isCheckedIn?: boolean;
}

const TreeSeedsHeartsSection = ({
  treeId,
  treeName = "this tree",
  treeLat,
  treeLng,
  treeSpecies,
  userId,
  isNearby = false,
  isCheckedIn = false,
}: Props) => {
  const [openAction, setOpenAction] = useState<ActionKey>(null);
  const [hangAmount, setHangAmount] = useState(3);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // When a drawer expands, gently scroll it fully into view so its contents
  // don't get clipped by surrounding UI on small screens.
  useEffect(() => {
    if (!openAction) return;
    const id = window.setTimeout(() => {
      const el = drawerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const bottomPad = 96; // leave room for bottom nav / safe area
      if (rect.bottom > vh - bottomPad || rect.top < 64) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 320); // wait for height animation (280ms) to settle
    return () => window.clearTimeout(id);
  }, [openAction]);

  const heartCollection = useHeartCollection(treeId, userId, isNearby || isCheckedIn);
  const rooting = useTreeRooting(userId, treeId, {
    isNearby,
    isCheckedIn,
    hasVisited: true,
  });
  const { balance } = useHeartEconomy(userId);
  const available = Math.max(0, balance.s33d - balance.locked);

  const canGather = canCollect(heartCollection.state);
  const isCollecting = heartCollection.state === "collecting";
  const hasReservoir = !!heartCollection.pool && heartCollection.pool.totalHearts > 0;
  const canSeed = !!userId && treeLat != null && treeLng != null;
  const canHang = !!userId && rooting.canPlant;
  const hasExisting = !!rooting.root && rooting.root.amount > 0;

  // Twin-moons yield hint (only visible while hang drawer is open)
  const { data: lotteryStats } = useLotteryStats();
  const yieldBps = lotteryStats?.nextDraw?.yield_bps ?? 330;
  const yieldPct = (yieldBps / 100).toFixed(1);
  const projected = hasExisting
    ? Math.floor(((rooting.root!.amount) * yieldBps) / 10000)
    : 0;
  const countdown = useCountdown(lotteryStats?.nextDraw?.scheduled_at ?? null);
  const drawEmojiChar = drawEmoji(lotteryStats?.nextDraw?.draw_type);
  const drawLabelText = drawLabel(lotteryStats?.nextDraw?.draw_type);

  const handleGather = useCallback(async () => {
    if (!canGather) return;
    hapticTap();
    const amount = await heartCollection.collect();
    if (amount && amount > 0) {
      hapticSuccess();
      toast.success(`${amount} hearts gathered from this tree`, { icon: "💚" });
      window.dispatchEvent(new CustomEvent("s33d-hearts-earned", { detail: { amount, source: "checkin" } }));
    } else if (amount === 0) {
      toast("No hearts ready to gather yet", { icon: "🌳" });
    } else {
      toast.error("Could not gather hearts");
    }
  }, [canGather, heartCollection]);

  const handleHang = useCallback(async () => {
    if (hangAmount < 1 || hangAmount > available) return;
    hapticTap();
    try {
      const result = await rooting.plant({ amount: hangAmount, speciesKey: treeSpecies || undefined });
      if (result) {
        hapticSuccess();
        toast.success("Your hearts are now growing here", { icon: "🌱" });
        setOpenAction(null);
      } else {
        toast.error("Couldn't hang hearts right now. Please try again.");
      }
    } catch (err: unknown) {
      if (err instanceof PlantHeartsRefused) {
        if (err.code === "insufficient_hearts" && err.required && err.balance !== undefined) {
          const need = Math.max(0, err.required - err.balance);
          toast.error(`You need ${need} more heart${need !== 1 ? "s" : ""} to hang ${err.required} at ${treeName}.`);
        } else {
          toast.error("Couldn't hang hearts right now. Please try again.");
        }
        return;
      }
      toast.error("Couldn't hang hearts right now. Please try again.");
    }
  }, [rooting, treeSpecies, treeName, hangAmount, available]);

  const toggle = (key: Exclude<ActionKey, null>) =>
    setOpenAction((prev) => (prev === key ? null : key));

  const anyOpen = openAction !== null;
  const dim = (key: Exclude<ActionKey, null>) => anyOpen && openAction !== key;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card/60 to-accent/[0.04]"
      style={{
        boxShadow:
          "inset 0 0 40px hsl(var(--primary) / 0.04), 0 4px 20px -8px hsl(var(--primary) / 0.15)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="relative">
            <Sprout className="w-4 h-4 text-primary/80" />
            <Heart className="w-2.5 h-2.5 text-primary absolute -right-1 -bottom-0.5 fill-primary/40" />
          </div>
          <h3 className="text-sm font-serif tracking-[0.18em] uppercase text-foreground/85">
            Seeds &amp; Hearts
          </h3>
          <span
            aria-hidden
            className="ml-auto text-[10px] font-serif italic text-muted-foreground/60"
          >
            life growing here
          </span>
        </div>
        <p className="text-[11px] font-serif italic text-muted-foreground/75 leading-relaxed">
          Plant seeds beneath this tree. Hang hearts in its branches. Collect the hearts that bloom.
        </p>
      </div>

      {/* Three primary actions */}
      <div className="px-3 sm:px-4 pb-2">
        <div className="grid grid-cols-3 gap-2">
          {/* Plant Seed */}
          <ActionButton
            label="Plant Seed"
            sublabel={canSeed ? (openAction === "seed" ? "Tap to close" : "Sow a seed") : "Sign in"}
            icon={<Sprout className="w-4 h-4" />}
            tone="seed"
            active={openAction === "seed"}
            dim={dim("seed")}
            disabled={!canSeed}
            onClick={() => toggle("seed")}
            trailing={canSeed ? <ChevronDown className={`w-3 h-3 transition-transform ${openAction === "seed" ? "rotate-180" : ""}`} /> : null}
          />

          {/* Hang Hearts */}
          <ActionButton
            label="Hang Hearts"
            sublabel={
              !userId
                ? "Sign in"
                : rooting.root
                ? `${rooting.root.amount} planted`
                : canHang
                ? "Grow while away"
                : "Visit to unlock"
            }
            icon={<Heart className="w-4 h-4" />}
            tone="hang"
            active={openAction === "hang"}
            dim={dim("hang")}
            disabled={!canHang && !rooting.root}
            onClick={() => toggle("hang")}
            trailing={(canHang || rooting.root) ? <ChevronDown className={`w-3 h-3 transition-transform ${openAction === "hang" ? "rotate-180" : ""}`} /> : null}
          />

          {/* Collect Hearts */}
          <ActionButton
            label="Collect Hearts"
            sublabel={
              isCollecting
                ? "Gathering…"
                : canGather && hasReservoir
                ? `${heartCollection.pool?.totalHearts ?? 0} ready`
                : hasReservoir
                ? "Come closer"
                : "Nothing blooming yet"
            }
            icon={
              isCollecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )
            }
            tone="collect"
            dim={anyOpen}
            disabled={!canGather || isCollecting}
            onClick={handleGather}
          />
        </div>
      </div>

      {/* Inline drawers — push content below downward naturally */}
      <AnimatePresence initial={false} mode="wait">
        {openAction === "seed" && canSeed && (
          <motion.div
            key="seed-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <DrawerShell tone="seed" onClose={() => setOpenAction(null)} title="Plant a Seed">
              <Suspense fallback={null}>
                <SeedPlanter
                  treeId={treeId}
                  treeLat={treeLat}
                  treeLng={treeLng}
                  userId={userId}
                  treeSpecies={treeSpecies || undefined}
                />
              </Suspense>
            </DrawerShell>
          </motion.div>
        )}

        {openAction === "hang" && userId && (
          <motion.div
            key="hang-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <DrawerShell
              tone="hang"
              onClose={() => setOpenAction(null)}
              title={hasExisting ? "Plant More Hearts" : "Hang Hearts at this Tree"}
            >
              <p className="text-[11px] font-serif italic text-muted-foreground/80 leading-relaxed">
                {hasExisting ? (
                  <>
                    You have <span className="text-foreground/85">{rooting.root!.amount}</span>{" "}
                    heart{rooting.root!.amount !== 1 ? "s" : ""} growing here. Plant more to deepen your roots.
                  </>
                ) : (
                  <>
                    Plant hearts at <span className="text-foreground/85">{treeName}</span>. They will
                    grow quietly while you're away.
                  </>
                )}
              </p>

              {/* Twin-moons yield hint */}
              <Link
                to="/lottery"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 transition-colors"
              >
                <Moon className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-[10px] font-serif text-muted-foreground/80 leading-snug">
                  {hasExisting && projected > 0 && !countdown.isPast ? (
                    <>
                      <span className="text-foreground/85 tabular-nums">~{projected}</span> hearts at{" "}
                      {drawEmojiChar} {drawLabelText} ·{" "}
                      <span className="tabular-nums">
                        in {countdown.days}d {String(countdown.hours).padStart(2, "0")}h
                      </span>
                    </>
                  ) : (
                    <>
                      Stake to earn <span className="text-foreground/85">{yieldPct}%</span> at every
                      moon
                    </>
                  )}
                </span>
              </Link>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {QUICK_AMOUNTS.filter((a) => a <= available).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setHangAmount(a)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-serif transition-all ${
                      hangAmount === a
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {available < 1 ? (
                <p className="text-[10px] text-muted-foreground/60 font-serif text-center py-2">
                  You need hearts to plant
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={1}
                    max={available}
                    value={hangAmount}
                    onChange={(e) =>
                      setHangAmount(
                        Math.max(1, Math.min(available, parseInt(e.target.value) || 1))
                      )
                    }
                    className="flex-1 bg-muted/20 border border-border/30 rounded-xl px-3 py-3 text-base font-serif text-foreground text-center focus:outline-none focus:border-primary/40 transition-colors"
                  />
                  <span className="text-[10px] text-muted-foreground/55 font-serif shrink-0">
                    of {available} available
                  </span>
                </div>
              )}

              <Button
                onClick={handleHang}
                disabled={
                  rooting.isPlanting || hangAmount < 1 || hangAmount > available || available < 1
                }
                className="w-full rounded-xl font-serif text-sm gap-2 bg-[hsl(140_35%_42%)] hover:bg-[hsl(140_35%_38%)] text-white disabled:opacity-40"
              >
                {rooting.isPlanting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Planting…
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5" />
                    Hang {hangAmount} heart{hangAmount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </DrawerShell>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reservoir progress — only when meaningful */}
      {hasReservoir && (
        <div className="px-3 sm:px-4 pb-4">
          <Suspense fallback={null}>
            <TreeHeartPool treeId={treeId} userId={userId} />
          </Suspense>
        </div>
      )}
    </motion.section>
  );
};

/* ─────────────────────────────────────────────────────────── */

interface DrawerShellProps {
  tone: "seed" | "hang";
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function DrawerShell({ tone, title, onClose, children }: DrawerShellProps) {
  const t = TONES[tone];
  return (
    <div className="px-3 sm:px-4 pt-1 pb-4">
      <div
        className="relative rounded-xl p-4 space-y-3"
        style={{
          background: `linear-gradient(180deg, ${t.bg}, hsl(var(--card) / 0.5))`,
          border: `1px solid ${t.ring}`,
          boxShadow: `0 0 24px -8px ${t.ring}, inset 0 1px 0 hsl(var(--foreground) / 0.04)`,
        }}
      >
        <div className="flex items-center justify-between">
          <h4
            className="text-xs font-serif tracking-[0.16em] uppercase"
            style={{ color: t.color }}
          >
            {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted/40 transition-colors text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  tone: "seed" | "hang" | "collect";
  active?: boolean;
  dim?: boolean;
  disabled?: boolean;
  onClick: () => void;
  trailing?: React.ReactNode;
}

const TONES: Record<ActionButtonProps["tone"], { color: string; bg: string; ring: string }> = {
  seed: {
    color: "hsl(90 35% 55%)",
    bg: "hsl(90 35% 45% / 0.10)",
    ring: "hsl(90 35% 45% / 0.30)",
  },
  hang: {
    color: "hsl(140 40% 55%)",
    bg: "hsl(140 40% 40% / 0.10)",
    ring: "hsl(140 40% 40% / 0.30)",
  },
  collect: {
    color: "hsl(42 70% 55%)",
    bg: "hsl(42 70% 45% / 0.10)",
    ring: "hsl(42 70% 45% / 0.30)",
  },
};

function ActionButton({ label, sublabel, icon, tone, active, dim, disabled, onClick, trailing }: ActionButtonProps) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all duration-300
        ${disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"}
        ${dim && !disabled ? "opacity-40" : ""}
        ${active ? "ring-1 scale-[1.01]" : "ring-0"}`}
      style={{
        background: t.bg,
        border: `1px solid ${t.ring}`,
        // @ts-expect-error css var
        "--tw-ring-color": t.ring,
        boxShadow: active ? `0 0 20px -6px ${t.ring}` : undefined,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: t.bg, color: t.color }}
      >
        {icon}
      </div>
      <div className="leading-tight">
        <div
          className="text-[11px] font-serif tracking-wide"
          style={{ color: t.color }}
        >
          {label}
        </div>
        <div className="text-[9px] font-serif italic text-muted-foreground/70 mt-0.5">
          {sublabel}
        </div>
      </div>
      {trailing && (
        <span className="absolute top-1.5 right-1.5 text-muted-foreground/50">{trailing}</span>
      )}
    </button>
  );
}

export default TreeSeedsHeartsSection;
