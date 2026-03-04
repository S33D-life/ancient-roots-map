/**
 * useSeasonalTheme — applies season-based CSS custom properties
 * for subtle environmental shifts across the tree scroll.
 *
 * Spring:  fresh greens, blossom pinks
 * Summer:  dense greens, warm golds
 * Autumn:  warm ambers, burnt oranges
 * Winter:  cool blues, muted silvers
 */
import { useEffect, useMemo } from "react";

export type Season = "spring" | "summer" | "autumn" | "winter";

function getSeason(): Season {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

const SEASON_VARS: Record<Season, Record<string, string>> = {
  spring: {
    "--season-accent-hue": "120",
    "--season-accent-sat": "35%",
    "--season-accent-light": "55%",
    "--season-leaf-hue": "100",
    "--season-warmth": "0.03",
    "--season-crown-hue": "50",
    "--season-canopy-hue": "140",
    "--season-trunk-hue": "30",
    "--season-root-hue": "35",
  },
  summer: {
    "--season-accent-hue": "90",
    "--season-accent-sat": "40%",
    "--season-accent-light": "48%",
    "--season-leaf-hue": "110",
    "--season-warmth": "0.05",
    "--season-crown-hue": "45",
    "--season-canopy-hue": "150",
    "--season-trunk-hue": "28",
    "--season-root-hue": "30",
  },
  autumn: {
    "--season-accent-hue": "30",
    "--season-accent-sat": "55%",
    "--season-accent-light": "50%",
    "--season-leaf-hue": "25",
    "--season-warmth": "0.07",
    "--season-crown-hue": "38",
    "--season-canopy-hue": "40",
    "--season-trunk-hue": "22",
    "--season-root-hue": "20",
  },
  winter: {
    "--season-accent-hue": "210",
    "--season-accent-sat": "20%",
    "--season-accent-light": "60%",
    "--season-leaf-hue": "200",
    "--season-warmth": "0.02",
    "--season-crown-hue": "50",
    "--season-canopy-hue": "160",
    "--season-trunk-hue": "35",
    "--season-root-hue": "25",
  },
};

export function useSeasonalTheme() {
  const season = useMemo(getSeason, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Apply season body class
    body.classList.forEach((cls) => {
      if (cls.startsWith("season-")) body.classList.remove(cls);
    });
    body.classList.add(`season-${season}`);

    // Apply CSS custom properties
    const vars = SEASON_VARS[season];
    Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));

    return () => {
      body.classList.remove(`season-${season}`);
    };
  }, [season]);

  return season;
}
