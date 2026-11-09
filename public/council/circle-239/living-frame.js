/** One read-only Circle239 frame, shared by React and the original TETOL sheet. */
import { appendCouncilLibraryLinks } from '../library-links.js';

const ROOT = '/council/circle-239/';
export const localReview = (where = location) => ['127.0.0.1','localhost','[::1]'].includes(where.hostname) && new URLSearchParams(where.search).get('review239') === '1';
export function reviewedReverse(catalog, key, where = location) {
  const item = catalog?.circle === 239 && catalog.items?.find(item => item.key === key);
  const approved = catalog?.publicationApproved === true && catalog?.status === 'APPROVED' && item?.factReviewed === true && item?.rightsApproved === true && item?.status === 'APPROVED';
  const review = localReview(where) && catalog?.status === 'LOCAL_PRIVATE_REVIEW' && item?.status === 'LOCAL_PRIVATE_REVIEW';
  if ((!approved && !review) || !item || item.artwork !== ROOT+'reverses/'+key+'.png' ||
      !/^[a-f0-9]{64}$/.test(item.sha256) || !(item.width > 0 && item.height > 0) || !item.readableText?.trim()) return null;
  return {...item, privateReview:!approved};
}
export function containedSize(width, height, boxWidth = 1.06, boxHeight = 1.06*2/3) {
  const scale = Math.min(boxWidth/width,boxHeight/height);
  return {width:width*scale,height:height*scale};
}
let catalogPromise;
const catalogue = () => catalogPromise ||= fetch(ROOT+'reverse-folios.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Reverse unavailable');return r.json();});
const node = (tag, text) => {const el=document.createElement(tag);if(text)el.textContent=text;return el;};
export class LivingFrame239 extends HTMLElement {
  static observedAttributes = ['side'];
  connectedCallback() {
    if(this.shadowRoot)return;
    this.attachShadow({mode:'open'});
    const style=node('style'); style.textContent=`:host{display:block;width:100%;color:inherit}.frame{margin:0}.art{display:block;width:100%;height:auto;object-fit:contain;border-radius:8px}.controls{display:flex;flex-wrap:wrap;gap:.5rem;margin:.75rem 0}button,a{font:inherit;color:inherit;background:#243d2d;border:1px solid #a79664;border-radius:7px;padding:.65rem .8rem;min-height:44px;box-sizing:border-box}button{cursor:pointer}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #f0bf4b;outline-offset:3px}button:disabled{cursor:default;opacity:.7}p{line-height:1.5}details{margin:.75rem 0}pre{white-space:pre-wrap;font:inherit;line-height:1.5}summary{cursor:pointer;min-height:44px}.turn{animation:turn .22s ease-out}@keyframes turn{from{opacity:.25;transform:rotateY(-12deg)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.turn{animation:none}}`;
    this.side='front';
    this.image=node('img');this.image.className='art companion-scene';this.image.src=this.getAttribute('front');this.image.alt=this.getAttribute('front-alt')||this.getAttribute('label');
    this.image.width=1536;this.image.height=1024;
    this.toggle=node('button','Reveal reverse');this.toggle.type='button';this.toggle.disabled=true;this.toggle.setAttribute('aria-pressed','false');this.toggle.setAttribute('aria-label','Reveal reverse of '+this.getAttribute('label'));
    this.toggle.addEventListener('click',()=>{if(!this.busy)this.turn(this.side==='reverse'?'front':'reverse',true);});
    this.full=node('a','Open full artwork');this.full.href=this.image.src;this.full.target='_blank';this.full.rel='noopener';
    const controls=node('div');controls.className='controls';controls.append(this.toggle,this.full);
    this.status=node('p');this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');
    this.transcript=node('details');const summary=node('summary','Read the reverse as text');this.text=node('pre');this.transcript.append(summary,this.text);this.transcript.hidden=true;
    this.deep=node('a','Explore deeper');this.deep.hidden=true;
    const libraryLinks = node('div');
    this.shadowRoot.append(style,this.image,controls,this.status,this.transcript,this.deep,libraryLinks);
    appendCouncilLibraryLinks(libraryLinks, 239, this.getAttribute('companion-key'));
    catalogue().then(c=>{this.reverse=reviewedReverse(c,this.getAttribute('companion-key'));if(!this.isConnected)return;
      this.toggle.disabled=!this.reverse;
      this.status.textContent=this.reverse?.privateReview?'Private artwork review — not cleared for publication.':this.reverse?'Front portrait.':'Reverse folio is awaiting editorial approval. The front remains available.';
      this.text.textContent=this.reverse?.readableText||'';
      // No Library destination is inferred from a species name or generic library route.
      if(this.reverse?.explore?.verified===true && /^\/library\/[a-z0-9/-]+$/.test(this.reverse.explore.href)) {this.deep.href=this.reverse.explore.href;this.deep.hidden=false;}
      if(this.reverse)this.turn(this.getAttribute('side')==='reverse'?'reverse':'front',false);
    }).catch(()=>{this.status.textContent='Reverse folio unavailable. The front remains available.';});
  }
  attributeChangedCallback(name,old,value){if(old!==value && value!==this.side && this.reverse)this.turn(value==='reverse'?'reverse':'front',false);}
  async turn(side, notify) {
    if(!this.image || (side==='reverse'&&!this.reverse) || (!this.busy && this.side===side))return;
    const ticket=this.ticket=(this.ticket||0)+1;
    const src=side==='reverse'?this.reverse.artwork:this.getAttribute('front');
    this.busy=true;this.toggle.setAttribute('aria-busy','true');this.toggle.setAttribute('aria-disabled','true');
    try {const probe=new Image();probe.src=src;await probe.decode();if(ticket!==this.ticket||!this.isConnected)return;
      this.side=side;this.setAttribute('side',side);this.image.src=src;this.image.alt=side==='reverse'?this.getAttribute('label')+' — reverse folio; readable text follows.':this.getAttribute('front-alt');
      this.image.width=side==='reverse'?this.reverse.width:1536;this.image.height=side==='reverse'?this.reverse.height:1024;
      this.full.href=src;this.transcript.hidden=side!=='reverse';this.deep.hidden=side!=='reverse'||!this.deep.hasAttribute('href');
      this.toggle.textContent=side==='reverse'?'Return to front':'Reveal reverse';this.toggle.setAttribute('aria-label',(side==='reverse'?'Return to front of ':'Reveal reverse of ')+this.getAttribute('label'));this.toggle.setAttribute('aria-pressed',String(side==='reverse'));
      this.status.textContent=(this.reverse?.privateReview?'Private artwork review — not cleared for publication. ':'')+(side==='reverse'?'Reverse folio.':'Front portrait.');
      this.dispatchEvent(new CustomEvent('council-frame-display',{bubbles:true,composed:true,detail:{key:this.getAttribute('companion-key'),side,reverse:this.reverse}}));
      if(notify){this.image.classList.remove('turn');void this.image.offsetWidth;this.image.classList.add('turn');this.dispatchEvent(new CustomEvent('council-frame-turn',{bubbles:true,composed:true,detail:{key:this.getAttribute('companion-key'),side,reverse:this.reverse}}));}
    }catch{if(ticket===this.ticket)this.status.textContent='That artwork could not be loaded. The current side is unchanged.';}
    finally{if(ticket===this.ticket){this.busy=false;this.toggle.disabled=!this.reverse;this.toggle.setAttribute('aria-busy','false');this.toggle.setAttribute('aria-disabled',String(!this.reverse));}}
  }
}
if(!customElements.get('council-living-frame'))customElements.define('council-living-frame',LivingFrame239);

export function spatialSide(key) {const q=new URLSearchParams(location.search);return q.get('frame')===key&&q.get('side')==='reverse'?'reverse':'front';}
export function connectLivingScene({THREE,stage}) {
  const original=new Map(), tickets=new Map();
  const show=async ({key,side,reverse}) => {
    const companion=window.TETOL?.circleFrameCompanions?.find(c=>c.key===key);if(!companion)return;
    const mesh=stage._scene.getObjectByName(companion.id+'_artwork');if(!mesh)return;
    if(!original.has(key))original.set(key,{geometry:mesh.geometry,map:mesh.material.map});
    const ticket=(tickets.get(key)||0)+1;tickets.set(key,ticket);
    if(side!=='reverse'){const front=original.get(key);if(mesh.geometry!==front.geometry)mesh.geometry.dispose();if(mesh.material.map!==front.map)mesh.material.map?.dispose();mesh.geometry=front.geometry;mesh.material.map=front.map;mesh.material.needsUpdate=true;return;}
    if(!reverse||reverse.artwork!==ROOT+'reverses/'+key+'.png')return;
    try {const texture=await new THREE.TextureLoader().loadAsync(reverse.artwork);
      if(tickets.get(key)!==ticket){texture.dispose();return;}
      texture.colorSpace=THREE.SRGBColorSpace;const size=containedSize(reverse.width,reverse.height);
      const front=original.get(key);if(mesh.geometry!==front.geometry)mesh.geometry.dispose();if(mesh.material.map!==front.map)mesh.material.map?.dispose();
      mesh.geometry=new THREE.PlaneGeometry(size.width,size.height);mesh.material.map=texture;mesh.material.needsUpdate=true;
    } catch {document.querySelectorAll('council-living-frame').forEach(el=>{if(el.getAttribute('companion-key')===key)el.turn('front',true);});}
  };
  document.addEventListener('council-frame-display',event=>{if(event.target.getAttribute('context')==='spatial')show(event.detail);});
  document.addEventListener('council-frame-turn',event=>{if(event.target.getAttribute('context')!=='spatial')return;const url=new URL(location.href);url.searchParams.delete('frame');url.searchParams.delete('side');if(event.detail.side==='reverse'){url.searchParams.set('frame',event.detail.key);url.searchParams.set('side','reverse');}history.pushState(null,'',url);});
  addEventListener('popstate',()=>document.querySelectorAll('council-living-frame[context=spatial]').forEach(el=>el.setAttribute('side',spatialSide(el.getAttribute('companion-key')))));
  document.querySelectorAll('council-living-frame[context=spatial]').forEach(el=>{if(el.side)show({key:el.getAttribute('companion-key'),side:el.side,reverse:el.reverse});});
}
