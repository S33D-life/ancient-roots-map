
-- Tree Whispers: location-bound messages sent through Ancient Friends
CREATE TABLE public.tree_whispers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id uuid NOT NULL,
  recipient_scope text NOT NULL DEFAULT 'PUBLIC',
  recipient_user_id uuid,
  circle_id uuid,
  tree_anchor_id uuid NOT NULL REFERENCES public.trees(id),
  message_content text NOT NULL,
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  delivery_scope text NOT NULL DEFAULT 'ANY_TREE',
  delivery_tree_id uuid REFERENCES public.trees(id),
  delivery_species_key text,
  status text NOT NULL DEFAULT 'sent',
  -- For PRIVATE whispers only
  collected_at timestamptz,
  collected_tree_id uuid REFERENCES public.trees(id)
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_tree_whisper()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.recipient_scope NOT IN ('PRIVATE', 'CIRCLE', 'PUBLIC') THEN
    RAISE EXCEPTION 'Invalid recipient_scope: %', NEW.recipient_scope;
  END IF;
  IF NEW.delivery_scope NOT IN ('ANY_TREE', 'SPECIFIC_TREE', 'SPECIES_MATCH') THEN
    RAISE EXCEPTION 'Invalid delivery_scope: %', NEW.delivery_scope;
  END IF;
  IF NEW.status NOT IN ('sent', 'available', 'collected', 'expired') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.recipient_scope = 'PRIVATE' AND NEW.recipient_user_id IS NULL THEN
    RAISE EXCEPTION 'PRIVATE whispers require recipient_user_id';
  END IF;
  IF NEW.delivery_scope = 'SPECIFIC_TREE' AND NEW.delivery_tree_id IS NULL THEN
    RAISE EXCEPTION 'SPECIFIC_TREE delivery requires delivery_tree_id';
  END IF;
  IF NEW.delivery_scope = 'SPECIES_MATCH' AND NEW.delivery_species_key IS NULL THEN
    RAISE EXCEPTION 'SPECIES_MATCH delivery requires delivery_species_key';
  END IF;
  IF length(NEW.message_content) > 2000 THEN
    RAISE EXCEPTION 'message_content too long (max 2000 chars)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tree_whisper
  BEFORE INSERT OR UPDATE ON public.tree_whispers
  FOR EACH ROW EXECUTE FUNCTION public.validate_tree_whisper();

-- Collection records for CIRCLE/PUBLIC whispers
CREATE TABLE public.tree_whisper_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whisper_id uuid NOT NULL REFERENCES public.tree_whispers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  collected_tree_id uuid REFERENCES public.trees(id),
  UNIQUE(whisper_id, user_id)
);

-- RLS
ALTER TABLE public.tree_whispers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_whisper_collections ENABLE ROW LEVEL SECURITY;

-- Whispers: sender can see own sent
CREATE POLICY "Sender can view own whispers"
  ON public.tree_whispers FOR SELECT TO authenticated
  USING (sender_user_id = auth.uid());

-- Whispers: private recipient can see theirs
CREATE POLICY "Recipient can view private whispers"
  ON public.tree_whispers FOR SELECT TO authenticated
  USING (recipient_scope = 'PRIVATE' AND recipient_user_id = auth.uid());

-- Whispers: public are visible to all authenticated
CREATE POLICY "Public whispers visible to all"
  ON public.tree_whispers FOR SELECT TO authenticated
  USING (recipient_scope = 'PUBLIC');

-- Whispers: authenticated can insert
CREATE POLICY "Authenticated can send whispers"
  ON public.tree_whispers FOR INSERT TO authenticated
  WITH CHECK (sender_user_id = auth.uid());

-- Whispers: sender can update own (for status changes)
CREATE POLICY "Sender can update own whispers"
  ON public.tree_whispers FOR UPDATE TO authenticated
  USING (sender_user_id = auth.uid());

-- Whispers: recipient can update private whisper (for collection)
CREATE POLICY "Recipient can collect private whisper"
  ON public.tree_whispers FOR UPDATE TO authenticated
  USING (recipient_scope = 'PRIVATE' AND recipient_user_id = auth.uid());

-- Collections: user can see own
CREATE POLICY "User can view own collections"
  ON public.tree_whisper_collections FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Collections: user can insert own
CREATE POLICY "User can collect whispers"
  ON public.tree_whisper_collections FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_whispers_recipient ON public.tree_whispers(recipient_user_id) WHERE recipient_scope = 'PRIVATE';
CREATE INDEX idx_whispers_status ON public.tree_whispers(status);
CREATE INDEX idx_whispers_delivery ON public.tree_whispers(delivery_scope, delivery_species_key);
CREATE INDEX idx_whisper_collections_user ON public.tree_whisper_collections(user_id);
