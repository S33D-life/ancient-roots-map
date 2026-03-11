
-- Unified contribution layer for place-first architecture
CREATE TABLE public.tree_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contribution_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  media_url TEXT,
  metadata JSONB DEFAULT '{}',
  state TEXT NOT NULL DEFAULT 'new',
  support_count INTEGER NOT NULL DEFAULT 0,
  reviewer_id UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_tree_contribution()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.contribution_type NOT IN ('photo','seasonal_observation','offering','stewardship_note','harvest_record','local_story','correction') THEN
    RAISE EXCEPTION 'Invalid contribution_type: %', NEW.contribution_type;
  END IF;
  IF NEW.state NOT IN ('new','community_supported','curator_reviewed','guardian_confirmed') THEN
    RAISE EXCEPTION 'Invalid state: %', NEW.state;
  END IF;
  IF NEW.content IS NOT NULL AND length(NEW.content) > 5000 THEN
    RAISE EXCEPTION 'content too long (max 5000 chars)';
  END IF;
  IF NEW.title IS NOT NULL AND length(NEW.title) > 300 THEN
    RAISE EXCEPTION 'title too long (max 300 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tree_contribution
  BEFORE INSERT OR UPDATE ON public.tree_contributions
  FOR EACH ROW EXECUTE FUNCTION public.validate_tree_contribution();

-- Heart reward on contribution
CREATE OR REPLACE FUNCTION public.reward_tree_contribution()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (NEW.user_id, NEW.tree_id, 'contribution', 2);

  -- Species heart
  INSERT INTO species_heart_transactions (user_id, species_family, amount, reason, tree_id)
  SELECT NEW.user_id, t.species, 0.5, 'contribution', NEW.tree_id
  FROM trees t WHERE t.id = NEW.tree_id AND t.species IS NOT NULL;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reward_tree_contribution
  AFTER INSERT ON public.tree_contributions
  FOR EACH ROW EXECUTE FUNCTION public.reward_tree_contribution();

-- Support tracking table
CREATE TABLE public.contribution_supports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contribution_id UUID NOT NULL REFERENCES public.tree_contributions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contribution_id, user_id)
);

-- Auto-promote state on support threshold
CREATE OR REPLACE FUNCTION public.sync_contribution_support()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM contribution_supports WHERE contribution_id = NEW.contribution_id;
  UPDATE tree_contributions SET support_count = v_count WHERE id = NEW.contribution_id;
  IF v_count >= 3 THEN
    UPDATE tree_contributions SET state = 'community_supported' WHERE id = NEW.contribution_id AND state = 'new';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_contribution_support
  AFTER INSERT ON public.contribution_supports
  FOR EACH ROW EXECUTE FUNCTION public.sync_contribution_support();

-- Indexes
CREATE INDEX idx_tree_contributions_tree ON public.tree_contributions(tree_id, created_at DESC);
CREATE INDEX idx_tree_contributions_user ON public.tree_contributions(user_id, created_at DESC);
CREATE INDEX idx_tree_contributions_type ON public.tree_contributions(contribution_type);
CREATE INDEX idx_tree_contributions_state ON public.tree_contributions(state);

-- RLS
ALTER TABLE public.tree_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_supports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read contributions" ON public.tree_contributions FOR SELECT USING (true);
CREATE POLICY "Auth users can insert contributions" ON public.tree_contributions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contributions" ON public.tree_contributions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read supports" ON public.contribution_supports FOR SELECT USING (true);
CREATE POLICY "Auth users can insert supports" ON public.contribution_supports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tree_contributions;
