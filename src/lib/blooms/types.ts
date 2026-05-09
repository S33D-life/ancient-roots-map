import type { Season } from "./season";

export interface BloomOffering {
  id: string;
  tree_id: string;
  user_id: string;
  image_url: string;
  note: string | null;
  species_guess: string | null;
  season: Season;
  year: number;
  latitude: number | null;
  longitude: number | null;
  hearts_rewarded: number;
  created_at: string;
}
