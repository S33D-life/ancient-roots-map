/**
 * MapHeartBadge — floating S33D Heart balance on the /map route.
 * Subtle, non-blocking, mobile-friendly.
 * Tapping opens /vault.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHeartEconomy } from "@/hooks/use-heart-economy";

const MapHeartBadge = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const { balance } = useHeartEconomy(userId);
  const hearts = balance.s33d;

  // Listen for heart-earned events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const amount = e.detail?.amount;
      if (typeof amount === "number" && amount > 0) {
        setDelta(amount);
        setTimeout(() => setDelta(null), 2500);
      }
    };
    window.addEventListener("s33d-hearts-earned", handler as EventListener);
    return () => window.removeEventListener("s33d-hearts-earned", handler as EventListener);
  }, []);

  // Don't show for logged-out users
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
      <Heart className="w-3.5 h-3.5 text-primary fill-primary/30" />
      <span className="text-xs font-serif text-foreground tabular-nums">{hearts}</span>

      {/* Delta pulse */}
      <AnimatePresence>
        {delta !== null && (
          <motion.span
            key={delta}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: -8 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 1.5 }}
            className="absolute -top-3 right-0 text-[10px] font-serif text-primary font-medium"
          >
            +{delta}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default MapHeartBadge;
