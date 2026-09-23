/**
 * Ordered, once-per-user queue for post-sign-in follow-up work.
 *
 * Follow-up work (invite consumption, gift claim, pending tree + photo, bot
 * handoff, post-auth navigation) must run OUTSIDE onAuthStateChange, because
 * awaited Supabase calls inside that callback hold the SDK's internal lock and
 * can stall session recovery on Safari / installed iOS.
 *
 * Runs are keyed by user id, never by access token: tokens rotate on
 * TOKEN_REFRESHED, and a rotated token must not re-run any of that work.
 */
export type PostSignInRun = (event: string, session: { user?: { id?: string } | null }) => Promise<void>;

export function createPostSignInQueue(run: PostSignInRun, onError?: (e: unknown) => void) {
  let tail: Promise<void> = Promise.resolve();
  const handled = new Set<string>();

  return {
    /** Returns true when the work was queued, false when skipped. */
    enqueue(event: string, session: { user?: { id?: string } | null } | null): boolean {
      const userId = session?.user?.id;
      if (!session || !userId) return false;
      if (handled.has(userId)) return false;
      handled.add(userId);

      tail = tail.then(() => run(event, session)).catch((e) => { onError?.(e); });
      return true;
    },
    /** Called on sign-out: a later sign-in is legitimately new work. */
    reset() {
      handled.clear();
    },
    /** Resolves once all queued work has settled (tests / ordering checks). */
    settled(): Promise<void> {
      return tail;
    },
  };
}
