import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, X, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getHiveInfo } from "@/utils/hiveUtils";

interface RewardReceiptProps {
  visible: boolean;
  onClose: () => void;
  s33dHearts?: number;
  speciesHearts?: number;
  speciesFamily?: string;
  influence?: number;
  actionLabel?: string;
}

const RewardReceipt = ({
  visible, onClose, s33dHearts = 0, speciesHearts = 0,
  speciesFamily, influence = 0, actionLabel = "Action",
}: RewardReceiptProps) => {
  const hive = speciesFamily ? getHiveInfo(speciesFamily) : null;

  if (!visible) return null;

  const rewards = [
    s33dHearts > 0 && { icon: "❤️", label: "S33D Hearts", amount: s33dHearts, color: "hsl(0, 65%, 55%)" },
    speciesHearts > 0 && hive && {
      icon: hive.icon,
      label: `${hive.displayName.replace(" Hive", "")} Hearts`,
      amount: speciesHearts,
      color: `hsl(${hive.accentHsl})`,
    },
    influence > 0 && { icon: "🛡️", label: "Influence", amount: influence, color: "hsl(42, 80%, 50%)" },
  ].filter(Boolean) as { icon: string; label: string; amount: number; color: string }[];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            initial={{ y: 40, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header glow */}
            <div
              className="h-1"
              style={{
                background: `linear-gradient(90deg, transparent, hsl(42 80% 50%), transparent)`,
              }}
            />

            <div className="p-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <motion.span
                className="text-4xl block mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                ✨
              </motion.span>

              <h3 className="text-lg font-serif text-foreground mb-1">Tokens Earned</h3>
              <p className="text-xs text-muted-foreground font-serif mb-5">{actionLabel}</p>

              <div className="space-y-3">
                {rewards.map((r, i) => (
                  <motion.div
                    key={r.label}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-secondary/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <span className="flex-1 text-sm font-serif text-foreground text-left">{r.label}</span>
                    <span className="text-lg font-serif font-bold tabular-nums" style={{ color: r.color }}>
                      +{r.amount}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Journey connection — nudge to hive or vault */}
              {hive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4"
                >
                  <Link
                    to={`/hive/${hive.slug}`}
                    onClick={onClose}
                    className="group flex items-center gap-2 p-2.5 rounded-lg border transition-colors text-left"
                    style={{
                      borderColor: `hsl(${hive.accentHsl} / 0.25)`,
                      background: `hsl(${hive.accentHsl} / 0.05)`,
                    }}
                  >
                    <span className="text-base">{hive.icon}</span>
                    <span className="flex-1 text-xs font-serif text-muted-foreground">
                      See your {hive.displayName} treasury
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardReceipt;
