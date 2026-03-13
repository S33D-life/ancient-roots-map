
-- Agent Contribution System tables

-- 1. Agent profiles registry
CREATE TABLE public.agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  creator TEXT NOT NULL,
  agent_type TEXT NOT NULL DEFAULT 'crawler',
  description TEXT,
  connected_datasets TEXT[] DEFAULT '{}',
  trees_added INTEGER DEFAULT 0,
  contributions INTEGER DEFAULT 0,
  hearts_earned INTEGER DEFAULT 0,
  trust_score NUMERIC(4,2) DEFAULT 0.00,
  last_active TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  avatar_emoji TEXT DEFAULT '🤖',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Agent contributions log
CREATE TABLE public.agent_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agent_profiles(id) ON DELETE CASCADE NOT NULL,
  contribution_type TEXT NOT NULL DEFAULT 'tree_record',
  source_id UUID REFERENCES public.tree_data_sources(id) ON DELETE SET NULL,
  tree_id UUID REFERENCES public.trees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  verification_notes TEXT,
  hearts_awarded INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_contributions ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read agent_profiles" ON public.agent_profiles FOR SELECT USING (true);
CREATE POLICY "Public read agent_contributions" ON public.agent_contributions FOR SELECT USING (true);

-- Curator manage
CREATE POLICY "Curator manage agent_profiles" ON public.agent_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'curator'));
CREATE POLICY "Curator manage agent_contributions" ON public.agent_contributions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'curator'));

-- Validation triggers
CREATE OR REPLACE FUNCTION public.validate_agent_profile()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.agent_type NOT IN ('crawler', 'parser', 'geocoder', 'classifier', 'deduplicator', 'general') THEN
    RAISE EXCEPTION 'Invalid agent_type: %', NEW.agent_type;
  END IF;
  IF NEW.status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_agent_profile
  BEFORE INSERT OR UPDATE ON public.agent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_agent_profile();

CREATE OR REPLACE FUNCTION public.validate_agent_contribution()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.contribution_type NOT IN ('dataset_discovered', 'dataset_parsed', 'tree_record', 'species_classified', 'duplicate_detected', 'candidate_suggested') THEN
    RAISE EXCEPTION 'Invalid contribution_type: %', NEW.contribution_type;
  END IF;
  IF NEW.status NOT IN ('pending', 'verified', 'rejected', 'rewarded') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_agent_contribution
  BEFORE INSERT OR UPDATE ON public.agent_contributions
  FOR EACH ROW EXECUTE FUNCTION public.validate_agent_contribution();
