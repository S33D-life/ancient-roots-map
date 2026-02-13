
CREATE TABLE public.ceremony_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_code TEXT NOT NULL,
  staff_species TEXT,
  staff_name TEXT,
  cid TEXT,
  anchor_tx_hash TEXT,
  ceremony_type TEXT NOT NULL DEFAULT 'awakening',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ceremony_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create ceremony logs"
  ON public.ceremony_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ceremony logs"
  ON public.ceremony_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_ceremony_logs_staff_code ON public.ceremony_logs (staff_code);
CREATE INDEX idx_ceremony_logs_user_id ON public.ceremony_logs (user_id);
