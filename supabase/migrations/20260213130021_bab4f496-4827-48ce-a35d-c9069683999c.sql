
-- Digital Fire votes table
CREATE TABLE public.digital_fire_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  moon_event TEXT NOT NULL CHECK (moon_event IN ('new_moon', 'full_moon')),
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_date)
);

ALTER TABLE public.digital_fire_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes" ON public.digital_fire_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can cast votes" ON public.digital_fire_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.digital_fire_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.digital_fire_votes
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_digital_fire_votes_updated_at
  BEFORE UPDATE ON public.digital_fire_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
