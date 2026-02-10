
-- Chat rooms: global, tree-specific, grove, and DM
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'global',
  name TEXT NOT NULL DEFAULT 'Global Grove',
  tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view rooms
CREATE POLICY "Authenticated users can view chat rooms"
  ON public.chat_rooms FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create rooms
CREATE POLICY "Authenticated users can create chat rooms"
  ON public.chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Chat room members (for DMs and private groups)
CREATE TABLE public.chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their room memberships"
  ON public.chat_room_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join rooms"
  ON public.chat_room_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON public.chat_room_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Messages in public rooms (global, tree, grove) visible to all authenticated users
-- DM messages visible only to room members
CREATE OR REPLACE FUNCTION public.can_view_message(msg_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_rooms WHERE id = msg_room_id AND type != 'dm'
  ) OR EXISTS (
    SELECT 1 FROM chat_room_members WHERE room_id = msg_room_id AND user_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view messages in accessible rooms"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (public.can_view_message(room_id));

CREATE POLICY "Authenticated users can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Online presence tracking
CREATE TABLE public.user_presence (
  user_id UUID PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_online BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view presence"
  ON public.user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own presence"
  ON public.user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update presence"
  ON public.user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Seed the global chat room
INSERT INTO public.chat_rooms (type, name) VALUES ('global', 'The Grove');

-- Enable realtime for messages and presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
