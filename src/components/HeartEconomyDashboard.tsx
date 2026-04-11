/**
 * HeartEconomyDashboard — personal heart flow overview.
 * Shows where hearts come from, where they're growing, and recent events.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, TreeDeciduous, Sprout, TrendingUp, ArrowRight, Loader2, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface HeartStats {
  total_earned: number;
  total_spent: number;
  balance: number;
  by_type: Record<string, number>;
  top_trees: Array<{ tree_id: string; tree_name: string; species: string; hearts: number }>;
  recent_events: Array<{ id: string; amount: number; heart_type: string; tree_id: string; created_at: string }>;
  growing: Array<{ tree_id: string; tree_name: string; species: string; hearts_planted: number; hearts_grown: number; planted_at: string }>;
}

interface Props {
  userId: string;
}

const HEART_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  wanderer: { label: "Wanderer", emoji: "🌿" },
  sower: { label: "Sower", emoji: "🌱" },
  windfall: { label: "Windfall", emoji: "🍂" },
  base: { label: "Stewardship", emoji: "🫀" },
  milestone: { label: "Milestone", emoji: "⭐" },
  patron_claim: { label: "Patron", emoji: "🛡️" },
  task_completion: { label: "Tasks", emoji: "✅" },
};

export default function HeartEconomyDashboard({ userId }: Props) {
  const [stats, setStats] = useState<HeartStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_heart_economy_stats", { p_user_id: userId });
        if (!error && data) setStats(data as unknown as HeartStats);
      } catch (err) {
        console.warn("[HeartEconomy] fetch failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 space-y-3">
        <Heart className="w-6 h-6 mx-auto text-muted-foreground/40" />
        <p className="text-sm font-serif text-muted-foreground">No heart activity yet.</p>
        <p className="text-xs text-muted-foreground/60">Visit trees and contribute to start your heart flow.</p>
      </div>
    );
  }

  const typeEntries = Object.entries(stats.by_type).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Earned", value: stats.total_earned, icon: TrendingUp, color: "hsl(140 50% 50%)" },
          { label: "Balance", value: stats.balance, icon: Heart, color: "hsl(0 65% 55%)" },
          { label: "Growing", value: stats.growing.reduce((s, g) => s + g.hearts_planted, 0), icon: Sprout, color: "hsl(42 70% 50%)" },
        ].map((m) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-3 rounded-xl border border-border/20 bg-card/40"
          >
            <m.icon className="w-4 h-4 mx-auto mb-1" style={{ color: m.color }} />
            <p className="text-lg font-serif font-medium text-foreground">{m.value.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Flow by type */}
      {typeEntries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-serif text-muted-foreground tracking-wider uppercase">Where your hearts flow from</h3>
          <div className="space-y-1.5">
            {typeEntries.map(([type, amount]) => {
              const info = HEART_TYPE_LABELS[type] || { label: type, emoji: "💚" };
              const pct = stats.total_earned > 0 ? (amount / stats.total_earned) * 100 : 0;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center">{info.emoji}</span>
                  <span className="text-xs font-serif text-foreground/80 w-20">{info.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ background: "hsl(var(--primary) / 0.6)" }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-10 text-right">{amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Growing at trees */}
      {stats.growing.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-serif text-muted-foreground tracking-wider uppercase">Hearts growing at trees</h3>
          <div className="space-y-2">
            {stats.growing.map((root) => (
              <Link
                key={root.tree_id}
                to={`/tree/${root.tree_id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-background/40 hover:bg-primary/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sprout className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground truncate">{root.tree_name || "Unknown Tree"}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {root.hearts_planted} planted · {root.hearts_grown} grown
                  </p>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top trees */}
      {stats.top_trees.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-serif text-muted-foreground tracking-wider uppercase">Top trees by hearts</h3>
          <div className="grid grid-cols-2 gap-2">
            {stats.top_trees.map((tree) => (
              <Link
                key={tree.tree_id}
                to={`/tree/${tree.tree_id}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-background/30 hover:bg-primary/5 transition-colors"
              >
                <TreeDeciduous className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-serif text-foreground truncate">{tree.tree_name || "Tree"}</p>
                  <p className="text-[9px] text-muted-foreground">{tree.hearts}♥</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent events */}
      {stats.recent_events.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-serif text-muted-foreground tracking-wider uppercase">Recent heart events</h3>
          <div className="space-y-1">
            {stats.recent_events.slice(0, 6).map((evt) => {
              const info = HEART_TYPE_LABELS[evt.heart_type] || { label: evt.heart_type, emoji: "💚" };
              return (
                <div key={evt.id} className="flex items-center gap-2 py-1.5 text-xs">
                  <span className="w-4 text-center">{info.emoji}</span>
                  <span className="font-serif text-foreground/80">
                    {evt.amount > 0 ? "+" : ""}{evt.amount}
                  </span>
                  <span className="text-muted-foreground/50">{info.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/40">
                    {formatDistanceToNow(new Date(evt.created_at), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
