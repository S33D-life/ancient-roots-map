/**
 * Hook for the Dataset Discovery Agent — manages discovery queue CRUD, scoring, and promotion.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DiscoveryCandidate {
  id: string;
  source_name: string;
  source_url: string | null;
  source_org: string | null;
  country_code: string | null;
  country_name: string | null;
  region_name: string | null;
  dataset_type: string;
  data_format: string;
  update_frequency: string | null;
  discovery_method: string;
  discovery_confidence: string;
  access_type: string;
  license_notes: string | null;
  api_available: boolean;
  download_available: boolean;
  geo_available: boolean;
  individual_trees: boolean;
  species_detail: boolean;
  estimated_record_count: number | null;
  status: string;
  review_notes: string | null;
  score_official_status: number | null;
  score_geographic_precision: number | null;
  score_individual_records: number | null;
  score_species_detail: number | null;
  score_heritage_value: number | null;
  score_public_accessibility: number | null;
  score_licensing_clarity: number | null;
  score_update_frequency: number | null;
  score_map_compatibility: number | null;
  score_story_value: number | null;
  readiness_score: number | null;
  priority_tier: string | null;
  promoted_source_id: string | null;
  discovered_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DiscoveryStatus = "discovered" | "review_needed" | "approved" | "rejected" | "seed_ready" | "integrated";

const STATUSES: DiscoveryStatus[] = ["discovered", "review_needed", "approved", "rejected", "seed_ready", "integrated"];

export function useDiscoveryAgent() {
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; country?: string; type?: string; sort?: string }>({});

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    let query = (supabase.from as any)("dataset_discovery_queue")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter.status) query = query.eq("status", filter.status);
    if (filter.country) query = query.eq("country_code", filter.country);
    if (filter.type) query = query.eq("dataset_type", filter.type);

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load discovery queue");
      console.error(error);
    }

    let sorted = (data ?? []) as DiscoveryCandidate[];
    if (filter.sort === "readiness") {
      sorted = sorted.sort((a, b) => (b.readiness_score ?? 0) - (a.readiness_score ?? 0));
    } else if (filter.sort === "story") {
      sorted = sorted.sort((a, b) => (b.score_story_value ?? 0) - (a.score_story_value ?? 0));
    }

    setCandidates(sorted);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const addCandidate = async (data: Partial<DiscoveryCandidate>) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await (supabase.from as any)("dataset_discovery_queue").insert({
      ...data,
      discovered_by: user?.id ?? null,
    });
    if (error) { toast.error("Failed to add candidate"); return false; }
    toast.success("Source added to discovery queue");
    fetchCandidates();
    return true;
  };

  const updateCandidate = async (id: string, updates: Partial<DiscoveryCandidate>) => {
    const { error } = await (supabase.from as any)("dataset_discovery_queue")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Update failed"); return false; }
    fetchCandidates();
    return true;
  };

  const updateStatus = async (id: string, status: DiscoveryStatus) => {
    return updateCandidate(id, { status } as any);
  };

  const promoteToSource = async (candidate: DiscoveryCandidate) => {
    // Insert into tree_data_sources
    const { data, error } = await (supabase.from as any)("tree_data_sources").insert({
      name: candidate.source_name,
      url: candidate.source_url,
      country: candidate.country_name,
      region: candidate.region_name,
      scope: "national",
      source_type: candidate.dataset_type === "heritage_trees" ? "heritage" : "mixed",
      data_format: candidate.data_format === "rest_api" ? "api" : candidate.data_format === "geojson" ? "geojson" : candidate.data_format === "csv" ? "csv" : "manual",
      integration_status: "queued",
      notes: candidate.review_notes,
      license: candidate.license_notes,
    }).select("id").single();

    if (error) { toast.error("Failed to promote source"); return false; }

    // Link back
    await updateCandidate(candidate.id, { status: "integrated", promoted_source_id: data.id } as any);
    toast.success("Promoted to Tree Data Sources");
    return true;
  };

  const stats = {
    total: candidates.length,
    discovered: candidates.filter(c => c.status === "discovered").length,
    reviewing: candidates.filter(c => c.status === "review_needed").length,
    approved: candidates.filter(c => c.status === "approved").length,
    seedReady: candidates.filter(c => c.status === "seed_ready").length,
    integrated: candidates.filter(c => c.status === "integrated").length,
    highPriority: candidates.filter(c => c.priority_tier === "high_priority").length,
  };

  return {
    candidates,
    loading,
    filter,
    setFilter,
    stats,
    addCandidate,
    updateCandidate,
    updateStatus,
    promoteToSource,
    refresh: fetchCandidates,
    STATUSES,
  };
}
