import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DataSource {
  id: string;
  name: string;
  url: string | null;
  country: string | null;
  scope: string;
  source_type: string;
  data_format: string;
  license: string | null;
  update_frequency: string | null;
  integration_status: string;
  last_checked: string | null;
  notes: string | null;
  species_keys: string[];
  record_count: number;
  created_at: string;
}

export interface DataDataset {
  id: string;
  source_id: string;
  name: string;
  tree_count: number;
  regions_covered: string[];
  species_coverage: string[];
  map_layer_key: string | null;
  map_layer_enabled: boolean;
  ledger_linked: boolean;
  last_update: string | null;
  created_at: string;
}

export interface CrawlTask {
  id: string;
  source_id: string;
  country: string | null;
  crawl_type: string;
  priority: number;
  status: string;
  last_attempt: string | null;
  next_action: string | null;
  created_at: string;
}

export interface AgentProfile {
  id: string;
  agent_name: string;
  creator: string;
  agent_type: string;
  description: string | null;
  connected_datasets: string[];
  trees_added: number;
  contributions: number;
  hearts_earned: number;
  trust_score: number;
  last_active: string | null;
  status: string;
  avatar_emoji: string;
  created_at: string;
}

export interface AgentContribution {
  id: string;
  agent_id: string;
  contribution_type: string;
  source_id: string | null;
  tree_id: string | null;
  status: string;
  verification_notes: string | null;
  hearts_awarded: number;
  created_at: string;
}

export function useDataCommons() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [datasets, setDatasets] = useState<DataDataset[]>([]);
  const [crawlTasks, setCrawlTasks] = useState<CrawlTask[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [agentContributions, setAgentContributions] = useState<AgentContribution[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [srcRes, dsRes, taskRes, agentRes, contribRes] = await Promise.all([
      (supabase.from as any)("tree_data_sources").select("*").order("name"),
      (supabase.from as any)("tree_datasets").select("*").order("name"),
      (supabase.from as any)("tree_crawl_tasks").select("*").order("priority", { ascending: true }),
      (supabase.from as any)("agent_profiles").select("*").order("trust_score", { ascending: false }),
      (supabase.from as any)("agent_contributions").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setSources((srcRes.data as DataSource[]) || []);
    setDatasets((dsRes.data as DataDataset[]) || []);
    setCrawlTasks((taskRes.data as CrawlTask[]) || []);
    setAgents((agentRes.data as AgentProfile[]) || []);
    setAgentContributions((contribRes.data as AgentContribution[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalRecords = sources.reduce((a, s) => a + (s.record_count || 0), 0);
  const countries = new Set(sources.map(s => s.country).filter(Boolean));
  const allSpecies = new Set(sources.flatMap(s => s.species_keys || []));
  const integrated = sources.filter(s => s.integration_status === "published");

  return {
    sources, datasets, crawlTasks, agents, agentContributions, loading, refetch: fetchAll,
    stats: {
      totalSources: sources.length,
      totalRecords,
      countriesCovered: countries.size,
      speciesRepresented: allSpecies.size,
      datasetsIntegrated: integrated.length,
      activeAgents: agents.filter(a => a.status === "active").length,
    },
  };
}
