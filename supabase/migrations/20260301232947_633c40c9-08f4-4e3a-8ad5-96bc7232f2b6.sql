-- Food Cycles: global seasonal intelligence for the Blooming Clock layer
CREATE TABLE public.food_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT,
  icon TEXT NOT NULL DEFAULT '🌱',
  -- Regions as country codes (ISO 3166-1 alpha-2) with optional sub-regions
  regions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Month arrays (1-12) for each cycle stage
  flowering_months INTEGER[] NOT NULL DEFAULT '{}',
  fruiting_months INTEGER[] NOT NULL DEFAULT '{}',
  harvest_months INTEGER[] NOT NULL DEFAULT '{}',
  dormant_months INTEGER[] NOT NULL DEFAULT '{}',
  peak_months INTEGER[] NOT NULL DEFAULT '{}',
  -- Hemisphere logic
  hemisphere TEXT NOT NULL DEFAULT 'both' CHECK (hemisphere IN ('northern', 'southern', 'both', 'tropical')),
  notes TEXT,
  cultural_associations TEXT,
  -- Display
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Producer schema (future grower-patron layer)
CREATE TABLE public.food_producers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  country TEXT,
  food_cycle_id UUID REFERENCES public.food_cycles(id),
  contact_link TEXT,
  verified_status TEXT NOT NULL DEFAULT 'unverified',
  seasonal_window TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: food_cycles is public read
ALTER TABLE public.food_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read food_cycles" ON public.food_cycles FOR SELECT USING (true);

-- RLS: food_producers public read, auth insert
ALTER TABLE public.food_producers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read food_producers" ON public.food_producers FOR SELECT USING (true);
CREATE POLICY "Auth users can insert food_producers" ON public.food_producers FOR INSERT WITH CHECK (auth.uid() = user_id);