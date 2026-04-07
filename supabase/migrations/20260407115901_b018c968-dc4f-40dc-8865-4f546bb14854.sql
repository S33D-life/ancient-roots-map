-- 1. Fix telegram_outbound_log: restrict SELECT to keepers only
DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.telegram_outbound_log;
DROP POLICY IF EXISTS "Anyone can view outbound logs" ON public.telegram_outbound_log;

CREATE POLICY "Keepers can view outbound logs"
  ON public.telegram_outbound_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'));

-- 2. Fix audit_logs: restrict INSERT to service_role only
DROP POLICY IF EXISTS "Service can insert audit logs" ON public.audit_logs;

CREATE POLICY "Service role inserts audit logs"
  ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);