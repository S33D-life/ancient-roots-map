
CREATE TABLE public.lunation_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_number INTEGER NOT NULL UNIQUE,
  new_moon_at TIMESTAMPTZ NOT NULL,
  full_moon_at TIMESTAMPTZ NOT NULL,
  next_new_moon_at TIMESTAMPTZ NOT NULL,
  label TEXT,
  season_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lunation_cycles_window ON public.lunation_cycles (new_moon_at, next_new_moon_at);

GRANT SELECT ON public.lunation_cycles TO anon;
GRANT SELECT ON public.lunation_cycles TO authenticated;
GRANT ALL ON public.lunation_cycles TO service_role;

ALTER TABLE public.lunation_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lunation calendar is public"
  ON public.lunation_cycles
  FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_lunation_cycles_updated_at
  BEFORE UPDATE ON public.lunation_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.councils       ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.lunation_cycles(id) ON DELETE SET NULL;
ALTER TABLE public.ceremony_logs  ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.lunation_cycles(id) ON DELETE SET NULL;
ALTER TABLE public.spark_reports  ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.lunation_cycles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_councils_cycle_id      ON public.councils (cycle_id);
CREATE INDEX IF NOT EXISTS idx_ceremony_logs_cycle_id ON public.ceremony_logs (cycle_id);
CREATE INDEX IF NOT EXISTS idx_spark_reports_cycle_id ON public.spark_reports (cycle_id);

CREATE OR REPLACE FUNCTION public.current_lunation()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.lunation_cycles
  WHERE now() >= new_moon_at AND now() < next_new_moon_at
  ORDER BY new_moon_at DESC
  LIMIT 1;
$$;
