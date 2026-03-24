/**
 * OfferingResonanceButton — lightweight heart/glow toggle for offerings.
 * "This moved me" — distinct from influence voting.
 */
import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      await supabase
        .from("offering_resonances" as any)
        .delete()
        .eq("offering_id", offeringId)
        .eq("user_id", userId);
      setResonated(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      const { error } = await supabase
        .from("offering_resonances" as any)
        .insert({ offering_id: offeringId, user_id: userId } as any);
      if (!error) {
        setResonated(true);
        setCount((c) => c + 1);
        setPulsing(true);
        setTimeout(() => setPulsing(false), 700);
      }
    }

    setLoading(false);
  }, [userId, loading, resonated, offeringId]);

  const button = (
    <button
      onClick={toggle}
      disabled={!userId || loading}
      className={`relative inline-flex items-center gap-1 transition-all duration-300 ${
        compact ? "px-1.5 py-0.5" : "px-2 py-1"
      } rounded-full ${
        resonated
          ? "text-primary"
          : "text-muted-foreground/40 hover:text-primary/60"
      } ${!userId ? "opacity-30 cursor-default" : "cursor-pointer"}`}
      aria-label={resonated ? "Remove resonance" : "This moved me"}
    >
      {/* Pulse ring */}
      <AnimatePresence>
        {pulsing && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-primary/30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={pulsing ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        className="inline-flex"
      >
        <Heart
          className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} transition-all duration-300 ${
            resonated ? "fill-primary/40 drop-shadow-[0_0_3px_hsl(var(--primary)/0.3)]" : ""
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

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-serif">
          {resonated ? "You resonated with this" : "This moved me"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OfferingResonanceButton;
