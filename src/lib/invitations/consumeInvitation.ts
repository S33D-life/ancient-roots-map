/**
 * Invitation consumption — the single client path into public.consume_invitation.
 *
 * Runs after ANY successful authentication (email/password, Google via
 * /auth/callback, email confirmation, magic link, installed-app handoff), not
 * only while the sign-in page happens to be mounted. The RPC is idempotent and
 * writes the canonical referrals row plus its profile mirror in one transaction.
 *
 * There is deliberately no fallback: record_referral_secure wrote a referral
 * without lineage or allowance and is retired. A refusal is reported, never
 * patched over with a second, weaker write.
 */
export type ConsumeOutcome =
  | { kind: "consumed"; alreadyConsumed: boolean }
  /** Final answer: the stored code is cleared. */
  | { kind: "declined"; reason: string }
  /** Transient: the code is kept and tried again on the next arrival. */
  | { kind: "retry"; reason: string }
  /** Not attempted: TEMPORARY R1 guard — see INVITEE_ACCOUNT_MAX_AGE_MS. */
  | { kind: "skipped"; reason: "established_account" };

type RpcResult = { data: unknown; error: { message?: string } | null };

export interface ConsumeDeps {
  rpc: (fn: "consume_invitation", args: { p_invite_code: string; p_new_user_id: string }) => PromiseLike<RpcResult>;
  clear: () => void;
  track?: (event: "invite_consumed" | "invite_consume_failed", code: string, userId: string, metadata?: Record<string, unknown>) => void;
  now?: () => number;
}

/**
 * TEMPORARY R1 SAFETY GUARD — not invitation semantics.
 *
 * identity ≠ invitation: an existing Wanderer may later be genuinely invited.
 * Until R2 defines how an established identity accepts an invitation (and
 * separates invitation codes from share codes at the source), R1 only records
 * invitations for accounts created within the last week — enough for every
 * sign-up, confirmation or magic-link arrival (links expire within a day).
 * Client-side only; the database function carries no account-age rule.
 * Remove in R2.
 */
export const INVITEE_ACCOUNT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Server refusals that mean "not yet", not "never". */
const TRANSIENT = new Set(["unauthenticated", "not_your_account"]);

export function isNewAccount(createdAt: string | null | undefined, now: number): boolean {
  const created = createdAt ? Date.parse(createdAt) : NaN;
  return Number.isFinite(created) && now - created <= INVITEE_ACCOUNT_MAX_AGE_MS;
}

export async function consumeInvitation(
  user: { id: string; created_at?: string | null },
  code: string,
  deps: ConsumeDeps,
): Promise<ConsumeOutcome> {
  const now = deps.now?.() ?? Date.now();
  if (!isNewAccount(user.created_at, now)) {
    // Leave the code in place: it may belong to someone else on this device.
    return { kind: "skipped", reason: "established_account" };
  }

  let result: RpcResult;
  try {
    result = await deps.rpc("consume_invitation", { p_invite_code: code, p_new_user_id: user.id });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "network";
    deps.track?.("invite_consume_failed", code, user.id, { error: reason, transient: true });
    return { kind: "retry", reason };
  }

  if (result.error) {
    const reason = result.error.message ?? "rpc_error";
    deps.track?.("invite_consume_failed", code, user.id, { error: reason, transient: true });
    return { kind: "retry", reason };
  }

  const data = (result.data ?? {}) as { success?: boolean; already_consumed?: boolean; error?: string | null };
  if (data.success) {
    deps.clear();
    deps.track?.("invite_consumed", code, user.id, data.already_consumed ? { already_consumed: true } : undefined);
    return { kind: "consumed", alreadyConsumed: !!data.already_consumed };
  }

  const reason = data.error ?? "unknown";
  if (TRANSIENT.has(reason)) {
    deps.track?.("invite_consume_failed", code, user.id, { error: reason, transient: true });
    return { kind: "retry", reason };
  }
  deps.clear();
  deps.track?.("invite_consume_failed", code, user.id, { error: reason });
  return { kind: "declined", reason };
}

/** Gentle words for refusals a Wanderer can act on; others stay quiet. */
export function declineMessage(reason: string): string | null {
  switch (reason) {
    case "invalid_or_used_invite":
      return "This invitation has already been used or has faded. Ask for a fresh one if you'd like your lineage recorded.";
    case "inviter_no_invites_remaining":
      return "Your inviter has no invitations left just now, so this one could not be recorded.";
    case "malformed_invite":
      return "That invitation code could not be read.";
    default:
      // already_attributed, account_predates_invitation, self_invite: nothing to fix.
      return null;
  }
}
