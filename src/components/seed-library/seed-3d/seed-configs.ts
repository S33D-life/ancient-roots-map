/** Seed definition objects for the 3D viewer — first 3 seeds */

export type FallbackShape = "acorn" | "corn" | "hemp";

export interface Seed3DConfig {
  slug: string;
  commonName: string;
  latinName: string;
  speciesGroup: string;
  originLabel: string;
  description: string;
  useCategory: string;
  germinationNotes: string;
  storageNotes: string;
  /** Path to a GLB/GLTF asset — leave empty to use procedural fallback */
  modelPath: string | null;
  fallbackShapeType: FallbackShape;
  tone: string;
  color: string;        // primary hue for placeholder geometry
  colorAccent: string;  // secondary hue
}

export const SEED_CONFIGS: Seed3DConfig[] = [
  {
    slug: "oak-acorn",
    commonName: "Oak Acorn",
    latinName: "Quercus robur",
    speciesGroup: "Oak",
    originLabel: "Widespread — Northern Hemisphere temperate forests",
    description:
      "An ancestral seed that encodes an entire forest. The acorn is patience made physical — slow to germinate, deep-rooted, and cathedral-building over centuries.",
    useCategory: "tree",
    germinationNotes:
      "Cold-stratify for 60–90 days. Plant 2–3 cm deep in autumn; emergence in spring.",
    storageNotes:
      "Keep moist and cool — acorns lose viability quickly if dried. Store in damp sand at 1–4 °C.",
    modelPath: null,
    fallbackShapeType: "acorn",
    tone: "ancestral, grounded, arboreal",
    color: "#6B4226",
    colorAccent: "#8B6914",
  },
  {
    slug: "hopi-rainbow-corn",
    commonName: "Hopi Rainbow Corn",
    latinName: "Zea mays",
    speciesGroup: "Corn / Maize",
    originLabel: "Hopi ancestral lands — present-day Arizona",
    description:
      "A ceremonial variety carrying generations of Hopi agricultural wisdom. Each cob holds a spectrum of colors — a living archive of selective care and seasonal prayer.",
    useCategory: "food",
    germinationNotes:
      "Direct sow after last frost, 5 cm deep. Germinates in 7–10 days at soil temperatures above 15 °C.",
    storageNotes:
      "Dry cobs fully on the stalk, then store in a breathable bag in a cool, dark place. Viable for 2–3 years.",
    modelPath: null,
    fallbackShapeType: "corn",
    tone: "vibrant, cultivated, ceremonial",
    color: "#C4A84D",
    colorAccent: "#8B2252",
  },
  {
    slug: "hemp-seed",
    commonName: "Hemp Seed",
    latinName: "Cannabis sativa",
    speciesGroup: "Hemp",
    originLabel: "Central Asia — one of humanity's oldest cultivated plants",
    description:
      "Small, potent, foundational. Hemp seeds are a complete protein source and the plant provides fibre, oil, and building material — a civilisation seed.",
    useCategory: "medicinal",
    germinationNotes:
      "Soak 12 hours, sow 1–2 cm deep in warm soil. Sprouts in 3–7 days.",
    storageNotes:
      "Cool, dark, airtight. Hemp seed oil goes rancid quickly — store whole seeds for longevity.",
    modelPath: null,
    fallbackShapeType: "hemp",
    tone: "small, potent, foundational",
    color: "#5A6B3C",
    colorAccent: "#3D4A2A",
  },
];
