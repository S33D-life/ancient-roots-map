/**
 * EcosystemPulse — Compact summary of ecosystem vitality metrics.
 * Shows trees mapped, offerings, hearts circulating, hives active,
 * council gatherings, and agent contributions.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalHeartTotal } from "@/repositories/hearts";
import { getGlobalOfferingCount } from "@/repositories/offerings";
import { TreeDeciduous, Music, Heart, Hexagon, Users, Bot } from "lucide-react";
import { motion } from "framer-motion";

interface Metrics {
  trees: number;
  offerings: number;
  hearts: number;
  hives: number;
  councils: number;
  agentContributions: number;
}

export default function EcosystemPulse() {
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    const load = async () => {
      const [
        { count: trees },
        { count: offerings },
        hearts,
        { data: hiveData },
        { count: councils },
        { count: agentContributions },
      ] = await Promise.all([
        supabase.from("trees").select("*", { count: "exact", head: true }),
        supabase.from("offerings").select("*", { count: "exact", head: true }),
        getGlobalHeartTotal(),
        supabase.from("species_hives").select("id", { count: "exact", head: false }).limit(200),
        supabase.from("council_participation_rewards").select("*", { count: "exact", head: true }),
        supabase.from("agent_contribution_events").select("*", { count: "exact", head: true }).eq("validation_status", "verified"),
      ]);
      setM({
        trees: trees || 0,
        offerings: offerings || 0,
        hearts,
        hives: hiveData?.length || 0,
        councils: councils || 0,
        agentContributions: agentContributions || 0,
      });
    };
    load();
  }, []);

  if (!m) return null;

  const items = [
    { icon: <TreeDeciduous className="w-4 h-4" />, value: m.trees, label: "Trees Mapped", accent: "120 45% 45%" },
    { icon: <Music className="w-4 h-4" />, value: m.offerings, label: "Offerings", accent: "var(--primary)" },
    { icon: <Heart className="w-4 h-4" />, value: m.hearts, label: "Hearts", accent: "0 65% 55%" },
    { icon: <Hexagon className="w-4 h-4" />, value: m.hives, label: "Species Hives", accent: "var(--primary)" },
    { icon: <Users className="w-4 h-4" />, value: m.councils, label: "Gatherings", accent: "42 80% 50%" },
    ...(m.agentContributions > 0 ? [{
      icon: <Bot className="w-4 h-4" />, value: m.agentContributions, label: "Agent Contributions", accent: "270 50% 55%",
    }] : []),
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h3 className="text-xs font-serif text-muted-foreground uppercase tracking-wider text-center mb-4">
        Ecosystem Pulse
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm"
          >
            <div style={{ color: `hsl(${item.accent})` }}>{item.icon}</div>
            <span className="text-lg font-bold font-serif text-foreground">{item.value.toLocaleString()}</span>
            <span className="text-[9px] text-muted-foreground/70 font-serif">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
