/**
 * LedgerStats — Aggregate summary stats for the Tree Ledger header.
 */
import { motion } from "framer-motion";
import { TreePine, Leaf, Globe, Eye, Users, Heart, Sparkles } from "lucide-react";

interface LedgerStatsProps {
  totalTrees: number;
  speciesCount: number;
  nationsCount: number;
  totalVisits: number;
  uniqueMappers: number;
  heartsGenerated: number;
  windfallsTriggered: number;
  loading?: boolean;
}

const LedgerStats = ({
  totalTrees,
  speciesCount,
  nationsCount,
  totalVisits,
  uniqueMappers,
  heartsGenerated,
  windfallsTriggered,
  loading,
}: LedgerStatsProps) => {
  const stats = [
    { icon: TreePine, label: "Trees", value: totalTrees, color: "hsl(var(--primary))" },
    { icon: Leaf, label: "Species", value: speciesCount, color: "hsl(120 45% 50%)" },
    { icon: Globe, label: "Nations", value: nationsCount, color: "hsl(210 60% 55%)" },
    { icon: Eye, label: "Visits", value: totalVisits, color: "hsl(270 50% 55%)" },
    { icon: Users, label: "Mappers", value: uniqueMappers, color: "hsl(190 60% 50%)" },
    { icon: Heart, label: "Hearts", value: heartsGenerated, color: "hsl(350 70% 55%)" },
    { icon: Sparkles, label: "Windfalls", value: windfallsTriggered, color: "hsl(42 80% 55%)" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur p-4 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 50% 80%, ${stat.color}, transparent)`,
            }}
          />
          <stat.icon
            className="w-4 h-4 mx-auto mb-1.5"
            style={{ color: stat.color }}
          />
          <p className="text-xl font-serif font-bold tabular-nums text-foreground">
            {loading ? "—" : stat.value.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default LedgerStats;
