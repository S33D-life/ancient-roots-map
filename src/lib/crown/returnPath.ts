/**
 * Contextual return for the Crown journey: go back the way you came.
 *
 * Uses router location state only (no navigation store). A `from` value is
 * accepted only when it is a plain same-origin app path. It is checked raw
 * (control characters, backslashes, protocol-relative or scheme-like starts,
 * length), then resolved against a fixed placeholder origin so dot segments
 * and encodings are normalised; anything that leaves that origin is refused.
 * The normalised path, never the raw value, is what the link uses.
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
const ORIGIN = "https://return.s33d.invalid";
const MAX_LENGTH = 2048;
/** C0 controls, DEL, C1 controls, and the Unicode line and paragraph separators. */
const hasControl = (text: string) => {
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c <= 0x1f || (c >= 0x7f && c <= 0x9f) || c === 0x2028 || c === 0x2029) return true;
  }
  return false;
};

/** Returns the normalised same-origin path (path + query + hash), or null. */
export function normaliseReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_LENGTH) return null;
  if (hasControl(value) || value.includes("\\")) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  let url: URL;
  try { url = new URL(value, ORIGIN); } catch { return null; }
  if (url.origin !== ORIGIN || url.username || url.password) return null;
  const path = `${url.pathname}${url.search}${url.hash}`;
  // The resolved path must still be a single-slash app path after normalisation.
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(url.pathname); } catch { return null; }
  if (hasControl(decoded) || decoded.includes("\\") || decoded.startsWith("//")) return null;
  return path;
}

export function returnTarget(state: unknown): ReturnTarget {
  const from = state && typeof state === "object" ? (state as { from?: unknown }).from : undefined;
  const to = normaliseReturnPath(from);
  if (!to) return CROWN;
  const pathname = new URL(to, ORIGIN).pathname;
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const named = NAMED[key];
  return named ? { to, ...named } : { to, label: "Return to where you were", short: "Back" };
}
