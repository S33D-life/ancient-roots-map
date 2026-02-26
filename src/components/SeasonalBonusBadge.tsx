/**
 * SeasonalBonusBadge — shows when user's check-in season matches phenology prediction.
 * Awards bonus hearts during "bloom sync" moments.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Props {
  species: string;
  currentSeasonStage: string;
}

const STAGE_BONUS_LABELS: Record<string, string> = {
  bud: "Spring Awakening",
  blossom: "Bloom Witness",
  fruit: "Harvest Season",
  leaf: "Canopy Full",
  bare: "Winter Vigil",
};

export function useSeasonalBonus(species: string, currentStage: string) {
  const [isMatch, setIsMatch] = useState(false);
  const [predictedStage, setPredictedStage] = useState<string | null>(null);

  useEffect(() => {
    const month = new Date().getMonth() + 1;
    supabase
      .from("species_phenology")
      .select("season_stage, observation_count")
      .eq("species", species)
      .eq("month", month)
      .order("observation_count", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPredictedStage(data.season_stage);
          setIsMatch(data.season_stage === currentStage);
        }
      });
  }, [species, currentStage]);

  return { isMatch, predictedStage };
}

export default function SeasonalBonusBadge({ species, currentSeasonStage }: Props) {
  const { isMatch, predictedStage } = useSeasonalBonus(species, currentSeasonStage);

  if (!isMatch || !predictedStage) return null;

  const label = STAGE_BONUS_LABELS[predictedStage] || "Season Sync";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Badge
        className="font-serif text-[10px] tracking-wider gap-1 border-primary/40 bg-primary/10 text-primary"
        variant="outline"
      >
        🌸 {label} · +1 Bonus Heart
      </Badge>
    </motion.div>
  );
}
