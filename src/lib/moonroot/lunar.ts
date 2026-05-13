/**
 * Lunar framing helpers for Moonroot Digest.
 *
 * Pure utilities — given a date range, surface a poetic moon-cycle label,
 * a glyph, and previous/next cycle navigation. Uses the existing
 * astronomy-engine wrapper to stay accurate.
 */
import * as Astro from "astronomy-engine";
import { nextMoonPhase, nextNewMoon, nextFullMoon } from "@/lib/astronomy";
import type { MoonrootDigestType } from "./types";

export interface LunarCycleFraming {
  /** Short poetic label for the period, e.g. "Waxing Moon". */
  label: string;
  /** Single moon glyph for the period. */
  glyph: string;
  /** One-line atmospheric subtitle. */
  whisper: string;
}

/**
 * Approximate the moon's illuminated fraction (0–1) at a given moment.
 * 0 = new, 0.5 = quarter, 1 = full.
 */
export function moonIllumination(date: Date = new Date()): number {
  try {
    const phase = Astro.MoonPhase(date); // 0..360°
    // Illumination fraction = (1 - cos(phase))/2
    const rad = (phase * Math.PI) / 180;
    return (1 - Math.cos(rad)) / 2;
  } catch {
    return 0.5;
  }
}

/** Whether the moon is waxing (growing) at `date`. */
export function isWaxing(date: Date = new Date()): boolean {
  try {
    const phase = Astro.MoonPhase(date);
    return phase < 180;
  } catch {
    return true;
  }
}

/**
 * Given a digest's end date and type, derive a poetic lunar framing.
 * The framing follows the *end* of the window — the moon you are
 * reflecting beneath.
 */
export function deriveLunarFraming(
  type: MoonrootDigestType,
  endDate: Date,
): LunarCycleFraming {
  if (type === "new_moon") {
    return {
      label: "New Moon Threshold",
      glyph: "🌑",
      whisper: "A quiet beginning. The grove gathers itself again.",
    };
  }
  if (type === "full_moon") {
    return {
      label: "Full Moon Reflection",
      glyph: "🌕",
      whisper: "The canopy is luminous. What has ripened this cycle?",
    };
  }

  // Weekly / custom — read the sky at endDate
  const illum = moonIllumination(endDate);
  const waxing = isWaxing(endDate);

  if (illum < 0.08) return { label: "New Moon Threshold", glyph: "🌑", whisper: "A quiet beginning." };
  if (illum > 0.92) return { label: "Full Moon Reflection", glyph: "🌕", whisper: "The canopy is luminous." };
  if (waxing) {
    return illum < 0.5
      ? { label: "Waxing Crescent", glyph: "🌒", whisper: "Soft light, slow returning." }
      : { label: "Waxing Moon", glyph: "🌔", whisper: "Growing light. Paths widen." };
  }
  return illum > 0.5
    ? { label: "Waning Gibbous", glyph: "🌖", whisper: "The light folds inward." }
    : { label: "Waning Paths", glyph: "🌘", whisper: "A softer ending. Roots remember." };
}

/**
 * Navigate one full lunar cycle (~29.5 days) backward or forward
 * from an anchor date. Used for prev/next cycle in curator preview.
 */
export function shiftLunarCycle(anchor: Date, direction: -1 | 1): Date {
  const ms = direction * 29.530588 * 24 * 60 * 60 * 1000;
  return new Date(anchor.getTime() + ms);
}

/**
 * Given an end date, return the previous matching phase moment.
 * Used by curator nav to step through moons.
 */
export function previousPhaseDate(phase: "new_moon" | "full_moon", from: Date): Date {
  // Search 35 days before `from`
  const start = new Date(from.getTime() - 35 * 24 * 60 * 60 * 1000);
  return phase === "new_moon" ? nextNewMoon(start) : nextFullMoon(start);
}

export function nextPhaseDate(phase: "new_moon" | "full_moon", from: Date): Date {
  return phase === "new_moon" ? nextNewMoon(from) : nextFullMoon(from);
}
