/**
 * Mayan Tzolkin Calendar — Algorithmic calculation
 *
 * The Tzolkin is a 260-day sacred cycle composed of:
 * - 13 numbers (trecena: 1-13)
 * - 20 day signs (named glyphs)
 *
 * Uses the GMT correlation constant (584283) which is the most
 * widely accepted scholarly correlation between the Maya Long Count
 * and the Gregorian/Julian calendar.
 *
 * DISCLAIMER: Multiple correlations exist (GMT±2 variants). This
 * implementation uses the Goodman-Martínez-Thompson correlation.
 * Living Maya communities may follow different counts. This is
 * offered as a lens of meaning, not as authoritative cultural practice.
 */

export interface TzolkinDay {
  number: number;        // 1-13 (trecena number)
  signIndex: number;     // 0-19
  signName: string;      // Yucatec name
  signGlyph: string;     // Emoji approximation
  dayOfCycle: number;    // 0-259 position in 260-day cycle
  meaning: string;       // Brief theme/meaning
  element: string;       // Associated element/direction
}

// 20 Tzolkin day signs (Yucatec Maya names)
const DAY_SIGNS: Array<{ name: string; glyph: string; meaning: string; element: string }> = [
  { name: "Imix",    glyph: "🐊", meaning: "Origin, nurturing, primordial waters",       element: "Water" },
  { name: "Ik'",     glyph: "💨", meaning: "Breath, spirit, communication, wind",        element: "Air" },
  { name: "Ak'bal",  glyph: "🌙", meaning: "Darkness, introspection, dawn, dreaming",    element: "Earth" },
  { name: "K'an",    glyph: "🌽", meaning: "Seed, abundance, ripening, sustenance",      element: "Fire" },
  { name: "Chikchan",glyph: "🐍", meaning: "Life force, kundalini, serpent power",       element: "Water" },
  { name: "Kimi",    glyph: "💀", meaning: "Transformation, death/rebirth, ancestors",   element: "Air" },
  { name: "Manik'",  glyph: "🦌", meaning: "Healing, deer, stewardship, grace",          element: "Earth" },
  { name: "Lamat",   glyph: "⭐", meaning: "Star, harmony, beauty, abundance",           element: "Fire" },
  { name: "Muluk",   glyph: "💧", meaning: "Water, offering, purification, flow",        element: "Water" },
  { name: "Ok",      glyph: "🐕", meaning: "Dog, loyalty, guidance, heart",              element: "Air" },
  { name: "Chuwen",  glyph: "🐒", meaning: "Monkey, play, artistry, creation",           element: "Earth" },
  { name: "Eb'",     glyph: "🌿", meaning: "Road, grass, journey, community",            element: "Fire" },
  { name: "B'en",    glyph: "🎋", meaning: "Reed, authority, sky-earth pillar",          element: "Water" },
  { name: "Ix",      glyph: "🐆", meaning: "Jaguar, magic, earth force, mystery",        element: "Air" },
  { name: "Men",     glyph: "🦅", meaning: "Eagle, vision, higher perspective",          element: "Earth" },
  { name: "K'ib'",   glyph: "🦉", meaning: "Owl, wisdom, forgiveness, ancestral memory", element: "Fire" },
  { name: "Kab'an",  glyph: "🌍", meaning: "Earth, movement, synchronicity",             element: "Water" },
  { name: "Etz'nab'",glyph: "🔪", meaning: "Flint, truth, clarity, discernment",         element: "Air" },
  { name: "Kawak",   glyph: "⛈️", meaning: "Storm, catalyst, healing thunder",           element: "Earth" },
  { name: "Ajaw",    glyph: "☀️", meaning: "Sun, lord, enlightenment, wholeness",        element: "Fire" },
];

/**
 * GMT correlation constant: Julian Day Number for the Maya
 * creation date 0.0.0.0.0 (13.0.0.0.0 = 4 Ajaw 8 Kumk'u)
 */
const GMT_CORRELATION = 584283;

/**
 * Calculate Julian Day Number from a Gregorian date.
 * Standard astronomical formula.
 */
function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Get the Tzolkin day for any Gregorian date.
 */
export function getTzolkinDay(date: Date): TzolkinDay {
  const jdn = gregorianToJDN(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  // Tzolkin position from JDN using GMT correlation
  // The reference: JDN 584283 = 4 Ajaw
  // 4 Ajaw → number=4, signIndex=19 (Ajaw is index 19)
  // dayOfCycle for 4 Ajaw = (4-1)*20 + 19 ... actually we need modular arithmetic

  // Number cycles through 1-13
  // Sign cycles through 0-19
  // They advance together each day

  const daysSinceRef = jdn - GMT_CORRELATION;

  // Reference day: 4 Ajaw
  // number = ((daysSinceRef + 4 - 1) mod 13) + 1
  // signIndex = (daysSinceRef + 19) mod 20
  const number = ((daysSinceRef % 13 + 13) % 13 + 4 - 1) % 13 + 1;
  // Adjust: reference is 4, so offset is 3 (4-1)
  const rawNum = ((daysSinceRef + 3) % 13 + 13) % 13 + 1;

  const signIndex = ((daysSinceRef + 19) % 20 + 20) % 20;

  const sign = DAY_SIGNS[signIndex];
  const dayOfCycle = ((daysSinceRef % 260) + 260) % 260;

  return {
    number: rawNum,
    signIndex,
    signName: sign.name,
    signGlyph: sign.glyph,
    dayOfCycle,
    meaning: sign.meaning,
    element: sign.element,
  };
}

/**
 * Get a formatted label for a Tzolkin day.
 * e.g., "4 Ajaw" or "1 Imix"
 */
export function formatTzolkinLabel(day: TzolkinDay): string {
  return `${day.number} ${day.signName}`;
}

/**
 * Get poetic label variant
 */
export function formatTzolkinPoetic(day: TzolkinDay): string {
  return `${day.signGlyph} ${day.number} ${day.signName} — ${day.meaning.split(",")[0]}`;
}

export { DAY_SIGNS };
