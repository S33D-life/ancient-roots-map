
-- Create vault_items table for personal digital keepsakes
CREATE TABLE public.vault_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'memory',
  content TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own vault items
CREATE POLICY "Users can view their own vault items"
ON public.vault_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vault items"
ON public.vault_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vault items"
ON public.vault_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vault items"
ON public.vault_items FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_vault_items_updated_at
BEFORE UPDATE ON public.vault_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
