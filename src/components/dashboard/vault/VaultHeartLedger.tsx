/**
 * VaultHeartLedger — Unified Heart Flow Ledger
 * Shows S33D Hearts, Species Hearts, and Influence transactions in one view.
 * Single source of truth for all token activity — used in both Vault and Value Tree.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, TreeDeciduous, Sparkles, Sprout, Shield, Leaf, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface UnifiedTx {
  id: string;
  token_type: "s33d" | "species" | "influence";
  action: string;
  amount: number;
  tree_id: string | null;
  tree_name?: string;
  species_family: string | null;
  seed_id?: string | null;
  created_at: string;
}

interface Props {
  userId: string;
  /** Legacy filter support from VaultHeartBalance ring clicks */
  externalFilter?: string | null;
  onFilterChange?: (filter: string) => void;
  /** Compact mode for embedding (fewer rows, smaller header) */
  compact?: boolean;
}

type FilterType = "all" | "s33d" | "species" | "influence";

const TOKEN_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  // S33D Heart subtypes
  wanderer: { emoji: "❤️", label: "Wanderer", color: "hsl(0, 65%, 55%)" },
  sower: { emoji: "💚", label: "Sower", color: "hsl(120, 45%, 50%)" },
  windfall: { emoji: "✨", label: "Windfall", color: "hsl(270, 50%, 60%)" },
  tree: { emoji: "🌳", label: "Tree Heart", color: "hsl(150, 50%, 45%)" },
  canopy_bonus: { emoji: "🌿", label: "Canopy Bonus", color: "hsl(120, 55%, 45%)" },
  time_tree: { emoji: "⏳", label: "Time Tree", color: "hsl(42, 80%, 50%)" },
  contribution: { emoji: "🤝", label: "Contribution", color: "hsl(200, 50%, 50%)" },
  bug_report: { emoji: "🐞", label: "Bug Report", color: "hsl(340, 55%, 50%)" },
  // Unified types
  species: { emoji: "🌿", label: "Species Hearts", color: "hsl(var(--primary))" },
  influence: { emoji: "🛡️", label: "Influence", color: "hsl(42, 80%, 50%)" },
};

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Flows" },
  { value: "s33d", label: "❤️ S33D Hearts" },
  { value: "species", label: "🌿 Species" },
  { value: "influence", label: "🛡️ Influence" },
];

const VaultHeartLedger = ({ userId, externalFilter, onFilterChange, compact = false }: Props) => {
  const [transactions, setTransactions] = useState<UnifiedTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalFilter, setInternalFilter] = useState<FilterType>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Map legacy s33d sub-type filters to the unified filter
  const mapExternalFilter = (ext: string | null): FilterType => {
    if (!ext) return internalFilter;
    if (["wanderer", "sower", "windfall"].includes(ext)) return "s33d";
    if (ext === "species") return "species";
    if (ext === "influence") return "influence";
    return "all";
  };

  const filter: FilterType = externalFilter ? mapExternalFilter(externalFilter) : internalFilter;
  const subFilter = externalFilter && ["wanderer", "sower", "windfall"].includes(externalFilter) ? externalFilter : null;

  const handleFilterChange = (f: FilterType) => {
    setInternalFilter(f);
    onFilterChange?.(f === "all" ? "" : f);
  };

  const fetchAll = useCallback(async () => {
    const limit = compact ? 30 : 100;

    const [heartsRes, speciesRes, influenceRes] = await Promise.all([
      supabase
        .from("heart_transactions")
        .select("id, heart_type, amount, tree_id, seed_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("species_heart_transactions")
        .select("id, amount, species_family, tree_id, action_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("influence_transactions")
        .select("id, amount, species_family, tree_id, action_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    // Get unique tree IDs for name enrichment
    const allTreeIds = new Set<string>();
    for (const tx of heartsRes.data || []) if (tx.tree_id) allTreeIds.add(tx.tree_id);
    for (const tx of speciesRes.data || []) if (tx.tree_id) allTreeIds.add(tx.tree_id);
    for (const tx of influenceRes.data || []) if (tx.tree_id) allTreeIds.add(tx.tree_id);

    const treeMap = new Map<string, string>();
    if (allTreeIds.size > 0) {
      const { data: trees } = await supabase
        .from("trees")
        .select("id, name")
        .in("id", [...allTreeIds].slice(0, 100));
      for (const t of trees || []) treeMap.set(t.id, t.name);
    }

    const combined: UnifiedTx[] = [
      ...(heartsRes.data || []).map(tx => ({
        id: tx.id,
        token_type: "s33d" as const,
        action: tx.heart_type,
        amount: tx.amount,
        tree_id: tx.tree_id,
        tree_name: treeMap.get(tx.tree_id) || undefined,
        species_family: null,
        seed_id: tx.seed_id,
        created_at: tx.created_at,
      })),
      ...(speciesRes.data || []).map(tx => ({
        id: tx.id,
        token_type: "species" as const,
        action: tx.action_type,
        amount: tx.amount,
        tree_id: tx.tree_id,
        tree_name: tx.tree_id ? treeMap.get(tx.tree_id) : undefined,
        species_family: tx.species_family,
        created_at: tx.created_at,
      })),
      ...(influenceRes.data || []).map(tx => ({
        id: tx.id,
        token_type: "influence" as const,
        action: tx.action_type,
        amount: tx.amount,
        tree_id: tx.tree_id,
        tree_name: tx.tree_id ? treeMap.get(tx.tree_id) : undefined,
        species_family: tx.species_family,
        created_at: tx.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, compact ? 30 : 100);

    setTransactions(combined);
    setLoading(false);
  }, [userId, compact]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Apply filter
  let filtered = transactions;
  if (filter === "s33d") filtered = filtered.filter(t => t.token_type === "s33d");
  else if (filter === "species") filtered = filtered.filter(t => t.token_type === "species");
  else if (filter === "influence") filtered = filtered.filter(t => t.token_type === "influence");

  // Sub-filter for legacy s33d type clicks
  if (subFilter && filter === "s33d") {
    filtered = filtered.filter(t => t.action === subFilter);
  }

  if (loading) return null;
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6 text-center">
        <BookOpen className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs font-serif text-muted-foreground">
          Your Heart Flow Ledger is waiting for its first traces.
        </p>
        <p className="text-[10px] text-muted-foreground/50 font-serif mt-1 italic">
          Map a tree, make an offering, or attend a council to begin.
        </p>
      </div>
    );
  }

  const maxItems = compact ? 15 : 50;

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      {/* Accent line */}
      <div
        className="h-0.5"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(0 65% 55% / 0.4), hsl(var(--primary) / 0.3), hsl(42 80% 50% / 0.4), transparent)",
        }}
      />

      <div className="p-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-serif tracking-wide text-foreground">Heart Flow Ledger</h3>
          </div>
          <span className="text-[10px] font-serif text-muted-foreground">
            {transactions.length} flows
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
              onClick={() => handleFilterChange(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className={`${compact ? "max-h-64" : "max-h-96"} overflow-y-auto px-5 pb-4 space-y-1`}>
        <AnimatePresence mode="popLayout">
          {filtered.slice(0, maxItems).map((tx, i) => {
            const config = tx.token_type === "s33d"
              ? (TOKEN_CONFIG[tx.action] || TOKEN_CONFIG.wanderer)
              : TOKEN_CONFIG[tx.token_type];
            const isExpanded = expanded === tx.id;

            return (
              <motion.button
                key={tx.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: i * 0.015 }}
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
                    <span className="capitalize">{config.label}</span>
                    {tx.tree_name && (
                      <span className="text-muted-foreground"> · {tx.tree_name}</span>
                    )}
                    {!tx.tree_name && tx.species_family && (
                      <span className="text-muted-foreground"> · {tx.species_family}</span>
                    )}
                  </p>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-1 space-y-0.5"
                    >
                      {tx.tree_name && (
                        <p className="text-[10px] text-muted-foreground font-serif">
                          <TreeDeciduous className="w-2.5 h-2.5 inline mr-1" />
                          Rooted at {tx.tree_name}
                        </p>
                      )}
                      {tx.species_family && (
                        <p className="text-[10px] text-muted-foreground font-serif">
                          <Sprout className="w-2.5 h-2.5 inline mr-1" />
                          {tx.species_family} lineage
                        </p>
                      )}
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
                  <span className="text-xs font-serif tabular-nums font-bold" style={{ color: config.color }}>
                    +{tx.amount}
                  </span>
                  <p className="text-[9px] text-muted-foreground font-serif">
                    {format(new Date(tx.created_at), "MMM d")}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {filtered.length > maxItems && (
          <p className="text-center text-[10px] text-muted-foreground/50 font-serif py-2">
            Showing {maxItems} of {filtered.length} flows
          </p>
        )}
      </div>
    </div>
  );
};

export default VaultHeartLedger;
