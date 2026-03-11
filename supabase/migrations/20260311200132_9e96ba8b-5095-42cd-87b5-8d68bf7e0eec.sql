
-- ═══════════════════════════════════════════════════════════
-- GOVERNANCE FOUNDATIONS
-- ═══════════════════════════════════════════════════════════

-- 1. Extend value_proposals with governance fields
ALTER TABLE public.value_proposals
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS value_tree_branch TEXT,
  ADD COLUMN IF NOT EXISTS hive_family TEXT,
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS funding_target INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS funding_current INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS funding_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS council_reviewed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS council_review_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS council_outcome TEXT,
  ADD COLUMN IF NOT EXISTS council_notes TEXT,
  ADD COLUMN IF NOT EXISTS library_entry_id UUID;

-- Add validation trigger for new fields
CREATE OR REPLACE FUNCTION public.validate_governance_proposal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.category NOT IN ('general', 'restoration', 'planting', 'protection', 'seed_library', 'nursery', 'research', 'cultural', 'education', 'harvest') THEN
    RAISE EXCEPTION 'Invalid category: %', NEW.category;
  END IF;
  IF NEW.funding_type IS NOT NULL AND NEW.funding_type NOT IN ('none', 'hearts', 'donation', 'harvest_revenue', 'mixed') THEN
    RAISE EXCEPTION 'Invalid funding_type: %', NEW.funding_type;
  END IF;
  IF NEW.value_tree_branch IS NOT NULL AND NEW.value_tree_branch NOT IN ('restoration', 'biodiversity', 'food_systems', 'cultural_memory', 'governance', 'education') THEN
    RAISE EXCEPTION 'Invalid value_tree_branch: %', NEW.value_tree_branch;
  END IF;
  IF NEW.title IS NOT NULL AND length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'title too long (max 200 chars)';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'description too long (max 2000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_governance_proposal
  BEFORE INSERT OR UPDATE ON public.value_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_governance_proposal();

-- 2. Proposal Pledges — hearts pledged to fund proposals
CREATE TABLE public.proposal_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.value_proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pledge_type TEXT NOT NULL DEFAULT 'hearts',
  amount INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, user_id, pledge_type)
);

ALTER TABLE public.proposal_pledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pledges" ON public.proposal_pledges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own pledges" ON public.proposal_pledges
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger to update funding_current on pledge changes
CREATE OR REPLACE FUNCTION public.sync_proposal_funding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_proposal_id UUID;
BEGIN
  v_proposal_id := COALESCE(NEW.proposal_id, OLD.proposal_id);
  UPDATE value_proposals
  SET funding_current = COALESCE((
    SELECT SUM(amount) FROM proposal_pledges WHERE proposal_id = v_proposal_id
  ), 0)
  WHERE id = v_proposal_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_proposal_funding
  AFTER INSERT OR UPDATE OR DELETE ON public.proposal_pledges
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_proposal_funding();

-- 3. Hive Stewardship Signals
CREATE TABLE public.hive_stewardship_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_family TEXT NOT NULL,
  signal_type TEXT NOT NULL DEFAULT 'idea',
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_proposal_id UUID REFERENCES public.value_proposals(id) ON DELETE SET NULL,
  linked_tree_ids TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hive_stewardship_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read signals" ON public.hive_stewardship_signals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authors manage own signals" ON public.hive_stewardship_signals
  FOR ALL TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- Validation trigger for signals
CREATE OR REPLACE FUNCTION public.validate_stewardship_signal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.signal_type NOT IN ('idea', 'restoration', 'planting_campaign', 'research_note', 'protection_alert', 'harvest_opportunity') THEN
    RAISE EXCEPTION 'Invalid signal_type: %', NEW.signal_type;
  END IF;
  IF NEW.status NOT IN ('active', 'archived', 'implemented') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'title too long (max 200 chars)';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'description too long (max 2000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_stewardship_signal
  BEFORE INSERT OR UPDATE ON public.hive_stewardship_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_stewardship_signal();

-- 4. Council Review Outcomes (stored as library-linkable records)
CREATE TABLE public.proposal_council_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.value_proposals(id) ON DELETE CASCADE,
  council_id UUID REFERENCES public.councils(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome TEXT NOT NULL DEFAULT 'discussed',
  summary TEXT,
  next_steps TEXT,
  library_entry_id UUID,
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_council_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON public.proposal_council_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Recorders manage own reviews" ON public.proposal_council_reviews
  FOR ALL TO authenticated USING (auth.uid() = recorded_by) WITH CHECK (auth.uid() = recorded_by);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_council_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.outcome NOT IN ('discussed', 'endorsed', 'deferred', 'declined', 'needs_revision') THEN
    RAISE EXCEPTION 'Invalid outcome: %', NEW.outcome;
  END IF;
  IF NEW.summary IS NOT NULL AND length(NEW.summary) > 2000 THEN
    RAISE EXCEPTION 'summary too long (max 2000 chars)';
  END IF;
  IF NEW.next_steps IS NOT NULL AND length(NEW.next_steps) > 2000 THEN
    RAISE EXCEPTION 'next_steps too long (max 2000 chars)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_council_review
  BEFORE INSERT OR UPDATE ON public.proposal_council_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_council_review();

-- Update proposal council_reviewed flag when review is recorded
CREATE OR REPLACE FUNCTION public.mark_proposal_reviewed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE value_proposals
  SET council_reviewed = true,
      council_review_date = NEW.reviewed_at,
      council_outcome = NEW.outcome,
      council_notes = NEW.summary
  WHERE id = NEW.proposal_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mark_proposal_reviewed
  AFTER INSERT ON public.proposal_council_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_proposal_reviewed();
