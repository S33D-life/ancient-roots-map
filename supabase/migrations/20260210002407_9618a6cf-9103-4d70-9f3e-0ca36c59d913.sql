
-- Create greenhouse_plants table
CREATE TABLE public.greenhouse_plants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  species TEXT,
  photo_url TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.greenhouse_plants ENABLE ROW LEVEL SECURITY;

-- Owner can do everything with their own plants
CREATE POLICY "Users can view their own plants"
  ON public.greenhouse_plants FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can view shared plants
CREATE POLICY "Anyone can view shared plants"
  ON public.greenhouse_plants FOR SELECT
  USING (is_shared = true);

CREATE POLICY "Users can create their own plants"
  ON public.greenhouse_plants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plants"
  ON public.greenhouse_plants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plants"
  ON public.greenhouse_plants FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_greenhouse_plants_updated_at
  BEFORE UPDATE ON public.greenhouse_plants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for plant photos
INSERT INTO storage.buckets (id, name, public) VALUES ('greenhouse', 'greenhouse', true);

-- Storage policies
CREATE POLICY "Anyone can view greenhouse photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'greenhouse');

CREATE POLICY "Authenticated users can upload greenhouse photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'greenhouse' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own greenhouse photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'greenhouse' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own greenhouse photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'greenhouse' AND auth.uid()::text = (storage.foldername(name))[1]);
