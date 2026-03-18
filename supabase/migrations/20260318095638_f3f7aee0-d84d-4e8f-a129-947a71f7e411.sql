
CREATE TABLE IF NOT EXISTS public.tree_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  edit_reason text,
  edit_type text NOT NULL DEFAULT 'direct',
  proposal_id uuid REFERENCES public.tree_edit_proposals(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_tree_edit_history()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.edit_type NOT IN ('direct', 'proposal_accepted', 'revert', 'merge') THEN
    RAISE EXCEPTION 'Invalid edit_type: %', NEW.edit_type;
  END IF;
  IF length(NEW.field_name) > 100 THEN
    RAISE EXCEPTION 'field_name too long (max 100 chars)';
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_validate_tree_edit_history
    BEFORE INSERT OR UPDATE ON public.tree_edit_history
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_tree_edit_history();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.tree_edit_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view tree edit history"
    ON public.tree_edit_history FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert edit history"
    ON public.tree_edit_history FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tree_edit_history_tree_id ON public.tree_edit_history(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_edit_history_created_at ON public.tree_edit_history(created_at DESC);
