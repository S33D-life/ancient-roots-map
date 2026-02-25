import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface PhenologyRow {
  species: string;
  season_stage: string;
  region: string | null;
  month: number;
  year: number;
  observation_count: number;
  avg_mood: number | null;
}

const STAGE_ICONS: Record<string, string> = {
  bud: "🌱", leaf: "🍃", blossom: "🌸", fruit: "🍎", bare: "🪵",
};
const STAGE_COLORS: Record<string, string> = {
  bud: "120 50% 45%", leaf: "140 45% 40%", blossom: "330 60% 60%", fruit: "30 70% 50%", bare: "30 20% 40%",
};

interface Props {
  species?: string;
  region?: string | null;
}

/**
 * BloomingClock — visualises seasonal phenology predictions from check-in data.
 * Shows a 12-month ring with dominant season stage per month.
 */
const BloomingClock = ({ species, region }: Props) => {
  const [data, setData] = useState<PhenologyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let q = supabase.from("species_phenology").select("*").order("month");
      if (species) q = q.eq("species", species);
      if (region) q = q.eq("region", region);
      const { data: rows } = await q.limit(200);
      setData(rows || []);
      setLoading(false);
    };
    fetch();
  }, [species, region]);

  if (loading) return null;
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border p-5 text-center bg-card/60 backdrop-blur">
        <p className="text-xs text-muted-foreground font-serif italic">
          Not enough check-in observations yet to show the Blooming Clock.
        </p>
      </div>
    );
  }

  // Build month → dominant stage map
  const monthMap: Record<number, { stage: string; count: number; mood: number | null }> = {};
  data.forEach((r) => {
    const existing = monthMap[r.month];
    if (!existing || r.observation_count > existing.count) {
      monthMap[r.month] = { stage: r.season_stage, count: r.observation_count, mood: r.avg_mood };
    }
  });

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="rounded-xl border border-border p-5 bg-card/60 backdrop-blur space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🕰️</span>
        <div>
          <h3 className="font-serif text-sm tracking-wide text-foreground">Blooming Clock</h3>
          <p className="text-[10px] text-muted-foreground font-serif">
            {species ? `${species} seasonal rhythm` : "Cross-species seasonal rhythm"}
          </p>
        </div>
      </div>

      {/* Month ring */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
        {MONTHS.map((label, i) => {
          const m = i + 1;
          const entry = monthMap[m];
          const isCurrent = m === currentMonth;
          const stage = entry?.stage || "bare";
          const hsl = STAGE_COLORS[stage] || STAGE_COLORS.bare;

          return (
            <motion.div
              key={m}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`flex flex-col items-center rounded-lg p-1.5 border transition-colors ${
                isCurrent ? "border-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]" : "border-border/30"
              }`}
              style={{ background: entry ? `hsl(${hsl} / 0.15)` : undefined }}
            >
              <span className="text-base">{STAGE_ICONS[stage] || "·"}</span>
              <span className="text-[9px] font-serif text-muted-foreground">{label}</span>
              {entry && (
                <span className="text-[8px] text-muted-foreground/60 font-mono">{entry.count}</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(STAGE_ICONS).map(([stage, icon]) => (
          <span key={stage} className="text-[9px] font-serif text-muted-foreground flex items-center gap-0.5">
            {icon} {stage}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BloomingClock;
