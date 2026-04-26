/**
 * Tree accessibility frame system
 * — a visual layer indicating whether a tree is publicly reachable.
 *
 * The frame colour lives on the BORDER of cards & the detail hero.
 * It is intentionally distinct from the visit-state DOT (red/orange/green)
 * which lives inside the card.
 */

export type AccessibilityTier = "public" | "visible" | "garden" | "private";

/** The effective tier used for rendering — adds "granted" override for private trees. */
export type EffectiveAccessibilityTier = AccessibilityTier | "granted";

export interface AccessibilityVisual {
  /** HSL string for the frame border colour */
  border: string;
  /** Soft glow colour for the frame */
  glow: string;
  /** Optional text colour for badges / strip */
  text: string;
  /** Short, warm label */
  label: string;
  /** Detail strip headline */
  strip: string;
  /** Emoji marker */
  emoji: string;
}

export const ACCESSIBILITY_VISUALS: Record<EffectiveAccessibilityTier, AccessibilityVisual> = {
  public: {
    border: "hsl(140, 55%, 45%)",
    glow:   "hsla(140, 55%, 45%, 0.18)",
    text:   "hsl(140, 50%, 55%)",
    label:  "Open path",
    strip:  "Open path — freely accessible",
    emoji:  "🟢",
  },
  visible: {
    border: "hsl(28, 80%, 55%)",
    glow:   "hsla(28, 80%, 55%, 0.20)",
    text:   "hsl(28, 75%, 60%)",
    label:  "Visible from path",
    strip:  "Visible from public way — please don't enter the land",
    emoji:  "🟠",
  },
  garden: {
    border: "hsl(280, 55%, 60%)",
    glow:   "hsla(280, 55%, 60%, 0.20)",
    text:   "hsl(280, 50%, 68%)",
    label:  "Garden access",
    strip:  "Garden access",
    emoji:  "🟣",
  },
  private: {
    border: "hsl(0, 65%, 50%)",
    glow:   "hsla(0, 65%, 50%, 0.18)",
    text:   "hsl(0, 60%, 60%)",
    label:  "Private land",
    strip:  "Private land — permission needed to visit",
    emoji:  "🔴",
  },
  granted: {
    border: "hsl(45, 90%, 55%)",
    glow:   "hsla(45, 90%, 55%, 0.35)",
    text:   "hsl(45, 85%, 62%)",
    label:  "You have access",
    strip:  "Private land — you have access ✨",
    emoji:  "🟡",
  },
};

/**
 * Compute the effective tier for the current viewer.
 * Returns "granted" only when the tree is private AND the viewer has a grant.
 */
export function effectiveTier(
  tier: AccessibilityTier | null | undefined,
  hasGrant: boolean,
): EffectiveAccessibilityTier {
  const base: AccessibilityTier = tier ?? "public";
  if (base === "private" && hasGrant) return "granted";
  return base;
}

/** Whether check-in / canopy presence is allowed for this effective tier. */
export function canCheckIn(tier: EffectiveAccessibilityTier): boolean {
  return tier !== "private";
}

/** Tier picker for the add-tree flow. */
export const ACCESSIBILITY_TIER_OPTIONS: Array<{
  value: AccessibilityTier;
  emoji: string;
  label: string;
  hint: string;
}> = [
  { value: "public",  emoji: "🟢", label: "Open path",        hint: "Anyone can walk here" },
  { value: "visible", emoji: "🟠", label: "Visible from path", hint: "Can be seen but not entered" },
  { value: "garden",  emoji: "🟣", label: "Garden or paid access", hint: "Open with conditions" },
  { value: "private", emoji: "🔴", label: "Private",          hint: "Permission required to visit" },
];
