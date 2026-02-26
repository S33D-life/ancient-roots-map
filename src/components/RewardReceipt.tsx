import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ChevronRight } from "lucide-react";
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

/**
 * RewardReceipt — simplified to show a single Heart total.
 * Species Hearts and Influence are tracked internally but
 * presented only as subtle secondary info, not separate rows.
 */
const RewardReceipt = ({
  visible, onClose, s33dHearts = 0, speciesHearts = 0,
  speciesFamily, influence = 0, actionLabel = "Action",
}: RewardReceiptProps) => {
  const hive = speciesFamily ? getHiveInfo(speciesFamily) : null;
  const totalHearts = s33dHearts + speciesHearts;

  if (!visible || totalHearts === 0) return null;

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

              <motion.div
                className="flex items-center justify-center gap-2 mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                <Heart className="w-8 h-8 text-primary fill-primary/20" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-4xl font-serif font-bold text-primary tabular-nums">+{totalHearts}</span>
                <p className="text-sm text-muted-foreground font-serif mt-1">Hearts earned</p>
              </motion.div>

              <motion.p
                className="text-xs text-muted-foreground/60 font-serif mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {actionLabel}
              </motion.p>

              {/* Subtle breakdown — only shown if multiple sources */}
              {speciesHearts > 0 && hive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 flex items-center justify-center gap-3 text-[10px] font-serif text-muted-foreground/50"
                >
                  <span>❤️ {s33dHearts} S33D</span>
                  <span>·</span>
                  <span>{hive.icon} {speciesHearts} {hive.displayName.replace(" Hive", "")}</span>
                  {influence > 0 && (
                    <>
                      <span>·</span>
                      <span>🛡️ {influence} Influence</span>
                    </>
                  )}
                </motion.div>
              )}

              {/* Journey connection — nudge to hive */}
              {hive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
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
