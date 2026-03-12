/**
 * HeartSpendConfirm — Confirmation dialog before spending hearts.
 * Shows cost, balance, remaining. Prompts earn/purchase if insufficient.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, AlertTriangle, Sparkles, ArrowRight, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useHeartEconomy } from "@/hooks/use-heart-economy";
import { toast } from "sonner";
import type { HeartTransactionType } from "@/lib/heart-economy-types";

interface Props {
  userId: string;
  cost: number;
  actionLabel: string;
  transactionType: HeartTransactionType;
  entityType?: string;
  entityId?: string;
  open: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

const HeartSpendConfirm = ({
  userId, cost, actionLabel, transactionType,
  entityType, entityId, open, onClose, onConfirmed,
}: Props) => {
  const { balance, spend, checkSpend } = useHeartEconomy(userId);
  const [spending, setSpending] = useState(false);
  const [canAfford, setCanAfford] = useState(true);

  useEffect(() => {
    if (open) {
      checkSpend(cost).then(r => setCanAfford(r.allowed));
    }
  }, [open, cost, checkSpend]);

  const handleConfirm = async () => {
    setSpending(true);
    try {
      const result = await spend({
        amount: cost,
        transactionType,
        entityType,
        entityId,
      });
      if (result) {
        toast(`💛 ${cost} Hearts spent`, { description: actionLabel, duration: 3000 });
        onConfirmed();
        onClose();
      } else {
        toast.error("Could not complete — check your balance", { duration: 3000 });
      }
    } catch {
      toast.error("Something went wrong", { duration: 3000 });
    } finally {
      setSpending(false);
    }
  };

  const remaining = balance.s33d - cost;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  <h3 className="font-serif text-base text-foreground">Spend Hearts</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary/40">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Action */}
              <div className="text-center py-2">
                <p className="text-sm font-serif text-foreground">{actionLabel}</p>
                <p className="text-2xl font-serif font-bold text-primary mt-1">
                  {cost} <span className="text-sm font-normal text-muted-foreground">Hearts</span>
                </p>
              </div>

              {/* Balance summary */}
              <div className="space-y-1.5 text-xs font-serif">
                <div className="flex justify-between text-muted-foreground">
                  <span>Current balance</span>
                  <span className="text-foreground tabular-nums">{balance.s33d.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Cost</span>
                  <span className="text-destructive tabular-nums">-{cost}</span>
                </div>
                <div className="border-t border-border/30 pt-1.5 flex justify-between font-bold">
                  <span className="text-foreground">Remaining</span>
                  <span className={`tabular-nums ${remaining >= 0 ? "text-primary" : "text-destructive"}`}>
                    {remaining >= 0 ? remaining.toLocaleString() : "Insufficient"}
                  </span>
                </div>
              </div>

              {/* Insufficient balance */}
              {!canAfford && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-xs font-serif text-foreground">
                      You need {Math.abs(remaining)} more Hearts
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/how-hearts-work"
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-border/30 text-[10px] font-serif text-muted-foreground hover:text-foreground transition-colors"
                      onClick={onClose}
                    >
                      <Sparkles className="w-3 h-3" /> Earn Hearts
                    </Link>
                  </div>
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={!canAfford || spending}
                className="w-full py-3 rounded-xl font-serif text-sm text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {spending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Confirm · {cost} Hearts
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HeartSpendConfirm;
