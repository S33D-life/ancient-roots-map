
-- Tighten RLS: remove overly permissive INSERT/UPDATE policies
-- Heart transactions should only be written by SECURITY DEFINER functions
DROP POLICY "System inserts hearts via trigger" ON public.heart_transactions;
DROP POLICY "System can update heart transactions" ON public.heart_transactions;

-- Tree heart pools should only be written by SECURITY DEFINER functions
DROP POLICY "System updates tree heart pools" ON public.tree_heart_pools;
DROP POLICY "System can update tree heart pools" ON public.tree_heart_pools;

-- The SECURITY DEFINER functions (distribute_seed_hearts, claim_windfall_hearts)
-- bypass RLS, so no INSERT/UPDATE policies are needed for these tables.
-- Only SELECT policies remain, which allow public read access.
