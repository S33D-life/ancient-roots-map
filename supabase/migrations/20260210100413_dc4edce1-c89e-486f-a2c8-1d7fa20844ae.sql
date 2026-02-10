
CREATE TABLE public.saved_songs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  link text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved songs"
ON public.saved_songs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own songs"
ON public.saved_songs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own songs"
ON public.saved_songs FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own songs"
ON public.saved_songs FOR UPDATE
USING (auth.uid() = user_id);
