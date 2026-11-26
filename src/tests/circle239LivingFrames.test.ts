import {describe,it,expect,vi,afterEach} from 'vitest';
import {createElement} from 'react';
import {render,fireEvent,screen,cleanup} from '@testing-library/react';
import {MemoryRouter,useNavigate} from 'react-router-dom';
import Circle239Page from '../pages/council/Circle239Page';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {containedSize,localReview,reviewedReverse} from '../../public/council/circle-239/living-frame.js';
import published from '../../public/council/circle-239/reverse-folios.json';
const held={...published,publicationApproved:false,status:'HOLD_ASSET_REVIEW',items:published.items.map(i=>({...i,status:'HOLD_ASSET_REVIEW',factReviewed:false,rightsApproved:false,artwork:null,readableText:null}))};
const item={key:'ginger',artwork:'/council/circle-239/reverses/ginger.png',sha256:'a'.repeat(64),width:1536,height:1024,readableText:'Reviewed accessible text',status:'APPROVED',factReviewed:true,rightsApproved:true};
const approved={circle:239,publicationApproved:true,status:'APPROVED',items:[item]};
const publicSite={hostname:'www.s33d.life',search:'?review239=1'};
describe('Circle239 living-frame approval boundary',()=>{
 it('admits only the ten owner-approved images and exact accessible transcripts',()=>{
   const receipt=JSON.parse(readFileSync('docs/releases/circle239-living-frames/release-receipt.json','utf8'));
   expect(published.publicationApproved).toBe(true);expect(published.items).toHaveLength(10);
   expect(receipt.ownerVisualEditorialApproval.approved).toBe(true);expect(receipt.rights.approved).toBe(true);
   expect(receipt.rights.independentLegalReview).toBe(false);expect(receipt.factualReview.independentScientificPeerReview).toBe(false);
   expect(receipt.sourceMergeApproved).toBe(false);expect(receipt.deploymentApproved).toBe(false);
   for(const [n,i] of published.items.entries()){
    const image=readFileSync('public'+i.artwork),text=readFileSync('public'+i.transcript);
    expect(createHash('sha256').update(image).digest('hex')).toBe(receipt.items[n].sha256);
    expect(createHash('sha256').update(text).digest('hex')).toBe(receipt.items[n].transcriptSha256);
    expect(image.readUInt32BE(16)).toBe(1536);expect(image.readUInt32BE(20)).toBe(1024);
    expect(i.readableText).toBe(text.toString());expect(i.explore).toBeNull();
    expect(reviewedReverse(published,i.key,publicSite)?.privateReview).toBe(false);
   }
   expect(readdirSync('public/council/circle-239/reverses').sort()).toEqual(published.items.flatMap(i=>[i.key+'.png',i.key+'.txt']).sort());
   expect(readFileSync('vite.config.ts','utf8')).toContain('"council/circle-239/reverses/**"');
 });
 it('requires explicit asset, fact, rights and readable-text approval; never trusts a query flag on public hosts',()=>{
   expect(reviewedReverse(approved,'ginger',publicSite)?.artwork).toBe(item.artwork);
   for(const change of [{factReviewed:false},{rightsApproved:false},{readableText:''},{status:'HOLD'},{artwork:'https://outside.example/private.png'},{artwork:'/council/circle-238/reverses/ginger.png'},{sha256:'unknown'}])expect(reviewedReverse({...approved,items:[{...item,...change}]},'ginger',publicSite)).toBeNull();
   expect(reviewedReverse({...approved,status:'HOLD'},'ginger',publicSite)).toBeNull();
   expect(reviewedReverse({...approved,publicationApproved:false},'ginger',publicSite)).toBeNull();
   expect(reviewedReverse({...approved,circle:238},'ginger',publicSite)).toBeNull();
 });
 it('allows distinctly labelled private review only at literal loopback with an explicit flag',()=>{
   const c={circle:239,publicationApproved:false,status:'LOCAL_PRIVATE_REVIEW',items:[{...item,status:'LOCAL_PRIVATE_REVIEW',factReviewed:false,rightsApproved:false}]};
   expect(localReview(publicSite)).toBe(false);expect(reviewedReverse(c,'ginger',publicSite)).toBeNull();
   expect(reviewedReverse(c,'ginger',{hostname:'127.0.0.1',search:'?review239=1'})?.privateReview).toBe(true);
   expect(reviewedReverse(c,'ginger',{hostname:'127.0.0.1',search:''})).toBeNull();expect(reviewedReverse(c,'ginger',{hostname:'192.168.0.10',search:'?review239=1'})).toBeNull();
 });
 it.each([[1536,1024],[1448,1086],[1024,1536],[1024,1024],[4096,256]])('contains complete %ix%i textures inside the existing frame envelope',(w,h)=>{
   const size=containedSize(w,h);expect(size.width/size.height).toBeCloseTo(w/h);expect(size.width).toBeLessThanOrEqual(1.060001);expect(size.height).toBeLessThanOrEqual(1.06*2/3+.000001);
 });
 it('adds one optional239 adapter hook without modifying the original camera or old adapters',()=>{
   const entry=readFileSync('public/tetol/circle-235/pre-fire/runtime/entry.js','utf8');expect(entry).toContain('companionFrames?.connectLivingFrames?.({THREE,stage})');
   const module=readFileSync('public/council/circle-239/living-frame.js','utf8');expect(module).not.toMatch(/localStorage|indexedDB|supabase|\.upload\(|\.insert\(/);
 });
});

describe('appearance identity during direct SPA navigation',()=>{
 it('creates a fresh frame when the companion changes without going through the gallery',()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>held}));
  function Journey(){const navigate=useNavigate();return createElement('div',null,createElement('button',{onClick:()=>navigate('?companion=european-beech')},'Visit Beech'),createElement(Circle239Page));}
  render(createElement(MemoryRouter,{initialEntries:['/council/239?companion=ginkgo-leaf']},createElement(Journey)));
  const first=document.querySelector('council-living-frame');expect(first).toHaveAttribute('companion-key','ginkgo-leaf');
  fireEvent.click(screen.getByRole('button',{name:/^Visit Beech$/}));
  const second=document.querySelector('council-living-frame');expect(second).not.toBe(first);expect(second).toHaveAttribute('companion-key','european-beech');expect(second).toHaveAttribute('front','/council/circle-239/portraits/european-beech.jpeg');
 });
});

describe('corrected private typeset-candidate provenance',()=>{
 it('pins all ten new 3:2 candidates and transcripts without granting publication',()=>{
  const receipt=JSON.parse(readFileSync('docs/releases/circle239-living-frames/candidate-receipt.json','utf8'));
  expect(receipt.publicationApproved).toBe(false);expect(receipt.items).toHaveLength(10);
  for(const [n,i] of receipt.items.entries()){
   expect(i.number).toBe(n+1);expect(i.key).toBe(held.items[n].key);
   expect(i.sha256).toBe(held.items[n].sourceSha256);expect(i.sha256).toMatch(/^[a-f0-9]{64}$/);
   expect(i.transcriptSha256).toMatch(/^[a-f0-9]{64}$/);expect(i.dimensions_px).toEqual([1536,1024]);
   expect(i.unchangedOutsideEditRegions).toBe(true);expect(i.humanApproval).toBe(false);
   expect(held.items[n].factReviewed).toBe(false);expect(held.items[n].rightsApproved).toBe(false);
  }
  expect(receipt.items[4].source_file).toMatch(/^06_Dahlia/);
  expect(receipt.items[5].source_file).toMatch(/^05_Ginkgo/);
  expect(receipt.items[8].source_sha256).toBe('2d14fad98ec856f9cef4e0a5e26b5572c5f13649d9ff8fadd5e3eae5bd462eda');
 });
});
