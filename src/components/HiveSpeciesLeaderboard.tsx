import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface LeaderEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_hearts: number;
}

interface Props {
  family: string;
  accentHsl: string;
  icon: string;
  limit?: number;
}

/**
 * HiveSpeciesLeaderboard — ranks wanderers by their species_heart_transactions
 * for a given botanical family. Resolves names via get_safe_profiles.
 */
const HiveSpeciesLeaderboard = ({ family, accentHsl, icon, limit = 10 }: Props) => {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: txs } = await supabase
        .from("species_heart_transactions")
        .select("user_id, amount")
        .eq("species_family", family);

      if (!txs || txs.length === 0) { setLoading(false); return; }

      // Aggregate by user
      const userMap: Record<string, number> = {};
      txs.forEach((tx) => { userMap[tx.user_id] = (userMap[tx.user_id] || 0) + tx.amount; });

      const sorted = Object.entries(userMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      const uids = sorted.map(([uid]) => uid);
      const { data: profiles } = await supabase.rpc("get_safe_profiles", { p_ids: uids });
      const pMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      (profiles || []).forEach((p: any) => { pMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });

      setEntries(sorted.map(([uid, total]) => ({
        user_id: uid,
        display_name: pMap[uid]?.full_name || "Ancient Friend",
        avatar_url: pMap[uid]?.avatar_url || null,
        total_hearts: total,
      })));
      setLoading(false);
    };
    fetch();
  }, [family, limit]);

  if (loading || entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border p-5 bg-card/60 backdrop-blur space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4" style={{ color: `hsl(${accentHsl})` }} />
        <h4 className="font-serif text-sm text-foreground tracking-wide">{icon} {family} Champions</h4>
      </div>
      <div className="space-y-2">
        {entries.map((e, i) => (
          <motion.div
            key={e.user_id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2.5"
          >
            <span className="text-xs text-muted-foreground w-5 text-right font-mono">{i + 1}</span>
            {e.avatar_url ? (
              <img src={e.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px]">🌿</div>
            )}
            <span className="flex-1 text-xs font-serif text-foreground truncate">{e.display_name}</span>
            <span className="text-xs font-mono tabular-nums" style={{ color: `hsl(${accentHsl})` }}>
              {e.total_hearts} {icon}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HiveSpeciesLeaderboard;
