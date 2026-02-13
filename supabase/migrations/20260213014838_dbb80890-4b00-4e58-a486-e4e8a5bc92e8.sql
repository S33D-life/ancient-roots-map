
-- Sync Projects: user-defined sync configurations
CREATE TABLE public.sync_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ipfs_prefix TEXT DEFAULT '',
  cycle_interval_minutes INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_cycle_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync projects" ON public.sync_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sync projects" ON public.sync_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync projects" ON public.sync_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sync projects" ON public.sync_projects FOR DELETE USING (auth.uid() = user_id);

-- Sync Assets: individual files/items tracked in IPFS
CREATE TABLE public.sync_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.sync_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT,
  content_hash TEXT,
  current_cid TEXT,
  pin_status TEXT NOT NULL DEFAULT 'unpinned',
  version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync assets" ON public.sync_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sync assets" ON public.sync_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync assets" ON public.sync_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sync assets" ON public.sync_assets FOR DELETE USING (auth.uid() = user_id);

-- Sync Cycles: records of each sync run
CREATE TABLE public.sync_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.sync_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assets_processed INTEGER DEFAULT 0,
  assets_verified INTEGER DEFAULT 0,
  assets_conflicted INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync cycles" ON public.sync_cycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sync cycles" ON public.sync_cycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync cycles" ON public.sync_cycles FOR UPDATE USING (auth.uid() = user_id);

-- Chain Anchors: blockchain verification records
CREATE TABLE public.chain_anchors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.sync_assets(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.sync_cycles(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  chain TEXT NOT NULL DEFAULT 'ethereum',
  tx_hash TEXT,
  block_number BIGINT,
  anchor_type TEXT NOT NULL DEFAULT 'hash_commit',
  anchor_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chain_anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chain anchors" ON public.chain_anchors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create chain anchors" ON public.chain_anchors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chain anchors" ON public.chain_anchors FOR UPDATE USING (auth.uid() = user_id);

-- Sync Logs: detailed event log for transparency
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.sync_projects(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.sync_cycles(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES public.sync_assets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs" ON public.sync_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sync logs" ON public.sync_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CID History: version tracking for IPFS content
CREATE TABLE public.cid_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.sync_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  cid TEXT NOT NULL,
  version INTEGER NOT NULL,
  pin_status TEXT NOT NULL DEFAULT 'pinned',
  pinned_at TIMESTAMPTZ DEFAULT now(),
  unpinned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cid_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CID history" ON public.cid_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create CID history" ON public.cid_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CID history" ON public.cid_history FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_sync_assets_project ON public.sync_assets(project_id);
CREATE INDEX idx_sync_cycles_project ON public.sync_cycles(project_id);
CREATE INDEX idx_chain_anchors_asset ON public.chain_anchors(asset_id);
CREATE INDEX idx_sync_logs_project ON public.sync_logs(project_id);
CREATE INDEX idx_cid_history_asset ON public.cid_history(asset_id);

-- Triggers for updated_at
CREATE TRIGGER update_sync_projects_updated_at BEFORE UPDATE ON public.sync_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sync_assets_updated_at BEFORE UPDATE ON public.sync_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
