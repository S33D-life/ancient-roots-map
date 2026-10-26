import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import manifest from '../../public/council/circle-238/companions.json';
import receipt from '../../docs/releases/circle238-20261026/release-receipt.json';
describe('Circle 238 source, privacy and archive contract',()=>{
 it('freezes the exact canonical roster and two distinct Goji doors without an invented tree ID',()=>{
  expect(manifest.companions.map(c=>c.key)).toEqual(['bishop-ely-plane','fig','peace-lily','goji-seed','english-oak-leaf','saffron','goji-fruit','hen-of-the-woods','the-hobbit','hoopoe']);
  expect(new Set(manifest.companions.map(c=>c.id)).size).toBe(10);
  expect(manifest.companions[3].speciesKey).toBe(manifest.companions[6].speciesKey);
  expect(manifest.companions[0].atlasId).toBeNull();expect(manifest.question).toBeNull();expect(manifest.fire).toBeNull();
  for(const c of manifest.companions){expect(c.artwork).toMatch(/^\/council\/circle-238\/portraits\//);expect(createHash('sha256').update(readFileSync('public'+c.artwork)).digest('hex')).toBe(c.sha256);expect(c.width).toBe(1120);expect(c.height).toBe(730);}
  expect(manifest.publicationApproved).toBe(false);
 });
 it('pins unchanged 237 roster and every actual approved image byte',()=>{
  const bytes=readFileSync('public/council/circle-237/companions.json');expect(createHash('sha256').update(bytes).digest('hex')).toBe(receipt.circle237Archive.rosterSha256);
  for(const c of JSON.parse(bytes.toString()).companions){expect(createHash('sha256').update(readFileSync('public'+c.artwork)).digest('hex')).toBe(c.sha256);}
  expect(createHash('sha256').update(readFileSync('public/council/circle-238/companions.json')).digest('hex')).toBe(receipt.circle238ManifestSha256);
 });
 it('uses the original shared engine and keeps placeholders out of texture loading',()=>{
  const source=readFileSync('public/tetol/circle-235/pre-fire/runtime/entry.js','utf8');expect(source).toContain("import('./companion-frames-238.js')");expect(source).toContain('repr.artwork ? new THREE.TextureLoader()');
 });
});
