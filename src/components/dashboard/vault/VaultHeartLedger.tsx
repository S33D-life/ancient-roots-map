import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, TreeDeciduous, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeartTx {
  id: string;
  heart_type: string;
  amount: number;
  tree_id: string;
  seed_id: string | null;
  created_at: string;
  tree_name?: string;
}

interface Props {
  userId: string;
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  wanderer: { emoji: "❤️", label: "Wanderer", color: "hsl(0, 65%, 55%)" },
  sower: { emoji: "💚", label: "Sower", color: "hsl(120, 45%, 50%)" },
  windfall: { emoji: "✨", label: "Windfall", color: "hsl(270, 50%, 60%)" },
};

type FilterType = "all" | "wanderer" | "sower" | "windfall";

const VaultHeartLedger = ({ userId }: Props) => {
  const [transactions, setTransactions] = useState<HeartTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchTx = async () => {
      // Fetch heart transactions for this user
      const { data: txData } = await supabase
        .from("heart_transactions")
        .select("id, heart_type, amount, tree_id, seed_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!txData) { setLoading(false); return; }

      // Get unique tree IDs to fetch names
      const treeIds = [...new Set(txData.map(t => t.tree_id))];
      const { data: trees } = await supabase
        .from("trees")
        .select("id, name")
        .in("id", treeIds);

      const treeMap = new Map((trees || []).map(t => [t.id, t.name]));
      const enriched = txData.map(tx => ({
        ...tx,
        tree_name: treeMap.get(tx.tree_id) || "Unknown tree",
      }));

      setTransactions(enriched);
      setLoading(false);
    };
    fetchTx();
  }, [userId]);

  const filtered = filter === "all"
    ? transactions
    : transactions.filter(t => t.heart_type === filter);

  const FILTERS: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "wanderer", label: "❤️ Wanderer" },
    { value: "sower", label: "💚 Sower" },
    { value: "windfall", label: "✨ Windfall" },
  ];

  if (loading) return null;
  if (transactions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="p-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-serif tracking-wide text-foreground">Heart Ledger</h3>
          </div>
          <span className="text-[10px] font-serif text-muted-foreground">
            {transactions.length} interactions
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "ghost"}
              size="sm"
              className={`text-[10px] h-7 px-2.5 font-serif tracking-wide rounded-full shrink-0 ${
                filter === f.value
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground"
              }`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="max-h-72 overflow-y-auto px-5 pb-4 space-y-1.5">
        <AnimatePresence mode="popLayout">
          {filtered.slice(0, 30).map((tx, i) => {
            const config = TYPE_CONFIG[tx.heart_type] || TYPE_CONFIG.wanderer;
            const isExpanded = expanded === tx.id;

            return (
              <motion.button
                key={tx.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setExpanded(isExpanded ? null : tx.id)}
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-border/40 hover:bg-card/60 transition-all group"
              >
                <span
                  className="text-sm shrink-0 transition-transform group-hover:scale-110"
                  style={{ filter: `drop-shadow(0 0 3px ${config.color})` }}
                >
                  {config.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground truncate">
                    {config.label} · <span className="text-muted-foreground">{tx.tree_name}</span>
                  </p>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-1 space-y-0.5"
                    >
                      <p className="text-[10px] text-muted-foreground font-serif">
                        <TreeDeciduous className="w-2.5 h-2.5 inline mr-1" />
                        Rooted at {tx.tree_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-serif">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                      {tx.seed_id && (
                        <p className="text-[10px] text-muted-foreground/60 font-serif">
                          🌱 From seed bloom
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-serif tabular-nums" style={{ color: config.color }}>
                    +{tx.amount}
                  </span>
                  <p className="text-[9px] text-muted-foreground font-serif">
                    {new Date(tx.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {filtered.length > 30 && (
          <p className="text-center text-[10px] text-muted-foreground/50 font-serif py-2">
            Showing 30 of {filtered.length} interactions
          </p>
        )}
      </div>
    </div>
  );
};

export default VaultHeartLedger;
