import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SeasonalQuest {
  id: string;
  season: string;
  year: number;
  quest_type: string;
  quest_title: string;
  quest_description: string | null;
  target_count: number;
  current_count: number;
  completed: boolean;
  completed_at: string | null;
  hearts_awarded: number;
  species_hearts_awarded: number;
}

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

const QUEST_DEFINITIONS: Record<string, Array<{
  quest_type: string;
  quest_title: string;
  quest_description: string;
  target_count: number;
  hearts_reward: number;
}>> = {
  spring: [
    { quest_type: "map_flowering", quest_title: "Spring Blossoms", quest_description: "Map 3 flowering trees this spring", target_count: 3, hearts_reward: 10 },
    { quest_type: "offering_photo", quest_title: "Blossom Witness", quest_description: "Add a photo offering to a flowering tree", target_count: 1, hearts_reward: 5 },
  ],
  summer: [
    { quest_type: "map_any", quest_title: "Summer Explorer", quest_description: "Map 5 trees during summer", target_count: 5, hearts_reward: 15 },
    { quest_type: "offering_song", quest_title: "Song of Summer", quest_description: "Add a song offering to an Ancient Friend", target_count: 1, hearts_reward: 5 },
  ],
  autumn: [
    { quest_type: "map_harvest", quest_title: "Harvest Guardian", quest_description: "Document a harvest tree this autumn", target_count: 1, hearts_reward: 10 },
    { quest_type: "offering_poem", quest_title: "Autumn Verses", quest_description: "Write 3 poem offerings during autumn", target_count: 3, hearts_reward: 10 },
  ],
  winter: [
    { quest_type: "map_evergreen", quest_title: "Winter Watch", quest_description: "Map 2 evergreen trees this winter", target_count: 2, hearts_reward: 10 },
    { quest_type: "offering_memory", quest_title: "Solstice Memories", quest_description: "Share a memory at an Ancient Friend", target_count: 1, hearts_reward: 5 },
  ],
};

export function useSeasonalQuests(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const season = getCurrentSeason();
  const year = new Date().getFullYear();

  const query = useQuery({
    queryKey: ["seasonal-quests", userId, season, year],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<SeasonalQuest[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("seasonal_quests" as any)
        .select("*")
        .eq("user_id", userId)
        .eq("season", season)
        .eq("year", year);
      if (error) { console.error("Quests fetch error:", error); return []; }
      return (data || []) as unknown as SeasonalQuest[];
    },
  });

  // Initialize quests for current season if none exist
  const initQuests = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const defs = QUEST_DEFINITIONS[season] || [];
      const inserts = defs.map(d => ({
        user_id: userId,
        season,
        year,
        quest_type: d.quest_type,
        quest_title: d.quest_title,
        quest_description: d.quest_description,
        target_count: d.target_count,
        hearts_awarded: 0,
      }));
      // Use upsert to avoid duplicates
      await supabase.from("seasonal_quests" as any).upsert(inserts, { onConflict: "user_id,season,year,quest_type" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seasonal-quests", userId] }),
  });

  return { ...query, initQuests, season, year };
}

export { getCurrentSeason, QUEST_DEFINITIONS };
