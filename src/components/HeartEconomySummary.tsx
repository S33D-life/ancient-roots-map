import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sparkles, Sprout, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface EconomyStats {
  totalHearts: number;
  totalWindfalls: number;
  activeSeeds: number;
}

const HeartEconomySummary = () => {
  const [stats, setStats] = useState<EconomyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [heartsRes, windfallsRes, seedsRes] = await Promise.all([
        supabase.from("heart_transactions").select("amount"),
        supabase.from("tree_heart_pools").select("windfall_count"),
        supabase
          .from("planted_seeds")
          .select("id", { count: "exact", head: true })
          .is("collected_by", null),
      ]);

      const totalHearts = (heartsRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);
      const totalWindfalls = (windfallsRes.data || []).reduce((s, r) => s + (r.windfall_count || 0), 0);
      const activeSeeds = seedsRes.count || 0;

      setStats({ totalHearts, totalWindfalls, activeSeeds });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      icon: Heart,
      label: "Hearts Minted",
      value: stats.totalHearts,
      color: "hsl(0, 65%, 55%)",
    },
    {
      icon: Sparkles,
      label: "Windfalls Triggered",
      value: stats.totalWindfalls,
      color: "hsl(270, 50%, 60%)",
    },
    {
      icon: Sprout,
      label: "Active Seeds",
      value: stats.activeSeeds,
      color: "hsl(120, 45%, 50%)",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-serif font-semibold text-foreground">Heart Economy</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            className="relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            {/* Subtle glow */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.08]"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 50% 80%, ${card.color}, transparent)`,
              }}
            />
            <div className="relative flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${card.color}20`,
                  boxShadow: `0 0 12px ${card.color}30`,
                }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-2xl font-serif font-bold tabular-nums text-foreground">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground font-serif">{card.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HeartEconomySummary;
