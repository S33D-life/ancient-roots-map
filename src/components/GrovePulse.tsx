import { useEffect, useState } from "react";
import { getUserQuickStats } from "@/repositories/hearts";
import { useUserOfferingCount } from "@/hooks/use-offering-counts";
import { motion } from "framer-motion";
import { Heart, TreeDeciduous, Gift, Sprout } from "lucide-react";
import { useSeasonalSummary } from "@/hooks/use-seasonal-summary";

interface GrovePulseProps {
  userId: string;
}

const GrovePulse = ({ userId }: GrovePulseProps) => {
  const [stats, setStats] = useState({ trees: 0, hearts: 0, seeds: 0 });
  const [loading, setLoading] = useState(true);
  const { count: offeringCount, loading: offeringsLoading } = useUserOfferingCount(userId);
  const seasonal = useSeasonalSummary();

  useEffect(() => {
    getUserQuickStats(userId).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [userId]);

  const isLoading = loading || offeringsLoading;

  // Vitality score drives animation speed and color warmth (0 = dormant, 100 = thriving)
  const vitality = Math.min(100, stats.trees * 5 + offeringCount * 3 + stats.hearts * 0.5 + stats.seeds * 2);
  const pulseSpeed = isLoading ? 4 : Math.max(1.5, 4 - vitality * 0.025);
  const warmth = isLoading ? 0 : Math.min(1, vitality / 60);

  // HSL interpolation: dormant=cool blue-green, active=warm amber
  const hue = 160 - warmth * 130; // 160 (teal) → 30 (amber)
  const sat = 30 + warmth * 50;
  const light = 35 + warmth * 20;

  const statItems = [
    { icon: TreeDeciduous, value: stats.trees, label: "Trees" },
    { icon: Gift, value: offeringCount, label: "Offerings" },
    { icon: Heart, value: stats.hearts, label: "Hearts" },
    { icon: Sprout, value: stats.seeds, label: "Seeds" },
  ];

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      {/* Pulse ring */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Outer breathing ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid hsla(${hue}, ${sat}%, ${light}%, 0.3)`,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Middle ring */}
        <motion.div
          className="absolute inset-3 rounded-full"
          style={{
            border: `1.5px solid hsla(${hue}, ${sat}%, ${light + 10}%, 0.25)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut", delay: pulseSpeed * 0.3 }}
        />

        {/* Core glow */}
        <motion.div
          className="absolute inset-8 rounded-full"
          style={{
            background: `radial-gradient(circle, hsla(${hue}, ${sat + 10}%, ${light + 15}%, ${0.2 + warmth * 0.2}), transparent)`,
          }}
          animate={{
            scale: [0.9, 1.05, 0.9],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: pulseSpeed * 0.8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Center icon */}
        <TreeDeciduous
          className="w-8 h-8 relative z-10"
          style={{ color: `hsl(${hue}, ${sat}%, ${light + 20}%)` }}
        />
      </div>

      {/* Vitality label */}
      <div className="text-center">
        <p className="text-[10px] font-serif tracking-[0.2em] uppercase text-muted-foreground/50">
          Grove Vitality
        </p>
         <p className="text-sm font-serif mt-0.5" style={{ color: `hsl(${hue}, ${sat}%, ${light + 20}%)` }}>
          {isLoading ? "Sensing…" : vitality < 20 ? "Dormant" : vitality < 50 ? "Stirring" : vitality < 80 ? "Flourishing" : "Thriving"}
        </p>
        {/* Seasonal sub-count overlay */}
        {seasonal.active && !isLoading && (
          <p className="text-[9px] text-muted-foreground/50 font-serif mt-1">
            {seasonal.emoji} {seasonal.summaryLine}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
        {statItems.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-card/30 border border-border/20">
            <s.icon className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-sm font-serif text-foreground/80">{isLoading ? "–" : s.value}</span>
            <span className="text-[9px] text-muted-foreground/40 font-serif">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrovePulse;
