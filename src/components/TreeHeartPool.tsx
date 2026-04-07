import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import WindfallCelebration from "./WindfallCelebration";

const POLL_INTERVAL = 20_000; // 20s polling instead of Realtime

interface TreeHeartPoolProps {
  treeId: string;
  userId: string | null;
}

const TreeHeartPool = ({ treeId, userId }: TreeHeartPoolProps) => {
  const [pool, setPool] = useState<{ total_hearts: number; windfall_count: number; last_windfall_at: string | null } | null>(null);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevWindfallCount = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchPool = useCallback(async () => {
    const { data } = await supabase
      .from("tree_heart_pools")
      .select("total_hearts, windfall_count, last_windfall_at")
      .eq("tree_id", treeId)
      .maybeSingle();
    setPool(data);
  }, [treeId]);

  useEffect(() => {
    fetchPool();
    intervalRef.current = setInterval(fetchPool, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchPool]);

  // Detect windfall count change → trigger celebration
  useEffect(() => {
    if (!pool) return;
    if (prevWindfallCount.current !== null && pool.windfall_count > prevWindfallCount.current) {
      setShowCelebration(true);
    }
    prevWindfallCount.current = pool.windfall_count;
  }, [pool?.windfall_count]);

  // Auto-claim is intentionally removed here.
  // Heart collection is handled exclusively through CollectHeartsButton
  // and the unified useHeartCollection hook to prevent bypassing eligibility.

  const handleCelebrationComplete = useCallback(() => setShowCelebration(false), []);

  if (!pool || pool.total_hearts === 0) return null;

  const nextWindfall = ((pool.windfall_count + 1) * 144) - pool.total_hearts;
  const progressPct = Math.min(100, ((pool.total_hearts % 144) / 144) * 100);

  return (
    <div className="relative rounded-xl border border-border overflow-hidden bg-card/60 backdrop-blur p-5">
      <WindfallCelebration active={showCelebration} onComplete={handleCelebrationComplete} />
      {claimedAmount != null && claimedAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-2 right-2 z-10 font-serif text-xs px-3 py-1.5 rounded-full"
          style={{
            background: "linear-gradient(135deg, hsla(140, 35%, 30%, 0.15), hsla(42, 60%, 45%, 0.15))",
            color: "hsl(140 40% 55%)",
            border: "1px solid hsla(140, 35%, 40%, 0.25)",
          }}
        >
          {claimedAmount} hearts gathered ✨
        </motion.div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, hsla(140, 35%, 30%, 0.3), hsla(42, 60%, 45%, 0.3))",
            border: "1.5px solid hsla(140, 35%, 40%, 0.4)",
          }}
        >
          <span className="text-lg">🌳</span>
        </div>
        <div>
          <h3 className="font-serif text-sm tracking-wide text-foreground">Heart Reservoir</h3>
          <p className="text-xs text-muted-foreground font-serif">Hearts gathered by wanderers at this tree</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-serif text-lg tabular-nums" style={{ color: "hsl(140 40% 55%)" }}>
            {pool.total_hearts}
          </p>
          <p className="text-[10px] text-muted-foreground font-serif">S33D Hearts</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-serif text-muted-foreground">
          <span>Next windfall release</span>
          <span>{nextWindfall > 0 ? `${nextWindfall} hearts to go` : "Ready!"}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-muted/30">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(140 40% 38%), hsl(42 70% 50%))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60 font-serif italic">
          Every 144 hearts → 12 released to visiting wanderers
        </p>
      </div>

      {pool.windfall_count > 0 && (
        <p className="text-[10px] text-muted-foreground mt-2 font-serif">
          {pool.windfall_count} windfall{pool.windfall_count !== 1 ? "s" : ""} released
          {pool.last_windfall_at && (
            <span> · last {new Date(pool.last_windfall_at).toLocaleDateString()}</span>
          )}
        </p>
      )}
    </div>
  );
};

export default TreeHeartPool;
