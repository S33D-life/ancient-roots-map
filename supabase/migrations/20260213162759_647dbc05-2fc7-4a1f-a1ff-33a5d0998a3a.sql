-- Fix conflicting RLS policies on profiles table
-- The "Deny anonymous access to profiles" policy (USING false) conflicts with
-- the "Authenticated users can view profiles" policy. Since the authenticated
-- policy already restricts to auth.uid() = id OR is_discoverable = true,
-- anonymous users (who have no auth.uid()) will naturally get no results.
-- The deny policy is redundant and causes confusion.

DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;