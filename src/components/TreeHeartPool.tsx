import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import WindfallCelebration from "./WindfallCelebration";

interface TreeHeartPoolProps {
  treeId: string;
  userId: string | null;
}

const TreeHeartPool = ({ treeId, userId }: TreeHeartPoolProps) => {
  const [pool, setPool] = useState<{ total_hearts: number; windfall_count: number; last_windfall_at: string | null } | null>(null);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevWindfallCount = useRef<number | null>(null);

  useEffect(() => {
    const fetchPool = async () => {
      const { data } = await supabase
        .from("tree_heart_pools")
        .select("total_hearts, windfall_count, last_windfall_at")
        .eq("tree_id", treeId)
        .maybeSingle();
      setPool(data);
    };
    fetchPool();

    const channel = supabase
      .channel(`tree-pool-${treeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tree_heart_pools", filter: `tree_id=eq.${treeId}` }, () => fetchPool())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [treeId]);

  // Detect windfall count change → trigger celebration
  useEffect(() => {
    if (!pool) return;
    if (prevWindfallCount.current !== null && pool.windfall_count > prevWindfallCount.current) {
      setShowCelebration(true);
    }
    prevWindfallCount.current = pool.windfall_count;
  }, [pool?.windfall_count]);

  // Try to claim pending windfall on visit
  useEffect(() => {
    if (!userId || !pool || pool.total_hearts === 0) return;

    const claimWindfall = async () => {
      const { data, error } = await supabase.rpc("claim_windfall_hearts", {
        p_tree_id: treeId,
        p_user_id: userId,
      });
      if (!error && data && data > 0) {
        setClaimedAmount(data);
        setShowCelebration(true);
        setTimeout(() => setClaimedAmount(null), 5000);
      }
    };
    claimWindfall();
  }, [treeId, userId, pool?.windfall_count]);

  const handleCelebrationComplete = useCallback(() => setShowCelebration(false), []);

  if (!pool || pool.total_hearts === 0) return null;

  const nextWindfall = ((pool.windfall_count + 1) * 144) - pool.total_hearts;
  const progressPct = Math.min(100, ((pool.total_hearts % 144) / 144) * 100);

  return (
    <div className="relative rounded-xl border border-border overflow-hidden bg-card/60 backdrop-blur p-5">
      <WindfallCelebration active={showCelebration} onComplete={handleCelebrationComplete} />
      {/* Windfall claimed toast */}
      {claimedAmount != null && claimedAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-2 right-2 z-10 font-serif text-xs px-3 py-1.5 rounded-full"
          style={{
            background: "hsla(42, 80%, 50%, 0.2)",
            color: "hsl(42, 80%, 65%)",
            border: "1px solid hsla(42, 60%, 50%, 0.3)",
          }}
        >
          ✨ You claimed {claimedAmount} windfall hearts!
        </motion.div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, hsla(120, 50%, 40%, 0.3), hsla(42, 60%, 45%, 0.3))",
            border: "1.5px solid hsla(120, 40%, 45%, 0.4)",
          }}
        >
          <span className="text-lg">🌳</span>
        </div>
        <div>
          <h3 className="font-serif text-sm tracking-wide text-foreground">Heart Reservoir</h3>
          <p className="text-xs text-muted-foreground font-serif">This tree's living treasury</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-serif text-lg tabular-nums" style={{ color: "hsl(120, 45%, 55%)" }}>
            {pool.total_hearts}
          </p>
          <p className="text-[10px] text-muted-foreground font-serif">🌳 Hearts</p>
        </div>
      </div>

      {/* Progress to next windfall */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-serif text-muted-foreground">
          <span>Next windfall release</span>
          <span>{nextWindfall > 0 ? `${nextWindfall} hearts to go` : "Ready!"}</span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "hsla(120, 20%, 20%, 0.3)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(120, 50%, 40%), hsl(42, 70%, 50%))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60 font-serif italic">
          Every 144 hearts → 12 released to wanderers
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
