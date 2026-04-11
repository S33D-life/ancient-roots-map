
CREATE TABLE public.partnership_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partnership_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can submit proposals"
  ON public.partnership_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own proposals"
  ON public.partnership_proposals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
