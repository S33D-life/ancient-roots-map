import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CollaboratorVolume {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  collaborator_name: string;
  collaborator_project: string | null;
  document_title: string;
  document_version: string;
  essence_summary: string | null;
  resonance_map: string | null;
  divergence_map: string | null;
  wanderer_summary: string | null;
  open_questions: string[] | null;
  micro_experiment: string | null;
  integration_intent: string;
  visibility_state: "root" | "ring" | "ripple";
  experiment_status: string;
  themes: string[];
  linked_tree_ids: string[];
  linked_pod_ids: string[];
  linked_council_sessions: string[];
  ring_hearts_awarded: boolean;
  ripple_hearts_awarded: boolean;
}

export interface CollaboratorExperiment {
  id: string;
  volume_id: string;
  user_id: string;
  description: string;
  timeline: string | null;
  metrics: string | null;
  status: string;
  outcome_notes: string | null;
  linked_tree_ids: string[];
  linked_pod_ids: string[];
  created_at: string;
  updated_at: string;
}

export function useCollaboratorVolumes(userId: string | null) {
  const [volumes, setVolumes] = useState<CollaboratorVolume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVolumes = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("collaborator_volumes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    setVolumes((data as CollaboratorVolume[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchVolumes(); }, [fetchVolumes]);

  const createVolume = useCallback(async (vol: Partial<CollaboratorVolume>) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("collaborator_volumes")
      .insert({ ...vol, user_id: userId, visibility_state: "root" } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchVolumes();
    return data as CollaboratorVolume;
  }, [userId, fetchVolumes]);

  const updateVolume = useCallback(async (id: string, updates: Partial<CollaboratorVolume>) => {
    const { error } = await supabase
      .from("collaborator_volumes")
      .update(updates as any)
      .eq("id", id);
    if (error) throw error;
    await fetchVolumes();
  }, [fetchVolumes]);

  const deleteVolume = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("collaborator_volumes")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await fetchVolumes();
  }, [fetchVolumes]);

  return { volumes, loading, fetchVolumes, createVolume, updateVolume, deleteVolume };
}

/** Fetch volumes visible on a specific tree (ripple state, linked) */
export function useLinkedVolumes(treeId: string | null) {
  const [volumes, setVolumes] = useState<CollaboratorVolume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!treeId) { setLoading(false); return; }
    supabase
      .from("collaborator_volumes")
      .select("*")
      .eq("visibility_state", "ripple")
      .contains("linked_tree_ids", [treeId])
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setVolumes((data as CollaboratorVolume[]) || []);
        setLoading(false);
      });
  }, [treeId]);

  return { volumes, loading };
}

/** Fetch community ring/ripple volumes (for Library browsing) */
export function useCommunityVolumes() {
  const [volumes, setVolumes] = useState<CollaboratorVolume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("collaborator_volumes")
      .select("*")
      .in("visibility_state", ["ring", "ripple"])
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setVolumes((data as CollaboratorVolume[]) || []);
        setLoading(false);
      });
  }, []);

  return { volumes, loading };
}
