import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sprout, Clock } from "lucide-react";
import type { PlantedSeed } from "@/hooks/use-seed-economy";

interface Props {
  seeds: PlantedSeed[];
  userId: string;
}

function timeUntil(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "Bloomed!";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function progressPct(plantedAt: string, bloomsAt: string): number {
  const start = new Date(plantedAt).getTime();
  const end = new Date(bloomsAt).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

const VaultSproutingSeeds = ({ seeds, userId }: Props) => {
  const [, setTick] = useState(0);

  // Refresh timers every 30s
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  const mySeeds = seeds.filter(
    s => s.planter_id === userId && !s.collected_by
  );
  const sprouting = mySeeds.filter(s => new Date(s.blooms_at) > new Date());
  const bloomed = mySeeds.filter(s => new Date(s.blooms_at) <= new Date());

  if (sprouting.length === 0 && bloomed.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <Sprout className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-serif tracking-wide text-foreground">Active Seeds</h3>
          <span className="ml-auto text-[10px] font-serif text-muted-foreground">
            {sprouting.length} sprouting · {bloomed.length} bloomed
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Bloomed first */}
          {bloomed.map((seed, i) => (
            <motion.div
              key={seed.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-primary/20 bg-primary/5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="text-base animate-pulse-glow">✨</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-primary truncate">Ready to collect!</p>
                <p className="text-[10px] text-muted-foreground font-serif">
                  Planted {new Date(seed.planted_at).toLocaleDateString()}
                </p>
              </div>
              <span className="text-[10px] text-primary font-serif">3 hearts await</span>
            </motion.div>
          ))}

          {/* Sprouting */}
          {sprouting.map((seed, i) => {
            const pct = progressPct(seed.planted_at, seed.blooms_at);
            return (
              <motion.div
                key={seed.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 bg-card/30"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (bloomed.length + i) * 0.05 }}
              >
                <span className="text-base">🌱</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-serif text-muted-foreground">Sprouting…</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="font-serif">{timeUntil(seed.blooms_at)}</span>
                    </div>
                  </div>
                  {/* Growth ring progress */}
                  <div className="h-1 rounded-full overflow-hidden bg-muted/30">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, hsl(120, 40%, 35%), hsl(42, 80%, 50%))" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VaultSproutingSeeds;
