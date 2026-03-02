import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PressWorkForm =
  | "reflection"
  | "letter"
  | "seasonal_weaving"
  | "dialogue"
  | "myth_retold"
  | "story"
  | "essay"
  | "other";

export interface PressWork {
  id: string;
  user_id: string;
  title: string;
  body: string;
  form: PressWorkForm;
  epigraph: string | null;
  source_book_id: string | null;
  season: string | null;
  visibility: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePressWorks(userId: string | null) {
  const [works, setWorks] = useState<PressWork[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setWorks([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("press_works" as any)
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    setWorks((data as any as PressWork[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = useCallback(async (work: Partial<PressWork> & { id?: string }) => {
    if (!userId) return null;
    if (work.id) {
      const { data } = await supabase
        .from("press_works" as any)
        .update({ title: work.title, body: work.body, form: work.form, epigraph: work.epigraph, source_book_id: work.source_book_id, visibility: work.visibility, published_at: work.published_at, season: work.season } as any)
        .eq("id", work.id)
        .select()
        .single();
      await fetch();
      return data as any as PressWork;
    } else {
      const { data } = await supabase
        .from("press_works" as any)
        .insert({ ...work, user_id: userId } as any)
        .select()
        .single();
      await fetch();
      return data as any as PressWork;
    }
  }, [userId, fetch]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("press_works" as any).delete().eq("id", id);
    await fetch();
  }, [fetch]);

  return { works, loading, save, remove, refetch: fetch };
}
