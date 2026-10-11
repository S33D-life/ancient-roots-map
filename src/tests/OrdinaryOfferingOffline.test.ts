import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ pending: vi.fn(), update: vi.fn(), remove: vi.fn(), insert: vi.fn(), storage: vi.fn(), upload: vi.fn() }));
vi.mock('@/config/env', () => ({ isSupabaseConfigured: true }));
vi.mock('@/utils/offlineSync', () => ({ getActionsByStatus: mocks.pending, updateAction: mocks.update, removeAction: mocks.remove }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({ insert: mocks.insert }),
  storage: { from: mocks.storage },
} }));
import { runSync } from '@/utils/syncEngine';
import type { PendingAction } from '@/utils/offlineSync';
function action(visibility?: string | null, table = 'offerings'): PendingAction {
  return { id: 'queued-test', type: 'offering', status:'pending', table, payload: visibility === undefined ? {} : { visibility },
    photoDataUrl: 'data:image/jpeg;base64,eA==', photoStoragePath: 'owner/tree/photo.jpg', attempts:0, queuedAt:'2026-01-01T00:00:00Z', label:'test' };
}
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'onLine', { configurable:true, value:true });
  mocks.upload.mockResolvedValue({ error:null });
  mocks.insert.mockResolvedValue({ error:null });
  mocks.storage.mockImplementation(bucket => ({ upload:mocks.upload, getPublicUrl: (path: string) => ({ data:{publicUrl:`https://example.supabase.co/storage/v1/object/public/${bucket}/${path}`} }) }));
});
describe('ordinary offline media uses the database audience default', () => {
  it.each([undefined,null,'tribe','private'])('does not publicly upload limited/default audience %s', async audience => {
    const queued = action(audience); mocks.pending.mockResolvedValue([queued]);
    expect(await runSync()).toEqual({ synced:1,failed:0 });
    expect(mocks.storage).toHaveBeenCalledWith('offerings-private');
    expect(mocks.storage).not.toHaveBeenCalledWith('offerings');
    expect(mocks.insert.mock.calls[0][0].media_url).toContain('/offerings-private/');
    expect(mocks.insert.mock.calls[0][0].visibility).toBe(audience ?? 'tribe');
  });
  it('keeps deliberately public Offering delivery unchanged', async () => {
    mocks.pending.mockResolvedValue([action('public')]); await runSync();
    expect(mocks.storage).toHaveBeenCalledWith('offerings');
    expect(mocks.insert.mock.calls[0][0].media_url).toContain('/offerings/');
  });
  it('retains the queue on failed upload and does not insert a media-less Offering', async () => {
    mocks.upload.mockRejectedValue(new Error('offline'));
    const queued = action('tribe'); mocks.pending.mockResolvedValue([queued]);
    expect(await runSync()).toEqual({ synced:0,failed:1 });
    expect(mocks.insert).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
    expect(queued.status).toBe('pending'); expect(queued.photoDataUrl).toBeTruthy();
  });
  it('does not discard an incomplete multi-photo queue', async () => {
    const queued = action('tribe'); queued.photoDataUrls = [queued.photoDataUrl!]; queued.photoStoragePaths = [];
    mocks.pending.mockResolvedValue([queued]);
    expect(await runSync()).toEqual({synced:0,failed:1});
    expect(mocks.insert).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('does not change the shared check-in upload path', async () => {
    mocks.pending.mockResolvedValue([action(undefined,'tree_checkins')]); await runSync();
    expect(mocks.storage).toHaveBeenCalledWith('offerings');
  });
});
