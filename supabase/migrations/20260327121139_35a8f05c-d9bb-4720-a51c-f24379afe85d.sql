
-- Telegram integration settings (singleton per project)
CREATE TABLE public.telegram_settings (
  id int PRIMARY KEY CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  chat_id text, -- target group/channel chat ID
  bot_username text,
  -- event toggles
  notify_new_tree boolean NOT NULL DEFAULT true,
  notify_offering boolean NOT NULL DEFAULT true,
  notify_whisper boolean NOT NULL DEFAULT false,
  notify_heart_milestone boolean NOT NULL DEFAULT true,
  notify_council_invite boolean NOT NULL DEFAULT true,
  notify_ecosystem_update boolean NOT NULL DEFAULT true,
  -- delivery mode: 'immediate' or 'digest'
  delivery_mode text NOT NULL DEFAULT 'immediate' CHECK (delivery_mode IN ('immediate', 'digest')),
  digest_hour int DEFAULT 9, -- hour of day for digest (UTC)
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Seed the singleton row
INSERT INTO public.telegram_settings (id) VALUES (1);

-- Enable RLS
ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write (via has_role function if exists, otherwise authenticated)
CREATE POLICY "Authenticated users can read telegram settings"
  ON public.telegram_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update telegram settings"
  ON public.telegram_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Outbound message log
CREATE TABLE public.telegram_outbound_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  message_text text NOT NULL,
  chat_id text NOT NULL,
  telegram_message_id bigint,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_outbound_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read outbound log"
  ON public.telegram_outbound_log FOR SELECT TO authenticated USING (true);

-- Inbound message queue (messages from Telegram into S33D)
CREATE TABLE public.telegram_inbound_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id bigint UNIQUE NOT NULL,
  chat_id bigint NOT NULL,
  from_user_id bigint,
  from_username text,
  message_text text,
  raw_update jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_inbound_chat ON public.telegram_inbound_queue (chat_id);
CREATE INDEX idx_telegram_inbound_processed ON public.telegram_inbound_queue (processed) WHERE NOT processed;

ALTER TABLE public.telegram_inbound_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inbound queue"
  ON public.telegram_inbound_queue FOR SELECT TO authenticated USING (true);

-- Polling state tracker
CREATE TABLE public.telegram_bot_state (
  id int PRIMARY KEY CHECK (id = 1),
  update_offset bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;

-- Only service role should access this, but allow read for monitoring
CREATE POLICY "Authenticated users can read bot state"
  ON public.telegram_bot_state FOR SELECT TO authenticated USING (true);
