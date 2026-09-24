import { callbackShapeEvents } from './callbackShape';
import { returnContext } from './returnContext';
import { supabase } from '@/integrations/supabase/client';

type SessionShape = { user?: unknown } | null;
export type EvidenceRow = { timestamp: string; pathname: string; authEvent: string; sdkInitialized: boolean; sessionPresent: boolean; userPresent: boolean; errorCategory: string | null };
const allowedErrors = new Set(['AuthSessionMissingError', 'AuthApiError', 'AuthRetryableFetchError', 'AuthImplicitGrantRedirectError', 'AuthPKCEGrantCodeExchangeError', 'AuthInvalidTokenResponseError', 'AuthInvalidCredentialsError', 'AuthWeakPasswordError', 'AuthUnknownError']);
export function safeAuthError(error: unknown): string {
  const name = (error as { name?: unknown } | null)?.name;
  return typeof name === 'string' && allowedErrors.has(name) ? name : 'AuthError';
}
const key = 's33d-auth-evidence-v1';
let initialized = false;
let session: SessionShape = null;
let recoveryConfirmed = false;
let initializationError: unknown = null;
let startPromise: Promise<void> | undefined;
const events = new Set([...callbackShapeEvents, 'CALLBACK_SESSION_MISSING','CALLBACK_CREDENTIALS_PRESENT', 'CALLBACK_CREDENTIALS_ABSENT', 'CALLBACK_ERROR', 'INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED', 'PASSWORD_RECOVERY', 'MFA_CHALLENGE_VERIFIED', 'SDK_INITIALIZATION_OBSERVED', 'SDK_CALLBACK_PROCESSING_OBSERVED', 'SDK_INITIALIZATION_SETTLED', 'SDK_INITIALIZATION_FAILED', 'SESSION_READ', 'RECOVERY_SESSION_CHECK', 'ROUTE_NAVIGATION', 'ROUTE_SESSION_READ', 'ROUTE_SESSION_READ_FAILED', 'CALLBACK_ENTERED', 'CALLBACK_VALIDATION_REQUESTED', 'CALLBACK_VALIDATION_FAILED', 'CALLBACK_SESSION_CONFIRMED', 'DESTINATION_NAVIGATION', 'PASSWORD_UPDATE_REQUESTED', 'PASSWORD_UPDATE_SUCCEEDED', 'PASSWORD_UPDATE_FAILED']);
function restoreRows(): EvidenceRow[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(key) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.slice(-80).flatMap(row => {
      if (!row || !events.has(row.authEvent) || typeof row.timestamp !== 'string'
        || !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(row.timestamp)
        || typeof row.pathname !== 'string' || !/^\/[a-zA-Z0-9/_-]*$/.test(row.pathname)
        || !['sdkInitialized', 'sessionPresent', 'userPresent'].every(k => typeof row[k] === 'boolean')) return [];
      return [{ timestamp: row.timestamp, pathname: row.pathname, authEvent: row.authEvent,
        sdkInitialized: row.sdkInitialized, sessionPresent: row.sessionPresent, userPresent: row.userPresent,
        errorCategory: row.errorCategory === null ? null : safeAuthError({ name: row.errorCategory }) }];
    });
  } catch { return []; }
}
const rows: EvidenceRow[] = restoreRows();
export function recordAuthEvidence(authEvent: string, error?: unknown) {
  if (!events.has(authEvent)) return;
  rows.push({ timestamp: new Date().toISOString(), pathname: window.location.pathname,
    authEvent, sdkInitialized: initialized, sessionPresent: !!session, userPresent: !!session?.user,
    errorCategory: error ? safeAuthError(error) : null });
  if (rows.length > 80) rows.shift();
  try { sessionStorage.setItem(key, JSON.stringify(rows)); } catch { /* diagnostics cannot block auth */ }
}
export function readAuthEvidence(): EvidenceRow[] { return rows.slice(); }
export function startSessionEvidence() {
  if (startPromise) return startPromise;
  recordAuthEvidence(returnContext.credentials ? 'CALLBACK_CREDENTIALS_PRESENT' : 'CALLBACK_CREDENTIALS_ABSENT');
  for (const event of returnContext.shape ?? []) recordAuthEvidence(event);
  if (returnContext.error) recordAuthEvidence('CALLBACK_ERROR', { name: 'AuthImplicitGrantRedirectError' });
  supabase.auth.onAuthStateChange((event, next) => {
    session = next;
    if (event === 'PASSWORD_RECOVERY' && next?.user) recoveryConfirmed = true;
    if (!next || event === 'SIGNED_OUT') recoveryConfirmed = false;
    recordAuthEvidence(event);
  });
  // initialize() observes the existing constructor-started SDK promise; it does
  // not start a second exchange. SDK validation/exchange internals are opaque.
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
