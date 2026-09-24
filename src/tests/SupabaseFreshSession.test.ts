import { createClient } from '@supabase/supabase-js';
import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { window.history.replaceState({}, '', '/'); localStorage.clear(); });
it('installed SDK consumes an implicit callback once and restores the stored session after navigation', async () => {
  window.history.replaceState({}, '', '/auth/callback#access_token=synthetic-access&refresh_token=synthetic-refresh&expires_in=3600&token_type=bearer');
  const fetch = vi.fn(async () => new Response(JSON.stringify({ id: 'test-user', aud: 'authenticated', role: 'authenticated', email: '', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  const first = createClient('https://sdk-test.invalid', 'synthetic-public-key', { auth: { storageKey: 'sdk-recovery-test', persistSession: true, autoRefreshToken: false, detectSessionInUrl: true }, global: { fetch } });
  expect((await first.auth.initialize()).error).toBeNull();
  expect((await first.auth.getSession()).data.session?.user.id).toBe('test-user');
  expect(window.location.hash).toBe('');
  expect(fetch).toHaveBeenCalledTimes(1);
  window.history.replaceState({}, '', '/atlas');
  const restored = createClient('https://sdk-test.invalid', 'synthetic-public-key', { auth: { storageKey: 'sdk-recovery-test', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch } });
  expect((await restored.auth.getSession()).data.session?.user.id).toBe('test-user');
  expect(fetch).toHaveBeenCalledTimes(1);
  first.auth.stopAutoRefresh(); restored.auth.stopAutoRefresh();
});

it('empty query access parameter masks a valid fragment without an SDK initialization error', async () => {
  window.history.replaceState({}, '', '/auth/callback?access_token=#access_token=synthetic-access&refresh_token=synthetic-refresh&expires_in=3600&token_type=bearer');
  const fetch = vi.fn();
  const client = createClient('https://sdk-test.invalid', 'synthetic-public-key', { auth: { storageKey: 'sdk-empty-query-test', autoRefreshToken: false }, global: { fetch } });
  expect((await client.auth.initialize()).error).toBeNull();
  expect((await client.auth.getSession()).data.session).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  client.auth.stopAutoRefresh();
});
