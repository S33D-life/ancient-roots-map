
-- Spark reporting system
CREATE TABLE public.spark_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL DEFAULT 'issue',
  target_type TEXT NOT NULL DEFAULT 'tree',
  target_id UUID,
  dataset_id UUID REFERENCES public.tree_data_sources(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  submitted_by UUID,
  submitted_by_agent UUID REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  hearts_rewarded INTEGER DEFAULT 0,
  resolution_notes TEXT,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add specialization and datasets_discovered to agent_profiles
ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS datasets_discovered INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS api_endpoint TEXT,
  ADD COLUMN IF NOT EXISTS registration_source TEXT DEFAULT 'internal';

-- RLS for spark_reports
ALTER TABLE public.spark_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read spark_reports" ON public.spark_reports FOR SELECT USING (true);
CREATE POLICY "Auth insert spark_reports" ON public.spark_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Curator manage spark_reports" ON public.spark_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'curator'));
CREATE POLICY "Curator delete spark_reports" ON public.spark_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'curator'));

-- Auth insert for agent_profiles (for agent registration)
CREATE POLICY "Auth insert agent_profiles" ON public.agent_profiles FOR INSERT TO authenticated WITH CHECK (true);

-- Validation trigger for spark_reports
CREATE OR REPLACE FUNCTION public.validate_spark_report()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.report_type NOT IN ('issue', 'duplicate', 'incorrect_species', 'invalid_coordinates', 'missing_metadata', 'broken_dataset', 'dataset_update', 'improvement') THEN
    RAISE EXCEPTION 'Invalid report_type: %', NEW.report_type;
  END IF;
  IF NEW.target_type NOT IN ('tree', 'dataset', 'agent', 'source') THEN
    RAISE EXCEPTION 'Invalid target_type: %', NEW.target_type;
  END IF;
  IF NEW.verification_status NOT IN ('pending', 'confirmed', 'rejected', 'resolved') THEN
    RAISE EXCEPTION 'Invalid verification_status: %', NEW.verification_status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_spark_report
  BEFORE INSERT OR UPDATE ON public.spark_reports
  FOR EACH ROW EXECUTE FUNCTION public.validate_spark_report();
