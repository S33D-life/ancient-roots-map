-- Root approval notifications are created by the database transition itself,
-- so a successful Root suggestion cannot silently lose its corresponding alert.
CREATE OR REPLACE FUNCTION public.notify_root_approval_waiting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_actor uuid := auth.uid();
  v_recipient uuid;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'proposed' THEN
    FOR v_recipient IN
      SELECT recipient_id
      FROM (
        SELECT g.created_by AS recipient_id
        FROM public.life_groves g
        WHERE g.id = NEW.life_grove_id
        UNION
        SELECT s.user_id
        FROM public.life_grove_stewards s
        WHERE s.life_grove_id = NEW.life_grove_id
          AND s.revoked_at IS NULL
      ) recipients
      WHERE recipient_id IS NOT NULL
        AND recipient_id IS DISTINCT FROM v_actor
    LOOP
      INSERT INTO public.notifications (
        user_id, title, body, category, priority, deep_link, metadata
      ) VALUES (
        v_recipient,
        'A Root is waiting for Grove approval',
        'A contributor suggested a Root. Open the Grove to review it.',
        'root_approval',
        'normal',
        '/heartwood/life-groves/' || NEW.life_grove_id::text,
        jsonb_build_object(
          'root_id', NEW.id,
          'approval_side', 'grove',
          'actor_id', v_actor
        )
      );
    END LOOP;
  END IF;

  IF (TG_OP = 'INSERT' AND NEW.status = 'pending')
     OR (TG_OP = 'UPDATE' AND OLD.status = 'proposed' AND NEW.status = 'pending') THEN
    FOR v_recipient IN
      SELECT recipient_id
      FROM (
        SELECT t.created_by AS recipient_id
        FROM public.trees t
        WHERE t.id = NEW.tree_id
        UNION
        SELECT ur.user_id
        FROM public.user_roles ur
        WHERE ur.role IN ('curator'::public.app_role, 'keeper'::public.app_role)
      ) recipients
      WHERE recipient_id IS NOT NULL
        AND recipient_id IS DISTINCT FROM v_actor
    LOOP
      INSERT INTO public.notifications (
        user_id, title, body, category, priority, deep_link, metadata
      ) VALUES (
        v_recipient,
        'A Root is waiting at an Ancient Friend',
        'A Grove steward has asked to place a Root. Open the Ancient Friend to review it.',
        'root_approval',
        'normal',
        '/tree/' || NEW.tree_id::text,
        jsonb_build_object(
          'root_id', NEW.id,
          'approval_side', 'ancient_friend',
          'actor_id', v_actor
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END
$fn$;

REVOKE ALL ON FUNCTION public.notify_root_approval_waiting() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_root_approval_waiting_trigger ON public.grove_roots;
CREATE TRIGGER notify_root_approval_waiting_trigger
AFTER INSERT OR UPDATE OF status ON public.grove_roots
FOR EACH ROW
EXECUTE FUNCTION public.notify_root_approval_waiting();