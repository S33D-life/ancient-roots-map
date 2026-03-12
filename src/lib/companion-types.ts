/**
 * Companion Controller — shared types for the desktop ↔ mobile real-time session.
 */

export type CompanionRoom =
  | "map"
  | "staff"
  | "gallery"
  | "ledger"
  | "tree"
  | "card"
  | "unknown";

export type CompanionCommand =
  | { type: "zoom_in" }
  | { type: "zoom_out" }
  | { type: "zoom_reset" }
  | { type: "pan"; dx: number; dy: number }
  | { type: "focus_tree"; treeId: string }
  | { type: "focus_staff"; staffCode: string }
  | { type: "next" }
  | { type: "previous" }
  | { type: "toggle_fullscreen" }
  | { type: "enter_fullscreen" }
  | { type: "exit_fullscreen" }
  | { type: "open_panel" }
  | { type: "close_panel" }
  | { type: "highlight_node"; nodeId: string }
  | { type: "export_view" }
  | { type: "select_chart"; chartId: string }
  | { type: "pointer_move"; x: number; y: number }
  | { type: "pointer_hide" }
  | { type: "navigate_room"; room: CompanionRoom }
  | { type: "send_to_desktop"; entityType: string; entityId: string; label?: string };

/** Whitelist of valid command types for input validation */
export const VALID_COMMAND_TYPES = new Set<string>([
  "zoom_in", "zoom_out", "zoom_reset", "pan",
  "focus_tree", "focus_staff", "next", "previous",
  "toggle_fullscreen", "enter_fullscreen", "exit_fullscreen",
  "open_panel", "close_panel", "highlight_node",
  "export_view", "select_chart",
  "pointer_move", "pointer_hide",
  "navigate_room", "send_to_desktop",
]);

/** Sent from desktop → mobile to sync room state */
export interface CompanionRoomState {
  room: CompanionRoom;
  isFullscreen: boolean;
  zoomLevel?: number;
  /** Current item id if applicable */
  activeItemId?: string;
  activeItemLabel?: string;
}

/** Session metadata */
export interface CompanionSession {
  code: string;
  channelName: string;
  role: "display" | "controller";
  paired: boolean;
  connectedAt?: number;
}

/** Generate a 6-char alphanumeric code (no ambiguous chars) */
export function generatePairingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  for (let i = 0; i < 6; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

/** Derive channel name from code */
export function channelFromCode(code: string): string {
  return `companion:${code.toUpperCase()}`;
}

/** Session expiry in ms (15 minutes) */
export const SESSION_TTL_MS = 15 * 60 * 1000;
