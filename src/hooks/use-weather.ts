/**
 * Mock weather hook for tree pages.
 * Generates realistic mock data based on lat/lng + season.
 * Future: replace with OpenWeather One Call API.
 */
import { useState, useEffect } from "react";

export interface WeatherSnapshot {
  id: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGust: number | null;
  clouds: number;
  uvi: number;
  visibility: number;
  weatherCode: number;
  weatherDesc: string;
  weatherIcon: string;
  rain1h: number | null;
  snow1h: number | null;
  fetchedAt: string;
  source: string;
  dailyForecast: DailyForecast[];
  alerts: WeatherAlert[];
}

export interface DailyForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  weatherDesc: string;
  weatherIcon: string;
  pop: number; // probability of precipitation
}

export interface WeatherAlert {
  event: string;
  description: string;
  start: string;
  end: string;
}

// Weather condition presets
const CONDITIONS = [
  { code: 800, desc: "Clear sky", icon: "☀️" },
  { code: 801, desc: "Few clouds", icon: "🌤️" },
  { code: 802, desc: "Scattered clouds", icon: "⛅" },
  { code: 803, desc: "Overcast", icon: "☁️" },
  { code: 500, desc: "Light rain", icon: "🌧️" },
  { code: 601, desc: "Light snow", icon: "🌨️" },
  { code: 741, desc: "Fog", icon: "🌫️" },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getSeasonalBase(lat: number): { tempBase: number; isWinter: boolean } {
  const month = new Date().getMonth();
  const isNorthern = lat >= 0;
  const winterMonths = isNorthern ? [11, 0, 1] : [5, 6, 7];
  const summerMonths = isNorthern ? [5, 6, 7] : [11, 0, 1];
  
  const isWinter = winterMonths.includes(month);
  const isSummer = summerMonths.includes(month);
  
  // Higher elevation (inferred from latitude extremes) = colder
  const absLat = Math.abs(lat);
  const latCooling = absLat > 45 ? -8 : absLat > 30 ? -3 : 0;
  
  if (isWinter) return { tempBase: -2 + latCooling, isWinter: true };
  if (isSummer) return { tempBase: 22 + latCooling, isWinter: false };
  return { tempBase: 12 + latCooling, isWinter: false };
}

export function useWeather(lat: number | null, lng: number | null): {
  weather: WeatherSnapshot | null;
  loading: boolean;
} {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lat == null || lng == null) {
      setLoading(false);
      return;
    }

    // Generate deterministic mock data based on location + day
    const dayKey = Math.floor(Date.now() / (1000 * 60 * 15)); // changes every 15 min
    const seed = Math.abs(Math.round(lat * 1000) + Math.round(lng * 1000) + dayKey);
    const rand = seededRandom(seed);

    const { tempBase, isWinter } = getSeasonalBase(lat);
    const condition = CONDITIONS[Math.floor(rand() * CONDITIONS.length)];
    const temp = Math.round((tempBase + rand() * 8 - 4) * 10) / 10;
    const windSpeed = Math.round((rand() * 25 + 2) * 10) / 10;

    // Generate 3-day forecast
    const dailyForecast: DailyForecast[] = Array.from({ length: 3 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      const fRand = seededRandom(seed + i * 100);
      const dayCondition = CONDITIONS[Math.floor(fRand() * CONDITIONS.length)];
      const dayTempBase = tempBase + fRand() * 6 - 3;
      return {
        date: d.toISOString().split("T")[0],
        tempMin: Math.round((dayTempBase - 3) * 10) / 10,
        tempMax: Math.round((dayTempBase + 5) * 10) / 10,
        weatherDesc: dayCondition.desc,
        weatherIcon: dayCondition.icon,
        pop: Math.round(fRand() * 80),
      };
    });

    // Alpine alert for high-elevation areas
    const alerts: WeatherAlert[] = [];
    if (lat > 45 && isWinter && rand() > 0.7) {
      alerts.push({
        event: "Mountain weather advisory",
        description: "Conditions may be hazardous. Consider local guidance.",
        start: new Date().toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    setWeather({
      id: `mock-${seed}`,
      temp,
      feelsLike: Math.round((temp - windSpeed * 0.2) * 10) / 10,
      humidity: Math.round(40 + rand() * 50),
      windSpeed,
      windGust: rand() > 0.5 ? Math.round((windSpeed + rand() * 15) * 10) / 10 : null,
      clouds: Math.round(rand() * 100),
      uvi: isWinter ? Math.round(rand() * 3 * 10) / 10 : Math.round(rand() * 9 * 10) / 10,
      visibility: Math.round(5000 + rand() * 15000),
      weatherCode: condition.code,
      weatherDesc: condition.desc,
      weatherIcon: condition.icon,
      rain1h: condition.code === 500 ? Math.round(rand() * 3 * 10) / 10 : null,
      snow1h: condition.code === 601 ? Math.round(rand() * 2 * 10) / 10 : null,
      fetchedAt: new Date().toISOString(),
      source: "mock",
      dailyForecast,
      alerts,
    });
    setLoading(false);
  }, [lat, lng]);

  return { weather, loading };
}

/** Format temperature based on unit preference */
export function formatTemp(temp: number, unit: string = "C"): string {
  if (unit === "F") return `${Math.round(temp * 9 / 5 + 32)}°F`;
  return `${Math.round(temp)}°C`;
}

/** Format wind speed based on unit preference */
export function formatWind(speed: number, unit: string = "km/h"): string {
  if (unit === "m/s") return `${Math.round(speed / 3.6 * 10) / 10} m/s`;
  return `${Math.round(speed)} km/h`;
}

/** Create a short weather summary string for attaching to check-ins */
export function weatherSummary(w: WeatherSnapshot, tempUnit = "C", windUnit = "km/h"): string {
  const parts = [
    w.weatherIcon,
    formatTemp(w.temp, tempUnit),
    `Wind ${formatWind(w.windSpeed, windUnit)}`,
  ];
  if (w.rain1h) parts.push(`Rain ${w.rain1h}mm`);
  if (w.snow1h) parts.push(`Snow ${w.snow1h}mm`);
  return parts.join(", ");
}
