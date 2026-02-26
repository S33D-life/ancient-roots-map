
-- Extend bug_reports table with new columns
ALTER TABLE public.bug_reports
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'once',
  ADD COLUMN IF NOT EXISTS feature_area text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS page_route text,
  ADD COLUMN IF NOT EXISTS app_version text,
  ADD COLUMN IF NOT EXISTS device_info text,
  ADD COLUMN IF NOT EXISTS diagnostics jsonb,
  ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS triage_notes text,
  ADD COLUMN IF NOT EXISTS duplicate_of_bug_id uuid REFERENCES public.bug_reports(id),
  ADD COLUMN IF NOT EXISTS hearts_awarded_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_state text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS upvotes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS watchers_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS include_diagnostics boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create bug_upvotes table
CREATE TABLE IF NOT EXISTS public.bug_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id uuid NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bug_id, user_id)
);

-- Create bug_watchers table
CREATE TABLE IF NOT EXISTS public.bug_watchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id uuid NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bug_id, user_id)
);

-- Create bug_comments table
CREATE TABLE IF NOT EXISTS public.bug_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id uuid NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  internal_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bug_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_comments ENABLE ROW LEVEL SECURITY;

-- RLS: bug_reports
CREATE POLICY "Anyone can read bugs" ON public.bug_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own bugs" ON public.bug_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Curators can update bugs" ON public.bug_reports FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'curator'));

-- RLS: bug_upvotes
CREATE POLICY "Anyone can read upvotes" ON public.bug_upvotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own upvotes" ON public.bug_upvotes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own upvotes" ON public.bug_upvotes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS: bug_watchers
CREATE POLICY "Anyone can read watchers" ON public.bug_watchers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own watches" ON public.bug_watchers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own watches" ON public.bug_watchers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS: bug_comments
CREATE POLICY "Read public comments" ON public.bug_comments FOR SELECT TO authenticated
  USING (internal_only = false OR public.has_role(auth.uid(), 'curator'));
CREATE POLICY "Users can insert comments" ON public.bug_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_bug_report()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.severity NOT IN ('blocker', 'major', 'minor', 'cosmetic', 'medium', 'low', 'high') THEN
    RAISE EXCEPTION 'Invalid severity: %', NEW.severity;
  END IF;
  IF NEW.frequency NOT IN ('always', 'sometimes', 'once') THEN
    RAISE EXCEPTION 'Invalid frequency: %', NEW.frequency;
  END IF;
  IF NEW.feature_area NOT IN ('map', 'atlas', 'mint', 'hearts', 'hearth', 'heartwood', 'wishing_tree', 'time_tree', 'offerings', 'account', 'radio', 'library', 'groves', 'markets', 'other') THEN
    RAISE EXCEPTION 'Invalid feature_area: %', NEW.feature_area;
  END IF;
  IF NEW.status NOT IN ('new', 'triaged', 'in_progress', 'fixed', 'released', 'duplicate', 'wont_fix', 'need_info') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.reward_state NOT IN ('none', 'pending', 'awarded', 'rejected') THEN
    RAISE EXCEPTION 'Invalid reward_state: %', NEW.reward_state;
  END IF;
  IF length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'title too long (max 200 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_bug_report
  BEFORE INSERT OR UPDATE ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION public.validate_bug_report();

-- Upvote count sync
CREATE OR REPLACE FUNCTION public.sync_bug_upvote_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE bug_reports SET upvotes_count = upvotes_count + 1 WHERE id = NEW.bug_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE bug_reports SET upvotes_count = upvotes_count - 1 WHERE id = OLD.bug_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_bug_upvotes
  AFTER INSERT OR DELETE ON public.bug_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_bug_upvote_count();

-- Rate limiting: max 3 per day
CREATE OR REPLACE FUNCTION public.check_bug_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM bug_reports
  WHERE user_id = NEW.user_id AND created_at::date = CURRENT_DATE;
  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Daily bug report limit reached (max 3 per day)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bug_rate_limit
  BEFORE INSERT ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION public.check_bug_rate_limit();

-- Heart reward function for curators
CREATE OR REPLACE FUNCTION public.award_bug_hearts(p_bug_id uuid, p_amount integer, p_curator_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user_id uuid;
BEGIN
  IF NOT public.has_role(p_curator_id, 'curator') THEN
    RAISE EXCEPTION 'Only curators can award hearts';
  END IF;
  SELECT user_id INTO v_user_id FROM bug_reports WHERE id = p_bug_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Bug not found'; END IF;
  UPDATE bug_reports SET hearts_awarded_total = hearts_awarded_total + p_amount, reward_state = 'awarded' WHERE id = p_bug_id;
  INSERT INTO heart_transactions (user_id, heart_type, amount, tree_id)
  VALUES (v_user_id, 'bug_report', p_amount, (SELECT tree_reference_id FROM time_tree_entries LIMIT 0));
END;
$$;
