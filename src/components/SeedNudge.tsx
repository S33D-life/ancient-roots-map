/**
 * SeedNudge — a gentle contextual prompt inviting users to plant a seed.
 * Appears near trees, after tree creation, or after check-in.
 * Non-intrusive, easy to dismiss, easy to act on.
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
  /** Context label for the invitation copy */
  context?: "new_tree" | "checkin" | "proximity";
  /** Called after dismissal or planting */
  onDismiss?: () => void;
  className?: string;
}

const DISMISSED_KEY = "s33d-seed-nudge-dismissed";

/** Check if nudge was dismissed for a tree in this session */
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
    message: "Plant a seed here as your first offering?",
    sub: "A small act of reciprocity for this new Ancient Friend.",
  },
  checkin: {
    message: "Would you like to plant a seed at this tree?",
    sub: "Your seed carries 33 hearts — blooming for a future wanderer.",
  },
  proximity: {
    message: "You're near an Ancient Friend.",
    sub: "Would you like to plant a seed here?",
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

  // Don't render if: no user, no seeds, no coords, dismissed, or already planted
  if (!userId || seedsRemaining <= 0 || !treeLat || !treeLng || !visible) return null;

  const copy = CONTEXT_COPY[context];

  return (
    <>
      <SeedBurst active={showBurst} />
      <AnimatePresence>
        {!planted && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`relative rounded-xl overflow-hidden ${className}`}
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--accent) / 0.04))",
              border: "1px solid hsl(var(--primary) / 0.15)",
            }}
          >
            {/* Dismiss button */}
            <button
              onClick={dismiss}
              className="absolute top-2 right-2 p-1 rounded-full transition-colors hover:bg-muted/30"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground/50" />
            </button>

            <div className="flex items-start gap-3 p-3.5 pr-8">
              {/* Seed icon with glow */}
              <motion.div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent)",
                  border: "1px solid hsl(var(--primary) / 0.2)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 0 0 hsl(var(--primary) / 0.1)",
                    "0 0 12px 2px hsl(var(--primary) / 0.15)",
                    "0 0 0 0 hsl(var(--primary) / 0.1)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sprout className="w-4.5 h-4.5 text-primary" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-foreground/90 leading-snug">
                  {copy.message}
                </p>
                <p className="text-[11px] font-serif text-muted-foreground mt-0.5 leading-snug">
                  {copy.sub}
                </p>
                <p className="text-[10px] font-serif text-muted-foreground/60 mt-1">
                  {seedsRemaining} seed{seedsRemaining !== 1 ? "s" : ""} remaining today
                </p>

                <div className="flex items-center gap-2 mt-2.5">
                  <Button
                    size="sm"
                    className="h-8 text-xs font-serif gap-1.5 px-3"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary) / 0.85), hsl(var(--primary)))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                    disabled={planting}
                    onClick={handlePlant}
                  >
                    {planting ? (
                      <motion.div
                        className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Sprout className="w-3.5 h-3.5" />
                    )}
                    Plant Seed
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-serif text-muted-foreground/60"
                    onClick={dismiss}
                  >
                    Not now
                  </Button>
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
