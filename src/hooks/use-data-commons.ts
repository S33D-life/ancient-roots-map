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

export function useDataCommons() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [datasets, setDatasets] = useState<DataDataset[]>([]);
  const [crawlTasks, setCrawlTasks] = useState<CrawlTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [srcRes, dsRes, taskRes] = await Promise.all([
      (supabase.from as any)("tree_data_sources").select("*").order("name"),
      (supabase.from as any)("tree_datasets").select("*").order("name"),
      (supabase.from as any)("tree_crawl_tasks").select("*").order("priority", { ascending: true }),
    ]);
    setSources((srcRes.data as DataSource[]) || []);
    setDatasets((dsRes.data as DataDataset[]) || []);
    setCrawlTasks((taskRes.data as CrawlTask[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalRecords = sources.reduce((a, s) => a + (s.record_count || 0), 0);
  const countries = new Set(sources.map(s => s.country).filter(Boolean));
  const allSpecies = new Set(sources.flatMap(s => s.species_keys || []));
  const integrated = sources.filter(s => s.integration_status === "published");

  return {
    sources, datasets, crawlTasks, loading, refetch: fetchAll,
    stats: {
      totalSources: sources.length,
      totalRecords,
      countriesCovered: countries.size,
      speciesRepresented: allSpecies.size,
      datasetsIntegrated: integrated.length,
    },
  };
}
