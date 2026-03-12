/**
 * PersonalJourneySummary — Calm "living scroll" showing a wanderer's ecosystem footprint.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TreeDeciduous, Music, Heart, Hexagon, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

interface JourneyStats {
  treesMapped: number;
  offeringsMade: number;
  heartsEarned: number;
  speciesContributed: number;
  staffOwned: number;
}

export default function PersonalJourneySummary({ userId }: { userId: string }) {
  const [stats, setStats] = useState<JourneyStats | null>(null);

  useEffect(() => {
    const load = async () => {
      const treesRes = await supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId);
      const offeringsRes = await supabase.from("offerings").select("*", { count: "exact", head: true }).eq("created_by", userId);
      const heartRes = await supabase.from("heart_transactions").select("amount").eq("user_id", userId);
      const speciesRes = await supabase.from("trees").select("species").eq("created_by", userId);
      const staffRes = await supabase.from("staffs").select("*", { count: "exact", head: true }).eq("owner_id", userId);

      const hearts = (heartRes.data || []).reduce((s: number, r: { amount: number }) => s + (r.amount || 0), 0);
      const uniqueSpecies = new Set((speciesRes.data || []).map((t: { species: string | null }) => t.species).filter(Boolean)).size;

      setStats({
        treesMapped: treesRes.count || 0,
        offeringsMade: offeringsRes.count || 0,
        heartsEarned: hearts,
        speciesContributed: uniqueSpecies,
        staffOwned: staffRes.count || 0,
      });
    };
    load();
  }, [userId]);

  if (!stats) return null;

  const rows = [
    { icon: <TreeDeciduous className="w-3.5 h-3.5" />, label: "Trees you have mapped", value: stats.treesMapped, color: "text-emerald-400" },
    { icon: <Music className="w-3.5 h-3.5" />, label: "Offerings you have made", value: stats.offeringsMade, color: "text-primary" },
    { icon: <Heart className="w-3.5 h-3.5" />, label: "Hearts you have earned", value: stats.heartsEarned, color: "text-red-400" },
    { icon: <Hexagon className="w-3.5 h-3.5" />, label: "Species you have contributed to", value: stats.speciesContributed, color: "text-primary/70" },
    { icon: <Wand2 className="w-3.5 h-3.5" />, label: "Staffs held", value: stats.staffOwned, color: "text-amber-400" },
  ].filter(r => r.value > 0);

  if (rows.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm p-4"
    >
      <h4 className="text-[10px] font-serif text-muted-foreground/60 uppercase tracking-wider mb-3">
        Your Journey So Far
      </h4>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="flex items-center gap-2.5 text-[11px] font-serif"
          >
            <span className={r.color}>{r.icon}</span>
            <span className="text-muted-foreground/70 flex-1">{r.label}</span>
            <span className="text-foreground/80 font-medium tabular-nums">{r.value.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
