import { createClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const project = 'https://sdk-observation.invalid';
const sessionKey = 'sb-sdk-observation-auth-token';
const user = { id: 'PRIVATE-ACCOUNT', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
const callback = '/auth/callback#access_token=ACCESS-SECRET&refresh_token=REFRESH-SECRET&expires_in=3600&token_type=bearer';
beforeEach(() => {
  vi.resetModules(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear();
  window.history.replaceState({}, '', callback);
});
afterEach(() => { vi.restoreAllMocks(); window.history.replaceState({}, '', '/'); localStorage.clear(); sessionStorage.clear(); });
async function modules() {
  const io = await import('@/lib/auth/observeAuthIO');
  const journal = await import('@/lib/auth/evidenceJournal');
  return { ...io, ...journal };
}
function memory() {
  const values = new Map<string, string>();
  return { values, getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { values.set(key, value); }), removeItem: vi.fn((key: string) => { values.delete(key); }) };
}
it('preserves synchronous storage results, arguments, read-after-write and removal with no extra operations', async () => {
  const m = await modules(); const original = memory(); const storage = m.observeAuthStorage(original, project)!;
  expect(storage.setItem(sessionKey, 'SECRET-STORED-VALUE')).toBeUndefined();
  expect(storage.getItem(sessionKey)).toBe('SECRET-STORED-VALUE');
  expect(storage.removeItem(sessionKey)).toBeUndefined();
  expect(storage.getItem(sessionKey)).toBeNull();
  expect(original.setItem).toHaveBeenCalledExactlyOnceWith(sessionKey, 'SECRET-STORED-VALUE');
  expect(original.getItem).toHaveBeenCalledTimes(2);
  expect(original.removeItem).toHaveBeenCalledExactlyOnceWith(sessionKey);
  const rows = m.readAuthEvidence().filter(row => row.authEvent.startsWith('SESSION_STORAGE'));
  expect(rows.map(row => row.authEvent)).toEqual(['SESSION_STORAGE_WRITE_ATTEMPTED','SESSION_STORAGE_WRITE_SUCCEEDED','SESSION_STORAGE_READ_PRESENT','SESSION_STORAGE_REMOVAL_OBSERVED','SESSION_STORAGE_READ_ABSENT']);
  expect(rows[0].operation).toBe(rows[1].operation);
  expect(JSON.stringify(m.readAuthEvidence())).not.toMatch(/SECRET|PRIVATE-ACCOUNT|sdk-observation|auth-token/);
});
it('passes non-session keys through without observations', async () => {
  const m = await modules(); const original = memory(); const storage = m.observeAuthStorage(original, project)!;
  const before = m.readAuthEvidence().length;
  storage.setItem('sensitive-PRIVATE-KEY', 'SECRET'); storage.getItem('sensitive-PRIVATE-KEY'); storage.removeItem('sensitive-PRIVATE-KEY');
  expect(m.readAuthEvidence()).toHaveLength(before);
});
it('preserves storage throw identity and logs only allowlisted categories', async () => {
  const m = await modules(); const failure = new DOMException('SECRET', 'QuotaExceededError');
  const original = memory(); original.setItem.mockImplementation(() => { throw failure; });
  const storage = m.observeAuthStorage(original, project)!;
  let caught: unknown;
  try { storage.setItem(sessionKey, 'SECRET'); } catch (error) { caught = error; }
  expect(caught).toBe(failure);
  expect(m.readAuthEvidence().at(-1)).toMatchObject({ authEvent: 'SESSION_STORAGE_WRITE_FAILED', errorCategory: 'QuotaExceededError' });
  expect(JSON.stringify(m.readAuthEvidence())).not.toContain('SECRET');
});
it('preserves async storage completion and rejection without retries', async () => {
  const m = await modules(); const failure = { name: 'SECRET-NAME', message: 'SECRET-MESSAGE' };
  const original = { getItem: vi.fn(async () => 'SECRET'), setItem: vi.fn(async () => { throw failure; }), removeItem: vi.fn(async () => {}) };
  const storage = m.observeAuthStorage(original, project)!;
  await expect(storage.setItem(sessionKey, 'SECRET')).rejects.toBe(failure);
  await expect(storage.getItem(sessionKey)).resolves.toBe('SECRET');
  await storage.removeItem(sessionKey);
  expect(original.setItem).toHaveBeenCalledOnce();
  expect(m.readAuthEvidence().find(row => row.authEvent === 'SESSION_STORAGE_WRITE_FAILED')?.errorCategory).toBe('AuthError');
  expect(JSON.stringify(m.readAuthEvidence())).not.toContain('SECRET');
});
it('records read/removal failures without converting them into absence/success', async () => {
  const m = await modules(); const failure = new DOMException('SECRET', 'SecurityError');
  const original = { getItem: () => { throw failure; }, setItem: () => {}, removeItem: async () => { throw failure; } };
  const storage = m.observeAuthStorage(original, project)!;
  let caught: unknown;
  try { storage.getItem(sessionKey); } catch (error) { caught = error; }
  expect(caught).toBe(failure);
  await expect(storage.removeItem(sessionKey)).rejects.toBe(failure);
  expect(m.readAuthEvidence().slice(-2).map(row => row.authEvent)).toEqual(['SESSION_STORAGE_READ_FAILED', 'SESSION_STORAGE_REMOVAL_FAILED']);
});
it('observes only existing GET user requests and preserves response identity/body', async () => {
  const m = await modules(); const response = new Response('SECRET-BODY', { status: 401 });
  const delegate = vi.fn(async () => response); const observed = m.observeAuthFetch(project, delegate);
  const options = { headers: { Authorization: 'Bearer SECRET' } };
  expect(await observed(`${project}/auth/v1/user`, options)).toBe(response);
  expect(delegate).toHaveBeenCalledExactlyOnceWith(`${project}/auth/v1/user`, options);
  expect(response.bodyUsed).toBe(false);
  expect(m.readAuthEvidence().map(row => row.authEvent)).toEqual(['AUTH_USER_VALIDATION_STARTED','AUTH_USER_VALIDATION_COMPLETED','AUTH_USER_VALIDATION_FAILED']);
  expect(m.readAuthEvidence().at(-1)?.httpStatus).toBe(401);
  expect(JSON.stringify(m.readAuthEvidence())).not.toMatch(/SECRET|Bearer|Authorization|https:/);
  const before = m.readAuthEvidence().length;
  await observed(`${project}/auth/v1/user`, { method: 'PUT' });
  await observed('https://other.invalid/auth/v1/user');
  expect(m.readAuthEvidence()).toHaveLength(before);
});
it('observes Request input and fetch rejection without swallowing or retrying', async () => {
  const m = await modules(); const failure = new TypeError('SECRET'); const delegate = vi.fn(async () => { throw failure; });
  const observed = m.observeAuthFetch(project, delegate);
  const request = new Request(`${project}/auth/v1/user`);
  await expect(observed(request)).rejects.toBe(failure);
  expect(delegate).toHaveBeenCalledExactlyOnceWith(request, undefined);
  expect(m.readAuthEvidence().at(-1)).toMatchObject({ authEvent: 'AUTH_USER_VALIDATION_FAILED', errorCategory: 'TypeError' });
});
it('records real SDK validation → write → initialization → read order without extra requests', async () => {
  const m = await modules(); const original = memory();
  const delegate = vi.fn(async () => new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  const client = createClient(project, 'synthetic-public-key', { auth: { storage: m.observeAuthStorage(original, project), autoRefreshToken: false }, global: { fetch: m.observeAuthFetch(project, delegate) } });
  try {
    expect((await client.auth.initialize()).error).toBeNull();
    m.updateEvidenceState(true, false, false); m.appendEvidence('SDK_INITIALIZATION_SETTLED');
    expect((await client.auth.getSession()).data.session?.user.id).toBe(user.id);
    m.appendEvidence('SESSION_READ');
    const rows = m.readAuthEvidence(); const events = rows.map(row => row.authEvent);
    const ordered = ['CALLBACK_FRAGMENT_ACCESS_PRESENT','AUTH_USER_VALIDATION_STARTED','AUTH_USER_VALIDATION_COMPLETED','SESSION_STORAGE_WRITE_ATTEMPTED','SESSION_STORAGE_WRITE_SUCCEEDED','SDK_INITIALIZATION_SETTLED','SESSION_STORAGE_READ_PRESENT','SESSION_READ'];
    let last = -1;
    for (const event of ordered) { const index = events.indexOf(event, last + 1); expect(index).toBeGreaterThan(last); last = index; }
    expect(rows.every((row, index) => index === 0 || row.sequence > rows[index - 1].sequence)).toBe(true);
    expect(delegate).toHaveBeenCalledOnce();
    expect(JSON.stringify(rows)).not.toMatch(/ACCESS-SECRET|REFRESH-SECRET|PRIVATE-ACCOUNT|synthetic-public-key/);
  } finally { client.auth.stopAutoRefresh(); }
});
it('records accepted credentials followed by a real SDK storage-save failure', async () => {
  const m = await modules(); const original = memory(); original.setItem.mockImplementation(() => { throw new DOMException('SECRET', 'QuotaExceededError'); });
  const client = createClient(project, 'synthetic-public-key', { auth: { storage: m.observeAuthStorage(original, project), autoRefreshToken: false }, global: { fetch: m.observeAuthFetch(project, async () => new Response(JSON.stringify(user), { status: 200 })) } });
  try {
    expect((await client.auth.initialize()).error?.name).toBe('AuthUnknownError');
    const rows = m.readAuthEvidence();
    expect(rows.find(row => row.authEvent === 'AUTH_USER_VALIDATION_COMPLETED')?.httpStatus).toBe(200);
    expect(rows.some(row => row.authEvent === 'SESSION_STORAGE_WRITE_FAILED')).toBe(true);
    expect(rows.some(row => row.authEvent === 'SESSION_STORAGE_WRITE_SUCCEEDED')).toBe(false);
  } finally { client.auth.stopAutoRefresh(); }
});
it('diagnostic persistence failure cannot block auth storage or leak values', async () => {
  const m = await modules(); const original = memory(); const storage = m.observeAuthStorage(original, project)!;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('SECRET'); });
  expect(storage.setItem(sessionKey, 'SECRET')).toBeUndefined();
  expect(storage.getItem(sessionKey)).toBe('SECRET');
  expect(JSON.stringify(m.readAuthEvidence())).not.toContain('SECRET');
});
it('restores ordered redacted rows and drops untrusted added fields and route identifiers', async () => {
  let m = await modules(); m.beginCallbackEvidence();
  window.history.replaceState({}, '', '/tree/PRIVATE-ACCOUNT?access_token=SECRET');
  m.appendEvidence('ROUTE_NAVIGATION');
  const previous = m.readAuthEvidence().at(-1)!;
  expect(previous.pathname).toBe('/other');
  const persisted = JSON.parse(sessionStorage.getItem('s33d-auth-evidence-v2')!);
  persisted[0].secret = 'SECRET'; sessionStorage.setItem('s33d-auth-evidence-v2', JSON.stringify(persisted));
  vi.resetModules(); m = await modules(); m.appendEvidence('SESSION_READ');
  expect(m.readAuthEvidence().at(-1)?.sequence).toBe(previous.sequence + 1);
  expect(m.readAuthEvidence().at(-1)?.documentSequence).toBe(previous.documentSequence + 1);
  expect(JSON.stringify(m.readAuthEvidence())).not.toMatch(/SECRET|PRIVATE-ACCOUNT/);
});
it('classifies standalone/frame context conservatively without recording a user-agent', async () => {
  const m = await modules();
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
  m.appendEvidence('SESSION_READ'); expect(m.readAuthEvidence().at(-1)?.context).toBe('standalone');
  expect(m.readAuthEvidence().at(-1)?.browserHint).toMatch(/^(safari-like|other-or-unknown)$/);
  expect(JSON.stringify(m.readAuthEvidence())).not.toContain(navigator.userAgent);
});
it('real SDK validation rejection never reaches the session write', async () => {
  const m = await modules(); const original = memory();
  const delegate = vi.fn(async () => new Response(JSON.stringify({ msg: 'PRIVATE-MESSAGE' }), { status: 401 }));
  const client = createClient(project, 'synthetic-public-key', { auth: { storage: m.observeAuthStorage(original, project), autoRefreshToken: false }, global: { fetch: m.observeAuthFetch(project, delegate) } });
  try {
    expect((await client.auth.initialize()).error?.name).toBe('AuthApiError');
    expect(m.readAuthEvidence().some(row => row.authEvent === 'AUTH_USER_VALIDATION_FAILED' && row.httpStatus === 401)).toBe(true);
    expect(m.readAuthEvidence().some(row => row.authEvent === 'SESSION_STORAGE_WRITE_ATTEMPTED')).toBe(false);
    expect(delegate).toHaveBeenCalledOnce();
    expect(JSON.stringify(m.readAuthEvidence())).not.toContain('PRIVATE-MESSAGE');
  } finally { client.auth.stopAutoRefresh(); }
});
it('real SDK skips a duplicate-masked callback and parity evidence reports the same absence', async () => {
  window.history.replaceState({}, '', '/auth/callback#access_token=SECRET&access_token=&refresh_token=SECRET&expires_in=3600&token_type=bearer');
  const m = await modules(); const delegate = vi.fn(); const original = memory();
  const client = createClient(project, 'synthetic-public-key', { auth: { storage: m.observeAuthStorage(original, project), autoRefreshToken: false }, global: { fetch: m.observeAuthFetch(project, delegate) } });
  try {
    expect((await client.auth.initialize()).error).toBeNull();
    expect((await client.auth.getSession()).data.session).toBeNull();
    const events = m.readAuthEvidence().map(row => row.authEvent);
    expect(events).toContain('CALLBACK_FRAGMENT_DUPLICATES');
    expect(events).not.toContain('CALLBACK_EFFECTIVE_ACCESS_NONEMPTY');
    expect(events).not.toContain('AUTH_USER_VALIDATION_STARTED');
    expect(delegate).not.toHaveBeenCalled();
  } finally { client.auth.stopAutoRefresh(); }
});
it('preserves synchronous fetch failures and asynchronous successful storage operations', async () => {
  const m = await modules(); const failure = new TypeError('SECRET');
  const observed = m.observeAuthFetch(project, () => { throw failure; });
  expect(() => observed(`${project}/auth/v1/user`)).toThrow(failure);
  const values = new Map<string, string>();
  const original = { setItem: vi.fn(async (key: string, value: string) => { values.set(key, value); }), getItem: vi.fn(async (key: string) => values.get(key) ?? null), removeItem: vi.fn(async (key: string) => { values.delete(key); }) };
  const storage = m.observeAuthStorage(original, project)!;
  await storage.setItem(sessionKey, 'SECRET');
  expect(await storage.getItem(sessionKey)).toBe('SECRET');
  await storage.removeItem(sessionKey);
  expect(await storage.getItem(sessionKey)).toBeNull();
  expect(original.setItem).toHaveBeenCalledOnce();
  expect(m.readAuthEvidence().some(row => row.authEvent === 'SESSION_STORAGE_WRITE_SUCCEEDED')).toBe(true);
});
it('keeps existing auth error presentation unchanged while recording storage-specific diagnostics', async () => {
  const m = await modules(); const error = new DOMException('SECRET', 'QuotaExceededError');
  expect(m.safeAuthError(error)).toBe('AuthError');
  m.appendEvidence('SESSION_STORAGE_WRITE_FAILED', error);
  expect(m.readAuthEvidence().at(-1)?.errorCategory).toBe('QuotaExceededError');
});
