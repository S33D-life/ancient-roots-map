
-- Add protocol_parameter to market_type enum
ALTER TYPE market_type ADD VALUE IF NOT EXISTS 'protocol_parameter';

-- Add protocol-parameter-specific columns to markets table
ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS parameter_key text,
  ADD COLUMN IF NOT EXISTS candidate_values jsonb,
  ADD COLUMN IF NOT EXISTS target_scope_id text,
  ADD COLUMN IF NOT EXISTS trial_window_start timestamp with time zone,
  ADD COLUMN IF NOT EXISTS trial_window_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS success_metric text,
  ADD COLUMN IF NOT EXISTS metric_source text;

-- Create protocol_config_history table
CREATE TABLE IF NOT EXISTS public.protocol_config_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id uuid REFERENCES public.markets(id),
  parameter_key text NOT NULL,
  previous_value text,
  new_value text NOT NULL,
  target_scope_id text NOT NULL DEFAULT 'global',
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_by uuid,
  metric_result jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.protocol_config_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config history is publicly readable"
  ON public.protocol_config_history FOR SELECT USING (true);

CREATE POLICY "Curators can insert config history"
  ON public.protocol_config_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'curator'::app_role));
