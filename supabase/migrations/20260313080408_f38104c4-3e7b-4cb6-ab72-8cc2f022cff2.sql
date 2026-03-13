
-- ============================================================
-- Agent Garden Backend Contract — Schema Extensions
-- ============================================================

-- 1. Extend agent_profiles with tier, auth_method, external_marketplace
ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'seedling',
  ADD COLUMN IF NOT EXISTS auth_method text NOT NULL DEFAULT 'api_key',
  ADD COLUMN IF NOT EXISTS external_marketplace text,
  ADD COLUMN IF NOT EXISTS verified_contributions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejected_contributions integer NOT NULL DEFAULT 0;

-- 2. Agent Capabilities table
CREATE TABLE IF NOT EXISTS public.agent_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  capability_type text NOT NULL DEFAULT 'dataset_discovery',
  input_formats text[] NOT NULL DEFAULT '{}',
  output_formats text[] NOT NULL DEFAULT '{}',
  regions text[] NOT NULL DEFAULT '{}',
  species_focus text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Extend tree_data_sources with agent discovery fields
ALTER TABLE public.tree_data_sources
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS discovered_by_agent_id uuid REFERENCES public.agent_profiles(id);

-- 4. Extend tree_datasets with agent and ingestion fields
ALTER TABLE public.tree_datasets
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS ingestion_status text NOT NULL DEFAULT 'discovered',
  ADD COLUMN IF NOT EXISTS created_by_agent_id uuid REFERENCES public.agent_profiles(id);

-- 5. Extend research_trees with agent submission fields
ALTER TABLE public.research_trees
  ADD COLUMN IF NOT EXISTS submitted_by_agent_id uuid REFERENCES public.agent_profiles(id),
  ADD COLUMN IF NOT EXISTS confidence_score numeric,
  ADD COLUMN IF NOT EXISTS duplicate_of_record_id uuid REFERENCES public.research_trees(id),
  ADD COLUMN IF NOT EXISTS dataset_id uuid REFERENCES public.tree_datasets(id),
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS age_estimate text,
  ADD COLUMN IF NOT EXISTS heritage_status text,
  ADD COLUMN IF NOT EXISTS images_json jsonb DEFAULT '[]';

-- 6. Contribution Events (richer than agent_contributions)
CREATE TABLE IF NOT EXISTS public.agent_contribution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agent_profiles(id),
  contribution_type text NOT NULL DEFAULT 'records_submitted',
  source_id uuid REFERENCES public.tree_data_sources(id),
  dataset_id uuid REFERENCES public.tree_datasets(id),
  research_tree_record_id uuid REFERENCES public.research_trees(id),
  spark_report_id uuid REFERENCES public.spark_reports(id),
  payload_json jsonb DEFAULT '{}',
  validation_status text NOT NULL DEFAULT 'pending',
  reward_status text NOT NULL DEFAULT 'pending',
  hearts_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz,
  rewarded_at timestamptz
);

-- 7. Extend spark_reports with suggested_fix and status
ALTER TABLE public.spark_reports
  ADD COLUMN IF NOT EXISTS suggested_fix text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS research_tree_record_id uuid REFERENCES public.research_trees(id);

-- 8. Agent Reward Ledger
CREATE TABLE IF NOT EXISTS public.agent_reward_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agent_profiles(id),
  contribution_event_id uuid REFERENCES public.agent_contribution_events(id),
  reward_type text NOT NULL DEFAULT 'record_submission',
  hearts_amount integer NOT NULL DEFAULT 0,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz
);

-- 9. Agent Garden Tasks (open contribution opportunities)
CREATE TABLE IF NOT EXISTS public.agent_garden_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL DEFAULT 'discover_dataset',
  title text NOT NULL,
  description text,
  region text,
  country text,
  species text,
  reward_min integer NOT NULL DEFAULT 1,
  reward_max integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'open',
  claimed_by_agent_id uuid REFERENCES public.agent_profiles(id),
  source_id uuid REFERENCES public.tree_data_sources(id),
  dataset_id uuid REFERENCES public.tree_datasets(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10. RLS policies for new tables
ALTER TABLE public.agent_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_contribution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_reward_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_garden_tasks ENABLE ROW LEVEL SECURITY;

-- Public read on capabilities and tasks
CREATE POLICY "Anyone can view agent capabilities" ON public.agent_capabilities
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view agent garden tasks" ON public.agent_garden_tasks
  FOR SELECT USING (true);

-- Contribution events: public read, agent write
CREATE POLICY "Anyone can view contribution events" ON public.agent_contribution_events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert contribution events" ON public.agent_contribution_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- Reward ledger: public read
CREATE POLICY "Anyone can view reward ledger" ON public.agent_reward_ledger
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reward entries" ON public.agent_reward_ledger
  FOR INSERT TO authenticated WITH CHECK (true);

-- Capabilities insert/update for authenticated
CREATE POLICY "Authenticated users can insert capabilities" ON public.agent_capabilities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update capabilities" ON public.agent_capabilities
  FOR UPDATE TO authenticated USING (true);

-- Tasks management for authenticated
CREATE POLICY "Authenticated users can insert tasks" ON public.agent_garden_tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks" ON public.agent_garden_tasks
  FOR UPDATE TO authenticated USING (true);

-- 11. Validation trigger for agent contribution events
CREATE OR REPLACE FUNCTION public.validate_agent_contribution_event()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.contribution_type NOT IN (
    'dataset_discovered', 'dataset_parsed', 'records_submitted',
    'geocoding_completed', 'species_classified', 'duplicate_detected',
    'metadata_enriched', 'spark_reported', 'candidate_suggested'
  ) THEN
    RAISE EXCEPTION 'Invalid contribution_type: %', NEW.contribution_type;
  END IF;
  IF NEW.validation_status NOT IN ('pending', 'under_review', 'verified', 'rejected', 'needs_followup') THEN
    RAISE EXCEPTION 'Invalid validation_status: %', NEW.validation_status;
  END IF;
  IF NEW.reward_status NOT IN ('pending', 'awarded', 'denied') THEN
    RAISE EXCEPTION 'Invalid reward_status: %', NEW.reward_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_agent_contribution_event
  BEFORE INSERT OR UPDATE ON public.agent_contribution_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_agent_contribution_event();

-- 12. Trust score update function
CREATE OR REPLACE FUNCTION public.update_agent_trust_score(p_agent_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_verified integer;
  v_rejected integer;
  v_total integer;
  v_score numeric;
  v_tier text;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE validation_status = 'verified'),
    COUNT(*) FILTER (WHERE validation_status = 'rejected'),
    COUNT(*)
  INTO v_verified, v_rejected, v_total
  FROM agent_contribution_events
  WHERE agent_id = p_agent_id;

  -- Trust score: 0-100, starts at 50
  IF v_total = 0 THEN
    v_score := 50;
  ELSE
    v_score := LEAST(100, GREATEST(0,
      50 + (v_verified * 2) - (v_rejected * 5)
    ));
  END IF;

  -- Tier based on verified count
  IF v_verified >= 500 THEN v_tier := 'ancient_grove';
  ELSIF v_verified >= 100 THEN v_tier := 'deep_root';
  ELSIF v_verified >= 25 THEN v_tier := 'young_grove';
  ELSIF v_verified >= 5 THEN v_tier := 'sapling';
  ELSE v_tier := 'seedling';
  END IF;

  UPDATE agent_profiles
  SET trust_score = v_score,
      tier = v_tier,
      verified_contributions = v_verified,
      rejected_contributions = v_rejected,
      updated_at = now()
  WHERE id = p_agent_id;
END;
$$;

-- 13. Trigger to auto-update trust after contribution verification
CREATE OR REPLACE FUNCTION public.on_contribution_verified()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.validation_status IS DISTINCT FROM NEW.validation_status)
     AND NEW.validation_status IN ('verified', 'rejected') THEN
    PERFORM update_agent_trust_score(NEW.agent_id);

    -- If verified and reward pending, issue reward
    IF NEW.validation_status = 'verified' AND NEW.reward_status = 'pending' THEN
      NEW.reward_status := 'awarded';
      NEW.rewarded_at := now();

      -- Create reward ledger entry
      INSERT INTO agent_reward_ledger (agent_id, contribution_event_id, reward_type, hearts_amount, reason, status, issued_at)
      VALUES (NEW.agent_id, NEW.id, NEW.contribution_type, NEW.hearts_awarded, 'Auto-reward on verification', 'issued', now());

      -- Update agent hearts
      UPDATE agent_profiles
      SET hearts_earned = COALESCE(hearts_earned, 0) + NEW.hearts_awarded,
          last_active = now()
      WHERE id = NEW.agent_id;
    END IF;

    IF NEW.validation_status = 'rejected' AND NEW.reward_status = 'pending' THEN
      NEW.reward_status := 'denied';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_contribution_verified
  BEFORE UPDATE ON public.agent_contribution_events
  FOR EACH ROW EXECUTE FUNCTION public.on_contribution_verified();
