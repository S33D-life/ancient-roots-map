/**
 * WhisperRipple — a subtle glowing ripple animation
 * shown when a whisper is successfully sent through a tree.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Wind } from "lucide-react";

interface WhisperRippleProps {
  visible: boolean;
  onComplete?: () => void;
}

const WhisperRipple = ({ visible, onComplete }: WhisperRippleProps) => (
  <AnimatePresence onExitComplete={onComplete}>
    {visible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
      >
        {/* Expanding ripple rings */}
        {[0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            className="absolute rounded-full border"
            style={{ borderColor: "hsl(var(--primary) / 0.3)" }}
            initial={{ width: 20, height: 20, opacity: 0.6 }}
            animate={{
              width: 120 + ring * 60,
              height: 120 + ring * 60,
              opacity: 0,
            }}
            transition={{
              duration: 1.2,
              delay: ring * 0.2,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Center icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.15), transparent 70%)",
          }}
        >
          <Wind className="w-6 h-6 text-primary/70" />
        </motion.div>

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="absolute mt-24 text-sm font-serif text-primary/70"
        >
          🌬️ Whisper sent through the canopy
        </motion.p>
      </motion.div>
    )}
  </AnimatePresence>
);

export default WhisperRipple;
