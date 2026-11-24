import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import catalogue from '../../public/council/circle-242/catalogue.json';
import assets from '../../public/council/circle-242/asset-manifest.json';
import tree from '../../public/council/time-tree.json';
import {validateEdition} from '../../public/council/circle-242/edition.js';
import {selectedEdition} from '../../public/council/published-selector.js';
const at=(hostname:string)=>({hostname});
const digest=(bytes: string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
describe('Circle 242 Holly release',()=>{
 it('retains the approved order, inquiry and unscheduled Fire',()=>{
  expect(catalogue.companions.map(c=>c.label)).toEqual(['Great London Plane of Ely','Holly','Yarrow','Coco de Mer','Field Maple','Ivy Blossom','Blueberries','Turkey Tail','Return of the Bird Tribes','Barn Owl']);
  expect(catalogue.companions.map(c=>c.order)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  expect(catalogue.question).toBe('What does the living world keep alive through the darker days?');
  expect(catalogue.fire).toBeNull();expect(catalogue.publicationApproved).toBe(true);expect(catalogue.assetsReady).toBe(true);
 });
 it('publishes 242 while preserving every historical selector',()=>{
  expect(selectedEdition(null,tree)).toBe(242);
  for(let n=234;n<=242;n++)expect(selectedEdition(String(n),tree)).toBe(n);
  expect(tree.editions.find(e=>e.number===241)?.state).toBe('PREVIOUS');
  expect(()=>selectedEdition('243',tree)).toThrow();
 });
 it('requires complete matching pairs and rejects unpublished public editions',()=>{
  expect(validateEdition(catalogue,at('www.s33d.life')).number).toBe(242);
  const privateEdition={...catalogue,publicationApproved:false,status:'PRIVATE_REVIEW'};
  expect(()=>validateEdition(privateEdition,at('www.s33d.life'))).toThrow();
  expect(validateEdition(privateEdition,at('127.0.0.1')).number).toBe(242);
  for(const host of ['127.0.0.1.evil.example','192.168.0.2'])expect(()=>validateEdition(privateEdition,at(host))).toThrow();
  expect(()=>validateEdition({...catalogue,fire:{time:'invented'}},at('www.s33d.life'))).toThrow();
  expect(()=>validateEdition({...catalogue,companions:catalogue.companions.slice(1)},at('www.s33d.life'))).toThrow();
 });
 it('verifies all twenty bytes, transcripts and visible editorial notes',()=>{
  expect(assets).toHaveLength(20);
  for(const asset of assets){expect(digest(readFileSync('public/council/circle-242/'+asset.file))).toBe(asset.sha256);expect(asset.bytes).toBeLessThanOrEqual(512000);}
  for(const c of catalogue.companions){
   expect(digest(c.reverse.readableText)).toBe(c.reverse.transcriptSha256);
   expect(readFileSync(`public/council/circle-242/transcripts/${c.key}.txt`,'utf8')).toBe(c.reverse.readableText);
   expect(c.learningNote.length).toBeGreaterThan(30);expect(c.invitationNote).toContain('weekly Council inquiry is separate');
  }
  const maple=catalogue.companions[4];expect(maple.reverse.readableText).toContain('cleat yellow');expect(maple.correctedReading).toContain('clear yellow');
  expect(catalogue.companions[3].reverse.readableText).toContain('today iit');expect(catalogue.companions[3].correctedReading).toContain('today it');
 });
 it('uses the original Tree without data writes or reward activation',()=>{
  const source=readFileSync('public/tetol/circle-235/pre-fire/runtime/companion-frames-242.js','utf8');
  expect(source).toContain("from '/council/circle-239/living-frame.js'");expect(source).toContain('D.council.active = 242');
  expect(source).toContain('No scheduled Fire');expect(source).not.toMatch(/supabase|\.insert\(|\.update\(|issueReward/);
 });
});
