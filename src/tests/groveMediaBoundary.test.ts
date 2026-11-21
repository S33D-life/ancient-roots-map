import { describe, expect, it } from 'vitest';
import { privateObjectPath } from '../../supabase/functions/offering-media/objectPath';
describe('Grove media object binding', () => {
  const base='https://fixture.invalid/storage/v1/object/public/offerings-private/';
  it('accepts the exact author and Grove object',()=>expect(privateObjectPath(base+'author/grove/photo.jpg','author','grove')).toBe('author/grove/photo.jpg'));
  it.each(['other/grove/a.jpg','author/other/a.jpg','author/grove/%2e%2e','author/grove/%252e%252e','author/grove/a%2fb.jpg','author/grove/%00.jpg'])('rejects foreign, traversal and ambiguous path %s', path=>expect(privateObjectPath(base+path,'author','grove')).toBeNull());
  it('fails closed on malformed encoding',()=>expect(privateObjectPath(base+'author/grove/%','author','grove')).toBeNull());
});
