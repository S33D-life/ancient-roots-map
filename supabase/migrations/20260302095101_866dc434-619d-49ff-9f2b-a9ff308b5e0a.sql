
-- Add report_type and suggestion fields to bug_reports
ALTER TABLE public.bug_reports 
  ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'bug',
  ADD COLUMN IF NOT EXISTS suggestion text,
  ADD COLUMN IF NOT EXISTS screenshot_urls text[] DEFAULT '{}';

-- Update validation trigger to include new report_type values
CREATE OR REPLACE FUNCTION public.validate_bug_report()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.report_type NOT IN ('bug', 'ux_improvement', 'insight') THEN
    RAISE EXCEPTION 'Invalid report_type: %', NEW.report_type;
  END IF;
  IF NEW.severity NOT IN ('blocker', 'major', 'minor', 'cosmetic', 'medium', 'low', 'high') THEN
    RAISE EXCEPTION 'Invalid severity: %', NEW.severity;
  END IF;
  IF NEW.frequency NOT IN ('always', 'sometimes', 'once') THEN
    RAISE EXCEPTION 'Invalid frequency: %', NEW.frequency;
  END IF;
  IF NEW.feature_area NOT IN ('map', 'atlas', 'mint', 'hearts', 'hearth', 'heartwood', 'wishing_tree', 'time_tree', 'offerings', 'account', 'radio', 'library', 'groves', 'markets', 'other') THEN
    RAISE EXCEPTION 'Invalid feature_area: %', NEW.feature_area;
  END IF;
  IF NEW.status NOT IN ('new', 'triaged', 'in_progress', 'fixed', 'released', 'duplicate', 'wont_fix', 'need_info') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.reward_state NOT IN ('none', 'pending', 'awarded', 'rejected') THEN
    RAISE EXCEPTION 'Invalid reward_state: %', NEW.reward_state;
  END IF;
  IF length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'title too long (max 200 chars)';
  END IF;
  IF NEW.suggestion IS NOT NULL AND length(NEW.suggestion) > 2000 THEN
    RAISE EXCEPTION 'suggestion too long (max 2000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create storage bucket for bounty screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('bounty-screenshots', 'bounty-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for bounty screenshots - authenticated users can upload
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bounty-screenshots');

-- Anyone can read screenshots (public bucket)
CREATE POLICY "Anyone can read bounty screenshots"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'bounty-screenshots');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own bounty screenshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'bounty-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
