import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import manifest from '@/review/circle237/release-manifest.json';
describe('Circle237 exact cleared scene bytes',()=>{
 it('ships the ten user-approved scene-only artworks, unchanged and under budget',()=>{
  expect(Object.keys(manifest.sceneAssets)).toHaveLength(10);
  for(const asset of Object.values(manifest.sceneAssets)){
   const bytes=readFileSync(`public${asset.path}`);
   expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
   expect(bytes.length).toBeLessThan(512000);
  }
 });
 it('preserves all ten nameplate-free scenes without full original portraits',()=>{
  expect(manifest.heldKeys).toEqual([]);
  expect(existsSync('public/council/circle-237/portraits')).toBe(true);
 });
});
