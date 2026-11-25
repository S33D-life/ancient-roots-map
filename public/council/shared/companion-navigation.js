// Presentation-only successor to PR127's ordered navigation. No storage or rewards.
export function validateCompanions(circle, companions) {
  if (!Number.isSafeInteger(circle) || circle < 241 || !Array.isArray(companions) || companions.length !== 10) throw Error('Unsupported folio edition');
  const keys = new Set(), ids = new Set();
  for (const item of companions) {
    if (!/^[a-z0-9-]+$/.test(item.key) || item.id !== `c${circle}-${item.key}` || keys.has(item.key) || ids.has(item.id) || !item.label || !item.kind) throw Error('Invalid companion identity');
    for (const art of [item, item.reverse]) if (!art || !art.artwork?.startsWith(`/council/circle-${circle}/`) || !/^\/council\/circle-\d+\/[a-z0-9-]+\.webp$/.test(art.artwork) || !(art.width > 0 && art.height > 0) || !/^[a-f0-9]{64}$/.test(art.sha256)) throw Error('Invalid companion artwork');
    if (!item.reverse.readableText?.trim()) throw Error('Missing transcript');
    keys.add(item.key); ids.add(item.id);
  }
  return companions;
}
export function selection(url, companions, spatial = false) {
  const item = spatial ? companions.find(c => '#'+c.id === url.hash) : companions.find(c => c.key === url.searchParams.get('companion'));
  return {item, side:item && url.searchParams.get('frame') === item.key && url.searchParams.get('side') === 'reverse' ? 'reverse' : 'front'};
}
export function destination(where, circle, item, side = 'front', spatial = false) {
  const url = new URL(where);
  for (const key of ['companion','frame','side']) url.searchParams.delete(key);
  if (item) url.searchParams.set('companion',item.key);
  if (item && side === 'reverse') {url.searchParams.set('frame',item.key);url.searchParams.set('side','reverse');}
  if (spatial) {url.searchParams.set('circle',String(circle));url.hash=item?.id || 'croom';}
  else url.hash='';
  return url;
}
export function surfaceLink(where, circle, companions, fromSpatial, canopy) {
  const current=selection(new URL(where),companions,fromSpatial);
  const path=fromSpatial?(canopy||`/council/canopy.html?circle=${circle}`):`/tetol/circle-235/pre-fire/tetol.html?circle=${circle}`;
  return destination(new URL(path,where),circle,current.item,current.side,!fromSpatial);
}
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export function navigationControls(circle, companions, current, onChoose) {
  const nav=el('nav');nav.className='canopy-companion-navigation';nav.setAttribute('aria-label','Meet the companions');
  const position=el('p',current?`Circle ${circle} · Companion ${companions.indexOf(current)+1} of ${companions.length}`:`Circle ${circle} · ${companions.length} companions`);position.setAttribute('role','status');nav.append(position);
  const row=el('div');row.className='canopy-steps';
  const button=(text,key,item,disabled=false)=>{const b=el('button',text);b.type='button';b.dataset.canopyAction=key;b.disabled=disabled;b.addEventListener('click',()=>onChoose(item,key));return b;};
  if(current){const index=companions.indexOf(current);row.append(button('← Previous companion','previous',companions[index-1],index===0),button('Return to gathering','gathering',undefined),button('Next companion →','next',companions[index+1],index===companions.length-1));}
  else row.append(button('Meet the companions →','start',companions[0]));
  const label=el('label','Choose companion');const choose=el('select');choose.setAttribute('aria-label','Choose companion');
  const all=el('option','The gathering');all.value='';choose.append(all);
  companions.forEach((c,index)=>{const option=el('option',`${index+1}. ${c.label}`);option.value=c.key;choose.append(option);});choose.value=current?.key||'';
  choose.addEventListener('change',()=>onChoose(companions.find(c=>c.key===choose.value),'choose'));label.append(choose);nav.append(row,label);return nav;
}
export function installNavigationStyle() {
  if(document.getElementById('enduring-canopy-style'))return;
  const style=el('style');style.id='enduring-canopy-style';style.textContent=`
  .canopy-companion-navigation{margin:1rem 0;padding:.8rem;border:1px solid var(--line,#8d8056);border-radius:10px;color:inherit;background:var(--panel,transparent)}
  .canopy-companion-navigation p{margin:0 0 .7rem;line-height:1.5}.canopy-steps{display:flex;flex-wrap:wrap;gap:.5rem}
  .canopy-companion-navigation button,.canopy-companion-navigation select{font:inherit;font-size:16px;min-height:44px;box-sizing:border-box;padding:.6rem;border:1px solid var(--line,#8d8056);border-radius:6px;color:inherit;background:var(--panel,#243d2d);max-width:100%;cursor:pointer}
  .canopy-companion-navigation button:disabled{opacity:.5;cursor:default}.canopy-companion-navigation label{display:grid;gap:.4rem;margin-top:.8rem}.canopy-companion-navigation select{width:100%}
  .canopy-companion-navigation :focus-visible,[data-canopy-heading]:focus-visible{outline:3px solid #e7b83f;outline-offset:3px}
  .canopy-surface-link{display:inline-block;min-height:44px;padding:.7rem 0;box-sizing:border-box}
  @media(max-width:600px){.canopy-steps button{flex:1 1 100px}.canopy-companion-navigation{padding:.6rem}}
  `;document.head.append(style);
}
export function focusNavigation(root, action, heading) {
  const retained=root.querySelector(`[data-canopy-action="${action}"]`);
  if(retained && !retained.disabled)retained.focus({preventScroll:true});
  else if(action==='gathering'||action==='choose')root.querySelector('select')?.focus({preventScroll:true});
  else heading?.focus({preventScroll:true});
}
