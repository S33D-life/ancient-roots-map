/** Optional weekly contents of the existing room. Earlier Circles remain unchanged. */
export async function installCompanionFrames(D) {
  const response = await fetch('/council/circle-236/companions.json');
  if (!response.ok) throw new Error('Circle companion artwork unavailable');
  const circle = await response.json();
  if (circle.number !== 236 || circle.status !== 'PREPARING' || circle.companions.length !== 7) throw new Error('Invalid preparing Circle');
  const base = D.nodes.yewc233;
  D.nodes.c236 = { ...D.nodes.c233, name: 'Circle 236', sub: 'PREPARING · Tuesday 13 October · 19:30 UK', stateShort: 'PREPARING', circle: 236, parent: 'croom', lives: [], actions: [], relations: [], purpose: 'A preparing Circle. No gathering or memory is claimed.' };
  D.council.circles[236] = { node: 'c236', number: 236, status: 'awaiting', companions: circle.companions.map((c, i) => {
    D.nodes[c.id] = { ...base, name: c.label, sub: c.kind + ' · Circle 236', circle: 236, parent: 'croom', status: 'LIVE', statusNote: 'Preparing companion artwork; no gathering claimed.', part: c.kind + ' · Circle 236', practical: 'Supplied Circle artwork · not documentary evidence.', purpose: c.reader ? 'Birch’s source-linked Living Record study is available.' : 'Its Living Record doorway is not ready. The artwork can be encountered here.', stateShort: 'PREPARING', lives: [], actions: [], relations: [{ to: 'croom', dim: 'place', text: 'Return to the same Council' }], sources: ['Ed / TEOTAG supplied Circle 236 artwork'], location: 'A companion frame around the existing Council fire.' };
    return { id: c.id, kind: c.kind, seat: Math.PI / 2 + i * Math.PI / 6, repr: { form: 'circleFrame', artwork: c.artwork } };
  }) };
  D.council.active = 236;
  D.council.current = 'c236';
  D.nodes.croom.sub = 'Circle 236 · PREPARING';
  D.nodes.croom.purpose = 'The Council room persists. These companions belong to the preparing Circle 236. Council Fire: Tuesday 13 October · 19:30 UK.';
  D.nodes.croom.relations = circle.companions.map(c => ({ to: c.id, dim: 'place', text: c.label }));
  const byId = new Map(circle.companions.map(c => [c.id, c]));
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-circle-reader]')) return;
    const params = new URLSearchParams({ recordReturn: JSON.stringify({ route: 'council', realm: 'canopy', contextId: 'council-of-life/circle-236', appearanceId: 'birch-companion', mode: 'spatial', focusTarget: 'birch-companion' }) });
    window.parent.location.assign('/review/library/notion/3f315b58-480d-814c-a056-cb6c7b4f7f33?' + params);
  });
  const style = document.createElement('style');
  style.textContent = '#tetol-welcome{display:none!important}#council-return{left:16px!important;right:auto!important;bottom:16px!important;width:max-content;max-width:calc(100vw - 32px)}body.phone[data-sheet=mid] #council-return,body.phone[data-sheet=full] #council-return{display:none!important}' + (window.parent !== window ? '#council-return{display:none!important}' : ''); document.head.append(style);
  document.title = 'Circle 236 · PREPARING · Spatial Council';
  const brand = document.getElementById('brandline'); if (brand) { const label = 'Circle 236 · PREPARING · supplied companion artwork'; brand.textContent = label; new MutationObserver(() => { if (brand.textContent !== label) brand.textContent = label; }).observe(brand, { childList: true }); }
  D.circleFrameCompanions = circle.companions;
  const returnLink = document.getElementById('council-return');
  if (returnLink) { returnLink.href = '/review/council/236?mode=spatial'; returnLink.target = '_top'; returnLink.textContent = 'Return to Circle 236'; }
  return circle;
}

export function companionPanel(D, id, esc) {
  const items = D.circleFrameCompanions;
  const c = items.find(c => c.id === id);
  if (!c && id !== 'croom' && id !== 'c236') return null;
  return `<button type="button" class="grab" id="grab" aria-expanded="false" aria-label="Show more about this place"><i></i></button><div class="pbody"><h2 class="pname">${c ? esc(c.label) : 'Circle 236'}</h2><p class="psub">PREPARING · Tuesday 13 October · 19:30 UK</p>${c ? `<img data-circle-artwork="${c.id}" src="${c.artwork}" alt="${esc(c.label)} · supplied Circle artwork" style="width:100%;height:auto"><p>${esc(c.kind)} · artwork, not documentary evidence.</p>${c.reader ? '<button class="act" data-circle-reader>Open Birch’s Living Record study</button>' : '<p>Living Record doorway not ready.</p>'}<button class="act" data-go="croom">Return to Council</button>` : items.map(c => `<button class="act" data-go="${c.id}">${esc(c.label)}</button>`).join('')}<a class="act" href="https://t.me/s33dlife" target="_blank" rel="noopener">Gather at the Fire · Council group</a></div>`;
}
