/**
 * Pending invitation code — only codes that came through the invitation
 * doorway may enter the consumption path.
 *
 * identity ≠ invitation ≠ share. Share traffic carries the same invite_links
 * codes (TreeShareCard reuses the sharer's newest open code; whispers and
 * Telegram carry one too), so the code alone cannot say "this was an
 * invitation". The doorway can:
 *
 *   /auth?invite=…  (Hearth /referrals and the Pod "Fellow Wanderers" card)
 *   a code the person confirms on the sign-up form
 *       → s33d_pending_invite_code (local + session)   ← consumed
 *
 *   /tree/:id?invite=…, whisper shares, Telegram / bot handoffs
 *       → s33d_invite_code (local)                      ← NOT consumed in R1
 *
 * Separating invitation codes from share codes at the source is R2
 * (docs/invitations/R2_share_vs_invitation.md).
 */
export const PENDING_INVITE_KEY = "s33d_pending_invite_code";
/** Written by share / Telegram arrivals. Never read for consumption. */
export const LEGACY_INVITE_KEY = "s33d_invite_code";

type ReadableStorage = Pick<Storage, "getItem">;
type ClearableStorage = Pick<Storage, "getItem" | "removeItem">;

function safe(get: () => Storage): Storage | null {
  try { return get(); } catch { return null; }
}

function read(storage: ReadableStorage | null, key: string): string | null {
  try {
    const value = storage?.getItem(key)?.trim();
    return value ? value : null;
  } catch { return null; }
}

/** The invitation-doorway code: this tab's first, then this browser's. */
export function readPendingInvite(
  local: ReadableStorage | null = safe(() => localStorage),
  session: ReadableStorage | null = safe(() => sessionStorage),
): string | null {
  return read(session, PENDING_INVITE_KEY) ?? read(local, PENDING_INVITE_KEY);
}

/**
 * Clear the doorway code once its outcome is final. The share key is cleared
 * only when it holds the same code (the sign-up form writes both).
 */
export function clearPendingInvite(
  code: string,
  local: ClearableStorage | null = safe(() => localStorage),
  session: ClearableStorage | null = safe(() => sessionStorage),
): void {
  const same = (value: string | null) => !!value && value.trim().toLowerCase() === code.trim().toLowerCase();
  try { local?.removeItem(PENDING_INVITE_KEY); } catch { /* storage unavailable */ }
  try { session?.removeItem(PENDING_INVITE_KEY); } catch { /* storage unavailable */ }
  try { if (same(read(local, LEGACY_INVITE_KEY))) local?.removeItem(LEGACY_INVITE_KEY); } catch { /* storage unavailable */ }
}
