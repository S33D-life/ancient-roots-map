
-- Seasonal photo revisit tracking
CREATE TABLE public.seasonal_witnesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tree_id UUID NOT NULL REFERENCES public.trees(id),
  season TEXT NOT NULL CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  year INTEGER NOT NULL,
  offering_id UUID REFERENCES public.offerings(id),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tree_id, season, year)
);

ALTER TABLE public.seasonal_witnesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own witnesses" ON public.seasonal_witnesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own witnesses" ON public.seasonal_witnesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view all witnesses" ON public.seasonal_witnesses
  FOR SELECT USING (true);

-- Root Mail: async tree letters
CREATE TABLE public.root_mail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  tree_id UUID NOT NULL REFERENCES public.trees(id),
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  visible_after TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  discovered_by UUID,
  discovered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.root_mail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can create root mail" ON public.root_mail
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can view own mail" ON public.root_mail
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Visible mail readable by authenticated" ON public.root_mail
  FOR SELECT USING (auth.uid() IS NOT NULL AND now() >= visible_after);

CREATE POLICY "Discoverers can update mail" ON public.root_mail
  FOR UPDATE USING (auth.uid() IS NOT NULL AND discovered_by IS NULL AND now() >= visible_after);

-- Enable realtime for root_mail
ALTER PUBLICATION supabase_realtime ADD TABLE public.root_mail;
