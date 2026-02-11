-- Fix: Restrict chat room visibility to members + public/global rooms only
DROP POLICY IF EXISTS "Authenticated users can view chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can view public or member rooms"
ON public.chat_rooms
FOR SELECT
USING (
  type IN ('global', 'tree')
  OR EXISTS (
    SELECT 1 FROM public.chat_room_members
    WHERE chat_room_members.room_id = chat_rooms.id
    AND chat_room_members.user_id = auth.uid()
  )
  OR created_by = auth.uid()
);
