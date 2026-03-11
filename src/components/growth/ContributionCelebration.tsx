/**
 * ContributionCelebration — fullscreen celebration overlay for any contribution:
 * tree mapping, offerings, harvest entries.
 * Includes post-contribution navigation for the return loop.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Map, TreePine, Plus } from "lucide-react";
import type { CelebrationEvent } from "@/hooks/use-contribution-celebration";
import { useCelebrationMessage } from "@/hooks/use-contribution-celebration";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import { ROUTES } from "@/lib/routes";

const TYPE_META: Record<string, { emoji: string; title: string; hearts: string }> = {
  tree: { emoji: "🌳", title: "A New Ancient Friend", hearts: "+10 ❤️ S33D Hearts earned" },
  offering: { emoji: "✦", title: "An Offering Received", hearts: "+5 ❤️ S33D Hearts earned" },
  harvest: { emoji: "🍎", title: "Harvest Shared", hearts: "+3 ❤️ S33D Hearts earned" },
};

interface Props {
  event: CelebrationEvent;
  onComplete: () => void;
}

const ContributionCelebration = ({ event, onComplete }: Props) => {
  const [visible, setVisible] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const navigate = useNavigate();
  const meta = TYPE_META[event.type] || TYPE_META.tree;
  const message = useCelebrationMessage(event.type);
  const hive = event.species ? getHiveForSpecies(event.species) : null;

  useEffect(() => {
    const actionsTimer = setTimeout(() => setShowActions(true), 2200);
    const autoClose = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 12000);
    return () => { clearTimeout(actionsTimer); clearTimeout(autoClose); };
  }, [onComplete]);

  const close = () => { setVisible(false); onComplete(); };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="text-center space-y-4 px-6 max-w-sm"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.2 }}
          >
            <motion.div
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)",
                boxShadow: "0 0 60px 20px hsl(var(--primary) / 0.15)",
              }}
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
            >
              <span className="text-5xl">{meta.emoji}</span>
            </motion.div>

            <motion.h2
              className="text-2xl md:text-3xl font-serif tracking-wide text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {meta.title}
            </motion.h2>

            <motion.p
              className="text-lg font-serif text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {event.name}
            </motion.p>

            <motion.p
              className="text-sm text-muted-foreground/80 font-serif max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              {message}
            </motion.p>

            <motion.div
              className="flex items-center justify-center gap-2 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              <span className="text-primary font-serif">{meta.hearts}</span>
            </motion.div>

            {/* Post-contribution navigation — the return loop */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  className="space-y-2 pt-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-[10px] text-muted-foreground font-serif uppercase tracking-[0.15em]">
                    Continue your journey
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-serif text-xs gap-2 w-full"
                      onClick={() => { navigate(ROUTES.MAP); close(); }}
                    >
                      <Map className="w-3.5 h-3.5" /> Continue exploring the map
                    </Button>
                    {hive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-serif text-xs gap-2 w-full"
                        onClick={() => { navigate(ROUTES.HIVE(hive.slug)); close(); }}
                      >
                        <TreePine className="w-3.5 h-3.5" /> Visit the {hive.displayName}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-serif text-xs gap-2 w-full text-muted-foreground"
                      onClick={close}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add another contribution
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContributionCelebration;
