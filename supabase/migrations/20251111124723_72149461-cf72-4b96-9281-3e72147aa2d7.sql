-- Create table for tree mapping projects and resources
CREATE TABLE public.tree_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  api_url TEXT,
  species TEXT,
  state TEXT,
  nation TEXT,
  bioregion TEXT,
  what3words TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  project_scope TEXT, -- 'local', 'regional', 'national', 'species-specific', etc.
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tree_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Projects are viewable by everyone" 
ON public.tree_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create projects" 
ON public.tree_projects 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own projects" 
ON public.tree_projects 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own projects" 
ON public.tree_projects 
FOR DELETE 
USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_tree_projects_updated_at
BEFORE UPDATE ON public.tree_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();