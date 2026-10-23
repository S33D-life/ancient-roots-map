/** Optional weekly contents of the existing room. Earlier Circles remain unchanged. */
export async function installCompanionFrames(D) {
  const response = await fetch('/council/circle-236/companions.json');
  if (!response.ok) throw new Error('Circle companion artwork unavailable');
  const circle = await response.json();
  if (circle.number !== 236 || circle.status !== 'OPEN' || circle.companions.length !== 7) throw new Error('Invalid open Circle');
  const base = D.nodes.yewc233;
  D.nodes.c236 = { ...D.nodes.c233, name: 'Circle 236', sub: 'OPEN · Fire reference · Tuesday 13 October · 19:30 UK', stateShort: 'OPEN', circle: 236, parent: 'croom', lives: [], actions: [], relations: [], purpose: 'An open Circle. Fire history is separate from the weekly Circle.' };
  D.council.circles[236] = { node: 'c236', number: 236, status: 'open', companions: circle.companions.map((c, i) => {
    D.nodes[c.id] = { ...base, name: c.label, sub: c.kind + ' · Circle 236', circle: 236, parent: 'croom', status: 'LIVE', statusNote: 'Open Circle companion artwork; no attendance claimed.', part: c.kind + ' · Circle 236', practical: 'Supplied Circle artwork · not documentary evidence.', purpose: c.reader ? 'Birch’s source-linked Living Record study is available.' : c.id === 'ely-plane-companion' ? 'Ely’s public-safe research folio is available. Permanent Atlas identity remains unconfirmed.' : 'Its Living Record doorway is not ready. The artwork can be encountered here.', stateShort: 'OPEN', lives: [], actions: [], relations: [{ to: 'croom', dim: 'place', text: 'Return to the same Council' }], sources: ['Ed / TEOTAG supplied Circle 236 artwork'], location: 'A companion frame around the existing Council fire.' };
    return { id: c.id, kind: c.kind, seat: Math.PI / 2 + i * Math.PI / 6, repr: { form: 'circleFrame', artwork: c.artwork, presence: c.presence } };
  }) };
  D.council.active = 236;
  D.council.current = 'c236';
  D.nodes.croom.sub = 'Circle 236 · OPEN';
  D.nodes.croom.purpose = 'The Council room persists. These companions belong to the open Circle 236. Council Fire: Fire reference · Tuesday 13 October · 19:30 UK.';
  D.nodes.croom.relations = circle.companions.map(c => ({ to: c.id, dim: 'place', text: c.label }));
  const byId = new Map(circle.companions.map(c => [c.id, c]));
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-circle-reader]')) return;
    const params = new URLSearchParams({ recordReturn: JSON.stringify({ route: 'council', realm: 'canopy', contextId: 'council-of-life/circle-236', appearanceId: 'birch-companion', mode: 'spatial', focusTarget: 'birch-companion' }) });
    window.parent.location.assign('/review/library/notion/3f315b58-480d-814c-a056-cb6c7b4f7f33?' + params);
  });
  // Circle 236 only: the legacy desktop peek handler (classic-1) consumes the first click
  // on #panel.peek in document capture. Window capture runs first, so open the panel here
  // and let that same click reach the companion action.
  window.addEventListener('click', event => {
    const panel = event.target instanceof Element && event.target.closest('#panel.peek');
    if (panel && event.target.closest('button, a, [data-circle-reader]')) panel.classList.remove('peek');
  }, true);
  // The stillness pause (entry.js startQuiet) sets body[data-q], which makes every panel
  // control invisible and untappable until the 3D canvas is touched. Keep companion controls live.
  const style = document.createElement('style');
  style.textContent = 'body.grace-p.g-arriving aside#panel,body[data-q] aside#panel #grab,body[data-q] aside#panel .pbody>*{opacity:1!important;pointer-events:auto!important}#tetol-welcome{display:none!important}#council-return{left:16px!important;right:auto!important;bottom:16px!important;width:max-content;max-width:calc(100vw - 32px)}body.phone[data-sheet=mid] #council-return,body.phone[data-sheet=full] #council-return{display:none!important}' + (window.parent !== window ? '#council-return{display:none!important}' : ''); document.head.append(style);
  document.title = 'Circle 236 · OPEN · Spatial Council';
  const brand = document.getElementById('brandline'); if (brand) { const label = 'Circle 236 · OPEN · supplied companion artwork'; brand.textContent = label; new MutationObserver(() => { if (brand.textContent !== label) brand.textContent = label; }).observe(brand, { childList: true }); }
  D.circleFrameCompanions = circle.companions;
  const returnLink = document.getElementById('council-return');
  if (returnLink) { returnLink.href = '/council-of-life?from=spatial-council#next-gathering'; returnLink.target = '_top'; returnLink.textContent = 'Return to Circle 236'; }
  return circle;
}

export function companionPanel(D, id, esc) {
  const items = D.circleFrameCompanions;
  const c = items.find(c => c.id === id);
  if (!c && id !== 'croom' && id !== 'c236') return null;
  return `<button type="button" class="grab" id="grab" aria-expanded="false" aria-label="Show more about this place"><i></i></button><div class="pbody"><h2 class="pname">${c ? esc(c.label) : 'Circle 236'}</h2><p class="psub">OPEN · Fire reference · Tuesday 13 October · 19:30 UK</p>${c ? `<img data-circle-artwork="${c.id}" src="${c.artwork}" alt="${esc(c.label)} · supplied Circle artwork" style="width:100%;height:auto"><p>${esc(c.kind)} · artwork, not documentary evidence.</p>${c.reader ? '<button class="act" data-circle-reader>Open Birch’s Living Record study</button>' : c.id === "ely-plane-companion" ? '<a class="act" href="/ancient-friends/bishop-of-elys-plane.html?from=spatial" target="_top">Meet Bishop of Ely’s Plane →</a>' : '<p>Living Record doorway not ready.</p>'}<button class="act" data-go="croom">Return to Council</button>` : items.map(c => `<button class="act" data-go="${c.id}">${esc(c.label)}</button>`).join('')}<a class="act" href="https://t.me/s33dlife" target="_blank" rel="noopener">Gather at the Fire · Council group</a></div>`;
}

/** Symbolic presence, separate from the supplied frame; every mesh uses the same appearance ID. */
export function buildCompanionPresence({ THREE, add, std, BUILD }, g, repr, id) {
  const r = repr.presence;
  if (!r) return;
  const presence = new THREE.Group(); presence.name = id + '_presence';
  presence.position.z = .34; g.add(presence);
  const mesh = (geometry, color, name, position, scale) => {
    const m = add(new THREE.Mesh(geometry, std({ color })), id + '_' + name, id, presence);
    m.position.set(...position); if (scale) m.scale.set(...scale); return m;
  };
  if (r.form === 'toucan') {
    mesh(new THREE.SphereGeometry(.16, 12, 8), 0x20252a, 'body', [0,.64,0], [.8,1.25,.85]);
    mesh(new THREE.SphereGeometry(.12, 12, 8), 0xeee3bf, 'throat', [0,.71,.08], [.7,1,.5]);
    mesh(new THREE.SphereGeometry(.095, 12, 8), 0x20252a, 'head', [0,.84,0]);
    mesh(new THREE.SphereGeometry(.14, 12, 8), 0xeab342, 'bill', [0,.84,.16], [.55,.5,1.35]);
    mesh(new THREE.SphereGeometry(.05, 8, 6), 0x29252a, 'bill_tip', [0,.84,.32], [1,.8,1]);
    for (const side of [-1,1]) {
      mesh(new THREE.SphereGeometry(.014, 8, 6), 0x131314, 'eye', [side*.075,.87,.05]);
      mesh(new THREE.CylinderGeometry(.012,.012,.09,6), 0x817259, 'foot', [side*.05,.48,0]);
    }
  } else {
    BUILD[r.form](presence, r, id);
    if (r.form === 'sapling') {
      presence.children.find(m => m.name === id + '_stem').material.color.setHex(r.bark);
      if (r.bark === 0xe5ded0) for (const y of [.52,.61,.69]) mesh(new THREE.BoxGeometry(.037,.012,.012), 0x57554e, 'bark_mark', [0,y,.025]);
    }
    if (r.form === 'herb' && r.fruit) for (const [x,y,z] of [[-.09,.68,.15],[.09,.73,.14],[0,.62,.2]]) mesh(new THREE.SphereGeometry(.06,10,8), r.fruit, 'fruit', [x,y,z]);
  }
  // The existing wooden seat provides a forgiving tap area as well as the model's meshes.
  return presence;
}
