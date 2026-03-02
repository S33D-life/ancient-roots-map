/**
 * useCalendarLenses — Manages lens registry and user preferences.
 * Fetches available lenses from DB, manages user toggles,
 * and provides computed lens data for any given date.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLunarInfo, getSolarEvents, getSeasonInfo, type LunarInfo, type CosmicEvent } from "@/hooks/use-cosmic-clock";
import { getTzolkinDay, formatTzolkinLabel, formatTzolkinPoetic, type TzolkinDay } from "@/utils/mayanTzolkin";
import { getPhaseDisplay } from "@/hooks/use-phenology";

export interface CalendarLens {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  lens_type: string;
  is_default: boolean;
  icon: string;
  region: string | null;
  lineage: string | null;
  attribution: string | null;
  disclaimer: string | null;
  sources: any;
}

export interface UserCalendarPrefs {
  enabled_lens_ids: string[];
  primary_lens_id: string | null;
  hemisphere: "north" | "south";
  region: string | null;
  label_style: "plain" | "poetic";
}

export interface LensDataForDate {
  lensId: string;
  lensSlug: string;
  lensName: string;
  lensIcon: string;
  label: string;
  detail: string;
  metadata?: Record<string, any>;
}

const DEFAULT_PREFS: UserCalendarPrefs = {
  enabled_lens_ids: [],
  primary_lens_id: null,
  hemisphere: "north",
  region: null,
  label_style: "plain",
};

export function useCalendarLenses(userId: string | null) {
  const [lenses, setLenses] = useState<CalendarLens[]>([]);
  const [prefs, setPrefs] = useState<UserCalendarPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  // Fetch lenses + user prefs
  useEffect(() => {
    const load = async () => {
      const { data: lensData } = await supabase
        .from("calendar_lenses")
        .select("*")
        .order("is_default", { ascending: false });

      if (lensData) {
        setLenses(lensData as CalendarLens[]);

        // Set default enabled lenses
        const defaults = lensData.filter((l: any) => l.is_default).map((l: any) => l.id);

        if (userId) {
          const { data: prefData } = await supabase
            .from("user_calendar_preferences")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (prefData) {
            setPrefs({
              enabled_lens_ids: (prefData as any).enabled_lens_ids || defaults,
              primary_lens_id: (prefData as any).primary_lens_id || null,
              hemisphere: (prefData as any).hemisphere || "north",
              region: (prefData as any).region || null,
              label_style: (prefData as any).label_style || "plain",
            });
          } else {
            setPrefs(p => ({ ...p, enabled_lens_ids: defaults }));
          }
        } else {
          setPrefs(p => ({ ...p, enabled_lens_ids: defaults }));
        }
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  // Save preferences
  const savePrefs = useCallback(async (newPrefs: Partial<UserCalendarPrefs>) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);

    if (userId) {
      await supabase.from("user_calendar_preferences").upsert({
        user_id: userId,
        enabled_lens_ids: updated.enabled_lens_ids,
        primary_lens_id: updated.primary_lens_id,
        hemisphere: updated.hemisphere,
        region: updated.region,
        label_style: updated.label_style,
      }, { onConflict: "user_id" });
    }
  }, [userId, prefs]);

  const toggleLens = useCallback((lensId: string) => {
    const current = prefs.enabled_lens_ids;
    const next = current.includes(lensId)
      ? current.filter(id => id !== lensId)
      : [...current, lensId];
    savePrefs({ enabled_lens_ids: next });
  }, [prefs, savePrefs]);

  // Get active lenses
  const activeLenses = useMemo(() =>
    lenses.filter(l => prefs.enabled_lens_ids.includes(l.id)),
    [lenses, prefs.enabled_lens_ids]
  );

  // Compute lens data for a specific date
  const getLensDataForDate = useCallback((date: Date): LensDataForDate[] => {
    const results: LensDataForDate[] = [];
    const isPoetic = prefs.label_style === "poetic";

    for (const lens of activeLenses) {
      switch (lens.slug) {
        case "astronomical": {
          const lunar = getLunarInfo(date);
          if (lunar.phase === "new_moon" || lunar.phase === "full_moon") {
            results.push({
              lensId: lens.id,
              lensSlug: lens.slug,
              lensName: lens.name,
              lensIcon: lens.icon,
              label: isPoetic
                ? `${lunar.emoji} ${lunar.phaseName} — ${Math.round(lunar.illumination * 100)}% illuminated`
                : `${lunar.emoji} ${lunar.phaseName}`,
              detail: lunar.phase === "full_moon"
                ? "Time Tree: Outside of Time reflection"
                : "Time Tree: Inside of Time intention",
            });
          }
          // Check solar events
          const year = date.getFullYear();
          const solar = getSolarEvents(year).find(e => e.date.toDateString() === date.toDateString());
          if (solar) {
            results.push({
              lensId: lens.id,
              lensSlug: lens.slug,
              lensName: lens.name,
              lensIcon: solar.emoji,
              label: solar.name,
              detail: isPoetic ? solar.description : solar.name,
            });
          }
          break;
        }

        case "mayan": {
          const tz = getTzolkinDay(date);
          results.push({
            lensId: lens.id,
            lensSlug: lens.slug,
            lensName: lens.name,
            lensIcon: tz.signGlyph,
            label: isPoetic ? formatTzolkinPoetic(tz) : formatTzolkinLabel(tz),
            detail: tz.meaning,
            metadata: {
              number: tz.number,
              signName: tz.signName,
              signIndex: tz.signIndex,
              element: tz.element,
              dayOfCycle: tz.dayOfCycle,
            },
          });
          break;
        }

        case "seasonal": {
          // Compute phenology signals for this date from food_cycles (sync, no async in callback)
          const month = date.getMonth() + 1;
          const seasonInfo = getSeasonInfo(date, prefs.hemisphere);
          results.push({
            lensId: lens.id,
            lensSlug: lens.slug,
            lensName: lens.name,
            lensIcon: seasonInfo.emoji,
            label: isPoetic
              ? `${seasonInfo.emoji} ${seasonInfo.label} deepens`
              : `${seasonInfo.emoji} ${seasonInfo.label}`,
            detail: `Month ${month} — ${seasonInfo.label} season`,
          });
          break;
        }

        default:
          break;
      }
    }
    return results;
  }, [activeLenses, prefs.label_style]);

  // Quick helper: today's Mayan day (for clock display)
  const todayMayan = useMemo(() => {
    const mayanLens = lenses.find(l => l.slug === "mayan");
    if (!mayanLens || !prefs.enabled_lens_ids.includes(mayanLens.id)) return null;
    return getTzolkinDay(new Date());
  }, [lenses, prefs.enabled_lens_ids]);

  return {
    lenses,
    activeLenses,
    prefs,
    loading,
    savePrefs,
    toggleLens,
    getLensDataForDate,
    todayMayan,
  };
}
