import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ check: vi.fn(), updateUser: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: m } }));
vi.mock('@/lib/auth/returnContext', () => ({ returnContext: { recovery: true, credentials: true, error: false } }));
vi.mock('@/lib/auth/sessionEvidence', () => ({ checkRecoveryReadiness: m.check, finishRecovery: vi.fn(), recordAuthEvidence: vi.fn(), safeAuthError: () => 'AuthError' }));
import AuthPage from '@/pages/AuthPage';
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear(); localStorage.clear();
  m.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  m.getSession.mockResolvedValue({ data: { session: null }, error: null });
  m.updateUser.mockResolvedValue({ data: { user: { id: 'test' } }, error: null });
});
it('missing recovery session disables form and shows clear error', async () => {
  m.check.mockResolvedValue('AuthSessionMissingError');
  render(<MemoryRouter><AuthPage /></MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent('AuthSessionMissingError');
  expect(screen.getByRole('button', { name: 'Update Password' })).toBeDisabled();
  expect(m.updateUser).not.toHaveBeenCalled();
});
it('valid recovery enables form and shows success only after update succeeds', async () => {
  m.check.mockResolvedValue(null);
  render(<MemoryRouter><AuthPage /></MemoryRouter>);
  const input = await screen.findByLabelText('New Password', { exact: true });
  // Wait for readiness, not merely presence of the fields.
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Update Password' })).toBeEnabled());
  fireEvent.change(input, { target: { value: 'synthetic-test-password' } });
  fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'synthetic-test-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));
  expect(await screen.findByText(/Password Updated/)).toBeInTheDocument();
  expect(m.updateUser).toHaveBeenCalledOnce();
});
it('update rejection never shows success or raw error payload', async () => {
  m.check.mockResolvedValue(null);
  m.updateUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthApiError', message: 'SECRET' } });
  render(<MemoryRouter><AuthPage /></MemoryRouter>);
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Update Password' })).toBeEnabled());
  fireEvent.change(screen.getByLabelText('New Password', { exact: true }), { target: { value: 'synthetic-test-password' } });
  fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'synthetic-test-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('AuthError');
  expect(screen.queryByText(/Password Updated/)).not.toBeInTheDocument();
  expect(document.body.textContent).not.toContain('SECRET');
});
