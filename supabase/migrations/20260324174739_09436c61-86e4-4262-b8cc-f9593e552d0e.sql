ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS whispers_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whispers_near_tree_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whispers_auto_open boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whispers_haptic boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_tree_interactions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_nearby_friends boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_council_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_minting_events boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_system_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_onboarding_nudges boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_floating_prompts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_companion_suggestions boolean NOT NULL DEFAULT true;