// Preserved from the TETOL Staff Room interior (5eaf7c1e-2b0d-4c3a-9f61-7a1d3b8e0c42); see scripts/tetol-staffroom.mjs.

/* STAFF ROOM × STAFF SPIRAL · spatial unification experiment (not canonical)
   The Library's spiral is inlaid in the roundhouse floor. Each species point is a
   brass stud; where a family is realised (Oak, Yew, Ash, Beech, Holly) its 13th
   staff stands in the stud and its circles bloom outward off the spiral.
   Records come from SeedCollection (staff-collection.js); nothing here adds data. */
import * as THREE from '../../vendor/three/build/three.module.js';

const RH = await new Promise((res) => { const t = () => (window.__roundhouse && window.SeedCollection) ? res(window.__roundhouse) : setTimeout(t, 60); t(); });
const { house, stage, WOOD, gnarl, applyCut, anim } = RH;
const C = window.SeedCollection;
const cam = stage._camera, controls = stage._controls, renderer = stage._renderer, dom = renderer.domElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIO = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nodeOf = (id) => C.nodes.find((n) => n.id === id);
const W = () => dom.clientWidth || innerWidth, H = () => dom.clientHeight || innerHeight, mob = () => W() < 700;
const FRAME = /[?&]frame=\d+x\d+/.test(location.search);
/* Inside TETOL: the room opens from the Tree and returns to it. */
const EMBED = (window.name === 'tetol-interior:staffroom' || window.name === 'tetol-staffroom') && window.parent !== window;
const toTree = (msg) => { try { window.parent.postMessage({ tetolInterior: 1, id: 'staffroom', ...msg }, '*'); } catch (e) {} };

/* ---------- the room gives way to the Library ---------- */
stage.shadowRoot?.querySelectorAll('.toolbar,.note').forEach((e) => (e.style.display = 'none'));
/* rugs covered the floor the spiral is cut into; the wall rack's 36 staffs were
   generic stand-ins with guessed woods (their NFT frames stay on the wall) */
house.traverse((o) => { if (o.name === 'woven_rugs' || /^(staff_\d\d_|label_\d\d_)/.test(o.name)) o.visible = false; });
const roof = [];
house.traverse((o) => { if (o.isMesh && /^(thatch_|roof_|rafter_|smoke_hole_ring|oak_ring_beam|hearth_smoke)/.test(o.name)) roof.push(o); });
let roofHidden = false;
function setRoof(hide) { if (hide === roofHidden) return; roofHidden = hide; if (!hide) { roof.forEach((m) => (m.visible = true)); applyCut(true); } }
/* posts standing between the eye and what is being approached thin out, as the walls do */
const posts = []; house.traverse((o) => { if (o.isMesh && /^oak_post_/.test(o.name)) { o.material = o.material.clone(); o.material.name = 'oak_post_frame'; o.material.transparent = true; posts.push(o); } });
function fadePosts(dt) {
  const c = cam.position, t = controls.target, ta = Math.atan2(t.x - c.x, t.z - c.z), td = Math.hypot(t.x - c.x, t.z - c.z);
  const cone = Math.atan(Math.tan(cam.fov * Math.PI / 360) * cam.aspect) * 1.05;
  for (const p of posts) {
    const pa = Math.atan2(p.position.x - c.x, p.position.z - c.z), pd = Math.hypot(p.position.x - c.x, p.position.z - c.z);
    let da = Math.abs(pa - ta); if (da > Math.PI) da = 2 * Math.PI - da;
    const want = S.mode !== 'library' && S.mode !== 'room' && S.mode !== 'arrive' && pd < td + 1.2 && da < cone ? 0.12 : 1;
    const m = p.material; m.opacity += (want - m.opacity) * (1 - Math.exp(-dt / 260)); m.depthWrite = m.opacity > 0.9; p.castShadow = true;
  }
}
const beam = roof.filter((m) => m.name === 'oak_ring_beam');
function roofTick() { setRoof(S.mode === 'library' || cam.position.y > 3.6); if (roofHidden) for (const m of roof) m.visible = false; else { const hi = cam.position.y > 2.3; for (const m of beam) m.visible = !hi; } }
anim.push(roofTick);

/* ---------- spiral geometry (metres, floor plane) ---------- */
const R0 = 1.75, PITCH = 0.85, B = PITCH / (2 * Math.PI), REND = 4.5, TH_END = (REND - R0) / B, A0 = -TH_END;
const pts = [];
{ let s = 0; for (let th = 0; th <= TH_END + 1e-9; th += 0.003) { const r = R0 + B * th, a = A0 + th; pts.push({ s, r, a, x: r * Math.sin(a), z: r * Math.cos(a) }); s += Math.hypot(r, B) * 0.003; } }
const L = pts[pts.length - 1].s;
function at(s) {
  s = clamp(s, 0, L); let lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].s < s) lo = m; else hi = m; }
  const p = pts[lo], q = pts[hi], f = (s - p.s) / ((q.s - p.s) || 1);
  return { s, x: p.x + (q.x - p.x) * f, z: p.z + (q.z - p.z) * f, a: p.a + (q.a - p.a) * f, r: p.r + (q.r - p.r) * f };
}
const radial = (q) => ({ x: Math.sin(q.a), z: Math.cos(q.a) });
const TD = { x: 0, z: -3.15, h: 0.7 };
const inHatch = (x, z, m) => Math.abs(x - TD.x) < TD.h + m && Math.abs(z - TD.z) < TD.h + m;
const POSTS = Array.from({ length: 8 }, (_, i) => { const a = Math.PI * 0.125 + i * Math.PI * 0.25; return { x: 3.1 * Math.sin(a), z: 3.1 * Math.cos(a) }; });
const nearPost = (x, z, m) => POSTS.some((p) => Math.hypot(p.x - x, p.z - z) < m);

const RING_R = 0.28, RING_GAP = 0.7, OUT = 0.47, MEMBER_LEN = 1.15;
function ringCentres(n, s) {
  const m = n.clusters.length; if (!m) return [];
  const offs = n.clusters.map((_, i) => (i - (m - 1) / 2) * RING_GAP), lo = s + offs[0], shift = lo < 0.2 ? 0.2 - lo : 0;
  return offs.map((o) => { const q = at(s + o + shift), r = radial(q); return { x: q.x + r.x * OUT, z: q.z + r.z * OUT, o: r }; });
}
function blocked(n, s) {
  const q = at(s); if (inHatch(q.x, q.z, 0.35) || nearPost(q.x, q.z, 0.3)) return true;
  return ringCentres(n, s).some((c) => inHatch(c.x, c.z, RING_R + 0.2) || nearPost(c.x, c.z, RING_R + 0.24));
}
const ORDER = C.nodes.slice().sort((a, b) => a.order - b.order);
const TAIL = 2.4, S0 = 1.1;
let place = [];
for (let sp = (L - TAIL - S0) / (ORDER.length - 1); sp > 0.6; sp -= 0.03) {
  let shift = 0;
  place = ORDER.map((n, i) => { let s = S0 + i * sp + shift, g = 0; while (blocked(n, s) && g++ < 50) { s += 0.05; shift += 0.05; } return s; });
  if (place[place.length - 1] <= L - TAIL * 0.7) break;
}
const S_LAST = place[place.length - 1];

/* ---------- materials ---------- */
function glowCanvas() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 4;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 1024, 0);
  g.addColorStop(0, '#2a2a2a'); g.addColorStop(0.44, '#2a2a2a'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.53, '#2a2a2a'); g.addColorStop(1, '#2a2a2a');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 4);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = glowCanvas();
const std = (o) => new THREE.MeshStandardMaterial(o);
const MAT = {
  brass: std({ name: 'lib_spiral_brass_inlay', color: 0xa8834a, metalness: 0.7, roughness: 0.36, emissive: 0xffa24a, emissiveMap: glowTex, emissiveIntensity: 0, side: THREE.DoubleSide }),
  tail: std({ name: 'lib_spiral_growing_tip', color: 0x8f7446, metalness: 0.6, roughness: 0.45, emissive: 0xffa24a, emissiveIntensity: 0.05, side: THREE.DoubleSide }),
  groove: std({ name: 'lib_spiral_groove', color: 0x221a12, roughness: 0.97, side: THREE.DoubleSide }),
  stud: std({ name: 'lib_species_point_brass', color: 0xb08a4e, metalness: 0.75, roughness: 0.32, emissive: 0xffb35c, emissiveIntensity: 0.04 }),
  collar: std({ name: 'lib_origin_collar_brass', color: 0xb99355, metalness: 0.8, roughness: 0.3, emissive: 0xffb35c, emissiveIntensity: 0 }),
  ring: std({ name: 'lib_circle_ring_brass', color: 0x9c7a45, metalness: 0.7, roughness: 0.4, emissive: 0xffb85e, emissiveIntensity: 0.05, side: THREE.DoubleSide }),
  dash: std({ name: 'lib_circle_ring_unresolved', color: 0xd6cbb2, roughness: 0.85, emissive: 0xf1e6cc, emissiveIntensity: 0, side: THREE.DoubleSide }),
  socket: std({ name: 'lib_staff_socket', color: 0x1a140e, roughness: 1 }),
  peg: std({ name: 'lib_unresolved_record_peg', color: 0xd9ceb4, roughness: 0.9 }),
};
const halo = (col, op) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
const WOODKEY = { OAK: 'oak', YEW: 'yew', ASH: 'ash', BEE: 'beech', HOL: 'holly' };

const lib = new THREE.Group(); lib.name = 'staff_library_floor_spiral';
const flat = (m) => { m.rotation.x = -Math.PI / 2; return m; };

/* ---------- inlay ribbons ---------- */
function ribbon(samples, width, y, mat, name) {
  const pos = [], uv = [], nor = [], idx = [];
  samples.forEach((p, i) => {
    const a = samples[Math.max(0, i - 1)], b = samples[Math.min(samples.length - 1, i + 1)];
    let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const w = width(p.s) / 2;
    pos.push(p.x - tz * w, y, p.z + tx * w, p.x + tz * w, y, p.z - tx * w);
    uv.push(p.s / L, 0, p.s / L, 1); nor.push(0, 1, 0, 0, 1, 0);
    if (i) { const k = (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.name = name; m.receiveShadow = true; return m;
}
const wBrass = (s) => 0.024 - 0.011 * (s / L), wGroove = (s) => wBrass(s) + 0.016;
{
  const runs = []; let run = [];
  for (let i = 0; i < pts.length; i += 3) {
    const p = pts[i]; if (p.s > S_LAST + 0.3) break;
    if (inHatch(p.x, p.z, 0.03)) { if (run.length > 1) runs.push(run); run = []; } else run.push(p);
  }
  if (run.length > 1) runs.push(run);
  runs.forEach((r, i) => { lib.add(ribbon(r, wGroove, 0.0006, MAT.groove, `lib_spiral_groove_${i + 1}`)); lib.add(ribbon(r, wBrass, 0.0013, MAT.brass, `lib_spiral_inlay_${i + 1}`)); });
  /* the growing tip: the line keeps going, dotted, out under the door */
  let d = 0;
  for (let s = S_LAST + 0.42; s < L; s += 0.19) {
    const seg = []; for (let u = 0; u <= 0.07; u += 0.012) seg.push(at(s + u));
    lib.add(ribbon(seg, () => 0.012, 0.0013, MAT.tail, `lib_spiral_tip_${++d}`));
  }
  for (let r = REND + 0.12; r < 5.7; r += 0.19) {
    const seg = []; for (let u = 0; u <= 0.07; u += 0.012) { const rr = r + u, a = 0.02; seg.push({ s: L, x: rr * Math.sin(a), z: rr * Math.cos(a) }); }
    lib.add(ribbon(seg, () => 0.011, 0.0013, MAT.tail, `lib_spiral_tip_${++d}`));
  }
}

/* ---------- species points, origin staffs, families ---------- */
function staffGeo(len, r, seed, amp) {
  const g = new THREE.CylinderGeometry(r * 0.78, r * 1.08, len, 10, Math.max(6, Math.round(len * 10)));
  gnarl(g, len, seed, amp, 0.01); g.translate(0, len / 2, 0); return g;
}
const G_SOCK = new THREE.CircleGeometry(1, 20), G_RINGT = new THREE.RingGeometry(0.78, 1, 40), G_HALO = new THREE.RingGeometry(0.86, 1, 48);
const points = {}, fams = {};
ORDER.forEach((n, i) => {
  const s = place[i], q = at(s), o = radial(q), origin = C.items[n.originId];
  const P = { n, s, q, o, top: 0.02 };
  const sock = flat(new THREE.Mesh(G_SOCK, MAT.groove)); sock.scale.setScalar(0.062); sock.position.set(q.x, 0.0018, q.z); sock.name = `lib_point_${n.code}_groove`;
  const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.047, 0.006, 28), MAT.stud); stud.position.set(q.x, 0.003, q.z); stud.name = `lib_point_${n.code}_stud`;
  lib.add(sock, stud);
  if (n.clusters.length) {
    const len = parseFloat((origin.fields.find((f) => f[0] === 'Length') || [0, '120'])[1]) / 100;
    const st = new THREE.Mesh(staffGeo(len, 0.021, i * 7 + 3, 0.14), WOOD[WOODKEY[n.id]]);
    st.name = `lib_origin_staff_${n.code}_13th`; st.position.set(q.x, 0.004, q.z); st.rotation.y = hash(n.id) * 6; st.castShadow = true;
    const col = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.007, 8, 28), MAT.collar); col.name = `lib_origin_collar_${n.code}`;
    col.rotation.x = -Math.PI / 2; col.position.set(q.x, 0.008, q.z);
    lib.add(st, col); P.top = len; P.len = len;
    const F = { n, P, bloom: 0, target: 0, rings: [], dirty: true };
    ringCentres(n, s).forEach((c, ci) => {
      const cl = n.clusters[ci], unres = cl.cohort !== 'founding_144';
      const ringMesh = unres ? new THREE.Group() : flat(new THREE.Mesh(new THREE.RingGeometry(RING_R - 0.008, RING_R + 0.008, 72), MAT.ring));
      if (unres) for (let k = 0; k < 18; k++) { const d = flat(new THREE.Mesh(new THREE.RingGeometry(RING_R - 0.007, RING_R + 0.007, 5, 1, (k / 18) * Math.PI * 2, (Math.PI * 2 / 18) * 0.55), MAT.dash)); d.name = `lib_${cl.id}_unresolved_ring_dash_${k + 1}`; ringMesh.add(d); }
      ringMesh.name = `lib_${cl.id}_floor_ring`;
      const bud = flat(new THREE.Mesh(G_RINGT, unres ? MAT.dash : MAT.ring)); bud.name = `lib_${cl.id}_bud`;
      lib.add(ringMesh, bud);
      const phi0 = Math.atan2(c.o.x, c.o.z);
      const members = cl.memberIds.map((id, k) => {
        const it = C.items[id], peg = it.lineage === 'unresolved' && !it.photo.large;
        const phi = phi0 - k * (Math.PI / 6), d = { x: Math.sin(phi), z: Math.cos(phi) };
        const mesh = peg
          ? new THREE.Mesh(staffGeo(0.13, 0.019, hash(id) * 99, 0.04), MAT.peg)
          : new THREE.Mesh(staffGeo(MEMBER_LEN, 0.016, hash(id) * 997, 0.13), WOOD[WOODKEY[n.id]]);
        mesh.name = peg ? `lib_${id}_record_peg` : `lib_${id}_staff`;
        mesh.rotation.set((hash(id + 'x') - 0.5) * 0.03, hash(id + 'y') * 6, (hash(id + 'z') - 0.5) * 0.03);
        const so = flat(new THREE.Mesh(G_SOCK, MAT.socket)); so.name = `lib_${id}_socket`;
        lib.add(mesh, so);
        return { id, k, d, peg, mesh, so, len: peg ? 0.13 : MEMBER_LEN, base: V(0, 0, 0) };
      });
      F.rings.push({ cid: cl.id, ci, label: cl.label, unres, full: c, o: c.o, ringMesh, bud, members, cur: { x: q.x, z: q.z }, rr: 0 });
    });
    fams[n.id] = F;
  }
  points[n.id] = P;
});
/* the Founding lens: a faint root ring at every founding origin; a broken pale ring where unresolved records grow */
const lensGold = halo(0xe2b86a, 0), lensPale = halo(0xf1e6cc, 0);
for (const id in points) {
  const P = points[id], g = flat(new THREE.Mesh(new THREE.RingGeometry(0.1, 0.112, 48), lensGold)); g.position.set(P.q.x, 0.004, P.q.z); g.name = `lib_lens_founding_${P.n.code}`; lib.add(g);
  if (P.n.clusters.some((c) => c.cohort !== 'founding_144')) for (let k = 0; k < 14; k++) {
    const dsh = flat(new THREE.Mesh(new THREE.RingGeometry(0.15, 0.16, 4, 1, (k / 14) * Math.PI * 2, (Math.PI * 2 / 14) * 0.5), lensPale)); dsh.position.set(P.q.x, 0.004, P.q.z); dsh.name = `lib_lens_unresolved_${P.n.code}_${k + 1}`; lib.add(dsh);
  }
}
const hoverHalo = flat(new THREE.Mesh(G_HALO, halo(0xffd89a, 0.85))); hoverHalo.name = 'lib_hover_halo'; hoverHalo.visible = false;
const selHalo = flat(new THREE.Mesh(G_HALO, halo(0xfff3dc, 0.95))); selHalo.name = 'lib_selected_halo'; selHalo.visible = false;
lib.add(hoverHalo, selHalo);
house.add(lib);
if (renderer.shadowMap) renderer.shadowMap.needsUpdate = true;

function layoutFamily(F) {
  const e = easeOut(F.bloom), q = F.P.q;
  for (const R of F.rings) {
    R.cur = { x: q.x + (R.full.x - q.x) * e, z: q.z + (R.full.z - q.z) * e }; R.rr = RING_R * (0.12 + 0.88 * e);
    R.ringMesh.position.set(R.cur.x, 0.0016, R.cur.z); R.ringMesh.scale.setScalar(Math.max(0.001, R.rr / RING_R)); R.ringMesh.visible = e > 0.03;
    const bd = { x: q.x + F.P.o.x * (0.13 + R.ci * 0.078), z: q.z + F.P.o.z * (0.13 + R.ci * 0.078) };
    R.bud.position.set(bd.x, 0.0017, bd.z); R.bud.scale.setScalar(0.03 * Math.max(0.001, 1 - e * 1.4)); R.bud.visible = e < 0.7;
    for (const m of R.members) {
      const g = clamp((F.bloom - 0.28) * 2.1 - (m.k / 12) * 0.6 - R.ci * 0.08, 0, 1), gg = easeOut(g);
      const x = R.cur.x + m.d.x * R.rr, z = R.cur.z + m.d.z * R.rr; m.base.set(x, 0, z);
      m.mesh.position.set(x, 0.002, z); m.mesh.scale.set(1, Math.max(0.001, gg), 1); m.mesh.visible = gg > 0.01;
      m.so.position.set(x, 0.0019, z); m.so.scale.setScalar((m.peg ? 0.026 : 0.022) * clamp(e * 1.6, 0, 1)); m.so.visible = e > 0.05;
    }
  }
}
Object.values(fams).forEach(layoutFamily);

/* ---------- state ---------- */
const S = { mode: 'arrive', node: null, cluster: null, item: null, from: 'room', lens: false, index: false, filter: 'all', hover: null, arrived: false, touched: false, labelsOn: false };
let fly = null, shiftT = { x: 0, y: 0 }; const off = { x: 0, y: 0 };
const sheetH = () => H() * 0.58;

function frame(center, radius, out, elev) {
  const w = W(), h = H(), panel = S.mode === 'staff';
  const eff = { w: panel && !mob() ? w - 400 : w, h: panel && mob() ? h - sheetH() : h - (mob() ? 150 : 90) };
  const Hf = h + 2 * shiftT.y, tv = Math.tan(cam.fov * Math.PI / 360);
  const t = Math.min(tv * eff.h / Hf, tv * eff.w / Hf), dist = radius / Math.sin(Math.atan(t));
  const ol = Math.hypot(out.x, out.z) || 1, dir = V(out.x / ol * Math.cos(elev), Math.sin(elev), out.z / ol * Math.cos(elev));
  return { pos: center.clone().addScaledVector(dir, dist), target: center.clone() };
}
function viewFor() {
  const panel = S.mode === 'staff';
  shiftT = panel ? (mob() ? { x: 0, y: sheetH() / 2 } : { x: 200, y: 0 }) : { x: 0, y: 0 };
  const F = S.node && fams[S.node], P = S.node && points[S.node];
  switch (S.mode) {
    case 'room':
      if (W() / H() >= 1.1) return { pos: V(0.3, 3.1, 4.95), target: V(0, 0, -0.7) };
      return frame(V(0, 0.2, 0.2), 3.1, { x: 0.1, z: 1 }, 0.98);
    case 'library': return frame(V(0, 0, -0.05), 5.05, { x: 0, z: 1 }, 1.38);
    case 'threshold': return frame(V(0, -0.7, -3.1), 1.45, { x: 0.05, z: 1 }, 1.0);
    case 'family': {
      if (S.cluster) { const R = F.rings.find((r) => r.cid === S.cluster); return frame(V(R.full.x, 0.45, R.full.z), 0.8, R.o, mob() ? 1.05 : 0.92); }
      const all = [F.P.q, ...F.rings.map((r) => r.full)], cx = all.reduce((a, p) => a + p.x, 0) / all.length, cz = all.reduce((a, p) => a + p.z, 0) / all.length;
      const rad = Math.max(1.0, ...all.map((p) => Math.hypot(p.x - cx, p.z - cz) + RING_R + 0.18));
      return frame(V(cx, 0.3, cz), rad, F.P.o, mob() ? 1.25 : 1.12);
    }
    case 'staff': {
      const it = C.items[S.item];
      if (it.role === 'member') { const R = F.rings.find((r) => r.cid === it.clusterId), m = R.members[it.index - 1];
        const fx = R.full.x + m.d.x * RING_R, fz = R.full.z + m.d.z * RING_R;
        return m.peg ? frame(V(fx, 0.06, fz), 0.5, F.P.o, 0.85) : frame(V(fx, 0.55, fz), 0.95, F.P.o, 0.62); }
      if (F) return frame(V(P.q.x, P.len * 0.5, P.q.z), P.len * 0.58, P.o, 0.3);
      return frame(V(P.q.x, 0.03, P.q.z), 0.6, P.o, 1.0);
    }
  }
  return { pos: cam.position.clone(), target: controls.target.clone() };
}
function flyTo(v, dur) { fly = { p0: cam.position.clone(), t0: controls.target.clone(), p1: v.pos, t1: v.target, start: performance.now(), dur: reduce ? 1 : dur }; }
controls.addEventListener('start', () => { fly = null; });

function go(next, dur = 1600) {
  if (S.mode === 'arrive' && !next.mode) return;
  Object.assign(S, next, { touched: true, hover: null });
  for (const F of Object.values(fams)) F.target = (S.node === F.n.id && (S.mode === 'family' || S.mode === 'staff')) ? 1 : 0;
  setRoof(S.mode === 'library');
  flyTo(viewFor(), dur);
  render();
}
function back() {
  if (S.index) return toggleIndex(false);
  if (EMBED && (S.mode === 'room' || S.mode === 'arrive')) return toTree({ act: 'leave' });
  const toBase = () => go({ mode: S.from === 'library' ? 'library' : 'room', node: null, cluster: null, item: null });
  if (S.mode === 'staff') { const it = C.items[S.item]; if (it.role === 'member') return go({ mode: 'family', item: null }); if (fams[it.nodeId]) return go({ mode: 'family', item: null, cluster: null }); return toBase(); }
  if (S.mode === 'family') return S.cluster ? go({ cluster: null }) : toBase();
  if (S.mode === 'library' || S.mode === 'threshold') return go({ mode: 'room', node: null, cluster: null, item: null });
}
function select(id) {
  const it = C.items[id], from = S.mode === 'library' ? 'library' : (S.mode === 'room' ? 'room' : S.from);
  go({ mode: 'staff', node: it.nodeId, cluster: it.role === 'member' ? it.clusterId : null, item: id, from });
}
function approach(id) {
  const from = S.mode === 'library' ? 'library' : (S.mode === 'room' ? 'room' : S.from);
  if (fams[id]) go({ mode: 'family', node: id, cluster: null, item: null, from }); else select(nodeOf(id).originId);
}
function step(d) {
  if (S.mode !== 'staff') return;
  const it = C.items[S.item];
  if (it.role === 'member') return select(`${it.clusterId}S${((it.index - 1 + d + 12) % 12) + 1}`);
  const i = ORDER.findIndex((n) => n.id === it.nodeId); select(ORDER[(i + d + ORDER.length) % ORDER.length].originId);
}

/* ---------- picking (screen space: thin staffs stay tappable) ---------- */
const _v = new THREE.Vector3();
function proj(x, y, z) { _v.set(x, y, z).project(cam); if (_v.z > 1 || _v.z < -1) return null; return { x: (_v.x + 1) / 2 * W(), y: (1 - _v.y) / 2 * H() }; }
const dist2 = (p, x, y) => p ? Math.hypot(p.x - x, p.y - y) : 1e9;
function pick(sx, sy, touch) {
  cam.updateMatrixWorld();
  const R = touch ? 30 : 20, F0 = S.node && fams[S.node];
  if (F0 && F0.bloom > 0.6 && (S.mode === 'family' || S.mode === 'staff')) {
    let best = null, bd = 1e9;
    for (const Rg of F0.rings) {
      const a = proj(Rg.members[0].base.x, 0.5, Rg.members[0].base.z), b = proj(Rg.members[1].base.x, 0.5, Rg.members[1].base.z);
      const spacing = dist2(a, b?.x ?? 1e9, b?.y ?? 1e9);
      if (!(S.cluster === Rg.cid || spacing >= (touch ? 26 : 15))) continue;
      for (const m of Rg.members) {
        const ys = m.peg ? [0.02, 0.1] : [0.15, 0.55, 1.0];
        for (const y of ys) { const d = dist2(proj(m.base.x, y, m.base.z), sx, sy); if (d < bd) { bd = d; best = { kind: 'member', id: m.id }; } }
      }
    }
    if (best && bd < R) return best;
    for (const Rg of F0.rings) {
      const c = proj(Rg.cur.x, 0, Rg.cur.z), e = proj(Rg.cur.x + Rg.o.z * Rg.rr, 0, Rg.cur.z - Rg.o.x * Rg.rr);
      if (c && e && dist2(c, sx, sy) < dist2(c, e.x, e.y) + 14 && S.cluster !== Rg.cid) return { kind: 'ring', id: Rg.cid };
    }
  }
  let best = null, bd = 1e9;
  for (const id in points) {
    const P = points[id], ys = P.len ? [0.02, P.len * 0.5, P.len] : [0.01];
    for (const y of ys) { const d = dist2(proj(P.q.x, y, P.q.z), sx, sy); if (d < bd) { bd = d; best = { kind: 'node', id }; } }
  }
  const dh = dist2(proj(TD.x, 0.05, TD.z), sx, sy);
  if (S.mode !== 'threshold' && dh < bd && dh < R * 2.2) return { kind: 'hatch' };
  return bd < R * 1.3 ? best : null;
}
function act(h) {
  if (!h) return;
  if (h.kind === 'hatch') return go({ mode: 'threshold', node: null, cluster: null, item: null });
  if (h.kind === 'ring') return go({ mode: 'family', cluster: h.id, item: null });
  if (h.kind === 'member') return select(h.id);
  if (h.kind === 'node') {
    if (fams[h.id] && (S.mode === 'family' || S.mode === 'staff') && S.node === h.id) return select(nodeOf(h.id).originId);
    return approach(h.id);
  }
}
let down = null;
dom.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; }, true);
dom.addEventListener('pointerup', (e) => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
  if (moved > 6 || S.mode === 'arrive' || S.index) return;
  const r = dom.getBoundingClientRect(), h = pick(e.clientX - r.left, e.clientY - r.top, e.pointerType !== 'mouse');
  if (h) { e.__roomHandled = true; act(h); }
}, true);
let hoverAt = null;
dom.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !down) { const r = dom.getBoundingClientRect(); hoverAt = { x: e.clientX - r.left, y: e.clientY - r.top }; } }, true);
dom.addEventListener('pointerleave', () => { hoverAt = null; S.hover = null; });

/* ---------- labels ---------- */
const LB = new Map(), TH = new Map();
function labelList() {
  const out = [], add = (key, x, y, z, t, s, cls, pri) => out.push({ key, x, y, z, t, s, cls, pri });
  if (!S.labelsOn) return out;
  const F = S.node && fams[S.node], hv = S.hover;
  if (S.mode === 'room' || S.mode === 'library') {
    const lib = S.mode === 'library';
    for (const id in points) {
      const P = points[id], n = P.n, big = id === 'OAK' || id === 'YEW';
      if (fams[id]) add('n:' + id, P.q.x, lib ? 0.02 : P.len + 0.12, P.q.z, n.label, lib ? `${n.count} staffs` : '', big && !lib ? 'big' : '', big ? 9 : 6);
      else if (lib) add('n:' + id, P.q.x, 0.02, P.q.z, n.label, '', 'small', 1);
    }
    add('hatch', TD.x, 0.08, TD.z, 'Toward Heartwood', '', 'small', 3);
    if (lib) { const q = at(L - 0.3); add('tip', q.x, 0.02, q.z, 'the spiral continues', '', 'small', 2); }
  }
  if (F && (S.mode === 'family' || S.mode === 'staff')) {
    const P = F.P;
    if (S.mode === 'family') add('n:' + F.n.id, P.q.x - P.o.x * 0.12, 0.0, P.q.z - P.o.z * 0.12, F.n.label, '13th staff', 'big', 10);
    if (S.mode === 'family' && F.bloom > 0.5) F.rings.forEach((R) => {
      if (S.cluster && S.cluster !== R.cid) return;
      const r = R.rr + (S.cluster ? 0.1 : 0.06);
      add('r:' + R.cid, R.cur.x + R.o.x * r, 0.01, R.cur.z + R.o.z * r, R.label, R.unres ? 'lineage unresolved' : (S.lens ? 'founding' : ''), R.unres ? 'small unres' : 'small', 7);
    });
  }
  if (S.mode === 'threshold') add('thr', TD.x, 0.15, TD.z - 0.2, 'Toward Heartwood', 'the root passage', 'big', 10);
  if (hv) {
    if (hv.kind === 'member') { const it = C.items[hv.id], R = F && F.rings.find((r) => r.cid === it.clusterId), m = R && R.members[it.index - 1];
      if (m) add('hv', m.base.x, m.len + 0.08, m.base.z, `Staff ${it.index}`, it.lineage === 'unresolved' ? 'record · photo not yet ingested' : R.label, '', 30); }
    if (hv.kind === 'node') { const P = points[hv.id], n = P.n;
      add('hv', P.q.x, (P.len || 0) + 0.12, P.q.z, n.label, fams[hv.id] ? `${n.count} staffs · ${n.clusters.length === 1 ? 'one circle' : n.clusters.length + ' circles'}` : '13th staff · no circle yet', '', 30); }
    if (hv.kind === 'ring') { const R = F.rings.find((r) => r.cid === hv.id); add('hv', R.cur.x, 0.02, R.cur.z, R.label, R.unres ? 'lineage unresolved' : '12 staffs', '', 30); }
    if (hv.kind === 'hatch') add('hv', TD.x, 0.12, TD.z, 'Toward Heartwood', 'the root passage', '', 30);
  }
  return out;
}
function drawLabels() {
  cam.updateMatrixWorld();
  const layer = $('labels'), list = labelList(), placed = [], used = new Set();
  list.sort((a, b) => b.pri - a.pri);
  for (const l of list) {
    if (l.key !== 'hv' && list.some((o) => o.key === 'hv') && S.hover && l.key === 'n:' + S.hover.id) continue;
    const p = proj(l.x, l.y, l.z); if (!p || p.x < -40 || p.x > W() + 40 || p.y < 0 || p.y > H()) continue;
    const size = /big/.test(l.cls) ? 18 : /small/.test(l.cls) ? 11.5 : 14, w = Math.max(l.t.length * size * 0.55, (l.s || '').length * 7.2) + 10, h = size * 1.3 + (l.s ? 15 : 0);
    p.x = clamp(p.x, w / 2 + 4, W() - w / 2 - 4);
    const box = [p.x - w / 2, p.y - h - 6, p.x + w / 2, p.y - 6];
    if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
    placed.push(box); used.add(l.key);
    let el = LB.get(l.key);
    if (!el) { el = document.createElement('div'); el.innerHTML = '<div class="t"></div><div class="s"></div>'; el.style.opacity = 0; layer.appendChild(el); LB.set(l.key, el); requestAnimationFrame(() => (el.style.opacity = 1)); }
    el.className = 'lbl ' + (l.cls || '');
    if (el._t !== l.t) { el.firstChild.textContent = l.t; el._t = l.t; }
    if (el._s !== l.s) { el.lastChild.textContent = l.s || ''; el.lastChild.style.display = l.s ? '' : 'none'; el._s = l.s; }
    el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%) translateY(-6px)`;
    if (el.style.opacity === '0' && !el._fading) el.style.opacity = 1;
  }
  for (const [k, el] of LB) if (!used.has(k)) { el.remove(); LB.delete(k); }
  /* photographs surface when one circle is approached */
  const tUsed = new Set(), F = S.node && fams[S.node];
  if (F && S.mode === 'family' && S.cluster && F.bloom > 0.9) {
    const R = F.rings.find((r) => r.cid === S.cluster);
    const a = proj(R.members[0].base.x, 1.2, R.members[0].base.z), b = proj(R.members[1].base.x, 1.2, R.members[1].base.z);
    const sz = Math.min(44, dist2(a, b?.x ?? 0, b?.y ?? 0) * 0.86);
    if (sz >= 18) for (const m of R.members) {
      const it = C.items[m.id]; if (!it.photo.small || m.peg) continue;
      const p = proj(m.base.x, m.len + 0.09, m.base.z); if (!p) continue;
      tUsed.add(m.id);
      let el = TH.get(m.id);
      if (!el) { el = document.createElement('div'); el.className = 'thumb'; el.style.backgroundImage = `url("${it.photo.small}")`; el.style.opacity = 0; $('labels').appendChild(el); TH.set(m.id, el); requestAnimationFrame(() => (el.style.opacity = 1)); }
      el.style.width = el.style.height = sz + 'px';
      el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-50%)`;
    }
  }
  for (const [k, el] of TH) if (!tUsed.has(k)) { el.remove(); TH.delete(k); }
}

/* ---------- UI ---------- */
const CH = C.chapter;
function crumbs() {
  const c = [...(EMBED && !mob() ? [{ t: 'The Tree', a: 'tetol' }] : []), { t: 'Staff Room', a: 'room' }], F = S.node && nodeOf(S.node);
  if (S.mode === 'library' || ((S.mode === 'family' || S.mode === 'staff') && S.from === 'library')) c.push({ t: 'Library', a: 'library' });
  if (S.mode === 'threshold') c.push({ t: 'Toward Heartwood' });
  if (F && (S.mode === 'family' || S.mode === 'staff')) {
    c.push({ t: F.label, a: fams[F.id] ? 'fam' : null });
    if (S.cluster) c.push({ t: F.clusters.find((x) => x.id === S.cluster).label.replace(F.clusters.length > 1 ? /^.* (Circle \d)$/ : /^(.*)$/, '$1'), a: 'ring:' + S.cluster });
    if (S.mode === 'staff') { const it = C.items[S.item]; c.push({ t: it.role === 'origin' ? '13th staff' : `Staff ${it.index}` }); }
  }
  const list = mob() && c.length > 2 ? c.slice(-2) : c;
  return list.map((x, i) => { const last = i === list.length - 1;
    return (i ? '<span class="sep" aria-hidden="true">›</span>' : '') + `<button class="crumb" ${last ? 'aria-current="location"' : `data-act="crumb:${x.a}"`}>${esc(x.t)}</button>`; }).join('');
}
function caption() {
  const F = S.node && nodeOf(S.node), lens = S.lens ? `<div class="cap-s">Founding 144 marked in gold: ${CH.founding} confirmed. ${CH.unresolved} records unresolved (dashed). ${CH.later ? CH.later + ' confirmed later.' : 'None yet confirmed later.'}</div>` : '';
  if (S.mode === 'room') return (S.touched ? '' : `<div class="cap-t">A spiral is inlaid in the floor.</div><div class="cap-s">Oak and Yew stand nearest the hearth. ${mob() ? 'Tap' : 'Choose'} a staff to meet its family.</div>`) + lens;
  if (S.mode === 'library') return `<div class="cap-k">The Staff Library</div><div class="cap-t">${CH.count} staffs · ${CH.nodeCount} species</div><div class="cap-s">Five families stand in the room so far. The line continues out under the door.</div>` + lens;
  if (S.mode === 'threshold') return `<div class="cap-k">Beneath the roundhouse</div><div class="cap-t">The root passage leads to Heartwood.</div>${EMBED ? `<div class="cap-s">It opens into the hollow of the trunk.</div><div style="margin-top:12px"><button class="pill" data-act="heartwood">Follow the passage into Heartwood →</button></div>` : `<div class="cap-s">Not yet open in this prototype.</div>`}`;
  if (S.mode === 'family' && F) {
    const fam = fams[F.id], fr = F.clusters.filter((c) => c.cohort === 'founding_144').length, un = F.clusters.length - fr;
    const line = F.clusters.length > 1 ? `${fr === F.clusters.length ? 'All circles founding.' : `Circles 1–${fr}: founding. Circle ${fr + 1}: lineage unresolved.`}` : 'One circle, founding.';
    if (S.cluster) { const cl = F.clusters.find((c) => c.id === S.cluster);
      return `<div class="cap-k">${esc(F.label)}</div><div class="cap-t">${esc(cl.label)} · 12 ${cl.cohort === 'founding_144' ? 'staffs' : 'records'}</div><div class="cap-s">${cl.cohort === 'founding_144' ? 'Staff 1 faces outward; numbering runs clockwise.' : 'Each record exists in Notion; its photograph has not been brought in yet, so it stands as a pale peg.'} ${mob() ? 'Tap' : 'Choose'} a staff.</div>` + lens; }
    return `<div class="cap-k">${esc(F.label)} family</div><div class="cap-t">${F.count} staffs · ${F.clusters.length === 1 ? 'one circle' : F.clusters.length + ' circles'} grown from the 13th</div><div class="cap-s">${line} ${mob() ? 'Tap a circle to come closer.' : 'Choose a circle, or the 13th staff at the root.'}</div>` + lens + (un ? '' : '');
  }
  return '';
}
function panelHTML(id) {
  const it = C.items[id], n = nodeOf(it.nodeId), ph = it.photo || {};
  let photo;
  if (ph.large) photo = `<div class="ph"><img src="${esc(ph.large)}" alt="Photograph of ${esc(it.title)} staff ${esc(it.code)}" data-ph-fallback><div class="phfail">Photograph held in Drive<br><span style="color:#f1e4c8">${esc(ph.file)}</span><br><a href="${esc(ph.href)}" target="_blank" rel="noopener" style="display:inline-flex;min-height:44px;align-items:center">Open photograph</a></div></div>`;
  else if (ph.state === 'in-source') photo = `<div class="ph src"><div><div class="k">Photo in source — not yet ingested</div><div>The Notion record holds this staff's photograph. It has not been brought into the Library yet.</div><a href="${esc(ph.href)}" target="_blank" rel="noopener" style="display:inline-flex;min-height:44px;align-items:center">Open the Notion record</a></div></div>`;
  else photo = `<div class="ph src"><div>No photograph recorded.</div></div>`;
  let rel = '';
  if (it.role === 'member') {
    const cl = n.clusters.find((c) => c.id === it.clusterId);
    rel = `<div class="sec"><div class="k">${esc(cl.label)} · staff ${it.index} of 12</div><div class="sib" role="group" aria-label="Staffs in this circle">${cl.memberIds.map((mid, i) => `<button data-act="sel:${mid}" aria-label="Staff ${i + 1}"${mid === id ? ' aria-current="true"' : ''}>${i + 1}</button>`).join('')}</div>
      <div style="margin-top:10px"><button class="pill" data-act="sel:${n.originId}">Grown from the 13th staff</button></div></div>`;
  } else {
    rel = `<div class="sec"><div class="k">${n.clusters.length ? `The root of the ${esc(n.label)} family` : 'Origin of this species'}</div>` +
      (n.clusters.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${n.clusters.map((c) => `<button class="pill" data-act="ring:${c.id}">${esc(c.label)}${c.cohort !== 'founding_144' ? ' · unresolved' : ''}</button>`).join('')}</div>`
        : `<div class="basis">No circle has grown from this species yet.${n.inHouse ? ` The Notion Staff Library counts ${esc(n.inHouse)} in house; those staffs have no individual records here yet.` : ''}</div>`) + '</div>';
  }
  const lin = it.lineage === 'unresolved' ? `<span class="chip unresolved">Lineage unresolved</span>` : `<span class="chip founding">Confirmed founding · Founding 144</span>`;
  const skip = ['Species', 'Lineage', 'Circle', 'Staff'], fields = it.fields.filter((f) => !skip.includes(f[0]));
  const flds = fields.length ? `<div class="sec"><div class="fl">${fields.map(([k, v]) => `<div><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('')}</div></div>` : '';
  return `<button class="x" data-act="back" aria-label="Step back">×</button>
    <div class="pk">${esc(it.kicker)}</div><div class="pt">${esc(it.title)}</div><div class="pc">${esc(it.code)}</div>
    ${photo}${rel}
    <div class="sec"><div class="k">Lineage</div>${lin}<div class="basis">${esc(it.lineageBasis || '')}</div></div>
    ${flds}
    <details><summary>Sources and gaps</summary>${it.provenance.map((p) => `<div style="margin-top:4px">${esc(p)}</div>`).join('')}
      <div style="margin-top:10px" class="muted">Not yet in the record: ${esc(it.gaps.join(', '))}.</div>
      ${it.role === 'member' && !it.photo.small ? '' : `<div style="margin-top:10px" class="muted">The staff standing in the room is a stand-in form in the species' wood tone; the photograph is the record.</div>`}</details>
    <div class="navr"><button class="pill" data-act="prev">← ${it.role === 'origin' ? 'Species' : 'Staff'}</button><button class="pill" data-act="next">${it.role === 'origin' ? 'Species' : 'Staff'} →</button></div>`;
}

/* ---------- Library Index (secondary) ---------- */
const recon = ORDER.filter((n) => { const v = parseInt(n.inHouse, 10); return !n.inHouse || isNaN(v) || v !== n.count; });
const FILTERS = [['all', 'All staffs', CH.count], ['species', 'Species', CH.nodeCount], ['founding', 'Confirmed Founding 144', CH.founding], ['later', 'Confirmed later', CH.later], ['unresolved', 'Unresolved', CH.unresolved], ['recon', 'Needs reconciliation', recon.length]];
function indexHTML() {
  const f = S.filter;
  const head = `<div class="ixh"><div><div class="k">Staff Library</div><div class="ixt">Library Index</div></div><button class="pill" data-act="index">Return to the room</button></div>
    <div class="filters" role="group" aria-label="Show">${FILTERS.map(([id, l, c]) => `<button data-act="filter:${id}" aria-pressed="${f === id}">${l} · ${c}</button>`).join('')}</div>`;
  const staffRows = (pred) => ORDER.map((n) => {
    const rings = n.clusters.map((c) => { const ms = c.memberIds.filter((m) => pred(C.items[m])); if (!ms.length) return '';
      return `<div style="display:grid;gap:6px"><div class="k">${esc(c.label)}${c.cohort !== 'founding_144' ? ' · lineage unresolved · photos in source, not yet ingested' : ''}</div><div class="grid12">${ms.map((m) => `<button class="nb" data-act="go:${m}" aria-label="${esc(n.label)}, ${esc(c.label)}, staff ${C.items[m].index}">${C.items[m].index}</button>`).join('')}</div></div>`; }).join('');
    const o = pred(C.items[n.originId]);
    if (!o && !rings) return '';
    return `<div class="row"><div class="rowh"><div class="n">${esc(n.label)}</div><div class="c">${esc(n.code)}</div><div class="m">${n.count} ${n.count === 1 ? 'staff' : 'staffs'}</div></div>${o ? `<div><button class="pill" data-act="go:${n.originId}">13th staff</button></div>` : ''}${rings}</div>`;
  }).join('');
  let body = '';
  if (f === 'all') body = staffRows(() => true);
  if (f === 'founding') body = `<div class="note" style="margin:8px 0">Founding status is held per record. These ${CH.founding} are listed in the founding structure of staffContract.ts.</div>` + staffRows((i) => i.lineage === 'founding');
  if (f === 'unresolved') body = `<div class="note" style="margin:8px 0">Oak Circle 4 and Yew Circle 4 exist as Notion records. Neither record states founding or later, so they stay unresolved. Their photographs are in the source and not yet ingested.</div>` + staffRows((i) => i.lineage === 'unresolved');
  if (f === 'later') body = `<div class="note" style="margin:14px 0">No record is confirmed later yet. Oak and Yew Circle 4 may turn out to be later staffs; until a record says so they are listed as unresolved.</div>`;
  if (f === 'species') body = ORDER.map((n, i) => `<div class="row"><div class="rowh"><div class="n">${esc(n.label)}</div><div class="c">${esc(n.code)} · ${i + 1} of 36 on the spiral</div></div><div class="m muted">${n.count} ${n.count === 1 ? 'staff' : 'staffs'}${n.inHouse ? ` · Notion counts ${esc(n.inHouse)} in house` : ''}${fams[n.id] ? ' · family stands in the room' : ''}</div><div><button class="pill" data-act="approach:${n.id}">${fams[n.id] ? 'Go to the family' : 'Go to the 13th staff'}</button></div></div>`).join('');
  if (f === 'recon') body = `<div class="note" style="margin:8px 0">Species where the Notion Staff Library's in-house count and the records evidenced here differ, or where Notion gives no count.</div>` + recon.map((n) => {
    const v = parseInt(n.inHouse, 10);
    const why = !n.inHouse ? 'No in-house count on the Notion page.' : isNaN(v) ? `Notion: "${esc(n.inHouse)}".` : n.id === 'OAK' || n.id === 'YEW' ? `Notion counts ${v}; ${n.count} records here (${n.count - 1} circle staffs and the 13th). Check whether the 13th is inside Notion's count.` : `Notion counts ${esc(n.inHouse)} in house; ${n.count} ${n.count === 1 ? 'record' : 'records'} evidenced here.`;
    return `<div class="row"><div class="rowh"><div class="n">${esc(n.label)}</div><div class="c">${esc(n.code)}</div></div><div class="note">${why}</div></div>`; }).join('');
  return `<div class="ix">${head}${body}<div class="row"><a href="Staff Library Seed.dc.html" style="display:inline-flex;min-height:44px;align-items:center">Earlier study: the spiral as a flat diagram →</a></div></div>`;
}
function toggleIndex(on) { S.index = on ?? !S.index; render(); if (S.index) { $('index').scrollTop = 0; $('index').querySelector('button')?.focus(); } }

let lastPanel = null;
let selMesh = null, selMat = null;
function markSelected() {
  if (selMesh) { selMesh.material = selMat; selMesh = null; }
  if (S.mode !== 'staff') return;
  const it = C.items[S.item], F = fams[it.nodeId]; if (!F) return;
  let mesh = null;
  if (it.role === 'member') mesh = F.rings.find((r) => r.cid === it.clusterId).members[it.index - 1].mesh;
  if (!mesh) return;
  selMesh = mesh; selMat = mesh.material; const m = selMat.clone(); m.emissive = new THREE.Color(0x6a3c14); m.emissiveIntensity = 0.55; mesh.material = m;
}
function render() {
  markSelected();
  $('crumbs').innerHTML = crumbs();
  $('back').hidden = !EMBED && (S.mode === 'room' || S.mode === 'arrive');
  if (EMBED) $('back').setAttribute('aria-label', S.mode === 'room' || S.mode === 'arrive' ? 'Return to the Tree' : 'Step back');
  $('caption').innerHTML = caption();
  $('caption').style.opacity = S.arrived && !(S.mode === 'staff') && !S.index ? 1 : 0;
  $('libBtn').textContent = S.mode === 'library' ? 'Return to the room' : 'See the Library';
  $('lensBtn').setAttribute('aria-pressed', String(S.lens));
  $('controls').style.opacity = S.arrived && !(S.mode === 'staff' && mob()) && !S.index ? 1 : 0;
  $('controls').style.visibility = S.arrived && !(S.mode === 'staff' && mob()) && !S.index ? 'visible' : 'hidden';
  $('top').style.opacity = S.arrived ? 1 : 0;
  const pn = $('panel');
  if (S.mode === 'staff') { if (lastPanel !== S.item) { pn.innerHTML = panelHTML(S.item); pn.scrollTop = 0; lastPanel = S.item; } pn.hidden = false; }
  else { pn.hidden = true; lastPanel = null; }
  $('index').hidden = !S.index;
  if (S.index) $('index').innerHTML = indexHTML();
  const it = S.item && C.items[S.item], F = S.node && nodeOf(S.node);
  $('live').textContent = S.index ? 'Library Index' : it ? `${it.title}, ${it.kicker}. ${it.lineage === 'unresolved' ? 'Lineage unresolved.' : 'Confirmed founding.'}` :
    S.mode === 'family' && F ? `${F.label} family, ${F.count} staffs.` : S.mode === 'library' ? `The Staff Library from above. ${CH.count} staffs, ${CH.nodeCount} species.` :
    S.mode === 'threshold' ? 'Toward Heartwood. The root passage.' : 'The Staff Room.';
}
$('ui').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const [a, v] = b.dataset.act.split(/:(.*)/s);
  if (a === 'back') return back();
  if (a === 'heartwood') return toTree({ act: 'go', to: 'hwroom' });
  if (a === 'library') return go(S.mode === 'library' ? { mode: 'room', node: null, cluster: null, item: null } : { mode: 'library', node: null, cluster: null, item: null, from: 'library' }, 1900);
  if (a === 'lens') { S.lens = !S.lens; return render(); }
  if (a === 'index') return toggleIndex();
  if (a === 'filter') { S.filter = v; return render(); }
  if (a === 'sel') return select(v);
  if (a === 'ring') return go({ mode: 'family', cluster: v, item: null });
  if (a === 'prev') return step(-1);
  if (a === 'next') return step(1);
  if (a === 'go') { S.index = false; return select(v); }
  if (a === 'approach') { S.index = false; return approach(v); }
  if (a === 'crumb') {
    if (v === 'tetol') return toTree({ act: 'leave' });
    if (v === 'room') return go({ mode: 'room', node: null, cluster: null, item: null, from: 'room' });
    if (v === 'library') return go({ mode: 'library', node: null, cluster: null, item: null, from: 'library' });
    if (v === 'fam') return go({ mode: 'family', cluster: null, item: null });
    if (v.startsWith('ring:')) return go({ mode: 'family', cluster: v.slice(5), item: null });
  }
});
addEventListener('keydown', (e) => {
  if (document.getElementById('nft-lightbox')?.style.display === 'block') return;
  if (e.key === 'Escape') back();
  if (S.mode === 'staff' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
});
let lastW = W(), lastH = H();
addEventListener('resize', () => setTimeout(() => { if (Math.abs(W() - lastW) + Math.abs(H() - lastH) < 2) return; lastW = W(); lastH = H(); if (S.mode !== 'arrive') { fly = null; const v = viewFor(); cam.position.copy(v.pos); controls.target.copy(v.target); controls.update(); render(); } }, 120));

/* ---------- loop ---------- */
let last = performance.now(), pulse = null, glowBase = 0, lensK = 0, shadowDirty = false, settleAt = 0;
let smooth = 0, bootAt = performance.now(), booted = false;
function work(now) {
  const raw = now - last, dt = Math.max(0, Math.min(64, raw)); last = now;
  /* the first frames of this scene stall while shaders compile: arrive only once the room is really drawing */
  if (!booted) { smooth = raw < 100 ? smooth + 1 : 0; if (smooth > 4 || now - bootAt > 7000) { booted = true; arrive(); } }
  if (fly) {
    const x = clamp((now - fly.start) / fly.dur, 0, 1), e = easeIO(x);
    cam.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e); controls.update();
    if (x >= 1) fly = null;
  }
  /* shift the scene clear of the record panel */
  off.x += (shiftT.x - off.x) * (1 - Math.exp(-dt / 180)); off.y += (shiftT.y - off.y) * (1 - Math.exp(-dt / 180));
  const w = W(), h = H();
  if (Math.abs(off.x) < 0.5 && Math.abs(off.y) < 0.5) { if (cam.view?.enabled) { cam.clearViewOffset(); cam.aspect = w / h; cam.updateProjectionMatrix(); } }
  else { cam.aspect = (w + 2 * off.x) / (h + 2 * off.y); cam.setViewOffset(w + 2 * off.x, h + 2 * off.y, 2 * off.x, 2 * off.y, w, h); }
  /* hover */
  if (hoverAt && !fly && S.mode !== 'arrive' && !S.index) { S.hover = pick(hoverAt.x, hoverAt.y, false); dom.style.cursor = S.hover ? 'pointer' : 'grab'; }
  else if (!hoverAt) S.hover = null;
  /* blooms */
  for (const F of Object.values(fams)) {
    const peek = S.hover && S.hover.kind === 'node' && S.hover.id === F.n.id && (S.mode === 'room' || S.mode === 'library') ? 0.2 : 0;
    const tgt = Math.max(F.target, peek);
    if (Math.abs(tgt - F.bloom) > 0.001) { F.bloom = reduce ? tgt : F.bloom + (tgt - F.bloom) * (1 - Math.exp(-dt / (tgt > F.bloom ? 780 : 420))); layoutFamily(F); shadowDirty = true; settleAt = now; }
    else if (F.bloom !== tgt) { F.bloom = tgt; layoutFamily(F); }
  }
  if (shadowDirty && now - settleAt > 300) { shadowDirty = false; renderer.shadowMap.needsUpdate = true; }
  /* light travelling through the inlay */
  let band = -0.3;
  if (pulse) { const x = (now - pulse.t0) / pulse.dur; band = -0.08 + x * 1.2; glowBase = Math.min(1, glowBase + dt / 3500); if (x >= 1) pulse = null; }
  else if (S.mode === 'library') band = ((now / 52000) % 1) * 1.2 - 0.1;
  glowTex.offset.x = 0.5 - band;
  MAT.brass.emissiveIntensity = 0.2 + 0.55 * glowBase;
  /* founding lens: quiet gold, never rank */
  lensK += ((S.lens ? 1 : 0) - lensK) * (1 - Math.exp(-dt / 350));
  MAT.ring.emissiveIntensity = 0.05 + 0.55 * lensK; MAT.stud.emissiveIntensity = 0.04 + 0.45 * lensK;
  MAT.collar.emissiveIntensity = 0.12 * glowBase + 0.45 * lensK; MAT.dash.emissiveIntensity = 0.3 * lensK;
  MAT.ring.color.setHex(S.lens ? 0xc49a52 : 0x9c7a45);
  lensGold.opacity = 0.85 * lensK; lensPale.opacity = 0.9 * lensK; lensGold.visible = lensPale.visible = lensK > 0.01;
  /* halos */
  const place = (mesh, hv) => {
    if (!hv) return (mesh.visible = false);
    let x, z, r;
    if (hv.kind === 'node') { const P = points[hv.id]; x = P.q.x; z = P.q.z; r = 0.09; }
    else if (hv.kind === 'member') { const it = C.items[hv.id], F = fams[it.nodeId], R = F.rings.find((q) => q.cid === it.clusterId), m = R.members[it.index - 1]; x = m.base.x; z = m.base.z; r = 0.05; }
    else if (hv.kind === 'ring') { const F = fams[S.node], R = F.rings.find((q) => q.cid === hv.id); x = R.cur.x; z = R.cur.z; r = R.rr + 0.05; }
    else if (hv.kind === 'hatch') { x = TD.x; z = TD.z; r = 0.9; }
    mesh.visible = true; mesh.position.set(x, 0.0035, z); mesh.scale.setScalar(r);
  };
  place(hoverHalo, S.hover);
  place(selHalo, S.mode === 'staff' ? (C.items[S.item].role === 'member' ? { kind: 'member', id: S.item } : { kind: 'node', id: S.node }) : null);
  fadePosts(dt);
  roofTick();
  drawLabels();
}
function loop(now) { work(now); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
setTimeout(() => { if (!booted) { booted = true; arrive(); } }, 6000);

/* ---------- first arrival: presence before interface ---------- */
function arrive() {
  const v = (S.mode = 'room', viewFor()); S.mode = 'arrive';
  cam.position.set(0.25, 1.62, 11.2); controls.target.set(0, 1.15, 0); controls.update();
  $('veil').style.opacity = 0; setTimeout(() => $('veil').remove(), 2000);
  if (reduce) { S.mode = 'room'; cam.position.copy(v.pos); controls.target.copy(v.target); controls.update(); glowBase = 1; S.arrived = S.labelsOn = true; return render(); }
  fly = { p0: cam.position.clone(), t0: controls.target.clone(), p1: v.pos, t1: v.target, start: performance.now() + 700, dur: 6200 };
  setTimeout(() => (pulse = { t0: performance.now(), dur: 7000 }), 4200);
  setTimeout(() => { S.labelsOn = true; }, 7600);
  setTimeout(() => { S.mode = 'room'; S.arrived = true; render(); }, 9200);
}
render();

window.__room = { pump(ms = 1200) { const t0 = performance.now(); for (let t = 0; t <= ms; t += 16) work(t0 + t); last = performance.now(); applyCut(true); roofTick(); renderer.render(stage._scene, cam); },
  S, go, back, select, approach, toggleIndex, fams, points, C, setLens: (on) => { S.lens = on; render(); },
  skip() { fly = null; pulse = null; glowBase = 1; S.mode = S.mode === 'arrive' ? 'room' : S.mode; S.arrived = S.labelsOn = true; const v = viewFor(); cam.position.copy(v.pos); controls.target.copy(v.target); controls.update(); render(); },
  settle() { fly = null; for (const F of Object.values(fams)) { F.bloom = F.target; layoutFamily(F); } const v = viewFor(); cam.position.copy(v.pos); controls.target.copy(v.target); controls.update(); off.x = shiftT.x; off.y = shiftT.y; } };

/* ---------- TETOL navigation intents (experiment) ----------
   When embedded in TETOL, the room accepts the same small set of intents from the Tree
   (and through it, from any controller such as the Wand), and reports where it is so a
   controller can offer contextual choices. Nothing here changes the room's own behaviour. */
if (EMBED) {
  const famList = () => ORDER.filter((n) => fams[n.id]).map((n) => ({ id: n.id, label: n.label }));
  const report = () => {
    const F = S.node && nodeOf(S.node), it = S.item && C.items[S.item];
    toTree({ act: 'state', mode: S.mode, index: !!S.index,
      family: F ? { id: F.id, label: F.label, count: F.count, realised: !!fams[F.id] } : null,
      staff: it ? { id: S.item, label: it.role === 'origin' ? `${F ? F.label + ' · ' : ''}13th staff` : `${F ? F.label + ' · ' : ''}Staff ${it.index}`, role: it.role } : null,
      families: famList(),
      rings: F && fams[F.id] ? F.clusters.map((c) => ({ id: c.id, label: c.label })) : [] });
  };
  const _render = render;
  render = function () { _render.apply(this, arguments); report(); };
  addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    const d = e.data; if (!d || d.tetolIntent !== 1) return;
    const a = d.name, v = d.arg;
    if (a === 'back') return back();
    if (a === 'room') return go({ mode: 'room', node: null, cluster: null, item: null, from: 'room' });
    if (a === 'library') return go({ mode: 'library', node: null, cluster: null, item: null, from: 'library' });
    if (a === 'family' && fams[v]) return approach(v);
    if (a === 'ring' && S.node && typeof v === 'string') return go({ mode: 'family', cluster: v, item: null });
    if (a === 'origin' && S.node) return select(nodeOf(S.node).originId);
    if (a === 'next') return step(1);
    if (a === 'prev') return step(-1);
    if (a === 'threshold') return go({ mode: 'threshold', node: null, cluster: null, item: null });
    if (a === 'heartwood') return toTree({ act: 'go', to: 'hwroom' });
    if (a === 'index') return toggleIndex();
    if (a === 'state') return report();
  });
  report();
}

