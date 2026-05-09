/**
 * Blooms repository — list + create bloom offerings.
 */
import { supabase } from "@/integrations/supabase/client";
import { deriveSeason, deriveYear, type Season } from "@/lib/blooms/season";
import type { BloomOffering } from "@/lib/blooms/types";

const BUCKET = "bloom-offerings";

export async function listBloomsForTree(treeId: string): Promise<BloomOffering[]> {
  const { data, error } = await supabase
    .from("bloom_offerings" as any)
    .select("*")
    .eq("tree_id", treeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as BloomOffering[];
}

export async function uploadBloomPhoto(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export interface CreateBloomInput {
  treeId: string;
  userId: string;
  imageUrl: string;
  note?: string;
  speciesGuess?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreateBloomResult {
  bloom: BloomOffering;
  heartsAwarded: number;
  firstOfSeason: boolean;
}

const HEARTS_BASE = 2;
const HEARTS_FIRST_OF_SEASON_BONUS = 3;

export async function createBloomOffering(input: CreateBloomInput): Promise<CreateBloomResult> {
  const now = new Date();
  const season: Season = deriveSeason(now);
  const year = deriveYear(now);

  // Detect first-of-season for this tree
  const { count } = await supabase
    .from("bloom_offerings" as any)
    .select("*", { count: "exact", head: true })
    .eq("tree_id", input.treeId)
    .eq("season", season)
    .eq("year", year);

  const firstOfSeason = (count ?? 0) === 0;
  const hearts = HEARTS_BASE + (firstOfSeason ? HEARTS_FIRST_OF_SEASON_BONUS : 0);

  const { data, error } = await supabase
    .from("bloom_offerings" as any)
    .insert({
      tree_id: input.treeId,
      user_id: input.userId,
      image_url: input.imageUrl,
      note: input.note?.trim() || null,
      species_guess: input.speciesGuess?.trim() || null,
      season,
      year,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      hearts_rewarded: hearts,
    } as any)
    .select()
    .single();
  if (error) throw error;

  // Award hearts (best-effort; do not fail the offering if this fails)
  try {
    await supabase.from("heart_transactions").insert({
      user_id: input.userId,
      tree_id: input.treeId,
      heart_type: firstOfSeason ? "bloom_first_of_season" : "bloom_offering",
      amount: hearts,
    } as any);
  } catch (e) {
    console.warn("[blooms] heart award failed", e);
  }

  return {
    bloom: data as unknown as BloomOffering,
    heartsAwarded: hearts,
    firstOfSeason,
  };
}
