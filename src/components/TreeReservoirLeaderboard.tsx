import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { TreeDeciduous, Droplets, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PoolEntry {
  tree_id: string;
  total_hearts: number;
  windfall_count: number;
  tree_name: string;
  tree_species: string;
}

const MEDAL = ["🥇", "🥈", "🥉"];

const TreeReservoirLeaderboard = () => {
  const [pools, setPools] = useState<PoolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      // Get pools with tree info via join
      const { data: poolData } = await supabase
        .from("tree_heart_pools")
        .select("tree_id, total_hearts, windfall_count")
        .order("total_hearts", { ascending: false })
        .limit(20);

      if (!poolData || poolData.length === 0) {
        setLoading(false);
        return;
      }

      const treeIds = poolData.map((p) => p.tree_id);
      const { data: treeData } = await supabase
        .from("trees")
        .select("id, name, species")
        .in("id", treeIds);

      const treeMap = new Map(
        (treeData || []).map((t) => [t.id, { name: t.name, species: t.species }])
      );

      const entries: PoolEntry[] = poolData.map((p) => ({
        tree_id: p.tree_id,
        total_hearts: p.total_hearts,
        windfall_count: p.windfall_count,
        tree_name: treeMap.get(p.tree_id)?.name || "Unknown Tree",
        tree_species: treeMap.get(p.tree_id)?.species || "",
      }));

      setPools(entries);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Droplets className="w-5 h-5 animate-pulse text-primary" />
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground font-serif text-sm">
        No Heart Reservoirs have formed yet. Plant seeds to begin filling them.
      </div>
    );
  }

  const maxHearts = pools[0]?.total_hearts || 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="font-serif text-lg tracking-wide text-primary">
          Richest Reservoirs
        </h3>
      </div>
      <p className="text-xs text-muted-foreground font-serif mb-4">
        Ancient Friends with the deepest Heart Pools
      </p>

      <div className="space-y-2">
        {pools.map((entry, i) => {
          const barPct = Math.max(5, (entry.total_hearts / maxHearts) * 100);
          const progressTo144 = entry.total_hearts % 144;

          return (
            <motion.div
              key={entry.tree_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group relative rounded-lg border border-border/40 bg-card/40 backdrop-blur p-3 cursor-pointer hover:border-primary/40 transition-all"
              onClick={() => navigate(`/tree/${entry.tree_id}`)}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <span className="text-lg w-7 text-center shrink-0">
                  {i < 3 ? MEDAL[i] : (
                    <span className="text-xs text-muted-foreground font-serif">{i + 1}</span>
                  )}
                </span>

                {/* Tree icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: i === 0
                      ? "linear-gradient(135deg, hsla(42, 80%, 50%, 0.3), hsla(45, 100%, 60%, 0.2))"
                      : "hsla(120, 20%, 20%, 0.3)",
                    border: `1.5px solid ${i === 0 ? "hsla(42, 70%, 50%, 0.5)" : "hsla(120, 30%, 35%, 0.3)"}`,
                  }}
                >
                  <TreeDeciduous className="w-4 h-4" style={{ color: i === 0 ? "hsl(42, 80%, 55%)" : "hsl(120, 40%, 50%)" }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {entry.tree_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-serif italic truncate">
                    {entry.tree_species}
                  </p>
                </div>

                {/* Hearts count */}
                <div className="text-right shrink-0">
                  <p className="font-serif text-sm tabular-nums" style={{ color: "hsl(120, 45%, 55%)" }}>
                    {entry.total_hearts}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-serif">
                    🌳 Hearts
                  </p>
                </div>
              </div>

              {/* Bar */}
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ background: "hsla(120, 15%, 20%, 0.3)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: i === 0
                        ? "linear-gradient(90deg, hsl(42, 80%, 50%), hsl(45, 100%, 60%))"
                        : "linear-gradient(90deg, hsl(120, 50%, 40%), hsl(42, 70%, 50%))",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                  />
                </div>
                {entry.windfall_count > 0 && (
                  <span className="text-[9px] text-muted-foreground font-serif whitespace-nowrap">
                    ✨ {entry.windfall_count} windfall{entry.windfall_count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TreeReservoirLeaderboard;
