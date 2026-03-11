/**
 * Seasonal Offerings Engine — Ceremonial Timing Model
 *
 * Generates contextual offering prompts based on the unified rhythm layer:
 * lunar phase, season, solar events, cross-quarter days, ecological cycles,
 * and optional Mayan calendar interpretation.
 *
 * The model is modular: global cycles ship built-in, regional/local/custom
 * cycles can be added via the CeremonialEvent interface.
 */
import {
  getLunarInfo,
  getSeason,
  getSolarEvents,
  getUpcomingLunarEvents,
  type LunarPhase,
  type Season,
  type CosmicEvent,
} from "@/hooks/use-cosmic-clock";
import { getTzolkinDay, formatTzolkinLabel, type TzolkinDay } from "@/utils/mayanTzolkin";

// ─── Core Types ───

export type CeremonyScope = "global" | "regional" | "local" | "custom";
export type CycleCategory =
  | "solar"
  | "lunar"
  | "cross_quarter"
  | "ecological"
  | "cultural"
  | "mayan"
  | "sky";

export interface CeremonialEvent {
  id: string;
  name: string;
  emoji: string;
  category: CycleCategory;
  scope: CeremonyScope;
  /** When the event is active (start inclusive, end inclusive) */
  dateRange: { start: Date; end: Date };
  description: string;
  /** Offering prompts associated with this event */
  prompts: OfferingPrompt[];
  /** Optional region/place tag */
  region?: string;
  /** Source attribution */
  source?: string;
}

export interface OfferingPrompt {
  text: string;
  suggestedType?: "photo" | "poem" | "story" | "song" | "voice" | "book";
  emoji?: string;
  /** Prompt intensity: subtle (whisper-level) | featured (highlighted) | ceremonial (primary) */
  intensity: "subtle" | "featured" | "ceremonial";
}

export interface SeasonalContext {
  season: Season;
  seasonLabel: string;
  seasonEmoji: string;
  lunarPhase: LunarPhase;
  lunarEmoji: string;
  lunarPhaseName: string;
  /** Active ceremonial events right now */
  activeEvents: CeremonialEvent[];
  /** Upcoming events within the next 7 days */
  upcomingEvents: CeremonialEvent[];
  /** Aggregated offering prompts from all active events, sorted by intensity */
  activePrompts: OfferingPrompt[];
  /** Optional Mayan day context */
  mayan?: TzolkinDay;
}

// ─── Seasonal Offering Prompts (built-in) ───

const SEASON_PROMPTS: Record<Season, OfferingPrompt[]> = {
  spring: [
    { text: "What is emerging?", emoji: "🌱", intensity: "subtle", suggestedType: "story" },
    { text: "Photograph the first blossoms you see", emoji: "🌸", intensity: "featured", suggestedType: "photo" },
    { text: "A poem for new beginnings", emoji: "✍️", intensity: "subtle", suggestedType: "poem" },
    { text: "What sounds does spring bring to this tree?", emoji: "🐦", intensity: "subtle", suggestedType: "voice" },
  ],
  summer: [
    { text: "What is this tree offering to the world right now?", emoji: "☀️", intensity: "subtle", suggestedType: "story" },
    { text: "Capture the canopy at its fullest", emoji: "🌿", intensity: "featured", suggestedType: "photo" },
    { text: "A song for the longest days", emoji: "🎵", intensity: "subtle", suggestedType: "song" },
    { text: "What fruit or gift does the land give?", emoji: "🍒", intensity: "subtle", suggestedType: "story" },
  ],
  autumn: [
    { text: "What is falling away?", emoji: "🍂", intensity: "subtle", suggestedType: "poem" },
    { text: "Gather the colours of letting go", emoji: "🎨", intensity: "featured", suggestedType: "photo" },
    { text: "A memory of harvest", emoji: "🌾", intensity: "subtle", suggestedType: "story" },
    { text: "What seeds are you carrying forward?", emoji: "🌰", intensity: "subtle", suggestedType: "story" },
  ],
  winter: [
    { text: "What is resting beneath the surface?", emoji: "❄️", intensity: "subtle", suggestedType: "poem" },
    { text: "The quiet architecture of bare branches", emoji: "🌳", intensity: "featured", suggestedType: "photo" },
    { text: "A story of endurance", emoji: "🕯️", intensity: "subtle", suggestedType: "story" },
    { text: "What warmth does this tree remember?", emoji: "🔥", intensity: "subtle", suggestedType: "story" },
  ],
};

// ─── Lunar Offering Prompts ───

const LUNAR_PROMPTS: Partial<Record<LunarPhase, OfferingPrompt[]>> = {
  new_moon: [
    { text: "Plant an intention in the dark soil", emoji: "🌑", intensity: "ceremonial", suggestedType: "story" },
    { text: "What seed would you whisper into the earth?", emoji: "🌱", intensity: "featured", suggestedType: "poem" },
  ],
  full_moon: [
    { text: "What has been illuminated since the last moon?", emoji: "🌕", intensity: "ceremonial", suggestedType: "story" },
    { text: "A reflection by moonlight", emoji: "✨", intensity: "featured", suggestedType: "poem" },
    { text: "Share a song for the full moon", emoji: "🎶", intensity: "subtle", suggestedType: "song" },
  ],
  first_quarter: [
    { text: "What is growing?", emoji: "🌓", intensity: "subtle", suggestedType: "story" },
  ],
  last_quarter: [
    { text: "What can you release?", emoji: "🌗", intensity: "subtle", suggestedType: "poem" },
  ],
};

// ─── Solar / Cross-Quarter Event Prompts ───

const SOLAR_EVENT_PROMPTS: Record<string, OfferingPrompt[]> = {
  "Vernal Equinox": [
    { text: "The light and dark are balanced. What do you choose to grow?", emoji: "🌿", intensity: "ceremonial", suggestedType: "story" },
    { text: "A threshold poem for the turning", emoji: "🚪", intensity: "featured", suggestedType: "poem" },
  ],
  "Summer Solstice": [
    { text: "What is at its peak? Celebrate abundance.", emoji: "☀️", intensity: "ceremonial", suggestedType: "photo" },
    { text: "A song for the longest day", emoji: "🎵", intensity: "featured", suggestedType: "song" },
  ],
  "Autumnal Equinox": [
    { text: "Equal light, equal dark again. What harvest have you gathered?", emoji: "🍂", intensity: "ceremonial", suggestedType: "story" },
    { text: "An offering of gratitude", emoji: "🙏", intensity: "featured", suggestedType: "poem" },
  ],
  "Winter Solstice": [
    { text: "The darkest day. What light do you carry within?", emoji: "🕯️", intensity: "ceremonial", suggestedType: "poem" },
    { text: "A story for the turning of the light", emoji: "✨", intensity: "featured", suggestedType: "story" },
  ],
  "Imbolc": [
    { text: "First stirrings beneath the soil. What awakens?", emoji: "🕯️", intensity: "featured", suggestedType: "story" },
  ],
  "Beltane": [
    { text: "Full bloom. What is flourishing in your life?", emoji: "🔥", intensity: "featured", suggestedType: "story" },
  ],
  "Lughnasadh": [
    { text: "First harvest. What are you reaping?", emoji: "🌾", intensity: "featured", suggestedType: "story" },
  ],
  "Samhain": [
    { text: "The veil is thin. What do you wish to honour?", emoji: "🎃", intensity: "featured", suggestedType: "poem" },
  ],
};

// ─── Ecological Cycle Templates (extensible) ───

export interface EcologicalCycle {
  name: string;
  emoji: string;
  months: number[]; // 1-12
  region?: string;
  prompts: OfferingPrompt[];
}

const GLOBAL_ECOLOGICAL_CYCLES: EcologicalCycle[] = [
  {
    name: "Blossom Season",
    emoji: "🌸",
    months: [3, 4, 5],
    prompts: [
      { text: "Photograph the blossom before it falls", emoji: "🌸", intensity: "featured", suggestedType: "photo" },
      { text: "What does the blossom teach about impermanence?", emoji: "🍃", intensity: "subtle", suggestedType: "poem" },
    ],
  },
  {
    name: "Seed Gathering",
    emoji: "🌰",
    months: [9, 10, 11],
    prompts: [
      { text: "Have you found seeds worth carrying?", emoji: "🌰", intensity: "subtle", suggestedType: "story" },
      { text: "Document the seeds of this Ancient Friend", emoji: "📷", intensity: "featured", suggestedType: "photo" },
    ],
  },
  {
    name: "Migration & Nesting",
    emoji: "🐦",
    months: [3, 4, 5, 9, 10],
    prompts: [
      { text: "Who else lives in this tree's canopy?", emoji: "🐦", intensity: "subtle", suggestedType: "voice" },
    ],
  },
  {
    name: "Fruiting Window",
    emoji: "🍎",
    months: [6, 7, 8, 9],
    prompts: [
      { text: "What fruit does this tree offer?", emoji: "🍎", intensity: "featured", suggestedType: "photo" },
    ],
  },
];

// ─── Main Engine ───

/**
 * Build the full seasonal context for the current moment.
 * Integrates all timing layers into a unified ceremonial context.
 */
export function getSeasonalContext(
  date: Date = new Date(),
  options: {
    hemisphere?: "north" | "south";
    includeMayan?: boolean;
    customCycles?: EcologicalCycle[];
    customEvents?: CeremonialEvent[];
  } = {}
): SeasonalContext {
  const { hemisphere = "north", includeMayan = false, customCycles = [], customEvents = [] } = options;

  const season = getSeason(date, hemisphere);
  const SEASON_META: Record<Season, { label: string; emoji: string }> = {
    spring: { label: "Spring", emoji: "🌱" },
    summer: { label: "Summer", emoji: "☀️" },
    autumn: { label: "Autumn", emoji: "🍂" },
    winter: { label: "Winter", emoji: "❄️" },
  };
  const lunar = getLunarInfo(date);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Gather all active ceremonial events
  const activeEvents: CeremonialEvent[] = [];
  const upcomingEvents: CeremonialEvent[] = [];
  const sevenDaysOut = new Date(date);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  // 1. Season as a ceremonial event
  activeEvents.push({
    id: `season-${season}`,
    name: `${SEASON_META[season].label} Season`,
    emoji: SEASON_META[season].emoji,
    category: "solar",
    scope: "global",
    dateRange: { start: date, end: date },
    description: `${SEASON_META[season].label} in the ${hemisphere}ern hemisphere`,
    prompts: SEASON_PROMPTS[season],
  });

  // 2. Lunar phase
  const lunarPrompts = LUNAR_PROMPTS[lunar.phase] || [];
  if (lunarPrompts.length > 0) {
    activeEvents.push({
      id: `lunar-${lunar.phase}`,
      name: lunar.phaseName,
      emoji: lunar.emoji,
      category: "lunar",
      scope: "global",
      dateRange: { start: date, end: date },
      description: `${lunar.phaseName} — ${Math.round(lunar.illumination * 100)}% illuminated`,
      prompts: lunarPrompts,
    });
  }

  // 3. Solar / cross-quarter events
  const solarEvents = getSolarEvents(year);
  for (const se of solarEvents) {
    const diff = Math.abs(se.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    const prompts = SOLAR_EVENT_PROMPTS[se.name] || [];
    const event: CeremonialEvent = {
      id: se.id,
      name: se.name,
      emoji: se.emoji,
      category: se.type === "solstice" || se.type === "equinox" ? "solar" : "cross_quarter",
      scope: "global",
      dateRange: {
        start: new Date(se.date.getTime() - 86400000),
        end: new Date(se.date.getTime() + 86400000),
      },
      description: se.description,
      prompts,
    };
    if (diff <= 1) {
      activeEvents.push(event);
    } else if (se.date > date && se.date <= sevenDaysOut) {
      upcomingEvents.push(event);
    }
  }

  // 4. Ecological cycles
  const allEcoCycles = [...GLOBAL_ECOLOGICAL_CYCLES, ...customCycles];
  for (const eco of allEcoCycles) {
    if (eco.months.includes(month)) {
      activeEvents.push({
        id: `eco-${eco.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: eco.name,
        emoji: eco.emoji,
        category: "ecological",
        scope: eco.region ? "regional" : "global",
        dateRange: { start: date, end: date },
        description: `${eco.name} is active`,
        prompts: eco.prompts,
        region: eco.region,
      });
    }
  }

  // 5. Custom events
  for (const ce of customEvents) {
    if (date >= ce.dateRange.start && date <= ce.dateRange.end) {
      activeEvents.push(ce);
    } else if (ce.dateRange.start > date && ce.dateRange.start <= sevenDaysOut) {
      upcomingEvents.push(ce);
    }
  }

  // 6. Mayan
  let mayan: TzolkinDay | undefined;
  if (includeMayan) {
    mayan = getTzolkinDay(date);
    activeEvents.push({
      id: `mayan-${mayan.dayOfCycle}`,
      name: formatTzolkinLabel(mayan),
      emoji: mayan.signGlyph,
      category: "mayan",
      scope: "global",
      dateRange: { start: date, end: date },
      description: mayan.meaning,
      prompts: [
        {
          text: `${mayan.signGlyph} ${mayan.meaning}. How does this resonate?`,
          emoji: mayan.signGlyph,
          intensity: "subtle",
          suggestedType: "story",
        },
      ],
    });
  }

  // Aggregate prompts: ceremonial first, then featured, then subtle
  const intensityOrder: Record<string, number> = { ceremonial: 0, featured: 1, subtle: 2 };
  const activePrompts = activeEvents
    .flatMap((e) => e.prompts)
    .sort((a, b) => (intensityOrder[a.intensity] ?? 2) - (intensityOrder[b.intensity] ?? 2));

  return {
    season,
    seasonLabel: SEASON_META[season].label,
    seasonEmoji: SEASON_META[season].emoji,
    lunarPhase: lunar.phase,
    lunarEmoji: lunar.emoji,
    lunarPhaseName: lunar.phaseName,
    activeEvents,
    upcomingEvents,
    activePrompts,
    mayan,
  };
}

/**
 * Get a single "featured" prompt for the current moment.
 * Good for compact surfaces like the offering dialog header.
 */
export function getFeaturedPrompt(
  date?: Date,
  hemisphere?: "north" | "south"
): OfferingPrompt | null {
  const ctx = getSeasonalContext(date, { hemisphere });
  return ctx.activePrompts.find((p) => p.intensity === "ceremonial" || p.intensity === "featured") || ctx.activePrompts[0] || null;
}

/**
 * Hook: useSeasonalContext — reactive wrapper.
 */
import { useState as useStateHook, useEffect as useEffectHook, useMemo as useMemoHook } from "react";

export function useSeasonalContext(options?: {
  hemisphere?: "north" | "south";
  includeMayan?: boolean;
  customCycles?: EcologicalCycle[];
}) {
  const [now, setNow] = useStateHook(new Date());

  useEffectHook(() => {
    // Update every 60s — ceremonies don't change by the second
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  return useMemoHook(
    () => getSeasonalContext(now, options),
    [now.toDateString(), now.getHours(), options?.hemisphere, options?.includeMayan]
  );
}
