import { supabase } from "@/integrations/supabase/client";
import { supabaseEnv } from "@/config/env";

export function recordedPhoto(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.origin === new URL(supabaseEnv.url).origin &&
      parsed.pathname.startsWith("/storage/v1/object/public/") ? parsed.href : null;
  } catch { return null; }
}

export async function readRootsPresence() {
  const [friend, census] = await Promise.all([
    supabase.from("trees")
      .select("id,name,species,photo_thumb_url,photo_processed_url")
      .is("merged_into_tree_id", null)
      .not("photo_thumb_url", "is", null)
      .order("created_at", { ascending: false }).limit(1),
    supabase.from("trees").select("id", { count: "exact", head: true })
      .is("merged_into_tree_id", null),
  ]);
  const record = !friend.error ? friend.data?.[0] : null;
  const photo = recordedPhoto(record?.photo_processed_url ?? null) ?? recordedPhoto(record?.photo_thumb_url ?? null);
  return {
    friend: record && photo && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.id)
      ? { ...record, photo } : null,
    count: !census.error && census.count !== null ? census.count : null,
  };
}

