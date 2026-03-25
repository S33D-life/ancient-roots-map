ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS show_teotag_whispers boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_celebrations boolean NOT NULL DEFAULT true;