/**
 * HeartFlowLedger — Unified ledger showing heart transactions,
 * species heart rewards, and influence transactions.
 * Accessible from both Heartwood Vault and Value Tree page.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sprout, Shield, Filter, Leaf, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface LedgerEntry {
  id: string;
  type: "s33d" | "species" | "influence";
  amount: number;
  action: string;
  species_family: string | null;
  tree_id: string | null;
  created_at: string;
}

type LedgerFilter = "all" | "s33d" | "species" | "influence";

interface Props {
  userId: string;
  compact?: boolean;
}

const TYPE_CONFIG = {
  s33d: { icon: "❤️", label: "S33D Hearts", color: "hsl(0, 65%, 55%)" },
  species: { icon: "🌿", label: "Species Hearts", color: "hsl(var(--primary))" },
  influence: { icon: "🛡️", label: "Influence", color: "hsl(42, 80%, 50%)" },
};

const FILTERS: { value: LedgerFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "s33d", label: "S33D Hearts" },
  { value: "species", label: "Species" },
  { value: "influence", label: "Influence" },
];

const HeartFlowLedger = ({ userId, compact = false }: Props) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const limit = compact ? 10 : 50;

  const fetchLedger = useCallback(async () => {
    setLoading(true);

    const [heartsRes, speciesRes, influenceRes] = await Promise.all([
      supabase
        .from("heart_transactions")
        .select("id, heart_type, amount, tree_id, created_at")
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

    const combined: LedgerEntry[] = [
      ...(heartsRes.data || []).map((tx) => ({
        id: tx.id,
        type: "s33d" as const,
        amount: tx.amount,
        action: tx.heart_type.replace(/_/g, " "),
        species_family: null,
        tree_id: tx.tree_id,
        created_at: tx.created_at,
      })),
      ...(speciesRes.data || []).map((tx) => ({
        id: tx.id,
        type: "species" as const,
        amount: tx.amount,
        action: tx.action_type.replace(/_/g, " "),
        species_family: tx.species_family,
        tree_id: tx.tree_id,
        created_at: tx.created_at,
      })),
      ...(influenceRes.data || []).map((tx) => ({
        id: tx.id,
        type: "influence" as const,
        amount: tx.amount,
        action: tx.action_type.replace(/_/g, " "),
        species_family: tx.species_family,
        tree_id: tx.tree_id,
        created_at: tx.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    setEntries(combined);
    setLoading(false);
  }, [userId, limit]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.type === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-10 gap-3">
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          <Leaf className="w-6 h-6 text-primary/40" />
        </motion.div>
        <p className="text-[10px] font-serif text-muted-foreground/50 italic">
          The forest is gathering its traces…
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-card/40 backdrop-blur border-border/30 overflow-hidden">
      <div
        className="h-0.5"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(0 65% 55% / 0.4), hsl(var(--primary) / 0.4), hsl(42 80% 50% / 0.4), transparent)",
        }}
      />
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-sm font-serif text-foreground">Heart Flow Ledger</h3>
          </div>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "secondary" : "ghost"}
                size="sm"
                className="text-[10px] font-serif h-6 px-2"
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {filtered.map((entry) => {
              const config = TYPE_CONFIG[entry.type];
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-card/20 border border-border/10 hover:border-border/25 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm shrink-0">{config.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-serif text-foreground/80 truncate capitalize">
                        {entry.action}
                      </p>
                      {entry.species_family && (
                        <p className="text-[9px] font-serif text-muted-foreground/60 truncate">
                          {entry.species_family}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-xs font-serif font-bold tabular-nums"
                      style={{ color: config.color }}
                    >
                      +{entry.amount}
                    </span>
                    <span className="text-[9px] text-muted-foreground/50 font-serif w-12 text-right">
                      {format(new Date(entry.created_at), "MMM d")}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-[11px] font-serif text-muted-foreground/50 italic">
                This branch is waiting for its first flow.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HeartFlowLedger;
