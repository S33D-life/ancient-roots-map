import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { MapFilterProvider, useMapFilters } from '@/contexts/MapFilterContext';

const fragment = '#access_token=synthetic-access&refresh_token=synthetic-refresh&expires_in=3600&token_type=bearer';
const user = { id: 'test-user', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
const stopClients: Array<() => void> = [];
afterEach(() => {
  cleanup();
  stopClients.forEach(stop => stop());
  stopClients.length = 0;
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

function Controls() {
  const { setSpecies } = useMapFilters();
  const navigate = useNavigate();
  return <><button onClick={() => setSpecies('Oak')}>Select oak</button><button onClick={() => navigate('/atlas')}>Atlas</button></>;
}
function mount() {
  return render(<BrowserRouter><MapFilterProvider><Controls /></MapFilterProvider></BrowserRouter>);
}

it.each(['/auth/callback', '/reset-password'])(
  'preserves %s credentials while real SDK initialization waits for its lock', async path => {
    window.history.replaceState({}, '', `${path}?returnTo=%2Fatlas${fragment}${path === '/reset-password' ? '&type=recovery' : ''}`);
    let release!: () => void;
    const lockReady = new Promise<void>(resolve => { release = resolve; });
    const fetch = vi.fn(async () => new Response(JSON.stringify(user), { status: 200 }));
    const client = createClient('https://callback-race.invalid', 'synthetic-public-key', {
      auth: { autoRefreshToken: false, lock: async (_name, _timeout, fn) => { await lockReady; return fn(); } },
      global: { fetch },
    });
    stopClients.push(() => client.auth.stopAutoRefresh());
    const events: string[] = [];
    const { data: { subscription } } = client.auth.onAuthStateChange(event => { events.push(event); });
    mount();
    const hashBeforeUnlock = window.location.hash;
    release();
    await act(async () => { await client.auth.initialize(); });
    const { data: { session } } = await client.auth.getSession();
    expect(session?.user.id).toBe('test-user');
    expect(hashBeforeUnlock).toContain('access_token=synthetic-access');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('');
    expect(new URLSearchParams(window.location.search).get('returnTo')).toBe('/atlas');
    await waitFor(() => expect(events).toContain(path === '/reset-password' ? 'PASSWORD_RECOVERY' : 'SIGNED_IN'));
    expect(localStorage.getItem('sb-callback-race-auth-token')).toBeTruthy();
    subscription.unsubscribe();
  },
);

it.each(['/auth', '/auth/callback', '/auth/handoff', '/reset-password', '/auth/callback/', '/reset-password/'])(
  'does not rewrite %s when filter state changes', path => {
    window.history.replaceState({}, '', `${path}?code=synthetic-code&h=synthetic-handoff&returnTo=%2Fatlas${fragment}`);
    const before = window.location.href;
    mount();
    fireEvent.click(screen.getByText('Select oak'));
    expect(window.location.href).toBe(before);
  },
);

it('continues syncing filters on Atlas and after leaving the auth route', () => {
  window.history.replaceState({}, '', '/auth/callback');
  mount();
  fireEvent.click(screen.getByText('Select oak'));
  fireEvent.click(screen.getByText('Atlas'));
  expect(window.location.pathname).toBe('/atlas');
  expect(new URLSearchParams(window.location.search).get('species')).toBe('Oak');
});
