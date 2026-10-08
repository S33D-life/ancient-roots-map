/**
 * Contextual return for the Crown journey: go back the way you came.
 *
 * Uses router location state only (no navigation store). A `from` value is
 * accepted only when it is a same-origin app path; anything else falls back
 * to the Crown.
 */
import { ROUTES } from "@/lib/routes";

export interface ReturnTarget { to: string; label: string; short: string }

const NAMED: Record<string, { label: string; short: string }> = {
  [ROUTES.GOLDEN_DREAM]: { label: "Return to the Crown", short: "Crown" },
  [ROUTES.COUNCIL]: { label: "Return to the Council", short: "Council" },
  [ROUTES.ROADMAP]: { label: "Return to the Living Roadmap", short: "Roadmap" },
  [ROUTES.AGENT_GARDEN]: { label: "Return to the Agent Garden", short: "Garden" },
};

const CROWN: ReturnTarget = { to: ROUTES.GOLDEN_DREAM, ...NAMED[ROUTES.GOLDEN_DREAM] };

export function isSameOriginPath(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    && !/^\/[a-z][a-z0-9+.-]*:/i.test(value);
}

export function returnTarget(state: unknown): ReturnTarget {
  const from = state && typeof state === "object" ? (state as { from?: unknown }).from : undefined;
  if (!isSameOriginPath(from)) return CROWN;
  const path = from.split(/[?#]/)[0];
  const named = NAMED[path];
  return named ? { to: from, ...named } : { to: from, label: "Return to where you were", short: "Back" };
}
