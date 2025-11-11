-- Create tree_wishlist table for users to save trees they want to visit
CREATE TABLE public.tree_wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tree_id)
);

-- Enable RLS
ALTER TABLE public.tree_wishlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view their own wishlist"
ON public.tree_wishlist
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY "Users can add to their own wishlist"
ON public.tree_wishlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own wishlist
CREATE POLICY "Users can update their own wishlist"
ON public.tree_wishlist
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete from their own wishlist
CREATE POLICY "Users can delete from their own wishlist"
ON public.tree_wishlist
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_tree_wishlist_user_id ON public.tree_wishlist(user_id);
CREATE INDEX idx_tree_wishlist_tree_id ON public.tree_wishlist(tree_id);