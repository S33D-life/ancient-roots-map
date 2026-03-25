/**
 * EconomyOverview — Slim overview: poetic intro + live circulation stats.
 * Deep mechanics (compass, channels, branches) now live in EconomyCompass.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Leaf } from "lucide-react";
import EconomySignals from "./EconomySignals";

interface LiveStats {
  totalHeartsMinted: number;
  totalSpeciesHearts: number;
  totalInfluence: number;
  totalTrees: number;
}

const EconomyOverview = () => {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const [heartsRes, speciesRes, influenceRes, treesRes] = await Promise.all([
      supabase.from("heart_transactions").select("amount"),
      supabase.from("species_heart_transactions").select("amount"),
      supabase.from("influence_transactions").select("amount"),
      supabase.from("trees").select("id", { count: "exact", head: true }),
    ]);

    const totalHeartsMinted = (heartsRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);
    const totalSpeciesHearts = (speciesRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);
    const totalInfluence = (influenceRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);

    setStats({
      totalHeartsMinted,
      totalSpeciesHearts,
      totalInfluence,
      totalTrees: treesRes.count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Leaf className="w-8 h-8 text-primary/50" />
        </motion.div>
        <p className="text-xs font-serif text-muted-foreground/60 italic">
          The forest is gathering its traces…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Poetic Intro */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 max-w-lg mx-auto"
      >
        <p className="text-sm font-serif text-foreground/80 leading-relaxed">
          The S33D ecosystem circulates through three interacting layers —
        </p>
        <p className="text-base font-serif text-foreground tracking-wide">
          <span style={{ color: "hsl(0, 65%, 55%)" }}>Energy</span>
          {" → "}
          <span style={{ color: "hsl(var(--primary))" }}>Value</span>
          {" → "}
          <span style={{ color: "hsl(42, 80%, 50%)" }}>Wisdom</span>
        </p>
        <p className="text-[11px] font-serif text-muted-foreground/70 italic">
          Hearts circulate through action. Value flows through the Value Tree. Wisdom flows through the Council of Life.
        </p>
      </motion.div>

      {/* Live Circulation Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <EconomySignals
          balances={{
            s33dHearts: stats?.totalHeartsMinted || 0,
            speciesHearts: stats?.totalSpeciesHearts || 0,
            influence: stats?.totalInfluence || 0,
          }}
          variant="minted"
          size="md"
        />
      </motion.div>
    </div>
  );
};

export default EconomyOverview;
