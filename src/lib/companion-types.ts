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

/** Controller interaction modes */
export type CompanionMode = "trackpad" | "pointer" | "scroll";

export type CompanionCommand =
  | { type: "zoom_in" }
  | { type: "zoom_out" }
  | { type: "zoom_reset" }
  | { type: "pan"; dx: number; dy: number }
  | { type: "map_pan"; dx: number; dy: number }
  | { type: "map_zoom"; delta: number }
  | { type: "locate_me" }
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
  | { type: "pointer_delta"; dx: number; dy: number }
  | { type: "pointer_click"; x: number; y: number }
  | { type: "pointer_down"; x: number; y: number }
  | { type: "pointer_up"; x: number; y: number }
  | { type: "scroll"; dx: number; dy: number }
  | { type: "drag_start" }
  | { type: "drag_move"; dx: number; dy: number }
  | { type: "drag_end" }
  | { type: "navigate_room"; room: CompanionRoom }
  | { type: "send_to_desktop"; entityType: string; entityId: string; label?: string };

/** Whitelist of valid command types for input validation */
export const VALID_COMMAND_TYPES = new Set<string>([
  "zoom_in", "zoom_out", "zoom_reset", "pan", "map_pan", "map_zoom", "locate_me",
  "focus_tree", "focus_staff", "next", "previous",
  "toggle_fullscreen", "enter_fullscreen", "exit_fullscreen",
  "open_panel", "close_panel", "highlight_node",
  "export_view", "select_chart",
  "pointer_move", "pointer_hide",
  "pointer_delta", "pointer_click", "scroll",
  "drag_start", "drag_move", "drag_end",
  "navigate_room", "send_to_desktop",
]);

/** Sent from desktop → mobile to sync room state */
export interface CompanionRoomState {
  room: CompanionRoom;
  isFullscreen: boolean;
  zoomLevel?: number;
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

/** Controller sensitivity settings */
export interface CompanionSettings {
  pointerSensitivity: number;
  scrollSensitivity: number;
  naturalScroll: boolean;
}

export const DEFAULT_SETTINGS: CompanionSettings = {
  pointerSensitivity: 1.8,
  scrollSensitivity: 1.2,
  naturalScroll: true,
};

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
