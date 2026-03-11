/**
 * ContributionCelebration — fullscreen celebration overlay for any contribution:
 * tree mapping, offerings, harvest entries.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CelebrationEvent } from "@/hooks/use-contribution-celebration";
import { useCelebrationMessage } from "@/hooks/use-contribution-celebration";

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
  const meta = TYPE_META[event.type] || TYPE_META.tree;
  const message = useCelebrationMessage(event.type);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={() => { setVisible(false); onComplete(); }}
        >
          <motion.div
            className="text-center space-y-4 px-6"
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

            {event.species && (
              <motion.p
                className="text-sm text-muted-foreground font-serif italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                {event.species}
              </motion.p>
            )}

            <motion.p
              className="text-sm text-muted-foreground/80 font-serif max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              {message}
            </motion.p>

            <motion.div
              className="flex items-center justify-center gap-2 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
            >
              <span className="text-primary font-serif">{meta.hearts}</span>
            </motion.div>

            <motion.p
              className="text-xs text-muted-foreground/50 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              tap to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContributionCelebration;
