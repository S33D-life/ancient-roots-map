/**
 * mapSeasonalTint — Applies seasonal and golden-hour CSS classes
 * to the map container for atmospheric visual tinting.
 * Uses CSS-only approach — zero performance cost.
 */

type Season = "spring" | "summer" | "autumn" | "winter";

const NORTHERN_SEASONS: [number, Season][] = [
  [2, "spring"], [5, "summer"], [8, "autumn"], [11, "winter"],
];

function getSeason(month: number, hemisphere: "north" | "south" = "north"): Season {
  const m = hemisphere === "south" ? (month + 6) % 12 : month;
  for (let i = NORTHERN_SEASONS.length - 1; i >= 0; i--) {
    if (m >= NORTHERN_SEASONS[i][0]) return NORTHERN_SEASONS[i][1];
  }
  return "winter";
}

function isGoldenHour(): boolean {
  const h = new Date().getHours();
  return (h >= 17 && h <= 19) || (h >= 6 && h <= 7);
}

/**
 * Apply seasonal + golden-hour classes to a container element.
 * Call once on map init. Returns cleanup function.
 */
export function applySeasonalTint(container: HTMLElement): () => void {
  const now = new Date();
  const season = getSeason(now.getMonth());

  // Remove any existing season classes
  container.classList.remove("season-spring", "season-summer", "season-autumn", "season-winter", "golden-hour");

  // Apply current season
  container.classList.add(`season-${season}`);

  // Golden hour check
  if (isGoldenHour()) {
    container.classList.add("golden-hour");
  }

  // Update golden hour periodically (every 5 min)
  const interval = setInterval(() => {
    if (isGoldenHour()) {
      container.classList.add("golden-hour");
    } else {
      container.classList.remove("golden-hour");
    }
  }, 5 * 60 * 1000);

  return () => {
    clearInterval(interval);
    container.classList.remove("season-spring", "season-summer", "season-autumn", "season-winter", "golden-hour");
  };
}
