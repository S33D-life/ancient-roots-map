import { useEffect } from "react";
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
 * RewardReceipt — mobile-first bottom sheet so the reward is
 * instantly visible above the fold after submission.
 * On ≥sm screens it floats as a centered card.
 */
const RewardReceipt = ({
  visible, onClose, s33dHearts = 0, speciesHearts = 0,
  speciesFamily, influence = 0, actionLabel = "Action",
}: RewardReceiptProps) => {
  const hive = speciesFamily ? getHiveInfo(speciesFamily) : null;
  const totalHearts = s33dHearts + speciesHearts;

  // Lock background scroll while the sheet is open
  useEffect(() => {
    if (!visible || totalHearts === 0) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible, totalHearts]);

  if (!visible || totalHearts === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative w-full sm:max-w-sm bg-card border border-border shadow-2xl overflow-hidden
                       rounded-t-2xl sm:rounded-2xl
                       max-h-[85dvh] sm:max-h-[80vh]
                       flex flex-col"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header glow */}
            <div
              className="h-1 shrink-0"
              style={{
                background: `linear-gradient(90deg, transparent, hsl(42 80% 50%), transparent)`,
              }}
            />

            {/* Scrollable inner content — hero stays pinned to top */}
            <div className="relative px-6 pt-5 pb-6 text-center overflow-y-auto">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* HERO — always visible above the fold */}
              <motion.div
                className="flex items-center justify-center gap-2 mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
              >
                <Heart className="w-7 h-7 text-primary fill-primary/20" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <span className="text-4xl font-serif font-bold text-primary tabular-nums">+{totalHearts}</span>
                <p className="text-sm text-muted-foreground font-serif mt-1">S33D Hearts earned</p>
              </motion.div>

              <motion.p
                className="text-xs text-muted-foreground/60 font-serif mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {actionLabel}
              </motion.p>

              {/* Subtle breakdown — only shown if multiple sources */}
              {speciesHearts > 0 && hive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 flex items-center justify-center gap-3 text-[10px] font-serif text-muted-foreground/50"
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

              {/* Journey connections */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 space-y-2"
              >
                {/* Hive link */}
                {hive && (
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
                )}

                {/* Ecosystem connections — subtle */}
                <div className="flex gap-2 justify-center pt-1">
                  <Link
                    to="/vault"
                    onClick={onClose}
                    className="text-[10px] font-serif text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                  >
                    ❤️ View in Vault
                  </Link>
                  <span className="text-muted-foreground/20">·</span>
                  <Link
                    to="/value-tree"
                    onClick={onClose}
                    className="text-[10px] font-serif text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                  >
                    🌳 Value Tree
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardReceipt;
