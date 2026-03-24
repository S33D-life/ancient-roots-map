-- 1. Revoke API access to materialized view trees_map_hot
REVOKE SELECT ON public.trees_map_hot FROM anon, authenticated;

-- 2. Tighten heart_signals INSERT policy: only allow inserting signals for yourself
DROP POLICY IF EXISTS "System can insert signals" ON public.heart_signals;
CREATE POLICY "Users can insert own signals"
  ON public.heart_signals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());