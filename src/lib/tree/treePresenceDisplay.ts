/**
 * treePresenceDisplay — pure display contract for tree presence signals.
 *
 * This intentionally does not fetch, write, subscribe, or infer encounter state.
 * It only normalizes the shared "here now / recently met / none" presentation
 * language so React surfaces and map popup HTML can converge without changing
 * their behaviour.
 */

export type TreePresenceDisplayState = "here_now" | "recently_met" | "none";

export interface TreePresenceDisplayInput {
  state?: TreePresenceDisplayState | null;
  count?: number | null;
}

export interface TreePresenceDisplay {
  state: TreePresenceDisplayState;
  label: string | null;
  title: string | null;
  tone: "live" | "recent" | "none";
  dot: {
    colorHsl: string;
    glow: boolean;
    animate: boolean;
  };
}

const LIVE_DOT = {
  colorHsl: "hsl(145, 55%, 48%)",
  glow: true,
  animate: true,
} as const;

const RECENT_DOT = {
  colorHsl: "hsl(210, 35%, 58%)",
  glow: false,
  animate: false,
} as const;

const NONE_DOT = {
  colorHsl: "transparent",
  glow: false,
  animate: false,
} as const;

function normalizeState(state: TreePresenceDisplayInput["state"]): TreePresenceDisplayState {
  return state === "here_now" || state === "recently_met" ? state : "none";
}

function normalizeCount(count: TreePresenceDisplayInput["count"]): number {
  return Number.isFinite(count) && Number(count) > 0 ? Math.floor(Number(count)) : 1;
}

export function treePresenceDisplay(input: TreePresenceDisplayInput = {}): TreePresenceDisplay {
  const state = normalizeState(input.state);
  const count = normalizeCount(input.count);

  if (state === "here_now") {
    const label = count > 1 ? `${count} wanderers here now` : "Someone is here now";
    return {
      state,
      label,
      title: label,
      tone: "live",
      dot: { ...LIVE_DOT },
    };
  }

  if (state === "recently_met") {
    const label = count > 1 ? `${count} wanderers here recently` : "Recently met";
    return {
      state,
      label,
      title: label,
      tone: "recent",
      dot: { ...RECENT_DOT },
    };
  }

  return {
    state: "none",
    label: null,
    title: null,
    tone: "none",
    dot: { ...NONE_DOT },
  };
}
