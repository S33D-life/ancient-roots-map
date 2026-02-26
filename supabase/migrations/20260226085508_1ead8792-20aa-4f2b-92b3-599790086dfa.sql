
-- 1. Materialized heart balances table
CREATE TABLE public.user_heart_balances (
  user_id UUID NOT NULL PRIMARY KEY,
  s33d_hearts INTEGER NOT NULL DEFAULT 0,
  species_hearts INTEGER NOT NULL DEFAULT 0,
  influence_tokens INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_heart_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own balance"
  ON public.user_heart_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger to increment s33d balance on heart_transactions insert
CREATE OR REPLACE FUNCTION public.update_heart_balance_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO user_heart_balances (user_id, s33d_hearts, updated_at)
    VALUES (NEW.user_id, NEW.amount, now())
    ON CONFLICT (user_id) DO UPDATE
    SET s33d_hearts = user_heart_balances.s33d_hearts + NEW.amount,
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_heart_balance_update
  AFTER INSERT ON public.heart_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_heart_balance_on_insert();

-- Trigger for species hearts
CREATE OR REPLACE FUNCTION public.update_species_balance_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO user_heart_balances (user_id, species_hearts, updated_at)
  VALUES (NEW.user_id, NEW.amount, now())
  ON CONFLICT (user_id) DO UPDATE
  SET species_hearts = user_heart_balances.species_hearts + NEW.amount,
      updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_species_balance_update
  AFTER INSERT ON public.species_heart_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_species_balance_on_insert();

-- Trigger for influence tokens
CREATE OR REPLACE FUNCTION public.update_influence_balance_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO user_heart_balances (user_id, influence_tokens, updated_at)
  VALUES (NEW.user_id, NEW.amount, now())
  ON CONFLICT (user_id) DO UPDATE
  SET influence_tokens = user_heart_balances.influence_tokens + NEW.amount,
      updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_influence_balance_update
  AFTER INSERT ON public.influence_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_influence_balance_on_insert();

-- Backfill existing balances
INSERT INTO user_heart_balances (user_id, s33d_hearts, updated_at)
SELECT user_id, SUM(amount), now()
FROM heart_transactions
WHERE user_id IS NOT NULL
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET s33d_hearts = EXCLUDED.s33d_hearts;

-- 2. Content flagging table
CREATE TABLE public.content_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'offering', 'whisper', 'bookshelf_entry', 'chat_message'
  content_id UUID NOT NULL,
  reason TEXT NOT NULL, -- 'spam', 'inappropriate', 'misinformation', 'harassment', 'other'
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned', 'dismissed'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create flags"
  ON public.content_flags FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own flags"
  ON public.content_flags FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Curators can view all flags"
  ON public.content_flags FOR SELECT
  USING (public.has_role(auth.uid(), 'curator'));

CREATE POLICY "Curators can update flags"
  ON public.content_flags FOR UPDATE
  USING (public.has_role(auth.uid(), 'curator'));

-- Prevent duplicate flags
CREATE UNIQUE INDEX idx_content_flags_unique
  ON public.content_flags (reporter_id, content_type, content_id);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_content_flag()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.content_type NOT IN ('offering', 'whisper', 'bookshelf_entry', 'chat_message') THEN
    RAISE EXCEPTION 'Invalid content_type: %', NEW.content_type;
  END IF;
  IF NEW.reason NOT IN ('spam', 'inappropriate', 'misinformation', 'harassment', 'other') THEN
    RAISE EXCEPTION 'Invalid reason: %', NEW.reason;
  END IF;
  IF NEW.status NOT IN ('pending', 'reviewed', 'actioned', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_content_flag
  BEFORE INSERT OR UPDATE ON public.content_flags
  FOR EACH ROW EXECUTE FUNCTION public.validate_content_flag();
