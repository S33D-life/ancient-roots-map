import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SyncProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  ipfs_prefix: string | null;
  cycle_interval_minutes: number;
  is_active: boolean;
  last_cycle_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncAsset {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  file_path: string | null;
  content_hash: string | null;
  current_cid: string | null;
  pin_status: string;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SyncCycle {
  id: string;
  project_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  assets_processed: number;
  assets_verified: number;
  assets_conflicted: number;
  error_message: string | null;
  created_at: string;
}

export interface ChainAnchor {
  id: string;
  asset_id: string;
  chain: string;
  tx_hash: string | null;
  block_number: number | null;
  anchor_type: string;
  anchor_data: Record<string, unknown>;
  status: string;
  verified_at: string | null;
  created_at: string;
}

export interface SyncLog {
  id: string;
  project_id: string;
  cycle_id: string | null;
  asset_id: string | null;
  level: string;
  message: string;
  details: Record<string, unknown>;
  created_at: string;
}

export function useSyncOrchestration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const callEdge = useCallback(async (action: string, params: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const res = await supabase.functions.invoke("ipfs-sync", {
      body: { action, ...params },
    });

    if (res.error) throw new Error(res.error.message);
    return res.data;
  }, []);

  // Projects
  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("sync_projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as SyncProject[];
  }, []);

  const createProject = useCallback(async (name: string, description?: string, cycleMinutes = 15) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("sync_projects")
      .insert({ name, description: description || null, cycle_interval_minutes: cycleMinutes, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data as SyncProject;
  }, []);

  // Assets
  const fetchAssets = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from("sync_assets")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as SyncAsset[];
  }, []);

  const createAsset = useCallback(async (projectId: string, name: string, metadata?: Record<string, unknown>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("sync_assets")
      .insert([{ project_id: projectId, name, metadata: (metadata || {}) as any, user_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data as SyncAsset;
  }, []);

  // Cycles
  const fetchCycles = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from("sync_cycles")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []) as SyncCycle[];
  }, []);

  // Anchors
  const fetchAnchors = useCallback(async (assetId: string) => {
    const { data, error } = await supabase
      .from("chain_anchors")
      .select("*")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as ChainAnchor[];
  }, []);

  // Logs
  const fetchLogs = useCallback(async (projectId: string, limit = 50) => {
    const { data, error } = await supabase
      .from("sync_logs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as SyncLog[];
  }, []);

  // Actions
  const pinJson = useCallback(async (content: unknown, name: string, assetId?: string, projectId?: string) => {
    setLoading(true);
    try {
      const result = await callEdge("pin_json", { content, name, asset_id: assetId, project_id: projectId });
      toast({ title: "Pinned to IPFS", description: `CID: ${result.cid}` });
      return result;
    } catch (e) {
      toast({ title: "Pin failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [callEdge, toast]);

  const runCycle = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const result = await callEdge("run_cycle", { project_id: projectId });
      toast({
        title: "Sync cycle complete",
        description: `${result.processed} processed, ${result.verified} verified, ${result.conflicted} conflicted`,
      });
      return result;
    } catch (e) {
      toast({ title: "Cycle failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [callEdge, toast]);

  const anchorEthereum = useCallback(async (assetId: string, contentHash: string, cycleId?: string, projectId?: string) => {
    setLoading(true);
    try {
      const result = await callEdge("anchor_ethereum", {
        asset_id: assetId,
        content_hash: contentHash,
        cycle_id: cycleId,
        project_id: projectId,
      });
      toast({ title: "Ethereum anchor", description: `Block: ${result.block_number}` });
      return result;
    } catch (e) {
      toast({ title: "Anchor failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [callEdge, toast]);

  const anchorBitcoin = useCallback(async (assetId: string, contentHash: string, cycleId?: string, projectId?: string) => {
    setLoading(true);
    try {
      const result = await callEdge("anchor_bitcoin", {
        asset_id: assetId,
        content_hash: contentHash,
        cycle_id: cycleId,
        project_id: projectId,
      });
      toast({ title: "Bitcoin anchor submitted", description: "OpenTimestamps proof pending confirmation" });
      return result;
    } catch (e) {
      toast({ title: "Anchor failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [callEdge, toast]);

  return {
    loading,
    fetchProjects,
    createProject,
    fetchAssets,
    createAsset,
    fetchCycles,
    fetchAnchors,
    fetchLogs,
    pinJson,
    runCycle,
    anchorEthereum,
    anchorBitcoin,
  };
}
