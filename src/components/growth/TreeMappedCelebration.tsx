/**
 * TreeMappedCelebration — fullscreen celebration overlay when a tree is mapped.
 * Shows a brief, beautiful celebration moment then auto-dismisses.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  treeName: string;
  species?: string;
  onComplete?: () => void;
}

const TreeMappedCelebration = ({ treeName, species, onComplete }: Props) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
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
          onClick={() => { setVisible(false); onComplete?.(); }}
        >
          <motion.div
            className="text-center space-y-4 px-6"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.2 }}
          >
            {/* Golden particle ring */}
            <motion.div
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle, hsl(45 80% 50% / 0.3), transparent 70%)",
                boxShadow: "0 0 60px 20px hsl(45 80% 50% / 0.15)",
              }}
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
            >
              <span className="text-5xl">🌳</span>
            </motion.div>

            <motion.h2
              className="text-2xl md:text-3xl font-serif tracking-wide text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              A New Ancient Friend
            </motion.h2>

            <motion.p
              className="text-lg font-serif text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {treeName}
            </motion.p>

            {species && (
              <motion.p
                className="text-sm text-muted-foreground font-serif italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                {species}
              </motion.p>
            )}

            <motion.p
              className="text-sm text-muted-foreground/80 font-serif max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              You have added a new Ancient Friend to the atlas. The grove grows stronger.
            </motion.p>

            {/* Hearts earned indicator */}
            <motion.div
              className="flex items-center justify-center gap-2 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
            >
              <span className="text-primary font-serif">+10 ❤️ S33D Hearts earned</span>
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

export default TreeMappedCelebration;
