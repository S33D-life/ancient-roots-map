
-- Time Tree Game entries
CREATE TABLE public.time_tree_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  moon_phase TEXT NOT NULL DEFAULT 'full',
  tree_name TEXT NOT NULL,
  tree_reference_id UUID NULL,
  is_tree_real BOOLEAN NOT NULL DEFAULT false,
  participant_one TEXT NOT NULL,
  participant_two TEXT NOT NULL,
  what_shared TEXT NOT NULL,
  where_sitting TEXT,
  emotional_tone TEXT,
  hearts_awarded INTEGER NOT NULL DEFAULT 0,
  reward_timestamp TIMESTAMP WITH TIME ZONE,
  pilgrimage_flag BOOLEAN NOT NULL DEFAULT false,
  meeting_realised BOOLEAN NOT NULL DEFAULT false,
  linked_wish_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_time_tree_entry()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.moon_phase NOT IN ('full', 'new') THEN
    RAISE EXCEPTION 'Invalid moon_phase: %. Must be full or new', NEW.moon_phase;
  END IF;
  IF length(NEW.tree_name) > 500 THEN
    RAISE EXCEPTION 'tree_name too long (max 500 chars)';
  END IF;
  IF NEW.what_shared IS NOT NULL AND length(NEW.what_shared) > 2000 THEN
    RAISE EXCEPTION 'what_shared too long (max 2000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_time_tree_entry
  BEFORE INSERT OR UPDATE ON public.time_tree_entries
  FOR EACH ROW EXECUTE FUNCTION public.validate_time_tree_entry();

-- Heart reward trigger: award hearts on insert if user hasn't earned today
CREATE OR REPLACE FUNCTION public.time_tree_heart_reward()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_already_rewarded BOOLEAN;
  v_base_hearts INTEGER := 5;
  v_bonus INTEGER := 0;
BEGIN
  -- Check if user already got a reward today
  SELECT EXISTS (
    SELECT 1 FROM time_tree_entries
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND reward_timestamp IS NOT NULL
      AND reward_timestamp::date = CURRENT_DATE
  ) INTO v_already_rewarded;

  IF v_already_rewarded THEN
    NEW.hearts_awarded := 0;
    NEW.reward_timestamp := NULL;
    RETURN NEW;
  END IF;

  -- Bonus if tree exists in atlas
  IF NEW.tree_reference_id IS NOT NULL THEN
    v_bonus := v_bonus + 2;
  END IF;

  NEW.hearts_awarded := v_base_hearts + v_bonus;
  NEW.reward_timestamp := now();

  -- Insert heart transaction
  INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (NEW.user_id, NEW.tree_reference_id, 'time_tree', NEW.hearts_awarded);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_time_tree_heart_reward
  BEFORE INSERT ON public.time_tree_entries
  FOR EACH ROW EXECUTE FUNCTION public.time_tree_heart_reward();

-- RLS
ALTER TABLE public.time_tree_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own entries"
  ON public.time_tree_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own entries"
  ON public.time_tree_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON public.time_tree_entries FOR UPDATE
  USING (auth.uid() = user_id);
