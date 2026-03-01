/**
 * Hook for notification + presence preferences (upsert pattern).
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationPreferences {
  push_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  digest_mode: string;
  max_daily_pushes: number;
  nearby_mode: boolean;
  nearby_radius_m: number;
  weather_unit: string;
  wind_unit: string;
  topic_countries: string[];
  topic_cantons: string[];
  topic_species: string[];
  topic_trees: string[];
  topic_councils: string[];
}

const DEFAULTS: NotificationPreferences = {
  push_enabled: true,
  quiet_hours_start: "21:00",
  quiet_hours_end: "08:00",
  digest_mode: "none",
  max_daily_pushes: 2,
  nearby_mode: false,
  nearby_radius_m: 500,
  weather_unit: "C",
  wind_unit: "km/h",
  topic_countries: [],
  topic_cantons: [],
  topic_species: [],
  topic_trees: [],
  topic_councils: [],
};

export function useNotificationPreferences(userId: string | null) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            push_enabled: data.push_enabled,
            quiet_hours_start: data.quiet_hours_start || "21:00",
            quiet_hours_end: data.quiet_hours_end || "08:00",
            digest_mode: data.digest_mode,
            max_daily_pushes: data.max_daily_pushes,
            nearby_mode: data.nearby_mode,
            nearby_radius_m: data.nearby_radius_m,
            weather_unit: data.weather_unit,
            wind_unit: data.wind_unit,
            topic_countries: data.topic_countries || [],
            topic_cantons: data.topic_cantons || [],
            topic_species: data.topic_species || [],
            topic_trees: data.topic_trees || [],
            topic_councils: data.topic_councils || [],
          });
        }
        setLoading(false);
      });
  }, [userId]);

  const save = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!userId) return;
    setSaving(true);
    const merged = { ...prefs, ...updates };
    setPrefs(merged);

    const row = {
      user_id: userId,
      ...merged,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("notification_preferences")
      .upsert(row, { onConflict: "user_id" });

    setSaving(false);
  }, [userId, prefs]);

  return { prefs, loading, saving, save };
}
