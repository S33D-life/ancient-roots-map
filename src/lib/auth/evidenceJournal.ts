import { callbackShapeEvents } from './callbackShape';
import { returnContext } from './returnContext';

declare const __BUILD_ID__: string;
const build = typeof __BUILD_ID__ === 'string' && /^(?:[a-f0-9]{7,40}|dev)$/.test(__BUILD_ID__) ? __BUILD_ID__ : 'unknown';
const key = 's33d-auth-evidence-v2';
const limit = 160;
const allowedErrors = new Set(['AuthSessionMissingError', 'AuthApiError', 'AuthRetryableFetchError', 'AuthImplicitGrantRedirectError', 'AuthPKCEGrantCodeExchangeError', 'AuthInvalidTokenResponseError', 'AuthInvalidCredentialsError', 'AuthWeakPasswordError', 'AuthUnknownError']);
const diagnosticErrors = new Set([...allowedErrors, 'QuotaExceededError', 'SecurityError', 'TypeError', 'AbortError']);
function safeError(error: unknown, allowed: Set<string>): string {
  try {
    const name = (error as { name?: unknown } | null)?.name;
    return typeof name === 'string' && allowed.has(name) ? name : 'AuthError';
  } catch { return 'AuthError'; }
}
export function safeAuthError(error: unknown): string { return safeError(error, allowedErrors); }
function safeDiagnosticError(error: unknown): string { return safeError(error, diagnosticErrors); }
const observerEvents = ['AUTH_USER_VALIDATION_STARTED', 'AUTH_USER_VALIDATION_COMPLETED', 'AUTH_USER_VALIDATION_FAILED', 'SESSION_STORAGE_WRITE_ATTEMPTED', 'SESSION_STORAGE_WRITE_SUCCEEDED', 'SESSION_STORAGE_WRITE_FAILED', 'SESSION_STORAGE_READ_PRESENT', 'SESSION_STORAGE_READ_ABSENT', 'SESSION_STORAGE_READ_FAILED', 'SESSION_STORAGE_REMOVAL_OBSERVED', 'SESSION_STORAGE_REMOVAL_FAILED'];
const events = new Set([...callbackShapeEvents, 'CALLBACK_SESSION_MISSING','CALLBACK_CREDENTIALS_PRESENT', 'CALLBACK_CREDENTIALS_ABSENT', 'CALLBACK_ERROR', 'INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED', 'PASSWORD_RECOVERY', 'MFA_CHALLENGE_VERIFIED', 'SDK_INITIALIZATION_OBSERVED', 'SDK_CALLBACK_PROCESSING_OBSERVED', 'SDK_INITIALIZATION_SETTLED', 'SDK_INITIALIZATION_FAILED', 'SESSION_READ', 'RECOVERY_SESSION_CHECK', 'ROUTE_NAVIGATION', 'ROUTE_SESSION_READ', 'ROUTE_SESSION_READ_FAILED', 'CALLBACK_ENTERED', 'CALLBACK_VALIDATION_REQUESTED', 'CALLBACK_VALIDATION_FAILED', 'CALLBACK_SESSION_CONFIRMED', 'DESTINATION_NAVIGATION', 'PASSWORD_UPDATE_REQUESTED', 'PASSWORD_UPDATE_SUCCEEDED', 'PASSWORD_UPDATE_FAILED']);
observerEvents.forEach(event => events.add(event));
const routes = new Set(['/', '/auth', '/auth/callback', '/auth/diagnostics', '/auth/handoff', '/reset-password', '/atlas']);
const contexts = new Set(['standalone', 'embedded', 'browser', 'unknown']);
const families = new Set(['safari-like', 'other-or-unknown']);
function context() {
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true) return 'standalone';
    if (window.self !== window.top) return 'embedded';
    return 'browser';
  } catch { return 'unknown'; }
}
function family() {
  try {
    // Coarse hint only; some WKWebViews are indistinguishable from Safari.
    return /Safari\//.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|Chrome|Chromium|Android/.test(navigator.userAgent) ? 'safari-like' : 'other-or-unknown';
  } catch { return 'other-or-unknown'; }
}
export type EvidenceRow = {
  sequence: number; documentSequence: number; build: string; context: string; browserHint: string;
  timestamp: string; pathname: string; authEvent: string;
  sdkInitialized: boolean; sessionPresent: boolean; userPresent: boolean;
  errorCategory: string | null; httpStatus: number | null; operation: number | null;
};
function restoreRows(): EvidenceRow[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(key) || '[]');
    if (!Array.isArray(saved)) return [];
    let last = 0;
    return saved.slice(-limit).flatMap(row => {
      if (!row || !events.has(row.authEvent) || !Number.isSafeInteger(row.sequence) || row.sequence <= last
        || !Number.isSafeInteger(row.documentSequence) || row.documentSequence < 1
        || typeof row.build !== 'string' || !/^(?:[a-f0-9]{7,40}|dev|unknown)$/.test(row.build)
        || !contexts.has(row.context) || !families.has(row.browserHint)
        || typeof row.timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(row.timestamp)
        || !routes.has(row.pathname) && row.pathname !== '/other'
        || !['sdkInitialized', 'sessionPresent', 'userPresent'].every(k => typeof row[k] === 'boolean')) return [];
      last = row.sequence;
      return [{ sequence: row.sequence, documentSequence: row.documentSequence, build: row.build,
        context: row.context, browserHint: row.browserHint, timestamp: row.timestamp, pathname: row.pathname,
        authEvent: row.authEvent, sdkInitialized: row.sdkInitialized, sessionPresent: row.sessionPresent, userPresent: row.userPresent,
        errorCategory: row.errorCategory === null ? null : safeDiagnosticError({ name: row.errorCategory }),
        httpStatus: Number.isInteger(row.httpStatus) && row.httpStatus >= 100 && row.httpStatus <= 599 ? row.httpStatus : null,
        operation: Number.isSafeInteger(row.operation) && row.operation > 0 ? row.operation : null }];
    });
  } catch { return []; }
}
const rows = restoreRows();
let sequence = rows.at(-1)?.sequence ?? 0;
const documentSequence = Math.max(0, ...rows.map(row => row.documentSequence)) + 1;
let sdkInitialized = false, sessionPresent = false, userPresent = false;
let begun = false;
export function updateEvidenceState(initialized: boolean, session: boolean, user: boolean) {
  sdkInitialized = initialized; sessionPresent = session; userPresent = user;
}
export function appendEvidence(authEvent: string, error?: unknown, httpStatus?: number, operation?: number) {
  // Observation must never prevent or replace the SDK operation/result.
  try {
    if (!events.has(authEvent)) return;
    rows.push({ sequence: ++sequence, documentSequence, build, context: context(), browserHint: family(),
      timestamp: new Date().toISOString(), pathname: routes.has(window.location.pathname) ? window.location.pathname : '/other',
      authEvent, sdkInitialized, sessionPresent, userPresent, errorCategory: error ? safeDiagnosticError(error) : null,
      httpStatus: Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? httpStatus : null,
      operation: Number.isSafeInteger(operation) && operation > 0 ? operation : null });
    if (rows.length > limit) rows.shift();
    sessionStorage.setItem(key, JSON.stringify(rows));
  } catch { /* diagnostic persistence is best effort; never touch auth storage */ }
}
export function beginCallbackEvidence() {
  if (begun) return;
  begun = true;
  appendEvidence(returnContext.credentials ? 'CALLBACK_CREDENTIALS_PRESENT' : 'CALLBACK_CREDENTIALS_ABSENT');
  for (const event of returnContext.shape ?? []) appendEvidence(event);
  if (returnContext.error) appendEvidence('CALLBACK_ERROR', { name: 'AuthImplicitGrantRedirectError' });
}
export function readAuthEvidence(): EvidenceRow[] { return rows.map(row => ({ ...row })); }
