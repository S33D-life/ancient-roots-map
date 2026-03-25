ALTER TABLE public.agent_profiles 
  ADD COLUMN IF NOT EXISTS agent_role text NOT NULL DEFAULT 'research',
  ADD COLUMN IF NOT EXISTS connection_mode text NOT NULL DEFAULT 'read_only';