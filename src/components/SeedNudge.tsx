/**
 * SeedNudge — a place-aware encounter card inviting users to plant a seed.
 * Designed as a rooted ritual moment, not a generic overlay.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import SeedBurst from "@/components/SeedBurst";

interface SeedNudgeProps {
  treeId: string;
  treeName: string;
  treeLat: number | null;
  treeLng: number | null;
  userId: string | null;
  context?: "new_tree" | "checkin" | "proximity";
  onDismiss?: () => void;
  className?: string;
}

const DISMISSED_KEY = "s33d-seed-nudge-dismissed";

function wasDismissed(treeId: string): boolean {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const set: string[] = JSON.parse(raw);
    return set.includes(treeId);
  } catch {
    return false;
  }
}

function markDismissed(treeId: string) {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(treeId)) set.push(treeId);
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(set.slice(-50)));
  } catch { /* ignore */ }
}

const CONTEXT_COPY = {
  new_tree: {
    label: "First Offering",
    message: "Plant a seed here as your first offering?",
    sub: "A small act of reciprocity for this new Ancient Friend.",
  },
  checkin: {
    label: "Planting Range Reached",
    message: "You're close enough to plant a seed here.",
    sub: "Seeds planted today may bloom into hearts tomorrow.",
  },
  proximity: {
    label: "Planting Range Reached",
    message: "You're close enough to plant a seed here.",
    sub: "Seeds planted today may bloom into hearts tomorrow.",
  },
};

const SeedNudge = ({
  treeId,
  treeName,
  treeLat,
  treeLng,
  userId,
  context = "proximity",
  onDismiss,
  className = "",
}: SeedNudgeProps) => {
  const { seedsRemaining, plantSeed } = useSeedEconomy(userId);
  const [visible, setVisible] = useState(() => !wasDismissed(treeId));
  const [planting, setPlanting] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [planted, setPlanted] = useState(false);

  const dismiss = useCallback(() => {
    markDismissed(treeId);
    setVisible(false);
    onDismiss?.();
  }, [treeId, onDismiss]);

  const handlePlant = useCallback(async () => {
    if (!treeLat || !treeLng) return;
    setPlanting(true);
    const ok = await plantSeed(treeId, treeLat, treeLng);
    setPlanting(false);

    if (ok) {
      setShowBurst(true);
      setPlanted(true);
      toast.success("🌱 Seed planted! It carries 33 hearts.");
      setTimeout(() => {
        setShowBurst(false);
        dismiss();
      }, 2200);
    } else {
      if (seedsRemaining <= 0) {
        toast.error("No seeds remaining today.");
      } else {
        toast.error("Move closer to this tree to plant a seed.");
      }
    }
  }, [treeId, treeLat, treeLng, plantSeed, seedsRemaining, dismiss]);

  if (!userId || seedsRemaining <= 0 || !treeLat || !treeLng || !visible) return null;

  const copy = CONTEXT_COPY[context];

  return (
    <>
      <SeedBurst visible={showBurst} />
      <AnimatePresence>
        {!planted && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={`relative rounded-2xl overflow-hidden ${className}`}
            style={{
              background: "linear-gradient(160deg, hsl(120 18% 14%), hsl(30 14% 12%))",
              border: "1px solid hsl(42 55% 45% / 0.35)",
              boxShadow: "0 8px 32px -8px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(42 55% 45% / 0.08)",
            }}
          >
            {/* Gold accent bar */}
            <div
              className="h-[2px]"
              style={{
                background: "linear-gradient(90deg, transparent 5%, hsl(42 60% 50% / 0.5) 30%, hsl(42 60% 50% / 0.6) 50%, hsl(42 60% 50% / 0.5) 70%, transparent 95%)",
              }}
            />

            {/* Dismiss button */}
            <button
              onClick={dismiss}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full transition-colors hover:bg-white/5"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" style={{ color: "hsl(42 20% 60% / 0.5)" }} />
            </button>

            <div className="flex items-start gap-3.5 p-4 pr-9">
              {/* Seed icon with heartbeat glow */}
              <motion.div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: "radial-gradient(circle, hsl(42 60% 50% / 0.12), transparent 70%)",
                  border: "1px solid hsl(42 55% 45% / 0.25)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 0 0 hsl(42 60% 50% / 0.05)",
                    "0 0 16px 4px hsl(42 60% 50% / 0.12)",
                    "0 0 0 0 hsl(42 60% 50% / 0.05)",
                  ],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sprout className="w-5 h-5" style={{ color: "hsl(42 60% 55%)" }} />
              </motion.div>

              <div className="flex-1 min-w-0">
                {/* Top label */}
                <p
                  className="text-[10px] font-serif uppercase tracking-[0.12em] mb-1"
                  style={{ color: "hsl(42 50% 55% / 0.8)" }}
                >
                  {copy.label}
                </p>

                {/* Main message */}
                <p
                  className="text-[15px] font-serif leading-snug font-medium"
                  style={{ color: "hsl(40 30% 88%)" }}
                >
                  {copy.message}
                </p>

                {/* Tree context anchor */}
                {treeName && (
                  <p
                    className="text-[11px] font-serif mt-1 leading-snug"
                    style={{ color: "hsl(35 20% 60% / 0.7)" }}
                  >
                    Offering to: {treeName}
                  </p>
                )}

                {/* Supporting line */}
                <p
                  className="text-[11px] font-serif mt-1.5 leading-relaxed italic"
                  style={{ color: "hsl(35 18% 65% / 0.75)" }}
                >
                  {copy.sub}
                </p>

                {/* Seeds remaining */}
                <p
                  className="text-[10px] font-serif mt-1"
                  style={{ color: "hsl(35 15% 55% / 0.5)" }}
                >
                  {seedsRemaining} seed{seedsRemaining !== 1 ? "s" : ""} remaining today
                </p>

                {/* CTAs */}
                <div className="flex items-center gap-3 mt-3.5">
                  <Button
                    size="sm"
                    className="h-9 text-[13px] font-serif font-medium gap-2 px-5 rounded-lg border-0 transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(135deg, hsl(42 65% 48%), hsl(38 60% 42%))",
                      color: "hsl(30 15% 10%)",
                      boxShadow: "0 2px 12px -2px hsl(42 60% 45% / 0.35)",
                    }}
                    disabled={planting}
                    onClick={handlePlant}
                  >
                    {planting ? (
                      <motion.div
                        className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Sprout className="w-4 h-4" />
                    )}
                    Plant a Seed
                  </Button>
                  <button
                    className="text-[12px] font-serif transition-colors duration-200 hover:brightness-125"
                    style={{ color: "hsl(35 15% 55% / 0.45)" }}
                    onClick={dismiss}
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SeedNudge;
export { wasDismissed, markDismissed };
