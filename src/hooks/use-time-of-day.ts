/**
 * useTimeOfDay — real-time day/night cycle tied to user's local time.
 * Returns a phase and applies a body class for CSS theming.
 *
 * Phases:
 *   dawn    (5–7)   — warm pink/gold
 *   day     (7–17)  — bright, full light
 *   evening (17–20) — golden hour, warm amber
 *   night   (20–5)  — deep blue/indigo, moonlit
 */
import { useEffect, useState } from "react";

export type TimePhase = "dawn" | "day" | "evening" | "night";

function getPhase(): TimePhase {
  const h = new Date().getHours();
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 17) return "day";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}

/** CSS custom properties per phase */
const PHASE_VARS: Record<TimePhase, Record<string, string>> = {
  dawn: {
    "--sky-hue": "25",
    "--sky-sat": "60%",
    "--sky-light": "72%",
    "--sky-opacity": "0.08",
    "--ambient-glow": "hsl(30 70% 65% / 0.06)",
  },
  day: {
    "--sky-hue": "200",
    "--sky-sat": "50%",
    "--sky-light": "80%",
    "--sky-opacity": "0.05",
    "--ambient-glow": "hsl(45 60% 70% / 0.04)",
  },
  evening: {
    "--sky-hue": "35",
    "--sky-sat": "65%",
    "--sky-light": "55%",
    "--sky-opacity": "0.07",
    "--ambient-glow": "hsl(30 60% 50% / 0.06)",
  },
  night: {
    "--sky-hue": "230",
    "--sky-sat": "40%",
    "--sky-light": "20%",
    "--sky-opacity": "0.10",
    "--ambient-glow": "hsl(230 30% 40% / 0.08)",
  },
};

export function useTimeOfDay() {
  const [phase, setPhase] = useState<TimePhase>(getPhase);

  useEffect(() => {
    // Apply body class
    const body = document.body;
    body.classList.forEach((cls) => {
      if (cls.startsWith("time-")) body.classList.remove(cls);
    });
    body.classList.add(`time-${phase}`);

    // Apply CSS custom properties to root
    const root = document.documentElement;
    const vars = PHASE_VARS[phase];
    Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));

    // Re-check every 5 minutes
    const interval = setInterval(() => {
      const newPhase = getPhase();
      if (newPhase !== phase) setPhase(newPhase);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      body.classList.remove(`time-${phase}`);
    };
  }, [phase]);

  return phase;
}
