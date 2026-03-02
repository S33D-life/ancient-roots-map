import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PressChapter {
  id: string;
  work_id: string;
  title: string;
  body: string;
  epigraph: string | null;
  artwork_url: string | null;
  chapter_order: number;
  linked_tree_id: string | null;
  linked_bio_region_id: string | null;
  unlock_mode: "always_available" | "tree_visit_required" | "council_granted";
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterWithUnlock extends PressChapter {
  unlocked: boolean;
  linkedTreeName?: string | null;
}

/**
 * Manages chapters for a given press work, including tree-visit unlock checks.
 */
export function usePressChapters(workId: string | null, userId: string | null) {
  const [chapters, setChapters] = useState<PressChapter[]>([]);
  const [visitedTreeIds, setVisitedTreeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch chapters
  const fetchChapters = useCallback(async () => {
    if (!workId) { setChapters([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("press_chapters" as any)
      .select("*")
      .eq("work_id", workId)
      .order("chapter_order", { ascending: true });
    setChapters((data as any as PressChapter[]) || []);
    setLoading(false);
  }, [workId]);

  // Fetch user's visited tree IDs (from meetings + tree_checkins)
  const fetchVisits = useCallback(async () => {
    if (!userId) { setVisitedTreeIds(new Set()); return; }
    const [meetingsRes, checkinsRes] = await Promise.all([
      supabase.from("meetings").select("tree_id").eq("user_id", userId),
      supabase.from("tree_checkins").select("tree_id").eq("user_id", userId),
    ]);
    const ids = new Set<string>();
    (meetingsRes.data || []).forEach((m: any) => ids.add(m.tree_id));
    (checkinsRes.data || []).forEach((c: any) => ids.add(c.tree_id));
    setVisitedTreeIds(ids);
  }, [userId]);

  useEffect(() => { fetchChapters(); }, [fetchChapters]);
  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  // Compute unlock status for each chapter
  const chaptersWithUnlock: ChapterWithUnlock[] = useMemo(
    () =>
      chapters.map((ch) => {
        let unlocked = true;
        if (ch.unlock_mode === "tree_visit_required" && ch.linked_tree_id) {
          unlocked = visitedTreeIds.has(ch.linked_tree_id);
        }
        if (ch.unlock_mode === "council_granted") {
          unlocked = false; // future: check council grants
        }
        return { ...ch, unlocked };
      }),
    [chapters, visitedTreeIds]
  );

  // Save / create chapter
  const saveChapter = useCallback(
    async (ch: Partial<PressChapter> & { id?: string }) => {
      if (!workId) return null;
      const payload = {
        title: ch.title,
        body: ch.body,
        epigraph: ch.epigraph,
        artwork_url: ch.artwork_url,
        chapter_order: ch.chapter_order ?? chapters.length,
        linked_tree_id: ch.linked_tree_id,
        linked_bio_region_id: ch.linked_bio_region_id,
        unlock_mode: ch.unlock_mode || "always_available",
        visibility: ch.visibility || "private",
      };
      if (ch.id) {
        await supabase.from("press_chapters" as any).update(payload as any).eq("id", ch.id);
      } else {
        await supabase.from("press_chapters" as any).insert({ ...payload, work_id: workId } as any);
      }
      await fetchChapters();
    },
    [workId, chapters.length, fetchChapters]
  );

  const removeChapter = useCallback(
    async (id: string) => {
      await supabase.from("press_chapters" as any).delete().eq("id", id);
      await fetchChapters();
    },
    [fetchChapters]
  );

  return { chapters: chaptersWithUnlock, loading, saveChapter, removeChapter, refetch: fetchChapters };
}
