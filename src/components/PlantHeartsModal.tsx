/**
 * PlantHeartsModal — lightweight modal for planting hearts at a tree.
 * Quick-select amounts + numeric input. Calm, grounded tone.
 * Shows existing root context when planting more.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeartEconomy } from "@/hooks/use-heart-economy";

const QUICK_AMOUNTS = [1, 3, 11, 33];

interface PlantHeartsModalProps {
  open: boolean;
  onClose: () => void;
  onPlant: (amount: number) => Promise<void>;
  userId: string;
  treeName: string;
  isPlanting: boolean;
  existingAmount?: number; // hearts already planted at this tree
}

export default function PlantHeartsModal({
  open,
  onClose,
  onPlant,
  userId,
  treeName,
  isPlanting,
  existingAmount,
}: PlantHeartsModalProps) {
  const [amount, setAmount] = useState(3);
  const { balance } = useHeartEconomy(userId);
  const available = balance.s33d - balance.locked;
  const hasExisting = existingAmount && existingAmount > 0;

  const handlePlant = async () => {
    if (amount < 1 || amount > available) return;
    await onPlant(amount);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border) / 0.3)",
            boxShadow: "0 20px 60px -15px hsl(var(--foreground) / 0.15)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary/60" />
              <h3 className="text-sm font-serif text-foreground/90">
                {hasExisting ? "Plant More Hearts" : "Plant Hearts"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            <p className="text-xs font-serif text-muted-foreground/70">
              {hasExisting ? (
                <>
                  You have <span className="text-foreground/70">{existingAmount}</span> heart{existingAmount !== 1 ? "s" : ""} planted at{" "}
                  <span className="text-foreground/70">{treeName}</span>. Plant more to deepen your roots.
                </>
              ) : (
                <>
                  Plant hearts at <span className="text-foreground/70">{treeName}</span>. They will grow slowly while you're away.
                </>
              )}
            </p>

            {/* Quick select */}
            <div className="flex gap-2">
              {QUICK_AMOUNTS.filter((a) => a <= available).map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-serif transition-all ${
                    amount === a
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* No quick amounts available */}
            {available < 1 && (
              <p className="text-[10px] text-muted-foreground/60 font-serif text-center py-2">
                You need hearts to plant
              </p>
            )}

            {/* Custom input */}
            {available >= 1 && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={available}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Math.min(available, parseInt(e.target.value) || 1)))}
                  className="flex-1 bg-muted/20 border border-border/30 rounded-xl px-3 py-2.5 text-sm font-serif text-foreground text-center focus:outline-none focus:border-primary/40 transition-colors"
                />
                <span className="text-[10px] text-muted-foreground/50 font-serif shrink-0">
                  of {available} available
                </span>
              </div>
            )}

            {/* Plant button */}
            <Button
              onClick={handlePlant}
              disabled={isPlanting || amount < 1 || amount > available || available < 1}
              className="w-full rounded-xl font-serif text-sm gap-2"
              style={{
                background: available >= 1 ? "hsl(140 35% 42%)" : undefined,
                color: available >= 1 ? "white" : undefined,
              }}
            >
              {isPlanting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Planting…
                </>
              ) : (
                <>
                  <Sprout className="w-3.5 h-3.5" />
                  Plant {amount} heart{amount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}