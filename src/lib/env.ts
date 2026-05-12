/**
 * Environment / debug-surface gating.
 *
 * Used to hide diagnostics, raw errors, override toggles and dev-only UI
 * from ordinary users on s33d.life while keeping them visible on
 * localhost, preview deploys, and for keepers.
 */

export function isDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".lovableproject.com") ||
    host.includes("id-preview--") ||
    host.endsWith(".lovable.app") === false && host.endsWith(".lovable.dev") ||
    !!import.meta.env?.DEV
  );
}

/**
 * True for users who should see diagnostic surfaces:
 * - any keeper
 * - any visitor on a non-production host (localhost, preview)
 */
export function isDebugUser(isKeeper?: boolean | null): boolean {
  return Boolean(isKeeper) || isDevHost();
}
