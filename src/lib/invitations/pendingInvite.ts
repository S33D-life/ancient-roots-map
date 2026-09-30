/**
 * Pending invitation code — one reader for every key an arrival path writes.
 *
 * Arrival paths store the code under different keys:
 *   /auth?invite=…                      → s33d_pending_invite_code (local + session)
 *   /tree/:id?invite=…, Telegram, bots  → s33d_invite_code (local)
 *   sign-up form                         → all three
 *
 * Consumption reads all of them and clears all of them together, only once the
 * outcome is final, so a code survives OAuth round-trips, email confirmation
 * and magic links until the Wanderer is actually signed in.
 */
export const PENDING_INVITE_KEY = "s33d_pending_invite_code";
export const LEGACY_INVITE_KEY = "s33d_invite_code";

type ReadableStorage = Pick<Storage, "getItem">;
type ClearableStorage = Pick<Storage, "removeItem">;

function safe(get: () => Storage): Storage | null {
  try { return get(); } catch { return null; }
}

function read(storage: ReadableStorage | null, key: string): string | null {
  try {
    const value = storage?.getItem(key)?.trim();
    return value ? value : null;
  } catch { return null; }
}

/** The most specific stored code: this tab's sign-up first, then any arrival. */
export function readPendingInvite(
  local: ReadableStorage | null = safe(() => localStorage),
  session: ReadableStorage | null = safe(() => sessionStorage),
): string | null {
  return read(session, PENDING_INVITE_KEY)
    ?? read(local, PENDING_INVITE_KEY)
    ?? read(local, LEGACY_INVITE_KEY);
}

export function clearPendingInvite(
  local: ClearableStorage | null = safe(() => localStorage),
  session: ClearableStorage | null = safe(() => sessionStorage),
): void {
  for (const [storage, key] of [
    [local, PENDING_INVITE_KEY], [local, LEGACY_INVITE_KEY], [session, PENDING_INVITE_KEY],
  ] as const) {
    try { storage?.removeItem(key); } catch { /* storage unavailable */ }
  }
}
