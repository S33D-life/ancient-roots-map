-- Create enum for offering types
CREATE TYPE offering_type AS ENUM ('photo', 'poem', 'song', 'story', 'nft');

-- Create enum for grove scales
CREATE TYPE grove_scale AS ENUM ('hyper_local', 'local', 'regional', 'national', 'bioregional', 'species', 'lineage');

-- Create trees table
CREATE TABLE public.trees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  lineage TEXT,
  description TEXT,
  what3words TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  grove_scale grove_scale DEFAULT 'local',
  state TEXT,
  nation TEXT,
  bioregion TEXT,
  estimated_age INTEGER,
  project_name TEXT,
  project_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offerings table
CREATE TABLE public.offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  type offering_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  nft_link TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for spatial queries and filtering
CREATE INDEX idx_trees_location ON public.trees (latitude, longitude);
CREATE INDEX idx_trees_species ON public.trees (species);
CREATE INDEX idx_trees_lineage ON public.trees (lineage);
CREATE INDEX idx_trees_what3words ON public.trees (what3words);
CREATE INDEX idx_trees_grove_scale ON public.trees (grove_scale);
CREATE INDEX idx_trees_state ON public.trees (state);
CREATE INDEX idx_trees_nation ON public.trees (nation);
CREATE INDEX idx_offerings_tree_id ON public.offerings (tree_id);

-- Enable Row Level Security
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trees (public read, authenticated write)
CREATE POLICY "Trees are viewable by everyone" 
ON public.trees 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create trees" 
ON public.trees 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own trees" 
ON public.trees 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own trees" 
ON public.trees 
FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for offerings (public read, authenticated write)
CREATE POLICY "Offerings are viewable by everyone" 
ON public.offerings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create offerings" 
ON public.offerings 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own offerings" 
ON public.offerings 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own offerings" 
ON public.offerings 
FOR DELETE 
USING (auth.uid() = created_by);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic timestamp updates on trees
CREATE TRIGGER update_trees_updated_at
BEFORE UPDATE ON public.trees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();