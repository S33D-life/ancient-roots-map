/**
 * Council Cycle data — single source of truth for bi-weekly gatherings.
 *
 * To add a new council: append an entry to COUNCIL_CYCLES.
 * Future: move to Supabase / Notion sync. Keep fields flat & intuitive.
 */

export interface CouncilSession {
  /** Unique slug, e.g. "2026-04-new" */
  id: string;
  moonPhase: "new" | "full";
  /** ISO date string for the lunar marker */
  markerDate: string;
  /** ISO date string for the Monday gathering */
  gatheringDate: string;
  title: string;
  /** e.g. "7:30 – 8:30 PM (UK)" */
  time: string;
  curator: string;
  agenda: {
    invocation: string;
    thisMoon: string;
    timeTreeQuestion: string;
    focusAreas: string[];
  };
  highlights?: {
    plant?: string;
    tree?: string;
    project?: string;
  };
}

// ─── Cycle entries ────────────────────────────────────────
export const COUNCIL_CYCLES: CouncilSession[] = [
  {
    id: "2026-04-new",
    moonPhase: "new",
    markerDate: "2026-04-17",
    gatheringDate: "2026-04-20",
    title: "New Moon Council",
    time: "7:30 – 8:30 PM (UK)",
    curator: "Edward James Thurlow",
    agenda: {
      invocation:
        "We gather at the turn of the Moon, beneath the canopy that connects all things. Each voice here is a leaf on the same tree. Let us listen as the forest listens — with patience, with presence.",
      thisMoon:
        "This Moon we tend the roots of our shared practice. As S33D grows from prototype into living rhythm, we ask: what does stewardship look like when the tools are digital but the intention is ancient?",
      timeTreeQuestion:
        "What does your local ecology need most right now — and how could S33D help you respond to it?",
      focusAreas: [
        "Council in S33D — refining the gathering flow",
        "Curation roles — who tends what",
        "S33D Hearts distribution — how contribution becomes harvest",
      ],
    },
    highlights: {
      plant: "Wild Garlic (Allium ursinum)",
      project: "Council Cycle v1 — establishing the rhythm",
    },
  },
  {
    id: "2026-05-full",
    moonPhase: "full",
    markerDate: "2026-05-02",
    gatheringDate: "2026-05-04",
    title: "Full Moon Council",
    time: "7:30 – 8:30 PM (UK)",
    curator: "Edward James Thurlow",
    agenda: {
      invocation:
        "The Moon is full and the canopy bright. Tonight we gather not to plant, but to see what has grown — to let the light reveal what the dark has been tending.",
      thisMoon:
        "Reflection & Illumination. We look at what emerged from the first cycle — the tools that took root, the questions that still hum, the bonds that are forming between people and place.",
      timeTreeQuestion:
        "If you could sit with any two beings — living or from any time — beneath an ancient tree, who would you choose and what would you ask them?",
      focusAreas: [
        "Reviewing the first New Moon cycle — what took root",
        "Heartwood integration — Dream Tree + Council bridge",
        "Opening curation to new voices",
        "Harvest Exchange — first community proposals",
      ],
    },
    highlights: {
      plant: "Elder (Sambucus nigra)",
      tree: "The Parliament Oak, Sherwood Forest",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────

/**
 * Return the nearest upcoming council (gathering date >= today).
 * Falls back to the last entry if all dates are past.
 */
export function getCurrentCouncil(): CouncilSession {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = COUNCIL_CYCLES.find((c) => new Date(c.gatheringDate) >= today);
  return upcoming ?? COUNCIL_CYCLES[COUNCIL_CYCLES.length - 1];
}

/**
 * Return the council after the current one, or null if none exists.
 */
export function getNextCouncil(): CouncilSession | null {
  const current = getCurrentCouncil();
  const idx = COUNCIL_CYCLES.indexOf(current);
  return COUNCIL_CYCLES[idx + 1] ?? null;
}

/** Human-readable date, e.g. "Monday 20th April 2026" */
export function formatGatheringDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  const year = d.getFullYear();

  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  return `${weekday} ${day}${suffix} ${month} ${year}`;
}

/** Short date label, e.g. "April 17" */
export function formatMarkerDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { month: "long", day: "numeric" });
}

/** Moon emoji for a phase */
export function moonEmoji(phase: "new" | "full"): string {
  return phase === "new" ? "🌑" : "🌕";
}

/** Moon label for a phase */
export function moonLabel(phase: "new" | "full"): string {
  return phase === "new" ? "New Moon" : "Full Moon";
}
