/**
 * Heart Signal — type definitions for the living notification system.
 * Every signal originates from a real ledger event.
 */

export type HeartSignalType =
  | "heart"       // generic heart flow
  | "tree"        // tree mapping, seeds, encounters
  | "offering"    // offerings made/received
  | "encounter"   // check-ins, canopy proofs
  | "council"     // governance, fountain events
  | "ledger";     // vault, patron claims, system

export interface HeartSignal {
  id: string;
  user_id: string;
  signal_type: HeartSignalType;
  title: string;
  body: string | null;
  related_tree_id: string | null;
  related_offering_id: string | null;
  related_transaction_id: string | null;
  deep_link: string | null;
  is_read: boolean;
  dismissed: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type HeartSignalFilter = "all" | HeartSignalType;

export const SIGNAL_FILTER_OPTIONS: { value: HeartSignalFilter; label: string; emoji: string }[] = [
  { value: "all",       label: "All Signals",  emoji: "✨" },
  { value: "tree",      label: "Trees",        emoji: "🌳" },
  { value: "offering",  label: "Offerings",    emoji: "🎁" },
  { value: "encounter", label: "Encounters",   emoji: "👣" },
  { value: "council",   label: "Council",      emoji: "🌿" },
  { value: "ledger",    label: "Ledger",       emoji: "💎" },
  { value: "heart",     label: "Hearts",       emoji: "❤️" },
];

export const SIGNAL_TYPE_EMOJI: Record<HeartSignalType, string> = {
  heart: "❤️",
  tree: "🌳",
  offering: "🎁",
  encounter: "👣",
  council: "🌿",
  ledger: "💎",
};

export const SIGNAL_TYPE_HUE: Record<HeartSignalType, string> = {
  heart:     "0 80% 60%",
  tree:      "120 45% 50%",
  offering:  "45 90% 60%",
  encounter: "200 60% 55%",
  council:   "160 50% 50%",
  ledger:    "270 45% 60%",
};
