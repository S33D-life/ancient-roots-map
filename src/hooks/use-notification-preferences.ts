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
  // Whispers & Presence
  whispers_enabled: boolean;
  whispers_near_tree_only: boolean;
  whispers_auto_open: boolean;
  whispers_haptic: boolean;
  // Notifications & Alerts
  notify_tree_interactions: boolean;
  notify_nearby_friends: boolean;
  notify_council_updates: boolean;
  notify_minting_events: boolean;
  notify_system_updates: boolean;
  quiet_mode: boolean;
  // Experience & Interface
  show_onboarding_nudges: boolean;
  show_floating_prompts: boolean;
  show_companion_suggestions: boolean;
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
  whispers_enabled: true,
  whispers_near_tree_only: false,
  whispers_auto_open: false,
  whispers_haptic: true,
  notify_tree_interactions: true,
  notify_nearby_friends: true,
  notify_council_updates: true,
  notify_minting_events: true,
  notify_system_updates: true,
  quiet_mode: false,
  show_onboarding_nudges: true,
  show_floating_prompts: true,
  show_companion_suggestions: true,
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
            whispers_enabled: data.whispers_enabled ?? true,
            whispers_near_tree_only: data.whispers_near_tree_only ?? false,
            whispers_auto_open: data.whispers_auto_open ?? false,
            whispers_haptic: data.whispers_haptic ?? true,
            notify_tree_interactions: data.notify_tree_interactions ?? true,
            notify_nearby_friends: data.notify_nearby_friends ?? true,
            notify_council_updates: data.notify_council_updates ?? true,
            notify_minting_events: data.notify_minting_events ?? true,
            notify_system_updates: data.notify_system_updates ?? true,
            quiet_mode: data.quiet_mode ?? false,
            show_onboarding_nudges: data.show_onboarding_nudges ?? true,
            show_floating_prompts: data.show_floating_prompts ?? true,
            show_companion_suggestions: data.show_companion_suggestions ?? true,
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
      .upsert(row as any, { onConflict: "user_id" });

    setSaving(false);
  }, [userId, prefs]);

  const resetToDefaults = useCallback(async () => {
    if (!userId) return;
    await save(DEFAULTS);
  }, [userId, save]);

  return { prefs, loading, saving, save, resetToDefaults, DEFAULTS };
}
