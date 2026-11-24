import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import catalogue from '../../public/council/circle-242/catalogue.json';
import tree from '../../public/council/time-tree.json';
import {validateEdition} from '../../public/council/circle-242/edition.js';
import {selectedEdition} from '../../public/council/published-selector.js';
const at=(hostname:string)=>({hostname});
describe('Circle 242 isolated preparation',()=>{
 it('retains the confirmed ten roles and order without activating the week',()=>{
  expect(catalogue.companions.map(c=>c.label)).toEqual(['Great London Plane of Ely','Holly','Yarrow','Coco de Mer','Field Maple','Ivy Blossom','Blueberries','Turkey Tail','Return of the Bird Tribes','Barn Owl']);
  expect(catalogue.companions.map(c=>c.order)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  expect(catalogue.question).toBeNull();expect(catalogue.fire).toBeNull();expect(catalogue.publicationApproved).toBe(false);
  expect(catalogue.assetsReady).toBe(false);expect(catalogue.companions.every(c=>c.artwork===null&&c.reverse===null)).toBe(true);
 });
 it('retains the existing published Circle and every historical selector',()=>{
  expect(selectedEdition(null,tree)).toBe(241);
  for(let n=234;n<=241;n++)expect(selectedEdition(String(n),tree)).toBe(n);
  expect(()=>selectedEdition('242',tree)).toThrow();
 });
 it('fails closed for public and unavailable private artwork',()=>{
  expect(()=>validateEdition(catalogue,at('www.s33d.life'))).toThrow();
  expect(()=>validateEdition(catalogue,at('127.0.0.1'))).toThrow();
 });
 it('permits a complete synthetic pack only at loopback while approval is false',()=>{
  const fixture={...catalogue,assetsReady:true,companions:catalogue.companions.map(c=>({...c,artwork:`/council/circle-242/${c.key}-front.webp`,reverse:{artwork:`/council/circle-242/${c.key}.webp`,readableText:'Synthetic review transcript'}}))};
  expect(validateEdition(fixture,at('127.0.0.1')).number).toBe(242);
  for(const host of ['www.s33d.life','127.0.0.1.evil.example','192.168.0.2'])expect(()=>validateEdition(fixture,at(host))).toThrow();
  expect(()=>validateEdition({...fixture,fire:{time:'invented'}},at('127.0.0.1'))).toThrow();
  expect(()=>validateEdition({...fixture,companions:fixture.companions.slice(1)},at('127.0.0.1'))).toThrow();
 });
 it('uses the established original Tree adapter and never substitutes an old edition',()=>{
  const source=readFileSync('public/tetol/circle-235/pre-fire/runtime/companion-frames-242.js','utf8');
  expect(source).toContain("from '/council/circle-239/living-frame.js'");expect(source).toContain('D.council.active = 242');
  expect(source).toContain('No scheduled Fire');expect(source).not.toMatch(/supabase|\.insert\(|\.update\(|issueReward/);
 });
});
