
-- Library sources table (CLZ, future sources)
CREATE TABLE public.library_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  source_type TEXT NOT NULL DEFAULT 'clz_cloud_link',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.library_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sources" ON public.library_sources
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_library_sources_user_id ON public.library_sources(user_id);

-- Extend bookshelf_entries with source tracking
ALTER TABLE public.bookshelf_entries
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS isbn TEXT;

-- Shelf templates table
CREATE TABLE public.shelf_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  shelf_names TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shelf_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates" ON public.shelf_templates
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own templates" ON public.shelf_templates
  FOR ALL USING (auth.uid() = created_by OR is_system = true)
  WITH CHECK (auth.uid() = created_by);
