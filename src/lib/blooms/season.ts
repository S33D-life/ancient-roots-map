/**
 * Season helpers for Blooms Nearby.
 * Northern-hemisphere meteorological seasons (v1).
 * Future: derive from latitude / hemisphere.
 */
export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

export const SEASON_LABEL: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

export const SEASON_EMOJI: Record<Season, string> = {
  spring: "🌸",
  summer: "🌿",
  autumn: "🍂",
  winter: "❄️",
};

export function deriveSeason(date: Date = new Date()): Season {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

export function deriveYear(date: Date = new Date()): number {
  return date.getFullYear();
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
