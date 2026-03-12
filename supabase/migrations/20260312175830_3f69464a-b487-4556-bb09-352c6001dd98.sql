-- Co-witness scan sessions
CREATE TABLE public.witness_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL,
  joiner_id UUID,
  companion_channel TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  initiator_lat DOUBLE PRECISION,
  initiator_lng DOUBLE PRECISION,
  initiator_accuracy_m DOUBLE PRECISION,
  joiner_lat DOUBLE PRECISION,
  joiner_lng DOUBLE PRECISION,
  joiner_accuracy_m DOUBLE PRECISION,
  initiator_confirmed BOOLEAN NOT NULL DEFAULT false,
  joiner_confirmed BOOLEAN NOT NULL DEFAULT false,
  initiator_checkin_id UUID REFERENCES public.tree_checkins(id),
  joiner_checkin_id UUID REFERENCES public.tree_checkins(id),
  initiator_photos TEXT[] DEFAULT '{}',
  joiner_photos TEXT[] DEFAULT '{}',
  initiator_offerings TEXT[] DEFAULT '{}',
  joiner_offerings TEXT[] DEFAULT '{}',
  hearts_awarded INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_witness_session()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('waiting', 'joined', 'confirming', 'witnessed', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid witness_session status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_witness_session
  BEFORE INSERT OR UPDATE ON public.witness_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_witness_session();

-- Anti-abuse: max 5 witness sessions per user per day
CREATE OR REPLACE FUNCTION public.check_witness_session_rate_limit()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM witness_sessions
  WHERE initiator_id = NEW.initiator_id
    AND created_at::date = CURRENT_DATE
    AND status != 'cancelled';
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Daily witness session limit reached (max 5 per day)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_witness_session_rate_limit
  BEFORE INSERT ON public.witness_sessions
  FOR EACH ROW EXECUTE FUNCTION public.check_witness_session_rate_limit();

-- RLS
ALTER TABLE public.witness_sessions ENABLE ROW LEVEL SECURITY;

-- Users can see sessions they participate in
CREATE POLICY "Users can view own witness sessions"
  ON public.witness_sessions FOR SELECT TO authenticated
  USING (auth.uid() = initiator_id OR auth.uid() = joiner_id);

-- Authenticated users can create sessions
CREATE POLICY "Users can create witness sessions"
  ON public.witness_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = initiator_id);

-- Participants can update their own sessions
CREATE POLICY "Participants can update witness sessions"
  ON public.witness_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = initiator_id OR auth.uid() = joiner_id);

-- Index for active session lookups
CREATE INDEX idx_witness_sessions_tree_active
  ON public.witness_sessions (tree_id, status)
  WHERE status IN ('waiting', 'joined', 'confirming');

-- Enable realtime for live session updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.witness_sessions;