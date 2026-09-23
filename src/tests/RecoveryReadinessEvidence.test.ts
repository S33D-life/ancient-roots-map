import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ initialize: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn(), context: { credentials: false, recovery: false, error: false } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: mocks } }));
vi.mock('@/lib/auth/returnContext', () => ({ returnContext: mocks.context }));
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); sessionStorage.clear();
  Object.assign(mocks.context, { credentials: false, recovery: false, error: false });
  mocks.initialize.mockResolvedValue({ error: null });
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
});
describe('recovery readiness and evidence', () => {
  it('rejects a bare reset route or stale saved flag even with an unrelated existing session', async () => {
    sessionStorage.setItem('s33d_recovery_active', '1');
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'private-user' } } }, error: null });
    const m = await import('@/lib/auth/sessionEvidence');
    expect(await m.checkRecoveryReadiness()).toBe('AuthSessionMissingError');
  });
  it('does not allow recovery before initialization settles', async () => {
    Object.assign(mocks.context, { credentials: true, recovery: true });
    let complete!: (value: { error: null }) => void;
    mocks.initialize.mockReturnValue(new Promise(resolve => { complete = resolve; }));
    mocks.getSession.mockResolvedValue({ data: { session: { user: {} } }, error: null });
    const m = await import('@/lib/auth/sessionEvidence');
    const result = m.checkRecoveryReadiness();
    expect(mocks.getSession).not.toHaveBeenCalled();
    complete({ error: null });
    expect(await result).toBeNull();
  });
  it('rejects failed callback even when an old session exists', async () => {
    Object.assign(mocks.context, { credentials: true, recovery: true, error: true });
    mocks.getSession.mockResolvedValue({ data: { session: { user: {} } }, error: null });
    const m = await import('@/lib/auth/sessionEvidence');
    expect(await m.checkRecoveryReadiness()).toBe('AuthImplicitGrantRedirectError');
  });
  it('preserves allowlisted error names and never payload messages', async () => {
    mocks.initialize.mockResolvedValue({ error: { name: 'AuthApiError', message: 'access_token=SECRET email@example.com' } });
    const m = await import('@/lib/auth/sessionEvidence');
    expect(await m.checkRecoveryReadiness()).toBe('AuthApiError');
    expect(JSON.stringify(m.readAuthEvidence())).not.toMatch(/SECRET|email@|access_token/);
    expect(m.safeAuthError({ name: 'SECRET' })).toBe('AuthError');
    expect(Object.keys(m.readAuthEvidence()[0]).sort()).toEqual(['timestamp','pathname','authEvent','sdkInitialized','sessionPresent','userPresent','errorCategory'].sort());
  });
  it('loses readiness when session disappears and does not serialize user data', async () => {
    Object.assign(mocks.context, { credentials: true, recovery: true });
    mocks.getSession.mockResolvedValue({ data: { session: { user: { email: 'private@example.com' } } }, error: null });
    const m = await import('@/lib/auth/sessionEvidence');
    expect(await m.checkRecoveryReadiness()).toBeNull();
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await m.checkRecoveryReadiness()).toBe('AuthSessionMissingError');
    expect(JSON.stringify(m.readAuthEvidence())).not.toContain('private@example.com');
  });
  it('uses the same trace for Google and records route session readback without granting recovery', async () => {
    mocks.context.credentials = true;
    mocks.getSession.mockResolvedValue({ data: { session: { user: {} } }, error: null });
    const m = await import('@/lib/auth/sessionEvidence');
    await m.recordRouteSession();
    expect(await m.checkRecoveryReadiness()).toBe('AuthSessionMissingError');
    expect(m.readAuthEvidence().some(row => row.authEvent === 'ROUTE_SESSION_READ' && row.sessionPresent)).toBe(true);
  });
});
it('retains only safe structured history across navigation/reload', async () => {
  const first = await import('@/lib/auth/sessionEvidence');
  await first.startSessionEvidence();
  const prior = first.readAuthEvidence().length;
  vi.resetModules();
  const next = await import('@/lib/auth/sessionEvidence');
  expect(next.readAuthEvidence().length).toBe(prior);
  sessionStorage.setItem('s33d-auth-evidence-v1', JSON.stringify([{ authEvent: 'SECRET', pathname: '/auth#access_token=SECRET' }]));
  vi.resetModules();
  const clean = await import('@/lib/auth/sessionEvidence');
  expect(clean.readAuthEvidence()).toEqual([]);
});
