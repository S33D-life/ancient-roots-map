import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { TreeDeciduous } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TreePool {
  tree_id: string;
  total_hearts: number;
  windfall_count: number;
  tree_name: string;
  tree_species: string;
}

const VaultTreeReservoirs = () => {
  const [pools, setPools] = useState<TreePool[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data: poolData } = await supabase
        .from("tree_heart_pools")
        .select("tree_id, total_hearts, windfall_count")
        .order("total_hearts", { ascending: false })
        .limit(20);

      if (!poolData || poolData.length === 0) { setLoading(false); return; }

      const treeIds = poolData.map(p => p.tree_id);
      const { data: trees } = await supabase
        .from("trees")
        .select("id, name, species")
        .in("id", treeIds);

      const treeMap = new Map((trees || []).map(t => [t.id, t]));
      const enriched: TreePool[] = poolData.map(p => ({
        ...p,
        tree_name: treeMap.get(p.tree_id)?.name || "Unknown",
        tree_species: treeMap.get(p.tree_id)?.species || "",
      }));

      setPools(enriched);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading || pools.length === 0) return null;

  const maxHearts = Math.max(...pools.map(p => p.total_hearts), 1);

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <TreeDeciduous className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-serif tracking-wide text-foreground">Tree Reservoirs</h3>
          <span className="ml-auto text-[10px] font-serif text-muted-foreground">
            {pools.length} trees with heart pools
          </span>
        </div>

        <div className="space-y-2">
          {pools.map((pool, i) => {
            const pct = (pool.total_hearts / maxHearts) * 100;
            const nextWindfall = ((pool.windfall_count + 1) * 144) - pool.total_hearts;

            return (
              <motion.button
                key={pool.tree_id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/atlas/tree/${pool.tree_id}`)}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-border/40 hover:bg-card/60 transition-all">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
                    style={{
                      borderColor: "hsl(120, 30%, 35% / 0.4)",
                      background: "linear-gradient(135deg, hsl(120 35% 25% / 0.3), hsl(42 60% 40% / 0.2))",
                    }}
                  >
                    <span className="text-sm">🌳</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-serif text-foreground truncate group-hover:text-primary transition-colors">
                        {pool.tree_name}
                      </p>
                      <span
                        className="text-xs font-serif tabular-nums shrink-0 ml-2"
                        style={{ color: "hsl(120, 45%, 55%)" }}
                      >
                        {pool.total_hearts} 🌳
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden bg-muted/30">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: "linear-gradient(90deg, hsl(120, 40%, 35%), hsl(42, 70%, 50%))",
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground/60 font-serif mt-0.5">
                      {pool.tree_species}{nextWindfall > 0 ? ` · ${nextWindfall} to windfall` : " · Windfall ready!"}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VaultTreeReservoirs;
