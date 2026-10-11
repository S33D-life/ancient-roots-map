// Exercise the actual signer handler, not a mirror of its decision logic.
import { describe, it, expect, vi } from 'vitest';
import { ordinaryMediaHandler, registeredPrivatePath, type MediaRecord } from '../../supabase/functions/_shared/ordinaryOfferingMedia';
import { assertMediaAudience, displayMediaUrl } from '@/utils/ordinaryOfferingMedia';
const origin = 'https://example.supabase.co';
const owner = '11111111-1111-4111-8111-111111111111';
const tree = '22222222-2222-4222-8222-222222222222';
const id = '33333333-3333-4333-8333-333333333333';
const path = `${owner}/${tree}/photo.jpg`;
const reference = `${origin}/storage/v1/object/public/offerings-private/${path}`;
const row: MediaRecord = { created_by: owner, tree_id: tree, media_url: reference, photos: null, thumbnail_url: null };
const request = (ref: unknown = reference) => new Request(origin, { method: 'POST', body: JSON.stringify({ offering_id: id, reference: ref }) });
function setup(record: MediaRecord | null = row, authenticated = true) {
  const read = vi.fn().mockResolvedValue({ row: record });
  const sign = vi.fn().mockResolvedValue('signed-test-url');
  return { read, sign, handle: ordinaryMediaHandler({ authenticated: async () => authenticated, read, sign }, origin) };
}
describe('ordinary Offering private media boundary', () => {
  it('denies anonymous access before reading or signing', async () => {
    const s = setup(row, false);
    expect((await s.handle(request())).status).toBe(401);
    expect(s.read).not.toHaveBeenCalled(); expect(s.sign).not.toHaveBeenCalled();
  });
  it('uses caller-RLS denial and does not sign inaccessible rows', async () => {
    const s = setup(null);
    expect((await s.handle(request())).status).toBe(404);
    expect(s.read).toHaveBeenCalledWith(id); expect(s.sign).not.toHaveBeenCalled();
  });
  it('signs a registered object only after caller-RLS permits the record', async () => {
    const s = setup(); const response = await s.handle(request());
    expect(response.status).toBe(200); expect(s.sign).toHaveBeenCalledWith(path, 300);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('vary')).toBe('Authorization');
    expect(await response.json()).toEqual({ url: 'signed-test-url', expires_in: 300 });
  });
  it('supports the registered gallery and thumbnail without signing arbitrary uploads', () => {
    const gallery = reference.replace('photo.jpg', 'other.jpg');
    const r = { ...row, media_url: null, photos: [gallery], thumbnail_url: reference };
    expect(registeredPrivatePath(reference, r, origin)).toBe(path);
    expect(registeredPrivatePath(gallery, r, origin)).toBe(path.replace('photo.jpg', 'other.jpg'));
    expect(registeredPrivatePath(reference.replace('photo.jpg','unregistered.jpg'), r, origin)).toBeNull();
  });
  it.each([
    reference.replace(owner, '44444444-4444-4444-8444-444444444444'),
    reference.replace(tree, owner),
    reference.replace(origin, 'https://other.supabase.co'),
    reference.replace('photo.jpg', '../photo.jpg'),
    reference.replace('photo.jpg', '%2e%2e/photo.jpg'),
    reference.replace('photo.jpg', '%252e%252e%252fphoto.jpg'),
    reference.replace('photo.jpg', 'folder%2fphoto.jpg'),
    reference + '?download=1', reference + '#x', reference.replace('/public/', '/sign/'),
    reference.replace('offerings-private', 'offerings'),
  ])('rejects even a registered unsafe/foreign reference: %s', async bad => {
    const s = setup({ ...row, media_url: bad });
    expect((await s.handle(request(bad))).status).toBe(404); expect(s.sign).not.toHaveBeenCalled();
  });
  it('cannot use an authored Grove row to sign another author’s ordinary object', () => {
    const groveRow = { ...row, created_by: '44444444-4444-4444-8444-444444444444', tree_id: '55555555-5555-4555-8555-555555555555' };
    expect(registeredPrivatePath(reference, groveRow, origin)).toBeNull();
    const groveReference = reference.replace(owner, groveRow.created_by).replace(tree, groveRow.tree_id);
    expect(registeredPrivatePath(groveReference, { ...groveRow, media_url: groveReference }, origin)).toBe(`${groveRow.created_by}/${groveRow.tree_id}/photo.jpg`);
  });
  it('fails closed on unavailable access checks', async () => {
    const s = setup(); s.read.mockResolvedValue({ row, error: new Error('unavailable') });
    expect((await s.handle(request())).status).toBe(503); expect(s.sign).not.toHaveBeenCalled();
  });
  it('rejects invalid requests before reading', async () => {
    const s = setup();
    expect((await s.handle(new Request(origin, { method: 'POST', body: '{}' }))).status).toBe(400);
    expect(s.read).not.toHaveBeenCalled();
  });
});
describe('media projections and audience changes', () => {
  const publicRef = reference.replace('offerings-private', 'offerings');
  it('retains public delivery unchanged and fails closed before private signing', () => {
    expect(displayMediaUrl(publicRef, {})).toBe(publicRef);
    expect(displayMediaUrl(reference, {})).toBeNull();
    expect(displayMediaUrl(reference, { [reference]: 'signed' })).toBe('signed');
    expect(reference).toContain('/public/offerings-private/');
  });
  it('does not let retry/edit reuse a public copy for a limited audience', () => {
    expect(() => assertMediaAudience('tribe', [publicRef])).toThrow('public copy');
    expect(() => assertMediaAudience('private', [publicRef.replace('/object/public/', '/render/image/public/')])).toThrow();
    expect(() => assertMediaAudience('public', [reference])).toThrow('protected');
    expect(() => assertMediaAudience('tribe', [reference])).not.toThrow();
    expect(() => assertMediaAudience('public', [publicRef])).not.toThrow();
  });
});
