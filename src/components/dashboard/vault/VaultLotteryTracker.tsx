import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Sparkles, Gift } from "lucide-react";

interface Props {
  userId: string;
}

interface WindfallEvent {
  id: string;
  tree_id: string;
  amount: number;
  created_at: string;
  tree_name?: string;
}

const VaultLotteryTracker = ({ userId }: Props) => {
  const [windfalls, setWindfalls] = useState<WindfallEvent[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // User's received windfalls
      const { data: wfData } = await supabase
        .from("heart_transactions")
        .select("id, tree_id, amount, created_at")
        .eq("user_id", userId)
        .eq("heart_type", "windfall")
        .order("created_at", { ascending: false })
        .limit(10);

      // Pending windfalls across all trees
      const { count } = await supabase
        .from("heart_transactions")
        .select("*", { count: "exact", head: true })
        .is("user_id", null)
        .eq("heart_type", "windfall_pending");

      setPendingCount(count || 0);

      if (wfData && wfData.length > 0) {
        const treeIds = [...new Set(wfData.map(w => w.tree_id))];
        const { data: trees } = await supabase
          .from("trees")
          .select("id, name")
          .in("id", treeIds);
        const treeMap = new Map((trees || []).map(t => [t.id, t.name]));
        setWindfalls(wfData.map(w => ({ ...w, tree_name: treeMap.get(w.tree_id) || "Unknown" })));
      }

      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-serif tracking-wide text-foreground">Windfall Lottery <span className="text-[9px] text-muted-foreground font-normal ml-1">Current</span></h3>
        </div>

        {/* Status beacon */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-card/30 mb-4">
          <div className="relative">
            <Gift className="w-5 h-5 text-accent" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            )}
          </div>
          <div>
            <p className="text-xs font-serif text-foreground">
              {pendingCount > 0
                ? `${pendingCount} windfall${pendingCount > 1 ? "s" : ""} waiting across the forest`
                : "No windfalls pending"}
            </p>
            <p className="text-[10px] text-muted-foreground font-serif mt-0.5">
              Visit trees to claim uncollected rewards
            </p>
          </div>
        </div>

        {/* Received windfalls */}
        {windfalls.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-serif mb-2">
              Your windfall history
            </p>
            {windfalls.map((wf, i) => (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
              >
                <span className="text-sm" style={{ filter: "drop-shadow(0 0 4px hsl(270, 50%, 60%))" }}>✨</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground truncate">{wf.tree_name}</p>
                  <p className="text-[10px] text-muted-foreground font-serif">
                    {new Date(wf.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-serif tabular-nums" style={{ color: "hsl(270, 50%, 60%)" }}>
                  +{wf.amount}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {windfalls.length === 0 && (
          <p className="text-xs text-muted-foreground/60 font-serif text-center py-3 italic">
            Your first windfall awaits — keep visiting ancient friends
          </p>
        )}
      </div>
    </div>
  );
};

export default VaultLotteryTracker;
