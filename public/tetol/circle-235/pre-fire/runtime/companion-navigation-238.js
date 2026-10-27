// Presentation and navigation only: manifest order, records, scenes and renderer stay canonical.
let lastCompanion = null;
const items = D => D.circleFrameCompanions || [];
export const isCompanion = (D, id) => items(D).some(c => c.id === id);
export function renderCompanionPanel(D, id, esc) {
  const roster = items(D), index = roster.findIndex(c => c.id === id), c = roster[index];
  if (!c && id !== 'croom' && id !== 'c238') return null;
  if (c) lastCompanion = c.id;
  const button = (target, label, key) => `<button type="button" class="act" ${key === 'previous' || key === 'next' ? `aria-label="${key === 'previous' ? 'Previous' : 'Next'} companion"` : ''} ${key ? `id="companion-${key}"` : ''} ${target ? `data-go="${esc(target)}"` : 'disabled'}>${esc(label)}</button>`;
  const choice = `<label class="companion-choice">Choose a companion <select data-companion-choice aria-label="Choose a companion"><option value="" disabled ${!c && !lastCompanion ? 'selected' : ''}>All ${roster.length} companions</option>${roster.map((r,i) => `<option value="${esc(r.id)}" ${r.id === (c?.id || lastCompanion) ? 'selected' : ''}>${i+1}. ${esc(r.label)}</option>`).join('')}</select></label>`;
  const navigation = c ? `<nav class="companion-steps" aria-label="Meet the companions">${button(roster[index-1]?.id,'← Previous','previous')}${button('croom','Back to the gathering','gathering')}${button(roster[index+1]?.id,'Next →','next')}</nav>` : button(roster[0]?.id,'Meet first companion →','start');
  return `<button type="button" class="grab" id="grab" aria-expanded="false"><i></i></button><div class="pbody companion-browse"><p class="eyebrow">Circle 238 · OPEN</p><h2 class="pname" id="pname" tabindex="-1">${c ? esc(c.label) : 'Fig-wood Council'}</h2><p class="psub" ${c ? 'role="status" aria-live="polite"' : ''}>${c ? `${index+1} of ${roster.length} · ${esc(c.kind)} · Illustration` : 'Circle 238 · CURRENT / OPEN'}</p>${c ? '' : `<p class="companion-question">${esc(D.nodes.croom.question)}</p>`}${navigation}${choice}${c ? `<img data-circle-artwork="${esc(c.id)}" src="${esc(c.artwork)}" alt="${esc(c.label)} — illustrated companion"><p>Artistic interpretation, not field evidence.</p>${c.accuracyNote ? `<p>${esc(c.accuracyNote)}</p>` : ''}` : '<p>Ten supplied illustrations. Meet them in order, choose a name, or tap a hanging portrait.</p>'}<div class="companion-other-circles"><h3>Other Circles</h3></div><div class="companion-paths">${button('canopy','Explore the Tree','tree')}<a class="act" target="_top" href="/council/238">2D companion list →</a></div></div>`;
}
export function setNavigationContext(D, id) {
  const here = id === 'croom' || id === 'c238' || isCompanion(D,id);
  document.body.classList.toggle('council-companion-context',here);
  const exit = document.getElementById('council-return');
  if (exit) exit.textContent = here ? '2D Council Canopy' : 'Return to Circle 238';
}
export function labelGrab(D, id) {
  if (id !== 'croom' && id !== 'c238' && !isCompanion(D,id)) return;
  const grab = document.getElementById('grab'); if (!grab) return;
  const open = ['mid','full'].includes(document.body.dataset.sheet);
  const index = items(D).findIndex(c => c.id === id);
  const label = index < 0 ? `Meet the ${items(D).length} companions` : `${index+1} of ${items(D).length} · Companions`;
  grab.setAttribute('aria-label',index < 0 ? (open ? 'Resize companion panel' : label) : `${open ? 'Resize' : 'Open'} companion panel · ${index+1} of ${items(D).length}`);
  grab.setAttribute('aria-expanded',String(open));
  let hint = grab.querySelector('span');
  if (!hint) { hint = document.createElement('span'); grab.append(hint); }
  hint.textContent = label + (open ? ' ↕' : ' ↑');
}
export function decoratePanel(D, id) {
  if (id !== 'croom' && id !== 'c238' && !isCompanion(D,id)) return;
  const target = document.querySelector('.companion-other-circles'), timeTree = document.getElementById('council-time-tree');
  if (target && timeTree) target.append(timeTree);
  labelGrab(D,id);
}
export function afterNavigation(D, id, previous, setSheet, previousFocus) {
  if (isCompanion(D,id)) {
    setSheet('mid');
    const retained = ['companion-next','companion-previous'].includes(previousFocus) && document.getElementById(previousFocus);
    (retained && !retained.disabled ? retained : document.getElementById('pname'))?.focus({preventScroll:true});
  } else if ((id === 'croom' || id === 'c238') && isCompanion(D,previous)) {
    setSheet('mid'); document.querySelector('[data-companion-choice]')?.focus({preventScroll:true});
  }
}
export function installCompanionNavigation() {
  document.body.classList.add('council-companion-navigation');
  const style = document.createElement('style'); style.id = 'companion-navigation-238';
  style.textContent = `
    body.council-companion-context .leave{display:none!important}
    body.phone.council-companion-navigation.council-companion-context #council-return{display:inline-flex!important;align-items:center;position:fixed;top:max(10px,env(safe-area-inset-top));left:108px!important;right:auto!important;bottom:auto!important;min-height:44px;max-width:calc(100vw - 120px);padding:0 12px;box-sizing:border-box;font-size:12px;z-index:13}
    body.council-companion-navigation .companion-browse .act,body.council-companion-navigation .companion-browse select{min-height:44px;box-sizing:border-box}
    .companion-browse .companion-question{font:italic 18px/1.4 var(--whisper,serif);margin:8px 0}
    .companion-browse .companion-steps{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:6px;margin:8px 0}
    .companion-browse .companion-steps .act{margin:0;padding:8px 5px;text-align:center;font-size:12px;line-height:1.3}
    .companion-browse .act:disabled{opacity:.4;cursor:default}
    .companion-browse .companion-choice{display:grid;gap:5px;font:13px var(--sans,sans-serif);margin:10px 0}
    .companion-browse select{width:100%;max-width:100%;height:48px;-webkit-appearance:menulist-button;font:inherit;font-size:16px;color:var(--ink);background:var(--panel,#1a1f14);border:1px solid var(--line);border-radius:6px;padding:8px}
    .companion-browse img{width:100%;height:auto;border-radius:8px;margin:10px 0}
    .companion-browse .companion-other-circles{border-top:1px solid var(--line);margin-top:16px;padding-top:12px}
    .companion-other-circles h3{font:14px var(--sans,sans-serif);margin:0 0 4px}
    .companion-browse .companion-paths{margin:12px 0;padding-bottom:env(safe-area-inset-bottom)}
    .companion-browse :focus-visible{outline:2px solid #f5c040;outline-offset:2px}
    @media(max-width:600px){body.phone.council-companion-context:not([data-sheet=mid]):not([data-sheet=full]){--sheet-h:calc(112px + env(safe-area-inset-bottom))}body.council-companion-navigation.council-companion-context #grab{font-size:13px;height:44px;min-height:44px}body.council-companion-navigation.council-companion-context[data-sheet=peek] .pname{font-size:22px}.companion-browse .companion-steps{position:sticky;top:0;background:var(--panel,#1a1f14);z-index:1}}
  `;
  document.head.append(style);
}
