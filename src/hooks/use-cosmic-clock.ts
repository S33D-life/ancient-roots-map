/**
 * useCosmicClock — Unified rhythm layer
 *
 * Provides: lunar phase, season, daily reset countdown, cosmic events.
 * All calculations are algorithmic (no API needed).
 */
import { useState, useEffect, useMemo } from "react";

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
  const diff = date.getTime() - KNOWN_NEW_MOON;
  const days = diff / (1000 * 60 * 60 * 24);
  const dayOfCycle = ((days % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;

  // Illumination approximation
  const illumination = (1 - Math.cos((2 * Math.PI * dayOfCycle) / LUNAR_CYCLE)) / 2;

  // Phase buckets (8 phases, each ~3.69 days)
  const eighth = LUNAR_CYCLE / 8;
  let phase: LunarPhase;
  if (dayOfCycle < eighth)          phase = "new_moon";
  else if (dayOfCycle < 2 * eighth) phase = "waxing_crescent";
  else if (dayOfCycle < 3 * eighth) phase = "first_quarter";
  else if (dayOfCycle < 4 * eighth) phase = "waxing_gibbous";
  else if (dayOfCycle < 5 * eighth) phase = "full_moon";
  else if (dayOfCycle < 6 * eighth) phase = "waning_gibbous";
  else if (dayOfCycle < 7 * eighth) phase = "last_quarter";
  else                              phase = "waning_crescent";

  const daysToNew = (LUNAR_CYCLE - dayOfCycle) % LUNAR_CYCLE;
  const halfCycle = LUNAR_CYCLE / 2;
  const daysToFull = dayOfCycle < halfCycle
    ? halfCycle - dayOfCycle
    : LUNAR_CYCLE - dayOfCycle + halfCycle;

  const pd = PHASE_DATA[phase];
  return {
    phase,
    phaseName: pd.name,
    emoji: pd.emoji,
    illumination: Math.round(illumination * 100) / 100,
    dayOfCycle: Math.round(dayOfCycle * 10) / 10,
    daysToNew: Math.round(daysToNew * 10) / 10,
    daysToFull: Math.round(daysToFull * 10) / 10,
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

/** Get approximate solar events for a given year */
export function getSolarEvents(year: number): CosmicEvent[] {
  return [
    { id: `veq-${year}`, name: "Vernal Equinox", emoji: "🌿", date: new Date(year, 2, 20), type: "equinox", description: "Day and night equal. Spring begins in the Northern Hemisphere." },
    { id: `sso-${year}`, name: "Summer Solstice", emoji: "☀️", date: new Date(year, 5, 21), type: "solstice", description: "Longest day. Midsummer. Peak light in Northern Hemisphere." },
    { id: `aeq-${year}`, name: "Autumnal Equinox", emoji: "🍂", date: new Date(year, 8, 22), type: "equinox", description: "Day and night equal. Autumn begins in the Northern Hemisphere." },
    { id: `wso-${year}`, name: "Winter Solstice", emoji: "❄️", date: new Date(year, 11, 21), type: "solstice", description: "Shortest day. Midwinter. The turning of the light." },
    // Cross-quarter days
    { id: `imb-${year}`, name: "Imbolc", emoji: "🕯️", date: new Date(year, 1, 1), type: "seasonal", description: "Midpoint between winter solstice and spring equinox. First stirrings." },
    { id: `bel-${year}`, name: "Beltane", emoji: "🔥", date: new Date(year, 4, 1), type: "seasonal", description: "Midpoint between spring equinox and summer solstice. Full bloom." },
    { id: `lug-${year}`, name: "Lughnasadh", emoji: "🌾", date: new Date(year, 7, 1), type: "seasonal", description: "Midpoint between summer solstice and autumn equinox. First harvest." },
    { id: `sam-${year}`, name: "Samhain", emoji: "🎃", date: new Date(year, 10, 1), type: "seasonal", description: "Midpoint between autumn equinox and winter solstice. Thin veil." },
  ];
}

/** Get upcoming new/full moons for next N cycles */
export function getUpcomingLunarEvents(count: number = 6): CosmicEvent[] {
  const events: CosmicEvent[] = [];
  const now = new Date();
  const nowMs = now.getTime();
  const diff = nowMs - KNOWN_NEW_MOON;
  const daysSinceRef = diff / (1000 * 60 * 60 * 24);
  const currentCycle = Math.floor(daysSinceRef / LUNAR_CYCLE);

  for (let i = 0; i < count; i++) {
    const cycleNum = currentCycle + i;
    const newMoonMs = KNOWN_NEW_MOON + cycleNum * LUNAR_CYCLE * 86400000;
    const fullMoonMs = newMoonMs + (LUNAR_CYCLE / 2) * 86400000;
    const newDate = new Date(newMoonMs);
    const fullDate = new Date(fullMoonMs);

    if (newDate > now) {
      events.push({ id: `nm-${cycleNum}`, name: "New Moon", emoji: "🌑", date: newDate, type: "lunar", description: "New Moon — seeds of intention. Time Tree: Inside of Time." });
    }
    if (fullDate > now) {
      events.push({ id: `fm-${cycleNum}`, name: "Full Moon", emoji: "🌕", date: fullDate, type: "lunar", description: "Full Moon — illumination. Time Tree: Outside of Time." });
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, count);
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
