
-- 1. In-app notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'p1',
  deep_link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  dismissed boolean NOT NULL DEFAULT false
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read_at) WHERE read_at IS NULL;

-- 2. Notification preferences table
CREATE TABLE public.notification_preferences (
  user_id uuid NOT NULL PRIMARY KEY,
  push_enabled boolean NOT NULL DEFAULT true,
  quiet_hours_start time DEFAULT '21:00',
  quiet_hours_end time DEFAULT '08:00',
  digest_mode text NOT NULL DEFAULT 'none',
  max_daily_pushes integer NOT NULL DEFAULT 2,
  nearby_mode boolean NOT NULL DEFAULT false,
  nearby_radius_m integer NOT NULL DEFAULT 500,
  weather_unit text NOT NULL DEFAULT 'C',
  wind_unit text NOT NULL DEFAULT 'km/h',
  topic_countries text[] NOT NULL DEFAULT '{}',
  topic_cantons text[] NOT NULL DEFAULT '{}',
  topic_species text[] NOT NULL DEFAULT '{}',
  topic_trees uuid[] NOT NULL DEFAULT '{}',
  topic_councils uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Weather snapshots cache table
CREATE TABLE public.weather_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'mock',
  current_temp numeric,
  current_feels_like numeric,
  current_humidity integer,
  current_wind_speed numeric,
  current_wind_gust numeric,
  current_clouds integer,
  current_uvi numeric,
  current_visibility integer,
  current_weather_code integer,
  current_weather_desc text,
  current_weather_icon text,
  rain_1h numeric,
  snow_1h numeric,
  daily_forecast jsonb DEFAULT '[]'::jsonb,
  alerts jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weather snapshots publicly readable" ON public.weather_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert weather" ON public.weather_snapshots
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_weather_location ON public.weather_snapshots (latitude, longitude, fetched_at DESC);

-- 4. Add weather_snapshot_id to tree_checkins
ALTER TABLE public.tree_checkins
  ADD COLUMN IF NOT EXISTS weather_snapshot_id uuid REFERENCES public.weather_snapshots(id),
  ADD COLUMN IF NOT EXISTS checkin_method text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS privacy text NOT NULL DEFAULT 'public';
