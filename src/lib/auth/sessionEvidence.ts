import { returnContext } from './returnContext';
import { supabase } from '@/integrations/supabase/client';
import { appendEvidence, updateEvidenceState, beginCallbackEvidence, safeAuthError } from './evidenceJournal';
export { readAuthEvidence, safeAuthError } from './evidenceJournal';
export type { EvidenceRow } from './evidenceJournal';

type SessionShape = { user?: unknown } | null;
let initialized = false;
let session: SessionShape = null;
let recoveryConfirmed = false;
let initializationError: unknown = null;
let startPromise: Promise<void> | undefined;
export function recordAuthEvidence(authEvent: string, error?: unknown) {
  updateEvidenceState(initialized, !!session, !!session?.user);
  appendEvidence(authEvent, error);
}
export function startSessionEvidence() {
  if (startPromise) return startPromise;
  beginCallbackEvidence();
  supabase.auth.onAuthStateChange((event, next) => {
    session = next;
    if (event === 'PASSWORD_RECOVERY' && next?.user) recoveryConfirmed = true;
    if (!next || event === 'SIGNED_OUT') recoveryConfirmed = false;
    recordAuthEvidence(event);
  });
  // initialize() observes the existing constructor-started SDK promise; it does
  // not start a second exchange. Boundary observers record the existing I/O.
  recordAuthEvidence('SDK_INITIALIZATION_OBSERVED');
  if (returnContext.credentials) recordAuthEvidence('SDK_CALLBACK_PROCESSING_OBSERVED');
  startPromise = (async () => {
    try {
      const result = await supabase.auth.initialize();
      initialized = true;
      initializationError = result.error;
      recordAuthEvidence('SDK_INITIALIZATION_SETTLED', result.error);
      const restored = await supabase.auth.getSession();
      session = restored.data.session;
      initializationError ||= restored.error;
      // Covers lazy recovery-page mounting before/after PASSWORD_RECOVERY.
      if (!initializationError && !returnContext.error && returnContext.recovery && returnContext.credentials && session?.user) recoveryConfirmed = true;
      recordAuthEvidence('SESSION_READ', restored.error);
    } catch (error) {
      initializationError = error;
      recordAuthEvidence('SDK_INITIALIZATION_FAILED', error);
    }
  })();
  return startPromise;
}
export async function checkRecoveryReadiness(): Promise<string | null> {
  await startSessionEvidence();
  if (initializationError) return safeAuthError(initializationError);
  if (returnContext.error) return 'AuthImplicitGrantRedirectError';
  if (returnContext.codeOnly) return 'AuthFlowMismatch';
  const result = await supabase.auth.getSession();
  session = result.data.session;
  recordAuthEvidence('RECOVERY_SESSION_CHECK', result.error);
  if (result.error) return safeAuthError(result.error);
  if (!recoveryConfirmed || !session?.user) return 'AuthSessionMissingError';
  return null;
}
export function finishRecovery() { recoveryConfirmed = false; }
export async function recordRouteSession() {
  recordAuthEvidence('ROUTE_NAVIGATION');
  await startSessionEvidence();
  try {
    const result = await supabase.auth.getSession();
    session = result.data.session;
    recordAuthEvidence('ROUTE_SESSION_READ', result.error);
  } catch (error) { recordAuthEvidence('ROUTE_SESSION_READ_FAILED', error); }
}
