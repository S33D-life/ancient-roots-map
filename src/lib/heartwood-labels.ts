/**
 * heartwood-labels.ts — Single source of truth for Heartwood / visibility language.
 * Presentation only. Does NOT change enum values or DB schema.
 */

export const VISIBILITY_LABELS: Record<string, string> = {
  private: "Held in Heartwood",
  circle: "Shared with your grove",
  tribe: "Shared with this tree's circle",
  public: "Shared with the forest",
};

export const VISIBILITY_SHORT: Record<string, string> = {
  private: "Heartwood",
  circle: "Grove",
  tribe: "Tree Circle",
  public: "Forest",
};

export const HEARTWOOD_LINE =
  "Heartwood memories are held in trust — for you, your family, or those you choose.";

export const HEARTWOOD_EMPTY = {
  primary: "Your Heartwood is where memories are held through time.",
  secondary: "Entrust your first offering to begin your inner grove.",
  cta: "Create Heartwood Memory",
};

export const STAFF_HEARTWOOD_MSG =
  "As a Staff holder, you steward Heartwood freely.";

export const NON_STAFF_HEARTWOOD_MSG =
  "Heartwood is stewarded through the grove — hearts help keep memories alive.";

export const STAFF_ROOM_HEARTWOOD =
  "The Heartwood grows through what is entrusted.";
