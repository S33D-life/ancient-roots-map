#!/usr/bin/env node
/**
 * seed-hong-kong.mjs — Seeds 24 curated Hong Kong heritage trees
 * into the research_trees table via Supabase REST API.
 *
 * Usage:
 *   node scripts/seed-hong-kong.mjs --dryRun=true   # preview only
 *   node scripts/seed-hong-kong.mjs                  # insert into DB
 *
 * This is the reference template for future city-level heritage datasets.
 */

const SEED_TREES = [
  // ── Stone Wall Circle (6) ──
  {
    tree_name: "Forbes Street Stone Wall Banyan",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Stone Wall Tree",
    province: "Central and Western",
    city: "Hong Kong",
    locality_text: "Forbes Street retaining wall, Kennedy Town",
    latitude: 22.2847,
    longitude: 114.1283,
    height_m: 15,
    girth_or_stem: "2400mm DBH",
    description: "A spectacular Chinese Banyan whose aerial roots have entirely colonised a 19th-century granite retaining wall, creating a living bridge between city and nature.",
    source_row_ref: "OVT-SWT-001",
  },
  {
    tree_name: "Bonham Road Wall Fig",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Stone Wall Tree",
    province: "Central and Western",
    city: "Hong Kong",
    locality_text: "Bonham Road retaining wall, Sai Ying Pun",
    latitude: 22.2865,
    longitude: 114.1461,
    height_m: 18,
    girth_or_stem: "2800mm DBH",
    description: "One of the most photographed stone wall trees in Hong Kong, with roots cascading down a Victorian-era stone retaining wall.",
    source_row_ref: "OVT-SWT-002",
  },
  {
    tree_name: "Park Road Stone Wall Cluster",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Stone Wall Tree",
    province: "Central and Western",
    city: "Hong Kong",
    locality_text: "Park Road retaining wall, Mid-Levels",
    latitude: 22.2835,
    longitude: 114.1476,
    height_m: 12,
    girth_or_stem: "1800mm DBH",
    description: "A cluster of banyans embedded in the stone retaining walls of the Mid-Levels escalator corridor.",
    source_row_ref: "OVT-SWT-003",
  },
  {
    tree_name: "Caine Road Wall Banyan",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Stone Wall Tree",
    province: "Central and Western",
    city: "Hong Kong",
    locality_text: "Caine Road, Mid-Levels",
    latitude: 22.2824,
    longitude: 114.1508,
    height_m: 14,
    girth_or_stem: "2200mm DBH",
    description: "Ancient roots grip Victorian masonry along one of Hong Kong's oldest hillside roads.",
    source_row_ref: "OVT-SWT-004",
  },
  {
    tree_name: "Castle Road Flame Tree Wall",
    species_scientific: "Delonix regia",
    species_common: "Flame Tree",
    designation_type: "Stone Wall Tree",
    province: "Central and Western",
    city: "Hong Kong",
    locality_text: "Castle Road retaining wall, Mid-Levels",
    latitude: 22.2790,
    longitude: 114.1540,
    height_m: 10,
    girth_or_stem: "1200mm DBH",
    description: "A rare non-Ficus stone wall tree — a Flame Tree whose roots have colonised a crumbling colonial wall.",
    source_row_ref: "OVT-SWT-005",
  },
  {
    tree_name: "High Street Wall Banyan",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Stone Wall Tree",
    province: "Central and Western",
    city: "Hong Kong",
    locality_text: "High Street, Sai Ying Pun",
    latitude: 22.2869,
    longitude: 114.1424,
    height_m: 16,
    girth_or_stem: "2600mm DBH",
    description: "Rooted into the old mental hospital retaining wall, this banyan stands as a guardian of one of Hong Kong's most atmospheric streets.",
    source_row_ref: "OVT-SWT-006",
  },

  // ── Harbour Heritage Circle (6) ──
  {
    tree_name: "Tsim Sha Tsui Banyan King",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Heritage Tree",
    province: "Yau Tsim Mong",
    city: "Hong Kong",
    locality_text: "Kowloon Park, Tsim Sha Tsui",
    latitude: 22.3012,
    longitude: 114.1706,
    height_m: 20,
    girth_or_stem: "3200mm DBH",
    description: "The largest banyan in Kowloon Park, with a canopy spreading over 25 metres across the heritage walk.",
    source_row_ref: "OVT-HH-001",
  },
  {
    tree_name: "Star Ferry Flame Tree",
    species_scientific: "Delonix regia",
    species_common: "Flame Tree",
    designation_type: "Heritage Tree",
    province: "Yau Tsim Mong",
    city: "Hong Kong",
    locality_text: "Star Ferry Pier, Tsim Sha Tsui",
    latitude: 22.2934,
    longitude: 114.1684,
    height_m: 12,
    girth_or_stem: "1400mm DBH",
    description: "An iconic harbourside flame tree visible from the Star Ferry, blooming scarlet against Victoria Harbour.",
    source_row_ref: "OVT-HH-002",
  },
  {
    tree_name: "Victoria Park Rain Tree",
    species_scientific: "Samanea saman",
    species_common: "Rain Tree",
    designation_type: "Heritage Tree",
    province: "Eastern",
    city: "Hong Kong",
    locality_text: "Victoria Park, Causeway Bay",
    latitude: 22.2823,
    longitude: 114.1889,
    height_m: 22,
    girth_or_stem: "3500mm DBH",
    description: "The grandest Rain Tree in Victoria Park, whose canopy provides shade over the main promenade.",
    source_row_ref: "OVT-HH-003",
  },
  {
    tree_name: "Central Waterfront Banyan",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Heritage Tree",
    province: "Central and Western",
    city: "Hong Kong",
    locality_text: "Statue Square vicinity, Central",
    latitude: 22.2813,
    longitude: 114.1598,
    height_m: 17,
    girth_or_stem: "2800mm DBH",
    description: "One of the few surviving pre-war banyans in Central, standing near the old Supreme Court building.",
    source_row_ref: "OVT-HH-004",
  },
  {
    tree_name: "Hung Hom Bay Fig",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Heritage Tree",
    province: "Kowloon City",
    city: "Hong Kong",
    locality_text: "Hung Hom Promenade",
    latitude: 22.3050,
    longitude: 114.1870,
    height_m: 14,
    girth_or_stem: "2000mm DBH",
    description: "A harbourside banyan overlooking the old Kai Tak approach path.",
    source_row_ref: "OVT-HH-005",
  },
  {
    tree_name: "Aberdeen Harbour Banyan",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Heritage Tree",
    province: "Southern",
    city: "Hong Kong",
    locality_text: "Aberdeen Promenade",
    latitude: 22.2480,
    longitude: 114.1535,
    height_m: 16,
    girth_or_stem: "2400mm DBH",
    description: "An elder banyan watching over Aberdeen's floating village and typhoon shelter.",
    source_row_ref: "OVT-HH-006",
  },

  // ── Garden Elders Circle (6) ──
  {
    tree_name: "Zoological Gardens Banyan",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Heritage Tree",
    province: "Central and Western",
    city: "Hong Kong",
    locality_text: "Hong Kong Zoological and Botanical Gardens",
    latitude: 22.2782,
    longitude: 114.1565,
    height_m: 25,
    girth_or_stem: "4200mm DBH",
    age_estimate: "Over 150 years",
    description: "The oldest and largest banyan in the Zoological and Botanical Gardens, planted in the 1870s during the garden's establishment.",
    source_row_ref: "OVT-GE-001",
  },
  {
    tree_name: "Kowloon Walled City Park Banyan",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Heritage Tree",
    province: "Kowloon City",
    city: "Hong Kong",
    locality_text: "Kowloon Walled City Park",
    latitude: 22.3321,
    longitude: 114.1896,
    height_m: 18,
    girth_or_stem: "2800mm DBH",
    description: "Survivor of the infamous Kowloon Walled City — one of the few living witnesses to the dense settlement that once stood here.",
    source_row_ref: "OVT-GE-002",
  },
  {
    tree_name: "Kadoorie Farm Lychee Elder",
    species_scientific: "Litchi chinensis",
    species_common: "Lychee",
    designation_type: "Heritage Tree",
    province: "Tai Po",
    city: "Hong Kong",
    locality_text: "Kadoorie Farm & Botanic Garden",
    latitude: 22.4340,
    longitude: 114.1130,
    height_m: 12,
    girth_or_stem: "1600mm DBH",
    age_estimate: "Over 100 years",
    description: "An ancient lychee tree at Kadoorie Farm, representing centuries of fruit cultivation in the New Territories.",
    source_row_ref: "OVT-GE-003",
  },
  {
    tree_name: "Nan Lian Garden Bodhi",
    species_scientific: "Ficus religiosa",
    species_common: "Bodhi Tree",
    designation_type: "Heritage Tree",
    province: "Wong Tai Sin",
    city: "Hong Kong",
    locality_text: "Nan Lian Garden, Diamond Hill",
    latitude: 22.3408,
    longitude: 114.2037,
    height_m: 14,
    girth_or_stem: "1800mm DBH",
    description: "A sacred Bodhi tree at the Tang Dynasty-style Nan Lian Garden, a site of Buddhist contemplation amid urban Kowloon.",
    source_row_ref: "OVT-GE-004",
  },
  {
    tree_name: "Hong Kong Park Flame Tree",
    species_scientific: "Delonix regia",
    species_common: "Flame Tree",
    designation_type: "Heritage Tree",
    province: "Central and Western",
    city: "Hong Kong",
    locality_text: "Hong Kong Park, Admiralty",
    latitude: 22.2770,
    longitude: 114.1620,
    height_m: 15,
    girth_or_stem: "1500mm DBH",
    description: "A magnificent flame tree at Hong Kong Park, its scarlet canopy frames views of the surrounding skyscrapers.",
    source_row_ref: "OVT-GE-005",
  },
  {
    tree_name: "Tai Po Wishing Tree",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Heritage Tree",
    province: "Tai Po",
    city: "Hong Kong",
    locality_text: "Lam Tsuen, Tai Po",
    latitude: 22.4470,
    longitude: 114.1370,
    height_m: 16,
    girth_or_stem: "3000mm DBH",
    age_estimate: "Over 200 years",
    description: "The famous Lam Tsuen Wishing Tree — a sacred banyan where visitors throw joss paper offerings tied to oranges.",
    source_row_ref: "OVT-GE-006",
  },

  // ── Threshold Trees (6) ──
  {
    tree_name: "Lam Tsuen Camphor",
    species_scientific: "Cinnamomum camphora",
    species_common: "Camphor Tree",
    designation_type: "Heritage Tree",
    province: "Tai Po",
    city: "Hong Kong",
    locality_text: "Lam Tsuen Valley, Tai Po",
    latitude: 22.4480,
    longitude: 114.1350,
    height_m: 20,
    girth_or_stem: "3200mm DBH",
    age_estimate: "Over 300 years",
    description: "An ancient camphor tree at the entrance to a Hakka village — a threshold guardian between settlement and wilderness.",
    source_row_ref: "OVT-TT-001",
  },
  {
    tree_name: "Sha Lo Tung Incense Tree",
    species_scientific: "Aquilaria sinensis",
    species_common: "Incense Tree",
    designation_type: "Heritage Tree",
    province: "Tai Po",
    city: "Hong Kong",
    locality_text: "Sha Lo Tung, Tai Po",
    latitude: 22.4700,
    longitude: 114.1750,
    height_m: 8,
    girth_or_stem: "800mm DBH",
    description: "A rare surviving Incense Tree — the species that gave Hong Kong its name (fragrant harbour). Critically endangered due to illegal harvesting.",
    source_row_ref: "OVT-TT-002",
  },
  {
    tree_name: "Tai O Mangrove Sentinel",
    species_scientific: "Avicennia marina",
    species_common: "Grey Mangrove",
    designation_type: "Heritage Tree",
    province: "Islands",
    city: "Hong Kong",
    locality_text: "Tai O fishing village, Lantau Island",
    latitude: 22.2530,
    longitude: 113.8630,
    height_m: 6,
    girth_or_stem: "600mm DBH",
    description: "A sentinel mangrove at the threshold between Hong Kong's traditional fishing culture and the open South China Sea.",
    source_row_ref: "OVT-TT-003",
  },
  {
    tree_name: "Lion Rock Autumn Maple",
    species_scientific: "Acer fabri",
    species_common: "Fabri Maple",
    designation_type: "Heritage Tree",
    province: "Wong Tai Sin",
    city: "Hong Kong",
    locality_text: "Lion Rock Country Park",
    latitude: 22.3520,
    longitude: 114.1820,
    height_m: 10,
    girth_or_stem: "900mm DBH",
    description: "A rare native maple beneath Lion Rock — the mountain that symbolises the spirit of Hong Kong.",
    source_row_ref: "OVT-TT-004",
  },
  {
    tree_name: "Ping Shan Heritage Trail Banyan",
    species_scientific: "Ficus microcarpa",
    species_common: "Chinese Banyan",
    designation_type: "Heritage Tree",
    province: "Yuen Long",
    city: "Hong Kong",
    locality_text: "Ping Shan Heritage Trail, Yuen Long",
    latitude: 22.4450,
    longitude: 114.0020,
    height_m: 18,
    girth_or_stem: "3400mm DBH",
    age_estimate: "Over 400 years",
    description: "The oldest banyan on the Ping Shan Heritage Trail, shading a 600-year-old Tang clan ancestral hall.",
    source_row_ref: "OVT-TT-005",
  },
  {
    tree_name: "Ma On Shan Paper Bark",
    species_scientific: "Melaleuca cajuputi",
    species_common: "Cajuput Tree",
    designation_type: "Heritage Tree",
    province: "Sha Tin",
    city: "Hong Kong",
    locality_text: "Ma On Shan Country Park",
    latitude: 22.3950,
    longitude: 114.2400,
    height_m: 12,
    girth_or_stem: "1100mm DBH",
    description: "A paperbark tree at the threshold between urban Sha Tin and the wild montane forests of Ma On Shan.",
    source_row_ref: "OVT-TT-006",
  },
];

/* ── CLI ── */
const parseArgs = () =>
  Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value = "true"] = arg.split("=");
      return [key.replace(/^--/, ""), value];
    }),
  );

const main = async () => {
  const args = parseArgs();
  const dryRun = args.dryRun === "true";

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL / SUPABASE_KEY env vars.");
    process.exit(1);
  }

  const records = SEED_TREES.map((t) => ({
    tree_name: t.tree_name,
    species_scientific: t.species_scientific,
    species_common: t.species_common,
    designation_type: t.designation_type,
    province: t.province,
    city: t.city,
    country: "Hong Kong",
    locality_text: t.locality_text,
    latitude: t.latitude,
    longitude: t.longitude,
    height_m: t.height_m,
    girth_or_stem: t.girth_or_stem,
    crown_spread: null,
    age_estimate: t.age_estimate || null,
    description: t.description,
    source_doc_title: "Hong Kong Old and Valuable Trees Register / Stone Wall Trees",
    source_doc_url: "https://www.greening.gov.hk/en/greening-activities/register-ovt.html",
    source_doc_year: 2024,
    source_program: t.designation_type === "Stone Wall Tree" ? "hk-stone-wall-trees" : "hk-ovt-register",
    source_row_ref: t.source_row_ref,
    geo_precision: "approx",
    heritage_status: "official_register",
    status: "research",
    record_status: "draft",
    record_kind: "heritage_tree",
  }));

  if (dryRun) {
    console.log(`[DRY RUN] Would insert ${records.length} Hong Kong trees:`);
    records.forEach((r, i) => console.log(`  ${i + 1}. ${r.tree_name} (${r.species_common}) — ${r.province}`));
    console.log("\nCircles:");
    console.log(`  Stone Wall Circle: ${records.filter(r => r.source_program === "hk-stone-wall-trees").length}`);
    console.log(`  Harbour Heritage: ${records.filter(r => r.source_row_ref?.startsWith("OVT-HH")).length}`);
    console.log(`  Garden Elders: ${records.filter(r => r.source_row_ref?.startsWith("OVT-GE")).length}`);
    console.log(`  Threshold Trees: ${records.filter(r => r.source_row_ref?.startsWith("OVT-TT")).length}`);
    return;
  }

  console.log(`Inserting ${records.length} Hong Kong heritage trees...`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/research_trees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(records),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Insert failed (${res.status}): ${body}`);
    process.exit(1);
  }

  const inserted = await res.json();
  console.log(`✅ Inserted ${inserted.length} Hong Kong trees.`);
  inserted.forEach((r) => console.log(`  - ${r.tree_name} (${r.id})`));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
