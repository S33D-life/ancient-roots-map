import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ invoke: vi.fn(), onAuthStateChange: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  functions: { invoke: mocks.invoke }, auth: { onAuthStateChange: mocks.onAuthStateChange },
} }));
import { useOrdinaryMediaUrls } from '@/utils/ordinaryOfferingMedia';
const reference = 'https://example.supabase.co/storage/v1/object/public/offerings-private/user/tree/photo.jpg';
const rows = [{ id: 'offering', media_url: reference }];
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });
describe('private media display session boundary', () => {
  it('does not repopulate a stale signed link when logout races an earlier request', async () => {
    let authChange: () => void = () => {};
    let finish: (value: unknown) => void = () => {};
    mocks.onAuthStateChange.mockImplementation(callback => {
      authChange = callback; return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
    });
    mocks.invoke.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    mocks.invoke.mockResolvedValue({ data: null, error: 'signed out' });
    const hook = renderHook(() => useOrdinaryMediaUrls(rows));
    act(() => authChange());
    await act(async () => { finish({ data: { url: 'stale-signed-url' } }); });
    expect(hook.result.current).toEqual({});
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(2));
    expect(hook.result.current).toEqual({});
    hook.unmount(); expect(mocks.unsubscribe).toHaveBeenCalled();
  });
  it('resolves a permitted projection without mutating its canonical source', async () => {
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mocks.unsubscribe } } });
    mocks.invoke.mockResolvedValue({ data: { url: 'permitted-signed-url' } });
    const hook = renderHook(() => useOrdinaryMediaUrls(rows));
    await waitFor(() => expect(hook.result.current[reference]).toBe('permitted-signed-url'));
    expect(rows[0].media_url).toBe(reference);
    hook.unmount();
  });
  it('does no signing or session subscription for public-only media', () => {
    const hook = renderHook(() => useOrdinaryMediaUrls([{ id:'public', media_url:reference.replace('offerings-private','offerings') }]));
    expect(hook.result.current).toEqual({});
    expect(mocks.invoke).not.toHaveBeenCalled(); expect(mocks.onAuthStateChange).not.toHaveBeenCalled();
    hook.unmount();
  });
});
