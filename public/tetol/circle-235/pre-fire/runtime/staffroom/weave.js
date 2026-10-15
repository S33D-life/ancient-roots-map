// TETOL Staff Room · weave (2026-10-15). Not generated: hand-written, small, and separate from the preserved room.
// It adds, and changes nothing the room already does:
//   · a link from each staff's panel to its canonical 2D record on S33D (/staff/<code>);
//   · the 2D Staff Room in place of the Library Index's dead link to an earlier design file;
//   · the photograph fallback that the room wrote as an inline handler (refused by the site's CSP);
//   · arrival at one staff from a deep link (#record=<code>) or a { tetolIntent: 1, name: 'record' } message.
// Only the Founding 144 have 2D records. Oak and Yew Circle 4 (lineage unresolved) get an honest note instead.
const DISPLAY = { CHERRY: 'CHER', PRIVET: 'PRIV', WILLOW: 'WIL' };
const FROM_DISPLAY = Object.fromEntries(Object.entries(DISPLAY).map(([k, v]) => [v, k]));
const FOUNDING_CIRCLES = { OAK: 3, YEW: 3, ASH: 1, BEE: 1, HOL: 1 };
const STAFF_ROOM_2D = '/library/staff-room';
const EMBED = (window.name === 'tetol-interior:staffroom' || window.name === 'tetol-staffroom') && window.parent !== window;

export function toRecord(itemId) {
  let m = /^([A-Z]+)-O$/.exec(itemId || '');
  if (m) return DISPLAY[m[1]] || m[1];
  m = /^([A-Z]+)-C(\d+)S(\d+)$/.exec(itemId || '');
  if (m && +m[2] <= (FOUNDING_CIRCLES[m[1]] || 0) && +m[3] >= 1 && +m[3] <= 12) return `${DISPLAY[m[1]] || m[1]}-C${m[2]}S${m[3]}`;
  return null;
}
export function fromRecord(code) {
  const up = String(code || '').toUpperCase();
  let m = /^([A-Z]+)$/.exec(up), id = null;
  if (m) id = `${FROM_DISPLAY[m[1]] || m[1]}-O`;
  m = /^([A-Z]+)-C(\d+)S(\d+)$/.exec(up);
  if (m) id = `${FROM_DISPLAY[m[1]] || m[1]}-C${+m[2]}S${+m[3]}`;
  return id && toRecord(id) === up ? id : null;
}

// Photograph fallback (was onerror="this.parentNode.classList.add('fail')").
document.addEventListener('error', (e) => {
  const t = e.target;
  if (t instanceof HTMLImageElement && t.hasAttribute('data-ph-fallback')) t.parentNode?.classList.add('fail');
}, true);

const until = (ok, every = 80) => new Promise((res) => { const t = () => (ok() ? res(ok()) : setTimeout(t, every)); t(); });
const room = await until(() => window.__room);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function decoratePanel() {
  const p = document.getElementById('panel');
  const id = room.S.mode === 'staff' ? room.S.item : null;
  if (!p || !id) return;
  const had = p.querySelector('.weave-record');
  if (had && had.dataset.item === id) return;
  had?.remove();
  const code = toRecord(id);
  const box = document.createElement('div');
  box.className = 'sec weave-record'; box.dataset.item = id;
  box.innerHTML = code
    ? `<div class="k">Its record on S33D</div><a class="pill" href="/staff/${esc(code)}" target="_top" style="display:inline-flex;align-items:center;text-decoration:none;margin-top:8px">Open staff ${esc(code)} →</a><div class="basis">The canonical page: its NFT, lineage and QR. Back in your browser returns you to this staff.</div>`
    : `<div class="k">Its record on S33D</div><div class="basis">This staff sits outside the Founding 144, so it has no page on S33D yet. Its record is held in Notion.</div>`;
  const anchor = p.querySelector('details') || p.querySelector('.navr');
  anchor ? anchor.before(box) : p.appendChild(box);
  if (!EMBED && code) history.replaceState(null, '', location.pathname + location.search + '#record=' + encodeURIComponent(code));
}
function decorateIndex() {
  const a = document.querySelector('#index a[href="Staff Library Seed.dc.html"]');
  if (!a) return;
  a.href = STAFF_ROOM_2D; a.target = '_top';
  a.textContent = 'The Staff Room in 2D: every staff’s record on S33D →';
}
new MutationObserver(() => { decoratePanel(); decorateIndex(); })
  .observe(document.getElementById('ui'), { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });

// Arrive at one staff. The room's own arrival plays first (presence before interface), then the camera goes to the staff.
async function meet(code) {
  const id = fromRecord(code);
  if (!id || !room.C.items[id]) return false;
  await until(() => room.S.arrived && room.S.mode !== 'arrive');
  room.select(id);
  return true;
}
const deep = /^#record=([^&]+)$/.exec(location.hash);
if (deep) meet(decodeURIComponent(deep[1]));
addEventListener('message', (e) => {
  if (e.source !== window.parent || window.parent === window) return;
  const d = e.data;
  if (d && d.tetolIntent === 1 && d.name === 'record' && typeof d.arg === 'string') meet(d.arg);
});
window.__staffroomWeave = { toRecord, fromRecord, meet };
