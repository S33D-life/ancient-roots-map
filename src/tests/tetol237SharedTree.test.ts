import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import manifest from '@/review/circle237/release-manifest.json';
import {roster} from '@/review/circle237/registry';
describe('Shared original 3D TETOL Circle 237 edition',()=>{
 it('uses original Tree, not duplicate static 3D model',()=>{
  const s=readFileSync('public/tetol/circle-235/pre-fire/runtime/entry.js','utf8');
  const c=JSON.parse(readFileSync('public/council/circle-237/companions.json','utf8'));
  expect(s).toContain("circleEdition === '237' ? 237");
  expect(s).toContain("import('./companion-frames-237.js')");
  expect(s).toContain("id + '_hanging_cord'");
  expect(c.companions.map((x:{key:string})=>x.key)).toEqual(roster.map(x=>x.key));
  for(const x of c.companions)expect(x.sha256).toBe(manifest.sceneAssets[x.key as keyof typeof manifest.sceneAssets].sha256);
  expect(c.question).toBe(manifest.question);
 });
});
