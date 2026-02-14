-- Add unique constraint on user_id to prevent duplicate presence records
ALTER TABLE public.user_presence
ADD CONSTRAINT user_presence_user_id_unique UNIQUE (user_id);