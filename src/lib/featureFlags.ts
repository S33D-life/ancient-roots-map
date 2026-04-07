/**
 * Feature flags — simple localStorage-based toggles.
 * Each feature can be enabled/disabled independently.
 */

const PREFIX = "s33d-feature-";

export type FeatureFlag =
  | "signal-field"
  | "memory-trails"
  | "species-resonance";

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  try {
    const val = localStorage.getItem(PREFIX + flag);
    // Default to enabled for all features
    return val !== "0";
  } catch {
    return true;
  }
}

export function setFeatureFlag(flag: FeatureFlag, enabled: boolean) {
  try {
    localStorage.setItem(PREFIX + flag, enabled ? "1" : "0");
  } catch {}
}

export function toggleFeatureFlag(flag: FeatureFlag): boolean {
  const next = !isFeatureEnabled(flag);
  setFeatureFlag(flag, next);
  return next;
}
