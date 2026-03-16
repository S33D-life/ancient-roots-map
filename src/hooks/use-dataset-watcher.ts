/**
 * Hook for the Dataset Watcher / Refresh Agent.
 * Manages watch state for approved tree_data_sources, change detection, and refresh recommendations.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WatchState {
  id: string;
  source_id: string;
  dataset_id: string | null;
  watch_enabled: boolean;
  last_checked_at: string | null;
  last_successful_check_at: string | null;
  last_known_source_hash: string | null;
  last_known_record_count: number | null;
  last_known_updated_label: string | null;
  last_known_file_url: string | null;
  last_known_file_size: number | null;
  change_detected: boolean;
  change_confidence: string;
  change_explanation: string | null;
  watch_status: string;
  refresh_recommendation: string;
  watch_notes: string | null;
  check_count: number;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
}

export interface WatchedSource {
  watch: WatchState;
  source: {
    id: string;
    name: string;
    url: string | null;
    country: string | null;
    region: string | null;
    source_type: string;
    data_format: string;
    integration_status: string;
    record_count: number | null;
    notes: string | null;
    last_checked: string | null;
  };
  dataset?: {
    id: string;
    name: string;
    tree_count: number | null;
    ingestion_status: string;
  } | null;
}

export type WatchStatus = "watching" | "stable" | "possible_change" | "confirmed_change" | "check_failed" | "paused";
export type RefreshRecommendation = "no_action" | "review_only" | "reseed_subset" | "delta_import" | "full_reimport" | "manual_follow_up";

const WATCH_STATUSES: WatchStatus[] = ["watching", "stable", "possible_change", "confirmed_change", "check_failed", "paused"];
const REFRESH_RECS: RefreshRecommendation[] = ["no_action", "review_only", "reseed_subset", "delta_import", "full_reimport", "manual_follow_up"];

export function useDatasetWatcher() {
  const [watchedSources, setWatchedSources] = useState<WatchedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; recommendation?: string }>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // Fetch sources that are at least queued/integrated
    const { data: sources, error: srcErr } = await (supabase.from as any)("tree_data_sources")
      .select("id, name, url, country, region, source_type, data_format, integration_status, record_count, notes, last_checked")
      .in("integration_status", ["queued", "crawling", "parsed", "normalised", "geocoded", "published"]);

    if (srcErr) { console.error(srcErr); setLoading(false); return; }

    // Fetch all watch states
    const { data: watches } = await (supabase.from as any)("dataset_watch_state").select("*");

    // Fetch datasets
    const { data: datasets } = await (supabase.from as any)("tree_datasets").select("id, name, tree_count, ingestion_status, source_id");

    const watchMap = new Map<string, WatchState>();
    (watches ?? []).forEach((w: WatchState) => watchMap.set(w.source_id, w));

    const datasetMap = new Map<string, any>();
    (datasets ?? []).forEach((d: any) => {
      if (!datasetMap.has(d.source_id)) datasetMap.set(d.source_id, d);
    });

    const combined: WatchedSource[] = (sources ?? []).map((src: any) => ({
      source: src,
      watch: watchMap.get(src.id) ?? null,
      dataset: datasetMap.get(src.id) ?? null,
    }));

    setWatchedSources(combined);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const ensureWatchState = async (sourceId: string): Promise<WatchState | null> => {
    // Check if already exists
    const { data: existing } = await (supabase.from as any)("dataset_watch_state")
      .select("*")
      .eq("source_id", sourceId)
      .maybeSingle();
    if (existing) return existing;

    // Create new
    const { data, error } = await (supabase.from as any)("dataset_watch_state")
      .insert({ source_id: sourceId })
      .select("*")
      .single();
    if (error) { toast.error("Failed to create watch state"); return null; }
    return data;
  };

  const toggleWatch = async (sourceId: string, enabled: boolean) => {
    const state = await ensureWatchState(sourceId);
    if (!state) return;
    await (supabase.from as any)("dataset_watch_state")
      .update({ watch_enabled: enabled, watch_status: enabled ? "watching" : "paused", updated_at: new Date().toISOString() })
      .eq("id", state.id);
    toast.success(enabled ? "Watch resumed" : "Watch paused");
    fetchAll();
  };

  const runManualCheck = async (sourceId: string, source: WatchedSource["source"]) => {
    const state = await ensureWatchState(sourceId);
    if (!state) return;

    const now = new Date().toISOString();
    let changeDetected = false;
    let confidence = "low";
    let explanation = "Manual check performed. No automated signals available — review source manually.";
    let recommendation: RefreshRecommendation = "review_only";
    let newStatus: WatchStatus = "stable";

    // Simple heuristic: compare record count if available
    if (source.record_count && state.last_known_record_count) {
      const diff = Math.abs(source.record_count - state.last_known_record_count);
      if (diff > 0) {
        changeDetected = true;
        confidence = diff > 10 ? "high" : "medium";
        explanation = `Record count changed: ${state.last_known_record_count} → ${source.record_count} (${diff > 0 ? "+" : ""}${source.record_count - state.last_known_record_count})`;
        recommendation = diff > 50 ? "full_reimport" : diff > 10 ? "reseed_subset" : "review_only";
        newStatus = confidence === "high" ? "confirmed_change" : "possible_change";
      }
    }

    // Compare URL changes
    if (source.url && state.last_known_file_url && source.url !== state.last_known_file_url) {
      changeDetected = true;
      confidence = "medium";
      explanation = "Source URL has changed.";
      recommendation = "review_only";
      newStatus = "possible_change";
    }

    await (supabase.from as any)("dataset_watch_state")
      .update({
        last_checked_at: now,
        last_successful_check_at: now,
        last_known_record_count: source.record_count ?? state.last_known_record_count,
        last_known_file_url: source.url ?? state.last_known_file_url,
        change_detected: changeDetected,
        change_confidence: confidence,
        change_explanation: explanation,
        watch_status: newStatus,
        refresh_recommendation: recommendation,
        check_count: (state.check_count ?? 0) + 1,
        consecutive_failures: 0,
        updated_at: now,
      })
      .eq("id", state.id);

    toast.success(changeDetected ? "Change detected — review recommended" : "Check complete — source appears stable");
    fetchAll();
  };

  const updateWatchState = async (id: string, updates: Partial<WatchState>) => {
    const { error } = await (supabase.from as any)("dataset_watch_state")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    fetchAll();
  };

  const markStable = async (id: string) => {
    await updateWatchState(id, {
      change_detected: false,
      watch_status: "stable" as any,
      refresh_recommendation: "no_action" as any,
      change_explanation: null,
    } as any);
    toast.success("Marked as stable");
  };

  // Filter
  const filtered = watchedSources.filter(ws => {
    if (filter.status && ws.watch?.watch_status !== filter.status) return false;
    if (filter.recommendation && ws.watch?.refresh_recommendation !== filter.recommendation) return false;
    return true;
  });

  const stats = {
    total: watchedSources.length,
    watching: watchedSources.filter(w => w.watch?.watch_enabled !== false).length,
    needsReview: watchedSources.filter(w => w.watch?.change_detected).length,
    stable: watchedSources.filter(w => w.watch?.watch_status === "stable").length,
    paused: watchedSources.filter(w => w.watch?.watch_status === "paused").length,
    withChanges: watchedSources.filter(w => ["possible_change", "confirmed_change"].includes(w.watch?.watch_status ?? "")).length,
  };

  return {
    watchedSources: filtered,
    allSources: watchedSources,
    loading,
    filter,
    setFilter,
    stats,
    toggleWatch,
    runManualCheck,
    updateWatchState,
    markStable,
    refresh: fetchAll,
    WATCH_STATUSES,
    REFRESH_RECS,
  };
}
