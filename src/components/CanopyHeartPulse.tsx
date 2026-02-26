/**
 * CanopyHeartPulse — subtle, auto-fading feedback when a
 * proximity check-in occurs beneath a tree's canopy.
 *
 * Renders a translucent overlay with a blooming heart
 * and a whispered message, then fades away after 4 seconds.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useCanopyCheckIn } from "@/hooks/use-canopy-checkin";

const DISPLAY_MS = 4500;

const CanopyHeartPulse = () => {
  const { lastEvent, dismissEvent } = useCanopyCheckIn();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastEvent) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(dismissEvent, 600); // wait for exit anim
    }, DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [lastEvent, dismissEvent]);

  return (
    <AnimatePresence>
      {visible && lastEvent && (
        <motion.div
          key={lastEvent.timestamp}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed inset-0 z-[200] pointer-events-none flex items-end justify-center pb-28 md:pb-16"
        >
          <motion.div
            initial={{ y: 20, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 180 }}
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl pointer-events-auto"
            style={{
              background: "hsla(28, 20%, 10%, 0.85)",
              border: "1px solid hsla(42, 50%, 40%, 0.25)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px hsla(0, 0%, 0%, 0.4), 0 0 24px hsla(42, 70%, 45%, 0.08)",
            }}
          >
            {/* Heart bloom */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.3, 1], opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <Heart
                className="w-5 h-5 fill-current"
                style={{ color: "hsl(42, 80%, 55%)" }}
              />
            </motion.div>

            <div className="flex flex-col">
              <span
                className="font-serif text-xs italic leading-tight"
                style={{ color: "hsl(42, 60%, 65%)" }}
              >
                +{lastEvent.reward.s33dHearts + lastEvent.reward.speciesHearts} Hearts — the tree feels you nearby
              </span>
              <span
                className="font-serif text-[10px] tracking-wider mt-0.5"
                style={{ color: "hsl(42, 30%, 45%)" }}
              >
                {lastEvent.tree.name}
              </span>
            </div>

            {/* Subtle glow ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              style={{
                boxShadow: "inset 0 0 20px hsla(42, 70%, 50%, 0.15)",
                pointerEvents: "none",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CanopyHeartPulse;
