/**
 * Skystamp hook — generates a sky_stamp record combining weather + sky position.
 * Currently uses mock data; future: OpenWeather One Call + astronomy API.
 */
import { supabase } from "@/integrations/supabase/client";
import { useWeather, formatTemp, formatWind, type WeatherSnapshot } from "./use-weather";

/* -------- Types -------- */

export interface SkyCore {
  sun: { altitudeDeg: number; azimuthDeg: number; isDaylight: boolean; twilightPhase: string };
  moon: { altitudeDeg: number; azimuthDeg: number; phaseName: string; illuminationPct: number };
}

export interface SkyPlanet {
  name: string;
  altitudeDeg: number;
  azimuthDeg: number;
  isAboveHorizon: boolean;
  isLikelyVisible: boolean;
}

export interface SkySeal {
  glyphKey: string;
  shortLine1: string;
  shortLine2: string;
}

export interface SkyStamp {
  id: string;
  created_at: string;
  lat: number;
  lng: number;
  weather: WeatherSnapshot | null;
  sky_core: SkyCore | null;
  sky_planets: SkyPlanet[] | null;
  seal: SkySeal;
}

/* -------- Deterministic helpers -------- */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const MOON_PHASES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent",
] as const;

const TWILIGHT_PHASES = ["day", "civil_twilight", "nautical_twilight", "astronomical_twilight", "night"] as const;

const PLANETS = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const;

/** Generate mock sky core data for a given lat, lng, and time */
export function generateMockSkyCore(lat: number, lng: number, date: Date = new Date()): SkyCore {
  const hour = date.getUTCHours() + (lng / 15); // rough local solar time
  const localHour = ((hour % 24) + 24) % 24;

  // Sun altitude: peaks at noon (~60°), dips to -40° at midnight
  const sunAlt = Math.round(60 * Math.sin(((localHour - 6) / 24) * Math.PI * 2) * 10) / 10;
  const sunAz = Math.round(((localHour / 24) * 360) * 10) / 10;
  const isDaylight = sunAlt > 0;

  let twilightPhase: string;
  if (sunAlt > 0) twilightPhase = "day";
  else if (sunAlt > -6) twilightPhase = "civil_twilight";
  else if (sunAlt > -12) twilightPhase = "nautical_twilight";
  else if (sunAlt > -18) twilightPhase = "astronomical_twilight";
  else twilightPhase = "night";

  // Moon: use lunar cycle (~29.5 days)
  const daysSinceEpoch = date.getTime() / (1000 * 60 * 60 * 24);
  const lunarAge = (daysSinceEpoch % 29.53);
  const phaseIdx = Math.floor((lunarAge / 29.53) * 8) % 8;
  const illumination = Math.round(
    phaseIdx <= 4
      ? (phaseIdx / 4) * 100
      : ((8 - phaseIdx) / 4) * 100
  );
  // Moon altitude offset from sun by ~180°
  const moonAlt = Math.round(-sunAlt * 0.7 + (Math.sin(lunarAge) * 15) * 10) / 10;
  const moonAz = Math.round(((sunAz + 180) % 360) * 10) / 10;

  return {
    sun: { altitudeDeg: sunAlt, azimuthDeg: sunAz, isDaylight, twilightPhase },
    moon: { altitudeDeg: moonAlt, azimuthDeg: moonAz, phaseName: MOON_PHASES[phaseIdx], illuminationPct: illumination },
  };
}

/** Generate mock planet positions */
export function generateMockPlanets(lat: number, lng: number, skyCore: SkyCore, clouds: number, date: Date = new Date()): SkyPlanet[] {
  const seed = Math.abs(Math.round(lat * 100) + Math.round(lng * 100) + Math.floor(date.getTime() / (1000 * 60 * 60)));
  const rand = seededRandom(seed);

  return PLANETS.map(name => {
    const alt = Math.round((rand() * 160 - 50) * 10) / 10; // -50 to 110
    const az = Math.round(rand() * 360 * 10) / 10;
    const isAboveHorizon = alt > 0;
    const isDark = skyCore.sun.altitudeDeg < -6;
    const isLikelyVisible = isAboveHorizon && alt > 10 && isDark && clouds < 60;
    return { name, altitudeDeg: alt, azimuthDeg: az, isAboveHorizon, isLikelyVisible };
  })
    .filter(p => p.isAboveHorizon)
    .sort((a, b) => b.altitudeDeg - a.altitudeDeg)
    .slice(0, 3);
}

/** Generate seal display data from weather + sky */
export function generateSeal(weather: WeatherSnapshot | null, skyCore: SkyCore | null, planets: SkyPlanet[] | null, tempUnit = "C", windUnit = "km/h"): SkySeal {
  // Glyph key
  const weatherPart = weather ? getWeatherGlyph(weather.weatherCode) : "unknown";
  const moonPart = skyCore ? skyCore.moon.phaseName.toLowerCase().replace(/\s+/g, "") : "moon";
  const planetPart = planets && planets.length > 0 ? planets[0].name.toLowerCase() : "";
  const glyphKey = [weatherPart, moonPart, planetPart].filter(Boolean).join("_");

  // Short lines
  const shortLine1 = weather
    ? `${formatTemp(weather.temp, tempUnit)} • Wind ${formatWind(weather.windSpeed, windUnit)}`
    : "Moment captured";
  
  const moonLabel = skyCore ? skyCore.moon.phaseName : "";
  const topPlanet = planets?.find(p => p.isLikelyVisible);
  const planetLabel = topPlanet ? ` • ${topPlanet.name} ↑` : "";
  const shortLine2 = moonLabel ? `${moonLabel}${planetLabel}` : new Date().toLocaleDateString();

  return { glyphKey, shortLine1, shortLine2 };
}

function getWeatherGlyph(code: number): string {
  if (code === 800) return "clear";
  if (code >= 801 && code <= 804) return "clouds";
  if (code >= 500 && code < 600) return "rain";
  if (code >= 600 && code < 700) return "snow";
  if (code >= 700 && code < 800) return "mist";
  if (code >= 200 && code < 300) return "storm";
  return "mixed";
}

/** Get icon emoji for seal glyph */
export function getSealIcon(glyphKey: string): string {
  if (glyphKey.startsWith("clear")) return "✦";
  if (glyphKey.startsWith("clouds")) return "◐";
  if (glyphKey.startsWith("rain")) return "◉";
  if (glyphKey.startsWith("snow")) return "❋";
  if (glyphKey.startsWith("mist")) return "◌";
  if (glyphKey.startsWith("storm")) return "⚡";
  return "◈";
}

/* -------- Cache key -------- */

export function buildCacheKey(lat: number, lng: number, date: Date = new Date()): string {
  const latR = Math.round(lat * 1000) / 1000;
  const lngR = Math.round(lng * 1000) / 1000;
  const bucket = Math.floor(date.getTime() / (1000 * 60 * 15)); // 15-min bucket
  return `${latR}_${lngR}_${bucket}`;
}

/* -------- Create or reuse stamp -------- */

export async function createOrReuseSkystamp(params: {
  lat: number;
  lng: number;
  userId: string;
  treeId?: string;
  offeringId?: string;
  whisperId?: string;
  checkinId?: string;
  weather?: WeatherSnapshot | null;
  tempUnit?: string;
  windUnit?: string;
}): Promise<string | null> {
  const { lat, lng, userId, treeId, offeringId, whisperId, checkinId, weather, tempUnit = "C", windUnit = "km/h" } = params;
  const now = new Date();
  const cacheKey = buildCacheKey(lat, lng, now);

  // Try to reuse existing stamp with same cache key
  const { data: existing } = await supabase
    .from("sky_stamps")
    .select("id")
    .eq("cache_key", cacheKey)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  // Generate sky data
  const skyCore = generateMockSkyCore(lat, lng, now);
  const clouds = weather?.clouds ?? 50;
  const skyPlanets = generateMockPlanets(lat, lng, skyCore, clouds, now);
  const seal = generateSeal(weather ?? null, skyCore, skyPlanets, tempUnit, windUnit);

  const { data, error } = await supabase
    .from("sky_stamps")
    .insert({
      lat,
      lng,
      user_id: userId,
      source_tree_id: treeId || null,
      source_offering_id: offeringId || null,
      source_whisper_id: whisperId || null,
      source_checkin_id: checkinId || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      weather: weather ? JSON.parse(JSON.stringify(weather)) : null,
      sky_core: skyCore as any,
      sky_planets: skyPlanets as any,
      seal: seal as any,
      cache_key: cacheKey,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create sky stamp:", error);
    return null;
  }
  return data.id;
}
