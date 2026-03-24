/**
 * MapHeartBadge — floating S33D Heart balance on the /map route.
 * Features heartbeat animation that batches incoming heart events
 * into a single growing pulse.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHeartEconomy } from "@/hooks/use-heart-economy";

const BATCH_WINDOW = 1500; // ms to accumulate incoming hearts
const FADE_DELAY = 1200;   // ms after last event before fading

const MapHeartBadge = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [batchTotal, setBatchTotal] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showDelta, setShowDelta] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const pulseCountRef = useRef(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const { balance } = useHeartEconomy(userId);
  const hearts = balance.s33d;

  // Batching listener — accumulates hearts and pulses
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const amount = e.detail?.amount;
      if (typeof amount !== "number" || amount <= 0) return;

      // Accumulate
      setBatchTotal((prev) => prev + amount);
      setShowDelta(true);
      setIsPulsing(true);
      pulseCountRef.current += 1;

      // Reset fade timer
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        setShowDelta(false);
        setIsPulsing(false);
        // Clear batch after fade-out completes
        setTimeout(() => setBatchTotal(0), 500);
      }, FADE_DELAY);
    };

    window.addEventListener("s33d-hearts-earned", handler as EventListener);
    return () => {
      window.removeEventListener("s33d-hearts-earned", handler as EventListener);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  if (!userId) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      onClick={() => navigate("/vault")}
      className="absolute bottom-20 right-3 z-[15] flex items-center gap-1.5 px-3 py-1.5 rounded-full
        bg-card/80 border border-border/30 backdrop-blur-md shadow-lg
        hover:bg-card/95 transition-colors cursor-pointer min-h-[36px]"
      aria-label="Open Heart Vault"
    >
      {/* Heart icon with pulse */}
      <motion.span
        animate={isPulsing ? {
          scale: [1, 1.3, 1],
          filter: [
            "drop-shadow(0 0 0px hsl(var(--primary) / 0))",
            "drop-shadow(0 0 8px hsl(var(--primary) / 0.6))",
            "drop-shadow(0 0 2px hsl(var(--primary) / 0.15))",
          ],
        } : { scale: 1, filter: "drop-shadow(0 0 0px hsl(var(--primary) / 0))" }}
        transition={isPulsing ? {
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          repeat: Infinity,
          repeatDelay: 0.3,
        } : { duration: 0.3 }}
        className="inline-flex"
      >
        <Heart className={`w-3.5 h-3.5 transition-colors duration-300 ${isPulsing ? "text-primary fill-primary/50" : "text-primary fill-primary/30"}`} />
      </motion.span>

      {/* Balance number */}
      <span className="text-xs font-serif text-foreground tabular-nums">{hearts}</span>

      {/* Batched delta with smooth counting */}
      <AnimatePresence>
        {showDelta && batchTotal > 0 && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.8 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -top-3 right-0 text-[11px] font-serif text-primary font-medium"
          >
            <motion.span
              key={batchTotal}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="inline-block"
            >
              +{batchTotal}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>

      {/* Ripple ring on pulse */}
      <AnimatePresence>
        {isPulsing && (
          <motion.span
            key="ripple"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", repeat: Infinity, repeatDelay: 0.5 }}
            className="absolute inset-0 rounded-full border border-primary/30 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default MapHeartBadge;
