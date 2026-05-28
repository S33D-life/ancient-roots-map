/**
 * TreeSeedsHeartsSection — unified Seeds & Hearts action panel.
 *
 * One living card combining the three core gestures of presence at a tree:
 *   1. Plant Seed   — sow a 33-heart seed beneath this tree (24h bloom)
 *   2. Hang Hearts  — plant hearts into the tree's roots, growing while away
 *   3. Collect      — gather hearts the reservoir has released for visitors
 *
 * Replaces the older split between the poetic "Seeds & Hearts" header card
 * and the separate "Plant hearts at this tree" arrival prompt. Keeps the
 * dark forest / gold / manuscript styling and the ceremonial copy.
 *
 * Heart/root sub-flows reuse the existing hooks (useHeartCollection,
 * useTreeRooting) and modals (PlantHeartsModal) — Plant Seed expands the
 * full SeedPlanter (with GPS, override, receipts) inline when chosen.
 */
import { lazy, Suspense, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Heart, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { hapticTap, hapticSuccess } from "@/lib/haptics";
import { useHeartCollection } from "@/hooks/use-heart-collection";
import { useTreeRooting, PlantHeartsRefused } from "@/hooks/use-tree-rooting";
import { canCollect } from "@/utils/heartPoolState";
import PlantHeartsModal from "@/components/PlantHeartsModal";

const SeedPlanter = lazy(() => import("@/components/SeedPlanter"));
const TreeHeartPool = lazy(() => import("@/components/TreeHeartPool"));

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
  const [seedOpen, setSeedOpen] = useState(false);
  const [plantModalOpen, setPlantModalOpen] = useState(false);

  const heartCollection = useHeartCollection(treeId, userId, isNearby || isCheckedIn);
  const rooting = useTreeRooting(userId, treeId, {
    isNearby,
    isCheckedIn,
    hasVisited: true,
  });

  const canGather = canCollect(heartCollection.state);
  const isCollecting = heartCollection.state === "collecting";
  const hasReservoir = !!heartCollection.pool && heartCollection.pool.totalHearts > 0;
  const canSeed = !!userId && treeLat != null && treeLng != null;
  const canHang = !!userId && rooting.canPlant;

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

  const handleHang = useCallback(async (amount: number) => {
    hapticTap();
    try {
      const result = await rooting.plant({ amount, speciesKey: treeSpecies || undefined });
      if (result) {
        hapticSuccess();
        toast.success("Your hearts are now growing here", { icon: "🌱" });
        setPlantModalOpen(false);
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
  }, [rooting, treeSpecies, treeName]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card/60 to-accent/[0.04] backdrop-blur-sm"
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
            sublabel={canSeed ? (seedOpen ? "Tap to close" : "Sow a seed") : "Sign in"}
            icon={<Sprout className="w-4 h-4" />}
            tone="seed"
            active={seedOpen}
            disabled={!canSeed}
            onClick={() => setSeedOpen((s) => !s)}
            trailing={canSeed ? <ChevronDown className={`w-3 h-3 transition-transform ${seedOpen ? "rotate-180" : ""}`} /> : null}
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
            disabled={!canHang && !rooting.root}
            onClick={() => setPlantModalOpen(true)}
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
            disabled={!canGather || isCollecting}
            onClick={handleGather}
          />
        </div>
      </div>

      {/* Inline Plant-Seed flow (full SeedPlanter UI w/ GPS + receipt) */}
      <AnimatePresence initial={false}>
        {seedOpen && canSeed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 pt-1 pb-2">
              <Suspense fallback={null}>
                <SeedPlanter
                  treeId={treeId}
                  treeLat={treeLat}
                  treeLng={treeLng}
                  userId={userId}
                  treeSpecies={treeSpecies || undefined}
                />
              </Suspense>
            </div>
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

      {/* Plant Hearts modal */}
      {userId && (
        <PlantHeartsModal
          open={plantModalOpen}
          onClose={() => setPlantModalOpen(false)}
          onPlant={handleHang}
          userId={userId}
          treeName={treeName}
          isPlanting={rooting.isPlanting}
          existingAmount={rooting.root?.amount}
        />
      )}
    </motion.section>
  );
};

/* ─────────────────────────────────────────────────────────── */

interface ActionButtonProps {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  tone: "seed" | "hang" | "collect";
  active?: boolean;
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

function ActionButton({ label, sublabel, icon, tone, active, disabled, onClick, trailing }: ActionButtonProps) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all
        ${disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"}
        ${active ? "ring-1" : "ring-0"}`}
      style={{
        background: t.bg,
        border: `1px solid ${t.ring}`,
        // @ts-expect-error css var
        "--tw-ring-color": t.ring,
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
