
-- Create meetings table: users "meet" a tree, starting a 12-hour offering window
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '12 hours'),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Users can view their own meetings
CREATE POLICY "Users can view their own meetings"
  ON public.meetings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own meetings
CREATE POLICY "Users can create their own meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meetings
CREATE POLICY "Users can delete their own meetings"
  ON public.meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Add meeting_id to offerings (nullable for backward compat)
ALTER TABLE public.offerings ADD COLUMN meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL;

-- Index for quick lookups
CREATE INDEX idx_meetings_user_tree ON public.meetings(user_id, tree_id);
CREATE INDEX idx_meetings_expires ON public.meetings(expires_at);
CREATE INDEX idx_offerings_meeting ON public.offerings(meeting_id);

-- Enable realtime for meetings
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
