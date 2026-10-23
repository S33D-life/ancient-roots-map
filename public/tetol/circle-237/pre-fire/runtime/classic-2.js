// TETOL 0.9.6 · THE DEEPER RINGS (TEOTAG 28 Sep 2026) · EXPERIMENT · NOT CANONICAL · NOT DEPLOYED
//   HEARTWOOD HALL (lived, relational memory)
//     ↓ down through the Seed Cellar's own low opening
//   DEEPER RINGS (long memory · commons · protected knowledge): one low, ring-shaped chamber beneath the hall floor,
//     three doorways (Tree Data Commons · Vault · Scrolls & Records), no interiors
//     ↓ the Tree's own taproot, descending through a closed well at the centre
//   TAP ROOT (deepest keeper layer): visible, closed, no interior
// Direction is meaning: the TAPROOT goes straight DOWN beneath the trunk; the Ancient Friends are the LATERAL roots,
// reached OUTWARD through the Ancient Friends arch. The two never share a passage.
// Movement is the Wanderer's, as in the Roots descent: scroll / ↓ ↑ / ▾ ▴ to move, drag or ← → to look, Esc to go back.
(() => {
  const D = window.TETOL; if (!D) return;
  const q = new URLSearchParams(location.search);
  const ext = (D.ext ||= { anchors: {}, views: {} });
  const APP = 'https://www.s33d.life';
  const DEEP = new Set(['h_deep', 'h_commons', 'h_vault', 'h_scrolls', 'h_taproot']);
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('still');
  const state = { active: false, t: 0, tTarget: 0, face: null, tapped: null, brisk: false, arrived: false };
  // what can be recognised down here: three doorways and the closed shaft. Words from the live app; nothing invented.
  const PLACES = [
    { k: 'h_scrolls', name: 'Scrolls & Records', line: 'The remembered rings of the grove · the long memory', href: APP + '/library/scrolls', link: 'Open Scrolls & Records on S33D.life ↗', at: Math.PI - 0.45 },
    { k: 'h_commons', name: 'Tree Data Commons', line: 'Open tree datasets and where they come from', href: APP + '/tree-data-commons', link: 'Open the Tree Data Commons on S33D.life ↗', at: 2.05 },
    { k: 'h_vault', name: 'Vault', line: 'Hold value safely · closed · nothing it holds is shown', href: APP + '/library/vault', link: 'Open the Vault on S33D.life ↗', at: -2.05 },
    { k: 'h_taproot', name: 'Tap Root', line: 'The deepest root · for keepers only · closed', href: APP + '/library/tap-root', link: 'Dev Room on S33D.life (keepers) ↗', at: null },
  ];

  // ── UI: the same quiet language as the Roots descent
  const css = document.createElement('style');
  css.textContent = `
  body.deep #panel, body.deep .labels, body.deep #hdr, body.deep #hint, body.deep .leave, body.deep #back, body.deep #mark, body.deep #reset, body.deep .wandcard, body.deep .spine { visibility: hidden !important; }
  #deep-ui { position: fixed; inset: 0; pointer-events: none; z-index: 30; font-family: var(--sans); color: var(--ink2); }
  #deep-ui[hidden] { display: none; }
  #deep-ui .bar { position: absolute; left: 50%; bottom: calc(22px + env(safe-area-inset-bottom)); transform: translateX(-50%); display: flex; gap: 10px; pointer-events: auto; }
  #deep-ui .bar button { white-space: nowrap; font: 500 13px/1 var(--sans); letter-spacing: .02em; color: var(--ink2); background: hsl(30 18% 8% / .62); border: 1px solid hsl(42 40% 40% / .32); border-radius: 999px; min-height: 44px; min-width: 44px; padding: 0 16px; cursor: pointer; backdrop-filter: blur(6px); }
  #deep-ui .bar button:hover, #deep-ui .bar button:focus-visible { color: var(--ink); border-color: hsl(42 60% 55% / .6); outline: none; }
  #deep-ui .bar button[hidden] { display: none; }
  #deep-ui .whisper { position: absolute; left: 50%; bottom: calc(80px + env(safe-area-inset-bottom)); transform: translateX(-50%); font: italic 15px/1.3 var(--whisper); color: var(--ink3); opacity: 0; transition: opacity 1.4s ease; white-space: nowrap; }
  #deep-ui .whisper.on { opacity: .85; }
  #deep-ui .dlab { position: absolute; transform: translate(-50%, -100%); text-align: center; pointer-events: auto; opacity: 0; transition: opacity 1.2s ease; visibility: hidden; width: min(78vw, 340px); }
  #deep-ui .dlab.on { opacity: 1; }
  #deep-ui .dlab b { display: block; font: 600 16px/1.1 var(--serif); letter-spacing: .06em; color: var(--ink); text-shadow: 0 1px 12px #000, 0 0 2px #000; }
  #deep-ui .dlab i { display: block; font: italic 14px/1.3 var(--whisper); color: var(--ink2); text-shadow: 0 1px 10px #000; margin-top: 3px; }
  #deep-ui .dlab a { display: inline-block; margin-top: 8px; font: 500 11.5px/1 var(--sans); letter-spacing: .04em; white-space: nowrap; color: var(--ink2); text-decoration: none; border: 1px solid hsl(42 40% 40% / .4); border-radius: 999px; padding: 9px 12px; background: hsl(30 18% 8% / .62); }
  @media (max-width: 600px) { #deep-ui .bar { bottom: calc(68px + env(safe-area-inset-bottom)); } #deep-ui .whisper { bottom: calc(126px + env(safe-area-inset-bottom)); white-space: normal; width: 80vw; text-align: center; } }
  .deep-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }`;
  document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'deep-ui'; ui.hidden = true;
  ui.innerHTML = `<div class="whisper" aria-hidden="true"></div>
    ${PLACES.map((x) => `<div class="dlab" data-k="${x.k}" role="group" aria-label="${x.name}"><b>${x.name}</b><i>${x.line}</i><a href="${x.href}" target="_blank" rel="noopener">${x.link}</a></div>`).join('')}
    <div class="bar"><button type="button" data-r="up" aria-label="Back up toward Heartwood">▴</button><button type="button" data-r="down" aria-label="Go further down">▾</button><button type="button" data-r="home" hidden>↑ Return to Heartwood</button></div>
    <p class="deep-sr" aria-live="polite" id="deep-live"></p>`;
  const mount = () => document.body.appendChild(ui); document.body ? mount() : addEventListener('DOMContentLoaded', mount);
  const $ = (s) => ui.querySelector(s), say = (t) => { const l = $('#deep-live'); if (l) l.textContent = t; };

  let T, THREE, scene, stage, cam, controls, G, path, look, stationT = [], roomAt = 0.9, camLight, mouthMat0, mouthFade, mouth, built = false;
  const targets = {}; const pickMeshes = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const nz = (x, y, z) => Math.sin(x * 1.7 + y * 0.9) * Math.cos(z * 1.3 - x * 0.4) * 0.5 + Math.sin(x * 0.53 - z * 1.9 + y * 2.3) * 0.3 + Math.sin(y * 3.1 + z * 0.7) * 0.2;
  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  // old, compressed growth rings seen edge-on: fine horizontal strata, umber / ochre / ash, slightly wavy (geological, not technological)
  const strata = () => canvasTex(512, 512, (g, w, h) => { let y = 0; const tones = [[70, 50, 34], [92, 68, 44], [58, 44, 34], [104, 82, 56], [66, 58, 50], [84, 60, 40]];
    while (y < h) { const th = 2 + Math.random() * 9, c = tones[Math.floor(Math.random() * tones.length)], k = 0.75 + Math.random() * 0.3; g.fillStyle = `rgb(${c[0] * k | 0},${c[1] * k | 0},${c[2] * k | 0})`;
      g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 60 + y) * 1.6); for (let x = w; x >= 0; x -= 16) g.lineTo(x, y + th + Math.sin(x / 60 + y + 1) * 1.6); g.fill(); y += th; }
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(20,14,8,${0.08 + Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 18); } });
  const rings = (base) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let r = 6; r < 256; r += 2.2 + Math.random() * 3.2) { g.strokeStyle = `rgba(22,14,8,${0.22 + Math.random() * 0.35})`; g.lineWidth = 0.6 + Math.random() * 1.4; g.beginPath();
      for (let k = 0; k <= 90; k++) { const a = k / 90 * Math.PI * 2, rr = r * (1 + 0.02 * Math.sin(a * 3 + r) + 0.01 * Math.sin(a * 7 + r * 0.2)); g.lineTo(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr); } g.stroke(); } });
  const taper = (curve, r0, r1, segs = 48, radial = 10) => { const g = new THREE.TubeGeometry(curve, segs, 1, radial, false), p = g.attributes.position, v = V(0, 0, 0);
    for (let i = 0; i <= segs; i++) { const c = curve.getPointAt(i / segs), r = r0 + (r1 - r0) * (i / segs); for (let j = 0; j <= radial; j++) { const k = i * (radial + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c); p.setXYZ(k, v.x, v.y, v.z); } }
    g.computeVertexNormals(); return g; };
  const arch = (w, h2, sh) => { sh.moveTo(-w / 2, 0); sh.lineTo(-w / 2, Math.max(0, h2 - w / 2)); sh.absarc(0, Math.max(0, h2 - w / 2), w / 2, Math.PI, 0, true); sh.lineTo(w / 2, 0); sh.lineTo(-w / 2, 0); return sh; };

  function build() {
    scene = stage._scene;
    const seedG = scene.getObjectByName('chamber_h_seed'), hall = scene.getObjectByName('heartwood_hall_world');
    const HP = seedG.parent.getWorldPosition(V(0, 0, 0)), A = seedG.getWorldPosition(V(0, 0, 0));
    const d = V(A.x - HP.x, 0, A.z - HP.z), rr = d.length(); d.normalize();
    const p = V(d.z, 0, -d.x), L = (a, b, y) => HP.clone().add(d.clone().multiplyScalar(a)).add(p.clone().multiplyScalar(b)).setY(y);
    const F = -6.2, CY = -3.3, RO = 7.0;                        // floor, ceiling, outer radius: low and compressed
    const P = (ang, r, y) => HP.clone().add(d.clone().multiplyScalar(Math.cos(ang) * r)).add(p.clone().multiplyScalar(Math.sin(ang) * r)).setY(y);
    G = new THREE.Group(); G.name = 'DEEPER_RINGS_nonCanonical'; G.visible = false; (hall || scene).add(G);

    // ── the Seed Cellar's own low opening becomes the way down (its dark mouth still covers it from the hall)
    mouth = scene.getObjectByName('h_seed_opening');
    { const W0 = 2.3, H0 = 1.35, rim = scene.getObjectByName('h_seed_rim');
      if (rim) { const o = arch(W0 + 0.4, H0 + 0.22, new THREE.Shape()); o.holes.push(arch(W0 - 0.04, H0 - 0.02, new THREE.Path())); rim.geometry.dispose(); rim.geometry = new THREE.ShapeGeometry(o, 24); }
      const wall = scene.getObjectByName('heartwood_hall_wall');
      if (wall) { const g0 = wall.geometry, pos = g0.attributes.position, idx = g0.index, aA = Math.atan2(d.x, d.z), keep = [], lp = wall.parent.worldToLocal(A.clone()), R0 = Math.hypot(lp.x, lp.z), hw = (W0 / 2 + 0.02) / R0;
        for (let i = 0; i < idx.count; i += 3) { let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { const v = idx.getX(i + k); cx += pos.getX(v); cy += pos.getY(v); cz += pos.getZ(v); } cx /= 3; cy /= 3; cz /= 3;
          const da = Math.atan2(Math.sin(Math.atan2(cx, cz) - aA), Math.cos(Math.atan2(cx, cz) - aA)), xo = Math.abs(da) * R0;
          if (Math.abs(da) < hw && cy < 0.2 + Math.sqrt(Math.max(0, 1.15 * 1.15 - xo * xo)) + 0.06) continue; keep.push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)); }
        g0.setIndex(keep); } }

    // materials: old strata, compressed ring floor and ceiling, the Tree's own bark for its taproot
    const strataMap = strata(); strataMap.repeat.set(9, 1.4);
    const wallMat = new THREE.MeshStandardMaterial({ name: 'deep_rings_strata', map: strataMap, color: 0xb8a08a, roughness: 1, side: THREE.BackSide });
    const tunnelMap = strata(); tunnelMap.repeat.set(3, 10);
    const tunnelMat = new THREE.MeshStandardMaterial({ name: 'deep_rings_descent', map: tunnelMap, color: 0xa88e76, roughness: 1, side: THREE.BackSide });
    const floorMat = new THREE.MeshStandardMaterial({ name: 'deep_rings_floor', map: rings('#4a3524'), color: 0x9a8470, roughness: 1 });
    const ceilMat = new THREE.MeshStandardMaterial({ name: 'deep_rings_ceiling', map: rings('#3e2c1e'), color: 0x8a7462, roughness: 1, side: THREE.DoubleSide });
    const stone = new THREE.MeshStandardMaterial({ name: 'deep_rings_stone', color: 0x514638, roughness: 1 });
    const oldWood = new THREE.MeshStandardMaterial({ name: 'deep_rings_old_wood', color: 0x3b2a1c, roughness: 0.9 });
    const iron = new THREE.MeshStandardMaterial({ name: 'deep_rings_iron', color: 0x2a2520, roughness: 0.6, metalness: 0.35 });
    const dark = new THREE.MeshBasicMaterial({ name: 'deep_rings_depth', color: 0x060403 });
    let bark = null; scene.traverse((o) => { if (!bark && o.isMesh && o.material && o.material.name === 'bark') bark = o.material; });
    const rootMat = bark ? bark.clone() : oldWood.clone(); rootMat.name = 'deep_rings_taproot_bark'; if (rootMat.color) rootMat.color.multiplyScalar(0.55);
    if (bark && bark.map) { rootMat.map = bark.map.clone(); rootMat.map.needsUpdate = true; rootMat.map.wrapS = rootMat.map.wrapT = THREE.RepeatWrapping; rootMat.map.repeat.set(3, 3); }
    const fineRoot = new THREE.MeshStandardMaterial({ name: 'deep_rings_fine_root', color: 0x3a2a1e, roughness: 0.95 });

    // ── the descent: a narrow way through the wall, turning down and back beneath the hall floor
    const tubePts = [L(rr - 0.05, 0, 0.5), L(rr + 0.9, 0.2, 0.15), L(rr + 1.7, 1.1, -1.2), L(rr + 1.4, 2.3, -2.8), L(rr - 0.4, 2.3, -4.1), L(RO + 0.9, 1.25, F + 1.35), L(RO - 0.35, 1.05, F + 1.3)];
    const tube = new THREE.CatmullRomCurve3(tubePts, false, 'centripetal');
    { const segs = 140, rad = 20, g = new THREE.TubeGeometry(tube, segs, 1, rad, false), pa = g.attributes.position, v = V(0, 0, 0);
      for (let i = 0; i <= segs; i++) { const k = i / segs, c = tube.getPointAt(k), r = 1.3 - 0.3 * smooth(0, 0.18, k) + (k > 0.92 ? (k - 0.92) * 4 : 0);
        for (let j = 0; j <= rad; j++) { const ix = i * (rad + 1) + j; v.fromBufferAttribute(pa, ix).sub(c); const n = nz(c.x * 0.8 + j, c.y * 0.7, c.z * 0.8 + j * 0.3);
          v.multiplyScalar(r * (1 + 0.1 * n)); if (v.y < -0.55 * r) v.y = -0.55 * r + (v.y + 0.55 * r) * 0.3; v.add(c); pa.setXYZ(ix, v.x, v.y, v.z); } }
      g.computeVertexNormals(); const m = new THREE.Mesh(g, tunnelMat); m.name = 'deep_rings_descent'; G.add(m); }
    // ── the chamber: one low ring of old wood-stone, wall and ceiling in one piece, a mouth cut where the descent arrives
    { const prof = [[RO + 0.1, F - 0.2], [RO + 0.25, F + 0.7], [RO + 0.2, F + 1.7], [RO - 0.1, CY - 0.35], [RO - 0.9, CY + 0.05], [RO - 2.5, CY + 0.2], [3.2, CY + 0.28], [1.4, CY + 0.34], [0.02, CY + 0.36]], pts = [];
      for (let i = 0; i < prof.length - 1; i++) for (let k = 0; k < 5; k++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1], f = k / 5; pts.push(new THREE.Vector2(r0 + (r1 - r0) * f, y0 + (y1 - y0) * f)); }
      pts.push(new THREE.Vector2(0.01, CY + 0.36));
      let g = new THREE.LatheGeometry(pts, 110).toNonIndexed(); const pa = g.attributes.position, uv = g.attributes.uv, v = V(0, 0, 0);
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); const r = Math.hypot(v.x, v.z); if (r > 0.2) { const n = nz(v.x * 0.8, v.y * 1.3, v.z * 0.8), f = 1 + 0.035 * n; v.x *= f; v.z *= f; v.y += 0.06 * n; } pa.setXYZ(i, v.x, v.y, v.z); }
      const mdir = L(RO, 1.05, 0).sub(HP), ea = Math.atan2(mdir.x, mdir.z), keep = [];
      for (let i = 0; i < pa.count; i += 3) { let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { cx += pa.getX(i + k); cy += pa.getY(i + k); cz += pa.getZ(i + k); } cx /= 3; cy /= 3; cz /= 3;
        const da = Math.atan2(Math.sin(Math.atan2(cx, cz) - ea), Math.cos(Math.atan2(cx, cz) - ea)); if (Math.abs(da) < 0.17 && cy < F + 2.35 && Math.hypot(cx, cz) > RO - 1.2) continue; keep.push(i); }
      const out = new Float32Array(keep.length * 9), ouv = new Float32Array(keep.length * 6);
      keep.forEach((i, n) => { for (let k = 0; k < 3; k++) { out[n * 9 + k * 3] = pa.getX(i + k); out[n * 9 + k * 3 + 1] = pa.getY(i + k); out[n * 9 + k * 3 + 2] = pa.getZ(i + k); ouv[n * 6 + k * 2] = uv.getX(i + k); ouv[n * 6 + k * 2 + 1] = uv.getY(i + k); } });
      g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(out, 3)); g.setAttribute('uv', new THREE.BufferAttribute(ouv, 2)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, wallMat); m.position.set(HP.x, 0, HP.z); m.name = 'deep_rings_chamber'; G.add(m);
      // the ceiling is the underside of the hall's floor: old rings, seen from below
      const cg = new THREE.CircleGeometry(RO - 0.6, 96); const c = new THREE.Mesh(cg, ceilMat); c.rotation.x = Math.PI / 2; c.position.set(HP.x, CY + 0.3, HP.z); c.name = 'deep_rings_ceiling_rings'; G.add(c);
      const fg = new THREE.RingGeometry(1.62, RO + 0.3, 110, 3), fp = fg.attributes.position; for (let i = 0; i < fp.count; i++) fp.setZ(i, 0.03 * nz(fp.getX(i), 0, fp.getY(i)));
      fg.computeVertexNormals(); const fl = new THREE.Mesh(fg, floorMat); fl.rotation.x = -Math.PI / 2; fl.position.set(HP.x, F, HP.z); fl.name = 'deep_rings_floor'; G.add(fl); }

    // ── the Tap Root: the Tree's own root, straight down through the centre, into a closed, grown-over well
    { const W = (x, y, z) => V(HP.x + x, y, HP.z + z);
      const main = new THREE.CatmullRomCurve3([W(0.05, CY + 0.9, 0), W(0.02, CY - 0.4, 0.06), W(-0.07, F + 1.2, 0.02), W(0.03, F - 0.3, -0.04), W(0, F - 3.4, 0.02)]);
      const tr = new THREE.Mesh(taper(main, 0.78, 0.4, 60, 14), rootMat); tr.name = 'deep_rings_taproot'; G.add(tr); pickMeshes.push([tr, 'h_taproot']);
      // where the trunk's root meets the ceiling, it flares and grips the rings
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.3, len = 2.2 + (i % 3) * 0.9;
        const c = new THREE.CatmullRomCurve3([W(Math.cos(a) * 0.5, CY + 0.2, Math.sin(a) * 0.5), W(Math.cos(a) * 1.3, CY + 0.12, Math.sin(a) * 1.3), W(Math.cos(a + 0.12) * len, CY + 0.22, Math.sin(a + 0.12) * len)]);
        const m = new THREE.Mesh(taper(c, 0.2, 0.03, 24, 7), rootMat); m.name = 'deep_rings_taproot_flare_' + i; G.add(m); }
      // the well: a stone lip, dark depth, a lid of old boards and iron, grown over; the root passes through it
      const lip = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.15, 10, 60), stone); lip.rotation.x = Math.PI / 2; lip.position.copy(W(0, F + 0.06, 0)); lip.name = 'taproot_well_lip'; G.add(lip);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.35, 4.2, 40, 1, true), new THREE.MeshStandardMaterial({ name: 'taproot_well_shaft', color: 0x2a2018, roughness: 1, side: THREE.BackSide })); shaft.position.copy(W(0, F - 2.1, 0)); shaft.name = 'taproot_well_shaft'; G.add(shaft);
      const lid = new THREE.Mesh(new THREE.RingGeometry(0.66, 1.52, 48), oldWood); lid.rotation.x = -Math.PI / 2; lid.position.copy(W(0, F - 0.1, 0)); lid.name = 'taproot_well_lid_closed'; G.add(lid); pickMeshes.push([lid, 'h_taproot']);
      const straps = []; [-0.9, 0, 0.9].forEach((x) => { const len = 2 * Math.sqrt(Math.max(0.05, 1.5 * 1.5 - x * x)); [-1, 1].forEach((s) => { const b = new THREE.BoxGeometry(0.08, 0.04, len / 2 - 0.35); b.translate(x, 0, s * (len / 4 + 0.18)); straps.push(b); }); });
      const sm = new THREE.Mesh(mergeGeos(straps), iron); sm.position.copy(W(0, F - 0.07, 0)); sm.name = 'taproot_well_lid_straps'; G.add(sm);
      const vines = []; for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.2, r0 = 1.75 + (i % 3) * 0.2, r1 = 0.8 + (i % 4) * 0.12, c = new THREE.CatmullRomCurve3([W(Math.cos(a) * r0, F + 0.02, Math.sin(a) * r0), W(Math.cos(a + 0.2) * 1.2, F - 0.04, Math.sin(a + 0.2) * 1.2), W(Math.cos(a + 0.35) * r1, F - 0.06, Math.sin(a + 0.35) * r1)]);
        vines.push(taper(c, 0.03, 0.008, 14, 5)); }
      const vm = new THREE.Mesh(mergeGeos(vines), fineRoot); vm.name = 'taproot_well_grown_over'; G.add(vm);
      targets.h_taproot = W(0, F + 1.25, 0); }

    // ── three doorways in the outer wall, facing the centre. No interiors.
    const door = (k, ang, w, h2) => { const g = new THREE.Group(); g.name = 'deep_rings_door_' + k; g.position.copy(P(ang, RO - 0.02, F)); g.lookAt(HP.clone().setY(F)); G.add(g);
      const o = arch(w + 0.42, h2 + 0.24, new THREE.Shape()); o.holes.push(arch(w, h2, new THREE.Path())); const rim = new THREE.Mesh(new THREE.ShapeGeometry(o, 20), stone); rim.position.z = 0.02; g.add(rim);
      const lint = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.16, 0.2), stone); lint.position.set(0, h2 + 0.28, 0.05); g.add(lint);
      targets[k] = P(ang, RO - 0.6, F + h2 * 0.62); return g; };
    const place = (k) => PLACES.find((x) => x.k === k);
    // Scrolls & Records: the long-memory archive, pigeon-holed with rolled records
    { const g = door('h_scrolls', place('h_scrolls').at, 1.3, 2.0), hole = new THREE.Mesh(new THREE.ShapeGeometry(arch(1.3, 2.0, new THREE.Shape())), dark); g.add(hole); pickMeshes.push([hole, 'h_scrolls']);
      const ends = []; for (let r = 0; r < 7; r++) for (let c = 0; c < 6; c++) { const x = -0.5 + c * 0.2 + (r % 2) * 0.05, y = 0.15 + r * 0.2; if (y > 2.0 - 0.65 + Math.sqrt(Math.max(0, 0.65 * 0.65 - x * x)) - 0.1) continue;
        const e = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 10); e.rotateX(Math.PI / 2); e.translate(x, y, 0.04); ends.push(e); }
      const em = new THREE.Mesh(mergeGeos(ends), new THREE.MeshStandardMaterial({ name: 'rolled_records', color: 0xd8c8a0, emissive: 0x3a2e18, emissiveIntensity: 0.55, roughness: 0.9 })); g.add(em);
      const l = new THREE.PointLight(0xf0c890, 3.2, 7, 1.6); l.position.copy(P(place('h_scrolls').at, RO - 1.2, F + 1.4)); G.add(l); }
    // Tree Data Commons: a low doorway, a cool light within, slates of shared record stacked beside it
    { const g = door('h_commons', place('h_commons').at, 1.2, 1.8), hole = new THREE.Mesh(new THREE.ShapeGeometry(arch(1.2, 1.8, new THREE.Shape())), dark); g.add(hole); pickMeshes.push([hole, 'h_commons']);
      const sl = []; for (let i = 0; i < 6; i++) { const b = new THREE.BoxGeometry(0.34 + (i % 2) * 0.06, 0.05, 0.26); b.translate(0.95 + (i % 2) * 0.03, 0.03 + i * 0.06, 0.25); sl.push(b); }
      const s = new THREE.Mesh(mergeGeos(sl), new THREE.MeshStandardMaterial({ name: 'commons_slates', color: 0x6a7480, roughness: 0.85 })); g.add(s);
      const l = new THREE.PointLight(0x9fb8d0, 2.4, 6, 1.6); l.position.copy(P(place('h_commons').at, RO - 1.0, F + 1.1)); G.add(l);
      const gl = new THREE.PointLight(0x7f98b8, 1.4, 2.2, 1.5); gl.position.copy(P(place('h_commons').at, RO + 0.3, F + 0.9)); G.add(gl); }
    // Vault: a heavy door, closed
    { const g = door('h_vault', place('h_vault').at, 1.1, 1.8);
      const dd = new THREE.Mesh(new THREE.ShapeGeometry(arch(1.1, 1.8, new THREE.Shape())), oldWood); dd.position.z = 0.01; g.add(dd); pickMeshes.push([dd, 'h_vault']);
      const bands = [0.35, 1.05].map((y) => { const b = new THREE.BoxGeometry(1.12, 0.08, 0.04); b.translate(0, y, 0.04); return b; }); const bm = new THREE.Mesh(mergeGeos(bands), iron); g.add(bm);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 20), iron); ring.position.set(0.32, 0.8, 0.06); g.add(ring);
      const l = new THREE.PointLight(0xd8a868, 2.2, 5.5, 1.6); l.position.copy(P(place('h_vault').at, RO - 1.3, F + 1.5)); G.add(l); }

    // ── light: little, low and warm; the eyes adjust
    const hemi = new THREE.HemisphereLight(0x6a5a48, 0x1a120c, 0.5); hemi.name = 'deep_rings_low_light'; G.add(hemi);
    camLight = new THREE.PointLight(0xcdb89c, 5.5, 8, 1.5); camLight.name = 'deep_rings_eyes_adjusting'; G.add(camLight);

    // ── the Wanderer's path: from exactly the Seed Cellar view, stooping through, down, and back in beneath the hall
    const F1 = F + 1.45;
    const on = (k, up = 0.12) => tube.getPointAt(k).add(V(0, up, 0));   // in the descent, the Wanderer keeps to the middle of the way
    const camPts = [L(rr - 5.2, 0, 1.6), L(rr - 2.2, 0, 1.1), L(rr - 0.45, 0, 0.62), on(0.16, 0.05), on(0.34), on(0.52), on(0.7), on(0.88, 0.1), L(RO - 1.1, 0.5, F1)];
    const lookPts = [L(rr - 0.3, 0, 0.75), L(rr + 0.2, 0, 0.5), on(0.1, -0.05), on(0.3, -0.1), on(0.48, -0.1), on(0.66, -0.1), on(0.84, -0.1), L(2.6, 0.25, F1 - 0.15), L(0, 0, F1 - 0.2)];
    path = new THREE.CatmullRomCurve3(camPts, false, 'centripetal'); look = new THREE.CatmullRomCurve3(lookPts, false, 'centripetal');
    const N = 600, samples = Array.from({ length: N + 1 }, (_, i) => path.getPointAt(i / N));
    stationT = camPts.map((c) => { let best = 0, bd = 1e9; samples.forEach((s2, i) => { const dd = s2.distanceToSquared(c); if (dd < bd) { bd = dd; best = i / N; } }); return best; });
    stationT[0] = 0; stationT[stationT.length - 1] = 1; roomAt = stationT[7] + 0.02;

    // ── draw: while below, the hall's warmth fades behind (its lights dimmed, its lines hidden), only while below
    const ownLights = new Set(); G.traverse((o) => { if (o.isLight) ownLights.add(o); });
    const isOurs = (o) => { for (; o; o = o.parent) if (o === G) return true; return false; };
    const loop0 = stage._loop;
    stage._loop = () => {
      if (!state.active) return loop0();
      const saved = [], hid = [], fog = scene.fog, f0 = fog && { c: fog.color.getHex(), d: fog.density };
      frame(performance.now());
      const depth = smooth(0.1, 0.55, state.t);
      scene.traverse((o) => { if (o.isLight && !ownLights.has(o)) { saved.push([o, o.intensity]); o.intensity *= 1 - 0.97 * depth; } else if (o.isLine && o.visible && !isOurs(o)) { hid.push(o); o.visible = false; } });
      if (fog) { fog.color.lerp(new THREE.Color(0x0a0705), depth); fog.density = f0.d + (0.035 - f0.d) * depth; }
      loop0();
      saved.forEach(([o, i]) => (o.intensity = i)); hid.forEach((o) => (o.visible = true)); if (fog) { fog.color.setHex(f0.c); fog.density = f0.d; }
    };
    stage._renderer.setAnimationLoop(stage._loop);
    built = true;
  }
  function mergeGeos(geos) { // plain position/normal/uv merge (no index) for small static pieces
    const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g)); let n = 0; parts.forEach((g) => (n += g.attributes.position.count));
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
    parts.forEach((g) => { g.computeVertexNormals(); pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; });
    const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return m; }

  // ── movement (as in the Roots descent) and looking (a full turn in the ring)
  let last = 0, yaw = 0, pitch = 0, held = 0, beganAt = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    if (held) state.tTarget = clamp(state.tTarget + held * 0.08 * dt);
    if (reduce()) state.t = state.tTarget;
    else { const diff = state.tTarget - state.t, step = Math.sign(diff) * Math.min(Math.abs(diff), Math.max(0.006, Math.abs(diff) * 2.2) * dt * (state.brisk ? 2.2 : 1), 0.08 * dt * (state.brisk ? 2.4 : 1)); state.t += Math.abs(diff) < 0.0004 ? diff : step; }
    const moving = Math.abs(state.tTarget - state.t) > 0.001, inRoom = state.t >= roomAt;
    if (moving && !reduce() && !inRoom) { yaw *= 1 - Math.min(1, 1.6 * dt); pitch *= 1 - Math.min(1, 1.6 * dt); }
    const c = path.getPointAt(state.t), l = look.getPointAt(state.t), dir = l.clone().sub(c).normalize();
    // arriving because a doorway was asked for: turn gently toward it
    if (inRoom && state.face && targets[state.face]) { const to = targets[state.face].clone().sub(c), f0 = V(dir.x, 0, dir.z).normalize(), goal = Math.atan2(f0.z * to.x - f0.x * to.z, f0.x * to.x + f0.z * to.z);
      yaw += (goal - yaw) * (reduce() ? 1 : Math.min(1, 2.5 * dt)); if (Math.abs(goal - yaw) < 0.01) { state.tapped = state.face; state.face = null; } }
    const right = V(0, 1, 0).cross(dir).normalize();
    dir.applyAxisAngle(V(0, 1, 0), yaw); dir.applyAxisAngle(right.applyAxisAngle(V(0, 1, 0), yaw), -pitch);
    cam.position.copy(c); controls.target.copy(c.clone().add(dir.multiplyScalar(1.2))); cam.lookAt(controls.target);
    camLight.position.copy(c).add(V(0, 0.25, 0)); camLight.intensity = 5.5 * smooth(0.06, 0.3, state.t);
    if (mouthFade) mouthFade.opacity = 1 - smooth(0.12, 0.3, state.t);
    $('[data-r="down"]').hidden = state.t >= 0.999; $('[data-r="up"]').hidden = inRoom; $('[data-r="home"]').hidden = !inRoom;
    if (inRoom && !state.arrived) { state.arrived = true; say('A low ring of old wood beneath the hall. Three doorways in its wall; at its centre the Tree’s taproot goes down, closed.'); }
    if (!inRoom) state.arrived = false;
    if (state.t <= 0.0005 && state.tTarget <= 0 && state.active && now - beganAt > 400) finish();
    labels(inRoom);
  }
  // recognition: the name of what you face, one at a time, only below
  function labels(inRoom) {
    let best = null; const fwd = controls.target.clone().sub(cam.position).normalize(), ang = (k) => fwd.angleTo(targets[k].clone().sub(cam.position).normalize());
    if (inRoom) { if (state.tapped && targets[state.tapped] && ang(state.tapped) < 1.0) best = PLACES.find((x) => x.k === state.tapped);
      else { let bA = 0.5; for (const x of PLACES) { if (!targets[x.k]) continue; const a = ang(x.k); if (a < bA) { bA = a; best = x; } } } }
    ui.querySelectorAll('.dlab').forEach((el) => {
      const on = best && el.dataset.k === best.k;
      if (!on) { el.classList.remove('on'); el.style.visibility = 'hidden'; return; }
      const pr = targets[best.k].clone().add(V(0, best.k === 'h_taproot' ? 0.9 : 0.75, 0)).project(cam), half = Math.min(innerWidth * 0.78, 340) / 2 + 8;
      if (pr.z > 1 || Math.abs(pr.x) > 1 || Math.abs(pr.y) > 1) { el.classList.remove('on'); el.style.visibility = 'hidden'; return; }
      el.style.left = Math.round(Math.max(half, Math.min(innerWidth - half, (pr.x * 0.5 + 0.5) * innerWidth))) + 'px'; el.style.top = Math.max(90, Math.round((-pr.y * 0.5 + 0.5) * innerHeight)) + 'px';
      el.style.visibility = 'visible'; el.classList.add('on'); });
    state.facing = best ? best.k : null;
  }

  // ── begin and end
  function begin(face) {
    if (!built || state.active) return;
    if (window.TETOL_ROOTS && window.TETOL_ROOTS.state.active) return;
    const v3 = document.getElementById('view3d'); if (v3 && v3.hidden) document.getElementById('m3d')?.click();
    const hall = scene.getObjectByName('heartwood_hall_world'), here = window.TETOL_NAV && window.TETOL_NAV.where().id;
    if ((hall && !hall.visible) || here !== 'h_seed') { if (window.TETOL_NAV) window.TETOL_NAV.run('goTo', 'h_seed'); const t0 = performance.now();
      const wait = () => (hall.visible && window.TETOL_NAV.where().id === 'h_seed' && performance.now() - t0 > (hall.visible ? 2600 : 3400) ? begin(face) : performance.now() - t0 < 10000 && setTimeout(wait, 200)); setTimeout(wait, 400); return; }
    state.active = true; ext.away = true; beganAt = performance.now(); state.face = DEEP.has(face) && face !== 'h_deep' ? face : null; state.tapped = null; yaw = pitch = 0;
    path.points[0].copy(cam.position); look.points[0].copy(controls.target); path.updateArcLengths(); look.updateArcLengths();
    state.t = 0; state.tTarget = state.face ? 1 : stationT[1];
    state.saved = { enabled: controls.enabled, minD: controls.minDistance, maxD: controls.maxDistance, minP: controls.minPolarAngle, maxP: controls.maxPolarAngle };
    controls.enabled = false; controls.minDistance = 0; controls.maxDistance = 100; controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI;
    if (mouth) { mouthMat0 = mouth.material; mouthFade = mouthMat0.clone(); mouthFade.transparent = true; mouth.material = mouthFade; }
    G.visible = true; ui.hidden = false; document.body.classList.add('deep');
    const wh = $('.whisper'); let seen = q.get('hint') === '0'; try { seen = seen || !!sessionStorage.getItem('deep-hint'); } catch (e) {}
    if (!seen && !state.face) { wh.textContent = matchMedia('(pointer: coarse)').matches ? 'Use ▾ ▴ to go down or back · drag to look around' : 'Scroll or ↓ ↑ to go down or back · drag to look around'; wh.classList.add('on'); setTimeout(() => wh.classList.remove('on'), 6500); try { sessionStorage.setItem('deep-hint', '1'); } catch (e) {} }
    say('Going down through the Seed Cellar, beneath the hall.');
    setTimeout(() => $('[data-r="down"]').focus({ preventScroll: true }), 50);
  }
  function finish() {
    state.active = false; state.brisk = false; ext.away = false; yaw = pitch = 0; held = 0; state.face = state.tapped = null;
    const sv = state.saved; controls.enabled = sv.enabled; controls.minDistance = sv.minD; controls.maxDistance = sv.maxD; controls.minPolarAngle = sv.minP; controls.maxPolarAngle = sv.maxP;
    cam.position.copy(path.points[0]); controls.target.copy(look.points[0]); controls.update();
    if (mouth && mouthMat0) { mouth.material = mouthMat0; mouthFade.dispose(); mouthFade = null; }
    G.visible = false; ui.hidden = true; document.body.classList.remove('deep');
    say('Back in Heartwood, at the Seed Cellar.');
    const b = document.querySelector('#panel [data-go="@deeper"]') || document.getElementById('pname'); if (b) b.focus({ preventScroll: true });
  }
  const goStation = (dir) => { state.brisk = false; const cur = state.tTarget; const list = dir > 0 ? stationT.filter((x) => x > cur + 0.004) : stationT.filter((x) => x < cur - 0.004).reverse(); if (list.length) state.tTarget = list[0]; else if (dir < 0) state.tTarget = 0; };
  const home = () => { state.tTarget = 0; state.brisk = true; yaw = pitch = 0; state.face = state.tapped = null; say('Climbing back up to Heartwood.'); };

  // ── input. While below, the Tree's own handlers do not see these events.
  const atSeed = () => !state.active && built && window.TETOL_NAV && window.TETOL_NAV.where().id === 'h_seed' && scene.getObjectByName('heartwood_hall_world')?.visible && !(window.TETOL_ROOTS && window.TETOL_ROOTS.state.active);
  const mine = (e) => e.target && e.target.closest && e.target.closest('#deep-ui');
  addEventListener('click', (e) => {
    const g = e.target.closest && e.target.closest('[data-go]');
    if (g && !state.active && (g.dataset.go === '@deeper' || DEEP.has(g.dataset.go))) { e.preventDefault(); e.stopImmediatePropagation(); begin(g.dataset.go === '@deeper' ? null : g.dataset.go); return; }
    if (!state.active) return;
    const r = e.target.closest && e.target.closest('#deep-ui [data-r]');
    if (r) { e.stopImmediatePropagation(); if (r.dataset.r === 'down') goStation(1); else if (r.dataset.r === 'up') goStation(-1); else home(); return; }
    if (!mine(e)) e.stopImmediatePropagation();
  }, true);
  let seedDown = null;
  addEventListener('pointerdown', (e) => { seedDown = atSeed() && e.target.closest && e.target.closest('three-d-stage') ? [e.clientX, e.clientY] : null; }, true);
  addEventListener('pointerup', (e) => { if (!seedDown || !atSeed()) return; const d0 = seedDown; seedDown = null; if (Math.hypot(e.clientX - d0[0], e.clientY - d0[1]) > 6) return;
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam);
    if (ray.intersectObjects([mouth, scene.getObjectByName('h_seed_rim')].filter(Boolean), false)[0]) { e.stopImmediatePropagation(); begin(); } }, true);
  addEventListener('keydown', (e) => {
    if (atSeed() && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !(e.target.closest && e.target.closest('input, textarea, select, #panel, #viewlist')) && (e.key === 'ArrowDown' || e.key === 'PageDown')) { e.preventDefault(); e.stopImmediatePropagation(); begin(); return; }
    if (!state.active || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); state.t >= roomAt ? home() : goStation(-1); return; }
    const down = ['ArrowDown', 'PageDown', 's', 'S'].includes(k), up = ['ArrowUp', 'PageUp', 'w', 'W'].includes(k);
    if (down || up) { e.preventDefault(); e.stopImmediatePropagation(); if (reduce() || k.startsWith('Page')) { if (!e.repeat) goStation(down ? 1 : -1); } else held = down ? 1 : -1; return; }
    if (['ArrowLeft', 'ArrowRight'].includes(k)) { e.preventDefault(); e.stopImmediatePropagation(); state.face = null; const lim = state.t >= roomAt ? Math.PI : 0.9; yaw = Math.max(-lim, Math.min(lim, yaw + (k === 'ArrowLeft' ? 1 : -1) * 0.14)); return; }
    if (!mine(e) && !['Tab', 'Enter', ' '].includes(k)) e.stopImmediatePropagation();
  }, true);
  addEventListener('keyup', (e) => { if (state.active && ['ArrowDown', 'ArrowUp', 's', 'S', 'w', 'W'].includes(e.key)) { held = 0; state.tTarget = state.t; } }, true);
  let wheelT = 0;
  addEventListener('wheel', (e) => { if (!state.active || mine(e)) return; e.preventDefault(); e.stopImmediatePropagation();
    if (reduce()) { const now = performance.now(); if (now - wheelT > 600 && Math.abs(e.deltaY) > 4) { wheelT = now; goStation(Math.sign(e.deltaY)); } return; }
    state.tTarget = clamp(state.tTarget + Math.max(-60, Math.min(60, e.deltaY)) * 0.00045); }, { capture: true, passive: false });
  let drag = null;
  addEventListener('pointerdown', (e) => { if (!state.active || mine(e)) return; e.stopImmediatePropagation(); drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }; }, true);
  addEventListener('pointermove', (e) => { if (!state.active || !drag || mine(e)) return; e.stopImmediatePropagation(); state.face = null;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; const lim = state.t >= roomAt ? Math.PI : 0.9;
    yaw = Math.max(-lim, Math.min(lim, yaw - dx * 0.0045)); pitch = Math.max(-0.55, Math.min(0.5, pitch - dy * 0.0036)); }, true);
  addEventListener('pointerup', (e) => { if (!state.active || mine(e)) return; e.stopImmediatePropagation(); const d0 = drag; drag = null;
    if (!d0 || Math.hypot(e.clientX - d0.x0, e.clientY - d0.y0) > 6 || state.t < roomAt) return;
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam);
    const hit = ray.intersectObjects(pickMeshes.map(([m]) => m), false)[0]; if (hit) { const k = pickMeshes.find(([m]) => m === hit.object)[1]; state.tapped = k; const x = PLACES.find((p) => p.k === k); say(`${x.name}. ${x.line}. It can be opened on S33D.life.`); } }, true);
  ['touchstart', 'touchmove'].forEach((ev) => addEventListener(ev, (e) => { if (state.active && !mine(e)) e.stopImmediatePropagation(); }, { capture: true, passive: true }));

  // ── the shared navigation layer: where the Wanderer is, and "back" means back up
  const hookNav = () => { const N = window.TETOL_NAV; if (!N || N.__deep) return; N.__deep = true; const w0 = N.where, r0 = N.run;
    N.where = function () { if (!state.active) return w0.apply(this, arguments); const inRoom = state.t >= roomAt, f = inRoom && state.facing && PLACES.find((x) => x.k === state.facing);
      const addr = { h_scrolls: 'heartwood/deeper-rings/scrolls', h_commons: 'heartwood/deeper-rings/commons', h_vault: 'heartwood/deeper-rings/vault', h_taproot: 'heartwood/deeper-rings → taproot' };
      return { kind: 'deep', id: f ? f.k : inRoom ? 'h_deep' : 'deep-descent', label: f ? f.name : inRoom ? 'The Deeper Rings' : 'The way down', sub: 'Beneath Heartwood', address: f ? addr[f.k] : inRoom ? 'heartwood/deeper-rings' : 'heartwood/seed-cellar → deeper-rings',
        trail: ['TETOL', 'Inside Heartwood', 'Seed Cellar', ...(inRoom ? ['Deeper Rings'] : ['Descent']), ...(f ? [f.name] : [])] }; };
    N.run = function (name, arg) {
      if (!state.active) { if ((name === 'goTo' || name === 'approach' || name === 'select') && DEEP.has(arg)) { begin(arg); return true; } if (name === 'enter' && (arg === 'deeper' || arg === 'h_deep')) { begin(); return true; } return r0.apply(this, arguments); }
      if (name === 'back' || name === 'returnToTree') { state.t >= roomAt ? home() : goStation(-1); return true; } return false; }; };

  const whenTree = (fn) => { const t = () => (window.__tetol && window.__tetol.controls && document.querySelector('three-d-stage')?._scene?.getObjectByName('chamber_h_seed') ? fn(window.__tetol) : setTimeout(t, 150)); t(); };
  whenTree((TT) => { T = TT; THREE = T.THREE; stage = document.querySelector('three-d-stage'); cam = T.cam; controls = T.controls; build(); hookNav(); });
  window.TETOL_DEEP = { state, begin, home, stations: () => stationT.slice(), place: (t) => { state.t = state.tTarget = clamp(t); }, look: (y, p = 0) => { state.face = null; yaw = y; pitch = p; }, face: (k) => { state.face = k; } };
})();

;
// GENERATED by tools/make_council_data.py from src/data/council/. Do not edit by hand.
// One Circle, one source: the same manifests drive the Council PDF, the invitation and the facilitator sheet.
window.S33D_COUNCIL = {"circles":{"233":{"ancient_friend":{"name":"the Ankerwycke Yew","s33d_id":null,"s33d_id_note":"Not looked up in this pass; TETOL node 'yew' is the Roots Friend.","tetol":{"node":"yewc233","roots_node":"yew"}},"ancient_friend_s33d_id":null,"approval_state":{"overall":"AS_LIVED"},"central_question":null,"circle_id":"council-of-life/circle-233","circle_number":233,"companions":[],"companions_note":"Circle 233's companions (yewc233, owl, daisy, prince, oregano, nephew, abracadabra, people) remain defined in TETOL layer 080; not re-transcribed.","contract":"s33d.council-circle/0","contract_note":"TRANSCRIBED from TETOL (layers 080/250/330). Minimal: enough for the remembered/older rings. Nothing added.","fire":{"count":null,"fires":[]},"heartwood_harvest":{"status":"NOT_RECORDED_HERE"},"lineage":{"next":234,"previous":232},"manifest_version":"233.1.0","provenance":{"sources":["TETOL-Local src/layers/080-council-circles.js","250","330"],"transcribed":"5 Oct 2026, read-only"},"state":{"lifecycle":"heartwood","presence":"REMEMBERED"},"subtitle":"beneath the Ankerwycke Yew","tetol":{"note":"Scene objects that belong to Circle 233 / the Ankerwycke Yew. They show only when Circle 233 is in view, wherever its ring sits.","owns_objects":["root_to_ankerwycke_yew","equinox_threshold_line"]},"title":"The Equinox Threshold","visibility":{"public":true}},"234":{"ancient_friend":{"canonical_url":"https://www.s33d.life/tree/59eb1fe8-3c29-4696-ae00-f42edeb1c886","consent":"Guardians' names, age, photographs and testimony held back until her guardians agree (TETOL 290).","name":"Noku — Nokuphila, the Ubuntu Tree","s33d_id":"59eb1fe8-3c29-4696-ae00-f42edeb1c886","tetol":{"node":"c234_noku"}},"ancient_friend_s33d_id":"59eb1fe8-3c29-4696-ae00-f42edeb1c886","approval_state":{"note":"Shared publicly on 29 Sep (Telegram + illustrated PDF). This record does not re-approve anything.","overall":"AS_LIVED"},"assets":[{"drive_id":"1uNcCDBWZkEqjlxNyvSHaIPyBw4lRm4up","id":"pre_fire_pdf","kind":"pdf","status":"PUBLISHED_AS_LIVED"},{"href":"https://claude.ai/artifact/XRrv4E7sTFRP8RvMNZpftr","id":"tetol_0_9_11","kind":"tetol","status":"PRESERVED_AS_LIVED"}],"central_question":{"status":"AS_LIVED","text":"What would you bring to the Council of Life?"},"circle_id":"council-of-life/circle-234","circle_number":234,"companions":[{"emoji":"🌳","id":"c234_noku","library_seed":null,"line":"Connection · generosity · living relationships","name":"Noku — the Ubuntu Tree","role":"Ancient Friend","s33d_id":"59eb1fe8-3c29-4696-ae00-f42edeb1c886","tetol":{"node":"c234_noku","repr":{"form":"sapling","leaf":7313992},"seat":-0.5}},{"emoji":"🦚","id":"c234_peacock","library_seed":null,"line":"Beauty & belonging","name":"Peacock","role":"Bird","tetol":{"node":"c234_peacock","repr":{"form":"peacock"},"seat":1.0}},{"emoji":"🌺","id":"c234_dahlia","library_seed":{"key":"dahlia","status":"PREVIEW_IN_TETOL_260"},"line":"Patterns & possibility","name":"Dahlia","role":"Flower","tetol":{"node":"c234_dahlia","repr":{"centre":15251504,"count":9,"form":"flower","petals":12863082},"seat":-2.45}},{"emoji":"🌿","id":"c234_amaranth","library_seed":{"key":"amaranth","status":"PREVIEW_IN_TETOL_260"},"line":"Resilience & renewal","name":"Amaranth","role":"Plant","tetol":{"node":"c234_amaranth","repr":{"form":"herb","leaf":10108504,"shape":"pointed"},"seat":-1.75}},{"emoji":"🍄","id":"c234_porcini","library_seed":null,"line":"Hidden networks","name":"Penny Bun / Porcini","role":"Fungi","tetol":{"node":"c234_porcini","repr":{"cap":8014374,"count":2,"form":"fungus","scales":8014374,"stem":15129792},"seat":1.75}},{"emoji":"📖","id":"c234_hedgehog","library_seed":null,"line":"Practical wisdom","name":"The Hedgehog Handbook","role":"Book","tetol":{"node":"c234_hedgehog","repr":{"cover":5917232,"form":"book","ink":"#efe2b8","title":"The Hedgehog Handbook"},"seat":2.45}},{"emoji":"👥","id":"people","library_seed":null,"line":"Many voices, one Circle","name":"People","role":"People","tetol":{"node":"people","repr":null,"seat":null}}],"continuing_lineage":{"golden_thread":"ubuntu","note":"Named later by TEOTAG (4 Oct 2026) as the origin of the permanent Golden Thread of Ubuntu, beneath Nokuphila, the Ubuntu Tree. A lineage decision, not a harvest: Circle 234 remains REMEMBERED · UNHARVESTED.","role":"ORIGIN"},"contract":"s33d.council-circle/0","contract_note":"TRANSCRIBED from what already exists (TETOL 0.9.11 layer 250 + 0.9.14-dev manifest 330; the 29 Sep pre-fire PDF). Nothing added. No harvest is invented.","fire":{"count":3,"fires":[{"id":"opening","minutes":90,"name":"Opening Fire","note":"Confirmed by Ed, 30 Sep: the room was tested and TETOL walked through together. Not recorded; the next fire will be.","start":"2026-09-29T19:30:00+01:00","state":"held"},{"id":"fire2","name":"Fire II","start":null,"state":null},{"id":"fire3","name":"Fire III","start":null,"state":null}]},"heartwood_harvest":{"carried_to_next":null,"carried_to_next_note":"The one line for Circle 235 is discovered and approved before the 235 fire; it is written here and in circle-235 previous_circle_thread.one_line at the same time.","encounter_or_offering":null,"lines_that_stayed_alive":null,"memory_for_heartwood":null,"status":"NOT_HARVESTED"},"join_link":{"href":"https://meet.google.com/zkp-tuue-ima","note":"Circle 234 only. Not reused for 235.","platform":"Google Meet"},"lineage":{"next":235,"previous":233},"links":{"ancient_friend":"https://www.s33d.life/tree/59eb1fe8-3c29-4696-ae00-f42edeb1c886","notion_page":{"href":"https://app.notion.com/p/3e915b58480d8166aa4cc4c611c1e568","public":false}},"manifest_version":"234.1.1","open_circle":{"offering_kinds":["A book for a future Council","A song","A prayer","A blessing","A musing","An idea","A question","A photograph or encounter","Something noticed or learned","An Ancient Friend","A poem, story or fragment","Something entirely your own"],"stores_offerings":false},"previous_circle":{"circle_id":"council-of-life/circle-233","number":233,"title":"The Equinox Threshold","tree":{"name":"the Ankerwycke Yew","tetol_node":"yewc233"}},"previous_circle_thread":null,"provenance":{"sources":["TETOL-Local src/layers/250-0.9.7-circle-234.js","src/layers/330-0.9.14-dev-council-manifest.js","Council-of-Life_Circle-234_pre-fire_illustrated.pdf"],"transcribed":"4 Oct 2026, read-only"},"state":{"harvest":"UNHARVESTED","lifecycle":"living","lifecycle_note":"Not harvested. Moves to 'harvest' only when its harvest exists, by hand.","presence":"REMEMBERED","presence_note":"Derived from council.registry.json once current = 235."},"subtitle":"beneath Noku, the Ubuntu Tree","tetol_surfaces":{"older_title":"Three Fires · Open Circle","tree_short":"Noku, the Ubuntu Tree"},"title":"Three Fires · Open Circle","visibility":{"note":"Shared 29 Sep 2026 (Telegram + illustrated PDF). TETOL 0.9.11 is its public doorway.","public":true}},"235":{"agenda":[{"id":"arrival","prompts":["Welcome each person by name as they come in."],"text":"Settle. Fire, music, presence.","title":"ARRIVAL"},{"id":"opening","prompts":["“Before this call opened, the Circle had already begun — outside.”"],"text":"Welcome to Circle 235. Acknowledge those gathered, and the more-than-human companions at the fire.","title":"OPENING"},{"id":"the_thread_we_carry","prompts":["Name its companions.","Recall its question.","Name the Golden Thread carried from it: Ubuntu (a later TEOTAG lineage decision, not a harvest)."],"text":"Remember Circle 234: beneath Noku, the Ubuntu Tree.","title":"THE THREAD WE CARRY","uses":"previous_circle_thread"},{"id":"meet_the_ancient_friend","prompts":["What did the tree show you?"],"text":"The Fulham Palace Holm Oak. Leo and Bruna share their visit, if they wish; the photograph is from an earlier encounter.","title":"MEET THE ANCIENT FRIEND"},{"id":"meet_the_companions","prompts":["One line each is enough."],"text":"A breath for each: Apple Blossom, Dragon Fruit, Fly Agaric, Hen Harrier, Peter Pan, People.","title":"MEET THE COMPANIONS"},{"id":"the_question","prompts":["Offer it, then let it rest in silence for a moment."],"text":"{central_question}","title":"THE QUESTION"},{"id":"open_circle","prompts":["What did you meet this week?","What surprised you?","Which companion called you?","What arrived unexpectedly?"],"text":"People share what they noticed, brought, made, questioned or encountered.","title":"OPEN CIRCLE"},{"id":"listen","prompts":[],"text":"Silence, music, listening. Tree Radio or Council Radio if to hand; nothing here needs technology.","title":"LISTEN"},{"id":"offer","prompts":["Is there something you'd like to leave here?"],"text":"Invite offerings into the living Circle.","title":"OFFER"},{"id":"gather","prompts":["What do you hear repeating?","What connects?"],"text":"Notice the threads between what people brought.","title":"GATHER"},{"id":"remember","prompts":["“What from tonight should the Living Library remember?”"],"text":null,"title":"REMEMBER"},{"id":"close","prompts":["“Take the Circle outside with you.”"],"text":"A word, image, seed or intention from each person, or silence. Return everyone to the living world.","title":"CLOSE"}],"ancient_friend":{"canonical_url":"https://www.s33d.life/tree/924453c0-f4f5-4ed4-88fe-5b2ed6570af0","circle_linkage":{"exact_individual":"UNVERIFIED_THIS_CIRCLE","exact_individual_note":"The 4 Oct visit did not independently re-document the individual tree or its location (no photographs, no trunk reading). The match of this record to the Great Tree 'Fulham Palace Oak' stays a PROPOSAL.","note":"Circle 235's Ancient Friend is the existing S33D record. No other Holm Oak record is created.","record":"924453c0-f4f5-4ed4-88fe-5b2ed6570af0","status":"LINKED"},"encounter":{"consent":"Nothing about Leo or family is shown until the family agrees. Any earlier image with a person in frame needs that person's consent.","context":"Leo and Bruna visited Fulham Palace and went into the garden. It was Apple Day and extremely busy.","date":"2026-10-04","date_note":"During Circle 235's week, on Fulham Palace's Apple Day (reported by TEOTAG).","display_text":"The Holm Oak was met this week, in the Palace garden on a busy Apple Day. No new photographs were made; the photograph shown is from an earlier encounter.","display_text_status":"CANDIDATE","documentation":{"circle_235_field_photos":0,"note":"Bruna's phone battery was low, so no new photographs of the Holm Oak were made and no trunk location reading (GPS / what3words) was captured.","status":"PARTIAL","trunk_location_reading":null},"existing_material":{"intended_uses":[{"image":"holm_oak_earlier_01","slot":"tree_code_centre","status":"SET"},{"image":"holm_oak_earlier_01","slot":"holm_oak_card","status":"SET"},{"image":["holm_oak_earlier_01","holm_oak_earlier_02"],"slot":"council_pdf_ancient_friend","status":"SET"}],"rule":"Earlier images of the Holm Oak may be used for Circle 235 visual material only with explicit provenance: 'EARLIER ENCOUNTER' or 'EXISTING S33D RECORD'. Never labelled 'CIRCLE 235 FIELD PHOTO'.","sources":[{"count":2,"id":"teotag_s33d_record_photos","images":["holm_oak_earlier_01","holm_oak_earlier_02"],"note":"Earlier offerings on the record: 'Deep time' (17 Feb 2026), 'Holm Oak with Max' (22 Mar 2026). Which offering each image came from is not recorded here.","provenance":"EARLIER ENCOUNTER · EXISTING S33D RECORD","status":"RECEIVED","where":"Supplied by TEOTAG as the existing photographs associated with Ancient Friend 924453c0"}]},"noticed":[],"photos":[],"photos_note":"CIRCLE 235 FIELD PHOTO: none. The images shown for the Holm Oak are ancient_friend.images, each labelled EARLIER ENCOUNTER · EXISTING S33D RECORD.","source":"Reported by TEOTAG (Ed), 4 Oct 2026","status":"ENCOUNTERED_DOCUMENTATION_PARTIAL","status_label":"Encountered · documentation partial","status_note":"The encounter happened. Documentation is partial; this is not a failed encounter.","title":"From beneath the Holm Oak…","where":"Fulham Palace garden","who":["Leo","Bruna"],"words_bruna":null,"words_leo":null,"words_space_note":"Left open for any words or observations Leo and Bruna remember from the visit. Not to be filled on their behalf."},"identification":{"note":"924453c0 is the strongest candidate for the Great Tree of London 'Fulham Palace Oak' (~16 m from its published point). Confirm on site (GPS / what3words at the trunk). Research record 7c02c91b (Tree Hunting #532, ///stays.tamed.moves) is unlinked. Do not create another identity. The 4 Oct visit captured no trunk location reading, so identification stays PROPOSAL; the linkage to 924453c0 remains provisional until the exact-tree / location question is resolved. Fulham Palace's published location descriptions (near the walled garden / main lawn) support the Great Tree's history but do not by themselves resolve 924453c0's exact-individual identity.","status":"PROPOSAL"},"images":[{"caption":"The Fulham Palace Holm Oak · photograph from an earlier encounter, on its S33D record · not taken during Circle 235's 4 October visit","circle_235_field_photo":false,"date_note":"Date of the earlier encounter not recorded in the file; add if known.","date_taken":null,"file":"photos/holm-oak_earlier-encounter_01_preferred.jpg","height":1536,"id":"holm_oak_earlier_01","original":"photos/holm-oak_earlier-encounter_01_preferred_original.png","original_sha256":"0ea37130ec6f5d20ebed1856b78b994c1709305c50c26852e379a318094941af","people_in_frame":"none visible","provenance":"EARLIER ENCOUNTER · EXISTING S33D RECORD","provenance_caption":"Earlier encounter · existing S33D record · not taken during the 4 October visit.","provenance_caption_rule":"Render verbatim wherever this image appears.","provenance_note":"Not a Circle 235 field photo: not taken during the 4 October 2026 visit.","role":"PREFERRED","supplied_by":"TEOTAG (Ed), 4 Oct 2026","uses":["tree_code_centre","holm_oak_card","council_pdf_ancient_friend"],"width":1152},{"caption":"Supporting · earlier encounter photograph, on its S33D record · not taken during Circle 235's 4 October visit","circle_235_field_photo":false,"date_note":"Date of the earlier encounter not recorded in the file; add if known.","date_taken":null,"file":"photos/holm-oak_earlier-encounter_02_supporting.jpg","height":1536,"id":"holm_oak_earlier_02","original":"photos/holm-oak_earlier-encounter_02_supporting_original.png","original_sha256":"71c54996c19e4c357a5549d6bda55cb71911fa905bac69eebe98f9485948bc86","people_in_frame":"none visible","provenance":"EARLIER ENCOUNTER · EXISTING S33D RECORD","provenance_caption":"Earlier encounter · existing S33D record · not taken during the 4 October visit.","provenance_caption_rule":"Render verbatim wherever this image appears.","provenance_note":"Not a Circle 235 field photo: not taken during the 4 October 2026 visit.","role":"SUPPORTING","supplied_by":"TEOTAG (Ed), 4 Oct 2026","uses":["council_pdf_ancient_friend"],"width":1152}],"intro_line":"An evergreen traveller from the Mediterranean, standing in the grounds of Fulham Palace for perhaps five hundred years.","known":[{"label":"WHO","sources":["fp_2020"],"text":"A holm oak, Quercus ilex: an evergreen oak of the Mediterranean, long at home in Britain."},{"label":"WHERE","sources":["fp_garden"],"text":"The grounds of Fulham Palace, beside Bishop's Park on the Thames — for many centuries the home of the Bishops of London."},{"label":"AGE","sources":["fp_2020","fp_garden","fp_2014"],"text":"Around 500 years old by Fulham Palace's account, and among the oldest Holm Oaks in Britain. The Palace says it could be the oldest surviving specimen in England, perhaps the UK — a possibility, not a proven ranking."},{"label":"CARE","sources":["fp_2014","fp_2020","fp_2026"],"text":"Coppiced long ago, so it grows as many stems. Roped off to protect its branches and roots from soil compaction. In February 2026 the Palace was watching for holm oak bark scale and did not believe it was present."},{"label":"IN S33D","text":"Already an Ancient Friend on S33D.life, with offerings left beneath it earlier this year."}],"map_url":"https://www.s33d.life/map?tree=924453c0-f4f5-4ed4-88fe-5b2ed6570af0","name":"Fulham Palace Holm Oak","place_line":"Fulham Palace grounds, London","research":{"claims":[{"id":"species","sources":["fp_2020"],"status":"SOURCED","text":"Holm oak / holly oak, Quercus ilex."},{"id":"age","sources":["fp_2020","fp_garden","fp_2026"],"status":"SOURCED · ESTIMATE","text":"Described by Fulham Palace as around 500 years old, part of the Palace for over five centuries."},{"id":"standing","sources":["fp_garden"],"status":"SOURCED","text":"Among the oldest Holm Oaks in Britain; a Great Tree of London."},{"id":"planting","sources":["fp_2014","fp_tour"],"status":"SOURCED · POSSIBILITY","text":"Possibly planted by Bishop Edmund Grindal (1553–1559) or Bishop John Aylmer (1576–1594), or even earlier; believed to be one of the earliest Holm Oak introductions to Britain."},{"id":"oldest","rule":"Never state as fact. Keep as Fulham Palace's stated possibility.","sources":["fp_2014"],"status":"POSSIBILITY · NOT A PROVEN RANKING","text":"Fulham Palace says it could be the oldest surviving specimen of Quercus ilex in England, if not the United Kingdom."},{"id":"form","sources":["fp_2014"],"status":"SOURCED","text":"Coppiced long ago, leaving its multi-stemmed form and huge twisting branches."},{"id":"leaves","sources":["fp_2020"],"status":"SOURCED","text":"Evergreen; younger leaves are spikier, older leaves have smoother edges."},{"id":"care","sources":["fp_2020","fp_2026"],"status":"SOURCED","text":"Roped off to protect its ancient branches and root system from soil compaction."},{"id":"bark_scale","sources":["fp_2026"],"status":"SOURCED · DATED","text":"In February 2026 the Palace was monitoring its Holm oaks for holm oak bark scale (Nidularia pulvinata) and did not believe it was present at the Palace."},{"id":"location","rule":"Context only; does not confirm which S33D record is this individual.","sources":["fp_2014","fp_garden"],"status":"SOURCED · CONTEXT","text":"Published descriptions place the ancient tree near the walled garden / main lawn."}],"is_field_evidence":false,"kind":"SOURCED · published by Fulham Palace Trust","living_question":{"rule":"Keep as a question until stronger comparative evidence establishes the ranking.","status":"QUESTION","text":"Could this be Britain's oldest surviving Holm Oak?"},"note":"Sourced research about the Great Tree. Not evidence from the 4 Oct encounter, and it does not by itself resolve the exact-individual identity of S33D record 924453c0.","public_copy":{"status":"CANDIDATE","text":"c. 500 years old · among the oldest Holm Oaks in Britain; Fulham Palace says it could be the oldest surviving specimen in England, perhaps the UK."},"recorded_from":"Circle 235 Notion page §5A (TEOTAG, 4 Oct 2026)","sources":{"fp_2014":{"date":"2014-09-02","publisher":"Fulham Palace Trust","supports":"planting possibilities (Grindal 1553–1559 / Aylmer 1576–1594 / earlier); early introduction; could be the oldest surviving Q. ilex in England, if not the UK; coppiced multi-stem form","title":"The Fulham Palace ancient holm oak","url":"https://www.fulhampalace.org/news/the-fulham-palace-ancient-holm-oak/"},"fp_2020":{"date":"2020-11-30","publisher":"Fulham Palace Trust","supports":"c. 500 years; evergreen; younger leaves spikier, older leaves smoother-edged; supports and root-compaction protection","title":"Holm sweet holm","url":"https://www.fulhampalace.org/news/holm-sweet-holm/"},"fp_2026":{"date":"2026-02-22","publisher":"Fulham Palace Trust","supports":"monitoring for holm oak bark scale (Nidularia pulvinata); not believed present at the Palace (Feb 2026); 500-year-old specimen; roped off to reduce root compaction","title":"The Holm oak bark scale and Fulham Palace","url":"https://www.fulhampalace.org/news/the-holm-oak-bark-scale-and-fulham-palace/"},"fp_garden":{"date":null,"publisher":"Fulham Palace Trust","supports":"part of the Palace for over five centuries; among the oldest Holm Oaks in Britain; a Great Tree of London","title":"Importance of the garden","url":"https://www.fulhampalace.org/house-garden/the-garden/importance-of-the-garden/"},"fp_tour":{"date":null,"publisher":"Fulham Palace Trust","supports":"planted in the 1500s, probably by Grindal or Aylmer; believed to be one of the earliest Holm Oak introductions to Britain","title":"From bud to blossom self-guided tour (all ages)","url":"https://www.fulhampalace.org/wp-content/uploads/2021/03/From-bud-to-blossom-self-guided-tour-all-ages.pdf"}},"status":"RESEARCH"},"s33d_id":"924453c0-f4f5-4ed4-88fe-5b2ed6570af0","species":"Quercus ilex","species_key":"quercus-ilex","tetol":{"node":"c235_holmoak","roots_link":{"note":"Like the Ankerwycke Yew's root: a root from the Council to this Friend in the Roots. Needs a Roots record for 924453c0 (not in the 25 Sep friends snapshot).","status":"PROPOSAL"}}},"ancient_friend_s33d_id":"924453c0-f4f5-4ed4-88fe-5b2ed6570af0","approval_state":{"approved_at":null,"approved_by":null,"fields":{"agenda":"CANDIDATE","ancient_friend.encounter":"ENCOUNTERED_DOCUMENTATION_PARTIAL","ancient_friend.identification":"PROPOSAL","ancient_friend.images":"SET · provenance EARLIER ENCOUNTER / EXISTING S33D RECORD","ancient_friend.research":"RESEARCH · sourced (Fulham Palace Trust)","blooming_week_steps":"CANDIDATE","central_question":"TEOTAG APPROVED","companions":"CANDIDATE","fire":"OPEN_TIMES_IN_GROUP","heartwood_harvest":"PROPOSAL","invitation":"CANDIDATE","join_link":"SET","living_threads":"CANDIDATE","previous_circle_thread.one_line":"TEOTAG APPROVED · lineage decision (Golden Thread: Ubuntu)","spatial_grammar":"PROPOSAL"},"overall":"CANDIDATE","rule":"Nothing becomes TEOTAG APPROVED or CANONICAL/PUBLISHED without explicit approval."},"assets":[{"generated_from":"this manifest","id":"council_document_pdf","kind":"pdf","path":"Circle-235_Council-Document_working-edition.pdf","status":"CANDIDATE"},{"generated_from":"this manifest","id":"facilitator_sheet_pdf","kind":"pdf","path":"Circle-235_TEOTAG-Facilitator-Sheet.pdf","status":"CANDIDATE"},{"generated_from":"this manifest","id":"invitation_messages","kind":"text","path":"Circle-235_Invitation_Telegram-WhatsApp.md","status":"CANDIDATE"},{"id":"visual_family","kind":"register","note":"Main invitation, Tree Code (structure), 7 companion cards, Blooming Week card, A Place for You, social story + square; provenance per asset.","path":"assets/circle-235.assets.json","status":"CANDIDATE"},{"id":"tree_code","kind":"svg","note":"Centre: the Holm Oak, from an earlier-encounter photograph (holm_oak_earlier_01), labelled with its provenance.","path":"assets/circle-235_tree-code_structure.svg","status":"CANDIDATE"},{"id":"hero_holm_oak","kind":"image","path":"photos/holm-oak_earlier-encounter_01_preferred.jpg","status":"SET · EARLIER ENCOUNTER · EXISTING S33D RECORD"},{"id":"tetol","kind":"3d","path":"TETOL-Local tetol/0.9.15-dev","status":"DEV_ONLY"},{"id":"s33d_life_council","kind":"web","path":"ancient-roots-map teotag/council-circle-235","status":"CANDIDATE · not deployed"}],"blooming_week_steps":[{"id":"choose","label":"CHOOSE","text":"Pick one companion, or the living thing that is calling you."},{"id":"encounter","label":"ENCOUNTER","text":"Go and meet it in the real world: a tree, a flower, a bird, a book in your hands."},{"id":"notice","label":"NOTICE","text":"Slow down. Find one thing you hadn't noticed before."},{"id":"learn","label":"LEARN","text":"Discover one thing about it: a name, a story, how it lives."},{"id":"make_offer","label":"MAKE / OFFER","text":"Make something from what you found, or simply keep it to give."},{"id":"gather","label":"GATHER","text":"Bring it to the Council fire."},{"id":"remember","label":"REMEMBER","text":"Choose what should be carried into the Living Library."}],"central_question":{"decides":"TEOTAG, after the Holm Oak encounter","final":null,"held":[{"status":"PROPOSAL","text":"What changes when we grow up, and what do we keep?"},{"status":"PROPOSAL","text":"Who carries life between us, through the air and under the ground?"}],"label":"The Circle’s question","label_when_approved":"The Circle's question","status":"TEOTAG APPROVED","text":null},"circle_id":"council-of-life/circle-235","circle_number":235,"companions":[{"emoji":"🌳","id":"c235_holmoak","library_seed":{"key":"quercus-ilex","status":"EXISTS_IN_SPECIES_INDEX"},"line":"An evergreen traveller from the Mediterranean, standing in the grounds of Fulham Palace for perhaps five hundred years.","name":"Fulham Palace Holm Oak","role":"Ancient Friend","s33d_id":"924453c0-f4f5-4ed4-88fe-5b2ed6570af0","scientific":"Quercus ilex","species_key":"quercus-ilex","tetol":{"form_wanted":"holm oak (evergreen, rounded crown)","node":"c235_holmoak","repr":{"form":"sapling","leaf":3099178},"seat":-0.5,"stand_in":true},"threads":["Its low, young leaves are spiny; its high, older leaves are smooth. Can you find both?","October is acorn time.","Turn a leaf over: dark and glossy above, grey and felted beneath."]},{"emoji":"🌸","id":"c235_apple","library_seed":{"key":null,"note":"species_index holds two keys for Malus domestica: 'apple' and 'malus-domestica'. TEOTAG chooses; no third key.","status":"TBC"},"line":"A flower already promised.","name":"Apple Blossom","observations":[{"date":"2026-10-04","ref":"apple_day_2026-10-04","status":"OBSERVATION"}],"role":"Flower","scientific":"Malus domestica","species_key":null,"tetol":{"form_wanted":"five-petal blossom on a spur (builder draws 6 petals when count<=7)","node":"c235_apple","repr":{"centre":15255626,"count":5,"form":"flower","petals":16180454},"seat":-2.45,"stand_in":true},"threads":["The apples are being picked, yet next spring's blossom is already folded inside fat buds on the short spurs.","Cut an apple across its middle and find a five-pointed star.","Every pip is a new kind of apple; none grows up into its parent."]},{"emoji":"🌵","id":"c235_pitaya","library_seed":{"key":null,"note":"No Selenicereus entry found; a new identity is needed.","status":"TBC"},"line":"A climbing cactus whose great white flower opens for a single night.","name":"Dragon Fruit · Pitaya","role":"Plant","scientific":"Selenicereus undatus (syn. Hylocereus undatus)","species_key":null,"tetol":{"form_wanted":"climbing three-ribbed cactus with one night flower","node":"c235_pitaya","repr":{"form":"herb","leaf":6261306,"shape":"pointed"},"seat":-1.75,"stand_in":true},"threads":["Its flowers are visited in the dark, by moths and bats.","It travelled from Central America to Vietnam, where it is called thanh long, the green dragon.","Cut one open and count, or guess, the seeds."]},{"emoji":"🍄","id":"c235_flyagaric","library_seed":{"key":null,"note":"Fungi identity store not yet checked. Relate to Circle 234 Penny Bun / Porcini.","status":"TBC"},"line":"The red toadstool of every fairy tale, holding hands with trees underground.","name":"Fly Agaric","role":"Fungi","safety":"Toxic · Meet with care · Never eat.","scientific":"Amanita muscaria","species_key":null,"tetol":{"form_wanted":null,"node":"c235_flyagaric","repr":{"cap":12068380,"count":3,"form":"fungus","scales":16052196,"stem":15854816},"seat":1.75,"stand_in":false},"threads":["It rises as a white egg; the white spots are what remains of its veil.","It lives in partnership with tree roots, often birch and pine. Look up: who is its tree?","Toxic · Meet with care · Never eat."]},{"emoji":"🦅","id":"c235_harrier","library_seed":{"key":null,"note":"Bird identity store not yet checked. Not the northern harrier (C. hudsonius).","status":"TBC"},"line":"The grey ghost of the moors.","name":"Hen Harrier","role":"Bird","scientific":"Circus cyaneus","species_key":null,"tetol":{"form_wanted":"hen harrier, grey male quartering low (owl form shares the facial disc)","node":"c235_harrier","repr":{"form":"owl"},"seat":1.0,"stand_in":true},"threads":["The male is pale grey; females and young are brown 'ringtails'.","In spring the male passes food to the female in mid-air.","It hunts by ear as well as eye, with an owl-like face. Its return to the uplands is still fragile."]},{"author":"J. M. Barrie","emoji":"📖","id":"c235_peterpan","library_seed":{"key":null,"note":"Which work anchors the seed: TEOTAG.","status":"TBC"},"line":"The boy who would not grow up, and a story given away to heal children.","name":"Peter Pan","role":"Book","tetol":{"form_wanted":null,"node":"c235_peterpan","repr":{"cover":3033658,"form":"book","ink":"#efe2b8","title":"Peter Pan"},"seat":2.45,"stand_in":false},"threads":["In J. M. Barrie's earliest telling, Peter was once part bird.","Tinker Bell was first billed as 'Jenny Wren'.","In 1929 Barrie gave Peter Pan's rights to Great Ormond Street Hospital."],"works":[1902,1904,1906,1911]},{"emoji":"👥","id":"people","library_seed":null,"line":"Each of us, those we meet this week, and a seat left open.","name":"Those who gather","role":"People","tetol":{"form_wanted":null,"node":"people","repr":null,"seat":null,"stand_in":false},"threads":["Who first showed you a tree?","Who might you bring to the fire?"]}],"contract":"s33d.council-circle/0","contract_note":"PROPOSED shape (TEOTAG, 4 Oct 2026). One Circle, one manifest: the Council PDF, the invitation, S33D.life, TETOL and Heartwood all read from here. Unknown values are null / TBC / PROPOSAL / WAITING_FOR_ENCOUNTER, never invented.","edition":"Working edition · not yet for sharing","facilitator":[{"heading":"OPENING","lines":["Welcome to Circle 235.","<i>Before this call opened, the Circle had already begun, outside.</i>","Greet those here, and the companions at the fire."]},{"heading":"THREAD FROM 234","lines":["Beneath Noku, the Ubuntu Tree.","<i>What would you bring to the Council of Life?</i>","{HARVEST}"]},{"heading":"HOLM OAK","lines":["Fulham Palace · perhaps 500 years · evergreen.","Leo and Bruna visited on Apple Day (no new photos). Photo shown: earlier encounter.","<i>What did the tree show you?</i>"]},{"heading":"COMPANIONS","lines":["🌸 Apple Blossom · 🌵 Dragon Fruit","🍄 Fly Agaric · 🦅 Hen Harrier","📖 Peter Pan · 👥 People"]},{"heading":"CENTRAL QUESTION","lines":["{QUESTION}"]},{"heading":"OPEN CIRCLE","lines":["<i>What did you meet this week?</i>","<i>What surprised you?</i>","<i>Which companion called you?</i>"]},{"heading":"LISTEN","lines":["Silence, or a song.","Radio only if it is to hand."]},{"heading":"OFFER","lines":["<i>Is there something you'd like to leave in the Circle?</i>"]},{"heading":"GATHER","lines":["<i>What do you hear repeating?</i>","<i>What connects?</i>"]},{"heading":"HARVEST QUESTION","lines":["<i>What from tonight should the Living Library remember?</i>"]},{"heading":"CLOSING","lines":["A word, image, seed or intention · or silence.","<i>Take the Circle outside with you.</i>"]}],"fire":{"count":1,"display_note":null,"display_when_unknown":null,"fires":[],"status":"OPEN_TIMES_IN_GROUP"},"grammars":{"blooming_week":{"role":"What we do (the week)","status":"CANDIDATE","steps":["CHOOSE","ENCOUNTER","NOTICE","LEARN","MAKE / OFFER","GATHER","REMEMBER"]},"earthware":{"role":"The wider practice; not in public Circle copy","status":"REFERENCE","steps":["NOTICE","LEARN","TEND","GATHER","MAKE","USE","SHARE"]},"note":"Complementary layers, not merged. Not canonical.","spatial_journey":{"public":"ENTER · EXPLORE · OFFER · GATHER · BELONG on the cover","role":"Where we are (TETOL / the Council)","status":"PROPOSAL","steps":["ENTER","EXPLORE","OFFER","GATHER","BELONG","RETURN"]}},"heartwood_harvest":{"carried_to_next":null,"consent":"Nothing is kept without consent.","flow":[{"step":"Offerings","text":"what people brought and left"},{"step":"Approved Circle memory","text":"a short record of what was shared, approved with consent"},{"step":"Heartwood · Living Library","text":"what is worth keeping: offerings, companion seeds, encounters with Ancient Friends"},{"step":"Seed for the next Circle","text":"one line carried to Circle 236"}],"harvest_question":"What from tonight should the Living Library remember?","record":null,"remember_prompts":["Lines that stayed alive","An encounter or offering worth keeping","One memory for Heartwood","One line carried to Circle 236"],"rule":"Only an approved Circle memory may become the harvest. Nothing is written before the Fire.","status":"WAITING"},"invitation":{"bring_back":["a story","a question","a photograph","a song","a seed","an Ancient Friend","something made","something noticed","a dream","or simply your presence"],"credit_line":{"note":"Kept by TEOTAG's instruction (5 Oct): remove only if it causes a genuine problem.","status":"CANDIDATE","text":"Chosen this week by Leo."},"during_the_week":"choose · encounter · notice · learn · make or offer","heading":"The Council begins outside","message_main":"🌸 **Council of Life · Circle 235 · yOur Blooming Week**\n\nAncient Friends — a new Circle is opening, and this one begins outside.\n\nThe Council doesn't start when the call opens. It starts when we notice the living world around us.\n\nThis week's companions were chosen by Leo:\n🌳 the Fulham Palace Holm Oak, an Ancient Friend\n🌸 Apple Blossom · 🌵 Dragon Fruit · 🍄 Fly Agaric\n🦅 Hen Harrier · 📖 Peter Pan · 👥 and all of us\n\nSo go out first. Choose one companion, or the living thing nearest to you. Meet it. Notice something you hadn't noticed before.\n\nThen come back to the fire and bring something with you: a story, a photograph, a song, a seed, a question, something you made, or simply yourself.\n\nAround the fire we'll ask:\n*{question}*\n\n🔥 {fire}\n🔗 {join}\n\nOut into the living world, and back to the fire.\nDifferent friends. One living story. 🌳","message_short":"🌸 **Circle 235 · yOur Blooming Week**\nGo out first: choose a companion (Holm Oak, Apple Blossom, Dragon Fruit, Fly Agaric, Hen Harrier, Peter Pan), meet it, notice something new. Then bring it back to the fire.\n🔥 {fire} · 🔗 {join}","message_short_role":"Short social invitation (Telegram / WhatsApp nudge, story caption)","message_tokens":{"{fire}":"fire.fires[0] (or fire.display_when_unknown)","{join}":"join_link.href (or join_link.display_when_unknown)","{question}":"central_question.text"},"one_fire_line":"The Circle is open now. Times will be shared in the group as each fire is lit.","paragraphs":["Ancient Friends — a new Circle is opening, and this one begins outside.","The Council of Life does not begin when the call opens. It begins when we notice the living world around us: a bud on a branch, an acorn underfoot, a bird passing overhead.","So this week we invite you out before we invite you in. Choose a companion. Go and meet it, or the living thing nearest to you. Notice something you hadn't noticed before. Learn one thing about it. Make something, or simply keep what you found.","Then come back to the fire and bring it with you."],"quote":"The Council is not only the moment we meet. It is the living field between the fires.","status":"CANDIDATE"},"join_link":{"display_when_unknown":"JOIN LINK TO BE CONFIRMED","href":null,"note":"The canonical Council room is the recurring Google Meet already in the Google Calendar (set by TEOTAG, 4 Oct 2026). It is the Council's standing room, not a Circle-234-specific link.","platform":"Google Meet","status":"SET · canonical recurring Council room"},"lineage":{"next":236,"previous":234,"principle":{"status":"PROPOSAL","text":"Each Circle inherits at least one remembered thread from the Circle before it."},"rings":[{"harvest":"NOT_RECORDED_HERE","number":233,"presence":"REMEMBERED","tree":"the Ankerwycke Yew"},{"harvest":"UNHARVESTED","number":234,"presence":"REMEMBERED","tree":"Noku, the Ubuntu Tree"},{"harvest":"WAITING","number":235,"presence":"CURRENT","tree":"the Fulham Palace Holm Oak"},{"harvest":null,"number":236,"presence":"FUTURE","tree":null}]},"links":{"ancient_friend":"https://www.s33d.life/tree/924453c0-f4f5-4ed4-88fe-5b2ed6570af0","council_of_life":null,"join":null,"notion_working_page":{"href":"https://app.notion.com/p/3ef15b58480d81ec84dce0c460107aa1","public":false},"s33d_council":null,"s33d_council_note":"Shows Circle 235 only once the Council candidate is released; production currently shows the 4 May 2026 lunar card.","tetol":null,"tetol_note":"No TETOL link until a Circle 235 doorway exists. The public TETOL artifact is the Circle 234 Opening Fire build."},"living_threads":[{"companions":["c235_harrier","c235_apple","c235_pitaya","c235_peterpan"],"fragments":["a harrier passing food in mid-air","bees carrying apple pollen from tree to tree","moths and bats at a flower that opens in the dark","a boy who was once part bird"],"id":"through_the_air","status":"OBSERVATION · research threads; meaning is not given","title":"Through the air"},{"companions":["c235_pitaya","c235_peterpan","c235_harrier"],"fragments":["a flower that blooms for one night","a nursery window left open","harriers gathering to roost at dusk"],"id":"in_the_night","status":"OBSERVATION · research threads; meaning is not given","title":"In the night"},{"companions":["c235_holmoak","c235_harrier","c235_flyagaric","c235_apple","c235_peterpan"],"fragments":["spiny leaves that become smooth","brown ringtails that become grey ghosts","a white egg that becomes a red cap","a pip that never becomes its parent","a boy who refuses to grow up"],"id":"growing_and_changing","status":"OBSERVATION · research threads; meaning is not given","title":"Growing and changing"},{"companions":["c235_apple","c235_holmoak","c235_flyagaric"],"fragments":["next May's blossom folded in October buds","acorns falling now","a toadstool: the brief flowering of a hidden body"],"id":"promise_before_bloom","status":"OBSERVATION · research threads; meaning is not given","title":"Promise before bloom"},{"companions":["c235_holmoak","c235_apple","c235_pitaya"],"fragments":["an oak from the Mediterranean","apples from the mountains of Central Asia","a cactus from Central America, now grown far away"],"id":"travellers_who_became_home","status":"OBSERVATION · research threads; meaning is not given","title":"Travellers who became home"},{"companions":["c235_flyagaric","c235_holmoak"],"fragments":["a toadstool holding hands with tree roots","an old oak whose roots are roped for their own care"],"id":"beneath_the_ground","status":"OBSERVATION · research threads; meaning is not given","title":"Beneath the ground"}],"living_threads_note":"Invite noticing; never tell the visitor what a relationship means. The Circle may discover threads not listed here.","living_threads_prompt":"What connections do you notice?","manifest_version":"235.6.0","observations":[{"date":"2026-10-04","id":"apple_day_2026-10-04","interpretation":null,"note":"No mythic interpretation is assigned.","relates_to":["c235_apple","c235_holmoak","ancient_friend.encounter"],"source":"Reported by TEOTAG (Ed), 4 Oct 2026, before and after the visit","status":"OBSERVATION","text":"Leo had independently chosen Apple Blossom as Circle 235's Flower before the visit. On arriving at Fulham Palace, Leo and Bruna found that the Palace was holding Apple Day. Apple blossom itself was not in bloom. Recorded simply as an observed relationship between the week's chosen companion, the season, fruit and the life of the place."}],"offerings_prompt":{"heading":"Bring something to the Council","place_for_you":"One seat around the fire is kept. It is yours whenever you come. You do not need to know the names of trees, or have read the book, or seen a harrier. Bring what you found, or come with nothing but yourself.","text":"Perhaps a song. A story. A prayer. A photograph. An Ancient Friend you have met. A question you are carrying. Something you've made. Something the living world showed you. A seed of a dream. Or simply your presence.","safety":""},"open_circle":{"after":"The fire has been held. The Circle stays open: what you bring still reaches it.","before":"The Circle is open now. Go out first; come back with what you found.","honest_note":"This doorway does not send or store offerings yet; it stays in your browser. Bring it to the fire, or leave it on S33D.life.","offering_kinds":["A story","A question","A photograph","A song","A seed","An Ancient Friend","Something made","Something noticed","A dream","Simply your presence"],"stores_offerings":false},"previous_circle":{"circle_id":"council-of-life/circle-234","manifest":"circle-234.manifest.json","number":234,"title":"Three Fires · Open Circle","tree":{"name":"Noku, the Ubuntu Tree","s33d_id":"59eb1fe8-3c29-4696-ae00-f42edeb1c886"}},"previous_circle_thread":{"companions":["Noku","Peacock","Dahlia","Amaranth","Penny Bun","The Hedgehog Handbook","People"],"display_when_unknown":"WAITING FOR ONE LINE FROM CIRCLE 234","golden_thread":"ubuntu","note":"Circle 234 had no harvest and still has none. The inheritance was resolved later by TEOTAG as a lineage decision (the Golden Thread of Ubuntu, registry golden_threads.ubuntu), not by the gathering and not as a harvest.","one_line":"Ubuntu — the permanent Golden Thread, beginning with Circle 234 beneath Nokuphila, the Ubuntu Tree, guardian of the sweet waters, and carried through Circle 235 and all future Councils.","one_line_provenance":"A later TEOTAG-approved lineage decision (4 Oct 2026), not a harvest: Circle 234 remains remembered · unharvested.","one_line_status":"RESOLVED · TEOTAG LINEAGE DECISION","question":"What would you bring to the Council of Life?","title":"The Thread We Carry"},"provenance":{"chosen_by":"Leo (companions)","pattern":"Circle 234 pre-fire illustrated PDF (Drive 1uNcCDBWZkEqjlxNyvSHaIPyBw4lRm4up); Living Weekly Invitation Template (Notion)","prepared_by":"TEOTAG (Claude), 4 Oct 2026","research":"claude/council/Circle-235_yOur-Blooming-Week_Research-Garden_2026-10-04.md","s33d_records":"Read-only production query, 4 Oct 2026 (trees, offerings, research_trees, species_index)","unsourced_general_knowledge":["holm oak leaves spiny low, smooth high","October is acorn time","next spring's apple blossom buds already on the tree"]},"state":{"lifecycle":"opening","lifecycle_note":"Set by hand only. 'opening' when the invitation is sent; 'living' from the Fire; 'harvest' when an approved memory exists; 'heartwood' when remembered.","lifecycle_scale":["seed","opening","living","harvest","heartwood"],"mood":"BLOOMING","presence":"CURRENT","presence_note":"Derived from council.registry.json (current = 235). The registry wins if the two disagree."},"subtitle":"A living Circle for a living world.","supersedes":"235.5.1 (4 Oct 2026, encounter · research · photo provenance). 235.6.0 changes the lineage only: the Circle 234 → 235 inheritance is resolved by TEOTAG as the permanent Golden Thread of Ubuntu.","tetol_surfaces":{"note":"Only what is particular to Circle 235; everything else comes from council.registry.json tetol_surfaces_default.","outward":{"holm_oak_map":"The Fulham Palace Holm Oak on the S33D map"},"status":"CANDIDATE","thread":[{"place":"overview","say":"Start outside. This week the Council of Life gathers as Circle {n}, {title}, and it begins in the living world."},{"place":"canopy","say":"The canopy, where the Council gathers. Circle {n} hangs here as a lantern. Step inside."},{"place":"croom","say":"The Council deck. The Treehouse door names Circle {n} and asks: {question} Its companions sit around the fire; the living threads run between them."},{"place":"c235_holmoak","say":"The Fulham Palace Holm Oak: this week's Ancient Friend. One particular living tree in the grounds of Fulham Palace. Its card sends you outside to meet what is living."},{"place":"c235_apple","say":"Apple Blossom: a flower already promised. Each companion has its own card; follow a thread between them."},{"place":"seat_you","say":"A place for you, kept at the fire. The Circle is not complete without the one who arrives."},{"place":"c233rec","say":"The Open Circle. Bring something of your own to the Council, before or after the Fire."},{"place":"overview","say":"Back outside, into the living world. The Circle stays open."}],"fire_unknown":null,"fire_unknown_short":null,"question_status":"TEOTAG APPROVED","welcome_fire_unknown":null},"title":null,"visibility":{"edition":"WORKING EDITION · NOT YET FOR SHARING","public":false,"share_when":"The five human thresholds are resolved and TEOTAG approves.","surfaces":{"invitation":"draft, not sent","notion":"working page (private)","pdf":"working","s33d_life":"not changed","tetol":"0.9.15-dev, local only, unpublished"}},"publication_projection":{"date":"2026-10-07","source":"Notion Circle 235 / Current Priorities + explicit TEOTAG update","note":"Open-circle schedule projection; no Fire held or Offering persistence inferred."}},"236":{"ancient_friend":null,"ancient_friend_s33d_id":null,"approval_state":{"overall":"NOT_STARTED"},"central_question":null,"circle_id":"council-of-life/circle-236","circle_number":236,"companions":[],"contract":"s33d.council-circle/0","fire":{"count":null,"fires":[]},"join_link":null,"lineage":{"next":237,"previous":235},"manifest_version":"236.0.0","previous_circle":{"circle_id":"council-of-life/circle-235","number":235},"previous_circle_thread":{"note":"Filled from circle-235 heartwood_harvest.carried_to_next after the 235 fire.","one_line":null,"one_line_status":"TBC"},"state":{"lifecycle":null,"presence":"FUTURE","presence_note":"Not yet open. Nothing is shown in TETOL beyond 'the next ring'."},"subtitle":null,"title":null,"visibility":{"public":false}}},"registry":{"circles":{"233":{"manifest":"circle-233.manifest.json","note":"Ankerwycke Yew","presence":"REMEMBERED"},"234":{"manifest":"circle-234.manifest.json","note":"Noku · UNHARVESTED","presence":"REMEMBERED"},"235":{"manifest":"circle-235.manifest.json","note":"BLOOMING","presence":"CURRENT"},"236":{"manifest":"circle-236.manifest.json","presence":"FUTURE"}},"contract":"s33d.council-registry/0","current":235,"golden_threads":[{"ancestral_language":{"note":"Ancestral S33D language, older than and distinct from the Ubuntu lineage. Preserved as written; not merged into the Ubuntu thread.","source":"early yOur Golden Dream archival material","status":"ANCESTRAL SOURCE · preserved","text":"golden threads of heartfelt connection"},"applies_to":"Circle 234 onward: carried through Circle 235 and all future Councils","carried_from_circle":234,"decided_at":"2026-10-04","decided_by":"TEOTAG","decision_note":"Resolves the previously WAITING Circle 234 → 235 inheritance. Decided after the gathering; the Circle 234 gathering did not itself resolve it, and it is not a harvest.","display_line":"Ubuntu — the permanent Golden Thread, beginning with Circle 234 beneath Nokuphila, the Ubuntu Tree, guardian of the sweet waters, and carried through Circle 235 and all future Councils.","id":"ubuntu","intended_weaving":{"into":["the continuing Council Charter","the Protocols of Love","S33DNA"],"rule":"Woven into the continuing documents going forward. The historical Charter and Protocols of Love are not rewritten; their originals remain ancestral source records.","status":"INTENDED"},"kind":"PERMANENT GOLDEN THREAD","name":"Ubuntu","origin":{"circle":234,"tetol_node":"c234_noku","tree":"Nokuphila — the Ubuntu Tree, guardian of the sweet waters"},"provenance_line":"A later TEOTAG-approved lineage decision (4 Oct 2026), not a harvest: Circle 234 remains remembered · unharvested.","status":"TEOTAG APPROVED · lineage decision"}],"golden_threads_rule":"A permanent thread is inherited by every Circle at or after its origin. It adds no content to a Circle's own fields and never fills a harvest.","place":{"name":"The Council deck","treehouse":"The Open Circle, through the Treehouse door"},"registry_version":3,"rule":"current = CURRENT · lower numbers = REMEMBERED · current+1 = FUTURE / not yet open. Changing 'current' is the only weekly switch.","set_by":"hand","tetol_surfaces_default":{"canopy_lantern":{"name":"Circle {n}","sub":"{title}"},"canopy_life":"Circle {n} — {title} · {fire_short}","circle_card_purpose":"This week the Council begins outside. Meet the companions, follow the living threads, go out and meet what is living, then come back, take your place, and bring something to the fire.","circle_card_sub":"{title}","circle_status_note":"One Council Fire this week · {fire_short}. The Open Circle stays open before and after it.","door":"This week the Treehouse door names Circle {n} and asks: {question}","fire_unknown":"Council Fire · time to be announced","fire_unknown_short":"time to be announced","heartwood_prev_life":"Circle {prev_n}, remembered · not yet harvested","join_pending":"The join link will be shared here once it is confirmed.","note":"Templates use {n}, {title}, {question}, {fire}, {fire_short}, {prev_n}, {prev_title}, {prev_tree}, {older_n}, {older_title}, {older_tree}.","now_ring_sub":"This week · {title}","older_ring_purpose":"An older ring on the Treehouse wall: Circle {older_n}, {older_title}, beneath {older_tree}. Its record is kept; nothing is filled in here.","open_circle_fire_sentence_known":"<b>{fire}.</b> Before and after it, the Circle stays open: come in your own time.","open_circle_fire_sentence_unknown":"<b>One Council Fire this week · time to be announced.</b> The Circle is open now: come in your own time, before and after the Fire.","outward":{"find_friend":"Find an Ancient Friend near you","going":"I'm going out","holm_oak_map":"This week's Ancient Friend on the S33D map","label":"Go out and meet what is living","safety":"Look gently: fungi are for looking at only, nests are left undisturbed, and an old tree's roots are left in peace.","steps":["CHOOSE","ENCOUNTER","NOTICE","LEARN","MAKE / OFFER"],"sub":"The Circle begins outside · then come back","text":"TETOL is a doorway, not the place itself. Choose one companion, or the living thing nearest to you, and go and meet it in the world. Notice one thing you hadn't noticed before.","title":"Go out and meet what is living."},"people_purpose":"The inner seats are for the people who gather at the Council Fire, and for anyone who comes in their own time. Nobody is shown, tracked or invented here.","place_for_you_staff":"Carry a Staff from the Staff Room, if you like. Choosing a Staff is a way of arriving: not ownership, not a claim, not a second identity.","place_for_you_sub":"{question}","question_unknown":"This Circle's question is still being chosen.","remembered_ring_purpose":"Touch the ring to see the deck as Circle {prev_n} left it: {prev_tree}, its companions, its question. It is remembered, not yet harvested.","return":{"bring":"Bring it to the Council","seat":"Take your place","text":"What did you meet? Bring it to the Council, or simply take your place at the fire.","title":"Welcome back."},"status":"CANDIDATE · Circle-agnostic defaults; a Circle manifest overrides any key in its own tetol_surfaces","thread":[{"place":"overview","say":"Start outside. This week the Council of Life gathers as Circle {n}, {title}, and it begins in the living world."},{"place":"canopy","say":"The canopy, where the Council gathers. Circle {n} hangs here as a lantern. Step inside."},{"place":"croom","say":"The Council deck. The Treehouse door names Circle {n} and asks: {question}"},{"place":"seat_you","say":"A place for you, kept at the fire. The Circle is not complete without the one who arrives."},{"place":"c233rec","say":"The Open Circle. Bring something of your own to the Council, before or after the Fire."},{"place":"overview","say":"Back outside, into the living world. The Circle stays open."}],"threads_heading":"Follow the living threads","threads_intro":"Threads noticed between this week's companions. What they mean is yours to find.","traces_after":"Circle {n}'s Fire has been held. Its traces settle here once an approved Circle memory exists.","traces_before":"Circle {n} has not gathered yet. Its Heartwood harvest is waiting: only an approved Circle memory will settle here.","welcome":"Circle {n} of the Council of Life is open now. {question}","welcome_action":"Enter Circle {n}","welcome_fire_known":"Meet this week’s companions, follow the threads, and bring something back to the Council. <b>{fire}.</b>","welcome_fire_unknown":"Meet this week’s companions, go out and meet what is living, then bring something back to the Council. The Council Fire’s time will be announced here."}},"sha256":{"circle-233.manifest.json":"0ab7c9ee1c4f43095c3911fa72f6af12de29c99996b8cf394240047b927ad4c2","circle-234.manifest.json":"ff82beb35717f7c4e2eab16c231f79d1f1243b3fff1d6eed62dfecccda3ba715","circle-235.manifest.json":"1d1be2f8d14edf39f71b4cb6d526b96b73125cf8155979079f51521e1bbf70c3","circle-236.manifest.json":"26e72783412caf197a2c7ac9703fcad5e8eda17658b7dd0ac9ba3433f35dd82c","council.registry.json":"85517c4326a50f21e95747b50ec62fbc719c863b38573be861e4bbd6dcc54d18","235":"a22d00610301c779fd81331ba190c9aae3cbb38471d7ab0824046d0c0e8b7a70"}};
// Bind approved public state before the existing Council layers consume the manifest.
window.S33D_STATIC_CURRENT_CIRCLE_READY = false;
window.S33D_APPLY_CURRENT_CIRCLE(window.S33D_COUNCIL);
window.S33D_STATIC_CURRENT_CIRCLE_READY = true;
dispatchEvent(new Event("tetol:current-circle"));

;
// TETOL 0.9.15-dev · COUNCIL PRESENT (TEOTAG, 5 Oct 2026). DEV LINE · NOT PUBLISHED.
// CURRENT CIRCLE = MANIFEST. Reads window.S33D_COUNCIL (generated from the same manifests that drive the Council PDF,
// the invitation and the facilitator sheet) and exposes the present Circle to every later layer as D.councilPresent.
//   registry.current  → the CURRENT Circle (the only weekly switch, set by hand)
//   current − 1       → REMEMBERED (the carved ring beside the Treehouse door)
//   current − 2       → the older ring on the Treehouse wall
// `carried` is the Circle the legacy layers (250–320) still build by hand: 234. When current === carried nothing is
// rebound (State A: the 0.9.14-dev experience is kept as it was). When current ≠ carried, layer 345 binds every
// "now" surface from the manifest. TETOL authors no Circle text of its own. No URL switches here, by design.
(() => {
  const D = window.TETOL, DATA = window.S33D_COUNCIL; if (!D || !DATA) return;
  const CARRIED = 234, cur = DATA.registry.current, C = DATA.circles;
  const m = (n) => C[n] || null, P = m(cur);
  const fireOf = (M) => (M && M.fire && M.fire.fires && M.fire.fires[0]) || null;
  const fireText = (M = P) => { const f = fireOf(M); if (!f || !f.start) return null;
    const d = new Date(f.start), day = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' }),
      t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    const e = f.end ? new Date(f.end) : (f.minutes ? new Date(d.getTime() + f.minutes * 60000) : null),
      te = e ? e.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }) : null;
    return `${f.name || 'Council Fire'} · ${day} · ${t}${te ? '–' + te : ''} UK`; };
  // shared Circle-agnostic surfaces (registry) + what is particular to this Circle (its manifest); objects merge one level deep
  const surf = (M = P) => { const base = DATA.registry.tetol_surfaces_default || {}, own = (M && M.tetol_surfaces) || {}, out = { ...base };
    for (const [k, v] of Object.entries(own)) out[k] = v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' ? { ...base[k], ...v } : v;
    return out; };
  const treeName = (M) => (M && M.ancient_friend && M.ancient_friend.name) || 'its Tree';
  const vars = (M = P) => { const pv = m(M.circle_number - 1), od = m(M.circle_number - 2), s = surf(M);
    return { n: M.circle_number, title: M.title || `Circle ${M.circle_number}`, question: (M.central_question && M.central_question.text) || s.question_unknown || '',
      fire: fireText(M) || s.fire_unknown || 'Council Fire · time to be announced', fire_short: fireText(M) || s.fire_unknown_short || 'time to be announced',
      prev_n: M.circle_number - 1, prev_title: (pv && pv.title) || '', prev_tree: treeName(pv),
      older_n: M.circle_number - 2, older_title: (od && od.title) || '', older_tree: treeName(od) }; };
  const t = (s, M = P) => { if (typeof s !== 'string') return s; const v = vars(M); return s.replace(/\{(\w+)\}/g, (x, k) => (k in v ? String(v[k]) : x)); };
  const join = (M = P) => { const j = M && M.join_link; return j && typeof j.href === 'string' && /^https:\/\//.test(j.href) ? j.href : null; };
  const platform = (M = P) => { const j = M && M.join_link; return j && j.platform && j.platform !== 'TBC' ? j.platform : null; };

  // two honest states the Circle manifests use (S33D grammar: OBSERVATION → PROPOSAL → CANDIDATE → APPROVED → CANONICAL)
  if (D.STATUS && P && cur !== CARRIED) { D.STATUS.OBSERVATION ||= { glyph: '○', label: 'Observation', desc: 'Noticed or researched; not yet a proposal or a canonical claim.' };
    D.STATUS.WAITING ||= { glyph: '◔', label: 'Waiting', desc: 'Waits for something that has not happened yet: an encounter, a date, an approved harvest.' }; }
  D.councilData = DATA;
  D.councilPresent = {
    number: cur, carried: CARRIED, advanced: !!P && cur !== CARRIED, manifest: P, get: m,
    prev: m(cur - 1), older: m(cur - 2), surf, t, fireOf, fireText, join, platform, treeName,
    sha256: DATA.sha256, testOverride: !!DATA.registry.test_override,
    // permanent Golden Threads (registry): inherited by every Circle at or after their origin; a lineage decision, never a harvest
    golden: (DATA.registry.golden_threads || []).filter((g) => g.origin && g.origin.circle <= cur),
    // the five human thresholds, as the manifest holds them (shown honestly, never filled here)
    thresholds: P ? {
      encounter: P.ancient_friend && P.ancient_friend.encounter ? P.ancient_friend.encounter.status : null,
      question: P.central_question ? P.central_question.status : null,
      fire: fireOf(P) && fireOf(P).start ? 'SET' : 'TBC',
      join: join(P) ? 'SET' : 'TBC',
      thread: P.previous_circle_thread && P.previous_circle_thread.one_line ? (P.previous_circle_thread.one_line_status || 'SET') : 'WAITING' } : null,
  };
})();

;
// TETOL 0.9.7 · CIRCLE 234 · the active living layer (HQ, 28 Sep 2026). EXPERIMENT · NOT CANONICAL.
// The vessel is unchanged (deck, fire, Treehouse, Tree). Only the Circle layer moves on:
//   · Circle 234 becomes the current Circle; its seven companions take the seats (names as given by HQ; forms are
//     illustrative stand-ins, nothing is said about them that HQ did not say).
//   · Circle 233 settles into lineage: the carved ring beside the Treehouse door, its companions still visitable there.
//   · The Open Circle: one Circle · three live fires · one persistent Open Circle. Between the fires, anyone can come in
//     their own time and shape an offering. HONEST LIMIT: this doorway does not store or send offerings yet.
// Internals: the prototype keeps two Circle "slots" (current = 233, previous = 232) that its scene code is written
// around. Circle 234 fills the current slot; Circle 233 fills the previous slot. Displayed numbers come from `number`.
(() => {
  const D = window.TETOL; if (!D || !D.council || !D.council.circles) return;
  const n = D.nodes, APP = 'https://www.s33d.life', ext = (D.ext ||= { anchors: {}, views: {} });
  // 0.9.15-dev: when the registry's current Circle is not 234, the "now" strings below come from its manifest
  // (D.councilPresent, layer 246). With 234 current, every value is exactly what it was.
  const PR = D.councilPresent && D.councilPresent.advanced ? D.councilPresent : null, PM = PR && PR.manifest, PS = PR ? PR.surf() : {};
  const NUM = PR ? PR.number : 234;
  const Q = PR ? PR.t('{question}') : 'What would you bring to the Council of Life?';
  const SRC = 'Circle 234 companions and question as given by S33D HQ, 28 Sep 2026.';
  // 0.9.9 (Ed, 28 Sep): name only the Opening Fire. Further fires stay open while the community is asked where they fit.
  const OPEN_START = Date.UTC(2026, 8, 29, 18, 30), OPEN_END = OPEN_START + 90 * 60000; // Tue 29 Sep 2026, 7:30pm UK (BST); 90-minute window (Ed): the gathering may be ~1h, the fire stays lit while people are still together
  // Place / join doorway: READY, EMPTY. Ed provides the real link or arrangement separately; nothing is invented here.
  //   Fill one or both, rebuild, republish:  href: 'https://…' (https only)  ·  place: 'where people gather, in plain words'
  const JOIN = PR ? { href: PR.join(), place: null } : { href: null, place: null };
  const JOIN_LABEL = PR ? `Join the ${(PR.fireOf(PM) || {}).name || 'Council Fire'} ↗` : 'Join the Opening Fire ↗';
  const joinHTML = () => { const safe = (u) => typeof u === 'string' && /^https:\/\//.test(u); const e = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    if (!safe(JOIN.href) && !JOIN.place) return '<p class="join" data-join="pending">Where and how to gather: <i>' + (PR ? PR.t(PS.join_pending) : 'shared soon') + '</i>.</p>';
    return '<p class="join" data-join="set">' + (JOIN.place ? 'Where: ' + e(JOIN.place) + ' ' : '') + (safe(JOIN.href) ? '<a href="' + e(JOIN.href) + '" target="_blank" rel="noopener">' + JOIN_LABEL + '</a>' : '') + '</p>'; };
  const FIRES = 'Opening Fire: Tuesday 29 September, 7:30pm (UK) · further fires as the Circle listens';

  // ── the previous slot now holds Circle 233, exactly as it was
  const c233 = D.council.circles[233];
  const prev = { ...c233, node: 'c232', number: 233, status: 'remembered', previous: null, next: 233 };
  // Circle 232's own companions are no longer drawn (they remain in the lineage as a carved ring)
  (D.council.circles[232].companions || []).forEach((cm) => { if (n[cm.id]) n[cm.id].circle = 231; });

  // ── Circle 234: seven companions (People are the inner seats, as before)
  const companions = [
    { id: 'c234_noku', name: 'Noku', sub: 'the Ubuntu Tree', kind: 'Tree', seat: -0.5, repr: { form: 'sapling', leaf: 0x6f9a48 } },
    { id: 'c234_peacock', name: 'Peacock', kind: 'Bird', seat: 1.0, repr: { form: 'peacock' } },
    { id: 'c234_dahlia', name: 'Dahlia', kind: 'Flower', seat: -2.45, repr: { form: 'flower', petals: 0xc4466a, centre: 0xe8b830, count: 9 } },
    { id: 'c234_amaranth', name: 'Amaranth', kind: 'Plant', seat: -1.75, repr: { form: 'herb', leaf: 0x9a3e58, shape: 'pointed' } },
    { id: 'c234_porcini', name: 'Penny Bun / Porcini', kind: 'Fungi', seat: 1.75, repr: { form: 'fungus', cap: 0x7a4a26, scales: 0x7a4a26, stem: 0xe6dcc0, count: 2 } },
    { id: 'c234_hedgehog', name: 'The Hedgehog Handbook', kind: 'Book', seat: 2.45, repr: { form: 'book', title: 'The Hedgehog Handbook', cover: 0x5a4a30, ink: '#efe2b8' } },
  ];
  D.council.circles = {
    233: { node: 'c233', number: 234, status: 'open', previous: 232, next: null, companions: companions.map(({ id, kind, seat, repr }) => ({ id, kind, seat, repr })) },
    232: prev,
  };
  D.council.active = 233; D.council.current = 'c233'; D.council.theme = 'The Open Circle';
  companions.forEach((c) => { n[c.id] = {
    name: c.name, sub: c.sub ? c.sub + ' · Circle 234' : c.kind + ' companion · Circle 234', part: 'At the Council fire · Circle 234', parent: 'croom', spatial: true, room: true, scale: 'record', circle: 233,
    practical: `${c.kind} companion of Circle 234.`, purpose: 'Named as a companion of Circle 234. Its own life continues outside the Council.',
    location: 'At its place around the fire.', status: 'LIVE', statusNote: SRC, placement: 'PROPOSED', placementNote: 'Seat positions and forms are illustrative stand-ins, not portraits.',
    lives: [], notes: [], relations: [{ to: 'c233now', dim: 'time', text: 'The Circle that invited it' }, { to: 'c233rec', dim: 'place', text: 'The Open Circle' }],
    actions: [{ label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' }], sources: [SRC] }; });
  if (n.people) { n.people.sub = 'People companion · Circle 234'; n.people.circle = 233; n.people.purpose = 'The inner seats are for the people who gather at the live fires, and for anyone who comes in their own time. Nobody is shown, tracked or invented here.'; }

  // Circle 233's companions stay together, in the previous slot
  (c233.companions || []).forEach((cm) => { if (n[cm.id]) { n[cm.id].circle = 232; n[cm.id].status = 'REMEMBERED'; } });
  ['c233legacy', 'pack'].forEach((id) => { if (n[id]) n[id].circle = undefined; });

  // ── the Circle markers
  const REC233 = (n.c233rec && (n.c233rec.actions || []).find((a) => a.href)) || null;
  Object.assign(n.c232, { name: 'Circle 233', sub: 'The week before', purpose: 'Touch the ring to see the deck as Circle 233 left it: the same place, the same fire, its companions. Its record settles down into the long memory.',
    stateShort: 'Remembered · settling into the record', status: 'REMEMBERED', statusNote: 'Circle 233, now in the lineage.', sources: ['Council of Life — Circle 233'],
    actions: [...(REC233 ? [{ ...REC233, label: 'Circle 233’s record', sub: 'Notion · members' }] : []), { label: 'Council records on S33D.life', sub: 'Open to all · opens in a new tab', href: APP + '/council/records' }],
    relations: [{ to: 'croom', dim: 'place', text: 'The same deck, this week' }, { to: 'c_records', dim: 'place', text: 'The records chest' }, { to: 'h_scrolls', dim: 'time', text: 'Down into the long memory of the Deeper Rings' }] });
  Object.assign(n.c233now, { name: 'Circle 234', sub: 'This week · the Open Circle', purpose: 'Return to this week’s Circle: ' + Q, statusNote: FIRES + '. Between them the Circle stays open.' });
  if (n.mem231) Object.assign(n.mem231, { name: 'Circle 232', sub: 'Remembered', purpose: 'An older ring on the Treehouse wall. Its record is kept; nothing is filled in here.' });

  // ── the Circle itself (the canopy node) and the fire
  Object.assign(n.c233, { name: 'Circle 234', sub: 'What would you bring?', part: 'In the canopy · the Council of Life',
    practical: Q, purpose: `One Circle · live fires · one persistent Open Circle. ${FIRES}. Between the fires, come in your own time: meet the companions and bring something to the Council.`,
    status: 'LIVE', statusNote: 'The Opening Fire is named. Further gatherings will find their place as the community is asked; no other date is shown until it is agreed.', lives: companions.map((c) => ({ text: c.name + (c.sub ? ' — ' + c.sub : '') + ' · ' + c.kind, status: 'LIVE' })).concat([{ text: 'People', status: 'LIVE' }]),
    actions: [{ label: 'Enter Circle 234', sub: 'Up to the Council fire in the Treehouse', go: 'croom' }, { label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' }, { label: 'The Council of Life on S33D.life', sub: 'Open to all · opens in a new tab', href: APP + '/council-of-life' }],
    sources: [SRC] });
  if (n.croom) { n.croom.question = Q; n.croom.actions = [{ label: 'Bring something to the Council', sub: 'The Open Circle · ' + Q, go: '@opencircle' }, ...(n.croom.actions || []).filter((a) => a.go !== '@opencircle')]; }
  if (n.c233rec) Object.assign(n.c233rec, { name: 'The Open Circle', labelName: 'The Open Circle', sub: 'Bring something to the Council', part: 'Through the Treehouse door',
    practical: 'Between the live fires, the Circle stays open.', purpose: Q + ' A book for a future Council, a song, a prayer, a blessing, a musing, an idea, a question, a photograph or encounter, something noticed or learned, an Ancient Friend, a poem, story or fragment, or something entirely your own.',
    status: 'PROPOSED', statusNote: 'Experimental: this doorway does not store or send offerings yet.', actions: [{ label: 'Bring something to the Council', sub: 'Shape an offering', go: '@opencircle' }], sources: [SRC], circle: undefined });
  ['people', 'traces'].forEach((id) => { const x = n[id]; if (!x) return; ['name', 'sub', 'part', 'practical', 'purpose', 'location', 'statusNote'].forEach((f) => { if (typeof x[f] === 'string') x[f] = x[f].replace(/233/g, '234'); }); });
  if (n.traces) Object.assign(n.traces, { name: 'Circle 234 traces', purpose: 'After a Circle gathers, a few traces may be carried from the Council Fire down into Heartwood and settle on the season’s ring. Circle 234 has not gathered yet, so this place is empty.' });
  if (n.h_hearth) (n.h_hearth.relations ||= []).unshift({ to: 'c233', dim: 'time', text: 'Circle 234 is open · the Council, up in the canopy' });
  if (n.h_scrolls) (n.h_scrolls.lives ||= []).push({ text: 'Circle 233, settling into the long memory', status: 'PROPOSED' });
  if (n.c_records) (n.c_records.relations ||= []).push({ to: 'c232', dim: 'time', text: 'Circle 233, the week before' });

  // ── the fire's state: open, banked between the live fires; the sign and pill read from here
  // The fire: before the Opening Fire it is upcoming, during it the fire is lit; after it the Circle stays open, further fires emerging.
  const AFTER = { openShort: 'Opening Fire held · further fires as the Circle listens', openLong: 'The Open Circle · the Opening Fire has been held · further fires will find their time · come in your own time' };
  D.circle233 = { start: OPEN_START, end: OPEN_END, label: 'Opening Fire', openShort: 'Further fires as the Circle listens', openLong: 'The Open Circle · come in your own time' };
  const settle = () => { if (false && D.circle233.start) Object.assign(D.circle233, { start: null, end: null }, AFTER); };
  settle(); setInterval(settle, 15000);
  // ── Time of the Council: Circle 234 is open; Circle 233's time record moves to the lineage with it
  if (D.time && D.time.cycles) { const old = D.time.cycles[233];
    D.time.cycles = { 233: { node: 'c233now', drafted: null, shared: null, held: null, planned: null, explored: [], people: [] }, 232: { ...(old || {}), node: 'c232', status: 'remembered' } };
    if (n.c233now) n.c233now.time = 233; if (n.c232) n.c232.time = 232; }

  // ── a peacock, simply: body, neck, crested head and a raised fan (an illustrative stand-in)
  ext.forms = { ...(ext.forms || {}), peacock({ THREE, add, std, ctex, g, id }) {
    const blue = std({ color: 0x1f5f8a, emissive: 0x06202e, emissiveIntensity: 0.5, name: id + '_plumage' });
    const body = add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 14), blue), id + '_body', id, g); body.scale.set(0.9, 1.1, 1.35); body.position.set(0, 0.56, 0.02);
    const neck = add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.2, 10), blue), id + '_neck', id, g); neck.position.set(0, 0.72, 0.08); neck.rotation.x = 0.35;
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 10), blue), id + '_head', id, g); head.position.set(0, 0.83, 0.12);
    add(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.05, 6), std({ color: 0x8a7a50 })), id + '_beak', id, g).position.set(0, 0.825, 0.17), g.children[g.children.length - 1].rotation.x = Math.PI / 2;
    [-0.018, 0, 0.018].forEach((x, i) => { const s = add(new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.06, 4), std({ color: 0x1a3a4a })), id + '_crest', id, g); s.position.set(x, 0.89, 0.11); s.rotation.z = -x * 12;
      add(new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), blue), id + '_crest_tip', id, g).position.set(x * 1.6, 0.92, 0.11); });
    const fan = ctex(512, 256, (x, w, h) => { const gr = x.createRadialGradient(w / 2, h, 20, w / 2, h, h); gr.addColorStop(0, '#2c5a3a'); gr.addColorStop(1, '#3f6a3a'); x.fillStyle = gr; x.beginPath(); x.arc(w / 2, h, h, Math.PI, 0); x.fill();
      for (let r = 70; r < h; r += 46) for (let a = 0.12; a < Math.PI; a += 0.19 + 28 / r) { const px = w / 2 + Math.cos(Math.PI + a) * r * -1, py = h - Math.sin(a) * r;
        x.fillStyle = '#c8a040'; x.beginPath(); x.ellipse(px, py, 11, 13, 0, 0, 7); x.fill(); x.fillStyle = '#1e6a8a'; x.beginPath(); x.ellipse(px, py, 7, 8, 0, 0, 7); x.fill(); x.fillStyle = '#102a44'; x.beginPath(); x.arc(px, py, 3.5, 0, 7); x.fill(); } });
    const tail = add(new THREE.Mesh(new THREE.CircleGeometry(0.42, 40, 0, Math.PI), std({ map: fan, side: THREE.DoubleSide, alphaTest: 0.1, roughness: 0.8, emissive: 0x0a1a10, emissiveIntensity: 0.4, name: id + '_fan' })), id + '_fan', id, g);
    tail.position.set(0, 0.5, -0.1); tail.rotation.x = -0.18;
    return 0.98; } };

  // ═════════════ 0.9.8 · no Circle 233 inheritance on the active Circle (HQ, 28 Sep) ═════════════
  // Circle 234's Tree companion is Noku — the Ubuntu Tree. The Ankerwycke Yew stays with Circle 233 and its lineage
  // (its ring, its companions, the Yew's own record and the "Circle 233 ↔ Ankerwycke Yew" thread are untouched).
  { const kindOf = { c234_noku: 'Tree', c234_peacock: 'Bird', c234_amaranth: 'Plant', c234_porcini: 'Fungi', c234_dahlia: 'Flower', c234_hedgehog: 'Book' };
    if (n.croom) {
      n.croom.lives = [...companions.map((c) => ({ text: `${kindOf[c.id]} · ${c.name}${c.sub ? ' — ' + c.sub : ''}`, status: 'LIVE', to: c.id })), { text: 'People · those who gather, at the live fires and in their own time', status: 'LIVE', to: 'people' }];
      n.croom.relations = (n.croom.relations || []).map((r) => r.to === 'yewc233' ? { to: 'c234_noku', dim: 'place', text: 'The Tree companion: Noku — the Ubuntu Tree' }
        : r.to === 'c233' ? { ...r, text: 'The current Circle, named at the doorway: Circle 234' } : r.to === 'c233rec' ? { ...r, text: 'The Open Circle, through the Treehouse door' } : r);
    }
    if (n.c233) { const moved = (n.c233.relations || []).filter((r) => ['c233legacy', 'pack'].includes(r.to));
      n.c233.relations = (n.c233.relations || []).filter((r) => !['c233legacy', 'pack'].includes(r.to)).map((r) => r.to === 'yew' ? { to: 'c234_noku', dim: 'web', text: 'Tree companion: Noku — the Ubuntu Tree' } : r);
      if (n.c232) n.c232.relations = [...(n.c232.relations || []), { to: 'yewc233', dim: 'web', text: 'Its Tree companion: the Ankerwycke Yew' }, ...moved]; }
    if (n.canopy) n.canopy.lives = (n.canopy.lives || []).map((l) => l.to === 'c233' ? { text: 'Circle 234 — the Open Circle · Opening Fire Tuesday 29 September, 7:30pm (UK)', status: 'LIVE', to: 'c233' } : l)
      .concat([{ text: 'Circle 233 — The Equinox Threshold · remembered', status: 'REMEMBERED', to: 'c232' }]);
    if (D.thread && D.thread.steps) D.thread.steps = D.thread.steps.map((st) => st.id === 'croom' ? { ...st, say: 'High in the canopy: the Council of Life. This week the Treehouse door names Circle 234. The carved ring beside it remembers Circle 233, whose Tree companion was the Ankerwycke Yew; touch the ring and its root glows again.' } : st);
    if (n.c234_noku) { n.c234_noku.purpose = 'Circle 234’s Tree companion. Noku is a real, living tree; its library will link to Noku’s own real-source record rather than to anything invented here.';
      (n.c234_noku.notes ||= []).push({ status: 'PROPOSED', text: 'Real-source Noku / Ancient Friend / Pod record: to be linked when HQ confirms the public source.' }); }
  }

  // ═════════════ THE OPEN CIRCLE · an honest experimental doorway ═════════════
  const KINDS = PR && PM.open_circle && PM.open_circle.offering_kinds ? PM.open_circle.offering_kinds : ['A book for a future Council', 'A song', 'A prayer', 'A blessing', 'A musing', 'An idea', 'A question', 'A photograph or encounter', 'Something noticed or learned', 'An Ancient Friend', 'A poem, story or fragment', 'Something entirely your own'];
  const KEY = 'tetol-open-circle-' + NUM;
  const css = document.createElement('style');
  css.textContent = `
  #open-circle { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; background: hsl(30 20% 4% / .55); backdrop-filter: blur(3px); font-family: var(--sans); }
  #open-circle[hidden] { display: none; }
  #open-circle .oc { position: relative; width: min(520px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); overflow: auto; background: hsl(30 16% 8% / .96); border: 1px solid hsl(42 45% 45% / .35); border-radius: 16px; padding: 22px 22px 24px; color: var(--ink2); box-shadow: 0 20px 60px #000a; }
  #open-circle .eyebrow { font: 600 10.5px/1 var(--sans); letter-spacing: .16em; text-transform: uppercase; color: var(--ink3); margin: 0 0 8px; }
  #open-circle h2 { font: 600 24px/1.1 var(--serif); letter-spacing: .05em; color: var(--ink); margin: 0 0 6px; }
  #open-circle .q { font: italic 19px/1.35 var(--whisper); color: var(--ink); margin: 0 0 12px; }
  #open-circle p { font-size: 14px; line-height: 1.5; margin: 0 0 12px; }
  #open-circle .kinds { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 12px; padding: 0; list-style: none; }
  #open-circle .kinds button { font: 500 12.5px/1 var(--sans); color: var(--ink2); background: none; border: 1px solid hsl(42 30% 40% / .45); border-radius: 999px; padding: 8px 11px; cursor: pointer; min-height: 34px; }
  #open-circle .kinds button[aria-pressed="true"] { background: hsl(42 80% 55% / .2); border-color: hsl(42 80% 60% / .8); color: var(--ink); }
  #open-circle label { display: block; font: 600 11px/1 var(--sans); letter-spacing: .1em; text-transform: uppercase; color: var(--ink3); margin: 6px 0 6px; }
  #open-circle textarea { width: 100%; box-sizing: border-box; min-height: 110px; resize: vertical; background: hsl(30 14% 5%); color: var(--ink); border: 1px solid hsl(42 30% 35% / .5); border-radius: 10px; padding: 10px 12px; font: 15px/1.45 var(--sans); }
  #open-circle .honest { border-left: 2px solid hsl(42 70% 55% / .7); padding: 8px 12px; background: hsl(42 40% 40% / .08); border-radius: 0 8px 8px 0; font-size: 13.5px; margin: 14px 0; }
  #open-circle .row { display: flex; flex-wrap: wrap; gap: 8px; }
  #open-circle .row a, #open-circle .row button { font: 600 13px/1.2 var(--sans); border-radius: 10px; padding: 11px 14px; text-decoration: none; cursor: pointer; border: 1px solid hsl(42 40% 45% / .45); color: var(--ink); background: none; min-height: 44px; }
  #open-circle .row .primary { background: hsl(42 95% 55%); color: #1b1408; border-color: transparent; }
  #open-circle .x { position: absolute; top: 8px; right: 8px; width: 44px; height: 44px; border: 0; background: none; color: var(--ink2); font-size: 24px; cursor: pointer; }
  #open-circle .join { font-size: 13.5px; margin: -4px 0 12px; color: var(--ink2); } #open-circle .join a { color: var(--ink); }
  #open-circle .status { font-size: 12.5px; color: var(--ink3); min-height: 1.2em; margin: 8px 0 0; }`;
  document.head.appendChild(css);
  const box = document.createElement('div'); box.id = 'open-circle'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'oc-title');
  box.innerHTML = `<div class="oc" tabindex="-1">
    <button type="button" class="x" aria-label="Close the Open Circle">×</button>
    <p class="eyebrow">Council of Life · Circle ${NUM} · experimental</p>
    <h2 id="oc-title">The Open Circle</h2>
    <p class="q">“${Q}”</p>
    <p>${PR ? PR.t(PR.fireText() ? PS.open_circle_fire_sentence_known : PS.open_circle_fire_sentence_unknown) : '<b>Opening Fire: Tuesday 29 September, 7:30pm (UK).</b> Further gatherings will find their time as the Circle listens. Between them, the Circle stays open: you are welcome to come in your own time.'}</p>
    ${joinHTML()}
    <label id="oc-kinds-l">What are you bringing?</label>
    <ul class="kinds" aria-labelledby="oc-kinds-l">${KINDS.map((k) => `<li><button type="button" aria-pressed="false">${k}</button></li>`).join('')}</ul>
    <label for="oc-text">Shape your offering</label>
    <textarea id="oc-text" placeholder="A few words, a title, a link, a line of song…"></textarea>
    <p class="honest"><b>An honest note.</b> This is an experimental doorway. Your draft is <b>saved only in this browser</b>; it is not submitted to the Council or S33D.life. Copy it and carry it to the live Fire. You can also open S33D.life and choose where to offer it; these links do not transfer your draft.</p>
    <div class="row">
      <button type="button" class="primary" data-oc="copy">Copy my offering</button>
      <a href="${APP}/council-of-life" target="_blank" rel="noopener">The Council of Life ↗</a>
      <a href="${APP}/map" target="_blank" rel="noopener">Offer to an Ancient Friend ↗</a>
    </div>
    <p class="status" aria-live="polite"></p></div>`;
  const mount = () => { document.body.appendChild(box); restore(); };
  let lastFocus = null;
  const kinds = () => [...box.querySelectorAll('.kinds button')];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ kind: (kinds().find((b) => b.getAttribute('aria-pressed') === 'true') || {}).textContent || '', text: box.querySelector('textarea').value })); } catch (e) {} };
  function restore() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!s) return; box.querySelector('textarea').value = s.text || ''; kinds().forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === s.kind))); } catch (e) {} }
  function open() { lastFocus = document.activeElement; box.hidden = false; box.querySelector('.oc').focus(); }
  function close() { box.hidden = true; save(); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  document.body ? mount() : addEventListener('DOMContentLoaded', mount);
  box.addEventListener('click', async (e) => {
    if (e.target === box || e.target.closest('.x')) return close();
    const k = e.target.closest('.kinds button'); if (k) { kinds().forEach((b) => b.setAttribute('aria-pressed', String(b === k && k.getAttribute('aria-pressed') !== 'true'))); save(); return; }
    if (e.target.closest('[data-oc="copy"]')) { save(); const kind = (kinds().find((b) => b.getAttribute('aria-pressed') === 'true') || {}).textContent, t = box.querySelector('textarea').value.trim();
      const txt = `Circle ${NUM} · The Open Circle\n${Q}\n\n${kind ? kind + ':\n' : ''}${t}`; const st = box.querySelector('.status');
      try { await navigator.clipboard.writeText(txt); st.textContent = 'Copied. Carry it to a live fire, or leave it on S33D.life.'; } catch (err) { st.textContent = 'Could not copy automatically — select the text above and copy it.'; } }
  });
  box.addEventListener('input', save);
  addEventListener('keydown', (e) => { if (!box.hidden && e.key === 'Escape') { e.stopImmediatePropagation(); close(); } }, true);
  addEventListener('click', (e) => { const g = e.target.closest && e.target.closest('[data-go="@opencircle"]'); if (!g) return; e.preventDefault(); e.stopImmediatePropagation(); open(); }, true);

  // ═════════════ ARRIVAL: this is a living, experimental interface (shown once, quietly) ═════════════
  const WKEY = 'tetol-welcome-' + NUM;
  const wcss = document.createElement('style');
  wcss.textContent = `
  #tetol-welcome { position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 45; width: min(460px, calc(100vw - 24px)); background: hsl(30 16% 8% / .92); border: 1px solid hsl(42 45% 45% / .35); border-radius: 14px; padding: 16px 18px 14px; color: var(--ink2); font: 14px/1.45 var(--sans); backdrop-filter: blur(8px); opacity: 0; transition: opacity 1.4s ease; box-shadow: 0 12px 40px #0009; }
  #tetol-welcome.on { opacity: 1; } #tetol-welcome[hidden] { display: none; }
  #tetol-welcome b { display: block; font: 600 17px/1.2 var(--serif); letter-spacing: .05em; color: var(--ink); margin-bottom: 4px; padding-right: 30px; }
  #tetol-welcome p { margin: 0 0 12px; }
  #tetol-welcome .row { display: flex; flex-wrap: wrap; gap: 8px; }
  #tetol-welcome button { font: 600 13px/1 var(--sans); border-radius: 999px; padding: 0 14px; min-height: 40px; cursor: pointer; border: 1px solid hsl(42 40% 45% / .45); background: none; color: var(--ink); }
  #tetol-welcome .primary { background: hsl(42 95% 55%); color: #1b1408; border-color: transparent; }
  #tetol-welcome .x { position: absolute; top: 4px; right: 4px; width: 40px; min-height: 40px; border: 0; font-size: 20px; color: var(--ink3); padding: 0; }
  body.phone #tetol-welcome { bottom: auto; top: calc(64px + env(safe-area-inset-top)); }
  body.roots #tetol-welcome, body.deep #tetol-welcome { display: none; }`;
  document.head.appendChild(wcss);
  const w = document.createElement('div'); w.id = 'tetol-welcome'; w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'Welcome'); w.hidden = true;
  w.innerHTML = `<button type="button" class="x" aria-label="Close">×</button><b>TETOL · The Ethereal Tree of Life</b>
    <p>A living, experimental doorway into S33D. It is still growing: some places are finished, many are doorways, and some open S33D.life in a new tab. <br><br><b style="display:inline;font-size:15px">Circle ${NUM} of the Council of Life is open now.</b> ${Q}</p>
    <div class="row"><button type="button" class="primary" data-w="circle">Enter Circle ${NUM}</button><button type="button" data-w="tree">Explore the Tree</button></div>`;
  const dismiss = () => { w.classList.remove('on'); setTimeout(() => (w.hidden = true), 600); try { localStorage.setItem(WKEY, '1'); } catch (e) {} };
  w.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; dismiss(); if (b.dataset.w === 'circle' && window.TETOL_NAV) { dispatchEvent(new CustomEvent('tetol:begin-thread')); window.TETOL_NAV.run('goTo', 'croom'); } });
  const showWelcome = () => { let seen = new URLSearchParams(location.search).get('welcome') === '0'; try { seen = seen || !!localStorage.getItem(WKEY); } catch (e) {} if (seen) return;
    document.body.appendChild(w); w.hidden = false; setTimeout(() => w.classList.add('on'), 50); };
  addEventListener('load', () => setTimeout(showWelcome, 2600));
  window.TETOL_CIRCLE234 = { open, close, question: Q, companions: companions.map((c) => c.id) };
  window.TETOL_CIRCLE = { open, close, number: NUM, question: Q }; // 0.9.15-dev: the present Circle's Open Circle
})();

;
// S33D · Living Library seeds · PREVIEW DATA for TETOL (0.9.8). NOT the canonical record; NOT public knowledge.
// Source: HQ editorial seed records "Dahlia — Living Library Seed" and "Amaranth — Living Library Seed"
// (Heartwood Library › Living Library Seeds — Companion Knowledge Web, 28 Sep 2026). Private source links are NOT carried here.
//
// CREATE ONCE. RELATE INFINITELY.
//   A seed is the persistent knowledge identity of a being, plant, fungus, book, place or other companion.
//   A Circle never creates a second seed: it APPENDS an appearance (and relationships) to the existing one.
//   S33D_LIBRARY.appear('dahlia', { circle: 235, role: 'Flower companion', node: '…' })  ← how a future Circle joins.
//
// Nothing here makes a factual claim about the species. HQ's rule: every durable claim is sourced before it
// is promoted to public canonical copy. Until then TETOL shows the seed's shape (facets that will grow), its
// Council appearances and its relationships, and says plainly that the library is growing.
// publicRoute stays null until S33D.life has a public Living Library route for seeds; TETOL will then link to it.
window.S33D_LIBRARY = (() => {
  const seeds = {};
  const seed = (id, o) => (seeds[id] = { id, publicRoute: null, appearances: [], relations: [], ...o });
  seed('dahlia', {
    name: 'Dahlia', emoji: '🌺', kind: 'Flower seed',
    scope: 'Dahlia as a genus and cultivated-flower thread, until a specific species or cultivar is named.',
    facets: ['Names & language', 'Ecology & relationships', 'History & movement', 'Lore, symbolism & story', 'Food & practical uses', 'Books, art & culture', 'Encounters', 'Offerings'],
    threads: ['pollinators', 'Mexico / Central America', 'tubers', 'gardens', 'autumn flowering', 'art'],
  });
  seed('amaranth', {
    name: 'Amaranth', emoji: '🌿', kind: 'Plant seed',
    scope: 'Amaranth as a genus and a cultivated food-and-ornamental thread, until a particular species or cultivar is named.',
    facets: ['Names & language', 'Ecology & relationships', 'Food & recipes', 'History & people', 'Lore, symbolism & story', 'Growing, seed & practical use', 'Books, art & culture', 'Encounters', 'Offerings'],
    threads: ['edible leaves / grain species', 'seed', 'food cultures', 'colour', 'resilience', 'gardens'],
  });
  const appear = (id, a) => { const s = seeds[id]; if (!s) return null; if (!s.appearances.some((x) => x.circle === a.circle && x.role === a.role)) s.appearances.push(a); return s; };
  const relate = (id, to, text) => { const s = seeds[id]; if (s && !s.relations.some((r) => r.to === to)) s.relations.push({ to, text }); };
  return { seeds, seed, appear, relate, source: 'HQ editorial seed records, Living Library Seeds — Companion Knowledge Web, 28 Sep 2026 (private; not linked)' };
})();

;
// TETOL 0.9.8 · companion → Living Library doorway [0.9.10 membrane pass: where-you-came-from trail, named return, seed ≠ individual] (first pattern: Dahlia, Amaranth). EXPERIMENT · NOT CANONICAL.
//   Companion at the Council fire → its light Circle 234 card → "Enter the Living Library" → the seed (preview panel:
//   scope, facets that will grow, Council appearances, relationships) → follow a relationship to another seed or companion
//   → "Back to the Circle".
// The weekly Circle does not contain the companion's knowledge; it only records an appearance on the one seed.
(() => {
  const D = window.TETOL, L = window.S33D_LIBRARY; if (!D || !L) return;
  const n = D.nodes;
  // Circle 234 appearances (create once, relate infinitely: the Circle appends, it never creates a second seed)
  const LINKS = [
    { seed: 'dahlia', node: 'c234_dahlia', circle: 234, role: 'Flower companion' },
    { seed: 'amaranth', node: 'c234_amaranth', circle: 234, role: 'Plant companion' },
  ];
  const CIRCLE = ['c234_noku', 'c234_peacock', 'c234_dahlia', 'c234_amaranth', 'c234_porcini', 'c234_hedgehog', 'people'];
  LINKS.forEach((k) => {
    L.appear(k.seed, { circle: k.circle, role: k.role, node: k.node });
    CIRCLE.filter((id) => id !== k.node).forEach((id) => { const other = LINKS.find((x) => x.node === id); L.relate(k.seed, other ? '@seed:' + other.seed : id, other ? 'Its seed' : 'In Circle 234'); });
    const x = n[k.node]; if (!x) return;
    x.seed = k.seed;
    x.actions = [{ label: 'Enter the Living Library', sub: `${L.seeds[k.seed].name} · one seed that keeps growing across Circles`, go: '@seed:' + k.seed }, ...(x.actions || [])];
    (x.lives ||= []).unshift({ text: `Living Library seed: ${L.seeds[k.seed].name}. Circle 234 is one appearance in its longer lineage.`, status: 'PROPOSED' });
  });

  // ── the seed panel (quiet, in the prototype's own type)
  const css = document.createElement('style');
  css.textContent = `
  #seed-panel { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; background: hsl(30 20% 4% / .5); backdrop-filter: blur(3px); font-family: var(--sans); }
  #seed-panel[hidden] { display: none; }
  #seed-panel .sp { position: relative; width: min(540px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); overflow: auto; background: hsl(30 16% 8% / .96); border: 1px solid hsl(42 45% 45% / .35); border-radius: 16px; padding: 22px 22px 22px; color: var(--ink2); box-shadow: 0 20px 60px #000a; }
  #seed-panel .trail { font: 500 12px/1.4 var(--sans); color: var(--ink3); margin: 0 40px 10px 0; } #seed-panel .trail b { color: var(--ink2); font-weight: 600; }
  #seed-panel .kindnote { font-size: 13px; color: var(--ink2); border-left: 2px solid hsl(120 25% 45% / .6); padding: 6px 12px; margin: 0 0 10px; }
  #seed-panel .eyebrow { font: 600 10.5px/1.3 var(--sans); letter-spacing: .16em; text-transform: uppercase; color: var(--ink3); margin: 0 30px 8px 0; }
  #seed-panel h2 { font: 600 26px/1.1 var(--serif); letter-spacing: .05em; color: var(--ink); margin: 0 0 2px; }
  #seed-panel .kind { font: italic 17px/1.3 var(--whisper); color: var(--ink2); margin: 0 0 12px; }
  #seed-panel p { font-size: 14px; line-height: 1.5; margin: 0 0 10px; }
  #seed-panel h3 { font: 600 10.5px/1 var(--sans); letter-spacing: .14em; text-transform: uppercase; color: var(--ink3); margin: 16px 0 8px; }
  #seed-panel ul.facets, #seed-panel ul.rel { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  #seed-panel ul.facets li { font-size: 12.5px; border: 1px dashed hsl(42 30% 40% / .5); border-radius: 999px; padding: 6px 10px; color: var(--ink2); }
  #seed-panel ul.facets li small { color: var(--ink3); margin-left: 4px; }
  #seed-panel ul.rel button { font: 500 12.5px/1 var(--sans); color: var(--ink); background: hsl(42 60% 50% / .08); border: 1px solid hsl(42 45% 45% / .45); border-radius: 999px; padding: 8px 11px; cursor: pointer; min-height: 34px; }
  #seed-panel ul.rel button.seed { border-style: solid; background: hsl(42 90% 55% / .18); }
  #seed-panel .appear { border-left: 2px solid hsl(42 70% 55% / .7); padding: 6px 12px; font-size: 13.5px; }
  #seed-panel .threads { font: italic 14.5px/1.5 var(--whisper); color: var(--ink2); }
  #seed-panel .honest { border-left: 2px solid hsl(42 70% 55% / .7); padding: 8px 12px; background: hsl(42 40% 40% / .08); border-radius: 0 8px 8px 0; font-size: 13px; margin: 16px 0 14px; }
  #seed-panel .row { display: flex; flex-wrap: wrap; gap: 8px; position: sticky; bottom: -22px; margin: 0 -22px -22px; padding: 12px 22px 22px; background: linear-gradient(hsl(30 16% 8% / .0), hsl(30 16% 8% / .97) 14px); } /* 0.9.10: the way back is always in reach */
  #seed-panel .sp { scroll-padding-bottom: 96px; }
  #seed-panel .row button { font: 600 13px/1.2 var(--sans); border-radius: 10px; padding: 11px 14px; cursor: pointer; border: 1px solid hsl(42 40% 45% / .45); color: var(--ink); background: none; min-height: 44px; }
  #seed-panel .row .primary { background: hsl(42 95% 55%); color: #1b1408; border-color: transparent; }
  #seed-panel .x { position: absolute; top: 8px; right: 8px; width: 44px; height: 44px; border: 0; background: none; color: var(--ink2); font-size: 24px; cursor: pointer; }`;
  document.head.appendChild(css);
  const box = document.createElement('div'); box.id = 'seed-panel'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'seed-title');
  const mount = () => document.body.appendChild(box); document.body ? mount() : addEventListener('DOMContentLoaded', mount);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let from = null, lastFocus = null;
  // Where the visitor came from, in the Tree's own words: the membrane never feels like a teleport.
  const circleName = () => (n.c233 && n.c233.name) || 'this Circle';
  const trailOf = (id) => { const x = id && n[id]; if (!x) return ['TETOL'];
    if (x.room === true || id === 'croom') return id === 'croom' ? ['Council of Life', circleName()] : ['Council of Life', circleName(), x.name];
    if (x.room === 'hw') return ['Heartwood', x.name]; return [x.name]; };
  const backLabel = () => { const x = from && n[from]; return x ? (x.room === true && from !== 'croom' ? `← Back to ${x.name} at the fire` : `← Back to ${x.name}`) : '← Back to the Tree'; };

  function render(id) {
    const s = L.seeds[id]; if (!s) return false;
    const rel = s.relations.map((r) => { const seedId = r.to.startsWith('@seed:') ? r.to.slice(6) : null, label = seedId ? L.seeds[seedId].name : (n[r.to] ? n[r.to].name : r.to);
      return `<li><button type="button" class="${seedId ? 'seed' : ''}" data-rel="${esc(r.to)}" aria-label="${esc(label)}, ${esc(seedId ? 'open its Living Library seed' : 'go to it at the Council fire')}">${esc(label)}${seedId ? ' · seed' : ''}</button></li>`; }).join('');
    box.innerHTML = `<div class="sp" tabindex="-1">
      <button type="button" class="x" aria-label="Close and return to the Circle">×</button>
      <p class="trail" aria-label="Where you are">${trailOf(from).map(esc).join(' › ')} › <b>Living Library</b> › ${esc(s.name)}</p>
      <p class="eyebrow">Heartwood · Living Library · seed · preview</p>
      <h2 id="seed-title">${esc(s.emoji)} ${esc(s.name)}</h2><p class="kind">${esc(s.kind)}</p>
      <p>This is the one Living Library seed for ${esc(s.name)}. A Circle is one appearance in its longer lineage: if ${esc(s.name)} returns in another Council, it returns here, and the seed keeps growing.</p>
      <p class="kindnote">A seed holds what is known about ${esc(s.name)} in general. The individual ${esc(s.name.toLowerCase())}s people meet in the world keep their own stories, and will point here.</p>
      <h3>Working scope</h3><p>${esc(s.scope)}</p>
      <h3>What will grow here</h3><ul class="facets">${s.facets.map((f) => `<li>${esc(f)}<small>· growing</small></li>`).join('')}</ul>
      <h3>Council appearances</h3>${s.appearances.map((a) => `<p class="appear"><b>Circle ${a.circle}</b> · ${esc(a.role)}</p>`).join('')}
      <h3>Threads to follow</h3><p class="threads">${esc(s.name)} ↔ ${s.threads.map(esc).join(' ↔ ')}</p><p style="font-size:12.5px;color:var(--ink3)">Named by HQ as threads to follow. Not yet sourced.</p>
      <h3>Relates to</h3><ul class="rel">${rel}</ul>
      <p class="honest"><b>The library is growing.</b> Nothing here is public knowledge yet: every durable claim is sourced before it is added. This is a preview inside TETOL; it will link to the public S33D Living Library when that page exists.</p>
      <div class="row"><button type="button" class="primary" data-a="back">${esc(backLabel())}</button><button type="button" data-a="offer">Bring something for ${esc(s.name)}</button></div></div>`;
    box.dataset.seed = id; return true;
  }
  function open(id) { if (!L.seeds[id]) return; if (box.hidden) { lastFocus = document.activeElement; from = window.TETOL_NAV ? window.TETOL_NAV.where().id : null; } render(id); box.hidden = false; box.querySelector('.sp').focus(); box.querySelector('.sp').scrollTop = 0; }
  function close(ret = true) { box.hidden = true; if (ret && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.closest('.x') || e.target.closest('[data-a="back"]')) { close(); if (e.target.closest('[data-a="back"]') && window.TETOL_NAV && from && n[from]) window.TETOL_NAV.run('goTo', from); return; }
    if (e.target.closest('[data-a="offer"]')) { close(false); window.TETOL_CIRCLE234 && window.TETOL_CIRCLE234.open(); return; }
    const r = e.target.closest('[data-rel]'); if (!r) return; const to = r.dataset.rel;
    if (to.startsWith('@seed:')) { open(to.slice(6)); return; }
    close(false); if (window.TETOL_NAV && n[to]) window.TETOL_NAV.run('goTo', to);
  });
  addEventListener('keydown', (e) => { if (!box.hidden && e.key === 'Escape') { e.stopImmediatePropagation(); close(); } }, true);
  addEventListener('click', (e) => { const g = e.target.closest && e.target.closest('[data-go^="@seed:"]'); if (!g) return; e.preventDefault(); e.stopImmediatePropagation(); open(g.dataset.go.slice(6)); }, true);
  window.TETOL_LIBRARY = { open, close, seeds: L.seeds };
})();

;
// TETOL 0.9.10 · MEMBRANE PASS · test · fix · refine (TEOTAG, 28 Sep 2026). EXPERIMENT · NOT CANONICAL.
// Small, high-confidence fixes found while walking the live Circle 234 build as one system.
// Nothing here builds PLANeTarry, a map, a species store or a backend. Loaded after the Living Library doorway.
(() => {
  const D = window.TETOL; if (!D) return;
  const N = D.nodes;

  // ── 1 · The peek card: the first click on its visible action must DO that action.
  // Found live (real GPU, desktop): on a new place the card arrives as a "peek" showing one action. Pressing that
  // action focused it, focus opened the card, the card grew under the pointer, and the click landed on whatever slid
  // there: nothing, or the "TETOL" breadcrumb, which flew the visitor back to the overview. "Enter the Living Library"
  // and "Climb to the Council deck" were both affected. Now: a press on an action inside a peek card keeps focus
  // where it is (no reflow mid-click), the hover-to-open timer does not start over an action, and the click reaches
  // the action. Pressing anywhere else on the peek still opens the card, as before. Phones have no peek; unaffected.
  const ACT = 'button, a[href], [data-go]';
  const inPeek = (t) => t && t.closest && t.closest('#panel.peek');
  let armed = null;
  addEventListener('pointerdown', (e) => {
    armed = null; const p = inPeek(e.target); if (!p) return; const a = e.target.closest(ACT); if (!a || a.id === 'grab') return;
    armed = a; e.preventDefault(); // no focus change → no focusin → the card does not reflow under the pointer
  }, true);
  addEventListener('click', (e) => {
    const p = inPeek(e.target), a = e.target.closest && e.target.closest(ACT); if (!p || !a || a !== armed) return;
    armed = null; p.classList.remove('peek'); // the Grace "lean in" guard now lets this click through to its action
  }, true);
  addEventListener('pointerover', (e) => { if (inPeek(e.target) && e.target.closest(ACT)) e.stopPropagation(); }, true);

  // ── 2 · Desktop: "Step back out…" sat on top of the TETOL title in every room. Keep it just below the header.
  const placeLeave = () => {
    const lv = document.querySelector('.leave'), hd = document.querySelector('header'); if (!lv || !hd) return;
    if (innerWidth <= 600 || !document.body.classList.contains('xA')) { lv.style.top = ''; return; }
    lv.style.top = Math.round(hd.getBoundingClientRect().bottom + 10) + 'px';
  };
  addEventListener('resize', placeLeave); addEventListener('tetol:place', () => setTimeout(placeLeave, 30));
  new MutationObserver(placeLeave).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  (document.readyState === 'loading' ? addEventListener('DOMContentLoaded', placeLeave) : placeLeave());

  // ── 3 · The arrival thread follows THIS week's being (Ed, 28 Sep): Circle 234 ↔ Noku, the Ubuntu Tree.
  // Noku has no Roots record in TETOL yet, so the thread stays in the canopy: fire → Noku → a companion's seed →
  // the Open Circle. Nothing about Noku is invented. The Circle 233 ↔ Ankerwycke Yew relationship stays where it
  // belongs: in Circle 233's ring beside the Treehouse door, and the Yew remains an Ancient Friend in the Roots.
  if (D.thread) {
    D.thread = { title: 'Circle 234 ↔ Noku, the Ubuntu Tree', steps: [
      { id: 'overview', say: 'Start outside. This week the Council of Life gathers as Circle 234, and its Tree companion is Noku, the Ubuntu Tree.' },
      { id: 'canopy', say: 'The canopy, where the Council gathers. Circle 234 hangs here as a lantern. Step inside.' },
      { id: 'croom', say: 'The Council deck. The Treehouse door names Circle 234 and asks: What would you bring to the Council of Life? Its companions sit around the fire.' },
      { id: 'c234_noku', say: 'Noku, the Ubuntu Tree: this week’s Tree. One particular living fig tree, met in the world, not a page about figs.' },
      { id: 'c234_dahlia', say: 'Dahlia, a flower companion. Its Living Library seed holds what is known about dahlias in general: step in, then come back to the fire.' },
      { id: 'c233rec', say: 'The Open Circle. Between the live fires the Circle stays open: bring something of your own to the Council.' },
      { id: 'overview', say: 'Back outside. One Circle, its companions and what people bring: one living story, still growing.' },
    ] };
  }
  const THREAD_OLD = ' — through canopy, roots, ring and Heartwood', THREAD_NEW = ' — to the Council fire and its companions';
  const fixThreadLine = () => document.querySelectorAll('#startthread span').forEach((sp) => { if (sp.textContent.endsWith(THREAD_OLD)) sp.textContent = sp.textContent.slice(0, -THREAD_OLD.length) + THREAD_NEW; });
  new MutationObserver(fixThreadLine).observe(document.documentElement, { childList: true, subtree: true });
  if (N.ring && N.ring.lives) N.ring.lives = N.ring.lives.map((l) => /Circle 233 traces — empty until the Circle gathers/.test(l.text || '') ? { ...l, text: 'Circle 233 traces — not yet harvested' } : l);

  // ── 4 · Noku is one individual living tree, not a species page (ENCOUNTER BEFORE ABSTRACTION).
  // "Fig" is HQ's statement (Membrane brief, 28 Sep). No Fig seed exists yet and none is invented here.
  if (N.c234_noku) Object.assign(N.c234_noku, {
    practical: 'Tree companion of Circle 234 · one individual, living tree.',
    purpose: 'Noku is one particular fig tree, met in the world: a being with its own place and story, not a page about figs. What is known about figs in general will live in its own Living Library seed, and Noku will be one of the trees that seed points to. Noku’s real-source record is still to be linked; nothing about it is invented here.',
  });
  // Knowledge seeds say what they are too, so the difference can be felt from both sides.
  ['c234_dahlia', 'c234_amaranth'].forEach((id) => { const n = N[id]; if (n) n.purpose = `Named as a companion of Circle 234. Its Living Library seed holds what is known about ${n.name} in general; the Circle is one appearance in that longer story.`; });

  // ── 5 · Phone: the Living Library doorway must be visible when the sheet rises to half height.
  // Found: on a 390–400px phone the "Enter the Living Library" action sat at the very bottom of the half sheet,
  // under the "Made with Claude Design" badge (Dahlia) or below the fold. For companions that carry a seed, the
  // doorway now follows the name directly. Other places keep their order.
  const css = document.createElement('style');
  css.textContent = 'body.xD.phone aside#panel.has-seed .pbody > .actions { order: -1; margin-top: 10px; }';
  document.head.appendChild(css);
  const markSeed = () => { const p = document.getElementById('panel'), id = window.TETOL_NAV && window.TETOL_NAV.where().id; if (p) p.classList.toggle('has-seed', !!(id && N[id] && N[id].seed)); };
  addEventListener('tetol:place', () => setTimeout(markSeed, 0));
  setInterval(markSeed, 700); // cheap and certain: the panel is re-rendered by several layers

  // ── 6 · Public link hygiene: nothing a visitor can press leads into a private Notion permission screen.
  // Release pass (HQ, 28 Sep): hide rather than replace. Every Notion action/link is removed from the public cards;
  // the S33D.life doorways and TETOL's own places remain. Inventory: TEOTAG-Circle-234-Release_2026-09-28.md.
  const PRIVATE = /(^|\/\/)([a-z0-9-]+\.)?notion\.(so|com|site)\//i;
  const isPrivate = (u) => typeof u === 'string' && PRIVATE.test(u);
  window.TETOL_HIDDEN_PRIVATE = [];
  for (const [id, n] of Object.entries(N)) {
    if (Array.isArray(n.actions)) { const keep = n.actions.filter((a) => !isPrivate(a.href) && !isPrivate(a.url)); if (keep.length !== n.actions.length) { window.TETOL_HIDDEN_PRIVATE.push([id, n.actions.length - keep.length]); n.actions = keep; } }
    if (Array.isArray(n.lives)) n.lives = n.lives.map((l) => isPrivate(l.href) ? { ...l, href: undefined } : l);
  }
  // People is a Circle 234 companion: its only action was the private Circle record. Give it the Circle's own doorway.
  if (N.people && !(N.people.actions || []).length) N.people.actions = [{ label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' }];
  // Belt and braces for anything rendered later (interiors, lists, other layers): hide any private link that appears.
  const sweep = () => document.querySelectorAll('a[href]').forEach((a) => { if (isPrivate(a.getAttribute('href')) && !a.hidden) { const box = a.closest('.act') || a; box.hidden = true; box.style.display = 'none'; } });
  new MutationObserver(sweep).observe(document.documentElement, { childList: true, subtree: true });
  sweep();

  // ── 7 · The invitation opens the Circle: the welcome says what a newcomer can do, and when the fire is.
  const PR = D.councilPresent && D.councilPresent.advanced ? D.councilPresent : null; // 0.9.15-dev: present Circle from its manifest
  const welcomeLine = () => { if (PR) return PR.t(PR.fireText() ? PR.surf().welcome_fire_known : PR.surf().welcome_fire_unknown);
    const c = D.circle233 || {}; return c.start ? 'Meet this week’s companions, explore, and bring something to the Council. <b style="display:inline;font-size:14px">Opening Fire: Tuesday 29 September, 19:30 UK.</b>'
    : 'Meet this week’s companions, explore, and bring something to the Council. The Circle stays open between fires; the next live fire will be named here.'; };
  const patchWelcome = () => { const w = document.getElementById('tetol-welcome'); if (!w || w.dataset.m) return; const p = w.querySelector('p'); if (!p) return;
    w.dataset.m = '1'; const x = document.createElement('p'); x.className = 'wfire'; x.innerHTML = welcomeLine(); p.after(x); };
  new MutationObserver(patchWelcome).observe(document.documentElement, { childList: true, subtree: true });

  // ── 8 · Noku is present; the Ankerwycke Yew is remembered (Ed, 28 Sep). The root that runs from the Council down to
  // the Yew visually named the Yew as the Council's tree. It now shows only while Circle 233 is being remembered
  // (its ring beside the Treehouse door, or the Yew × Circle 233 relationship / the Yew itself is in view).
  // The Yew, its rings and its Circle 233 record are untouched.
  let yewRootObj = null;
  const yewRootTick = () => { const st = document.querySelector('three-d-stage'); if (!st || !st._scene) return;
    if (!yewRootObj) st._scene.traverse((o) => { if (o.name === 'root_to_ankerwycke_yew') yewRootObj = o; }); if (!yewRootObj) return;
    const here = window.TETOL_NAV ? window.TETOL_NAV.where().id : '';
    yewRootObj.visible = D.council && D.council.inView ? D.council.inView(233, here) // 0.9.15-dev: bound to Circle 233 itself, not to a slot
      : (D.council && D.council.active === 232) || here === 'yewc233' || here === 'yew' || here === 'c232'; };
  setInterval(yewRootTick, 300);
})();

;
// TETOL 0.9.11 · Noku / Ubuntu living thread (TEOTAG, 28 Sep 2026). Content/linking correction only. EXPERIMENT · NOT CANONICAL.
// Noku is present; Ankerwycke is remembered. TETOL provides the grammar; Noku provides the truth.
//
// SOURCES (read, not copied wholesale):
//   · S33D.life live record  /tree/59eb1fe8-3c29-4696-ae00-f42edeb1c886  "Nokuphila" (public; the canonical place record)
//   · Notion "Nokuphila — Ubuntu Tree · S33D Pod Working Page" (23–24 Sep, PROPOSAL; private → not linked)
//   · Notion "Nokuphila The Ubunutu Tree" · Living Tree Ledger 144 (private → not linked)
//   · Nokuphila Twin 0.1a and Ubuntu Pod Twin 0.1 (Claude Design / artifacts; consent still pending → not linked publicly)
// HELD BACK ON PURPOSE (source-attributed or consent-pending): guardians' names, ~400 years, Camissa, species epithet,
// naming lineage, testimony, ceremony, photographs. Nothing about Noku is invented here.
(() => {
  const D = window.TETOL; if (!D) return;
  const N = D.nodes, n = N.c234_noku; if (!n) return;
  const APP = 'https://www.s33d.life', TREE = '59eb1fe8-3c29-4696-ae00-f42edeb1c886';

  // ── Noku's own card: one particular living fig tree, with her real record first
  Object.assign(n, {
    sub: 'the Ubuntu Tree · Circle 234',
    practical: 'Tree companion of Circle 234 · one living being, many relationships.',
    purpose: 'Noku — Nokuphila, the Ubuntu Tree — is one particular living fig tree in Cape Town, South Africa, met in the world and tended by her guardians. She is not a page about figs: her own record on S33D.life holds her place, and her relationships gather here.',
  });
  n.actions = [
    { label: 'Her record on S33D.life', sub: 'Nokuphila · her place in the living world', href: `${APP}/tree/${TREE}` },
    { label: 'Find her on the map', sub: 'S33D.life map · Cape Town', href: `${APP}/map?tree=${TREE}` },
    ...(n.actions || []).filter((a) => a.go === '@opencircle'),
  ];

  // ── One living being · many relationships (rendered in her card; truthful statuses, no invented links)
  const ROWS = [
    { k: 'Place · living world', v: 'Cape Town, South Africa. Her S33D.life record and map are the links above.', st: 'LIVE' },
    { k: 'Circle 234', v: 'Tree companion of the current Council of Life.', go: 'croom', st: 'LIVE' },
    { k: 'Noku / Nokuphila Twin', v: 'A real-source study: approach → beneath → clearing, built only from real photographs and attributed sources. It opens here once her guardians have agreed how she is shown.', st: 'PROPOSED' },
    { k: 'Ubuntu Pod', v: 'Noku is the Tree · the room is the threshold · the garden is the curriculum · Ubuntu is the relationship · the people are the Council. An emerging local expression being explored with her guardians — not a template or franchise. The room has not yet been photographed.', st: 'PROPOSED' },
    { k: 'Living Library', v: 'A Fig S33D knowledge seed is not yet planted. When it is, it will hold what is known about figs in general and point to Noku; Noku stays herself.', st: 'PROPOSED' },
    { k: 'Heartwood · memory', v: 'Where her encounters, Council appearances, stories and relationships gather over time.', go: 'trunk', st: 'PROPOSED' },
  ];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = document.createElement('style');
  css.textContent = `
  #panel .noku-rel { margin-top: 18px; }
  #panel .noku-rel h4 { margin-bottom: 8px; }
  #panel .noku-rel .nr { display: block; width: 100%; text-align: left; border: 1px solid var(--line); border-radius: 10px; padding: 9px 12px; margin: 0 0 6px; background: none; color: var(--ink2); font: 13px/1.45 var(--sans); }
  #panel .noku-rel button.nr { cursor: pointer; } #panel .noku-rel button.nr:hover { border-color: var(--gold); }
  #panel .noku-rel .nr b { display: block; font: 600 11px/1.3 var(--sans); letter-spacing: .12em; text-transform: uppercase; color: var(--ink); margin-bottom: 2px; }
  #panel .noku-rel .nr i { font-style: normal; font-size: 10.5px; letter-spacing: .08em; color: var(--ink3); margin-left: 6px; text-transform: uppercase; }`;
  document.head.appendChild(css);
  const html = `<div class="sec noku-rel"><h4>One living being · many relationships</h4>${ROWS.map((r) => {
    const inner = `<b>${esc(r.k)}<i>${r.st === 'LIVE' ? 'live' : 'growing'}</i></b>${esc(r.v)}`;
    return r.go ? `<button type="button" class="nr" data-go="${r.go}">${inner}</button>` : `<div class="nr">${inner}</div>`; }).join('')}</div>`;
  const place = () => { if (!window.TETOL_NAV || window.TETOL_NAV.where().id !== 'c234_noku') return;
    const pb = document.querySelector('#panel .pbody'); if (!pb || pb.querySelector('.noku-rel')) return;
    const after = pb.querySelector('.actions') || pb.querySelector('.ppurpose'); if (!after) return;
    after.insertAdjacentHTML('afterend', html); };
  new MutationObserver(place).observe(document.documentElement, { childList: true, subtree: true });

  // ── Roots / Ancient Friends: Noku leads for Circle 234; Ankerwycke stays whole, as Circle 233's remembered Tree
  const lead = (node, rel, life) => { const x = N[node]; if (!x) return;
    if (rel && !(x.relations || []).some((r) => r.to === 'c234_noku')) x.relations = [rel, ...(x.relations || [])];
    if (life && !(x.lives || []).some((l) => l.to === 'c234_noku')) x.lives = [life, ...(x.lives || [])]; };
  lead('roots', { to: 'c234_noku', text: 'Noku — Nokuphila, the Ubuntu Tree · Tree companion of Circle 234, the current Council' },
    { text: 'Noku — Nokuphila, the Ubuntu Tree · Cape Town · Tree companion of Circle 234', status: 'LIVE', to: 'c234_noku' });
  lead('h_friends', { to: 'c234_noku', text: 'This Circle’s Tree: Noku — Nokuphila, the Ubuntu Tree' });
  lead('outside', { to: 'c234_noku', text: 'A Friend on the land in Cape Town: Noku — Nokuphila, the Ubuntu Tree' });
  // The Yew's lines are kept, only placed in time (nothing removed or rewritten about the Yew itself).
  const past = (node) => { const x = N[node]; if (!x) return;
    x.relations = (x.relations || []).map((r) => r.to === 'yew' && !/Circle 233/.test(r.text) ? { ...r, text: r.text + ' · Tree companion of Circle 233' } : r);
    x.relations = (x.relations || []).map((r) => r.to === 'yew' ? { ...r, text: r.text.replace(/now in relationship with Circle 233/, 'in relationship with Circle 233 (remembered)') } : r); };
  ['roots', 'h_friends', 'outside'].forEach(past);
  if (N.roots && N.roots.lives) N.roots.lives = N.roots.lives.map((l) => /^Ankerwycke Yew — Magna Carta witness/.test(l.text || '') ? { ...l, text: l.text + ' · Tree of Circle 233' } : l);
})();

;
// TETOL 0.9.12-dev · Council Deck + Treehouse · test → fix → refine (TEOTAG, 28 Sep 2026). DEV LINE · NOT PUBLISHED.
// Built on the frozen 0.9.11 (public v10), which is untouched. Only reproducible, low-risk, clearly detrimental issues.
(() => {
  const D = window.TETOL; if (!D) return;
  const N = D.nodes;

  // ── 1 · No accidental exit from a room.
  // Found (desktop 1280×800 and phone 390×844): on the Council deck about a third of the screen is sky, foliage or
  // background. A tap there, including a slightly sloppy tap beside a companion, ran go('overview') and flew the
  // visitor out of the Treehouse to the whole Tree. Inside a room (Council deck, Heartwood hall) a tap on nothing now
  // does nothing. Leaving stays deliberate: "↩ Step back out", the breadcrumb, Back, Home. On the open Tree the
  // original behaviour (tap on empty sky → overview) is kept.
  let down = null, releasing = false;
  // the canvas lives inside <three-d-stage> (shadow DOM): read the real target from the composed path
  const canvasOf = (e) => { const t = e.composedPath ? e.composedPath()[0] : e.target; return t && t.tagName === 'CANVAS' && document.querySelector('three-d-stage') && (t.getRootNode().host || t.closest('three-d-stage')) ? t : null; };
  const hitsNode = (e, cv) => { const T = window.__tetol, st = document.querySelector('three-d-stage'); if (!T || !st || !st._scene) return true;
    const r = cv.getBoundingClientRect(), THREE = T.THREE, ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), T.cam);
    const picks = []; st._scene.traverse((o) => { if (o.isMesh && o.userData && o.userData.node) picks.push(o); });
    const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    return ray.intersectObjects(picks, false).some((x) => shown(x.object)); };
  addEventListener('pointerdown', (e) => { down = canvasOf(e) ? [e.clientX, e.clientY] : null; }, true);
  addEventListener('pointerup', (e) => { if (releasing) return;
    const cv = canvasOf(e); if (!down || !cv || !document.body.classList.contains('inroom')) { down = null; return; }
    const tap = Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6; down = null;
    if (tap && !hitsNode(e, cv)) { e.stopPropagation(); window.__tetolMissKept = (window.__tetolMissKept || 0) + 1;
      // Let the orbit controls (and the Tree's own handler) still see the pointer lift — shifted 20 px so the Tree reads it
      // as the end of a drag, not a tap on empty space. Without this the controls stay "held" and the next move spins the view.
      releasing = true; try { cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true, cancelable: true, pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: e.isPrimary, button: e.button, buttons: 0, clientX: e.clientX + 20, clientY: e.clientY })); } finally { releasing = false; } }
  }, true);

  // ── 2 · Circle 234's time line said "Gathering · Not yet held · no date confirmed" while every other surface names
  // the Opening Fire. The named date is shown instead. No other date is invented; "held" is still never claimed.
  const FIRE = 'Opening Fire named · Tue 29 Sep, 19:30 UK';
  const fixTime = () => { if (!(D.circle233 && D.circle233.start)) return;
    document.querySelectorAll('section.tquiet .when, .tquiet .when').forEach((w) => { if (w.textContent === 'Not yet held · no date confirmed') w.textContent = FIRE; }); };

  // ── 3 · "Who is gathered here?" The seven presences at the fire were listed only inside the closed
  // "More about this place" disclosure, and at arrival the phone view shows none of them. The deck card now
  // carries one quiet row of the gathered, each a doorway. Same data (croom.lives), no new content.
  const css = document.createElement('style');
  css.textContent = `
  #panel .gathered { margin-top: 14px; } #panel .gathered h4 { margin-bottom: 6px; }
  #panel .gathered .gw { display: flex; flex-wrap: wrap; gap: 6px; }
  #panel .gathered button { border: 1px solid var(--line); border-radius: 999px; background: none; color: var(--ink2); padding: 6px 11px; min-height: 34px; font: 12.5px/1.2 var(--sans); cursor: pointer; }
  #panel .gathered button:hover, #panel .gathered button:focus-visible { border-color: var(--gold); color: var(--ink); }
  #panel .gathered button i { font-style: normal; color: var(--ink3); margin-right: 5px; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; }`;
  document.head.appendChild(css);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const gathered = () => { const L = ((N.croom && N.croom.lives) || []).filter((l) => l.to && N[l.to]); if (!L.length) return '';
    return `<div class="sec gathered"><h4>Gathered at this fire</h4><div class="gw">${L.map((l) => { const n = N[l.to], kind = (l.text.split(' · ')[0] || '').trim();
      return `<button type="button" data-go="${l.to}">${kind && kind !== n.name && l.to !== 'people' ? `<i>${esc(kind)}</i>` : ''}${esc(l.to === 'people' ? 'People' : n.name)}</button>`; }).join('')}</div></div>`; };
  const placeGathered = () => { if (!window.TETOL_NAV || window.TETOL_NAV.where().id !== 'croom') return;
    const pb = document.querySelector('#panel .pbody'); if (!pb || pb.querySelector('.gathered')) return;
    const after = pb.querySelector('.actions') || pb.querySelector('.ppurpose'); if (!after) return;
    after.insertAdjacentHTML('afterend', gathered()); };

  // ── 4 · Phone: an open card must not become untouchable while it is being read.
  // Found: Grace "stillness" fades the interface after 12 s without input and sets pointer-events:none on the panel.
  // On a phone, reading a sheet IS 12 s without input, so the first tap on "Bring something" (or any action) fell
  // through to the world. The card now only dims on phones and stays touchable; the first tap wakes it AND acts.
  // Desktop is unchanged (hovering the card already counts as reading).
  { const st = document.createElement('style');
    st.textContent = 'body.xD.phone.grace-p.g-still:not(.g-reading) aside#panel { opacity: .55 !important; pointer-events: auto !important; }';
    document.head.appendChild(st); }

  new MutationObserver(() => { fixTime(); placeGathered(); }).observe(document.documentElement, { childList: true, subtree: true });
})();

;
// TETOL 0.9.12-dev · Council prototype #1 · A PLACE FOR YOU (TEOTAG, 28 Sep 2026). DEV LINE · NOT PUBLISHED.
// The seat the visitor arrives behind becomes an available place in the Circle: a little more warmth, a kept cushion,
// a pool of firelight on the boards. No avatar, no presence system, no storage, no new offering type.
// Touching it reveals "A PLACE FOR YOU · What would you bring to the Council of Life?" and routes into the existing
// Open Circle (@opencircle). The camera does not move, so the fire and the Circle stay in view; everything is reversible.
// Also: the smallest arrival-camera adjustment (a step back and up from the same seat line) so fire + your seat +
// some gathered companions are perceivable at once. Loaded before the scene script: it uses the 0.9.5 ext.build hook.
(() => {
  const D = window.TETOL; if (!D) return;
  const N = D.nodes; if (!N.croom) return;
  const SEAT = 'council_seat_1'; // the seat directly between the arrival view and the fire (angle π/10, r 1.45)
  const Q = N.croom.question || 'What would you bring to the Council of Life?';

  // ── The place, as a node. room:true keeps it on the deck; no view is defined, so touching it never moves the camera.
  N.seat_you = { ...N.people, id: 'seat_you', room: true, name: 'A place for you', labelName: 'A place for you', sub: Q,
    part: 'At the Council fire · Circle 234', scale: 'place', question: undefined, seed: undefined,
    practical: 'A seat at the fire, kept open for you.',
    purpose: 'Sit a while. Look at the fire and at who is gathered. Then, if something comes, bring it to the Council: a thought, a song, a question, an encounter with a tree.',
    status: 'LIVE', statusNote: 'Open for anyone who arrives. Nothing is recorded by sitting here.',
    actions: [{ label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' }],
    relations: [{ to: 'croom', dim: 'place', text: 'Back to the fire' }, { to: 'c234_noku', dim: 'web', text: 'This Circle’s Tree: Noku — the Ubuntu Tree' }, { to: 'people', dim: 'web', text: 'The others who gather' }],
    lives: [], notes: [], location: 'The Council deck, in the canopy.' };
  N.croom.relations = [{ to: 'seat_you', dim: 'place', text: 'A place for you, at the fire' }, ...(N.croom.relations || []).filter((r) => r.to !== 'seat_you')];

  // ── Scene: warmth + a kept cushion + a light pool on the boards. Built inside the Council room group.
  const ext = (D.ext ||= { anchors: {}, views: {} });
  const prev = ext.build;
  let seatMesh = null, seatMat = null, pool = null, cushion = null, room = null, W = null;
  ext.build = (phase, c) => {
    if (prev) prev(phase, c);
    if (phase !== 'council') return;
    const { THREE } = c; room = c.room; W = c.W;
    // arrival: same seat line, a step back and up (desktop / landscape); the portrait view is read by fitView
    c.roomViews.croom = [W(0.45, 0.75, -0.4), W(0.9, 1.55, 3.6)];
    ext.portraitCroom = [W(-0.2, 0.46, -0.64), W(0.45, 2.3, 4.7)]; // seat stays above the raised phone sheet
    room.traverse((o) => { if (o.name === SEAT) seatMesh = o; }); if (!seatMesh) return;
    seatMat = seatMesh.material.clone(); seatMat.name = 'council_seat_yours'; seatMat.emissive = new THREE.Color(0xffa24a); seatMat.emissiveIntensity = 0.42; seatMesh.material = seatMat;
    seatMesh.userData.node = 'seat_you';
    const p = seatMesh.position;
    cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.035, 20), new THREE.MeshStandardMaterial({ name: 'council_seat_yours_cushion', color: 0xb89a5a, roughness: 1, emissive: 0x3a2408, emissiveIntensity: 0.4 }));
    cushion.name = 'council_seat_yours_cushion'; cushion.position.set(p.x, p.y + 0.125, p.z); cushion.userData.node = 'seat_you'; room.add(cushion);
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,190,110,.55)'); gr.addColorStop(0.55, 'rgba(255,150,60,.18)'); gr.addColorStop(1, 'rgba(255,140,50,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    pool = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ name: 'council_seat_yours_pool', map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    pool.name = 'council_seat_yours_pool'; pool.rotation.x = -Math.PI / 2; pool.position.set(p.x, 0.012, p.z); room.add(pool);
  };

  // ── Breathing warmth; brighter when looked at / hovered / chosen. Static under reduced motion.
  let hot = 0, want = 0, t0 = performance.now(), last = t0;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const here = () => (window.TETOL_NAV ? window.TETOL_NAV.where().id : '');
  const tick = () => { requestAnimationFrame(tick); if (!seatMat || !room || !room.parent || !isVisible(room)) return;
    const now = performance.now(), dt = Math.min(0.25, (now - last) / 1000); last = now;
    want = here() === 'seat_you' ? 1 : hover ? 0.7 : 0; hot += (want - hot) * Math.min(1, dt * 4); // time-based: same feel on slow GPUs
    const b = reduced() ? 0 : Math.sin((performance.now() - t0) / 1400) * 0.06;
    seatMat.emissiveIntensity = 0.42 + b + hot * 0.4; pool.material.opacity = 0.7 + b + hot * 0.3; };
  const isVisible = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  requestAnimationFrame(tick);
  let hover = false;
  addEventListener('pointermove', (e) => { const T = window.__tetol, st = document.querySelector('three-d-stage'); if (!T || !st || !seatMesh || e.buttons) return;
    const t = e.composedPath ? e.composedPath()[0] : e.target; if (!t || t.tagName !== 'CANVAS') { hover = false; return; }
    const r = t.getBoundingClientRect(), ray = new T.THREE.Raycaster(); ray.setFromCamera(new T.THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), T.cam);
    hover = isVisible(seatMesh) && ray.intersectObjects([seatMesh, cushion], false).length > 0; t.style.cursor = hover ? 'pointer' : t.style.cursor; }, { passive: true });

  // ── The card reads as a place, not a form: name in small capitals, the question as its line.
  const css = document.createElement('style');
  css.textContent = `#panel.seat-you .pname { text-transform: uppercase; letter-spacing: .14em; font-size: 20px; }
  #panel.seat-you .psub { font-family: var(--whisper); font-style: italic; font-size: 18px; color: var(--ink); }
  body.xD.phone #panel.seat-you .psub { font-size: 16px; }
  /* phone: the resting sheet carries the place, its question and the one way in; the fire and the seat stay above it */
  body.xD.phone:not([data-sheet="mid"]):not([data-sheet="full"]) aside#panel.seat-you { height: calc(154px + env(safe-area-inset-bottom)); }
  body.xD.phone #panel.seat-you .pbody > .actions { order: -1; margin-top: 8px; visibility: visible; }
  body.xD.phone:not([data-sheet="mid"]):not([data-sheet="full"]) #panel.seat-you .pbody > .actions > :not(:first-child) { display: none; }
  body.xD.phone:not([data-sheet="mid"]):not([data-sheet="full"]) #panel.seat-you .actions .act small { display: none; }
  body.xD.phone:not([data-sheet="mid"]):not([data-sheet="full"]) #panel.seat-you .actions .act { min-height: 44px; padding-top: 10px; padding-bottom: 10px; }
  body.xD.phone #panel.seat-you .pname { font-size: 19px; }
  body.xD.phone #panel.seat-you .psub { line-height: 1.3; }`;
  document.head.appendChild(css);
  const mark = () => { const p = document.getElementById('panel'); if (p) p.classList.toggle('seat-you', here() === 'seat_you'); };
  addEventListener('tetol:place', () => setTimeout(mark, 0)); new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true });
  window.__tetolSeat = { get mesh() { return seatMesh; }, get hot() { return hot; }, get hover() { return hover; } };
})();

;
// TETOL 0.9.12-dr · deep refinement (TEOTAG, 28–29 Sep 2026). DEV LINE · NOT PUBLISHED.
// Small, reproducible, tested corrections found by walking every reachable place (69 nodes × desktop / phone / narrow).
// Nothing canonical is rewritten; each item names what it found and what it changes. Loaded before the scene script.
(() => {
  const D = window.TETOL; if (!D) return;
  const N = D.nodes;
  const ext = (D.ext ||= { anchors: {}, views: {} });
  const here = () => (window.TETOL_NAV ? window.TETOL_NAV.where().id : '');

  // ── R1 · "A place for you" and the live fire, reached from anywhere, land on the deck facing the fire.
  // Found: the seat has no camera view on purpose (touching it from the deck must not move the world). But reached from
  // elsewhere (a link, the List view, Back) the camera stayed wherever it was — outside the Treehouse, looking at the Tree —
  // and with reduced motion the crossing threw (setCam read an undefined view: '[bundle] Uncaught TypeError … reading 0').
  // Now: only when the camera is NOT already on the deck, the seat borrows the deck's arrival view.
  let navPrev = null, navCur = null; addEventListener('tetol:place', () => { const w = here(); if (w !== navCur) { navPrev = navCur; navCur = w; } });
  const prevBuild = ext.build;
  ext.build = (phase, c) => {
    if (prevBuild) prevBuild(phase, c);
    if (phase !== 'tree' || !c.views) return;
    const views = c.views, T = () => window.__tetol;
    ['seat_you', 'live_fire'].forEach((pid) => Object.defineProperty(views, pid, { configurable: true, enumerable: false, get() {
      const t = T(); if (!t || !views.croom) return undefined;
      const from = navCur === pid ? navPrev : navCur; // the place the visitor is coming from
      const onDeck = !!(from && N[from] && N[from].room === true) && document.body.classList.contains('inroom') && !document.body.classList.contains('inhw');
      if (onDeck) return undefined; // stay exactly where the visitor is
      const a = t.cam.aspect; if (a >= 0.72 || !ext.portraitCroom) return views.croom;
      // portrait: fitView scales non-deck views outward by k; pre-shrink so the result is the deck's portrait arrival
      const k = Math.min(1.55, Math.pow(0.72 / a, 0.75)), [p0, p1] = ext.portraitCroom;
      return [p0.clone(), p0.clone().add(p1.clone().sub(p0).multiplyScalar(1 / k))];
    } }));
  };

  // ── R2 · The Crown still said it was listening to Circle 233.
  // Found: "Crown listening · Circle 233 · Nothing has risen from Circle 233." The Circle it listens to (node c233) is
  // now Circle 234 (renamed in 0.9.8); the text was inherited. It now names the Circle that is actually open.
  // Circle 233's own record, ring and lineage are untouched.
  const cur = () => (N.c233 && /Circle \d+/.exec(N.c233.name || '') || ['Circle 234'])[0];
  if (N.signal) { const c = cur();
    if (/Circle 233/.test(N.signal.sub || '')) N.signal.sub = (N.signal.sub || '').replace(/Circle 233/g, c);
    if (/Circle 233/.test(N.signal.practical || '')) N.signal.practical = `Nothing has risen from ${c} yet. It may never need to.`;
    N.signal.lives = (N.signal.lives || []).map((l) => ({ ...l, text: (l.text || '').replace(/Circle 233/g, c) })); }
  ['crown', 'canopy', 'c233'].forEach((id) => { const n = N[id]; if (!n) return;
    n.lives = (n.lives || []).map((l) => l.to === 'signal' ? { ...l, text: l.text.replace(/Circle 233/g, cur()) } : l);
    n.relations = (n.relations || []).map((r) => r.to === 'signal' ? { ...r, text: r.text.replace(/Circle 233/g, cur()) } : r); });

  // ── R3 · The Equinox threshold line belongs to Circle 233 (The Equinox Threshold), like the Yew's root.
  // Found: a 4.3 m gold bar across the deck, read in every companion view and at arrival as a stray strip of tape.
  // It now shows while Circle 233 is being remembered (its ring, the Yew × 233 relationship, the Yew), as the root does.
  let eq = null;
  setInterval(() => { const st = document.querySelector('three-d-stage'); if (!st || !st._scene) return;
    if (!eq) st._scene.traverse((o) => { if (o.name === 'equinox_threshold_line') eq = o; }); if (!eq) return;
    const w = here(); eq.visible = D.council && D.council.inView ? D.council.inView(233, w, (x) => /^c232_/.test(x)) // 0.9.15-dev: bound to Circle 233 itself, not to a slot
      : (D.council && D.council.active === 232) || ['c232', 'yewc233', 'yew'].includes(w) || /^c232_/.test(w); }, 400);

  // ── S1 · Stitch: the arrival card offers the living world, not only the Tree.
  // Found (journeys): "Outside World → Roots" could not start from the arrival card; The Outside World was reachable only
  // from Roots or by finding its stone path. The circulation begins in the living world, so the arrival card now offers it.
  if (N.overview && N.outside && !(N.overview.relations || []).some((r) => r.to === 'outside'))
    N.overview.relations = [...(N.overview.relations || []), { to: 'outside', dim: 'place', text: 'Or out onto the land: the living world around the Tree' }];
  // ── S2 · Stitch: the Crown card names its ripening seeds (Dream Seeds). They were reachable only by their floating label.
  if (N.crown && N.crown_seeds && !(N.crown.relations || []).some((r) => r.to === 'crown_seeds'))
    N.crown.relations = [{ to: 'crown_seeds', dim: 'place', text: 'Ripening ideas, among the highest leaves' }, ...(N.crown.relations || [])];

  // (P1 · a shader warm-up for the Deeper Rings was tried and removed: measured no gain — the ~0.85 s first-descent
  //  stall in software GL is buffer/texture upload + light-set change, not program compile. See the return.)

  // ── R7 · Accessibility: the 3D view had no accessible name or role. It now says what it is and where you are; the
  // card, the List view and the "Gathered at this fire" row remain the keyboard routes into every place.
  const nameStage = () => { const st = document.querySelector('three-d-stage'); if (!st) return; const w = window.TETOL_NAV && window.TETOL_NAV.where();
    st.setAttribute('role', 'img'); st.setAttribute('aria-label', `The Tree of Life in 3D${w && w.label ? ' · ' + w.label : ''}. Use the card or the List view to move between places.`); };
  addEventListener('tetol:place', () => setTimeout(nameStage, 0)); setTimeout(nameStage, 2500);

  // ── R4 · Phone: small rows in the card become thumb-sized.
  // Found (390 × 844, 360 × 640): "What lives here" and "Paths from here" rows were 20–23 px tall.
  const css = document.createElement('style');
  css.textContent = `
  body.xD.phone #panel ul.lives li > span > button, body.xD.phone #panel ul.lives li > span > a { min-height: 40px; display: inline-flex; align-items: center; text-align: left; padding: 6px 0; }
  body.xD.phone #panel .nav button { min-height: 44px; }
  /* R5 · Phone: the "Made with Claude Design" badge sat on the sheet's subtitle on every place. Kept, lifted above the sheet. */
  body.xD.phone #__claude_design_branding { bottom: calc(var(--sheet-h) + 10px + env(safe-area-inset-bottom)); right: 10px; transition: bottom 460ms var(--ease-root); }
  body.xD.phone:has(aside#panel:is(.seat-you, .live-fire)):not([data-sheet="mid"]):not([data-sheet="full"]) #__claude_design_branding { bottom: calc(164px + env(safe-area-inset-bottom)); }
  /* R6 · Phone: the sheet's grab handle was a 28 px target. Same bar, a 44 px touch area. */
  body.xD.phone #grab { position: relative; } body.xD.phone #grab::after { content: ''; position: absolute; left: 0; right: 0; top: 0; bottom: -16px; }`;
  document.head.appendChild(css);
})();

;
// TETOL 0.9.14-dev · COUNCIL MANIFEST (TEOTAG, 29–30 Sep 2026). DEV LINE · NOT PUBLISHED. No URL test switches in this file.
// One data contract for the Council of Life as a place that holds many Circles.
//   Stable place  →  current Circle (manifest)  →  live fire(s)  →  Open Circle  →  Heartwood memory
// Circles are keyed by their REAL number. An adapter maps them onto the scene's existing slots, which still carry their
// historical names (the living slot is internally "233", the remembered slot "232", the older ring "mem231").
// Nothing here stores offerings, reads accounts or invents content. States a human must decide (a fire held, a Circle
// harvested) are set here, by hand, and published — never inferred from the clock.
(() => {
  const D = window.TETOL; if (!D) return;

  // 0.9.15-dev: the manifest is BUILT from the Circle manifests (window.S33D_COUNCIL, layer 245) — the same files that
  // drive the Council PDF, the invitation and the facilitator sheet. The 0.9.14-dev literal is kept below only as the
  // fallback when no Council data is present.
  const fromData = (DATA) => {
    const KIND = { 'Ancient Friend': 'Tree' };
    const circles = {};
    for (const [k, M] of Object.entries(DATA.circles)) {
      const af = M.ancient_friend || {}, tetol = af.tetol || {}, surf = M.tetol_surfaces || {};
      const fires = ((M.fire && M.fire.fires) || []).map((f) => { const o = { id: f.id, name: f.name, start: f.start || null };
        if (f.minutes != null) o.minutes = f.minutes; if (f.end) o.end = f.end; o.state = f.state || null; if (f.note) o.note = f.note; return o; });
      const comps = M.companions || [];
      circles[k] = { number: M.circle_number, title: M.title, tree: tetol.node ? { node: tetol.node, name: surf.tree_short || af.name } : undefined,
        question: M.central_question ? M.central_question.text : undefined,
        companions: comps.length ? comps.map((c) => c.id) : undefined,
        companionsData: comps.filter((c) => c.tetol && c.tetol.repr).map((c) => ({ id: c.id, name: c.name, kind: KIND[c.role] || c.role, seat: c.tetol.seat, repr: c.tetol.repr })),
        stage: (M.state && M.state.lifecycle) || null, fires, record: (M.heartwood_harvest && M.heartwood_harvest.record) || null };
      if (!circles[k].tree) delete circles[k].tree; if (circles[k].question === undefined) delete circles[k].question; if (!circles[k].companions) delete circles[k].companions;
    }
    const cur = DATA.registry.current, P = DATA.circles[cur], j = P && P.join_link;
    return { version: 2, place: { ...DATA.registry.place, room: j && typeof j.href === 'string' && /^https:\/\//.test(j.href) ? j.href : null,
      roomPlatform: j && j.platform && j.platform !== 'TBC' ? j.platform : null }, current: cur, circles };
  };
  const LEGACY = {
    version: 1,
    place: { name: 'The Council deck', treehouse: 'The Open Circle, through the Treehouse door', room: 'https://meet.google.com/zkp-tuue-ima' },
    current: 234,
    circles: {
      233: { number: 233, title: 'The Equinox Threshold', tree: { node: 'yewc233', name: 'the Ankerwycke Yew' }, stage: 'heartwood', fires: [] },
      234: {
        number: 234, title: 'Three Fires · Open Circle', tree: { node: 'c234_noku', name: 'Noku, the Ubuntu Tree' },
        question: 'What would you bring to the Council of Life?',
        companions: ['c234_noku', 'c234_peacock', 'c234_dahlia', 'c234_amaranth', 'c234_porcini', 'c234_hedgehog', 'people'],
        stage: 'living', // seed → opening → living → harvest → heartwood (set by hand)
        fires: [
          // state: null (follow the named time: before / gathering window / open) · 'lit' · 'held'  ← set by hand only
          { id: 'opening', name: 'Opening Fire', start: '2026-09-29T19:30:00+01:00', minutes: 90, state: 'held', note: 'Confirmed by Ed, 30 Sep: the room was tested and TETOL walked through together. Not recorded; the next fire will be.' },
          { id: 'fire2', name: 'Fire II', start: null, state: null },
          { id: 'fire3', name: 'Fire III', start: null, state: null },
        ],
        record: null, // public/shared record link — none confirmed yet
      },
    },
  };

  const MANIFEST = window.S33D_COUNCIL ? fromData(window.S33D_COUNCIL) : LEGACY;

  const AT = (() => { const q = new URLSearchParams(location.search).get('at'); const t = q && Date.parse(q); return t ? t - Date.now() : 0; })();
  const now = () => Date.now() + AT;
  const C = D.councilManifest = MANIFEST;
  const circle = (n) => C.circles[n ?? C.current];

  // the fire the deck is about: a fire lit by hand, else the next/most recent named one
  const currentFire = (c = circle()) => { const fs = (c.fires || []).filter((f) => f.start || f.state);
    const lit = fs.find((f) => f.state === 'lit'); if (lit) return lit;
    const t = now(), upcoming = fs.filter((f) => f.start && f.state !== 'held' && Date.parse(f.start) + (f.minutes || 90) * 60000 > t).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    if (upcoming.length) return upcoming[0];
    return fs.filter((f) => f.start).sort((a, b) => Date.parse(b.start) - Date.parse(a.start))[0] || null; };

  // the deck's state: before · gathering · open · afterglow · remembered
  const deckState = (c = circle()) => {
    if (c.stage === 'harvest' || c.stage === 'heartwood') return 'remembered';
    const f = currentFire(c); if (!f) return 'open';
    if (f.state === 'lit') return 'gathering';
    if (f.state === 'held') return 'afterglow';
    const s = Date.parse(f.start), e = s + (f.minutes || 90) * 60000, t = now();
    if (t < s) return 'before';
    if (t < e) return 'gathering'; // the named window (as since 0.9.9); "held" is never inferred
    const heldEarlier = (c.fires || []).some((x) => x.state === 'held');
    return heldEarlier ? 'afterglow' : 'open';
  };
  const lastHeld = (c = circle()) => (c.fires || []).filter((f) => f.state === 'held').slice(-1)[0] || null;
  const when = (f) => { if (!f || !f.start) return ''; const d = new Date(f.start);
    const hm = (x) => x.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }); // 0.9.15-dev: end shown only when a manifest sets one
    return `${f.name} · ${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' })} · ${hm(d)}${f.end ? '–' + hm(new Date(f.end)) : ''} UK`; };

  // ── the fire the scene's time line reads (D.circle233 is the living slot's fire): follow the manifest, not the clock
  const PRS = D.councilPresent && D.councilPresent.advanced ? D.councilPresent.surf() : {}; // 0.9.15-dev: honest "time to be announced"
  const syncSlotFire = () => { const c = circle(), f = currentFire(c), s = deckState(c), slot = D.circle233; if (!slot) return;
    if (s === 'before' || s === 'gathering') { if (f && f.start) Object.assign(slot, { start: Date.parse(f.start), end: f.end ? Date.parse(f.end) : Date.parse(f.start) + (f.minutes || 90) * 60000, label: f.name, openShort: 'Further fires as the Circle listens', openLong: 'The Open Circle · come in your own time' }); return; }
    const h = lastHeld(c);
    Object.assign(slot, { start: null, end: null }, s === 'afterglow' && h
      ? { openShort: `${h.name} held · the Circle stays open`, openLong: `The Open Circle · the ${h.name} was held · further fires will find their time · come in your own time` }
      : { openShort: f ? `${f.name} · ${new Date(f.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' })}` : (PRS.fire_unknown ? `${PRS.fire_unknown} · the Circle is open` : 'The Circle stays open'), openLong: PRS.fire_unknown ? `The Open Circle · ${PRS.fire_unknown} · come in your own time, before and after the Fire` : 'The Open Circle · come in your own time' }); };
  syncSlotFire();
  setInterval(syncSlotFire, 15000);

  D.council.manifest = { circle, currentFire, deckState, lastHeld, when, now, syncSlotFire };
})();

;
// TETOL 0.9.14-dev · COUNCIL ADAPTER · the Grove grows in time order (TEOTAG, 29 Sep 2026). DEV LINE · NOT PUBLISHED.
// [0.9.15-dev, 5 Oct 2026: previous Circles come from their manifests when the code does not carry them; Circle-owned scene
//  objects are bound to the Circle itself (D.council.inView), not to a slot.]
// Maps the Council manifest (Circles by their REAL number) onto the scene's slots, which keep their historical names:
//   living slot      circles[233] / node c233 (canopy lantern) / c233now (the ring "this week")
//   remembered slot  circles[232] / node c232 (the carved ring beside the Treehouse door)
//   older ring       mem231 · then "Earlier Circles"
// When manifest.current is the Circle the code already carries (234), this does nothing. When a new Circle becomes current,
// the previous Circle moves to the remembered ring with its Tree and companions intact, and the one before that to the older
// ring — nothing is overwritten or deleted.
(() => {
  const D = window.TETOL; if (!D || !D.councilManifest || !D.council || !D.council.circles) return;
  const N = D.nodes, M = D.councilManifest, S = D.council.circles;

  // ── which Circle is in view? (0.9.15-dev) A scene object that belongs to a Circle (the Ankerwycke Yew's root, the Equinox
  // line) shows when THAT Circle is being looked at — its ring, its Tree, the deck as it left it — wherever its ring now sits.
  const DATA = window.S33D_COUNCIL;
  const treeNodes = (num) => { const m = DATA && DATA.circles[num], af = m && m.ancient_friend, t = af && af.tetol;
    return t ? [t.node, t.roots_node].filter(Boolean) : num === 233 ? ['yewc233', 'yew'] : []; };
  const slotOf = (num) => Object.keys(S).find((k) => S[k] && S[k].number === num);
  D.council.inView = (num, here, legacyExtra) => { const slot = slotOf(num);
    if (slot === '232') return D.council.active === 232 || here === 'c232' || treeNodes(num).includes(here) || !!(legacyExtra && legacyExtra(here));
    if (slot === '233') return treeNodes(num).includes(here); // the living Circle's own objects (none today)
    const older = D.council.adapter && D.council.adapter.older === num;
    return (older && here === 'mem231') || treeNodes(num).includes(here); };

  // what the code already carries, by real number
  const carried = {};
  Object.values(S).forEach((c) => { if (c && c.number) carried[c.number] = c; });
  const livingNow = S[233] && S[233].number; // 234 in 0.9.11

  const X = M.current; if (!X || X === livingNow) { D.council.adapter = { advanced: false, living: livingNow }; return; }

  // ── advance: X becomes living, X-1 remembered, X-2 the older ring
  const cur = M.circles[X], prev = M.circles[X - 1] || {}, older = M.circles[X - 2] || {};
  const prevData = carried[X - 1] || (prev.companionsData ? { number: X - 1, companions: prev.companionsData.map((c) => ({ ...c })) } : null);
  S[233] = { node: 'c233', number: X, status: 'open', previous: 232, next: null, companions: (cur.companionsData || []).map((c) => ({ ...c })) };
  if (prevData) S[232] = { ...prevData, node: 'c232', number: X - 1, status: 'remembered', previous: null, next: 233 };
  // companion nodes: the new living ones (from the manifest), the previous ones re-homed to the remembered slot
  const mk = (c, num, test) => { N[c.id] = N[c.id] || { name: c.name, sub: `${c.kind} companion · Circle ${num}${test ? ' (test fixture)' : ''}`, part: `Circle ${num} · at the fire`,
    practical: test ? 'Development test fixture — not a real companion.' : `${c.kind} companion of Circle ${num}.`, purpose: test ? 'Placeholder used only to prove that a new Circle can take the fire while the previous one is remembered.' : '',
    status: 'LIVE', placement: 'PROPOSED', placementNote: 'Seat positions and forms are illustrative stand-ins, not portraits.', statusNote: '', room: true, circle: 233, lives: [], notes: [], sources: [], relations: [{ to: 'c233now', dim: 'time', text: `Circle ${num}` }, { to: 'c233rec', dim: 'place', text: 'The Open Circle' }],
    actions: [{ label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' }], location: 'On the Council deck.', scale: 'place' }; };
  (cur.companionsData || []).forEach((c) => mk(c, X, cur.test));
  if (!carried[X - 1]) (prev.companionsData || []).forEach((c) => mk(c, X - 1, prev.test));
  (prevData ? prevData.companions : []).forEach((c) => { if (N[c.id]) { N[c.id].circle = 232; N[c.id].status = 'REMEMBERED'; } });
  // the Circle before the remembered one is not drawn any more (it stays in the lineage as the older ring)
  ((carried[X - 2] && carried[X - 2].companions) || older.companionsData || []).forEach((c) => { if (N[c.id] && N[c.id].circle === 232) N[c.id].circle = 231; });
  // the deck and its rings say which Circle is which
  const set = (id, o) => { if (N[id]) Object.assign(N[id], o); };
  set('c233', { name: `Circle ${X}`, question: cur.question, practical: cur.question || N.c233.practical });
  set('c233now', { name: `Circle ${X}`, sub: 'This week · the Open Circle' });
  set('c232', { name: `Circle ${X - 1}`, sub: `Remembered · beneath ${prev.tree ? prev.tree.name : 'its Tree'}`,
    relations: (N.c232.relations || []).map((r) => r.to === 'yewc233' && prev.tree ? { to: prev.tree.node, dim: 'web', text: `Its Tree companion: ${prev.tree.name}` } : r) });
  set('mem231', { name: `Circle ${X - 2}`, sub: 'Remembered · the older ring' });
  if (N.croom) { N.croom.question = cur.question || N.croom.question;
    N.croom.lives = [...(cur.companionsData || []).map((c) => ({ text: `${c.kind} · ${c.name}`, status: 'LIVE', to: c.id })), { text: 'People · those who gather, at the live fires and in their own time', status: 'LIVE', to: 'people' }]; }
  // the time lines move with their Circles (keyed by slot): X-1's line goes to the remembered ring, X-2's is kept aside
  if (D.time && D.time.cycles) { const cy = D.time.cycles, was233 = cy[233], was232 = cy[232];
    cy[231] = was232 ? { ...was232, node: 'mem231', status: 'remembered' } : cy[231];
    cy[232] = was233 ? { ...was233, node: 'c232', status: 'remembered' } : cy[232];
    cy[233] = { node: 'c233now', drafted: null, shared: null, held: null, planned: null, explored: [], people: [] }; }
  D.council.active = 233; D.council.adapter = { advanced: true, living: X, remembered: X - 1, older: X - 2, test: !!cur.test };
  D.council.manifest && D.council.manifest.syncSlotFire();
})();

;
// TETOL 0.9.15-dev · PRESENT-CIRCLE BINDER (TEOTAG, 5 Oct 2026). DEV LINE · NOT PUBLISHED.
// CURRENT CIRCLE = MANIFEST. When the registry's current Circle is not the one the legacy layers carry (234), every "now"
// surface of the Council is bound here from that Circle's manifest (D.councilPresent, layer 246): the canopy lantern, the
// deck, the rings, the Open Circle, the People seats, Heartwood's traces, the arrival thread, the companions' cards, the
// Ancient Friend's card, the living threads and the outward threshold. TETOL writes no Circle text of its own.
// Nothing here stores or sends anything; the outward threshold remembers one flag in this browser only.
(() => {
  const D = window.TETOL, PR = D && D.councilPresent; if (!D || !PR || !PR.advanced) return;
  const N = D.nodes, M = PR.manifest, S = PR.surf(), t = (s) => PR.t(s), n = PR.number, APP = 'https://www.s33d.life';
  const prev = PR.prev, older = PR.older, AF = M.ancient_friend || {}, afNode = (AF.tetol && AF.tetol.node) || null;
  const comps = M.companions || [], byId = Object.fromEntries(comps.map((c) => [c.id, c]));
  const prevTree = prev && prev.ancient_friend && prev.ancient_friend.tetol ? prev.ancient_friend.tetol.node : null;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const set = (id, o) => { if (N[id]) Object.assign(N[id], o); };
  const SRC = `Circle ${n} manifest ${M.manifest_version || ''} (one source with the Council PDF and invitation)`.replace('  ', ' ');
  const OUT = '@outward';

  // ── the Circle (canopy lantern) and its rings
  set('c233', { name: `Circle ${n}`, sub: t(S.circle_card_sub || '{title}'), part: 'In the canopy · the Council of Life', practical: t('{question}'),
    purpose: t(S.circle_card_purpose), status: 'LIVE', statusNote: t(S.circle_status_note),
    lives: comps.map((c) => ({ text: `${c.name} · ${c.role}`, status: 'LIVE', to: c.id === 'people' ? 'people' : c.id })),
    actions: [{ label: `Enter Circle ${n}`, sub: 'Up to the Council fire in the Treehouse', go: 'croom' },
      { label: S.outward.label, sub: S.outward.sub, go: OUT },
      { label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' },
      ...(M.links.council_of_life ? [{ label: 'The Council of Life on S33D.life', sub: 'Open to all · opens in a new tab', href: M.links.council_of_life }] : [])],
    relations: [...(afNode ? [{ to: afNode, dim: 'web', text: `This Circle's Ancient Friend: ${AF.name}` }] : []),
      ...(N.c233.relations || []).filter((r) => !['c234_noku', 'yew', afNode].includes(r.to))], sources: [SRC] });
  set('c233now', { name: `Circle ${n}`, sub: t(S.now_ring_sub || 'This week · the Open Circle'), purpose: `Return to this week’s Circle: ${t('{question}')}`, statusNote: t(S.circle_status_note) });
  if (prev) set('c232', { purpose: t(S.remembered_ring_purpose), stateShort: `Remembered · ${prev.state && prev.state.harvest === 'UNHARVESTED' ? 'not yet harvested' : 'settling into the record'}`,
    status: 'REMEMBERED', statusNote: `Circle ${prev.circle_number}, ${prev.title}, now in the lineage.`, sources: [`Council of Life — Circle ${prev.circle_number}`],
    relations: [{ to: 'croom', dim: 'place', text: 'The same deck, this week' }, ...(prevTree ? [{ to: prevTree, dim: 'web', text: `Its Tree companion: ${PR.treeName(prev)}` }] : []),
      { to: 'c_records', dim: 'place', text: 'The records chest' }, { to: 'h_scrolls', dim: 'time', text: 'Down into the long memory of the Deeper Rings' }] });
  if (older) set('mem231', { purpose: t(S.older_ring_purpose), relations: [...(N.mem231.relations || []).filter((r) => r.to !== 'yewc233'),
    ...(older.ancient_friend && older.ancient_friend.tetol ? [{ to: older.ancient_friend.tetol.roots_node || older.ancient_friend.tetol.node, dim: 'web', text: `Its Tree: ${PR.treeName(older)}` }] : [])] });
  if (N.canopy) N.canopy.lives = [{ text: t(S.canopy_life), status: 'LIVE', to: 'c233' },
    ...(prev ? [{ text: `Circle ${prev.circle_number} — ${prev.title} · remembered${prev.state && prev.state.harvest === 'UNHARVESTED' ? ' · not yet harvested' : ''}`, status: 'REMEMBERED', to: 'c232' }] : []),
    ...(older ? [{ text: `Circle ${older.circle_number} — ${older.title} · remembered`, status: 'REMEMBERED', to: 'mem231' }] : []),
    ...(N.canopy.lives || []).filter((l) => !['c233', 'c232', 'mem231'].includes(l.to))];

  // ── 235.6.0 · the permanent Golden Thread(s): named later by TEOTAG as a lineage decision; never a harvest, never the gathering's own claim
  (PR.golden || []).forEach((g) => {
    const from = g.origin.circle, at = g.origin.tetol_node && N[g.origin.tetol_node] ? g.origin.tetol_node : (prev && prev.circle_number === from ? 'c232' : null);
    if (N.c233) N.c233.lives = [{ text: `Golden Thread · ${g.name} · carried from Circle ${from}, beneath ${g.origin.tree} · a later TEOTAG lineage decision, not a harvest`, status: 'LIVE', ...(at ? { to: at } : {}) }, ...(N.c233.lives || [])];
    if (prev && N.c232 && prev.circle_number >= from) N.c232.lives = [{ text: prev.circle_number === from
      ? `Golden Thread · ${g.name} begins here, beneath ${g.origin.tree} · named later by TEOTAG (a lineage decision); Circle ${from} itself stays unharvested`
      : `Golden Thread · ${g.name} · carried through Circle ${prev.circle_number}`, status: 'REMEMBERED' }, ...(N.c232.lives || [])];
  });

  // ── the deck
  if (N.croom) { N.croom.question = t('{question}');
    if (M.links.group) N.croom.actions.push({ label: 'Council group · Fire times', sub: t(S.fire_unknown), href: M.links.group });
    N.croom.lives = comps.map((c) => ({ text: `${c.role === 'Ancient Friend' ? 'Tree' : c.role} · ${c.name}`, status: 'LIVE', to: c.id === 'people' ? 'people' : c.id }));
    N.croom.relations = (N.croom.relations || []).filter((r) => afNode || !(r.to === 'c234_noku' || r.to === 'yewc233')).map((r) => r.to === 'c234_noku' || r.to === 'yewc233' ? { to: afNode, dim: 'place', text: `The Ancient Friend: ${AF.name}` }
      : r.to === 'c233' ? { ...r, text: `The current Circle, named at the doorway: Circle ${n}` } : r);
    N.croom.actions = [{ label: 'Bring something to the Council', sub: 'The Open Circle · ' + t('{question}'), go: '@opencircle' }, { label: S.outward.label, sub: S.outward.sub, go: OUT },
      ...(N.croom.actions || []).filter((a) => a.go !== '@opencircle' && a.go !== OUT)]; }
  set('c233rec', { purpose: t('{question}') + ' ' + (M.offerings_prompt ? M.offerings_prompt.text : ''), practical: 'Before and after the Council Fire, the Circle stays open.',
    statusNote: (M.open_circle && M.open_circle.honest_note) || 'Experimental: this doorway does not store or send offerings yet.', sources: [SRC] });
  set('people', { sub: `People companion · Circle ${n}`, part: `At the Council fire · Circle ${n}`, purpose: t(S.people_purpose), statusNote: `Those who gather in Circle ${n}.`, circle: 233 });
  set('traces', { name: `Circle ${n} traces`, purpose: t(PR.fireOf(M) && PR.fireOf(M).state === 'held' ? S.traces_after : S.traces_before), status: 'PROPOSED',
    statusNote: `Heartwood harvest: ${(M.heartwood_harvest && M.heartwood_harvest.status) || 'WAITING'}. ${(M.heartwood_harvest && M.heartwood_harvest.rule) || ''}` });
  if (N.h_hearth) N.h_hearth.relations = [{ to: 'c233', dim: 'time', text: `Circle ${n} is open · the Council, up in the canopy` }, ...(N.h_hearth.relations || []).filter((r) => r.to !== 'c233')];
  if (N.h_scrolls && prev) N.h_scrolls.lives = [...(N.h_scrolls.lives || []), { text: t(S.heartwood_prev_life), status: 'REMEMBERED' }];
  if (N.c_records && prev) N.c_records.relations = [...(N.c_records.relations || []).filter((r) => r.to !== 'c232'), { to: 'c232', dim: 'time', text: `Circle ${prev.circle_number}, the week before` }];

  // ── the Crown's listening ember, the Heartwood ring and the traces were written for the carried Circle (320 R2, 040, 250):
  // only their "now" lines follow the present Circle; anything pointing at a remembered ring is left as it is.
  const NOWRX = new RegExp(`Circle ${PR.carried}(?!\\d)`, 'g'), now = (v) => typeof v === 'string' ? v.replace(NOWRX, `Circle ${n}`) : v;
  ['signal', 'ring', 'traces'].forEach((id) => { const x = N[id]; if (!x) return;
    ['name', 'sub', 'practical', 'purpose', 'location', 'statusNote'].forEach((f) => { x[f] = now(x[f]); });
    ['lives', 'relations'].forEach((k) => { if (Array.isArray(x[k])) x[k] = x[k].map((l) => (l.to === 'c232' || l.to === 'mem231') ? l : { ...l, text: now(l.text) }); }); });
  ['crown', 'canopy', 'c233'].forEach((id) => { const x = N[id]; if (!x) return;
    ['lives', 'relations'].forEach((k) => { if (Array.isArray(x[k])) x[k] = x[k].map((l) => l.to === 'signal' ? { ...l, text: now(l.text) } : l); }); });
  if (N.traces) N.traces.practical = `Waiting. Circle ${n}'s Heartwood harvest arrives only as an approved Circle memory.`;

  // ── take your place (310's seat) · and the Staff Room relationship: arriving, not owning
  if (N.seat_you) { Object.assign(N.seat_you, { sub: t('{question}'), part: `At the Council fire · Circle ${n}`,
    purpose: (M.offerings_prompt && M.offerings_prompt.place_for_you) || N.seat_you.purpose,
    relations: [{ to: 'croom', dim: 'place', text: 'Back to the fire' }, ...(afNode ? [{ to: afNode, dim: 'web', text: `This Circle’s Ancient Friend: ${AF.name}` }] : []),
      { to: 'people', dim: 'web', text: 'The others who gather' }, ...(N.staff ? [{ to: 'staff', dim: 'place', text: 'Carry a Staff from the Staff Room' }] : [])],
    notes: [{ status: 'PROPOSED', text: S.place_for_you_staff }] }); }
  if (N.staff && N.seat_you) N.staff.relations = [...(N.staff.relations || []).filter((r) => r.to !== 'seat_you'), { to: 'seat_you', dim: 'place', text: `Carry it to Circle ${n} · a place for you at the fire` }];

  // ── companions: proper cards from the manifest (the forms stay the deck's existing stand-ins)
  const threadsOf = (id) => (M.living_threads || []).filter((x) => (x.companions || []).includes(id));
  comps.forEach((c) => { const id = c.id === 'people' ? 'people' : c.id, node = N[id]; if (!node) return;
    const seedKey = c.library_seed && c.library_seed.key, L = window.S33D_LIBRARY, seed = seedKey && L && L.seeds && L.seeds[seedKey];
    const st = c.tetol && c.tetol.stand_in;
    Object.assign(node, { name: c.name, sub: `${c.role} · Circle ${n}`, part: `At the Council fire · Circle ${n}`, practical: c.line,
      lives: (c.threads || []).map((x) => ({ text: x, status: 'OBSERVATION' })),
      notes: [...(c.safety ? [{ status: 'LIVE', text: c.safety }] : []),
        ...(id !== 'people' && !seed ? [{ status: 'PROPOSED', text: 'Its Living Library seed is still being prepared' + (c.library_seed && c.library_seed.note ? ': ' + c.library_seed.note : '.') }] : [])],
      placement: 'PROPOSED', placementNote: st ? `The form on the deck is a stand-in, not a portrait${c.tetol.form_wanted ? ' (wanted: ' + c.tetol.form_wanted + ')' : ''}.` : 'Seat position is illustrative.',
      status: 'LIVE', statusNote: SRC, sources: [SRC],
      relations: [...threadsOf(c.id).flatMap((th) => th.companions.filter((o) => o !== c.id).slice(0, 2).map((o) => ({ to: o, dim: 'web', text: `${th.title}: ${byId[o] ? byId[o].name : o}` }))),
        { to: 'croom', dim: 'place', text: 'Back to the fire' }].filter((r, i, a) => a.findIndex((x) => x.to === r.to) === i),
      actions: [...(seed ? [{ label: 'Enter the Living Library', sub: `${seed.name} · one seed that keeps growing across Circles`, go: '@seed:' + seedKey }] : []),
        ...(c.role === 'Ancient Friend' ? [] : [{ label: c.role === 'Book' ? 'Take a story into your week' : S.outward.label, sub: c.role === 'Book' ? 'Read or remember a line; bring what it awakens to the Fire' : `Meet ${c.name.toLowerCase().startsWith('those') ? 'someone' : 'one'} in the living world`, go: OUT }]),
        { label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' }] });
    if (seed && L.appear) L.appear(seedKey, { circle: n, role: `${c.role} companion`, node: id }); });

  if (prev && prev.circle_number !== PR.carried) (prev.companions || []).forEach((c) => { const node = N[c.id]; if (!node || c.id === 'people') return;
    Object.assign(node, { name: c.name, sub: `${c.role} · Circle ${prev.circle_number} · remembered`, part: `Circle ${prev.circle_number} · remembered`, practical: c.line || node.practical,
      lives: (c.threads || []).map((x) => ({ text: x, status: 'OBSERVATION' })), notes: c.safety ? [{ status: 'LIVE', text: c.safety }] : [],
      status: 'REMEMBERED', statusNote: `Companion of Circle ${prev.circle_number}, remembered.`, placement: 'PROPOSED', placementNote: 'Seat position and form are illustrative stand-ins.',
      sources: [`Circle ${prev.circle_number} manifest ${prev.manifest_version || ''}`.trim()], relations: [{ to: 'c232', dim: 'time', text: `Circle ${prev.circle_number}, remembered` }],
      actions: [{ label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' }] }); });

  // ── the Ancient Friend: one living tree, its real record first; the encounter honestly waiting
  if (afNode && N[afNode]) { const enc = AF.encounter || {}, waiting = enc.status === 'WAITING_FOR_ENCOUNTER';
    Object.assign(N[afNode], { sub: `Ancient Friend · Circle ${n}`, practical: `This week’s Ancient Friend · one particular living tree${AF.species ? ' · ' + AF.species : ''}.`,
      purpose: (byId[afNode] && byId[afNode].line) || '', placementNote: `Provisional representation · ${waiting ? 'WAITING_FOR_ENCOUNTER' : (enc.status_label || enc.status || 'encountered')}. The form is a stand-in and may change; the tree’s identity (${AF.s33d_id}) does not.`,
      actions: [{ label: S.outward.label, sub: S.outward.sub, go: OUT },
        ...(AF.canonical_url ? [{ label: 'Its record on S33D.life', sub: `${AF.name} · its place in the living world`, href: AF.canonical_url }] : []),
        ...(AF.map_url ? [{ label: 'Find it on the map', sub: `S33D.life map${AF.place_line ? ' · ' + AF.place_line : ''}`, href: AF.map_url }] : []),
        { label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' }] });
    // 0.9.15-dev · 235.5.1: research (sourced) and the lived encounter stay distinct; nothing is filled on anyone's behalf
    const R = AF.research || null, words = ['words_leo', 'words_bruna', 'words_ed'].filter((k) => enc[k]).map((k) => enc[k]);
    const encText = waiting ? (enc.waiting_text || 'Waiting for the encounter.')
      : [enc.context, enc.documentation && enc.documentation.note, ...words].filter(Boolean).join(' ');
    const rows = [...(AF.known || []).map((k) => ({ k: k.label, v: k.text, st: k.sources ? 'SOURCED' : 'LIVE' })),
      ...(R && R.sources ? [{ k: 'Sources', v: Object.values(R.sources).map((x) => `${x.publisher}${x.date ? ', ' + x.date.slice(0, 4) : ''}: ${x.title}`).join(' · '), st: 'RESEARCH' }] : []),
      ...(R && R.living_question ? [{ k: 'Living question', v: R.living_question.text, st: 'QUESTION' }] : []),
      { k: enc.title || 'The encounter', v: encText, st: waiting ? 'WAITING' : (enc.status_label || 'LIVE') },
      ...(!waiting && !words.length && enc.words_space_note ? [{ k: 'Their words', v: enc.words_space_note, st: 'WAITING' }] : []),
      { k: `Circle ${n}`, v: 'Ancient Friend of the current Council of Life.', go: 'croom', st: 'LIVE' },
      { k: 'Identification', v: (AF.identification && AF.identification.note) || '', st: (AF.identification && AF.identification.status) || 'PROPOSAL' }];
    const css = document.createElement('style');
    css.textContent = `#panel .af-rel { margin-top: 18px; } #panel .af-rel h4 { margin-bottom: 8px; }
    #panel .af-rel .nr { display: block; width: 100%; text-align: left; border: 1px solid var(--line); border-radius: 10px; padding: 9px 12px; margin: 0 0 6px; background: none; color: var(--ink2); font: 13px/1.45 var(--sans); }
    #panel .af-rel button.nr { cursor: pointer; } #panel .af-rel .nr b { display: block; font: 600 11px/1.3 var(--sans); letter-spacing: .12em; text-transform: uppercase; color: var(--ink); margin-bottom: 2px; }
    #panel .af-rel .nr i { font-style: normal; font-size: 10.5px; letter-spacing: .08em; color: var(--ink3); margin-left: 6px; text-transform: uppercase; }
    #panel .af-rel .nr.waiting { border-style: dashed; }
    #panel .threads { margin-top: 16px; } #panel .threads h4 { margin-bottom: 4px; } #panel .threads .ti { font: italic 13px/1.4 var(--sans); color: var(--ink3); margin: 0 0 8px; }
    #panel .threads .th { margin: 0 0 10px; } #panel .threads .th b { display: block; font: 600 11px/1.3 var(--sans); letter-spacing: .12em; text-transform: uppercase; color: var(--ink); margin: 0 0 4px; }
    #panel .threads .th p { font-size: 12.5px; line-height: 1.45; margin: 0 0 5px; color: var(--ink2); }
    #panel .threads .tw { display: flex; flex-wrap: wrap; gap: 6px; } #panel .threads button { border: 1px solid var(--line); border-radius: 999px; background: none; color: var(--ink2); padding: 6px 10px; min-height: 32px; font: 12px/1.2 var(--sans); cursor: pointer; }
    #panel .threads .tq { font: italic 14px/1.4 var(--whisper, serif); color: var(--ink); margin: 6px 0 0; }`;
    document.head.appendChild(css);
    const afHTML = `<div class="sec af-rel"><h4>One living being · many relationships</h4>${rows.map((r) => { const inner = `<b>${esc(r.k)}<i>${esc(r.st === 'LIVE' ? 'live' : r.st.toLowerCase().replace(/_/g, ' '))}</i></b>${esc(r.v)}`;
      return r.go ? `<button type="button" class="nr" data-go="${r.go}">${inner}</button>` : `<div class="nr${r.st === 'WAITING' ? ' waiting' : ''}">${inner}</div>`; }).join('')}</div>`;
    const thHTML = `<div class="sec threads"><h4>${esc(S.threads_heading)}</h4><p class="ti">${esc(S.threads_intro)}</p>${(M.living_threads || []).map((th) =>
      `<div class="th"><b>${esc(th.title)}</b><p>${th.fragments.map(esc).join(' · ')}</p><div class="tw">${(th.companions || []).map((o) => byId[o] ? `<button type="button" data-go="${o}">${esc(byId[o].name)}</button>` : '').join('')}</div></div>`).join('')}
      <p class="tq">${esc(M.living_threads_prompt || 'What connections do you notice?')}</p></div>`;
    const place = () => { const id = window.TETOL_NAV && window.TETOL_NAV.where().id, pb = document.querySelector('#panel .pbody'); if (!pb) return;
      const after = () => pb.querySelector('.actions') || pb.querySelector('.ppurpose');
      if (id === afNode && !pb.querySelector('.af-rel') && after()) after().insertAdjacentHTML('afterend', afHTML);
      if (id === 'croom' && !pb.querySelector('.threads') && after()) after().insertAdjacentHTML('afterend', thHTML); };
    new MutationObserver(place).observe(document.documentElement, { childList: true, subtree: true }); }

  // ── Roots and the Friends: this week's Tree leads; Noku and the Ankerwycke Yew are remembered, unchanged otherwise
  const lead = (node, rel, life) => { const x = N[node]; if (!x || !afNode) return;
    x.relations = [rel, ...(x.relations || []).filter((r) => r.to !== afNode).map((r) => r.to === 'c234_noku' ? { ...r, text: r.text.replace(/, the current Council|the current Council/, ' (remembered)').replace('This Circle’s Tree', 'Circle 234’s Tree') } : r)];
    if (life) x.lives = [life, ...(x.lives || []).filter((l) => l.to !== afNode)]; };
  lead('roots', { to: afNode, text: `${AF.name} · Ancient Friend of Circle ${n}, the current Council` }, { text: `${AF.name}${AF.place_line ? ' · ' + AF.place_line : ''} · Ancient Friend of Circle ${n}`, status: 'LIVE', to: afNode });
  lead('h_friends', { to: afNode, text: `This Circle’s Tree: ${AF.name}` });
  lead('outside', { to: afNode, text: `A Friend on the land${AF.place_line ? ' (' + AF.place_line + ')' : ''}: ${AF.name}` });

  // Candidate-only current navigation; historical nodes and source manifests stay intact.
  const canopyList = D.listTree.find((x) => x.id === 'canopy');
  if (canopyList) {
    const deck = (canopyList.children || []).find((x) => x.id === 'croom');
    if (deck) deck.children = [{ id: 'c233rec' }, ...comps.map((c) => ({ id: c.id })),
      { id: 'c232', children: (prev.companions || []).filter((c) => c.id !== 'people' && N[c.id]).map((c) => ({ id: c.id })) }, { id: 'mem231', children: [{ id: 'pack' }] }];
    const current = (canopyList.children || []).find((x) => x.id === 'c233');
    if (current) current.children = (current.children || []).filter((x) => x.id !== 'pack');
  }
  if (N.croom) N.croom.where = (N.croom.where || []).map((w) => w.k === 'Next Circle' ? { ...w, k: 'Current Circle', v: `Circle ${n} · ${M.title}` } : w.k === 'Gathering' ? { ...w, v: PR.fireText() || 'Time to be announced' } : w);
  if (N.c233) N.c233.spiral = [{ k: 'Council', v: `Circle ${n} · current` },
    { k: 'Fire', v: PR.fireText() || 'Time to be announced' },
    { k: 'Memory', v: 'Waiting for an approved Circle memory' }];
  if (N.traces) N.traces.relations = N.traces.relations.map((r) => r.to === 'c233' ? { ...r, text: `Would come from Circle ${n}, after an approved memory exists` } : r);
  // A concise orientation; origin and decision remain in their owning registry.
  const ubuntu = (PR.golden || []).find((g) => g.id === 'ubuntu');
  if (ubuntu && N.c233) N.c233.purpose += ` Ubuntu continues from Circle ${ubuntu.origin.circle}, beneath Nokuphila. Circle 234 remains remembered · unharvested.`;
  if (ubuntu && N.croom) N.croom.practical += ' Ubuntu continues from Circle 234 beneath Nokuphila — remembered · unharvested.';
  if (ubuntu && N.croom) N.croom.actions.push({ label: 'Golden Thread of Ubuntu', sub: 'From Circle 234 beneath Nokuphila · remembered, unharvested', go: 'c232' });

  // ── the arrival thread
  if (D.thread && Array.isArray(S.thread)) D.thread = { title: AF.name ? `Circle ${n} ↔ ${AF.name}` : `Circle ${n}`, steps: S.thread.filter((st) => N[st.place]).map((st) => ({ id: st.place, say: t(st.say) })) };
  document.title = `TETOL · The Ethereal Tree of Life · Circle ${n}`;

  // ═════════════ SEND PEOPLE OUTSIDE: the outward threshold, and a clear return ═════════════
  const OK = `tetol-outward-${n}`, O = S.outward, RT = S.return;
  const ocss = document.createElement('style');
  ocss.textContent = `#outward, #returned { position: fixed; inset: 0; z-index: 72; display: grid; place-items: center; background: hsl(30 20% 4% / .55); backdrop-filter: blur(3px); font-family: var(--sans); }
  #outward[hidden], #returned[hidden] { display: none; }
  #outward .oc, #returned .oc { position: relative; width: min(500px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); overflow: auto; background: hsl(30 16% 8% / .96); border: 1px solid hsl(42 45% 45% / .35); border-radius: 16px; padding: 22px; color: var(--ink2); box-shadow: 0 20px 60px #000a; }
  #outward .eyebrow, #returned .eyebrow { font: 600 10.5px/1 var(--sans); letter-spacing: .16em; text-transform: uppercase; color: var(--ink3); margin: 0 0 8px; }
  #outward h2, #returned h2 { font: 600 23px/1.15 var(--serif); letter-spacing: .04em; color: var(--ink); margin: 0 0 10px; }
  #outward p, #returned p { font-size: 14px; line-height: 1.5; margin: 0 0 12px; }
  #outward ol { margin: 0 0 12px; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 6px; } #outward ol li { font: 600 11px/1 var(--sans); letter-spacing: .14em; border: 1px solid hsl(42 30% 40% / .45); border-radius: 999px; padding: 7px 10px; color: var(--ink); }
  #outward .safe { border-left: 2px solid hsl(120 25% 45% / .6); padding: 6px 12px; font-size: 13px; }
  #outward .row, #returned .row { display: flex; flex-wrap: wrap; gap: 8px; } #outward .row a, #outward .row button, #returned .row button { font: 600 13px/1.2 var(--sans); border-radius: 10px; padding: 11px 14px; text-decoration: none; cursor: pointer; border: 1px solid hsl(42 40% 45% / .45); color: var(--ink); background: none; min-height: 44px; }
  #outward .row .primary, #returned .row .primary { background: hsl(42 95% 55%); color: #1b1408; border-color: transparent; }
  #outward .x, #returned .x { position: absolute; top: 8px; right: 8px; width: 44px; height: 44px; border: 0; background: none; color: var(--ink2); font-size: 24px; cursor: pointer; }
  #outward .status { font-size: 12.5px; color: var(--ink3); min-height: 1.2em; margin: 8px 0 0; }`;
  document.head.appendChild(ocss);
  const ob = document.createElement('div'); ob.id = 'outward'; ob.hidden = true; ob.setAttribute('role', 'dialog'); ob.setAttribute('aria-modal', 'true'); ob.setAttribute('aria-labelledby', 'ow-title');
  ob.innerHTML = `<div class="oc" tabindex="-1"><button type="button" class="x" aria-label="Close">×</button>
    <p class="eyebrow">Council of Life · Circle ${n}${M.title ? ' · ' + esc(M.title) : ''}</p><h2 id="ow-title">${esc(O.title)}</h2><p>${esc(O.text)}</p>
    <ol>${(O.steps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol><p class="safe">${esc(O.safety)}</p>
    <div class="row"><button type="button" class="primary" data-ow="go">${esc(O.going)}</button>
      ${AF.map_url ? `<a href="${esc(AF.map_url)}" target="_blank" rel="noopener">${esc(O.holm_oak_map)} ↗</a>` : ''}
      <a href="${APP}/map" target="_blank" rel="noopener">${esc(O.find_friend)} ↗</a></div><p class="status" aria-live="polite"></p></div>`;
  const rb = document.createElement('div'); rb.id = 'returned'; rb.hidden = true; rb.setAttribute('role', 'dialog'); rb.setAttribute('aria-labelledby', 'rt-title');
  rb.innerHTML = `<div class="oc" tabindex="-1"><button type="button" class="x" aria-label="Close">×</button><p class="eyebrow">Circle ${n} · return</p>
    <h2 id="rt-title">${esc(RT.title)}</h2><p>${esc(RT.text)}</p><div class="row"><button type="button" class="primary" data-rt="bring">${esc(RT.bring)}</button><button type="button" data-rt="seat">${esc(RT.seat)}</button></div></div>`;
  const get = () => { try { return localStorage.getItem(OK); } catch (e) { return null; } }, put = (v) => { try { v ? localStorage.setItem(OK, v) : localStorage.removeItem(OK); } catch (e) {} };
  let wentAt = 0;
  const showReturn = () => { rb.hidden = false; rb.querySelector('.oc').focus(); };
  const mount = () => { document.body.appendChild(ob); document.body.appendChild(rb); if (get()) setTimeout(showReturn, 3200); };
  document.body ? mount() : addEventListener('DOMContentLoaded', mount);
  ob.addEventListener('click', (e) => { if (e.target === ob || e.target.closest('.x')) { ob.hidden = true; return; }
    if (e.target.closest('[data-ow="go"]')) { wentAt = Date.now(); put(String(wentAt)); ob.querySelector('.status').textContent = 'Go well. When you come back, the Circle will be here.'; } });
  rb.addEventListener('click', (e) => { const b = e.target.closest('[data-rt]'); if (e.target === rb || e.target.closest('.x') || b) { rb.hidden = true; put(null); }
    if (b && b.dataset.rt === 'bring' && window.TETOL_CIRCLE) window.TETOL_CIRCLE.open();
    if (b && b.dataset.rt === 'seat' && window.TETOL_NAV) window.TETOL_NAV.run('goTo', 'seat_you'); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && get() && wentAt && Date.now() - wentAt > 4000) { ob.hidden = true; showReturn(); } });
  addEventListener('click', (e) => { const g = e.target.closest && e.target.closest(`[data-go="${OUT}"]`); if (!g) return; e.preventDefault(); e.stopImmediatePropagation(); const book = window.TETOL_NAV && byId[window.TETOL_NAV.where().id]?.role === 'Book'; ob.querySelector('#ow-title').textContent = book ? 'Take a story into your week.' : O.title; ob.querySelector('#ow-title + p').textContent = book ? 'Read or remember a line from Peter Pan. What does it awaken in you? Bring a noticing, question or story back to the Council Fire.' : O.text; ob.hidden = false; ob.querySelector('.oc').focus(); }, true);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!ob.hidden) { e.stopImmediatePropagation(); ob.hidden = true; } else if (!rb.hidden) { e.stopImmediatePropagation(); rb.hidden = true; } } }, true);
  window.TETOL_OUTWARD = { open: () => { ob.hidden = false; }, showReturn, key: OK };
})();

;
// TETOL 0.9.13-dev · THE LIVING DECK (TEOTAG, 29 Sep 2026). DEV LINE · NOT PUBLISHED.
// Replaces 0.9.12's tetol-live-fire.js. The deck reads the Council manifest and lives in five states:
//   before     the fire is named; the live-fire doorway and A Place for You are both there
//   gathering  the named window (or a fire lit by hand): the fire burns fully; JOIN THE LIVE FIRE comes first
//   open       the window has passed and nobody has said what happened: the fire stays named, nothing claims "held"
//   afterglow  a fire marked held by hand: banked embers, softer light; the fire's card remembers it; the Circle stays open
//   remembered the Circle's stage set to harvest/heartwood by hand: the fire rests; the Circle settles into its ring
// The fire is the doorway (camera does not move). The live room opens in a new tab / the Meet app; TETOL stays here.
(() => {
  const D = window.TETOL; if (!D) return;
  const N = D.nodes, M = D.council && D.council.manifest; if (!N.croom || !M) return;
  const C = D.councilManifest, room = () => C.place.room;
  // 0.9.15-dev: the room and its platform come from the present Circle's manifest; nothing is hard-coded, and no join link means no button
  const PLAT = () => C.place.roomPlatform || (C.place.room ? 'Google Meet' : null), PEND = () => (D.councilPresent && D.councilPresent.surf().join_pending) || 'The join link will be shared here once it is confirmed.';
  const S = () => M.deckState(), F = () => M.currentFire(), num = () => M.circle().number;

  const liveAction = () => { const s = S(), f = F(); if (!f || !room()) return null;
    if (s === 'gathering') return { label: 'JOIN THE LIVE FIRE', sub: `The ${f.name} is lit now · opens ${PLAT()} in a new tab · TETOL stays open here`, href: room() };
    if (s === 'before') return { label: 'The live fire', sub: M.when(f) + ` · the Council’s live room (${PLAT()}) · opens in a new tab`, href: room() };
    return null; }; // open / afterglow / remembered: no live doorway (no false "live", no dead button)

  const fireNode = () => { const s = S(), f = F(), h = M.lastHeld(), a = liveAction();
    const sub = s === 'gathering' ? `The ${f ? f.name : 'fire'} is lit now` : s === 'before' ? M.when(f)
      : s === 'afterglow' ? `${h.name} held · the Circle stays open` : s === 'remembered' ? `Circle ${num()} · remembered` : (f ? M.when(f) : (D.councilPresent && D.councilPresent.advanced ? (D.councilPresent.surf().fire_unknown || 'Council Fire · time to be announced') : 'The Circle stays open between fires'));
    const practical = { before: `This is where the live gatherings of Circle ${num()} are lit.`, gathering: 'People are gathering around this fire now, together, in the Council’s live room.',
      open: 'The live fires come and go; the Circle does not close. Come in your own time.', afterglow: 'The embers are banked. What was brought is still warm here, and the Circle stays open.',
      remembered: 'This Circle has gathered in. Its memory settles into Heartwood; the place remains for the next Circle.' }[s];
    return { ...N.croom, id: 'live_fire', room: true, name: s === 'gathering' ? 'JOIN THE LIVE FIRE' : 'The live fire', labelName: 'The live fire', sub,
      part: `At the heart of the Council deck · Circle ${num()}`, question: undefined, seed: undefined, time: undefined, lenses: undefined, scale: 'place', practical,
      purpose: (PLAT() === 'Google Meet' ? 'A live fire is a moment when people gather at the same time, by video, around the Circle’s question. It opens in Google Meet in a new tab (or the Meet app); this place stays open here, so you can come back to the deck afterwards. Between fires, the Open Circle is always here.' : 'A live fire is a moment when people gather at the same time, by video, around the Circle’s question. ' + (room() ? `It opens in ${PLAT() || 'the Council’s live room'} in a new tab; this place stays open here.` : PEND()) + ' Between fires the Circle stays open.'),
      status: s === 'gathering' ? 'LIVE' : s === 'remembered' ? 'REMEMBERED' : 'CONNECTED', statusNote: 'Held and harvested are marked by the Circle’s keepers, never by the clock.',
      actions: [...(a ? [a] : []), { label: 'Bring something to the Council', sub: 'The Open Circle', go: '@opencircle' }],
      relations: [{ to: 'croom', dim: 'place', text: 'Back to the deck' }, ...(N.seat_you ? [{ to: 'seat_you', dim: 'place', text: 'A place for you, at the fire' }] : []), { to: 'c233rec', dim: 'place', text: 'The Open Circle, through the Treehouse door' }],
      lives: [], notes: [], location: 'The fire at the centre of the Council deck.' }; };
  N.live_fire = fireNode();
  const refresh = () => { Object.assign(N.live_fire, fireNode());
    N.croom.actions = (N.croom.actions || []).filter((x) => !/^Join the call|live fire|JOIN THE LIVE FIRE/i.test(x.label));
    const la = liveAction(); if (la) N.croom.actions.splice(S() === 'gathering' ? 0 : 1, 0, la); // during a fire, JOIN comes first
    const s = S(), h = M.lastHeld();
    N.croom.relations = [{ to: 'live_fire', dim: 'place', text: s === 'gathering' ? 'The fire is lit · join the live gathering' : s === 'afterglow' ? `The fire · ${h.name} held, embers banked` : s === 'remembered' ? 'The fire · resting' : 'The live fire · ' + (F() ? M.when(F()) : 'rests between fires') },
      ...(N.croom.relations || []).filter((r) => r.to !== 'live_fire')]; };
  refresh();

  // the Treehouse keeps the asynchronous side: the Circle record doorway, held until a public link is confirmed
  if (N.c233rec) { const rec = M.circle().record; N.c233rec.actions = (N.c233rec.actions || []).filter((x) => !/living Circle record/i.test(x.label));
    N.c233rec.actions.push(rec ? { label: 'OPEN THE LIVING CIRCLE RECORD', sub: `The shared record of Circle ${num()} · opens in a new tab`, href: rec }
      : { label: 'Open the living Circle record', sub: 'Held until a public, shareable record link is confirmed', href: null }); }
  N.croom.actions = N.croom.actions.map((x) => x.go === 'c233rec' && /living Circle record/i.test(x.label) ? { ...x, label: 'Step through the Treehouse door', sub: 'The Open Circle · between the fires' } : x);

  // ── scene: the fire answers to the manifest. Flames, logs and coals are the doorway; their light follows the state.
  const ext = (D.ext ||= { anchors: {}, views: {} }); const prev = ext.build;
  ext.build = (phase, c) => { if (prev) prev(phase, c); if (phase !== 'council') return;
    c.room.traverse((o) => { if (o.isMesh && /^(fire_flame_|hearth_log_|hearth_coal_)/.test(o.name)) o.userData.node = 'live_fire'; }); };
  // The fire's look already follows the living slot's fire (template: upcoming 0.55 · gathering 1.3 · banked coals when no
  // fire is lit). The manifest sets that slot, so before / gathering / open / afterglow read true without a second animator.

  // the Open Circle sheet's "Where and how to gather" line follows the same states
  const joinLine = () => { const s = S(), f = F(), h = M.lastHeld();
    if ((s === 'gathering' || s === 'before') && !room()) return `${s === 'gathering' ? `The ${f.name} is lit now` : `The live fire · ${M.when(f)}`} · ${PEND()}`;
    if (s === 'gathering') return `<a href="${room()}" target="_blank" rel="noopener">JOIN THE LIVE FIRE ↗</a> · the ${f.name} is lit now · ${PLAT()}, in a new tab`;
    if (s === 'before') return `<a href="${room()}" target="_blank" rel="noopener">The live fire ↗</a> · ${M.when(f)} · ${PLAT()}, in a new tab`;
    if (s === 'afterglow') return `The ${h.name} was held. The Circle stays open between fires; the next live fire will be named here.`;
    if (D.councilPresent && D.councilPresent.advanced && !f) return `${D.councilPresent.surf().fire_unknown || 'Council Fire · time to be announced'}. ${PEND()}`;
    return 'The Circle stays open between fires. The next live fire will be named here.'; };
  const fixJoin = () => document.querySelectorAll('#open-circle p.join').forEach((p) => { const html = 'Where and how to gather: ' + joinLine(); if (p.dataset.lf !== html) { p.innerHTML = html; p.dataset.lf = html; } });
  new MutationObserver(fixJoin).observe(document.documentElement, { childList: true, subtree: true });
  let lastS = null;
  setInterval(() => { const s = S(); if (s !== lastS) { lastS = s; refresh(); document.body.dataset.council = s; window.__tetol && window.__tetol.renderPanel && window.__tetol.renderPanel(); } }, 5000);
  document.body.dataset.council = lastS = S();

  const css = document.createElement('style');
  css.textContent = `#panel.live-fire .pname { text-transform: uppercase; letter-spacing: .12em; }
  #panel.live-fire .psub { font-family: var(--whisper); font-style: italic; }
  body.xD.phone:not([data-sheet="mid"]):not([data-sheet="full"]) aside#panel.live-fire { height: calc(154px + env(safe-area-inset-bottom)); }
  body.xD.phone #panel.live-fire .pbody > .actions { order: -1; margin-top: 8px; visibility: visible; }
  body.xD.phone:not([data-sheet="mid"]):not([data-sheet="full"]) #panel.live-fire .pbody > .actions > :not(:first-child) { display: none; }
  body.xD.phone:not([data-sheet="mid"]):not([data-sheet="full"]) #panel.live-fire .actions .act small { display: none; }`;
  document.head.appendChild(css);
  const mark = () => { const p = document.getElementById('panel'), id = window.TETOL_NAV && window.TETOL_NAV.where().id; if (p) p.classList.toggle('live-fire', id === 'live_fire'); };
  addEventListener('tetol:place', () => setTimeout(mark, 0)); new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true });
  window.__tetolLiveFire = { state: S, liveAction };
})();

;
// TETOL 0.9.14-dev · COUNCIL TEXT BINDING (TEOTAG, 30 Sep 2026). DEV LINE · NOT PUBLISHED.
// Inherited modules wrote two kinds of "Circle 234" text:
//   · ABOUT the Circle   ("Tree companion of Circle 234")  → stays; on turnover the adapter moves it to the remembered ring
//   · ASSERTING the now  ("This week the door names Circle 234", "has not gathered yet", "Opening Fire: Tuesday 29 September")
// Only the second kind is rebound here, from the manifest: the current Circle's number and its fire state as set by hand.
// Never inferred from the clock. With Circle 234 current and its Opening Fire marked held, only the fire wording changes.
(() => {
  const D = window.TETOL; if (!D || !D.council || !D.council.manifest) return;
  const MF = D.council.manifest, C = D.councilManifest, N = D.nodes;
  const num = () => C.current, st = () => MF.deckState(), held = () => MF.lastHeld();
  const heldDay = () => { const h = held(); if (!h || !h.start) return ''; const d = new Date(h.start);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' }); };

  // ── rules: [pattern, replacement(match…) or null to leave] — each replacement no longer matches its pattern (no loops)
  const RULES = () => {
    const n = num(), h = held(), after = st() === 'afterglow' || st() === 'remembered';
    const R = [];
    // current-Circle assertions follow the manifest number
    if (n !== 234) {
      R.push([/This week the Council of Life gathers as Circle 234/g, `This week the Council of Life gathers as Circle ${n}`],
        [/(The Treehouse door names|door names) Circle 234/g, (m, a) => `${a} Circle ${n}`],
        [/Circle 234 hangs here as a lantern/g, `Circle ${n} hangs here as a lantern`],
        [/The current Circle, named at the doorway: Circle 234/g, `The current Circle, named at the doorway: Circle ${n}`],
        [/Circle 234 is open · the Council/g, `Circle ${n} is open · the Council`],
        [/Circle 234 of the Council of Life is open now\./g, `Circle ${n} of the Council of Life is open now.`],
        [/Council of Life · Circle 234 · experimental/g, `Council of Life · Circle ${n} · experimental`],
        [/Enter Circle 234/g, `Enter Circle ${n}`],
        [/^Circle 234 · The Open Circle/g, `Circle ${n} · The Open Circle`],
        [/Tree companion of Circle 234, the current Council/g, 'Tree companion of Circle 234'],
        [/Tree companion of the current Council of Life\./g, 'Tree companion of Circle 234 · remembered.']);
    }
    // the Opening Fire, once marked held by hand
    if (after && h) {
      const day = heldDay();
      R.push([/Opening Fire:? Tuesday 29 September,? (7:30pm \(UK\)|19:30 UK)(\.?)/g, (m, t, dot) => `${h.name} held · ${day}${dot}`],
        [/Opening Fire named · Tue 29 Sep, 19:30 UK/g, `${h.name} held · ${day.replace(/day /, 'day, ')}`],
        [/Opening Fire Tuesday 29 September, 7:30pm \(UK\)/g, `${h.name} held · the Circle stays open`],
        [/The Opening Fire is named\./g, `The ${h.name} has been held.`],
        [/Circle 234 has not gathered yet, so this place is empty\./g, `Circle 234’s ${h.name} has been held. Its traces settle here after the harvest; nothing has been recorded here yet.`],
        [/Join the Opening Fire ↗/g, `${h.name} held`]);
    }
    return R;
  };
  const apply = (s) => { if (typeof s !== 'string' || !/Circle 234|Opening Fire/.test(s)) return s; let o = s; for (const [p, r] of RULES()) o = o.replace(p, r); return o; };

  // 1 · the node texts the cards and relation chips read
  const FIELDS = ['name', 'sub', 'part', 'practical', 'purpose', 'status', 'statusNote', 'question', 'location', 'text'];
  const walk = (o, depth = 0) => { if (!o || typeof o !== 'object' || depth > 4) return;
    for (const k of Object.keys(o)) { const v = o[k];
      if (typeof v === 'string' && (FIELDS.includes(k) || depth > 0)) o[k] = apply(v);
      else if (Array.isArray(v) || (v && typeof v === 'object')) walk(v, depth + 1); } };
  const bindNodes = () => { for (const id in N) walk(N[id]); if (D.circle233) for (const k of ['label', 'openShort', 'openLong']) if (typeof D.circle233[k] === 'string') D.circle233[k] = apply(D.circle233[k]); };
  bindNodes();
  // the living Circle's time line reads its own record: a fire marked held by hand gives the Gathering its date (ISO day only)
  { const h = held(), cy = D.time && D.time.cycles && D.time.cycles[233];
    if (h && h.start && cy && !cy.held && (st() === 'afterglow' || st() === 'remembered')) cy.held = h.start.slice(0, 10); }

  // 2 · text the page builds as HTML (welcome, Open Circle sheet, time lines): rewrite text nodes as they appear
  const fixText = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t;
    while ((t = w.nextNode())) { const v = t.nodeValue; if (v && /Circle 234|Opening Fire/.test(v)) { const nv = apply(v); if (nv !== v) t.nodeValue = nv; } } };
  const start = () => { fixText(document.body); new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) {
      if (n.nodeType === 3) { const nv = apply(n.nodeValue); if (nv !== n.nodeValue) n.nodeValue = nv; } else if (n.nodeType === 1) fixText(n); } })
    .observe(document.body, { childList: true, subtree: true }); };
  document.body ? start() : addEventListener('DOMContentLoaded', start);
  if (num() !== 234) document.title = document.title.replace(/Circle 234/, `Circle ${num()}`);

  // 3 · a hand-set state change (a new manifest publish) re-binds on reload; nothing here follows the clock
  D.council.bind = { apply, rebind: bindNodes };
})();

;
// Authored reading projection of existing source-owned material. NOT a species/event store.
// Scene/Council IDs are preserved. No write client, canonical binding, or organism ID.
(() => {
  const circleSource = 'https://www.notion.so/3ef15b58480d81ec84dce0c460107aa1';
  const architectureSource = 'https://www.notion.so/3e915b58480d81d69191cb11a561be2c';
  const source = (section) => ({ owner: 'Notion', page: circleSource, section, access: 'workspace access may be required', primaryAssetId: null });
  const path = {
    appearance: 'c235_flyagaric', canonicalSubject: null, bindingState: 'unresolved', organism: null,
    editorialState: 'candidate', edition: 'pre-fire', consent: 'no new personal contribution or image published',
    architectureSource,
    moments: [
      { date: '2018-11-03', dateLabel: '3 NOV 2018', type: 'Encounter', evidence: 'WITNESSED · recovered photograph record', title: 'First recovered encounter', place: 'Tadley–Wolverton', text: 'A probable, high-confidence Fly Agaric in situ. This is the earliest photograph currently recovered in this S33D thread — not a claim about the first ever encounter.', confidence: 'probable / high confidence; not a new identification', source: source('36 · Recovered S33D Amanita memory') },
      { date: '2022-10-24', dateLabel: '24 OCT 2022', type: 'Living Earth Diary · Encounter', evidence: 'WITNESSED · photographically dated', title: 'West Acre', place: 'King’s Lynn–West Acre', text: 'Fly Agaric photographed in the living world. The source also records a gathered collection; encountering and gathering remain distinct, and neither proves later use.', confidence: 'recovered photo metadata; primary photographs not embedded here', source: source('26 · First recovered Amanita diary sequence; 36 · Recovered memory') },
      { date: '2022-10-25', dateLabel: '25 OCT 2022', type: 'Council Appearance', evidence: 'APPEARED IN · recovered Council record', title: 'Council 124', place: 'Fungi of the Blooming Week', text: 'Amanita muscaria appears as the Fungi companion. The West Acre encounter was the previous day: a temporal association, not evidence that the encounter caused this choice.', confidence: 'role recorded in historical Council material', source: source('24–26 · Historical appearance lineage; 36 · Recovered memory') },
      { date: null, dateLabel: '2023–2025', type: 'Curated cluster · distinct source types', evidence: 'MEMORY · selected returns', title: 'The thread returns', place: 'Encounters · Councils · learning', text: 'Further photographs, Council appearances, learning, and recorded practice/testimony recur. Council 229 brings Fly Agaric into Focus. These are different kinds of record, not one continuous encounter.', confidence: 'selected recovered material; not a complete chronology', source: source('27 · Council 215 → Council 229 bridge; 36 · Recovered memory') },
      { date: '2026-10-06', dateLabel: 'NOW · 6 OCT 2026', type: 'Council Appearance', evidence: 'APPEARED IN · current companion', title: 'Circle 235 · yOur Blooming Week', place: 'Fungi companion · Council Fire tonight', text: 'Fly Agaric returns to the Circle. What is already blooming in us that we haven’t noticed yet?', confidence: 'current Council representation; canonical species binding unresolved', source: source('36 · Fly Agaric · weave the Living Thread') }
    ],
    relationship: {
      type: 'Related to', scope: 'species-level ecological possibility', organismAssertion: false,
      from: { name: 'Fly Agaric', scientificName: 'Amanita muscaria', canonicalSubject: null },
      to: { name: 'Silver Birch', scientificName: 'Betula pendula', canonicalSubject: null, bindingState: 'not inventoried in this pilot' },
      text: 'Fly Agaric can form ectomycorrhizal partnerships with Silver Birch.',
      source: source('24 · Interconnected resource gardens; 36 · First paired PLANeTarry garden'),
      supportedBy: 'https://cdn.forestresearch.gov.uk/1985/03/fcbk020_2ed.pdf#page=24',
      supportLocator: 'Forestry Commission · Broadleaves · birch section, printed page 22',
      representedBy: null
    }
  };
  window.TETOL_FLY_PATH = path;
})();

;
// One read-only path inside the existing TETOL. No new scene/taxonomy/library identity.
(() => {
  const path = window.TETOL_FLY_PATH;
  if (!path) return;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const style = document.createElement('style');
  style.textContent = `
  .fly-thread-launch{width:100%;min-height:48px;margin:16px 0;padding:14px;border:1px solid var(--gold,#ccb579);border-radius:12px;background:none;color:var(--ink,#fff);text-align:left;font:600 15px/1.4 var(--sans,sans-serif);cursor:pointer}
  @media(max-width:600px){body.xD.phone:not([data-sheet="mid"]):not([data-sheet="full"]) aside#panel:has(.fly-thread-launch){height:180px}body.xD.phone aside#panel .pbody>.fly-thread-launch{visibility:visible!important;margin:6px 0}}
  #fly-thread{box-sizing:border-box;width:min(740px,100vw);max-width:100vw;max-height:100dvh;margin:auto;padding:0;border:1px solid #776a45;border-radius:18px;background:#151f19;color:#f2ead8;font:16px/1.65 Georgia,serif;overscroll-behavior:contain}
  #fly-thread::backdrop{background:#07100dd9} #fly-thread *{box-sizing:border-box}
  #fly-thread .ft-nav{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:#151f19;border-bottom:1px solid #5b624b}
  #fly-thread button,#fly-thread a{touch-action:manipulation} #fly-thread button{min-height:46px;padding:10px 14px;border:1px solid #8e835a;border-radius:10px;background:#25372b;color:#f2ead8;font:600 14px/1.35 system-ui;cursor:pointer}
  .fly-thread-launch,#fly-thread button[data-ft=birch]{background:#c9ac65;color:#18231b;border-color:#dbc58b}
  #fly-thread button:focus-visible,#fly-thread a:focus-visible{outline:3px solid #edd291;outline-offset:3px}
  #fly-thread .ft-body{padding:28px clamp(18px,5vw,42px) 40px} #fly-thread h1{font-size:clamp(30px,7vw,44px);line-height:1.15;font-weight:normal;margin:10px 0}
  #fly-thread h2{font-size:25px;line-height:1.3;font-weight:normal;margin:5px 0 12px} #fly-thread p{margin:12px 0}
  #fly-thread .ft-eyebrow{font:600 12px/1.5 system-ui;letter-spacing:.1em;text-transform:uppercase;color:#d8c28a}
  #fly-thread .ft-meta{font:13px/1.6 system-ui;color:#c9cfbb} #fly-thread .ft-path{border-left:1px solid #bba06b;margin:28px 0 0 7px;padding-left:24px}
  #fly-thread article{position:relative;margin:0 0 26px;padding:16px 18px;border:1px solid #56634c;border-radius:12px;background:#1c2a20}
  #fly-thread article:before{content:'';position:absolute;width:9px;height:9px;left:-30px;top:24px;border-radius:50%;background:#dec285;box-shadow:0 0 12px #bd985840}
  #fly-thread .ft-gap{margin:0 0 24px;padding:6px 14px;border-left:2px dotted #9eaa89;font:14px/1.6 system-ui;color:#d1d7c5}
  #fly-thread .ft-rel{padding:22px;border:1px solid #b6a16c;border-radius:14px;background:linear-gradient(145deg,#29392a,#15221c)}
  #fly-thread blockquote{font-size:23px;line-height:1.45;margin:18px 0;color:#ead7a7} #fly-thread a{color:#e5cf96;overflow-wrap:anywhere}
  #fly-thread summary{min-height:44px;cursor:pointer;font:14px/1.5 system-ui;padding:10px 0} #fly-thread details{margin-top:12px}
  #fly-thread .ft-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px} #fly-thread .ft-binding{border-top:1px solid #59644d;padding-top:15px;margin-top:28px;font:13px/1.6 system-ui;color:#c9cfbb}
  @media(max-width:520px){#fly-thread{height:100dvh;max-height:100dvh;border-radius:0}#fly-thread .ft-nav button{flex:1;min-width:120px}#fly-thread .ft-body{padding-top:20px}#fly-thread article{padding:14px}}
  @media(prefers-reduced-motion:reduce){#fly-thread{scroll-behavior:auto}}`;
  document.head.appendChild(style);
  const dialog = document.createElement('dialog');
  dialog.id = 'fly-thread'; dialog.setAttribute('aria-label','Fly Agaric Living Thread');
  document.body.appendChild(dialog);
  let threadScroll = 0, trigger = null, returningToFire = false;
  const nav = () => `<nav class="ft-nav" aria-label="Return paths"><button type="button" data-ft="fly">Back to Fly Agaric</button><button type="button" data-ft="fire">Return to Circle 235 Fire</button></nav>`;
  const provenance = m => `<details><summary>Evidence & source</summary><p class="ft-meta">${esc(m.evidence)}<br>${esc(m.confidence)}</p><p class="ft-meta">Supported by the existing Circle 235 curation, §${esc(m.source.section)}. Primary photographs are not reproduced here.</p><a href="${esc(m.source.page)}" target="_blank" rel="noopener noreferrer">Read the Circle source ↗</a><p class="ft-meta">Notion workspace access may be required.</p></details>`;
  function thread() {
    dialog.innerHTML = nav()+`<div class="ft-body"><div class="ft-eyebrow">Remember · Living Earth Diaries</div><h1>Fly Agaric</h1><p><i>Amanita muscaria</i></p><p>A red cap in the leaves. A remembered moment. A thread that returns to the fire.</p><p class="ft-meta">Remembered S33D moments · Circle 235 · living thread. One Tree · many interfaces · one living memory.</p><div class="ft-path">${path.moments.map((m,i)=>`${i===1?'<div class="ft-gap">2018 → 2022 · documentary gap<br>No recovered moments bridge this gap yet. The thread resumes in 2022; continuity is not assumed.</div>':''}<article><div class="ft-eyebrow">${esc(m.dateLabel)}</div><h2>${esc(m.title)}</h2><div class="ft-meta">${esc(['ENCOUNTER','ENCOUNTER','COUNCIL APPEARANCE','RETURN','NOW'][i])} · ${esc(m.place)}</div><p>${esc(m.text)}</p>${i===3?`<details><summary>Glimpse the returns</summary><p>West Acre photographs in 2023 and 2024; repeated Council appearances; learning and historically recorded practice/testimony; Council 229 · Fly Agaric in Focus.</p><p class="ft-meta">Practice records are historical. Personal experience is testimony, not evidence of general efficacy. Nothing here infers that gathered mushrooms were later used.</p><p class="ft-meta"><i>A. muscaria</i> ≠ <i>A. fulva</i> ≠ <i>A. pantherina</i>. Related names in the archive remain distinct species. Source-year discrepancies and carried-forward copies are not silently normalised.</p></details>`:''}${provenance(m)}</article>`).join('')}</div><section class="ft-rel" aria-labelledby="ft-reveal"><div class="ft-eyebrow">Relate · Fly Agaric ↔ Silver Birch</div><h2 id="ft-reveal">Who is this fungus growing with?</h2><p>${esc(path.relationship.text)}</p><p class="ft-meta">A species-level possibility. A photograph beside a tree does not establish an underground partnership with that particular tree.</p><blockquote>What looks like an individual may be the visible moment of a much larger relationship.</blockquote><div class="ft-meta">REFLECTION · learning line</div><div class="ft-actions"><button type="button" data-ft="birch">Follow → Silver Birch</button></div><details><summary>Supported by · represented by</summary><p class="ft-meta">SUPPORTED BY · Circle 235 §24 / §36 and Forestry Commission, <i>Broadleaves</i>, birch section. This source supports the ecological relationship, not a particular encounter.</p><a href="${esc(path.relationship.supportedBy)}" target="_blank" rel="noopener noreferrer">Read the ecological source ↗</a><p class="ft-meta">REPRESENTED BY · the Council’s existing Fly Agaric illustration/scene. Representation is not photographic encounter evidence.</p></details></section><p class="ft-binding">Canonical S33D Fly Agaric binding: unresolved. <code>c235_flyagaric</code> remains the Council/spatial identity. No new species, Hive, organism or encounter record has been created.</p></div>`;
    dialog.scrollTop = threadScroll;
  }
  function birch() {
    threadScroll = dialog.scrollTop;
    dialog.innerHTML = nav()+`<div class="ft-body"><div class="ft-eyebrow">PLANeTarry · follow a relationship</div><h1>Silver Birch</h1><p><i>Betula pendula</i></p><p>Follow the red cap beneath the leaves, towards the roots of Silver Birch. Here the thread opens into another living being.</p><section class="ft-rel"><h2>Root meets fungus</h2><p>${esc(path.relationship.text)}</p><p>A possible partnership beneath the ground. We have not witnessed a particular Fly Agaric and Birch together in the moments shown here.</p><p class="ft-meta">SUPPORTED BY · <a href="${esc(path.relationship.supportedBy)}" target="_blank" rel="noopener noreferrer">Forestry Commission · birch section ↗</a></p></section><blockquote>Who might be growing with the Birch you meet?</blockquote><div class="ft-meta">QUESTION · no encounter claimed</div><div class="ft-actions"><button type="button" data-ft="thread">Follow back → Fly Agaric’s thread</button></div><p class="ft-binding">This pilot has not verified a canonical S33D Birch binding. Existing Birch identities remain with their owning records.</p></div>`;
    dialog.scrollTop = 0;
  }
  function open(button) { trigger=button; thread(); dialog.showModal(); dialog.querySelector('button').focus(); }
  dialog.addEventListener('click', e => {
    const action=e.target.closest('[data-ft]')?.dataset.ft; if(!action)return;
    if(action==='birch')birch();
    else if(action==='thread')thread();
    else {dialog.close(); if(action==='fire'){returningToFire=true;window.TETOL_NAV?.do('goTo','croom');}else{window.TETOL_NAV?.do('goTo',path.appearance);trigger?.focus();}}
  });
  dialog.addEventListener('close',()=>trigger?.focus());
  // Only this pilot's existing companion doorway: avoid inherited sheet pointer
  // gestures swallowing the click after scrolling. Reuse the normal nav intent.
  document.addEventListener('click',e=>{
    const b=e.target.closest('#panel [data-go="c235_flyagaric"]');
    if(!b || e.detail===0)return;
    e.preventDefault();e.stopPropagation();window.TETOL_NAV?.do('goTo',path.appearance);
  },true);
  function attach(){
    if(returningToFire && window.TETOL_NAV?.where().id==='croom'){
      const grab=document.querySelector('#grab');
      returningToFire=false;
      if(grab?.getAttribute('aria-expanded')==='false')grab.click();
    }
    if(window.TETOL_NAV?.where().id!==path.appearance)return;
    const body=document.querySelector('#panel .pbody'); if(!body||body.querySelector('.fly-thread-launch'))return;
    const b=document.createElement('button');b.type='button';b.className='fly-thread-launch';b.textContent='Follow its Living Thread ↓';b.onclick=()=>open(b);
    const after=body.querySelector('.psub')||body.querySelector('.actions');after?after.after(b):body.appendChild(b);
  }
  new MutationObserver(attach).observe(document.querySelector('#panel'),{childList:true,subtree:true});
  addEventListener('tetol:place',attach); attach();
})();

;
// Presentation adapter, not a species/event store. Source-owned memories remain in TETOL_FLY_PATH.
(() => {
 const path=window.TETOL_FLY_PATH;if(!path)return;
 const woodland='https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/fungi-and-lichens/fly-agaric/';
 const kew='https://www.kew.org/read-and-watch/kew-scientists-pick-their-favourite-fungus';
 const subject=window.TETOL_LEARNING_SUBJECT={
  name:'Fly Agaric',scientificName:'Amanita muscaria',appearance:path.appearance,canonicalSubject:null,bindingState:path.bindingState,
  sourcePath:path,illustration:'Educational diagram · simplified, not to scale · not an encounter photograph',
  steps:[
   {key:'meet',label:'Meet',question:'What do you notice?',line:'A red cap rises through the leaves. Look slowly. What catches your eye?',next:'Look closer'},
   {key:'closer',label:'Look closer',question:'What is beneath the cap?',line:'Choose a part of the diagram. Each small detail opens another question.',next:'Go underground'},
   {key:'underground',label:'Underground',question:'Is the mushroom the whole fungus?',line:'The mushroom is a fruiting body. Fine fungal threads called mycelium grow through the soil. Reveal the hidden relationship.',next:'Discover a relationship'},
   {key:'relationship',label:'Relationships',question:'Who is this fungus growing with?',line:path.relationship.text,next:'Science, story & memory'},
   {key:'knowing',label:'Ways of knowing',question:'How do we know?',line:'A scientific explanation, a story and a remembered encounter can each tell us something different.',next:'Follow our Living Thread'},
   {key:'memory',label:'Living Thread',question:'When have we met before?',line:'A Living Thread is not a complete biography. It is the pattern that becomes visible through the moments we have actually remembered.',next:'Ask & return outside'},
   {key:'return',label:'Return to Life',question:'What will you look for outside?',line:'Look for a fungus without disturbing it. What trees grow nearby? Take a photograph and ask an adult what they notice.',next:null}
  ],
  anatomy:[
   {key:'cap',name:'Cap',text:'The red or orange cap shelters the gills beneath it.',source:woodland},
   {key:'spots',name:'White spots',text:'These are remnants of a veil that enclosed the young mushroom. Rain can wash some away.',source:woodland},
   {key:'gills',name:'Gills',text:'The pale folds beneath the cap bear spores.',source:woodland},
   {key:'stem',name:'Stem',text:'The pale stalk holds the cap above the ground.',source:woodland},
   {key:'ring',name:'Ring',text:'A skirt-like ring hangs around the stem.',source:woodland},
   {key:'base',name:'Base',text:'The stem widens at its base. Leave wild mushrooms in place; this diagram lets us look without digging.',source:woodland},
   {key:'spores',name:'Spores',text:'Tiny spores are released from the gills. They are too small to see individually here; the drawn dots are enlarged.',source:'https://www.rhs.org.uk/gardens/pdf/rhs-gardens/fly-agaric-fact-sheet.pdf'}
  ],
  knowledge:{
   science:{label:'VERIFIED · sourced ecological explanation',text:'Mycelium links closely with tree roots. The fungus can supply water and nutrients; the tree supplies sugars made using sunlight.',source:kew,sourceLabel:'Kew · Fungarium curator'},
   story:{label:'TRADITION / LORE · cultural imagery',text:'The red-and-white toadstool appears in fairy-tale imagery. That is a human story, not evidence about a particular fungus or tree.',source:woodland,sourceLabel:'Woodland Trust · folklore context'},
   memory:{label:'WITNESSED · recovered S33D curation',text:'S33D has recovered a probable Fly Agaric photograph from Tadley–Wolverton, dated 3 November 2018. The original photograph is not reproduced in this prototype.',source:path.moments[0].source.page,sourceLabel:'Circle 235 · §36 · workspace access may be required'}
  },
  safety:'LOOK · LEARN · PHOTOGRAPH · ASK AN ADULT',
  safetyDetail:'Fly Agaric is poisonous. Leave it in place; meet with care; never eat. This learning view cannot tell you a wild mushroom is safe to eat.',
  scienceSource:woodland,undergroundSource:kew
 };
 subject.moments = path.moments.slice(0,1).concat([{"date": null, "dateLabel": "22 OCT 2022", "type": "Encounter", "title": "King’s Lynn–Pentney", "text": "Fly Agaric was photographed beside a living tree. Nearby does not prove a fungal partnership. A photograph with Max remains private and is not reproduced.", "evidence": "WITNESSED · recovered photograph record", "confidence": "Recovered Circle 235 §36 curation; underlying original not independently inspected", "source": {"page": "https://www.notion.so/3ef15b58480d81ec84dce0c460107aa1", "section": "36 · Recovered S33D Amanita memory", "primaryAssetId": null}}],path.moments.slice(1,3),[{"date": null, "dateLabel": "DEC 2022 · FEB 2023", "type": "Council Appearance", "title": "Councils 132 and 139", "text": "Amanita returns in the recovered Council material. An appearance records what the Council chose, not a new field encounter.", "evidence": "REFLECTION · source-held Council record", "confidence": "Recovered Circle 235 §36 curation; underlying original not independently inspected", "source": {"page": "https://www.notion.so/3ef15b58480d81ec84dce0c460107aa1", "section": "36 · Recovered S33D Amanita memory", "primaryAssetId": null}}, {"date": null, "dateLabel": "4 OCT · 22 OCT 2023", "type": "Encounter", "title": "West Acre and King’s Lynn", "text": "Young Fly Agaric in situ at West Acre on 4 October; two in situ at King’s Lynn on 22 October. These remain separate dated moments.", "evidence": "WITNESSED · recovered photograph records", "confidence": "Recovered Circle 235 §36 curation; underlying original not independently inspected", "source": {"page": "https://www.notion.so/3ef15b58480d81ec84dce0c460107aa1", "section": "36 · Recovered S33D Amanita memory", "primaryAssetId": null}}, {"date": null, "dateLabel": "NOV · DEC 2023", "type": "Council Appearance", "title": "Councils 174 and 179", "text": "Further Fly Agaric appearances survive in the Council material. Some other Council source years remain unresolved.", "evidence": "REFLECTION · source-held Council records", "confidence": "Recovered Circle 235 §36 curation; underlying original not independently inspected", "source": {"page": "https://www.notion.so/3ef15b58480d81ec84dce0c460107aa1", "section": "36 · Recovered S33D Amanita memory", "primaryAssetId": null}}, {"date": null, "dateLabel": "3 NOV 2024", "type": "Encounter", "title": "King’s Lynn–Pentney", "text": "A young Fly Agaric was photographed in situ. Original image identifiers have not been recovered into this candidate.", "evidence": "WITNESSED · recovered photograph record", "confidence": "Recovered Circle 235 §36 curation; underlying original not independently inspected", "source": {"page": "https://www.notion.so/3ef15b58480d81ec84dce0c460107aa1", "section": "36 · Recovered S33D Amanita memory", "primaryAssetId": null}}, {"date": null, "dateLabel": "OCT 2024", "type": "Picture appearance", "title": "Circle 215", "text": "Amanita appears in the picture layer. Blue Roundhead was the named Fungi companion: those roles are different.", "evidence": "REFLECTION · source-held Council record", "confidence": "Recovered Circle 235 §36 curation; underlying original not independently inspected", "source": {"page": "https://www.notion.so/3ef15b58480d81ec84dce0c460107aa1", "section": "36 · Recovered S33D Amanita memory", "primaryAssetId": null}}, {"date": null, "dateLabel": "NOV 2025", "type": "Council focus", "title": "Council 229", "text": "Fly Agaric in Focus brings learning, story and caution together. Its older spiritual or historical claims need their own evidence; a Council record cannot verify them.", "evidence": "REFLECTION · source-held learning record", "confidence": "Recovered Circle 235 §36 curation; underlying original not independently inspected", "source": {"page": "https://www.notion.so/3ef15b58480d81ec84dce0c460107aa1", "section": "36 · Recovered S33D Amanita memory", "primaryAssetId": null}}],path.moments.slice(4));
 subject.moments = subject.moments.map(m=>({...m,evidence:m.type.includes('Council')||m.type==='Picture appearance'?'WITNESSED · recovered Council record; not a field encounter':m.evidence}));
 const autumn=subject.moments.findIndex(m=>m.title==='Circle 215'),november=subject.moments.findIndex(m=>m.dateLabel==='3 NOV 2024');
 if(autumn>november)[subject.moments[autumn],subject.moments[november]]=[subject.moments[november],subject.moments[autumn]];
 subject.memoryBoundary = "PERSONAL TESTIMONY · older S33D practice records are preserved in the source, not clinical evidence. Preparation instructions are outside this child-facing journey. No original photographs or private family media are republished.";
 function renderWoodland(mode,{opened,part}){
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
 const below=mode==='underground'||mode==='relationship',isBirch=mode==='relationship';
 return `<figure class="ll-visual ${opened||isBirch?'is-open':''}"><svg viewBox="0 0 700 410" role="img" aria-label="${below?'Simplified mushroom, fungal threads and tree roots below ground':'Illustrated Fly Agaric showing a cap, pale spots, gills, stem, ring and base'}"><defs><linearGradient id="ll-cap" x2=".2" y2="1"><stop stop-color="#e98f61"/><stop offset=".5" stop-color="#bd4d32"/><stop offset="1" stop-color="#792d22"/></linearGradient><linearGradient id="ll-stem" x2="1" y2="0"><stop stop-color="#b7b092"/><stop offset=".5" stop-color="#f3e4c3"/><stop offset="1" stop-color="#b9aa85"/></linearGradient></defs>
 <g opacity=".22" stroke="#a6bc88" fill="none"><path d="M50 0 Q110 145 76 260M620 0Q550 145 620 260M550 0Q490 145 550 250" stroke-width="18"/><path d="M76 190L25 132M592 145L665 100" stroke-width="9"/></g>
 <path d="M0 274Q180 258 340 272T700 270V410H0Z" fill="#263327"/><g fill="#988252" opacity=".5"><ellipse cx="113" cy="268" rx="29" ry="7" transform="rotate(-25 113 268)"/><ellipse cx="290" cy="279" rx="26" ry="6"/><ellipse cx="586" cy="263" rx="24" ry="6"/></g>
 <g id="ll-drawing-mushroom"><path data-part="base" d="M211 258Q197 290 223 298Q252 304 248 275L238 254Z" fill="url(#ll-stem)"/><path data-part="stem" d="M213 148Q221 204 210 268Q230 277 247 264L239 145Z" fill="url(#ll-stem)"/><path data-part="ring" d="M211 179L195 199Q223 207 258 198L239 179Z" fill="#eee1bf"/><path data-part="gills" d="M128 144Q230 189 330 142Q220 133 128 144" fill="#dfd4b4"/>
 <g stroke="#9f9071" stroke-width="1.4">${Array.from({length:17},(_,i)=>`<path d="M225 149L${133+i*12} ${145+Math.sin(i/16*Math.PI)*26}"/>`).join('')}</g><path data-part="cap" d="M110 144Q140 70 222 63Q297 66 342 145Q224 165 110 144Z" fill="url(#ll-cap)"/>
 <g data-part="spots" fill="#f1e7cc">${[[160,118,7],[199,92,8],[241,89,6],[273,118,8],[229,135,6],[302,138,5],[144,140,5],[190,143,4]].map(([x,y,r])=>`<path d="M${x-r} ${y}l${r} ${-r*.7}l${r} ${r*.6}l${-r*.2} ${r*.9}l${-r*1.5} ${r*.1}Z"/>`).join('')}</g>
 <g data-part="spores" fill="#eee6cf" opacity="${mode==='closer'&&part==='spores'?1:.12}">${[[156,189],[147,220],[171,244],[292,192],[303,216],[284,249]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g></g>
 ${below?`<g class="ll-hidden"><path class="ll-root" d="M536 251Q507 313 424 329T310 369M536 285Q575 337 662 350M484 311L473 375M424 329L393 390M598 337L610 380"/><g class="ll-mycelium">${Array.from({length:12},(_,i)=>`<path d="M229 285Q${180+i*13} ${312+i*3} ${55+i*46} ${360+(i%3)*17}m-8 -5l-15 15m22 -10l18 12"/>`).join('')}</g><text x="54" y="333" fill="#eee3bb" font-size="17">Mycelium</text><text x="530" y="398" fill="#dac396" font-size="17">Tree roots</text></g>`:''}
 ${isBirch?`<g><path d="M527 263L515 78Q525 64 542 77L548 265Z" fill="#e9e5d6"/><path d="M517 114l20 4m-17 32l18 4m-15 42l20 3m-22 29l22 4" stroke="#34483b" stroke-width="5"/><g fill="#849c62"><ellipse cx="527" cy="50" rx="72" ry="45"/><ellipse cx="482" cy="78" rx="52" ry="35"/><ellipse cx="578" cy="76" rx="45" ry="32"/></g><text x="475" y="173" fill="#f5eddb" font-size="17">Silver Birch</text></g>`:''}
 </svg></figure><p class="ll-small">${esc(subject.illustration)}</p>`;
 }
 subject.visual=renderWoodland;
})();

;
// Small reusable renderer: adapter supplies subject, steps, source-owned path and relationships.
(() => {
 const subject=window.TETOL_LEARNING_SUBJECT;if(!subject)return;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const style=document.createElement('style');style.textContent=`
 #living-learning{width:min(820px,100vw);max-width:100vw;height:min(960px,100dvh);max-height:100dvh;margin:auto;padding:0;border:1px solid #8f8763;border-radius:20px;background:#15241d;color:#f1ead6;font:17px/1.6 Georgia,serif;overflow:auto;overscroll-behavior:contain}
 #living-learning::backdrop{background:#06110ee8}#living-learning *{box-sizing:border-box;text-transform:none;font-variant:normal}#living-learning .ll-header{width:100%;max-width:none;flex-direction:row;text-align:left;margin:0;border-radius:0;box-shadow:none;position:sticky;top:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;background:#15241df5;border-bottom:1px solid #53654d;font:12px/1.4 system-ui;color:#d5c58d}
 #living-learning button{min-height:48px;padding:12px 17px;border:1px solid #94815a;border-radius:12px;background:#283b2d;color:#f6efd8;font:600 14px/1.4 var(--sans,system-ui);cursor:pointer;touch-action:manipulation}#living-learning button:focus-visible,#living-learning a:focus-visible,#living-learning textarea:focus-visible,#living-learning summary:focus-visible{outline:3px solid #e6c680;outline-offset:3px}#living-learning button:disabled{opacity:.4;cursor:default}#living-learning button[aria-pressed=true],#living-learning .ll-primary{background:#d6bd7f;color:#18251e}
 #living-learning .ll-body{padding:24px clamp(20px,5vw,46px) 40px}#living-learning h1{font:normal clamp(32px,6vw,46px)/1.12 Georgia,serif;margin:8px 0 15px}#living-learning h2{font:normal 27px/1.25 Georgia,serif;margin:12px 0}#living-learning p{margin:10px 0 18px}#living-learning .ll-small{font:13px/1.6 system-ui;color:#c1ccb6}#living-learning .ll-eye{font:12px/1.4 system-ui;letter-spacing:.1em;text-transform:uppercase;color:#d6bd7f}
 #living-learning .ll-visual{position:relative;margin:20px 0 6px;border-radius:24px;overflow:hidden;background:radial-gradient(ellipse at 45% 15%,#60745266,transparent 60%),linear-gradient(#263c30,#10211c);border:1px solid #53654d}#living-learning svg{display:block;width:100%;height:auto;max-height:400px}#living-learning .ll-actions{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}#living-learning .ll-actions button{flex:1;min-width:145px}#living-learning .ll-parts{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}#living-learning .ll-parts button{flex:1;min-width:100px}
 #living-learning .ll-discovery{min-height:112px;padding:18px 22px;border-left:2px solid #dac381;background:#26382b;border-radius:0 15px 15px 0}#living-learning .ll-safety{position:static;inset:auto;transform:none;width:auto;height:auto;max-height:none;display:block;box-shadow:none;padding:15px 18px;border:1px solid #99845a;border-radius:14px;margin-top:24px;font:13px/1.6 system-ui}#living-learning a{color:#e5cc90;overflow-wrap:anywhere}#living-learning .ll-knowing{display:flex;gap:8px;flex-wrap:wrap}#living-learning .ll-knowing button{flex:1}
 #living-learning .ll-memory{margin:22px 0;padding:0 0 0 22px;border-left:1px solid #ab946a}#living-learning article{margin:0 0 26px}#living-learning details{font:13px/1.6 system-ui}#living-learning summary{min-height:48px;padding:12px 0;cursor:pointer}#living-learning textarea{width:100%;min-height:120px;background:#1c3025;color:#f5ecd9;border:1px solid #8e9b74;border-radius:12px;padding:14px;font:17px/1.5 Georgia,serif}#living-learning .ll-footer{display:flex;justify-content:space-between;gap:12px;margin-top:26px}#living-learning .ll-footer button{flex:1}
 #living-learning .ll-hidden{opacity:0;transition:opacity .65s ease}#living-learning .is-open .ll-hidden{opacity:1}#living-learning .ll-focus{filter:drop-shadow(0 0 8px #e5cf9a);stroke:#ffe2a2;stroke-width:3}#living-learning .ll-root{stroke:#b49160;fill:none;stroke-width:6;stroke-linecap:round}#living-learning .ll-mycelium{stroke:#e5dec7;fill:none;stroke-width:2;stroke-linecap:round}
 @media(max-width:540px){#living-learning{height:100dvh;border-radius:0}#living-learning .ll-header{padding:10px 16px}#living-learning .ll-body{padding:22px 20px 32px}#living-learning svg{max-height:320px}#living-learning .ll-footer{flex-wrap:wrap}#living-learning .ll-header button{font-size:13px}}
 @media(prefers-reduced-motion:reduce){#living-learning .ll-hidden{transition:none}}`;
 document.head.append(style);
 const dialog=document.createElement('dialog');dialog.id='living-learning';dialog.setAttribute('aria-label','Living learning journey');document.body.append(dialog);
 let step=0,part='cap',opened=false,way='science',draft='',birch=false,trigger=null,bypass=false,returningToCircle=false;
 const sourceLink=(href,label)=>/notion\.(so|com|site)/.test(href)?`<span class="ll-small">${esc(label)} · workspace-held source; not a public doorway.</span>`:`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
 const woodland=mode=>subject.visual(mode,{opened,part});

 function render(){
 const s=subject.steps[step];dialog.innerHTML=`<header class="ll-header"><span>LOCAL LEARNING CANDIDATE<br>${esc(s.label)} · ${step+1} / ${subject.steps.length}</span><button data-ll="close">Back to Circle</button></header><main class="ll-body"><div class="ll-eye">${esc(subject.name)} · <i>${esc(subject.scientificName)}</i></div><h1 tabindex="-1">${esc(birch?'Meet Silver Birch':s.question)}</h1><p>${esc(birch?'A pale trunk above. Roots and relationships below.':s.line)}</p>${content(s.key)}
 <aside class="ll-safety"><strong>${esc(subject.safety)}</strong><br>${esc(subject.safetyDetail)}</aside>
 <details><summary>Sources & identity</summary><p>${sourceLink(subject.scienceSource,'Woodland Trust · anatomy and safety')}<br>${sourceLink(subject.undergroundSource,'Kew · fungus and tree exchange')}</p><p>Scientific name shown for learning. The S33D species binding is unresolved. This Council appearance is not a canonical organism record. Source-owned encounters and memories remain separate.</p></details>
 <div class="ll-footer"><button data-ll="prev" ${step===0?'disabled':''}>← Back</button>${s.next?`<button class="ll-primary" data-ll="next">${esc(s.next)} →</button>`:'<button class="ll-primary" data-ll="close">Return to Circle →</button>'}</div></main>`;
 dialog.scrollTop=0;dialog.querySelector('h1').focus({preventScroll:true});highlight();
 }
 function content(key){
 if(key==='meet')return woodland('meet')+'<p class="ll-small">NOTICE · a question, not an identification test.</p>';
 if(key==='closer'){const a=subject.anatomy.find(a=>a.key===part);return woodland('closer')+`<div class="ll-parts" aria-label="Explore the mushroom">${subject.anatomy.map(a=>`<button data-ll="part" data-key="${a.key}" aria-pressed="${a.key===part}">${a.name}</button>`).join('')}</div><section class="ll-discovery" aria-live="polite"><strong>${esc(a.name)}</strong><p>${esc(a.text)}</p>${sourceLink(a.source,'Science source')}</section>`;}
 if(key==='underground')return woodland('underground')+`<button class="ll-primary" data-ll="reveal" aria-expanded="${opened}">${opened?'Hide the underground view':'Open the earth ↓'}</button><div class="ll-discovery" aria-live="polite"><p>${opened?'Mycelium is a network of fungal threads. Here it is drawn beside tree roots so we can explore a possible partnership. This is an explanation, not a map of a photographed encounter.':'There is more to this being than we can see above the leaves.'}</p>${sourceLink(subject.undergroundSource,'Science source')}</div>`;
 if(key==='relationship')return woodland('relationship')+`<p class="ll-small">Species-level possibility. These drawn roots do not document a specific S33D mushroom–tree pair.</p><div class="ll-actions"><button data-ll="birch" aria-pressed="${birch}">${birch?'Follow back → Fly Agaric':'Follow → Silver Birch'}</button></div>${birch?`<section class="ll-discovery"><h2>Root meets fungus</h2><p>${esc(subject.sourcePath.relationship.text)}</p><p>Which trees are growing near a fungus you meet? Nearby is a clue, not proof of a partnership.</p><p class="ll-small">Birch's canonical S33D binding has not been inventoried in this candidate.</p></section>`:''}${sourceLink(subject.sourcePath.relationship.supportedBy,'Forestry Commission · birch section')}`;
 if(key==='knowing'){const k=subject.knowledge[way];return `<div class="ll-knowing" aria-label="Ways of knowing">${Object.keys(subject.knowledge).map(w=>`<button data-ll="way" data-key="${w}" aria-pressed="${w===way}">${w[0].toUpperCase()+w.slice(1)}</button>`).join('')}</div><section class="ll-discovery" aria-live="polite"><div class="ll-eye">${esc(k.label)}</div><p>${esc(k.text)}</p>${sourceLink(k.source,k.sourceLabel)}</section><p class="ll-small">REFLECTION · What changes when we say “we know”, “we tell a story”, or “we remember”?</p>`;}
 if(key==='memory')return `<div class="ll-memory">${subject.moments.map((m,i)=>`${i===1?'<p class="ll-small">2018 → 2022 · documentary gap. No continuity is claimed.</p>':''}<article><div class="ll-eye">${esc(m.dateLabel)} · ${esc(m.type)}</div><p class="ll-small">${esc(m.evidence)}</p><h2>${esc(m.title)}</h2><p>${esc(m.text)}</p><details><summary>Evidence & source</summary><p>${esc(m.evidence)}<br>${esc(m.confidence)}</p><p>${esc(m.source.section)} · recovered curation; original asset/record not independently inspected here.</p>${sourceLink(m.source.page,'Source-owned memory · workspace access may be required')}</details></article>`).join('')}</div><p class="ll-small">This selected path is incomplete. The entries are projections of recovered curation; original photographs and historical Council pages have not all been independently checked. Some source years remain unresolved. ${esc(subject.memoryBoundary)}</p><div class="ll-actions"><button data-ll="archive">Explore the existing memory view →</button></div>`;
 return `<div class="ll-eye">QUESTION · your contribution</div><label for="ll-question">What question would you carry outside?</label><textarea id="ll-question" placeholder="I wonder…">${esc(draft)}</textarea><p class="ll-small">Only held while this page is open. Nothing is saved or submitted. Save is awaiting a verified Offering connection. Keep your question in your own notebook for now.</p><button disabled aria-describedby="ll-save-boundary">SAVE · awaiting connection</button><p id="ll-save-boundary" class="ll-small">Saving will preserve an Offering and its source context. Human curation into collective Heartwood is a separate decision; asking here does not create Heartwood memory.</p><section class="ll-discovery"><h2>Three things to try</h2><p>Look without disturbing.<br>Photograph without picking.<br>Ask an adult and notice the trees nearby.</p></section><div class="ll-actions"><button data-ll="relationship">Revisit the underground relationship</button></div>`;
 }
 function highlight(){if(step!==1)return;const shape=dialog.querySelector(`[data-part="${part}"]`);shape?.classList.add('ll-focus');}
 function open(b){trigger=b;step=0;birch=false;render();dialog.showModal();dialog.querySelector('h1').focus();}
 function close(toCircle=false){dialog.close();if(toCircle){returningToCircle=true;window.TETOL_NAV?.do('goTo','croom');label();}else trigger?.focus();}
 dialog.addEventListener('click',e=>{const b=e.target.closest('[data-ll]');if(!b)return;const a=b.dataset.ll;
  if(a==='close')close(true);else if(a==='archive'){close();bypass=true;trigger?.click();bypass=false;}else{
   if(a==='next')step=Math.min(step+1,subject.steps.length-1);if(a==='prev')step=Math.max(step-1,0);
   if(a==='part')part=b.dataset.key;if(a==='way')way=b.dataset.key;if(a==='reveal')opened=!opened;if(a==='birch')birch=!birch;if(a==='relationship')step=3;
   render();if(['part','way','reveal','birch'].includes(a))dialog.querySelector(`[data-ll="${a}"]${b.dataset.key?`[data-key="${b.dataset.key}"]`:''}`)?.focus({preventScroll:true});
  }});
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 dialog.addEventListener('input',e=>{if(e.target.id==='ll-question')draft=e.target.value;});
 dialog.addEventListener('close',()=>trigger?.focus());
 document.addEventListener('click',e=>{const b=e.target.closest('.fly-thread-launch');if(!b||bypass)return;e.preventDefault();e.stopImmediatePropagation();open(b);},true);
 function label(){if(returningToCircle&&window.TETOL_NAV?.where().id==='croom'){returningToCircle=false;const grab=document.querySelector('#grab');if(grab?.getAttribute('aria-expanded')==='false')grab.click();}document.querySelectorAll('.fly-thread-launch').forEach(b=>{if(b.textContent!=='Meet · Look closer · Follow its Living Thread ↓')if(b.textContent!=='Meet · Look closer · Follow its Living Thread ↓')if(b.textContent!=='Meet · Look closer · Follow its Living Thread ↓')if(b.textContent!=='Meet · Look closer · Follow its Living Thread ↓')if(b.textContent!=='Meet · Look closer · Follow its Living Thread ↓')if(b.textContent!=='Meet · Look closer · Follow its Living Thread ↓')if(b.textContent!=='Meet · Look closer · Follow its Living Thread ↓')b.textContent='Meet · Look closer · Follow its Living Thread ↓';});}
 const panel=document.querySelector('#panel');if(panel)new MutationObserver(label).observe(panel,{childList:true,subtree:true});label();
})();

;
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <three-d-stage> — 3D object viewer + exporter shell (three.js).
 *
 * The stage owns the whole scene: WebGL renderer, neutral studio lighting
 * with a soft ground shadow, orbit controls (drag to orbit, wheel to zoom,
 * right-drag to pan), a camera auto-framed to the object's bounds, resize
 * handling, and a download toolbar that exports the current object as
 * OBJ + MTL or GLB (binary glTF). FBX cannot be exported in the browser;
 * GLB is the interchange format every modern 3D tool imports.
 *
 * three.js loads through the page's import map. Include this EXACT pinned
 * map in <head>, before any module runs — versions and integrity hashes
 * stay together (same map the "3D object" skill mandates):
 *
 *   <script type="importmap">
 *   {
 *     "imports": {
 *       "three": "https://unpkg.com/three@0.184.0/build/three.module.js",
 *       "three/addons/controls/OrbitControls.js": "https://unpkg.com/three@0.184.0/examples/jsm/controls/OrbitControls.js",
 *       "three/addons/exporters/OBJExporter.js": "https://unpkg.com/three@0.184.0/examples/jsm/exporters/OBJExporter.js",
 *       "three/addons/exporters/GLTFExporter.js": "https://unpkg.com/three@0.184.0/examples/jsm/exporters/GLTFExporter.js"
 *     },
 *     "integrity": {
 *       "https://unpkg.com/three@0.184.0/build/three.module.js": "sha384-8FCZ1eVO6it4+pbec2aDtnTrwjWXZLJRC+MAGCIPDgsYnUrl/E0A2YlF8ioMKI/J",
 *       "https://unpkg.com/three@0.184.0/build/three.core.js": "sha384-dw2ooPewaEIrAgl6oFDBmmBWCE9oW9LxRGcfwZ0hLvEprzo202wXl7vCYHRlSnOT",
 *       "https://unpkg.com/three@0.184.0/examples/jsm/controls/OrbitControls.js": "sha384-4rziNxOBZKQ69i+w+f89KJ55TCYquwchVbByQwmaOeIOXdOU2PLDn3kOfXHwIJC9",
 *       "https://unpkg.com/three@0.184.0/examples/jsm/exporters/OBJExporter.js": "sha384-nbwtoZENJD3Vq+ACK0CuGQdPMuDWHkamC2KJD70EV5nfg6jQjfppKOea07YJN+N3",
 *       "https://unpkg.com/three@0.184.0/examples/jsm/exporters/GLTFExporter.js": "sha384-VofkvpG6HERhFCYbsUOHeNXBCqID2nfqkQqnVzE1jc/oPcz+qJ13ADdXH08hE+cQ"
 *     }
 *   }
 *   </script>
 *
 * Usage:
 *   <style>three-d-stage:not(:defined){visibility:hidden}</style>
 *   <three-d-stage name="rocket"></three-d-stage>
 *   <script src="three-d-stage.js"></script>
 *   <script type="module">
 *     const stage = document.querySelector('three-d-stage');
 *     const { THREE } = await stage.ready;
 *     const model = new THREE.Group();
 *     // …build the model out of named meshes with named materials —
 *     // the names become the o / usemtl entries in the exported OBJ…
 *     stage.setObject(model);
 *   </script>
 *
 * Attributes:
 *   name       — export file basename (default "model")
 *   background — CSS color behind the scene (default a warm paper tone)
 *   autorotate — when present, a slow turntable until the user interacts
 *
 * Model in real-world meters, centered on the origin, y-up — exports
 * inherit the scene's units and orientation. The stage fills its own box;
 * size it with ordinary CSS (default 100vw/100vh page hero).
 *
 * Default setup: neutral studio lighting (hemisphere + key + fill), a
 * soft ground shadow, and NO environment map — so high metalness has
 * nothing to reflect and renders near-black. Cap metalness around
 * 0.3–0.4 and carry a metal look with a brighter base color. The copied
 * file is yours: adjust the lights, shadow, or background in _boot()
 * when the object needs a different look.
 */
/* END USAGE */

(() => {
  const stylesheet = `
    :host {
      position: relative;
      display: block;
      width: 100%;
      height: 100vh;
      background: var(--stage-bg, #f0eee6);
      overflow: hidden;
    }
    canvas { display: block; outline: none; }
    .toolbar {
      position: absolute;
      right: 12px;
      bottom: 12px;
      display: flex;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .toolbar button {
      appearance: none;
      border: 1px solid hsla(42, 60%, 35%, 0.45);
      border-radius: 8px;
      background: hsla(75, 22%, 10%, 0.88);
      color: hsl(45, 35%, 78%);
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 500;
      line-height: 1;
      padding: 9px 12px;
      cursor: default;
    }
    .toolbar button:hover { background: hsl(78, 18%, 16%); box-shadow: 0 0 14px hsla(42, 95%, 55%, 0.25); }
    .toolbar button:focus-visible { outline: 2px solid #e2b35c; outline-offset: 2px; }
    .toolbar button:active { transform: translateY(1px); }
    .toolbar button[disabled] { opacity: 0.5; pointer-events: none; }
    .note {
      display: none;
      position: absolute;
      left: 16px;
      bottom: 16px;
      max-width: 60%;
      font: 400 12px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: rgba(26, 25, 21, 0.55);
      user-select: none;
    }
    .err {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font: 500 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #8a2f20;
      text-align: center;
      white-space: pre-line;
    }
  `;

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /** Tell the host an export attempt settled — telemetry only. The host
   *  (HTMLViewer) verifies the source and re-reads these fields defensively
   *  before counting; nothing else crosses the frame boundary. Guarded so
   *  telemetry can never break the download path. */
  function notifyExport(format, ok) {
    try {
      window.parent.postMessage(
        { type: 'omelette:notify-3d-export', format: format, ok: ok === true },
        '*'
      );
    } catch (e) {}
  }

  class ThreeDStage extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = stylesheet;
      root.appendChild(style);
      this._err = document.createElement('div');
      this._err.className = 'err';
      root.appendChild(this._err);
      const note = document.createElement('div');
      note.className = 'note';
      note.textContent = 'Drag to orbit · scroll to zoom · right-drag to pan';
      root.appendChild(note);
      this._toolbar = document.createElement('div');
      this._toolbar.className = 'toolbar';
      this._objBtn = document.createElement('button');
      this._objBtn.type = 'button';
      this._objBtn.textContent = 'Download OBJ + MTL';
      this._objBtn.addEventListener('click', () => this._runExport('obj'));
      this._glbBtn = document.createElement('button');
      this._glbBtn.type = 'button';
      this._glbBtn.textContent = 'Download GLB';
      this._glbBtn.addEventListener('click', () => this._runExport('glb'));
      this._toolbar.appendChild(this._objBtn);
      this._toolbar.appendChild(this._glbBtn);
      root.appendChild(this._toolbar);
      this._setButtonsEnabled(false);
      /** Resolves with { THREE } once the scene is live — build the model
       *  in `await stage.ready` so nothing races the library load. */
      this.ready = new Promise((resolve, reject) => {
        this._readyResolve = resolve;
        this._readyReject = reject;
      });
    }

    connectedCallback() {
      if (this._booted) {
        // Re-attached after a removal — resume what disconnected stopped.
        if (this._renderer) {
          this._renderer.setAnimationLoop(this._loop);
          this._ro && this._ro.observe(this);
        }
        return;
      }
      this._booted = true;
      this._boot().catch((err) => {
        this._err.style.display = 'flex';
        this._err.textContent =
          'three.js failed to load.\n' +
          'Check that the pinned <script type="importmap"> from the usage ' +
          'notes is in <head> before any module script.\n\n' +
          String(err && err.message ? err.message : err);
        this._readyReject(err);
      });
    }

    async _boot() {
      const bg = this.getAttribute('background');
      if (bg) this.style.setProperty('--stage-bg', bg);
      const [THREE, controlsMod] = await Promise.all([
        import('.././vendor/three/build/three.module.js'),
        import('.././vendor/three/examples/jsm/controls/OrbitControls.js'),
      ]);
      this._THREE = THREE;
      // preserveDrawingBuffer keeps the last frame readable after
      // compositing (toDataURL / drawImage) — it's what lets the
      // screenshot tools capture the scene instead of a blank canvas.
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this._renderer = renderer;
      this.shadowRoot.insertBefore(renderer.domElement, this._err);

      const scene = new THREE.Scene();
      this._scene = scene;

      const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 500);
      camera.position.set(3, 2.2, 4);
      this._camera = camera;

      const controls = new controlsMod.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      this._controls = controls;

      // Neutral studio: soft sky/ground wash, a shadow-casting key light,
      // and a dim fill from behind so silhouettes never go black.
      scene.add(new THREE.HemisphereLight(0xf3e2c0, 0x1c2018, 0.7));
      const key = new THREE.DirectionalLight(0xffe2b0, 1.6);
      key.position.set(4, 7, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.bias = -0.0002;
      this._key = key;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x9fb0d8, 0.55);
      fill.position.set(-5, 3, -4);
      scene.add(fill);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.ShadowMaterial({ opacity: 0.35 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this._ground = ground;
      scene.add(ground);

      this._autorotate = this.hasAttribute('autorotate');
      controls.autoRotate = this._autorotate;
      controls.autoRotateSpeed = 1.2;
      controls.addEventListener('start', () => {
        controls.autoRotate = false;
      });

      const fit = () => {
        const w = this.clientWidth || 1;
        const h = this.clientHeight || 1;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      fit();
      this._ro = new ResizeObserver(fit);
      this._loop = () => {
        controls.update();
        renderer.render(scene, camera);
      };
      // Detached while three.js was fetching? Stay idle — the
      // connectedCallback resume starts the loop and observer on
      // reattach.
      if (this.isConnected) {
        this._ro.observe(this);
        renderer.setAnimationLoop(this._loop);
      }

      this._readyResolve({ THREE });
    }

    disconnectedCallback() {
      // Stop rendering and observing while detached; connectedCallback
      // resumes both. (The renderer itself is kept — a move within the
      // document must not rebuild the scene.)
      if (this._renderer) this._renderer.setAnimationLoop(null);
      if (this._ro) this._ro.disconnect();
    }

    /** Show (and own) the object. Replaces any previous object, enables
     *  shadows on every mesh, rests it on the ground plane, and frames
     *  the camera to its bounds. */
    setObject(object) {
      const THREE = this._THREE;
      if (!THREE) throw new Error('three-d-stage: not ready — await stage.ready first');
      if (this._object) this._scene.remove(this._object);
      this._object = object;
      object.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      const box = new THREE.Box3().setFromObject(object);
      if (!box.isEmpty()) {
        // Rest the object on the ground without moving its origin.
        this._ground.position.y = box.min.y;
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const dist =
          (sphere.radius / Math.tan((this._camera.fov * Math.PI) / 360)) * 1.35;
        const dir = new THREE.Vector3(1, 0.55, 1.25).normalize();
        this._camera.position
          .copy(sphere.center)
          .add(dir.multiplyScalar(dist));
        this._camera.near = Math.max(dist / 100, 0.01);
        this._camera.far = dist * 100;
        this._camera.updateProjectionMatrix();
        this._controls.target.copy(sphere.center);
        this._controls.update();
        const span = sphere.radius * 3;
        this._key.shadow.camera.left = -span;
        this._key.shadow.camera.right = span;
        this._key.shadow.camera.top = span;
        this._key.shadow.camera.bottom = -span;
        this._key.shadow.camera.updateProjectionMatrix();
      }
      this._scene.add(object);
      this._setButtonsEnabled(true);
    }

    get _basename() {
      return (this.getAttribute('name') || 'model').replace(/[^\w.-]+/g, '_');
    }

    _setButtonsEnabled(on) {
      this._objBtn.disabled = !on;
      this._glbBtn.disabled = !on;
    }

    /** Every mesh and material needs a unique name for o/usemtl lines —
     *  fill in stable fallbacks, and return the unique material list. */
    _nameParts() {
      const mats = [];
      const seen = new Set();
      let meshI = 0;
      let matI = 0;
      this._object.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.name) o.name = 'part_' + meshI;
        meshI += 1;
        const list = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of list) {
          if (!m || mats.includes(m)) continue;
          if (!m.name) {
            m.name = 'mat_' + matI;
            matI += 1;
          }
          while (seen.has(m.name)) {
            m.name = m.name + '_' + matI;
            matI += 1;
          }
          seen.add(m.name);
          mats.push(m);
        }
      });
      return mats;
    }

    /** One export attempt, reported to the host however it settles.
     *  Rethrows so a failure stays visible on the guest console exactly as
     *  before. The no-object early return is not an attempt (the toolbar is
     *  disabled until the model loads) and reports nothing. */
    async _runExport(format) {
      if (!this._object) return;
      try {
        await (format === 'obj' ? this._exportObj() : this._exportGlb());
        notifyExport(format, true);
      } catch (err) {
        notifyExport(format, false);
        throw err;
      }
    }

    async _exportObj() {
      if (!this._object) return;
      const mod = await import('.././vendor/three/examples/jsm/exporters/OBJExporter.js');
      const mats = this._nameParts();
      const base = this._basename;
      const obj =
        'mtllib ' + base + '.mtl\n' + new mod.OBJExporter().parse(this._object);
      let mtl = '# Exported by three-d-stage\n';
      for (const m of mats) {
        const c = m.color || { r: 0.8, g: 0.8, b: 0.8 };
        const rough = typeof m.roughness === 'number' ? m.roughness : 0.5;
        const opacity = typeof m.opacity === 'number' ? m.opacity : 1;
        mtl += 'newmtl ' + m.name + '\n';
        mtl +=
          'Kd ' + c.r.toFixed(4) + ' ' + c.g.toFixed(4) + ' ' + c.b.toFixed(4) + '\n';
        mtl += 'Ks 0.2000 0.2000 0.2000\n';
        mtl += 'Ns ' + Math.round((1 - rough) * 200) + '\n';
        mtl += 'd ' + opacity.toFixed(4) + '\n\n';
      }
      download(new Blob([obj], { type: 'text/plain' }), base + '.obj');
      download(new Blob([mtl], { type: 'text/plain' }), base + '.mtl');
    }

    async _exportGlb() {
      if (!this._object) return;
      const mod = await import('.././vendor/three/examples/jsm/exporters/GLTFExporter.js');
      this._nameParts();
      const base = this._basename;
      const buf = await new mod.GLTFExporter().parseAsync(this._object, {
        binary: true,
      });
      download(
        new Blob([buf], { type: 'model/gltf-binary' }),
        base + '.glb'
      );
    }
  }

  customElements.define('three-d-stage', ThreeDStage);
})();
