#!/usr/bin/env node
/**
 * seed-singapore.mjs — Seeds 24 curated Singapore heritage trees
 * into the research_trees table via Supabase REST API.
 *
 * Usage:
 *   node scripts/seed-singapore.mjs --dryRun=true   # preview only
 *   node scripts/seed-singapore.mjs                  # insert into DB
 *
 * Follows the Hong Kong template for city-level heritage datasets.
 */

const SEED_TREES = [
  // ── Botanic Garden Elders (6) ──
  {
    tree_name: "Tembusu of the Botanic Gardens",
    species_scientific: "Cyrtophyllum fragrans",
    species_common: "Tembusu",
    designation_type: "Heritage Tree",
    province: "Tanglin",
    city: "Singapore",
    locality_text: "Singapore Botanic Gardens, Main Gate area",
    latitude: 1.3138,
    longitude: 103.8159,
    height_m: 30,
    girth_or_stem: "5000mm girth",
    age_estimate: "Over 150 years",
    description: "The most famous Tembusu in Singapore, featured on the five-dollar note. A majestic specimen with a broad, spreading canopy in the UNESCO World Heritage Botanic Gardens.",
    source_row_ref: "SG-BG-001",
  },
  {
    tree_name: "Heritage Rain Tree at Lawn E",
    species_scientific: "Samanea saman",
    species_common: "Rain Tree",
    designation_type: "Heritage Tree",
    province: "Tanglin",
    city: "Singapore",
    locality_text: "Singapore Botanic Gardens, Lawn E",
    latitude: 1.3148,
    longitude: 103.8155,
    height_m: 25,
    girth_or_stem: "4800mm girth",
    age_estimate: "Over 120 years",
    description: "A grand Rain Tree whose canopy spans over 30 metres, providing an iconic canopy arch in the Botanic Gardens.",
    source_row_ref: "SG-BG-002",
  },
  {
    tree_name: "Rubber Tree Pioneer",
    species_scientific: "Hevea brasiliensis",
    species_common: "Rubber Tree",
    designation_type: "Heritage Tree",
    province: "Tanglin",
    city: "Singapore",
    locality_text: "Singapore Botanic Gardens, Economic Garden",
    latitude: 1.3120,
    longitude: 103.8149,
    height_m: 20,
    girth_or_stem: "2200mm girth",
    age_estimate: "Over 100 years",
    description: "A surviving specimen from the rubber cultivation programme that transformed Southeast Asian economies. Historic link to H.N. Ridley's rubber research.",
    source_row_ref: "SG-BG-003",
  },
  {
    tree_name: "Botanic Gardens Banyan",
    species_scientific: "Ficus benghalensis",
    species_common: "Indian Banyan",
    designation_type: "Heritage Tree",
    province: "Tanglin",
    city: "Singapore",
    locality_text: "Singapore Botanic Gardens, near Swan Lake",
    latitude: 1.3135,
    longitude: 103.8162,
    height_m: 22,
    girth_or_stem: "4200mm girth",
    age_estimate: "Over 100 years",
    description: "A spectacular banyan with cascading aerial roots forming secondary trunks around Swan Lake.",
    source_row_ref: "SG-BG-004",
  },
  {
    tree_name: "Jelutong of Rainforest Walk",
    species_scientific: "Dyera costulata",
    species_common: "Jelutong",
    designation_type: "Heritage Tree",
    province: "Tanglin",
    city: "Singapore",
    locality_text: "Singapore Botanic Gardens, Rainforest Walk",
    latitude: 1.3155,
    longitude: 103.8145,
    height_m: 35,
    girth_or_stem: "3000mm girth",
    age_estimate: "Over 150 years",
    description: "One of the tallest trees in the Botanic Gardens' primary rainforest fragment — a living remnant of Singapore's original forest cover.",
    source_row_ref: "SG-BG-005",
  },
  {
    tree_name: "Tanjong Tree at Orchid Plaza",
    species_scientific: "Mimusops elengi",
    species_common: "Tanjong Tree",
    designation_type: "Heritage Tree",
    province: "Tanglin",
    city: "Singapore",
    locality_text: "Singapore Botanic Gardens, near National Orchid Garden",
    latitude: 1.3142,
    longitude: 103.8137,
    height_m: 18,
    girth_or_stem: "2400mm girth",
    age_estimate: "Over 100 years",
    description: "A fragrant Tanjong Tree whose tiny white blossoms perfume the walkways near the National Orchid Garden.",
    source_row_ref: "SG-BG-006",
  },

  // ── Temple Guardians (6) ──
  {
    tree_name: "Bodhi Tree of Lian Shan Shuang Lin",
    species_scientific: "Ficus religiosa",
    species_common: "Bodhi Tree",
    designation_type: "Heritage Tree",
    province: "Toa Payoh",
    city: "Singapore",
    locality_text: "Lian Shan Shuang Lin Monastery, Toa Payoh",
    latitude: 1.3350,
    longitude: 103.8515,
    height_m: 16,
    girth_or_stem: "2600mm girth",
    age_estimate: "Over 100 years",
    description: "A sacred Bodhi tree at Singapore's oldest Buddhist monastery, gazetted as a national monument. Pilgrims meditate beneath its spreading canopy.",
    source_row_ref: "SG-TG-001",
  },
  {
    tree_name: "Rain Tree of Chettiar Temple",
    species_scientific: "Samanea saman",
    species_common: "Rain Tree",
    designation_type: "Heritage Tree",
    province: "River Valley",
    city: "Singapore",
    locality_text: "Sri Thendayuthapani Temple, Tank Road",
    latitude: 1.2932,
    longitude: 103.8441,
    height_m: 28,
    girth_or_stem: "4400mm girth",
    description: "A magnificent Rain Tree shading the approach to the Chettiar Temple, one of Singapore's most important Hindu temples.",
    source_row_ref: "SG-TG-002",
  },
  {
    tree_name: "Tembusu of Thian Hock Keng",
    species_scientific: "Cyrtophyllum fragrans",
    species_common: "Tembusu",
    designation_type: "Heritage Tree",
    province: "Outram",
    city: "Singapore",
    locality_text: "Thian Hock Keng Temple, Telok Ayer Street",
    latitude: 1.2806,
    longitude: 103.8474,
    height_m: 20,
    girth_or_stem: "3200mm girth",
    age_estimate: "Over 150 years",
    description: "An ancient Tembusu near Singapore's oldest Hokkien temple. This tree predates much of the surrounding Chinatown district.",
    source_row_ref: "SG-TG-003",
  },
  {
    tree_name: "Banyan of Sultan Mosque",
    species_scientific: "Ficus microcarpa",
    species_common: "Malayan Banyan",
    designation_type: "Heritage Tree",
    province: "Rochor",
    city: "Singapore",
    locality_text: "Sultan Mosque vicinity, Kampong Glam",
    latitude: 1.3025,
    longitude: 103.8589,
    height_m: 18,
    girth_or_stem: "3000mm girth",
    description: "A heritage banyan near the iconic Sultan Mosque, its aerial roots draping over colonial-era shophouse walls.",
    source_row_ref: "SG-TG-004",
  },
  {
    tree_name: "Raintree of Sri Mariamman",
    species_scientific: "Samanea saman",
    species_common: "Rain Tree",
    designation_type: "Heritage Tree",
    province: "Outram",
    city: "Singapore",
    locality_text: "Near Sri Mariamman Temple, South Bridge Road",
    latitude: 1.2827,
    longitude: 103.8454,
    height_m: 24,
    girth_or_stem: "3800mm girth",
    description: "A Rain Tree shading Singapore's oldest Hindu temple, its canopy providing welcome respite in the heart of Chinatown.",
    source_row_ref: "SG-TG-005",
  },
  {
    tree_name: "Frangipani Elder of Kong Meng San",
    species_scientific: "Plumeria rubra",
    species_common: "Frangipani",
    designation_type: "Heritage Tree",
    province: "Bishan",
    city: "Singapore",
    locality_text: "Kong Meng San Phor Kark See Monastery, Bishan",
    latitude: 1.3595,
    longitude: 103.8350,
    height_m: 10,
    girth_or_stem: "1200mm girth",
    age_estimate: "Over 80 years",
    description: "An ancient frangipani at Southeast Asia's largest Buddhist monastery complex, its fragrant blooms are offerings in themselves.",
    source_row_ref: "SG-TG-006",
  },

  // ── Rainforest Giants (6) ──
  {
    tree_name: "Seraya of Bukit Timah",
    species_scientific: "Shorea curtisii",
    species_common: "Seraya",
    designation_type: "Heritage Tree",
    province: "Bukit Timah",
    city: "Singapore",
    locality_text: "Bukit Timah Nature Reserve, summit trail",
    latitude: 1.3547,
    longitude: 103.7760,
    height_m: 47,
    girth_or_stem: "3800mm girth",
    age_estimate: "Over 200 years",
    description: "A towering dipterocarp in Singapore's last remaining primary rainforest. Bukit Timah contains more tree species per hectare than all of North America.",
    source_row_ref: "SG-RG-001",
  },
  {
    tree_name: "Mengaris Giant of MacRitchie",
    species_scientific: "Koompassia excelsa",
    species_common: "Mengaris / Tualang",
    designation_type: "Heritage Tree",
    province: "Bishan",
    city: "Singapore",
    locality_text: "MacRitchie Reservoir, TreeTop Walk vicinity",
    latitude: 1.3510,
    longitude: 103.8080,
    height_m: 50,
    girth_or_stem: "4500mm girth",
    age_estimate: "Over 200 years",
    description: "One of Singapore's tallest trees, visible from the TreeTop Walk canopy bridge. The smooth bark deters honey-hunting and gives the species its lightning-rod silhouette.",
    source_row_ref: "SG-RG-002",
  },
  {
    tree_name: "Strangling Fig of Dairy Farm",
    species_scientific: "Ficus benjamina",
    species_common: "Weeping Fig",
    designation_type: "Heritage Tree",
    province: "Bukit Timah",
    city: "Singapore",
    locality_text: "Dairy Farm Nature Park",
    latitude: 1.3620,
    longitude: 103.7750,
    height_m: 30,
    girth_or_stem: "5200mm girth",
    description: "A massive strangling fig that has consumed its host tree entirely. Its lattice trunk and buttress roots span over 8 metres.",
    source_row_ref: "SG-RG-003",
  },
  {
    tree_name: "Kapok of Sungei Buloh",
    species_scientific: "Ceiba pentandra",
    species_common: "Kapok Tree",
    designation_type: "Heritage Tree",
    province: "Lim Chu Kang",
    city: "Singapore",
    locality_text: "Sungei Buloh Wetland Reserve",
    latitude: 1.4470,
    longitude: 103.7290,
    height_m: 35,
    girth_or_stem: "4000mm girth",
    description: "A Kapok giant at the wetland reserve, its massive buttress roots emerge from mangrove mud. The silk-cotton pods once provided stuffing for mattresses across the region.",
    source_row_ref: "SG-RG-004",
  },
  {
    tree_name: "Chengal of Central Catchment",
    species_scientific: "Neobalanocarpus heimii",
    species_common: "Chengal",
    designation_type: "Heritage Tree",
    province: "Mandai",
    city: "Singapore",
    locality_text: "Central Catchment Nature Reserve",
    latitude: 1.3620,
    longitude: 103.8010,
    height_m: 40,
    girth_or_stem: "3500mm girth",
    age_estimate: "Over 150 years",
    description: "A rare Chengal — the hardwood that built traditional Malay houses and boats. One of the finest remaining specimens in Singapore's central forest.",
    source_row_ref: "SG-RG-005",
  },
  {
    tree_name: "Cinnamon Pioneer of Labrador",
    species_scientific: "Cinnamomum iners",
    species_common: "Wild Cinnamon",
    designation_type: "Heritage Tree",
    province: "Bukit Merah",
    city: "Singapore",
    locality_text: "Labrador Nature Reserve, coastal trail",
    latitude: 1.2650,
    longitude: 103.8020,
    height_m: 18,
    girth_or_stem: "2000mm girth",
    description: "A coastal Wild Cinnamon at the last remaining stretch of rocky shore rainforest in mainland Singapore.",
    source_row_ref: "SG-RG-006",
  },

  // ── City Canopy Trees (6) ──
  {
    tree_name: "Angsana of Connaught Drive",
    species_scientific: "Pterocarpus indicus",
    species_common: "Angsana",
    designation_type: "Heritage Tree",
    province: "Downtown Core",
    city: "Singapore",
    locality_text: "Connaught Drive, near Padang",
    latitude: 1.2889,
    longitude: 103.8545,
    height_m: 30,
    girth_or_stem: "4200mm girth",
    age_estimate: "Over 100 years",
    description: "Part of Singapore's iconic Padang tree line. The Angsana's golden rain of petals each year creates a carpet of colour along the colonial cricket ground.",
    source_row_ref: "SG-CC-001",
  },
  {
    tree_name: "Rain Trees of East Coast Parkway",
    species_scientific: "Samanea saman",
    species_common: "Rain Tree",
    designation_type: "Heritage Tree",
    province: "Marine Parade",
    city: "Singapore",
    locality_text: "East Coast Parkway, near Siglap",
    latitude: 1.3050,
    longitude: 103.9250,
    height_m: 25,
    girth_or_stem: "4000mm girth",
    description: "Part of the famous Rain Tree corridor along East Coast — a living green tunnel that epitomises Singapore's 'City in a Garden' vision.",
    source_row_ref: "SG-CC-002",
  },
  {
    tree_name: "Saga Seed Tree of Mount Emily",
    species_scientific: "Adenanthera pavonina",
    species_common: "Saga Tree",
    designation_type: "Heritage Tree",
    province: "Rochor",
    city: "Singapore",
    locality_text: "Mount Emily Park",
    latitude: 1.3010,
    longitude: 103.8480,
    height_m: 20,
    girth_or_stem: "2600mm girth",
    description: "A beloved Saga tree whose bright red seeds are collected by schoolchildren across Singapore. The seeds were once used as weights by goldsmiths.",
    source_row_ref: "SG-CC-003",
  },
  {
    tree_name: "Madras Thorn of Fort Canning",
    species_scientific: "Pithecellobium dulce",
    species_common: "Madras Thorn",
    designation_type: "Heritage Tree",
    province: "River Valley",
    city: "Singapore",
    locality_text: "Fort Canning Park, Keramat area",
    latitude: 1.2945,
    longitude: 103.8460,
    height_m: 15,
    girth_or_stem: "2200mm girth",
    description: "A Madras Thorn on the historic hill where Raffles established his first botanic garden in 1822 and 14th-century Malay kings once held court.",
    source_row_ref: "SG-CC-004",
  },
  {
    tree_name: "Sea Apple of Changi",
    species_scientific: "Syzygium grande",
    species_common: "Sea Apple",
    designation_type: "Heritage Tree",
    province: "Changi",
    city: "Singapore",
    locality_text: "Changi Beach Park",
    latitude: 1.3910,
    longitude: 103.9910,
    height_m: 18,
    girth_or_stem: "2800mm girth",
    description: "A coastal Sea Apple at Changi Beach — a reminder of Singapore's pre-urban shoreline forests. Its white flowers attract sunbirds and butterflies.",
    source_row_ref: "SG-CC-005",
  },
  {
    tree_name: "Yellow Flame of Orchard Road",
    species_scientific: "Peltophorum pterocarpum",
    species_common: "Yellow Flame",
    designation_type: "Heritage Tree",
    province: "Orchard",
    city: "Singapore",
    locality_text: "Orchard Boulevard, near Botanic Gardens MRT",
    latitude: 1.3040,
    longitude: 103.8200,
    height_m: 22,
    girth_or_stem: "3000mm girth",
    description: "A Yellow Flame tree that predates Singapore's shopping belt. Its cascading yellow blossoms contrast with the glass towers of Orchard Road.",
    source_row_ref: "SG-CC-006",
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
    country: "Singapore",
    locality_text: t.locality_text,
    latitude: t.latitude,
    longitude: t.longitude,
    height_m: t.height_m,
    girth_or_stem: t.girth_or_stem,
    crown_spread: null,
    age_estimate: t.age_estimate || null,
    description: t.description,
    source_doc_title: "Singapore Heritage Tree Register (NParks)",
    source_doc_url: "https://www.nparks.gov.sg/gardens-parks-and-nature/heritage-trees",
    source_doc_year: 2024,
    source_program: "sg-heritage-trees",
    source_row_ref: t.source_row_ref,
    geo_precision: "approx",
    heritage_status: "official_register",
    status: "research",
    record_status: "draft",
    record_kind: "individual_tree",
  }));

  if (dryRun) {
    console.log(`[DRY RUN] Would insert ${records.length} Singapore trees:`);
    records.forEach((r, i) => console.log(`  ${i + 1}. ${r.tree_name} (${r.species_common}) — ${r.province}`));
    console.log("\nCircles:");
    console.log(`  Botanic Garden Elders: ${records.filter(r => r.source_row_ref?.startsWith("SG-BG")).length}`);
    console.log(`  Temple Guardians: ${records.filter(r => r.source_row_ref?.startsWith("SG-TG")).length}`);
    console.log(`  Rainforest Giants: ${records.filter(r => r.source_row_ref?.startsWith("SG-RG")).length}`);
    console.log(`  City Canopy Trees: ${records.filter(r => r.source_row_ref?.startsWith("SG-CC")).length}`);
    return;
  }

  console.log(`Inserting ${records.length} Singapore heritage trees...`);

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
  console.log(`✅ Inserted ${inserted.length} Singapore trees.`);
  inserted.forEach((r) => console.log(`  - ${r.tree_name} (${r.id})`));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
