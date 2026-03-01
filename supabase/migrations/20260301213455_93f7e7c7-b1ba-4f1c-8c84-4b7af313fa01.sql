
-- Fix overly permissive RLS policies (WITH CHECK: true on INSERT/UPDATE)

-- 1. councils INSERT: change from true to auth.uid() IS NOT NULL
DROP POLICY "Auth users can create councils" ON public.councils;
CREATE POLICY "Auth users can create councils"
  ON public.councils FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. council_trees INSERT: change from true to auth.uid() IS NOT NULL
DROP POLICY "Auth users can link council trees" ON public.council_trees;
CREATE POLICY "Auth users can link council trees"
  ON public.council_trees FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. council_bio_regions INSERT: change from true to auth.uid() IS NOT NULL
DROP POLICY "Auth users can link council bio_regions" ON public.council_bio_regions;
CREATE POLICY "Auth users can link council bio_regions"
  ON public.council_bio_regions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. region_notable_trees INSERT: restrict to authenticated users
DROP POLICY "Authenticated users can insert region_notable_trees" ON public.region_notable_trees;
CREATE POLICY "Authenticated users can insert region_notable_trees"
  ON public.region_notable_trees FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. region_notable_trees UPDATE: restrict to curators only
DROP POLICY "Authenticated users can update region_notable_trees" ON public.region_notable_trees;
CREATE POLICY "Curators can update region_notable_trees"
  ON public.region_notable_trees FOR UPDATE
  USING (has_role(auth.uid(), 'curator'::app_role));

-- 6. notifications INSERT: restrict to authenticated (system triggers use SECURITY DEFINER)
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
