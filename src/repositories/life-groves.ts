/**
 * life-groves repository — Supabase access for life_groves & life_grove_offerings.
 */
import { supabase } from "@/integrations/supabase/client";
import type { LifeGrove, LifeGroveOffering } from "@/lib/life-groves/types";

const OFFERING_COLUMNS="id,life_grove_id,contributor_user_id,contributor_name,offering_type,title,body_text,media_url,visibility,memory_position_data,created_at,media_metadata,media_type,updated_at,hidden_at";

export async function listMyLifeGroves(userId: string): Promise<LifeGrove[]> {
  if (!userId) return [];
  const { data, error } = await (supabase as any).rpc("list_my_life_groves");
  if (error) throw error;
  return (data ?? []) as unknown as LifeGrove[];
}

export async function getLifeGrove(id: string): Promise<LifeGrove | null> {
  const { data, error } = await supabase
    .from("life_groves")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as LifeGrove | null;
}

export async function getLifeGroveByToken(token: string) {
  const { data, error } = await supabase.rpc("get_life_grove_by_invite_token", { p_token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}

export async function createLifeGrove(
  input: Partial<LifeGrove> & { created_by: string; grove_title: string },
): Promise<LifeGrove> {
  const { data, error } = await supabase
    .from("life_groves")
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as LifeGrove;
}

export async function listOfferings(life_grove_id: string): Promise<LifeGroveOffering[]> {
  const { data, error } = await supabase
    .from("life_grove_offerings")
    .select(OFFERING_COLUMNS)
    .eq("life_grove_id", life_grove_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LifeGroveOffering[];
}

export async function createOffering(
  input: Omit<LifeGroveOffering, "id" | "created_at">,
): Promise<LifeGroveOffering> {
  const { data, error } = await supabase
    .from("life_grove_offerings")
    .insert(input as never)
    .select(OFFERING_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as LifeGroveOffering;
}
