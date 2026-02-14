-- Fix chat_room_members: restrict joining to non-DM rooms or rooms user is authorized for
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_room_members;

CREATE POLICY "Users can join non-DM rooms"
  ON public.chat_room_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = room_id AND type != 'dm'
    )
  );

-- Fix profiles: make discoverability require authentication
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (auth.uid() = id OR is_discoverable = true)
  );