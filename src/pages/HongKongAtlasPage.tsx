import { Mountain, Anchor } from "lucide-react";
import DatasetAtlasPage from "@/components/atlas/DatasetAtlasPage";
import type { NarrativeSection, StorySection } from "@/components/atlas/DatasetAtlasPage";

const NARRATIVES: NarrativeSection[] = [
  {
    title: "Urban Forests of Hong Kong",
    icon: <Mountain className="w-5 h-5 text-primary" />,
    paragraphs: [
      "Despite being one of the world's most densely populated territories, over 70% of Hong Kong's land area is countryside — steep hillsides clothed in subtropical forest, ancient fung shui woods protecting villages, and pockets of mangrove along the coast.",
      "The city's heritage trees are living witnesses to this tension between density and wilderness. Many stand at thresholds — where colonial stone walls meet tropical growth, where harbour promenades border the wild South China Sea.",
    ],
  },
  {
    title: "Living Walls & Stone Roots",
    icon: "🧱",
    paragraphs: [
      "Hong Kong's stone wall trees are a globally unique phenomenon — Chinese Banyans (<i>Ficus microcarpa</i>) whose aerial roots have colonised Victorian-era granite retaining walls, creating living bridges between geological and biological time.",
      "These trees are structural hybrids — part architecture, part organism. Their roots grip masonry joints, penetrate drainage channels, and eventually become load-bearing elements of the wall itself. They represent a natural archetype found nowhere else on Earth at this scale.",
    ],
  },
  {
    title: "Harbour Canopy Heritage",
    icon: <Anchor className="w-5 h-5 text-primary" />,
    paragraphs: [
      "Victoria Harbour — the fragrant harbour that gave Hong Kong its name — is fringed by heritage trees that have watched the skyline transform from colonial waterfront to glass-and-steel metropolis.",
      "Flame Trees blaze scarlet against the harbour each June. Rain Trees spread their feathery canopies across promenades. And the ever-present banyans guard the thresholds between land and sea.",
    ],
  },
];

const STORIES: StorySection[] = [
  {
    title: "The Incense Tree",
    icon: "✨",
    paragraphs: [
      "Hong Kong — 香港 — means \"Fragrant Harbour.\" The name comes from <i>Aquilaria sinensis</i>, the Incense Tree, whose aromatic resin was once Hong Kong's most valuable export, shipped from Aberdeen harbour to incense markets across Asia.",
      "Today, wild Incense Trees are critically endangered due to illegal harvesting of their precious agarwood. The few survivors in Sha Lo Tung and other New Territories valleys are among Hong Kong's most significant botanical treasures.",
    ],
  },
];

const HongKongAtlasPage = () => (
  <DatasetAtlasPage
    datasetKey="hk-ovt-register"
    narrativeSections={NARRATIVES}
    storySections={STORIES}
    extraStat={{ label: "Stone Wall Trees", value: "—", icon: Mountain }}
  />
);

export default HongKongAtlasPage;
