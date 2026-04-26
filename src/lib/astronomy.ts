/**
 * Astronomy utilities — accurate solar + lunar moments.
 *
 * Wraps `astronomy-engine` so consumers don't need to know the library shape.
 * Used by the cosmic clock UI and (via npm: in Deno) by the lottery scheduler.
 */
import * as Astro from "astronomy-engine";

// ── Moon phases ────────────────────────────────────────────

/**
 * Returns the next astronomical moment (UTC) when the moon reaches the
 * given phase angle, after `from`. Phase angles:
 *   0   = new moon
 *  90   = first quarter
 * 180   = full moon
 * 270   = last quarter
 */
export function nextMoonPhase(angleDeg: number, from: Date = new Date()): Date {
  const ev = Astro.SearchMoonPhase(angleDeg, from, 40);
  if (!ev) {
    throw new Error(`No moon phase ${angleDeg}° found within 40 days of ${from.toISOString()}`);
  }
  return ev.date;
}

export function nextNewMoon(from: Date = new Date()): Date {
  return nextMoonPhase(0, from);
}

export function nextFullMoon(from: Date = new Date()): Date {
  return nextMoonPhase(180, from);
}

/**
 * Returns the next N upcoming new and full moons after `from`, sorted
 * chronologically.
 */
export function upcomingLunarEvents(
  count: number,
  from: Date = new Date()
): Array<{ phase: "new_moon" | "full_moon"; date: Date }> {
  const out: Array<{ phase: "new_moon" | "full_moon"; date: Date }> = [];
  let cursor = new Date(from.getTime());
  // Each cycle has 1 new + 1 full → step forward ~15 days at a time.
  while (out.length < count) {
    const nm = nextNewMoon(cursor);
    out.push({ phase: "new_moon", date: nm });
    if (out.length >= count) break;
    const fm = nextFullMoon(nm);
    out.push({ phase: "full_moon", date: fm });
    cursor = new Date(fm.getTime() + 60 * 60 * 1000); // +1h to avoid re-finding the same event
  }
  return out
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

// ── Solar events (equinoxes + solstices) ───────────────────

export interface SolarEvent {
  type:
    | "equinox_spring"
    | "solstice_summer"
    | "equinox_autumn"
    | "solstice_winter";
  date: Date;
}

/** Equinoxes + solstices for a given year, in UTC (Northern-hemisphere labels). */
export function solarEventsForYear(year: number): SolarEvent[] {
  const sea = Astro.Seasons(year);
  return [
    { type: "equinox_spring", date: sea.mar_equinox.date },
    { type: "solstice_summer", date: sea.jun_solstice.date },
    { type: "equinox_autumn", date: sea.sep_equinox.date },
    { type: "solstice_winter", date: sea.dec_solstice.date },
  ];
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Snap a moment to the next 00:00 UTC after it. The lottery rule is:
 * "the astronomical moment (next midnight UTC after the phase)".
 */
export function nextUtcMidnightAfter(d: Date): Date {
  const next = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0)
  );
  return next;
}

/** Returns the lottery `scheduled_at` for a given astronomical event. */
export function lotteryMomentFor(astronomicalMoment: Date): Date {
  return nextUtcMidnightAfter(astronomicalMoment);
}

/** Current lunar illumination (0..1) and phase angle (0..360). */
export function currentMoonState(now: Date = new Date()): {
  illumination: number;
  phaseAngle: number;
} {
  const illum = Astro.Illumination(Astro.Body.Moon, now);
  const phase = Astro.MoonPhase(now);
  return { illumination: illum.phase_fraction, phaseAngle: phase };
}
