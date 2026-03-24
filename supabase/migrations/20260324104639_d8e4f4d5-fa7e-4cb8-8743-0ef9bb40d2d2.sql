
-- Heart Signals table — the unified notification system driven by ledger events
CREATE TABLE public.heart_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  signal_type TEXT NOT NULL DEFAULT 'heart',
  title TEXT NOT NULL,
  body TEXT,
  related_tree_id UUID REFERENCES public.trees(id) ON DELETE SET NULL,
  related_offering_id UUID REFERENCES public.offerings(id) ON DELETE SET NULL,
  related_transaction_id UUID REFERENCES public.heart_transactions(id) ON DELETE SET NULL,
  deep_link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user queries
CREATE INDEX idx_heart_signals_user_unread ON public.heart_signals (user_id, is_read, created_at DESC) WHERE dismissed = false;

-- Enable RLS
ALTER TABLE public.heart_signals ENABLE ROW LEVEL SECURITY;

-- Users can read their own signals
CREATE POLICY "Users can read own signals" ON public.heart_signals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own signals (mark read, dismiss)
CREATE POLICY "Users can update own signals" ON public.heart_signals
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can insert signals (via triggers, SECURITY DEFINER)
CREATE POLICY "System can insert signals" ON public.heart_signals
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime for heart_signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.heart_signals;

-- ── Trigger 1: On heart_transactions insert → create signal ──
CREATE OR REPLACE FUNCTION public.emit_heart_signal_on_transaction()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_tree_name TEXT;
  v_deep_link TEXT;
  v_signal_type TEXT := 'heart';
BEGIN
  -- Skip system/internal types
  IF NEW.heart_type IN ('windfall_pending', 'admin_grant', 'admin_debit') THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get tree name if available
  IF NEW.tree_id IS NOT NULL THEN
    SELECT name INTO v_tree_name FROM trees WHERE id = NEW.tree_id;
    v_deep_link := '/tree/' || NEW.tree_id::text;
  END IF;

  -- Generate poetic titles based on heart_type
  CASE NEW.heart_type
    WHEN 'mapping' THEN
      v_title := 'A new root has been planted';
      v_body := 'You mapped ' || COALESCE(v_tree_name, 'an Ancient Friend') || ' — ' || NEW.amount || ' hearts flow to you.';
      v_signal_type := 'tree';
    WHEN 'checkin' THEN
      v_title := 'The forest remembers your visit';
      v_body := 'Your encounter with ' || COALESCE(v_tree_name, 'an Ancient Friend') || ' earned ' || NEW.amount || ' hearts.';
      v_signal_type := 'encounter';
    WHEN 'offering' THEN
      v_title := 'An offering has been received';
      v_body := COALESCE(v_tree_name, 'The grove') || ' holds your gift — ' || NEW.amount || ' hearts returned.';
      v_signal_type := 'offering';
    WHEN 'canopy_bonus' THEN
      v_title := 'Canopy proof accepted';
      v_body := 'The canopy above ' || COALESCE(v_tree_name, 'your tree') || ' whispers gratitude — bonus heart earned.';
      v_signal_type := 'encounter';
    WHEN 'patron_claim' THEN
      v_title := 'A staff has chosen its keeper';
      v_body := 'You claimed your founding patron staff — ' || NEW.amount || ' hearts flow into your vessel.';
      v_signal_type := 'ledger';
      v_deep_link := '/vault';
    WHEN 'seed_plant' THEN
      v_title := 'A seed takes root';
      v_body := 'You planted a seed near ' || COALESCE(v_tree_name, 'an Ancient Friend') || ' — hearts begin to grow.';
      v_signal_type := 'tree';
    WHEN 'seed_collect' THEN
      v_title := 'A wanderer found your seed';
      v_body := 'Your seed was discovered and collected — the cycle of giving continues.';
      v_signal_type := 'tree';
    WHEN 'bug_report' THEN
      v_title := 'The forest thanks your sharp eyes';
      v_body := 'Your spark report earned ' || NEW.amount || ' hearts.';
      v_signal_type := 'ledger';
      v_deep_link := '/bugs';
    WHEN 'windfall' THEN
      v_title := 'A windfall from the canopy';
      v_body := 'The forest gifted you ' || NEW.amount || ' hearts — a moment of unexpected abundance.';
      v_signal_type := 'ledger';
    ELSE
      v_title := 'Hearts flowing through the mycelium';
      v_body := NEW.amount || ' hearts have arrived in your vessel.';
      v_signal_type := 'ledger';
  END CASE;

  INSERT INTO heart_signals (user_id, signal_type, title, body, related_tree_id, related_transaction_id, deep_link, metadata)
  VALUES (
    NEW.user_id,
    v_signal_type,
    v_title,
    v_body,
    NEW.tree_id,
    NEW.id,
    v_deep_link,
    jsonb_build_object('heart_type', NEW.heart_type, 'amount', NEW.amount)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_heart_signal_on_transaction
  AFTER INSERT ON public.heart_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_heart_signal_on_transaction();

-- ── Trigger 2: On seed sprout (collected) → notify both sower and collector ──
CREATE OR REPLACE FUNCTION public.emit_heart_signal_on_seed_sprout()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when collected_by changes from NULL to a value
  IF OLD.collected_by IS NULL AND NEW.collected_by IS NOT NULL THEN
    -- Notify the sower
    INSERT INTO heart_signals (user_id, signal_type, title, body, related_tree_id, deep_link, metadata)
    VALUES (
      NEW.planter_id,
      'tree',
      'Your seed has sprouted',
      'A wanderer discovered your seed and brought it to life — hearts flow back through the roots to you.',
      NEW.tree_id,
      CASE WHEN NEW.tree_id IS NOT NULL THEN '/tree/' || NEW.tree_id::text ELSE '/seeds' END,
      jsonb_build_object('seed_id', NEW.id, 'collector_id', NEW.collected_by::text)
    );

    -- Notify the collector
    INSERT INTO heart_signals (user_id, signal_type, title, body, related_tree_id, deep_link, metadata)
    VALUES (
      NEW.collected_by,
      'tree',
      'You awakened a sleeping seed',
      'A seed left by another wanderer has bloomed under your touch — the forest celebrates.',
      NEW.tree_id,
      CASE WHEN NEW.tree_id IS NOT NULL THEN '/tree/' || NEW.tree_id::text ELSE '/seeds' END,
      jsonb_build_object('seed_id', NEW.id, 'planter_id', NEW.planter_id::text)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_heart_signal_on_seed_sprout
  AFTER UPDATE ON public.planted_seeds
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_heart_signal_on_seed_sprout();

-- ── Trigger 3: Tree reaching 144 hearts → broadcast to recent visitors ──
CREATE OR REPLACE FUNCTION public.emit_heart_signal_on_fountain()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_tree_name TEXT;
  v_total INTEGER;
  v_visitor RECORD;
BEGIN
  IF NEW.tree_id IS NULL OR NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Calculate new total for this tree
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM heart_transactions
  WHERE tree_id = NEW.tree_id;

  -- Check if we just crossed the 144 threshold
  IF v_total >= 144 AND (v_total - NEW.amount) < 144 THEN
    SELECT name INTO v_tree_name FROM trees WHERE id = NEW.tree_id;

    -- Notify recent visitors (last 30 days, max 12)
    FOR v_visitor IN
      SELECT DISTINCT user_id
      FROM tree_checkins
      WHERE tree_id = NEW.tree_id
        AND checked_in_at > now() - interval '30 days'
        AND user_id IS NOT NULL
      LIMIT 12
    LOOP
      INSERT INTO heart_signals (user_id, signal_type, title, body, related_tree_id, deep_link, metadata)
      VALUES (
        v_visitor.user_id,
        'council',
        'A fountain awakens',
        COALESCE(v_tree_name, 'An Ancient Friend') || ' has gathered 144 hearts — a fountain of living value now flows from its roots.',
        NEW.tree_id,
        '/tree/' || NEW.tree_id::text,
        jsonb_build_object('event', 'fountain_144', 'total_hearts', v_total)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_heart_signal_on_fountain
  AFTER INSERT ON public.heart_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_heart_signal_on_fountain();
