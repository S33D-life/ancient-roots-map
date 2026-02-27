/**
 * SeasonalWitness — prompts users to revisit their mapped trees each season
 * and submit a seasonal photo. Shows a 4-panel mosaic on tree detail pages.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Check, Sun, Snowflake, Leaf, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SEASON_META = {
  spring: { icon: Flower2, color: "hsl(120 50% 50%)", label: "Spring" },
  summer: { icon: Sun, color: "hsl(42 90% 55%)", label: "Summer" },
  autumn: { icon: Leaf, color: "hsl(25 80% 50%)", label: "Autumn" },
  winter: { icon: Snowflake, color: "hsl(200 60% 65%)", label: "Winter" },
} as const;

type Season = keyof typeof SEASON_META;

function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

interface Props {
  treeId: string;
  userId: string;
  treeName?: string;
}

interface WitnessRecord {
  season: Season;
  year: number;
  photo_url: string | null;
}

const SeasonalWitness = ({ treeId, userId, treeName }: Props) => {
  const [witnesses, setWitnesses] = useState<WitnessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const currentSeason = getCurrentSeason();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("seasonal_witnesses")
        .select("season, year, photo_url")
        .eq("tree_id", treeId)
        .eq("user_id", userId)
        .eq("year", currentYear);
      setWitnesses((data as WitnessRecord[]) || []);
      setLoading(false);
    };
    fetch();
  }, [treeId, userId, currentYear]);

  const hasCurrentSeason = witnesses.some(w => w.season === currentSeason);
  const completedCount = witnesses.length;

  const handleWitness = async () => {
    const { error } = await supabase.from("seasonal_witnesses").insert({
      user_id: userId,
      tree_id: treeId,
      season: currentSeason,
      year: currentYear,
    });

    if (!error) {
      setWitnesses(prev => [...prev, { season: currentSeason, year: currentYear, photo_url: null }]);
      toast("🌿 Seasonal Witness recorded!", {
        description: `${SEASON_META[currentSeason].label} visit logged${completedCount >= 3 ? " · All 4 seasons complete! +5 bonus Hearts" : ""}`,
      });
    }
  };

  if (loading) return null;

  return (
    <div className="rounded-xl border p-3 space-y-2" style={{
      background: "hsl(var(--card) / 0.5)",
      borderColor: "hsl(var(--border) / 0.3)",
    }}>
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-xs text-foreground/80 tracking-wide">Seasonal Witness</h4>
        <span className="text-[10px] font-mono text-muted-foreground">{completedCount}/4</span>
      </div>

      {/* 4-panel mosaic */}
      <div className="grid grid-cols-4 gap-1">
        {(Object.keys(SEASON_META) as Season[]).map(season => {
          const meta = SEASON_META[season];
          const Icon = meta.icon;
          const done = witnesses.some(w => w.season === season);

          return (
            <div
              key={season}
              className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border"
              style={{
                background: done ? `${meta.color}15` : "hsl(var(--muted) / 0.2)",
                borderColor: done ? `${meta.color}40` : "hsl(var(--border) / 0.15)",
              }}
            >
              {done ? (
                <Check className="w-3.5 h-3.5" style={{ color: meta.color }} />
              ) : (
                <Icon className="w-3.5 h-3.5 text-muted-foreground/40" />
              )}
              <span className="text-[8px] font-serif text-muted-foreground/60">{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* CTA for current season */}
      {!hasCurrentSeason && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs font-serif gap-1.5"
          onClick={handleWitness}
          style={{ borderColor: SEASON_META[currentSeason].color + "40" }}
        >
          <Camera className="w-3 h-3" />
          Record {SEASON_META[currentSeason].label} Visit
        </Button>
      )}
    </div>
  );
};

export default SeasonalWitness;
