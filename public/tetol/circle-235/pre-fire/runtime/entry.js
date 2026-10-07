
const D = window.TETOL;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const state = { thread: null, current: 'overview', history: [], mode: '3d', motion: !matchMedia('(prefers-reduced-motion: reduce)').matches };
const X = window.TETOL_X || {}; let quietEnd = null;
const mobileSheet = () => X.D && document.body.classList.contains('phone');

/* ---------- Shared UI (works without 3D) ---------- */
const chip = (k, map = D.STATUS) => `<span class="chip ${k}"><i aria-hidden="true">${map[k].glyph}</i>${map[k].label}</span>`;
const pathOf = (id) => { const p = []; let n = id; while (n) { p.unshift(n); n = D.nodes[n].parent; } return p; };
const shortName = (id) => { const n = D.nodes[id]; return id === 'overview' ? 'TETOL' : (n.part && n.anatomy ? n.part.replace('The ', '') : n.name); };

const SCALE = { origin: 'The origin of the Tree', organism: 'The whole organism', place: 'A place in the tree', record: 'A living record' };
const ABOUT = { origin: 'What this is', organism: 'What this is', place: 'What this place is', record: 'What this record is' };
const DIMS = [['web', 'Web of Life · relationship'], ['time', 'Spiral of Life · linked through time'], ['place', 'Place · where it sits'], [undefined, 'Connected to']];
const gl = (s) => `<i class="g ${s}" aria-hidden="true">${D.STATUS[s].glyph}</i>`;
function relBtn(r) {
  const t = D.nodes[r.to], dashed = r.kind === 'proposed' || r.pending;
  return `<button type="button" class="rel ${dashed ? 'proposed' : ''}" data-go="${r.to}"><b>${gl(t.status)}${esc(t.name)}${t.sub && t.scale === 'record' ? ` <small>${esc(t.sub)}</small>` : ''}${r.pending ? '<span class="notyet">not yet</span>' : r.kind === 'proposed' ? '<span class="notyet">proposed</span>' : ''}</b><span>${esc(r.text)}</span><em aria-hidden="true">→</em></button>`;
}
function threadCard(id) {
  if (state.thread == null) return id === 'overview' ? `<button type="button" class="startthread" id="startthread"><b>Follow a living thread</b><span>${esc(D.thread.title)} — through canopy, roots, ring and Heartwood</span></button>` : '';
  const st = D.thread.steps, i = state.thread, s = st[i], on = s.id === id, nx = st[i + 1];
  const main = on ? (nx ? `<button type="button" class="next" data-go="${nx.id}">Follow to ${esc(D.nodes[nx.id].name)} →</button>` : `<button type="button" class="next" id="endthread">End the thread</button>`)
    : `<button type="button" class="next" data-go="${s.id}">Return to ${esc(D.nodes[s.id].name)}</button>`;
  return `<div class="thread" role="region" aria-label="Living thread"><p class="eyebrow">Living thread · ${i + 1} of ${st.length}</p>
    <p>${esc(on ? s.say : 'You stepped off the thread. It continues at ' + D.nodes[s.id].name + '.')}</p>
    <div class="tbtns">${main}<button type="button" id="leavethread">Leave thread</button></div>
    <div class="tsteps" aria-hidden="true">${st.map((_, k) => `<i class="${k <= i ? 'done' : ''}"></i>`).join('')}</div></div>`;
}
function timeGlimpse() {
  const T = D.time, d = T.day(T.todayIso()), cy = T.cycles[233];
  return `<p class="tglimpse">${esc(d.moon.split(' · ')[0])} · ${esc(d.sun.split(' · ')[0])} · ${d.cq.coef} ${esc(d.cq.nawal)}<small>calculated · not yet verified</small><button type="button" data-go="${cy.node}">When Circle ${(D.council.circles[233] || {}).number || 233} lives →</button></p>`;
}
function renderTimeQuiet(num) {
  const T = D.time, cy = T.cycles[num]; if (!cy) return '';
  const open = !cy.held && cy.status !== 'remembered';
  const vq = (d) => `<ul class="tvq"><li><i>Moon</i>${esc(d.moon)}</li><li><i>Sun · Earth</i>${esc(d.sun)}</li><li><i>Chol Q’ij</i><span class="cq">${d.cq.coef} ${esc(d.cq.nawal)}</span>${d.cq.gloss ? ` · <em>${esc(d.cq.gloss)}</em>` : ''}</li>${d.reading ? `<li><i>Reading</i>${esc(d.reading.text)} · ${esc(d.reading.source)}</li>` : ''}</ul>`;
  const step = (label, iso, missing, cls = 'unknown') => iso ? `<li><b>${label}</b><span class="when">${esc(T.day(iso).greg)}</span>${vq(T.day(iso))}</li>` : `<li class="${cls}"><b>${label}</b><span class="when">${missing}</span></li>`;
  const planned = cy.planned && !cy.held ? `<li><b>First planned</b><span class="when">${esc(cy.planned.note)}</span>${vq(T.day(cy.planned.iso))}</li>` : '';
  const explored = open && (cy.explored || []).length ? `<details><summary>Dates explored · ${cy.explored.length} · none confirmed</summary><div class="texp"><p>${esc(cy.exploredNote)} In date order, not ranked.</p>${cy.explored.map((iso) => { const d = T.day(iso); return `<div><b>${esc(d.greg.replace(/ 2026$/, ''))}</b>${vq(d)}</div>`; }).join('')}</div></details>` : '';
  const ppl = (cy.people || []).length ? `<div class="tppl"><h5>People</h5>${cy.people.map((p) => `<p><b>${esc(p.who)}</b> · ${p.threads.map(esc).join(' · ')}<br>${esc(p.toward)}</p>`).join('')}<p>No calendar meanings are assigned to anyone. Personal calendar information: none held.</p></div>`
    : `<div class="tppl"><h5>People</h5><p>No contributions recorded. Personal calendar information: none held.</p></div>`;
  return `<section class="tquiet" aria-label="Time, Circle ${(D.council.circles[num] || {}).number || num}">
    <h4>Time · Circle ${(D.council.circles[num] || {}).number || num}</h4>
    <p class="tq">${open ? 'What kind of day are we considering gathering within?' : 'What kind of time did this Circle live within?'}</p>
    <ol class="tline">${step('Invitation drafted', cy.drafted, 'To recover')}${step('Invitation shared', cy.shared, 'To recover')}${planned}${step('Gathering', cy.held, open ? 'Not yet held · no date confirmed' : 'Date to recover', open ? 'open' : 'unknown')}</ol>
    ${explored}${ppl}
    <p class="tfoot">Moon · Sun and Earth · Chol Q’ij · People are separate voices, not predictions. Moon phases are approximate. Chol Q’ij days are calculated (GMT correlation 584283) and not yet verified; day-name glosses are to confirm. <a href="https://thefourpillars.net/" target="_blank" rel="noopener">The Four Pillars</a> (Mark Elmy) is one practical reference, not the definitive voice of the tradition. No readings are attached. ${esc(T.provenance)}</p>
  </section>`;
}
function renderTime(num, compact) {
  if (X.G && !compact) return renderTimeQuiet(num);
  const T = D.time, cy = T.cycles[num]; if (!cy) return '';
  const voices = (d) => `<dl class="tv">
    <dt>Moon</dt><dd>${esc(d.moon)}</dd>
    <dt>Sun · Earth</dt><dd>${esc(d.sun)}</dd>
    <dt>Chol Q’ij</dt><dd><span class="cq">${d.cq.coef} ${esc(d.cq.nawal)}</span>${d.cq.gloss ? ` · <em>${esc(d.cq.gloss)}</em>` : ''}</dd>
    ${d.reading ? `<dt>Reading</dt><dd>${esc(d.reading.text)}<small>${esc(d.reading.source)} · ${esc(d.reading.kind)}</small></dd>` : ''}
  </dl>`;
  const open = !cy.held && cy.status !== 'remembered';
  if (compact) {
    const d = T.day(T.todayIso());
    return `<section class="tcouncil" aria-label="Time of the Council, today">
      <h4>Time of the Council · today</h4>
      <dl class="tv" style="margin-top:10px">
        <dt>Moon</dt><dd>${esc(d.moon)}</dd>
        <dt>Sun · Earth</dt><dd>${esc(d.sun)}</dd>
        <dt>Chol Q’ij</dt><dd><span class="cq">${d.cq.coef} ${esc(d.cq.nawal)}</span><small>Calculated · not yet verified</small></dd>
      </dl>
      <button type="button" class="rel" data-go="${cy.node}" style="margin-top:12px"><b>Circle ${(D.council.circles[num] || {}).number || num}’s Time record</b><span>${open ? 'Not yet gathered · dates explored' : 'Drafted · shared · gathered'}</span><em aria-hidden="true">→</em></button>
    </section>`;
  }
  const moment = (label, iso, missing) => iso ? `<div class="tmoment"><b>${label}</b><span>${esc(T.day(iso).greg)}</span>${voices(T.day(iso))}</div>`
    : `<div class="tmoment unknown"><b>${label}</b><span>${missing}</span></div>`;
  const explored = open && (cy.explored || []).length ? `<div class="tmoment"><b>Dates explored</b><span>${esc(cy.exploredNote || 'Not confirmed as meeting times.')} In date order, not ranked.</span></div>`
    + cy.explored.map((iso) => { const d = T.day(iso); return `<div class="tmoment"><b>${esc(d.greg.replace(/ 2026$/, ''))}</b>${voices(d)}</div>`; }).join('') : '';
  const planned = cy.planned && !cy.held ? `<div class="tmoment"><b>First planned gathering</b><span>${esc(cy.planned.note)}</span>${voices(T.day(cy.planned.iso))}</div>` : '';
  const ppl = (cy.people || []).length ? `<div class="tmoment"><b>People</b><span>Conversations gathering around this Circle. No calendar meanings are assigned to anyone.</span>
    <dl class="tv">${cy.people.map((p) => `<dt>${esc(p.who)}</dt><dd>${p.threads.map(esc).join(' · ')}<small>${esc(p.toward)} Conversation with ${esc(p.with)}, ${esc(T.day(p.when).greg.replace(/^\w+,? /, ''))}.</small></dd>`).join('')}</dl><span>Personal calendar information: none held.</span></div>`
    : `<div class="tmoment unknown"><b>People</b><span>No contributions recorded. Personal calendar information: none held.</span></div>`;
  return `<section class="tcouncil" aria-label="Time of the Council, Circle ${(D.council.circles[num] || {}).number || num}">
    <h4>Time of the Council · Circle ${(D.council.circles[num] || {}).number || num}</h4>
    <p class="tq">${open ? 'What kind of day are we considering gathering within?' : 'What kind of time did this Circle live within?'}</p>
    <p class="tvoices">Moon · Sun and Earth · Chol Q’ij · People. Separate voices. Lenses, not predictions.</p>
    ${moment('Invitation drafted', cy.drafted, 'To recover')}${moment('Invitation shared', cy.shared, 'To recover')}${planned}
    ${moment('Council gathered', cy.held, open ? 'Not yet held · no date confirmed' : 'Date to recover')}${explored}
    ${ppl}
    <p class="tfoot">Moon phases are approximate. Chol Q’ij days are calculated (GMT correlation 584283) and not yet verified; day-name glosses are to confirm. <a href="https://thefourpillars.net/" target="_blank" rel="noopener">The Four Pillars</a> (Mark Elmy) is one practical reference, not the definitive voice of the tradition. No readings are attached. ${esc(T.provenance)}</p>
  </section>`;
}
function renderPanel() {
  const id = state.current, n = D.nodes[id];
  const crumbs = pathOf(id).map((p, i, a) => i === a.length - 1
    ? `<span aria-current="location">${esc(shortName(p))}</span>`
    : `<button type="button" data-go="${p}">${esc(shortName(p))}</button><span aria-hidden="true">›</span>`).join('');
  const acts = n.actions.map((a, i) => a.go
    ? `<button type="button" class="act" data-go="${a.go}"><b>${esc(a.label)} →</b><small>${esc(a.sub)}</small></button>`
    : a.href
    ? `<a class="act ${i ? 'secondary' : ''}" href="${a.href}" target="_blank" rel="noopener"><b>${esc(a.label)} ↗</b><small>${esc(a.sub)}</small></a>`
    : `<span class="act pending" aria-disabled="true"><b>${esc(a.label)}</b><small>${esc(a.sub && a.sub !== 'Destination pending' ? a.sub + ' · destination pending' : 'Destination pending')}</small></span>`).join('');
  const lives = n.lives.length ? `<div class="sec"><h4>What lives here</h4><ul class="lives">${n.lives.map((l) =>
    `<li><i class="${l.status}" aria-hidden="true">${D.STATUS[l.status].glyph}</i><span>${l.to ? `<button type="button" data-go="${l.to}">${esc(l.text)}</button>`
      : l.href ? `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.text)} ↗</a>` : esc(l.text)}<span class="sr"> — ${D.STATUS[l.status].label}</span></span></li>`).join('')}</ul></div>` : '';
  const where = n.where ? `<div class="sec"><h4>Where it lives</h4>${n.where.map((w) => `<div class="strow"><span>${esc(w.k)}</span><p class="wv">${gl(w.status)}${esc(w.v)}</p></div>`).join('')}</div>` : '';
  const spiral = n.spiral ? `<div class="sec"><h4>${esc(n.spiralTitle || 'Its place in time · Year › Season › Moon › Council')}</h4><ol class="spiral">${n.spiral.map((s) =>
    `<li><b>${esc(s.k)}</b><span>${s.status ? gl(s.status) : ''}${s.to ? `<button type="button" data-go="${s.to}">${esc(s.v)}</button>` : esc(s.v)}</span></li>`).join('')}</ol></div>` : '';
  const hasDims = n.relations.some((r) => r.dim);
  const rels = hasDims ? DIMS.map(([d, label]) => { const list = n.relations.filter((r) => r.dim === d); return list.length ? `<div class="sec"><h4>${label}</h4><div class="rels">${list.map(relBtn).join('')}</div></div>` : ''; }).join('')
    : `<div class="sec"><h4>${id === 'overview' ? 'Parts of the tree' : 'Connected to'}</h4><div class="rels">${n.relations.map(relBtn).join('')}</div></div>`;
  const lensSec = n.lenses ? (() => { const prev = state.history[state.history.length - 1], via = n.lenses.find((l) => (l.from || []).includes(prev));
    return `<div class="sec"><h4>One record · ways in</h4><div class="rels">${n.lenses.map((l) => `<button type="button" class="rel ${l === via ? 'via' : ''}" data-go="${l.to}"><b>${esc(l.k)}${l === via ? '<span class="notyet">you came this way</span>' : ''}</b><span>${esc(l.v)}</span><em aria-hidden="true">→</em></button>`).join('')}</div></div>`; })() : '';
  const notes = (n.notes || []).map((x) => `<div class="note ${x.status}"><i aria-hidden="true">${D.STATUS[x.status].glyph}</i><span>${x.status === 'UNRESOLVED' ? '<b>Unresolved · </b>' : x.status === 'PROPOSED' ? '<b>Proposed · </b>' : ''}${esc(x.text)}</span></div>`).join('');
  const where0 = n.room ? 'Inside the Tree' : n.scale === 'organism' ? 'Outside the Tree' : n.scale === 'origin' ? 'Where the Tree comes from' : n.scale === 'place' ? 'A place in the Tree' : 'A living record';
  const timeSec = n.time && D.time ? (X.G && id === 'croom' ? '' : renderTime(n.time, id === 'croom')) : '';
  const pill = id === 'c233' || id === 'croom' ? `<p class="livepill ${circle().key}" role="status"><i aria-hidden="true"></i>${esc(circle().long)}</p>` : '';
  $('#panel').innerHTML = `${X.D ? `<button type="button" class="grab" id="grab" aria-expanded="${document.body.dataset.sheet && document.body.dataset.sheet !== 'peek'}" aria-label="Show more about this place"><i></i></button>` : ''}<div class="pbody">
    <p class="eyebrow">${where0}</p>
    ${id === 'overview' ? '' : `<nav class="crumbs" aria-label="Location">${crumbs}</nav>`}
    ${threadCard(id)}
    ${n.part ? `<p class="eyebrow part">${esc(n.part)}</p>` : ''}
    <h2 class="pname" tabindex="-1" id="pname">${esc(n.name)}</h2>
    ${n.sub ? `<p class="psub">${esc(n.sub)}</p>` : ''}
    ${X.G && id === 'croom' && D.time ? timeGlimpse() : ''}
    ${n.question ? `<p class="pq">“${esc(n.question)}”</p>` : ''}
    <p class="ppractical">${esc(n.practical)}</p>
    ${pill}
    <p class="ppurpose">${esc(n.purpose)}</p>
    ${n.actions.length ? `<div class="actions">${acts}</div>` : ''}
    ${timeSec}
    ${lensSec}
    ${n.relations.length ? `<div class="sec"><h4>${id === 'overview' ? 'Go into the Tree' : 'Paths from here'}</h4><div class="rels">${n.relations.map(relBtn).join('')}</div></div>` : ''}
    <details class="more"><summary>More about this ${n.scale === 'record' ? 'record' : 'place'}</summary>
      <p class="ploc">${esc(n.location)}</p>
      ${notes ? `<div class="notes">${notes}</div>` : ''}
      ${where}${spiral}${lives}
      <div class="sec"><h4>Status</h4>
        <div class="strow"><span>Record</span><div>${chip(n.status)}<p>${esc(n.statusNote)}</p></div></div>
        <div class="strow"><span>Place in the tree</span><div>${chip(n.placement, D.PLACEMENT)}<p>${esc(n.placementNote)}</p></div></div>
      </div>
      <div class="sec"><h4>Read from</h4><div class="src">${n.sources.map(esc).join('<br>')}</div></div>
      <div class="sec"><h4>Reality key</h4>
        ${Object.keys(D.STATUS).map((k) => `<div class="keyrow">${chip(k)}<span>${D.STATUS[k].desc}</span></div>`).join('')}
        <div class="keyrow"><span class="chip PROPOSED"><i aria-hidden="true">┄</i>Dashed</span><span>Proposed, or has not happened yet.</span></div>
      </div>
    </details>
    <div class="nav">
      <button type="button" id="back" ${state.history.length ? '' : 'disabled'}>← Back${state.history.length ? ' to ' + esc(shortName(state.history[state.history.length - 1])) : ''}</button>
      ${id === 'overview' ? '' : '<button type="button" id="home">Step back out to the whole Tree</button>'}
      <button type="button" id="copylink" class="quiet">Copy link</button>
    </div>
    <p class="copied" id="copied" aria-live="polite"></p>
  </div>`;
  $('#panel').scrollTop = 0;
}
const SHEET = ['peek', 'mid', 'full'];
function setSheet(s) { document.body.dataset.sheet = s; const g = $('#grab'); if (g) { g.setAttribute('aria-expanded', s !== 'peek'); g.setAttribute('aria-label', s === 'full' ? 'Lower the panel' : 'Show more about this place'); } }

function renderList() {
  const item = (id) => { const n = D.nodes[id];
    return `<button type="button" class="litem" data-go="${id}" ${id === state.current ? 'aria-current="true"' : ''}>
      <span class="nm">${esc(n.name)}${n.part && n.anatomy ? `<small>${esc(n.part)}</small>` : n.sub ? `<small>${esc(n.sub)}</small>` : ''}</span>
      <span class="pr">${esc(n.practical)}</span><span class="st">${chip(n.status)}</span></button>`; };
  const tree = (arr) => arr.map((x) => `<li>${item(x.id)}${x.children ? `<ul>${tree(x.children)}</ul>` : ''}</li>`).join('');
  $('#listtree').innerHTML = `<li>${item('overview')}<ul>${tree(D.listTree)}</ul></li>`;
  $('#listapart').innerHTML = D.listApart.map((id) => `<li>${item(id)}</li>`).join('');
}

function renderLineage() {
  D.lineage[0].note = circle().short; D.lineage[0].status = circle().key === 'remembering' ? 'LIVE' : 'CONNECTED';
  $('#lineage').innerHTML = D.lineage.map((s) => `<li><button type="button" class="step" data-go="${s.node}" ${s.node === state.current ? 'aria-current="true"' : ''}>
    <b>${esc(s.label)}</b><span><i class="${s.status}" aria-hidden="true">${D.STATUS[s.status].glyph}</i>${esc(s.note)}</span></button></li>`).join('');
}

function go(id, { push = true, focus = true } = {}) {
  if (!D.nodes[id]) return;
  if (quietEnd) quietEnd();
  if (X.D) document.body.dataset.sheet = 'peek';
  const prev = state.current;
  if (state.thread != null) { const st = D.thread.steps; const next = st.findIndex((step, i) => i > state.thread && step.id === id); if (next !== -1) state.thread = next; }
  if (id !== 'overview') $('#hint')?.classList.add('gone');
  setRealm(id); syncHash(id);
  if (push && id !== state.current) state.history.push(state.current);
  state.current = id;
  renderPanel(); renderList(); renderLineage(); scene3d?.select(id, prev);
  if (focus && !mobileSheet()) $('#pname')?.focus({ preventScroll: true });
}
function back() { if (state.history.length) go(state.history.pop(), { push: false }); }

addEventListener('tetol:begin-thread', () => { state.thread = 0; });

document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]'); if (g) { go(g.dataset.go); return; }
  if (e.target.closest('#back')) back();
  if (e.target.closest('#home')) go('overview');
  if (e.target.closest('#startthread')) { state.thread = 0; renderPanel(); $('#panel .next')?.focus(); }
  if (e.target.closest('#leavethread') || e.target.closest('#endthread')) { state.thread = null; renderPanel(); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });

function setMode(m) {
  state.mode = m;
  $('#view3d').hidden = m !== '3d'; $('#viewlist').hidden = m !== 'list';
  $('#m3d').setAttribute('aria-pressed', m === '3d'); $('#mlist').setAttribute('aria-pressed', m === 'list');
  $('#reset').hidden = m !== '3d';
}
$('#m3d').onclick = () => setMode('3d');
$('#mlist').onclick = () => setMode('list');
document.body.classList.toggle('still', !state.motion);
$('#motion').onclick = () => { state.motion = !state.motion; document.body.classList.toggle('still', !state.motion); if (!state.motion && stage._controls) stage._controls.autoRotate = false; $('#motion').setAttribute('aria-pressed', state.motion); $('#motion').textContent = 'Motion: ' + (state.motion ? 'on' : 'off'); };
$('#motion').setAttribute('aria-pressed', state.motion); $('#motion').textContent = 'Motion: ' + (state.motion ? 'on' : 'off');
$('#reset').onclick = () => scene3d?.select(state.current, true);
{ const NAMES = { A: 'Quiet arrival at the Council', B: 'Arrive at a seat, facing the fire', C: 'The Hearth leads the light', D: 'Phone: Tree first, bottom sheet', E: 'Contextual labels', F: 'Council memory marks', G: 'Time as a quiet line' };
  $('#xlist').innerHTML = Object.keys(NAMES).map((k) => `<label><b>${k}</b><input type="checkbox" value="${k}" ${X[k] ? 'checked' : ''}><span>${NAMES[k]}</span></label>`).join('');
  const xb = $('#xbtn'), xp = $('#xpanel');
  xb.onclick = () => { xp.hidden = !xp.hidden; xb.setAttribute('aria-expanded', !xp.hidden); };
  const setAll = (v) => xp.querySelectorAll('input').forEach((i) => { i.checked = v; });
  $('#xall').onclick = () => setAll(true); $('#xnone').onclick = () => setAll(false);
  $('#xapply').onclick = () => { const on = [...xp.querySelectorAll('input:checked')].map((i) => i.value).join(''); try { localStorage.setItem(window.TETOL_XK, on); } catch (e) {} const u = new URL(location.href); u.searchParams.delete('x'); history.replaceState(null, '', u); location.reload(); };
  const menu = (o) => { document.body.classList.toggle('menuopen', o); $('#mark').setAttribute('aria-expanded', o); if (!o) { xp.hidden = true; xb.setAttribute('aria-expanded', false); } };
  $('#mark').onclick = () => menu(!document.body.classList.contains('menuopen'));
  document.addEventListener('pointerdown', (e) => { if (document.body.classList.contains('menuopen') && !e.target.closest('header, #mark, #xpanel')) menu(false); });
  ['#m3d', '#mlist', '#reset'].forEach((s) => $(s).addEventListener('click', () => mobileSheet() && menu(false)));
  let gy = null;
  document.addEventListener('pointerdown', (e) => { if (e.target.closest('#grab')) { gy = e.clientY; e.preventDefault(); } });
  document.addEventListener('pointerup', (e) => { if (gy == null) return; const dy = e.clientY - gy; gy = null; const i = Math.max(0, SHEET.indexOf(document.body.dataset.sheet || 'peek'));
    setSheet(SHEET[Math.abs(dy) < 12 ? (i + 1) % 3 : dy < 0 ? Math.min(2, i + (dy < -200 ? 2 : 1)) : Math.max(0, i - (dy > 200 ? 2 : 1))]); });
  document.addEventListener('click', (e) => { if (e.target.closest('#grab') && e.detail === 0) { const i = Math.max(0, SHEET.indexOf(document.body.dataset.sheet || 'peek')); setSheet(SHEET[(i + 1) % 3]); }
    if (mobileSheet() && e.target.closest('#pname') && (document.body.dataset.sheet || 'peek') === 'peek') setSheet('mid'); });
  if (X.D) document.body.dataset.sheet = 'peek'; }

const AT = (() => { const q = new URLSearchParams(location.search).get('at'); const t = q && Date.parse(q); return t ? t - Date.now() : 0; })();
function circle() {
  const t = Date.now() + AT, c = D.circle233;
  if (!c.start) return { key: 'awaiting', level: 0.16, short: c.openShort || 'Awaiting gathering · no date confirmed', long: c.openLong || 'Awaiting its gathering · no date confirmed yet' + (c.explored ? ` (${c.explored} explored)` : '') };
  const day = new Date(c.start).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Europe/London' });
  if (t < c.start) return { key: 'upcoming', level: 0.55, short: (c.label ? c.label + ' · ' : 'Upcoming · ') + day, long: (c.label ? c.label + ' · ' : 'Gathers ') + day + ' UK time' + (c.preview ? ' · preview date' : '') };
  if (t < c.end) return { key: 'now', level: 1.3, short: c.label ? c.label + ' · gathering now' : 'Gathering now', long: (c.label ? c.label + ' · ' : '') + 'Gathering now · the fire is lit' };
  return { key: 'remembering', level: 0.3, short: 'Remembering · record growing', long: 'Gathered · the fire rests, the record keeps growing' };
}
const SEASON = (() => { const x = Date.now() + AT, y = new Date(x).getUTCFullYear(), eq = [Date.UTC(y, 2, 20), Date.UTC(y, 5, 21), Date.UTC(y, 8, 22), Date.UTC(y, 11, 21)];
  return ['Winter', 'Spring', 'Summer', 'Autumn'][eq.filter((e) => x >= e).length % 4]; })();
$('#brandline').textContent = `TETOL 0.9.15-dev · Circle ${(D.councilPresent && D.councilPresent.number) || 234} · not published · ${SEASON} · not canonical`;
let circleKey = circle().key;
setInterval(() => { const k = circle().key; if (k !== circleKey) { circleKey = k; renderPanel(); renderLineage(); scene3d?.circle(); } }, 20000);
const hashId = () => { const h = decodeURIComponent(location.hash.slice(1)); return D.nodes[h] ? h : null; };
function syncHash(id) { const want = id === 'overview' ? '' : '#' + id; if (location.hash !== want) history.replaceState(null, '', location.pathname + location.search + want); }
window.addEventListener('hashchange', () => { const h = hashId() || 'overview'; if (h !== state.current) go(h); });
document.addEventListener('click', async (e) => {
  if (!e.target.closest('#copylink')) return;
  syncHash(state.current);
  const url = location.href, out = $('#copied');
  try { await navigator.clipboard.writeText(url); out.textContent = 'Link copied · ' + (state.current === 'overview' ? 'the whole tree' : '#' + state.current); }
  catch { out.textContent = url; }
});
const REALM = {
  overview: { acc: 'hsl(42, 95%, 55%)', period: 3600 },
  roots: { acc: 'hsl(120, 45%, 45%)', period: 4200, whisper: 'Every root begins in silence.' },
  trunk: { acc: 'hsl(28, 70%, 50%)', period: 3600, whisper: 'The forest remembers slowly.' },
  canopy: { acc: 'hsl(195, 60%, 50%)', period: 3200, whisper: 'Light gathers patiently in the canopy.' },
  crown: { acc: 'hsl(45, 100%, 60%)', period: 2800 },
  moonroot: { acc: 'hsl(220, 30%, 75%)', period: 4200 },
  staff: { acc: 'hsl(15, 80%, 55%)', period: 3600 },
  monthly: { acc: 'hsl(42, 95%, 55%)', period: 3600 },
};
const realmOf = (id) => { let n = id; while (n && !REALM[n]) n = D.nodes[n].parent; return n || 'overview'; };
let whisperTimer = 0;
function setRealm(id) {
  const r = realmOf(id), prev = state.realm; state.realm = r; state.period = REALM[r].period;
  const root = document.documentElement.style; root.setProperty('--acc', REALM[r].acc); root.setProperty('--pulse-duration', REALM[r].period + 'ms');
  document.querySelectorAll('.spine button').forEach((b) => b.setAttribute('aria-current', b.dataset.lv === r));
  const w = $('#whisper');
  if (D.nodes[id].room === true && D.nodes[state.current]?.room !== true && D.council.active === 233 && w) {
    clearTimeout(whisperTimer); if (X.A) { w.classList.remove('on'); return; } w.textContent = D.nodes.croom.question; w.classList.add('on');
    whisperTimer = setTimeout(() => w.classList.remove('on'), 9000); return;
  }
  if (r !== prev && REALM[r].whisper && w) {
    clearTimeout(whisperTimer); w.textContent = REALM[r].whisper; w.classList.add('on');
    whisperTimer = setTimeout(() => w.classList.remove('on'), 5200);
  } else if (r !== prev && w) w.classList.remove('on');
}
state.realm = null; setRealm('overview');
let scene3d = null; const stage = document.querySelector('three-d-stage');
const startAt = hashId();
if (startAt) { state.current = startAt; setRealm(startAt); }
renderPanel(); renderList(); renderLineage();
if (!window.WebGLRenderingContext) setMode('list');

/* ---------- 3D rendering layer ---------- */
const { THREE } = await stage.ready;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const mat = {
  bark: new THREE.MeshStandardMaterial({ name: 'bark', color: 0x6a4a33, roughness: 0.95 }),
  root: new THREE.MeshStandardMaterial({ name: 'root', color: 0x3d2c20, roughness: 1 }),
  hollow: new THREE.MeshStandardMaterial({ name: 'heartwood_glow', color: 0x3a1e0c, emissive: 0xc2762a, emissiveIntensity: 0.55, roughness: 0.8 }),
  moss: new THREE.MeshStandardMaterial({ name: 'forest_floor', color: 0x262d1d, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ name: 'canopy_leaf', color: 0x4a6a3a, emissive: 0x1a2a12, emissiveIntensity: 0.6, roughness: 0.9 }),
  leaf2: new THREE.MeshStandardMaterial({ name: 'canopy_leaf_light', color: 0x5a7b45, emissive: 0x1a2a12, emissiveIntensity: 0.6, roughness: 0.9 }),
  gold: new THREE.MeshStandardMaterial({ name: 'golden_ring', color: 0xd9a441, emissive: 0xb8801f, emissiveIntensity: 0.7, roughness: 0.4, metalness: 0.3 }),
  ember: new THREE.MeshStandardMaterial({ name: 'ember_light', color: 0xf2c46a, emissive: 0xf0a040, emissiveIntensity: 1.6, roughness: 0.5 }),
  unlit: new THREE.MeshStandardMaterial({ name: 'ember_unlit', color: 0xb9ac8c, wireframe: true, transparent: true, opacity: 0.55 }),
  lunar: new THREE.MeshStandardMaterial({ name: 'moonroot_silver', color: 0xc7cfdf, emissive: 0x7d8db5, emissiveIntensity: 0.55, roughness: 0.5 }),
  wicker: new THREE.MeshStandardMaterial({ name: 'basket_wicker', color: 0xa27b49, roughness: 0.9, side: THREE.DoubleSide }),
  iron: new THREE.MeshStandardMaterial({ name: 'lantern_iron', color: 0x2a2620, roughness: 0.6, metalness: 0.3 }),
};
{ const warmth = { Winter: 0.05, Spring: 0, Summer: 0.05, Autumn: 0.22 }[SEASON];
  mat.leaf.color.set(0x3f5e34).lerp(new THREE.Color(0x7a6a30), warmth * 0.6); mat.leaf2.color.set(0x56703f).lerp(new THREE.Color(0xa8702e), warmth * 1.4); mat.leaf.emissive.set(0x121c0c); mat.leaf2.emissive.set(0x141c0c); }

mat.lantern = mat.ember.clone(); mat.lantern.name = 'lantern_light';
const tree = new THREE.Group(); tree.name = 'TETOL';
const pickables = [];
function add(mesh, name, node, parent = tree) { mesh.name = name; if (node) { mesh.userData.node = node; pickables.push(mesh); } parent.add(mesh); return mesh; }
function limb(a, b, r0, r1, m, name, node) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, 16);
  const mesh = new THREE.Mesh(g, m);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return add(mesh, name, node);
}

// Ground
add(new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.4, 0.12, 64), mat.moss), 'forest_floor').position.y = -0.06;
add(new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ name: 'far_ground', color: 0x1b2015, roughness: 1 })), 'far_ground').rotation.x = -Math.PI / 2;
tree.getObjectByName('far_ground').position.y = -0.1;

// ── Tree body, grown from an archetype (tetol-archetypes.js · Oak Archetype 01 by default).
// The archetype shapes trunk, bark, limbs, roots and leaves. Anchors, realms and rooms do not depend on it.
const ARCH = (window.TETOL_ARCHETYPES || {})[new URLSearchParams(location.search).get('archetype') || 'oak'] || window.TETOL_ARCHETYPES.oak;
const aRng = ((s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(ARCH.seed);
const aR = (a, b) => a + (b - a) * aRng();
const canvasOf = (w, hh) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; return c; };
function barkTextures(B) {
  // Oak bark: a network of long dark fissures that wander, split and rejoin around narrow ridges.
  const W = 512, HH = 1024, c = canvasOf(W, HH), b = canvasOf(W, HH), g = c.getContext('2d'), k = b.getContext('2d');
  g.fillStyle = B.ridge; g.fillRect(0, 0, W, HH); k.fillStyle = '#b8b8b8'; k.fillRect(0, 0, W, HH);
  for (let x = 0; x < W; x += aR(3, 9)) { g.fillStyle = aRng() < 0.5 ? `rgba(0,0,0,${aR(0.05, 0.18)})` : `rgba(190,160,120,${aR(0.03, 0.09)})`; g.fillRect(x, 0, aR(2, 8), HH); }
  const path = (ctx, pts, w, col) => { for (const o of [0, -W, W]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x + o, y) : ctx.moveTo(x + o, y)); ctx.stroke(); } };
  for (let i = 0; i < B.fissures; i++) {
    const w = aR(...B.fissureWidth), L = aR(...B.fissureLength); let x = aRng() * W, y = aRng() * HH - 200; const pts = [], drift = aR(-0.08, 0.08);
    for (let s = 0; s < L; s += 10) { x += aR(-2.2, 2.2) + drift * 10; y += 10; pts.push([x, y]); }
    path(g, pts.map(([x, y]) => [x - w * 0.55 - 1, y]), 1.6, B.edgeLight);
    path(g, pts, w, B.fissure); path(g, pts, w * 0.45, B.deep); path(k, pts, w * 1.1, '#141414');
    if (aRng() < 0.45) { const [sx, sy] = pts[Math.floor(aRng() * pts.length)], dx = aR(-24, 24), pp = [[sx, sy], [sx + dx * 0.5, sy + aR(8, 18)], [sx + dx, sy + aR(22, 44)]]; path(g, pp, w * 0.6, B.fissure); path(k, pp, w * 0.7, '#1c1c1c'); }
  }
  for (let i = 0; i < 6000; i++) { g.fillStyle = aRng() < 0.55 ? 'rgba(0,0,0,.09)' : 'rgba(210,185,150,.05)'; g.fillRect(aRng() * W, aRng() * HH, 1.4, aR(2, 6)); }
  for (let i = 0; i < 80; i++) { const y = HH - Math.pow(aRng(), 1.7) * HH * B.moss, x = aRng() * W, r = aR(10, 36), gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(72,92,40,.55)'); gr.addColorStop(1, 'rgba(72,92,40,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < B.lichen; i++) { g.fillStyle = 'rgba(160,168,142,.26)'; g.beginPath(); g.ellipse(aRng() * W, aRng() * HH * 0.85, aR(3, 10), aR(2, 7), 0, 0, Math.PI * 2); g.fill(); }
  const map = new THREE.CanvasTexture(c), bump = new THREE.CanvasTexture(b); if ('colorSpace' in map) map.colorSpace = THREE.SRGBColorSpace;
  [map, bump].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; });
  return { map, bump };
}
function taperTube(curve, r0, r1, tub, rad, ridges = 5) {
  const g = new THREE.TubeGeometry(curve, tub, 1, rad, false), p = g.attributes.position, uv = g.attributes.uv, len = curve.getLength(), c = V(0, 0, 0), v = V(0, 0, 0);
  for (let i = 0; i <= tub; i++) { const s = i / tub, r = r0 + (r1 - r0) * Math.pow(s, 0.8); curve.getPointAt(s, c);
    for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r * (1 + 0.07 * Math.sin(j / rad * Math.PI * 2 * ridges + s * 9))).add(c); p.setXYZ(k, v.x, v.y, v.z); uv.setXY(k, j / rad, s * len / 2.8); } }
  g.computeVertexNormals(); return g;
}
function mergeGeos(geos) {
  let n = 0, m = 0; geos.forEach((g) => { n += g.attributes.position.count; m += g.index.count; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = new Uint32Array(m); let o = 0, oi = 0;
  geos.forEach((g) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); const I = g.index.array; for (let i = 0; i < I.length; i++) idx[oi + i] = I[i] + o; o += g.attributes.position.count; oi += I.length; g.dispose(); });
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); G.setIndex(new THREE.BufferAttribute(idx, 1)); return G;
}
const BT = barkTextures(ARCH.bark);
mat.bark = new THREE.MeshStandardMaterial({ name: ARCH.id + '_bark', color: 0xffffff, map: BT.map, bumpMap: BT.bump, bumpScale: 2.4, roughness: 0.93, emissive: 0x0d0704, emissiveIntensity: 0.6 });
BT.map.repeat.set(...ARCH.bark.repeat); BT.bump.repeat.set(...ARCH.bark.repeat);
{ const lm = BT.map.clone(), lb = BT.bump.clone(); [lm, lb].forEach((t) => { t.repeat.set(0.6, 0.5); t.needsUpdate = true; });
  mat.limbBark = new THREE.MeshStandardMaterial({ name: ARCH.id + '_limb_bark', color: 0xe8ddd0, map: lm, bumpMap: lb, bumpScale: 1.0, roughness: 0.93, emissive: 0x0d0704, emissiveIntensity: 0.6 });
  mat.rootBark = mat.limbBark.clone(); mat.rootBark.name = ARCH.id + '_root_bark'; mat.rootBark.color.set(0x9a8472); }
const TK = ARCH.trunk, PR = TK.profile.slice(1, -1);
const trunkR = (y) => { if (y <= PR[0][1]) return PR[0][0]; for (let i = 1; i < PR.length; i++) if (y <= PR[i][1]) { const [r0, y0] = PR[i - 1], [r1, y1] = PR[i], k = (y - y0) / (y1 - y0); return r0 + (r1 - r0) * (k * k * (3 - 2 * k)); } return PR[PR.length - 1][0]; };
const ROOT_ANGLES = Array.from({ length: ARCH.roots.count }, (_, i) => (i / ARCH.roots.count) * Math.PI * 2 + 0.3);
{ const y0 = PR[0][1], y1 = PR[PR.length - 1][1], prof = [new THREE.Vector2(0.001, TK.profile[0][1])];
  for (let i = 0; i <= TK.rings; i++) { const y = y0 + (y1 - y0) * i / TK.rings; prof.push(new THREE.Vector2(trunkR(y), y)); }
  prof.push(new THREE.Vector2(0.001, TK.profile[TK.profile.length - 1][1]));
  const g = new THREE.LatheGeometry(prof, TK.radial), p = g.attributes.position, v = V(0, 0, 0), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k); const y = v.y, r0 = Math.hypot(v.x, v.z), th = Math.atan2(v.z, v.x);
    let r = r0;
    if (r0 > 0.01) {
      let bt = 0; ROOT_ANGLES.forEach((a) => { const d = wrap(th - a); bt += TK.buttress.amount * Math.exp(-d * d / TK.buttress.width) * Math.exp(-Math.max(0, y) / TK.buttress.falloff); });
      const girdle = 1 - 0.85 * Math.exp(-Math.pow((y - 1.6) / 0.16, 2));
      const irr = TK.irregularity * (Math.sin(3 * th + 1.3 + y * 0.8) + 0.6 * Math.sin(5 * th - y * 1.7 + 0.4)) * girdle;
      const F = TK.fissures, x = th * F.count + F.wander * Math.sin(y * 3.1 + th * 2) + 0.3 * Math.sin(y * 7.3 + th * 5), groove = Math.pow(1 - Math.abs(Math.sin(x)), 5);
      const da = wrap(th - TK.doorway.angle), calm = y < TK.doorway.below ? 1 - Math.exp(-da * da / TK.doorway.calm) : 1;
      r = r0 + bt + (irr - F.depth * groove * (0.5 + 0.5 * girdle)) * calm;
      if (y > 0.04 && y < 0.7 && Math.abs(da) < 0.36) { const w = Math.min(1, (0.36 - Math.abs(da)) / 0.1) * Math.min(1, (y - 0.04) / 0.06, (0.7 - y) / 0.1); r = r + (Math.min(r, 0.45) - r) * w; }
    }
    const ly = Math.max(0, y) * Math.max(0, y) / 7.8;
    p.setXYZ(k, Math.cos(th) * r + TK.lean[0] * ly, y, Math.sin(th) * r + TK.lean[1] * ly); }
  g.computeVertexNormals();
  add(new THREE.Mesh(g, mat.bark), 'trunk_heartwood_' + ARCH.id, 'trunk'); }
const arch = new THREE.Shape();
arch.moveTo(-0.17, 0); arch.lineTo(-0.17, 0.4); arch.absarc(0, 0.4, 0.17, Math.PI, 0, true); arch.lineTo(0.17, 0); arch.lineTo(-0.17, 0);
const hollow = add(new THREE.Mesh(new THREE.ExtrudeGeometry(arch, { depth: 0.04, bevelEnabled: false, curveSegments: 24 }), mat.hollow), 'heartwood_hollow_doorway', 'trunk');
hollow.position.set(0, 0.16, 0.47); hollow.rotation.x = -0.16;
{ const lip = new THREE.CatmullRomCurve3([[-0.2, -0.02], [-0.2, 0.38], [-0.14, 0.53], [0, 0.6], [0.14, 0.53], [0.2, 0.38], [0.2, -0.02]].map(([x, y]) => V(x, y, 0.03)));
  const m = add(new THREE.Mesh(taperTube(lip, 0.045, 0.04, 48, 10, 3), mat.limbBark), 'heartwood_doorway_callus_lip', 'trunk'); m.position.copy(hollow.position); m.rotation.copy(hollow.rotation); }

// Seasonal Ring — outermost ring, girdling the trunk
mat.forming = mat.gold.clone(); mat.forming.name = 'seasonal_ring_forming'; mat.forming.transparent = true; mat.forming.opacity = 0.7;
const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.405, 0.04, 16, 72, Math.PI * 1.8), mat.forming), 'seasonal_ring_autumn_equinox_2026_forming', 'ring');
ring.position.y = 1.6; ring.rotation.x = Math.PI / 2; ring.rotation.z = -1.745;
// Empty place where Circle 233's traces would settle. D.traces is empty until the Circle gathers.
add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), mat.unlit), 'ring_trace_place_c233_empty', 'traces').position.set(0.36, 1.6, 0.2);
D.traces.forEach((tr, i) => { const a = 0.5 + i * 0.22; add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), mat.gold), 'ring_trace_' + (i + 1), 'traces').position.set(Math.cos(a) * 0.42, 1.6, Math.sin(a) * 0.42); });

// Roots — Ancient Friends
{ const RT = ARCH.roots;
  ROOT_ANGLES.forEach((a, i) => { const d = V(Math.cos(a), 0, Math.sin(a)), q = V(-d.z, 0, d.x), L = RT.reach[0] + (RT.reach[1] - RT.reach[0]) * ((i * 0.37) % 1), bend = aR(-0.35, 0.35);
    const c = new THREE.CatmullRomCurve3([d.clone().multiplyScalar(RT.start).setY(0.22), d.clone().multiplyScalar(0.95).setY(0.07), d.clone().multiplyScalar(L * 0.5).add(q.clone().multiplyScalar(bend * 0.6)).setY(0.025), d.clone().multiplyScalar(L * 0.8).add(q.clone().multiplyScalar(-bend * 0.3)).setY(0.0), d.clone().multiplyScalar(L).setY(-0.05)]);
    add(new THREE.Mesh(taperTube(c, RT.r0 * (1 - i * 0.03), RT.r1, 48, 12, 4), mat.rootBark), 'root_ancient_friends_' + (i + 1), 'roots'); }); }

// Moonroot — candidate: a small private Personal Hearth at the foot of the trunk, beside the Heartwood hollow
const MH = V(-0.95, 0, 0.9);
for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat.lunar), 'personal_hearth_stone_' + (i + 1), 'moonroot').position.set(MH.x + Math.sin(a) * 0.13, 0.025, MH.z + Math.cos(a) * 0.13); }
add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), mat.lunar), 'moonroot_hearth_ember', 'moonroot').position.set(MH.x, 0.05, MH.z);

// Branches + canopy — Council of Life
const blobs = [[-1.1, 3.9, 0.2, 1.0], [1.1, 3.95, -0.3, 1.0], [0, 4.4, -0.6, 1.05], [-0.4, 3.7, -1.1, 0.9], [0.7, 3.6, -1.0, 0.85], [-1.3, 3.5, -0.9, 0.75], [0.2, 4.35, 0.5, 0.8], [1.5, 3.55, 0.35, 0.7], [-1.9, 3.3, 0.1, 0.55], [1.95, 3.4, -0.4, 0.55], [0.3, 4.8, -0.2, 0.6], [-0.8, 4.5, 0.6, 0.55], [1.0, 4.45, 0.55, 0.5]];
function leafy(r, seed) {
  const g = new THREE.SphereGeometry(r, 56, 36), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const n = v.clone().normalize();
    const d = 1 + 0.09 * Math.sin(n.x * 5 + seed) * Math.sin(n.y * 6 + seed * 1.7) * Math.sin(n.z * 5 + seed * 0.6) + 0.045 * Math.sin(n.x * 13 + n.z * 11 + seed) + 0.03 * Math.sin(n.y * 19 + n.x * 7);
    v.copy(n).multiplyScalar(r * d); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
const canopyMeshes = [];
// Oak leaves: sprig cards drawn from the archetype's leaf form, tinted per season. Instanced, one draw per limb.
function leafOutline(ctx, len, A) {
  const pts = [], n = 44;
  for (let side of [1, -1]) for (let i = 0; i <= n; i++) { const t = side > 0 ? i / n : 1 - i / n, tt = 0.06 + t * 0.94;
    let w = len * 0.3 * Math.pow(Math.sin(Math.PI * Math.pow(tt, 0.72)), 0.9) * (0.62 + 0.38 * Math.abs(Math.cos(tt * Math.PI * A.lobes)));
    if (A.auricles) w += len * 0.05 * Math.exp(-Math.pow((tt - 0.1) / 0.035, 2));
    pts.push([side * w, -tt * len]); }
  ctx.beginPath(); ctx.moveTo(0, 0); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
}
function leafTextures(A) {
  const c = canvasOf(256, 256), g = c.getContext('2d');
  const leaf = (x, y, ang, len, l) => { g.save(); g.translate(x, y); g.rotate(ang); leafOutline(g, len, A); g.fillStyle = `hsl(88 24% ${l}%)`; g.fill();
    g.strokeStyle = `hsl(80 30% ${Math.min(96, l + 10)}%)`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -len * 0.92); g.stroke(); g.restore(); };
  g.strokeStyle = 'hsl(30 25% 45%)'; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 252); g.quadraticCurveTo(116, 150, 132, 40); g.stroke();
  for (let i = 0; i < 9; i++) { const t = 0.15 + i * 0.09, y = 252 - t * 212, x = 128 - 8 * Math.sin(t * 3), sd = i % 2 ? 1 : -1;
    leaf(x, y, sd * aR(0.55, 1.05), aR(62, 88), aR(64, 82)); }
  leaf(132, 44, aR(-0.2, 0.2), 80, 78);
  const one = canvasOf(128, 128), o = one.getContext('2d'); o.translate(64, 122); leafOutline(o, 112, A); o.fillStyle = 'hsl(40 40% 70%)'; o.fill();
  const t1 = new THREE.CanvasTexture(c), t2 = new THREE.CanvasTexture(one); [t1, t2].forEach((t) => { if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; });
  return { sprig: t1, single: t2 };
}
const LT = leafTextures(ARCH.leaf);
const LEAF_TONES = (ARCH.leaf.palette[SEASON] || ARCH.leaf.palette.Summer).map((c) => new THREE.Color(c));
mat.oakLeaf = new THREE.MeshStandardMaterial({ name: ARCH.id + '_leaves', map: LT.sprig, emissiveMap: LT.sprig, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.78, emissive: 0x1c2a10, emissiveIntensity: 0.7 });
mat.innerMass = new THREE.MeshStandardMaterial({ name: ARCH.id + '_canopy_depth', color: ARCH.canopy.innerColor, roughness: 1 });
{ const LB = ARCH.limbs, branchGeos = [], ends = [];
  const grow = (start, dir, len, rise, r0, r1, depth) => { const side = V(-dir.z, 0, dir.x).multiplyScalar(aR(-LB.twist, LB.twist) * len);
    const c = new THREE.CatmullRomCurve3([start.clone(), start.clone().add(dir.clone().multiplyScalar(len * 0.35)).add(V(0, rise * 0.2, 0)).add(side.clone().multiplyScalar(0.35)),
      start.clone().add(dir.clone().multiplyScalar(len * 0.7)).add(V(0, rise * 0.65, 0)).add(side.clone().multiplyScalar(-0.2)), start.clone().add(dir.clone().multiplyScalar(len)).add(V(0, rise, 0))]);
    branchGeos.push(taperTube(c, r0, r1, depth ? 14 : 30, depth ? 8 : 12, depth ? 3 : 5)); return c; };
  const rot = (d, a) => V(d.x * Math.cos(a) - d.z * Math.sin(a), 0, d.x * Math.sin(a) + d.z * Math.cos(a));
  const limbs = [];
  const lowAngles = [Math.PI * 0.97, -0.3];
  for (let k = 0; k < LB.main + 2; k++) {
    const low = k < LB.low, leader = k >= LB.main, phi = low ? lowAngles[k] : k / LB.main * Math.PI * 2 + 0.5 + aR(-0.25, 0.25);
    const dir = V(Math.cos(phi), 0, Math.sin(phi)), y0 = low ? aR(1.85, 2.0) : leader ? 2.55 : aR(...LB.split), r0 = leader ? LB.leader.r0 : LB.r0 * (low ? 1.1 : 1);
    const start = dir.clone().multiplyScalar(trunkR(y0) * 0.45).setY(y0);
    const reach = leader ? aR(0.45, 0.7) : aR(...LB.reach) * (low ? 1.12 : 1), rise = leader ? LB.leader.rise * aR(0.9, 1.05) : low ? aR(0.55, 0.9) : aR(...LB.rise);
    const c = grow(start, dir, reach, rise, r0, LB.r1, 0); limbs.push(c); const group = k;
    ends.push({ p: c.getPointAt(1), g: group }, { p: c.getPointAt(0.78), g: group });
    const ns = Math.round(aR(...LB.secondary));
    for (let s = 0; s < ns; s++) { const t = aR(0.42, 0.86), p = c.getPointAt(t), tg = c.getTangentAt(t); const hd = V(tg.x, 0, tg.z).normalize();
      const d2 = rot(hd, (s % 2 ? 1 : -1) * aR(0.55, 1.15)), r = (r0 + (LB.r1 - r0) * Math.pow(t, 0.8)) * 0.62;
      const c2 = grow(p, d2, aR(...LB.secondaryReach), aR(0.25, 0.75), r, 0.012, 1); ends.push({ p: c2.getPointAt(1), g: group }, { p: c2.getPointAt(0.55), g: group }); }
  }
  for (let i = 0; i < LB.deadwood; i++) { const d = V(-0.55, 0, -0.83).normalize(); grow(d.clone().multiplyScalar(0.12).setY(2.7), d, 1.05, 2.0, 0.05, 0.008, 1); }
  add(new THREE.Mesh(mergeGeos(branchGeos), mat.limbBark), ARCH.id + '_limbs', 'canopy');
  // Leaf clusters on the twig ends, a little outward and upward; gaps remain between clusters.
  const per = Math.round(ARCH.leaf.cards / ends.length), [rx, ry] = ARCH.leaf.clusterRadius, cs = ARCH.leaf.cardSize;
  const card = new THREE.PlaneGeometry(cs, cs), dummy = new THREE.Object3D(), inner = [];
  const byGroup = {}; ends.forEach((e) => (byGroup[e.g] ||= []).push(e));
  Object.values(byGroup).forEach((list, gi) => {
    const inst = new THREE.InstancedMesh(card, mat.oakLeaf, list.length * per); let n = 0;
    list.forEach((e) => { const out = V(e.p.x, 0, e.p.z).normalize();
      if (aRng() < 0.4) inner.push({ p: e.p.clone().add(out.clone().multiplyScalar(-0.06)).add(V(0, -0.04, 0)), r: aR(0.16, 0.26) * ARCH.canopy.innerMass / 0.58 });
      for (let i = 0; i < per; i++) { const u = V(aR(-1, 1), aR(-1, 1), aR(-1, 1)).normalize().add(out.clone().multiplyScalar(0.45)).add(V(0, 0.3, 0)).normalize(), s = 0.3 + 0.7 * Math.cbrt(aRng());
        dummy.position.set(e.p.x + u.x * rx * s, e.p.y + u.y * ry * s, e.p.z + u.z * rx * s); dummy.rotation.set(aR(-1.2, 1.2), aR(0, Math.PI * 2), aR(-1.2, 1.2)); dummy.scale.setScalar(aR(0.75, 1.25)); dummy.updateMatrix();
        inst.setMatrixAt(n, dummy.matrix); inst.setColorAt(n, LEAF_TONES[Math.floor(aRng() * LEAF_TONES.length)].clone().multiplyScalar(aR(0.85, 1.1))); n++; } });
    inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    const m = add(inst, ARCH.id + '_leaf_cluster_' + (gi + 1), 'canopy'); m.userData.base = m.position.clone(); m.userData.phase = gi * 0.9; m.userData.leafy = true; canopyMeshes.push(m);
  });
  add(new THREE.Mesh(mergeGeos(inner.map((b) => { const g = new THREE.SphereGeometry(b.r, 12, 8); g.translate(b.p.x, b.p.y, b.p.z); return g; })), mat.innerMass), ARCH.id + '_canopy_depth', 'canopy');
}
add(new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(0.1, 2.45, 0.1), V(0.42, 2.82, 0.5), V(0.74, 3.08, 0.95), V(1.25, 3.2, 1.5)]), 0.085, 0.02, 30, 10, 4), mat.limbBark), 'branch_circle_233', 'c233');
{ const cp = V(-0.95, 3.02, 0.72);
  mat.deckMini = new THREE.MeshStandardMaterial({ name: 'council_deck_from_outside', color: 0x8a6a4a, roughness: 0.9, emissive: 0x3a1a08, emissiveIntensity: 0.6 });
  mat.roofMini = new THREE.MeshStandardMaterial({ name: 'council_treehouse_roof_from_outside', color: 0x3b2d20, roughness: 0.95, flatShading: true });
  add(new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(-0.12, 2.4, 0.05), V(-0.5, 2.8, 0.38), cp.clone().add(V(0.12, -0.04, -0.02))]), 0.075, 0.045, 18, 8, 3), mat.limbBark), 'council_deck_limb', 'croom');
  const dk = add(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.025, 24), mat.deckMini), 'council_deck_seen_from_outside', 'croom'); dk.position.copy(cp);
  const hut = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.085, 0.11, 12), mat.deckMini), 'council_treehouse_seen_from_outside', 'croom'); hut.position.copy(cp).add(V(-0.13, 0.065, -0.1));
  const rf = add(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.09, 12), mat.roofMini), 'council_treehouse_roof_seen_from_outside', 'croom'); rf.position.copy(cp).add(V(-0.13, 0.165, -0.1));
  window.__deckGlow = cp.clone().add(V(0, 0.07, 0)); const pl = new THREE.PointLight(0xffa24a, 0.9, 1.1, 1.6); pl.position.copy(cp).add(V(0, 0.14, 0)); stage._scene.add(pl); }

// Circle 233 — lantern
const lan = new THREE.Group(); lan.name = 'circle_233_lantern'; lan.position.set(0.72, 2.8, 0.95); tree.add(lan);
add(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.28, 6), mat.iron), 'lantern_chain', 'c233', lan).position.y = 0.3;
add(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.07, 4), mat.iron), 'lantern_cap', 'c233', lan).position.y = 0.155;
add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), mat.lantern), 'lantern_light', 'c233', lan).position.y = 0.04;
add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.14), mat.iron), 'lantern_base', 'c233', lan).position.y = -0.05;

// Living Asset Pack — basket on the same branch
const bas = new THREE.Group(); bas.name = 'circle_233_asset_pack_basket'; bas.position.set(1.08, 2.88, 1.3); tree.add(bas);
add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 6), mat.iron), 'basket_cord', 'pack', bas).position.y = 0.26;
add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.1, 24, 1, true), mat.wicker), 'basket_body', 'pack', bas);
add(new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), mat.wicker), 'basket_floor', 'pack', bas).rotation.x = -Math.PI / 2;
bas.children[2].position.y = -0.049;
add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 8, 32, Math.PI), mat.wicker), 'basket_handle', 'pack', bas).position.y = 0.05;

// Crown — yOur Golden Dream
add(new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.012, 8, 64), mat.gold), 'crown_halo', 'crown').position.y = 5.5;
tree.getObjectByName('crown_halo').rotation.x = Math.PI / 2;
add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 20), mat.gold), 'crown_harvest_01_fruit', 'crown').position.set(0, 5.62, 0);
[[0.32, 5.52, 0.18], [-0.3, 5.64, -0.12], [0.06, 5.78, -0.3]].forEach((p, i) => add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), mat.ember), 'crown_ember_' + (i + 1), 'crown').position.set(...p));
add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), mat.unlit), 'circle_233_crown_signal_unlit', 'signal').position.set(-0.26, 5.46, 0.36);

// Staff Room — a small roundhouse at the edge of the clearing
const rh = new THREE.Group(); rh.name = 'staff_room_roundhouse'; rh.position.set(3.4, 0, -2.4); rh.rotation.y = -0.9; tree.add(rh);
add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.34, 32), mat.wicker), 'roundhouse_wall', 'staff', rh).position.y = 0.17;
add(new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.46, 32), mat.root), 'roundhouse_thatch', 'staff', rh).position.y = 0.57;
const door = add(new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.22), mat.hollow), 'roundhouse_door', 'staff', rh); door.position.set(0, 0.11, 0.441);
mat.stone = new THREE.MeshStandardMaterial({ name: 'path_stone', color: 0x8a8270, emissive: 0x6a3a14, emissiveIntensity: 0.35, roughness: 0.9 });
{ const pc = new THREE.CatmullRomCurve3([V(2.95, 0.012, -1.95), V(1.9, 0.012, -1.55), V(0.95, 0.012, -0.35), V(0.5, 0.012, 0.8)]);
  for (let i = 0; i < 10; i++) add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.024, 10), mat.stone), 'staff_threshold_path_' + (i + 1), 'staff').position.copy(pc.getPoint(i / 9)); }
// Ankerwycke Yew — an Ancient Friend at the end of its own root
const YP = V(2.7, 0, -0.5);
const yewRootCurve = new THREE.CatmullRomCurve3([V(0.5, 0.21, -0.12), V(1.2, 0.08, -0.32), V(2.0, 0.045, -0.46), V(2.58, 0.03, -0.5)]);
add(new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(0.5, 0.2, -0.12), V(1.2, 0.06, -0.32), V(2.0, 0.02, -0.46), V(2.58, 0.0, -0.5)]), 0.1, 0.03, 48, 10, 4), mat.rootBark), 'root_to_ankerwycke_yew', 'roots');
mat.yew = new THREE.MeshStandardMaterial({ name: 'yew_foliage', color: 0x33502e, emissive: 0x16261a, emissiveIntensity: 0.7, roughness: 0.95 });
mat.yewBark = new THREE.MeshStandardMaterial({ name: 'yew_bark', color: 0x5b3526, roughness: 0.9 });
const yew = new THREE.Group(); yew.name = 'ankerwycke_yew'; yew.position.copy(YP); yew.scale.setScalar(1.6); tree.add(yew);
add(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.12, 0.26, 14), mat.yewBark), 'yew_trunk', 'yew', yew).position.y = 0.13;
const yf1 = add(new THREE.Mesh(leafy(0.27, 7.3), mat.yew), 'yew_foliage_1', 'yew', yew); yf1.position.y = 0.4; yf1.scale.set(1.25, 0.72, 1.2);
const yf2 = add(new THREE.Mesh(leafy(0.17, 3.1), mat.yew), 'yew_foliage_2', 'yew', yew); yf2.position.set(0.06, 0.58, -0.04); yf2.scale.set(1, 0.8, 1);
mat.encounter = mat.gold.clone(); mat.encounter.name = 'yew_encounter_ring'; mat.encounter.transparent = true; mat.encounter.opacity = 0.28; mat.encounter.emissiveIntensity = 0.35;
[0.42, 0.52].forEach((rr, i) => { const e = add(new THREE.Mesh(new THREE.TorusGeometry(rr, 0.006, 6, 64), mat.encounter), 'yew_relationship_ring_' + (i + 1), 'yew', yew); e.rotation.x = Math.PI / 2; e.position.y = 0.012; });
stage.setObject(tree);
const cam = stage._camera, controls = stage._controls, canvas = stage._renderer.domElement;
{ const tb = stage.shadowRoot && stage.shadowRoot.querySelector('.toolbar'); if (tb && !/[?&]export=1/.test(location.search)) tb.style.display = 'none'; }
controls.minDistance = 1.2; controls.maxDistance = 16; controls.maxPolarAngle = Math.PI * 0.49;
const warm = new THREE.PointLight(0xffb45a, 2.2, 3, 1.6); warm.position.set(0.72, 2.84, 0.95); stage._scene.add(warm);
const doorLight = new THREE.PointLight(0xff9a3c, 0.45, 0.9, 1.8); doorLight.position.set(3.4 + Math.sin(-0.9) * 0.6, 0.25, -2.4 + Math.cos(-0.9) * 0.6); stage._scene.add(doorLight);
const hearth = new THREE.PointLight(0xff9a3c, 1.4, 1.6, 1.8); hearth.position.set(0, 0.5, 0.75); stage._scene.add(hearth);
const yewFill = new THREE.PointLight(0xb8d0a0, 0.6, 3.2, 1.4); yewFill.position.set(3.6, 1.5, 0.7); stage._scene.add(yewFill);
const moon = new THREE.PointLight(0xaab8e0, 0.8, 1.2, 1.6); moon.position.set(-0.95, 0.35, 0.9); stage._scene.add(moon);
const S = stage._scene, life = [];
{ const moonGraze = new THREE.PointLight(0xb4c2e4, 1.5, 14, 1.2); moonGraze.position.set(-4.5, 3.6, 2.2); stage._scene.add(moonGraze);
  const bounce = new THREE.PointLight(0xd9894a, 0.9, 4.5, 1.4); bounce.position.set(0.9, 0.35, 1.6); stage._scene.add(bounce);
  const crownBack = new THREE.PointLight(0x9fb0d8, 1.6, 9, 1.3); crownBack.position.set(1.2, 5.6, -3.2); stage._scene.add(crownBack); }
cam.near = 0.05; cam.far = 400; cam.updateProjectionMatrix();
S.fog = new THREE.FogExp2(0x27303c, 0.024);
const dusk = new THREE.HemisphereLight(0x7d93c4, 0x2a2419, 1.05); S.add(dusk);
S.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x1a2746) }, mid: { value: new THREE.Color(0x5c5a68) }, bot: { value: new THREE.Color(0x1d2319) } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top, mid, bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, pow(smoothstep(0.0, 0.55, h), 0.7)) : mix(mid, bot, smoothstep(0.0, -0.12, h)); gl_FragColor = vec4(c, 1.0); }',
})), { name: 'sky', renderOrder: -1 }));
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const glow = (color, size, pos, opacity = 1) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity, fog: false }));
  s.scale.setScalar(size); s.position.copy(pos); S.add(s); return s; };
// moon and stars
const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ color: 0xe9e4d4, fog: false }));
moonDisc.position.set(-68, 30, -30); moonDisc.lookAt(0, 0, 0); S.add(moonDisc);
glow(0xaab8e0, 22, moonDisc.position, 0.55);
{ const n = 420, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(0.15 + Math.random() * 0.85), r = 110; a.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe3ee, size: 0.45, map: glowTex, transparent: true, depthWrite: false, fog: false, opacity: 0.3 }));
  S.add(stars); life.push((t) => { stars.rotation.y = t / 400000; stars.material.opacity = 0.26 + Math.sin(t / 1900) * 0.05; }); }
// warm and lunar glows
glow(0xffa24a, 0.5, window.__deckGlow, 0.6);
const gLan = glow(0xffb45a, 0.9, V(0.72, 2.84, 0.95), 0.8);
const gHearth = glow(0xff9a3c, 0.6, V(0, 0.4, 0.66), 0.38);
mat.seed = new THREE.MeshStandardMaterial({ name: 's33d_seed', color: 0xf3e3b0, emissive: 0xf0d890, emissiveIntensity: 0.9, roughness: 0.5 });
add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), mat.seed), 's33d_seed', 'seed').position.set(0.8, 0.07, 0.5);
const gSeed = glow(0xf5e6b8, 0.22, V(0.8, 0.08, 0.5), 0.5);
life.push((t) => { const b = 0.5 + 0.5 * Math.sin(t / 4200); gSeed.material.opacity = 0.32 + b * 0.22; mat.seed.emissiveIntensity = 0.7 + b * 0.4; });
const gCrown = glow(0xf5c040, 1.3, V(0, 5.62, 0), 0.45);
const gPool = glow(0x9fb0e0, 0.55, V(-0.95, 0.08, 0.9), 0.45);
const gSignal = glow(0xd8cfb9, 0.35, V(-0.26, 5.46, 0.36), 0.25);
const sapMote = glow(0xffd48a, 0.3, V(), 0); sapMote.visible = false;
const focusHalo = glow(0xffffff, 0.75, V(), 0); let focusTarget = 0, sapAnim = null;
// fireflies
{ const n = 60, base = [], a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * 3.6, y = 0.2 + Math.random() * 4.6; base.push([r * Math.cos(th), y, r * Math.sin(th), Math.random() * 10]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const flies = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffd48a, size: 0.07, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  S.add(flies);
  const place = (t) => { for (let i = 0; i < n; i++) { const [x, y, z, s] = base[i]; a[i * 3] = x + Math.sin(t / 3100 + s) * 0.35; a[i * 3 + 1] = y + Math.sin(t / 2300 + s * 2) * 0.22; a[i * 3 + 2] = z + Math.cos(t / 2700 + s) * 0.35; } g.attributes.position.needsUpdate = true; };
  place(0); life.push((t) => { place(t); flies.material.opacity = 0.75 + Math.sin(t / 900) * 0.2; }); }
// low mist, drifting slowly across the clearing
{ const mist = Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2; const m = glow(0x9aa890, 4.5 + (i % 3), V(Math.cos(a) * 3.2, 0.25, Math.sin(a) * 3.2), 0.06); m.userData.a = a; return m; });
  life.push((t) => mist.forEach((m, i) => { const a = m.userData.a + t / 90000; m.position.set(Math.cos(a) * 3.2, 0.25 + Math.sin(t / 7000 + i) * 0.08, Math.sin(a) * 3.2); m.material.opacity = 0.05 + Math.sin(t / 5000 + i * 1.3) * 0.02; })); }
// equinox leaves, drifting down (autumn only)
if (SEASON === 'Autumn') { const cols = [0xc2873a, 0x9c5a2a, 0xd6a64a, 0x7f8a3a], leaves = [];
  const lg = new THREE.PlaneGeometry(0.09, 0.09);
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ color: cols[i % 4], map: LT.single, alphaTest: 0.5, roughness: 0.8, side: THREE.DoubleSide }));
    m.userData = { s: Math.random() * 100, speed: 0.00016 + Math.random() * 0.00012, th: Math.random() * Math.PI * 2, r: 0.6 + Math.random() * 1.6, off: Math.random() };
    S.add(m); leaves.push(m);
  }
  const drift = (t) => leaves.forEach((m) => { const u = m.userData, k = ((t * u.speed) + u.off) % 1, th = u.th + k * 1.4;
    m.position.set(Math.cos(th) * (u.r + k * 0.8) + Math.sin(t / 900 + u.s) * 0.12, 4.1 - k * 4.05, Math.sin(th) * (u.r + k * 0.8));
    m.rotation.set(t / 700 + u.s, t / 1100 + u.s, t / 1300); m.visible = k < 0.985; });
  drift(20000); life.push(drift); }
// Sap flow: roots rise into Heartwood; records settle down into it; only rarely does a mote reach the crown
function flow(curves, per, color, size, period, opacity) {
  const n = curves.length * per, a = new Float32Array(n * 3), ph = Array.from({ length: n }, () => Math.random()), v = new THREE.Vector3();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity, fog: false }));
  p.name = 'sap_flow'; S.add(p);
  const place = (t) => { for (let i = 0; i < n; i++) { curves[Math.floor(i / per)].getPoint(((t / period) + ph[i]) % 1, v); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; } g.attributes.position.needsUpdate = true; };
  place(0); life.push(place); return p;
}
{ const upC = [], downC = [];
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.3, d = V(Math.cos(a), 0, Math.sin(a)), L = 2.1 + (i % 3) * 0.45;
    upC.push(new THREE.CatmullRomCurve3([d.clone().multiplyScalar(L).setY(0.13), d.clone().multiplyScalar(L * 0.55).setY(0.15), d.clone().multiplyScalar(0.64).setY(0.33), d.clone().multiplyScalar(0.48).setY(0.9), d.clone().multiplyScalar(0.43).setY(1.55)])); }
  upC.push(new THREE.CatmullRomCurve3([V(2.55, 0.14, -0.5), V(1.6, 0.15, -0.4), V(0.62, 0.35, -0.15), V(0.46, 0.9, -0.12), V(0.42, 1.55, -0.1)]));
  [0, 1, 3, 6].forEach((j) => { const [x, y, z] = blobs[j], d = V(x, 0, z).normalize();
    downC.push(new THREE.CatmullRomCurve3([V(x * 0.7, y - 0.5, z * 0.7), V(x * 0.36, 2.75, z * 0.36), d.clone().multiplyScalar(0.4).setY(2.2), d.clone().multiplyScalar(0.42).setY(1.72)])); });
  flow(upC, 4, 0xffc46a, 0.09, 7000, 0.85);
  flow(downC, 3, 0xe8e0c8, 0.07, 9000, 0.6);
  const crownC = new THREE.CatmullRomCurve3([V(0.2, 4.5, 0.45), V(0.15, 5.05, 0.25), V(0.05, 5.5, 0.05)]), crownMote = glow(0xffe08a, 0.28, V(0, 4.5, 0), 0);
  life.push((t) => { const k = (t % 24000) / 6000; if (k < 1) { crownMote.position.copy(crownC.getPoint(k)); crownMote.material.opacity = Math.sin(Math.PI * k) * 0.9; } else crownMote.material.opacity = 0; }); }

// Council Fire — the interior of the canopy (Council Room Trial 01). Entered through a veil; a separate scale.
const _council0 = S.children.length;
const RP = V(40, 0, 40), W = (x, y, z) => RP.clone().add(V(x, y, z));
const room = new THREE.Group(); room.name = 'council_fire_room'; room.position.copy(RP); S.add(room);
const addR = (m, name, node) => add(m, name, node, room);
const roomAnchors = {}, roomViews = {};
// The Council Deck: timber boards laid among the oak limbs, high in the canopy
{ const tones = [0x7a5a3e, 0x6c4f36, 0x86664a].map((c, i) => new THREE.MeshStandardMaterial({ name: 'council_deck_board_' + (i + 1), color: c, roughness: 0.88, emissive: 0x1a0c04, emissiveIntensity: 0.5 }));
  const groups = [[], [], []];
  for (let z = -3.28; z <= 3.28; z += 0.155) { const w = 2 * Math.sqrt(Math.max(0, 3.3 * 3.3 - z * z)); if (w < 0.3) continue;
    for (let x = -w / 2; x < w / 2 - 0.05;) { const L = Math.min(w / 2 - x, aR(0.8, 1.8)), g = new THREE.BoxGeometry(L - 0.02, 0.05, 0.145); g.translate(x + L / 2, -0.025 + aR(-0.004, 0.004), z); groups[Math.floor(aRng() * 3)].push(g); x += L; } }
  { const g = new THREE.CylinderGeometry(1.08, 1.08, 0.05, 28); g.translate(0, -0.025, -3.9); groups[1].push(g); }
  groups.forEach((gs, i) => addR(new THREE.Mesh(mergeGeos(gs), tones[i]), 'council_deck_boards_' + (i + 1), 'croom'));
  mat.deckWood = tones[0]; }
{ const ring = (r, y, a0, a1) => new THREE.CatmullRomCurve3(Array.from({ length: Math.ceil((a1 - a0) / 0.08) + 1 }, (_, i) => { const a = Math.min(a1, a0 + i * 0.08); return V(Math.sin(a) * r, y, Math.cos(a) * r); }));
  addR(new THREE.Mesh(taperTube(ring(3.3, -0.09, 0, Math.PI * 2), 0.07, 0.07, 160, 8, 3), mat.limbBark), 'council_deck_edge_beam');
  [[0.38, Math.PI - 0.95], [Math.PI + 0.95, Math.PI * 2 - 0.38]].forEach(([a0, a1], k) => {
    addR(new THREE.Mesh(taperTube(ring(3.26, 0.4, a0, a1), 0.028, 0.028, 90, 6, 2), mat.limbBark), 'council_deck_rail_' + (k + 1));
    for (let a = a0; a <= a1 + 0.01; a += 0.32) addR(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, 0.44, 7), mat.limbBark), 'council_deck_post').position.set(Math.sin(a) * 3.26, 0.2, Math.cos(a) * 3.26); }); }
addR(new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.55, 0.04, 24), mat.stone), 'council_hearth_stone_base', 'croom').position.y = 0.01;
// Great oak limbs carry the deck and rise through it; one passes up through the Treehouse and out of its roof
[[[V(-6, -1.9, -3.2), V(-3, -0.62, -1.3), V(0, -0.46, 0.2), V(3, -0.7, 1.5), V(6.5, -1.9, 2.6)], 0.38, 0.16, 'council_deck_supporting_limb_1'],
 [[V(4.2, -2.6, -5.2), V(1.5, -0.6, -2.2), V(-1.5, -0.62, 1.8), V(-4.6, -1.6, 5.1)], 0.32, 0.12, 'council_deck_supporting_limb_2'],
 [[V(2.95, -1.3, -0.9), V(2.8, 0, -1.1), V(2.95, 1.6, -1.3), V(3.6, 3.2, -0.8), V(4.6, 4.1, -0.3)], 0.17, 0.04, 'council_deck_branch_rising_through'],
 [[V(0.45, -8, -4.6), V(0.38, -2, -4.2), V(0.36, 0.5, -4.12), V(0.3, 2.2, -4.05), V(0.1, 3.4, -3.6), V(-0.9, 4.4, -2.6), V(-2.4, 5.0, -1.6)], 0.5, 0.12, 'council_treehouse_great_limb']]
  .forEach(([pts, r0, r1, name]) => addR(new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3(pts), r0, r1, 64, 14, 5), mat.limbBark), name));
// The Council Treehouse: a round timber shelter wrapped around the great limb, its door facing the fire
mat.hutWall = new THREE.MeshStandardMaterial({ name: 'council_treehouse_timber', color: 0x7a5a40, roughness: 0.86, flatShading: true, emissive: 0x1a0c04, emissiveIntensity: 0.5 });
mat.hutRoof = new THREE.MeshStandardMaterial({ name: 'council_treehouse_roof', color: 0x3b2d20, roughness: 0.95, flatShading: true, side: THREE.DoubleSide });
{ const wall = addR(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.04, 1.5, 30, 1, true, 0.42, Math.PI * 2 - 0.84), mat.hutWall), 'council_treehouse_wall', 'c233rec'); wall.position.set(0, 0.75, -3.9); wall.material.side = THREE.DoubleSide;
  const roof = addR(new THREE.Mesh(new THREE.ConeGeometry(1.42, 1.05, 30, 1, true), mat.hutRoof), 'council_treehouse_roof', 'c233rec'); roof.position.set(0, 2.02, -3.9);
  const lintel = addR(new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(-0.48, 1.42, -2.96), V(0, 1.52, -2.94), V(0.48, 1.42, -2.96)]), 0.05, 0.05, 12, 6, 2), mat.limbBark), 'council_treehouse_lintel', 'c233rec');
  mat.window = new THREE.MeshStandardMaterial({ name: 'council_treehouse_window', color: 0xf2c47a, emissive: 0xf0a850, emissiveIntensity: 1.1 });
  [-1.25, 1.3].forEach((t, i) => { const w = addR(new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), mat.window), 'council_treehouse_window_' + (i + 1)); w.position.set(Math.sin(t) * 1.045, 0.9, -3.9 + Math.cos(t) * 1.045); w.lookAt(W(Math.sin(t) * 3, 0.9, -3.9 + Math.cos(t) * 3)); glow(0xffb060, 0.5, W(Math.sin(t) * 1.1, 0.9, -3.9 + Math.cos(t) * 1.1), 0.35); });
  const hutLight = new THREE.PointLight(0xffb060, 1.3, 3.2, 1.6); hutLight.position.copy(W(0, 0.9, -3.7)); S.add(hutLight); window.__hutLight = hutLight; }
// Oak leaves around, overhead and below the deck; an opening to the sky above the fire
{ const LS = 0.22, card = new THREE.PlaneGeometry(LS, LS), d = new THREE.Object3D();
  const cluster = (list, per, name) => { const inst = new THREE.InstancedMesh(card, mat.oakLeaf, list.length * per); let n = 0;
    list.forEach(([x, y, z, r]) => { for (let i = 0; i < per; i++) { const u = V(aR(-1, 1), aR(-1, 1), aR(-1, 1)).normalize(), s = Math.cbrt(aRng());
      d.position.set(x + u.x * r * s, y + u.y * r * 0.6 * s, z + u.z * r * s); d.rotation.set(aR(-1.2, 1.2), aR(0, 6.28), aR(-1.2, 1.2)); d.scale.setScalar(aR(0.8, 1.35)); d.updateMatrix();
      inst.setMatrixAt(n, d.matrix); inst.setColorAt(n, LEAF_TONES[Math.floor(aRng() * LEAF_TONES.length)].clone().multiplyScalar(aR(0.8, 1.05))); n++; } });
    inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; return addR(inst, name); };
  const around = [], over = [], below = [], approach = [];
  for (let i = 0; i < 30; i++) { const a = aR(0.7, Math.PI * 2 - 0.7), r = aR(3.9, 5.4); around.push([Math.sin(a) * r, aR(0.2, 2.9), Math.cos(a) * r, aR(0.5, 0.95)]); }
  for (let i = 0; i < 40; i++) { const a = aR(0, Math.PI * 2), r = aR(1.3, 4.8); over.push([Math.sin(a) * r, aR(3.2, 4.6), Math.cos(a) * r, aR(0.55, 1.0)]); }
  for (let i = 0; i < 18; i++) { const a = aR(0, Math.PI * 2), r = aR(3.6, 6); below.push([Math.sin(a) * r, aR(-2.4, -0.4), Math.cos(a) * r, aR(0.6, 1.0)]); }
  for (let i = 0; i < 10; i++) { const s = i % 2 ? 1 : -1; approach.push([s * aR(1.1, 2.3), aR(0.3, 2.8), aR(4.0, 7.8), aR(0.45, 0.7)]); }
  cluster(around, 30, 'council_leaves_around'); cluster(over, 34, 'council_leaves_overhead'); cluster(below, 26, 'council_leaves_below'); cluster(approach, 22, 'council_leaves_on_the_approach');
  // far below: other crowns in the dark, and the forest floor lost in mist
  // Height: the oak continues far below the deck — trunk, limbs, and lower canopy layers fading into haze
  mat.lowLeaf = mat.oakLeaf.clone(); mat.lowLeaf.name = 'lower_canopy_leaves'; mat.lowLeaf.emissive.set(0x2a4220); mat.lowLeaf.emissiveIntensity = 1.0;
  mat.lowBark = mat.limbBark.clone(); mat.lowBark.name = 'lower_limb_bark'; mat.lowBark.emissive.set(0x2a1c12); mat.lowBark.emissiveIntensity = 1.0;
  const HAZE = new THREE.Color(0x56634f), depthK = (y) => Math.min(1, Math.max(0, (-y - 1) / 30));
  const tintByDepth = (g, near) => { const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color();
    for (let i = 0; i < p.count; i++) { col.copy(near).lerp(HAZE, Math.pow(depthK(p.getY(i)), 0.8)); c.set([col.r, col.g, col.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; };
  mat.depthBark = new THREE.MeshBasicMaterial({ name: 'oak_below_bark_in_haze', vertexColors: true, map: mat.limbBark.map, fog: false });
  const TB = V(0.25, -2.5, -4.35), TF = V(-1.1, -34, -6.2);
  addR(new THREE.Mesh(tintByDepth(taperTube(new THREE.CatmullRomCurve3([TF, V(-0.8, -24, -5.8), V(-0.3, -14, -5.1), V(0.1, -6, -4.6), TB]), 1.9, 0.55, 60, 22, 9), new THREE.Color(0x6a5240)), mat.depthBark), 'oak_trunk_far_below_the_deck');
  const lowLimbs = [], lowTips = [];
  [[-5, 0.9, 5.2, 0.34], [-8.5, 2.6, 6.2, 0.4], [-11, 4.3, 6.8, 0.44], [-14.5, 5.9, 7.4, 0.5], [-18, 0.1, 8.2, 0.55], [-21.5, 3.4, 8.8, 0.6]].forEach(([y, a, L, r0]) => {
    const k = (y + 2.5) / (-34 + 2.5), base = TB.clone().lerp(TF, k), d = V(Math.sin(a), 0, Math.cos(a));
    const c = new THREE.CatmullRomCurve3([base, base.clone().add(d.clone().multiplyScalar(L * 0.4)).add(V(0, L * 0.12, 0)), base.clone().add(d.clone().multiplyScalar(L * 0.75)).add(V(0, L * 0.2, 0)), base.clone().add(d.clone().multiplyScalar(L)).add(V(0, L * 0.34, 0))]);
    lowLimbs.push(taperTube(c, r0, 0.06, 26, 10, 4));
    for (let t of [0.55, 0.75, 0.9, 1]) { const p = c.getPointAt(t), q = V(-d.z, 0, d.x); lowTips.push([p.x + q.x * aR(-1, 1), p.y + aR(-0.2, 0.5), p.z + q.z * aR(-1, 1), aR(0.9, 1.5)]); lowTips.push([p.x - q.x * aR(0.5, 1.4), p.y + aR(0, 0.6), p.z - q.z * aR(0.5, 1.4), aR(0.8, 1.3)]); }
  });
  addR(new THREE.Mesh(tintByDepth(mergeGeos(lowLimbs), new THREE.Color(0x6a5240)), mat.depthBark), 'oak_limbs_below_the_deck');
  // Lower canopy in layers: each deeper layer larger-leaved (farther) and paler (haze). Gaps let you see down between them.
  [-4, -8, -13, -19, -26].forEach((ly, li) => {
    const k = depthK(ly), m = new THREE.MeshBasicMaterial({ name: 'lower_canopy_layer_' + (li + 1), map: LT.sprig, alphaTest: 0.5, side: THREE.DoubleSide, fog: false, color: new THREE.Color(0x3f5a33).lerp(HAZE, Math.pow(k, 0.8)) });
    const masses = lowTips.filter(([, y]) => Math.abs(y - ly) < 2.2);
    for (let i = 0; i < 9 + li * 3; i++) { const a = aR(0, Math.PI * 2), r = aR(3.5, 7 + li * 2.4); masses.push([Math.sin(a) * r + TB.x, ly + aR(-0.8, 0.8), Math.cos(a) * r + TB.z, aR(1.0, 1.6) + li * 0.35]); }
    const per = 46, sz = 0.36 + li * 0.2, inst = new THREE.InstancedMesh(new THREE.PlaneGeometry(sz, sz), m, masses.length * per); let n = 0;
    masses.forEach(([x, y, z, r]) => { for (let i = 0; i < per; i++) { const u = V(aR(-1, 1), aR(-1, 1), aR(-1, 1)).normalize(), q = Math.cbrt(aRng());
      d.position.set(x + u.x * r * q, y + u.y * r * 0.45 * q, z + u.z * r * q); d.rotation.set(aR(-1.2, 1.2), aR(0, 6.28), aR(-1.2, 1.2)); d.scale.setScalar(aR(0.8, 1.3)); d.updateMatrix();
      inst.setMatrixAt(n, d.matrix); inst.setColorAt(n, new THREE.Color(1, 1, 1).multiplyScalar(aR(0.78, 1.08))); n++; } });
    inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; addR(inst, 'lower_canopy_layer_' + (li + 1));
  });
  const moonBelow = new THREE.PointLight(0xa8b8d8, 3.0, 40, 1.0); moonBelow.position.copy(W(7, -6, 7)); S.add(moonBelow);
  [[-10, 14, 0.04], [-16, 18, 0.05], [-23, 24, 0.06]].forEach(([y, sz, op]) => [[3, 3], [-4, 5], [6, -2], [-2, -7]].forEach(([x, z]) => glow(0x8a9884, sz, W(x * 1.5, y, z * 1.5), op)));
  [[-3, -14, 4], [7, -16, -3], [-8, -18, -6], [3, -15, 10], [10, -20, 8], [-10, -17, 9]].forEach(([x, y, z]) => glow(0x9aa890, 14, W(x, y, z), 0.07)); }
roomViews.croomEdge = [W(6, -12, 5), W(2.1, 1.3, 1.7)]; roomViews.croomUp = [W(0.3, 4.2, -0.4), W(-0.8, 0.7, 1.6)];
{ const eq = addR(new THREE.Mesh(new THREE.PlaneGeometry(4.3, 0.04), mat.gold), 'equinox_threshold_line', 'croom'); eq.rotation.x = -Math.PI / 2; eq.position.set(0, 0.004, 2.3); }
for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; addR(new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), mat.stone), 'hearth_stone_' + (i + 1), 'croom').position.set(Math.sin(a) * 0.36, 0.04, Math.cos(a) * 0.36); }
[0, 1.05, 2.1].forEach((a, i) => { const l = addR(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.56, 8), mat.bark), 'hearth_log_' + (i + 1), 'croom'); l.rotation.set(0, a, Math.PI / 2 - 0.25, 'YXZ'); l.position.y = 0.09; });
mat.flame = mat.ember.clone(); mat.flame.name = 'council_fire';
const flames = [[0, 0.24, 0], [0.06, 0.2, 0.04], [-0.05, 0.2, -0.04]].map((p, i) => { const f = addR(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 10), mat.flame), 'fire_flame_' + (i + 1), 'croom'); f.position.set(...p); return f; });
mat.coals = new THREE.MeshStandardMaterial({ name: 'hearth_coals', color: 0x3a1a0a, emissive: 0xff6a20, emissiveIntensity: 1.1, roughness: 0.8 });
if (X.C) for (let i = 0; i < 11; i++) { const a = i * 2.4, r = 0.04 + (i % 3) * 0.055; addR(new THREE.Mesh(new THREE.DodecahedronGeometry(0.03 + (i % 2) * 0.012, 0), mat.coals), 'hearth_coal_' + (i + 1), 'croom').position.set(Math.cos(a) * r, 0.055, Math.sin(a) * r); }
let revealT0 = -1e9; const reveal = (a, b) => { const k = Math.min(1, Math.max(0, ((performance.now() - revealT0) / 3400 - a) / (b - a))); return state.motion ? k * k * (3 - 2 * k) : 1; };
const fireLight = new THREE.PointLight(0xff9a3c, 3, 7, 1.3); fireLight.position.copy(W(0, 0.5, 0)); S.add(fireLight);
const gFire = glow(0xff9a3c, 1.8, W(0, 0.4, 0), 0.8);
mat.seat = new THREE.MeshStandardMaterial({ name: 'council_seat', color: 0x6a4a33, emissive: 0xff8a3c, emissiveIntensity: 0.2, roughness: 0.9 });
for (let i = 0; i < 10; i++) { const a = Math.PI / 10 + i * Math.PI / 5; addR(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 14), mat.seat), 'council_seat_' + (i + 1), 'people').position.set(Math.sin(a) * 1.45, 0.11, Math.cos(a) * 1.45); }
roomAnchors.people = W(Math.sin(0.94) * 1.45, 0.3, Math.cos(0.94) * 1.45); roomViews.people = [W(0, 0.3, 0), W(2.4, 2.7, 2.8)];
mat.rootGlow = new THREE.MeshStandardMaterial({ name: 'companion_root_glow', color: 0x3f7a34, emissive: 0x5fbf4a, emissiveIntensity: 0.9, roughness: 0.6 });
let yewRoot = null;
// ── Companions of the Circle, built from data (tetol-council-circles.js). The place persists; one Circle inhabits it at a time.
const CR = 2.35, circleGroups = {}, markerMeshes = []; let curGrp = null;
const ctex = (w, hh, draw) => { const c = canvasOf(w, hh); draw(c.getContext('2d'), w, hh); const t = new THREE.CanvasTexture(c); if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; return t; };
const hex = (c) => '#' + new THREE.Color(c).getHexString();
mat.seatMoss = new THREE.MeshStandardMaterial({ name: 'companion_seat_moss', color: 0x4c602e, roughness: 1 });
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
const BUILD = {
  owl(g, r, id) {
    const barred = r.species === 'barred';
    const plum = ctex(256, 256, (x, w, hh) => { x.fillStyle = barred ? '#8e7a64' : '#454a52'; x.fillRect(0, 0, w, hh);
      if (barred) { for (let y = 20; y < 110; y += 11) { x.fillStyle = 'rgba(58,40,24,.7)'; x.fillRect(0, y, w, 4); x.fillStyle = 'rgba(220,206,180,.5)'; x.fillRect(0, y + 5, w, 3); }
        for (let i = 0; i < 90; i++) { const px = Math.random() * w, py = 120 + Math.random() * 120; x.fillStyle = 'rgba(70,46,26,.75)'; x.fillRect(px, py, 3, 14); x.fillStyle = 'rgba(226,214,190,.55)'; x.fillRect(px + 4, py, 4, 14); } }
      else { x.fillStyle = '#e8dcc0'; x.fillRect(0, 100, w, 156); for (let i = 0; i < 120; i++) { x.fillStyle = 'rgba(40,36,34,.7)'; x.fillRect(Math.random() * w, 110 + Math.random() * 140, 2, 9); } } });
    const body = add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 18), std({ map: plum, name: id + '_plumage' })), id + '_body', id, g); body.scale.set(barred ? 1 : 0.8, barred ? 1.3 : 1.45, barred ? 0.95 : 0.82); body.position.y = 0.21; body.rotation.y = Math.PI;
    const headM = std({ color: barred ? 0x8a7560 : 0x3d424a, name: id + '_head' });
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(barred ? 0.12 : 0.085, 20, 16), headM), id + '_head', id, g); head.position.y = barred ? 0.44 : 0.42; head.scale.set(1.08, 1, 1);
    if (barred) { const disc = add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), std({ color: 0xbcaa90, name: 'barred_owl_facial_disc' })), id + '_facial_disc', id, g); disc.scale.set(1, 0.95, 0.32); disc.position.set(0, 0.44, 0.075);
      [-1, 1].forEach((sx) => { const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.006, 6, 20), std({ color: 0x7a6650 })), id + '_disc_ring', id, g); ring.position.set(sx * 0.043, 0.452, 0.104); }); }
    else { add(new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), std({ color: 0xeee4cc })), id + '_cheek', id, g).position.set(0, 0.395, 0.052); [-1, 1].forEach((sx) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.05, 0.02), std({ color: 0x15161a })), id + '_moustache', id, g); m.position.set(sx * 0.032, 0.39, 0.072); });
      [-1, 1].forEach((sx) => add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), std({ color: 0xa4502a })), id + '_thigh', id, g).position.set(sx * 0.06, 0.07, 0.05)); }
    const eyeM = std({ color: 0x160c06, roughness: 0.2, name: id + '_eye' });
    [-1, 1].forEach((sx) => add(new THREE.Mesh(new THREE.SphereGeometry(barred ? 0.024 : 0.016, 12, 10), eyeM), id + '_eye', id, g).position.set(sx * (barred ? 0.043 : 0.034), barred ? 0.452 : 0.43, barred ? 0.1 : 0.07));
    const beak = add(new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 8), std({ color: barred ? 0xd6c688 : 0x2a2a2c })), id + '_beak', id, g); beak.rotation.x = Math.PI * 0.62; beak.position.set(0, barred ? 0.415 : 0.405, barred ? 0.112 : 0.085);
    [-1, 1].forEach((sx) => { const wg = add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), std({ color: barred ? 0x6e5a46 : 0x30343a })), id + '_wing', id, g); wg.scale.set(0.4, 1.3, 0.9); wg.position.set(sx * 0.13, 0.22, -0.02); });
    return 0.62;
  },
  flower(g, r, id) {
    const broad = r.count <= 7;
    const tex = ctex(128, 128, (x) => { x.translate(64, 64); x.fillStyle = hex(r.petals);
      const np = broad ? 6 : 22; for (let i = 0; i < np; i++) { x.save(); x.rotate(i / np * Math.PI * 2); x.beginPath(); x.ellipse(0, broad ? -32 : -36, broad ? 17 : 6, broad ? 30 : 26, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
      if (broad) { x.strokeStyle = hex(r.centre); x.lineWidth = 3; [0, 2.1, 4.2].forEach((a) => { x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(a) * 26, -Math.cos(a) * 26); x.stroke(); }); x.fillStyle = '#e8c040'; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill(); }
      else { x.fillStyle = hex(r.centre); x.beginPath(); x.arc(0, 0, 13, 0, 7); x.fill(); } });
    const headM = new THREE.MeshStandardMaterial({ name: id + '_flower', map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7, emissive: 0x222018, emissiveIntensity: 0.4 }), stemM = std({ color: 0x55702e });
    for (let i = 0; i < r.count; i++) { const a = i * 2.4, rr = 0.05 + 0.17 * Math.sqrt(i / r.count), ht = 0.1 + Math.random() * 0.12, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, ht, 5), stemM), id + '_stem', id, g).position.set(x, 0.44 + ht / 2, z);
      const hd = add(new THREE.Mesh(new THREE.PlaneGeometry(broad ? 0.1 : 0.075, broad ? 0.1 : 0.075), headM), id + '_head', id, g); hd.position.set(x, 0.44 + ht, z); hd.rotation.set(-Math.PI / 2 + 0.5 + Math.random() * 0.3, 0, Math.random() * 3); }
    return 0.72;
  },
  fungus(g, r, id) {
    const capTex = ctex(128, 128, (x, w, hh) => { x.fillStyle = hex(r.cap); x.fillRect(0, 0, w, hh); for (let i = 0; i < 160; i++) { x.fillStyle = hex(r.scales) + 'b0'; const yy = Math.pow(Math.random(), 0.6) * hh; x.fillRect(Math.random() * w, yy, 3 + Math.random() * 4, 2 + Math.random() * 3); } });
    const capM = std({ map: capTex, name: id + '_cap', roughness: 0.75 }), stemM = std({ color: r.stem, name: id + '_stem' });
    [[0, 0, 0.1, 0.19], [0.1, 0.06, 0.07, 0.13], [-0.09, -0.07, 0.05, 0.09]].slice(0, r.count).forEach(([x, z, cr, ht], i) => {
      add(new THREE.Mesh(new THREE.CylinderGeometry(cr * 0.26, cr * 0.34, ht, 12), stemM), id + '_stem', id, g).position.set(x, 0.44 + ht / 2, z);
      if (r.scales !== r.cap && i < 2) add(new THREE.Mesh(new THREE.TorusGeometry(cr * 0.3, cr * 0.06, 6, 16), stemM), id + '_ring', id, g).position.set(x, 0.44 + ht * 0.72, z), g.children[g.children.length - 1].rotation.x = Math.PI / 2;
      const cap = add(new THREE.Mesh(new THREE.SphereGeometry(cr, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), capM), id + '_cap', id, g); cap.scale.y = 0.62; cap.position.set(x, 0.44 + ht - 0.005, z);
      const gills = add(new THREE.Mesh(new THREE.CircleGeometry(cr * 0.98, 22), std({ color: 0x5a4030, side: THREE.DoubleSide })), id + '_gills', id, g); gills.rotation.x = Math.PI / 2; gills.position.set(x, 0.44 + ht - 0.006, z); });
    return 0.72;
  },
  herb(g, r, id) {
    const round = r.shape === 'round';
    const tex = ctex(128, 128, (x) => { x.translate(64, 120); x.fillStyle = hex(r.leaf); x.beginPath();
      if (round) { for (let k = 0; k <= 40; k++) { const t = k / 40 * Math.PI * 2, rr = 50 * (1 + 0.07 * Math.cos(t * 12)); x.lineTo(Math.sin(t) * rr * 0.92, -54 - Math.cos(t) * rr); } }
      else { x.moveTo(0, 0); x.quadraticCurveTo(46, -50, 0, -112); x.quadraticCurveTo(-46, -50, 0, 0); }
      x.fill(); x.strokeStyle = 'rgba(255,255,240,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -100); x.stroke();
      if (round) { x.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 200; i++) x.fillRect(-45 + Math.random() * 90, -100 + Math.random() * 90, 1, 1); } });
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.12, 20), mat.limbBark), id + '_wooden_bowl', id, g).position.y = 0.5;
    add(new THREE.Mesh(new THREE.CircleGeometry(0.18, 20), std({ color: 0x2a1c10 })), id + '_soil', id, g).position.y = 0.561, g.children[g.children.length - 1].rotation.x = -Math.PI / 2;
    const inst = new THREE.InstancedMesh(new THREE.PlaneGeometry(round ? 0.1 : 0.08, round ? 0.1 : 0.08), new THREE.MeshStandardMaterial({ name: id + '_leaves', map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: round ? 0.9 : 0.6, emissive: 0x1a2a10, emissiveIntensity: 0.5 }), 70), d = new THREE.Object3D();
    for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * 0.2, y = 0.58 + Math.random() * 0.22 * (1 - rr * 2.5);
      d.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); d.rotation.set(-0.9 + Math.random() * 0.6, a + Math.PI / 2, (Math.random() - 0.5) * 0.6); d.scale.setScalar(0.7 + Math.random() * 0.6); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); }
    add(inst, id + '_plant', id, g); return 0.84;
  },
  book(g, r, id) {
    const cover = ctex(256, 336, (x, w, hh) => { x.fillStyle = hex(r.cover); x.fillRect(0, 0, w, hh); x.strokeStyle = r.ink; x.lineWidth = 3; x.strokeRect(14, 14, w - 28, hh - 28);
      x.fillStyle = r.ink; x.textAlign = 'center'; x.font = 'italic 34px "EB Garamond", Georgia, serif'; const words = r.title.split(' '), lines = []; let ln = '';
      words.forEach((wd) => { if ((ln + ' ' + wd).trim().length > 12) { lines.push(ln.trim()); ln = wd; } else ln += ' ' + wd; }); lines.push(ln.trim());
      lines.forEach((l, i) => x.fillText(l, w / 2, 120 + i * 42)); });
    const side = std({ color: r.cover }), pages = std({ color: 0xe8dcc0 });
    const b = add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.34), [pages, side, std({ map: cover }), side, pages, pages]), id + '_book', id, g); b.position.y = 0.47; b.rotation.set(0, 0.35, 0.05);
    return 0.62;
  },
  word(g, r, id) {
    const paper = ctex(320, 200, (x, w, hh) => { x.fillStyle = '#e8dcbc'; x.fillRect(0, 0, w, hh); x.fillStyle = 'rgba(120,90,50,.15)'; for (let i = 0; i < 400; i++) x.fillRect(Math.random() * w, Math.random() * hh, 2, 2);
      x.fillStyle = '#3a2614'; x.textAlign = 'center'; x.font = 'italic 52px "EB Garamond", Georgia, serif'; x.fillText(r.text, w / 2, 112); x.font = '15px Cinzel, Georgia, serif'; x.fillStyle = '#6a4a2a'; x.fillText('WORD OF THE WEEK', w / 2, 150); });
    const s = add(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.31), std({ map: paper, side: THREE.DoubleSide, roughness: 0.95, emissive: 0x2a1a08, emissiveIntensity: 0.35 })), id + '_scroll', id, g); s.position.y = 1.5;
    [0.155, -0.155].forEach((dy) => { const rl = add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.56, 8), mat.limbBark), id + '_roller', id, g); rl.rotation.z = Math.PI / 2; rl.position.y = 1.5 + dy; });
    [-0.2, 0.2].forEach((dx) => add(new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 1.0, 4), mat.iron), id + '_cord', id, g).position.set(dx, 2.19, 0));
    return 1.5;
  },
  sapling(g, r, id) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.34, 8), std({ color: 0x8a8478 })), id + '_stem', id, g).position.y = 0.61;
    const lm = std({ color: r.leaf, emissive: 0x1a2a10, emissiveIntensity: 0.4 });
    [[0, 0.82, 0, 0.13], [0.08, 0.74, 0.04, 0.09], [-0.07, 0.76, -0.03, 0.08]].forEach(([x, y, z, rr]) => add(new THREE.Mesh(leafy(rr, x * 40), lm), id + '_leaves', id, g).position.set(x, y, z));
    return 0.9;
  },
  yew(g, r, id, p) {
    const sp = add(new THREE.Mesh(leafy(0.17, 7.3), mat.yew), 'yew_companion_sprig', id, g); sp.position.y = 0.52; sp.scale.set(1.2, 0.8, 1.2);
    yewRoot = new THREE.CatmullRomCurve3([p.clone().setY(0.03), p.clone().multiplyScalar(1.15).setY(0.035), p.clone().multiplyScalar(1.3).setY(-0.02), p.clone().multiplyScalar(1.34).setY(-0.8), p.clone().multiplyScalar(1.3).setY(-2.0)]);
    add(new THREE.Mesh(new THREE.TubeGeometry(yewRoot, 48, 0.03, 8), mat.rootGlow), 'yew_companion_root', id, curGrp);
    if (r.portrait) {
      const dir = p.clone().normalize(), fp = dir.clone().multiplyScalar(3.02).setY(1.35), fr = new THREE.Group(); fr.name = 'ankerwycke_yew_portrait'; fr.position.copy(fp); curGrp.add(fr); fr.lookAt(W(0, 1.35, 0));
      const art = ctex(256, 320, (x, w, hh) => { const gr = x.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, '#34405e'); gr.addColorStop(0.55, '#b98a5a'); gr.addColorStop(0.62, '#4a4a32'); gr.addColorStop(1, '#2a2c1c'); x.fillStyle = gr; x.fillRect(0, 0, w, hh);
        x.fillStyle = '#1c2414'; for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI, rr = 40 + Math.random() * 60; x.beginPath(); x.arc(128 + Math.cos(a) * rr * 1.3, 175 - Math.sin(a) * rr * 0.75, 14 + Math.random() * 16, 0, 7); x.fill(); }
        x.fillStyle = '#2a1c12'; x.beginPath(); x.moveTo(98, 250); x.quadraticCurveTo(110, 200, 104, 170); x.lineTo(152, 170); x.quadraticCurveTo(146, 205, 162, 250); x.fill();
        x.fillStyle = 'rgba(232,212,160,.9)'; x.font = 'italic 24px "EB Garamond", Georgia, serif'; x.textAlign = 'center'; x.fillText('Ankerwycke Yew', 128, 300); });
      add(new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.78), std({ map: art, roughness: 0.8, emissive: 0x201810, emissiveIntensity: 0.5 })), 'ankerwycke_yew_nftree_portrait', id, fr);
      [[0, 0.41, 0.72, 0.05], [0, -0.41, 0.72, 0.05], [0.335, 0, 0.05, 0.86], [-0.335, 0, 0.05, 0.86]].forEach(([x, y, w, hh]) => add(new THREE.Mesh(new THREE.BoxGeometry(w, hh, 0.05), mat.rib || mat.limbBark), 'portrait_frame', id, fr).position.set(x, y, 0.01));
      [-0.25, 0.25].forEach((dx) => add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.1, 4), mat.iron), 'portrait_cord', id, fr).position.set(dx, 0.98, 0));
      const tip = fp.clone().add(dir.clone().multiplyScalar(-0.12)).add(V(0, -0.36, 0)), side = V(-dir.z, 0, dir.x);
      const shoot = new THREE.CatmullRomCurve3([dir.clone().multiplyScalar(3.4).setY(-1.2), dir.clone().multiplyScalar(3.35).add(side.clone().multiplyScalar(-0.25)).setY(-0.2), dir.clone().multiplyScalar(3.2).add(side.clone().multiplyScalar(-0.3)).setY(0.55), dir.clone().multiplyScalar(3.08).add(side.clone().multiplyScalar(-0.12)).setY(0.9), tip.clone().add(side.clone().multiplyScalar(0.12)), tip]);
      add(new THREE.Mesh(taperTube(shoot, 0.05, 0.008, 60, 8, 3), mat.yewBark), 'yew_shoot_reaching_to_its_portrait', id, curGrp);
      [0.35, 0.5, 0.62, 0.74, 0.84].forEach((t, i) => { const q = shoot.getPointAt(t); const m = add(new THREE.Mesh(leafy(0.055 + (i % 2) * 0.02, i * 3.1), mat.yew), 'yew_shoot_needles', id, curGrp); m.position.copy(q); m.scale.set(1.3, 0.55, 1); });
    }
    return 0.72;
  },
};
if (D.ext && D.ext.forms) for (const [k, f] of Object.entries(D.ext.forms)) BUILD[k] = (g, r, id, p) => f({ THREE, V, W, add, std, ctex, hex, mat, taperTube, g, r, id, p }); // 0.9.7 Circle layer hook
function buildCircle(num) {
  const C = D.council.circles[num], grp = new THREE.Group(); grp.name = 'circle_' + num + '_companions'; room.add(grp); circleGroups[num] = grp; curGrp = grp;
  C.companions.forEach((cm) => { const a = cm.seat, rr = cm.repr.form === 'word' ? 1.45 : CR, p = V(Math.sin(a) * rr, 0, Math.cos(a) * rr), g = new THREE.Group(); g.name = cm.id + '_place'; g.position.copy(p); grp.add(g); g.lookAt(W(0, 0, 0));
    if (cm.repr.form !== 'word') { add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.42, 16), mat.limbBark), cm.id + '_seat', cm.id, g).position.y = 0.21; add(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.035, 16), mat.seatMoss), cm.id + '_seat_moss', cm.id, g).position.y = 0.43; }
    let tg = g; if (cm.repr.form === 'owl') { tg = new THREE.Group(); tg.position.y = 0.43; g.add(tg); }
    const ay = BUILD[cm.repr.form](tg, cm.repr, cm.id, p) + (tg === g ? 0 : 0.43);
    roomAnchors[cm.id] = W(p.x, ay, p.z);
    roomViews[cm.id] = cm.repr.form === 'word' ? [W(p.x, ay, p.z), W(0.3, 1.3, 1.6)] : [W(p.x, 0.5, p.z), W(p.x * 0.3 + Math.cos(a) * 0.5, 1.05, p.z * 0.3 - Math.sin(a) * 0.5)];
    if (cm.id === 'yewc233') roomViews[cm.id] = [W(p.x * 1.15, 0.8, p.z * 1.15), W(p.x * 0.2 + 0.5, 1.3, p.z * 0.2 + 1.0)]; });
  grp.visible = num === D.council.active;
}
Object.keys(D.council.circles).forEach((k) => buildCircle(+k));
// A carved ring beside the Treehouse door: the way back to the Circle before (and forward again)
{ const t = -0.62, mp = W(Math.sin(t) * 1.07, 1.02, -3.9 + Math.cos(t) * 1.07), mk = new THREE.Group(); mk.name = 'circle_time_ring_marker'; mk.position.copy(mp); S.add(mk); mk.lookAt(W(Math.sin(t) * 3, 1.02, -3.9 + Math.cos(t) * 3));
  const disc = add(new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), mat.rib || mat.limbBark), 'time_ring_disc', 'c232', mk); markerMeshes.push(disc);
  [0.06, 0.11, 0.155, 0.19].forEach((rr, i) => { const m = add(new THREE.Mesh(new THREE.TorusGeometry(rr, 0.006, 6, 40), i === 3 ? mat.forming : std({ color: 0x4a3020 })), 'time_ring_' + i, 'c232', mk); m.position.z = 0.004; markerMeshes.push(m); });
  roomAnchors.c232 = mp.clone(); roomAnchors.c233now = mp.clone(); roomViews.c232 = [W(0, 0.7, -2.4), W(0.6, 1.25, 1.4)]; roomViews.c233now = roomViews.c232; }
// F · Council memory: a few marks on the Treehouse wall. The current Circle is outlined in warm light (carved after it gathers);
// 232 is carved; 231 keeps an uncarved ring; older Circles fade into the grain. No history is filled in.
const memMarks = { glowAt: {} };
if (X.F) { const wallAt = (t, y, out = 1.07) => W(Math.sin(t) * out, y, -3.9 + Math.cos(t) * out);
  const carve = std({ color: 0x4a3020, name: 'memory_carved' }), faint = std({ color: 0x5c4028, name: 'memory_uncarved', transparent: true, opacity: 0.75 }), fainter = std({ color: 0x5c4028, name: 'memory_older', transparent: true, opacity: 0.4 });
  const hitM = new THREE.MeshBasicMaterial({ name: 'memory_mark_touch', transparent: true, opacity: 0, depthWrite: false });
  const mark = (t, y, r, node, kind) => { const g = new THREE.Group(); g.name = 'council_memory_mark_' + node; g.position.copy(wallAt(t, y)); S.add(g); g.lookAt(wallAt(t, y, 3));
    add(new THREE.Mesh(new THREE.CircleGeometry(r * 1.1, 24), hitM), 'memory_mark_touch_' + node, node, g).position.z = 0.006;
    if (kind === 'current') { [r * 0.42, r * 0.72].forEach((rr) => { add(new THREE.Mesh(new THREE.TorusGeometry(rr, 0.004, 6, 40), faint), 'memory_mark_outline', node, g).position.z = 0.004; });
      add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.009, 6, 56), mat.forming), 'memory_mark_forming', node, g).position.z = 0.005; }
    else add(new THREE.Mesh(new THREE.TorusGeometry(r, kind === 'older' ? 0.004 : 0.006, 6, 40), kind === 'older' ? fainter : faint), 'memory_mark_uncarved', node, g).position.z = 0.004;
    return g; };
  mark(0.64, 1.02, 0.2, 'c233now', 'current');
  mark(-0.98, 1.16, 0.15, 'mem231', 'uncarved');
  [[-1.5, 1.24, 0.12], [-1.7, 0.82, 0.1], [-1.9, 1.18, 0.085], [-2.08, 0.9, 0.07]].forEach(([t, y, r]) => mark(t, y, r, 'memolder', 'older'));
  memMarks.glowAt[233] = wallAt(0.64, 1.02, 1.13); memMarks.glowAt[232] = wallAt(-0.62, 1.02, 1.13);
  memMarks.glow = glow(0xffc46a, 0.6, memMarks.glowAt[233], 0.3);
  roomAnchors.c233now = wallAt(0.64, 1.02, 1.1); roomAnchors.mem231 = wallAt(-0.98, 1.16, 1.1); roomAnchors.memolder = wallAt(-1.78, 1.02, 1.1);
  roomViews.c233now = [wallAt(0.4, 1.05), W(1.55, 1.25, -0.2)];
  roomViews.mem231 = [wallAt(-1.1, 1.02), W(-2.05, 1.2, -1.55)]; roomViews.memolder = [wallAt(-1.75, 1.0), W(-2.7, 1.15, -2.6)]; }
const timeRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 6, 96), new THREE.MeshBasicMaterial({ color: 0xf2c86a, transparent: true, opacity: 0, depthWrite: false, fog: false })); timeRing.rotation.x = -Math.PI / 2; timeRing.position.copy(W(0, 0.03, 0)); S.add(timeRing);
let circleAnim = null;
function setCircle(num) {
  if (D.council.active === num || !D.council.circles[num]) return;
  const from = D.council.active; D.council.active = num; D.council.current = D.council.circles[num].node;
  { const w = document.getElementById('whisper'); if (w) { clearTimeout(whisperTimer); w.classList.remove('on'); } }
  if (!X.F) markerMeshes.forEach((m) => { m.userData.node = num === 233 ? 'c232' : 'c233now'; });
  if (memMarks.glow) memMarks.glow.position.copy(memMarks.glowAt[num] || memMarks.glowAt[233]);
  if (typeof paintSign === 'function') paintSign();
  if (!state.motion) { circleGroups[from].visible = false; circleGroups[num].visible = true; return; }
  circleAnim = { t0: performance.now(), from, to: num }; circleGroups[num].visible = true; circleGroups[num].scale.setScalar(0.001);
}
life.push((t) => { if (!circleAnim) return; const k = Math.min(1, (performance.now() - circleAnim.t0) / 2200), o = circleGroups[circleAnim.from], nG = circleGroups[circleAnim.to];
  const a = Math.min(1, k / 0.45), b = Math.max(0, (k - 0.4) / 0.6), e = (x) => x * x * (3 - 2 * x);
  o.scale.set(1, Math.max(0.001, 1 - e(a)), 1); o.visible = a < 1; nG.scale.set(1, Math.max(0.001, e(b)), 1);
  timeRing.scale.setScalar(0.4 + k * 3.1); timeRing.material.opacity = Math.sin(Math.PI * k) * 0.55;
  if (k >= 1) { o.scale.setScalar(1); nG.scale.setScalar(1); timeRing.material.opacity = 0; circleAnim = null; } });
mat.doorway = new THREE.MeshStandardMaterial({ name: 'circle_record_doorway', color: 0xf2dca0, emissive: 0xd9b060, emissiveIntensity: 1.0, roughness: 0.7 });
{ const s = new THREE.Shape(); s.moveTo(-0.32, 0); s.lineTo(-0.32, 1.0); s.absarc(0, 1.0, 0.32, Math.PI, 0, true); s.lineTo(0.32, 0); s.lineTo(-0.32, 0);
  addR(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false, curveSegments: 24 }), mat.doorway), 'circle_record_doorway', 'c233rec').position.set(0, 0, -3.05);
  [-0.4, 0.4].forEach((x, i) => addR(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.45, 10), mat.bark), 'doorway_post_' + (i + 1), 'c233rec').position.set(x, 0.72, -3.02)); }
const gDoor = glow(0xf5dca0, 1.5, W(0, 0.8, -2.9), 0.5);
if (X.C) { mat.doorway.emissiveIntensity = 0.26; mat.doorway.color.set(0x8f7650); mat.window.emissiveIntensity = 0.45; }
roomAnchors.c233rec = W(0.72, 0.7, -3.0); roomViews.c233rec = [W(0, 1.3, -2.9), W(0.5, 1.35, 1.0)];
for (let i = 0; i < 4; i++) addR(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.03, 10), mat.stone), 'way_out_stone_' + (i + 1), 'canopy').position.set((i % 2 ? 0.06 : -0.06), 0.01, 2.55 + i * 0.26);
roomAnchors.r_exit = W(0, 0.1, 3.2);
roomAnchors.croom = W(1.1, 0.05, 2.3); roomViews.croom = [W(-0.35, 0.6, 0), W(0.2, 2.3, 5.2)]; roomViews.croomArrive = [W(0, 0.9, 0), W(0, 1.15, 6.6)];
roomViews.croomHigh = roomViews.croom;
if (X.B) { const sa = 0.16; roomViews.croom = [W(-0.08, 0.7, -0.5), W(Math.sin(sa) * 2.5, 0.95, Math.cos(sa) * 2.5)]; }
const fireSign = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.4875), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false })); fireSign.name = 'council_fire_persistent_identity';
fireSign.scale.setScalar(0.78); fireSign.rotation.x = -1.2; fireSign.position.copy(W(0, 0.03, 0.86)); fireSign.visible = false; S.add(fireSign);
const sign = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false })); sign.name = 'current_circle_identity_at_doorway';
sign.scale.set(1.44, 0.54, 1); sign.position.copy(W(0, 2.18, -2.4)); sign.visible = false; S.add(sign);
async function paint(sp, l1, l2, l3) {
  try { await document.fonts.load('500 100px Cinzel'); await document.fonts.load('italic 60px "EB Garamond"'); } catch (e) {}
  const c = document.createElement('canvas'); c.width = 1024; c.height = 384; const g = c.getContext('2d');
  g.textAlign = 'center'; g.fillStyle = '#f5c040'; g.shadowColor = 'rgba(245,170,50,.7)'; g.shadowBlur = 30; g.font = '500 108px Cinzel'; g.fillText(l1.toUpperCase(), 512, 150);
  g.shadowBlur = 12; g.fillStyle = '#f3e7c4'; g.font = 'italic 66px "EB Garamond"'; g.fillText(l2, 512, 240);
  if (l3) { g.shadowBlur = 0; g.fillStyle = '#c9c2ac'; g.font = '500 40px Inter, sans-serif'; g.fillText(l3, 512, 320); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; sp.material.map?.dispose(); sp.material.map = tex; sp.material.needsUpdate = true; sp.visible = !(X.B && sp.name === 'council_fire_persistent_identity');
}
const paintSign = () => { const cur = D.nodes[D.council.current]; paint(sign, cur.name, cur.sub, D.council.active === 233 ? circle().short : (cur.stateShort || 'Remembered')); };
paint(fireSign, D.council.place.name, D.council.place.sub); paintSign();
let sparks;
{ const n = 26, a = new Float32Array(n * 3), ph = Array.from({ length: n }, () => Math.random()), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  sparks = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffc070, size: 0.05, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); S.add(sparks);
  const place = (t) => { for (let i = 0; i < n; i++) { const k = ((t / 2600) + ph[i]) % 1, th = ph[i] * 20 + k * 3; a[i * 3] = RP.x + Math.cos(th) * 0.16 * (1 - k); a[i * 3 + 1] = 0.3 + k * 1.3; a[i * 3 + 2] = RP.z + Math.sin(th) * 0.16 * (1 - k); } g.attributes.position.needsUpdate = true; };
  place(0); life.push(place); }
const rootMote = glow(0x9fe07a, 0.28, W(0, 0, 0), 0.85);
const fireTick = (t) => {
  const c = D.council.active === 233 ? circle() : { key: 'awaiting', level: 0.08 }, L = c.level, f = 0.85 + Math.sin(t / 83) * 0.06 + Math.sin(t / 191) * 0.07 + Math.sin(t / 433) * 0.04;
  const banked = c.key === 'awaiting';
  fireLight.intensity = 3.4 * L * f * reveal(0.25, 0.7); if (window.__hutLight) window.__hutLight.intensity = 1.3 * reveal(0.05, 0.4); sign.material.opacity = reveal(0.78, 1); fireSign.material.opacity = reveal(0.6, 0.9); gFire.material.opacity = Math.min(1, (banked ? 0.2 : 0.25) + 0.6 * L * f); gFire.scale.setScalar(banked ? 0.7 : 1.0 + L * 0.9);
  flames.forEach((m, i) => { m.visible = !banked; m.scale.set(0.45 + L * 0.45, (0.3 + L * 0.75) * (0.85 + Math.sin(t / 110 + i * 2) * 0.15), 0.45 + L * 0.45); });
  mat.flame.emissiveIntensity = 0.9 + L * 1.1; sparks.visible = L > 0.5; mat.seat.emissiveIntensity = banked ? 0.02 : 0.08 + L * 0.3;
  mat.rootGlow.emissiveIntensity = 0.7 + Math.sin(t / 900) * 0.3; gDoor.material.opacity = c.key === 'remembering' ? 0.8 : 0.45;
  const k = (t % 3400) / 3400; if (yewRoot) rootMote.position.copy(yewRoot.getPoint(k)).add(RP); rootMote.material.opacity = (D.council.circles[D.council.active]?.companions || []).some((c) => c.repr && c.repr.form === 'yew') ? Math.sin(Math.PI * k) * 0.9 : 0;
  if (X.C) { // banked but alive: low flames, a bed of coals, the brightest light on the deck. Not a gathering blaze.
    fireLight.intensity = Math.max(3.4 * L * f, banked ? 2.4 * f : 0) * reveal(0.25, 0.7); if (window.__hutLight) window.__hutLight.intensity = 0.55 * reveal(0.05, 0.4);
    if (banked) { gFire.material.opacity = 0.6 * f; gFire.scale.setScalar(1.3); mat.flame.emissiveIntensity = 1.5; mat.seat.emissiveIntensity = 0.12 * f;
      flames.forEach((m, i) => { m.visible = true; m.scale.set(0.34, 0.28 * (0.85 + Math.sin(t / 130 + i * 2) * 0.15), 0.34); }); }
    mat.coals.emissiveIntensity = 1.0 + Math.sin(t / 260) * 0.2 * f; gDoor.material.opacity = c.key === 'remembering' ? 0.5 : 0.12; }
  if (X.B) fireSign.visible = false; // at seat height the floor lettering sits under the visitor's feet; the place name lives in the panel
};
fireTick(20000); life.push(fireTick);

// breathing, swaying, flickering
const halo = tree.getObjectByName('crown_halo'), sig = tree.getObjectByName('circle_233_crown_signal_unlit');
life.push((t) => {
  canopyMeshes.forEach((m) => { const b = m.userData.base, p = m.userData.phase; m.position.set(b.x + Math.sin(t / 2600 + p) * 0.025, b.y + Math.sin(t / 3300 + p) * 0.015, b.z + Math.cos(t / 2900 + p) * 0.02); });
  lan.rotation.z = Math.sin(t / 1500) * 0.05; lan.rotation.x = Math.sin(t / 1900) * 0.03; bas.rotation.z = Math.sin(t / 1700 + 1) * 0.06;
  const L = circle().level, amp = L > 1 ? 1.6 : L < 0.5 ? 0.4 : 1;
  const f = 0.88 + (Math.sin(t / 97) * 0.04 + Math.sin(t / 213) * 0.05 + Math.sin(t / 541) * 0.03) * amp;
  warm.intensity = 2.2 * f * L; gLan.material.opacity = Math.min(1, 0.8 * f * L); gLan.scale.setScalar(0.9 * (0.8 + L * 0.2) * (0.95 + f * 0.05));
  mat.lantern.emissiveIntensity = 1.6 * f * L;
  const beat = 0.5 + 0.5 * Math.sin((t / (state.period || 3600)) * Math.PI * 2);
  hearth.intensity = 1.4 * (0.92 + beat * 0.12); gHearth.material.opacity = 0.5 + beat * 0.12;
  gCrown.material.opacity = 0.38 + beat * 0.16; gCrown.scale.setScalar(1.25 + beat * 0.12);
  mat.ember.emissiveIntensity = 1.5 + Math.sin(t / 700) * 0.12;
  mat.forming.opacity = 0.55 + Math.sin(t / 1800) * 0.15;
  halo.rotation.z = t / 9000;
  sig.material.opacity = 0.42 + Math.sin(t / 1600) * 0.14; gSignal.material.opacity = 0.18 + Math.sin(t / 1600) * 0.08;
  gPool.material.opacity = 0.42 + Math.sin(t / 2100) * 0.06; mat.lunar.emissiveIntensity = 0.5 + Math.sin(t / 2100) * 0.08;
});
// idle drift
let lastInput = performance.now(); controls.autoRotateSpeed = 0.22;
life.push((t) => { controls.autoRotate = !flight && t - lastInput > 14000; });

if (D.ext && D.ext.build) D.ext.build('council', { THREE, V, W, RP, room, addR, add, mat, glow, taperTube, mergeGeos, roomAnchors, roomViews, S }); // 0.9.5 coverage hook
const _hall0 = S.children.length;
// Heartwood interior: the hollow inside the trunk. Light above, hearth at the centre, older things settle low.
const HP = V(-40, 0, 40), H = (x, y, z) => HP.clone().add(V(x, y, z));
const hw = new THREE.Group(); hw.name = 'heartwood_interior'; hw.position.copy(HP); S.add(hw);
const addH = (m, name, node, par = hw) => add(m, name, node, par);
const cTex = (w, h2, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h2; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; return t; };
const grainTex = cTex(512, 256, (g) => { g.fillStyle = '#6e4a30'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 160; i++) { const x = Math.random() * 512; g.strokeStyle = Math.random() < 0.55 ? `rgba(36,20,10,${0.08 + Math.random() * 0.16})` : `rgba(160,118,78,${0.04 + Math.random() * 0.09})`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); for (let y = 0; y <= 256; y += 12) g.lineTo(x + Math.sin(y / 38 + i) * 7, y); g.stroke(); } });
grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping; grainTex.repeat.set(4, 2);
const ringTex = cTex(512, 512, (g) => { const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256); gr.addColorStop(0, '#9a6e44'); gr.addColorStop(1, '#4a2f1c'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let r = 14; r < 256; r += 7 + Math.random() * 11) { g.strokeStyle = `rgba(40,22,10,${0.3 + Math.random() * 0.35})`; g.lineWidth = 1 + Math.random() * 2.2; g.beginPath();
    for (let k = 0; k <= 72; k++) { const a = k / 72 * Math.PI * 2, rr = r * (1 + 0.025 * Math.sin(a * 3 + r) + 0.015 * Math.sin(a * 7 + r * 0.3)); g.lineTo(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr); } g.stroke(); } });
mat.inwall = new THREE.MeshStandardMaterial({ name: 'heartwood_inner_wall', color: 0x9a7458, map: grainTex, emissive: 0x160a04, emissiveIntensity: 0.5, roughness: 0.95, side: THREE.BackSide });
mat.hwfloor = new THREE.MeshStandardMaterial({ name: 'heartwood_growth_ring_floor', color: 0xffffff, map: ringTex, roughness: 0.92 });
mat.rim = new THREE.MeshStandardMaterial({ name: 'chamber_rim', color: 0x8a5e3c, emissive: 0x2a1408, emissiveIntensity: 0.5, roughness: 0.9 });
mat.dark = new THREE.MeshBasicMaterial({ name: 'chamber_depth', color: 0x0d0703 });
// ── The Heartwood Hall: the trunk is small outside and vast inside. A human-sized passage opens into a hall of living wood,
// fluted like the grain of the tree, rising toward a far opening of dusk light. A spiral of grown wood climbs the wall.
const HALL = [[9.2, -0.3], [9.45, 2], [9.7, 5], [9.3, 9], [8.1, 13], [6.2, 17], [4.0, 20.5], [2.1, 23.2]];
const wallR = (y) => { if (y <= HALL[0][1]) return HALL[0][0]; for (let i = 1; i < HALL.length; i++) if (y <= HALL[i][1]) { const [r0, y0] = HALL[i - 1], [r1, y1] = HALL[i], k = (y - y0) / (y1 - y0); return r0 + (r1 - r0) * (k * k * (3 - 2 * k)); } return HALL[HALL.length - 1][0]; };
grainTex.repeat.set(10, 5);
mat.inwall.color.set(0xb08a68); mat.inwall.emissive.set(0x2a1408); mat.inwall.emissiveIntensity = 0.55;
{ const prof = []; for (let i = 0; i <= 80; i++) { const y = -0.3 + i / 80 * 23.5; prof.push(new THREE.Vector2(wallR(y), y)); }
  const g = new THREE.LatheGeometry(prof, 200), p = g.attributes.position, v = V(0, 0, 0);
  for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k); const r = Math.hypot(v.x, v.z), th = Math.atan2(v.z, v.x), y = v.y;
    const flute = Math.pow(1 - Math.abs(Math.sin(th * 13 + Math.sin(y * 0.21 + th * 2) * 0.5)), 3), sway = 0.18 * Math.sin(th * 3 + y * 0.13) + 0.1 * Math.sin(th * 7 - y * 0.3);
    const rr = r - 0.62 * flute + sway; p.setXYZ(k, Math.cos(th) * rr, y, Math.sin(th) * rr); }
  g.computeVertexNormals(); addH(new THREE.Mesh(g, mat.inwall), 'heartwood_hall_wall', 'hwroom'); }
ringTex.anisotropy = 8;
{ const f = addH(new THREE.Mesh(new THREE.CircleGeometry(9.8, 120), mat.hwfloor), 'heartwood_growth_ring_floor', 'hwroom'); f.rotation.x = -Math.PI / 2; }
{ const r = addH(new THREE.Mesh(new THREE.TorusGeometry(8.55, 0.035, 8, 240, Math.PI * 1.82), mat.forming), 'this_season_ring_forming', 'ring'); r.rotation.x = -Math.PI / 2; r.rotation.z = 1.9; r.position.y = 0.02; }
// grown ribs: the tree's own vessels rising up the wall and leaning in toward the light
mat.rib = new THREE.MeshStandardMaterial({ name: 'heartwood_rib', color: 0xc49a72, map: grainTex, emissive: 0x2a1408, emissiveIntensity: 0.5, roughness: 0.9 });
{ const ribs = [], keepClear = [[-1.9, 0.28], [-0.35, 0.36], [1.75, 0.26], [2.2, 0.26], [Math.PI, 0.3], [-1.84, 0.26], ...((D.ext && D.ext.keepClear) || [])].map(([c, w]) => [c - Math.PI / 2, w]);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + 0.11, pts = []; if (keepClear.some(([c, w]) => Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c))) < w)) continue;
    for (let y = -0.2; y <= 22.5; y += 1.5) { const r = wallR(y) - 0.32 - 0.1 * Math.sin(y * 0.5 + i); pts.push(V(Math.cos(a + Math.sin(y * 0.12 + i) * 0.05) * r, y, Math.sin(a + Math.sin(y * 0.12 + i) * 0.05) * r)); }
    ribs.push(taperTube(new THREE.CatmullRomCurve3(pts), 0.34, 0.08, 60, 10, 4)); }
  addH(new THREE.Mesh(mergeGeos(ribs), mat.rib), 'heartwood_hall_ribs', 'hwroom'); }
// the hearth at the centre of the rings
for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; addH(new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 9), mat.stone), 'heartwood_hearth_stone_' + (i + 1), 'hwroom').position.set(Math.cos(a) * 0.95, 0.1, Math.sin(a) * 0.95); }
addH(new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 10), mat.ember), 'heartwood_hearth_ember', 'hwroom').position.set(0, 0.16, 0);
const hwFire = glow(0xff9a3c, 3.2, H(0, 0.55, 0), 0.7), hwLight = new THREE.PointLight(0xffa050, 7, 20, 1.3); hwLight.position.copy(H(0, 1.4, 0)); S.add(hwLight);
const skyLight = new THREE.PointLight(0xc9d2e8, 9, 40, 1.0); skyLight.position.copy(H(0, 21, 0)); S.add(skyLight);
[0.6, 2.7, 4.8].forEach((a) => { const l = new THREE.PointLight(0xffb066, 2.2, 9, 1.4); l.position.copy(H(Math.sin(a) * 7.2, 0.6, -Math.cos(a) * 7.2)); S.add(l); });
glow(0xdfe6f4, 4, H(0, 23.2, 0), 0.5); glow(0xb8c6e0, 12, H(0, 21.5, 0), 0.25);
{ const shaft = addH(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 4.2, 23, 48, 1, true), new THREE.MeshBasicMaterial({ name: 'light_from_above', color: 0xdfe2ec, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })), 'light_from_above'); shaft.position.y = 11.5; }
{ const n = 150, a = new Float32Array(n * 3), b = Array.from({ length: n }, () => [Math.random() * Math.PI * 2, Math.random() * 3.4, Math.random() * 22, Math.random()]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const motes = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf5e2b0, size: 0.1, map: glowTex, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); motes.name = 'dust_in_the_light'; S.add(motes);
  const pl = (t) => { b.forEach(([th, r, y, s], i) => { const yy = (y + t / 5000 * (0.3 + s * 0.4)) % 22; a.set([HP.x + Math.cos(th + t / 30000) * (r + yy * 0.08), 22.5 - yy, HP.z + Math.sin(th + t / 30000) * (r + yy * 0.08)], i * 3); }); g.attributes.position.needsUpdate = true; };
  pl(0); life.push(pl); }
{ const lv = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshStandardMaterial({ name: 'leaf_falling_in_heartwood', map: LT.single, alphaTest: 0.5, side: THREE.DoubleSide, color: [0xb88a3c, 0x9c6a2e, 0x7f8a3a][i % 3], emissive: 0x2a1a08, emissiveIntensity: 0.6 }));
    m.userData = { s: Math.random() * 100, th: Math.random() * 6.28, r: 0.6 + Math.random() * 2.4, off: Math.random() }; S.add(m); lv.push(m); }
  life.push((t) => lv.forEach((m) => { const u = m.userData, k = ((t / 60000) + u.off) % 1, th = u.th + k * 3;
    m.position.set(HP.x + Math.cos(th) * u.r + Math.sin(t / 2100 + u.s) * 0.4, 22 - k * 21.6, HP.z + Math.sin(th) * u.r); m.rotation.set(t / 1900 + u.s, t / 2600 + u.s, t / 3100); })); }
life.push((t) => { const f = 0.86 + 0.14 * Math.sin(t / 310) * Math.sin(t / 730); hwLight.intensity = 7 * f; hwFire.material.opacity = 0.62 * f; });
// the spiral of grown wood, climbing the wall toward the light
mat.stair = new THREE.MeshStandardMaterial({ name: 'heartwood_spiral_ledge', color: 0xa77b55, map: grainTex, emissive: 0x2a1408, emissiveIntensity: 0.55, roughness: 0.88 });
const SP = { a0: 1.2, turns: 7.23, y0: 0.25, y1: 14.2 }, spiralAt = (t) => { const y = SP.y0 + t * (SP.y1 - SP.y0), a = SP.a0 - t * SP.turns, r = wallR(y) - 0.95; return { y, a, p: V(Math.sin(a) * r, y, -Math.cos(a) * r) }; };
{ const steps = [], N = 220; for (let i = 0; i < N; i++) { const q = spiralAt(i / N), q2 = spiralAt((i + 1) / N), len = q.p.distanceTo(q2.p) + 0.02, g = new THREE.BoxGeometry(1.25, 0.16, len);
    const m = new THREE.Matrix4().lookAt(q.p, q2.p, V(0, 1, 0)).setPosition(q.p.clone().lerp(q2.p, 0.5)); g.applyMatrix4(m); steps.push(g); }
  addH(new THREE.Mesh(mergeGeos(steps), mat.stair), 'heartwood_spiral_of_grown_wood', 'hwroom');
  for (let i = 1; i < 12; i++) { const q = spiralAt(i / 12); glow(0xffb866, 0.9, H(0, 0, 0).add(q.p).add(V(0, 0.28, 0)), 0.55); } }
const archShape = (w, h2) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h2 - w / 2); s.absarc(0, h2 - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0); return s; };
function chamber(id, a, y, w, h2, col, { round = false, camY, glowK = 1, back = 5.2 } = {}) {
  const rr = wallR(y + h2 / 2) - 0.42, dir = V(Math.sin(a), 0, -Math.cos(a)), g = new THREE.Group(); g.name = 'chamber_' + id;
  g.position.copy(dir.clone().multiplyScalar(rr)).setY(y); hw.add(g); g.lookAt(H(0, y, 0));
  const rim = addH(new THREE.Mesh(round ? new THREE.RingGeometry(w / 2, w / 2 + 0.22, 48) : new THREE.ShapeGeometry(archShape(w + 0.4, h2 + 0.22)), mat.rib), id + '_rim', id, g); rim.position.z = -0.01; if (round) rim.position.y = h2 / 2;
  const hole = addH(new THREE.Mesh(round ? new THREE.CircleGeometry(w / 2, 48) : new THREE.ShapeGeometry(archShape(w, h2)), round ? new THREE.MeshBasicMaterial({ name: 'window_out', color: col }) : mat.dark), id + '_opening', id, g); if (round) hole.position.y = h2 / 2;
  const mid = H(0, 0, 0).add(dir.clone().multiplyScalar(rr - 0.1)).setY(y + h2 * 0.45);
  glow(round ? 0x8fa8c8 : col, w * 1.7 * glowK, mid, round ? 0.25 : 0.55);
  roomAnchors[id] = H(0, 0, 0).add(dir.clone().multiplyScalar(rr - 0.3)).setY(y + h2 * 0.55);
  roomViews[id] = [roomAnchors[id].clone(), H(0, 0, 0).add(dir.clone().multiplyScalar(rr - back)).setY(camY ?? y + h2 * 0.5 + 0.4)];
  return { g, dir, rr };
}
{ const q = spiralAt(0.42), m = chamber('h_music', q.a, q.y + 0.08, 1.2, 2.0, 0xc4b0ff, { camY: q.y - 1.2, back: 5.6 });
  for (let i = 0; i < 7; i++) addH(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 5), mat.gold), 'music_string_' + (i + 1), 'h_music', m.g).position.set(-0.36 + i * 0.12, 0.85, 0.02); }
{ const m = chamber('h_seed', -0.35, 0, 2.3, 1.35, 0xd08a3a, { camY: 1.6, glowK: 0.8 });
  const apron = addH(new THREE.Mesh(new THREE.CircleGeometry(1.4, 40, 0, Math.PI), new THREE.MeshBasicMaterial({ name: 'descent_shadow', color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })), 'seed_cellar_descent', 'h_seed', m.g); apron.rotation.x = -Math.PI / 2; apron.rotation.z = Math.PI; apron.position.y = 0.012; }
{ const m = chamber('h_friends', -1.9, 0, 1.5, 2.8, 0x8fd47a, { camY: 1.8 });
  const c = new THREE.CatmullRomCurve3([m.dir.clone().multiplyScalar(m.rr - 0.1).setY(0.05), m.dir.clone().multiplyScalar(m.rr - 0.7).add(V(m.dir.z, 0, -m.dir.x).multiplyScalar(0.5)).setY(0.08), m.dir.clone().multiplyScalar(m.rr - 1.3).add(V(m.dir.z, 0, -m.dir.x).multiplyScalar(1.1)).setY(0.03), m.dir.clone().multiplyScalar(m.rr - 1.6).add(V(m.dir.z, 0, -m.dir.x).multiplyScalar(1.5)).setY(-0.6)]);
  mat.passRoot = mat.rootGlow.clone(); mat.passRoot.emissiveIntensity = 0.16; mat.passRoot.color.set(0x5a6a3a);
  addH(new THREE.Mesh(taperTube(c, 0.14, 0.05, 40, 10, 3), mat.passRoot), 'root_passage_down_to_roots', 'h_friends'); }
chamber('h_atlas', 2.2, 4.4, 1.9, 1.9, 0x5a7090, { round: true, camY: 3.2 });
{ const m = chamber('h_staff', 1.75, 0, 1.4, 2.6, 0xf0b860, { camY: 1.7 });
  for (let i = 0; i < 6; i++) addH(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.05, 12), mat.stone), 'passage_stone_' + (i + 1), 'h_staff').position.copy(m.dir.clone().multiplyScalar(m.rr - 0.9 - i * 0.75).setY(0.02)); }
if (D.ext && D.ext.build) D.ext.build('hall', { THREE, V, H, HP, hw, addH, add, mat, glow, chamber, spiralAt, wallR, archShape, taperTube, mergeGeos, roomAnchors, roomViews, S }); // 0.9.5 coverage hook
// the passage you came in by: human-sized, through the living wall
{ const T0 = wallR(1) - 0.6, T1 = T0 + 4.2, tun = addH(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.05, T1 - T0, 28, 1, true), mat.rib), 'heartwood_entrance_passage', 'hwroom');
  tun.material = mat.rib.clone(); tun.material.side = THREE.DoubleSide; tun.rotation.x = Math.PI / 2; tun.position.set(0, 1.1, (T0 + T1) / 2);
  const fl = addH(new THREE.Mesh(new THREE.PlaneGeometry(1.9, T1 - T0), mat.stair), 'heartwood_entrance_floor', 'hwroom'); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.03, (T0 + T1) / 2);
  const lip = addH(new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.16, 10, 40), mat.rib), 'heartwood_entrance_lip', 'hwroom'); lip.position.set(0, 1.1, T0);
  glow(0xffa24a, 3, H(0, 1.1, T1 + 0.3), 0.4); }
roomAnchors.hwroom = H(0, 0.4, 0); roomViews.hwroom = [H(-0.3, 3.6, -1.5), H(1.1, 1.7, 7.9)]; roomViews.hwArrive = [H(0, 1.5, 3), H(0, 1.2, wallR(1) + 2.6)];

// Interiors stay latent until entered: small outside, vast inside. (The small deck on the oak's limb is exterior anatomy and stays visible.)
const councilWorld = new THREE.Group(), hallWorld = new THREE.Group(); councilWorld.name = 'council_interior_world'; hallWorld.name = 'heartwood_hall_world';
{ const cObjs = S.children.slice(_council0, _hall0), hObjs = S.children.slice(_hall0); cObjs.forEach((o) => councilWorld.add(o)); hObjs.forEach((o) => hallWorld.add(o)); }
S.add(councilWorld, hallWorld); councilWorld.visible = hallWorld.visible = false;
const anchors = {
  overview: V(0, 2.7, 0), roots: V(1.9, 0.05, 1.5), trunk: V(0.2, 0.55, 0.5), ring: V(-0.3, 1.6, 0.3), canopy: V(-1.6, 4.1, 0.9),
  c233: V(0.72, 2.72, 0.95), pack: V(1.08, 2.8, 1.3), crown: V(0, 5.8, 0), signal: V(-0.26, 5.46, 0.36), moonroot: V(-0.95, 0.08, 0.9), traces: V(0.36, 1.6, 0.2), seed: V(0.8, 0.1, 0.5), staff: V(3.4, 0.9, -2.4), yew: V(2.7, 1.05, -0.5),
};
const views = {
  overview: [V(0, 2.9, 0.2), V(7.2, 4.1, 9.6)], roots: [V(0.6, 0.3, 0.8), V(4.6, 2.8, 5.6)], trunk: [V(0, 1.0, 0.3), V(1.4, 1.5, 3.6)],
  seed: [V(0.7, 0.25, 0.5), V(2.3, 1.05, 2.3)], ring: [V(0.2, 1.6, 0.1), V(1.7, 2.1, 2.9)], canopy: [V(0, 3.8, 0), V(3.8, 4.9, 6.0)], c233: [V(0.9, 2.95, 1.1), V(2.5, 3.4, 3.4)],
  pack: [V(1.0, 2.9, 1.2), V(2.6, 3.2, 3.3)], crown: [V(0, 5.5, 0), V(1.9, 6.4, 2.8)], signal: [V(-0.1, 5.5, 0.2), V(1.2, 6.0, 2.2)],
  moonroot: [V(-0.8, 0.2, 0.8), V(-2.1, 1.1, 2.6)], traces: [V(0.3, 1.6, 0.2), V(1.4, 1.9, 1.9)], staff: [V(3.2, 0.4, -2.1), V(5.0, 1.6, 1.0)], yew: [V(2.6, 0.5, -0.5), V(4.4, 1.5, 1.6)],
};
if (D.ext) { for (const [k, a] of Object.entries(D.ext.anchors || {})) anchors[k] = V(...a); for (const [k, v] of Object.entries(D.ext.views || {})) views[k] = v.map((p) => V(...p)); } // 0.9.4-dev extension hook
Object.assign(anchors, roomAnchors); Object.assign(views, roomViews);
if (D.ext && D.ext.build) D.ext.build('tree', { THREE, V, tree, add, mat, glow, taperTube, mergeGeos, anchors, views, S }); // 0.9.5 coverage hook
const side = { yew: 'above', r_exit: 'below', people: 'left', owl: 'left', prince: 'left', nephew: 'left', roots: 'right', trunk: 'right', ring: 'left', canopy: 'left', c233: 'right', pack: 'below', crown: 'right', signal: 'left', moonroot: 'below', staff: 'right' };
const shift = { above: 'translate(-50%, calc(-100% - 12px))', below: 'translate(-50%, 12px)', left: 'translate(calc(-100% - 14px), -50%)', right: 'translate(14px, -50%)' };

// Labels — real buttons, projected onto the scene
let place = 'tree';
const placeOf = (id) => { const r = D.nodes[id]?.room; if (r) return r === true ? 'croom' : r; return String(id).startsWith('r_') ? 'croom' : 'tree'; };
const EXTRA = { r_exit: { go: 'canopy', name: 'Step back out', sub: 'The way you came in · back to the canopy' } };
const labelsEl = $('#labels'), labels = {};
const LNAME = X.E ? { c233rec: (D.nodes.c233rec && D.nodes.c233rec.labelName) || 'Treehouse door', yewc233: 'Ankerwycke Yew', people: 'Empty seats', croom: 'Council fire' } : {};
let hoverId = null;
Object.keys(anchors).filter((id) => id !== 'overview' && !(X.E && id === 'r_exit')).forEach((id) => {
  const x = EXTRA[id], n = x || D.nodes[id], b = document.createElement('button');
  b.type = 'button'; b.className = 'lab' + (n.personal ? ' personal' : '') + (x ? ' exit' : ''); b.dataset.go = x ? x.go : id;
  b.innerHTML = `<b>${esc(LNAME[id] || n.name)}</b><span>${esc(x ? x.sub : n.part || n.sub || '')}</span>${x ? '' : `<span class="pr">${esc(n.practical)}</span>`}`;
  const dot = document.createElement('span'); dot.className = 'dot'; labelsEl.appendChild(dot); b._dot = dot;
  b.setAttribute('aria-label', x ? `${x.name}. ${x.sub}.` : `${n.name}${n.part ? ', ' + n.part : ''}. ${n.practical}. ${D.STATUS[n.status].label}.`);
  labelsEl.appendChild(b); labels[id] = b;
});
function visibleE(id) {
  // At most a few labels: the realms at the Tree, the place you chose, what you point at, and what you are looking toward.
  const s = new Set(), ok = (k) => labels[k] && placeOf(k) === place && k !== 'croom' && k !== 'hwroom' && (!D.nodes[k]?.circle || D.nodes[k].circle === D.council.active);
  if (place === 'tree') ['roots', 'trunk', 'canopy', 'crown'].forEach((k) => s.add(k));
  if (id !== 'overview' && ok(id)) s.add(id);
  if (hoverId && ok(hoverId)) s.add(hoverId);
  if (place !== 'tree') { cam.updateMatrixWorld();
    Object.keys(labels).filter((k) => ok(k) && !s.has(k)).map((k) => { const v = anchors[k].clone().project(cam); return { k, d: Math.hypot(v.x, v.y * 1.2), z: v.z, dist: anchors[k].distanceTo(cam.position) }; })
      .filter((o) => o.z < 1 && o.d < (place === 'hw' ? 0.7 : 0.3) && o.dist < (place === 'hw' ? 22 : 6.5)).sort((a, b) => a.d - b.d).slice(0, Math.max(0, (place === 'hw' ? 3 : 1) - s.size)).forEach((o) => s.add(o.k)); }
  return s;
}
function visibleSet(id) {
  if (X.E) return visibleE(id);
  if (place !== 'tree') { const quiet = id === 'croom' || id === 'c232' || id === 'c233now' ? ['c232', 'c233now', 'r_exit', 'croom', 'c232_beech', 'c232_hobby', 'c232_basil', 'c232_blewit', 'c232_saffron', 'c232_galahad', 'owl', 'oregano', 'prince', 'daisy', 'nephew', 'abracadabra', 'people'] : ['hwroom'];
    const s = new Set(Object.keys(labels).filter((k) => placeOf(k) === place && !quiet.includes(k) && (!D.nodes[k]?.circle || D.nodes[k].circle === D.council.active)));
    if (id === 'c232' || id === 'c233now') s.add(D.council.active === 233 ? 'c232' : 'c233now'); return s; }
  const s = new Set(['roots', 'trunk', 'canopy', 'crown', 'staff']);
  if (id !== 'overview' && placeOf(id) === 'tree') { s.add(id); D.nodes[id].relations.forEach((r) => anchors[r.to] && placeOf(r.to) === 'tree' && s.add(r.to)); const p = D.nodes[id].parent; if (p && anchors[p]) s.add(p); }
  return s;
}
function layoutLabels() {
  cam.updateMatrixWorld();
  const w = labelsEl.clientWidth, h = labelsEl.clientHeight, vis = visibleSet(state.current), placed = [], sm = mobileSheet(), L0 = sm ? 8 : 58, T0 = sm ? 64 : 52, B0 = sm ? 112 : 56;
  { const vr = labelsEl.getBoundingClientRect(); document.querySelectorAll('.leave, .whisper.on').forEach((el) => { const r = el.getBoundingClientRect(); if (r.width) placed.push({ x: r.left - vr.left, y: r.top - vr.top, w: r.width, h: r.height }); }); }
  for (const id in labels) {
    const el = labels[id], v = anchors[id].clone().project(cam);
    const on = vis.has(id) && v.z < 1 && Math.abs(v.x) < (place === 'hw' && id !== state.current ? 0.62 : 1.1) && Math.abs(v.y) < 1.1;
    el.hidden = !on; el._dot.hidden = !on; if (!on) continue;
    const x = Math.round((v.x * 0.5 + 0.5) * w), y = Math.round((-v.y * 0.5 + 0.5) * h);
    const lw = el.offsetWidth, lh = el.offsetHeight, s = side[id] || 'right';
    let lx = s === 'left' ? x - lw - 14 : s === 'right' ? x + 14 : x - lw / 2;
    let ly = s === 'above' ? y - lh - 12 : s === 'below' ? y + 12 : y - lh / 2;
    lx = Math.max(L0, Math.min(w - lw - 6, lx)); ly = Math.max(T0, Math.min(h - lh - B0, ly));
    for (let pass = 0; pass < 4; pass++) for (const p of placed) {
      if (lx < p.x + p.w + 4 && lx + lw + 4 > p.x && ly < p.y + p.h + 4 && ly + lh + 4 > p.y) {
        const down = p.y + p.h + 4, up = p.y - lh - 4;
        ly = (ly + lh / 2 >= p.y + p.h / 2 && down + lh <= h - 6) || up < 6 ? down : up;
      }
    }
    const hits = (x, y) => placed.find((p) => x < p.x + p.w + 4 && x + lw + 4 > p.x && y < p.y + p.h + 4 && y + lh + 4 > p.y);
    ly = Math.max(T0, Math.min(h - lh - B0, ly));
    let c = hits(lx, ly);
    if (c) {
      const tries = [[c.x + c.w + 6, ly], [c.x - lw - 6, ly], [lx, c.y - lh - 6], [lx, c.y + c.h + 6]];
      for (const [tx, ty] of tries) { const cx = Math.max(L0, Math.min(w - lw - 6, tx)), cy = Math.max(T0, Math.min(h - lh - B0, ty)); if (!hits(cx, cy)) { lx = cx; ly = cy; c = null; break; } }
    }
    placed.push({ x: lx, y: ly, w: lw, h: lh });
    el.style.transform = `translate(${Math.round(lx)}px, ${Math.round(ly)}px)`;
    el._dot.style.transform = `translate(${x}px, ${y}px)`;
    el.setAttribute('aria-current', id === state.current); el._dot.classList.toggle('on', id === state.current);
  }
}

// Relationship threads for the selected place: solid = established, dashed = proposed
const threads = new THREE.Group(); stage._scene.add(threads);
const solid = new THREE.LineBasicMaterial({ color: 0xf5b82a, transparent: true, opacity: 0.55 });
const dashed = new THREE.LineDashedMaterial({ color: 0xc7bea8, dashSize: 0.08, gapSize: 0.07, transparent: true, opacity: 0.6 });
function relCurve(a, b) {
  const pts = [a.clone()], hi = Math.max(a.y, b.y), lo = Math.min(a.y, b.y);
  if (hi > 2.2 && lo < 0.9) {
    const top = a.y >= b.y ? a : b, bot = top === a ? b : a;
    const flat = (v) => { const f = V(v.x, 0, v.z); return f.lengthSq() < 0.01 ? V(0, 0, 1) : f.normalize(); };
    const dT = flat(top), dB = flat(bot), dM = dT.clone().add(dB); if (dM.lengthSq() < 0.01) dM.set(0, 0, 1); dM.normalize();
    const via = [dT.clone().multiplyScalar(0.36).setY(2.5), dM.clone().multiplyScalar(0.47).setY(1.5), dB.clone().multiplyScalar(0.66).setY(0.3)];
    pts.push(...(top === a ? via : via.reverse()));
  } else pts.push(a.clone().add(b).multiplyScalar(0.5).add(V(0, 0.25, 0)));
  pts.push(b.clone()); return new THREE.CatmullRomCurve3(pts);
}
function drawThreads(id) {
  threads.clear(); solid.color.setStyle(REALM[realmOf(id)].acc); if (id === 'overview' || !anchors[id]) return;
  D.nodes[id].relations.forEach((r) => {
    if (!anchors[r.to] || r.to === 'overview' || placeOf(r.to) !== placeOf(id)) return;
    const pts = relCurve(anchors[id], anchors[r.to]).getPoints(48);
    const proposed = r.kind === 'proposed' || r.pending || D.nodes[r.to].status !== 'LIVE';
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), proposed ? dashed : solid);
    if (proposed) line.computeLineDistances();
    threads.add(line);
  });
}

// Camera flights
let flight = null, settleCb = null;
function fitView(id, v) { // narrow portrait screens: step back a little so places are not cropped (the seat view keeps its intimacy)
  if (!v) return v; const a = cam.aspect; if (a >= 0.72) return v;
  if (X.B && id === 'croom') return (D.ext && D.ext.portraitCroom) || [W(0, 0.85, -1.0), W(0.05, 1.0, 2.9)]; // portrait: the seat in line with the door, so fire, door and name stack
  const k = Math.min(1.55, Math.pow(0.72 / a, 0.75)); return [v[0], v[0].clone().add(v[1].clone().sub(v[0]).multiplyScalar(k))]; }
function flyTo(id, dur = 1800) { lastInput = performance.now();
  const v = fitView(id, views[id]); if (!v) return;
  if (!state.motion) { controls.target.copy(v[0]); cam.position.copy(v[1]); controls.update(); stage._renderer.render(stage._scene, cam); return; }
  const fromP = cam.position.clone(), fromT = controls.target.clone(), dist = fromP.distanceTo(v[1]) + 0.5 * fromT.distanceTo(v[0]);
  const d2 = Math.max(dur * 0.85, Math.min(3400, 1300 + dist * 170));
  const mid = fromP.clone().lerp(v[1], 0.5), rise = v[1].y - fromP.y, out = V(mid.x, 0, mid.z); if (out.lengthSq() < 1e-4) out.set(0, 0, 1); out.normalize();
  const R = D.nodes[id] ? (id === 'overview' ? 'overview' : place === 'hw' ? 'trunk' : realmOf(id)) : null;
  const DIALECT = { canopy: [0.7, 1.0, 1.0, 0], crown: [0.7, 1.15, 1.05, 0], roots: [1.25, -0.35, 1.08, 0.35], trunk: [0.3, 0.1, 1.18, 0.7], overview: [1.35, 0.45, 1.05, 0.15] }[R] || [0.7, 0.25, 1, 0];
  const bulge = Math.min(2.2, dist * 0.16), ctrl = mid.add(out.multiplyScalar(bulge * (rise < -0.5 ? Math.max(1.1, DIALECT[0]) : DIALECT[0]))).add(V(0, bulge * (rise > 0.5 ? Math.max(0.7, DIALECT[1]) : DIALECT[1]), 0));
  flight = { t0: performance.now(), dur: d2 * DIALECT[2], fromT, fromP, toT: v[0], toP: v[1], ctrl: dist > 1.2 ? ctrl : null, settle: DIALECT[3] };
}
function frame(now) {
  if (flight) {
    let k = Math.max(0, Math.min(1, (now - flight.t0) / flight.dur)); const kc = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, kq = 1 - Math.pow(1 - k, 4); k = kc + (kq - kc) * (flight.settle || 0);
    const raw = Math.max(0, Math.min(1, (now - flight.t0) / flight.dur)), g = Math.min(1, raw * 1.18), kg = g < 0.5 ? 4 * g * g * g : 1 - Math.pow(-2 * g + 2, 3) / 2;
    if (flight.path) controls.target.copy(flight.path.getPoint(k)).lerp(flight.toT, k * k); else controls.target.lerpVectors(flight.fromT, flight.toT, kg);
    if (flight.ctrl) { const a = flight.fromP, c = flight.ctrl, b = flight.toP, u = 1 - k; cam.position.set(u * u * a.x + 2 * u * k * c.x + k * k * b.x, u * u * a.y + 2 * u * k * c.y + k * k * b.y, u * u * a.z + 2 * u * k * c.z + k * k * b.z); }
    else cam.position.lerpVectors(flight.fromP, flight.toP, k);
    document.body.classList.toggle('moving', raw < 0.82);
    if (k >= 1) { flight = null; document.body.classList.remove('moving'); if (settleCb) { const f = settleCb; settleCb = null; f(); } }
  }
  if (sapAnim) { const k = Math.max(0, (now - sapAnim.t0) / sapAnim.dur); if (k >= 1) { sapMote.visible = false; sapAnim = null; } else { sapMote.visible = now >= sapAnim.t0; sapMote.position.copy(sapAnim.path.getPoint(Math.min(1, k))); sapMote.material.opacity = Math.sin(Math.PI * Math.min(1, k)) * (sapAnim.soft ? 0.4 : 0.6); sapMote.scale.setScalar(sapAnim.soft ? 0.16 : 0.26); } }
  if (place === 'hw' && !flight && !(D.ext && D.ext.away)) { const lx = cam.position.x - HP.x, lz = cam.position.z - HP.z, r = Math.hypot(lx, lz), lim = wallR(cam.position.y) - 1.0;
    if (r > lim) { cam.position.x = HP.x + lx / r * lim; cam.position.z = HP.z + lz / r * lim; }
    cam.position.y = Math.max(0.6, Math.min(16, cam.position.y)); }
  focusHalo.material.opacity += (focusTarget - focusHalo.material.opacity) * (state.motion ? 0.06 : 1);
  if (state.motion) life.forEach((f) => f(now));
  if (state.mode === '3d') layoutLabels();
}
function tick(now) { if (cam.near > 0.05) { cam.near = 0.05; cam.updateProjectionMatrix(); } frame(now); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
controls.addEventListener('start', () => { if (quietEnd) quietEnd(); flight = null; document.body.classList.remove('moving'); lastInput = performance.now(); controls.autoRotate = false; });
canvas.addEventListener('wheel', () => { lastInput = performance.now(); }, { passive: true });

// Picking (tap/click without drag)
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
const hit = (e) => { const r = canvas.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam); const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; }, h = ray.intersectObjects(pickables, false).find((x) => shown(x.object)); return h && h.object.userData.node; };
canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { const id = hit(e); go(id || 'overview', { focus: false }); } down = null; });
canvas.addEventListener('pointermove', (e) => { if (e.buttons) return; const hh = hit(e); canvas.style.cursor = hh ? 'pointer' : 'grab'; hoverId = hh || null; });
canvas.addEventListener('pointerleave', () => { hoverId = null; });

function applyCircle() {
  const c = circle(), L = c.level;
  warm.intensity = 2.2 * L; gLan.material.opacity = Math.min(1, 0.8 * L); mat.lantern.emissiveIntensity = 1.6 * L;
  mat.lantern.color.set(L < 0.5 ? 0x9a6a3a : 0xf2c46a);
  const sp = labels.c233?.querySelector('span'); if (sp) sp.textContent = (D.council.theme || 'The Equinox Threshold') + ' · ' + c.short;
  if (typeof paintSign === 'function') paintSign();
}
applyCircle();
function flyAlong(id, path) { lastInput = performance.now(); const v = fitView(id, views[id]); flight = { t0: performance.now(), dur: 2300, fromT: controls.target.clone(), fromP: cam.position.clone(), toT: v[0], toP: v[1], path }; }
const veil = $('#veil');
window.__tetol = { tree, cam, THREE, controls, ARCH, renderPanel, step() { frame(performance.now()); controls.update(); stage._renderer.render(stage._scene, cam); } };
const md0 = controls.maxDistance;
const setCam = (k) => { flight = null; const v = fitView(k, views[k]); controls.target.copy(v[0]); cam.position.copy(v[1]); controls.update(); };
// A · Presence before interface: interface withdraws, camera settles, stillness, the question once, then controls return.
let quietAfter = null, qTimers = [];
function startQuiet(question) {
  if (!X.A) return; if (quietEnd) quietEnd();
  const b = document.body, w = $('#whisper'), T = (fn, ms) => qTimers.push(setTimeout(fn, ms));
  const skip = () => finish();
  const finish = () => { qTimers.forEach(clearTimeout); qTimers = []; settleCb = null; quietAfter = null; quietEnd = null; delete b.dataset.q;
    if (w.classList.contains('on')) { clearTimeout(whisperTimer); whisperTimer = setTimeout(() => w.classList.remove('on'), 2200); }
    removeEventListener('keydown', skip, true); canvas.removeEventListener('pointerdown', skip); };
  const ret = () => { b.dataset.q = 'return'; T(finish, state.motion ? 1100 : 500); };
  quietEnd = finish; b.dataset.q = 'still';
  quietAfter = () => T(() => { if (!question) return ret(); b.dataset.q = 'question'; clearTimeout(whisperTimer); w.textContent = question; w.classList.add('on');
    T(() => w.classList.remove('on'), 3200); T(ret, 3200 + (state.motion ? 500 : 0)); }, 1500);
  setTimeout(() => { addEventListener('keydown', skip, true); canvas.addEventListener('pointerdown', skip); }, 0);
}
const settleQuiet = () => { if (!quietAfter) return; const f = quietAfter; quietAfter = null; if (flight) settleCb = f; else f(); };
function crossTo(want, then) {
  const swap = () => { const from = place; place = want; councilWorld.visible = want === 'croom'; hallWorld.visible = want === 'hw'; document.body.classList.toggle('inroom', want !== 'tree'); document.body.classList.toggle('inhw', want === 'hw');
    const lv = document.querySelector('.leave'); if (lv) { lv.dataset.go = want === 'hw' ? 'trunk' : 'canopy'; lv.textContent = want === 'hw' ? '↩ Step back out of the trunk' : '↩ Step back out to the canopy'; }
    controls.maxDistance = want === 'hw' ? 9.6 : md0; if (!window.__fov0) window.__fov0 = cam.fov; cam.fov = want === 'hw' ? 64 : window.__fov0; cam.updateProjectionMatrix(); S.fog.color.set(want === 'hw' ? 0x2a1a10 : 0x27303c); S.fog.density = want === 'hw' ? 0.018 : 0.024; dusk.intensity = want === 'hw' ? 0.12 : want === 'croom' ? 0.55 : 1.05; if (want === 'croom') revealT0 = performance.now(); controls.maxPolarAngle = want === 'tree' ? Math.PI * 0.49 : want === 'hw' ? Math.PI * 0.8 : Math.PI * 0.72; then(from); layoutLabels(); };
  if (!state.motion) { swap(); return; }
  veil.classList.add('on'); setTimeout(() => { swap(); setTimeout(() => veil.classList.remove('on'), 60); }, 620);
}
scene3d = { circle: applyCircle, select(id, prev) {
  if (id === 'c232') setCircle(232); else if (id === 'c233now' || id === 'croom') setCircle(233); else if (D.nodes[id]?.circle && D.nodes[id].circle !== D.council.active && placeOf(id) === 'croom') setCircle(D.nodes[id].circle);
  drawThreads(id);
  const n = D.nodes[id], want = placeOf(id);
  if (want !== place) {
    focusTarget = 0;
    const outside = place === 'tree';
    if (want === 'croom') {
      if (state.motion && outside) flyTo('c233', 900);
      startQuiet(id === 'croom' || id === 'people' ? D.nodes.croom.question : null);
      setTimeout(() => crossTo('croom', () => { setCam(state.motion ? 'croomArrive' : id); flyTo(id, id === 'croom' ? 3400 : 2000); settleQuiet(); }), state.motion && outside ? 520 : 0);
    } else if (want === 'hw') {
      if (state.motion && outside) flyTo('trunk', 900);
      setTimeout(() => crossTo('hw', () => { setCam(state.motion ? 'hwArrive' : id); flyTo(id, id === 'hwroom' ? 5200 : 2600); }), state.motion && outside ? 520 : 0);
    } else crossTo('tree', (from) => {
      setCam(from === 'hw' ? 'trunk' : 'c233');
      if (id === 'yew' && from === 'croom' && state.motion) { const path = relCurve(anchors.c233, anchors.yew); flyAlong(id, path); sapAnim = { t0: performance.now() + 2500, dur: 3200, path: yewRootCurve, soft: true }; }
      else flyTo(n.spatial ? id : 'overview', id === 'overview' ? 2600 : 1500);
    });
    return;
  }
  focusTarget = n.scale === 'record' && anchors[id] ? 0.5 : 0;
  if (focusTarget) { focusHalo.position.copy(anchors[id]); focusHalo.material.color.setStyle(REALM[realmOf(id)].acc); }
  const linked = typeof prev === 'string' && prev !== id && prev !== 'overview' && anchors[prev] && anchors[id] && views[id]
    && (D.nodes[prev].relations.some((r) => r.to === id) || n.relations.some((r) => r.to === prev));
  if (linked && state.motion) { const path = relCurve(anchors[prev], anchors[id]); flyAlong(id, path); sapAnim = { t0: performance.now(), dur: 2300, path }; }
  else flyTo(n.spatial ? id : state.current === id ? 'overview' : id);
} };
controls.addEventListener('change', () => state.mode === '3d' && layoutLabels());
new ResizeObserver(() => layoutLabels()).observe(labelsEl);
if (startAt) { cam.position.copy(views.overview[1]); controls.target.copy(views.overview[0]); controls.update(); scene3d.select(startAt); }
else if (state.motion) { document.body.classList.add('arriving'); setTimeout(() => document.body.classList.remove('arriving'), 3600); cam.position.set(0.9, 0.35, 3.0); controls.target.set(0, 0.7, 0); controls.update(); drawThreads(state.current); flyTo('overview', 4200); }
else { cam.position.copy(views.overview[1]); controls.target.copy(views.overview[0]); controls.update(); scene3d.select(state.current); }
layoutLabels(); stage._renderer.render(stage._scene, cam);
