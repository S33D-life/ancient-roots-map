import { describe,it,expect } from 'vitest';
import { readFileSync,statSync } from 'node:fs';
import manifest from '@/review/circle237/release-manifest.json';
import { roster } from '@/review/circle237/registry';
const base='public/tetol/circle-235/pre-fire/';
const edition='public/tetol/circle-237/pre-fire/';
describe('TETOL original Tree + new Circle 237 edition',()=>{
 it('inherits the exact preserved 3D model and vendor bundle, never replaces it with a gallery',()=>{
  for(const path of ['tetol.html','loader.js','runtime/classic-1.js','runtime/classic-2.js','runtime/classic-3.js','runtime/staffroom/4-roundhouse.js','vendor/three/build/three.module.js']){
   expect(readFileSync(edition+path).equals(readFileSync(base+path))).toBe(true);
  }
 });
 it('installs the ten approved companions in the original room, not a newly invented model',()=>{
  const entry=readFileSync(edition+'runtime/entry.js','utf8');
  const weave=readFileSync(edition+'runtime/companion-frames-237.js','utf8');
  const data=JSON.parse(readFileSync('public/council/circle-237/companions.json','utf8'));
  expect(data.number).toBe(237);
  expect(data.status).toBe('OPEN');
  expect(data.question).toBe(manifest.question);
  expect(data.companions.map((c:{key:string})=>c.key)).toEqual(roster.map(c=>c.key));
  for(const c of data.companions){
   expect(c.artwork).toBe(manifest.sceneAssets[c.key as keyof typeof manifest.sceneAssets].path);
   expect(c.sha256).toBe(manifest.sceneAssets[c.key as keyof typeof manifest.sceneAssets].sha256);
   expect(statSync('public'+c.artwork).size).toBeGreaterThan(3000);
  }
  expect(entry).toContain("import('./companion-frames-237.js')");
  expect(entry).toContain("setCircle(id === 'croom' ? 237 : 233)");
  expect(entry).toContain("id + '_hanging_cord'");
  expect(weave).toContain("D.council.circles[237]");
  expect(weave).toContain("D.nodes.croom.question = QUESTION");
  expect(weave).not.toContain("Fire reference · Tuesday");
 });
});
