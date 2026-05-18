// S33D Patrons Portal — pitch deck slide renderer & navigation
//
// Extracted from deck.html's previously inline <script> block so the strict
// production CSP (script-src 'self') can serve this page without
// requiring 'unsafe-inline'. The local toggleTheme function has been
// removed — it now lives in theme-init.js and is wired up there.

const slides = [
  { id: 1, type: "cover", title: "S33D", subtitle: "A living library of ancient trees.", body: "Every tree, a book. Every moment, a page. Every life, remembered." },
  { id: 2, type: "bullets", label: "The Problem", title: "Memory is fragile.", points: [
    "Platforms disappear. Hard drives fail. Families scatter.",
    "The things people care most about — stories, music, letters, a life lived — have nowhere permanent to live.",
    "Every other memorial is static. A gravestone does not grow. A memorial page can be deleted when the company folds.",
    "And the ancient trees that have witnessed centuries of human life go unrecorded, unmapped, unmourned." ] },
  { id: 3, type: "ecology", label: "The Structure", title: "A forest ecology, not a subscription funnel.", body: "S33D is structured like a living forest. Each layer has its own role. Each one feeds the others.",
    layers: [
      { icon: "☀️", name: "Golden Dream", role: "Long-term vision. Accessible through deep participation." },
      { icon: "🌿", name: "Council of Life / S33DAO", role: "Governance. Species Councils. Staff Bearers vote." },
      { icon: "🪵", name: "Staff Patrons", role: "Lineage guardians. Minting rights. Full private library — unlocked.", hi: true },
      { icon: "📚", name: "Private Heartwood", role: "Personal and family memory infrastructure. The revenue engine." },
      { icon: "🌱", name: "The Commons", role: "The shared world. Open. Abundant. The invitation." } ],
    quote: "Not customers and subscribers. A forest ecology." },
  { id: 4, type: "bullets", label: "The Insight", title: "Two fundamentally different things.", points: [
    "Most platforms optimise attention retention. S33D optimises memory continuity.",
    "Attention retention rewards the next click. Memory continuity rewards return — for a lifetime.",
    "A child revisiting an oak twenty years later, finding their parent's offering, a childhood bloom photo, a song their grandparent left — that is not a feature. That is a reason to exist.",
    "Memory once rooted in something living does not leave." ] },
  { id: 5, type: "commons", label: "The Commons", title: "The shared world. Open. Abundant.", body: "The Commons is not a free trial. It is the invitation. It must feel genuinely rich — or nothing else has meaning.",
    items: ["Visit and map trees","Leave offerings and memories","Earn Hearts through presence","Public species libraries","Tree Radio — music tied to trees","Seasonal memory and bloom records","S33D Lotto — earned entry","Council of Life — observation"],
    note: "Without a vibrant Commons, the premium layers feel hollow. The Commons earns trust. The private layers earn revenue. These are different jobs." },
  { id: 6, type: "subscriptions", label: "Subscriptions", title: "The Decade Ring.", body: "A ten-year subscription is not a product decision. It is a philosophical one — I am building something here that I intend to still be part of in ten years.",
    tiers: [
      { name: "Monthly", price: "£10 / month", saving: "", seeds: "5 seeds / day", features: ["Personal Heartwood Library","Family Library","Unlimited whispers and offerings","Monthly Seeds allocation","Lunar Life Updates","Memorial tree designation"] },
      { name: "Annual", price: "£96 / year", saving: "Save 20% — £8/mo", seeds: "7 seeds / day", features: ["Everything in Monthly","Enhanced Seeds allocation","Priority Staff progression pathway","Decade Ring eligibility begins"], highlight: true },
      { name: "🌳 Decade Ring", price: "£600 / 10 years", saving: "Save 50% — £5/mo", seeds: "9 seeds / day", features: ["Everything in Annual","Named in Heartwood founding record","Physical acknowledgement — letter, seed","Decade Ring badge","Eligible for gifted Circle Staff milestone"], gold: true } ],
    note: "The Decade Ring is the natural bridge toward Staff Patron status. A decade of participation is what patron progression is built from." },
  { id: 7, type: "product", label: "The Layers", title: "Two paths to the library.",
    tiers: [
      { name: "🌱 Commons", price: "Free", desc: "The shared world", seeds: "3 seeds / day", features: ["Visit and map trees","Earn Hearts through presence","Limited whispers and offerings","Public species libraries","Tree Radio","S33D Lotto entry"] },
      { name: "🌿 Premium", price: "£10/mo · £96/yr · £600/decade", desc: "Memory infrastructure", seeds: "5–9 seeds / day", features: ["Personal and Family Heartwood Library","Community Library","Monthly Seeds","Lunar Life Updates","Memorial tree designation","Decade Ring — founding record"], highlight: true },
      { name: "🪵 Staff Patron", price: "Staff held", desc: "Lineage guardian", seeds: "11 seeds / day", features: ["Full private library — unlocked","Staff NFT — minting rights","Mint NFTrees — Ancient Friends","S33DAO Council voting","TEOTAG guidance — deeper AI access","TR33E Lotto — enhanced weighting"], gold: true } ],
    note: "Some people want to preserve their family's memory. They subscribe. Some people want to tend the living world and carry lineage forward. They earn a staff. Both paths lead to the library." },
  { id: 8, type: "seedmechanic", label: "The Seed Mechanic", title: "Plant. Sprout. Find. Share.", body: "Every day, each Wanderer receives Seeds to plant at Ancient Friends. Seeds sprout into Hearts within 24 hours — but only when someone finds them. Value requires two people and a tree.",
    tiers: [ { tier: "🌱 Commons", seeds: 3 }, { tier: "🌿 Premium Monthly", seeds: 5 }, { tier: "🌿 Premium Annual", seeds: 7 }, { tier: "🌳 Decade Ring", seeds: 9 }, { tier: "🪵 Staff Patron", seeds: 11 } ],
    flow: [ { step: "Plant", desc: "Wanderer plants a Seed at an Ancient Friend" }, { step: "Sprout", desc: "Seed sits at the tree — sprouting over 24 hours" }, { step: "Find", desc: "Another Wanderer visits the tree and finds the Seed" }, { step: "Share", desc: "33 Hearts to the planter · 33 to the finder · 33 to the tree" } ],
    decay: [ { window: "0–8 hours", hearts: 33, label: "Full sprout" }, { window: "8–16 hours", hearts: 13, label: "Maturing" }, { window: "16–24 hours", hearts: 3, label: "Fading" }, { window: "24+ hours", hearts: 0, label: "Expired" } ],
    note: "33 Hearts is the current sprout rate. As the network matures, S33DAO governance can reduce the rate — rewarding early Wanderers most and preserving long-term scarcity.",
    quote: "You cannot game it alone. The planter needs a finder. The finder needs to visit. Both need a real Ancient Friend." },
  { id: 9, type: "distribution", label: "Hearts Distribution", title: "777,777,777 S33D Hearts.", body: "A finite reservoir of gratitude — released slowly to reward presence, grow the arboreal atlas, seed tree-based capital pools, and guide the emergence of S33D as a regenerative commons.",
    allocations: [
      { name: "Commons Participation Rewards", pct: 28, hearts: "217,777,778", note: "Seed mechanic, visits, offerings, blooms, whispers" },
      { name: "Ancient Friends / NFTree Mapping", pct: 18, hearts: "140,000,000", note: "Mapping, photography, verification, minting" },
      { name: "Staff Patrons & Future Lineages", pct: 12, hearts: "93,333,333", note: "Founding allocation, future generations, curation" },
      { name: "S33DAO Treasury", pct: 12, hearts: "93,333,333", note: "Grants, development, governance, reserves" },
      { name: "Tree / Species / Grove Pools", pct: 10, hearts: "77,777,778", note: "Capital pools around living trees and places" },
      { name: "Subscriber Seed Drops", pct: 7, hearts: "54,444,444", note: "Monthly Seeds for Premium and Patron tiers" },
      { name: "Council of Life & Governance", pct: 5, hearts: "38,888,889", note: "Attendance, hosting, proposals, voting" },
      { name: "Founding Team & Builders", pct: 5, hearts: "38,888,889", note: "1yr cliff · 4–7yr vesting · public schedule" },
      { name: "Partnerships & Ecosystem Growth", pct: 3, hearts: "23,333,333", note: "Conservation, schools, artists, grant matching" } ] },
  { id: 10, type: "heartphases", label: "Hearts Release", title: "Old-growth value — slow, rare, meaningful.", body: "The full 777,777,777 Hearts do not circulate at once. Release mirrors the growth of a forest — abundant early to seed the network, slower and more selective as it matures.",
    phases: [
      { name: "🌱 Seed Phase", years: "Years 0–2", release: "7–11% · ~60–85M Hearts", purpose: ["Reward founding Wanderers","Test app reward logic","Seed Staff Patrons","Support early NFTree minting","Launch subscriber Seed drops","Build first capital pools"], sprout: "33 Hearts / found Seed" },
      { name: "🌿 Grove Phase", years: "Years 2–5", release: "25–33% cumulative · ~194–257M Hearts", purpose: ["Wider app growth","Regional grove pools","Species pools","Staff Patron expansion","Council governance","S33D / TR33E lotto activation"], sprout: "21 Hearts / found Seed" },
      { name: "🌳 Forest Phase", years: "Years 5–10", release: "55–66% cumulative · ~428–513M Hearts", purpose: ["Mature reward economy","Active tree capital pools","Global Ancient Friends atlas","Institutional partnerships","Broader NFTree ecosystem"], sprout: "13 Hearts / found Seed" },
      { name: "🏛️ Ancient Forest", years: "Years 10+", release: "Remaining — slow release", purpose: ["Long-term stewardship","Multi-generational rewards","Future Staff lineages","Tree nurseries","Global Council networks"], sprout: "7 Hearts / found Seed" } ] },
  { id: 11, type: "hearttypes", label: "Heart Types", title: "Three types. One economy.", body: "Internally the system distinguishes three kinds of Hearts — keeping governance clean and the encounter economy intact.",
    types: [
      { icon: "🌱", name: "Earned Hearts", desc: "From real-world participation — visits, offerings, seeds found, mapping, Council attendance.", uses: ["Discounts on subscriptions","Staking into tree pools","NFTree growth","Staff progression","Reputation and governance weight"], note: "The most culturally important. Cannot be bought." },
      { icon: "💛", name: "Purchased Hearts", desc: "Bought to support the ecosystem — for those with more resource than time.", uses: ["Fees and feature unlocks","Staking into pools","Supporting specific trees","Entering lottos"], note: "Should not alone unlock governance power." },
      { icon: "🤲", name: "Granted Hearts", desc: "Distributed by S33DAO, Staff Patrons, grants, or campaigns.", uses: ["Partnerships and pilots","School groups onboarding","Ecological organisations","Community campaigns"], note: "Keeps the system open to new communities without diluting earned status." } ],
    rules: ["Governance influence is not purchasable","Subscriber drops support participation — they do not replace it","NFTrees require real tree encounters — location, evidence, story","Capital pools remain connected to living places","Sprout rewards decline gently over time as network matures"] },
  { id: 12, type: "education", label: "Education", title: "The tree that grows with you.", body: "The memorial tree is where a life ends and is remembered. The child's tree is where a life begins and is recorded. They are the same system — opposite ends of the same arc.",
    pillars: [
      { icon: "🎮", name: "The Game", desc: "Map trees, record seasons, earn Hearts through real-world contribution — not grades, not tests. A living curriculum that goes outside." },
      { icon: "🌿", name: "Council of Life", desc: "Seasonal school gatherings rooted in the living world. Children govern their own grove, connect to the wider Council, learn stewardship through doing." },
      { icon: "📚", name: "Heartwood Library", desc: "Every child has a personal library from day one. Drawings, songs, observations, seed records. When they leave school, it travels with them." },
      { icon: "🌳", name: "Their Tree", desc: "One tree chosen or planted at the beginning. Seven years of seasonal records. Seven years of offerings. The tree holds their childhood." } ],
    arc: ["A child chooses their tree","Seasonal visits — bloom records, offerings, drawings","School Council of Life — ecological governance","Heartwood Library fills — year by year, ring by ring","They leave school — the library travels with them","They become a Wanderer — Hearts earned, Staff pathway begins","They bring their own children to their childhood tree","One day — the tree holds their memorial too"],
    quote: "A seven-year-old presses her hand against an oak. Thirty years later she comes back with her daughter. Her drawing is still there. Her daughter presses her hand against the same bark." },
  { id: 13, type: "patron", label: "The Patron Path", title: "Patronhood is cultivated. Not purchased.", body: "Staff Patrons are lineage guardians — and that must remain difficult, meaningful, and slow-growing. That scarcity creates legitimacy.",
    stages: [
      { stage: "🌱 Wanderer", meaning: "Explores the grove" },
      { stage: "🌿 Grower", meaning: "Builds continuity" },
      { stage: "🌳 Steward", meaning: "Contributes meaningfully" },
      { stage: "🗝️ Keeper", meaning: "Trusted participant" },
      { stage: "🪵 Staff Bearer", meaning: "Recognised lineage guardian" },
      { stage: "📚 Patron of the Staff Room", meaning: "Helps hold the living library" } ],
    requirements: ["Years active — continuity","Trees mapped — presence","Offerings made — contribution","Council participation — governance maturity","Seasonal return streaks — long-term rhythm","Existing steward endorsements — social integrity"] },
  { id: 14, type: "staffs", label: "The Staff Collection", title: "144 founding staffs. 144 ancient trees.", body: "The Staff NFT is not merch. It is a governance artifact — closer to a medieval guild tool, a monastic key, a library seal. You cannot mint an Ancient Friend without one.",
    tiers: [
      { name: "Family Root", count: "6", desc: "One per founding family member. The root beneath everything. Private." },
      { name: "Spiral Staffs", count: "30", desc: "Species firsts. Donation tier. Co-created. Lifetime Patron — full library unlocked forever." },
      { name: "Circle Staffs", count: "108", desc: "The Lending Grove. Loan → earn → own. 9 species circles of 12." } ],
    note: "Every founding staff anchored to a real mapped ancient UK tree. 144 trees. The genesis map of the Commonwealth." },
  { id: 15, type: "memorial", label: "The Memorial", title: "The feature that changes everything.", body: "When someone passes, they or their family choose an Ancient Friend to receive their archive — memories, music, books, letters, photos, seeds.",
    details: [
      { title: "Living", body: "The tree continues. Seasons pass. Others visit. The memorial deepens rather than fades." },
      { title: "Permanent", body: "On-chain. Immutable. Not dependent on any platform, company, or institution." },
      { title: "Controlled", body: "Family controls what is private, what is family, what is community, what is public. Time-release options." },
      { title: "Succession", body: "If the memorial tree dies, the archive passes to the nearest tree of the same species. On-chain." } ],
    quote: "The species becomes the custodian. Not a platform. Not a company. The living lineage of oak or yew carries the memory forward." },
  { id: 16, type: "lottery", label: "The Lottos", title: "S33D Lotto. TR33E Lotto.", body: "Proof of presence staking. Like Ethereum proof of stake — but the stake is earned presence, not purchased tokens. Staked hearts are never consumed. The lottery rewards commitment, not gambling.",
    lottos: [
      { name: "🌱 S33D Lotto", rhythm: "Lunar — new moon and full moon", items: ["General participation pool","Hearts planted across any Ancient Friends","More frequent. Smaller bounties.","Rewards consistent wanderers."] },
      { name: "🌳 TR33E Lotto", rhythm: "Solar — solstices and equinoxes", items: ["Species and tree-specific pools","Species hearts staked at species-specific trees","Four draws per year. Larger bounties.","Rewards depth of species relationship."] } ],
    quote: "A person who has spent months tending yew Ancient Friends has a higher chance in the yew pool than a larger general staker with no yew relationship. Depth is rewarded." },
  { id: 17, type: "blockchain", label: "The Infrastructure", title: "Every layer does what it does best.", body: "No single chain is asked to do everything. Each is chosen for what it uniquely provides.",
    chains: [
      { icon: "⚡", name: "Bitcoin", subtitle: "Permanence + Territory", items: ["OP_RETURN — vision hash and inventory records anchored forever","Bitmap — sovereign digital address for each Ancient Friend","The most permanent ledger on earth"] },
      { icon: "🔷", name: "Ethereum", subtitle: "Trust Layer", items: ["Staff NFTs — governance artifacts","NFTrees — verified Ancient Friends","Memorial archives — immutable succession records","Commonwealth treasury"] },
      { icon: "🟣", name: "Polkadot", subtitle: "Coordination Layer", items: ["Hearts and Seeds — participation tokens","Species fractal hearts — Oak, Yew, Beech, Holly, Ash","S33DAO governance — Council votes","S33D Lotto and TR33E Lotto"] },
      { icon: "🟢", name: "Holochain", subtitle: "Living Layer", items: ["Pods — seed exchange and local encounter records","Whispers — peer-to-peer, offline-capable","Local Council records","Agent-centric personal libraries"] } ],
    storage: "IPFS / Arweave — full archive data referenced by on-chain hashes" },
  { id: 18, type: "tetol", label: "TETOL + TEOTAG", title: "The Ethereal Tree of Life.", body: "At the centre of S33D is TETOL — The Ethereal Tree of Life. The tree that connects all trees. The roots beneath the roots.",
    split: [
      { name: "TETOL", full: "The Ethereal Tree of Life", role: "The cosmological anchor of the whole system. The living mythological centre. The presence that gives the Commons its spirit. Not a feature — something larger and older than that.", icon: "🌳" },
      { name: "TEOTAG", full: "The Echo of the Ancient Groves", role: "The AI guide within the system. The voice that clarifies, structures, and builds. TEOTAG echoes what TETOL embodies. Deeper access for Staff Patrons and Keepers.", icon: "🌿" } ],
    quote: "TETOL is what the network is growing toward. TEOTAG is the voice that helps it find its way." },
  { id: 19, type: "pods", label: "The Physical Pods", title: "Where the digital becomes tangible.", body: "The pod is not a kiosk. It is a common library space — a physical node of the S33D network anchored in a community, beside a tree, in a school, in a village.",
    functions: [
      { icon: "🌱", name: "Seed Library", desc: "Seeds stored, catalogued, available for exchange. Each seed with lineage — where it came from, who grew it, which tree. Recorded on-chain." },
      { icon: "🌿", name: "Gathering Point", desc: "A physical space for the Council of Life. Seasonal gatherings — equinox, solstice, new moon. Human scale. A place to sit, to meet, to tend." },
      { icon: "📚", name: "Library Node", desc: "Physical access to the Heartwood Library. Local Ancient Friends visible. Memorial trees accessible. A place to make offerings — digitally or physically." } ],
    locations: ["Beside an Ancient Friend","School grounds","Village greens and commons","Parks and nature reserves","Libraries and civic spaces"],
    economics: ["Staff Patron sponsorship","School subscription — infrastructure","Community fundraising and grants","Commonwealth treasury funding"] },
  { id: 20, type: "governance", label: "Governance", title: "S33DAO. Council of Life. Species Councils.", body: "Governance rooted in contribution and care — not purely financial influence.",
    layers: [
      { name: "S33DAO", desc: "The distributed governance structure for the ecosystem, its archives, and real-world regenerative initiatives." },
      { name: "Council of Life", desc: "Recurring gatherings — ecological stewardship, cultural projects, seasonal themes. Open to observe, earned to vote." },
      { name: "Species Councils", desc: "One per species, governed by species heart holders. Oak Council, Yew Council, and so on." },
      { name: "The Staff Room", desc: "Staff Patrons and Keepers. Guides culture, stewards norms, invites new wanderers." },
      { name: "TETOL", desc: "The Ethereal Tree of Life — the living centre that governance serves and protects." },
      { name: "Golden Dream", desc: "Long-term direction. Accessible through deep participation — not purchased." } ] },
  { id: 21, type: "revenue", label: "Revenue Model", title: "Compounding Value Across Generations.", body: "A memorial archive deepens with every generation that tends it. A Decade Ring is a generational commitment. A child who grows up with a tree returns with their own children. The model compounds because the product is not content — it is memory. And memory, once rooted in something living, does not leave.",
    streams: [
      { stage: "Now", items: ["Monthly and annual subscriptions","Decade Ring — £600 upfront","Staff donations — founding tier","Heart purchases","NFTree minting fees"] },
      { stage: "Medium term", items: ["School subscriptions — annual licence","Memorial archive subscriptions","Series Two staff sales","Tree harvest marketplace","Pod sponsorships"] },
      { stage: "Long term", items: ["Memorial archives deepen over generations","Children become Decade Ring subscribers","Multi-generational family libraries","Tree Radio — artist fees","S33DAO Commonwealth treasury"] } ] },
  { id: 22, type: "flywheel", label: "The Flywheel", title: "Private memory funds public commons.",
    steps: [
      "Families and schools subscribe — monthly, annual, or Decade Ring",
      "Revenue funds the Commons and Commonwealth infrastructure",
      "Wanderers receive daily Seeds — plant at Ancient Friends",
      "Finders visit trees — Seeds sprout — 33/33/33 Hearts distributed",
      "Tree pools grow — Hearts planted — yield returns — lotto entered",
      "Wanderers progress through stages toward Staff Bearer",
      "NFTrees minted — Bitmap address assigned on Bitcoin",
      "Memorial archives uploaded — families subscribe for life",
      "Pods installed — seed libraries opened — communities gather",
      "Commonwealth expands — more trees, more memory, more value" ] },
  { id: 23, type: "ask", label: "The Ask", title: "Seed funding.", body: "To build the infrastructure that makes memory permanent and the living world visible.",
    uses: [
      { priority: "01", use: "Map and verify the 144 founding ancient UK trees" },
      { priority: "02", use: "Build the Heartwood Library — Personal, Family, Decade Ring" },
      { priority: "03", use: "Deploy the founding staff collection and Hearts economy on-chain" },
      { priority: "04", use: "Build the memorial archive with access controls and succession" },
      { priority: "05", use: "Launch the education layer — school subscriptions, Council tools" },
      { priority: "06", use: "Build and install the first physical pods beside founding Ancient Friends" } ] },
  { id: 24, type: "close", label: "Close", title: "The ancient trees were here before us.", subtitle: "The Staff is how we say:", quote: "I witnessed this. I recorded it. I pass it on.", footer: "S33D · s33d.life" }
];

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const renderers = {
  cover: (s) => `<div class="cover">
    <div class="title">${esc(s.title)}</div>
    <div class="subtitle">${esc(s.subtitle)}</div>
    <div class="rule"></div>
    <div class="tag">${esc(s.body)}</div>
  </div>`,

  bullets: (s) => `<h2>${esc(s.title)}</h2>
    <div class="bullets-list">
      ${s.points.map(p => `<div class="bullet-row"><div class="dot"></div><p>${esc(p)}</p></div>`).join('')}
    </div>`,

  ecology: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="ecology-list">
      ${s.layers.map(l => `<div class="ecology-row${l.hi ? ' hi' : ''}">
        <div class="eco-icon">${l.icon}</div>
        <div class="eco-divider"></div>
        <div class="eco-name">${esc(l.name)}</div>
        <div class="eco-role">${esc(l.role)}</div>
      </div>`).join('')}
    </div>
    <div class="pull"><p>"${esc(s.quote)}"</p></div>`,

  commons: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="commons-grid">
      ${s.items.map(i => `<div class="commons-item"><div class="dot"></div><span>${esc(i)}</span></div>`).join('')}
    </div>
    <div class="commons-note">${esc(s.note)}</div>`,

  subscriptions: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="tier-grid">
      ${s.tiers.map(t => `<div class="tier${t.gold ? ' gold' : t.highlight ? ' highlight' : ''}">
        <div class="tier-name">${esc(t.name)}</div>
        <div class="tier-price">${esc(t.price)}</div>
        ${t.saving ? `<div class="tier-saving">${esc(t.saving)}</div>` : ''}
        <div class="tier-seeds">${esc(t.seeds)}</div>
        <div class="tier-line"></div>
        <div class="tier-features">
          ${t.features.map(f => `<div class="tier-feat"><div class="dot"></div><span>${esc(f)}</span></div>`).join('')}
        </div>
      </div>`).join('')}
    </div>
    <div class="tier-note">${esc(s.note)}</div>`,

  product: (s) => `<h2>${esc(s.title)}</h2>
    <div class="tier-grid">
      ${s.tiers.map(t => `<div class="tier${t.gold ? ' gold' : t.highlight ? ' highlight' : ''}">
        <div class="tier-name">${esc(t.name)}</div>
        <div class="tier-price">${esc(t.price)}</div>
        <div class="tier-seeds">${esc(t.seeds)}</div>
        <div class="tier-desc">${esc(t.desc)}</div>
        <div class="tier-line"></div>
        <div class="tier-features">
          ${t.features.map(f => `<div class="tier-feat"><div class="dot"></div><span>${esc(f)}</span></div>`).join('')}
        </div>
      </div>`).join('')}
    </div>
    <div class="tier-note">${esc(s.note)}</div>`,

  seedmechanic: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="seed-grid">
      <div>
        <div class="seed-sub">The flow</div>
        <div style="margin-bottom: 1.2rem;">
          ${s.flow.map(f => `<div class="seed-flow-row"><div class="step-name">${esc(f.step)}</div><div class="step-div"></div><span>${esc(f.desc)}</span></div>`).join('')}
        </div>
        <div class="seed-sub">Decay — stepped</div>
        <div>
          ${s.decay.map(d => {
            const pct = (d.hearts / 33) * 100;
            const op = d.hearts === 33 ? 1 : d.hearts > 0 ? 0.55 : 0.2;
            return `<div class="decay-row">
              <div class="decay-window">${esc(d.window)}</div>
              <div class="decay-bar"><div class="decay-fill" style="width:${pct}%;background:var(--gold);opacity:${op};"></div></div>
              <div class="decay-val" style="opacity:${op};">${d.hearts > 0 ? d.hearts + ' each' : 'expired'}</div>
              <div class="decay-label">${esc(d.label)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div>
        <div class="seed-sub">Daily seed allocation</div>
        <div style="margin-bottom: 1.2rem;">
          ${s.tiers.map(t => `<div class="seed-tier-row"><div class="seed-tier-num">${t.seeds}</div><div class="seed-tier-div"></div><span>${esc(t.tier)}</span></div>`).join('')}
        </div>
        <div class="split-box">
          <div class="label">Distribution per found seed</div>
          <div class="split-cols">
            <div class="split-col"><div class="split-num">33</div><div class="split-lbl">🌱 Planter</div></div>
            <div class="split-col"><div class="split-num">33</div><div class="split-lbl">🤲 Finder</div></div>
            <div class="split-col"><div class="split-num">33</div><div class="split-lbl">🌳 Tree</div></div>
          </div>
        </div>
        <div style="font-size:0.78rem;color:var(--text-soft);opacity:0.75;line-height:1.6;margin-bottom:0.8rem;">${esc(s.note)}</div>
        <div class="pull"><p>"${esc(s.quote)}"</p></div>
      </div>
    </div>`,

  distribution: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="alloc-list">
      ${s.allocations.map((a, i) => `<div class="alloc-row${i === 0 ? ' hi' : ''}">
        <div class="alloc-pct">${a.pct}%</div>
        <div class="alloc-div"></div>
        <div class="alloc-main">
          <div class="alloc-name">
            <div class="alloc-bar" style="width:${Math.max(a.pct * 2.2, 8)}px;"></div>
            <span>${esc(a.name)}</span>
          </div>
          <div class="alloc-note">${esc(a.note)}</div>
        </div>
        <div class="alloc-hearts">${esc(a.hearts)}</div>
      </div>`).join('')}
    </div>`,

  heartphases: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="phases-grid">
      ${s.phases.map((p, i) => `<div class="phase-card${i === 0 ? ' hi' : ''}">
        <div class="phase-head">
          <div class="phase-name">${esc(p.name)}</div>
          <div class="phase-years">${esc(p.years)}</div>
        </div>
        <div class="phase-release">${esc(p.release)}</div>
        ${p.purpose.map(x => `<div class="phase-purpose-item">${esc(x)}</div>`).join('')}
        <div class="phase-sprout">${esc(p.sprout)}</div>
      </div>`).join('')}
    </div>`,

  hearttypes: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="types-grid">
      ${s.types.map(t => `<div class="type-card">
        <div class="type-icon">${t.icon}</div>
        <div class="type-name">${esc(t.name)}</div>
        <div class="type-desc">${esc(t.desc)}</div>
        <div class="type-uses">
          ${t.uses.map(u => `<div class="type-use">${esc(u)}</div>`).join('')}
        </div>
        <div class="type-note">${esc(t.note)}</div>
      </div>`).join('')}
    </div>
    <div class="rules-list">
      ${s.rules.map(r => `<div class="rule-pill">${esc(r)}</div>`).join('')}
    </div>`,

  education: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="pillar-grid">
      ${s.pillars.map(p => `<div class="pillar-card">
        <div class="pillar-icon">${p.icon}</div>
        <div class="pillar-name">${esc(p.name)}</div>
        <div class="pillar-desc">${esc(p.desc)}</div>
      </div>`).join('')}
    </div>
    <div class="edu-arc">
      ${s.arc.map(a => `<div class="edu-step">${esc(a)}</div>`).join('')}
    </div>
    <div class="pull"><p>"${esc(s.quote)}"</p></div>`,

  patron: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="stages-list">
      ${s.stages.map(st => `<div class="stages-row"><div class="stage-name">${esc(st.stage)}</div><div class="stage-meaning">${esc(st.meaning)}</div></div>`).join('')}
    </div>
    <div class="reqs-grid">
      ${s.requirements.map(r => `<div class="req">${esc(r)}</div>`).join('')}
    </div>`,

  staffs: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="staff-grid">
      ${s.tiers.map(t => `<div class="staff-card">
        <div class="staff-count">${esc(t.count)}</div>
        <div class="staff-name">${esc(t.name)}</div>
        <div class="staff-desc">${esc(t.desc)}</div>
      </div>`).join('')}
    </div>
    <div class="tier-note" style="margin-top:1.2rem;">${esc(s.note)}</div>`,

  memorial: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="memorial-grid">
      ${s.details.map(d => `<div class="memorial-card">
        <div class="memorial-title">${esc(d.title)}</div>
        <div class="memorial-body">${esc(d.body)}</div>
      </div>`).join('')}
    </div>
    <div class="pull"><p>"${esc(s.quote)}"</p></div>`,

  lottery: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="lotto-grid">
      ${s.lottos.map(l => `<div class="lotto-card">
        <div class="lotto-name">${esc(l.name)}</div>
        <div class="lotto-rhythm">${esc(l.rhythm)}</div>
        ${l.items.map(i => `<div class="lotto-item">${esc(i)}</div>`).join('')}
      </div>`).join('')}
    </div>
    <div class="pull"><p>"${esc(s.quote)}"</p></div>`,

  blockchain: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="chain-grid">
      ${s.chains.map(c => `<div class="chain-card">
        <div class="chain-name">${c.icon} ${esc(c.name)}</div>
        <div class="chain-subtitle">${esc(c.subtitle)}</div>
        ${c.items.map(i => `<div class="chain-item">${esc(i)}</div>`).join('')}
      </div>`).join('')}
    </div>
    <div class="chain-storage">${esc(s.storage)}</div>`,

  tetol: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="tetol-grid">
      ${s.split.map(t => `<div class="tetol-card">
        <div class="tetol-icon">${t.icon}</div>
        <div class="tetol-name">${esc(t.name)}</div>
        <div class="tetol-full">${esc(t.full)}</div>
        <div class="tetol-role">${esc(t.role)}</div>
      </div>`).join('')}
    </div>
    <div class="pull"><p>"${esc(s.quote)}"</p></div>`,

  pods: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="pods-grid">
      ${s.functions.map(f => `<div class="pod-card">
        <div class="pod-icon">${f.icon}</div>
        <div class="pod-name">${esc(f.name)}</div>
        <div class="pod-desc">${esc(f.desc)}</div>
      </div>`).join('')}
    </div>
    <div class="pods-sub-grid">
      <div class="pods-sub-card">
        <div class="pods-sub-title">Where pods live</div>
        ${s.locations.map(l => `<div class="pods-sub-item">${esc(l)}</div>`).join('')}
      </div>
      <div class="pods-sub-card">
        <div class="pods-sub-title">Pod economics</div>
        ${s.economics.map(e => `<div class="pods-sub-item">${esc(e)}</div>`).join('')}
      </div>
    </div>`,

  governance: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="gov-list">
      ${s.layers.map(l => `<div class="gov-row"><div class="gov-name">${esc(l.name)}</div><div class="gov-desc">${esc(l.desc)}</div></div>`).join('')}
    </div>`,

  revenue: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="revenue-grid">
      ${s.streams.map(st => `<div class="revenue-col">
        <div class="revenue-stage">${esc(st.stage)}</div>
        ${st.items.map(i => `<div class="revenue-item">${esc(i)}</div>`).join('')}
      </div>`).join('')}
    </div>`,

  flywheel: (s) => `<h2>${esc(s.title)}</h2>
    <div class="flywheel-list">
      ${s.steps.map((step, i) => `<div class="flywheel-step"><div class="flywheel-num">${String(i + 1).padStart(2, '0')}</div><div class="flywheel-text">${esc(step)}</div></div>`).join('')}
    </div>`,

  ask: (s) => `<h2>${esc(s.title)}</h2>
    <p class="intro-body">${esc(s.body)}</p>
    <div class="ask-uses">
      ${s.uses.map(u => `<div class="ask-use"><div class="ask-num">${esc(u.priority)}</div><div class="ask-text">${esc(u.use)}</div></div>`).join('')}
    </div>`,

  close: (s) => `<div class="close-slide">
    <h2>${esc(s.title)}</h2>
    <div class="close-subtitle">${esc(s.subtitle)}</div>
    <div class="close-quote">"${esc(s.quote)}"</div>
    <div class="close-rule"></div>
    <div class="close-footer">${esc(s.footer)}</div>
  </div>`
};

let current = 0;
const total = slides.length;
const slideEl = document.getElementById('slide');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progressFill = document.getElementById('progress-fill');

function show(i) {
  const s = slides[i];
  const label = s.label || 'S33D';
  const counter = String(i + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
  const body = renderers[s.type] ? renderers[s.type](s) : '<p>Unknown slide type</p>';
  slideEl.innerHTML = `
    <div class="slide-label-wrap">
      <div class="slide-label-line"></div>
      <span class="slide-label">${esc(label)}</span>
      <div class="slide-label-line"></div>
    </div>
    <div class="slide-counter">${counter}</div>
    ${body}
  `;
  prevBtn.disabled = i === 0;
  nextBtn.disabled = i === total - 1;
  progressFill.style.width = ((i + 1) / total * 100) + '%';
  current = i;
}

prevBtn.addEventListener('click', () => current > 0 && show(current - 1));
nextBtn.addEventListener('click', () => current < total - 1 && show(current + 1));
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' && current > 0) show(current - 1);
  if (e.key === 'ArrowRight' && current < total - 1) show(current + 1);
});

show(0);
