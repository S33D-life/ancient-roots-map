import { normaliseReturnPath } from "@/lib/crown/returnPath";

const places: Record<string, string> = {
  "/": "Tree", "/s33d": "Tree", "/map": "Roots", "/library": "Hall",
  "/council-of-life": "Canopy", "/golden-dream": "Crown",
};

/** Router-state origin only; never accept arbitrary destinations or external URLs. */
export function journeyOrigin(value: unknown) {
  const to = normaliseReturnPath(value);
  if (!to) return undefined;
  const path = to.split(/[?#]/)[0];
  const short = places[path] ?? (/^\/tree\/[a-zA-Z0-9-]+$/.test(path) ? "Ancient Friend" : undefined);
  return short ? { to, short, label: `Back to the ${short}` } : undefined;
}

export function hallReturnState(state: unknown) {
  const origin = journeyOrigin((state as { hallOrigin?: unknown } | null)?.hallOrigin);
  return origin ? { from: origin.to } : undefined;
}
