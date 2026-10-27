import {afterEach,describe,expect,it,vi} from 'vitest';
import manifest from '../../public/council/circle-238/companions.json';
import {renderCompanionPanel,decoratePanel,labelGrab,setNavigationContext,afterNavigation} from '../../public/tetol/circle-235/pre-fire/runtime/companion-navigation-238.js';
const data=()=>({circleFrameCompanions:manifest.companions,nodes:{croom:{question:manifest.question}}});
const esc=(s:string)=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
const show=(id:string)=>{const d=data();document.body.innerHTML='<a id="council-return" href="/council-of-life?from=spatial-council&circle=238#next-gathering"></a><aside id="panel">'+renderCompanionPanel(d,id,esc)+'</aside>';return d;};
afterEach(()=>{document.body.replaceChildren();document.body.className='';delete document.body.dataset.sheet;vi.restoreAllMocks();});
describe('Current Council companion navigation',()=>{
 it('uses the canonical ten identities in manifest order with a direct non-WebGL choice',()=>{
  show('croom');expect([...document.querySelectorAll('select option')].slice(1).map(o=>(o as HTMLOptionElement).value)).toEqual(manifest.companions.map(c=>c.id));
  expect(document.querySelector('#companion-start')?.getAttribute('data-go')).toBe(manifest.companions[0].id);
  expect(document.querySelector('.companion-question')?.textContent).toBe(manifest.question);
 });
 it('bounds previous/next to this edition and preserves every artwork and accuracy note',()=>{
  for(const [i,c] of manifest.companions.entries()){
   show(c.id);expect(document.querySelector('.psub')?.textContent).toBe(`${i+1} of 10 · ${c.kind} · Illustration`);
   expect(document.querySelector('#companion-previous')?.getAttribute('data-go')).toBe(manifest.companions[i-1]?.id||null);
   expect(document.querySelector('#companion-next')?.getAttribute('data-go')).toBe(manifest.companions[i+1]?.id||null);
   expect((document.querySelector('#companion-previous') as HTMLButtonElement).disabled).toBe(i===0);
   expect((document.querySelector('#companion-next') as HTMLButtonElement).disabled).toBe(i===9);
   expect(document.querySelector('img')?.getAttribute('src')).toBe(c.artwork);expect(document.querySelector('#panel')?.textContent).toContain(c.accuracyNote);
   expect(document.querySelector('#companion-gathering')?.getAttribute('data-go')).toBe('croom');
  }
 });
 it('keeps the edition navigator intact beneath a distinct Other Circles heading',()=>{
  const d=show('croom');document.body.insertAdjacentHTML('beforeend','<nav id="council-time-tree"><select aria-label="Choose a Council Circle"><option>238</option></select></nav>');decoratePanel(d,'croom');
  expect(document.querySelector('.companion-other-circles #council-time-tree')).not.toBeNull();
  labelGrab(d,'croom');expect(document.querySelector('#grab')?.textContent).toContain('Meet the 10 companions');
 });
 it('retains keyboard next focus and restores the gathering choice without rewriting the 2D return',()=>{
  const d=show(manifest.companions[1].id),setSheet=vi.fn();afterNavigation(d,manifest.companions[1].id,manifest.companions[0].id,setSheet,'companion-next');expect(document.activeElement?.id).toBe('companion-next');expect(setSheet).toHaveBeenCalledWith('mid');
  show('croom');afterNavigation(d,'croom',manifest.companions[1].id,setSheet,null);expect(document.activeElement?.hasAttribute('data-companion-choice')).toBe(true);
  setNavigationContext(d,'croom');expect(document.querySelector('#council-return')?.getAttribute('href')).toContain('circle=238#next-gathering');expect(document.querySelector('#council-return')?.textContent).toBe('2D Council Canopy');
  setNavigationContext(d,'staff');expect(document.body.classList.contains('council-companion-context')).toBe(false);expect(document.querySelector('#council-return')?.textContent).toBe('Return to Circle 238');
 });
 it('does not decorate unrelated Tree rooms or turn supplied labels into markup',()=>{
  const d=data();expect(renderCompanionPanel(d,'staff',esc)).toBeNull();const modified={...d,circleFrameCompanions:[{...d.circleFrameCompanions[0],label:'<img src=x onerror=alert(1)>'}]};document.body.innerHTML=renderCompanionPanel(modified,modified.circleFrameCompanions[0].id,esc);expect(document.querySelector('h2 img')).toBeNull();expect(document.querySelector('h2')?.textContent).toBe('<img src=x onerror=alert(1)>');
 });
});
