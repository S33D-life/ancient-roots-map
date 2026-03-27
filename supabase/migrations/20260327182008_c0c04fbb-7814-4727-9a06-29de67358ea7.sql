
DROP POLICY IF EXISTS "telegram_inbound_queue_select" ON public.telegram_inbound_queue;

CREATE POLICY "telegram_inbound_queue_select" ON public.telegram_inbound_queue
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'keeper'));
