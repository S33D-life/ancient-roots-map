
-- Fix security definer view - make it use invoker's permissions instead
ALTER VIEW public.tree_sources_public SET (security_invoker = on);
