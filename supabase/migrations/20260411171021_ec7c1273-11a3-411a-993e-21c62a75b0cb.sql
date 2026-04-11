ALTER TABLE public.agent_contribution_events
ADD COLUMN IF NOT EXISTS validated_by uuid;