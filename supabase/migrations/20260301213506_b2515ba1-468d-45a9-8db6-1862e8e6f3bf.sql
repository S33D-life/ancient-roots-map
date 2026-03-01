
-- Fix audit_logs INSERT policy: restrict to authenticated users
-- (audit log inserts happen via SECURITY DEFINER functions or authenticated contexts)
DROP POLICY "Service can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
