// Edition presentation only. Frozen Council records and artwork are never rewritten.
export const TREE_PAGE = '/tetol/circle-235/pre-fire/tetol.html';
const visitEdition = (number, node = 'croom') => window.top.location.assign(editionUrl(number, node));
export const editionUrl = (number, node = 'croom') => `${TREE_PAGE}?circle=${number}#${encodeURIComponent(node)}`;
export async function installTimeTree(D, number) {
  const response = await fetch('/council/time-tree.json', {cache:'no-store'});
  if (!response.ok) throw new Error('Council Time Tree unavailable');
  const tree = await response.json(), edition = tree.editions.find(e => e.number === number);
  if (!edition || tree.current !== 238) throw new Error('Unsupported Council edition');
  // The original engine uses 232/233 as drawing slots, not actual edition numbers.
  // Reuse its existing historical forms; never infer an edition from a slot or folder name.
  if (number === 234) {
    const original = Object.values(D.council.circles).find(c => c.number === 234);
    if (!original) throw new Error('Historical Circle 234 forms unavailable');
    D.nodes.c234 = {...D.nodes[original.node], name:'Circle 234', circle:234, parent:'croom', room:true};
    D.council.circles[234] = {...original, node:'c234'};
    original.companions.forEach(c => { D.nodes[c.id].circle = 234; });
    D.council.active = 234; D.council.current = 'c234';
  }
  const slot = D.council.active, current = D.nodes[D.council.current];
  D.nodes.croom.name = `The Council Deck · Circle ${number}`;
  const source = window.S33D_COUNCIL.circles[number];
  if (number <= 235) {
    const question = source?.central_question?.final || source?.central_question?.text || '';
    D.nodes.croom.name = `The Council Deck · Circle ${number}`;
    D.nodes.croom.question = question;
    current.sub = `${edition.state} · ${source?.title || ''}`;
    current.stateShort = edition.state;
  }
  if (number === 236) { current.sub = 'HISTORICAL · Circle 236'; current.stateShort = edition.state; current.question = null; D.nodes.croom.question = null; }
  // These are live doorway projections, not the immutable registry records.
  if (number !== 235) for (const id of ['c233','c233now']) Object.assign(D.nodes[id], {
    name:`Circle ${number}`, sub:edition.state, practical:D.nodes.croom.question,
    purpose:D.nodes.croom.question, lives:[], relations:[{to:'croom',dim:'place',text:`Enter Circle ${number}`}],
    actions:[{label:`Enter Circle ${number}`,sub:edition.state,go:'croom'}]
  });
  if (D.lineage[0]) D.lineage[0] = {...D.lineage[0],label:`Circle ${number}`,node:'croom'};
  document.title = `TETOL · Circle ${number} · ${edition.state}`;
  const brand = document.getElementById('brandline'), label = `TETOL · Circle ${number} · ${edition.state}`;
  if (brand && number <= 235) {
    brand.textContent = label;
    new MutationObserver(() => { if (brand.textContent !== label) brand.textContent = label; }).observe(brand,{childList:true});
  }
  const ret = document.getElementById('council-return');
  if (ret) { ret.href = '/council-of-life?from=spatial-council&circle=' + number + '#' + (number === 238 ? 'next-gathering' : number === 234 ? 'historical-circle-234' : `previous-circle-${number}`); ret.textContent = `Return to Circle ${number}`; ret.target = '_top'; }
  const nav = document.createElement('nav'); nav.id = 'council-time-tree'; nav.setAttribute('aria-label','Council Time Tree');
  const link = (n,text,rel='') => n ? `<a href="${editionUrl(n)}" target="_top" ${rel}>${text}</a>` : `<span aria-disabled="true">${text}</span>`;
  const i = tree.editions.indexOf(edition);
  nav.innerHTML = `<div>${link(tree.editions[i-1]?.number,'← Previous Circle','rel="prev"')}<label>Circle <select aria-label="Choose a Council Circle">${tree.editions.map(e=>`<option value="${e.number}" ${e.number===number?'selected':''}>${e.number} · ${e.state}</option>`).join('')}</select></label>${link(tree.editions[i+1]?.number,'Next Circle →','rel="next"')}</div><small>Circle ${number} · ${edition.state}${number!==tree.current ? ` · <a href="${editionUrl(tree.current)}" target="_top">Return to current · ${tree.current}</a>` : ''}</small>`;
  nav.querySelector('select').addEventListener('change',e=>visitEdition(Number(e.target.value)));
  const style = document.createElement('style'); style.textContent = `
    #tetol-welcome{display:none!important}
    body.phone[data-sheet=mid] #council-return,body.phone[data-sheet=full] #council-return{display:none!important}
    body.phone #grab{min-height:44px;height:44px;gap:10px;font:11px var(--sans,sans-serif);color:var(--ink2,#d0cbb0)}
    #council-time-tree{color:var(--ink,#f0eadb);background:var(--bg,#1a1f14);border-bottom:1px solid var(--line,#6b633e);padding:6px 12px;font:13px var(--sans,sans-serif)}
    #council-time-tree>div{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
    #council-time-tree a,#council-time-tree label,#council-time-tree span{min-height:44px;display:inline-flex;align-items:center;gap:4px;color:inherit}
    #council-time-tree select{font:inherit;color:inherit;background:var(--bg,#1a1f14);min-height:44px;max-width:180px;border:1px solid var(--line,#6b633e);border-radius:6px}
    #council-time-tree small{display:block}#council-time-tree small a{min-height:32px}#council-time-tree [aria-disabled]{opacity:.45}
    #council-time-tree :focus-visible{outline:2px solid #f5c040;outline-offset:2px}
    @media(max-width:480px){#council-time-tree{padding:4px 8px}#council-time-tree>div{gap:2px}#council-time-tree a,#council-time-tree span{font-size:11px}#council-time-tree label{font-size:0}#council-time-tree select{max-width:140px;font-size:12px}}
  `; document.head.append(style);
  // Put navigation in normal panel flow, above its content, never over the art or grab handle.
  function decoratePanel() {
    const panel = document.getElementById('panel');
    if (!panel) return;
    const grab = panel.querySelector('#grab');
    if (grab) {
      grab.setAttribute('aria-label',`Explore Circle ${number} and the Time Tree`);
      if (!grab.querySelector('span')) { const hint = document.createElement('span'); hint.textContent = `Circles · ${number} ↕`; grab.append(hint); }
    }
    const body = panel.querySelector('.pbody') || panel;
    const lead = body.querySelector('.psub') || body.querySelector('h2');
    if (lead) lead.after(nav); else body.prepend(nav);
  }
  function resolveNode(id) {
    // Old "current" hotspots must refer to the edition in this document, not slot 233 (235).
    if (id === 'c233' || id === 'c233now' || (id === 'people' && number >= 236)) return 'croom';
    if (id === 'c232') {
      if (number === 234) return 'croom';
      visitEdition(number-1); return null;
    }
    const node = D.nodes[id], group = node?.circle && D.council.circles[node.circle];
    if (node?.room === true && group && group.number !== number && tree.editions.some(e=>e.number===group.number)) {
      visitEdition(group.number,id); return null;
    }
    return id;
  }
  function historicalPanel(id,esc) {
    if (number>235 || (id!=='croom' && id!==D.council.current)) return null;
    const companions = D.council.circles[slot].companions;
    return `<button type="button" class="grab" id="grab" aria-expanded="false" aria-label="Explore historical Circle ${number}"><i></i></button><div class="pbody"><h2 class="pname">Circle ${number}</h2><p class="psub">${esc(D.nodes.croom.question)}</p><p>Historical edition. Its original companions remain; this view makes no attendance, offering or Fire claim.</p>${companions.map(c=>`<button type="button" class="act" data-go="${c.id}">${esc(D.nodes[c.id].name)}</button>`).join('')}<button type="button" class="act" data-go="staff">Visit the Staff Room</button></div>`;
  }
  return {number,slot,decoratePanel,resolveNode,historicalPanel};
}
