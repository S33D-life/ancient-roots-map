
-- 1. Fix telegram_settings: restrict UPDATE to keeper role only
DROP POLICY IF EXISTS "Authenticated users can update telegram settings" ON public.telegram_settings;
CREATE POLICY "Keepers can update telegram settings"
  ON public.telegram_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'keeper'::app_role))
  WITH CHECK (has_role(auth.uid(), 'keeper'::app_role));

-- Also restrict SELECT on telegram_settings to keeper
DROP POLICY IF EXISTS "Authenticated users can read telegram settings" ON public.telegram_settings;
CREATE POLICY "Keepers can read telegram settings"
  ON public.telegram_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'keeper'::app_role));

-- 2. Fix telegram_inbound_queue: remove the broad SELECT policy, keep keeper-only
DROP POLICY IF EXISTS "Authenticated users can read inbound queue" ON public.telegram_inbound_queue;

-- 3. Fix heart_transactions: scope SELECT to own transactions or system (null user_id)
DROP POLICY IF EXISTS "Authenticated users can view heart transactions" ON public.heart_transactions;
CREATE POLICY "Users can view own heart transactions"
  ON public.heart_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);
