import {describe,it,expect} from 'vitest';
import {destination,selection,surfaceLink,validateCompanions,navigationControls} from '../../public/council/shared/companion-navigation.js';
import circle from '../../public/council/circle-242/catalogue.json';
import previous from '../../public/council/circle-241/catalogue.json';
describe('enduring canopy identity and history contract',()=>{
 for(const edition of [circle,previous])it(`accepts unchanged Circle ${edition.number} and preserves reverse through both surfaces`,()=>{
  const items=validateCompanions(edition.number,edition.companions),first=items[0];
  const gallery=destination(`https://example.test/council/canopy.html?circle=${edition.number}`,edition.number,first,'reverse');
  const spatial=surfaceLink(gallery.href,edition.number,items,false);
  expect(spatial.hash).toBe('#'+first.id);expect(selection(spatial,items,true)).toEqual({item:first,side:'reverse'});
  expect(selection(surfaceLink(spatial.href,edition.number,items,true),items)).toEqual({item:first,side:'reverse'});
  const next=destination(spatial.href,edition.number,items[1],'front',true);
  expect(next.searchParams.has('side')).toBe(false);expect(selection(next,items,true).item).toBe(items[1]);
  const gathering=destination(next.href,edition.number,undefined,'front',true);expect(gathering.hash).toBe('#croom');expect(gathering.searchParams.has('companion')).toBe(false);
 });
 it('rejects duplicate identities, cross-edition artwork and absent transcript',()=>{
  const invalid=[()=>{const c=structuredClone(circle.companions);c[1]=c[0];return c;},()=>{const c=structuredClone(circle.companions);c[0].artwork='/council/circle-241/wrong.webp';return c;},()=>{const c=structuredClone(circle.companions);c[0].reverse.readableText='';return c;}];
  for(const make of invalid)expect(()=>validateCompanions(242,make())).toThrow();
 });
 it('does not reuse another companion’s reverse state or accept arbitrary deep-link identities',()=>{
  expect(selection(new URL('https://example.test/?companion=nope&side=reverse'),circle.companions).item).toBeUndefined();
  const url=destination('https://example.test/',242,circle.companions[0],'reverse');url.searchParams.set('frame',circle.companions[1].key);expect(selection(url,circle.companions).side).toBe('front');
 });
 it('provides ordered accessible controls with bounded ends and a gathering choice',()=>{
  const actions:any[]=[];const nav=navigationControls(242,circle.companions,circle.companions[0],(...args:any[])=>actions.push(args));
  expect(nav.getAttribute('aria-label')).toBe('Meet the companions');expect(nav.querySelector('p')?.textContent).toContain('1 of 10');
  expect((nav.querySelector('[data-canopy-action="previous"]') as HTMLButtonElement).disabled).toBe(true);
  (nav.querySelector('[data-canopy-action="next"]') as HTMLButtonElement).click();expect(actions[0][0]).toBe(circle.companions[1]);
  expect(nav.querySelectorAll('option')).toHaveLength(11);
 });
});

describe('published folio contract',()=>{
 it('rejects an unlisted private edition before fetching its catalogue',async()=>{
  const {vi}=await import('vitest');const {loadFolioEdition}=await import('../../public/council/shared/folio-edition.js');
  const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,json:async()=>({editions:[{number:242,canopy:'/council/circle-242/index.html'}]})} as Response);
  try{await expect(loadFolioEdition(243)).rejects.toThrow('Unpublished');expect(fetch).toHaveBeenCalledTimes(1);}finally{fetch.mockRestore();}
 });
 it('rejects an explicit publication hold even on a listed edition',async()=>{
  const {vi}=await import('vitest');const {loadFolioEdition}=await import('../../public/council/shared/folio-edition.js');
  const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce({ok:true,json:async()=>({editions:[{number:242,canopy:'/council/circle-242/index.html'}]})} as Response).mockResolvedValueOnce({ok:true,json:async()=>({...circle,publicationApproved:false})} as Response);
  try{await expect(loadFolioEdition(242)).rejects.toThrow('not approved');}finally{fetch.mockRestore();}
 });
});


describe('canonical edition return compatibility',()=>{
 it('keeps the published gathering route and carries a companion reverse on that same route',()=>{
  const canonical='/council/circle-242/index.html';
  const gathering=surfaceLink('https://example.test/tetol/page.html?circle=242#croom',242,circle.companions,true,canonical);
  expect(gathering.pathname+gathering.search+gathering.hash).toBe(canonical);
  const current=destination('https://example.test/tetol/page.html?circle=242',242,circle.companions[4],'reverse',true);
  const back=surfaceLink(current.href,242,circle.companions,true,canonical);
  expect(back.pathname).toBe(canonical);expect(selection(back,circle.companions)).toEqual({item:circle.companions[4],side:'reverse'});
 });
});
