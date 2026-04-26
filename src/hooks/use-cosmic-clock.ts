/**
 * useCosmicClock — Unified rhythm layer
 *
 * Provides: lunar phase, season, daily reset countdown, cosmic events.
 * Uses `astronomy-engine` for accurate equinox / solstice / moon moments.
 */
import { useState, useEffect, useMemo } from "react";
import {
  upcomingLunarEvents,
  solarEventsForYear,
  currentMoonState,
} from "@/lib/astronomy";

// ── Lunar Phase Calculation (Trig method, accurate ±1 day) ──

const LUNAR_CYCLE = 29.53058770576;
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();

export type LunarPhase =
  | "new_moon"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full_moon"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

export interface LunarInfo {
  phase: LunarPhase;
  phaseName: string;
  emoji: string;
  illumination: number; // 0-1
  dayOfCycle: number;   // 0-29.5
  daysToNew: number;
  daysToFull: number;
}

const PHASE_DATA: Record<LunarPhase, { name: string; emoji: string }> = {
  new_moon:        { name: "New Moon",        emoji: "🌑" },
  waxing_crescent: { name: "Waxing Crescent", emoji: "🌒" },
  first_quarter:   { name: "First Quarter",   emoji: "🌓" },
  waxing_gibbous:  { name: "Waxing Gibbous",  emoji: "🌔" },
  full_moon:       { name: "Full Moon",        emoji: "🌕" },
  waning_gibbous:  { name: "Waning Gibbous",  emoji: "🌖" },
  last_quarter:    { name: "Last Quarter",     emoji: "🌗" },
  waning_crescent: { name: "Waning Crescent",  emoji: "🌘" },
};

export function getLunarInfo(date: Date = new Date()): LunarInfo {
  // Use astronomy-engine for accurate illumination + phase angle
  const { illumination, phaseAngle } = currentMoonState(date);

  // Map phase angle (0..360) to dayOfCycle (0..LUNAR_CYCLE)
  const dayOfCycle = (phaseAngle / 360) * LUNAR_CYCLE;

  // Phase buckets (8 phases) from angle
  let phase: LunarPhase;
  if (phaseAngle < 22.5)        phase = "new_moon";
  else if (phaseAngle < 67.5)   phase = "waxing_crescent";
  else if (phaseAngle < 112.5)  phase = "first_quarter";
  else if (phaseAngle < 157.5)  phase = "waxing_gibbous";
  else if (phaseAngle < 202.5)  phase = "full_moon";
  else if (phaseAngle < 247.5)  phase = "waning_gibbous";
  else if (phaseAngle < 292.5)  phase = "last_quarter";
  else if (phaseAngle < 337.5)  phase = "waning_crescent";
  else                          phase = "new_moon";

  // Days until next new/full from upcoming events (accurate)
  const next = upcomingLunarEvents(2, date);
  const ms = (d: Date) => (d.getTime() - date.getTime()) / 86400000;
  const nextNew = next.find((e) => e.phase === "new_moon");
  const nextFull = next.find((e) => e.phase === "full_moon");

  const pd = PHASE_DATA[phase];
  return {
    phase,
    phaseName: pd.name,
    emoji: pd.emoji,
    illumination: Math.round(illumination * 100) / 100,
    dayOfCycle: Math.round(dayOfCycle * 10) / 10,
    daysToNew: nextNew ? Math.round(ms(nextNew.date) * 10) / 10 : 0,
    daysToFull: nextFull ? Math.round(ms(nextFull.date) * 10) / 10 : 0,
  };
}

// ── Season Detection ──

export type Season = "spring" | "summer" | "autumn" | "winter";

const SEASON_DATA: Record<Season, { emoji: string; label: string }> = {
  spring: { emoji: "🌱", label: "Spring" },
  summer: { emoji: "☀️", label: "Summer" },
  autumn: { emoji: "🍂", label: "Autumn" },
  winter: { emoji: "❄️", label: "Winter" },
};

export function getSeason(date: Date = new Date(), hemisphere: "north" | "south" = "north"): Season {
  const month = date.getMonth(); // 0-11
  let season: Season;
  if (month >= 2 && month <= 4) season = "spring";
  else if (month >= 5 && month <= 7) season = "summer";
  else if (month >= 8 && month <= 10) season = "autumn";
  else season = "winter";

  if (hemisphere === "south") {
    const flip: Record<Season, Season> = {
      spring: "autumn", summer: "winter", autumn: "spring", winter: "summer"
    };
    season = flip[season];
  }
  return season;
}

export function getSeasonInfo(date?: Date, hemisphere?: "north" | "south") {
  const s = getSeason(date, hemisphere);
  return { season: s, ...SEASON_DATA[s] };
}

// ── Daily Reset Countdown ──

export function getTimeToMidnight(): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

// ── Solar Events (Equinoxes / Solstices — approximate) ──

export interface CosmicEvent {
  id: string;
  name: string;
  emoji: string;
  date: Date;
  type: "solstice" | "equinox" | "lunar" | "seasonal";
  description: string;
}

/** Get accurate solar events for a given year (UTC, computed via astronomy-engine). */
export function getSolarEvents(year: number): CosmicEvent[] {
  const solar = solarEventsForYear(year);
  const byType = (t: typeof solar[number]["type"]) =>
    solar.find((e) => e.type === t)!.date;

  return [
    { id: `veq-${year}`, name: "Vernal Equinox",   emoji: "🌿", date: byType("equinox_spring"),  type: "equinox",  description: "Day and night equal. Spring begins in the Northern Hemisphere." },
    { id: `sso-${year}`, name: "Summer Solstice",  emoji: "☀️", date: byType("solstice_summer"), type: "solstice", description: "Longest day. Midsummer. Peak light in Northern Hemisphere." },
    { id: `aeq-${year}`, name: "Autumnal Equinox", emoji: "🍂", date: byType("equinox_autumn"),  type: "equinox",  description: "Day and night equal. Autumn begins in the Northern Hemisphere." },
    { id: `wso-${year}`, name: "Winter Solstice",  emoji: "❄️", date: byType("solstice_winter"), type: "solstice", description: "Shortest day. Midwinter. The turning of the light." },
    // Cross-quarter days remain calendar-anchored — not astronomical
    { id: `imb-${year}`, name: "Imbolc",     emoji: "🕯️", date: new Date(Date.UTC(year, 1, 1)),  type: "seasonal", description: "Midpoint between winter solstice and spring equinox. First stirrings." },
    { id: `bel-${year}`, name: "Beltane",    emoji: "🔥", date: new Date(Date.UTC(year, 4, 1)),  type: "seasonal", description: "Midpoint between spring equinox and summer solstice. Full bloom." },
    { id: `lug-${year}`, name: "Lughnasadh", emoji: "🌾", date: new Date(Date.UTC(year, 7, 1)),  type: "seasonal", description: "Midpoint between summer solstice and autumn equinox. First harvest." },
    { id: `sam-${year}`, name: "Samhain",    emoji: "🎃", date: new Date(Date.UTC(year, 10, 1)), type: "seasonal", description: "Midpoint between autumn equinox and winter solstice. Thin veil." },
  ];
}

/** Get the next N upcoming new/full moons (accurate, computed via astronomy-engine). */
export function getUpcomingLunarEvents(count: number = 6): CosmicEvent[] {
  const events = upcomingLunarEvents(count, new Date());
  return events.map((e, i) => {
    const isNew = e.phase === "new_moon";
    return {
      id: `${isNew ? "nm" : "fm"}-${e.date.getTime()}`,
      name: isNew ? "New Moon" : "Full Moon",
      emoji: isNew ? "🌑" : "🌕",
      date: e.date,
      type: "lunar" as const,
      description: isNew
        ? "New Moon — seeds of intention. Time Tree: Inside of Time."
        : "Full Moon — illumination. Time Tree: Outside of Time.",
    };
  });
}

// ── Main Hook ──

export interface CosmicClockState {
  lunar: LunarInfo;
  season: ReturnType<typeof getSeasonInfo>;
  countdown: ReturnType<typeof getTimeToMidnight>;
  now: Date;
  upcomingEvents: CosmicEvent[];
}

export function useCosmicClock(hemisphere: "north" | "south" = "north"): CosmicClockState {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const lunar = useMemo(() => getLunarInfo(now), [now.toDateString()]);
  const season = useMemo(() => getSeasonInfo(now, hemisphere), [now.getMonth(), hemisphere]);
  const countdown = useMemo(() => getTimeToMidnight(), [Math.floor(now.getTime() / 1000)]);

  const upcomingEvents = useMemo(() => {
    const year = now.getFullYear();
    const solar = [...getSolarEvents(year), ...getSolarEvents(year + 1)];
    const lunar = getUpcomingLunarEvents(4);
    return [...solar.filter(e => e.date > now), ...lunar]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 8);
  }, [now.toDateString()]);

  return { lunar, season, countdown, now, upcomingEvents };
}
