
-- Offering resonance: track user resonances on offerings
CREATE TABLE public.offering_resonances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id uuid NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offering_id, user_id)
);

-- RLS
ALTER TABLE public.offering_resonances ENABLE ROW LEVEL SECURITY;

-- Anyone can see resonance counts
CREATE POLICY "Anyone can view resonances"
  ON public.offering_resonances FOR SELECT
  USING (true);

-- Authenticated users can add their own resonance
CREATE POLICY "Users can add own resonance"
  ON public.offering_resonances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can remove their own resonance
CREATE POLICY "Users can remove own resonance"
  ON public.offering_resonances FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add resonance_count to offerings for fast display
ALTER TABLE public.offerings ADD COLUMN IF NOT EXISTS resonance_count integer NOT NULL DEFAULT 0;

-- Trigger to sync resonance count
CREATE OR REPLACE FUNCTION public.sync_offering_resonance_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  UPDATE offerings SET resonance_count = (
    SELECT COUNT(*) FROM offering_resonances WHERE offering_id = COALESCE(NEW.offering_id, OLD.offering_id)
  ) WHERE id = COALESCE(NEW.offering_id, OLD.offering_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_resonance_count_insert
  AFTER INSERT ON public.offering_resonances
  FOR EACH ROW EXECUTE FUNCTION sync_offering_resonance_count();

CREATE TRIGGER trg_sync_resonance_count_delete
  AFTER DELETE ON public.offering_resonances
  FOR EACH ROW EXECUTE FUNCTION sync_offering_resonance_count();
