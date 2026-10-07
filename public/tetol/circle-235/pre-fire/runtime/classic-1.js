
(() => { const ALL = 'ABCDEFG', K = 'tetol-0.9.3-experiments', q = new URLSearchParams(location.search).get('x');
  let on = q != null ? (q === 'none' ? '' : q.toUpperCase()) : null; if (on == null) { try { on = localStorage.getItem(K); } catch (e) {} } if (on == null) on = ALL;
  const X = {}; [...ALL].forEach((k) => { X[k] = on.includes(k); document.body.classList.toggle('x' + k, X[k]); });
  window.TETOL_X = X; window.TETOL_XK = K;
  const pf = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(new URLSearchParams(location.search).get('phone') || '');
  if (pf) { document.body.classList.add('pframe'); document.body.style.setProperty('--pw', pf[1] + 'px'); document.body.style.setProperty('--vh', pf[2] + 'px'); if (pf[3]) document.body.style.setProperty('--ps', pf[3]); }
  const mq = matchMedia('(max-width: 600px)'), ph = () => document.body.classList.toggle('phone', !!pf || mq.matches);
  ph(); mq.addEventListener('change', ph); addEventListener('resize', ph); addEventListener('DOMContentLoaded', ph); addEventListener('load', ph);
  new ResizeObserver(ph).observe(document.documentElement); })();

;
// TETOL spatial prototype — data model (renderer-independent).
// Snapshot read from Notion on 22 Sep 2026. Not live-synced.
// status: reality of the record/destination. placement: status of the spatial mapping.
window.TETOL = (() => {
  const N = 'https://app.notion.com/p/';
  const STATUS = {
    LIVE: { glyph: '●', label: 'Live', desc: 'Exists and was verified in the source.' },
    CONNECTED: { glyph: '◐', label: 'Connected', desc: 'Real concept or relationship; destination or content not yet complete.' },
    PROPOSED: { glyph: '◌', label: 'Proposed', desc: 'Prototype interpretation only.' },
    UNRESOLVED: { glyph: '?', label: 'Unresolved', desc: 'Needs a TEOTAG decision or more evidence.' },
  };
  const PLACEMENT = {
    ESTABLISHED: { glyph: '●', label: 'Established' },
    PROPOSED: { glyph: '◌', label: 'Proposed' },
    UNRESOLVED: { glyph: '?', label: 'Unresolved' },
  };

  const nodes = {
    overview: {
      name: 'TETOL', sub: 'The Ethereal Tree of Life',
      practical: 'A living library shaped like a tree. Choose a part of the tree to see what lives there.',
      parent: null, spatial: true,
      location: 'Standing before the whole tree',
      purpose: 'TETOL grows from S33D — a living blueprint and a community gathering since 2019. The roots hold, the trunk remembers, the canopy gathers, the crown dreams.',
      status: 'LIVE', statusNote: 'The TETOL orientation page exists in Notion.',
      placement: 'ESTABLISHED', placementNote: 'Roots · Trunk · Canopy · Crown is the established anatomy.',
      lives: [],
      relations: [
        { to: 'crown', text: 'The dreaming edge, where the next seed forms' },
        { to: 'canopy', text: 'The living curriculum, where learning becomes practice' },
        { to: 'trunk', text: 'The durable memory of the whole tree' },
        { to: 'roots', text: 'Where S33D touches the earth' },
        { to: 'staff', text: 'A roundhouse beside the tree (placement unresolved)', kind: 'proposed' },
      ],
      actions: [{ label: 'Open TETOL orientation page', sub: 'Notion · members', href: N + '35215b58480d81a5b6b2cfdecad7c8d1', status: 'LIVE' }],
      sources: ['TETOL — S33D.Life'],
    },

    roots: {
      name: 'Ancient Friends', part: 'The Roots',
      practical: 'Meet ancient trees in person and record the encounter',
      parent: 'overview', spatial: true, anatomy: true,
      location: 'At the roots of the tree, where it meets the ground',
      purpose: 'Where S33D touches the earth. People find trees, visit them, leave offerings and return. Research can point to a tree; only a human encounter makes it an Ancient Friend.',
      status: 'LIVE', statusNote: 'Source page exists. The app route is defined in the s33d.life code (checked 22 Sep 2026).',
      placement: 'ESTABLISHED', placementNote: 'Roots = Ancient Friends is stated on the TETOL orientation page.',
      lives: [
        { text: 'Human-witnessed Ancient Friends', status: 'LIVE' },
        { text: 'Research Forest — sourced trees waiting to be visited. Not Ancient Friends yet.', status: 'LIVE' },
        { text: 'Encounters, offerings, whispers and Tree Radio', status: 'LIVE' },
      ],
      relations: [
        { to: 'trunk', text: 'What the roots gather, Heartwood keeps and tends' },
        { to: 'c233', text: 'Circle 233 is anchored by an Ancient Friend, the Ankerwycke Yew' },
        { to: 'moonroot', text: 'Your personal root of remembering (placement proposed)', kind: 'proposed' },
      ],
      actions: [
        { label: 'Enter the roots', sub: 's33d.life/map · route confirmed in app code', href: 'https://www.s33d.life/map', status: 'LIVE' },
        { label: 'Open source page', sub: 'Notion · members', href: N + '35515b58480d8160b7d4cadc8ebb1f2a', status: 'LIVE' },
      ],
      sources: ['Ancient Friends — The Roots', 'TETOL — S33D.Life'],
    },

    trunk: {
      name: 'Heartwood Library', part: 'The Trunk',
      practical: 'Browse what S33D remembers — records, stories, seeds and lineage',
      parent: 'overview', spatial: true, anatomy: true,
      location: 'Inside the trunk, through the hollow at its base',
      purpose: 'The durable memory of the tree. Heartwood keeps decisions, learning and provenance, and preserves earlier versions instead of overwriting them. It is not an archive of every sentence.',
      status: 'LIVE', statusNote: 'Source page and ten live rooms listed. The app route is defined in the s33d.life code (checked 22 Sep 2026).',
      placement: 'ESTABLISHED', placementNote: 'Trunk = Heartwood Library is stated on the TETOL orientation page. The hollow as its doorway is proposed.',
      lives: [
        { text: 'Rooms: Rhythms · Harvests · Species · Living Archive · Vault · Heartwood Gallery · Hives · Music Box · Seed Cellar · Nursery', status: 'LIVE' },
        { text: 'Heartwood Memory — Claude Council Handoff & Circle 233 Reconciliation · 22 Sep 2026', status: 'LIVE', href: N + '3e315b58480d81bcbe4af3e2245da0f4' },
        { text: 'Circle 233 compact memory — written after the gathering', status: 'CONNECTED' },
      ],
      relations: [
        { to: 'ring', text: 'The newest ring forms at the outer edge of the trunk (proposed)', kind: 'proposed' },
        { to: 'canopy', text: 'Council records return here so future Circles inherit memory' },
        { to: 'crown', text: 'Heartwood remembers what happened. The Crown listens for what it may become.' },
        { to: 'roots', text: 'Heartwood stores and tends what the roots gather' },
      ],
      actions: [
        { label: 'Enter the trunk', sub: 's33d.life/library · route confirmed in app code', href: 'https://www.s33d.life/library', status: 'LIVE' },
        { label: 'Open source page', sub: 'Notion · members', href: N + '35215b58480d81a98639e0f0f51b97f6', status: 'LIVE' },
      ],
      sources: ['Heartwood Library — The Trunk'],
    },

    ring: {
      name: 'Seasonal Ring', sub: 'Autumn Equinox 2026', part: 'On the trunk',
      practical: 'Enter the Autumn Equinox ring',
      parent: 'trunk', spatial: true,
      location: 'The outermost ring of the trunk',
      purpose: 'What the organism learned between the Summer Solstice and the Autumn Equinox 2026. A synthesis of the season, not a list of everything that happened.',
      status: 'LIVE', statusNote: 'Working draft. Circle 233 traces not yet added. It becomes a Heartwood ring only after TEOTAG review.',
      placement: 'PROPOSED', placementNote: 'In a real tree the newest ring grows at the outer edge and becomes heartwood with time — matching a draft that later enters Heartwood.',
      lives: [
        { text: 'What Ripened · What Took Root · What Called Us Back · What Fell Away', status: 'LIVE' },
        { text: 'Summer Moonroots — not yet harvested from the app', status: 'CONNECTED' },
        { text: 'Circle 233 Equinox harvest — after tonight', status: 'CONNECTED' },
      ],
      relations: [
        { to: 'trunk', text: 'Becomes part of Heartwood once reviewed' },
        { to: 'c233', text: 'Receives a few harvested traces from Circle 233' },
        { to: 'monthly', text: 'Monthly Reports are source material; the ring is the synthesis' },
        { to: 'crown', text: 'Up to seven signals continue into Crown listening' },
      ],
      notes: [{ status: 'UNRESOLVED', text: 'Filed under Council of Life in Notion, but describes itself as a Heartwood harvest. Where does it live?' }],
      actions: [{ label: 'Open the working ring', sub: 'Notion · members', href: N + '3e315b58480d81c7a07dddf59d53d7ea', status: 'LIVE' }],
      sources: ['TETOL Seasonal Ring — Autumn Equinox 2026'],
    },

    canopy: {
      name: 'Council of Life', part: 'The Canopy',
      practical: 'Join or revisit the weekly learning Circles',
      parent: 'overview', spatial: true, anatomy: true,
      location: 'In the canopy, where the tree meets the light',
      purpose: 'A living curriculum running since 2020. Weekly Circles gather inside lunar chapters, and companions — trees, birds, plants, fungi, flowers, books, words and people — become the curriculum. Council is not primarily governance.',
      status: 'LIVE', statusNote: 'Source page exists. The app route is defined in the s33d.life code (checked 22 Sep 2026).',
      placement: 'ESTABLISHED', placementNote: 'Canopy = Council of Life is stated on the TETOL orientation page.',
      lives: [
        { text: '230+ Councils held since 2020', status: 'LIVE' },
        { text: 'Current chapter: New Moon, 11 September 2026', status: 'LIVE' },
        { text: 'Circle 232 — September Restart', status: 'LIVE' },
        { text: 'Circle 233 — The Equinox Threshold', status: 'LIVE', to: 'c233' },
      ],
      relations: [
        { to: 'c233', text: 'This week’s Circle hangs here as a lit lantern (proposed)', kind: 'proposed' },
        { to: 'trunk', text: 'Each Circle’s record returns to Heartwood' },
        { to: 'crown', text: 'Only genuine, recurring signals rise further' },
      ],
      actions: [
        { label: 'Enter the canopy', sub: 's33d.life/council-of-life · route confirmed in app code', href: 'https://www.s33d.life/council-of-life', status: 'LIVE' },
        { label: 'Browse Council records', sub: 's33d.life/council/records · route confirmed in app code', href: 'https://www.s33d.life/council/records', status: 'LIVE' },
        { label: 'Open source page', sub: 'Notion · members', href: N + '35215b58480d81b59779f5002c5a85d7', status: 'LIVE' },
      ],
      sources: ['Council of Life — The Canopy'],
    },

    c233: {
      name: 'Circle 233', sub: 'The Equinox Threshold', part: 'In the canopy',
      practical: 'Open the living Circle record',
      parent: 'canopy', spatial: true,
      location: 'A lantern in the canopy — this week’s gathering',
      purpose: 'The second weekly Circle of the September New Moon chapter. Tuesday 22 September 2026, 7:30–8:30pm BST, curated by Ed and Leo. No preparation needed.',
      status: 'LIVE', statusNote: 'The record exists and keeps growing. Live notes are still empty — the gathering is tonight.',
      placement: 'PROPOSED', placementNote: 'The invitation asks friends to “gather around the fire”; a lit lantern in the canopy marks a Circle that is alive now.',
      lives: [
        { text: 'Tree · Ankerwycke Yew', status: 'LIVE' },
        { text: 'Bird · Barred Owl', status: 'LIVE' },
        { text: 'Plant · Cuban Oregano', status: 'LIVE' },
        { text: 'Fungi · The Prince', status: 'LIVE' },
        { text: 'Flower · Common Daisy', status: 'LIVE' },
        { text: 'Book · The Magician’s Nephew', status: 'LIVE' },
        { text: 'Word · Abracadabra — “As I speak, I create.”', status: 'LIVE' },
        { text: 'People · those who gather', status: 'LIVE' },
      ],
      relations: [
        { to: 'pack', text: 'Its portable companion — travels while the record keeps growing' },
        { to: 'roots', text: 'Anchored by the Ankerwycke Yew, an Ancient Friend' },
        { to: 'moonroot', text: 'Your own harvest of the Circle — private, not yet available' },
        { to: 'ring', text: 'A few traces will enter the Autumn Equinox ring' },
        { to: 'trunk', text: 'A compact Heartwood memory after the gathering' },
        { to: 'signal', text: 'At most one Crown signal — only if something genuinely new appears' },
      ],
      notes: [{ status: 'LIVE', text: 'An older June 2026 page also carries the number 233 (The Solstice Gate). Both are kept; history is not overwritten.' }],
      actions: [{ label: 'Open the living Circle record', sub: 'Notion · members', href: N + '3e315b58480d81649d90f58c2f8261d4', status: 'LIVE' }],
      sources: ['Council of Life — Circle 233 · The Equinox Threshold · September Restart'],
    },

    pack: {
      name: 'Living Asset Pack', sub: 'Circle 233', part: 'Beside the lantern',
      practical: 'Explore the companion resources',
      parent: 'c233', spatial: true,
      location: 'A basket hanging beside the Circle 233 lantern',
      purpose: 'A portable companion to Circle 233: an invitation before, a guide during, a memory bundle after. The Circle record remains the living source. The pack travels. The living record keeps growing.',
      status: 'LIVE', statusNote: 'Working draft. Not final. Not minted. The PDF has not been composed yet.',
      placement: 'PROPOSED', placementNote: 'The source marks the pack with a basket. A basket is something you carry away — and it hangs from the same branch as its Circle.',
      lives: [
        { text: '12 planned pages: cover, welcome, companion constellation, companion pages, Around the Fire, what the Circle remembered, doorway back', status: 'LIVE' },
        { text: 'Companion images', status: 'CONNECTED' },
        { text: 'Interactive PDF', status: 'CONNECTED' },
      ],
      relations: [
        { to: 'c233', text: 'Every page leads back to the living Circle record' },
        { to: 'ring', text: 'Its “What the Circle Remembered” page bridges to the Seasonal Ring' },
      ],
      notes: [{ status: 'LIVE', text: 'Personal and private material stays private by default. Any on-chain provenance needs a separate TEOTAG approval.' }],
      actions: [
        { label: 'Open the working pack', sub: 'Notion · members', href: N + '3e315b58480d81f49e35dbb18ce30b29', status: 'LIVE' },
        { label: 'Download the PDF', sub: 'Destination pending', href: null, status: 'CONNECTED' },
      ],
      sources: ['Circle 233 — Living Asset Pack · Working Draft'],
    },

    moonroot: {
      name: 'Moonroot', sub: 'Your personal harvest', part: 'Apart from the shared roots',
      practical: 'Open your personal harvest',
      parent: 'overview', spatial: true, personal: true,
      location: 'A single root running to a moonlit pool, apart from the shared tree',
      purpose: 'Your personal Life Ledger: a reflection of your own encounters, Councils and offerings across weeks, moons and seasons. It is yours, not a report about the community.',
      status: 'CONNECTED', statusNote: 'A digest builder exists in the app but is curator-only and currently blocked by sign-in. No Moonroot yet includes Circle 233.',
      placement: 'UNRESOLVED', placementNote: 'Its place in the anatomy is not stated. Shown near the roots because of its name, and kept separate because it is personal.',
      lives: [
        { text: 'May 2026 Moonroot Digest — format reference', status: 'LIVE' },
        { text: 'Weekly · monthly · seasonal · annual views', status: 'CONNECTED' },
      ],
      relations: [
        { to: 'c233', text: 'Could remember your part in Circle 233' },
        { to: 'ring', text: 'The bridge from the personal to the seasonal' },
        { to: 'roots', text: 'Returns to Ancient Friends are part of your rhythm' },
      ],
      notes: [{ status: 'LIVE', text: 'Private by default. Nothing moves outward unless you offer it.' }],
      actions: [
        { label: 'Open your Moonroot', sub: 'Destination pending', href: null, status: 'CONNECTED' },
        { label: 'Moonroot digest builder', sub: 's33d.life/admin/moonroot-digest · curators only, sign-in required', href: 'https://www.s33d.life/admin/moonroot-digest', status: 'CONNECTED' },
      ],
      sources: ['TETOL Seasonal Ring — Autumn Equinox 2026', 'TEOTAG Dual Code Audit'],
    },

    crown: {
      name: 'yOur Golden Dream', part: 'The Crown',
      practical: 'See what is ripening for S33D’s future — nothing here is decided yet',
      parent: 'overview', spatial: true, anatomy: true,
      location: 'The crown, the growing edge above the canopy',
      purpose: 'Where the next S33D ripens. Signals from across TETOL are tended as Embers → Threads → Seeds → Growing → Ripening → Fruit. A Fruit becomes canonical S33DNA only with TEOTAG approval.',
      status: 'LIVE', statusNote: 'Source page and first harvest exist. The app route is defined in the s33d.life code (checked 22 Sep 2026).',
      placement: 'ESTABLISHED', placementNote: 'Crown = yOur Golden Dream is stated on the TETOL orientation page.',
      lives: [
        { text: 'Crown Harvest 01 — September 2026', status: 'LIVE', href: N + '3e315b58480d810ca993f54be0a39d38' },
        { text: 'Sponge Squeeze 01 — Golden Dream Lineage', status: 'LIVE', href: N + '3e315b58480d81b09916f7e9e4128668' },
        { text: 'Circle 233 signal — nothing has risen', status: 'CONNECTED', to: 'signal' },
      ],
      relations: [
        { to: 'trunk', text: 'Listens to Heartwood; does not receive everything' },
        { to: 'canopy', text: 'Mature direction can flow back out as new Circles' },
        { to: 'signal', text: 'An unlit ember waiting for Circle 233 (proposed)', kind: 'proposed' },
      ],
      actions: [
        { label: 'Enter the crown', sub: 's33d.life/golden-dream · route confirmed in app code', href: 'https://www.s33d.life/golden-dream', status: 'LIVE' },
        { label: 'Open source page', sub: 'Notion · members', href: N + '35215b58480d8168b02fcde7c01a6177', status: 'LIVE' },
      ],
      sources: ['yOur Golden Dream — The Crown', 'Crown Harvest 01'],
    },

    signal: {
      name: 'Crown listening', sub: 'Circle 233', part: 'In the crown',
      practical: 'Nothing from Circle 233 has risen — and it may never need to',
      parent: 'crown', spatial: true,
      location: 'An unlit ember in the crown',
      purpose: 'After the gathering, Council asks: did a pattern repeat? Did a new seed appear? Only those signals rise. The whole Circle is never sent upward.',
      status: 'CONNECTED', statusNote: 'The practice is established; nothing has been harvested yet.',
      placement: 'PROPOSED', placementNote: 'An ember is the first stage of the Crown’s progression. Unlit means not yet — not failure.',
      lives: [],
      relations: [
        { to: 'c233', text: 'Its “Possible Crown signal” field is empty' },
        { to: 'crown', text: 'Would join the Embers of yOur Golden Dream' },
      ],
      actions: [{ label: 'View this signal', sub: 'Destination pending', href: null, status: 'CONNECTED' }],
      sources: ['Council of Life — Circle 233', 'yOur Golden Dream — The Crown'],
    },

    staff: {
      name: 'Staff Room', sub: 'The Roundhouse', part: 'Beside the tree',
      practical: 'Walk the roundhouse where the 36 Origin staffs hang',
      parent: 'overview', spatial: true,
      location: 'A roundhouse at the edge of the clearing, beside the tree',
      purpose: 'A roundhouse gallery holding the 36 Origin Spiral staff NFTs as framed panels in token order, each with its artwork and a 3D view of the staff.',
      status: 'CONNECTED', statusNote: 'Links to the Staff Room design prototype. It is a prototype, not the S33D app. Species names are shown as contract codes only.',
      placement: 'UNRESOLVED', placementNote: 'Its place relative to the tree is not stated. Shown as a threshold beside the tree, not part of its anatomy.',
      lives: [
        { text: '36 Origin Spiral staffs, framed in token order', status: 'LIVE' },
        { text: 'Full species names — not yet in the contract', status: 'CONNECTED' },
      ],
      relations: [
        { to: 'roots', text: 'The staffs come from the Ancient Friends contracts' },
        { to: 'trunk', text: 'Their provenance belongs to Heartwood’s memory (proposed)', kind: 'proposed' },
      ],
      actions: [{ label: 'Enter the Staff Room', sub: 'Roundhouse design prototype', href: 'https://claude.ai/design/p/56d3d7db-9335-4ff6-abbd-3ad26540525e', status: 'CONNECTED' }],
      sources: ['Staff Room roundhouse prototype', 'S33D-life/Ancient-Friends- · contracts'],
    },

    monthly: {
      name: 'Monthly Report', sub: 'September 2026', part: 'Not placed in the tree',
      practical: 'Read the tree’s monthly pulse',
      parent: 'overview', spatial: false,
      location: 'Not placed in the tree — it is a pulse of the organism, not a part of it',
      purpose: 'The operational pulse: what pattern is emerging from the weeks. Source material for the Seasonal Ring.',
      status: 'CONNECTED', statusNote: 'September’s report is written at month-end.',
      placement: 'UNRESOLVED', placementNote: 'Deliberately not spatialised in this prototype.',
      lives: [{ text: 'May 2026 development report — template reference', status: 'LIVE' }],
      relations: [{ to: 'ring', text: 'Feeds the Seasonal Ring' }],
      actions: [{ label: 'Read September’s report', sub: 'Destination pending', href: null, status: 'CONNECTED' }],
      sources: ['TEOTAG Dual Code Audit', 'TETOL Seasonal Ring'],
    },
  };

  const lineage = [
    { label: 'Live Council', note: 'Tonight 7:30pm', node: 'c233', status: 'CONNECTED' },
    { label: 'Circle record', note: 'Growing', node: 'c233', status: 'LIVE' },
    { label: 'Living Asset Pack', note: 'Working draft', node: 'pack', status: 'LIVE' },
    { label: 'Moonroot', note: 'Blocked by sign-in', node: 'moonroot', status: 'CONNECTED' },
    { label: 'Monthly Report', note: 'Month-end', node: 'monthly', status: 'CONNECTED' },
    { label: 'Seasonal Ring', note: 'Working draft', node: 'ring', status: 'LIVE' },
    { label: 'Heartwood', note: 'After gathering', node: 'trunk', status: 'CONNECTED' },
    { label: 'Crown listening', note: 'Only if new', node: 'signal', status: 'CONNECTED' },
  ];

  // Order for the list view: crown at the top, roots at the bottom — as the tree stands.
  const listTree = [
    { id: 'crown', children: [{ id: 'signal' }] },
    { id: 'canopy', children: [{ id: 'c233', children: [{ id: 'pack' }] }] },
    { id: 'trunk', children: [{ id: 'ring' }] },
    { id: 'roots' },
  ];
  const listApart = ['staff', 'moonroot', 'monthly'];

  // Circle 233: Tue 22 Sep 2026, 7:30–8:30pm BST (UTC+1)
  const circle233 = { dayStart: Date.UTC(2026, 8, 21, 23, 0), start: Date.UTC(2026, 8, 22, 18, 30), end: Date.UTC(2026, 8, 22, 19, 30) };
  return { STATUS, PLACEMENT, nodes, lineage, listTree, listApart, circle233, snapshot: '22 Sep 2026' };
})();

;
// Iteration 3 — source pass + living thread. Patches the base snapshot (tetol-data.js).
// Read from Notion 22 Sep 2026: Tree Knowledge Trunk, Council Ledger Architecture, Crown Harvest 01,
// 08 · Current Priorities, Moonroot Digest proposal, Ankerwycke Yew ledger record. Not live-synced.
(() => {
  const D = window.TETOL, N = 'https://app.notion.com/p/', n = D.nodes;
  D.STATUS.REMEMBERED = { glyph: '◇', label: 'Remembered', desc: 'Historical record, preserved as found. Not current.' };
  D.PLACEMENT.EMERGING = { glyph: '◐', label: 'Emerging' };
  Object.keys(n).forEach((k) => { n[k].scale = k === 'overview' ? 'organism' : n[k].anatomy ? 'place' : 'record'; });
  n.staff.scale = 'place';

  n.yew = {
    name: 'Ankerwycke Yew', sub: 'An Ancient Friend', part: 'In the Roots',
    practical: 'A tree that was alive long before any Circle, and will be after',
    parent: 'roots', spatial: true, scale: 'record',
    location: 'At the end of a root, among the Ancient Friends — not inside the Council',
    purpose: 'A yew of roughly 2,000 years near Wraysbury, Berkshire, noted in the ledger as a Magna Carta witness. The tree was alive in 1215 and stands near Runnymede; that the Charter was sealed at the yew is tradition, not fact. It exists independently of any Circle. Councils and encounters gather around it through time.',
    status: 'LIVE', statusNote: 'Ledger record exists in Heartwood Ledgers › Ancient Friends — Living Tree Ledger 144 (Circle 36). Marked visited; status Dreaming. Not yet mapped on s33d.life, so there is no Atlas pin.',
    placement: 'ESTABLISHED', placementNote: 'As an Ancient Friend it belongs to the Roots. Its exact spot on this model is illustrative.',
    where: [
      { k: 'Lives', v: 'Roots — Ancient Friends. The tree itself.', status: 'LIVE' },
      { k: 'Record lives', v: 'Heartwood Ledgers · Living Tree Ledger 144', status: 'LIVE' },
      { k: 'Memory', v: 'Grows as encounters and Councils gather around it', status: 'CONNECTED' },
    ],
    spiralTitle: 'Its relationships through time',
    spiral: [
      { k: 'This season', v: 'The Seasonal Ring draft names a re-encounter with the Yew among what keeps returning', status: 'LIVE', to: 'ring' },
      { k: '22 Sep 2026', v: 'Tree companion of Circle 233 · The Equinox Threshold', status: 'LIVE', to: 'c233' },
      { k: 'Next', v: 'Future encounters and Councils — not yet', status: 'CONNECTED' },
    ],
    lives: [
      { text: 'Ledger: ~2,000 years · England · Wraysbury, Berkshire', status: 'LIVE' },
      { text: 'Two rings on the ground beside it — one for each relationship recorded so far', status: 'PROPOSED' },
    ],
    relations: [
      { to: 'c233', dim: 'web', text: 'Circle 233 chose it as Tree companion. The Circle is one of its relationships, not its home.' },
      { to: 'ring', dim: 'time', text: 'The ring draft names this season’s re-encounter with it' },
      { to: 'roots', dim: 'place', text: 'Where it lives — among the Ancient Friends' },
      { to: 'trunk', dim: 'place', text: 'Where its record lives — Heartwood Ledgers' },
    ],
    notes: [{ status: 'UNRESOLVED', text: 'The ledger gives Country / Region as England, while a secondary Text field reads “Ireland”. Left as found.' }],
    actions: [
      { label: 'Open its ledger record', sub: 'Notion · Living Tree Ledger 144', href: N + '2fc15b58480d804bb93fc9121b18ae31', status: 'LIVE' },
      { label: 'See it on the Atlas', sub: 'Not mapped yet', href: null, status: 'CONNECTED' },
    ],
    sources: ['Ankerwycke Yew — Ancient Friends Ledger', 'Council of Life — Circle 233', 'TETOL Seasonal Ring — Autumn Equinox 2026'],
  };

  n.c233legacy = {
    name: 'Scroll 233', sub: 'The Solstice Gate · June 2026', part: 'Remembered · earlier scroll lineage',
    practical: 'An earlier record that also carries the number 233',
    parent: 'canopy', spatial: false, scale: 'record',
    location: 'Not placed in the tree. A remembered record, reached through its relationship with Circle 233.',
    purpose: 'A Council scroll drafted on 12 June 2026 for the New Moon of about 16 June, with Elder, Common Swift and St John’s Wort. It belongs to the earlier scroll numbering. The September Circle 233 belongs to the renewed weekly Council / Spiral lineage.',
    status: 'REMEMBERED', statusNote: 'Draft. June priority notes record no confirmation that it was held or sent. Preserved as found.',
    placement: 'UNRESOLVED', placementNote: 'Historical records do not yet have a place in the 3D tree. Reached through relationships and the list.',
    lives: [
      { text: 'Tree · Elder', status: 'REMEMBERED' },
      { text: 'Bird · Common Swift', status: 'REMEMBERED' },
      { text: 'Plant · St John’s Wort', status: 'REMEMBERED' },
    ],
    relations: [
      { to: 'c233', dim: 'time', text: 'Shares the number 233. Neither record is renumbered.' },
      { to: 'canopy', dim: 'place', text: 'Part of the Council lineage' },
    ],
    actions: [{ label: 'Open the June scroll', sub: 'Notion · members', href: N + '37d15b58480d81f19daac7a58e440340', status: 'REMEMBERED' }],
    sources: ['08 · Current Priorities — historical priority rings (June 2026)'],
  };

  const c = n.c233;
  c.lives = c.lives.map((l) => (l.text.startsWith('Tree') ? { ...l, to: 'yew' } : l));
  c.where = [
    { k: 'Happens', v: 'Canopy — Council of Life, live on Google Meet', status: 'LIVE' },
    { k: 'Record lives', v: 'Council Ledger in Notion, filed under the older S33D: yOur Golden Dream workspace', status: 'LIVE' },
    { k: 'Memory', v: 'Heartwood — a compact memory after the gathering', status: 'CONNECTED' },
  ];
  c.spiral = [
    { k: 'Year', v: '2026' },
    { k: 'Solar season', v: 'Summer Solstice → Autumn Equinox, at the Equinox gate' },
    { k: 'Moon cycle', v: 'New Moon chapter from 11 Sep 2026 · week 2' },
    { k: 'Council', v: 'Circle 233 · the numbering never resets' },
    { k: 'Encounters', v: 'Around the Fire notes — empty until the gathering', status: 'CONNECTED' },
  ];
  c.relations = [
    { to: 'yew', dim: 'web', text: 'Tree companion. The Yew has its own life; this Circle is one of its relationships.' },
    { to: 'moonroot', dim: 'web', kind: 'proposed', text: 'Your own harvest of the Circle — private, not yet available' },
    { to: 'ring', dim: 'time', pending: true, text: 'A few traces may enter the Autumn Equinox ring — a working harvest' },
    { to: 'trunk', dim: 'time', pending: true, text: 'After the gathering, its memory may enter Heartwood' },
    { to: 'signal', dim: 'time', pending: true, text: 'At most one Crown signal — only if something genuinely new appears' },
    { to: 'c233legacy', dim: 'time', text: 'Another record numbered 233 (June 2026). Both kept; neither renumbered.' },
    { to: 'canopy', dim: 'place', text: 'Where it happens while alive — the Council / Canopy lineage' },
    { to: 'pack', dim: 'place', text: 'Its portable companion — travels while the record keeps growing' },
  ];
  c.notes = [];

  const r = n.ring;
  r.sub = 'Autumn Equinox 2026 · working harvest';
  r.practical = 'See what this season is harvesting — still forming, not yet a Heartwood ring';
  r.location = 'Forming at the outer edge of the trunk. Not a room.';
  r.placement = 'PROPOSED';
  r.placementNote = 'Not a separate room. Shown as an open ring still forming at the trunk’s outer edge. A completed, reviewed ring can join Heartwood’s growth-ring memory (TEOTAG clarification, 22 Sep).';
  r.where = [
    { k: 'Forms', v: 'Across the season: Summer Solstice → Autumn Equinox 2026', status: 'LIVE' },
    { k: 'Draft lives', v: 'Notion, filed under Council of Life — The Canopy', status: 'LIVE' },
    { k: 'Memory', v: 'A Heartwood growth ring, once complete and reviewed', status: 'CONNECTED' },
  ];
  r.notes = [{ status: 'LIVE', text: 'Working harvest. Circle 233 traces not yet added. Not complete, not canonical.' }];
  r.relations = [
    { to: 'yew', dim: 'web', text: 'Names the re-encounter with the Ankerwycke Yew' },
    { to: 'c233', dim: 'time', pending: true, text: 'May receive a few harvested traces from Circle 233' },
    { to: 'monthly', dim: 'time', text: 'Monthly Reports are source material; the ring is the synthesis' },
    { to: 'crown', dim: 'time', pending: true, text: 'Up to seven signals may continue into Crown listening' },
    { to: 'trunk', dim: 'place', pending: true, text: 'Joins Heartwood’s growth rings only once complete' },
  ];

  const m = n.moonroot;
  m.placement = 'PROPOSED';
  m.placementNote = 'Meaning is established: a personal living harvest, private by default, drawn from lived activity and relationships. Where it sits in TETOL is not settled. Shown here as one option being explored.';
  m.where = [
    { k: 'Draws from', v: 'Your encounters, offerings, Councils, seeds, books', status: 'CONNECTED' },
    { k: 'Built in', v: 'Curator digest builder at /admin/moonroot-digest (MVP)', status: 'CONNECTED' },
    { k: 'Memory', v: 'Yours. Private unless you offer it.', status: 'CONNECTED' },
  ];
  m.notes = [
    { status: 'LIVE', text: 'Private by default. Nothing moves outward unless you offer it.' },
    { status: 'PROPOSED', text: 'Placements being explored: a private pool beside the roots (shown) · a chamber in your own Heartwood · a silver thread that follows you through every place. Not decided.' },
  ];
  m.sources = [...m.sources, 'Moonroot Digest — Lunar Life Ledger + Council Invitation (proposal)'];

  const t = n.trunk;
  t.notes = [...(t.notes || []), { status: 'LIVE', text: 'Heartwood is the architectural name. The site’s “HeARTwood” is a typographic expression of the same place, not a second concept.' }];
  t.lives = [...t.lives,
    { text: 'Heartwood Ledgers — Living Tree Ledger 144, including the Ankerwycke Yew', status: 'LIVE', to: 'yew' },
    { text: 'Growth rings — completed Seasonal Rings (none completed yet)', status: 'CONNECTED' }];
  t.relations = [{ to: 'yew', dim: 'place', text: 'Keeps the Yew’s ledger record, while the tree itself lives in the Roots' }, ...t.relations];

  const ro = n.roots;
  ro.lives = [...ro.lives, { text: 'Ankerwycke Yew — Magna Carta witness, ~2,000 years', status: 'LIVE', to: 'yew' }];
  ro.relations = ro.relations.map((x) => (x.to === 'c233' ? { to: 'yew', dim: 'web', text: 'The Ankerwycke Yew — an Ancient Friend now in relationship with Circle 233' } : x));

  const ca = n.canopy;
  ca.notes = [...(ca.notes || []), { status: 'LIVE', text: 'A Circle belongs to the Council while it is alive. Its record lives in the Council Ledger; its memory may later enter Heartwood.' }];
  ca.lives = [...ca.lives, { text: 'Scroll 233 · The Solstice Gate (June 2026) — remembered', status: 'REMEMBERED', to: 'c233legacy' }];
  ca.sources = [...ca.sources, 'Council Ledger — Architecture, Moon Cycles & Curator Automation'];

  const cr = n.crown;
  cr.notes = [...(cr.notes || []), { status: 'LIVE', text: '“Everything meaningful may be remembered. Not everything remembered should rise into the Crown.” — Crown Harvest 01' }];
  cr.lives = [...cr.lives, { text: 'Harvest 01 threads: Living Memory & Evolution · Living Curriculum · Distributed Roots · Sovereign Agent Ecology', status: 'LIVE' }];

  const find = (id) => D.listTree.find((x) => x.id === id);
  find('roots').children = [{ id: 'yew' }];
  find('canopy').children.push({ id: 'c233legacy' });

  D.thread = {
    title: 'Circle 233 ↔ Ankerwycke Yew',
    steps: [
      { id: 'overview', say: 'This is the whole organism. Follow one living thread: from tonight’s Circle down to an Ancient Friend, then back into memory.' },
      { id: 'canopy', say: 'The Council of Life lives in the canopy. A Circle belongs here while it is alive.' },
      { id: 'c233', say: 'Circle 233 is tonight’s gathering. Its companions are relationships with real beings. Follow the Tree companion.' },
      { id: 'yew', say: 'The thread ran down through the trunk into the roots. The Yew has its own life and its own ledger record. Circle 233 is one of its relationships, not its home.' },
      { id: 'roots', say: 'The Yew stands among the Ancient Friends. Over time, more encounters and Councils can gather around it.' },
      { id: 'c233', say: 'Back in the canopy — the same Circle, reached through a relationship rather than a menu. Now look at time.' },
      { id: 'ring', say: 'A working harvest forming at the trunk’s outer edge. Circle 233 may leave a few traces here. The ring is still open.' },
      { id: 'trunk', say: 'Heartwood, the durable memory. Circles, rings and ledgers settle here. The Yew’s record already does.' },
      { id: 'overview', say: 'One living thing, met through place, time and relationship — still one record each.' },
    ],
  };
})();

;
// Prototype 0.4 — movement pass. Patches 0.3 (tetol-data.js + tetol-data-v3.js). 0.3 files unchanged.
// Adds: Council Fire room (Trial 01), Circle 233 companions, Yew × Circle 233 relationship, Staff Room threshold,
// dynamic Circle identity, revised living thread. Status: see TETOL Spatial Source Map 0.4.md.
(() => {
  const D = window.TETOL, N = 'https://app.notion.com/p/', n = D.nodes;
  const REC = N + '3e315b58480d81649d90f58c2f8261d4';

  // The room persists; the Circle it hosts is a pointer, never baked into the room.
  D.council = { current: 'c233', place: { name: 'Council Fire', sub: 'Council of Life' }, observed: 'In Trial 01 the persistent Google Meet room identified itself as Council 231 while the active Circle was 233.' };

  // Circle state model: AWAITING GATHERING → UPCOMING → GATHERING NOW → REMEMBERING.
  // Circle 233 did not gather on 22 Sep. Rescheduling to 23, 24 or 25 Sep. No date is set, so start/end stay null.
  // Preview a set date with ?gather=2026-09-24T18:30:00Z (1 hour assumed).
  D.circle233 = { start: null, end: null, candidates: '23, 24 or 25 September' };
  { const g = Date.parse(new URLSearchParams(location.search).get('gather') || ''); if (g) Object.assign(D.circle233, { start: g, end: g + 3600000, preview: true }); }

  // Traces that move Council → Heartwood. Empty until the Circle actually gathers. Nothing is invented.
  D.traces = [];
  n.traces = {
    name: 'Circle 233 traces', sub: 'Empty until the Circle gathers', part: 'On the Autumn ring',
    practical: 'Where real traces will settle after the gathering',
    parent: 'ring', spatial: true, scale: 'record',
    location: 'An unlit place on the forming Autumn ring',
    purpose: 'After a Circle gathers, a few traces may be carried from the Council Fire down into Heartwood and settle on the season’s ring. Circle 233 has not gathered yet, so this place is empty.',
    status: 'CONNECTED', statusNote: 'Mechanism only. No traces exist. Waiting for the real gathering.',
    placement: 'PROPOSED', placementNote: 'An unlit bead on the ring marks where traces would land. Each real trace would become its own bead.',
    notes: [{ status: 'LIVE', text: 'No harvested traces, reflections or Council outcomes are shown or invented here.' }],
    lives: [], relations: [
      { to: 'c233', dim: 'time', pending: true, text: 'Would come from Circle 233, after it gathers' },
      { to: 'ring', dim: 'place', text: 'The ring it would settle on' },
      { to: 'trunk', dim: 'place', pending: true, text: 'Joins Heartwood only once the ring is complete and reviewed' },
    ],
    actions: [], sources: ['TEOTAG correction, 22 Sep 2026'],
  };
  n.ring.relations = [{ to: 'traces', dim: 'time', pending: true, text: 'An empty place waiting for Circle 233’s traces' }, ...n.ring.relations];
  n.ring.lives = n.ring.lives.map((l) => (l.text.startsWith('Circle 233') ? { text: 'Circle 233 traces — empty until the Circle gathers', status: 'CONNECTED', to: 'traces' } : l));

  Object.assign(n.c233, {
    purpose: 'The second weekly Circle of the September New Moon chapter, curated by Ed and Leo. The invitation was sent; the gathering is being rescheduled to 23, 24 or 25 September. No preparation needed.',
    statusNote: 'The record exists. It has not gathered yet, so live notes are empty.',
    location: 'A lantern in the canopy, banked and waiting for its gathering',
  });
  n.c233.relations = n.c233.relations.map((r) => (r.to === 'ring' ? { ...r, to: 'traces', text: 'A place on the Autumn ring waits for its traces — empty until it gathers' } : r));
  D.lineage[0].label = 'Council'; D.lineage.forEach((s) => { if (s.note === 'After gathering') s.note = 'Waiting for gathering'; });
  n.canopy.lives = n.canopy.lives.map((l) => (l.to === 'c233' ? { ...l, text: 'Circle 233 — The Equinox Threshold · awaiting its gathering' } : l));
  n.canopy.relations = n.canopy.relations.map((r) => (r.to === 'c233' ? { ...r, text: 'This week’s Circle hangs here as a lantern (proposed)' } : r));

  const mr = n.moonroot;
  Object.assign(mr, {
    sub: 'Your personal harvest', part: 'At your Personal Hearth · candidate',
    location: 'A small private hearth at the foot of the trunk, beside the Heartwood hollow',
    placement: 'UNRESOLVED',
    placementNote: 'Preferred prototype candidate (TEOTAG, 22 Sep): private inward remembering at the Personal Hearth. Not decided. 0.3 tested a silver pool beside the Roots.',
  });
  mr.notes = [
    { status: 'LIVE', text: 'Private by default. Nothing moves outward unless you offer it.' },
    { status: 'PROPOSED', text: 'Being tested: does Moonroot read better as inward remembering at your own Hearth than as something beside the Ancient Friends?' },
  ];
  mr.relations = [{ to: 'trunk', text: 'Your Hearth sits at the Heartwood threshold — personal memory beside shared memory' }, ...mr.relations.filter((r) => r.to !== 'roots')];
  n.roots.relations = n.roots.relations.filter((r) => r.to !== 'moonroot');
  n.trunk.relations = [...n.trunk.relations, { to: 'moonroot', kind: 'proposed', text: 'Your Personal Hearth, beside the hollow (candidate)' }];

  n.overview.purpose = 'S33D is the Seed. TETOL is the Tree through which it is expressed, remembered, tended and allowed to evolve. Sap rises from the roots into Heartwood; only a little reaches the crown.';

  n.croom = {
    name: 'Council Fire', sub: 'Council of Life · Trial 01', part: 'Inside the canopy',
    question: 'What are we carrying across the Equinox threshold?',
    practical: 'Gather around the fire for this week’s Circle',
    parent: 'canopy', spatial: true, room: true, scale: 'place',
    location: 'A clearing inside the canopy. The place persists; the Circle gathered here changes each week.',
    purpose: 'The persistent gathering place of the Council of Life. You arrive across the Equinox line, the fire sits at the centre, the companions stand around it, and the current Circle is named at the doorway on the far side. The way back to the Tree is behind you.',
    status: 'PROPOSED', statusNote: 'Prototype space for Council Room Trial 01. No live call, audio or presence is connected.',
    placement: 'PROPOSED', placementNote: 'Grown inside the canopy because a Circle belongs to the Council while it is alive.',
    where: [
      { k: 'Next Circle', v: 'Circle 233 · The Equinox Threshold — named at the doorway, inherited from the current Circle', status: 'LIVE' },
      { k: 'Gathering', v: 'Not yet held · being rescheduled to 23, 24 or 25 Sep', status: 'CONNECTED' },
      { k: 'Live call', v: 'A persistent Google Meet room', status: 'LIVE' },
      { k: 'Record', v: 'Council Ledger in Notion — the doorway at the far side', status: 'LIVE' },
    ],
    notes: [
      { status: 'LIVE', text: 'TEOTAG direction (22 Sep): the place keeps a neutral, persistent identity — Council Fire · Council of Life. The active Circle is shown at the doorway and changes. Not canonical.' },
      { status: 'UNRESOLVED', text: 'Observed in Trial 01: the persistent Meet room identified itself as Council 231 while the active Circle was 233. History is not renumbered; the room’s label needs to follow the current Circle.' },
    ],
    lives: [
      { text: 'Tree · Ankerwycke Yew — its root glows and leads down to the Yew', status: 'LIVE', to: 'yewc233' },
      { text: 'Bird · Barred Owl', status: 'LIVE', to: 'owl' },
      { text: 'Plant · Cuban Oregano', status: 'LIVE', to: 'oregano' },
      { text: 'Fungi · The Prince', status: 'LIVE', to: 'prince' },
      { text: 'Flower · Common Daisy', status: 'LIVE', to: 'daisy' },
      { text: 'Book · The Magician’s Nephew', status: 'LIVE', to: 'nephew' },
      { text: 'Word · Abracadabra', status: 'LIVE', to: 'abracadabra' },
      { text: 'People · those who gather', status: 'LIVE', to: 'people' },
    ],
    relations: [
      { to: 'c233', dim: 'web', text: 'The current Circle, named at the doorway. It has not gathered yet.' },
      { to: 'yewc233', dim: 'web', text: 'Follow the glowing root of the Tree companion' },
      { to: 'c233rec', dim: 'place', text: 'The doorway into the living Circle record' },
      { to: 'trunk', dim: 'time', pending: true, text: 'After the gathering, a compact memory may settle in Heartwood' },
      { to: 'canopy', dim: 'place', text: 'Back out into the canopy' },
    ],
    actions: [
      { label: 'Step through to the living Circle record', sub: 'The doorway at the far side', go: 'c233rec' },
      { label: 'Join the call', sub: 'No verified link in this prototype', href: null },
    ],
    sources: ['Council of Life — Circle 233 · The Equinox Threshold', 'TEOTAG note on Council Room Trial 01, 22 Sep 2026'],
  };

  const comp = (id, kind, name, extra = {}) => {
    n[id] = {
      name, part: kind + ' companion · Circle 233', parent: 'croom', spatial: true, room: true, scale: 'record',
      practical: extra.practical || `Named as the ${kind.toLowerCase()} companion of Circle 233`,
      location: 'Standing at the edge of the Council Fire',
      purpose: extra.purpose || `Part of Circle 233’s curriculum. In the Circle it is a companion; its own life continues outside the Council.`,
      status: 'LIVE', statusNote: 'Listed in the Circle 233 record.',
      placement: 'PROPOSED', placementNote: 'Positions around the fire are illustrative.',
      lives: [], relations: [
        { to: 'croom', dim: 'place', text: 'Back to the fire' },
        { to: 'c233', dim: 'web', text: 'The Circle that invited it' },
      ],
      actions: [{ label: 'Open the living Circle record', sub: 'Notion · members', href: REC }],
      sources: ['Council of Life — Circle 233'], ...extra.more,
    };
  };
  comp('owl', 'Bird', 'Barred Owl');
  comp('oregano', 'Plant', 'Cuban Oregano');
  comp('prince', 'Fungi', 'The Prince', { purpose: 'The Prince mushroom, named as fungi companion of Circle 233. In the Circle it is a companion; its own life continues outside the Council.' });
  comp('daisy', 'Flower', 'Common Daisy');
  comp('nephew', 'Book', 'The Magician’s Nephew');
  comp('abracadabra', 'Word', 'Abracadabra', { practical: '“As I speak, I create.”', purpose: 'The Word companion, spoken into the fire at the centre of the Circle. “As I speak, I create.”' });
  comp('people', 'People', 'People', {
    practical: 'Those who gather',
    purpose: 'Presence is shown by the seats around the fire, which warm while the Circle is gathering. Nobody is tracked, counted or signed in here.',
    more: { placementNote: 'Seats are a presence concept only. No multiplayer or accounts.' },
  });

  n.c233rec = {
    name: 'Circle 233 record', sub: 'The living record', part: 'Doorway at the far side of the fire',
    practical: 'Step through into the Circle’s living record',
    parent: 'croom', spatial: true, room: true, scale: 'record',
    location: 'A lit doorway across the fire from where you arrived',
    purpose: 'The fire is the Circle happening. The doorway is its record, and names the current Circle. Circle 233 has not gathered, so the record holds its invitation and companions but no live notes yet.',
    status: 'LIVE', statusNote: 'The record exists in the Council Ledger and keeps growing.',
    placement: 'PROPOSED', placementNote: 'A door, not the fire: the record is a different thing from the living gathering.',
    lives: [], relations: [
      { to: 'croom', dim: 'place', text: 'Back to the fire' },
      { to: 'trunk', dim: 'time', pending: true, text: 'A compact memory may settle in Heartwood' },
      { to: 'ring', dim: 'time', pending: true, text: 'A few traces may enter the Autumn ring' },
    ],
    actions: [{ label: 'Open the living Circle record', sub: 'Notion · members', href: REC }],
    sources: ['Council of Life — Circle 233'],
  };

  const lenses = [
    { k: 'Place', v: 'Lives among the Ancient Friends, in the Roots', to: 'roots', from: ['roots', 'overview'] },
    { k: 'Circle', v: 'Tree companion of Circle 233, around the Council Fire', to: 'croom', from: ['croom', 'c233', 'owl', 'oregano', 'prince', 'daisy', 'nephew', 'abracadabra', 'people', 'c233rec'] },
    { k: 'Relationship', v: 'Yew × Circle 233 — the glowing root at the Council Fire', to: 'yewc233', from: ['yewc233'] },
    { k: 'Time', v: 'Named in the Autumn Equinox 2026 ring', to: 'ring', from: ['ring'] },
    { k: 'Memory', v: 'Its ledger record is kept in Heartwood', to: 'trunk', from: ['trunk'] },
  ];
  n.yew.lenses = lenses;
  n.yew.relations = [{ to: 'yewc233', dim: 'web', text: 'Its relationship with Circle 233 — the root that glows at the Council Fire' }, ...n.yew.relations.filter((r) => r.to !== 'c233')];
  n.yew.spiral = n.yew.spiral.map((x) => (x.to === 'c233' ? { ...x, to: 'yewc233' } : x));

  n.yewc233 = {
    name: 'Yew × Circle 233', sub: 'A relationship, not a copy', part: 'Tree companion · at the Council Fire',
    practical: 'Follow the glowing root down to the Yew itself',
    parent: 'croom', spatial: true, room: true, scale: 'record',
    location: 'The Tree companion’s place at the edge of the fire. Its root glows and runs down out of the canopy.',
    purpose: 'The Yew’s record stays in Heartwood Ledgers. Circle 233’s record stays in the Council Ledger. This is the relationship between them, named in the Circle’s Tree companion field. Nothing is duplicated.',
    status: 'LIVE', statusNote: 'The relationship is named in the Circle 233 record.',
    placement: 'PROPOSED', placementNote: 'The relationship is shown where both meet: a companion place at the fire whose root leads to the Yew. The ring beside the Yew in the Roots echoes it.',
    where: [
      { k: 'Yew record', v: 'Heartwood Ledgers · Living Tree Ledger 144', status: 'LIVE' },
      { k: 'Circle record', v: 'Council Ledger · Circle 233', status: 'LIVE' },
      { k: 'Joined by', v: 'The Circle’s Tree companion field', status: 'LIVE' },
    ],
    lenses: lenses.map((l) => (l.k === 'Relationship' ? { k: 'Ancient Friend', v: 'The Yew itself', to: 'yew', from: ['yew'] } : l)),
    lives: [], relations: [
      { to: 'yew', dim: 'web', text: 'Descend along the root to the Ancient Friend itself' },
      { to: 'croom', dim: 'web', text: 'The Circle, around its fire' },
      { to: 'ring', dim: 'time', text: 'Where this season remembers it' },
    ],
    actions: [
      { label: 'Open the Yew’s ledger record', sub: 'Notion · Living Tree Ledger 144', href: N + '2fc15b58480d804bb93fc9121b18ae31' },
      { label: 'Open the Circle record', sub: 'Notion · members', href: REC },
    ],
    sources: ['Ankerwycke Yew — Ancient Friends Ledger', 'Council of Life — Circle 233'],
  };

  const s = n.staff;
  Object.assign(s, {
    sub: 'Threshold roundhouse', part: 'Beside the tree · a threshold',
    practical: 'Arrive deliberately, meet the staffs, and find a way inward',
    location: 'A roundhouse at the edge of the clearing. A lit path runs from its door to the Heartwood hollow.',
    purpose: 'A threshold and orientation roundhouse beside the Tree: a place to arrive deliberately, understand the organism, meet allies and staffs, and find ways inward. It is not the only entrance to S33D, and it is not a fifth part of the Tree.',
    placement: 'ESTABLISHED', placementNote: 'TEOTAG direction (22 Sep): a threshold beside the Tree, connected into Heartwood by a path. The lit stone path is this prototype’s form of that connection. Not canonical.',
    notes: [{ status: 'LIVE', text: 'Implementation lineage: the s33d.life app currently files the Staff Room at /library/staff-room. To be reconciled later. It is one entrance, not the only one.' }],
  });
  s.relations = [{ to: 'trunk', text: 'The lit path leads to the Heartwood hollow' }, ...s.relations.filter((r) => r.to !== 'trunk')];

  n.c233.relations = [{ to: 'croom', dim: 'place', text: 'Where it gathers — the Council Fire inside the canopy' }, ...n.c233.relations];
  n.c233.actions = [{ label: 'Enter the Council Fire', sub: 'Where this Circle gathers', go: 'croom' }, ...n.c233.actions];
  n.canopy.relations = [{ to: 'croom', text: 'The Council Fire — a gathering place inside the canopy' }, ...n.canopy.relations];


  const f = (id) => D.listTree.find((x) => x.id === id);
  f('canopy').children.unshift({ id: 'croom', children: ['c233rec', 'yewc233', 'owl', 'oregano', 'prince', 'daisy', 'nephew', 'abracadabra', 'people'].map((id) => ({ id })) });

  D.thread = {
    title: 'Circle 233 ↔ Ankerwycke Yew',
    steps: [
      { id: 'overview', say: 'The whole Tree, from outside. Sap rises from the roots into Heartwood; only a little reaches the crown. Follow one living thread.' },
      { id: 'canopy', say: 'The Council of Life lives in the canopy. This week’s Circle hangs here as a banked lantern, waiting to gather. Step inside.' },
      { id: 'croom', say: 'Inside the canopy: the Council Fire. The place persists; the doorway names Circle 233, which has not gathered yet. One companion’s root is glowing.' },
      { id: 'yewc233', say: 'The Tree companion’s place. This is a relationship: Yew × Circle 233. Its root runs down, out of the canopy.' },
      { id: 'yew', say: 'You followed the root down through the trunk into the Roots. This is the Ankerwycke Yew itself, one record, reached through a Circle.' },
      { id: 'ring', say: 'Heartwood, where the organism remembers. The Autumn ring is still forming. An unlit place on it waits for Circle 233’s traces, once it gathers.' },
      { id: 'overview', say: 'Pulled back out to the whole Tree. The canopy fire, the root, the Yew and the ring are all parts of one organism.' },
    ],
  };
})();

;
// Prototype 0.5 — beauty, grace & clarity pass. Copy only; no ontology changes. Patches 0.4 (v1 + v3 + v4).
(() => {
  const n = window.TETOL.nodes;
  const set = (id, o) => Object.assign(n[id], o);

  set('overview', {
    practical: 'A living map of relationship, memory and possibility.',
    purpose: 'S33D is the seed. TETOL is the tree it grows into: roots where relationship with the living world begins, a trunk that remembers, a canopy where people gather to learn, and a crown where the next growth is imagined.',
  });
  n.overview.relations.forEach((r) => {
    r.text = { crown: 'Where the next growth is imagined', canopy: 'Where people gather to learn with the living world', trunk: 'Where what matters is remembered', roots: 'Where relationship with the living world begins', staff: 'A threshold for arriving well' }[r.to] || r.text;
    if (r.to === 'staff') delete r.kind;
  });

  set('roots', {
    practical: 'Where relationship with the living world begins.',
    purpose: 'Ancient Friends are trees people have met, visited and returned to. Research may point to a tree. Only encounter makes an Ancient Friend.',
  });
  set('trunk', {
    practical: 'Where what matters is remembered.',
    purpose: 'Heartwood keeps encounters, lineage, learning and earlier versions of things. It remembers without overwriting. Not everything is kept, and not everything kept rises further.',
  });
  set('canopy', {
    practical: 'Where people gather to learn with the living world.',
    purpose: 'The Council of Life has met since 2020 in weekly Circles, moon by moon. Trees, birds, plants, fungi, books and words become the curriculum. It is a practice of learning together, not a seat of governance.',
  });
  set('crown', {
    practical: 'Where the next growth is imagined.',
    purpose: 'yOur Golden Dream tends the evolutionary edge. A few signals are chosen to ripen, from Ember to Fruit. Nothing here is decided until TEOTAG approves it.',
  });
  set('staff', {
    practical: 'A threshold for arriving well.',
    purpose: 'A roundhouse beside the Tree, where you can pause, meet the staffs and allies, and find your way in. A path leads from its door into Heartwood. It is one entrance among several.',
  });
  set('croom', {
    practical: 'The gathering place of the Council of Life.',
    purpose: 'The fire is always here. Each week a different Circle gathers around it, with its own companions. The current Circle is named above the far doorway. Behind you, stepping stones lead back out.',
  });
  set('c233', { practical: 'This week’s Circle · waiting to gather.' });
  set('c233rec', { practical: 'Its invitation and companions. Notes begin when it gathers.' });
  set('yew', {
    practical: 'An Ancient Friend, about 2,000 years old.',
    purpose: 'A yew near Wraysbury, Berkshire, alive when Magna Carta was sealed nearby in 1215. That the Charter was sealed at the yew is tradition, not fact. It has its own life and its own record. Circles and encounters gather around it through time.',
  });
  set('yewc233', {
    practical: 'Where a Circle meets an Ancient Friend.',
    purpose: 'Circle 233 invited the Ankerwycke Yew as its Tree companion. This is that relationship, nothing more. The Yew’s record stays in Heartwood; the Circle’s record stays with the Council. Follow the root down to meet the Yew itself.',
  });
  set('ring', { practical: 'This season’s growth ring, still forming.' });
  set('traces', { practical: 'Empty. It waits for Circle 233 to gather.' });
  set('moonroot', { practical: 'Your own quiet remembering · a proposal.' });
  set('pack', { practical: 'A companion bundle to carry with you · draft.' });
  set('signal', { practical: 'Nothing has risen from Circle 233. It may never need to.' });

  n.overview.actions = [{ label: 'Enter the Tree', sub: 'By the Staff Room, a threshold for arriving well', go: 'staff' }, ...n.overview.actions.map((a) => ({ ...a, label: 'Read the TETOL orientation' }))];
  n.canopy.actions = [{ label: 'Enter the Council Fire', sub: 'The gathering place inside the canopy', go: 'croom' }, ...n.canopy.actions];
  n.staff.actions = [{ label: 'Follow the path into Heartwood', sub: 'From the roundhouse door to the hollow', go: 'trunk' }, ...n.staff.actions];
  n.seed = {
    name: 'S33D', sub: 'The Seed', part: 'Where the trunk meets the roots',
    practical: 'The living blueprint from which TETOL grows.',
    parent: 'overview', spatial: true, scale: 'origin',
    location: 'A small warmth at the foot of the trunk, where it meets the roots',
    purpose: 'S33D is the Seed. TETOL is the Tree. The Seed carries the originating principles and patterns through which the living organism grows.',
    status: 'LIVE', statusNote: 'The Seed gateway exists in the app at /s33d.',
    placement: 'PROPOSED', placementNote: 'TEOTAG (22 Sep): the Seed has a quiet presence in the exterior Tree, not a fifth realm or a room. Its exact spot follows the app’s home page, between trunk and roots.',
    notes: [{ status: 'PROPOSED', text: 'A future cycle, Seed → Tree → Crown → Fruit → new Seed, is kept as a possibility only. Not shown.' }],
    lives: [], relations: [
      { to: 'trunk', text: 'The Tree it grows into, beginning with what it remembers' },
      { to: 'roots', text: 'Where it meets the living world' },
    ],
    actions: [{ label: 'Visit the Seed', sub: 's33d.life/s33d · route in app code', href: 'https://www.s33d.life/s33d' }],
    sources: ['TEOTAG answer, 22 Sep 2026', 'S33D-life/ancient-roots-map · TetolHomePage.tsx'],
  };
  n.trunk.relations.push({ to: 'seed', text: 'The Seed, at the foot of the trunk' });
  n.roots.relations.push({ to: 'seed', text: 'The Seed, where roots meet trunk' });
  window.TETOL.listApart.unshift('seed');
  window.TETOL.thread.steps.forEach((s, i) => {
    s.say = [
      'Start outside. Sap rises from the roots into Heartwood; only a little reaches the crown.',
      'The canopy, where the Council gathers. This week’s Circle hangs here as a lantern, not yet lit. Step inside.',
      'The Council Fire. The place stays; the Circle changes. The doorway names Circle 233, still waiting to gather. One companion’s root is glowing.',
      'The Tree companion’s place. A relationship between a Circle and an Ancient Friend. Its root runs down, out of the canopy.',
      'You followed the root down into the Roots. This is the Ankerwycke Yew itself: one record, reached through a Circle.',
      'Heartwood remembers. The Autumn ring is still forming. A small unlit place on it waits for what Circle 233 may leave.',
      'Back outside. Canopy, root, Yew and ring: one organism, and you have travelled through it.',
    ][i] || s.say;
  });
})();

;
// Prototype 0.5 · Heartwood interior + living doorways. Room data read from S33D-life/ancient-roots-map@main (4f39474), 23 Sep 2026.
// Spatial placements here are PROPOSED. Routes are the app's real current routes; they are not changed.
(() => {
  const D = window.TETOL, n = D.nodes, APP = 'https://www.s33d.life';
  const ACCESS = { visitor: 'Open to all', member: 'For members · sign in on arrival', steward: 'Tended by keepers · sign in on arrival', unknown: 'Opens the Atlas' };
  const SRC = 'S33D.life app · src/config/heartwoodRooms.ts + src/components/LibraryRoomGrid.tsx';
  // One reusable doorway shape: a spatial place that can open onto a real web room and, later, be returned to.
  const door = (id, route, access, label) => ({
    door: { spatialPlaceId: id, websiteRoute: route, access, realm: 'trunk', returnSpatialState: '#' + id },
    action: { label, sub: ACCESS[access] + ' · opens on S33D.life', href: APP + route },
    where: [
      { k: 'On S33D.life', v: route + ' · ' + ACCESS[access], status: 'LIVE' },
      { k: 'Return to TETOL', v: 'Required. Return address: this chamber (#' + id + '). Not linked from the live site: the prototype is not part of S33D.life.', status: 'PROPOSED' },
    ],
  });
  const chamber = (id, o, d) => {
    n[id] = { parent: 'hwroom', spatial: true, room: 'hw', scale: 'place', lives: [], notes: o.notes || [],
      status: 'LIVE', statusNote: o.statusNote || 'A working room in the S33D.life app.', sources: [SRC],
      ...o, where: d ? d.where : o.where, door: d && d.door,
      actions: [...(d ? [d.action] : []), ...(o.actions || [])],
      relations: [...(o.relations || []), { to: 'hwroom', dim: 'place', text: 'Back to the hearth' }] };
  };

  n.hwroom = {
    name: 'Inside Heartwood', sub: 'The living memory of the Tree', part: 'Inside the trunk',
    practical: 'You are inside the memory of the Tree.',
    purpose: 'What is encountered may be remembered here. What returns becomes relationship. Light comes from above, the hearth holds the middle, and older things settle low. Turn slowly: the chambers show themselves as you face them.',
    parent: 'trunk', spatial: true, room: 'hw', scale: 'place',
    location: 'The hollow inside the trunk. Its floor is the Tree’s growth rings.',
    status: 'PROPOSED', statusNote: 'A spatial proposal for the Heartwood Library that already exists on S33D.life.',
    placement: 'PROPOSED', placementNote: 'Light above, hearth at the centre, depth below follows the app’s own chamber grouping (Upper Chambers · Central Hearth · Deeper Rings), which it describes as energies, not floors.',
    notes: [{ status: 'LIVE', text: 'Five of the app’s eighteen Heartwood destinations are grown here as proof. The rest are listed in the TETOL Room Registry, not placed.' }, { status: 'PROPOSED', text: 'Scrolls & Records (proposed, not built): remembered Circles may settle into the growth rings of this floor rather than a basement archive. Council alive → Canopy · gathering → Council Fire · remembering → traces settle inward · remembered → Heartwood rings.' }],
    lives: [], relations: [
      { to: 'h_music', dim: 'place', text: 'An upper chamber, toward the light' },
      { to: 'h_friends', dim: 'place', text: 'Beside the hearth, a root passage down' },
      { to: 'h_seed', dim: 'place', text: 'A low chamber that remembers slowly' },
      { to: 'h_atlas', dim: 'place', text: 'A window out to the land' },
      { to: 'h_staff', dim: 'place', text: 'The passage to the Staff Room' },
      { to: 'ring', dim: 'time', text: 'This season’s ring, on the trunk outside' },
    ],
    actions: [{ label: 'Enter the Heartwood Library', sub: 'Every chamber · opens on S33D.life', href: APP + '/library' }],
    sources: [SRC, 'S33D.life app · src/components/library/HeartwoodLanding.tsx'],
  };

  chamber('h_music', {
    name: 'Music Room', sub: 'Songs offered to the trees', part: 'An upper chamber · toward the light',
    practical: 'Songs offered to the trees.',
    purpose: 'Listen to what has been carried into Heartwood. Tree Radio plays here.',
    location: 'High in the trunk wall, where light falls from above.',
    placement: 'PROPOSED', placementNote: 'Upper, as in the app’s grouping: “The songs ascend toward light.” A genuine Heartwood chamber.',
  }, door('h_music', '/library/music-room', 'visitor', 'Enter the Music Room'));

  chamber('h_friends', {
    name: 'Ancient Friends', sub: 'Remembered in Heartwood', part: 'Beside the hearth · a root passage down',
    practical: 'Remembered in Heartwood. Encountered in the living world.',
    purpose: 'Roots are where we meet Ancient Friends. Heartwood is where those relationships are remembered. Each friend is one record, reached from either place.',
    location: 'A low doorway beside the hearth. A root runs from it under the floor, down to the Roots.',
    placement: 'PROPOSED', placementNote: 'TEOTAG direction (23 Sep): living Ancient Friends belong in Roots; Heartwood remembers the relationships and keeps the gallery. One underlying record. Production room name unchanged.',
    actions: [{ label: 'Follow the roots', sub: 'Down to where they are met', go: 'roots' }],
    relations: [{ to: 'roots', dim: 'web', text: 'Down the root to where they live' }, { to: 'yew', dim: 'web', text: 'One of them: the Ankerwycke Yew' }],
  }, door('h_friends', '/library/gallery', 'visitor', 'Enter the Ancient Friends gallery'));

  chamber('h_seed', {
    name: 'Seed Cellar', sub: 'Living knowledge archive', part: 'A deeper chamber · low in the trunk',
    practical: 'Where knowledge is stored so it can grow again.',
    purpose: 'Some chambers remember slowly. The Seed Cellar holds the living knowledge archive and is tended by keepers.',
    location: 'A wide, low opening at the foot of the trunk wall.',
    placement: 'PROPOSED', placementNote: 'Deep, as in the app’s grouping: “Some chambers remember slowly.”',
  }, door('h_seed', '/library/seed-cellar', 'steward', 'Enter the Seed Cellar'));

  chamber('h_atlas', {
    name: 'Map Room', sub: 'Atlas · countries · bio-regions', part: 'A window out to the land',
    practical: 'A window from the trunk out to the living landscape.',
    purpose: 'The Atlas looks outward, to the countries and bio-regions where the trees stand.',
    location: 'A round window in the trunk wall.',
    statusNote: 'A working part of the S33D.life app. Not a Heartwood room in its registry; the Heartwood grid links to it.',
    placement: 'PROPOSED', placementNote: 'A window rather than a chamber: the Atlas lives at /atlas, outside /library, and faces the land.',
    relations: [{ to: 'roots', dim: 'place', text: 'The land it looks out on' }],
  }, door('h_atlas', '/atlas', 'unknown', 'Enter the Map Room'));

  chamber('h_staff', {
    name: 'Path to the Staff Room', sub: 'A passage out to the threshold', part: 'A passage in the trunk wall',
    practical: 'The passage between Heartwood and the Staff Room.',
    purpose: 'The Staff Room stands beside the Tree. This passage joins it to Heartwood, so you can arrive either way.',
    location: 'A warm passage mouth at the foot of the wall, with stepping stones.',
    placement: 'ESTABLISHED', placementNote: 'TEOTAG direction: a threshold beside the Tree, connected into Heartwood by a path. The passage form is this prototype’s.',
    notes: [{ status: 'LIVE', text: 'Implementation lineage: the app files the Staff Room at /library/staff-room, inside Heartwood. Kept as a tension, not changed.' }],
    actions: [{ label: 'Walk out to the Staff Room', sub: 'The roundhouse beside the Tree', go: 'staff' }],
    relations: [{ to: 'staff', dim: 'place', text: 'Out along the passage' }],
  }, door('h_staff', '/library/staff-room', 'member', 'Enter the Staff Room'));

  n.trunk.actions = [{ label: 'Enter Heartwood', sub: 'Step inside the trunk', go: 'hwroom' }, ...n.trunk.actions.map((a) => a.href && /\/library$/.test(a.href) ? { ...a, label: 'The Heartwood Library on S33D.life' } : a)];
  n.trunk.relations = [{ to: 'hwroom', dim: 'place', text: 'Inside the trunk' }, ...n.trunk.relations];
  n.staff.actions = n.staff.actions.map((a) => a.go === 'trunk' ? { ...a, go: 'hwroom', sub: 'Through the passage, into the trunk' } : a);

  const t = D.listTree.find((x) => x.id === 'trunk');
  if (t) (t.children ||= []).unshift({ id: 'hwroom', children: ['h_music', 'h_friends', 'h_seed', 'h_atlas', 'h_staff'].map((id) => ({ id })) });
})();

;
// TETOL tree archetypes · prototype. PROPOSED, not canonical.
// An archetype changes the Tree's body (form, bark, leaves, roots). It never changes TETOL's architecture:
// realms, rooms, records, relationships, doorways and anchors stay the same for every archetype.
window.TETOL_ARCHETYPES = {
  oak: {
    id: 'oak', ordinal: 1, commonName: 'Oak', scientificName: 'Quercus robur', character: 'Veteran pedunculate oak',
    seed: 1215,
    // Trunk: lathe profile [radius, height], then displacement. Radii at 0.2–1.6 are held close to the anchors
    // (Heartwood doorway at the front, Seasonal Ring at 1.6), so the architecture does not move.
    trunk: {
      profile: [[0.001, -0.02], [0.8, -0.02], [0.66, 0.1], [0.55, 0.25], [0.47, 0.55], [0.43, 0.9], [0.4, 1.3], [0.385, 1.6], [0.37, 1.95], [0.35, 2.25], [0.32, 2.5], [0.27, 2.72], [0.001, 2.8]],
      radial: 180, rings: 90, lean: [0.05, 0.02],
      buttress: { amount: 0.36, falloff: 0.24, width: 0.06 },
      fissures: { count: 17, depth: 0.022, wander: 0.6 },
      irregularity: 0.035,
      doorway: { angle: Math.PI / 2, below: 0.78, calm: 0.05 },
    },
    // Limbs: heavy, low and spreading; secondary limbs twist; twig ends carry the leaf clusters.
    limbs: {
      main: 6, low: 2, split: [1.9, 2.6], reach: [1.6, 2.4], rise: [0.6, 1.3], r0: 0.165, r1: 0.05,
      secondary: [2, 3], secondaryReach: [0.6, 1.1], twist: 0.95, leader: { rise: 1.55, r0: 0.13 },
      deadwood: 1,
    },
    roots: { count: 7, reach: [2.4, 3.4], r0: 0.15, r1: 0.018, start: 0.52 },
    bark: {
      ridge: '#6d5a48', fissure: '#20160f', deep: '#0e0906', edgeLight: 'rgba(200,172,136,.16)',
      fissures: 120, fissureWidth: [6, 15], fissureLength: [160, 700], moss: 0.2, lichen: 18, repeat: [2, 0.7],
    },
    leaf: {
      lobes: 5, auricles: true, cards: 3000, cardSize: 0.4, clusterRadius: [0.46, 0.28],
      // Season → leaf tones. Winter: bare branches (future). Spring/Autumn are placeholders for the seasonal pass.
      palette: {
        Spring: ['#8fb25a', '#7aa04a', '#a5c26c'], Summer: ['#3f6232', '#4d7338', '#5c8242', '#34532a'],
        Autumn: ['#44632f', '#4d6a33', '#56733a', '#5f7a3c', '#6a7a36', '#8a7834'], Winter: null,
      },
      fruit: 'acorn',
    },
    canopy: { innerMass: 0.42, innerColor: 0x26361b, sway: 0.006, swayPeriod: 7000 },
    interior: { wall: 0x9a7458, rings: true },
  },
};

;
// Oak prototype · Council of Life as Treehouse + open Canopy Deck (TEOTAG visual-lineage correction, 23 Sep 2026).
// Copy/placement only. Circle 233 remains AWAITING GATHERING; no outcomes are added.
(() => {
  const D = window.TETOL, n = D.nodes;
  Object.assign(n.croom, {
    name: 'Council of Life', sub: 'The Council Deck', part: 'High in the canopy',
    practical: 'Different friends. One living story.',
    location: 'An open timber deck among the great oak limbs, with the fire at its centre and the Council Treehouse beside it.',
    purpose: 'The deck is where a living Circle gathers around the fire. The Treehouse beside it is the Council’s doorway into the Circle’s own record. What a Circle leaves behind is remembered deeper, in Heartwood.',
    placement: 'PROPOSED',
    placementNote: 'Treehouse + open canopy deck is established S33D design lineage (TEOTAG, 23 Sep). This is a first spatial sketch; its look waits for the earlier S33D visual references.',
  });
  n.c233rec.part = 'Through the Treehouse door';
  n.c233rec.location = 'The sheltered Council Treehouse beside the deck. Its door names the current Circle.';
  n.c233rec.purpose = 'The Treehouse is the Council’s local doorway into its living record, not another archive. ' + n.c233rec.purpose;
  const fix = (a) => (a.go === 'croom' && /Council Fire/.test(a.label) ? { ...a, label: 'Climb to the Council deck', sub: 'High in the canopy' } : a);
  n.canopy.actions = n.canopy.actions.map(fix); n.c233.actions = n.c233.actions.map(fix);
  n.canopy.relations.forEach((r) => { if (r.to === 'croom') r.text = 'The Council of Life — a deck and treehouse high in the canopy'; });
  n.c233.relations.forEach((r) => { if (r.to === 'croom') r.text = 'Where it gathers — the Council deck, high in the canopy'; });
  const st = D.thread.steps.find((s) => s.id === 'croom');
  if (st) st.say = 'High in the canopy: the Council of Life. A Circle gathers on this deck around the fire. The Treehouse door names Circle 233, still waiting to gather. One companion’s root is glowing.';
})();

;
// Council of Life · Circles inhabiting one persistent place. PROTOTYPE / CANDIDATE · NOT CANONICAL.
// The place (deck, fire, Treehouse) is scenery. Each Circle is data: its companions, what represents them, which record they point to.
// Next week: add a Circle here and set council.current. No scene rebuild.
(() => {
  const D = window.TETOL, n = D.nodes;
  D.council.circles = {
    233: {
      node: 'c233', number: 233, status: 'awaiting', previous: 232, next: null,
      companions: [
        { id: 'yewc233', kind: 'Tree', seat: -0.5, repr: { form: 'yew', portrait: true, portraitAsset: null /* PLACEHOLDER: painted stand-in until the real Ankerwycke NFTree is recovered from the S33D visual library */ }, record: 'yew' },
        { id: 'owl', kind: 'Bird', seat: 1.0, repr: { form: 'owl', species: 'barred' } },
        { id: 'daisy', kind: 'Plant', seat: -2.45, repr: { form: 'flower', petals: 0xf6f2e6, centre: 0xe8b830, count: 11 } },
        { id: 'prince', kind: 'Fungi', seat: 1.75, repr: { form: 'fungus', cap: 0xb88a58, scales: 0x6e4a2c, stem: 0xefe6d2, count: 3 } },
        { id: 'oregano', kind: 'Herb', seat: -1.75, repr: { form: 'herb', leaf: 0x9ec27a, shape: 'round' } },
        { id: 'nephew', kind: 'Book', seat: 2.45, repr: { form: 'book', title: "The Magician's Nephew", cover: 0x2f4f55, ink: '#e8d7a8' } },
        { id: 'abracadabra', kind: 'Word', seat: Math.PI, repr: { form: 'word', text: 'Abracadabra' } },
      ],
    },
    232: {
      node: 'c232', number: 232, status: 'remembered', previous: null, next: 233,
      companions: [
        { id: 'c232_beech', kind: 'Tree', seat: -0.5, repr: { form: 'sapling', leaf: 0x7aa04a } },
        { id: 'c232_hobby', kind: 'Bird', seat: 1.0, repr: { form: 'owl', species: 'hobby' } },
        { id: 'c232_basil', kind: 'Herb', seat: -1.75, repr: { form: 'herb', leaf: 0x5f9a3a, shape: 'pointed' } },
        { id: 'c232_blewit', kind: 'Fungi', seat: 1.75, repr: { form: 'fungus', cap: 0x9a86b0, scales: 0x7a6694, stem: 0xb8a6cc, count: 3 } },
        { id: 'c232_saffron', kind: 'Plant', seat: -2.45, repr: { form: 'flower', petals: 0x8a68b8, centre: 0xc8341e, count: 7 } },
        { id: 'c232_galahad', kind: 'Book', seat: 2.45, repr: { form: 'book', title: 'Galahad and the Grail', cover: 0x6a2a26, ink: '#e8cf8a' } },
      ],
    },
  };
  D.council.active = 233;
  const SRC232 = 'Circle 232 First Six Companions, confirmed against the live Council Ledger by TEOTAG (23 Sep 2026).';
  n.c232 = {
    name: 'Circle 232', sub: 'The week before', part: 'A ring carved beside the Treehouse door', parent: 'croom', spatial: true, room: true, scale: 'record', circle: 233,
    practical: 'The Circle that gathered here the week before.',
    purpose: 'Touch the ring to see the deck as Circle 232 left it: the same place, the same fire, other companions.',
    location: 'A carved growth ring on the Treehouse wall, left of the door.',
    status: 'REMEMBERED', statusNote: SRC232, placement: 'PROPOSED', placementNote: 'Temporal marker: moving between Circles without leaving the place.',
    stateShort: 'Remembered · the week before',
    lives: [], relations: [{ to: 'croom', dim: 'place', text: 'The same deck, this week' }], actions: [], sources: [SRC232],
  };
  n.c233now = {
    name: 'Circle 233', sub: 'This week · awaiting gathering', part: 'A ring carved beside the Treehouse door', parent: 'croom', spatial: true, room: true, scale: 'record', circle: 232,
    practical: 'Return to this week’s Circle.', purpose: 'The companions of Circle 233 have arrived. The Circle has not gathered yet.',
    location: 'The newest ring on the Treehouse wall.', status: 'LIVE', statusNote: 'Awaiting gathering · date being reset.', placement: 'PROPOSED', placementNote: 'Temporal marker.',
    lives: [], relations: [{ to: 'croom', dim: 'place', text: 'Back to the fire' }], actions: [], sources: ['Council of Life — Circle 233'],
  };
  const c232 = (id, name, kind, extra = {}) => { n[id] = {
    name, sub: kind + ' companion · Circle 232', part: 'At the Council fire · Circle 232', parent: 'croom', spatial: true, room: true, scale: 'record', circle: 232,
    practical: `${kind} companion of Circle 232.`, purpose: 'Named in the Circle 232 record. Its own life continues outside the Council.',
    location: 'At its place around the fire, the week before.', status: 'REMEMBERED', statusNote: SRC232,
    placement: 'PROPOSED', placementNote: 'Seat positions are illustrative.', lives: [], relations: [{ to: 'c232', dim: 'time', text: 'The Circle that invited it' }], actions: [], sources: [SRC232], ...extra }; };
  c232('c232_beech', 'Common Beech', 'Tree'); c232('c232_hobby', 'Hobby', 'Bird'); c232('c232_basil', 'Greek Basil', 'Herb');
  c232('c232_blewit', 'Wood Blewit', 'Fungi'); c232('c232_saffron', 'Saffron', 'Plant'); c232('c232_galahad', 'Galahad and the Grail', 'Book');
  ['yewc233', 'owl', 'daisy', 'prince', 'oregano', 'nephew', 'abracadabra', 'people', 'c233rec'].forEach((id) => { if (n[id]) n[id].circle = 233; });
  n.croom.relations = [...n.croom.relations, { to: 'c232', dim: 'time', text: 'The Circle before — carved beside the Treehouse door' }];
  if (n.yewc233) { n.yewc233.practical = 'A yew branch reaching toward its own portrait. Follow its root down to the Yew itself.'; n.yewc233.location = 'The Tree companion’s place: a living yew shoot rising beside the deck, curling toward a framed portrait of the Ankerwycke Yew hung from the oak.'; }
  if (n.abracadabra) n.abracadabra.location = 'A small scroll hanging from the great limb above the fire.';
  n.people.purpose = 'The inner seats are for the people who gather. They stay empty until the Circle meets. Nobody is shown, tracked or invented here.';
})();

;
// Council of Life · TIME OF THE COUNCIL layer. PROPOSAL · NOT CANONICAL · NOT SYNCED.
// Origin: conversation between Ed and Max Benzie, 23 Sep 2026 (Max: astrocartography; offered to help bring Maya timekeeping into the Council).
// Four voices kept distinct: Moon · Sun/Earth · Chol Q'ij · People. None is scored, ranked or used to choose a date.
// Chol Q'ij is CALCULATED here (GMT correlation 584283, anchor 21 Dec 2012 = 4 Ajpu) and must be checked against The Four Pillars (thefourpillars.net) before it is shown as fact.
// Moon age is an approximation (mean synodic month); exact phase times TO VERIFY.
(() => {
  const D = window.TETOL;
  const NAWAL = ["Imox", "Iq'", "Aq'ab'al", "K'at", "Kan", "Kame", "Kej", "Q'anil", "Toj", "Tz'i'", "B'atz'", "E", "Aj", "I'x", "Tz'ikin", "Ajmaq", "No'j", "Tijax", "Kawoq", "Ajpu"];
  // Common English glosses of the day names only (not teachings). TO CONFIRM with Max / sources.
  const GLOSS = { "Aq'ab'al": 'dawn', "K'at": 'net', 'Kan': 'serpent', 'Kame': 'death · the ancestors', "No'j": 'thought', 'Tijax': 'flint', 'Kawoq': 'storm · community', 'Ajpu': 'sun · hunter' };
  const DAY = 86400000, ANCHOR = Date.UTC(2012, 11, 21), NM0 = Date.UTC(2000, 0, 6, 18, 14), SYN = 29.530588853;
  const EQUINOX = Date.UTC(2026, 8, 23); // autumn equinox falls in the early hours of 23 Sep 2026 UK time · exact time TO VERIFY
  const CHAPTER = { start: Date.UTC(2026, 8, 11), name: 'New Moon chapter, 11 September 2026' };
  const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const fmt = (t) => new Date(t).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const phase = (a) => a < 1.5 ? 'New Moon' : a < 7 ? 'Waxing crescent' : a < 8.5 ? 'First quarter' : a < 14 ? 'Waxing gibbous' : a < 15.8 ? 'Full Moon' : a < 22 ? 'Waning gibbous' : a < 23.5 ? 'Last quarter' : a < 28.3 ? 'Waning crescent' : 'New Moon';
  function day(iso) {
    const t = parse(iso), n = Math.round((t - ANCHOR) / DAY);
    const coef = (((3 + n) % 13) + 13) % 13 + 1, nawal = NAWAL[(((19 + n) % 20) + 20) % 20];
    const age = ((((t + DAY / 2) - NM0) / DAY) % SYN + SYN) % SYN, ch = Math.round((t - CHAPTER.start) / DAY) + 1;
    const e = Math.round((t - EQUINOX) / DAY);
    return {
      iso, greg: fmt(t),
      moon: `${phase(age)} · day ${ch} of the New Moon chapter`,
      sun: e === 0 ? 'The autumn equinox · day and night near equal' : e === -1 ? 'Eve of the autumn equinox' : e < 0 ? `${-e} days before the autumn equinox` : e === 1 ? 'The first day after the autumn equinox' : `${e} days after the autumn equinox`,
      cq: { coef, nawal, gloss: GLOSS[nawal] || null, basis: 'Calculated · GMT 584283 · to check against The Four Pillars' },
      reading: READINGS[`${coef} ${nawal}`] || null,
    };
  }
  // Attributed interpretations only. Empty until the wording is taken, with permission, from a named source.
  const READINGS = {
    // "10 K'at": { text: '…', source: 'Mark Elmy, The Four Pillars', url: 'https://thefourpillars.net/', kind: 'interpretation' },
  };
  const SOURCES = [
    { name: 'The Four Pillars · Mark Elmy', url: 'https://thefourpillars.net/', role: 'Date mapping and interpretation Ed currently uses. One modern interpreter, not the definitive meaning.' },
    { name: 'Max Benzie', role: 'Research contribution · awaited.' },
    { name: 'Contemporary Maya voices and practitioners', role: 'Not yet sourced.' },
    { name: 'Scholarship', role: 'Not yet sourced.' },
  ];
  // Council Cycle → invitation drafted · invitation shared · gathering. null = not yet known / to confirm.
  const cycles = {
    233: {
      drafted: null, shared: null, held: null,
      planned: { iso: '2026-09-22', note: 'Tue 22 Sep, 7:30–8:30pm BST, curated by Ed and Leo (Notion snapshot, 22 Sep 2026). Being reset.' },
      node: 'c233now', explored: ['2026-09-23', '2026-09-24', '2026-09-25'], exploredNote: 'Named as the reset window. Not confirmed as meeting times.',
      // Person → conversation → thread → possible contribution. Contributors only; no calendar meanings assigned.
      people: [
        { who: 'Ian', when: '2026-09-23', with: 'Ed', threads: ['Noku Pod'], toward: 'The emerging local expression around Nokuphila.' },
        { who: 'Vicky', when: '2026-09-23', with: 'Ed', threads: ['Tree Energy Archetypes'], toward: 'A possible series together exploring / channelling tree-energy archetypes (their language and practice).' },
        { who: 'Max Benzie', when: '2026-09-23', with: 'Ed', threads: ['Maya timekeeping', 'Astrocartography', 'Council of Life'], toward: 'Helping bring Maya timekeeping into the Council of Life; this Time layer awaits his input.' },
      ],
    },
    232: { node: 'c232', status: 'remembered', drafted: null, shared: null, held: null },
  };
  const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
  D.time = { day, todayIso, cycles, SOURCES, readings: READINGS, provenance: 'Emerged 23 Sep 2026 from a conversation between Ed and Max Benzie.' };
  ['croom', 'c233now'].forEach((id) => { if (D.nodes[id]) D.nodes[id].time = 233; });
  if (D.nodes.c232) D.nodes.c232.time = 232;
})();

;
// TETOL 0.9.3 Experimental Grace Pass · EXPERIMENT · NOT CANONICAL · NOT DEPLOYED.
// Loaded after tetol-council-time.js. 0.9.1 / 0.9.2 do not load this file.
// Part 1 (always on): align Circle 233 wording with the current record. 23–25 Sep were dates EXPLORED, not confirmed.
// Part 2 (experiment F only): a few Council memory marks. Nothing historical is invented; missing records stay missing.
(() => {
  const D = window.TETOL, n = D.nodes, X = window.TETOL_X || {};
  D.circle233.candidates = null; D.circle233.explored = '23–25 September';
  const fix = (s) => typeof s !== 'string' ? s : s
    .replace('the gathering is being rescheduled to 23, 24 or 25 September.', 'it did not gather on 22 September. Dates from 23 to 25 September were explored; none is confirmed.')
    .replace('Not yet held · being rescheduled to 23, 24 or 25 Sep', 'Not yet held · no date confirmed (23–25 Sep explored)')
    .replace(/date being reset/g, 'no date confirmed');
  Object.values(n).forEach((node) => {
    ['purpose', 'statusNote', 'practical', 'sub', 'location'].forEach((k) => { node[k] = fix(node[k]); });
    (node.where || []).forEach((w) => { w.v = fix(w.v); });
  });
  const cy = D.time && D.time.cycles[233];
  if (cy) {
    cy.planned.note = 'Tue 22 Sep, 7:30–8:30pm BST, curated by Ed and Leo (Notion snapshot, 22 Sep 2026). It did not gather that evening.';
    cy.exploredNote = 'Explored as possible gathering dates. None is confirmed.';
  }

  if (!X.F) return;
  const base = { parent: 'croom', spatial: true, room: true, scale: 'record', placement: 'PROPOSED', placementNote: 'Council memory experiment (0.9.3): the Treehouse bears traces; Heartwood holds memory.', lives: [], actions: [] };
  // Both Circle marks stay on the wall whichever Circle is inhabiting the deck.
  delete n.c232.circle; delete n.c233now.circle;
  n.c232.location = 'A carved ring on the Treehouse wall, left of the door.';
  n.c233now.part = 'The newest ring, right of the Treehouse door';
  n.c233now.location = 'The newest ring on the Treehouse wall. It is outlined, not yet carved: a Circle is carved after it gathers.';
  n.mem231 = { ...base,
    name: 'Circle 231', sub: 'Record not held here', part: 'An uncarved ring on the Treehouse wall',
    practical: 'A ring is kept for this Circle. Its record has not been brought into TETOL.',
    purpose: 'The Council’s numbering places a Circle here, before 232. Its companions, date and notes are not held in this prototype, so the ring stays uncarved. Nothing is filled in on its behalf.',
    location: 'Further along the Treehouse wall, past Circle 232.',
    status: 'UNRESOLVED', statusNote: 'Record not yet recovered into TETOL.',
    relations: [{ to: 'c232', dim: 'time', text: 'The Circle after · carved' }, { to: 'croom', dim: 'place', text: 'Back to the fire' }],
    sources: ['None held. Only the Circle number is assumed, from the Council’s own numbering.'],
  };
  n.memolder = { ...base,
    name: 'Earlier Circles', sub: 'Fading into the grain', part: 'Faint rings along the Treehouse wall',
    practical: 'More than two hundred Circles came before. Their rings stay faint until their records are brought here.',
    purpose: 'The Treehouse carries a mark for each Circle it has held. Where a record has not been recovered, the mark is only a faint outline. What a Circle leaves behind is remembered deeper, in Heartwood.',
    location: 'The far side of the Treehouse wall, fading into the timber.',
    status: 'UNRESOLVED', statusNote: 'Historical Council records are not yet held in TETOL. None is reconstructed here.',
    relations: [{ to: 'mem231', dim: 'time', text: 'Circle 231 · uncarved' }, { to: 'hwroom', dim: 'time', text: 'Where Council memory is held · Heartwood' }, { to: 'croom', dim: 'place', text: 'Back to the fire' }],
    sources: ['None held.'],
  };
  n.croom.relations = [...n.croom.relations, { to: 'mem231', dim: 'time', text: 'Older rings on the Treehouse wall · records not yet held' }];
  n.c232.relations = [...n.c232.relations, { to: 'mem231', dim: 'time', text: 'The Circle before · uncarved' }];
})();

;
window.TETOL_DEFAULT_NEXT = window.TETOL_DEFAULT_NEXT || "roots";
;
window.STAFFROOM_URL="5eaf7c1e-2b0d-4c3a-9f61-7a1d3b8e0c42";
;
// TETOL · reusable interiors: enter / return / hand-off. EXPERIMENT · NOT CANONICAL · NOT DEPLOYED.
// Audit Step 1. Generalised from the Staff Room integration (24 Sep), which is its first and only client.
//
// The grammar:  APPROACH (a node) → CROSS THRESHOLD (enter) → INHABIT (the interior) → INTERACT (objects)
//               → FOLLOW PASSAGE (hand-off to another node) → RETURN TO THE WHOLE TREE.
//
// An interior is a self-contained page mounted over the Tree. It talks to the Tree through one small
// message protocol (window.postMessage). Only the interior's own frame is trusted:
//   interior → Tree   { tetolInterior: 1, id, act: 'leave' }                      return to where you came from
//                     { tetolInterior: 1, id, act: 'go', to: '<node id>' }        hand off through a passage
//                     { tetolInterior: 1, id, act: 'state', ...where it is }      so controllers can follow
//   Tree → interior   { tetolIntent: 1, name, arg }                               intents (back, select …)
// Hand-offs are allowed only to nodes the interior declares in `passages`.
// Legacy: the Staff Room's first protocol ({ tetolStaffRoom: 1 }) is still accepted.
(() => {
  const D = window.TETOL, n = D.nodes;

  // ── Registry of interiors. Only the Staff Room exists; others are listed for the address registry, unbuilt.
  const INTERIORS = {
    staffroom: {
      label: 'The Staff Room', node: 'staff', url: () => window.STAFFROOM_URL, enclosed: true, // fully covers the Tree
      passages: ['hwroom'], // root passage → Heartwood (built)
      entrances: [
        { node: 'staff', label: 'Step inside the Staff Room', sub: 'The roundhouse interior, here beside the Tree · the staffs on the floor spiral' },
        { node: 'h_staff', label: 'Walk through into the Staff Room', sub: 'Along the passage, into the roundhouse interior' },
      ],
      note: 'The interior opens in place: the Staff Spiral is inlaid in the roundhouse floor, and its root passage leads into Heartwood. Carried in from the Staff Room experiment; not canonical.',
    },
    // Proposed, not built (see tetol-routes.js): cavern (Roots), hearth, crown observatory, taproot.
  };
  const TOKEN = (id) => '@interior:' + id;

  // Put each built interior's doorway on its nodes. The older '@staffroom' token still resolves.
  for (const [id, it] of Object.entries(INTERIORS)) {
    if (typeof it.url() !== 'string') continue;
    for (const e of it.entrances) {
      const x = n[e.node]; if (!x) continue;
      x.actions = [{ label: e.label, sub: e.sub, go: TOKEN(id) }, ...(x.actions || []).filter((a) => a.go !== TOKEN(id) && a.go !== '@staffroom')];
    }
    if (it.note && n[it.node]) (n[it.node].notes ||= []).push({ status: 'PROPOSED', text: it.note });
  }

  let cur = null; // { id, ov, frame, state, lastFocus }

  // While a fully enclosed interior covers the screen, the Tree need not keep drawing unseen beneath it.
  // Only the stage's draw loop pauses; the camera, place, time and state are untouched, so return is seamless.
  // ?suspend=0 turns this off (for A/B measurement).
  const SUSPEND = !/[?&]suspend=0/.test(location.search);
  const stage = () => document.querySelector('three-d-stage[name="tetol-prototype"]') || document.querySelector('three-d-stage');
  let suspendT = 0, suspended = false;
  function suspendTree(on) {
    clearTimeout(suspendT);
    const st = stage(); if (!st || !st._renderer || !st._loop) return;
    if (on && SUSPEND) suspendT = setTimeout(() => { if (cur && INTERIORS[cur.id].enclosed) { st._renderer.setAnimationLoop(null); suspended = true; } }, 1600); // after the fade has fully covered it
    if (!on && suspended) { st._renderer.setAnimationLoop(st._loop); suspended = false; }
  }
  const css = document.createElement('style');
  css.textContent = `
    .tetol-interior{position:fixed;inset:0;z-index:2147483000;background:#15110c;opacity:0;transition:opacity 900ms ease}
    .tetol-interior.on{opacity:1}
    .tetol-interior iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#15110c}
    @media (prefers-reduced-motion: reduce){.tetol-interior{transition:none}}`;
  document.head.appendChild(css);

  const place = () => dispatchEvent(new CustomEvent('tetol:place', { detail: { interior: cur && { id: cur.id, state: cur.state } } }));

  function open(id) {
    const it = INTERIORS[id]; if (!it) return false;
    if (cur) { if (cur.id === id) return true; close(() => open(id)); return true; }
    const url = it.url();
    if (!url || !/^blob:/.test(url)) { console.warn('[interior] not available:', id); return false; }
    const ov = document.createElement('div');
    ov.className = 'tetol-interior'; ov.id = 'interior-' + id;
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Inside ' + it.label.replace(/^The /, 'the '));
    const f = document.createElement('iframe');
    f.name = 'tetol-interior:' + id; f.title = it.label; f.src = url;
    ov.appendChild(f); document.body.appendChild(ov);
    cur = { id, ov, frame: f, state: null, lastFocus: document.activeElement };
    suspendTree(true);
    document.body.classList.add('ininterior', 'in-' + id);
    requestAnimationFrame(() => requestAnimationFrame(() => cur && cur.ov === ov && ov.classList.add('on')));
    f.addEventListener('load', () => { try { f.contentWindow.focus(); } catch (e) {} });
    place();
    return true;
  }
  function close(then) {
    if (!cur) { if (then) then(); return false; }
    const c = cur; cur = null;
    suspendTree(false); // the Tree is drawing again before the interior begins to fade
    c.ov.classList.remove('on');
    const done = () => { c.ov.remove(); document.body.classList.remove('ininterior', 'in-' + c.id); place(); if (then) then(); if (c.lastFocus && document.contains(c.lastFocus)) c.lastFocus.focus({ preventScroll: true }); else document.getElementById('pname')?.focus?.({ preventScroll: true }); };
    matchMedia('(prefers-reduced-motion: reduce)').matches ? done() : setTimeout(done, 900);
    return true;
  }
  function send(name, arg) { try { cur && cur.frame.contentWindow.postMessage({ tetolIntent: 1, name, arg }, '*'); return !!cur; } catch (e) { return false; } }

  // Route a Tree move through the prototype's own [data-go] handler (keeps its history and camera flight).
  function goTo(id) {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.go = id; b.hidden = true;
    document.body.appendChild(b); b.click(); b.remove();
  }

  // Mouse / touch / keyboard activation of a doorway goes through the shared intent layer when present.
  document.addEventListener('click', (e) => {
    const g = e.target.closest && e.target.closest('[data-go^="@interior:"], [data-go="@staffroom"]');
    if (!g) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const id = g.dataset.go === '@staffroom' ? 'staffroom' : g.dataset.go.slice('@interior:'.length);
    window.TETOL_NAV ? window.TETOL_NAV.run('enter', id, e.detail === 0 ? 'keyboard' : 'pointer') : open(id);
  }, true);

  window.addEventListener('message', (e) => {
    const d = e.data; if (!cur || !d || typeof d !== 'object') return;
    if (e.source !== cur.frame.contentWindow) return;
    const isNew = d.tetolInterior === 1 && d.id === cur.id, isLegacy = d.tetolStaffRoom === 1 && cur.id === 'staffroom';
    if (!isNew && !isLegacy) return;
    // through the public hook, so presentation layers (e.g. the Grace pass) can shape the exit
    const C = (then) => (window.TETOL_INTERIORS ? window.TETOL_INTERIORS.close(then) : close(then));
    if (d.act === 'leave') C();
    if (d.act === 'go' && typeof d.to === 'string' && n[d.to] && (INTERIORS[cur.id].passages || []).includes(d.to)) C(() => goTo(d.to));
    if (d.act === 'state') { const { tetolInterior, tetolStaffRoom, id, act, ...s } = d; cur.state = s; place(); }
  });

  addEventListener('keydown', (e) => { if (cur && e.key === 'Escape') { e.stopImmediatePropagation(); window.TETOL_INTERIORS.close(); } }, true);

  window.TETOL_INTERIORS = {
    open, close, send,
    current: () => cur && { id: cur.id, label: INTERIORS[cur.id].label, node: INTERIORS[cur.id].node, state: cur.state },
    treeSuspended: () => suspended,
    list: () => Object.entries(INTERIORS).map(([id, it]) => ({ id, label: it.label, node: it.node, built: typeof it.url() === 'string', passages: it.passages })),
  };
  // Back-compat for anything written against the first Staff Room hook.
  window.TETOL_STAFFROOM = {
    open: () => open('staffroom'), close, send,
    isOpen: () => cur?.id === 'staffroom', state: () => (cur?.id === 'staffroom' ? cur.state : null),
  };
})();

;
// TETOL · route → spatial-address registry (0.9.5 coverage pass: updated in place, see COVER below). EXPERIMENT · NOT CANONICAL · NOT DEPLOYED.
// Audit Step 0. Data only: no scenery. Source: S33D-life/ancient-roots-map@85c0641 (src/App.tsx, 23 Sep 2026),
// following the TEOTAG working directions of 24 Sep 2026.
//
// Three things are kept distinct:
//   S33D.life LIVE APP  the current product; every route below belongs to it. `live: true` means the spatial
//                       object or passage opens that live-app route (it is a doorway, not a realm).
//   TETOL 3D            this experimental spatial interface. `address` is where the function lives in it.
//   OUTSIDE WORLD       a spatial zone of TETOL: the land-facing world (map, atlas, gardens, groves, pathways,
//                       research trees and appropriate external-world connections).
//
// status  BUILT    a spatial home exists in the prototype and can be reached now
//         PARTIAL  the realm or node exists, but the room or object for this function is not built
//         MISSING  no spatial home yet
//         NONE     deliberately not spatialised (infrastructure, dev tools)
// node    the nearest EXISTING prototype node, so every route can be reached today
// form    REALM · ROOM · SUBROOM · OBJECT · PASSAGE · VIEW · OVERLAY · OUTSIDE-WORLD ENCOUNTER
window.TETOL_ROUTES = (() => {
  const R = [];
  // route, current function, realm, form, proposed spatial address, status, nearest node, opens live app?, note
  const r = (route, fn, realm, form, address, status, node, live = true, note = '') => R.push({ route, fn, realm, form, address, status, node, live, note });

  // ── Whole Tree / entry
  r('/', 'TETOL home: 2D tree diagram and navigation compass', 'WHOLE TREE', 'VIEW', 'tree', 'BUILT', 'overview', true, 'The 3D Tree is the spatial form; the 2D diagram stays as the fallback. Competes with /s33d and /ecosystem.');
  r('/s33d', 'S33D gateway (former homepage)', 'THRESHOLD', 'OBJECT', 'staff-room/door/seed-stone', 'PARTIAL', 'staff');
  r('/ecosystem', 'Ecosystem map', 'WHOLE TREE', 'VIEW', 'tree', 'PARTIAL', 'overview', true, 'Function unconfirmed; possibly superseded by TETOL itself.');
  r('*', 'Not found', 'WHOLE TREE', 'OVERLAY', 'overlay/not-grown', 'MISSING', 'overview', false);

  // ── Threshold: Staff Room / Roundhouse
  r('/library/staff-room', 'Staff Room: 144 staffs, staff ceremony', 'THRESHOLD', 'ROOM', 'staff-room', 'BUILT', 'staff', true, 'Interior built (experiment). The live app files it inside Heartwood; tension kept.');
  r('/staff/:code', 'One staff: record, lineage, QR', 'THRESHOLD', 'OBJECT', 'staff-room/spiral/staff/:code', 'BUILT', 'staff', true, 'Staff panel inside the interior. Deep-linking to a single staff is not wired yet.');
  r('/welcome', 'Post-signup welcome', 'THRESHOLD', 'SUBROOM', 'staff-room/arrival', 'PARTIAL', 'staff');
  r('/email-confirmed', 'Redirect → /welcome', 'THRESHOLD', 'PASSAGE', 'staff-room/arrival', 'PARTIAL', 'staff');
  r('/auth', 'Sign in / sign up', 'THRESHOLD', 'OVERLAY', 'overlay/gate', 'MISSING', 'staff', true, 'Gate at member doors; returns to the same address. Production auth is not touched.');
  r('/reset-password', 'Password reset', 'THRESHOLD', 'OVERLAY', 'overlay/gate', 'MISSING', 'staff');
  r('/auth/handoff', 'Installed-app sign-in handoff', 'NONE', 'NONE', '', 'NONE', 'overview');
  r('/auth/diagnostics', 'Sign-in diagnostics', 'NONE', 'NONE', '', 'NONE', 'overview');
  r('/.lovable/oauth/consent', 'OAuth consent', 'NONE', 'NONE', '', 'NONE', 'overview');
  r('/about', 'About S33D', 'THRESHOLD', 'OBJECT', 'staff-room/guide-book', 'PARTIAL', 'staff');
  r('/docs', 'How-to documentation', 'THRESHOLD', 'OBJECT', 'staff-room/guide-book', 'PARTIAL', 'staff');
  r('/support', 'Support S33D (give, receive, partners, signals)', 'THRESHOLD', 'OBJECT', 'staff-room/offering-bowl', 'PARTIAL', 'staff');
  r('/referrals', 'Invite others ("Your Grove")', 'THRESHOLD', 'OBJECT', 'staff-room/lantern', 'PARTIAL', 'staff');
  r('/install', 'Install the PWA', 'THRESHOLD', 'OBJECT', 'staff-room/seed-to-take-home', 'PARTIAL', 'staff');
  r('/privacy', 'Privacy policy', 'NONE', 'OVERLAY', 'overlay/privacy', 'MISSING', 'overview');
  r('/telegram-handoff', 'Telegram bot handoff', 'OUTSIDE WORLD', 'PASSAGE', 'arrivals/telegram', 'MISSING', 'staff');
  r('/incoming-share', 'OS share target', 'OUTSIDE WORLD', 'PASSAGE', 'arrivals/share', 'MISSING', 'staff');
  r('/companion', 'Phone pairs with desktop session', 'WHOLE TREE', 'OVERLAY', 'overlay/companion', 'MISSING', 'overview', true, 'Related to the Wand experiment; separate systems.');
  r('/life-grove-invite/:inviteToken', 'Accept a Life Grove invitation', 'TRUNK', 'PASSAGE', 'staff-room → heartwood/life-groves', 'MISSING', 'staff');

  // ── Roots: Ancient Friends (relationships, encounters)
  // SPATIAL CORRECTION (TEOTAG, 25 Sep 2026): Ancient Friends is ROOTS in meaning, and it is reached DOWNWARD FROM
  // HEARTWOOD: Heartwood → root passage / descent → Ancient Friends Cavern → individual Friends. Not a building beside
  // the Tree, not a shelf inside Heartwood. Visual ancestry (Google Drive, labels read via Drive text extraction):
  // the Ethereal Tree diagram marks "ANCIENT FRIENDS CAVERN ENT." at the roots beneath the trunk; a Tree cutaway lists
  // "1. ANCIENT FRIENDS CAVERNS" as the lowest level. TETOL provides the grammar; real Ancient Friends provide the truth.
  r('(passage) Heartwood → Ancient Friends Cavern', 'The descent from the Heartwood hollow into the root cavern', 'ROOTS', 'PASSAGE', 'heartwood/root-descent', 'PARTIAL', 'h_friends', false, '0.9.4-dev ?next=roots: the descent is built from the h_friends arch (the rimmed opening at the foot of the Heartwood wall) down to one Cavern chamber. Experiment only.');
  r('/library/gallery', 'Ancient Friends: the verified living record', 'ROOTS', 'ROOM', 'heartwood/root-descent/cavern/gallery', 'PARTIAL', 'h_friends', true, 'The Cavern is the gallery, reached down through Heartwood. Currently only the h_friends chamber/passage node exists; the Cavern is not built.');
  r('/library/ancient-friends', 'Alias → /library/gallery', 'ROOTS', 'PASSAGE', 'heartwood/root-descent/cavern/gallery', 'PARTIAL', 'h_friends');
  r('/ancient-friends', 'Redirect → /library/ancient-friends', 'ROOTS', 'PASSAGE', 'heartwood/root-descent/cavern/gallery', 'PARTIAL', 'h_friends');
  r('/gallery', 'Redirect (gallery)', 'ROOTS', 'PASSAGE', 'heartwood/root-descent/cavern/gallery', 'PARTIAL', 'h_friends');
  r('/tree/:id', 'One Ancient Friend: offerings, encounters, memory', 'ROOTS', 'OBJECT', 'heartwood/root-descent/cavern/friend/:id', 'PARTIAL', 'roots', true, 'TEOTAG 25 Sep: "friend" is the entity/address term (an alcove may later be one presentation of a Friend). 0.9.4-dev ?next=roots: one Friend (Major Oak) met in the first Cavern chamber. The Ankerwycke Yew remains on the Tree.');
  r('/visits', 'Your visited Ancient Friends', 'ROOTS', 'OBJECT', 'heartwood/root-descent/cavern/visits-path', 'MISSING', 'roots');
  r('/whispers', 'Whispers: waiting / collected', 'ROOTS', 'OBJECT', 'heartwood/root-descent/cavern/whisper-wall', 'MISSING', 'roots', true, 'Plus a personal overlay inbox.');
  r('/add-tree', 'Map a new Ancient Friend', 'ROOTS', 'PASSAGE', 'outside-world → heartwood/root-descent/cavern (plant a root; the Friend is met on the land, remembered below)', 'MISSING', 'roots');
  r('/library/quest-cave', 'Quest Cave: species paths, current quest', 'ROOTS', 'SUBROOM', 'heartwood/root-descent/cavern/quest-cave', 'MISSING', 'roots', true, 'TEOTAG: test as a Roots subspace/passage, not a Heartwood chamber.');
  r('/heartwood/quest-room', 'Redirect → /library/quest-cave', 'ROOTS', 'PASSAGE', 'heartwood/root-descent/cavern/quest-cave', 'MISSING', 'roots');
  r('/heartwood/quest-cave', 'Redirect → /library/quest-cave', 'ROOTS', 'PASSAGE', 'heartwood/root-descent/cavern/quest-cave', 'MISSING', 'roots');

  // ── Outside World (land-facing zone of TETOL)
  r('/map', 'Interactive map of Ancient Friends (filters, seasonal lens, journeys)', 'OUTSIDE WORLD', 'OUTSIDE-WORLD ENCOUNTER', 'outside-world/land', 'PARTIAL', 'roots', true, 'Reached through the Cavern mouth (proposed) and the Map Room table. The land itself is not rebuilt in 3D.');
  r('/tree/research/:id', 'Research-dataset tree (unverified)', 'OUTSIDE WORLD', 'OBJECT', 'outside-world/land/research/:id', 'MISSING', 'roots');
  r('/garden/:slug', 'A garden', 'OUTSIDE WORLD', 'OUTSIDE-WORLD ENCOUNTER', 'outside-world/garden/:slug', 'MISSING', 'roots');
  r('/groves', 'Grove candidates and blessed groves', 'OUTSIDE WORLD', 'VIEW', 'outside-world/land?layer=groves', 'MISSING', 'roots', true, 'Live-app nav files this under Council.');
  r('/pathways', 'Mycelial pathways between groves', 'OUTSIDE WORLD', 'VIEW', 'roots → outside-world (mycelial threads)', 'MISSING', 'roots');
  r('/pulse', 'Forest Pulse: living activity', 'WHOLE TREE', 'VIEW', 'lens/pulse', 'MISSING', 'overview');
  r('/discovery', 'Discovery (function to confirm)', 'OUTSIDE WORLD', 'VIEW', 'outside-world/land?layer=discovery', 'MISSING', 'roots');
  r('/atlas', 'World atlas: countries index', 'TRUNK', 'OBJECT', 'heartwood/map-room/table', 'PARTIAL', 'h_atlas', true, 'The Map Room table is the window onto the Outside World.');
  r('/atlas/countries', 'Country wall', 'TRUNK', 'OBJECT', 'heartwood/map-room/wall', 'PARTIAL', 'h_atlas');
  r('/atlas/:countrySlug', 'Country portal (template)', 'OUTSIDE WORLD', 'OBJECT', 'heartwood/map-room/table/:countrySlug', 'PARTIAL', 'h_atlas');
  r('/atlas/:countrySlug/:subSlug', 'Sub-region portal', 'OUTSIDE WORLD', 'OBJECT', 'heartwood/map-room/table/:countrySlug/:subSlug', 'PARTIAL', 'h_atlas');
  r('/country/:countrySlug/:citySlug', 'City page (legacy path)', 'OUTSIDE WORLD', 'OBJECT', 'heartwood/map-room/table/:countrySlug/:citySlug', 'PARTIAL', 'h_atlas');
  for (const c of ['hong-kong', 'singapore', 'japan', 'italy', 'united-states', 'south-africa', 'india', 'taiwan', 'spain', 'mexico'])
    r('/atlas/' + c, 'Bespoke country atlas page', 'OUTSIDE WORLD', 'OBJECT', 'heartwood/map-room/table/' + c, 'PARTIAL', 'h_atlas', true, 'One template on the table, not ten rooms.');
  r('/atlas/switzerland/valais/king-of-bavleux', 'Redirect → /atlas/switzerland', 'OUTSIDE WORLD', 'PASSAGE', 'heartwood/map-room/table/switzerland', 'PARTIAL', 'h_atlas');
  r('/atlas/italy/dolomiti-ampezzo', 'Redirect → bioregion', 'OUTSIDE WORLD', 'PASSAGE', 'heartwood/map-room/table/bioregions', 'PARTIAL', 'h_atlas');
  r('/atlas/bio-regions', 'Bioregions index', 'OUTSIDE WORLD', 'OBJECT', 'heartwood/map-room/table/bioregions', 'PARTIAL', 'h_atlas');
  r('/atlas/bio-regions/:slug', 'One bioregion', 'OUTSIDE WORLD', 'OBJECT', 'heartwood/map-room/table/bioregions/:slug', 'PARTIAL', 'h_atlas');
  r('/atlas/bio-regions/:slug/calendar', 'Bioregion calendar', 'WHOLE TREE', 'VIEW', 'lens/time?region=:slug', 'PARTIAL', 'ring', true, 'Folds into the single Time lens.');
  r('/atlas/pathways/:pathwaySlug', 'Pilgrimage pathways', 'OUTSIDE WORLD', 'PASSAGE', 'outside-world/pathway/:pathwaySlug', 'MISSING', 'h_atlas');
  r('/atlas-expansion', 'Planetary dataset coverage', 'TAPROOT', 'VIEW', 'heartwood/deeper-rings/commons/globe', 'MISSING', 'h_seed');

  // ── Trunk: Heartwood (living memory, library)
  r('/library/:room', 'Any other Heartwood room key (unknown keys fall back to the landing)', 'TRUNK', 'SUBROOM', 'heartwood/:room', 'PARTIAL', 'hwroom', true, 'Generic App.tsx route; concrete rooms are listed individually.');
  r('/library', 'Heartwood landing: grid of chambers', 'TRUNK', 'ROOM', 'heartwood', 'BUILT', 'hwroom');
  r('/heartwood', 'Redirect → /library', 'TRUNK', 'PASSAGE', 'heartwood', 'BUILT', 'hwroom');
  r('/library/music-room', 'Music Room: songs offered to trees', 'TRUNK', 'SUBROOM', 'heartwood/music-room', 'BUILT', 'h_music');
  r('/radio', 'Tree Radio', 'TRUNK', 'OBJECT', 'heartwood/music-room/radio', 'BUILT', 'h_music', true, 'Duplicates the Music Room primary action.');
  r('/library/seed-cellar', 'Seed Cellar: living knowledge archive', 'TRUNK', 'SUBROOM', 'heartwood/seed-cellar', 'BUILT', 'h_seed');
  r('/library/atlas', 'Map Room (grid key → /atlas)', 'TRUNK', 'SUBROOM', 'heartwood/map-room', 'BUILT', 'h_atlas');
  r('/library/arborium', 'The Arborium: field guide', 'TRUNK', 'OBJECT', 'heartwood/arborium-shelves', 'PARTIAL', 'hwroom');
  r('/arborium', 'Redirect → /library/arborium', 'TRUNK', 'PASSAGE', 'heartwood/arborium-shelves', 'PARTIAL', 'hwroom');
  r('/species/:slug', 'Species page', 'TRUNK', 'OBJECT', 'heartwood/arborium-shelves/:slug', 'PARTIAL', 'hwroom', true, 'Shares species identity with the Staff Spiral, the Ledger Species Spiral and the Hives (cross-links, not a merge).');
  r('/library/greenhouse', 'Greenhouse: grow living care; track plants and saplings (primary: add plant/sapling; secondary: share, community garden)', 'TRUNK', 'ROOM', 'heartwood/greenhouse (position TO BE RESOLVED)', 'MISSING', 'hwroom', true, 'LIVE APP: exists. TETOL 3D: missing. Proposed spatial home: to be resolved (branching from the trunk/library system). Design note (trunk map): visually warmer/lighter than the Heartwood shell. Visual ancestry: Drive greenhouse-cover.png, greenhouse-window.png/.jpeg (glass roof, sunlit working room, tables, books, vessels, living growth).');
  r('/library/wishlist', 'Wishing Tree: trees you dream to visit', 'TRUNK', 'OBJECT', 'heartwood/wishing-ribbons', 'PARTIAL', 'hwroom', true, 'Candidate for the Crown.');
  r('/library/wishing-tree', 'Alias → /library/wishlist', 'TRUNK', 'PASSAGE', 'heartwood/wishing-ribbons', 'PARTIAL', 'hwroom');
  r('/library/bookshelf', 'Bookshelf', 'TRUNK', 'OBJECT', 'heartwood/reading-writing/bookshelf', 'PARTIAL', 'hwroom');
  r('/press', 'Living Printing Press', 'TRUNK', 'OBJECT', 'heartwood/reading-writing/press', 'PARTIAL', 'hwroom');
  r('/library/star-trail', 'Star Trail: your path through S33D', 'WHOLE TREE', 'OVERLAY', 'overlay/star-trail', 'MISSING', 'hwroom', true, 'Also duplicates Dashboard › journey and FirstWalkTrail.');
  for (const a of ['creators-path', 'resources', 'tree-resources']) r('/library/' + a, 'Alias → /library/star-trail', 'WHOLE TREE', 'PASSAGE', 'overlay/star-trail', 'MISSING', 'hwroom');
  r('/library/scrolls', 'Scrolls & Records', 'TRUNK', 'OBJECT', 'heartwood/deeper-rings/scrolls', 'PARTIAL', 'hwroom', true, 'Proposed in hwroom notes; not built.');
  for (const a of ['ledger', 'volumes', 'archive']) r('/library/' + a, 'Alias → /library/scrolls', 'TRUNK', 'PASSAGE', 'heartwood/deeper-rings/scrolls', 'PARTIAL', 'hwroom');
  r('/ledger', 'Tree Ledger: transparency table and Species Spiral', 'TRUNK', 'OBJECT', 'heartwood/ledger-lectern', 'MISSING', 'hwroom', true, 'TEOTAG: not merged with the Staff Spiral. Living-tree/information lens; cross-links planned.');
  r('/library/vault', 'Vault (Heartwood doorway)', 'TRUNK', 'SUBROOM', 'heartwood/deeper-rings/vault', 'PARTIAL', 'hwroom');
  r('/vault', 'Vault (standalone)', 'TRUNK', 'SUBROOM', 'heartwood/deeper-rings/vault', 'PARTIAL', 'hwroom', true, 'Same strongroom as /library/vault.');
  r('/assets', 'Your assets', 'TRUNK', 'OBJECT', 'heartwood/deeper-rings/vault/drawer', 'PARTIAL', 'hwroom');
  r('/library/rhythms', 'Rhythms: seasonal cycles, cycle markets', 'WHOLE TREE', 'VIEW', 'lens/time (seasonal ring)', 'PARTIAL', 'ring');
  for (const a of ['markets', 'cycle-market', 'cycle-markets']) r('/library/' + a, 'Alias → /library/rhythms', 'WHOLE TREE', 'PASSAGE', 'lens/time', 'PARTIAL', 'ring');
  r('/markets', 'Redirect → /library/rhythms', 'WHOLE TREE', 'PASSAGE', 'lens/time', 'PARTIAL', 'ring');
  r('/markets/:id', 'One cycle market', 'WHOLE TREE', 'OBJECT', 'lens/time/mark/:id', 'PARTIAL', 'ring');
  r('/library/tree-data-commons', 'Redirect → /tree-data-commons', 'TRUNK', 'PASSAGE', 'heartwood/deeper-rings/commons', 'PARTIAL', 'h_seed');
  r('/tree-data-commons', 'Tree Data Commons: datasets observatory', 'TRUNK', 'SUBROOM', 'heartwood/deeper-rings/commons', 'PARTIAL', 'h_seed');
  r('/tree-projects', 'Tree Projects directory', 'TRUNK', 'OBJECT', 'heartwood/deeper-rings/commons/noticeboard', 'PARTIAL', 'h_seed');
  r('/heartwood/life-groves', 'Life Groves: births, memorials, unions, family trees', 'TRUNK', 'SUBROOM', 'heartwood/life-groves', 'PARTIAL', 'hwroom');
  r('/heartwood/life-groves/new', 'Create a Life Grove', 'TRUNK', 'OBJECT', 'heartwood/life-groves/new', 'PARTIAL', 'hwroom');
  r('/heartwood/life-groves/:id', 'One Life Grove', 'TRUNK', 'OBJECT', 'heartwood/life-groves/:id', 'PARTIAL', 'hwroom');
  r('/living-archive', 'My Sovereign Data: personal export', 'TRUNK', 'OBJECT', 'heartwood/hearth/seed-chest', 'MISSING', 'hwroom');
  r('(passage) Heartwood → Deeper Rings', 'The way down through the Seed Cellar into the Deeper Rings (long memory, commons, protected knowledge)', 'TRUNK', 'PASSAGE', 'heartwood/seed-cellar → deeper-rings', 'MISSING', 'h_seed', false, 'TEOTAG 28 Sep: Heartwood Hall = lived memory; Deeper Rings = long memory; Tap Root = deepest keeper layer. Vertical root → Tap Root; lateral roots → Ancient Friends Cavern.');
  r('/library/tap-root', 'Dev Room: system health', 'TAPROOT', 'PASSAGE', 'heartwood/deeper-rings → taproot (closed central shaft)', 'MISSING', 'hwroom');

  // ── The Hearth: the Wanderer's personal chamber, associated with Heartwood, direct access from the Staff Room
  r('/dashboard', 'Hearth: personal hub (hearth, journey, notifications, pod, profile, teotag)', 'TRUNK', 'ROOM', 'heartwood/hearth', 'PARTIAL', 'hwroom', true, 'TEOTAG working placement: personal chamber with Heartwood, direct passage from the Staff Room.');
  r('/wanderer/:id', 'A Wanderer profile', 'WHOLE TREE', 'OVERLAY', 'overlay/wanderer/:id', 'MISSING', 'overview');

  // ── Canopy: Council of Life
  r('/council-of-life', 'Council hub: next council, fire vote, calendar', 'CANOPY', 'ROOM', 'canopy/treehouse', 'BUILT', 'croom');
  r('/council/records', 'Council records archive', 'CANOPY', 'PASSAGE', 'canopy/treehouse → heartwood/deeper-rings/scrolls', 'PARTIAL', 'croom', true, 'Recent memory on the deck; long memory in the rings.');
  r('/council/records/:id', 'One council session', 'TRUNK', 'OBJECT', 'heartwood/deeper-rings/scrolls/:id', 'PARTIAL', 'croom');
  r('/hives', 'Species Hives index', 'CANOPY', 'OBJECT', 'canopy/hives', 'MISSING', 'canopy', true, 'TEOTAG: keep their own ecological/community meaning; share species identity only.');
  r('/hive/:family', 'One Species Hive (trees, ecology, lore, offerings, markets, governance, treasury)', 'CANOPY', 'SUBROOM', 'canopy/hives/:family', 'MISSING', 'canopy');
  r('/hive/:family/treasury', 'Hive treasury', 'CANOPY', 'OBJECT', 'canopy/hives/:family/treasury', 'MISSING', 'canopy');
  r('/harvest', 'Guardian Harvest Exchange', 'CANOPY', 'OBJECT', 'canopy/deck/harvest-table', 'MISSING', 'croom');
  r('/harvest/:id', 'One harvest listing', 'CANOPY', 'OBJECT', 'canopy/deck/harvest-table/:id', 'MISSING', 'croom');
  r('/cosmic', 'Cosmic Calendar: lenses and phenology', 'WHOLE TREE', 'VIEW', 'lens/time (sky)', 'PARTIAL', 'ring', true, 'Time of the Council layer exists; one Time lens proposed.');
  r('/cosmic/settings', 'Calendar settings', 'WHOLE TREE', 'OVERLAY', 'lens/time/settings', 'MISSING', 'ring');
  r('/time-tree', 'The Time Tree (function to confirm)', 'WHOLE TREE', 'VIEW', 'lens/time', 'PARTIAL', 'ring');

  // ── Crown: yOur Golden Dream
  r('/golden-dream', 'Golden Dream: current, fruit, roadmap, archives, encounter economy', 'CROWN', 'ROOM', 'crown/observatory', 'PARTIAL', 'crown', true, 'Crown exterior and "Crown listening" exist; no interior.');
  r('/your-golden-dream', 'Redirect → /golden-dream', 'CROWN', 'PASSAGE', 'crown/observatory', 'PARTIAL', 'crown');
  r('/roadmap', 'Living Forest Roadmap', 'CROWN', 'OBJECT', 'crown/observatory/blueprint/roadmap', 'PARTIAL', 'crown', true, 'Duplicates Golden Dream › roadmap.');
  r('/canopy-projection', 'Global Canopy Projection Engine', 'CROWN', 'VIEW', 'crown/observatory/projection', 'PARTIAL', 'crown');
  r('/patron-offering', 'Patron offering', 'CROWN', 'OBJECT', 'crown/observatory/patronage', 'PARTIAL', 'crown');
  r('/patronsportal', 'Redirect (patrons portal)', 'CROWN', 'PASSAGE', 'crown/observatory/patronage', 'PARTIAL', 'crown');
  r('/patronsportal/*', 'Redirect (patrons portal)', 'CROWN', 'PASSAGE', 'crown/observatory/patronage', 'PARTIAL', 'crown');
  r('/lottery', 'Twin Moons: lunar lottery and staking yield', 'CROWN', 'OBJECT', 'crown/sky/twin-moons', 'PARTIAL', 'crown');

  // ── Whole-tree lenses
  r('/value-tree', 'Value Tree: how value and Hearts flow', 'WHOLE TREE', 'VIEW', 'lens/value (sap)', 'MISSING', 'overview');
  r('/how-hearts-work', 'How Hearts work', 'WHOLE TREE', 'OVERLAY', 'lens/value/hearts', 'MISSING', 'overview');

  // ── Taproot: keepers, curators, system (gated)
  r('/admin', 'Admin / curator hub (live app: "inside the Taproot architecture")', 'TAPROOT', 'ROOM', 'taproot/workshop', 'MISSING', 'moonroot');
  r('/admin/users', 'Users', 'TAPROOT', 'OBJECT', 'taproot/workshop/users', 'MISSING', 'moonroot');
  r('/admin/invite-status', 'Invite status', 'TAPROOT', 'OBJECT', 'taproot/workshop/invites', 'MISSING', 'moonroot');
  r('/admin/artizen', 'Artizen readiness', 'TAPROOT', 'OBJECT', 'taproot/workshop/artizen', 'MISSING', 'moonroot');
  r('/admin/moonroot-digest', 'Moonroot digest', 'TAPROOT', 'OBJECT', 'taproot/moonroot', 'PARTIAL', 'moonroot');
  r('/admin/moonroot', 'Moonroot digest (alias)', 'TAPROOT', 'OBJECT', 'taproot/moonroot', 'PARTIAL', 'moonroot');
  r('/evolution', 'Evolution dashboard', 'TAPROOT', 'OBJECT', 'taproot/workshop/evolution', 'MISSING', 'moonroot');
  r('/curator', 'Heartwood curator', 'TAPROOT', 'SUBROOM', 'taproot/curator-bench', 'MISSING', 'moonroot');
  r('/curator/rootstones-import', 'Rootstone importer', 'TAPROOT', 'OBJECT', 'taproot/curator-bench/rootstones', 'MISSING', 'moonroot');
  r('/curator/refinements', 'Refinement review', 'TAPROOT', 'OBJECT', 'taproot/curator-bench/refinements', 'MISSING', 'moonroot');
  r('/curator/species', 'Curator species', 'TAPROOT', 'OBJECT', 'taproot/curator-bench/species', 'MISSING', 'moonroot');
  r('/edit-review', 'Tree edit review queue', 'TAPROOT', 'OBJECT', 'taproot/curator-bench/edits', 'MISSING', 'moonroot');
  r('/bug-garden', 'Bug Garden', 'TAPROOT', 'OBJECT', 'taproot/antechamber/bug-garden', 'MISSING', 'moonroot', true, 'Live-app nav files this under Council.');
  r('/agent-garden', 'Agent Garden', 'TAPROOT', 'OBJECT', 'taproot/antechamber/agent-garden', 'MISSING', 'moonroot');
  r('/discovery-agent', 'Dataset discovery agent', 'TAPROOT', 'OBJECT', 'heartwood/deeper-rings/commons/agents', 'MISSING', 'h_seed');
  r('/dataset-watcher', 'Dataset watcher', 'TAPROOT', 'OBJECT', 'heartwood/deeper-rings/commons/agents', 'MISSING', 'h_seed');
  r('/seed-plan-generator', 'Seed-plan generator', 'TAPROOT', 'OBJECT', 'heartwood/deeper-rings/commons/seed-plans', 'MISSING', 'h_seed');
  for (const d of ['/sync', '/test-lab', '/api/docs', '/share-simulator']) r(d, 'Dev tool (dev flag only)', 'NONE', 'NONE', '', 'NONE', 'overview', true);

  // ── Heartwood room reconciliation (TEOTAG, 25 Sep 2026)
  // Source: "Heartwood Canonical Trunk Map" (Google Drive, 2 Jun 2026) + live registry src/config/heartwoodRooms.ts @85c0641.
  // Every meaningful room has a spatial home; not every room becomes scenery.
  // live: EXISTS in the S33D.life live app. tetol: does the ROOM/OBJECT ITSELF exist in the TETOL 3D prototype?
  //   BUILT = yes · PARTIAL = an existing thing already carries it (e.g. the Seasonal Ring) · MISSING = no.
  //   (Route-level `status` above is looser: PARTIAL there only means the surrounding realm exists.)
  const HW = [
    // room, route, trunk-map group, realm, form, address, tetol, prototype node, note
    ['Ancient Friends', '/library/gallery', 'Meet', 'ROOTS', 'ROOM (cavern system)', 'heartwood/root-descent/cavern', 'MISSING', 'h_friends', 'Reached downward from Heartwood. Only the passage node exists; the Cavern is not built.'],
    ['Staff Room', '/library/staff-room', 'Meet', 'THRESHOLD', 'ROOM', 'staff-room (roundhouse beside the Tree) ↔ heartwood', 'BUILT', 'staff', 'Interior built (experiment). Passage to Heartwood built. The live app files it inside Heartwood: kept as a tension.'],
    ['Arborium', '/library/arborium', 'Learn', 'TRUNK', 'OBJECT (field-guide shelves)', 'heartwood/arborium', 'MISSING', 'hwroom', 'Could grow into a SUBROOM; species volumes (/species/:slug) live here.'],
    ['Quest Cave', '/library/quest-cave', 'Walk', 'ROOTS', 'SUBROOM / PASSAGE', 'heartwood/root-descent/cavern/quest-cave', 'MISSING', 'roots', 'Tested as a Roots subspace off the Cavern, not a Heartwood chamber (TEOTAG 24 Sep).'],
    ['Music Room', '/library/music-room', 'Walk', 'TRUNK', 'SUBROOM', 'heartwood/music-room', 'BUILT', 'h_music', 'Upper chamber. /radio is its radio (object).'],
    ['Greenhouse', '/library/greenhouse', 'Walk', 'TRUNK', 'ROOM', 'heartwood/greenhouse (position TO BE RESOLVED)', 'MISSING', 'hwroom', 'Warmer and lighter than the Heartwood shell. Visual ancestry in Drive (greenhouse-cover / greenhouse-window).'],
    ['Wishing Tree / Dream Tree', '/library/wishlist', 'Offer', 'TRUNK', 'OBJECT', 'heartwood/wishing-tree', 'MISSING', 'hwroom', 'Name: "Wishing Tree" room, "Dreams" inside (trunk map). Candidate relation to the Crown kept open.'],
    ['Bookshelf', '/library/bookshelf', 'Remember', 'TRUNK', 'OBJECT', 'heartwood/reading-writing/bookshelf', 'MISSING', 'hwroom', 'Shares a corner with the Print Press (/press).'],
    ['Seed Cellar', '/library/seed-cellar', 'Remember', 'TRUNK', 'SUBROOM', 'heartwood/seed-cellar', 'BUILT', 'h_seed', 'Low chamber in the Deeper Rings.'],
    ['Star Trail', '/library/star-trail', 'Remember', 'WHOLE TREE', 'OVERLAY', 'overlay/star-trail', 'MISSING', 'hwroom', 'Trunk map: "the cross-room personal trunk". A path through every realm, not a room.'],
    ['Scrolls & Records', '/library/scrolls', 'Remember', 'TRUNK', 'OBJECT', 'heartwood/deeper-rings/scrolls', 'MISSING', 'hwroom', 'Remembered Circles and records settle into the rings; Council Records and /ledger point here.'],
    ['Vaults', '/library/vault', 'Steward', 'TRUNK', 'SUBROOM', 'heartwood/deeper-rings/vault', 'MISSING', 'hwroom', 'One strongroom, two routes (/library/vault, /vault). Lineage: the Drive cutaway labels a VAULT / HEARTH / LIBRARY at several levels; not resolved.'],
    ['Rhythms', '/library/rhythms', 'Steward', 'WHOLE TREE', 'VIEW (Seasonal Ring / time lens)', 'heartwood/seasonal-ring', 'PARTIAL', 'ring', 'The Seasonal Ring exists on the trunk; the Rhythms reading of it is not built.'],
    ['Dev Room / Tap Root', '/library/tap-root', 'Evolve', 'TAPROOT', 'PASSAGE (gated)', 'heartwood/deeper-rings → taproot', 'MISSING', 'hwroom', 'Advanced only. The taproot runs deepest; whether it is reached from Heartwood or beneath the Cavern is unresolved.'],
    // In the live /library grid but not in the trunk map:
    ['Map Room', '/atlas (grid key atlas)', 'grid only', 'TRUNK → OUTSIDE WORLD', 'SUBROOM + OUTSIDE-WORLD CONNECTION', 'heartwood/map-room', 'BUILT', 'h_atlas', 'Window/table onto the land.'],
    ['Life Groves', '/heartwood/life-groves', 'grid only', 'TRUNK', 'SUBROOM', 'heartwood/life-groves', 'MISSING', 'hwroom', 'Flagged missing from TETOL in the Artizen review (24 Sep).'],
    ['Print Press', '/press', 'grid only', 'TRUNK', 'OBJECT', 'heartwood/reading-writing/press', 'MISSING', 'hwroom', 'Beside the Bookshelf.'],
    ['Tree Data Commons', '/tree-data-commons', 'grid only', 'TRUNK', 'SUBROOM', 'heartwood/deeper-rings/commons', 'MISSING', 'h_seed', 'Deeper Rings observatory.'],
  ].map(([room, route, group, realm, form, address, tetol, node, note]) => ({ room, route, group, live: 'EXISTS', realm, form, address, tetol, node, note }));
  // (0.9.5: the after-pass TETOL column is applied below, keeping `tetolBefore`)

  // ── 0.9.5 SPATIAL COVERAGE PASS (25 Sep 2026) · the SAME registry, updated in place (no parallel registry).
  // Every row keeps `before` (its 0.9.4 status). `status` is now the 0.9.5 status:
  //   BUILT    the function has a reachable HOME at (or beside) its Revision 3 address: an interior, a doorway/shell,
  //            an object, a view, an overlay, or a web handoff placed there. `depth` says which.
  //   PARTIAL  its realm/parent home exists, and the function is named there, but it has no own object or handoff yet
  //   MISSING  no home yet
  //   NONE     deliberately no room (infrastructure, dev tools)
  // depth: interior · shell (doorway only) · object · view · overlay · handoff · listed
  const COVER = {
    // route: [status, node, depth, next]
    '(passage) Heartwood → Ancient Friends Cavern': ['BUILT', 'h_friends', 'interior', 'Human test (Roots module) decides pace and darkness.'],
    '/library/gallery': ['BUILT', 'h_friends', 'interior + handoff', 'One Cavern chamber; the full gallery stays a handoff until TEOTAG expands the Cavern.'],
    '/library/ancient-friends': ['BUILT', 'h_friends', 'interior + handoff', 'Alias.'], '/ancient-friends': ['BUILT', 'h_friends', 'interior + handoff', 'Redirect.'], '/gallery': ['BUILT', 'h_friends', 'interior + handoff', 'Redirect.'],
    '/tree/:id': ['BUILT', 'h_friends', 'interior (one Friend: Major Oak)', 'More Friends only through the adapter, after TEOTAG.'],
    '/visits': ['BUILT', 'h_friends', 'handoff (Friend record)', 'A visits path in the Cavern.'], '/whispers': ['BUILT', 'h_friends', 'handoff (Friend record)', 'A whisper wall in the Cavern.'],
    '/add-tree': ['BUILT', 'outside', 'handoff (Outside World + Friend record)', 'Keep as handoff: the form stays on the web.'],
    '/library/quest-cave': ['BUILT', 'h_friends', 'shell (doorway off the Cavern) + handoff', 'Establish what lies beyond; not a fantasy environment.'],
    '/heartwood/quest-room': ['BUILT', 'h_friends', 'shell + handoff', 'Redirect.'], '/heartwood/quest-cave': ['BUILT', 'h_friends', 'shell + handoff', 'Redirect.'],
    '/map': ['BUILT', 'outside', 'shell (waymarker, path) + handoff', 'Keep the land on the web; a lens later, if ever.'],
    '/tree/research/:id': ['PARTIAL', 'outside', 'listed', 'Evidence/record card for one research record (no room).'],
    '/garden/:slug': ['PARTIAL', 'outside', 'listed', 'A garden handoff once a garden index route exists.'],
    '/groves': ['BUILT', 'outside', 'handoff', ''], '/pathways': ['BUILT', 'outside', 'handoff', 'Mycelial threads from the roots, later.'], '/discovery': ['BUILT', 'outside', 'handoff', 'Confirm its function.'],
    '/atlas': ['BUILT', 'h_atlas', 'shell (window) + handoff', ''], '/atlas-expansion': ['PARTIAL', 'h_commons', 'listed', 'A globe object in the Commons.'],
    '/atlas/pathways/:pathwaySlug': ['PARTIAL', 'outside', 'listed', ''],
    '/library/arborium': ['BUILT', 'h_arborium', 'object (shelves) + handoff', 'Species volumes as spines on the shelves.'], '/arborium': ['BUILT', 'h_arborium', 'object + handoff', 'Redirect.'],
    '/species/:slug': ['PARTIAL', 'h_arborium', 'listed', 'One volume per species, from the Arborium.'],
    '/library/greenhouse': ['BUILT', 'h_greenhouse', 'shell (doorway only) + handoff', 'Interior from real Greenhouse imagery only; position to resolve.'],
    '/library/wishlist': ['BUILT', 'h_wishing', 'object + handoff', ''], '/library/wishing-tree': ['BUILT', 'h_wishing', 'object + handoff', 'Alias.'],
    '/library/bookshelf': ['BUILT', 'h_bookshelf', 'object + handoff', ''], '/press': ['BUILT', 'h_press', 'object + handoff', ''],
    '/library/star-trail': ['BUILT', 'h_startrail', 'overlay (example trail) + handoff', 'Draw the Wanderer’s own trail only with consent, via the adapter.'],
    '/library/creators-path': ['BUILT', 'h_startrail', 'overlay + handoff', 'Alias.'], '/library/resources': ['BUILT', 'h_startrail', 'overlay + handoff', 'Alias.'], '/library/tree-resources': ['BUILT', 'h_startrail', 'overlay + handoff', 'Alias.'],
    '/library/scrolls': ['BUILT', 'h_scrolls', 'shell (archive doorway, Deeper Rings) + handoff', 'Archive interior later.'], '/library/ledger': ['BUILT', 'h_scrolls', 'shell + handoff', 'Alias.'], '/library/volumes': ['BUILT', 'h_scrolls', 'shell + handoff', 'Alias.'], '/library/archive': ['BUILT', 'h_scrolls', 'shell + handoff', 'Alias.'],
    '/ledger': ['BUILT', 'h_scrolls', 'handoff (Scrolls & Records, Deeper Rings)', 'Revision 3 names a ledger lectern; it is a handoff from the archive for now.'],
    '/library/vault': ['BUILT', 'h_vault', 'shell (closed door, Deeper Rings) + handoff', 'No balances in 3D.'], '/vault': ['BUILT', 'h_vault', 'shell + handoff', ''],
    '/assets': ['PARTIAL', 'h_vault', 'listed', ''],
    '/library/rhythms': ['BUILT', 'h_rhythms', 'view (Seasonal Ring) + handoff', 'One Time lens across the whole Tree (Rhythms, Cosmic, bioregion calendars).'],
    '/library/markets': ['BUILT', 'h_rhythms', 'view + handoff', 'Alias.'], '/library/cycle-market': ['BUILT', 'h_rhythms', 'view + handoff', 'Alias.'], '/library/cycle-markets': ['BUILT', 'h_rhythms', 'view + handoff', 'Alias.'], '/markets': ['BUILT', 'h_rhythms', 'view + handoff', 'Redirect.'],
    '/markets/:id': ['PARTIAL', 'h_rhythms', 'listed', ''],
    '/library/tree-data-commons': ['BUILT', 'h_commons', 'shell + handoff', 'Redirect.'], '/tree-data-commons': ['BUILT', 'h_commons', 'shell (Deeper Rings) + handoff', ''], '/tree-projects': ['BUILT', 'h_commons', 'handoff', ''],
    '/heartwood/life-groves': ['BUILT', 'h_lifegroves', 'shell (doorway only) + handoff', 'No personal grove content until consent and privacy are designed.'],
    '/heartwood/life-groves/new': ['PARTIAL', 'h_lifegroves', 'listed', ''], '/heartwood/life-groves/:id': ['PARTIAL', 'h_lifegroves', 'listed (private, not shown)', ''],
    '/life-grove-invite/:inviteToken': ['PARTIAL', 'h_lifegroves', 'listed', 'Arrives via the Staff Room.'],
    '/living-archive': ['PARTIAL', 'h_hearth', 'listed', ''],
    '/library/tap-root': ['BUILT', 'h_taproot', 'shell (closed central shaft, gated) + handoff', 'Resolved 28 Sep: vertical root beneath the Deeper Rings; the Cavern is lateral.'], '(passage) Heartwood → Deeper Rings': ['BUILT', 'h_seed', 'interior (one ring chamber; no rooms)', 'Real-screen walkthrough.'],
    '/dashboard': ['BUILT', 'h_hearth', 'shell (doorway only) + handoff', 'Hearth interior only with personal-data consent.'],
    '/council/records': ['BUILT', 'c_records', 'object + handoff', ''], '/harvest': ['BUILT', 'c_records', 'handoff', 'A harvest table on the deck.'],
    '/hives': ['BUILT', 'c_hives', 'object + handoff', ''], '/harvest/:id': ['PARTIAL', 'c_records', 'listed', 'A harvest table on the deck.'], '/hive/:family': ['PARTIAL', 'c_hives', 'listed', ''], '/hive/:family/treasury': ['PARTIAL', 'c_hives', 'listed', ''],
    '/cosmic': ['BUILT', 'c_moon', 'handoff (moon dial)', 'Fold into the one Time lens.'],
    '/golden-dream': ['BUILT', 'crown', 'realm + handoff', 'Crown not rebuilt (TEOTAG).'], '/your-golden-dream': ['BUILT', 'crown', 'realm + handoff', 'Redirect.'],
    '/roadmap': ['BUILT', 'crown', 'handoff', ''], '/canopy-projection': ['BUILT', 'crown', 'handoff', ''],
    '/telegram-handoff': ['PARTIAL', 'outside', 'listed', ''], '/incoming-share': ['PARTIAL', 'outside', 'listed', ''],
    '/admin': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', 'Taproot workshop, gated.'], '/admin/users': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''], '/admin/invite-status': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''],
    '/admin/artizen': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''], '/evolution': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''], '/curator': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''],
    '/curator/rootstones-import': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''], '/curator/refinements': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''], '/curator/species': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''],
    '/edit-review': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''], '/bug-garden': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''], '/agent-garden': ['PARTIAL', 'h_taproot', 'listed (behind the gate)', ''],
    '/discovery-agent': ['PARTIAL', 'h_commons', 'listed', ''], '/dataset-watcher': ['PARTIAL', 'h_commons', 'listed', ''], '/seed-plan-generator': ['PARTIAL', 'h_commons', 'listed', ''],
  };
  for (const x of R) { x.before = x.status; const c = COVER[x.route]; if (c) { [x.status, x.node, x.depth, x.next] = c; } else { x.depth = x.status === 'BUILT' ? 'existing' : x.status === 'NONE' ? '' : x.status === 'PARTIAL' ? 'listed / realm only' : ''; } }
  // Heartwood table: the TETOL column after the pass
  const HW_AFTER = { 'Ancient Friends': ['BUILT', 'h_friends'], 'Arborium': ['BUILT', 'h_arborium'], 'Quest Cave': ['BUILT', 'h_friends'], 'Greenhouse': ['BUILT', 'h_greenhouse'], 'Wishing Tree / Dream Tree': ['BUILT', 'h_wishing'],
    'Bookshelf': ['BUILT', 'h_bookshelf'], 'Star Trail': ['BUILT', 'h_startrail'], 'Scrolls & Records': ['BUILT', 'h_scrolls'], 'Vaults': ['BUILT', 'h_vault'], 'Rhythms': ['BUILT', 'h_rhythms'], 'Dev Room / Tap Root': ['BUILT', 'h_taproot'],
    'Life Groves': ['BUILT', 'h_lifegroves'], 'Print Press': ['BUILT', 'h_press'], 'Tree Data Commons': ['BUILT', 'h_commons'] };
  // where each place is entered from, and how you get back (derived from the node the route lives at)
  const ENTRY = (node) => { const N = (window.TETOL && window.TETOL.nodes) || {}, x = N[node] || {}, nm = x.name || node;
    if (node === 'overview') return ['The opening view of the whole Tree', '—'];
    if (node === 'h_friends') return ['Tree → Trunk → Enter Heartwood → the Ancient Friends arch → Go down through the roots', '↑ Return to Heartwood (the exact arch view) · Esc'];
    if (node === 'outside') return ['Tree → The Outside World (waymarker) · or Heartwood → Map Room → Look out onto the land · or the Roots card', 'Choose any realm · Reset view'];
    if (x.room === 'deep') return [`Tree → Trunk → Enter Heartwood → Seed Cellar → Go down to the Deeper Rings${node !== 'h_deep' ? ' → turn to ' + nm : ''}`, '↑ Return to Heartwood (the Seed Cellar view) · Esc'];
    if (node === 'h_seed') return ['Tree → Trunk → Enter Heartwood → Seed Cellar (and down through it to the Deeper Rings)', 'Back to the hearth → Step back out of the trunk · or ↑ Return to Heartwood from below'];
    if (x.room === 'hw' || node === 'hwroom') return [`Tree → Trunk → Enter Heartwood → ${nm}${x.part ? ' (' + x.part + ')' : ''}`, 'Back to the hearth → Step back out of the trunk'];
    if (x.room === true) return [`Tree → Canopy → Council of Life → the deck → ${nm}`, 'Back to the Council fire → Step back out to the canopy'];
    if (node === 'staff') return ['Tree → Staff Room → Step inside (or from Heartwood along the passage)', 'Leave → beside the Tree, or the passage into Heartwood'];
    return [`Tree → ${nm}`, 'Choose any realm · Reset view']; };
  function ledger() { return R.map((x) => { const [entry, ret] = x.status === 'NONE' ? ['—', '—'] : ENTRY(x.node); return { route: x.route, fn: x.fn, realm: x.realm, form: x.form, address: x.address, before: x.before, status: x.status, depth: x.depth || '', node: x.node, entry, ret, next: x.next || (x.status === 'MISSING' ? 'Needs a home.' : ''), note: x.note }; }); }
  function coverageBefore() { const c = { total: 0, BUILT: 0, PARTIAL: 0, MISSING: 0, NONE: 0 }; for (const x of R) { c.total++; c[x.before]++; } return c; }

  // ── Resolution
  const compile = (p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\/\*$/, '(?:/.*)?').replace(/:([a-zA-Z]+)/g, '(?<$1>[^/]+)') + '/?$');
  const table = R.filter((x) => x.route !== '*').map((x) => ({ ...x, re: compile(x.route), specificity: x.route.split('/').filter((s) => s && !s.startsWith(':') && s !== '*').length }));
  table.sort((a, b) => b.specificity - a.specificity);
  function resolve(path) {
    const p = String(path || '/').split(/[?#]/)[0] || '/';
    for (const x of table) { const m = x.re.exec(p); if (m) { const params = { ...(m.groups || {}) }; return { ...x, re: undefined, params, address: x.address.replace(/:([a-zA-Z]+)/g, (_, k) => params[k] ?? ':' + k) }; } }
    return { ...R.find((x) => x.route === '*'), params: {} };
  }
  function coverage() {
    const c = { total: 0, BUILT: 0, PARTIAL: 0, MISSING: 0, NONE: 0 }, byRealm = {};
    for (const x of R) { c.total++; c[x.status]++; const k = x.realm; (byRealm[k] ||= { total: 0, BUILT: 0, PARTIAL: 0, MISSING: 0, NONE: 0 }); byRealm[k].total++; byRealm[k][x.status]++; }
    return { ...c, byRealm };
  }
  for (const h of HW) { h.tetolBefore = h.tetol; const a = HW_AFTER[h.room]; if (a) [h.tetol, h.node] = a; }
  return { all: () => R.slice(), heartwood: () => HW.map((x) => ({ ...x })), resolve, coverage, coverageBefore, ledger, version: '0.9.6-deeper-rings', source: 'S33D-life/ancient-roots-map@85c0641 · src/App.tsx' };
})();

;
// TETOL · navigation-intent layer. EXPERIMENT · NOT CANONICAL · NOT DEPLOYED.
// A small adapter AROUND the prototype's existing navigation. It rewrites none of it:
//   goTo / approach  → the prototype's own [data-go] handler (keeps its history, camera flight, panel)
//   back             → the existing Back button, or the current interior's own back()
//   enter            → interiors (tetol-interiors.js) or doorway nodes (e.g. Heartwood hollow)
//   orbit / look     → the existing orbit controls on <three-d-stage>
//   select           → an object intent passed to the current interior
//   returnToTree     → closes any interior, then the whole Tree
//   openRoute        → a live-app route resolved through the address registry (tetol-routes.js)
// Adapters that call it: mouse and touch (doorway clicks, via tetol-interiors.js), the keyboard (below),
// the Wand (tetol-wand-display.js). Future ones (accessibility switch, game controller) call the same.
(() => {
  const D = window.TETOL, n = D.nodes, has = (id) => !!n[id];
  const I = () => window.TETOL_INTERIORS, ROUTES = () => window.TETOL_ROUTES;

  // Where the Tree is: the prototype mirrors its current node into the hash (history.replaceState).
  const nodeNow = () => { const h = decodeURIComponent(location.hash.slice(1)); return has(h) ? h : 'overview'; };
  const _rs = history.replaceState.bind(history);
  history.replaceState = function (s, t, url) { const before = location.hash; _rs(s, t, url); if (location.hash !== before) emit(); };
  addEventListener('hashchange', () => { if (!routeFromHash()) emit(); });
  let emitT = 0;
  function emit() { clearTimeout(emitT); emitT = setTimeout(() => dispatchEvent(new CustomEvent('tetol:place', { detail: {} })), 30); }

  const PLACES = [
    { key: 'roots', label: 'Roots', sub: 'Ancient Friends', to: 'roots' },
    { key: 'staff', label: 'Staff Room', sub: 'The roundhouse', to: 'staff', enter: 'staffroom' },
    { key: 'heartwood', label: 'Heartwood', sub: 'Inside the trunk', to: 'trunk', enter: 'hwroom' },
    { key: 'treehouse', label: 'Treehouse', sub: 'Council of Life', to: has('croom') ? 'croom' : 'canopy' },
    { key: 'crown', label: 'Crown', sub: 'yOur Golden Dream', to: 'crown' },
  ].filter((p) => has(p.to));

  function goTo(id) {
    if (!has(id)) return false;
    if (I()?.current()) { I().close(() => goTo(id)); return true; }
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.go = id; b.hidden = true;
    document.body.appendChild(b); b.click(); b.remove();
    return true;
  }
  function enter(target) {
    const list = I()?.list() || [], it = list.find((x) => x.id === target && x.built);
    if (it) {
      if (I().current()?.id === it.id) return true;
      const here = nodeNow();
      if (!I().current() && here !== it.node && !['h_staff', 'h_hearth'].includes(here)) { goTo(it.node); setTimeout(() => I().open(it.id), 500); return true; }
      return I().open(it.id);
    }
    if (target === 'heartwood' || target === 'hwroom') {
      const c = I()?.current();
      if (c && (list.find((x) => x.id === c.id)?.passages || []).includes('hwroom')) return I().send('heartwood'); // through the passage, as a wanderer would
      return goTo('hwroom');
    }
    const place = PLACES.find((p) => p.key === target || p.to === target);
    if (place?.enter) return enter(place.enter);
    return goTo(target);
  }
  function back() {
    if (I()?.current()) return I().send('back');
    const b = document.getElementById('back');
    if (b && !b.disabled) { b.click(); return true; }
    return false;
  }
  function returnToTree() { if (I()?.current()) { I().close(() => goTo('overview')); return true; } return goTo('overview'); }
  const stage = () => document.querySelector('three-d-stage[name="tetol-prototype"]') || document.querySelector('three-d-stage');
  function orbit(dir) {
    if (I()?.current()) return false;
    const s = stage(), cam = s?._camera, c = s?._controls; if (!cam || !c) return false;
    const off = cam.position.clone().sub(c.target), r = off.length();
    let th = Math.atan2(off.x, off.z), ph = Math.acos(Math.min(1, Math.max(-1, off.y / r)));
    if (dir === 'left') th -= 0.42; if (dir === 'right') th += 0.42;
    if (dir === 'up') ph = Math.max(0.15, ph - 0.18); if (dir === 'down') ph = Math.min(c.maxPolarAngle || Math.PI / 2, ph + 0.18);
    off.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th));
    cam.position.copy(c.target).add(off); c.update(); return true;
  }
  function look(dir) {
    if (['left', 'right', 'up', 'down'].includes(dir)) return orbit(dir);
    if (I()?.current()) return false;
    const s = stage(), cam = s?._camera, c = s?._controls; if (!cam || !c) return false;
    const off = cam.position.clone().sub(c.target);
    const r = Math.min(c.maxDistance || 20, Math.max(c.minDistance || 0.5, off.length() * (dir === 'in' ? 0.8 : 1.25)));
    cam.position.copy(c.target).add(off.setLength(r)); c.update(); return true;
  }
  function select(arg) {
    if (I()?.current() && arg && typeof arg === 'object') return I().send(arg.name, arg.arg);
    if (typeof arg === 'string') return goTo(arg);
    return false;
  }
  // A live-app route → its spatial home (nearest existing node; the built interior when there is one).
  function openRoute(path) {
    const r = ROUTES()?.resolve(path); if (!r) return false;
    lastRoute = r;
    if (r.status === 'BUILT' && r.address.startsWith('staff-room')) return enter('staffroom');
    return goTo(r.node);
  }
  let lastRoute = null;
  function routeFromHash() {
    const m = /^#route=(.+)$/.exec(location.hash); if (!m) return false;
    const path = decodeURIComponent(m[1]);
    setTimeout(() => openRoute(path), 0); return true;
  }

  const INTENTS = { goTo, approach: goTo, enter, back, returnToTree, orbit, look, select, openRoute };
  function run(name, arg, source = 'api') {
    const f = INTENTS[name]; if (!f) return false;
    const ok = !!f(arg);
    dispatchEvent(new CustomEvent('tetol:intent', { detail: { name, arg, source, ok } }));
    emit(); return ok;
  }

  // Where we are, and what makes sense from here. Controllers render this; they hold no map of their own.
  const ROOM_VIEWS = {
    staffroom(s) {
      const bits = ['Staff Room'];
      if (s.mode === 'library') bits.push('Spiral');
      if (s.mode === 'threshold') bits.push('Toward Heartwood');
      if (s.family) bits.push(s.family.label);
      if (s.staff) bits.push(s.staff.label.replace(/^.* · /, ''));
      const o = [], add = (group, label, name, arg, sub) => o.push({ group, label, sub, intent: { name, arg } });
      const fam = (skip) => (s.families || []).filter((f) => f.id !== skip).forEach((f) => add('Families', f.label, 'select', { name: 'family', arg: f.id }));
      if (s.mode === 'room' || s.mode === 'arrive') { add('Here', 'See the Spiral', 'select', { name: 'library' }, 'The Library from above'); fam(); add('Passages', 'Toward Heartwood', 'select', { name: 'threshold' }, 'The root passage'); }
      else if (s.mode === 'library') { fam(); add('Here', 'Return to the room', 'select', { name: 'room' }); }
      else if (s.mode === 'family') { add('Here', '13th staff', 'select', { name: 'origin' }, s.family ? 'The origin of ' + s.family.label : ''); (s.rings || []).forEach((r) => add('Circles', r.label, 'select', { name: 'ring', arg: r.id })); fam(s.family?.id); }
      else if (s.mode === 'staff') { add('Here', '← Previous staff', 'select', { name: 'prev' }); add('Here', 'Next staff →', 'select', { name: 'next' }); }
      else if (s.mode === 'threshold') add('Passages', 'Into Heartwood', 'enter', 'heartwood', 'Follow the root passage');
      return { trail: bits, options: o };
    },
  };
  function where() {
    const c = I()?.current();
    if (c) { const v = (ROOM_VIEWS[c.id] || (() => ({ trail: [c.label], options: [] })))(c.state || { mode: 'arrive' }); return { kind: 'interior', id: c.id, label: v.trail[v.trail.length - 1], trail: v.trail, mode: c.state?.mode || 'arrive' }; }
    const id = nodeNow(), x = n[id], trail = []; let p = id; while (p) { trail.unshift(n[p].name); p = n[p].parent; }
    return { kind: 'tree', id, label: x.name, sub: x.part || x.sub || '', trail };
  }
  function options() {
    const c = I()?.current();
    if (c) return ((ROOM_VIEWS[c.id] || (() => ({ options: [] })))(c.state || { mode: 'arrive' })).options;
    const o = [], add = (group, label, name, arg, sub) => o.push({ group, label, sub, intent: { name, arg } });
    const id = nodeNow(), x = n[id];
    (x.actions || []).filter((a) => a.go).forEach((a) => {
      if (a.go.startsWith('@interior:')) add('Enter', a.label, 'enter', a.go.slice(10), a.sub);
      else if (has(a.go)) add('Enter', a.label, 'goTo', a.go, a.sub);
    });
    const seen = new Set(o.map((q) => q.intent.arg));
    (x.relations || []).filter((r) => r.to && has(r.to) && !seen.has(r.to)).slice(0, 7).forEach((r) => { seen.add(r.to); add('Paths', n[r.to].name, 'goTo', r.to, r.text); });
    return o;
  }

  // ── Keyboard adapter (opt-in keys that the prototype does not already use; ignored while typing).
  //    Escape stays with the prototype / interior as before.
  addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
    if (I()?.current()) return; // inside an interior, its own keys apply
    const k = e.key;
    const map = { Home: ['returnToTree'], '[': ['orbit', 'left'], ']': ['orbit', 'right'], '+': ['look', 'in'], '=': ['look', 'in'], '-': ['look', 'out'], Backspace: ['back'] };
    if (e.shiftKey && k.startsWith('Arrow')) { e.preventDefault(); return run('orbit', k.slice(5).toLowerCase(), 'keyboard'); }
    const m = map[k]; if (!m) return;
    e.preventDefault(); run(m[0], m[1], 'keyboard');
  });

  // ── Coverage readout (audit Step 0) in the Experiments panel.
  function coveragePanel() {
    const xp = document.getElementById('xpanel'), C = ROUTES()?.coverage(); if (!xp || !C || document.getElementById('xcoverage')) return;
    const pc = (k) => Math.round((C[k] / C.total) * 100);
    const box = document.createElement('div'); box.id = 'xcoverage';
    box.innerHTML = `<h3 style="margin-top:16px">Spatial coverage · route registry</h3>
      <p style="margin:4px 0 8px">${C.total} live-app route patterns (${ROUTES().source}). Proposal, not canonical.</p>
      <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;margin-bottom:6px" aria-hidden="true">
        <i style="width:${pc('BUILT')}%;background:#8fd18a"></i><i style="width:${pc('PARTIAL')}%;background:#d4b07a"></i><i style="width:${pc('MISSING')}%;background:#6b5d49"></i><i style="width:${pc('NONE')}%;background:#3a332a"></i></div>
      <p style="margin:0;font-size:13px">Built ${C.BUILT} · Partial ${C.PARTIAL} · Missing ${C.MISSING} · Not spatialised ${C.NONE}</p>
      <details style="margin-top:6px"><summary>By realm</summary><ul style="margin:6px 0 0;padding-left:18px;font-size:12.5px">${Object.entries(C.byRealm).map(([r, v]) => `<li>${r}: ${v.BUILT} built · ${v.PARTIAL} partial · ${v.MISSING} missing${v.NONE ? ` · ${v.NONE} none` : ''}</li>`).join('')}</ul></details>`;
    xp.appendChild(box);
  }
  // A #route= link present at load must wait for the Tree to be ready (its first panel render).
  const bootHash = location.hash;
  const boot = () => {
    coveragePanel();
    if (!/^#route=/.test(bootHash)) return;
    const t0 = Date.now(), ready = () => document.getElementById('pname') && document.querySelector('three-d-stage')?._controls;
    const wait = () => { if (ready()) { history.replaceState(null, '', location.pathname + location.search + bootHash); routeFromHash(); } else if (Date.now() - t0 < 30000) setTimeout(wait, 150); };
    wait();
  };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', boot) : setTimeout(boot, 0);

  window.TETOL_NAV = {
    do: (name, arg) => run(name, arg, 'api'), run, where, options,
    places: () => PLACES.map(({ key, label, sub, to }) => ({ key, label, sub, to })),
    intents: Object.keys(INTENTS), lastRoute: () => lastRoute,
  };
})();

;
// TETOL Wand · session link. EXPERIMENT · NOT CANONICAL.
// One tiny, swappable transport shared by the big screen and the phone.
//   relay=local     (default) BroadcastChannel: same browser, same origin. Good for a laptop test with two
//                   windows. It CANNOT reach a real iPhone.
//   relay=supabase  Supabase Realtime *broadcast*. It uses no tables and no auth. It needs &sb=<project url>&sbkey=<anon key>
//                   to be supplied at runtime; nothing is hard-coded. UNTESTED here: it waits for a TEOTAG decision
//                   on which project to use (see the report).
// Only these messages ever travel: pairing hello/welcome/busy, pings, intents (e.g. {name:'back'}), and the
// place/options the screen shows. No user data, no tokens, no identity.
window.TETOL_WAND_LINK = (() => {
  const ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
  const newCode = () => { const a = new Uint32Array(6); crypto.getRandomValues(a); return [...a].map((x) => ALPH[x % ALPH.length]).join(''); };
  const newId = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map((x) => x.toString(36)).join(''); };
  const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const params = () => new URLSearchParams(location.search);
  function relayConfig() {
    const p = params();
    return { relay: p.get('relay') || 'local', sb: p.get('sb') || '', sbkey: p.get('sbkey') || '' };
  }
  // Carry the relay settings (never secrets beyond a public anon key) to the phone link.
  function relayQuery() {
    const c = relayConfig(), q = new URLSearchParams();
    if (c.relay !== 'local') { q.set('relay', c.relay); if (c.sb) q.set('sb', c.sb); if (c.sbkey) q.set('sbkey', c.sbkey); }
    return q.toString();
  }
  async function open(code, onMessage) {
    const cfg = relayConfig(), name = 'tetol-wand-' + cleanCode(code);
    if (cfg.relay === 'supabase') {
      if (!cfg.sb || !cfg.sbkey) throw new Error('supabase relay needs sb and sbkey');
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const client = createClient(cfg.sb, cfg.sbkey, { auth: { persistSession: false, autoRefreshToken: false } });
      const ch = client.channel(name, { config: { broadcast: { self: false, ack: false } } });
      ch.on('broadcast', { event: 'm' }, (p) => onMessage(p.payload));
      await new Promise((res, rej) => ch.subscribe((s) => (s === 'SUBSCRIBED' ? res() : s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' ? rej(new Error(s)) : 0)));
      return { relay: 'supabase', send: (m) => ch.send({ type: 'broadcast', event: 'm', payload: m }), close: () => client.removeChannel(ch) };
    }
    if (!('BroadcastChannel' in window)) throw new Error('BroadcastChannel unavailable');
    const bc = new BroadcastChannel(name);
    bc.onmessage = (e) => onMessage(e.data);
    return { relay: 'local', send: (m) => bc.postMessage(m), close: () => bc.close() };
  }
  return { open, newCode, newId, cleanCode, relayConfig, relayQuery };
})();

;
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

var qrcode = function() {

  //---------------------------------------------------------------------
  // qrcode
  //---------------------------------------------------------------------

  /**
   * qrcode
   * @param typeNumber 1 to 40
   * @param errorCorrectionLevel 'L','M','Q','H'
   */
  var qrcode = function(typeNumber, errorCorrectionLevel) {

    var PAD0 = 0xEC;
    var PAD1 = 0x11;

    var _typeNumber = typeNumber;
    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
    var _modules = null;
    var _moduleCount = 0;
    var _dataCache = null;
    var _dataList = [];

    var _this = {};

    var makeImpl = function(test, maskPattern) {

      _moduleCount = _typeNumber * 4 + 17;
      _modules = function(moduleCount) {
        var modules = new Array(moduleCount);
        for (var row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount);
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null;
          }
        }
        return modules;
      }(_moduleCount);

      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);

      if (_typeNumber >= 7) {
        setupTypeNumber(test);
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
      }

      mapData(_dataCache, maskPattern);
    };

    var setupPositionProbePattern = function(row, col) {

      for (var r = -1; r <= 7; r += 1) {

        if (row + r <= -1 || _moduleCount <= row + r) continue;

        for (var c = -1; c <= 7; c += 1) {

          if (col + c <= -1 || _moduleCount <= col + c) continue;

          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
              || (0 <= c && c <= 6 && (r == 0 || r == 6) )
              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
            _modules[row + r][col + c] = true;
          } else {
            _modules[row + r][col + c] = false;
          }
        }
      }
    };

    var getBestMaskPattern = function() {

      var minLostPoint = 0;
      var pattern = 0;

      for (var i = 0; i < 8; i += 1) {

        makeImpl(true, i);

        var lostPoint = QRUtil.getLostPoint(_this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }

      return pattern;
    };

    var setupTimingPattern = function() {

      for (var r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][6] != null) {
          continue;
        }
        _modules[r][6] = (r % 2 == 0);
      }

      for (var c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[6][c] != null) {
          continue;
        }
        _modules[6][c] = (c % 2 == 0);
      }
    };

    var setupPositionAdjustPattern = function() {

      var pos = QRUtil.getPatternPosition(_typeNumber);

      for (var i = 0; i < pos.length; i += 1) {

        for (var j = 0; j < pos.length; j += 1) {

          var row = pos[i];
          var col = pos[j];

          if (_modules[row][col] != null) {
            continue;
          }

          for (var r = -2; r <= 2; r += 1) {

            for (var c = -2; c <= 2; c += 1) {

              if (r == -2 || r == 2 || c == -2 || c == 2
                  || (r == 0 && c == 0) ) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    };

    var setupTypeNumber = function(test) {

      var bits = QRUtil.getBCHTypeNumber(_typeNumber);

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
      }

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    };

    var setupTypeInfo = function(test, maskPattern) {

      var data = (_errorCorrectionLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 6) {
          _modules[i][8] = mod;
        } else if (i < 8) {
          _modules[i + 1][8] = mod;
        } else {
          _modules[_moduleCount - 15 + i][8] = mod;
        }
      }

      // horizontal
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod;
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod;
        } else {
          _modules[8][15 - i - 1] = mod;
        }
      }

      // fixed module
      _modules[_moduleCount - 8][8] = (!test);
    };

    var mapData = function(data, maskPattern) {

      var inc = -1;
      var row = _moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      var maskFunc = QRUtil.getMaskFunction(maskPattern);

      for (var col = _moduleCount - 1; col > 0; col -= 2) {

        if (col == 6) col -= 1;

        while (true) {

          for (var c = 0; c < 2; c += 1) {

            if (_modules[row][col - c] == null) {

              var dark = false;

              if (byteIndex < data.length) {
                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
              }

              var mask = maskFunc(row, col - c);

              if (mask) {
                dark = !dark;
              }

              _modules[row][col - c] = dark;
              bitIndex -= 1;

              if (bitIndex == -1) {
                byteIndex += 1;
                bitIndex = 7;
              }
            }
          }

          row += inc;

          if (row < 0 || _moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    };

    var createBytes = function(buffer, rsBlocks) {

      var offset = 0;

      var maxDcCount = 0;
      var maxEcCount = 0;

      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);

      for (var r = 0; r < rsBlocks.length; r += 1) {

        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = new Array(dcCount);

        for (var i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
        }
        offset += dcCount;

        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i += 1) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var data = new Array(totalCodeCount);
      var index = 0;

      for (var i = 0; i < maxDcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i];
            index += 1;
          }
        }
      }

      for (var i = 0; i < maxEcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i];
            index += 1;
          }
        }
      }

      return data;
    };

    var createData = function(typeNumber, errorCorrectionLevel, dataList) {

      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

      var buffer = qrBitBuffer();

      for (var i = 0; i < dataList.length; i += 1) {
        var data = dataList[i];
        buffer.put(data.getMode(), 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
        data.write(buffer);
      }

      // calc num max data.
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw 'code length overflow. ('
          + buffer.getLengthInBits()
          + '>'
          + totalDataCount * 8
          + ')';
      }

      // end code
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      // padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }

      // padding
      while (true) {

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD1, 8);
      }

      return createBytes(buffer, rsBlocks);
    };

    _this.addData = function(data, mode) {

      mode = mode || 'Byte';

      var newData = null;

      switch(mode) {
      case 'Numeric' :
        newData = qrNumber(data);
        break;
      case 'Alphanumeric' :
        newData = qrAlphaNum(data);
        break;
      case 'Byte' :
        newData = qr8BitByte(data);
        break;
      case 'Kanji' :
        newData = qrKanji(data);
        break;
      default :
        throw 'mode:' + mode;
      }

      _dataList.push(newData);
      _dataCache = null;
    };

    _this.isDark = function(row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw row + ',' + col;
      }
      return _modules[row][col];
    };

    _this.getModuleCount = function() {
      return _moduleCount;
    };

    _this.make = function() {
      if (_typeNumber < 1) {
        var typeNumber = 1;

        for (; typeNumber < 40; typeNumber++) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
          var buffer = qrBitBuffer();

          for (var i = 0; i < _dataList.length; i++) {
            var data = _dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
            data.write(buffer);
          }

          var totalDataCount = 0;
          for (var i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
          }

          if (buffer.getLengthInBits() <= totalDataCount * 8) {
            break;
          }
        }

        _typeNumber = typeNumber;
      }

      makeImpl(false, getBestMaskPattern() );
    };

    _this.createTableTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var qrHtml = '';

      qrHtml += '<table style="';
      qrHtml += ' border-width: 0px; border-style: none;';
      qrHtml += ' border-collapse: collapse;';
      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
      qrHtml += '">';
      qrHtml += '<tbody>';

      for (var r = 0; r < _this.getModuleCount(); r += 1) {

        qrHtml += '<tr>';

        for (var c = 0; c < _this.getModuleCount(); c += 1) {
          qrHtml += '<td style="';
          qrHtml += ' border-width: 0px; border-style: none;';
          qrHtml += ' border-collapse: collapse;';
          qrHtml += ' padding: 0px; margin: 0px;';
          qrHtml += ' width: ' + cellSize + 'px;';
          qrHtml += ' height: ' + cellSize + 'px;';
          qrHtml += ' background-color: ';
          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
          qrHtml += ';';
          qrHtml += '"/>';
        }

        qrHtml += '</tr>';
      }

      qrHtml += '</tbody>';
      qrHtml += '</table>';

      return qrHtml;
    };

    _this.createSvgTag = function(cellSize, margin, alt, title) {

      var opts = {};
      if (typeof arguments[0] == 'object') {
        // Called by options.
        opts = arguments[0];
        // overwrite cellSize and margin.
        cellSize = opts.cellSize;
        margin = opts.margin;
        alt = opts.alt;
        title = opts.title;
      }

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      // Compose alt property surrogate
      alt = (typeof alt === 'string') ? {text: alt} : alt || {};
      alt.text = alt.text || null;
      alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

      // Compose title property surrogate
      title = (typeof title === 'string') ? {text: title} : title || {};
      title.text = title.text || null;
      title.id = (title.text) ? title.id || 'qrcode-title' : null;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var c, mc, r, mr, qrSvg='', rect;

      rect = 'l' + cellSize + ',0 0,' + cellSize +
        ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

      qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
      qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
      qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
      qrSvg += ' preserveAspectRatio="xMinYMin meet"';
      qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
          escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
      qrSvg += '>';
      qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
          escapeXml(title.text) + '</title>' : '';
      qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
          escapeXml(alt.text) + '</description>' : '';
      qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
      qrSvg += '<path d="';

      for (r = 0; r < _this.getModuleCount(); r += 1) {
        mr = r * cellSize + margin;
        for (c = 0; c < _this.getModuleCount(); c += 1) {
          if (_this.isDark(r, c) ) {
            mc = c*cellSize+margin;
            qrSvg += 'M' + mc + ',' + mr + rect;
          }
        }
      }

      qrSvg += '" stroke="transparent" fill="black"/>';
      qrSvg += '</svg>';

      return qrSvg;
    };

    _this.createDataURL = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      return createDataURL(size, size, function(x, y) {
        if (min <= x && x < max && min <= y && y < max) {
          var c = Math.floor( (x - min) / cellSize);
          var r = Math.floor( (y - min) / cellSize);
          return _this.isDark(r, c)? 0 : 1;
        } else {
          return 1;
        }
      } );
    };

    _this.createImgTag = function(cellSize, margin, alt) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;

      var img = '';
      img += '<img';
      img += '\u0020src="';
      img += _this.createDataURL(cellSize, margin);
      img += '"';
      img += '\u0020width="';
      img += size;
      img += '"';
      img += '\u0020height="';
      img += size;
      img += '"';
      if (alt) {
        img += '\u0020alt="';
        img += escapeXml(alt);
        img += '"';
      }
      img += '/>';

      return img;
    };

    var escapeXml = function(s) {
      var escaped = '';
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        switch(c) {
        case '<': escaped += '&lt;'; break;
        case '>': escaped += '&gt;'; break;
        case '&': escaped += '&amp;'; break;
        case '"': escaped += '&quot;'; break;
        default : escaped += c; break;
        }
      }
      return escaped;
    };

    var _createHalfASCII = function(margin) {
      var cellSize = 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r1, r2, p;

      var blocks = {
        '██': '█',
        '█ ': '▀',
        ' █': '▄',
        '  ': ' '
      };

      var blocksLastLineNoMargin = {
        '██': '▀',
        '█ ': '▀',
        ' █': ' ',
        '  ': ' '
      };

      var ascii = '';
      for (y = 0; y < size; y += 2) {
        r1 = Math.floor((y - min) / cellSize);
        r2 = Math.floor((y + 1 - min) / cellSize);
        for (x = 0; x < size; x += 1) {
          p = '█';

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
            p = ' ';
          }

          if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
            p += ' ';
          }
          else {
            p += '█';
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
        }

        ascii += '\n';
      }

      if (size % 2 && margin > 0) {
        return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('▀');
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.createASCII = function(cellSize, margin) {
      cellSize = cellSize || 1;

      if (cellSize < 2) {
        return _createHalfASCII(margin);
      }

      cellSize -= 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r, p;

      var white = Array(cellSize+1).join('██');
      var black = Array(cellSize+1).join('  ');

      var ascii = '';
      var line = '';
      for (y = 0; y < size; y += 1) {
        r = Math.floor( (y - min) / cellSize);
        line = '';
        for (x = 0; x < size; x += 1) {
          p = 1;

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
            p = 0;
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          line += p ? white : black;
        }

        for (r = 0; r < cellSize; r += 1) {
          ascii += line + '\n';
        }
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.renderTo2dContext = function(context, cellSize) {
      cellSize = cellSize || 2;
      var length = _this.getModuleCount();
      for (var row = 0; row < length; row++) {
        for (var col = 0; col < length; col++) {
          context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
          context.fillRect(row * cellSize, col * cellSize, cellSize, cellSize);
        }
      }
    }

    return _this;
  };

  //---------------------------------------------------------------------
  // qrcode.stringToBytes
  //---------------------------------------------------------------------

  qrcode.stringToBytesFuncs = {
    'default' : function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        bytes.push(c & 0xff);
      }
      return bytes;
    }
  };

  qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];

  //---------------------------------------------------------------------
  // qrcode.createStringToBytes
  //---------------------------------------------------------------------

  /**
   * @param unicodeData base64 string of byte array.
   * [16bit Unicode],[16bit Bytes], ...
   * @param numChars
   */
  qrcode.createStringToBytes = function(unicodeData, numChars) {

    // create conversion map.

    var unicodeMap = function() {

      var bin = base64DecodeInputStream(unicodeData);
      var read = function() {
        var b = bin.read();
        if (b == -1) throw 'eof';
        return b;
      };

      var count = 0;
      var unicodeMap = {};
      while (true) {
        var b0 = bin.read();
        if (b0 == -1) break;
        var b1 = read();
        var b2 = read();
        var b3 = read();
        var k = String.fromCharCode( (b0 << 8) | b1);
        var v = (b2 << 8) | b3;
        unicodeMap[k] = v;
        count += 1;
      }
      if (count != numChars) {
        throw count + ' != ' + numChars;
      }

      return unicodeMap;
    }();

    var unknownChar = '?'.charCodeAt(0);

    return function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        if (c < 128) {
          bytes.push(c);
        } else {
          var b = unicodeMap[s.charAt(i)];
          if (typeof b == 'number') {
            if ( (b & 0xff) == b) {
              // 1byte
              bytes.push(b);
            } else {
              // 2bytes
              bytes.push(b >>> 8);
              bytes.push(b & 0xff);
            }
          } else {
            bytes.push(unknownChar);
          }
        }
      }
      return bytes;
    };
  };

  //---------------------------------------------------------------------
  // QRMode
  //---------------------------------------------------------------------

  var QRMode = {
    MODE_NUMBER :    1 << 0,
    MODE_ALPHA_NUM : 1 << 1,
    MODE_8BIT_BYTE : 1 << 2,
    MODE_KANJI :     1 << 3
  };

  //---------------------------------------------------------------------
  // QRErrorCorrectionLevel
  //---------------------------------------------------------------------

  var QRErrorCorrectionLevel = {
    L : 1,
    M : 0,
    Q : 3,
    H : 2
  };

  //---------------------------------------------------------------------
  // QRMaskPattern
  //---------------------------------------------------------------------

  var QRMaskPattern = {
    PATTERN000 : 0,
    PATTERN001 : 1,
    PATTERN010 : 2,
    PATTERN011 : 3,
    PATTERN100 : 4,
    PATTERN101 : 5,
    PATTERN110 : 6,
    PATTERN111 : 7
  };

  //---------------------------------------------------------------------
  // QRUtil
  //---------------------------------------------------------------------

  var QRUtil = function() {

    var PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ];
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    var _this = {};

    var getBCHDigit = function(data) {
      var digit = 0;
      while (data != 0) {
        digit += 1;
        data >>>= 1;
      }
      return digit;
    };

    _this.getBCHTypeInfo = function(data) {
      var d = data << 10;
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
      }
      return ( (data << 10) | d) ^ G15_MASK;
    };

    _this.getBCHTypeNumber = function(data) {
      var d = data << 12;
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
      }
      return (data << 12) | d;
    };

    _this.getPatternPosition = function(typeNumber) {
      return PATTERN_POSITION_TABLE[typeNumber - 1];
    };

    _this.getMaskFunction = function(maskPattern) {

      switch (maskPattern) {

      case QRMaskPattern.PATTERN000 :
        return function(i, j) { return (i + j) % 2 == 0; };
      case QRMaskPattern.PATTERN001 :
        return function(i, j) { return i % 2 == 0; };
      case QRMaskPattern.PATTERN010 :
        return function(i, j) { return j % 3 == 0; };
      case QRMaskPattern.PATTERN011 :
        return function(i, j) { return (i + j) % 3 == 0; };
      case QRMaskPattern.PATTERN100 :
        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
      case QRMaskPattern.PATTERN101 :
        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
      case QRMaskPattern.PATTERN110 :
        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
      case QRMaskPattern.PATTERN111 :
        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

      default :
        throw 'bad maskPattern:' + maskPattern;
      }
    };

    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
      var a = qrPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i += 1) {
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
      }
      return a;
    };

    _this.getLengthInBits = function(mode, type) {

      if (1 <= type && type < 10) {

        // 1 - 9

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 10;
        case QRMode.MODE_ALPHA_NUM : return 9;
        case QRMode.MODE_8BIT_BYTE : return 8;
        case QRMode.MODE_KANJI     : return 8;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 27) {

        // 10 - 26

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 12;
        case QRMode.MODE_ALPHA_NUM : return 11;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 10;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 41) {

        // 27 - 40

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 14;
        case QRMode.MODE_ALPHA_NUM : return 13;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 12;
        default :
          throw 'mode:' + mode;
        }

      } else {
        throw 'type:' + type;
      }
    };

    _this.getLostPoint = function(qrcode) {

      var moduleCount = qrcode.getModuleCount();

      var lostPoint = 0;

      // LEVEL1

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount; col += 1) {

          var sameCount = 0;
          var dark = qrcode.isDark(row, col);

          for (var r = -1; r <= 1; r += 1) {

            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c += 1) {

              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrcode.isDark(row + r, col + c) ) {
                sameCount += 1;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      };

      // LEVEL2

      for (var row = 0; row < moduleCount - 1; row += 1) {
        for (var col = 0; col < moduleCount - 1; col += 1) {
          var count = 0;
          if (qrcode.isDark(row, col) ) count += 1;
          if (qrcode.isDark(row + 1, col) ) count += 1;
          if (qrcode.isDark(row, col + 1) ) count += 1;
          if (qrcode.isDark(row + 1, col + 1) ) count += 1;
          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      // LEVEL3

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount - 6; col += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row, col + 1)
              &&  qrcode.isDark(row, col + 2)
              &&  qrcode.isDark(row, col + 3)
              &&  qrcode.isDark(row, col + 4)
              && !qrcode.isDark(row, col + 5)
              &&  qrcode.isDark(row, col + 6) ) {
            lostPoint += 40;
          }
        }
      }

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount - 6; row += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row + 1, col)
              &&  qrcode.isDark(row + 2, col)
              &&  qrcode.isDark(row + 3, col)
              &&  qrcode.isDark(row + 4, col)
              && !qrcode.isDark(row + 5, col)
              &&  qrcode.isDark(row + 6, col) ) {
            lostPoint += 40;
          }
        }
      }

      // LEVEL4

      var darkCount = 0;

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount; row += 1) {
          if (qrcode.isDark(row, col) ) {
            darkCount += 1;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // QRMath
  //---------------------------------------------------------------------

  var QRMath = function() {

    var EXP_TABLE = new Array(256);
    var LOG_TABLE = new Array(256);

    // initialize tables
    for (var i = 0; i < 8; i += 1) {
      EXP_TABLE[i] = 1 << i;
    }
    for (var i = 8; i < 256; i += 1) {
      EXP_TABLE[i] = EXP_TABLE[i - 4]
        ^ EXP_TABLE[i - 5]
        ^ EXP_TABLE[i - 6]
        ^ EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i += 1) {
      LOG_TABLE[EXP_TABLE[i] ] = i;
    }

    var _this = {};

    _this.glog = function(n) {

      if (n < 1) {
        throw 'glog(' + n + ')';
      }

      return LOG_TABLE[n];
    };

    _this.gexp = function(n) {

      while (n < 0) {
        n += 255;
      }

      while (n >= 256) {
        n -= 255;
      }

      return EXP_TABLE[n];
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrPolynomial
  //---------------------------------------------------------------------

  function qrPolynomial(num, shift) {

    if (typeof num.length == 'undefined') {
      throw num.length + '/' + shift;
    }

    var _num = function() {
      var offset = 0;
      while (offset < num.length && num[offset] == 0) {
        offset += 1;
      }
      var _num = new Array(num.length - offset + shift);
      for (var i = 0; i < num.length - offset; i += 1) {
        _num[i] = num[i + offset];
      }
      return _num;
    }();

    var _this = {};

    _this.getAt = function(index) {
      return _num[index];
    };

    _this.getLength = function() {
      return _num.length;
    };

    _this.multiply = function(e) {

      var num = new Array(_this.getLength() + e.getLength() - 1);

      for (var i = 0; i < _this.getLength(); i += 1) {
        for (var j = 0; j < e.getLength(); j += 1) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
        }
      }

      return qrPolynomial(num, 0);
    };

    _this.mod = function(e) {

      if (_this.getLength() - e.getLength() < 0) {
        return _this;
      }

      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

      var num = new Array(_this.getLength() );
      for (var i = 0; i < _this.getLength(); i += 1) {
        num[i] = _this.getAt(i);
      }

      for (var i = 0; i < e.getLength(); i += 1) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
      }

      // recursive call
      return qrPolynomial(num, 0).mod(e);
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // QRRSBlock
  //---------------------------------------------------------------------

  var QRRSBlock = function() {

    var RS_BLOCK_TABLE = [

      // L
      // M
      // Q
      // H

      // 1
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],

      // 2
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],

      // 3
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],

      // 4
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],

      // 5
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],

      // 6
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],

      // 7
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],

      // 8
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],

      // 9
      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],

      // 10
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],

      // 11
      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 4, 51, 23],
      [3, 36, 12, 8, 37, 13],

      // 12
      [2, 116, 92, 2, 117, 93],
      [6, 58, 36, 2, 59, 37],
      [4, 46, 20, 6, 47, 21],
      [7, 42, 14, 4, 43, 15],

      // 13
      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],

      // 14
      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],

      // 15
      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12, 7, 37, 13],

      // 16
      [5, 122, 98, 1, 123, 99],
      [7, 73, 45, 3, 74, 46],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],

      // 17
      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],

      // 18
      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],

      // 19
      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],

      // 20
      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],

      // 21
      [4, 144, 116, 4, 145, 117],
      [17, 68, 42],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],

      // 22
      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],

      // 23
      [4, 151, 121, 5, 152, 122],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],

      // 24
      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],

      // 25
      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],

      // 26
      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],

      // 27
      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],

      // 28
      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],

      // 29
      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],

      // 30
      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],

      // 31
      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],

      // 32
      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],

      // 33
      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],

      // 34
      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],

      // 35
      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],

      // 36
      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],

      // 37
      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],

      // 38
      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],

      // 39
      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],

      // 40
      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16]
    ];

    var qrRSBlock = function(totalCount, dataCount) {
      var _this = {};
      _this.totalCount = totalCount;
      _this.dataCount = dataCount;
      return _this;
    };

    var _this = {};

    var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

      switch(errorCorrectionLevel) {
      case QRErrorCorrectionLevel.L :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectionLevel.M :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectionLevel.Q :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectionLevel.H :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default :
        return undefined;
      }
    };

    _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

      var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

      if (typeof rsBlock == 'undefined') {
        throw 'bad rs block @ typeNumber:' + typeNumber +
            '/errorCorrectionLevel:' + errorCorrectionLevel;
      }

      var length = rsBlock.length / 3;

      var list = [];

      for (var i = 0; i < length; i += 1) {

        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];

        for (var j = 0; j < count; j += 1) {
          list.push(qrRSBlock(totalCount, dataCount) );
        }
      }

      return list;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrBitBuffer
  //---------------------------------------------------------------------

  var qrBitBuffer = function() {

    var _buffer = [];
    var _length = 0;

    var _this = {};

    _this.getBuffer = function() {
      return _buffer;
    };

    _this.getAt = function(index) {
      var bufIndex = Math.floor(index / 8);
      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    };

    _this.put = function(num, length) {
      for (var i = 0; i < length; i += 1) {
        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
      }
    };

    _this.getLengthInBits = function() {
      return _length;
    };

    _this.putBit = function(bit) {

      var bufIndex = Math.floor(_length / 8);
      if (_buffer.length <= bufIndex) {
        _buffer.push(0);
      }

      if (bit) {
        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
      }

      _length += 1;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrNumber
  //---------------------------------------------------------------------

  var qrNumber = function(data) {

    var _mode = QRMode.MODE_NUMBER;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var data = _data;

      var i = 0;

      while (i + 2 < data.length) {
        buffer.put(strToNum(data.substring(i, i + 3) ), 10);
        i += 3;
      }

      if (i < data.length) {
        if (data.length - i == 1) {
          buffer.put(strToNum(data.substring(i, i + 1) ), 4);
        } else if (data.length - i == 2) {
          buffer.put(strToNum(data.substring(i, i + 2) ), 7);
        }
      }
    };

    var strToNum = function(s) {
      var num = 0;
      for (var i = 0; i < s.length; i += 1) {
        num = num * 10 + chatToNum(s.charAt(i) );
      }
      return num;
    };

    var chatToNum = function(c) {
      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      }
      throw 'illegal char :' + c;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrAlphaNum
  //---------------------------------------------------------------------

  var qrAlphaNum = function(data) {

    var _mode = QRMode.MODE_ALPHA_NUM;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var s = _data;

      var i = 0;

      while (i + 1 < s.length) {
        buffer.put(
          getCode(s.charAt(i) ) * 45 +
          getCode(s.charAt(i + 1) ), 11);
        i += 2;
      }

      if (i < s.length) {
        buffer.put(getCode(s.charAt(i) ), 6);
      }
    };

    var getCode = function(c) {

      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      } else if ('A' <= c && c <= 'Z') {
        return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
      } else {
        switch (c) {
        case ' ' : return 36;
        case '$' : return 37;
        case '%' : return 38;
        case '*' : return 39;
        case '+' : return 40;
        case '-' : return 41;
        case '.' : return 42;
        case '/' : return 43;
        case ':' : return 44;
        default :
          throw 'illegal char :' + c;
        }
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qr8BitByte
  //---------------------------------------------------------------------

  var qr8BitByte = function(data) {

    var _mode = QRMode.MODE_8BIT_BYTE;
    var _data = data;
    var _bytes = qrcode.stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _bytes.length;
    };

    _this.write = function(buffer) {
      for (var i = 0; i < _bytes.length; i += 1) {
        buffer.put(_bytes[i], 8);
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrKanji
  //---------------------------------------------------------------------

  var qrKanji = function(data) {

    var _mode = QRMode.MODE_KANJI;
    var _data = data;

    var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
    if (!stringToBytes) {
      throw 'sjis not supported.';
    }
    !function(c, code) {
      // self test for sjis support.
      var test = stringToBytes(c);
      if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
        throw 'sjis not supported.';
      }
    }('\u53cb', 0x9746);

    var _bytes = stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return ~~(_bytes.length / 2);
    };

    _this.write = function(buffer) {

      var data = _bytes;

      var i = 0;

      while (i + 1 < data.length) {

        var c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

        if (0x8140 <= c && c <= 0x9FFC) {
          c -= 0x8140;
        } else if (0xE040 <= c && c <= 0xEBBF) {
          c -= 0xC140;
        } else {
          throw 'illegal char at ' + (i + 1) + '/' + c;
        }

        c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

        buffer.put(c, 13);

        i += 2;
      }

      if (i < data.length) {
        throw 'illegal char at ' + (i + 1);
      }
    };

    return _this;
  };

  //=====================================================================
  // GIF Support etc.
  //

  //---------------------------------------------------------------------
  // byteArrayOutputStream
  //---------------------------------------------------------------------

  var byteArrayOutputStream = function() {

    var _bytes = [];

    var _this = {};

    _this.writeByte = function(b) {
      _bytes.push(b & 0xff);
    };

    _this.writeShort = function(i) {
      _this.writeByte(i);
      _this.writeByte(i >>> 8);
    };

    _this.writeBytes = function(b, off, len) {
      off = off || 0;
      len = len || b.length;
      for (var i = 0; i < len; i += 1) {
        _this.writeByte(b[i + off]);
      }
    };

    _this.writeString = function(s) {
      for (var i = 0; i < s.length; i += 1) {
        _this.writeByte(s.charCodeAt(i) );
      }
    };

    _this.toByteArray = function() {
      return _bytes;
    };

    _this.toString = function() {
      var s = '';
      s += '[';
      for (var i = 0; i < _bytes.length; i += 1) {
        if (i > 0) {
          s += ',';
        }
        s += _bytes[i];
      }
      s += ']';
      return s;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64EncodeOutputStream
  //---------------------------------------------------------------------

  var base64EncodeOutputStream = function() {

    var _buffer = 0;
    var _buflen = 0;
    var _length = 0;
    var _base64 = '';

    var _this = {};

    var writeEncoded = function(b) {
      _base64 += String.fromCharCode(encode(b & 0x3f) );
    };

    var encode = function(n) {
      if (n < 0) {
        // error.
      } else if (n < 26) {
        return 0x41 + n;
      } else if (n < 52) {
        return 0x61 + (n - 26);
      } else if (n < 62) {
        return 0x30 + (n - 52);
      } else if (n == 62) {
        return 0x2b;
      } else if (n == 63) {
        return 0x2f;
      }
      throw 'n:' + n;
    };

    _this.writeByte = function(n) {

      _buffer = (_buffer << 8) | (n & 0xff);
      _buflen += 8;
      _length += 1;

      while (_buflen >= 6) {
        writeEncoded(_buffer >>> (_buflen - 6) );
        _buflen -= 6;
      }
    };

    _this.flush = function() {

      if (_buflen > 0) {
        writeEncoded(_buffer << (6 - _buflen) );
        _buffer = 0;
        _buflen = 0;
      }

      if (_length % 3 != 0) {
        // padding
        var padlen = 3 - _length % 3;
        for (var i = 0; i < padlen; i += 1) {
          _base64 += '=';
        }
      }
    };

    _this.toString = function() {
      return _base64;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64DecodeInputStream
  //---------------------------------------------------------------------

  var base64DecodeInputStream = function(str) {

    var _str = str;
    var _pos = 0;
    var _buffer = 0;
    var _buflen = 0;

    var _this = {};

    _this.read = function() {

      while (_buflen < 8) {

        if (_pos >= _str.length) {
          if (_buflen == 0) {
            return -1;
          }
          throw 'unexpected end of file./' + _buflen;
        }

        var c = _str.charAt(_pos);
        _pos += 1;

        if (c == '=') {
          _buflen = 0;
          return -1;
        } else if (c.match(/^\s$/) ) {
          // ignore if whitespace.
          continue;
        }

        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
        _buflen += 6;
      }

      var n = (_buffer >>> (_buflen - 8) ) & 0xff;
      _buflen -= 8;
      return n;
    };

    var decode = function(c) {
      if (0x41 <= c && c <= 0x5a) {
        return c - 0x41;
      } else if (0x61 <= c && c <= 0x7a) {
        return c - 0x61 + 26;
      } else if (0x30 <= c && c <= 0x39) {
        return c - 0x30 + 52;
      } else if (c == 0x2b) {
        return 62;
      } else if (c == 0x2f) {
        return 63;
      } else {
        throw 'c:' + c;
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // gifImage (B/W)
  //---------------------------------------------------------------------

  var gifImage = function(width, height) {

    var _width = width;
    var _height = height;
    var _data = new Array(width * height);

    var _this = {};

    _this.setPixel = function(x, y, pixel) {
      _data[y * _width + x] = pixel;
    };

    _this.write = function(out) {

      //---------------------------------
      // GIF Signature

      out.writeString('GIF87a');

      //---------------------------------
      // Screen Descriptor

      out.writeShort(_width);
      out.writeShort(_height);

      out.writeByte(0x80); // 2bit
      out.writeByte(0);
      out.writeByte(0);

      //---------------------------------
      // Global Color Map

      // black
      out.writeByte(0x00);
      out.writeByte(0x00);
      out.writeByte(0x00);

      // white
      out.writeByte(0xff);
      out.writeByte(0xff);
      out.writeByte(0xff);

      //---------------------------------
      // Image Descriptor

      out.writeString(',');
      out.writeShort(0);
      out.writeShort(0);
      out.writeShort(_width);
      out.writeShort(_height);
      out.writeByte(0);

      //---------------------------------
      // Local Color Map

      //---------------------------------
      // Raster Data

      var lzwMinCodeSize = 2;
      var raster = getLZWRaster(lzwMinCodeSize);

      out.writeByte(lzwMinCodeSize);

      var offset = 0;

      while (raster.length - offset > 255) {
        out.writeByte(255);
        out.writeBytes(raster, offset, 255);
        offset += 255;
      }

      out.writeByte(raster.length - offset);
      out.writeBytes(raster, offset, raster.length - offset);
      out.writeByte(0x00);

      //---------------------------------
      // GIF Terminator
      out.writeString(';');
    };

    var bitOutputStream = function(out) {

      var _out = out;
      var _bitLength = 0;
      var _bitBuffer = 0;

      var _this = {};

      _this.write = function(data, length) {

        if ( (data >>> length) != 0) {
          throw 'length over';
        }

        while (_bitLength + length >= 8) {
          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
          length -= (8 - _bitLength);
          data >>>= (8 - _bitLength);
          _bitBuffer = 0;
          _bitLength = 0;
        }

        _bitBuffer = (data << _bitLength) | _bitBuffer;
        _bitLength = _bitLength + length;
      };

      _this.flush = function() {
        if (_bitLength > 0) {
          _out.writeByte(_bitBuffer);
        }
      };

      return _this;
    };

    var getLZWRaster = function(lzwMinCodeSize) {

      var clearCode = 1 << lzwMinCodeSize;
      var endCode = (1 << lzwMinCodeSize) + 1;
      var bitLength = lzwMinCodeSize + 1;

      // Setup LZWTable
      var table = lzwTable();

      for (var i = 0; i < clearCode; i += 1) {
        table.add(String.fromCharCode(i) );
      }
      table.add(String.fromCharCode(clearCode) );
      table.add(String.fromCharCode(endCode) );

      var byteOut = byteArrayOutputStream();
      var bitOut = bitOutputStream(byteOut);

      // clear code
      bitOut.write(clearCode, bitLength);

      var dataIndex = 0;

      var s = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;

      while (dataIndex < _data.length) {

        var c = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        if (table.contains(s + c) ) {

          s = s + c;

        } else {

          bitOut.write(table.indexOf(s), bitLength);

          if (table.size() < 0xfff) {

            if (table.size() == (1 << bitLength) ) {
              bitLength += 1;
            }

            table.add(s + c);
          }

          s = c;
        }
      }

      bitOut.write(table.indexOf(s), bitLength);

      // end code
      bitOut.write(endCode, bitLength);

      bitOut.flush();

      return byteOut.toByteArray();
    };

    var lzwTable = function() {

      var _map = {};
      var _size = 0;

      var _this = {};

      _this.add = function(key) {
        if (_this.contains(key) ) {
          throw 'dup key:' + key;
        }
        _map[key] = _size;
        _size += 1;
      };

      _this.size = function() {
        return _size;
      };

      _this.indexOf = function(key) {
        return _map[key];
      };

      _this.contains = function(key) {
        return typeof _map[key] != 'undefined';
      };

      return _this;
    };

    return _this;
  };

  var createDataURL = function(width, height, getPixel) {
    var gif = gifImage(width, height);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        gif.setPixel(x, y, getPixel(x, y) );
      }
    }

    var b = byteArrayOutputStream();
    gif.write(b);

    var base64 = base64EncodeOutputStream();
    var bytes = b.toByteArray();
    for (var i = 0; i < bytes.length; i += 1) {
      base64.writeByte(bytes[i]);
    }
    base64.flush();

    return 'data:image/gif;base64,' + base64;
  };

  //---------------------------------------------------------------------
  // returns qrcode function.

  return qrcode;
}();

// multibyte support
!function() {

  qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUTF8Array(str) {
      var utf8 = [];
      for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6),
              0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          charcode = 0x10000 + (((charcode & 0x3ff)<<10)
            | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >>18),
              0x80 | ((charcode>>12) & 0x3f),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
      }
      return utf8;
    }
    return toUTF8Array(s);
  };

}();

(function (factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory);
  } else if (typeof exports === 'object') {
      module.exports = factory();
  }
}(function () {
    return qrcode;
}));

;
// TETOL Wand · presenter (big-screen) side. EXPERIMENT · NOT CANONICAL · NOT DEPLOYED.
// The big screen carries the world; the phone carries the way through it.
// The display creates a temporary session (a 6-character code plus QR). The first phone to join holds the Wand.
// The phone sends intents; this page runs them through TETOL_NAV and reports back where it is.
// This is separate from S33D.life sign-in: it has no accounts, no tokens and no stored data beyond this tab's session.
(() => {
  const L = window.TETOL_WAND_LINK, NAV = () => window.TETOL_NAV;
  if (!L) return;
  const KEY = 'tetol-wand-display', TTL = 10 * 60 * 1000, AWAY = 15000;
  const store = { get() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
    set(v) { try { v ? sessionStorage.setItem(KEY, JSON.stringify(v)) : sessionStorage.removeItem(KEY); } catch (e) {} } };
  let S = null, link = null, lastSeen = 0, ui = null, sendT = 0, expT = 0;

  const css = document.createElement('style');
  css.textContent = `
  #wandbtn{}
  #wandcard{position:fixed;left:16px;bottom:16px;z-index:2147483600;width:min(300px,calc(100vw - 32px));box-sizing:border-box;padding:16px 16px 14px;border-radius:16px;
    background:rgba(20,17,12,.94);border:1px solid rgba(212,176,122,.45);color:#f3e9d6;font:14px/1.4 'Iowan Old Style',Palatino,Georgia,serif;box-shadow:0 12px 40px rgba(0,0,0,.45)}
  #wandcard[hidden]{display:none}
  #wandcard .k{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#d8c49c}
  #wandcard .t{font-size:17px;margin:4px 0 10px}
  #wandcard .qr{background:#f6efe1;border-radius:10px;padding:8px;display:flex;justify-content:center}
  #wandcard .qr svg{width:100%;max-width:190px;height:auto;display:block}
  #wandcard .code{font:600 30px/1.1 ui-monospace,Menlo,monospace;letter-spacing:.22em;text-align:center;margin:10px 0 2px;color:#fbf1dc}
  #wandcard .url{font:11px/1.35 ui-monospace,Menlo,monospace;color:#bfae8e;word-break:break-all;text-align:center}
  #wandcard .st{margin-top:10px;display:flex;align-items:center;gap:8px;font-size:13.5px;color:#e6d6b6}
  #wandcard .dot{width:9px;height:9px;border-radius:50%;background:#8a7a60;flex:none}
  #wandcard .dot.on{background:#8fd18a;box-shadow:0 0 8px #8fd18a}#wandcard .dot.away{background:#e0b34a}
  #wandcard .row{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
  #wandcard button{min-height:40px;padding:0 12px;border-radius:20px;border:1px solid rgba(212,176,122,.45);background:transparent;color:#f3e9d6;font:inherit;font-size:13px;cursor:pointer}
  #wandcard button:hover{border-color:#d4b07a}
  #wandpill{position:fixed;right:14px;top:max(10px,env(safe-area-inset-top));z-index:2147483600;display:flex;align-items:center;gap:8px;min-height:36px;padding:0 12px;border-radius:18px;
    background:rgba(20,17,12,.82);border:1px solid rgba(212,176,122,.4);color:#f3e9d6;font:13px 'Iowan Old Style',Palatino,Georgia,serif;cursor:pointer}
  #wandpill[hidden]{display:none}
  #wandpill .dot{width:8px;height:8px;border-radius:50%;background:#8fd18a;box-shadow:0 0 8px #8fd18a}#wandpill .dot.away{background:#e0b34a;box-shadow:none}`;
  document.head.appendChild(css);

  function wandUrl() {
    const u = new URL('tetol-wand.html', location.href.split('#')[0]);
    u.search = ''; const q = new URLSearchParams(L.relayQuery()); q.set('s', S.code); u.search = q.toString();
    return u.href;
  }
  function qrSvg(text) {
    try { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
    catch (e) { return '<div style="color:#333;padding:20px;font-size:12px">QR unavailable · use the code</div>'; }
  }
  function build() {
    ui = document.createElement('div'); ui.id = 'wandcard'; ui.hidden = true;
    ui.setAttribute('role', 'dialog'); ui.setAttribute('aria-label', 'Present with the Wand');
    const pill = document.createElement('button'); pill.id = 'wandpill'; pill.type = 'button'; pill.hidden = true;
    pill.innerHTML = '<span class="dot"></span><span class="lbl">Wand</span>';
    pill.onclick = () => { ui.hidden = false; render(); };
    document.body.append(ui, pill);
    const hdr = document.getElementById('hdr');
    if (hdr) { const b = document.createElement('button'); b.type = 'button'; b.className = 'hbtn'; b.id = 'wandbtn'; b.textContent = 'Wand'; b.title = 'Present on a big screen, navigate from your phone (experiment)'; b.onclick = () => start(true); hdr.insertBefore(b, document.getElementById('xbtn')); }
  }
  function status() {
    if (!S) return { cls: '', text: 'Not presenting' };
    if (!S.wand) return { cls: '', text: 'Waiting for a phone…' };
    if (Date.now() - lastSeen > AWAY) return { cls: 'away', text: 'Wand away · will reconnect' };
    return { cls: 'on', text: 'Wand connected' };
  }
  function render() {
    if (!ui || !S) return;
    const st = status(), url = wandUrl(), paired = !!S.wand;
    const left = Math.max(0, Math.ceil((S.created + TTL - Date.now()) / 60000));
    ui.innerHTML = `<div class="k">Present · experiment</div>
      <div class="t">${paired ? 'The Wand is in hand' : 'Scan with your phone'}</div>
      ${paired ? '' : `<div class="qr">${qrSvg(url)}</div><div class="code" aria-label="Pairing code">${S.code}</div><div class="url">${url.replace(/^https?:\/\//, '')}</div>`}
      <div class="st"><span class="dot ${st.cls}"></span><span>${st.text}${!paired ? ` · code valid ${left} min` : ''}</span></div>
      <div class="row">${paired ? '<button data-w="release">Release wand</button>' : '<button data-w="new">New code</button>'}<button data-w="hide">Hide</button><button data-w="end">End</button></div>
      <div class="st" style="font-size:12px;color:#bfae8e">Relay: ${link ? link.relay : '…'}${link && link.relay === 'local' ? ' · same browser only' : ''}</div>`;
    const pill = document.getElementById('wandpill');
    pill.hidden = !(paired && ui.hidden);
    pill.querySelector('.dot').className = 'dot ' + (st.cls === 'away' ? 'away' : '');
    pill.querySelector('.lbl').textContent = st.cls === 'away' ? 'Wand away' : 'Wand';
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('#wandcard [data-w]'); if (!b) return;
    const a = b.dataset.w;
    if (a === 'hide') { ui.hidden = true; render(); }
    if (a === 'new') newSession();
    if (a === 'release') { tell({ t: 'released', w: S.wand }); S.wand = null; save(); render(); }
    if (a === 'end') end();
  });

  const save = () => store.set(S);
  const tell = (m) => { try { link && link.send({ ...m, code: S.code }); } catch (e) {} };
  function snapshot() { const N = NAV(); return N ? { where: N.where(), options: N.options(), places: N.places() } : {}; }
  function sendState() { clearTimeout(sendT); sendT = setTimeout(() => { if (S?.wand) tell({ t: 'state', w: S.wand, ...snapshot() }); }, 120); }
  addEventListener('tetol:place', sendState);

  async function connect() {
    try { link && link.close(); } catch (e) {}
    link = null; render();
    try { link = await L.open(S.code, onMsg); } catch (e) { console.warn('[wand] relay failed', e); }
    render();
  }
  function onMsg(m) {
    if (!m || m.code !== S?.code || typeof m.w !== 'string') return;
    if (m.t === 'hello' || m.t === 'ping') {
      if (!S.wand && m.t === 'hello') {
        if (Date.now() > S.created + TTL) return tell({ t: 'expired', w: m.w });
        S.wand = m.w; S.pairedAt = Date.now(); save(); ui.hidden = true;
      }
      if (S.wand !== m.w) return tell({ t: 'busy', w: m.w });
      lastSeen = Date.now();
      if (m.t === 'hello') tell({ t: 'welcome', w: m.w, ...snapshot() }); else tell({ t: 'pong', w: m.w });
      return render();
    }
    if (m.t === 'bye' && m.w === S.wand) { S.wand = null; save(); ui.hidden = false; return render(); }
    if (m.t === 'intent' && m.w === S.wand && typeof m.name === 'string') {
      lastSeen = Date.now();
      const ok = NAV() ? NAV().run(m.name, m.arg, 'wand') : false;
      tell({ t: 'ack', w: m.w, seq: m.seq, ok: !!ok });
      tell({ t: 'state', w: m.w, ...snapshot() }); // immediately, then again when the place settles
      sendState();
    }
  }
  function newSession() { S = { code: L.newCode(), created: Date.now(), wand: null }; save(); connect(); }
  function start(show) {
    if (!ui) build();
    if (!S) { S = store.get(); if (S && !S.wand && Date.now() > S.created + TTL) S = null; if (S) { lastSeen = Date.now(); connect(); } else newSession(); }
    if (show) ui.hidden = false;
    render();
    clearInterval(expT);
    expT = setInterval(() => { if (!S) return; if (!S.wand && Date.now() > S.created + TTL) newSession(); render(); }, 5000);
  }
  function end() { if (S?.wand) tell({ t: 'released', w: S.wand }); try { link && link.close(); } catch (e) {} link = null; S = null; store.set(null); clearInterval(expT); ui.hidden = true; document.getElementById('wandpill').hidden = true; }

  const boot = () => { build(); const resume = store.get(); if (/[?&]present=1/.test(location.search) || resume) start(!resume?.wand); };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', boot) : boot();
  window.TETOL_WAND_DISPLAY = { start: () => start(true), end, session: () => S && { code: S.code, paired: !!S.wand } };
})();

;
// TETOL · Grace pass experiments (24 Sep 2026). EXPERIMENT · NOT CANONICAL · NOT DEPLOYED.
// Three A/B experiments layered over the unchanged prototype. Switch with ?grace=PCT (any subset);
// ?grace=none gives the prototype exactly as it was. Default in this experimental file: all on.
//   P  PRESENCE FIRST: the Tree before the interface. Arrive to the Tree alone; the panel starts as a quiet
//                      "recognition" (name, one line) and opens into story and knowledge when you lean in;
//                      the interface and the relation lines recede when you are still.
//   C  CROSSING: a threshold you pass through. Walk up to the roundhouse door; its warm light fills the view;
//                you are inside (no black title card). Leaving, you step out of the door and see the Tree.
//   T  TRACES: places remember you were there. A small ember stays where you have been, brighter with
//                return, kept only in this browser. Not a score, not a list.
(() => {
  const q = new URLSearchParams(location.search).get('grace');
  const ON = q == null ? 'PC' : q === 'none' ? '' : q.toUpperCase(); // T (traces) is held for conceptual revision: add it explicitly with ?grace=PCT
  const G = { P: ON.includes('P'), C: ON.includes('C'), T: ON.includes('T') };
  window.TETOL_GRACE = G;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const whenTree = (fn) => { const t = () => (window.__tetol && window.__tetol.controls && document.querySelector('three-d-stage')?._scene ? fn(window.__tetol) : setTimeout(t, 120)); t(); };
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  // A small line in the Experiments panel, so reviewers can see what is on.
  const note = () => { const xp = document.getElementById('xpanel'); if (!xp || document.getElementById('xgrace')) return;
    const d = document.createElement('div'); d.id = 'xgrace';
    d.innerHTML = `<h3 style="margin-top:16px">Grace pass · A/B</h3><p style="margin:4px 0;font-size:13px">On: ${ON ? ON.split('').map((k) => ({ P: 'Presence first', C: 'Crossing', T: 'Traces' })[k]).join(' · ') : 'none (current prototype)'}.<br>Compare with <code>?grace=none</code>, or any of <code>?grace=P</code>, <code>C</code>, <code>T</code>.</p>${G.T ? '<button type="button" id="forgettraces">Forget my traces</button>' : ''}`;
    xp.appendChild(d); };
  setTimeout(note, 800);

  // ───────────────────────── P · PRESENCE FIRST ─────────────────────────
  if (G.P) {
    const css = document.createElement('style');
    css.textContent = `
    @media (min-width: 601px) {
      body.grace-p .app { grid-template-rows: minmax(0,1fr) !important; }
      body.grace-p #hdr { position: fixed; left: 0; right: 0; top: 0; z-index: 6; background: linear-gradient(hsl(75 22% 7% / .78), hsl(75 22% 7% / 0)); border-bottom: 0; }
      body.grace-p main { grid-template-columns: minmax(0,1fr) !important; position: relative; grid-row: 1; }
      body.grace-p #hint { top: 78px !important; }
      body.grace-p aside#panel { top: 76px !important; max-height: calc(100% - 94px) !important; }
      body.grace-p aside#panel { position: absolute; right: 18px; top: 18px; width: 372px; max-height: calc(100% - 36px); z-index: 5; border-radius: 16px;
        background: hsl(75 22% 8% / .86); border: 1px solid var(--line); backdrop-filter: blur(6px); box-shadow: 0 16px 40px rgba(0,0,0,.35); overflow: auto;
        transition: max-height .9s cubic-bezier(.2,.7,.2,1), opacity 1.2s ease, transform 1.2s ease; }
      /* recognition: name, its sense, one precise way forward. Story and paths open when you lean in. */
      body.grace-p aside#panel.peek { cursor: pointer; }
      body.grace-p aside#panel.peek .pbody > :is(.eyebrow, .crumbs, .ppurpose, .sec, .more, .copied, .lineage) { display: none !important; }
      body.grace-p aside#panel.peek .actions .act:not(:first-child) { display: none !important; }
      /* a quiet way back stays within reach, even before leaning in */
      body.grace-p aside#panel.peek .pbody > .nav { display: flex !important; margin-top: 10px; }
      body.grace-p aside#panel.peek .pbody > .nav > :not(:first-child) { display: none !important; }
      body.grace-p aside#panel.peek .pbody::after { content: '···'; display: block; text-align: center; letter-spacing: .3em; color: var(--ink3); margin-top: 6px; }
    }
    body.grace-p.g-arriving #hdr, body.grace-p.g-arriving #mark, body.grace-p.g-arriving aside#panel, body.grace-p.g-arriving .labels,
    body.grace-p.g-arriving .spine, body.grace-p.g-arriving #hint, body.grace-p.g-arriving #whisper { opacity: 0 !important; pointer-events: none; }
    body.grace-p #hdr, body.grace-p #mark, body.grace-p aside#panel, body.grace-p .labels, body.grace-p .spine, body.grace-p #hint, body.grace-p #whisper { transition: opacity 2.4s ease; }
    body.grace-p.g-still:not(.g-reading) #hdr, body.grace-p.g-still:not(.g-reading) #mark, body.grace-p.g-still:not(.g-reading) .spine,
    body.grace-p.g-still:not(.g-reading) #hint { opacity: .06 !important; }
    body.grace-p.g-still:not(.g-reading) aside#panel { opacity: 0 !important; pointer-events: none; }
    body.grace-p.g-still:not(.g-reading) .labels { opacity: .0 !important; }
    body.grace-p.g-waking #hdr, body.grace-p.g-waking #mark, body.grace-p.g-waking aside#panel, body.grace-p.g-waking .labels, body.grace-p.g-waking .spine { transition: opacity .35s ease; }
    @media (prefers-reduced-motion: reduce) { body.grace-p * { transition-duration: .01s !important; } }`;
    document.head.appendChild(css);
    document.body.classList.add('grace-p', 'g-arriving');

    // Arrival: the Tree alone for a few breaths, unless the Wanderer reaches for it sooner.
    let arrived = false;
    const arrive = () => { if (arrived) return; arrived = true; document.body.classList.remove('g-arriving'); };
    whenTree(() => setTimeout(arrive, reduce ? 800 : 5200)); // the Tree alone for a few breaths once it is actually there
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, arrive, { once: true, passive: true }));

    // Recognition → story → knowledge: the panel starts as a peek on each new place; leaning in opens it.
    const panel = () => document.getElementById('panel');
    const isDesk = () => innerWidth > 600;
    const peek = () => { const p = panel(); if (!p || !isDesk()) return; p.classList.add('peek'); p.scrollTop = 0; };
    const open = () => { const p = panel(); if (p) p.classList.remove('peek'); };
    addEventListener('tetol:place', peek);
    document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('#panel.peek')) { e.preventDefault(); e.stopPropagation(); open(); } }, true);
    document.addEventListener('focusin', (e) => { if (e.target.closest && e.target.closest('#panel')) open(); });
    let hoverT = 0;
    document.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest('#panel.peek')) { clearTimeout(hoverT); hoverT = setTimeout(open, 700); } });
    document.addEventListener('pointerout', (e) => { if (e.target.closest && e.target.closest('#panel')) clearTimeout(hoverT); });
    setTimeout(peek, 50);

    // Stillness: after a while without touching anything, the interface recedes and the world remains.
    let last = performance.now(), still = false;
    const wake = () => { last = performance.now(); if (still) { still = false; document.body.classList.add('g-waking'); document.body.classList.remove('g-still'); setTimeout(() => document.body.classList.remove('g-waking'), 500); threads(true); } };
    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
    addEventListener('tetol:intent', wake);
    document.addEventListener('pointerover', (e) => document.body.classList.toggle('g-reading', !!(e.target.closest && e.target.closest('#panel:not(.peek), #xpanel'))));
    setInterval(() => { if (!still && arrived && performance.now() - last > 12000 && !document.querySelector('.tetol-interior')) { still = true; document.body.classList.add('g-still'); threads(false); } }, 1000);

    // The relation lines are interface drawn in the sky: quieter always, gone when you are still.
    let TG = null;
    function threads(show) { whenTree(() => {
      if (!TG) { const s = document.querySelector('three-d-stage')._scene; TG = s.children.find((c) => c.type === 'Group' && c.children.length && c.children.every((l) => l.isLine)) || null; }
      if (TG) TG.visible = show;
    }); }
    whenTree(() => { const s = document.querySelector('three-d-stage')._scene;
      const tune = () => { const g = s.children.find((c) => c.type === 'Group' && c.children.length && c.children.every((l) => l.isLine)); if (g) { TG = g; g.children.forEach((l) => { if (l.material && !l.material.userData.g) { l.material.userData.g = 1; l.material.opacity = Math.min(l.material.opacity, 0.3); } }); } };
      addEventListener('tetol:place', () => setTimeout(tune, 200)); tune(); });
  }

  // Stillness is a valid state: the world may breathe, but the Wanderer's viewpoint never moves by itself.
  // (The prototype begins an idle orbit after 14 s; with P on its speed is held at zero. Wand/keyboard orbit still work.)
  if (G.P) whenTree((T) => { T.controls.autoRotateSpeed = 0; T.controls.autoRotate = false; });

  // ───────────────────────── TEST MODE (?test=1) ─────────────────────────
  // For a first-encounter human test: developer chrome out of sight, a fresh start for each participant.
  if (/[?&]test=1/.test(location.search)) {
    const css = document.createElement('style');
    css.textContent = `#brandline, #xbtn, #wandbtn, #reset, #motion, #wandcard, #wandpill { display: none !important; }`;
    document.head.appendChild(css);
    try { localStorage.removeItem('tetol-traces-v1'); } catch (e) {}
    if (location.hash) history.replaceState(null, '', location.pathname + location.search); // always begin at the whole Tree
  }

  // ───────────────────────── C · CROSSING ─────────────────────────
  if (G.C) {
    const css = document.createElement('style');
    css.textContent = `
      body.grace-c .tetol-interior { background: radial-gradient(ellipse at 50% 58%, #f3b56a 0%, #c9793a 26%, #4a2c17 62%, #15110c 100%); transition: opacity 1400ms ease; }
      body.grace-c .tetol-interior iframe { opacity: 0; transition: opacity 1600ms ease 500ms; }
      body.grace-c .tetol-interior.on iframe { opacity: 1; }`;
    document.head.appendChild(css);
    document.body.classList.add('grace-c');

    whenTree((T) => {
      const THREE = T.THREE, cam = T.cam, controls = T.controls;
      const door = T.tree.getObjectByName('roundhouse_door');
      if (!door || !window.TETOL_INTERIORS) return;
      const doorPose = () => { const p = new THREE.Vector3(), n = new THREE.Vector3(); door.getWorldPosition(p); door.getWorldDirection(n); n.y = 0; n.normalize(); return { p, n }; };
      let anim = null;
      function glide(toT, toP, dur, done) {
        controls.dispatchEvent({ type: 'start' }); // the prototype yields its own camera flight and idle drift
        const fT = controls.target.clone(), fP = cam.position.clone(), t0 = performance.now();
        if (reduce || dur <= 0) { controls.target.copy(toT); cam.position.copy(toP); controls.update(); done && done(); return; }
        anim = (now) => { const k = Math.min(1, (now - t0) / dur), e = ease(k);
          controls.target.lerpVectors(fT, toT, e); cam.position.lerpVectors(fP, toP, e); controls.update();
          if (k < 1) requestAnimationFrame(anim); else { anim = null; done && done(); } };
        requestAnimationFrame(anim);
      }
      // Approach → cross. Only for the Staff Room, the one interior that exists.
      const I = window.TETOL_INTERIORS, rawOpen = I.open, rawClose = I.close;
      let crossing = false;
      I.open = function (id) {
        if (id !== 'staffroom' || crossing || I.current()) return rawOpen.apply(this, arguments);
        crossing = true;
        const { p, n } = doorPose(), up = new THREE.Vector3(0, 1, 0);
        const lookAt = p.clone().add(up.clone().multiplyScalar(0.05));
        // 1. walk up to the door (eye height, facing it)
        glide(lookAt, p.clone().add(n.clone().multiplyScalar(0.75)).add(up.clone().multiplyScalar(0.16)), 1900, () => {
          // 2. lean through: the door's light fills the view as the room fades up behind it
          glide(lookAt, p.clone().add(n.clone().multiplyScalar(0.12)).add(up.clone().multiplyScalar(0.06)), 1100, null);
          setTimeout(() => { rawOpen.call(I, id); quietVeil(); crossing = false; }, reduce ? 0 : 450);
        });
        return true;
      };
      // Inside the roundhouse, its own "The Staff Room" title card is unnecessary: you walked in.
      function quietVeil() { const f = document.querySelector('.tetol-interior iframe'); if (!f) return;
        const fix = () => { try { const v = f.contentDocument && f.contentDocument.getElementById('veil'); if (v) { v.style.background = 'transparent'; const t = v.querySelector('div'); if (t) t.textContent = ''; } } catch (e) {} };
        f.addEventListener('load', () => { fix(); setTimeout(fix, 60); }); }
      // Return: step out of the door and see the Tree — returning is not the same as arriving.
      I.close = function (then) {
        const c = I.current();
        if (!c || c.id !== 'staffroom') return rawClose.apply(this, arguments);
        const { p, n } = doorPose(), up = new THREE.Vector3(0, 1, 0);
        controls.target.copy(p); cam.position.copy(p.clone().add(n.clone().multiplyScalar(0.18)).add(up.clone().multiplyScalar(0.08))); controls.update();
        return rawClose.call(this, () => {
          if (then) return then(); // a passage hand-off (e.g. into Heartwood) takes its own path
          // step just outside, turn to face the whole Tree, pause, then let the place settle
          const treeT = new THREE.Vector3(0, 2.6, 0), out = p.clone().add(n.clone().multiplyScalar(0.55)).add(up.clone().multiplyScalar(0.34));
          const back = out.clone().sub(treeT).setY(0).normalize(); // stand with the door behind you
          glide(treeT, out.add(back.multiplyScalar(0.35)), 2000, () => setTimeout(() => document.getElementById('reset')?.click(), reduce ? 0 : 1600));
        });
      };
    });
  }

  // ───────────────────────── T · TRACES ─────────────────────────
  if (G.T) {
    const KEY = 'tetol-traces-v1';
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
    const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
    let traces = load();
    document.addEventListener('click', (e) => { if (e.target.id === 'forgettraces') { traces = {}; save(traces); embers.forEach((m) => m.parent && m.parent.remove(m)); embers.clear(); e.target.textContent = 'Traces forgotten'; } });
    const embers = new Map();
    whenTree((T) => {
      const THREE = T.THREE, scene = document.querySelector('three-d-stage')._scene;
      const base = scene.children.find((c) => c.isSprite && c.material && c.material.map); // the prototype's own soft glow
      if (!base) return;
      const ember = (id, pos, n) => {
        let s = embers.get(id);
        if (!s) { s = base.clone(); s.material = base.material.clone(); s.material.color = new THREE.Color(0xffa04a); s.renderOrder = 3; scene.add(s); embers.set(id, s); }
        s.position.set(pos[0], pos[1], pos[2]);
        const w = Math.min(1, 0.45 + 0.18 * Math.log2(1 + n)); s.userData.w = w; s.scale.setScalar(0.16 + 0.08 * w); s.material.opacity = 0.4 * w;
      };
      Object.entries(traces).forEach(([id, v]) => v.p && ember(id, v.p, v.n));
      // an ember breathes only slowly, and not at all when motion is reduced
      if (!reduce) { const b = (t) => { embers.forEach((s, id) => { s.material.opacity = 0.4 * (s.userData.w || 0.5) * (0.75 + 0.25 * Math.sin(t / 3700 + id.length)); }); requestAnimationFrame(b); }; requestAnimationFrame(b); }
      // Record a visit once the camera has settled at a place (its focus becomes the ember's home).
      let settleT = 0, pending = null;
      addEventListener('tetol:place', () => {
        const w0 = window.TETOL_NAV && window.TETOL_NAV.where(); const key = w0 && (w0.kind + w0.id);
        if (key && key === pending) return; // repeated notices for the same place do not restart the clock
        pending = key; clearTimeout(settleT);
        settleT = setTimeout(() => { pending = null;
          const w = window.TETOL_NAV && window.TETOL_NAV.where(); if (!w || w.id === 'overview') return;
          const id = w.kind === 'interior' ? 'interior:' + w.id : w.id;
          let p;
          if (w.kind === 'interior') { const d = T.tree.getObjectByName('roundhouse_door'); if (!d) return; const v = new THREE.Vector3(); d.getWorldPosition(v); p = [v.x, v.y + 0.02, v.z]; }
          else { // the foot of the place itself (its own geometry), not wherever the camera happens to look
            const box = new THREE.Box3(); let any = false;
            T.tree.traverse((o) => { if (o.isMesh && o.userData.node === w.id) { box.expandByObject(o); any = true; } });
            if (any) { const c = box.getCenter(new THREE.Vector3()); p = [c.x, box.min.y + 0.03, c.z]; }
            else { const t = T.controls.target; p = [t.x, t.y, t.z]; } }
          const now = Date.now(), prev = traces[id];
          // a return counts once per few minutes, so lingering is not the same as returning
          const n = prev ? prev.n + (now - prev.last > 5 * 60 * 1000 ? 1 : 0) : 1;
          traces[id] = { n, last: now, first: prev ? prev.first : now, p: prev && prev.p ? prev.p : p };
          save(traces); ember(id, traces[id].p, n);
        }, 3200);
      });
    });
    window.TETOL_TRACES = { all: () => ({ ...traces }) };
  }
})();

;
// TETOL · overnight polish candidate (25 Sep 2026). EXPERIMENT · NOT CANONICAL · NOT DEPLOYED.
// Layered over the human-test baseline (Presence First + Crossing, Traces off). The baseline file is not changed.
// Every change is switchable so each can be kept or reverted on evidence: ?polish=<letters>, default all, ?polish=none = baseline.
//   Q  QUIETER: the current place's floating label, the relation lines and the header step back; the name card
//      arrives once the camera has settled; the one-time hint leaves.
//   D  DOOR APPROACH: arriving at the roundhouse, you come toward its door (the door faces the Tree), not its side.
//   X  CROSSING: a breath at the threshold; the door's own light rises as you come near; returning, you step out,
//      turn toward the Tree and stay facing it (no second turn back to the roundhouse).
// And one NON-INTEGRATED study, off unless asked for: ?study=descent (see the end of this file).
(() => {
  const q = new URLSearchParams(location.search);
  const P = q.get('polish'), ON = P == null ? 'Q' : P === 'none' ? '' : P.toUpperCase();
  const F = { Q: ON.includes('Q'), D: ON.includes('D'), X: ON.includes('X') };
  window.TETOL_POLISH = F;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const whenTree = (fn) => { const t = () => (window.__tetol && window.__tetol.controls && window.TETOL_NAV ? fn(window.__tetol) : setTimeout(t, 120)); t(); };
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const here = () => (window.TETOL_NAV ? window.TETOL_NAV.where() : { kind: 'tree', id: 'overview' });

  // ───────── Q · QUIETER ─────────
  if (F.Q) {
    const css = document.createElement('style');
    css.textContent = `
      /* the card already names the place: its floating label need not repeat it */
      body.polish-q .labels .lab[aria-current="true"] { opacity: 0 !important; pointer-events: none; }
      /* the header rests quietly and wakes under the hand */
      @media (min-width: 601px) { body.polish-q #hdr { opacity: .5; transition: opacity .6s ease; } body.polish-q #hdr:hover, body.polish-q #hdr:focus-within { opacity: 1; } }
      /* the name card arrives after the place does */
      @keyframes polishArrive { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      body.polish-q aside#panel.peek.p-arrive { animation: polishArrive 900ms ease 650ms both; }
      body.polish-q #hint.p-gone { opacity: 0 !important; transition: opacity 1.2s ease; }
      @media (prefers-reduced-motion: reduce) { body.polish-q aside#panel.peek.p-arrive { animation: none; } }`;
    document.head.appendChild(css);
    document.body.classList.add('polish-q');
    addEventListener('tetol:place', () => { const p = document.getElementById('panel'); if (!p) return; p.classList.remove('p-arrive'); void p.offsetWidth; p.classList.add('p-arrive'); });
    setTimeout(() => document.getElementById('hint')?.classList.add('p-gone'), 9000);
    // relation lines are knowledge: shown only once the Wanderer has leaned in (full card open)
    whenTree(() => {
      const scene = document.querySelector('three-d-stage')._scene;
      const lines = () => scene.children.find((c) => c.type === 'Group' && c.children.length && c.children.every((l) => l.isLine));
      const sync = () => { const g = lines(); if (!g) return; const open = !!document.querySelector('#panel:not(.peek)') && !document.body.classList.contains('g-still'); g.visible = open; };
      setInterval(sync, 400); addEventListener('tetol:place', () => setTimeout(sync, 60));
    });
  }

  // shared: a gentle camera glide that the prototype yields to (same mechanism as the Crossing)
  let anim = 0;
  function glide(T, toT, toP, dur, done) {
    const cam = T.cam, c = T.controls; c.dispatchEvent({ type: 'start' });
    const fT = c.target.clone(), fP = cam.position.clone(), t0 = performance.now(), id = ++anim;
    if (reduce || dur <= 0) { c.target.copy(toT); cam.position.copy(toP); c.update(); done && done(); return; }
    const step = (now) => { if (id !== anim) return; const k = Math.min(1, (now - t0) / dur), e = ease(k);
      c.target.lerpVectors(fT, toT, e); cam.position.lerpVectors(fP, toP, e); c.update(); if (k < 1) requestAnimationFrame(step); else done && done(); };
    requestAnimationFrame(step);
  }
  const doorPose = (T) => { const d = T.tree.getObjectByName('roundhouse_door'); if (!d) return null;
    const p = new T.THREE.Vector3(), n = new T.THREE.Vector3(); d.getWorldPosition(p); d.getWorldDirection(n); n.y = 0; n.normalize(); return { p, n }; };

  // ───────── D · DOOR APPROACH ─────────
  if (F.D) whenTree((T) => {
    const V = (x, y, z) => new T.THREE.Vector3(x, y, z);
    let skip = false;
    addEventListener('tetol:crossing-return', () => { skip = true; setTimeout(() => (skip = false), 6000); });
    addEventListener('tetol:place', () => {
      const w = here(); if (w.kind !== 'tree' || w.id !== 'staff' || skip) return;
      const d = doorPose(T); if (!d) return;
      // stand off the door along its own direction, turned a little toward the open ground, at a walker's height
      const a = 0.55, n = d.n.clone().applyAxisAngle(V(0, 1, 0), a);
      const toP = d.p.clone().add(n.multiplyScalar(2.3)).add(V(0, 0.62, 0));
      const toT = d.p.clone().add(V(0, 0.22, 0)).add(d.n.clone().multiplyScalar(-0.35)); // the door, and the room behind it
      setTimeout(() => { if (here().id === 'staff' && !document.querySelector('.tetol-interior')) glide(T, toT, toP, 2600); }, 80);
    });
  });

  // ───────── X · CROSSING REFINEMENT ─────────
  if (F.X) whenTree((T) => {
    const I = window.TETOL_INTERIORS; if (!I) return;
    // the door's own light (an existing point light just inside it) rises as you come near
    let doorLight = null; document.querySelector('three-d-stage')._scene.traverse((o) => { if (o.isPointLight && o.color.getHex() === 0xff9a3c && o.distance < 1) doorLight = o; });
    const base = doorLight ? doorLight.intensity : 0;
    const ramp = (to, dur) => { if (!doorLight) return; const from = doorLight.intensity, t0 = performance.now();
      const s = (now) => { const k = Math.min(1, (now - t0) / (reduce ? 1 : dur)); doorLight.intensity = from + (to - from) * ease(k); if (k < 1) requestAnimationFrame(s); }; requestAnimationFrame(s); };
    const open0 = I.open, close0 = I.close;
    I.open = function (id) {
      if (id === 'staffroom' && !I.current()) { ramp(base * 3.4, 2400); setTimeout(() => ramp(base, 1200), 6000); }
      // a breath at the threshold before leaning through
      if (id === 'staffroom' && !I.current() && !reduce) { const args = arguments, self = this; setTimeout(() => open0.apply(self, args), 450); return true; }
      return open0.apply(this, arguments);
    };
    I.close = function (then) {
      const c = I.current(); if (!c || c.id !== 'staffroom' || then) return close0.apply(this, arguments);
      dispatchEvent(new CustomEvent('tetol:crossing-return'));
      // hide the Grace-pass "reset to the side view" after stepping out: stay facing the Tree
      const reset = document.getElementById('reset'); const click0 = reset && reset.click;
      if (reset) reset.click = function () { reset.click = click0; const d = doorPose(T); if (!d) return; const V = T.THREE.Vector3;
        glide(T, new V(0, 2.3, 0), d.p.clone().add(d.n.clone().multiplyScalar(1.25)).add(new V(0, 0.9, 0)), 2200); };
      return close0.apply(this, arguments);
    };
  });

  // ───────── STUDY · ROOT DESCENT (?study=descent) · PROPOSED · NON-INTEGRATED ─────────
  // Asks one question: could Heartwood naturally descend into the Roots from here?
  // Beneath the existing h_friends opening in the growth-ring floor: the roots continue DOWN, the walls close in,
  // and a faint living light comes from below. No cave scenery, no Cavern, no navigation, not approved.
  if (q.get('study') === 'descent') whenTree((T) => {
    const THREE = T.THREE, scene = document.querySelector('three-d-stage')._scene;
    const rim = scene.getObjectByName('h_friends_opening'); if (!rim) return;
    const c = rim.getWorldPosition(new THREE.Vector3());
    let bark = null; scene.traverse((o) => { if (!bark && o.isMesh && o.material && /bark/i.test(o.material.name || '')) bark = o.material; });
    const wall = new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 1, side: THREE.BackSide });
    const g = new THREE.Group(); g.name = 'STUDY_root_descent_nonintegrated'; g.position.copy(c); scene.add(g);
    // the shaft narrows as it goes down: the Tree's own wood giving way to earth
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.9, 5.5, 28, 1, true), wall); shaft.position.y = -2.75; g.add(shaft);
    // roots from the hollow's floor curling over the lip and continuing down
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4, r0 = 0.95, r1 = 0.55 + (i % 3) * 0.08;
      const pts = [new THREE.Vector3(Math.cos(a) * (r0 + 0.5), 0.03, Math.sin(a) * (r0 + 0.5)), new THREE.Vector3(Math.cos(a) * r0, 0.02, Math.sin(a) * r0),
        new THREE.Vector3(Math.cos(a + 0.2) * r1, -1.4, Math.sin(a + 0.2) * r1), new THREE.Vector3(Math.cos(a + 0.5) * (r1 - 0.1), -3.6, Math.sin(a + 0.5) * (r1 - 0.1))];
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.05 - (i % 3) * 0.008, 8), bark || wall);
      g.add(tube);
    }
    // living light from below, in the prototype's existing root colour
    const below = new THREE.PointLight(0x9fe07a, 1.4, 6, 1.6); below.position.set(0, -4.2, 0); g.add(below);
    window.TETOL_STUDY = { descent: g, lookDown: () => { const V = THREE.Vector3; glide(T, c.clone().add(new V(0, -1.2, 0)), c.clone().add(new V(2.2, 2.1, 0.8)), 2200); } };
  });
})();

;
// S33D Entity Contract · Ancient Friend · v0 (PROPOSED · for TEOTAG · not canonical)
// ONE shape for an Ancient Friend, whatever the adapter: snapshot or live.
//
// The record body is the SAME shape as `AncientFriend` in the S33D repo's experimental bridge
// (S33D-life/ancient-roots-map · branch claude/wonderful-carson-7s5m5r · src/tetol-bridge/s33dDataAdapter.ts),
// field for field and mapped the same way from a `public.trees` row, so TETOL and the bridge do not become two systems.
// This contract only ADDS a small envelope: `contract`, `canonicalUrl`, `retrieval`, `recordStatus`.
//
// Rules:
//  - Read-only. Nothing here writes anywhere.
//  - No correction, no de-duplication, no merging of records on ingestion. Values are carried as found.
//    (A tree the database itself has merged is followed by the live bridge and reported in `mergedFrom`; nothing is hidden.)
//  - `spatialAddress` comes from ONE registry, supplied by the consumer (TETOL: window.TETOL_ROUTES), for every adapter,
//    so spatial code never sees a different address because the record came from a different source.
(() => {
  const CONTRACT = 's33d.ancient-friend/0';
  const APP = 'https://www.s33d.life';
  const route = (id) => `/tree/${id}`; // = ROUTES.TREE in src/lib/routes.ts

  // The bridge's FRIEND_DETAIL_COLUMNS: the projection kept in a snapshot. Anything else in a raw row is not carried.
  const DETAIL_COLUMNS = ['id', 'name', 'species', 'species_key', 'latitude', 'longitude', 'nation', 'state', 'bioregion',
    'estimated_age', 'age_min', 'age_max', 'age_confidence', 'girth_cm', 'description', 'lore_text', 'what3words',
    'photo_thumb_url', 'photo_processed_url', 'source_name', 'source_url', 'location_confidence', 'merged_into_tree_id', 'updated_at'];
  // Status fields the envelope reads when the source provides them (the bridge does not select these yet).
  const STATUS_COLUMNS = ['accessibility_tier', 'photo_status', 'age_source', 'refinement_count'];

  // Mirrors toSummary() + getAncientFriend() in s33dDataAdapter.ts.
  function fromTreesRow(row, { addressFor, retrieval, mergedFrom = null }) {
    const canonicalRoute = route(row.id);
    const has = (k) => Object.prototype.hasOwnProperty.call(row, k);
    return {
      contract: CONTRACT,
      kind: 'ancient_friend',
      id: row.id,
      name: row.name,
      species: row.species,
      speciesKey: row.species_key ?? null,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      nation: row.nation ?? null,
      estimatedAge: row.estimated_age ?? null,
      thumbnailUrl: row.photo_thumb_url ?? null,
      canonicalRoute,
      canonicalUrl: APP + canonicalRoute,
      spatialAddress: addressFor(canonicalRoute),
      provenance: [{ source: 'supabase', location: 'public.trees', sourceId: row.id, revision: row.updated_at ?? null }],
      state: row.state ?? null,
      bioregion: row.bioregion ?? null,
      ageRange: { min: row.age_min ?? null, max: row.age_max ?? null, confidence: row.age_confidence ?? null },
      girthCm: row.girth_cm ?? null,
      description: row.description ?? null,
      lore: row.lore_text ?? null,
      what3words: row.what3words ?? null,
      photoUrl: row.photo_processed_url ?? row.photo_thumb_url ?? null,
      externalSource: { name: row.source_name ?? null, url: row.source_url ?? null },
      locationConfidence: row.location_confidence ?? null,
      mergedFrom,
      retrieval: { ...retrieval },
      recordStatus: Object.fromEntries(STATUS_COLUMNS.map((k) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), has(k) ? row[k] : null])),
    };
  }

  // A bridge AncientFriend (live) → the same contract. Only the envelope is added; the body is taken as given.
  function fromBridgeFriend(f, { addressFor, retrieval }) {
    return { contract: CONTRACT, ...f, canonicalUrl: APP + f.canonicalRoute, spatialAddress: addressFor(f.canonicalRoute),
      retrieval: { ...retrieval }, recordStatus: { accessibilityTier: null, photoStatus: null, ageSource: null, refinementCount: null } };
  }

  const REQUIRED = ['contract', 'kind', 'id', 'name', 'canonicalRoute', 'canonicalUrl', 'spatialAddress', 'provenance', 'retrieval'];
  function validate(r) {
    const p = [];
    for (const k of REQUIRED) if (r == null || r[k] == null || r[k] === '') p.push(`missing ${k}`);
    if (r) {
      if (r.contract !== CONTRACT) p.push(`contract is ${r.contract}, expected ${CONTRACT}`);
      if (r.kind !== 'ancient_friend') p.push(`kind is ${r.kind}`);
      if (r.canonicalRoute !== route(r.id)) p.push('canonicalRoute does not match id');
      if (!Array.isArray(r.provenance) || !r.provenance.length) p.push('no provenance');
      if (r.retrieval && !['snapshot', 'live'].includes(r.retrieval.adapter)) p.push('retrieval.adapter must be snapshot | live');
      if (r.retrieval && !r.retrieval.fetchedAt) p.push('missing retrieval.fetchedAt');
    }
    return p;
  }


  // Claims view: the record re-stated as separate kinds of statement, never merged or reconciled.
  //   recorded  · a value held in a structured field (e.g. estimated_age)
  //   range     · the structured range fields (age_min / age_max / age_confidence), which may be empty
  //   described · free text written in the record (quoted, never parsed into values)
  //   status    · evidence / access / confidence fields about the record itself
  //   source    · where this copy came from
  // Presentation decides what to show; nothing here chooses between conflicting statements.
  function claimsOf(r) {
    const c = [], add = (group, kind, label, value, note) => c.push({ group, kind, label, value: value == null || value === '' ? null : value, note: note || null });
    add('identity', 'recorded', 'Name', r.name);
    add('identity', 'recorded', 'Species', r.species, r.speciesKey ? 'species key: ' + r.speciesKey : null);
    add('place', 'recorded', 'Place', [r.state, r.nation].filter(Boolean).join(', ') || null);
    add('place', 'recorded', 'Coordinates', r.latitude != null ? `${r.latitude}, ${r.longitude}` : null);
    add('place', 'status', 'Location confidence', r.locationConfidence);
    add('place', 'recorded', 'what3words', r.what3words ? '///' + r.what3words : null);
    add('age', 'recorded', 'Estimated age (recorded value)', r.estimatedAge != null ? `${r.estimatedAge} years` : null);
    add('age', 'range', 'Age range (recorded)', r.ageRange && (r.ageRange.min != null || r.ageRange.max != null) ? `${r.ageRange.min ?? '?'}–${r.ageRange.max ?? '?'} years` : null, r.ageRange && r.ageRange.confidence ? 'confidence: ' + r.ageRange.confidence : null);
    add('age', 'status', 'Age source', r.recordStatus && r.recordStatus.ageSource);
    add('words', 'described', 'Description (as written)', r.description);
    add('words', 'described', 'Lore (as written)', r.lore);
    add('evidence', 'status', 'Photograph', r.recordStatus && r.recordStatus.photoStatus, r.photoUrl ? null : 'no photograph on the record');
    add('evidence', 'status', 'Access', r.recordStatus && r.recordStatus.accessibilityTier);
    add('evidence', 'status', 'External source', r.externalSource && (r.externalSource.name || r.externalSource.url));
    add('evidence', 'status', 'Merged from', r.mergedFrom);
    const p = r.provenance && r.provenance[0], ret = r.retrieval || {};
    add('source', 'source', 'Record', p ? `${p.location} · ${p.sourceId}` : null, p && p.revision ? 'revised ' + p.revision : null);
    add('source', 'source', 'This copy', ret.adapter === 'snapshot' ? `snapshot ${ret.snapshotId}` : ret.adapter ? 'live read' : null, ret.fetchedAt ? 'read ' + ret.fetchedAt : null);
    return c;
  }

  window.S33D_FRIEND_CONTRACT = { CONTRACT, APP, DETAIL_COLUMNS, STATUS_COLUMNS, route, fromTreesRow, fromBridgeFriend, validate, claimsOf };
})();

;
// TETOL · Ancient Friends data adapters (PROPOSED · experiment · not canonical)
// Two adapters, ONE interface. Spatial code calls only:
//    adapter.getAncientFriend(id) → Promise<contract record | null>
//    adapter.describe()           → { adapter, source }
// and never needs to know which one it holds.
//
//   snapshotAdapter: a dated, provenanced snapshot embedded in the page (window.S33D_SNAPSHOTS). Offline, stable. DEFAULT.
//   liveAdapter:     reads the live record, read-only. Prefers the S33D bridge (createBridge from s33d-bridge.js) if the page
//                    has loaded it; otherwise the public Root System API (GET /api/v1/trees/{id}). Never writes, never signs in.
(() => {
  const C = window.S33D_FRIEND_CONTRACT;
  const addressFor = (r) => {
    const x = window.TETOL_ROUTES && window.TETOL_ROUTES.resolve(r);
    return x && x.address && !x.address.includes(':') ? x.address : null;
  };

  function createSnapshotAdapter(snapshots = window.S33D_SNAPSHOTS || []) {
    const index = new Map();
    for (const s of snapshots) for (const e of s.records) index.set(e.row.id, { s, e });
    return {
      describe: () => ({ adapter: 'snapshot', source: snapshots.map((s) => s.snapshotId).join(', ') || 'none' }),
      async getAncientFriend(id) {
        const hit = index.get(id); if (!hit) return null;
        const { s, e } = hit;
        return C.fromTreesRow(e.row, { addressFor, retrieval: {
          adapter: 'snapshot', snapshotId: s.snapshotId, fetchedAt: e.fetchedAt, via: e.via, rawSha256: e.rawSha256, capturedBy: s.capturedBy } });
      },
    };
  }

  function createLiveAdapter({ bridge = window.S33D_BRIDGE, api = 'https://mwzcuczfedrjplndggiv.supabase.co/functions/v1/api-gateway' } = {}) {
    return {
      describe: () => ({ adapter: 'live', source: bridge ? 's33d-bridge (read-only Supabase client)' : 'Root System API · ' + api }),
      async getAncientFriend(id) {
        const fetchedAt = new Date().toISOString();
        if (bridge) {
          const f = await bridge.data.getAncientFriend(id);
          return f ? C.fromBridgeFriend(f, { addressFor, retrieval: { adapter: 'live', fetchedAt, via: 's33d-bridge getAncientFriend' } }) : null;
        }
        const res = await fetch(`${api}/api/v1/trees/${encodeURIComponent(id)}`, { method: 'GET', credentials: 'omit' });
        if (!res.ok) return null;
        const body = await res.json(); const row = body && body.data; if (!row) return null;
        const projected = Object.fromEntries([...C.DETAIL_COLUMNS, ...C.STATUS_COLUMNS].filter((k) => k in row).map((k) => [k, row[k]]));
        // A merged row is reported, not silently followed: the live API gives the row as stored.
        return C.fromTreesRow(projected, { addressFor, retrieval: { adapter: 'live', fetchedAt, via: 'api-gateway GET /api/v1/trees/{id}' } });
      },
    };
  }

  window.TETOL_FRIENDS = { createSnapshotAdapter, createLiveAdapter };
})();

;
// Generated by make-snapshot.py. Do not edit by hand.
(window.S33D_SNAPSHOTS ||= []).push({"snapshotId": "s33d-friends-2026-09-25", "contract": "s33d.ancient-friend/0", "capturedBy": "Claude (TETOL handshake), read-only", "note": "Projection of the bridge FRIEND_DETAIL_COLUMNS plus status columns. Values as found: nothing corrected, merged or de-duplicated.", "records": [{"rawFile": "b446bb88-5d81-4748-9d04-ff0b6d25feeb.raw.json", "rawSha256": "122611787b2cef36649fa49467eafa94e13ef6e5d6bcf62c00dae38de2c7b2ca", "fetchedAt": "2026-09-25T05:38:28.813Z", "via": "api-gateway GET /api/v1/trees/{id} (public, read-only, no key), from Ed's browser", "row": {"id": "b446bb88-5d81-4748-9d04-ff0b6d25feeb", "name": "Major Oak", "species": "Quercus robur", "species_key": "quercus-robur", "latitude": 53.2043, "longitude": -1.0722, "nation": "England", "state": "Nottinghamshire", "bioregion": null, "estimated_age": 1000, "age_min": null, "age_max": null, "age_confidence": null, "girth_cm": null, "description": "Legendary oak in Sherwood Forest, Nottinghamshire. Estimated at 800-1,000 years old, famously linked to Robin Hood. Weighs an estimated 23 tonnes.", "lore_text": null, "what3words": "forest.richer.glory", "photo_thumb_url": null, "photo_processed_url": null, "source_name": null, "source_url": null, "location_confidence": "approximate", "merged_into_tree_id": null, "updated_at": "2026-04-11T13:06:30.003212+00:00", "accessibility_tier": "public", "photo_status": "none", "age_source": null, "refinement_count": 0}}]});

;
// TETOL 0.9.4-dev · DATA HANDSHAKE (?next=handshake) · EXPERIMENT · NOT CANONICAL · NOT THE CAVERN
// Proves one path end to end, and nothing more:
//   one real Ancient Friend → stable S33D id → dated/provenanced snapshot → adapter → one spatial representation.
// Without ?next=handshake this file does nothing, and the build behaves exactly like the working prototype.
// ?adapter=live swaps the snapshot for the live read-only source. The spatial code below is identical either way.
(() => {
  const q = new URLSearchParams(location.search);
  if (!(q.get('next') || '').split(',').includes('handshake')) return;
  if ((q.get('next') || '').split(',').includes('roots')) return; // superseded by the Roots slice; the technical root-tip is not shown there
  const D = window.TETOL, C = window.S33D_FRIEND_CONTRACT, F = window.TETOL_FRIENDS;
  if (!D || !C || !F) return;

  // ── Spatial side: WHERE a Friend is shown. Keyed by S33D id; knows nothing about the record's contents.
  //    Illustrative spot at the end of a root on the far side of the Tree from the Yew; the Heartwood floor opening is not touched.
  const PLACEMENTS = {
    'b446bb88-5d81-4748-9d04-ff0b6d25feeb': { anchor: [-2.35, 0.14, -1.35], view: [[-2.2, 0.35, -1.25], [-4.3, 1.55, 0.9]] },
  };
  const nodeIdFor = (id) => 'af_' + id.slice(0, 8);

  // ── Data side: WHICH adapter. The spatial code only ever calls adapter.getAncientFriend(id).
  const adapter = q.get('adapter') === 'live' ? F.createLiveAdapter() : F.createSnapshotAdapter();

  const ext = (D.ext ||= { anchors: {}, views: {} });
  const find = (list, id) => { for (const x of list || []) { if (x.id === id) return x; const y = find(x.children, id); if (y) return y; } return null; };
  const state = { adapter: adapter.describe(), records: {}, problems: {} };
  window.TETOL_HANDSHAKE = state;

  for (const [entityId, P] of Object.entries(PLACEMENTS)) {
    const nid = nodeIdFor(entityId);
    ext.anchors[nid] = P.anchor; ext.views[nid] = P.view;
    // Placeholder until the record arrives (the snapshot arrives before the Tree is built; a live read may arrive after).
    D.nodes[nid] = { name: 'An Ancient Friend', sub: 'Record arriving…', part: 'In the Roots', practical: 'A real Ancient Friend from S33D.life',
      parent: 'roots', spatial: true, scale: 'record', status: 'CONNECTED', statusNote: 'Waiting for its record.', placement: 'PROPOSED',
      placementNote: 'Illustrative spot on this model.', where: [], actions: [], lives: [], relations: [{ to: 'roots', dim: 'place', text: 'Where Ancient Friends are met' }], notes: [], sources: [] };
    const roots = D.nodes.roots; if (roots) roots.relations = [...(roots.relations || []), { to: nid, dim: 'place', text: 'One real Ancient Friend, read from its S33D record' }];
    const lr = find(D.listTree, 'roots'); if (lr) (lr.children ||= []).push({ id: nid });

    adapter.getAncientFriend(entityId).then((r) => {
      const problems = r ? C.validate(r) : ['no record returned'];
      state.records[entityId] = r; state.problems[entityId] = problems;
      if (!r) { D.nodes[nid].statusNote = 'No record returned by the ' + state.adapter.adapter + ' adapter.'; D.nodes[nid].status = 'UNRESOLVED'; return; }
      const place = [r.state, r.nation].filter(Boolean).join(', ');
      const ret = r.retrieval;
      Object.assign(D.nodes[nid], {
        name: r.name,
        sub: 'An Ancient Friend',
        part: 'In the Roots · ' + r.species,
        practical: [r.species, place].filter(Boolean).join(' · '),
        purpose: r.description ? `The S33D record says: “${r.description}”` : 'The S33D record has no description yet.',
        location: 'At the end of a root. Its real place: ' + (place || 'not recorded') + (r.latitude != null ? ` (${r.latitude}, ${r.longitude}; location ${r.locationConfidence || 'confidence not recorded'})` : ''),
        status: 'LIVE', statusNote: 'A real record on S33D.life, shown as found. Nothing here is corrected or merged.',
        placement: 'PROPOSED', placementNote: 'Where it sits on this model is illustrative, not its real position.',
        where: [
          { k: 'S33D record', v: r.canonicalRoute, status: 'LIVE' },
          { k: 'Spatial address', v: r.spatialAddress || 'none in the registry', status: 'PROPOSED' },
          { k: 'Read from', v: ret.adapter === 'snapshot' ? `Snapshot ${ret.snapshotId} · captured ${ret.fetchedAt}` : `Live · ${ret.via} · ${ret.fetchedAt}`, status: ret.adapter === 'snapshot' ? 'CONNECTED' : 'LIVE' },
          { k: 'Provenance', v: r.provenance.map((p) => `${p.location} · ${p.sourceId}${p.revision ? ' · rev ' + p.revision : ''}`).join('; '), status: 'LIVE' },
        ],
        lives: [
          r.estimatedAge != null ? { text: `Estimated age in the record: ${r.estimatedAge} years`, status: 'LIVE' } : null,
          r.what3words ? { text: 'what3words: ///' + r.what3words, status: 'LIVE' } : null,
        ].filter(Boolean),
        actions: [{ label: 'Visit its record on S33D.life', sub: 'Opens ' + r.canonicalUrl, href: r.canonicalUrl }],
        sources: ['S33D.life · ' + r.provenance[0].location + ' · ' + r.id, ret.adapter === 'snapshot' ? `snapshot ${ret.snapshotId} · sha256 ${String(ret.rawSha256).slice(0, 12)}…` : 'live read, ' + ret.fetchedAt],
        entity: { id: r.id, contract: r.contract },
      });
      // If the Tree already drew a placeholder label (live read arriving late), refresh it.
      const lab = document.querySelector(`.labels .lab[data-go="${nid}"] b`); if (lab) lab.textContent = r.name;
      if (window.TETOL_NAV && window.TETOL_NAV.where().id === nid && window.__tetol && window.__tetol.renderPanel) window.__tetol.renderPanel();
    });
  }

  // ── The one spatial representation: a root-end that glows faintly, in the prototype's own root colour. No tree model.
  const whenTree = (fn) => { const t = () => (window.__tetol && window.__tetol.controls ? fn(window.__tetol) : setTimeout(t, 150)); t(); };
  whenTree((T) => {
    const THREE = T.THREE, scene = document.querySelector('three-d-stage')._scene;
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1c, roughness: 1 });
    for (const [entityId, P] of Object.entries(PLACEMENTS)) {
      const g = new THREE.Group(); g.name = 'HANDSHAKE_friend_' + entityId; const [x, y, z] = P.anchor;
      // a root leaving the trunk base, running low over the ground and surfacing where the Friend is held
      const pts = [new THREE.Vector3(x * 0.22, 0.0, z * 0.22), new THREE.Vector3(x * 0.5, 0.035, z * 0.46), new THREE.Vector3(x * 0.8, 0.01, z * 0.84), new THREE.Vector3(x * 0.97, 0.03, z * 0.99), new THREE.Vector3(x, y - 0.07, z)];
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.026, 8), rootMat));
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshStandardMaterial({ color: 0x9fe07a, emissive: 0x9fe07a, emissiveIntensity: 0.6, roughness: 0.6 }));
      tip.position.set(x, y - 0.05, z); g.add(tip);
      const light = new THREE.PointLight(0x9fe07a, 0.35, 1.0, 2); light.position.set(x, y + 0.05, z); g.add(light);
      scene.add(g);
    }
  });
})();

;
// TETOL 0.9.5-coverage copy of the 0.9.4-dev Roots slice. Adds only: the Quest Cave doorway off the Cavern chamber, and the Friend's live handoffs (offerings, whispers, visits, add a tree, the map, the gallery) in its record.
// TETOL 0.9.4-dev · FIRST ROOTS VERTICAL SLICE (?next=roots) · EXPERIMENT · NOT CANONICAL · NOT DEPLOYED
//   HEARTWOOD → the Ancient Friends arch (the rimmed opening at the foot of the wall) → ROOT DESCENT
//   → the first ANCIENT FRIENDS CAVERN chamber → Major Oak → return to HEARTWOOD.
// One chamber, one Friend. The Wanderer moves the camera; nothing moves it for them.
//   down / up : scroll, ↓ ↑ (or PageDown / PageUp, S / W), or the ▾ ▴ controls · drag : look · Esc : back toward Heartwood
// Without ?next=roots this file does nothing.
(() => {
  const q = new URLSearchParams(location.search);
  if (!(q.get('next') || window.TETOL_DEFAULT_NEXT || '').split(',').includes('roots')) return; // an artifact cannot pass ?next=, so its build sets TETOL_DEFAULT_NEXT
  const D = window.TETOL, C = window.S33D_FRIEND_CONTRACT, F = window.TETOL_FRIENDS;
  if (!D || !C || !F) return;
  const FRIEND_ID = 'b446bb88-5d81-4748-9d04-ff0b6d25feeb'; // Major Oak · first technical fixture (TEOTAG)
  const ext = (D.ext ||= { anchors: {}, views: {} });

  // ── Heartwood entry: the Ancient Friends arch now leads down (placed first, so it is the arch's one clear action).
  const hf = D.nodes.h_friends;
  if (hf) {
    hf.actions = [{ label: 'Go down through the roots', sub: 'Beneath Heartwood', go: '@roots' }, ...(hf.actions || []).filter((a) => a.go !== 'roots')];
    hf.relations = (hf.relations || []).filter((r) => r.to !== 'roots');
  }

  // ── Data: the same adapter interface as the handshake. The scene below only calls getAncientFriend.
  const adapter = q.get('adapter') === 'live' ? F.createLiveAdapter() : F.createSnapshotAdapter();
  let friend = null;
  adapter.getAncientFriend(FRIEND_ID).then((r) => { friend = r; state.problems = r ? C.validate(r) : ['no record']; if (built) fillRecord(); });

  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('still');
  const state = { active: false, t: 0, tTarget: 0, recognised: false, dwell: 0, sheet: false, problems: null, adapter: adapter.describe() };
  let built = false;

  // ── UI (quiet, in the prototype's own type). Only what the Wanderer needs; no title card.
  const css = document.createElement('style');
  css.textContent = `
  body.roots #panel, body.roots .labels, body.roots #hdr, body.roots #hint, body.roots .leave, body.roots #back, body.roots #mark, body.roots #reset, body.roots .wandcard, body.roots .spine, body.roots #hdr + * .spine { visibility: hidden !important; }
  #roots-ui { position: fixed; inset: 0; pointer-events: none; z-index: 30; font-family: var(--sans); color: var(--ink2); }
  #roots-ui[hidden] { display: none; }
  #roots-ui .bar { position: absolute; left: 50%; bottom: calc(22px + env(safe-area-inset-bottom)); transform: translateX(-50%); display: flex; gap: 10px; pointer-events: auto; transition: opacity .9s ease; }
  #roots-ui button { white-space: nowrap; font: 500 13px/1 var(--sans); letter-spacing: .02em; color: var(--ink2); background: hsl(30 18% 8% / .62); border: 1px solid hsl(42 40% 40% / .32); border-radius: 999px; min-height: 44px; min-width: 44px; padding: 0 16px; cursor: pointer; backdrop-filter: blur(6px); }
  #roots-ui button:hover, #roots-ui button:focus-visible { color: var(--ink); border-color: hsl(42 60% 55% / .6); outline: none; }
  #roots-ui button[hidden] { display: none; }
  #roots-ui .quiet { opacity: .28; }
  #roots-ui .quiet:hover, #roots-ui .quiet:focus-within { opacity: 1; }
  #roots-ui .whisper { position: absolute; left: 50%; bottom: calc(80px + env(safe-area-inset-bottom)); transform: translateX(-50%); font: italic 15px/1.3 var(--whisper); color: var(--ink3); opacity: 0; transition: opacity 1.4s ease; white-space: nowrap; }
  #roots-ui .whisper.on { opacity: .85; }
  #roots-ui .name { position: absolute; transform: translate(-50%, -100%); text-align: center; pointer-events: auto; opacity: 0; transition: opacity 2.2s ease; background: none; border: 0; padding: 6px 10px; min-height: 0; backdrop-filter: none; }
  #roots-ui .name.on { opacity: 1; }
  #roots-ui .qname { position: absolute; transform: translate(-50%, -100%); text-align: center; width: min(78vw, 340px); pointer-events: auto; opacity: 0; transition: opacity 1.4s ease; visibility: hidden; }
  #roots-ui .qname.on { opacity: 1; }
  #roots-ui .qname b { display: block; font: 600 15px/1.1 var(--serif); letter-spacing: .06em; color: var(--ink); text-shadow: 0 1px 12px #000, 0 0 2px #000; }
  #roots-ui .qname i { display: block; font: italic 13.5px/1.3 var(--whisper); color: var(--ink2); text-shadow: 0 1px 10px #000; margin-top: 3px; }
  #roots-ui .qname a { display: inline-block; margin-top: 8px; font: 500 11.5px/1 var(--sans); letter-spacing: .04em; white-space: nowrap; color: var(--ink2); text-decoration: none; border: 1px solid hsl(42 40% 40% / .4); border-radius: 999px; padding: 9px 12px; background: hsl(30 18% 8% / .62); min-height: 0; }
  #roots-ui .name.dim { opacity: .45; }
  #roots-ui .name b { display: block; font: 600 19px/1.1 var(--serif); letter-spacing: .06em; color: var(--ink); text-shadow: 0 1px 12px #000, 0 0 2px #000; }
  #roots-ui .name i { display: block; font: italic 15px/1.3 var(--whisper); color: var(--ink2); text-shadow: 0 1px 10px #000; margin-top: 3px; }
  #roots-ui .name small { display: block; font: 500 11px/1 var(--sans); letter-spacing: .08em; text-transform: uppercase; color: var(--ink3); margin-top: 9px; opacity: 0; transition: opacity 1.2s ease 1.2s; }
  #roots-ui .name.on small { opacity: .8; }
  #roots-sheet { position: fixed; right: 18px; top: 18px; bottom: 18px; width: min(380px, calc(100vw - 36px)); overflow: auto; z-index: 31; background: hsl(30 16% 7% / .9); border: 1px solid hsl(42 40% 40% / .28); border-radius: 14px; padding: 22px 22px 28px; color: var(--ink2); font: 14px/1.5 var(--sans); backdrop-filter: blur(10px); }
  #roots-sheet[hidden] { display: none; }
  #roots-sheet h2 { font: 600 22px/1.1 var(--serif); letter-spacing: .05em; color: var(--ink); margin: 2px 0 2px; }
  #roots-sheet .sp { font: italic 16px/1.3 var(--whisper); color: var(--ink2); margin: 0 0 16px; }
  #roots-sheet h3 { font: 600 10.5px/1 var(--sans); letter-spacing: .14em; text-transform: uppercase; color: var(--ink3); margin: 18px 0 8px; }
  #roots-sheet dl { margin: 0; display: grid; grid-template-columns: minmax(96px, 38%) 1fr; gap: 6px 12px; }
  #roots-sheet dt { color: var(--ink3); font-size: 12.5px; }
  #roots-sheet dd { margin: 0; color: var(--ink2); font-size: 13.5px; }
  #roots-sheet dd.none { color: hsl(45 12% 48%); font-style: italic; }
  #roots-sheet dd small { display: block; color: var(--ink3); font-size: 11.5px; }
  #roots-sheet blockquote { margin: 0; font: italic 15.5px/1.45 var(--whisper); color: var(--ink2); border-left: 2px solid hsl(42 40% 40% / .4); padding-left: 12px; }
  #roots-sheet .kind { font: 600 9.5px/1 var(--sans); letter-spacing: .1em; text-transform: uppercase; color: var(--ink3); border: 1px solid hsl(42 30% 40% / .35); border-radius: 4px; padding: 2px 4px; margin-left: 6px; vertical-align: 1px; }
  #roots-sheet .rnote { font-size: 12px; color: var(--ink3); margin: 10px 0 0; }
  #roots-sheet a.rec { display: block; margin-top: 18px; padding: 12px 14px; border-radius: 10px; background: hsl(42 95% 55%); color: #1b1408; text-decoration: none; font-weight: 600; }
  #roots-sheet a.rec small { display: block; font-weight: 400; font-size: 11.5px; opacity: .75; word-break: break-all; }
  #roots-sheet ul.hand { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  #roots-sheet ul.hand a { color: var(--ink); text-decoration: none; font-size: 13.5px; }
  #roots-sheet ul.hand a:hover { text-decoration: underline; }
  #roots-sheet ul.hand small { display: block; color: var(--ink3); font-size: 11.5px; }
  #roots-sheet .x { position: absolute; top: 10px; right: 10px; width: 44px; height: 44px; border-radius: 50%; border: 0; background: none; color: var(--ink2); font-size: 22px; cursor: pointer; }
  @media (max-width: 600px) {
    #roots-sheet { left: 0; right: 0; bottom: 0; top: auto; width: auto; max-height: 72dvh; border-radius: 16px 16px 0 0; padding: 20px 18px calc(26px + env(safe-area-inset-bottom)); }
    #roots-ui .name b { font-size: 17px; }
    #roots-ui .bar { bottom: calc(68px + env(safe-area-inset-bottom)); }
    #roots-ui .whisper { bottom: calc(126px + env(safe-area-inset-bottom)); }
    #roots-ui .whisper { white-space: normal; width: 80vw; text-align: center; }
  }
  .roots-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }`;
  document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'roots-ui'; ui.hidden = true;
  ui.innerHTML = `<div class="whisper" aria-hidden="true"></div>
    <button type="button" class="name" aria-describedby="roots-namehint"><b></b><i></i><small id="roots-namehint">Its record</small></button>
    <div class="qname" role="group" aria-label="Quest Cave"><b>Quest Cave</b><i>Continue the path · a way further in, not yet opened</i><a href="https://www.s33d.life/library/quest-cave" target="_blank" rel="noopener">Open the Quest Cave on S33D.life ↗</a></div>
    <div class="bar">
      <button type="button" data-r="up" aria-label="Back up toward Heartwood">▴</button>
      <button type="button" data-r="down" aria-label="Go further down">▾</button>
      <button type="button" data-r="home" hidden>↑ Return to Heartwood</button>
    </div>
    <p class="roots-sr" aria-live="polite" id="roots-live"></p>`;
  const sheet = document.createElement('div'); sheet.id = 'roots-sheet'; sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'The S33D record'); sheet.tabIndex = -1;
  const mount = () => { document.body.appendChild(ui); document.body.appendChild(sheet); };
  document.body ? mount() : addEventListener('DOMContentLoaded', mount);
  const $ = (s) => ui.querySelector(s);
  const say = (t) => { const l = ui.querySelector('#roots-live'); if (l) l.textContent = t; };

  // ── the record, as the Wanderer may choose to see it: recorded values, ranges, words and status kept apart.
  function fillRecord() {
    if (!friend) return;
    $('.name b').textContent = friend.name; $('.name i').textContent = friend.species || '';
    $('.name').setAttribute('aria-label', `${friend.name}, ${friend.species}. Open its record.`);
    const cl = C.claimsOf(friend).filter((c) => !(c.label === 'Merged from' && c.value == null)), g = (k) => cl.filter((c) => c.group === k);
    const KIND = { recorded: 'recorded', range: 'range', described: 'as written', status: 'status', source: 'source' };
    const dl = (rows) => `<dl>${rows.map((c) => `<dt>${esc(c.label)}${c.kind === 'recorded' ? '' : `<span class="kind">${KIND[c.kind]}</span>`}</dt><dd class="${c.value == null ? 'none' : ''}">${c.value == null ? 'not recorded' : esc(c.value)}${c.note ? `<small>${esc(c.note)}</small>` : ''}</dd>`).join('')}</dl>`;
    const words = g('words').filter((c) => c.value != null);
    sheet.innerHTML = `<button type="button" class="x" aria-label="Close the record">×</button>
      <h2>${esc(friend.name)}</h2><p class="sp">${esc(friend.species || '')}</p>
      <h3>Where it lives</h3>${dl(g('place'))}
      <h3>Its age, as recorded</h3>${dl(g('age'))}
      <p class="rnote">Shown as they stand in the record. The structured value and the words below are not reconciled here.</p>
      ${words.length ? `<h3>In the record's own words</h3>${words.map((c) => `<blockquote>${esc(c.value)}</blockquote>`).join('')}` : ''}
      <h3>Evidence and access</h3>${dl(g('evidence'))}
      <h3>Where this comes from</h3>${dl(g('source'))}
      <a class="rec" href="${friend.canonicalUrl}" target="_blank" rel="noopener">Visit its record on S33D.life ↗<small>${esc(friend.canonicalUrl)}</small></a>
      <h3>With this Friend, on S33D.life</h3>
      <ul class="hand">${[['Offerings and encounters', friend.canonicalUrl, 'On its record'], ['Whispers', 'https://www.s33d.life/whispers', 'Waiting and collected'], ['Your visits', 'https://www.s33d.life/visits', 'For members'], ['See it on the land', 'https://www.s33d.life/map', 'The map · the Outside World'], ['Map a new Ancient Friend', 'https://www.s33d.life/add-tree', 'Met on the land, remembered here'], ['All Ancient Friends', 'https://www.s33d.life/library/gallery', 'The gallery · the whole Cavern']].map(([l, h, sub]) => `<li><a href="${h}" target="_blank" rel="noopener">${esc(l)} ↗</a><small>${esc(sub)}</small></li>`).join('')}</ul>
      <p class="rnote">Each opens in a new tab. You stay here, in the Cavern.</p>`;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function openSheet() { if (!friend) return; state.sheet = true; sheet.hidden = false; sheet.focus(); say('The record of ' + friend.name + ' is open.'); }
  function closeSheet() { state.sheet = false; sheet.hidden = true; $('.name').focus({ preventScroll: true }); }
  sheet.addEventListener('click', (e) => { if (e.target.closest('.x')) closeSheet(); });

  // ── world: built once, the first time the Tree is ready.
  const whenTree = (fn) => { const t = () => (window.__tetol && window.__tetol.controls && document.querySelector('three-d-stage')?._scene?.getObjectByName('chamber_h_friends') ? fn(window.__tetol) : setTimeout(t, 150)); t(); };
  let throat = null, archGlow = null, archGlow0 = 1, T, THREE, scene, stage, cam, controls, G, path, look, stationT = [], tubeCurve, rootFocus, rootMeshes = [], camLight, arch, archMat0, archFade, roomAt = 0.86;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // gentle deterministic noise
  const nz = (x, y, z) => Math.sin(x * 1.7 + y * 0.9) * Math.cos(z * 1.3 - x * 0.4) * 0.5 + Math.sin(x * 0.53 - z * 1.9 + y * 2.3) * 0.3 + Math.sin(y * 3.1 + z * 0.7) * 0.2;

  function earthTexture(base, spread) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), img = x.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) { const px = i % 256, py = (i / 256) | 0; const n = 0.55 + 0.25 * Math.sin(px * 0.09 + Math.sin(py * 0.05) * 3) * Math.cos(py * 0.07) + 0.2 * Math.random();
      img.data[i * 4] = base[0] * n + spread * Math.random(); img.data[i * 4 + 1] = base[1] * n + spread * Math.random() * 0.8; img.data[i * 4 + 2] = base[2] * n + spread * Math.random() * 0.6; img.data[i * 4 + 3] = 255; }
    x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function taper(curve, r0, r1, segs = 48, radial = 8) {
    const g = new THREE.TubeGeometry(curve, segs, 1, radial, false), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i <= segs; i++) { const k = i / segs, c = curve.getPointAt(k), r = r0 + (r1 - r0) * k;
      for (let j = 0; j <= radial; j++) { const idx = i * (radial + 1) + j; v.fromBufferAttribute(p, idx).sub(c).multiplyScalar(r).add(c); p.setXYZ(idx, v.x, v.y, v.z); } }
    g.computeVertexNormals(); return g;
  }

  function build() {
    scene = stage._scene;
    const archGroup = scene.getObjectByName('chamber_h_friends');
    const HP = archGroup.parent.getWorldPosition(V(0, 0, 0)), A = archGroup.getWorldPosition(V(0, 0, 0));
    const d = V(A.x - HP.x, 0, A.z - HP.z), rr = d.length(); d.normalize();
    const p = V(d.z, 0, -d.x); // along the wall
    const L = (a, b, y) => HP.clone().add(d.clone().multiplyScalar(a)).add(p.clone().multiplyScalar(b)).setY(y);
    const hallWorld = scene.getObjectByName('heartwood_hall_world');
    G = new THREE.Group(); G.name = 'ROOTS_slice_nonCanonical'; G.visible = false; (hallWorld || scene).add(G);
    arch = scene.getObjectByName('h_friends_opening');
    // the wall behind the arch is opened (a doorway only as wide and tall as the arch's own dark opening, which still covers it from the hall)
    { const wall = scene.getObjectByName('heartwood_hall_wall'); if (wall) { const g0 = wall.geometry, pos = g0.attributes.position, idx = g0.index, aA = Math.atan2(d.x, d.z), keep = [];
        const lp = wall.parent.worldToLocal(A.clone()), hw = 0.765 / Math.hypot(lp.x, lp.z);
        for (let i = 0; i < idx.count; i += 3) { let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { const v = idx.getX(i + k); cx += pos.getX(v); cy += pos.getY(v); cz += pos.getZ(v); } cx /= 3; cy /= 3; cz /= 3;
          const da = Math.atan2(Math.sin(Math.atan2(cx, cz) - aA), Math.cos(Math.atan2(cx, cz) - aA)); const xo = Math.abs(da) * Math.hypot(lp.x, lp.z); if (Math.abs(da) < hw && cy < 2.12 + Math.sqrt(Math.max(0, 0.8 * 0.8 - xo * xo)) + 0.08) continue; keep.push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)); }
        g0.setIndex(keep); state.wallCut = idx.count / 3 - keep.length / 3; } }
    // the arch's rim was drawn as a filled arch behind the dark opening; make it a true rim (same outline, open centre). Unchanged from the hall.
    { const rim = scene.getObjectByName('h_friends_rim'); if (rim) { const arc = (w, h2, path) => { path.moveTo(-w / 2, 0); path.lineTo(-w / 2, h2 - w / 2); path.absarc(0, h2 - w / 2, w / 2, Math.PI, 0, true); path.lineTo(w / 2, 0); path.lineTo(-w / 2, 0); return path; };
        const outer = arc(1.9, 3.02, new THREE.Shape()); outer.holes.push(arc(1.46, 2.78, new THREE.Path())); rim.geometry.dispose(); rim.geometry = new THREE.ShapeGeometry(outer, 24);
        state.throatShape = arc(1.48, 2.8, new THREE.Shape()); } }

    // the path the Wanderer moves along: from exactly the Ancient Friends view in Heartwood, through the arch, down.
    const FLOOR = -7.4, CH = L(rr + 1.2, 13.2, FLOOR);
    const camPts = [L(rr - 5.2, 0, 1.8), L(rr - 1.7, 0, 1.55), L(rr + 0.7, 0.15, 1.35), L(rr + 2.6, 0.9, 0.45), L(rr + 3.9, 2.9, -1.5), L(rr + 3.9, 5.4, -3.55), L(rr + 3.0, 7.6, -5.3), L(rr + 2.4, 8.9, FLOOR + 1.5)];
    const e = camPts[7].clone().sub(CH).setY(0).normalize(); // from the chamber's centre toward its mouth
    const s = V(e.z, 0, -e.x);
    rootFocus = CH.clone().add(e.clone().multiplyScalar(-2.35)).add(s.clone().multiplyScalar(0.3)).setY(FLOOR + 0.2);
    camPts.push(CH.clone().add(e.clone().multiplyScalar(0.35)).add(s.clone().multiplyScalar(-0.3)).setY(FLOOR + 1.45));
    const lookPts = [L(rr - 0.3, 0, 1.54), L(rr + 2.2, 0.2, 1.1), L(rr + 3.4, 1.4, 0.1), L(rr + 4.3, 3.0, -1.7), L(rr + 4.2, 5.4, -3.9), L(rr + 3.2, 7.8, -5.7), L(rr + 1.9, 10.6, FLOOR + 1.0), rootFocus.clone().setY(FLOOR + 1.0), rootFocus.clone().setY(FLOOR + 0.55)];
    path = new THREE.CatmullRomCurve3(camPts, false, 'centripetal'); look = new THREE.CatmullRomCurve3(lookPts, false, 'centripetal');
    // stations = each control point's place along the path
    const N = 600, samples = Array.from({ length: N + 1 }, (_, i) => path.getPointAt(i / N));
    stationT = camPts.map((c) => { let best = 0, bd = 1e9; samples.forEach((s2, i) => { const dd = s2.distanceToSquared(c); if (dd < bd) { bd = dd; best = i / N; } }); return best; });
    stationT[0] = 0; stationT[stationT.length - 1] = 1; roomAt = stationT[7] - 0.01;

    // materials: earth, root, the Tree's own passage root (continuity from Heartwood)
    const earthMap = earthTexture([62, 44, 30], 14); earthMap.repeat.set(3, 10);
    const earth = new THREE.MeshStandardMaterial({ name: 'roots_earth', map: earthMap, color: 0x8a6e56, roughness: 1, side: THREE.BackSide });
    const floorMap = earthTexture([58, 42, 30], 12); floorMap.repeat.set(4, 4);
    const earthFloor = new THREE.MeshStandardMaterial({ name: 'roots_floor', map: floorMap, color: 0x7a624c, roughness: 1 });
    const rootMat = new THREE.MeshStandardMaterial({ name: 'roots_root', color: 0x3e2c1e, roughness: 0.95 });
    const passRoot = scene.getObjectByName('root_passage_down_to_roots');

    // the passage: a bored way through earth, closing in as it goes down
    const tubePts = [L(rr + 0.95, 0, 1.35), L(rr + 1.7, 0.45, 1.0), ...camPts.slice(3, 7).map((c) => c.clone().add(V(0, 0.25, 0))), CH.clone().add(e.clone().multiplyScalar(5.35)).setY(FLOOR + 1.35), CH.clone().add(e.clone().multiplyScalar(4.7)).setY(FLOOR + 1.3)];
    tubeCurve = new THREE.CatmullRomCurve3(tubePts, false, 'centripetal');
    { const segs = 160, rad = 22, g = new THREE.TubeGeometry(tubeCurve, segs, 1, rad, false), pa = g.attributes.position, v = V(0, 0, 0);
      for (let i = 0; i <= segs; i++) { const k = i / segs, c = tubeCurve.getPointAt(k), r = (1.62 - 0.27 * smooth(0.0, 0.1, k)) - 0.3 * Math.min(1, k * 1.4) + (k > 0.9 ? (k - 0.9) * 5 : 0);
        for (let j = 0; j <= rad; j++) { const idx = i * (rad + 1) + j; v.fromBufferAttribute(pa, idx).sub(c); const n = nz(c.x * 0.8 + j, c.y * 0.7, c.z * 0.8 + j * 0.3);
          v.multiplyScalar(r * (1 + 0.14 * n)); if (v.y < -0.55 * r) v.y = -0.55 * r + (v.y + 0.55 * r) * 0.35; // a flatter floor to stand on
          v.add(c); pa.setXYZ(idx, v.x, v.y, v.z); } }
      g.computeVertexNormals(); const m = new THREE.Mesh(g, earth); m.name = 'roots_passage'; G.add(m); }
    // the threshold: the arch's own outline carried back through the thickness of the wall, so nothing shows around it from the hall
    if (state.throatShape) { const tg = new THREE.ExtrudeGeometry(state.throatShape, { depth: 1.35, bevelEnabled: false, curveSegments: 16 });
      const th = new THREE.Mesh(tg, [new THREE.MeshBasicMaterial({ visible: false }), earth]); th.name = 'roots_threshold';
      const ag = scene.getObjectByName('chamber_h_friends'); th.position.z = -1.33; th.visible = false; ag.add(th); throat = th; }
    // the Tree's own root keeps you company down the passage (same material as the root that leaves the arch)
    { if (q.get('treeRoot') !== '0') { const pts = []; for (let i = 0; i <= 14; i++) { const k = 0.06 + i / 14 * 0.9, c = tubeCurve.getPointAt(k), tg = tubeCurve.getTangentAt(k), side = V(tg.z, 0, -tg.x).normalize(); const r = 1.35 - 0.3 * Math.min(1, k * 1.4);
        pts.push(c.clone().add(side.multiplyScalar(0.7 * r)).add(V(0, -0.52 * r + 0.04 * Math.sin(i), 0))); }
      const pr = passRoot ? passRoot.material.clone() : rootMat.clone(); if (pr.emissive) { pr.emissive.set(0x0c1008); pr.emissiveIntensity = 1; } pr.color && pr.color.set(0x4a4a34); const m = new THREE.Mesh(taper(new THREE.CatmullRomCurve3(pts), 0.085, 0.04, 90, 8), pr); m.name = 'roots_the_trees_root'; G.add(m); } }
    // fine roots through the passage ceiling
    for (let i = 0; i < 18; i++) { const k = 0.2 + (i / 18) * 0.72, c = tubeCurve.getPointAt(k), r = 1.1; const a = i * 2.1, top = c.clone().add(V(Math.cos(a) * 0.5, 0.85 * r, Math.sin(a) * 0.5)), len = 0.25 + (i % 5) * 0.12;
      const m = new THREE.Mesh(taper(new THREE.CatmullRomCurve3([top, top.clone().add(V(0.05, -len * 0.5, 0.03)), top.clone().add(V(-0.03, -len, 0.06))]), 0.018, 0.004, 8, 5), rootMat); G.add(m); }

    // the chamber: low, earthen, held by roots
    { const prof = [[5.0, -0.25], [5.35, 0.5], [5.45, 1.4], [5.1, 2.4], [4.3, 3.25], [3.0, 3.85], [1.5, 4.15], [0.05, 4.25]], pts = [];
      for (let i = 0; i < prof.length - 1; i++) for (let k = 0; k < 6; k++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1], f = k / 6; pts.push(new THREE.Vector2(r0 + (r1 - r0) * f, y0 + (y1 - y0) * f)); }
      pts.push(new THREE.Vector2(0.01, 4.25));
      let g = new THREE.LatheGeometry(pts, 96).toNonIndexed(); const pa = g.attributes.position, v = V(0, 0, 0);
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); const r = Math.hypot(v.x, v.z); if (r > 0.1) { const n = nz(v.x * 0.9, v.y * 1.1, v.z * 0.9); const f = 1 + 0.07 * n; v.x *= f; v.z *= f; v.y += 0.12 * n; } pa.setXYZ(i, v.x, v.y, v.z); }
      // the mouth where the passage arrives, cut from the wall
      const ea = Math.atan2(e.z, e.x), keep = [];
      for (let i = 0; i < pa.count; i += 3) { let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { cx += pa.getX(i + k); cy += pa.getY(i + k); cz += pa.getZ(i + k); } cx /= 3; cy /= 3; cz /= 3;
        const da = Math.atan2(Math.sin(Math.atan2(cz, cx) - ea), Math.cos(Math.atan2(cz, cx) - ea)); if (Math.abs(da) < 0.2 && cy < 2.55) continue; keep.push(i); }
      const out = new Float32Array(keep.length * 9); keep.forEach((i, n) => { for (let k = 0; k < 3; k++) { out[n * 9 + k * 3] = pa.getX(i + k); out[n * 9 + k * 3 + 1] = pa.getY(i + k); out[n * 9 + k * 3 + 2] = pa.getZ(i + k); } });
      const uv = g.attributes.uv, ouv = new Float32Array(keep.length * 6); keep.forEach((i, n) => { for (let k = 0; k < 3; k++) { ouv[n * 6 + k * 2] = uv.getX(i + k) * 4; ouv[n * 6 + k * 2 + 1] = uv.getY(i + k) * 2; } });
      g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(out, 3)); g.setAttribute('uv', new THREE.BufferAttribute(ouv, 2)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, earth); m.position.copy(CH); m.name = 'roots_cavern_chamber'; G.add(m);
      const fg = new THREE.CircleGeometry(5.6, 64), fp = fg.attributes.position; for (let i = 0; i < fp.count; i++) fp.setZ(i, 0.05 * nz(fp.getX(i), 0, fp.getY(i)));
      fg.computeVertexNormals(); const f = new THREE.Mesh(fg, earthFloor); f.rotation.x = -Math.PI / 2; f.position.copy(CH).setY(FLOOR); f.name = 'roots_cavern_floor'; G.add(f); }
    // the Tree's roots, holding the chamber from above
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + 0.4, off = Math.abs(Math.atan2(Math.sin(a - Math.atan2(e.z, e.x)), Math.cos(a - Math.atan2(e.z, e.x)))); if (off < 0.5 || off > Math.PI - 0.55) continue;
      const pt = (r, y) => CH.clone().add(V(Math.cos(a) * r, 0, Math.sin(a) * r)).setY(FLOOR + y);
      const m = new THREE.Mesh(taper(new THREE.CatmullRomCurve3([pt(0.6, 4.2), pt(2.6, 3.9), pt(4.3, 3.1), pt(5.1, 1.8), pt(5.2, 0.4)]), 0.09 + (i % 3) * 0.03, 0.03, 40, 7), rootMat); G.add(m);
      for (let k = 0; k < 4; k++) { const top = pt(1.2 + k * 0.9, 4.1 - k * 0.25), len = 0.3 + ((i + k) % 4) * 0.18; G.add(new THREE.Mesh(taper(new THREE.CatmullRomCurve3([top, top.clone().add(V(0.04, -len * 0.5, -0.02)), top.clone().add(V(-0.02, -len, 0.05))]), 0.016, 0.003, 8, 5), rootMat)); } }

    // Quest Cave (0.9.5 coverage): a low way further in, off the chamber. Doorway only; the cave is not built.
    { const qd = e.clone().multiplyScalar(-0.45).add(s.clone().multiplyScalar(-0.9)).normalize(), at = CH.clone().add(qd.clone().multiplyScalar(5.02)).setY(FLOOR - 0.02);
      const arc = (w, h2) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(-w / 2, h2 - w / 2); sh.absarc(0, h2 - w / 2, w / 2, Math.PI, 0, true); sh.lineTo(w / 2, 0); sh.lineTo(-w / 2, 0); return sh; };
      const qg = new THREE.Group(); qg.name = 'roots_quest_cave_doorway'; qg.position.copy(at); qg.lookAt(CH.clone().setY(FLOOR - 0.02)); G.add(qg);
      const hole = new THREE.Mesh(new THREE.ShapeGeometry(arc(1.15, 1.7), 20), new THREE.MeshBasicMaterial({ name: 'quest_cave_depth', color: 0x040302 })); hole.name = 'quest_cave_opening'; qg.add(hole);
      const rimM = new THREE.Mesh(new THREE.ShapeGeometry((() => { const o = arc(1.5, 1.92); o.holes.push(arc(1.15, 1.7)); return o; })(), 20), rootMat); rimM.position.z = -0.01; rimM.name = 'quest_cave_rim'; qg.add(rimM);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: 0x8fa0c8, transparent: true, opacity: 0.22, depthWrite: false })); gl.position.set(0, 0.75, 0.25); gl.scale.set(1.3, 1.3, 1); qg.add(gl);
      questFocus = at.clone().add(V(0, 0.9, 0)); questMeshes.push(hole, rimM); }

    // Major Oak. Met as a living being: one great root reaching into the chamber from beyond its wall.
    // Its bark is chosen from the record's species key (quercus-robur → the Tree's own oak bark); nothing else about it is invented.
    { let bark = null; scene.traverse((o) => { if (!bark && o.isMesh && o.material && o.material.name === 'bark') bark = o.material; });
      const oakBark = bark ? bark.clone() : rootMat.clone(); if (bark && bark.map) { oakBark.map = bark.map.clone(); oakBark.map.needsUpdate = true; oakBark.map.repeat.set(14, 2); oakBark.map.wrapS = oakBark.map.wrapT = THREE.RepeatWrapping; }
      oakBark.name = 'friend_root_bark'; if (oakBark.color) oakBark.color.multiplyScalar(0.5);
      const P = (a, b, y) => CH.clone().add(e.clone().multiplyScalar(a)).add(s.clone().multiplyScalar(b)).setY(FLOOR + y);
      const main = new THREE.CatmullRomCurve3([P(-2.9, 6.1, 0.3), P(-2.7, 4.9, 0.32), P(-2.45, 3.7, 0.24), P(-2.55, 2.7, 0.03), P(-2.35, 1.85, -0.1), P(-2.2, 1.05, 0.13), P(-2.35, 0.15, 0.21), P(-2.55, -0.75, 0.13), P(-2.45, -1.6, -0.05), P(-2.3, -2.3, -0.2)]);
      const add = (geo) => { const m = new THREE.Mesh(geo, oakBark); m.name = 'friend_root'; G.add(m); rootMeshes.push(m); return m; };
      add(taper(main, 0.33, 0.07, 130, 16));

      // side roots run away from the Wanderer, toward the far wall, and thin into the soil
      [[0.3, 0.5], [0.52, -0.35], [0.66, 0.4], [0.8, -0.5]].forEach(([k, turn], i) => { const o = main.getPointAt(k);
        const away = e.clone().multiplyScalar(-1).applyAxisAngle(V(0, 1, 0), turn), len = 1.3 + (i % 2) * 0.6;
        const b = new THREE.CatmullRomCurve3([o.clone().setY(o.y - 0.08), o.clone().add(away.clone().multiplyScalar(len * 0.35)).setY(FLOOR + 0.04), o.clone().add(away.clone().multiplyScalar(len * 0.7)).add(s.clone().multiplyScalar(turn * 0.3)).setY(FLOOR + 0.05), o.clone().add(away.clone().multiplyScalar(len)).setY(FLOOR - 0.02)]);
        add(taper(b, 0.085 - i * 0.01, 0.012, 36, 8)); });
      // root hairs: a living root is still searching
      for (let i = 0; i < 46; i++) { const k = 0.35 + (i / 46) * 0.62, o = main.getPointAt(k), a = i * 2.39, len = 0.12 + (i % 6) * 0.05;
        const tip = o.clone().add(V(Math.cos(a) * len * 0.6, -0.1 - (i % 3) * 0.05, Math.sin(a) * len * 0.6)); if (tip.y < FLOOR + 0.015) tip.y = FLOOR + 0.015;
        G.add(new THREE.Mesh(taper(new THREE.CatmullRomCurve3([o.clone().add(V(0, -0.04, 0)), o.clone().lerp(tip, 0.5).add(V(0, 0.02, 0)), tip]), 0.007, 0.0015, 6, 4), oakBark)); }
    }

    // light: only what is plausibly there. Grey daylight from a narrow way up to the land falls across the root.
    const mouthDir = e.clone().multiplyScalar(-0.35).add(s.clone().multiplyScalar(0.94)).normalize();
    const mouth = CH.clone().add(mouthDir.clone().multiplyScalar(4.1)).setY(FLOOR + 3.35);
    { const sl = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: 0xaab4c2, transparent: true, opacity: 0.32, depthWrite: false, fog: false }));
      sl.position.copy(mouth); sl.scale.set(0.9, 0.5, 1); sl.name = 'roots_way_to_the_land'; G.add(sl);
      const day = new THREE.SpotLight(0xb7c4d4, 70, 13, 0.5, 0.8, 1.25); day.position.copy(mouth); day.target.position.copy(rootFocus.clone().add(e.clone().multiplyScalar(-0.9)).add(V(0, 0.3, 0))); G.add(day, day.target); day.name = 'roots_daylight';
      const low = new THREE.HemisphereLight(0x5a6270, 0x2a1c12, 0.85); low.name = 'roots_low_light'; G.add(low);
      // dust turning slowly in the grey light
      const n = 70, a = new Float32Array(n * 3), b = Array.from({ length: n }, () => [Math.random(), Math.random(), Math.random(), Math.random()]);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xc9cfd6, size: 0.03, map: dot(), transparent: true, opacity: 0.5, depthWrite: false, alphaTest: 0.02 })); pts.name = 'roots_dust'; G.add(pts);
      const tgt = day.target.position.clone();
      state.dust = (t) => { b.forEach(([u, v, w, z], i) => { const k = (u + t / 90000 * (0.4 + z)) % 1; const p0 = mouth.clone().lerp(tgt, k); a.set([p0.x + Math.sin(t / 7000 + i) * 0.12 * (0.3 + v), p0.y + Math.cos(t / 9000 + i * 1.7) * 0.08, p0.z + Math.sin(t / 8000 + w * 9) * 0.12], i * 3); }); geo.attributes.position.needsUpdate = true; };
      state.day = day; state.day0 = day.intensity; state.dust(0); }
    camLight = new THREE.PointLight(0xcdb89c, 6.5, 9, 1.5); camLight.name = 'roots_eyes_adjusting'; G.add(camLight);

    // take over the stage's draw: set the Wanderer's view before each frame; dim everything that is not here, only while here.
    const isOurs = (o) => { for (; o; o = o.parent) if (o === G) return true; return false; };
    const loop0 = stage._loop, ownLights = new Set(); G.traverse((o) => { if (o.isLight) ownLights.add(o); });
    stage._loop = () => {
      if (!state.active) return loop0();
      const saved = [], fog = scene.fog, f0 = fog && { c: fog.color.getHex(), d: fog.density };
      frame(performance.now());
      const depth = smooth(0.06, 0.62, state.t);
      const hid = []; scene.traverse((o) => { if (o.isLight && !ownLights.has(o)) { saved.push([o, o.intensity]); o.intensity *= 1 - 0.95 * depth; } else if (o.isLine && o.visible && !isOurs(o)) { hid.push(o); o.visible = false; } });
      if (fog) { fog.color.lerp(new THREE.Color(0x0b0806), depth); fog.density = f0.d + (0.03 - f0.d) * depth; }
      loop0();
      saved.forEach(([o, i]) => (o.intensity = i)); hid.forEach((o) => (o.visible = true)); if (fog) { fog.color.setHex(f0.c); fog.density = f0.d; }
    };
    stage._renderer.setAnimationLoop(stage._loop);
    built = true; fillRecord();
  }
  const dot = () => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); };
  const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  let questFocus = null; const questMeshes = [];

  // ── the Wanderer's movement: they set where to be; the view follows at walking pace and stops when they stop.
  let last = 0, yaw = 0, pitch = 0, held = 0, arrivedSaid = false, beganAt = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    if (held) state.tTarget = clamp(state.tTarget + held * 0.07 * dt);
    if (reduce()) state.t = state.tTarget;
    else { const diff = state.tTarget - state.t, step = Math.sign(diff) * Math.min(Math.abs(diff), Math.max(0.006, Math.abs(diff) * 2.2) * dt * (state.brisk ? 2.2 : 1), 0.075 * dt * (state.brisk ? 2.4 : 1));
      state.t += Math.abs(diff) < 0.0004 ? diff : step; }
    const moving = Math.abs(state.tTarget - state.t) > 0.001;
    if (moving && !reduce()) { yaw *= 1 - Math.min(1, 1.6 * dt); pitch *= 1 - Math.min(1, 1.6 * dt); }
    const c = path.getPointAt(state.t), l = look.getPointAt(state.t), dir = l.clone().sub(c).normalize();
    // on a narrow portrait screen, stand a little further back in the chamber so the root fits the frame
    const narrow = Math.max(0, Math.min(1, 1 - (innerWidth / innerHeight) / 0.75)); if (narrow) c.addScaledVector(V(dir.x, 0, dir.z).normalize(), -2.4 * narrow * smooth(roomAt - 0.06, roomAt, state.t));
    const right = V(0, 1, 0).cross(dir).normalize(), up = dir.clone().cross(right).normalize();
    dir.applyAxisAngle(V(0, 1, 0), yaw); dir.applyAxisAngle(right.applyAxisAngle(V(0, 1, 0), yaw), -pitch);
    cam.position.copy(c); controls.target.copy(c.clone().add(dir.multiplyScalar(1.2))); cam.lookAt(controls.target);
    camLight.position.copy(c).add(V(0, 0.2, 0)); camLight.intensity = 6.5 * smooth(0.05, 0.25, state.t) * (1 - 0.45 * smooth(0.8, 1, state.t));
    if (archFade) archFade.opacity = 1 - smooth(0.035, 0.13, state.t);
    if (archGlow) archGlow.material.opacity = archGlow0 * (1 - smooth(0.02, 0.1, state.t));
    if (state.dust && !reduce()) { state.dust(now); state.day.intensity = state.day0 * (1 + 0.1 * Math.sin(now / 9000) * Math.sin(now / 23000)); }
    ui.querySelector('[data-r="up"]').disabled = false;
    // where the Wanderer is
    const inRoom = state.t >= roomAt;
    $('[data-r="down"]').hidden = state.t >= 0.999; $('[data-r="up"]').hidden = inRoom; $('[data-r="home"]').hidden = !inRoom;
    if (inRoom && !arrivedSaid) { arrivedSaid = true; say('A chamber beneath the roots. Something living reaches in from the far wall.'); }
    if (!inRoom) arrivedSaid = false;
    if (state.t <= 0.0005 && state.tTarget <= 0 && state.active && now - beganAt > 400) finish();
    recognition(dt, inRoom); questLabel(inRoom);
  }
  const clamp = (x) => Math.max(0, Math.min(1, x));

  // ── presence → recognition: the name comes only once the Wanderer has stayed with the root.
  function recognition(dt, inRoom) {
    const nm = $('.name');
    if (!inRoom || !friend) { nm.classList.remove('on', 'dim'); nm.style.visibility = 'hidden'; state.dwell = 0; return; }
    const toRoot = rootFocus.clone().sub(cam.position), fwd = controls.target.clone().sub(cam.position).normalize(), ang = fwd.angleTo(toRoot.clone().normalize());
    const looking = ang < 0.42 && toRoot.length() < 7.5, still = Math.abs(state.tTarget - state.t) < 0.002;
    if (!state.recognised) { state.dwell = looking && still ? state.dwell + dt : Math.max(0, state.dwell - dt * 0.5); if (state.dwell > (reduce() ? 1.2 : 2.6)) recognise(); }
    const pr = rootFocus.clone().add(V(0, 0.7, 0)).project(cam), w = innerWidth, h = innerHeight;
    const vis = pr.z < 1 && Math.abs(pr.x) < 0.95 && Math.abs(pr.y) < 0.9;
    nm.style.left = Math.round((pr.x * 0.5 + 0.5) * w) + 'px'; nm.style.top = Math.max(90, Math.round((-pr.y * 0.5 + 0.5) * h)) + 'px';
    nm.style.visibility = state.recognised && vis ? 'visible' : 'hidden';
    nm.classList.toggle('dim', state.recognised && !looking);
  }
  function questLabel(inRoom) {
    const ql = ui.querySelector('.qname'); if (!ql || !questFocus) return;
    if (!inRoom) { ql.classList.remove('on'); ql.style.visibility = 'hidden'; return; }
    const to = questFocus.clone().sub(cam.position), fwd = controls.target.clone().sub(cam.position).normalize(), ang = fwd.angleTo(to.clone().normalize());
    const pr = questFocus.clone().add(V(0, 0.55, 0)).project(cam), vis = pr.z < 1 && Math.abs(pr.x) < 0.9 && Math.abs(pr.y) < 0.9;
    const half = Math.min(innerWidth * 0.78, 340) / 2 + 8; ql.style.left = Math.round(Math.max(half, Math.min(innerWidth - half, (pr.x * 0.5 + 0.5) * innerWidth))) + 'px'; ql.style.top = Math.max(90, Math.round((-pr.y * 0.5 + 0.5) * innerHeight)) + 'px';
    const on = vis && (ang < 0.55 || state.questTapped); ql.style.visibility = on ? 'visible' : 'hidden'; ql.classList.toggle('on', on);
  }
  function recognise() { if (state.recognised || !friend) return; state.recognised = true; $('.name').classList.add('on'); say(`${friend.name}. ${friend.species}. An Ancient Friend. Its record can be opened.`); }

  // ── begin and end
  function begin() {
    if (!built || state.active || !friend) return;
    // only from inside Heartwood, in the 3D view: otherwise go to the Ancient Friends arch first, then begin
    const v3 = document.getElementById('view3d'); if (v3 && v3.hidden) { document.getElementById('m3d')?.click(); }
    const hall = scene.getObjectByName('heartwood_hall_world');
    if (hall && !hall.visible) { window.TETOL_NAV ? window.TETOL_NAV.run('goTo', 'h_friends', 'roots') : null; const t0 = performance.now(); const wait = () => (hall.visible && performance.now() - t0 > 3400 ? begin() : performance.now() - t0 < 9000 && setTimeout(wait, 200)); setTimeout(wait, 400); return; }
    state.active = true; D.ext.away = true; beganAt = performance.now();
    const cp = path.points; cp[0].copy(cam.position); look.points[0].copy(controls.target); path.updateArcLengths(); look.updateArcLengths();
    state.t = 0; state.tTarget = reduce() ? stationT[1] : stationT[1];
    state.saved = { enabled: controls.enabled, minD: controls.minDistance, maxD: controls.maxDistance, minP: controls.minPolarAngle, maxP: controls.maxPolarAngle, near: cam.near };
    controls.enabled = false; controls.minDistance = 0; controls.maxDistance = 100; controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI;
    if (arch) { archMat0 = arch.material; archFade = archMat0.clone(); archFade.transparent = true; arch.material = archFade;
      const ap = arch.getWorldPosition(V(0, 0, 0)); archGlow = null; let bd = 2.5; scene.getObjectByName('heartwood_hall_world')?.traverse((o) => { if (o.isSprite) { const dd = o.getWorldPosition(V(0, 0, 0)).distanceTo(ap); if (dd < bd) { bd = dd; archGlow = o; } } });
      if (archGlow) archGlow0 = archGlow.material.opacity; }
    G.visible = true; if (throat) throat.visible = true; ui.hidden = false; document.body.classList.add('roots');
    const wh = $('.whisper'); let seen = q.get('hint') === '0'; try { seen = seen || !!sessionStorage.getItem('roots-hint'); } catch (e) {} if (!seen) { wh.textContent = matchMedia('(pointer: coarse)').matches ? 'Use ▾ ▴ to go down or back · drag to look around' : 'Scroll or ↓ ↑ to go down or back · drag to look around'; wh.classList.add('on'); setTimeout(() => wh.classList.remove('on'), 6500); try { sessionStorage.setItem('roots-hint', '1'); } catch (e) {} }
    say('Going down through the roots, beneath Heartwood.');
    setTimeout(() => ui.querySelector('[data-r="down"]').focus({ preventScroll: true }), 50);
  }
  function finish() {
    state.questTapped = false; state.active = false; state.brisk = false; D.ext.away = false; yaw = pitch = 0; held = 0; closeSheet(); state.sheet = false;
    const sv = state.saved; controls.enabled = sv.enabled; controls.minDistance = sv.minD; controls.maxDistance = sv.maxD; controls.minPolarAngle = sv.minP; controls.maxPolarAngle = sv.maxP;
    cam.position.copy(path.points[0]); controls.target.copy(look.points[0]); controls.update();
    if (arch && archMat0) { arch.material = archMat0; archFade.dispose(); archFade = null; }
    if (archGlow) archGlow.material.opacity = archGlow0;
    G.visible = false; if (throat) throat.visible = false; ui.hidden = true; document.body.classList.remove('roots');
    say('Back in Heartwood, beside the Ancient Friends arch.');
    const b = document.querySelector('#panel [data-go="@roots"]') || document.getElementById('pname'); if (b) b.focus({ preventScroll: true });
  }
  // at the Ancient Friends arch, stepping through is itself the way down: a tap on the doorway, or ↓ / PageDown
  const atArch = () => !state.active && built && window.TETOL_NAV && window.TETOL_NAV.where().id === 'h_friends' && scene.getObjectByName('heartwood_hall_world')?.visible;
  let archDown = null;
  addEventListener('pointerdown', (e) => { archDown = atArch() && e.target.closest && e.target.closest('three-d-stage') ? [e.clientX, e.clientY] : null; }, true);
  addEventListener('pointerup', (e) => { if (!archDown || !atArch()) return; const d0 = archDown; archDown = null; if (Math.hypot(e.clientX - d0[0], e.clientY - d0[1]) > 6) return;
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam);
    const hit = ray.intersectObjects([arch, scene.getObjectByName('h_friends_rim')].filter(Boolean), false)[0];
    if (hit) { e.stopImmediatePropagation(); begin(); } }, true);
  addEventListener('keydown', (e) => { if (!atArch() || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return; if (e.target.closest && e.target.closest('input, textarea, select, #panel, #viewlist')) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); e.stopImmediatePropagation(); begin(); } }, true);
  const goStation = (dir) => { state.brisk = false; const cur = state.tTarget; const list = dir > 0 ? stationT.filter((x) => x > cur + 0.004) : stationT.filter((x) => x < cur - 0.004).reverse(); if (list.length) state.tTarget = list[0]; else if (dir < 0) state.tTarget = 0; };
  const home = () => { closeSheet(); state.tTarget = 0; state.brisk = true; yaw = pitch = 0; say('Climbing back up toward Heartwood.'); };

  // ── input. While below, the Tree's own handlers do not see these events (so a tap here never flies you elsewhere).
  const mine = (e) => e.target && e.target.closest && (e.target.closest('#roots-ui') || e.target.closest('#roots-sheet'));
  addEventListener('click', (e) => {
    const g = e.target.closest && e.target.closest('[data-go="@roots"]');
    if (g) { e.preventDefault(); e.stopImmediatePropagation(); begin(); return; }
    if (!state.active) return;
    const r = e.target.closest && e.target.closest('#roots-ui [data-r], #roots-ui .name');
    if (r) { e.stopImmediatePropagation(); if (r.classList.contains('name')) openSheet(); else if (r.dataset.r === 'down') goStation(1); else if (r.dataset.r === 'up') goStation(-1); else home(); return; }
    if (!mine(e)) e.stopImmediatePropagation();
  }, true);
  addEventListener('keydown', (e) => {
    if (!state.active) return;
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); state.sheet ? closeSheet() : state.t >= roomAt ? home() : goStation(-1); return; }
    if (state.sheet) return;
    const down = ['ArrowDown', 'PageDown', 's', 'S'].includes(k), up = ['ArrowUp', 'PageUp', 'w', 'W'].includes(k);
    if (down || up) { e.preventDefault(); e.stopImmediatePropagation(); if (reduce() || k.startsWith('Page')) { if (!e.repeat) goStation(down ? 1 : -1); } else held = down ? 1 : -1; return; }
    if (['ArrowLeft', 'ArrowRight'].includes(k)) { e.preventDefault(); e.stopImmediatePropagation(); yaw += (k === 'ArrowLeft' ? 1 : -1) * 0.12; const kl = state.t >= roomAt ? 1.75 : 1.3; yaw = Math.max(-kl, Math.min(kl, yaw)); return; }
    if (!mine(e) && !['Tab', 'Enter', ' '].includes(k)) e.stopImmediatePropagation();
  }, true);
  addEventListener('keyup', (e) => { if (state.active && ['ArrowDown', 'ArrowUp', 's', 'S', 'w', 'W'].includes(e.key)) { held = 0; state.tTarget = state.t; } }, true);
  let wheelT = 0;
  addEventListener('wheel', (e) => {
    if (!state.active || mine(e)) return; e.preventDefault(); e.stopImmediatePropagation();
    if (reduce()) { const now = performance.now(); if (now - wheelT > 600 && Math.abs(e.deltaY) > 4) { wheelT = now; goStation(Math.sign(e.deltaY)); } return; }
    state.tTarget = clamp(state.tTarget + Math.max(-60, Math.min(60, e.deltaY)) * 0.00042);
  }, { capture: true, passive: false });
  let drag = null;
  addEventListener('pointerdown', (e) => { if (!state.active || mine(e)) return; e.stopImmediatePropagation(); drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() }; }, true);
  addEventListener('pointermove', (e) => { if (!state.active || !drag || mine(e)) return; e.stopImmediatePropagation();
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    const lim = state.t >= roomAt ? 1.75 : 0.9; yaw = Math.max(-lim, Math.min(lim, yaw - dx * 0.0042)); pitch = Math.max(-0.6, Math.min(0.55, pitch - dy * 0.0036)); }, true);
  addEventListener('pointerup', (e) => { if (!state.active || mine(e)) return; e.stopImmediatePropagation();
    const d0 = drag; drag = null; if (!d0 || Math.hypot(e.clientX - d0.x0, e.clientY - d0.y0) > 6 || state.t < roomAt) return;
    // a tap on the root: recognise it, or (once known) open its record
    const ray = new THREE.Raycaster(), m = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(m, cam);
    if (ray.intersectObjects(rootMeshes, false).length) state.recognised ? openSheet() : recognise();
    else if (ray.intersectObjects(questMeshes, false).length) { state.questTapped = true; say('The Quest Cave: a way further in, not yet opened. It can be opened on S33D.life.'); } }, true);
  ['touchstart', 'touchmove'].forEach((ev) => addEventListener(ev, (e) => { if (state.active && !mine(e)) e.stopImmediatePropagation(); }, { capture: true, passive: true }));

  // ── the shared navigation layer knows where the Wanderer is, and "back" means back up.
  const hookNav = () => { const N = window.TETOL_NAV; if (!N || N.__roots) return; N.__roots = true; const w0 = N.where, r0 = N.run;
    N.where = function () { if (!state.active) return w0.apply(this, arguments); const inRoom = state.t >= roomAt;
      const qv = ui.querySelector('.qname.on');
      if (inRoom && qv) return { kind: 'roots', id: 'quest-cave', label: 'Quest Cave', sub: 'Off the Ancient Friends Cavern', address: 'heartwood/root-descent/cavern/quest-cave', trail: ['TETOL', 'Inside Heartwood', 'Ancient Friends', 'Cavern', 'Quest Cave'] };
      return { kind: 'roots', id: inRoom ? 'cavern' : 'root-descent', label: inRoom ? (state.recognised && friend ? friend.name : 'A chamber beneath the roots') : 'The root descent', sub: 'Beneath Heartwood',
        address: inRoom && friend ? friend.spatialAddress : 'heartwood/root-descent', trail: ['TETOL', 'Inside Heartwood', 'Ancient Friends', ...(inRoom ? ['Cavern'] : ['Descent'])] }; };
    N.run = function (name, arg, src) { if (!state.active) { if (name === 'enter' && arg === 'roots') { begin(); return true; } return r0.apply(this, arguments); }
      if (name === 'back' || name === 'returnToTree') { state.t >= roomAt ? home() : goStation(-1); return true; } return false; }; };

  whenTree((TT) => { T = TT; THREE = T.THREE; stage = document.querySelector('three-d-stage'); cam = T.cam; controls = T.controls; build(); hookNav(); });
  window.TETOL_ROOTS = { questFocus: () => questFocus, look: (y, p = 0) => { yaw = y; pitch = p; }, state, begin, home, jump: (t) => { state.tTarget = clamp(t); if (reduce()) state.t = state.tTarget; }, place: (t) => { state.t = state.tTarget = clamp(t); }, stations: () => stationT.slice(), recognise, openSheet, closeSheet, get friend() { return friend; } };
})();

;
// TETOL 0.9.5 · SPATIAL COVERAGE PASS (25 Sep 2026). EXPERIMENT · NOT CANONICAL · NOT DEPLOYED · NOT PUBLISHED.
// The goal is a floorplan, not finished rooms: every meaningful function of the live S33D.life app gets a HOME
// in the Tree (a realm, room, subroom, object, passage, view, overlay, outside-world encounter or web handoff).
// Missing places begin as a doorway, shelf, hatch, ring, table or shell. Nothing here is a finished interior.
//
// Three layers stay separate:
//   LIVE S33D.LIFE APP   what exists (routes from S33D-life/ancient-roots-map@85c0641, src/App.tsx + src/config/heartwoodRooms.ts)
//   TETOL 3D             what exists spatially (this file adds the doorways, objects and shells)
//   REVISION 3           where each function belongs (the ONE registry: window.TETOL_ROUTES in tetol-routes.js)
//
// Every added place has: APPROACH (a label you can choose, or turning to face it) · ENTER/FOCUS (the camera flies to it)
// · RECOGNITION (its card: what it is, what it holds, where it lives on S33D.life) · RETURN (Back to the hearth /
// Step back out; the live app opens in a new tab so TETOL stays at the same address).
// Private data is never shown: Hearth, Life Groves and the Vault are doorways only.
(() => {
  const D = window.TETOL; if (!D) return;
  const n = D.nodes, APP = 'https://www.s33d.life', q = new URLSearchParams(location.search);
  const ext = (D.ext ||= { anchors: {}, views: {} });
  const SRC_LIVE = 'S33D.life app · src/App.tsx + src/config/heartwoodRooms.ts @85c0641';
  const SRC_REV3 = 'TETOL Revision 3 spatial addresses (tetol-routes.js)';
  const ACCESS = { visitor: 'Open to all', member: 'For members · sign in on arrival', steward: 'Tended by keepers · sign in on arrival', advanced: 'Advanced · keepers and developers only', unknown: 'Open to all' };

  // ── one handoff shape, reused everywhere: spatial object → recognise → OPEN LIVE S33D VIEW (new tab) → still here
  const hand = (route, access, label) => ({ label, sub: ACCESS[access] + ' · opens on S33D.life in a new tab', href: APP + route });
  const where = (id, route, access, address) => [
    { k: 'On S33D.life', v: route + ' · ' + ACCESS[access], status: 'LIVE' },
    { k: 'Spatial address', v: address + ' (Revision 3)', status: 'PROPOSED' },
    { k: 'Return', v: 'The live view opens in a new tab. This place stays open here, so closing that tab returns you to it.', status: 'PROPOSED' },
  ];
  const place = (id, room, parent, o) => {
    n[id] = { parent, spatial: true, room, scale: 'place', lives: [], notes: [], status: 'LIVE', statusNote: 'A working part of the S33D.life app.',
      placement: 'PROPOSED', sources: [SRC_LIVE, SRC_REV3], coverage: true, ...o,
      relations: [...(o.relations || []), ...(room === 'hw' ? [{ to: 'hwroom', dim: 'place', text: 'Back to the hearth' }] : room === true ? [{ to: 'croom', dim: 'place', text: 'Back to the Council fire' }] : [])] };
    return n[id];
  };
  const shellNote = { status: 'PROPOSED', text: 'Coverage pass (0.9.5): a doorway or object only, so the place can be found. Its interior is not built and nothing about it is invented.' };

  // ═════════════ HEARTWOOD · the missing destinations ═════════════
  const HWN = [];
  const hwPlace = (id, o, route, access, label, address) => { HWN.push(id); return place(id, 'hw', 'hwroom', { ...o, where: where(id, route, access, address), actions: [...(o.actions || []), ...(route ? [hand(route, access, label)] : [])], notes: [...(o.notes || []), shellNote] }); };

  // 0.9.6 DEEPER RINGS (TEOTAG 28 Sep): long memory, commons and protected knowledge live in a low ring chamber beneath the hall,
  // reached down through the Seed Cellar. The Tap Root is the closed central shaft beneath it. Built in tetol-deeper-rings.js.
  const DPN = [];
  const deepPlace = (id, o, route, access, label, address) => { DPN.push(id); return place(id, 'deep', 'h_deep', { ...o, where: where(id, route, access, address), actions: [...(o.actions || []), ...(route ? [hand(route, access, label)] : [])], notes: [...(o.notes || []), shellNote],
    relations: [...(o.relations || []), { to: 'h_seed', dim: 'place', text: 'Back up through the Seed Cellar' }] }); };

  hwPlace('h_arborium', { name: 'The Arborium', sub: 'Field guide to the living world', part: 'Shelves in the wall · halfway up the spiral',
    practical: 'Field guide to the living world: species volumes.', purpose: 'The Tree’s field guide. Each species has a volume here; the species pages of S33D.life open from these shelves.',
    location: 'A shelved niche in the trunk wall, reached along the spiral of grown wood.', placementNote: 'OBJECT that may later grow into a SUBROOM. Species identity is shared with the Staff Spiral and the Hives by cross-link, not merged.',
    lives: [{ text: 'Species volumes (/species/:slug)', status: 'LIVE' }] }, '/library/arborium', 'visitor', 'Open the Arborium', 'heartwood/arborium');

  hwPlace('h_greenhouse', { name: 'Greenhouse', sub: 'Saplings and growing care', part: 'A glazed door high in the trunk · toward the light',
    practical: 'Saplings and growing care: track plants and saplings.', purpose: 'Where living care is grown. Its real imagery remains the visual authority, so only its doorway is shown here.',
    location: 'A pale, glazed doorway high on the wall where the light falls in.', placement: 'UNRESOLVED', placementNote: 'Position TO BE RESOLVED (Revision 3 notes it as warmer and lighter than the Heartwood shell). Doorway only; no interior invented.' },
    '/library/greenhouse', 'member', 'Open the Greenhouse', 'heartwood/greenhouse');

  hwPlace('h_wishing', { name: 'Wishing Tree', sub: 'Trees you dream to visit', part: 'A young tree growing from the rings',
    practical: 'Trees you dream to visit. Wishes are tied to it as ribbons.', purpose: 'A living thing inside the hall rather than another room. Its relation to the Crown (dreams that might grow) is kept open.',
    location: 'A sapling rising from the growth-ring floor, hung with ribbons.', placementNote: 'OBJECT / living feature, per TEOTAG. Name kept as the app has it: Wishing Tree room, Dreams inside.',
    relations: [{ to: 'crown', dim: 'web', text: 'Dreams may ripen toward the Crown (open question)' }] }, '/library/wishlist', 'member', 'Open the Wishing Tree', 'heartwood/wishing-tree');

  hwPlace('h_bookshelf', { name: 'Bookshelf', sub: 'What has moved you', part: 'The reading and writing corner',
    practical: 'What has moved you: books kept in the Tree.', purpose: 'Books that have moved people, kept together. The Print Press stands beside it.',
    location: 'A bookcase recess in the wall, beside the passage to the Staff Room.', placementNote: 'OBJECT in the reading & writing corner.',
    relations: [{ to: 'h_press', dim: 'place', text: 'The Print Press, beside it' }] }, '/library/bookshelf', 'member', 'Open the Bookshelf', 'heartwood/reading-writing/bookshelf');

  hwPlace('h_press', { name: 'Print Press', sub: 'The Living Printing Press', part: 'The reading and writing corner',
    practical: 'The Living Printing Press.', purpose: 'Where what is written in S33D is pressed into pages.',
    location: 'A small press standing in front of the Bookshelf.', placementNote: 'OBJECT beside the Bookshelf.',
    relations: [{ to: 'h_bookshelf', dim: 'place', text: 'The Bookshelf, behind it' }] }, '/press', 'visitor', 'Open the Print Press', 'heartwood/reading-writing/press');

  deepPlace('h_scrolls', { name: 'Scrolls & Records', sub: 'The remembered rings of the grove', part: 'The Deeper Rings · the long-memory archive',
    practical: 'The long memory: records rolled and kept in the deep rings.', purpose: 'What the Tree has remembered for a long time settles down here, below the lived hall. Council records and the Tree Ledger point here.',
    location: 'An archive doorway in the Deeper Rings, its walls pigeon-holed with rolled records.', placementNote: 'SUBROOM doorway in the Deeper Rings (TEOTAG 28 Sep: the long-memory archive). Was: floor rings in the hall (0.9.5).',
    lives: [{ text: 'Council records (/council/records) settle here', status: 'LIVE' }, { text: 'Tree Ledger (/ledger)', status: 'LIVE' }],
    actions: [hand('/council/records', 'visitor', 'Council records'), hand('/ledger', 'visitor', 'The Tree Ledger')],
    relations: [{ to: 'croom', dim: 'time', text: 'Remembered Circles come down from the Council' }] }, '/library/scrolls', 'steward', 'Open Scrolls & Records', 'heartwood/deeper-rings/scrolls');

  deepPlace('h_vault', { name: 'Vault', sub: 'Hold value safely', part: 'The Deeper Rings · a closed strongroom door',
    practical: 'Hold value safely. Your assets are kept behind this door.', purpose: 'One strongroom with two live routes (/library/vault and /vault). Nothing of what it holds is shown here.',
    location: 'A heavy, iron-bound door in the wall of the Deeper Rings, closed.', placementNote: 'SUBROOM · doorway only, in the Deeper Rings (TEOTAG 28 Sep). Private: no balances or assets are read or shown.',
    lives: [{ text: 'Your assets (/assets)', status: 'LIVE' }], actions: [hand('/vault', 'member', 'Open the Vault (standalone)')] }, '/library/vault', 'member', 'Open the Vault', 'heartwood/deeper-rings/vault');

  hwPlace('h_rhythms', { name: 'Rhythms', sub: 'Seasonal ecological cycles', part: 'This season’s ring, on the floor',
    practical: 'Seasonal ecological cycles, read from the ring that is forming now.', purpose: 'A way of looking, not a room: the season’s ring forming in the floor is read as time. Cycle markets live in this reading.',
    location: 'The golden ring still forming near the wall.', placementNote: 'VIEW (temporal reading of the Seasonal Ring). The ring was already built; this pass gives it its Rhythms reading and a door to the live view.',
    lives: [{ text: 'Cycle markets (/markets/:id)', status: 'LIVE' }, { text: 'Cosmic Calendar (/cosmic) · proposed to fold into one Time lens', status: 'LIVE' }],
    relations: [{ to: 'ring', dim: 'time', text: 'The same season, on the trunk outside' }] }, '/library/rhythms', 'steward', 'Open Rhythms', 'heartwood/seasonal-ring');

  deepPlace('h_taproot', { name: 'Tap Root', sub: 'Dev Room · tend the system', part: 'The closed shaft at the centre of the Deeper Rings',
    practical: 'Tend the system. For keepers and developers only.', purpose: 'The taproot goes straight down from the heart of the Tree: the deepest, keeper-only layer. The Ancient Friends are not down here; they are the lateral roots spreading out into the world.',
    location: 'The Tree’s own taproot descending through a closed, grown-over well at the centre of the Deeper Rings.', placement: 'PROPOSED', placementNote: 'GATED PASSAGE, closed (TEOTAG 28 Sep): vertical root → Tap Root; lateral roots → Ancient Friends Cavern. No interior.',
    lives: [{ text: 'Admin, curator, Bug Garden, Agent Garden and Moonroot tools (gated)', status: 'LIVE' }] }, '/library/tap-root', 'advanced', 'Open the Dev Room', 'heartwood/deeper-rings → taproot');

  hwPlace('h_lifegroves', { name: 'Life Groves', sub: 'Births, memorials, unions, family trees', part: 'A doorway along the spiral',
    practical: 'Groves planted for lives: births, memorials, unions and family trees.', purpose: 'Personal and family groves. Only the doorway is shown; no grove, name or person is read here.',
    location: 'A quiet doorway high on the spiral, with a faint green light.', placementNote: 'SUBROOM · doorway only. Private data is not exposed in this pass. Invitations arrive through the Staff Room (/life-grove-invite/:token).',
    lives: [{ text: 'Create a Life Grove (/heartwood/life-groves/new)', status: 'LIVE' }] }, '/heartwood/life-groves', 'member', 'Open Life Groves', 'heartwood/life-groves');

  deepPlace('h_commons', { name: 'Tree Data Commons', sub: 'Datasets observatory', part: 'The Deeper Rings · the commons doorway',
    practical: 'The deeper records layer: open tree datasets and where they come from.', purpose: 'Where the research records that the Outside World shows come from: shared knowledge kept deep, where it can grow again.',
    location: 'A low doorway in the wall of the Deeper Rings, with a cool light and stacked slates.', placementNote: 'SUBROOM / deeper records layer, in the Deeper Rings (TEOTAG 28 Sep).',
    lives: [{ text: 'Tree Projects directory (/tree-projects)', status: 'LIVE' }, { text: 'Planetary dataset coverage (/atlas-expansion)', status: 'LIVE' }, { text: 'Dataset agents (/discovery-agent, /dataset-watcher) and the seed-plan generator', status: 'LIVE' }],
    actions: [hand('/tree-projects', 'visitor', 'Tree Projects')], relations: [{ to: 'outside', dim: 'web', text: 'The research records it feeds, out on the land' }] },
    '/tree-data-commons', 'visitor', 'Open the Tree Data Commons', 'heartwood/deeper-rings/commons');

  hwPlace('h_hearth', { name: 'Hearth', sub: 'Your own chamber', part: 'A warm doorway beside the Staff Room passage',
    practical: 'Your personal hub: journey, notifications, profile and TEOTAG.', purpose: 'The Wanderer’s own chamber, kept with Heartwood, with a direct way through to the Staff Room. Only the doorway is shown; nothing personal is read.',
    location: 'A warm doorway at the foot of the wall, next to the passage to the Staff Room.', placementNote: 'Personal chamber associated with Heartwood (TEOTAG). Not part of the Trunk Map room count. Doorway only.',
    lives: [{ text: 'My Sovereign Data export (/living-archive)', status: 'LIVE' }],
    actions: [{ label: 'Through to the Staff Room', sub: 'The direct way from your Hearth', go: '@interior:staffroom' }],
    relations: [{ to: 'staff', dim: 'place', text: 'A direct way through to the Staff Room' }, { to: 'moonroot', dim: 'web', text: 'Moonroot, your root of remembering (candidate)' }] },
    '/dashboard', 'member', 'Open your Hearth', 'heartwood/hearth');

  hwPlace('h_startrail', { name: 'Star Trail', sub: 'Your path through S33D', part: 'Stars rising in the light shaft',
    practical: 'Your path through S33D, drawn across the whole Tree.', purpose: 'Not a room: a trail through every realm. Here it shows as stars rising in the light; from outside, it can be drawn across the whole Tree.',
    location: 'A thread of faint stars rising up the shaft of light above the hearth.', placementNote: 'WHOLE-TREE OVERLAY. No Star Room. The trail shown is an example path through the realms, not your data.',
    actions: [{ label: 'Show the Star Trail across the Tree', sub: 'Step outside and draw it through every realm', go: '@startrail' }] }, '/library/star-trail', 'member', 'Open your Star Trail', 'overlay/star-trail');

  // the Deeper Rings chamber itself (no anchor: it is entered by walking down through the Seed Cellar)
  place('h_deep', 'deep', 'h_seed', { name: 'The Deeper Rings', sub: 'Long memory, beneath the hall', part: 'Down through the Seed Cellar',
    practical: 'The long memory of the Tree: commons, archive and protected knowledge.', purpose: 'A low ring-shaped chamber in the deep rings beneath the hall: older, quieter, compressed. Three doorways and, at its centre, the closed Tap Root.',
    location: 'Beneath the Heartwood floor, reached down through the Seed Cellar.', placementNote: 'TEOTAG 28 Sep. Heartwood Hall = lived, relational memory; Deeper Rings = long memory, commons, protected knowledge; Tap Root = deepest keeper layer.',
    lives: [{ text: 'Tree Data Commons · Vault · Scrolls & Records', status: 'LIVE' }, { text: 'The Tap Root, closed, at the centre', status: 'LIVE' }],
    actions: [{ label: 'Go down to the Deeper Rings', sub: 'Through the Seed Cellar', go: '@deeper' }],
    relations: [{ to: 'h_seed', dim: 'place', text: 'Up through the Seed Cellar' }, { to: 'h_commons', dim: 'place', text: 'The commons doorway' }, { to: 'h_vault', dim: 'place', text: 'The strongroom' }, { to: 'h_scrolls', dim: 'place', text: 'The long-memory archive' }, { to: 'h_taproot', dim: 'place', text: 'The closed shaft at the centre' }], notes: [] });
  if (n.h_seed) { n.h_seed.actions = [{ label: 'Go down to the Deeper Rings', sub: 'Long memory, beneath the hall', go: '@deeper' }, ...(n.h_seed.actions || [])];
    n.h_seed.part = 'The threshold down to the Deeper Rings'; (n.h_seed.relations ||= []).unshift({ to: 'h_deep', dim: 'place', text: 'Down, to the Deeper Rings' }); }

  // existing Heartwood places: their Revision 3 relationships made visible
  if (n.h_atlas) { n.h_atlas.actions = [{ label: 'Look out onto the land', sub: 'The Outside World: map, gardens, groves, research', go: 'outside' }, ...(n.h_atlas.actions || [])]; (n.h_atlas.relations ||= []).unshift({ to: 'outside', dim: 'place', text: 'The land this window looks out on' }); }
  if (n.h_friends) (n.h_friends.lives ||= []).push({ text: 'Beneath: the Ancient Friends Cavern · the Quest Cave opens off it', status: 'PROPOSED' });
  if (n.h_staff) (n.h_staff.relations ||= []).push({ to: 'h_hearth', dim: 'place', text: 'Your Hearth, beside the passage' });
  if (n.hwroom) { n.hwroom.relations = [...(n.hwroom.relations || []), ...HWN.map((id) => ({ to: id, dim: 'place', text: n[id].part }))];
    n.hwroom.notes = (n.hwroom.notes || []).map((x) => /Five of the app/.test(x.text) ? { status: 'LIVE', text: 'Coverage pass (0.9.5): every Heartwood destination of the live app now has a place here: rooms, doorways, objects or a view. Most are doorways only.' } : x); }

  // ═════════════ COUNCIL / CANOPY · the Treehouse deck ═════════════
  const CN = [];
  const cPlace = (id, o, route, access, label, address) => { CN.push(id); return place(id, true, 'croom', { ...o, where: route ? where(id, route, access, address) : o.where, actions: [...(o.actions || []), ...(route ? [hand(route, access, label)] : [])], notes: [...(o.notes || []), shellNote] }); };
  cPlace('c_learn', { name: 'Curriculum lectern', sub: 'Learning · the living curriculum', part: 'On the deck · by the rail',
    practical: 'What the Council is learning together.', purpose: 'The Canopy is the living curriculum, where learning becomes practice. The lectern holds what each Circle studies.',
    location: 'A lectern at the deck rail, beside the Circle’s seats.', placementNote: 'OBJECT on the deck. The curriculum is held in the Council of Life pages; no separate room.' }, '/council-of-life', 'visitor', 'Open the Council of Life', 'canopy/treehouse/curriculum');
  cPlace('c_moon', { name: 'Moon dial', sub: 'Weekly and lunar rhythm', part: 'Set into the deck boards',
    practical: 'When the Council gathers: the weekly and lunar rhythm.', purpose: 'The Time of the Council (Moon · Sun/Earth · Chol Q’ij · People) is read at the fire; this dial is where that rhythm lives on the deck.',
    location: 'A pale dial set into the deck, between the fire and the seats.', placementNote: 'OBJECT. The Time of the Council layer is a proposal (not canonical, not synced).',
    relations: [{ to: 'ring', dim: 'time', text: 'The Tree’s own season' }] }, '/cosmic', 'visitor', 'Open the Cosmic Calendar', 'canopy/treehouse/rhythm');
  cPlace('c_records', { name: 'Records chest', sub: 'Council records · harvests', part: 'Beside the Treehouse door',
    practical: 'The Council’s records: past sessions and what was harvested.', purpose: 'Recent memory stays on the deck; long memory settles down into Heartwood’s growth rings.',
    location: 'A chest at the deck rail, beside the Circle’s seats.', placementNote: 'OBJECT. Records pass down to heartwood/growth-rings (Scrolls & Records).',
    actions: [hand('/harvest', 'visitor', 'The Guardian Harvest Exchange')], relations: [{ to: 'h_scrolls', dim: 'time', text: 'Down into the long memory of the Deeper Rings' }, { to: 'c233rec', dim: 'place', text: 'Circle 233’s own record, through the door' }] },
    '/council/records', 'visitor', 'Open the Council records', 'canopy/treehouse/records');
  cPlace('c_hives', { name: 'Species Hives', sub: 'Communities around a species family', part: 'Hung from a limb above the deck',
    practical: 'Species Hives: trees, ecology, lore, offerings and governance of one family.', purpose: 'Hives keep their own ecological and community meaning; they share species identity with the Arborium and the Staff Spiral, but are not merged with them.',
    location: 'A hive hanging from the oak limb at the deck’s edge.', placementNote: 'OBJECT (Revision 3: canopy/hives). One object for the index; no room per hive.' }, '/hives', 'visitor', 'Open the Species Hives', 'canopy/hives');
  if (n.croom) { (n.croom.relations ||= []).push(...CN.map((id) => ({ to: id, dim: 'place', text: n[id].part })));
    (n.croom.actions ||= []).push(hand('/council-of-life', 'visitor', 'The Council of Life on S33D.life')); }

  // ═════════════ OUTSIDE WORLD · the land-facing functions (not the website) ═════════════
  place('outside', undefined, 'overview', { name: 'The Outside World', sub: 'The land around the Tree', part: 'Where the Tree meets the land',
    practical: 'The land: maps, real Ancient Friends, research records, gardens, groves and pathways.', purpose: 'Everything S33D does on the land lives out here. Ancient Friends are met on the land and remembered below; research records wait here until someone visits them.',
    location: 'A path of stones leading away from the Tree, with a waymarker.', placementNote: 'OUTSIDE WORLD zone (Revision 3). It is not the live website; the land itself is not rebuilt in 3D.',
    lives: [{ text: 'The map of Ancient Friends (/map)', status: 'LIVE' }, { text: 'Research Forest records: unverified, waiting to be visited (outside-world/land/research/:id). Not a room.', status: 'LIVE' },
      { text: 'Gardens (/garden/:slug) · Groves (/groves) · Pathways (/pathways, /atlas/pathways/:slug)', status: 'LIVE' }, { text: 'Arrivals from outside: shares and Telegram', status: 'LIVE' }],
    actions: [hand('/map', 'visitor', 'Open the map'), hand('/groves', 'visitor', 'Groves'), hand('/pathways', 'visitor', 'Pathways'), hand('/add-tree', 'member', 'Map a new Ancient Friend'), hand('/discovery', 'visitor', 'Discovery')],
    where: where('outside', '/map', 'visitor', 'outside-world/land'),
    relations: [{ to: 'roots', dim: 'place', text: 'The Tree’s roots, where Friends are met' }, { to: 'h_atlas', dim: 'place', text: 'The Map Room window in Heartwood looks out here' }, { to: 'yew', dim: 'web', text: 'One Friend on the land: the Ankerwycke Yew' }],
    notes: [{ status: 'PROPOSED', text: 'Coverage pass (0.9.5): a waymarker and path only. Research Forest stays an evidence/record interface here, not a built place.' }] });
  if (n.roots) { (n.roots.relations ||= []).push({ to: 'outside', dim: 'place', text: 'Out onto the land' });
    n.roots.actions = [{ label: 'Go down to the Ancient Friends Cavern', sub: 'Through Heartwood, down the root passage', go: '@roots' }, ...(n.roots.actions || [])]; }

  // ═════════════ CROWN · one realm, legible (no redesign) ═════════════
  if (n.crown) { const c = n.crown;
    c.purpose = 'The Crown lets the Wanderer turn what has been encountered, remembered and learned through the Tree into a possibility for what might grow next.';
    c.lives = [...(c.lives || []).filter((x) => !/Golden Dream/.test(x.text || '')), { text: 'yOur Golden Dream (/golden-dream)', status: 'LIVE' }, { text: 'Future-facing signals: Crown listening', status: 'PROPOSED' },
      { text: 'Seeds, growing experiments and ripening ideas (the roadmap, canopy projection)', status: 'LIVE' }, { text: 'Patronage (/patron-offering)', status: 'LIVE' }];
    c.actions = [...(c.actions || []), hand('/roadmap', 'visitor', 'The Living Forest Roadmap'), hand('/canopy-projection', 'visitor', 'Canopy projection')];
    (c.notes ||= []).push({ status: 'PROPOSED', text: 'Crown direction recorded (TEOTAG, 25 Sep). Direction only: the Crown is not rebuilt in this pass. One realm; no rooms.' }); }
  place('crown_seeds', undefined, 'crown', { name: 'Ripening ideas', sub: 'Seeds of what might grow next', part: 'Among the crown’s highest leaves',
    practical: 'What might grow next: seeds, experiments and ideas ripening.', purpose: 'Part of the one Crown realm. The Golden Dream’s roadmap and experiments ripen here before they fall as seeds.',
    location: 'A few pale seeds hanging among the crown’s highest leaves.', placementNote: 'OBJECT within the Crown realm. No detailed redesign.',
    actions: [hand('/golden-dream', 'visitor', 'Open yOur Golden Dream')], where: where('crown_seeds', '/golden-dream', 'visitor', 'crown'),
    relations: [{ to: 'crown', dim: 'place', text: 'The Crown' }, { to: 'h_wishing', dim: 'web', text: 'Dreams from the Wishing Tree (open question)' }], notes: [shellNote] });

  // ═════════════ STAFF SYSTEM · one threshold, five things kept distinct ═════════════
  if (n.staff) { const s = n.staff;
    s.lives = [...(s.lives || []), { text: 'STAFF ROOM: the threshold place (built, experiment)', status: 'PROPOSED' }, { text: 'STAFF SPIRAL: the living navigation, inlaid in the roundhouse floor (built, experiment)', status: 'PROPOSED' },
      { text: 'STAFF LIBRARY: the full collection (/library/staff-room)', status: 'LIVE' }, { text: 'INVENTORY: the underlying record truth. No room.', status: 'LIVE' }, { text: 'STAFF WORKSHOP: a proposed making place. Not built.', status: 'UNRESOLVED' }];
    s.actions = [...(s.actions || []), hand('/library/staff-room', 'member', 'The Staff Library (full collection)')];
    (s.relations ||= []).push({ to: 'h_hearth', dim: 'place', text: 'A direct way to your Hearth' });
    (s.notes ||= []).push({ status: 'PROPOSED', text: 'No staff token numbers are shown anywhere in TETOL.' }); }

  // List view: the same places without 3D
  const lt = D.listTree && D.listTree.find((x) => x.id === 'trunk'), hwl = lt && (lt.children || []).find((x) => x.id === 'hwroom');
  if (hwl) { HWN.forEach((id) => hwl.children.push({ id })); const sc = hwl.children.find((x) => x.id === 'h_seed'); if (sc) sc.children = [{ id: 'h_deep', children: DPN.map((id) => ({ id })) }]; }
  if (D.listTree) { const rt = D.listTree.find((x) => x.id === 'roots'); if (rt) (rt.children ||= []).push({ id: 'outside' }); const cr = D.listTree.find((x) => x.id === 'crown'); if (cr) (cr.children ||= []).push({ id: 'crown_seeds' }); }

  // ═════════════ geometry: simple, light shells in the prototype's own materials ═════════════
  // Floor doorways avoid the low turn of the spiral ledge (it passes 0.4–2.2 m above the floor for angles 0.2–1.2).
  const A = { vault: -2.55, commons: -1.12, bookshelf: 1.32, hearth: 2.56 };
  const SPI = { arborium: 0.22, lifegroves: 0.55, greenhouse: 0.72 };
  ext.keepClear = [[A.bookshelf, 0.26], [A.hearth, 0.22]]; // 0.9.6: Vault and Commons moved down into the Deeper Rings

  ext.build = (phase, c) => {
    const { THREE, V } = c;
    if (phase === 'hall') {
      const { H, addH, mat, glow, chamber, spiralAt, roomAnchors, roomViews } = c;
      const box = (w, h, d, m, name, node, par, x, y, z) => { const b = addH(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), name, node, par); b.position.set(x, y, z); return b; };
      const book = [0x6e3b2a, 0x3d4a2e, 0x7a6030, 0x2f3d4c, 0x5c2f3a].map((col) => new THREE.MeshStandardMaterial({ name: 'book', color: col, roughness: 0.85 }));
      const iron = mat.iron || new THREE.MeshStandardMaterial({ name: 'iron', color: 0x2a2620, roughness: 0.6, metalness: 0.3 });
      const shelves = (g, node, w, h, rows) => { const byCol = book.map(() => []), boards = [];   // merged: one mesh per book colour, one for the boards
        for (let r = 0; r < rows; r++) { const y = 0.25 + r * (h / rows), bg = new THREE.BoxGeometry(w - 0.1, 0.05, 0.3); bg.translate(0, y, 0.16); boards.push(bg);
          for (let x = -w / 2 + 0.12, k = 0; x < w / 2 - 0.12; k++) { const bw = 0.05 + Math.random() * 0.05, bh = 0.2 + Math.random() * 0.12, gb = new THREE.BoxGeometry(bw, bh, 0.22); gb.translate(x + bw / 2, y + 0.025 + bh / 2, 0.14); byCol[(r * 3 + k) % 5].push(gb); x += bw + 0.012; } }
        addH(new THREE.Mesh(c.mergeGeos(boards), mat.stair), node + '_shelves', node, g); byCol.forEach((gs, i) => gs.length && addH(new THREE.Mesh(c.mergeGeos(gs), book[i]), node + '_books_' + i, node, g)); };
      // Arborium: a shelved niche on the spiral
      { const q = spiralAt(SPI.arborium), m = chamber('h_arborium', q.a, q.y + 0.1, 1.5, 1.7, 0x9fc47a, { camY: q.y + 0.4, back: 5.0, glowK: 0.6 }); shelves(m.g, 'h_arborium', 1.4, 1.45, 3); }
      // Greenhouse: a glazed door toward the light (doorway only)
      { const q = spiralAt(SPI.greenhouse), m = chamber('h_greenhouse', q.a, q.y + 0.1, 1.3, 2.1, 0xcfeec0, { camY: q.y - 0.6, back: 5.4, glowK: 1.1 });
        const glass = new THREE.MeshStandardMaterial({ name: 'greenhouse_glazing', color: 0xdff3d6, emissive: 0x9fcf8a, emissiveIntensity: 0.55, transparent: true, opacity: 0.55 });
        const pane = addH(new THREE.Mesh(new THREE.ShapeGeometry(c.archShape(1.3, 2.1)), glass), 'greenhouse_glazed_door', 'h_greenhouse', m.g); pane.position.z = 0.02;
        [-0.33, 0, 0.33].forEach((x, i) => box(0.035, 2.05, 0.03, mat.rib, 'greenhouse_mullion_' + i, 'h_greenhouse', m.g, x, 1.02, 0.03)); box(1.3, 0.035, 0.03, mat.rib, 'greenhouse_transom', 'h_greenhouse', m.g, 0, 1.3, 0.03); }
      // Life Groves: a quiet doorway on the spiral (doorway only)
      { const q = spiralAt(SPI.lifegroves), m = chamber('h_lifegroves', q.a, q.y + 0.1, 1.1, 1.9, 0x7fbf6a, { camY: q.y - 0.4, back: 5.2, glowK: 0.7 });
        for (let i = 0; i < 3; i++) { const t = addH(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.36, 7), new THREE.MeshStandardMaterial({ name: 'life_grove_sapling', color: 0x5d7f3c, emissive: 0x1d3a10, emissiveIntensity: 0.8 })), 'life_grove_sapling_' + i, 'h_lifegroves', m.g); t.position.set(-0.3 + i * 0.3, 0.2, 0.05); } }
      // Bookshelf recess + Print Press in front of it: the reading & writing corner
      { const m = chamber('h_bookshelf', A.bookshelf, 0, 1.7, 2.1, 0xe0b070, { camY: 1.7, glowK: 0.55 }); shelves(m.g, 'h_bookshelf', 1.6, 1.8, 4);
        const pr = new THREE.Group(); pr.name = 'print_press'; m.g.add(pr); pr.position.set(0.25, 0, 1.25);
        box(0.8, 0.5, 0.5, mat.stair, 'press_bed', 'h_press', pr, 0, 0.25, 0); [-0.34, 0.34].forEach((x, i) => box(0.07, 1.05, 0.07, mat.rib, 'press_post_' + i, 'h_press', pr, x, 0.75, 0)); box(0.78, 0.09, 0.14, mat.rib, 'press_head', 'h_press', pr, 0, 1.25, 0);
        const scr = addH(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), iron), 'press_screw', 'h_press', pr); scr.position.set(0, 0.98, 0); box(0.5, 0.03, 0.03, iron, 'press_bar', 'h_press', pr, 0, 1.08, 0);
        box(0.42, 0.01, 0.3, new THREE.MeshStandardMaterial({ name: 'press_paper', color: 0xf0e6cc, emissive: 0x3a3020, emissiveIntensity: 0.4 }), 'press_sheet', 'h_press', pr, 0, 0.51, 0);
        const w = pr.getWorldPosition(V(0, 0, 0)).sub(c.HP); roomAnchors.h_press = H(w.x, 1.3, w.z); roomViews.h_press = [H(w.x, 0.7, w.z), H(w.x * 0.45, 1.7, w.z * 0.45)]; }
      // Hearth: a warm doorway beside the Staff Room passage (doorway only)
      { const m = chamber('h_hearth', A.hearth, 0, 1.25, 2.2, 0xff9a4a, { camY: 1.7, glowK: 0.9 }); const e = addH(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), mat.ember), 'hearth_ember_within', 'h_hearth', m.g); e.position.set(0, 0.2, -0.3); }
      // Wishing Tree: a sapling growing from the rings, hung with ribbons
      { const a = 0.62, r = 5.6, p = H(Math.sin(a) * r, 0, -Math.cos(a) * r), g = new THREE.Group(); g.name = 'wishing_tree'; g.position.copy(p); c.hw.add(g); g.position.sub(c.HP);
        const trunk = addH(new THREE.Mesh(c.taperTube(new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.05, 0.8, 0.02), V(-0.04, 1.6, 0), V(0.02, 2.2, -0.03)]), 0.11, 0.03, 30, 8, 3), mat.rib), 'wishing_tree_trunk', 'h_wishing', g);
        const lm = new THREE.MeshStandardMaterial({ name: 'wishing_leaf', color: 0x7d9a4a, emissive: 0x2a3a12, emissiveIntensity: 0.7, roughness: 0.9 });
        const brG = [], lfG = [], rbG = [[], [], [], []];   // merged: branches, leaves, ribbons by colour
        for (let i = 0; i < 7; i++) { const a2 = i * 0.9, y = 1.2 + (i % 4) * 0.25, br = [V(0, y, 0), V(Math.cos(a2) * 0.35, y + 0.25, Math.sin(a2) * 0.35), V(Math.cos(a2) * 0.6, y + 0.35, Math.sin(a2) * 0.6)];
          brG.push(c.taperTube(new THREE.CatmullRomCurve3(br), 0.03, 0.01, 12, 6, 3)); const lg = new THREE.SphereGeometry(0.2, 8, 6); lg.scale(1, 0.7, 1); lg.translate(br[2].x, br[2].y, br[2].z); lfG.push(lg);
          const rg = new THREE.PlaneGeometry(0.035, 0.4); rg.rotateY(a2); rg.translate(br[1].x, br[1].y - 0.22, br[1].z); rbG[i % 4].push(rg); }
        addH(new THREE.Mesh(c.mergeGeos(brG), mat.rib), 'wishing_branches', 'h_wishing', g); addH(new THREE.Mesh(c.mergeGeos(lfG), lm), 'wishing_leaves', 'h_wishing', g);
        rbG.forEach((gs, k) => addH(new THREE.Mesh(c.mergeGeos(gs), new THREE.MeshStandardMaterial({ name: 'wish_ribbon', color: [0xf0d080, 0xe8a0a0, 0xa0c8e8, 0xf2f0e0][k], emissive: 0x3a2a10, emissiveIntensity: 0.5, side: THREE.DoubleSide })), 'wish_ribbons_' + k, 'h_wishing', g));
        roomAnchors.h_wishing = H(p.x - c.HP.x, 2.3, p.z - c.HP.z); roomViews.h_wishing = [H(p.x - c.HP.x, 1.3, p.z - c.HP.z), H((p.x - c.HP.x) * 0.1, 2.0, (p.z - c.HP.z) * 0.1 + 1.2)]; }
      // Rhythms: the Seasonal Ring already forming in the floor (r 8.55), read as time
      { const a = 1.9 + 0.5, px = Math.cos(a) * 8.55, pz = -Math.sin(a) * 8.55; // same frame as the torus (rotation.x = -π/2, rotation.z = 1.9)
        const g2 = glow(0xf0c060, 0.9, H(px, 0.12, pz), 0.5); g2.name = 'rhythms_ring_glint'; roomAnchors.h_rhythms = H(px, 0.4, pz); roomViews.h_rhythms = [H(px * 0.85, 0.1, pz * 0.85), H(px * 0.25, 3.0, pz * 0.25)]; }
      // Star Trail: a thread of faint stars rising up the light shaft (an overlay's anchor, not a room)
      { const pts = []; for (let i = 0; i < 26; i++) { const t = i / 25, a = t * 7.5; pts.push(H(Math.cos(a) * (0.7 + t * 1.4), 2.4 + t * 12, Math.sin(a) * (0.7 + t * 1.4))); }
        { const pg = new THREE.BufferGeometry().setFromPoints(pts.map((p) => p.clone().sub(c.HP))); const tex = c.S.children.find((o) => o.isSprite)?.material.map;   // one draw: the stars as points
          const st = new THREE.Points(pg, new THREE.PointsMaterial({ name: 'star_trail_stars', color: 0xe8eeff, size: 0.3, map: tex || null, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); st.name = 'star_trail_stars'; c.hw.add(st); }
        const st = addH(new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ visible: false })), 'star_trail_pick', 'h_startrail'); st.position.copy(pts[8]).sub(c.HP);
        roomAnchors.h_startrail = pts[8].clone(); roomViews.h_startrail = [pts[12].clone(), H(0.4, 1.4, 4.2)]; }
    }
    if (phase === 'council') {
      const { W, addR, mat, glow, roomAnchors, roomViews } = c;
      const obj = (name, node, geo, m, x, y, z) => { const o = addR(new THREE.Mesh(geo, m), name, node); o.position.set(x, y, z); return o; };
      const wood = mat.deckWood || mat.bark, at = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
      const view = (id, x, y, z, k = 0.42, up = 1.35) => { roomAnchors[id] = W(x, y + 0.55, z); roomViews[id] = [W(x, y + 0.3, z), W(x * k, y + up, z * k + 0.3)]; };
      { const [x, z] = at(-1.15, 2.85); obj('curriculum_lectern_post', 'c_learn', new THREE.CylinderGeometry(0.05, 0.07, 0.95, 10), wood, x, 0.47, z); const top = obj('curriculum_lectern_top', 'c_learn', new THREE.BoxGeometry(0.5, 0.04, 0.36), wood, x, 0.98, z); top.rotation.x = -0.4; top.lookAt(W(0, 0.98, 0)); top.rotateX(-0.4);
        obj('curriculum_book', 'c_learn', new THREE.BoxGeometry(0.36, 0.04, 0.26), new THREE.MeshStandardMaterial({ name: 'curriculum_book', color: 0xefe2c0, emissive: 0x4a3a18, emissiveIntensity: 0.5 }), x, 1.02, z).rotation.copy(top.rotation); view('c_learn', x, 0.5, z); }
      { const [x, z] = at(-2.1, 1.55); const d = obj('moon_dial', 'c_moon', new THREE.CylinderGeometry(0.34, 0.34, 0.02, 40), new THREE.MeshStandardMaterial({ name: 'moon_dial', color: 0xd8dde8, emissive: 0x6070a0, emissiveIntensity: 0.45 }), x, 0.012, z);
        obj('moon_dial_shadow', 'c_moon', new THREE.CylinderGeometry(0.2, 0.2, 0.024, 40, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ name: 'moon_dial_shade', color: 0x303848 }), x, 0.014, z); view('c_moon', x, 0.05, z, -0.45, 2.1); }
      { const [x, z] = at(2.1, 3.05); const ch = obj('records_chest', 'c_records', new THREE.BoxGeometry(0.6, 0.36, 0.38), wood, x, 0.18, z); ch.lookAt(W(0, 0.18, 0));
        obj('records_chest_lid', 'c_records', new THREE.CylinderGeometry(0.19, 0.19, 0.6, 12, 1, false, 0, Math.PI), wood, x, 0.36, z).rotation.set(0, ch.rotation.y, Math.PI / 2);
        glow(0xf5dca0, 0.35, W(x, 0.62, z), 0.35); view('c_records', x, 0.2, z); }
      { const [x, z] = at(1.38, 3.25); const hv = obj('species_hive', 'c_hives', new THREE.SphereGeometry(0.26, 14, 10), new THREE.MeshStandardMaterial({ name: 'hive_wicker', color: 0xc49a4a, emissive: 0x4a2a08, emissiveIntensity: 0.5, roughness: 0.9 }), x, 1.6, z); hv.scale.set(1, 1.3, 1);
        for (let i = 0; i < 4; i++) obj('hive_band_' + i, 'c_hives', new THREE.TorusGeometry(0.2 + (i === 1 || i === 2 ? 0.06 : 0), 0.02, 6, 24), mat.gold, x, 1.35 + i * 0.16, z).rotation.x = Math.PI / 2;
        obj('hive_cord', 'c_hives', new THREE.CylinderGeometry(0.01, 0.01, 0.9, 5), mat.iron || wood, x, 2.3, z); roomAnchors.c_hives = W(x, 1.95, z); roomViews.c_hives = [W(x, 1.6, z), W(x * 0.3, 1.9, z * 0.3 + 0.4)]; }
    }
    if (phase === 'tree') {
      const { tree, add, mat, glow, anchors, views } = c; ext.anchorsRef = anchors;
      // The Outside World: a path of stones leading away from the Tree, and a waymarker
      const path = [[2.3, 2.4], [2.9, 3.0], [3.5, 3.7], [4.2, 4.3], [4.9, 5.0], [5.7, 5.6]];
      path.forEach(([x, z], i) => { const s = add(new THREE.Mesh(new THREE.CylinderGeometry(0.18 - i * 0.012, 0.2 - i * 0.012, 0.05, 10), mat.stone), 'outside_world_path_stone_' + i, 'outside'); s.position.set(x, 0.02, z); });
      { const post = add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.0, 8), mat.bark), 'outside_world_waymarker', 'outside'); post.position.set(4.55, 0.5, 4.45);
        const arm = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.03), mat.bark), 'outside_world_waymarker_arm', 'outside'); arm.position.set(4.68, 0.86, 4.5); arm.rotation.y = -0.8;
        glow(0xcfe0b0, 0.5, V(4.55, 1.05, 4.45), 0.35); }
      anchors.outside = V(4.55, 1.1, 4.45); views.outside = [V(3.6, 0.5, 3.6), V(6.6, 2.3, 8.6)];
      // Crown: ripening ideas (one realm)
      { const seedM = new THREE.MeshStandardMaterial({ name: 'crown_ripening_seed', color: 0xf5dc8a, emissive: 0xd9a441, emissiveIntensity: 0.8, roughness: 0.5 });
        [[0.55, 5.55, 0.45], [-0.5, 5.7, 0.35], [0.15, 6.05, -0.4], [0.35, 5.35, 0.75]].forEach((p, i) => { const s = add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), seedM), 'crown_ripening_seed_' + i, 'crown_seeds'); s.position.set(...p); s.scale.set(0.8, 1.2, 0.8); });
        anchors.crown_seeds = V(0.55, 5.55, 0.45); views.crown_seeds = [V(0.3, 5.6, 0.4), V(1.9, 6.3, 3.1)]; }
      // Star Trail: an example trail through every realm, drawn only when the Wanderer asks for it
      { const P = [V(4.55, 0.3, 4.45), V(1.9, 0.15, 1.5), V(0.2, 0.9, 0.55), V(-0.3, 1.6, 0.35), V(-1.6, 4.1, 0.9), V(0, 5.8, 0), V(3.4, 1.0, -2.4)];
        const curve = new THREE.CatmullRomCurve3(P), g = new THREE.Group(); g.name = 'OVERLAY_star_trail'; g.visible = false; tree.add(g);
        for (let i = 0; i <= 60; i++) { const s = glow(0xe8eeff, 0.12 + (i % 4 === 0 ? 0.08 : 0), curve.getPointAt(i / 60), 0.85); s.parent && s.parent.remove(s); g.add(s); }
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(160)), new THREE.LineDashedMaterial({ color: 0xc8d4ff, dashSize: 0.08, gapSize: 0.1, transparent: true, opacity: 0.45 })); line.computeLineDistances(); g.add(line);
        window.TETOL_STARTRAIL = { group: g, show(on) { g.visible = on != null ? !!on : !g.visible; return g.visible; } }; }
    }
  };

  // Star Trail action: show the overlay and step out to the whole Tree
  addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-go="@startrail"]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation();
    const on = window.TETOL_STARTRAIL ? window.TETOL_STARTRAIL.show() : false; if (on && window.TETOL_NAV) window.TETOL_NAV.run('goTo', 'overview'); }, true);

  // ═════════════ DEVELOPMENT-ONLY coverage overlay (?coverage=1, or Alt+Shift+C). Hidden in the normal experience. ═════════════
  const DEV = q.get('coverage') === '1';
  const mountDev = () => {
    const R = window.TETOL_ROUTES; if (!R || document.getElementById('cov-dev')) return;
    const css = document.createElement('style'); css.textContent = `
      #cov-dev { position: fixed; left: 12px; top: 12px; bottom: 12px; width: min(460px, calc(100vw - 24px)); z-index: 60; overflow: auto; background: hsl(30 14% 6% / .94); color: #e8e0cc; border: 1px solid #6a5a3a; border-radius: 12px; font: 12px/1.35 ui-monospace, Menlo, monospace; padding: 10px 12px 16px; }
      #cov-dev[hidden] { display: none; } #cov-dev h2 { font: 600 13px/1.2 ui-sans-serif, system-ui; margin: 2px 0 6px; letter-spacing: .04em; } #cov-dev .dev { color: #f0a050; font-weight: 700; }
      #cov-dev table { border-collapse: collapse; width: 100%; } #cov-dev td, #cov-dev th { padding: 3px 4px; border-bottom: 1px solid #2c261c; vertical-align: top; text-align: left; }
      #cov-dev tr[data-node] { cursor: pointer; } #cov-dev tr[data-node]:hover { background: #2a2418; }
      #cov-dev .B { color: #8fd47a; } #cov-dev .P { color: #e8c060; } #cov-dev .M { color: #f07a6a; } #cov-dev .N { color: #8a8a8a; }
      #cov-dev .sum span { display: inline-block; margin: 0 10px 4px 0; } #cov-dev .x { position: sticky; top: 0; float: right; background: #3a3020; color: #fff; border: 0; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
      #cov-dev select, #cov-dev input { background: #1c1810; color: #e8e0cc; border: 1px solid #4a4030; border-radius: 6px; padding: 4px; font: inherit; margin: 0 6px 6px 0; }
      #cov-dev.min { bottom: auto; } #cov-dev.min table, #cov-dev.min select { display: none; }
      @media (max-width: 600px) { #cov-dev.min { height: auto; } #cov-dev { top: auto; height: 62dvh; left: 6px; right: 6px; width: auto; bottom: 6px; } #cov-dev td:nth-child(3) { display: none; } }`;
    document.head.appendChild(css);
    const el = document.createElement('div'); el.id = 'cov-dev'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Development: spatial coverage');
    const cls = { BUILT: 'B', PARTIAL: 'P', MISSING: 'M', NONE: 'N' };
    const draw = () => { const f = el.querySelector('#cov-f')?.value || '', s = el.querySelector('#cov-s')?.value || '', rows = R.ledger().filter((x) => (!f || x.realm === f) && (!s || x.status === s)), c = R.coverage();
      const realms = [...new Set(R.ledger().map((x) => x.realm))];
      el.innerHTML = `<button class="x" type="button">Close</button><button class="x mn" type="button" style="margin-right:6px">${el.classList.contains('min') ? 'List' : 'Markers only'}</button><h2><span class="dev">DEVELOPMENT ONLY</span> · spatial coverage · 0.9.5</h2>
        <div class="sum"><span>${c.total} routes</span><span class="B">BUILT ${c.BUILT}</span><span class="P">PARTIAL ${c.PARTIAL}</span><span class="M">MISSING ${c.MISSING}</span><span class="N">NO ROOM ${c.NONE}</span></div>
        <select id="cov-f"><option value="">all realms</option>${realms.map((r) => `<option ${r === f ? 'selected' : ''}>${r}</option>`).join('')}</select>
        <select id="cov-s"><option value="">all status</option>${['BUILT', 'PARTIAL', 'MISSING', 'NONE'].map((r) => `<option ${r === s ? 'selected' : ''}>${r}</option>`).join('')}</select>
        <table><tr><th>live route</th><th>status · type</th><th>spatial address</th></tr>${rows.map((x) => `<tr data-node="${x.node}" title="${(x.entry || '').replace(/"/g, '')}"><td>${x.route}</td><td class="${cls[x.status]}">${x.status}<br><small>${x.form}${x.depth ? ' · ' + x.depth : ''}</small></td><td>${x.address || '—'}</td></tr>`).join('')}</table>`; };
    el.addEventListener('change', draw);
    el.addEventListener('click', (e) => { if (e.target.closest('.mn')) { el.classList.toggle('min'); draw(); return; } if (e.target.closest('.x')) { el.hidden = true; return; } const tr = e.target.closest('tr[data-node]'); if (tr && window.TETOL_NAV && D.nodes[tr.dataset.node]) window.TETOL_NAV.run('goTo', tr.dataset.node); });
    draw(); document.body.appendChild(el);
    // markers: every place in the current realm, tagged with the routes that live there and their status
    const mk = document.createElement('div'); mk.id = 'cov-mk'; mk.setAttribute('aria-hidden', 'true'); document.body.appendChild(mk);
    const mcss = document.createElement('style'); mcss.textContent = `#cov-mk { position: fixed; inset: 0; pointer-events: none; z-index: 55; } #cov-mk span { position: absolute; transform: translate(-50%, -100%); font: 600 10px/1.15 ui-monospace, Menlo, monospace; color: #111; padding: 2px 5px; border-radius: 4px; white-space: nowrap; box-shadow: 0 1px 4px #000a; }
      #cov-mk .B { background: #8fd47a; } #cov-mk .P { background: #e8c060; } #cov-mk .M { background: #f07a6a; } #cov-mk small { font-weight: 400; opacity: .8; }`; document.head.appendChild(mcss);
    const byNode = {}; R.ledger().forEach((x) => { if (x.status === 'NONE') return; (byNode[x.node] ||= []).push(x); });
    const rank = { BUILT: 0, PARTIAL: 1, MISSING: 2 };
    const tick = () => { const T = window.__tetol, A = ext.anchorsRef, sc = document.querySelector('three-d-stage')?._scene; if (!T || !A || !sc || el.hidden || window.TETOL_ROOTS?.state.active) { mk.innerHTML = ''; return requestAnimationFrame(tick); }
      const here = sc.getObjectByName('heartwood_hall_world')?.visible ? 'hw' : sc.getObjectByName('council_interior_world')?.visible ? 'croom' : 'tree';
      const pl = (id) => { const r = D.nodes[id]?.room; return r === 'hw' ? 'hw' : r === true ? 'croom' : 'tree'; };
      T.cam.updateMatrixWorld(); let h = '';
      for (const [id, rows] of Object.entries(byNode)) { const a = A[id]; if (!a || pl(id) !== here) continue; const v = a.clone().project(T.cam); if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) continue;
        const worst = rows.reduce((m, x) => (rank[x.status] > rank[m] ? x.status : m), 'BUILT'), b = rows.filter((x) => x.status === 'BUILT').length;
        h += `<span class="${cls[worst]}" style="left:${(v.x * 0.5 + 0.5) * innerWidth}px;top:${(-v.y * 0.5 + 0.5) * innerHeight}px">${(D.nodes[id]?.name || id).slice(0, 22)} <small>${b}/${rows.length}</small></span>`; }
      mk.innerHTML = h; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    window.TETOL_COVERAGE_DEV = { el, draw };
  };
  const whenReady = (fn) => (document.readyState === 'loading' ? addEventListener('DOMContentLoaded', fn) : fn());
  if (DEV) whenReady(() => setTimeout(mountDev, 300));
  addEventListener('keydown', (e) => { if (e.altKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.code === 'KeyC')) { e.preventDefault(); const el = document.getElementById('cov-dev'); if (el) el.hidden = !el.hidden; else mountDev(); } });
})();
