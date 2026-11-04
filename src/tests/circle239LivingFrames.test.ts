import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {containedSize,localReview,reviewedReverse} from '../../public/council/circle-239/living-frame.js';
import held from '../../public/council/circle-239/reverse-folios.json';
const item={key:'ginger',artwork:'/council/circle-239/reverses/ginger.png',sha256:'a'.repeat(64),width:1536,height:1024,readableText:'Reviewed accessible text',status:'APPROVED',factReviewed:true,rightsApproved:true};
const approved={circle:239,publicationApproved:true,status:'APPROVED',items:[item]};
const publicSite={hostname:'www.s33d.life',search:'?review239=1'};
describe('Circle239 living-frame approval boundary',()=>{
 it('holds all ten original reverse bytes outside public output until independent asset review',()=>{
   expect(held.publicationApproved).toBe(false);expect(held.items).toHaveLength(10);
   for(const i of held.items){expect(i.artwork).toBeNull();expect(i.readableText).toBeNull();expect(reviewedReverse(held,i.key,publicSite)).toBeNull();expect(existsSync('public/council/circle-239/reverses/'+i.key+'.png')).toBe(false);}
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
