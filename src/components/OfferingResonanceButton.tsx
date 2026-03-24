/**
 * OfferingResonanceButton — lightweight heart/glow toggle for offerings.
 * Users can resonate with an offering (one per user, toggle on/off).
 * Shows count + subtle glow when resonated.
 */
import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  offeringId: string;
  userId: string | null;
  initialCount?: number;
  compact?: boolean;
}

const OfferingResonanceButton = ({ offeringId, userId, initialCount = 0, compact = false }: Props) => {
  const [count, setCount] = useState(initialCount);
  const [resonated, setResonated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  // Check if user has already resonated
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("offering_resonances" as any)
      .select("id")
      .eq("offering_id", offeringId)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setResonated(true);
      });
  }, [offeringId, userId]);

  // Fetch current count
  useEffect(() => {
    supabase
      .from("offering_resonances" as any)
      .select("id", { count: "exact", head: true })
      .eq("offering_id", offeringId)
      .then(({ count: c }) => {
        if (typeof c === "number") setCount(c);
      });
  }, [offeringId]);

  const toggle = useCallback(async () => {
    if (!userId || loading) return;
    setLoading(true);

    if (resonated) {
      // Remove resonance
      await supabase
        .from("offering_resonances" as any)
        .delete()
        .eq("offering_id", offeringId)
        .eq("user_id", userId);
      setResonated(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      // Add resonance
      const { error } = await supabase
        .from("offering_resonances" as any)
        .insert({ offering_id: offeringId, user_id: userId } as any);
      if (!error) {
        setResonated(true);
        setCount((c) => c + 1);
        setPulsing(true);
        setTimeout(() => setPulsing(false), 800);
      }
    }

    setLoading(false);
  }, [userId, loading, resonated, offeringId]);

  return (
    <button
      onClick={toggle}
      disabled={!userId || loading}
      className={`relative inline-flex items-center gap-1 transition-all duration-300 ${
        compact ? "px-1.5 py-0.5" : "px-2 py-1"
      } rounded-full ${
        resonated
          ? "text-primary"
          : "text-muted-foreground/50 hover:text-primary/70"
      } ${!userId ? "opacity-40 cursor-default" : "cursor-pointer"}`}
      title={resonated ? "Remove resonance" : "Resonate with this offering"}
      aria-label={resonated ? "Remove resonance" : "Resonate"}
    >
      {/* Glow ring on pulse */}
      <AnimatePresence>
        {pulsing && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-primary/40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={pulsing ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        className="inline-flex"
      >
        <Heart
          className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} transition-all duration-300 ${
            resonated ? "fill-primary/50 drop-shadow-[0_0_4px_hsl(var(--primary)/0.4)]" : ""
          }`}
        />
      </motion.span>

      {count > 0 && (
        <span className={`${compact ? "text-[9px]" : "text-[10px]"} font-mono tabular-nums`}>
          {count}
        </span>
      )}
    </button>
  );
};

export default OfferingResonanceButton;
