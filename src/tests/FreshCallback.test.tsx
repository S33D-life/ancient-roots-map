import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ initialize: vi.fn(), getSession: vi.fn(), getUser: vi.fn(), onAuthStateChange: vi.fn(), context: { credentials: true, error: false, recovery: false, codeOnly: false } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: m } }));
vi.mock('@/lib/auth/returnContext', () => ({ returnContext: m.context }));
vi.mock('@/lib/auth/sessionEvidence', () => ({ startSessionEvidence: async () => {}, recordAuthEvidence: vi.fn(), safeAuthError: (e: { name?: string }) => e?.name === 'AuthApiError' ? 'AuthApiError' : 'AuthError' }));
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import AuthInitializationGate from '@/components/AuthInitializationGate';
import { completeCallback, safeDestination } from '@/lib/auth/callback';
const session = { user: { id: 'test-user' } };
beforeEach(() => {
  vi.clearAllMocks(); Object.assign(m.context, { credentials: true, error: false, recovery: false, codeOnly: false });
  m.initialize.mockResolvedValue({ error: null });
  m.getSession.mockResolvedValue({ data: { session }, error: null });
  m.getUser.mockResolvedValue({ data: { user: session.user }, error: null });
  m.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
});
function CallbackHarness() { return <MemoryRouter initialEntries={['/auth/callback?returnTo=%2Fatlas']}><Routes><Route path="/auth/callback" element={<AuthCallbackPage />} /><Route path="/atlas" element={<p>Authenticated atlas</p>} /></Routes></MemoryRouter>; }
it('waits for initialization then validates, navigates to atlas, and reads the same session', async () => {
  let done!: (r: { error: null }) => void;
  m.initialize.mockReturnValue(new Promise(resolve => { done = resolve; }));
  render(<CallbackHarness />);
  expect(screen.getByRole('status')).toHaveTextContent('Checking');
  expect(m.getSession).not.toHaveBeenCalled();
  await act(async () => { done({ error: null }); });
  expect(await screen.findByText('Authenticated atlas')).toBeInTheDocument();
  expect((await m.getSession()).data.session).toEqual(session);
  expect(m.getUser).toHaveBeenCalledOnce();
});
it('failed callback stays put with safe error and no redirect loop', async () => {
  m.initialize.mockResolvedValue({ error: { name: 'AuthApiError', message: 'token=SECRET' } });
  render(<CallbackHarness />);
  expect(await screen.findByRole('alert')).toHaveTextContent('AuthApiError');
  expect(screen.queryByText('Authenticated atlas')).not.toBeInTheDocument();
  expect(document.body.textContent).not.toContain('SECRET');
});
it('rejects missing credentials and code-only mismatched flow without attempting a second exchange', async () => {
  m.context.credentials = false;
  expect(await completeCallback()).toBe('AuthCallbackCredentialsMissing');
  m.context.credentials = true; m.context.codeOnly = true;
  expect(await completeCallback()).toBe('AuthFlowMismatch');
  expect(m.getUser).not.toHaveBeenCalled();
});
it('route guard cannot mount while session is initializing; established session restores', async () => {
  let done!: (r: { error: null }) => void;
  m.initialize.mockReturnValue(new Promise(resolve => { done = resolve; }));
  render(<AuthInitializationGate><p>Protected destination</p></AuthInitializationGate>);
  expect(screen.queryByText('Protected destination')).not.toBeInTheDocument();
  await act(async () => { done({ error: null }); });
  await waitFor(() => expect(screen.getByText('Protected destination')).toBeInTheDocument());
});
it('blocks external and callback-loop destinations', () => {
  for (const path of ['//evil.test','https://evil.test','/auth/callback','/reset-password','/\\evil.test']) expect(safeDestination(path)).toBe('/atlas');
});
