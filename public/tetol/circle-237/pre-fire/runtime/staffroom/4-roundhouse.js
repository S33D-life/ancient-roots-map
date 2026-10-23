// Preserved from the TETOL Staff Room interior (5eaf7c1e-2b0d-4c3a-9f61-7a1d3b8e0c42); see scripts/tetol-staffroom.mjs.

import * as THREE from '../../vendor/three/build/three.module.js';

const stage = document.querySelector('three-d-stage');
await stage.ready;

/* ---------- materials ---------- */
const mat = (name, color, roughness = 0.85, metalness = 0) => {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  m.name = name;
  return m;
};

const M = {
  earth:   mat('earth_floor', 0x6f5a45, 0.98),
  daub:    mat('lime_daub', 0xd9cfb6, 0.95),
  thatch:  mat('wheat_thatch', 0xb59a62, 1.0),
  stone:   mat('hearth_stone', 0x8d8880, 0.9),
  sooted:  mat('fire_blackened_stone', 0x554e47, 0.95),
  oak:     mat('oak_frame', 0x6b5132, 0.85),
  ash:     mat('ash_rail', 0xc0a273, 0.8),
  slate:   mat('slate_label', 0x3a3836, 0.7),
  ember:   mat('embers', 0x93381a, 0.6),
  char:    mat('charred_log', 0x30291f, 0.95),
  soil:    mat('damp_soil', 0x4a3a2c, 0.98),
  turf:    mat('roof_turf', 0x4f6b32, 0.96),
  turf2:   mat('roof_turf_dry', 0x6d7a3a, 0.96),
  grassA:  mat('roof_grass_green', 0x5d7b33, 0.95),
  grassB:  mat('roof_grass_pale', 0x8a9448, 0.95),
  grassC:  mat('roof_grass_seedhead', 0xb8a45c, 0.92),
  stem:    mat('flower_stem', 0x5b7036, 0.9),
  petalW:  mat('petal_white', 0xf2efe2, 0.85),
  petalY:  mat('petal_yellow', 0xe8c23c, 0.85),
  petalP:  mat('petal_pink', 0xc06f96, 0.85),
  petalB:  mat('petal_blue', 0x7d8fc4, 0.85),
  moss:    mat('moss_green', 0x5b7338, 0.95),
  mossDark: mat('moss_shade', 0x40592b, 0.95),
  mossPale: mat('moss_light', 0x7d8f47, 0.92),
  mossGold: mat('moss_sun_bleached', 0x93994f, 0.93),
  mossBlue: mat('moss_cushion_cool', 0x4c6a52, 0.94),
  mossFibre: mat('moss_fibre', 0x63792f, 0.98),
  mossSpore: mat('moss_sporophyte', 0xa8894a, 0.9),
  liverwort: mat('liverwort', 0x5d7a3c, 0.97),
  oakFloorA: mat('ancient_oak_board_dark', 0x5c4429, 0.82),
  oakFloorB: mat('ancient_oak_board_mid', 0x705234, 0.8),
  oakFloorC: mat('ancient_oak_board_pale', 0x86663f, 0.78),
};

const WOOD = {
  oak:        mat('wood_oak', 0x7a5a33, 0.72),
  ash:        mat('wood_ash', 0xd9c69d, 0.7),
  hazel:      mat('wood_hazel', 0x9c7746, 0.75),
  blackthorn: mat('wood_blackthorn', 0x3b2a1e, 0.6),
  hawthorn:   mat('wood_hawthorn', 0xa2764a, 0.75),
  holly:      mat('wood_holly', 0xe6dfcb, 0.55),
  yew:        mat('wood_yew', 0xa04526, 0.55),
  birch:      mat('wood_birch', 0xefe7d8, 0.6),
  rowan:      mat('wood_rowan', 0xc08f57, 0.72),
  willow:     mat('wood_willow', 0xcbb583, 0.78),
  alder:      mat('wood_alder', 0xc06638, 0.72),
  apple:      mat('wood_apple', 0x8e5c37, 0.65),
  elm:        mat('wood_elm', 0x6d4c2c, 0.75),
  cherry:     mat('wood_cherry', 0x8a3f2a, 0.58),
  juniper:    mat('wood_juniper', 0x5d4a37, 0.7),
  beech:      mat('wood_beech', 0xcfa374, 0.66),
  walnut:     mat('wood_walnut', 0x4a3524, 0.62),
  pine:       mat('wood_pine', 0xdcb977, 0.74),
  spindle:    mat('wood_spindle', 0xe0d3ae, 0.6),
  plum:       mat('wood_plum', 0x6b3626, 0.6),
};

/* hand-dyed wool palette for the rugs */
const WOOL = {
  madder:   mat('wool_madder', 0x9c3b28, 0.92),
  woad:     mat('wool_woad', 0x2f4a63, 0.92),
  weld:     mat('wool_weld', 0xc79a3c, 0.92),
  cream:    mat('wool_undyed_cream', 0xd9cdb2, 0.95),
  walnut:   mat('wool_walnut', 0x4a3a2a, 0.92),
  lichen:   mat('wool_lichen', 0x6f7a4d, 0.92),
  charcoal: mat('wool_charcoal', 0x2b2823, 0.92),
};

/* ---------- helpers ---------- */
const house = new THREE.Group();
house.name = 'roundhouse_staff_gallery';

const at = (r, a, y = 0) => new THREE.Vector3(r * Math.sin(a), y, r * Math.cos(a));

function strut(p0, p1, r0, r1, material, name, seg = 16) {
  const dir = new THREE.Vector3().subVectors(p1, p0);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg, 1), material);
  m.name = name;
  m.position.copy(p0).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return m;
}

function ring(radius, tube, y, material, name, arc = Math.PI * 2, aStart = Math.PI / 2, tubular = 128) {
  const g = new THREE.Group();
  g.rotation.y = aStart - Math.PI / 2;
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, tubular, arc), material);
  m.name = name;
  m.rotation.x = -Math.PI / 2;
  g.add(m);
  g.position.y = y;
  return g;
}

function rnd(i) {
  const v = Math.sin(i * 127.1 + 0.371) * 43758.5453;
  return v - Math.floor(v);
}

/** merge many boxes into one geometry so a patterned rug stays a single mesh */
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
function mergeBoxes(items, material, name) {
  const pos = [], nor = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (const it of items) {
    const g = UNIT_BOX.clone();
    e.set(0, it.rotY || 0, 0);
    q.setFromEuler(e);
    m4.compose(new THREE.Vector3(...it.pos), q, new THREE.Vector3(...it.size));
    g.applyMatrix4(m4);
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name;
  return mesh;
}


/* ---------- procedural grain ---------- */
/* a near-white multiply texture: keeps each material's own colour (so the
   OBJ/MTL export still carries it) while adding rings, rays and knots */
function grainCanvas(seed, { bands = 190, knots = 3, ray = 0.5, w = 256, h = 512 } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#f7f5f1';
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < bands; i++) {
    const r1 = rnd(seed + i * 3.1), r2 = rnd(seed + i * 7.7), r3 = rnd(seed + i * 11.3);
    const bx = r1 * w, bw = 0.6 + r2 * 3.4;
    x.globalAlpha = 0.04 + r3 * 0.13;
    x.fillStyle = r2 > 0.72 ? '#5a4326' : '#7a6240';
    x.beginPath();
    x.moveTo(bx, 0);
    for (let y = 0; y <= h; y += 32) {
      x.lineTo(bx + Math.sin((y / h) * (4 + r1 * 7) + r2 * 6) * (1.2 + r3 * 3.2), y);
    }
    for (let y = h; y >= 0; y -= 32) {
      x.lineTo(bx + bw + Math.sin((y / h) * (4 + r1 * 7) + r2 * 6) * (1.2 + r3 * 3.2), y);
    }
    x.closePath();
    x.fill();
  }
  /* medullary rays / flecks across the grain */
  x.globalAlpha = 0.07 * ray;
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 260 * ray; i++) {
    const r1 = rnd(seed + 900 + i * 2.7), r2 = rnd(seed + 1700 + i * 5.3);
    x.fillRect(r1 * w, r2 * h, 1 + r2 * 8, 0.8 + r1 * 1.4);
  }
  /* knots */
  for (let k = 0; k < knots; k++) {
    const r1 = rnd(seed + 2500 + k * 13), r2 = rnd(seed + 3100 + k * 17);
    const kx = r1 * w, ky = r2 * h, kr = 5 + rnd(seed + k) * 9;
    for (let i = 6; i >= 1; i--) {
      x.globalAlpha = 0.05 + (6 - i) * 0.035;
      x.fillStyle = '#4a3520';
      x.beginPath();
      x.ellipse(kx, ky, kr * i * 0.17, kr * i * 0.34, 0.3, 0, Math.PI * 2);
      x.fill();
    }
  }
  x.globalAlpha = 1;
  return c;
}

function addGrain(material, seed, opts = {}, repeat = [1, 3]) {
  const c = grainCanvas(seed, opts);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  material.map = t;
  const b = new THREE.CanvasTexture(c);
  b.wrapS = b.wrapT = THREE.RepeatWrapping;
  b.repeat.set(repeat[0], repeat[1]);
  material.bumpMap = b;
  material.bumpScale = opts.bump ?? 0.6;
  material.needsUpdate = true;
  return material;
}

/** knobbly, slightly bent stock — real geometry, not just texture */
function gnarl(geo, len, seed, amp = 0.16, bend = 0.035) {
  const p = geo.attributes.position;
  const bx = (rnd(seed) - 0.5) * 2, bz = (rnd(seed + 5) - 0.5) * 2;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
    const t = vy / len + 0.5;
    const ang = Math.atan2(vz, vx);
    const r = Math.hypot(vx, vz);
    const n = 1
      + amp * 0.35 * Math.sin(t * 17 + seed)
      + amp * 0.22 * Math.sin(ang * 3 + t * 9 + seed * 1.7)
      + amp * 0.12 * Math.sin(t * 41 + ang * 2);
    const cx = bend * len * Math.sin(t * 2.1 + seed) * bx;
    const cz = bend * len * Math.sin(t * 1.7 + seed * 2) * bz;
    p.setXYZ(i, Math.cos(ang) * r * n + cx, vy, Math.sin(ang) * r * n + cz);
  }
  geo.computeVertexNormals();
  return geo;
}

Object.keys(WOOD).forEach((k, i) => addGrain(WOOD[k], 100 + i * 37, {
  bands: 210, knots: 3, ray: k === 'oak' || k === 'elm' || k === 'beech' ? 1 : 0.45, bump: 0.5,
}, [1, 2]));
addGrain(M.oakFloorA, 71, { bands: 240, knots: 5, ray: 1, bump: 1.1 }, [7, 1]);
addGrain(M.oakFloorB, 83, { bands: 230, knots: 4, ray: 1, bump: 1.1 }, [6, 1]);
addGrain(M.oakFloorC, 97, { bands: 250, knots: 6, ray: 1, bump: 1.2 }, [8, 1]);
addGrain(M.oak, 11, { bands: 150, knots: 4, ray: 1, bump: 0.9 }, [1, 4]);
addGrain(M.ash, 29, { bands: 170, knots: 2, ray: 0.7, bump: 0.7 }, [1, 6]);
addGrain(M.char, 53, { bands: 120, knots: 1, ray: 0.2, bump: 1.1 }, [1, 2]);


/* ---------- shell: sliced so the cutaway can follow the camera ---------- */
const RI = 5.2, WALL_T = 0.26, WALL_H = 1.95;
const CUT = Math.PI * 0.27;        // half-width of the roaming cutaway
const DOOR = Math.PI * 0.13;       // half-width of the fixed doorway (at a = 0)
const SLICES = 60, STEP = (Math.PI * 2) / SLICES;

const cutaway = [];                // parts hidden when they face the camera
const norm = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const track = (obj, a) => { obj.userData.cutAngle = norm(a); cutaway.push(obj); return obj; };

/* ancient oak plank floor over a dark sub-floor */
const subfloor = new THREE.Mesh(new THREE.CylinderGeometry(5.62, 5.62, 0.18, 96), M.char);
subfloor.name = 'floor_substructure';
subfloor.position.y = -0.14;
house.add(subfloor);

const FLOOR_R = 5.58, BOARD_W = 0.24, BOARD_GAP = 0.02, PT = 0.055;
const planks = new THREE.Group();
planks.name = 'oak_hexagon_floor';
const step = BOARD_W + BOARD_GAP;
let pieceId = 0;

/** one cut board laid between two floor points */
function board(p0, p1, width, mat3, y, name) {
  const dx = p1[0] - p0[0], dz = p1[1] - p0[1];
  const len = Math.hypot(dx, dz);
  if (len < 0.05) return null;
  const h = PT - rnd(pieceId + 7) * 0.006;
  const b = new THREE.Mesh(new THREE.BoxGeometry(len, h, width), mat3);
  b.name = name;
  b.position.set((p0[0] + p1[0]) / 2, y - h / 2, (p0[1] + p1[1]) / 2);
  b.rotation.y = Math.atan2(-dz / len, dx / len);
  return b;
}

/* concentric hexagon courses radiating out from the hearth */
for (let k = 0; ; k++) {
  const R = 1.02 + k * step;
  if (R * 0.866 > FLOOR_R + 0.1) break;
  const tone = [M.oakFloorA, M.oakFloorB, M.oakFloorC][k % 3];
  const y = -0.002 - (k % 2) * 0.0012;
  for (let side = 0; side < 6; side++) {
    const a0 = side * Math.PI / 3, a1 = a0 + Math.PI / 3;
    const v0 = [R * Math.cos(a0), R * Math.sin(a0)];
    const v1 = [R * Math.cos(a1), R * Math.sin(a1)];
    /* keep only the part of the course that lies inside the roundhouse */
    const N = 80, inside = [];
    for (let t = 0; t <= N; t++) {
      const f = t / N;
      const p = [v0[0] + (v1[0] - v0[0]) * f, v0[1] + (v1[1] - v0[1]) * f];
      inside.push(Math.hypot(p[0], p[1]) <= FLOOR_R - 0.3 ? p : null);
    }
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        let p0 = run[0], p1 = run[run.length - 1];
        const ux = (p1[0] - p0[0]), uz = (p1[1] - p0[1]);
        const ul = Math.hypot(ux, uz) || 1;
        const lap = BOARD_W * 0.58;
        const ext = (p, sign) => {
          const q = [p[0] + sign * (ux / ul) * lap, p[1] + sign * (uz / ul) * lap];
          return Math.hypot(q[0], q[1]) <= FLOOR_R - 0.3 ? q : p;
        };
        p0 = ext(p0, -1);
        p1 = ext(p1, 1);
        const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const cuts = len > 1.5 ? 2 : 1;   // butt-jointed boards on the long courses
        for (let c = 0; c < cuts; c++) {
          const f0 = c / cuts, f1 = (c + 1) / cuts;
          const gap = c === 0 ? 0 : 0.008;
          const q0 = [p0[0] + (p1[0] - p0[0]) * f0 + gap, p0[1] + (p1[1] - p0[1]) * f0];
          const q1 = [p0[0] + (p1[0] - p0[0]) * f1, p0[1] + (p1[1] - p0[1]) * f1];
          pieceId++;
          const b = board(q0, q1, BOARD_W, tone, y, `floor_board_r${k + 1}_s${side + 1}_${c + 1}`);
          if (b) planks.add(b);
        }
      }
      run = [];
    };
    for (const p of inside) { if (p) run.push(p); else flush(); }
    flush();
  }
}
/* solid oak sub-disc: nothing can show through between the courses */
const floorDisc = new THREE.Mesh(new THREE.CylinderGeometry(FLOOR_R - 0.005, FLOOR_R - 0.02, PT * 0.9, 128), M.oakFloorA);
floorDisc.name = 'floor_underboard';
floorDisc.position.y = -PT * 0.45 - 0.012;
planks.add(floorDisc);

/* curved perimeter band, cut in segments, closing the circle */
const BAND = 0.32, BAND_SEGS = 64;
for (let i = 0; i < BAND_SEGS; i++) {
  const a = (i / BAND_SEGS) * Math.PI * 2;
  const ri = FLOOR_R - BAND, ro = FLOOR_R;
  const chord = 2 * Math.PI * ro / BAND_SEGS * 1.06;
  const mid = (ri + ro) / 2;
  const seg = new THREE.Mesh(new THREE.BoxGeometry(BAND, PT - rnd(i) * 0.004, chord),
    [M.oakFloorA, M.oakFloorB, M.oakFloorC][i % 3]);
  seg.name = `floor_rim_board_${i + 1}`;
  seg.position.set(mid * Math.sin(a), -PT / 2 - 0.002, mid * Math.cos(a));
  seg.rotation.y = a;
  planks.add(seg);
}

/* rounded-off nosing on the outer edge */
const nosing = new THREE.Mesh(new THREE.TorusGeometry(FLOOR_R - 0.026, 0.028, 10, 160), M.oakFloorB);
nosing.name = 'floor_edge_nosing';
nosing.rotation.x = -Math.PI / 2;
nosing.position.y = -0.03;
planks.add(nosing);

const surround = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, PT, 6), M.oakFloorB);
surround.name = 'floor_hearth_surround';
surround.position.y = -PT / 2 - 0.002;
planks.add(surround);
house.add(planks);

/* ---------- batching ---------- */
/* thousands of moss tufts, spore capsules and leaf blades would be thousands of
   draw calls; each is instead stamped into a pool and merged, at the end of the
   build, into one mesh per material — same look, ~50x fewer calls, and a far
   smaller OBJ/GLB */
const POOLS = new Map();
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
function stamp(name, material, parent, geom, pos, rot, scale) {
  const key = name + '|' + material.name;
  let p = POOLS.get(key);
  if (!p) POOLS.set(key, (p = { name, material, parent, parts: [] }));
  if (rot && rot.isQuaternion) _q.copy(rot);
  else { _e.set(rot?.x || 0, rot?.y || 0, rot?.z || 0); _q.setFromEuler(_e); }
  const sv = typeof scale === 'number' ? new THREE.Vector3(scale, scale, scale) : (scale || new THREE.Vector3(1, 1, 1));
  p.parts.push({ geom, matrix: new THREE.Matrix4().compose(pos, _q, sv) });
}
function mergeParts(parts) {
  const keys = ['position', 'normal', 'uv'];
  let vCount = 0, iCount = 0;
  const prepped = parts.map(({ geom, matrix }) => {
    const g = geom;
    const n = g.attributes.position.count;
    vCount += n;
    iCount += g.index ? g.index.count : n;
    return { g, matrix, n };
  });
  const out = new THREE.BufferGeometry();
  const arrs = {};
  for (const k of keys) arrs[k] = new Float32Array(vCount * (k === 'uv' ? 2 : 3));
  const idx = new Uint32Array(iCount);
  let vo = 0, io = 0;
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const { g, matrix, n } of prepped) {
    nm.getNormalMatrix(matrix);
    const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv;
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(matrix);
      arrs.position.set([v.x, v.y, v.z], (vo + i) * 3);
      if (na) {
        v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize();
        arrs.normal.set([v.x, v.y, v.z], (vo + i) * 3);
      }
      if (ua) arrs.uv.set([ua.getX(i), ua.getY(i)], (vo + i) * 2);
    }
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) idx[io + i] = g.index.getX(i) + vo;
      io += g.index.count;
    } else {
      for (let i = 0; i < n; i++) idx[io + i] = vo + i;
      io += n;
    }
    vo += n;
  }
  out.setAttribute('position', new THREE.BufferAttribute(arrs.position, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(arrs.normal, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(arrs.uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
/* the path is laid after the moss and deadfall, and its post-passes must reach
   pooled props too: these walk the un-merged stamps by world position */
function poolParts(nameTest) {
  const out = [];
  for (const p of POOLS.values()) if (nameTest(p.name)) out.push(p);
  return out;
}
const _pv = new THREE.Vector3();
function poolPrune(nameTest, keep) {
  for (const p of poolParts(nameTest)) {
    p.parts = p.parts.filter((pt) => keep(_pv.setFromMatrixPosition(pt.matrix), pt));
  }
}
function poolShift(nameTest, test, shift) {
  for (const p of poolParts(nameTest)) {
    for (const pt of p.parts) {
      if (test(_pv.setFromMatrixPosition(pt.matrix))) {
        pt.matrix.premultiply(new THREE.Matrix4().makeTranslation(shift.x, shift.y, shift.z));
      }
    }
  }
}
function flushPools() {
  for (const p of POOLS.values()) {
    if (!p.parts.length) continue;
    const mesh = new THREE.Mesh(mergeParts(p.parts), p.material);
    mesh.name = p.name;
    p.parent.add(mesh);
    p.parts.length = 0;
  }
}

/* ---------- mossy soil around the hut ---------- */
const ground = new THREE.Group();
ground.name = 'mossy_ground';
const GR = 9.4;
const soilDisc = new THREE.Mesh(new THREE.CylinderGeometry(GR, GR - 0.5, 0.3, 96), M.soil);
soilDisc.name = 'soil_bed';
soilDisc.position.y = -0.3;
ground.add(soilDisc);

/* undulating moss mat: overlapping low domes, thickest away from the walls */
/* a moss cushion is built up rather than dropped in: a base dome, two or three
   smaller lobes swelling off it, a scatter of upright fibre tufts, and on the
   older cushions a few sporophyte stalks standing above the nap */
const MOSS_TONES = [M.moss, M.mossDark, M.mossPale, M.mossGold, M.mossBlue];
/* millimetre-scale props: the coarsest geometry that still reads */
const G_TUFT = new THREE.ConeGeometry(1, 1, 3);
const G_LOBE = new THREE.IcosahedronGeometry(1, 0);
const G_STALK = new THREE.CylinderGeometry(0.006, 0.008, 1, 4, 1, true);
const G_CAPSULE = new THREE.ConeGeometry(0.013, 0.034, 4);
let mossId = 0;
function mossCushion(parent, at, sc, seed, flat = 1, nameRoot = 'moss_clump') {
  const id = ++mossId;
  const tone = MOSS_TONES[Math.floor(rnd(seed * 11.9) * MOSS_TONES.length)];
  const tone2 = MOSS_TONES[Math.floor(rnd(seed * 13.3) * MOSS_TONES.length)];
  const flatY = (0.2 + rnd(seed * 17.3) * 0.16) * flat;
  stamp('moss_cushions', tone, parent, G_LOBE, at.clone(),
    { y: rnd(seed * 19.7) * 3 }, new THREE.Vector3(sc, sc * flatY, sc));
  /* lobes */
  const lobes = 2 + Math.floor(rnd(seed * 23.1) * 2);
  for (let k = 0; k < lobes; k++) {
    const la = rnd(seed * 29.3 + k) * Math.PI * 2;
    const lr = sc * (0.36 + rnd(seed * 31.7 + k) * 0.3);
    stamp('moss_lobes', k % 2 ? tone2 : tone, parent, G_LOBE,
      at.clone().add(new THREE.Vector3(Math.sin(la) * sc * 0.68, sc * flatY * 0.34, Math.cos(la) * sc * 0.68)),
      { y: rnd(seed * 3.7 + k) * 3 },
      new THREE.Vector3(lr, lr * flatY * (1.1 + rnd(seed + k) * 0.5), lr));
  }
  /* upright fibre tufts giving the cushion a nap */
  const tufts = 3 + Math.floor(rnd(seed * 37.1) * 4);
  for (let k = 0; k < tufts; k++) {
    const ta = rnd(seed * 41.3 + k) * Math.PI * 2;
    const tr = sc * rnd(seed * 43.7 + k) * 0.82;
    const th = 0.035 + rnd(seed * 47.9 + k) * 0.075;
    const tw = 0.016 + rnd(seed + k) * 0.012;
    stamp('moss_fibre_nap', M.mossFibre, parent, G_TUFT,
      at.clone().add(new THREE.Vector3(Math.sin(ta) * tr, sc * flatY * 0.85 + th * 0.4, Math.cos(ta) * tr)),
      { x: (rnd(seed * 53 + k) - 0.5) * 0.5, y: ta, z: (rnd(seed * 59 + k) - 0.5) * 0.5 },
      new THREE.Vector3(tw, th, tw));
  }
  /* sporophytes on the older cushions */
  if (rnd(seed * 61.7) > 0.55) {
    const n = 2 + Math.floor(rnd(seed * 67.1) * 3);
    for (let k = 0; k < n; k++) {
      const sa = rnd(seed * 71.3 + k) * Math.PI * 2;
      const sr = sc * rnd(seed * 73.9 + k) * 0.6;
      const sh = 0.09 + rnd(seed * 79.1 + k) * 0.09;
      const foot = at.clone().add(new THREE.Vector3(Math.sin(sa) * sr, sc * flatY * 0.85, Math.cos(sa) * sr));
      stamp('moss_sporophytes', M.mossSpore, parent, G_STALK,
        foot.clone().add(new THREE.Vector3(0, sh / 2, 0)),
        { z: (rnd(seed * 83 + k) - 0.5) * 0.3 }, new THREE.Vector3(1, sh, 1));
      stamp('moss_spore_capsules', M.mossSpore, parent, G_CAPSULE,
        foot.clone().add(new THREE.Vector3(0, sh + 0.008, 0)),
        { z: 0.8 + rnd(seed + k) * 0.5 }, 1);
    }
  }
}
for (let i = 0; i < 300; i++) {
  const a = rnd(i * 3.7) * Math.PI * 2;
  const sc = 0.32 + rnd(i * 7.3) * 0.62;
  const r = 5.75 + sc + Math.pow(rnd(i * 5.1), 0.62) * (GR - 6.6);
  mossCushion(ground, new THREE.Vector3(r * Math.sin(a), -0.13 - rnd(i * 13.1) * 0.05, r * Math.cos(a)), sc, i * 1.7);
}
/* flat liverwort rosettes in the damp between cushions */
for (let i = 0; i < 40; i++) {
  const a = rnd(i * 5.3 + 2) * Math.PI * 2;
  const r = 5.9 + rnd(i * 7.9) * (GR - 6.4);
  const lr = 0.14 + rnd(i * 11.1) * 0.12;
  stamp('liverwort_rosettes', M.liverwort, ground, G_LOBE,
    new THREE.Vector3(r * Math.sin(a), -0.145, r * Math.cos(a)),
    { y: rnd(i * 13.7) * 3 }, new THREE.Vector3(lr * 1.5, lr * 0.1, lr * 1.5));
}

/* tussocks and half-buried stones */
for (let i = 0; i < 46; i++) {
  const a = rnd(i * 23.1 + 1) * Math.PI * 2;
  const r = 5.9 + rnd(i * 29.3) * (GR - 6.3);
  const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14 + rnd(i * 31.7) * 0.22, 0), M.stone);
  st.name = `ground_stone_${i + 1}`;
  st.position.set(r * Math.sin(a), -0.14, r * Math.cos(a));
  st.rotation.set(rnd(i) * 3, rnd(i + 2) * 3, rnd(i + 4) * 3);
  st.scale.set(1, 0.7, 1);
  ground.add(st);
}
/* fallen logs and old stumps, mossed over, ringing the hut just past the
   moss mat — placed on a jittered ring and kept clear of the doorway approach */
const LOG_SPOTS = [
  [1.15, 7.1], [2.05, 8.2], [2.9, 6.9], [3.8, 7.8], [4.55, 8.6],
  [5.4, 7.2], [6.25, 8.4], [7.2, 6.8], [8.05, 8.1],
];
LOG_SPOTS.forEach(([a0, r0], i) => {
  const len = 1.6 + rnd(i * 3.1) * 1.9;
  const rad = 0.16 + rnd(i * 5.7) * 0.13;
  const g = new THREE.CylinderGeometry(rad * 0.86, rad, len, 11);
  gnarl(g, len, 700 + i, 0.14, 0.03);
  g.computeBoundingBox();
  /* the true bark surface after gnarl, not the nominal radius */
  const surfR = Math.max(g.boundingBox.max.x, -g.boundingBox.min.x,
                         g.boundingBox.max.z, -g.boundingBox.min.z);
  const log = new THREE.Mesh(g, i % 3 ? WOOD.oak : WOOD.ash);
  log.name = `fallen_log_${i + 1}`;
  /* one axis drives everything: orientation, end caps, moss, stub, fungus */
  const lie = a0 + 1.1 + rnd(i * 7.9) * 1.3;          // roughly tangential
  const dir = new THREE.Vector3(Math.sin(lie), (rnd(i * 11.3) - 0.5) * 0.16, Math.cos(lie)).normalize();
  const up = new THREE.Vector3(0, 1, 0).sub(dir.clone().multiplyScalar(dir.y)).normalize();
  const side = new THREE.Vector3().crossVectors(dir, up).normalize();
  const base = new THREE.Vector3(r0 * Math.sin(a0), rad * 0.72 - 0.16, r0 * Math.cos(a0));
  log.position.copy(base);
  log.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  ground.add(log);
  for (const es of [-1, 1]) {
    const ec = new THREE.Mesh(new THREE.CircleGeometry(rad * 0.94, 12), WOOD.ash);
    ec.name = `fallen_log_${i + 1}_end_${es < 0 ? 1 : 2}`;
    ec.position.copy(base).add(dir.clone().multiplyScalar(es * len * 0.5));
    ec.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().multiplyScalar(es));
    ground.add(ec);
  }
  if (rnd(i * 17.1) > 0.45) {
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.3, rad * 0.42, 0.42, 8), WOOD.oak);
    stub.name = `fallen_log_${i + 1}_branch_stub`;
    const outward = side.clone().multiplyScalar(0.8).add(up.clone().multiplyScalar(0.6)).normalize();
    stub.position.copy(base).add(dir.clone().multiplyScalar((rnd(i * 29.1) - 0.5) * len * 0.5))
      .add(outward.clone().multiplyScalar(surfR + 0.18));
    stub.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);
    ground.add(stub);
  }
  /* moss riding the upper side of the log */
  for (let k = 0; k < 9; k++) {
    const t = (k + 0.5) / 9;
    const sc = 0.12 + rnd(i * 19.3 + k) * 0.16;
    const at = base.clone()
      .add(dir.clone().multiplyScalar((t - 0.5) * len * 0.92))
      .add(up.clone().multiplyScalar(surfR * 0.94 + sc * 0.2))
      .add(side.clone().multiplyScalar((rnd(i * 31 + k) - 0.5) * surfR * 0.8));
    mossCushion(ground, at, sc, i * 97 + k * 7.3, 0.9, `fallen_log_${i + 1}_moss`);
  }
  if (rnd(i * 23.9) > 0.5) {
    const fu = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.19, 0.06, 10, 1, false, 0, Math.PI), M.mossPale);
    fu.name = `fallen_log_${i + 1}_fungus`;
    const out = side.clone().multiplyScalar(0.9).add(up.clone().multiplyScalar(0.35)).normalize();
    fu.position.copy(base).add(dir.clone().multiplyScalar((rnd(i * 37.3) - 0.5) * len * 0.6))
      .add(out.clone().multiplyScalar(surfR * 0.98));
    fu.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    fu.rotateY(Math.atan2(out.x, out.z));
    ground.add(fu);
  }
});

const STUMP_SPOTS = [[0.55, 6.9], [1.7, 8.7], [3.35, 7.4], [4.95, 8.9], [6.7, 7.6], [7.75, 8.9]];
STUMP_SPOTS.forEach(([a0, r0], i) => {
  const h = 0.32 + rnd(i * 3.3) * 0.34;
  const rb = 0.3 + rnd(i * 5.1) * 0.2;
  const g = new THREE.CylinderGeometry(rb * 0.88, rb, h, 14);
  gnarl(g, h, 760 + i, 0.1, 0.03);
  const st = new THREE.Mesh(g, i % 2 ? WOOD.oak : WOOD.ash);
  st.name = `old_stump_${i + 1}`;
  st.position.set(r0 * Math.sin(a0), h / 2 - 0.17, r0 * Math.cos(a0));
  st.rotation.set((rnd(i * 7.7) - 0.5) * 0.1, rnd(i * 9.1) * 3, (rnd(i * 11.1) - 0.5) * 0.08);
  ground.add(st);
  /* rotted, dished top */
  const top = new THREE.Mesh(new THREE.CylinderGeometry(rb * 0.7, rb * 0.86, 0.07, 14), M.char);
  top.name = `old_stump_${i + 1}_rotted_heart`;
  top.position.copy(st.position).add(new THREE.Vector3(0, h / 2 - 0.02, 0));
  ground.add(top);
  /* root flare */
  for (let k = 0; k < 5; k++) {
    const ra = (k / 5) * Math.PI * 2 + rnd(i + k);
    const rl = 0.62 + rnd(i * 13 + k) * 0.42;
    const rt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, rl, 8), i % 2 ? WOOD.oak : WOOD.ash);
    rt.name = `old_stump_${i + 1}_root_${k + 1}`;
    /* each root leaves the stump in the direction it actually points */
    const dir = new THREE.Vector3(Math.sin(ra), -0.42, Math.cos(ra)).normalize();
    rt.position.copy(st.position)
      .add(new THREE.Vector3(0, -h / 2 + 0.17, 0))
      .add(dir.clone().multiplyScalar(rb * 0.55 + rl * 0.42));
    rt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
    ground.add(rt);
  }
  /* moss collar and crown */
  for (let k = 0; k < 7; k++) {
    const ma = (k / 7) * Math.PI * 2 + rnd(i * 17 + k);
    const sc = 0.11 + rnd(i * 19 + k) * 0.15;
    const onTop = k % 3 === 0;
    const at = st.position.clone().add(new THREE.Vector3(
      Math.sin(ma) * rb * (onTop ? 0.5 : 1.0),
      onTop ? h / 2 + 0.02 : -h / 2 + 0.06 + rnd(i + k) * 0.1,
      Math.cos(ma) * rb * (onTop ? 0.5 : 1.0)));
    mossCushion(ground, at, sc, i * 131 + k * 11.7, 1, `old_stump_${i + 1}_moss`);
  }
  /* a few small mushrooms at the foot */
  for (let k = 0; k < 3; k++) {
    const ma = rnd(i * 23 + k) * Math.PI * 2;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055 + rnd(i + k) * 0.03, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.mossPale);
    cap.name = `old_stump_${i + 1}_mushroom_${k + 1}`;
    cap.position.copy(st.position).add(new THREE.Vector3(Math.sin(ma) * (rb + 0.16), -h / 2 + 0.06, Math.cos(ma) * (rb + 0.16)));
    ground.add(cap);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.019, 0.08, 6), M.daub);
    stem.name = `old_stump_${i + 1}_mushroom_stem_${k + 1}`;
    stem.position.copy(cap.position).add(new THREE.Vector3(0, -0.04, 0));
    ground.add(stem);
  }
});

house.add(ground);

const wallProfile = [
  new THREE.Vector2(RI, 0.0),
  new THREE.Vector2(RI - 0.02, WALL_H),
  new THREE.Vector2(RI + WALL_T, WALL_H),
  new THREE.Vector2(RI + WALL_T + 0.05, 0.0),
];
M.daub.side = THREE.DoubleSide;
M.thatch.side = THREE.DoubleSide;

const EAVE_R = 5.68, EAVE_Y = 1.78, APEX_R = 0.5, APEX_Y = 4.45;
const thatchProfile = [];
for (let i = 0; i <= 10; i++) {
  const t = i / 10;
  thatchProfile.push(new THREE.Vector2(
    EAVE_R + (APEX_R - EAVE_R) * t,
    EAVE_Y + (APEX_Y - EAVE_Y) * Math.pow(t, 0.86) + 0.12));
}

for (let i = 0; i < SLICES; i++) {
  const a0 = i * STEP, ac = a0 + STEP / 2;
  const inDoor = Math.abs(norm(ac)) < DOOR;
  if (!inDoor) {
    const w = new THREE.Mesh(new THREE.LatheGeometry(wallProfile, 4, a0 - 0.002, STEP + 0.004), M.daub);
    w.name = `wall_slice_${i + 1}`;
    house.add(track(w, ac));
    for (let k = 0; k < 5; k++) {
      const rod = new THREE.Mesh(
        new THREE.TorusGeometry(RI + WALL_T + 0.055, 0.035, 8, 4, STEP + 0.004), M.ash);
      rod.name = `wattle_rod_${i + 1}_${k + 1}`;
      rod.rotation.x = -Math.PI / 2;
      const holder = new THREE.Group();
      holder.rotation.y = a0 - 0.002 - Math.PI / 2;
      holder.position.y = 0.25 + k * 0.4;
      holder.add(rod);
      house.add(track(holder, ac));
    }
  }
  const th = new THREE.Mesh(new THREE.LatheGeometry(thatchProfile, 4, a0 - 0.002, STEP + 0.004), M.thatch);
  th.name = `thatch_slice_${i + 1}`;
  house.add(track(th, ac));
  /* living turf laid over the thatch */
  const turfProfile = thatchProfile.map((p) => new THREE.Vector2(p.x * 1.004 + 0.01, p.y + 0.06));
  const tf = new THREE.Mesh(new THREE.LatheGeometry(turfProfile, 4, a0 - 0.002, STEP + 0.004),
    i % 5 === 0 ? M.turf2 : M.turf);
  tf.name = `roof_turf_${i + 1}`;
  tf.material.side = THREE.DoubleSide;
  house.add(track(tf, ac));

  /* grasses, moss cushions and wildflowers rooted in the turf */
  const planting = new THREE.Group();
  planting.name = `roof_planting_${i + 1}`;
  const surfaceAt = (t) => {
    const f = t * (turfProfile.length - 1);
    const i0 = Math.floor(f), fr = f - i0;
    const p0 = turfProfile[i0], p1 = turfProfile[Math.min(i0 + 1, turfProfile.length - 1)];
    return [p0.x + (p1.x - p0.x) * fr, p0.y + (p1.y - p0.y) * fr];
  };
  for (let k = 0; k < 7; k++) {
    const sd = i * 53 + k * 11 + 3;
    const aa = a0 + rnd(sd) * STEP;
    const [rr, yy] = surfaceAt(0.05 + rnd(sd + 1) * 0.88);
    const h = 0.1 + rnd(sd + 2) * 0.16;
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.03 + rnd(sd + 3) * 0.03, h, 5),
      [M.grassA, M.grassB, M.grassA, M.grassC][k % 4]);
    tuft.name = `roof_grass_${i + 1}_${k + 1}`;
    tuft.position.set(rr * Math.sin(aa), yy + h * 0.35, rr * Math.cos(aa));
    tuft.rotation.set((rnd(sd + 4) - 0.5) * 0.5, rnd(sd + 5) * 3, (rnd(sd + 6) - 0.5) * 0.5);
    planting.add(tuft);
    if (k % 3 === 0) {
      const cushion = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06 + rnd(sd + 7) * 0.06, 1), M.moss);
      cushion.name = `roof_moss_${i + 1}_${k + 1}`;
      cushion.position.set(rr * Math.sin(aa) * 0.98, yy + 0.02, rr * Math.cos(aa) * 0.98);
      cushion.scale.y = 0.35;
      planting.add(cushion);
    }
  }
  if (i % 2 === 0) {
    for (let k = 0; k < 2; k++) {
      const sd = i * 71 + k * 17 + 5;
      const aa = a0 + rnd(sd) * STEP;
      const [rr, yy] = surfaceAt(0.12 + rnd(sd + 1) * 0.74);
      const hs = 0.11 + rnd(sd + 2) * 0.1;
      const px = rr * Math.sin(aa), pz = rr * Math.cos(aa);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, hs, 5), M.stem);
      stem.name = `roof_flower_stem_${i + 1}_${k + 1}`;
      stem.position.set(px, yy + hs / 2, pz);
      stem.rotation.z = (rnd(sd + 3) - 0.5) * 0.4;
      planting.add(stem);
      const petalMat = [M.petalW, M.petalY, M.petalP, M.petalB][Math.floor(rnd(sd + 4) * 4)];
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.026 + rnd(sd + 5) * 0.016, 10, 8), petalMat);
      head.name = `roof_flower_head_${i + 1}_${k + 1}`;
      head.position.set(px, yy + hs + 0.012, pz);
      head.scale.y = 0.6;
      planting.add(head);
    }
  }
  house.add(track(planting, ac));

  const eave = new THREE.Mesh(new THREE.TorusGeometry(EAVE_R + 0.04, 0.1, 8, 5, STEP + 0.004), M.thatch);
  eave.name = `thatch_eave_${i + 1}`;
  eave.rotation.x = -Math.PI / 2;
  const eh = new THREE.Group();
  eh.rotation.y = a0 - 0.002 - Math.PI / 2;
  eh.position.y = EAVE_Y + 0.1;
  eh.add(eave);
  house.add(track(eh, ac));
}

/* roof frame */
const POST_R = 3.1;
const rafterY = (r) => EAVE_Y + ((EAVE_R - r) / (EAVE_R - APEX_R)) * (APEX_Y - EAVE_Y);
for (let i = 0; i < 8; i++) {
  const a = Math.PI * 0.125 + i * Math.PI * 0.25;
  house.add(strut(at(POST_R, a, 0), at(POST_R, a, rafterY(POST_R) - 0.05), 0.16, 0.14, M.oak, `oak_post_${i + 1}`, 20));
}
house.add(ring(POST_R, 0.11, rafterY(POST_R), M.oak, 'oak_ring_beam', Math.PI * 2, 0, 120));

const RAFTERS = 36;
for (let i = 0; i < RAFTERS; i++) {
  const a = (i / RAFTERS) * Math.PI * 2;
  const r = strut(at(EAVE_R - 0.25, a, EAVE_Y + 0.06), at(APEX_R * 0.9, a, APEX_Y + 0.05), 0.07, 0.045, M.ash, `rafter_${i + 1}`, 10);
  house.add(track(r, a));
}
house.add(ring(APEX_R, 0.07, APEX_Y + 0.08, M.ash, 'smoke_hole_ring', Math.PI * 2, 0, 64));

/* fixed doorway */
for (const s of [-1, 1]) {
  const a = s * DOOR;
  house.add(strut(at(RI + 0.1, a, 0), at(RI + 0.1, a, 2.25), 0.19, 0.17, M.oak, `door_jamb_${s > 0 ? 'east' : 'west'}`, 18));
}
house.add(strut(at(RI + 0.1, -DOOR, 2.2), at(RI + 0.1, DOOR, 2.2), 0.13, 0.13, M.oak, 'door_lintel', 14));

/* ---------- central hearth ---------- */
const ashBed = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.82, 0.07, 48), M.stone);
ashBed.name = 'hearth_ash_bed';
ashBed.position.y = 0.035;
house.add(ashBed);
for (let i = 0; i < 13; i++) {
  const a = (i / 13) * Math.PI * 2;
  const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 + rnd(i) * 0.05, 0),
    rnd(i * 3.9) > 0.45 ? M.sooted : M.stone);
  s.name = `kerb_stone_${i + 1}`;
  s.position.copy(at(0.86, a, 0.07));
  s.rotation.set(rnd(i + 9) * 3, a, rnd(i + 3) * 3);
  s.scale.set(1, 0.8, 1);
  house.add(s);
}
/* charcoal bed and ash */
for (let i = 0; i < 26; i++) {
  const a = rnd(i * 3.3) * Math.PI * 2, r = Math.sqrt(rnd(i * 5.9)) * 0.66;
  const ch = new THREE.Mesh(new THREE.DodecahedronGeometry(0.03 + rnd(i * 7.1) * 0.05, 0), M.char);
  ch.name = `hearth_charcoal_${i + 1}`;
  ch.position.set(r * Math.sin(a), 0.075 + rnd(i) * 0.02, r * Math.cos(a));
  ch.rotation.set(rnd(i + 1) * 3, rnd(i + 2) * 3, rnd(i + 3) * 3);
  ch.scale.y = 0.6;
  house.add(ch);
}

/* glowing embers under the pyre */
const emberMat = new THREE.MeshStandardMaterial({
  color: 0xff7a24, emissive: 0xff5a10, emissiveIntensity: 2.4, roughness: 0.9,
});
emberMat.name = 'ember_glow';
const embers = [];
for (let i = 0; i < 34; i++) {
  const a = rnd(i * 11.7 + 2) * Math.PI * 2, r = Math.sqrt(rnd(i * 13.3)) * 0.5;
  const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03 + rnd(i * 17.9) * 0.034, 0), emberMat);
  e.name = `hearth_ember_${i + 1}`;
  e.position.set(r * Math.sin(a), 0.085 + rnd(i * 19.1) * 0.03, r * Math.cos(a));
  e.userData.phase = rnd(i * 23.3) * 6.28;
  embers.push(e);
  house.add(e);
}

/* the pyre: split logs leaning into a cone, bark grain, charred ends */
const logMats = [M.char, M.oak, WOOD.oak, WOOD.ash, WOOD.hazel];
for (let i = 0; i < 9; i++) {
  const a = (i / 9) * Math.PI * 2 + 0.25;
  const lean = 0.44 + rnd(i * 29.7) * 0.16;
  const lg = strut(at(lean, a, 0.09), at(0.05, a + Math.PI * 0.12, 0.52 + rnd(i * 31.1) * 0.22),
    0.055 + rnd(i) * 0.02, 0.045, logMats[i % logMats.length], `hearth_log_${i + 1}`, 12);
  gnarl(lg.geometry, 0.6, i * 13 + 5, 0.14, 0.01);
  house.add(lg);
}
for (let i = 0; i < 3; i++) {   // fallen logs across the bed
  const a = rnd(i * 41.3) * Math.PI * 2;
  const lg = strut(at(0.62, a, 0.13), at(0.62, a + Math.PI * 0.8, 0.13 + rnd(i) * 0.05),
    0.06, 0.05, i ? M.char : WOOD.oak, `hearth_fallen_log_${i + 1}`, 12);
  gnarl(lg.geometry, 0.9, i * 7 + 3, 0.12, 0.008);
  house.add(lg);
}

/* flames — irregular emissive cones that flicker */
const flameMats = [
  new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffd98a, emissiveIntensity: 2.6,
    transparent: true, opacity: 0.92, depthWrite: false, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0xffa03a, emissive: 0xff8a22, emissiveIntensity: 2.2,
    transparent: true, opacity: 0.62, depthWrite: false, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0xff6a18, emissive: 0xf25a10, emissiveIntensity: 1.8,
    transparent: true, opacity: 0.4, depthWrite: false, roughness: 1 }),
];
flameMats[0].name = 'flame_core';
flameMats[1].name = 'flame_body';
flameMats[2].name = 'flame_tip';
const flames = [];
for (let i = 0; i < 11; i++) {
  const tier = i < 3 ? 0 : i < 7 ? 1 : 2;
  const rad = [0.1, 0.15, 0.2][tier] * (0.7 + rnd(i * 43.7) * 0.6);
  const hgt = [0.42, 0.7, 1.0][tier] * (0.75 + rnd(i * 47.1) * 0.5);
  const g = new THREE.ConeGeometry(rad, hgt, 12, 4);
  gnarl(g, hgt, i * 11 + 9, 0.3, 0.02);
  const f = new THREE.Mesh(g, flameMats[tier]);
  f.name = `fire_flame_${i + 1}`;
  const a = rnd(i * 53.3) * Math.PI * 2, r = rnd(i * 59.7) * 0.2;
  f.position.set(r * Math.sin(a), 0.14 + hgt / 2, r * Math.cos(a));
  f.castShadow = false;
  f.userData = { baseY: f.position.y, h: hgt, phase: rnd(i * 61.1) * 6.28, speed: 1.6 + rnd(i * 67.3) * 2.6 };
  flames.push(f);
  house.add(f);
}

/* smoke drifting up to the smoke hole */
const smokeMat = new THREE.MeshStandardMaterial({
  color: 0x9a958c, transparent: true, opacity: 0.075, depthWrite: false, roughness: 1,
});
smokeMat.name = 'hearth_smoke';
const smoke = [];
for (let i = 0; i < 9; i++) {
  const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + rnd(i * 71.3) * 0.34, 1), smokeMat);
  p.name = `hearth_smoke_${i + 1}`;
  p.castShadow = false;
  p.userData = { t: rnd(i * 73.9), speed: 0.055 + rnd(i * 79.1) * 0.05, sway: rnd(i * 83.3) * 6.28 };
  smoke.push(p);
  house.add(p);
}

/* ---------- seed altar ringing the fire ---------- */
const SEED_MATS = {
  acorn:   mat('seed_acorn_brown', 0x8a5f2c, 0.7),
  cap:     mat('seed_acorn_cap', 0x5f4321, 0.85),
  nut:     mat('seed_hazelnut', 0xa9763c, 0.65),
  mast:    mat('seed_beech_mast', 0x7a4d2a, 0.8),
  key:     mat('seed_ash_key', 0xc9b183, 0.8),
  berryRed: mat('seed_berry_red', 0xa3231d, 0.55),
  berryDark: mat('seed_berry_dark', 0x2b2a44, 0.55),
  cone:    mat('seed_pine_cone', 0x6b4a2a, 0.8),
  pip:     mat('seed_pip_black', 0x2e2318, 0.6),
  husk:    mat('seed_husk_pale', 0xd8c49a, 0.85),
};

/* twelve bowls on a low oak ring, each holding a different tree's seed */
const OFFERINGS = [
  ['oak_acorns', 'acorn', 'acorn'],
  ['hazel_nuts', 'nut', 'sphere'],
  ['beech_mast', 'mast', 'spike'],
  ['ash_keys', 'key', 'key'],
  ['rowan_berries', 'berryRed', 'sphere'],
  ['sloe_blackthorn', 'berryDark', 'sphere'],
  ['yew_arils', 'berryRed', 'sphere'],
  ['pine_cones', 'cone', 'spike'],
  ['apple_pips', 'pip', 'pip'],
  ['hawthorn_haws', 'berryRed', 'sphere'],
  ['birch_catkin_seed', 'husk', 'key'],
  ['elder_berries', 'berryDark', 'sphere'],
];

const altar = new THREE.Group();
altar.name = 'seed_altar';
const ALTAR_R = 1.34, BOWL_R = 0.17;

for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
  const [label, matKey, shape] = OFFERINGS[i];
  const seedMat = SEED_MATS[matKey];

  const chord = 2 * Math.PI * ALTAR_R / 12 * 1.08;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, chord),
    [M.oakFloorA, M.oakFloorB, M.oakFloorC][i % 3]);
  plinth.name = `altar_plinth_${i + 1}`;
  plinth.position.set(ALTAR_R * Math.sin(a), 0.05, ALTAR_R * Math.cos(a));
  plinth.rotation.y = a;
  altar.add(plinth);

  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry([
      new THREE.Vector2(0.001, 0), new THREE.Vector2(BOWL_R * 0.55, 0.005),
      new THREE.Vector2(BOWL_R * 0.9, 0.035), new THREE.Vector2(BOWL_R, 0.075),
      new THREE.Vector2(BOWL_R - 0.016, 0.075), new THREE.Vector2(BOWL_R * 0.78, 0.028),
      new THREE.Vector2(0.001, 0.014),
    ], 32), M.oak);
  bowl.name = `altar_bowl_${i + 1}_${label}`;
  bowl.position.set(ALTAR_R * Math.sin(a), 0.1, ALTAR_R * Math.cos(a));
  altar.add(bowl);

  for (let k = 0; k < 15; k++) {
    const sd = i * 37 + k * 5 + 1;
    const rr = Math.sqrt(rnd(sd)) * (BOWL_R - 0.05);
    const aa = rnd(sd + 3) * Math.PI * 2;
    const px = ALTAR_R * Math.sin(a) + rr * Math.cos(aa);
    const pz = ALTAR_R * Math.cos(a) + rr * Math.sin(aa);
    const py = 0.13 + (1 - rr / BOWL_R) * 0.035 + rnd(sd + 7) * 0.012;
    let seed;
    if (shape === 'acorn') {
      seed = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), seedMat);
      seed.scale.set(1, 1.5, 1);
      const capMesh = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 8,
        0, Math.PI * 2, 0, Math.PI * 0.5), SEED_MATS.cap);
      capMesh.name = `altar_seed_${i + 1}_${k + 1}_cap`;
      capMesh.position.set(px, py + 0.022, pz);
      capMesh.scale.set(1.08, 0.8, 1.08);
      altar.add(capMesh);
    } else if (shape === 'spike') {
      seed = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.055, 8), seedMat);
      seed.rotation.set(rnd(sd + 11) * 3, rnd(sd + 13) * 3, rnd(sd + 17) * 1.4);
    } else if (shape === 'key') {
      seed = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.07), seedMat);
      seed.rotation.set(rnd(sd + 19) * 0.4, rnd(sd + 23) * 3, rnd(sd + 29) * 0.3);
    } else if (shape === 'pip') {
      seed = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), seedMat);
      seed.scale.set(1, 0.7, 1.6);
      seed.rotation.y = rnd(sd + 31) * 3;
    } else {
      seed = new THREE.Mesh(new THREE.SphereGeometry(0.019 + rnd(sd + 37) * 0.006, 12, 10), seedMat);
    }
    seed.name = `altar_seed_${i + 1}_${k + 1}_${label}`;
    seed.position.set(px, py, pz);
    altar.add(seed);
  }
}
house.add(altar);

/* ---------- woven rugs ---------- */
/* each rug is a cell grid; every cell is a small raised box of dyed wool,
   merged per colour so the whole rug exports as a handful of named parts */
function rug({ name, w, d, cell = 0.062, pos, rotY, pattern, palette, fringe = true, seed = 0 }) {
  const cols = Math.max(4, Math.round(w / cell));
  const rows = Math.max(4, Math.round(d / cell));
  const cw = w / cols, cd = d / rows;
  const g = new THREE.Group();
  g.name = name;
  g.position.set(pos[0], 0.008, pos[1]);
  g.rotation.y = rotY;

  const backing = new THREE.Mesh(new THREE.BoxGeometry(w + 0.01, 0.012, d + 0.01), WOOL.charcoal);
  backing.name = `${name}_backing`;
  backing.position.y = 0.006;
  g.add(backing);

  const buckets = new Map();
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const key = pattern(i, j, cols, rows, palette);
      const weave = ((i + j) % 2) === 0;
      const h = weave ? 0.019 : 0.013;
      const jit = (rnd(seed + i * 31 + j * 7) - 0.5) * 0.0015;
      const item = {
        pos: [(i + 0.5) * cw - w / 2, 0.006 + h / 2 + jit, (j + 0.5) * cd - d / 2],
        size: [cw * (weave ? 1.0 : 0.88), h, cd * (weave ? 0.88 : 1.0)],
      };
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(item);
    }
  }
  for (const [key, items] of buckets) {
    g.add(mergeBoxes(items, WOOL[key], `${name}_${key}`));
  }

  if (fringe) {
    const strands = [];
    const n = Math.round(w / 0.035);
    for (let s = 0; s < n; s++) {
      for (const side of [-1, 1]) {
        const len = 0.1 + rnd(seed + s * 13 + side) * 0.05;
        strands.push({
          pos: [(s + 0.5) * (w / n) - w / 2, 0.012, side * (d / 2 + len / 2)],
          size: [0.012, 0.01, len],
          rotY: (rnd(seed + s) - 0.5) * 0.25,
        });
      }
    }
    g.add(mergeBoxes(strands, WOOL.cream, `${name}_fringe`));
  }
  return g;
}

const lozenge = (i, j, cols, rows) => {
  if (i === 0 || j === 0 || i === cols - 1 || j === rows - 1) return 'walnut';
  if (i === 1 || j === 1 || i === cols - 2 || j === rows - 2) return 'cream';
  const u = Math.abs(i - (cols - 1) / 2) / ((cols - 1) / 2);
  const v = Math.abs(j - (rows - 1) / 2) / ((rows - 1) / 2);
  const band = Math.round((u + v) * 5.5) % 4;
  return ['woad', 'cream', 'madder', 'weld'][band];
};

const tartan = (i, j, cols, rows) => {
  if (i < 1 || j < 1 || i > cols - 2 || j > rows - 2) return 'charcoal';
  const sx = [0, 0, 1, 1, 2, 0, 3, 3][i % 8];
  const sy = [0, 1, 1, 2, 0, 3, 3, 2][j % 8];
  const k = (sx + sy) % 4;
  return ['woad', 'lichen', 'cream', 'walnut'][k];
};

const chevron = (i, j, cols, rows) => {
  if (j < 1 || j > rows - 2) return 'walnut';
  const zig = Math.abs(((i + Math.floor(j * 1.5)) % 12) - 6);
  return ['madder', 'madder', 'cream', 'weld', 'weld', 'cream', 'walnut'][zig];
};

const keyFret = (i, j, cols, rows) => {
  if (i < 1 || j < 1 || i > cols - 2 || j > rows - 2) return 'madder';
  const m = (i % 6), n = (j % 6);
  if (m === 0 || n === 0) return 'cream';
  if (m < 3 && n < 3) return 'woad';
  if (m > 3 && n > 3) return 'lichen';
  return 'cream';
};

const rugs = new THREE.Group();
rugs.name = 'woven_rugs';
rugs.add(rug({ name: 'rug_lozenge', w: 2.5, d: 1.7, pos: [0, 2.35], rotY: 0.04, pattern: lozenge, seed: 3 }));
rugs.add(rug({ name: 'rug_tartan', w: 2.2, d: 1.5, pos: [-2.7, -1.5], rotY: 1.02, pattern: tartan, seed: 17 }));
rugs.add(rug({ name: 'rug_chevron', w: 2.6, d: 1.4, pos: [2.65, -1.45], rotY: -1.05, pattern: chevron, seed: 41 }));
rugs.add(rug({ name: 'rug_keyfret', w: 2.0, d: 1.35, pos: [-1.7, -4.35], rotY: 2.72, pattern: keyFret, seed: 59 }));
rugs.add(rug({ name: 'rug_runner', w: 3.4, d: 0.85, cell: 0.055, pos: [0, 4.15], rotY: 0, pattern: chevron, seed: 77 }));
house.add(rugs);

/* ---------- staff gallery ---------- */
/* the 36 Origin Spiral staffs — token order and species codes from
   contracts/scripts/generateOriginMetadata.ts in S33D-life/Ancient-Friends- */
const IMAGE_CID = 'bafybeifhxjg25llq53foszdeyzujn4dgo3tc3hnbavqbsrdtn3cctbe6hq';
const nftImage = (tokenId) => `https://gateway.pinata.cloud/ipfs/${IMAGE_CID}/${tokenId}.jpg`;

const SPECIES = [
  ['GOA', 'willow'], ['PLUM', 'plum'], ['BEE', 'beech'], ['RHOD', 'cherry'],
  ['CHERRY', 'cherry'], ['ROW', 'rowan'], ['PINE', 'pine'], ['BOX', 'spindle'],
  ['OAK', 'oak'], ['PRIVET', 'holly'], ['WILLOW', 'willow'], ['SYC', 'beech'],
  ['HAZ', 'hazel'], ['HORN', 'ash'], ['YEW', 'yew'], ['ASH', 'ash'],
  ['HOL', 'holly'], ['SWE', 'oak'], ['APP', 'apple'], ['IVY', 'juniper'],
  ['ELD', 'spindle'], ['HAW', 'hawthorn'], ['PLA', 'birch'], ['BUCK', 'walnut'],
  ['BIR', 'birch'], ['ROSE', 'rowan'], ['BUD', 'juniper'], ['CRAB', 'apple'],
  ['DAWN', 'alder'], ['HORS', 'beech'], ['JAPA', 'plum'], ['MED', 'hazel'],
  ['PEAR', 'apple'], ['SLOE', 'blackthorn'], ['WITC', 'hazel'], ['ALD', 'alder'],
];

/* each NFT hangs as a framed panel on the wall behind its staff: a canvas
   plate (token number + species code) shows instantly, then the IPFS
   artwork swaps in once it loads */
/* artwork loads one at a time and is downsampled to 512px so 36 full-size
   photographs never land on the GPU at once */
const artQueue = [];
function drainArtQueue() {
  const next = artQueue.shift();
  if (!next) return;
  const [tokenId, material] = next;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  const done = () => { setTimeout(drainArtQueue, 60); };
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    x.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2,
      side, side, 0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    material.map?.dispose();
    material.map = tex;
    material.needsUpdate = true;
    done();
  };
  img.onerror = done;
  img.src = nftImage(tokenId);
}

function plateTexture(tokenId, code) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#f2ead8';
  x.fillRect(0, 0, 512, 512);
  x.strokeStyle = 'rgba(150,132,102,0.35)';
  x.lineWidth = 1;
  for (let i = 6; i < 512; i += 9) { x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
  x.strokeStyle = '#8d7a58';
  x.lineWidth = 6;
  x.strokeRect(22, 22, 468, 468);
  x.lineWidth = 2;
  x.strokeRect(40, 40, 432, 432);
  x.fillStyle = '#3a3229';
  x.textAlign = 'center';
  x.font = '22px Helvetica, Arial, sans-serif';
  x.fillText('ANCIENT FRIENDS', 256, 104);
  x.font = 'bold 96px Helvetica, Arial, sans-serif';
  x.fillText(code, 256, 268);
  x.fillStyle = '#8a5a2a';
  x.font = 'bold 40px Helvetica, Arial, sans-serif';
  x.fillText('#' + tokenId, 256, 340);
  x.fillStyle = '#6b6154';
  x.font = '22px Helvetica, Arial, sans-serif';
  x.fillText('ORIGIN SPIRAL · GENESIS', 256, 410);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const RACK_R = 4.86, RAIL_R = 4.98;
const S_START = DOOR + 0.1, S_LEN = Math.PI * 2 - 2 * DOOR - 0.2;


SPECIES.forEach(([name, woodKey], i) => {
  const tokenId = i + 1;
  const a = S_START + ((i + 0.5) / SPECIES.length) * S_LEN;
  const r0 = rnd(i), r1 = rnd(i + 41), r2 = rnd(i + 83);
  const len = 1.55 + r0 * 0.42;
  const base = at(RACK_R - 0.02 + r1 * 0.03, a, 0.0);
  const top = at(RACK_R + 0.14, a, len);
  const thick = 0.021 + r1 * 0.013;
  const wood = WOOD[woodKey];
  const id = String(i + 1).padStart(2, '0');
  const staff = strut(base, top, thick * 1.18, thick * 0.82, wood, `staff_${id}_${name}`, 20);
  gnarl(staff.geometry, len, i * 3 + 1, 0.2 + r2 * 0.16, 0.02 + r0 * 0.03);
  house.add(staff);

  if (r2 > 0.62) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(thick * 1.9, 20, 14), wood);
    k.name = `staff_${id}_${name}_knop`;
    k.position.copy(top);
    k.scale.y = 0.82;
    house.add(k);
  } else if (r2 > 0.34) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(thick * 1.35, thick * 1.35, 0.14, 14), M.slate);
    grip.name = `staff_${id}_${name}_grip`;
    grip.position.copy(base.clone().lerp(top, 0.78));
    grip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(top, base).normalize());
    house.add(grip);
  }

  /* the framed NFT hangs beside its staff, not behind it */
  const aFrame = a - (S_LEN / SPECIES.length) * 0.5;

  const label = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.085, 0.016), M.slate);
  label.name = `label_${id}_${name}`;
  label.position.copy(at(RAIL_R + 0.015, aFrame, 0.3));
  label.rotation.y = aFrame;
  house.add(label);

  /* framed NFT on the wall behind the staff */
  const PANEL_Y = 1.22, PW = 0.5;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(PW + 0.08, PW + 0.08, 0.045), M.oak);
  frame.name = `nft_frame_${id}_${name}`;
  frame.position.copy(at(5.16, aFrame, PANEL_Y));
  frame.rotation.y = aFrame + Math.PI;
  house.add(track(frame, aFrame));

  const faceMat = new THREE.MeshStandardMaterial({
    map: plateTexture(tokenId, name), roughness: 0.6, metalness: 0,
  });
  faceMat.name = `nft_art_${id}_${name}`;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(PW, PW), faceMat);
  face.name = `nft_${id}_${name}`;
  face.position.copy(at(5.135, aFrame, PANEL_Y));
  face.rotation.y = aFrame + Math.PI;
  house.add(track(face, aFrame));

  artQueue.push([tokenId, faceMat]);
});

stage.setObject(house);

/* keep the shadow map static — the scene never moves */
if (stage._renderer) {
  stage._renderer.shadowMap.autoUpdate = false;
  stage._renderer.shadowMap.needsUpdate = true;
}

let artStarted = false;
const startArt = () => { if (!artStarted) { artStarted = true; drainArtQueue(); } };
window.addEventListener('load', () => setTimeout(startArt, 200));
setTimeout(startArt, 2500);

/* ---------- the cutaway follows the camera ---------- */
let glow = null;
const camAz = new THREE.Vector3();
let lastAz = NaN;
function applyCut(force) {
  const cam = stage._camera;
  if (!cam) return;
  cam.getWorldPosition(camAz);
  const az = Math.atan2(camAz.x, camAz.z);
  if (!force && Math.abs(norm(az - lastAz)) < 0.004) return;
  lastAz = az;
  for (const p of cutaway) p.visible = Math.abs(norm(p.userData.cutAngle - az)) > CUT;
  shadowsDirty = true;
}
/* the shadow pass costs ~50 ms over the whole building, so it runs at most a
   few times a second while orbiting rather than on every frame */
let shadowsDirty = true, lastShadow = -1;
function refreshShadows(t) {
  if (!shadowsDirty || !stage._renderer) return;
  if (lastShadow > 0 && t - lastShadow < 0.22) return;
  stage._renderer.shadowMap.needsUpdate = true;
  lastShadow = t;
  shadowsDirty = false;
}
const anim = [];
const clock = { t: 0 };
(function tick() {
  applyCut(false);
  clock.t += 0.016;
  const t = clock.t;
  for (const f of flames) {
    const u = f.userData;
    const flick = 0.82 + 0.3 * Math.sin(t * u.speed + u.phase)
      + 0.12 * Math.sin(t * u.speed * 2.7 + u.phase * 1.7);
    f.scale.set(0.9 + 0.16 * Math.sin(t * u.speed * 1.3 + u.phase), flick, 0.9 + 0.16 * Math.cos(t * u.speed * 1.1 + u.phase));
    f.position.y = u.baseY + (flick - 1) * u.h * 0.45;
    f.rotation.y = Math.sin(t * 0.7 + u.phase) * 0.3;
  }
  for (const e of embers) {
    e.material.emissiveIntensity = 1.6;
    e.scale.setScalar(0.9 + 0.18 * Math.sin(t * 2.1 + e.userData.phase));
  }
  for (const p of smoke) {
    const u = p.userData;
    u.t += u.speed * 0.016;
    if (u.t > 1) u.t -= 1;
    const h = 0.7 + u.t * 3.6;
    p.position.set(Math.sin(u.sway + u.t * 3) * (0.1 + u.t * 0.5), h, Math.cos(u.sway + u.t * 2.4) * (0.1 + u.t * 0.5));
    p.scale.setScalar(0.5 + u.t * 1.5);
    p.material.opacity = 0.075;
    p.visible = true;
  }
  if (glow) {
    glow.intensity = 13 + 4.5 * Math.sin(t * 5.1) + 2.5 * Math.sin(t * 11.3 + 1.2);
    glow.position.y = 0.42 + 0.05 * Math.sin(t * 3.7);
  }
  for (const fn of anim) fn(t);
  refreshShadows(t);
  requestAnimationFrame(tick);
})();

/* ---------- click a framed NFT to open it full screen with its staff ---------- */
/* raycast the panels and staffs; a hit opens an overlay holding the full-size
   IPFS artwork beside a live 3D view of the staff that hangs next to it */
const galleryIndex = new Map();     // '01' -> { id, name, tokenId, faceMat }
SPECIES.forEach(([name, woodKey], i) => {
  const id = String(i + 1).padStart(2, '0');
  galleryIndex.set(id, { id, name, woodKey, tokenId: i + 1 });
});
house.traverse((o) => {
  const m = /^nft_art_(\d\d)_/.exec(o.material?.name || '');
  if (m && galleryIndex.has(m[1])) galleryIndex.get(m[1]).faceMat = o.material;
});

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pickables = [];
house.traverse((o) => { if (o.isMesh && /^(nft_|nft_frame_|staff_|label_)/.test(o.name)) pickables.push(o); });

function idFromName(n) {
  const m = /^(?:nft_frame_|nft_|staff_|label_)(\d\d)_/.exec(n);
  return m ? m[1] : null;
}

/* --- the overlay --- */
const ov = document.createElement('div');
ov.id = 'nft-lightbox';
ov.setAttribute('role', 'dialog');
ov.setAttribute('aria-modal', 'true');
ov.setAttribute('aria-label', 'Staff and artwork');
ov.style.cssText = 'position:fixed;inset:0;z-index:50;display:none;background:rgba(18,15,11,0.94);' +
  'backdrop-filter:blur(6px);font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;color:#efe6d4;';
ov.innerHTML =
  '<div style="position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,0.95fr);' +
  'grid-template-rows:1fr auto;gap:2vmin;padding:4vmin 4vmin 3vmin;box-sizing:border-box">' +
    '<div style="min-height:0;display:flex;align-items:center;justify-content:center">' +
      '<div id="nl-mat" style="padding:1.6vmin;background:#efe7d6;box-shadow:0 2vmin 6vmin rgba(0,0,0,0.6);' +
      'border:0.9vmin solid #6b5132;display:flex;max-height:100%;max-width:100%">' +
        '<img id="nl-img" alt="" style="display:block;max-height:76vh;max-width:100%;object-fit:contain;background:#2a2620">' +
      '</div>' +
    '</div>' +
    '<div style="min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4vmin">' +
      '<canvas id="nl-canvas" style="display:block;max-width:100%;border-radius:0.6vmin"></canvas>' +
      '<div id="nl-staffcap" style="font-size:max(11px,1.6vmin);letter-spacing:0.18em;text-transform:uppercase;opacity:0.62"></div>' +
    '</div>' +
    '<div style="grid-column:1 / -1;display:flex;align-items:baseline;gap:2.4vmin;flex-wrap:wrap;' +
    'border-top:1px solid rgba(239,230,212,0.22);padding-top:1.8vmin">' +
      '<div id="nl-token" style="font-size:max(17px,2.6vmin);letter-spacing:0.02em"></div>' +
      '<div id="nl-species" style="font-size:max(12px,1.7vmin);letter-spacing:0.22em;text-transform:uppercase;opacity:0.7"></div>' +
      '<div style="flex:1"></div>' +
      '<div id="nl-nav" style="display:flex;gap:1.2vmin;align-items:center"></div>' +
    '</div>' +
  '</div>' +
  '<button id="nl-close" aria-label="Close" style="position:absolute;top:2.2vmin;right:2.4vmin;width:max(44px,4.4vmin);height:max(44px,4.4vmin);' +
  'border-radius:50%;border:1px solid rgba(239,230,212,0.35);background:transparent;color:#efe6d4;font-size:max(20px,2.2vmin);' +
  'cursor:pointer;line-height:1">&times;</button>';
document.body.appendChild(ov);

const nlImg = ov.querySelector('#nl-img');
const nlCanvas = ov.querySelector('#nl-canvas');
const nlToken = ov.querySelector('#nl-token');
const nlSpecies = ov.querySelector('#nl-species');
const nlStaffCap = ov.querySelector('#nl-staffcap');
const nlNav = ov.querySelector('#nl-nav');

const navBtn = (label, fn) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText = 'padding:0.9vmin 1.8vmin;background:transparent;color:#efe6d4;border:1px solid rgba(239,230,212,0.32);' +
    'border-radius:0.4vmin;font:inherit;font-size:1.5vmin;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer';
  b.onclick = fn;
  nlNav.appendChild(b);
  return b;
};
navBtn('\u2190 Prev', () => stepPanel(-1));
navBtn('Next \u2192', () => stepPanel(1));

/* --- the little staff viewer --- */
let nlRenderer = null, nlScene = null, nlCam = null, nlPivot = null, nlRaf = 0;
function ensureStaffView() {
  if (nlRenderer) return;
  nlRenderer = new THREE.WebGLRenderer({ canvas: nlCanvas, antialias: true, alpha: true });
  nlRenderer.setPixelRatio(Math.min(2, devicePixelRatio));
  nlScene = new THREE.Scene();
  nlCam = new THREE.PerspectiveCamera(28, 1, 0.05, 40);
  nlScene.add(new THREE.HemisphereLight(0xfff3dd, 0x3a3226, 1.5));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.4);
  key.position.set(2.5, 3.5, 3);
  nlScene.add(key);
  const rim = new THREE.DirectionalLight(0xffb974, 1.2);
  rim.position.set(-3, 1.4, -2.2);
  nlScene.add(rim);
}
function showStaff(id) {
  ensureStaffView();
  if (nlPivot) nlScene.remove(nlPivot);
  nlPivot = new THREE.Group();
  const parts = [];
  house.traverse((o) => { if (o.isMesh && o.name.startsWith(`staff_${id}_`)) parts.push(o); });
  const holder = new THREE.Group();
  for (const p of parts) {
    const c = new THREE.Mesh(p.geometry, p.material);
    c.name = p.name + '_lightbox';
    p.updateWorldMatrix(true, false);
    c.applyMatrix4(p.matrixWorld);
    c.visible = true;
    holder.add(c);
  }
  const box = new THREE.Box3().setFromObject(holder);
  const ctr = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  holder.position.sub(ctr);
  nlPivot.add(holder);
  nlScene.add(nlPivot);
  const h = Math.max(size.y, 0.4);
  nlCam.position.set(0, 0, h * 2.5);
  nlCam.lookAt(0, 0, 0);
  resizeStaffView();
}
function resizeStaffView() {
  if (!nlRenderer) return;
  const w = Math.max(160, Math.min(nlCanvas.parentElement.clientWidth, 520));
  const hh = Math.max(220, Math.min(window.innerHeight * 0.66, 720));
  nlRenderer.setSize(w, hh, false);
  nlCanvas.style.width = w + 'px';
  nlCanvas.style.height = hh + 'px';
  nlCam.aspect = w / hh;
  nlCam.updateProjectionMatrix();
}
function spin() {
  nlRaf = requestAnimationFrame(spin);
  if (nlPivot) nlPivot.rotation.y += 0.006;
  nlRenderer.render(nlScene, nlCam);
}

let openId = null;
function openPanel(id) {
  const rec = galleryIndex.get(id);
  if (!rec) return;
  openId = id;
  nlToken.textContent = `Origin Spiral #${rec.tokenId}`;
  nlSpecies.textContent = rec.name;
  /* the repo carries only truncated species codes (StaffNFT.sol SPECIES_NAMES,
     with an updateSpeciesName setter still pending), so the caption asserts no
     species or wood — the code sits on the #nl-species line and the artwork
     itself prints the real name */
  nlStaffCap.textContent = 'the staff that hangs beside it';
  nlImg.removeAttribute('src');
  nlImg.style.aspectRatio = '1';                 // square placeholder while loading
  nlImg.onload = () => { nlImg.style.aspectRatio = ''; resizeStaffView(); };
  nlImg.src = nftImage(rec.tokenId);
  ov.style.display = 'block';
  showStaff(id);
  cancelAnimationFrame(nlRaf);
  spin();
}
function closePanel() {
  ov.style.display = 'none';
  openId = null;
  cancelAnimationFrame(nlRaf);
}
function stepPanel(d) {
  if (!openId) return;
  const n = SPECIES.length;
  const next = ((parseInt(openId, 10) - 1 + d) % n + n) % n;
  openPanel(String(next + 1).padStart(2, '0'));
}
ov.querySelector('#nl-close').onclick = closePanel;
ov.addEventListener('click', (e) => { if (e.target === ov) closePanel(); });
addEventListener('keydown', (e) => {
  if (ov.style.display === 'none') return;
  if (e.key === 'Escape') closePanel();
  if (e.key === 'ArrowLeft') stepPanel(-1);
  if (e.key === 'ArrowRight') stepPanel(1);
});
addEventListener('resize', resizeStaffView);

/* --- picking --- */
const dom = stage._renderer?.domElement;
if (dom) {
  let downAt = null;
  dom.style.cursor = 'default';
  dom.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  dom.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    if (e.__roomHandled) { downAt = null; return; }
    const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
    downAt = null;
    if (moved > 5) return;                     // that was an orbit drag
    const r = dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, stage._camera);
    const hits = ray.intersectObjects(pickables.filter((o) => o.visible), false);
    if (hits.length) {
      const id = idFromName(hits[0].object.name);
      if (id) openPanel(id);
    }
  });
  dom.addEventListener('pointermove', (e) => {
    const r = dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, stage._camera);
    const hits = ray.intersectObjects(pickables.filter((o) => o.visible), false);
    dom.style.cursor = hits.length && idFromName(hits[0].object.name) ? 'pointer' : 'default';
  });
}

/* exports carry the whole building: unhide for the duration of a download click */
stage.shadowRoot?.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    for (const p of cutaway) p.visible = true;
    lastAz = NaN;
    setTimeout(() => applyCut(true), 300);
  }, true);
});

if (stage._camera && stage._controls) {
  stage._camera.position.set(1.8, 3.6, 10.5);
  stage._controls.target.set(0, 1.5, -0.4);
  stage._controls.update();
}


/* ---------- trapdoor, tunnel and the hollow oak ---------- */
/* under the rug farthest from the door: a hinged oak trapdoor over a stone
   shaft, a timbered tunnel running out under the forest floor, and a spiral
   stair up inside the trunk of an ancient hollow oak */
const TD = [0, -3.15];                 // trapdoor centre on the floor
const TD_HALF = 0.55;                  // half-width of the opening
const TUN_Y = -3.4;                    // tunnel floor level
const OAK_Z = -22.5;                   // the ancient oak, out in the forest

M.iron   = M.iron   || mat('wrought_iron', 0x2f2b28, 0.55, 0.65);
const M2 = {
  rock:    mat('tunnel_drystone', 0x6a6459, 0.95),
  rockDk:  mat('tunnel_drystone_shade', 0x4e4a42, 0.95),
  packed:  mat('tunnel_packed_earth', 0x4a3c2d, 0.99),
  root:    mat('hanging_root', 0x4b3a29, 0.95),
  bark:    mat('ancient_oak_bark', 0x50412f, 0.95),
  barkDk:  mat('ancient_oak_bark_shade', 0x3b3023, 0.95),
  heart:   mat('oak_heartwood', 0x7a5c37, 0.85),
  leaf:    mat('ancient_oak_leaf', 0x3f5a2a, 0.92),
  leafPale:mat('ancient_oak_leaf_sun', 0x5c7434, 0.92),
};
addGrain(M2.heart, 137, { bands: 240, knots: 6, ray: 1, bump: 1 }, [2, 2]);
addGrain(M2.bark, 149, { bands: 300, knots: 4, ray: 0.3, bump: 1.3 }, [2, 6]);
addGrain(M2.barkDk, 151, { bands: 340, knots: 7, ray: 0.2, bump: 1.6 }, [2, 5]);
Object.assign(M2, {
  barkPale: mat('ancient_oak_bark_lichen', 0x6d6350, 0.96),
  moss:     mat('oak_moss', 0x4e6b32, 0.99),
  lichen:   mat('oak_lichen_crust', 0x9aa584, 0.97),
  fungus:   mat('oak_bracket_fungus', 0xbd8f4e, 0.9),
  ivy:      mat('oak_ivy_leaf', 0x2f4a24, 0.93),
  ivyStem:  mat('oak_ivy_stem', 0x584833, 0.96),
  mistle:   mat('oak_mistletoe', 0x86a35c, 0.93),
  berry:    mat('oak_mistletoe_berry', 0xe8ecd6, 0.55),
  acorn:    mat('oak_acorn', 0x8a6a34, 0.8),
  leafDeep: mat('ancient_oak_leaf_shade', 0x2c4420, 0.93),
  leafTurn: mat('ancient_oak_leaf_turning', 0x7d7a33, 0.93),
});
addGrain(M2.barkPale, 157, { bands: 260, knots: 5, ray: 0.3, bump: 1.4 }, [2, 5]);
const M2rune = new THREE.MeshStandardMaterial({ name: 'oak_rune_glow', color: 0x3a4a38, emissive: 0x5f9e72, emissiveIntensity: 0.45, roughness: 0.85 });
const M2wisp = new THREE.MeshStandardMaterial({ name: 'oak_wisp', color: 0x9fd8ad, emissive: 0x7fc98a, emissiveIntensity: 0.9, roughness: 1, transparent: true, opacity: 0.5 });
const M2lant = new THREE.MeshStandardMaterial({ name: 'oak_lantern_glass', color: 0xffe2a8, emissive: 0xffbf5e, emissiveIntensity: 2.4, roughness: 0.6, transparent: true, opacity: 0.9 });

const under = new THREE.Group();
under.name = 'trapdoor_tunnel_and_hollow_oak';

/* --- the opening in the floor --- */
/* cull on each board's true footprint, not its centre: the hexagon courses
   are up to 2.3 m long and would otherwise run straight across the opening */
planks.updateMatrixWorld(true);
const OPEN = TD_HALF + 0.08;
const bb = new THREE.Box3();
for (const c of [...planks.children]) {
  if (!/^floor_board/.test(c.name)) continue;
  bb.setFromObject(c);
  if (bb.max.x > TD[0] - OPEN && bb.min.x < TD[0] + OPEN &&
      bb.max.z > TD[1] - OPEN && bb.min.z < TD[1] + OPEN) planks.remove(c);
}
/* recut the solid sub-discs with a square hole so the shaft is open to view */
function holedDisc(radius, thick, material, name, y, curveSegments = 24) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  const h = new THREE.Path();
  const hx = TD[0], hz = TD[1];
  h.moveTo(hx - TD_HALF, hz - TD_HALF);
  h.lineTo(hx + TD_HALF, hz - TD_HALF);
  h.lineTo(hx + TD_HALF, hz + TD_HALF);
  h.lineTo(hx - TD_HALF, hz + TD_HALF);
  h.closePath();
  shape.holes.push(h);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments }), material);
  m.name = name;
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  return m;
}
planks.remove(floorDisc);
planks.add(holedDisc(FLOOR_R - 0.01, PT * 0.9, M.oakFloorA, 'floor_underboard', -PT * 0.45 - 0.012 + PT * 0.45));
house.remove(subfloor);
house.add(holedDisc(5.62, 0.18, M.char, 'floor_substructure', -0.05));
ground.remove(soilDisc);
ground.add(holedDisc(GR, 0.3, M.soil, 'soil_bed', -0.15, 96));

/* oak curb framing the hole */
for (let i = 0; i < 4; i++) {
  const a = i * Math.PI / 2;
  const curb = new THREE.Mesh(new THREE.BoxGeometry(TD_HALF * 2 + 0.3, 0.1, 0.15),
    [M.oakFloorA, M.oakFloorB][i % 2]);
  curb.name = `trapdoor_curb_${i + 1}`;
  curb.position.set(TD[0] + Math.sin(a) * (TD_HALF + 0.075), 0.03, TD[1] + Math.cos(a) * (TD_HALF + 0.075));
  curb.rotation.y = a;
  under.add(curb);
}

/* the leaf, thrown back open on its hinges */
const leaf = new THREE.Group();
leaf.name = 'trapdoor_leaf';
leaf.position.set(TD[0], 0.06, TD[1] - TD_HALF - 0.08);
leaf.rotation.x = 1.28;
for (let i = 0; i < 5; i++) {
  const pl = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.06, TD_HALF * 2 + 0.06),
    [M.oakFloorA, M.oakFloorB, M.oakFloorC][i % 3]);
  pl.name = `trapdoor_plank_${i + 1}`;
  pl.position.set((i - 2) * 0.225, 0, -(TD_HALF + 0.03));
  leaf.add(pl);
}
for (const zf of [-0.22, -0.9]) {
  const strap = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.022, 0.09), M.iron);
  strap.name = `trapdoor_strap_${zf < -0.5 ? 2 : 1}`;
  strap.position.set(0, 0.04, zf);
  leaf.add(strap);
}
const ringPull = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 20), M.iron);
ringPull.name = 'trapdoor_ring_pull';
ringPull.position.set(0, 0.07, -0.95);
ringPull.rotation.x = Math.PI / 2;
leaf.add(ringPull);
under.add(leaf);
for (const xs of [-0.38, 0.38]) {
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.2), M.iron);
  h.name = `trapdoor_hinge_${xs < 0 ? 1 : 2}`;
  h.position.set(TD[0] + xs, 0.07, TD[1] - TD_HALF - 0.06);
  under.add(h);
}

/* --- stone shaft down --- */
for (let i = 0; i < 4; i++) {
  const a = i * Math.PI / 2;
  const w = new THREE.Mesh(new THREE.BoxGeometry(TD_HALF * 2 + 0.4, Math.abs(TUN_Y) + 0.02, 0.16), i % 2 ? M2.rockDk : M2.rock);
  w.name = `shaft_wall_${i + 1}`;
  w.position.set(TD[0] + Math.sin(a) * (TD_HALF + 0.03), (TUN_Y + 0.02) / 2, TD[1] + Math.cos(a) * (TD_HALF + 0.03));
  w.rotation.y = a;
  under.add(w);
}
/* ladder in the shaft */
for (const xs of [-0.3, 0.3]) {
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, Math.abs(TUN_Y) - 0.08, 8), WOOD.ash);
  st.name = `shaft_ladder_stringer_${xs < 0 ? 1 : 2}`;
  st.position.set(TD[0] + xs, (TUN_Y - 0.08) / 2, TD[1] + 0.22);
  under.add(st);
}
for (let i = 0; i < 9; i++) {
  const rg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 7), WOOD.hazel);
  rg.name = `shaft_ladder_rung_${i + 1}`;
  rg.rotation.z = Math.PI / 2;
  rg.position.set(TD[0], -0.35 - i * 0.36, TD[1] + 0.22);
  under.add(rg);
}

/* --- tunnel from the shaft out to the oak --- */
const Z0 = TD[1] - 0.7, Z1 = OAK_Z + 1.9;
const LEN = Z0 - Z1;
const TW = 1.34, TH = 2.05;
const pad = new THREE.Mesh(new THREE.BoxGeometry(TD_HALF * 2 + 0.5, 0.16, 1.7), M2.rockDk);
pad.name = 'shaft_landing_slab';
pad.position.set(TD[0], TUN_Y - 0.08, TD[1] - 0.3);
under.add(pad);
const tfloor = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.3, 0.14, LEN), M2.packed);
tfloor.name = 'tunnel_floor';
tfloor.position.set(0, TUN_Y - 0.07, (Z0 + Z1) / 2);
under.add(tfloor);
for (const xs of [-1, 1]) {
  const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, TH, LEN), xs < 0 ? M2.rock : M2.rockDk);
  w.name = `tunnel_wall_${xs < 0 ? 'west' : 'east'}`;
  w.position.set(xs * (TW / 2 + 0.1), TUN_Y + TH / 2, (Z0 + Z1) / 2);
  under.add(w);
}
const vault = new THREE.Mesh(new THREE.CylinderGeometry(TW / 2 + 0.2, TW / 2 + 0.2, LEN, 18, 1, true, Math.PI / 2, Math.PI), M2.rock);
vault.name = 'tunnel_vault';
vault.rotation.set(Math.PI / 2, 0, 0);
vault.position.set(0, TUN_Y + TH, (Z0 + Z1) / 2);
under.add(vault);
const cap = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.6, 0.18, LEN), M2.packed);
cap.name = 'tunnel_capping_earth';
cap.position.set(0, TUN_Y + TH + 0.72, (Z0 + Z1) / 2);
under.add(cap);

/* timber ring frames, dangling roots, rush lights */
const FRAMES = Math.floor(LEN / 1.7);
for (let i = 0; i < FRAMES; i++) {
  const z = Z0 - 0.9 - i * (LEN - 1.4) / Math.max(1, FRAMES - 1);
  const fr = new THREE.Group();
  fr.name = `tunnel_frame_${i + 1}`;
  for (const xs of [-1, 1]) {
    const g = new THREE.CylinderGeometry(0.09, 0.105, TH - 0.15, 9);
    gnarl(g, TH - 0.15, 200 + i * 7 + xs, 0.1, 0.02);
    const post = new THREE.Mesh(g, WOOD.oak);
    post.name = `tunnel_frame_post_${i + 1}_${xs < 0 ? 1 : 2}`;
    post.position.set(xs * (TW / 2 - 0.02), TUN_Y + (TH - 0.15) / 2, z);
    fr.add(post);
  }
  const lint = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.14, 0.13, 0.16), WOOD.oak);
  lint.name = `tunnel_frame_lintel_${i + 1}`;
  lint.position.set(0, TUN_Y + TH - 0.08, z);
  fr.add(lint);
  under.add(fr);

  for (let k = 0; k < 4; k++) {
    const sd = i * 13 + k * 3.1;
    const ln = 0.18 + rnd(sd) * 0.42;
    const rt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.028, ln, 6), M2.root);
    rt.name = `tunnel_root_${i + 1}_${k + 1}`;
    rt.position.set((rnd(sd + 1) - 0.5) * TW * 0.9, TUN_Y + TH - 0.14 - ln / 2, z + (rnd(sd + 2) - 0.5) * 1.2);
    rt.rotation.set((rnd(sd + 4) - 0.5) * 0.5, 0, (rnd(sd + 5) - 0.5) * 0.5);
    under.add(rt);
  }

  if (i % 3 === 1) {
    const niche = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.3), M.char);
    niche.name = `tunnel_niche_${i + 1}`;
    niche.position.set(-(TW / 2 + 0.04), TUN_Y + 1.35, z + 0.5);
    under.add(niche);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.16, 8), M.tallow || M.daub);
    candle.name = `tunnel_candle_${i + 1}`;
    candle.position.set(-(TW / 2 - 0.02), TUN_Y + 1.3, z + 0.5);
    under.add(candle);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffc27a, emissive: 0xff9a3c, emissiveIntensity: 2.2, roughness: 1 }));
    fl.name = `tunnel_candle_flame_${i + 1}`;
    fl.scale.y = 1.7;
    fl.position.set(-(TW / 2 - 0.02), TUN_Y + 1.44, z + 0.5);
    under.add(fl);
  }
}

/* --- the ancient hollow oak --- */
const oak = new THREE.Group();
oak.name = 'ancient_hollow_oak';
oak.position.set(0, 0, OAK_Z);

const TRUNK_R = 2.0, TRUNK_H = 13.5;
const GAP_A = 0;                       // hollow doorway faces the roundhouse (+Z)
/* the trunk is built as writhing ribbons of bark: each stave climbs in three
   segments that twist around the hollow, so the whole bole appears to spiral */
const STAVES = 34, SEGS = 3;
const barks = [M2.bark, M2.barkDk, M2.barkPale];
const TRUNK_TOP = TRUNK_H * 1.12;
/* one profile governs the whole bole: the solid core and every bark ribbon are
   placed on it, so the ribbons converge as the trunk tapers and never splay */
const trunkR = (y) => TRUNK_R * (1.08 - 0.66 * Math.pow(Math.max(0, Math.min(1, (y + 0.5) / (TRUNK_TOP + 0.5))), 0.8));
for (let i = 0; i < STAVES; i++) {
  const a0 = (i / STAVES) * Math.PI * 2;
  if (Math.abs(norm(a0 - GAP_A)) < 0.32) continue;      // the split in the trunk
  const top = TRUNK_H * (0.7 + rnd(i * 3.3) * 0.38);
  /* twist always winds away from the doorway so no stave leans across it */
  const away = Math.sin(a0) >= 0 ? 1 : -1;
  const twist = away * (0.1 + rnd(i * 2.1) * 0.26);
  let y = -0.4, ribR = 0.32 + rnd(i * 7.1) * 0.14;
  for (let k = 0; k < SEGS; k++) {
    const h = (top + 0.4) * (k === 0 ? 0.42 : k === 1 ? 0.34 : 0.28);
    const a = a0 + twist * (k / SEGS);
    const r = trunkR(y + h / 2);
    /* each segment starts at the radius the one below ended on, so the ribbon
       is continuous instead of a stack of separate poles */
    const rb = ribR;
    const last = k === SEGS - 1;
    const rt = last ? 0.05 : Math.max(0.14, rb * (0.84 + rnd(i * 5.7 + k) * 0.1));
    ribR = rt;
    const g = new THREE.CylinderGeometry(rt, rb, h * 1.06, 9);
    gnarl(g, h * 1.06, 300 + i * 5 + k, 0.3, 0.07);
    const st = new THREE.Mesh(g, barks[(i + k) % 3]);
    st.name = `oak_trunk_stave_${i + 1}_${k + 1}`;
    st.position.set(r * Math.sin(a), y + h / 2, r * Math.cos(a));
    st.rotation.set((rnd(i * 9.1 + k) - 0.5) * 0.05, a, twist * 0.22 + (rnd(i * 11.3 + k) - 0.5) * 0.04);
    oak.add(st);
    if (last) {   // knotted burl closing the ribbon tip
      const capk = new THREE.Mesh(new THREE.IcosahedronGeometry(rb * 0.8, 1), barks[(i + 1) % 3]);
      capk.name = `oak_stave_tip_burl_${i + 1}`;
      capk.scale.set(1, 0.65, 1);
      capk.position.set(r * Math.sin(a), y + h * 0.9, r * Math.cos(a));
      oak.add(capk);
    }
    y += h * 0.99;
    /* burls, lichen crusts and knot-hole eyes swelling out of the bark */
    if (rnd(i * 13.3 + k) > 0.55) {
      const br = 0.18 + rnd(i * 17.1 + k) * 0.28;
      const bu = new THREE.Mesh(new THREE.IcosahedronGeometry(br, 1), barks[(i + k + 1) % 3]);
      bu.name = `oak_burl_${i + 1}_${k + 1}`;
      bu.scale.set(1, 0.72 + rnd(i + k) * 0.5, 0.78);
      const ba = a + (rnd(i * 19 + k) - 0.5) * 0.2;
      bu.position.set((r + br * 0.45) * Math.sin(ba), y - h * (0.3 + rnd(i * 23 + k) * 0.45), (r + br * 0.45) * Math.cos(ba));
      oak.add(bu);
    }
    if (rnd(i * 29.7 + k) > 0.84) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.char);
      eye.name = `oak_knot_hole_${i + 1}_${k + 1}`;
      eye.scale.set(1, 0.8, 0.5);
      eye.rotation.set(Math.PI / 2, 0, 0);
      eye.position.set((r + 0.16) * Math.sin(a), y - h * 0.5, (r + 0.16) * Math.cos(a));
      eye.lookAt(new THREE.Vector3(0, y - h * 0.5, 0));
      oak.add(eye);
    }
  }
  /* mossy lichen skirt low on the north-facing ribbons */
  if (Math.cos(a0) < 0.2 && rnd(i * 31.3) > 0.4) {
    const ms = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + rnd(i * 37) * 0.22, 1), i % 2 ? M2.moss : M2.lichen);
    ms.name = `oak_trunk_moss_${i + 1}`;
    ms.scale.set(1, 1.5 + rnd(i * 41) * 1.4, 0.34);
    ms.position.set((TRUNK_R + 0.3) * Math.sin(a0), 0.5 + rnd(i * 43) * 2.2, (TRUNK_R + 0.3) * Math.cos(a0));
    ms.lookAt(new THREE.Vector3(0, ms.position.y, 0));
    oak.add(ms);
  }
  /* bracket fungus shelves */
  if (rnd(i * 47.9) > 0.86) {
    const fu = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.34, 0.1, 12, 1, false, 0, Math.PI), M2.fungus);
    fu.name = `oak_bracket_fungus_${i + 1}`;
    fu.position.set((TRUNK_R + 0.12) * Math.sin(a0), 1.2 + rnd(i * 53) * 4.5, (TRUNK_R + 0.12) * Math.cos(a0));
    fu.rotation.set(0.22, -a0 + Math.PI / 2, 0);
    fu.scale.y = 0.8;
    oak.add(fu);
  }
}
/* carved spiral runes banding the bole, faintly alight */
for (let i = 0; i < 5; i++) {
  const y = 1.1 + i * 1.15;
  /* the sweep must stay clear of the split: torus arcs run from +Z, so start at
     +0.62 rad and never exceed the 2pi - 1.24 rad of bark actually present */
  const CLEAR = 0.62;
  const arc = Math.min(Math.PI * (0.5 + rnd(i) * 0.3), Math.PI * 2 - CLEAR * 2 - (i % 3) * 0.5);
  const band = new THREE.Mesh(new THREE.TorusGeometry(TRUNK_R + 0.36, 0.018, 5, 36, arc), M2rune);
  band.name = `oak_carved_rune_band_${i + 1}`;
  band.rotation.set(Math.PI / 2, 0, -(CLEAR + (i % 3) * 0.45 + arc));
  band.position.y = y;
  oak.add(band);
  const spiralPts = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40, aa = t * Math.PI * 3 + i, rr = 0.06 + t * 0.26;
    spiralPts.push(new THREE.Vector3(rr * Math.cos(aa), rr * Math.sin(aa), 0));
  }
  const sp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiralPts), 44, 0.016, 5, false), M2rune);
  sp.name = `oak_origin_spiral_carving_${i + 1}`;
  const sa = 1.1 + i * 0.84;                            // all on the flanks, never the doorway
  sp.position.set((TRUNK_R + 0.4) * Math.sin(sa), y + 0.5, (TRUNK_R + 0.4) * Math.cos(sa));
  sp.lookAt(new THREE.Vector3(0, y + 0.5, 0));
  oak.add(sp);
}
/* ivy winding up the bole */
for (let i = 0; i < 3; i++) {
  const pts = [];
  for (let k = 0; k <= 30; k++) {
    const t = k / 30, aa = i * 2.1 + t * Math.PI * 2.4;
    const rr = TRUNK_R + 0.3 + 0.1 * Math.sin(t * 9);
    pts.push(new THREE.Vector3(rr * Math.sin(aa), -0.2 + t * 8.2, rr * Math.cos(aa)));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const vine = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.045, 6, false), M2.ivyStem);
  vine.name = `oak_ivy_vine_${i + 1}`;
  oak.add(vine);
  for (let k = 0; k < 26; k++) {
    const p = curve.getPoint((k + 0.5) / 26);
    const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 + rnd(i * 7 + k) * 0.08, 0), M2.ivy);
    lf.name = `oak_ivy_leaf_${i + 1}_${k + 1}`;
    lf.scale.set(1, 0.3, 1);
    lf.position.copy(p).add(new THREE.Vector3((rnd(i + k) - 0.5) * 0.3, 0, (rnd(i + k * 3) - 0.5) * 0.3));
    lf.rotation.set(rnd(k) * 3, rnd(k * 2) * 3, rnd(k * 5) * 3);
    oak.add(lf);
  }
}
/* an opaque bark shell just inside the ribbons, so the vertical gaps read as
   deep fissures in one bole rather than holes through a bundle of poles */
const coreMat = M2.barkDk.clone();
coreMat.name = 'ancient_oak_bark_inner';
coreMat.side = THREE.DoubleSide;
/* lower core is a sleeve with the doorway split; above the split it closes to a
   solid tapering bole that runs to the tips of the tallest ribbons */
const SPLIT_TOP = 8;
const prof = (y0, y1, inset) => {
  const pts = [];
  const n = 14;
  for (let k = 0; k <= n; k++) {
    const y = y0 + (y1 - y0) * (k / n);
    pts.push(new THREE.Vector2(Math.max(0.06, trunkR(y) - inset), y));
  }
  return pts;
};
const coreLo = new THREE.Mesh(new THREE.LatheGeometry(prof(-0.5, SPLIT_TOP, 0.2), 30, 0.42, Math.PI * 2 - 0.84), coreMat);
coreLo.name = 'oak_trunk_core_lower';
oak.add(coreLo);
const coreHi = new THREE.Mesh(new THREE.LatheGeometry(prof(SPLIT_TOP - 0.1, TRUNK_TOP + 0.2, 0.18), 30), coreMat);
coreHi.name = 'oak_trunk_core_upper';
oak.add(coreHi);

/* heartwood lining of the hollow */
const lining = new THREE.Mesh(new THREE.CylinderGeometry(TRUNK_R - 0.34, TRUNK_R - 0.28, TRUNK_H * 0.8, 24, 1, true, 0.34, Math.PI * 2 - 0.68), M2.heart);
lining.name = 'oak_hollow_lining';
lining.material.side = THREE.DoubleSide;
lining.position.y = TRUNK_H * 0.4 - 0.4;
oak.add(lining);

/* buttress roots gripping the ground */
/* roots arch out of the soil and dive back under, knuckling as they go */
for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2 + 0.2;
  const reach = 2.8 + rnd(i * 13.7) * 3.0;
  const pts = [];
  for (let k = 0; k <= 5; k++) {
    const t = k / 5, rr = TRUNK_R * 0.7 + t * reach;
    const aa = a + (t * t) * (rnd(i * 3.1) - 0.5) * 0.7;
    const y = -0.3 + Math.sin(t * Math.PI) * (0.45 + rnd(i * 5.9) * 0.5) - t * 0.5;
    pts.push(new THREE.Vector3(rr * Math.sin(aa), y, rr * Math.cos(aa)));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const rt = new THREE.Mesh(new THREE.TubeGeometry(curve, 26, 0.34, 8, false), i % 3 ? M2.barkDk : M2.bark);
  rt.name = `oak_buttress_root_${i + 1}`;
  oak.add(rt);
  for (let k = 0; k < 3; k++) {
    const p = curve.getPoint(0.3 + k * 0.22);
    const kn = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 + rnd(i * 7 + k) * 0.16, 1), M2.barkDk);
    kn.name = `oak_root_knuckle_${i + 1}_${k + 1}`;
    kn.scale.set(1, 0.7, 1);
    kn.position.copy(p);
    oak.add(kn);
  }
  /* rootlets and a mossy cushion where the root meets soil */
  const mp = curve.getPoint(0.86);
  const cush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 + rnd(i * 11.1) * 0.3, 1), M2.moss);
  cush.name = `oak_root_moss_${i + 1}`;
  cush.scale.y = 0.32;
  cush.position.set(mp.x, -0.24, mp.z);
  oak.add(cush);
}
/* a fairy ring of mushrooms out where the canopy drips */
for (let i = 0; i < 22; i++) {
  const a = (i / 22) * Math.PI * 2 + 0.11;
  const r = 6.4 + rnd(i * 3.7) * 1.1;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1 + rnd(i * 5.3) * 0.07, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    i % 3 ? M2.fungus : mat('fairy_ring_cap', 0xc45a48, 0.9));
  cap.name = `fairy_ring_cap_${i + 1}`;
  cap.position.set(r * Math.sin(a), -0.08 + rnd(i * 7.1) * 0.1, r * Math.cos(a));
  oak.add(cap);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.14, 6), M.daub);
  stem.name = `fairy_ring_stem_${i + 1}`;
  stem.position.set(cap.position.x, cap.position.y - 0.07, cap.position.z);
  oak.add(stem);
}

/* the tunnel mouth arrives inside the hollow; stair spirals up to the split */
const mouth = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.3, TH, 0.5), M2.rockDk);
mouth.name = 'oak_tunnel_mouth';
mouth.position.set(0, TUN_Y + TH / 2, 2.05);
oak.add(mouth);
const chamber = new THREE.Mesh(new THREE.CylinderGeometry(TRUNK_R - 0.3, TRUNK_R - 0.5, Math.abs(TUN_Y) - 0.5, 20, 1, true), M2.packed);
chamber.name = 'oak_root_chamber';
chamber.material = M2.packed.clone();
chamber.material.name = 'oak_root_chamber_earth';
chamber.material.side = THREE.DoubleSide;
chamber.position.y = (TUN_Y - 0.5) / 2;
oak.add(chamber);
const chFloor = new THREE.Mesh(new THREE.CylinderGeometry(TRUNK_R - 0.34, TRUNK_R - 0.34, 0.12, 20), M2.packed);
chFloor.name = 'oak_chamber_floor';
chFloor.position.y = TUN_Y - 0.06;
oak.add(chFloor);

const STAIRS = 26;
const newel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, Math.abs(TUN_Y) + 6.4, 12), M2.heart);
newel.name = 'oak_stair_newel';
newel.position.y = TUN_Y + (Math.abs(TUN_Y) + 6.4) / 2;
oak.add(newel);
for (let i = 0; i < STAIRS; i++) {
  const t = i / (STAIRS - 1);
  const a = t * Math.PI * 3.1;
  const y = TUN_Y + 0.25 + t * 5.9;
  const tr = new THREE.Mesh(new THREE.BoxGeometry(TRUNK_R - 0.55, 0.11, 0.52), M2.heart);
  tr.name = `oak_stair_tread_${i + 1}`;
  tr.position.set((TRUNK_R - 0.55) / 2 * Math.sin(a) + 0.1 * Math.sin(a), y, (TRUNK_R - 0.55) / 2 * Math.cos(a) + 0.1 * Math.cos(a));
  tr.rotation.y = a;
  oak.add(tr);
  if (i % 2 === 0) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 7), WOOD.hazel);
    rail.name = `oak_stair_baluster_${i + 1}`;
    rail.position.set((TRUNK_R - 0.55) * Math.sin(a), y + 0.45, (TRUNK_R - 0.55) * Math.cos(a));
    oak.add(rail);
  }
}
/* landing at the split, looking out over the forest floor */
const landing = new THREE.Mesh(new THREE.BoxGeometry(TRUNK_R * 1.5, 0.14, 1.1), M2.heart);
landing.name = 'oak_landing';
landing.position.set(0, TUN_Y + 6.2, TRUNK_R * 0.45);
oak.add(landing);

/* limbs and canopy */
/* limbs branch twice: each bough sags, kinks and throws off twigs, so the
   silhouette reads as a storm-wracked veteran rather than a lollipop */
const LEAVES = [M2.leaf, M2.leafPale, M2.leafDeep, M2.leafTurn].map((m) => {
  const c = m.clone();
  c.name = m.name + '_blade';
  c.side = THREE.DoubleSide;
  return c;
});
const twigEnds = [];
function bough(from, dir, len, rad, depth, seed, tag) {
  const pts = [new THREE.Vector3(0, 0, 0)];
  const cur = dir.clone().normalize();
  for (let k = 1; k <= 4; k++) {
    const t = k / 4;
    const bend = new THREE.Vector3(
      (rnd(seed * 3.1 + k) - 0.5) * 0.6,
      (depth === 0 ? -0.34 + t * 0.9 : 0.12) + (rnd(seed * 5.3 + k) - 0.5) * 0.5,
      (rnd(seed * 7.7 + k) - 0.5) * 0.6);
    pts.push(cur.clone().multiplyScalar(len * t).add(bend.multiplyScalar(len * 0.22 * t)));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.TubeGeometry(curve, 22, rad, 7, false);
  /* taper: squeeze the ring radius down along the length so limbs thin to twigs */
  {
    const pos = tube.attributes.position, seg = 22, ring = 8;   // radialSegments 7 + 1
    const c = new THREE.Vector3();
    for (let si = 0; si <= seg; si++) {
      const t = si / seg, k = 1 - t * 0.62;
      c.copy(curve.getPoint(t));
      for (let ri = 0; ri < ring; ri++) {
        const idx = si * ring + ri;
        if (idx >= pos.count) break;
        pos.setXYZ(idx,
          c.x + (pos.getX(idx) - c.x) * k,
          c.y + (pos.getY(idx) - c.y) * k,
          c.z + (pos.getZ(idx) - c.z) * k);
      }
    }
    pos.needsUpdate = true;
    tube.computeVertexNormals();
  }
  const m = new THREE.Mesh(tube, depth === 0 ? M2.bark : M2.barkDk);
  m.name = `oak_${tag}`;
  m.position.copy(from);
  oak.add(m);
  /* a couple of knotty swellings on the main limbs only */
  if (depth === 0) {
    for (let k = 0; k < 2; k++) {
      if (rnd(seed * 23.3 + k) < 0.45) continue;
      const p = curve.getPoint(0.22 + k * 0.3 + rnd(seed * 3.7 + k) * 0.16).add(from);
      const kn = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * (1.08 + rnd(seed + k) * 0.18), 1), M2.barkDk);
      kn.name = `oak_${tag}_elbow_${k + 1}`;
      kn.scale.set(1, 0.8, 1);
      kn.position.copy(p);
      oak.add(kn);
    }
  }
  const tip = curve.getPoint(1).add(from);
  if (depth < 2) {
    const n = depth === 0 ? 3 : 2;
    for (let b = 0; b < n; b++) {
      const sp = 0.55 + rnd(seed * 11.3 + b) * 0.7;
      const d2 = dir.clone().normalize()
        .add(new THREE.Vector3((rnd(seed * 13 + b) - 0.5) * sp, (0.35 + rnd(seed * 17 + b) * 0.6) * (depth === 0 ? 1 : 0.7), (rnd(seed * 19 + b) - 0.5) * sp));
      const at = curve.getPoint(0.6 + b * 0.13).add(from);
      bough(at, d2, len * (0.58 - depth * 0.1), rad * 0.52, depth + 1, seed * 1.7 + b * 29, `${tag}_${b + 1}`);
    }
  } else {
    twigEnds.push(tip);
  }
  return tip;
}
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2 + 0.4;
  const base = TRUNK_H * (0.52 + rnd(i * 3.9) * 0.34);
  const tilt = 0.6 + rnd(i * 8.1) * 0.55;
  const from = new THREE.Vector3(TRUNK_R * 0.8 * Math.sin(a), base, TRUNK_R * 0.8 * Math.cos(a));
  const dir = new THREE.Vector3(Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt));
  bough(from, dir, 3.4 + rnd(i * 6.3) * 2.4, 0.30, 0, 500 + i * 31, `limb_${i + 1}`);
}
/* an oak leaf blade: a lobed lozenge, thin enough to read as a leaf edge-on */
const leafBlade = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.14);
  for (let k = 0; k <= 5; k++) {
    const t = k / 5;
    const y = -0.14 + t * 0.34;
    const lobe = 0.055 + 0.05 * Math.sin(t * Math.PI) + 0.022 * Math.sin(t * Math.PI * 7);
    sh.lineTo(lobe, y);
  }
  for (let k = 5; k >= 0; k--) {
    const t = k / 5;
    const y = -0.14 + t * 0.34;
    const lobe = 0.055 + 0.05 * Math.sin(t * Math.PI) + 0.022 * Math.sin(t * Math.PI * 7);
    sh.lineTo(-lobe, y);
  }
  const g = new THREE.ShapeGeometry(sh, 1);
  g.rotateX(-Math.PI / 2);
  return g;
})();
/* leaf sprays: a cluster is a stem with blades fanned along it, plus a soft
   inner mass so the canopy still reads as volume from a distance */
/* the canopy surface is made of leaves, not decorated with them: a small opaque
   core fills the middle of each cluster, and the blades form a dense shell at
   the cluster radius, each laid tangent to that shell so its face follows the
   canopy. Blade length stays absolute (0.22-0.35 m) — only the placement
   radius, orientation and count scale with the cluster */
const _up = new THREE.Vector3(0, 1, 0);
function leafSpray(at, size, seed, tag) {
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(size * 0.3, 1), LEAVES[Math.floor(rnd(seed * 3.1) * 4)]);
  core.name = `oak_${tag}_core`;
  core.scale.set(1.2, 0.7, 1.2);
  core.position.copy(at);
  oak.add(core);
  const n = Math.round(26 + size * size * 26);
  const radial = new THREE.Vector3(), q = new THREE.Quaternion(), spin = new THREE.Quaternion();
  for (let k = 0; k < n; k++) {
    /* even-ish distribution over the shell, squashed vertically like a canopy */
    const u = (k + 0.5) / n;
    const phi = Math.acos(1 - 2 * u);
    const theta = k * 2.39996 + rnd(seed * 7.3 + k) * 0.6;
    radial.set(Math.sin(phi) * Math.cos(theta), Math.cos(phi) * 0.62, Math.sin(phi) * Math.sin(theta)).normalize();
    const rr = size * (0.78 + rnd(seed * 11.1 + k) * 0.3);
    q.setFromUnitVectors(_up, radial);
    spin.setFromAxisAngle(_up, rnd(seed * 29.1 + k) * Math.PI * 2);
    q.multiply(spin);
    /* tilt each blade off the surface so the shell isn't a smooth skin */
    spin.setFromAxisAngle(new THREE.Vector3(1, 0, 0), (rnd(seed * 23.9 + k) - 0.5) * 0.9);
    q.multiply(spin);
    const sf = 0.66 + rnd(seed * 19.1 + k) * 0.36;      // blade is 0.34 long locally
    stamp('oak_leaf_blades', LEAVES[Math.floor(rnd(seed * 17.3 + k) * 4)], oak, leafBlade,
      at.clone().add(radial.clone().multiplyScalar(rr)), q.clone(), new THREE.Vector3(sf, 1, sf));
  }
}
twigEnds.forEach((p, i) => {
  for (let k = 0; k < 2; k++) {
    leafSpray(p.clone().add(new THREE.Vector3((rnd(i + k) - 0.5) * 1.3, 0.25 + k * 0.7, (rnd(i + k * 3) - 0.5) * 1.3)),
      0.85 + rnd(i * 9.7 + k) * 0.8, i * 37 + k * 5.3, `crown_${i + 1}_${k + 1}`);
  }
});
for (let k = 0; k < 7; k++) {
  leafSpray(new THREE.Vector3((rnd(k * 5.1) - 0.5) * 5.2, TRUNK_H + 0.9 + rnd(k * 6.7) * 2.6, (rnd(k * 7.9) - 0.5) * 5.2),
    1.9 + rnd(k * 4.3) * 1.3, 700 + k * 9.1, `crown_top_${k + 1}`);
}
/* mistletoe globes, acorn clusters, and lanterns hung in the lower boughs */
twigEnds.forEach((p, i) => {
  if (i % 7 === 2) {
    const mi = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), M2.mistle);
    mi.name = `oak_mistletoe_${i + 1}`;
    mi.position.copy(p).add(new THREE.Vector3(0, -0.4, 0));
    oak.add(mi);
    for (let b = 0; b < 4; b++) {
      const be = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), M2.berry);
      be.name = `oak_mistletoe_berry_${i + 1}_${b + 1}`;
      be.position.copy(mi.position).add(new THREE.Vector3((rnd(i + b) - 0.5) * 0.7, (rnd(i * 3 + b) - 0.5) * 0.5, (rnd(i * 5 + b) - 0.5) * 0.7));
      oak.add(be);
    }
  }
  if (i % 5 === 1) {
    for (let b = 0; b < 3; b++) {
      const ac = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.07, 4, 8), M2.acorn);
      ac.name = `oak_acorn_${i + 1}_${b + 1}`;
      ac.position.copy(p).add(new THREE.Vector3((rnd(i + b) - 0.5) * 0.5, -0.2 - b * 0.1, (rnd(i * 7 + b) - 0.5) * 0.5));
      oak.add(ac);
    }
  }
});
const lowTips = twigEnds.filter((p) => p.y < TRUNK_H * 0.95).slice(0, 7);
lowTips.forEach((p, i) => {
  const cordLen = 0.5 + rnd(i * 3.3) * 0.6;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, cordLen, 5), M2.ivyStem);
  cord.name = `oak_lantern_cord_${i + 1}`;
  cord.position.copy(p).add(new THREE.Vector3(0, -cordLen / 2, 0));
  oak.add(cord);
  const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), M2lant);
  cage.name = `oak_lantern_${i + 1}`;
  cage.position.copy(p).add(new THREE.Vector3(0, -cordLen - 0.15, 0));
  oak.add(cage);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 5, 14), M.iron);
  hoop.name = `oak_lantern_hoop_${i + 1}`;
  hoop.position.copy(cage.position);
  hoop.rotation.x = Math.PI / 2;
  oak.add(hoop);
  const lp = new THREE.PointLight(0xffc06a, 2.6, 6, 2);
  lp.position.copy(cage.position).add(oak.position);
  stage._scene?.add(lp);
  anim.push((t) => { lp.intensity = 2.2 + 0.9 * Math.sin(t * 2.3 + i); cage.material.emissiveIntensity = 2.1 + 0.7 * Math.sin(t * 2.3 + i); });
});
/* will-o'-the-wisps drifting among the roots */
const wisps = [];
for (let i = 0; i < 16; i++) {
  const w = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M2wisp);
  w.name = `oak_wisp_${i + 1}`;
  w.userData = { a: rnd(i * 2.3) * 6.3, r: 2.6 + rnd(i * 3.7) * 4.4, y: 0.4 + rnd(i * 5.1) * 3.4, sp: 0.1 + rnd(i * 7.3) * 0.22, ph: rnd(i * 11) * 6.3 };
  oak.add(w);
  wisps.push(w);
}
anim.push((t) => {
  for (const w of wisps) {
    const u = w.userData, aa = u.a + t * u.sp;
    w.position.set(u.r * Math.sin(aa), u.y + Math.sin(t * 0.8 + u.ph) * 0.45, u.r * Math.cos(aa));
    w.material.opacity = 0.3 + 0.24 * Math.sin(t * 1.7 + u.ph);
  }
});
const oakGlow = new THREE.PointLight(0x9fe8b4, 3, 14, 2);
oakGlow.position.set(0, 3.4, OAK_Z);
stage._scene?.add(oakGlow);
anim.push((t) => { oakGlow.intensity = 2.2 + 1.1 * Math.sin(t * 1.3); });
under.add(oak);
house.add(under);

const tunnelGlow = new THREE.PointLight(0xffa557, 5, 9, 2);
tunnelGlow.position.set(0, TUN_Y + 1.5, (Z0 + Z1) / 2);
stage._scene?.add(tunnelGlow);
const hollowGlow = new THREE.PointLight(0xffc98a, 6, 12, 2);
hollowGlow.position.set(0, TUN_Y + 2.4, OAK_Z);
stage._scene?.add(hollowGlow);

/* ---------- the path to the door ---------- */
/* a winding way of moss-jointed flagstones running out of the trees to the
   threshold, lit by lantern posts and followed by drifting motes */
const path = new THREE.Group();
path.name = 'forest_path';

const PATH_PTS = [
  new THREE.Vector3(0, 0, 5.35),
  new THREE.Vector3(0.35, 0, 7.4),
  new THREE.Vector3(1.55, 0, 9.6),
  new THREE.Vector3(1.2, 0, 12.4),
  new THREE.Vector3(-0.6, 0, 15.1),
  new THREE.Vector3(-0.35, 0, 18.4),
  new THREE.Vector3(1.6, 0, 21.6),
  new THREE.Vector3(3.5, 0, 25.2),
  new THREE.Vector3(3.9, 0, 29.5),
];
const pathCurve = new THREE.CatmullRomCurve3(PATH_PTS);
const PATH_SAMPLES = [];
for (let k = 0; k <= 160; k++) PATH_SAMPLES.push(pathCurve.getPoint(k / 160));
/* how far a forest point sits from the way — used to keep trees off it */
const nearPath = (x, z) => {
  let best = Infinity;
  for (const p of PATH_SAMPLES) {
    const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
    if (d < best) best = d;
  }
  return Math.sqrt(best);
};

/* flagstones, laid in a loose double file that narrows away from the door */
const STONES = 62;
for (let i = 0; i < STONES; i++) {
  const t = i / (STONES - 1);
  const p = pathCurve.getPoint(t);
  const tan = pathCurve.getTangent(t);
  const side = new THREE.Vector3(tan.z, 0, -tan.x).normalize();
  const spread = (0.46 - t * 0.2) * (i % 2 ? 1 : -1) * (0.55 + rnd(i * 3.1) * 0.7);
  const w = 0.34 + rnd(i * 5.7) * 0.3, d = 0.3 + rnd(i * 7.3) * 0.26;
  const st = new THREE.Mesh(new THREE.CylinderGeometry(w, w * 0.92, 0.1 + rnd(i * 11.3) * 0.05, 6 + (i % 3)), i % 4 ? M.stone : M.sooted);
  st.name = `path_flagstone_${i + 1}`;
  st.position.copy(p).add(side.clone().multiplyScalar(spread));
  st.position.y = -0.13 + rnd(i * 13.7) * 0.03;
  st.rotation.set((rnd(i * 17.1) - 0.5) * 0.12, rnd(i * 19.3) * 3, (rnd(i * 23.9) - 0.5) * 0.12);
  st.scale.set(1, 1, d / w);
  path.add(st);
  /* moss creeping into the joints */
  if (i % 2 === 0) {
    const at = st.position.clone().add(side.clone().multiplyScalar(-spread * 0.9)).setY(-0.14);
    mossCushion(path, at, 0.16 + rnd(i * 29.1) * 0.12, i * 149 + 3.1, 0.8, `path_joint_moss_${i + 1}`);
  }
  /* ferns and toadstools along the verges */
  if (i % 3 === 1) {
    const fs = side.clone().multiplyScalar((0.95 + rnd(i * 31.7) * 0.7) * (i % 6 === 1 ? 1 : -1));
    for (let k = 0; k < 5; k++) {
      const fr = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + rnd(i * 37 + k) * 0.08, 0), k % 2 ? M.moss : M.mossDark);
      fr.name = `path_fern_${i + 1}_${k + 1}`;
      fr.scale.set(0.35, 1.1, 2.4);
      fr.position.copy(p).add(fs).add(new THREE.Vector3((rnd(i + k) - 0.5) * 0.4, 0.06 + k * 0.05, (rnd(i + k * 3) - 0.5) * 0.4));
      fr.rotation.set(0.3, (k / 5) * Math.PI * 2 + rnd(i + k), 0.2);
      path.add(fr);
    }
  }
  if (rnd(i * 41.3) > 0.88) {
    const fs = side.clone().multiplyScalar((0.8 + rnd(i * 43.1) * 0.6) * (i % 2 ? -1 : 1));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), M.mossPale);
    cap.name = `path_toadstool_${i + 1}`;
    cap.position.copy(p).add(fs).setY(-0.04);
    path.add(cap);
    const stm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.1, 6), M.daub);
    stm.name = `path_toadstool_stem_${i + 1}`;
    stm.position.copy(cap.position).setY(-0.09);
    path.add(stm);
  }
}

/* lantern posts: a leaning hazel stake with a glowing globe hung from a crook */
const LANTERN_TS = [0.06, 0.24, 0.45, 0.66, 0.86];
LANTERN_TS.forEach((t, i) => {
  const p = pathCurve.getPoint(t);
  const tan = pathCurve.getTangent(t);
  const side = new THREE.Vector3(tan.z, 0, -tan.x).normalize().multiplyScalar(i % 2 ? 1.25 : -1.25);
  const h = 1.5 + rnd(i * 3.3) * 0.45;
  const pg = new THREE.CylinderGeometry(0.045, 0.06, h, 9);
  gnarl(pg, h, 820 + i, 0.16, 0.05);
  const post = new THREE.Mesh(pg, WOOD.hazel);
  post.name = `path_lantern_post_${i + 1}`;
  post.position.copy(p).add(side).setY(h / 2 - 0.16);
  post.rotation.set((rnd(i * 5.7) - 0.5) * 0.16, rnd(i * 7.1) * 3, (rnd(i * 11.3) - 0.5) * 0.14);
  path.add(post);
  const crookDir = side.clone().normalize().negate();
  const crook = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.028, 6, 14, Math.PI * 0.9), WOOD.hazel);
  crook.name = `path_lantern_crook_${i + 1}`;
  crook.position.copy(p).add(side).setY(h - 0.2);
  crook.rotation.set(Math.PI / 2, 0, 0);
  crook.rotateY(Math.atan2(crookDir.x, crookDir.z));
  path.add(crook);
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), M2lant);
  globe.name = `path_lantern_globe_${i + 1}`;
  globe.position.copy(p).add(side).add(crookDir.clone().multiplyScalar(0.3)).setY(h - 0.4);
  path.add(globe);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.013, 5, 14), M.iron);
  hoop.name = `path_lantern_hoop_${i + 1}`;
  hoop.position.copy(globe.position);
  hoop.rotation.x = Math.PI / 2;
  path.add(hoop);
  const lp = new THREE.PointLight(0xffc06a, 2.4, 7, 2);
  lp.position.copy(globe.position);
  stage._scene?.add(lp);
  anim.push((t2) => {
    const f = 2.0 + 0.8 * Math.sin(t2 * 2.1 + i * 1.7) + 0.3 * Math.sin(t2 * 5.3 + i);
    lp.intensity = f;
    globe.material.emissiveIntensity = 1.9 + 0.5 * Math.sin(t2 * 2.1 + i * 1.7);
  });
});

/* a pair of leaning saplings arching over the way where it leaves the trees */
for (const sgn of [-1, 1]) {
  const t = 0.78;
  const p = pathCurve.getPoint(t);
  const tan = pathCurve.getTangent(t);
  const side = new THREE.Vector3(tan.z, 0, -tan.x).normalize().multiplyScalar(sgn * 1.45);
  const pts = [];
  for (let k = 0; k <= 6; k++) {
    const u = k / 6;
    pts.push(new THREE.Vector3(
      side.x * (1 - u * 0.95), -0.15 + Math.sin(u * 1.5) * 3.1, side.z * (1 - u * 0.95) + u * 0.4 * sgn));
  }
  const arch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.075, 7, false), WOOD.hazel);
  arch.name = `path_arch_sapling_${sgn > 0 ? 'east' : 'west'}`;
  arch.position.copy(p);
  path.add(arch);
  for (let k = 0; k < 9; k++) {
    const u = 0.25 + (k / 9) * 0.7;
    const lp2 = new THREE.CatmullRomCurve3(pts).getPoint(u);
    const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26 + rnd(k * 3.1 + sgn) * 0.2, 1), k % 2 ? M.moss : M.mossPale);
    lf.name = `path_arch_leaves_${sgn > 0 ? 'east' : 'west'}_${k + 1}`;
    lf.scale.set(1.2, 0.5, 1.2);
    lf.position.copy(p).add(lp2).add(new THREE.Vector3((rnd(k) - 0.5) * 0.5, 0, (rnd(k * 3) - 0.5) * 0.5));
    path.add(lf);
  }
}

/* threshold markers either side of the doorway */
for (const sgn of [-1, 1]) {
  const mk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), M.stone);
  mk.name = `path_threshold_stone_${sgn > 0 ? 'east' : 'west'}`;
  mk.position.set(sgn * 1.0, -0.06, 5.5);
  mk.scale.set(0.8, 1.5, 0.8);
  mk.rotation.y = rnd(sgn + 3) * 3;
  path.add(mk);
  const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), M.mossDark);
  cap.name = `path_threshold_moss_${sgn > 0 ? 'east' : 'west'}`;
  cap.scale.set(1.1, 0.4, 1.1);
  cap.position.copy(mk.position).setY(0.3);
  path.add(cap);
}
house.add(path);

/* the logs were scattered before the way existed: slide any that lie across it
   sideways, carrying their end grain, moss, stub and fungus with them */
for (let n = 1; n <= 9; n++) {
  const body = ground.children.find((c) => c.name === `fallen_log_${n}`);
  if (!body) continue;
  const d = nearPath(body.position.x, body.position.z);
  if (d > 1.9) continue;
  /* push it sideways off the way, not along it */
  let bi = 0, bd = Infinity;
  PATH_SAMPLES.forEach((p, k) => {
    const dd = (p.x - body.position.x) ** 2 + (p.z - body.position.z) ** 2;
    if (dd < bd) { bd = dd; bi = k; }
  });
  const pa = PATH_SAMPLES[Math.max(0, bi - 1)], pb = PATH_SAMPLES[Math.min(PATH_SAMPLES.length - 1, bi + 1)];
  const tanv = new THREE.Vector3(pb.x - pa.x, 0, pb.z - pa.z).normalize();
  const sidev = new THREE.Vector3(tanv.z, 0, -tanv.x);
  const away = sidev.dot(new THREE.Vector3(body.position.x - PATH_SAMPLES[bi].x, 0, body.position.z - PATH_SAMPLES[bi].z)) >= 0 ? 1 : -1;
  const shift = sidev.multiplyScalar(away * (2.4 - d));
  for (const c of ground.children) {
    if (c.name.startsWith(`fallen_log_${n}`)) c.position.add(shift);
  }
  /* only this log's own moss travels with it */
  const near = body.position.clone();
  poolShift((nm) => /^moss_/.test(nm), (v) => v.distanceTo(near) < 2.2, shift);
}

/* the moss mat was laid before the way existed: clear it off the stones now */
for (const c of [...ground.children]) {
  if (!/^ground_stone_/.test(c.name)) continue;
  const d = nearPath(c.position.x, c.position.z);
  if (d < 0.78) ground.remove(c);
  else if (d < 1.15) c.scale.y *= 0.45;     // the verge thins toward the stones
}
poolPrune((n) => /^(moss_|liverwort_)/.test(n), (v) => nearPath(v.x, v.z) >= 0.78);

/* motes drifting along the way */
const pathMotes = [];
for (let i = 0; i < 22; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), M2wisp);
  m.name = `path_mote_${i + 1}`;
  m.userData = { t: rnd(i * 3.1), sp: 0.012 + rnd(i * 5.3) * 0.022, off: (rnd(i * 7.7) - 0.5) * 1.6, ph: rnd(i * 11.1) * 6.3 };
  path.add(m);
  pathMotes.push(m);
}
anim.push((t) => {
  for (const m of pathMotes) {
    const u = m.userData;
    u.t += u.sp * 0.016;
    if (u.t > 1) u.t -= 1;
    const p = pathCurve.getPoint(u.t);
    const tan = pathCurve.getTangent(u.t);
    m.position.set(
      p.x + tan.z * u.off,
      0.35 + Math.sin(t * 0.9 + u.ph) * 0.3,
      p.z - tan.x * u.off);
    m.material.opacity = 0.28 + 0.22 * Math.sin(t * 1.5 + u.ph);
  }
});

/* ---------- forest surround + sky (viewer backdrop, not part of the export) ---------- */
(function backdrop() {
  const scene = stage._scene;
  if (!scene) return;

  const sky = document.createElement('canvas');
  sky.width = 8; sky.height = 256;
  const sx = sky.getContext('2d');
  const grad = sx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#9fb6c4');
  grad.addColorStop(0.55, '#cfd6cd');
  grad.addColorStop(1, '#e3e0cf');
  sx.fillStyle = grad;
  sx.fillRect(0, 0, 8, 256);
  const skyTex = new THREE.CanvasTexture(sky);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
  scene.fog = new THREE.Fog(0xd6d8cb, 26, 95);

  const forest = new THREE.Group();
  forest.name = 'forest_backdrop';

  const meadow = holedDisc(80, 0.2, mat('meadow_ground', 0x5d6b3c, 0.98), 'meadow', -0.32, 64);
  forest.add(meadow);

  const bark = mat('forest_bark', 0x4a3a2b, 0.9);
  const canopy = [
    mat('canopy_deep', 0x33502c, 0.95),
    mat('canopy_mid', 0x46613a, 0.95),
    mat('canopy_warm', 0x5e6d33, 0.95),
  ];

  for (let i = 0; i < 150; i++) {
    const a = rnd(i * 2.3 + 0.5) * Math.PI * 2;
    const r = 13 + Math.pow(rnd(i * 4.7), 0.7) * 36;
    const x0 = r * Math.sin(a), z0 = r * Math.cos(a);
    if (Math.hypot(x0, z0 + 22.5) < 8) continue;   // clearing round the ancient oak
    if (nearPath(x0, z0) < 2.6) continue;          // leave the way open
    const h = 7 + rnd(i * 6.1) * 9;
    const m = canopy[Math.floor(rnd(i * 8.9) * 3)];
    const x = r * Math.sin(a), z = r * Math.cos(a);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.035, h * 0.06, h * 0.55, 7), bark);
    trunk.name = 'forest_trunk_' + (i + 1);
    trunk.position.set(x, h * 0.275 - 0.3, z);
    forest.add(trunk);
    if (rnd(i * 10.3) > 0.45) {           // conifer
      for (let k = 0; k < 3; k++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(h * (0.3 - k * 0.07), h * 0.42, 9), m);
        cone.name = 'forest_conifer_' + (i + 1) + '_' + (k + 1);
        cone.position.set(x, h * (0.45 + k * 0.22), z);
        forest.add(cone);
      }
    } else {                               // broadleaf
      for (let k = 0; k < 3; k++) {
        const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(h * (0.3 - k * 0.05), 2), m);
        ball.name = 'forest_crown_' + (i + 1) + '_' + (k + 1);
        ball.position.set(
          x + (rnd(i + k * 3) - 0.5) * h * 0.22,
          h * (0.62 + k * 0.16),
          z + (rnd(i + k * 7) - 0.5) * h * 0.22);
        ball.scale.y = 0.82;
        forest.add(ball);
      }
    }
  }
  scene.add(forest);
})();

/* every pooled prop is stamped and post-processed by now: merge them */
flushPools();

/* moss, leaves, ferns, ivy and other centimetre dressing cast nothing legible,
   so they leave the caster set entirely — the shadow pass then covers only the
   building, the trees' structure and the furniture */
const NO_CAST = /^(moss_|liverwort_|oak_leaf_blades|oak_crown_|oak_ivy_|oak_mistletoe|oak_acorn|oak_wisp|path_fern_|path_joint_moss|path_toadstool|path_mote_|path_arch_leaves|fairy_ring_|roof_moss_|roof_grass_|roof_flower_|ember_|smoke_|flame_|forest_crown_)/;
let casters = 0;
for (const root of [house, stage._scene]) {
  root?.traverse((o) => {
    if (!o.isMesh) return;
    if (NO_CAST.test(o.name)) { o.castShadow = false; return; }
    if (o.castShadow) casters++;
  });
}
if (stage._renderer) stage._renderer.shadowMap.needsUpdate = true;

glow = new THREE.PointLight(0xffb066, 14, 9, 2);
glow.position.set(0, 0.45, 0);
stage._scene?.add(glow);

const upglow = new THREE.PointLight(0xff9a4a, 5, 6, 2);
upglow.position.set(0, 1.5, 0);
stage._scene?.add(upglow);

/* hand-off for pages that build on this room (staff-room-spiral.js) */
window.__roundhouse = { house, stage, WOOD, M, gnarl, applyCut, anim, cutaway };

