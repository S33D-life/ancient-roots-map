import { Leaf, Sparkles } from "lucide-react";
import DatasetAtlasPage from "@/components/atlas/DatasetAtlasPage";
import type { NarrativeSection, StorySection } from "@/components/atlas/DatasetAtlasPage";

const NARRATIVES: NarrativeSection[] = [
  {
    title: "City in a Garden",
    icon: <Leaf className="w-5 h-5 text-primary" />,
    paragraphs: [
      "Singapore — the Garden City — transformed itself from a colonial port into one of the world's greenest metropolises. Over 50% of the island is covered by vegetation, and NParks manages over 7 million trees across parks, nature reserves, and streetscapes.",
      "The Heritage Tree Scheme protects Singapore's most significant mature trees — botanical specimens, cultural landmarks, and ecological anchors that connect the modern city to its primeval rainforest origins.",
    ],
  },
  {
    title: "Tropical Heritage Trees",
    icon: "🌲",
    paragraphs: [
      "Singapore's Heritage Trees include some of the last wild dipterocarps in the region — towering Seraya, Mengaris, and Chengal that predate the founding of modern Singapore. The Bukit Timah Nature Reserve alone contains more tree species per hectare than all of North America.",
      "Beyond the reserves, Rain Trees (<i>Samanea saman</i>) form green tunnels along major roads, while Tembusu (<i>Cyrtophyllum fragrans</i>) — featured on the $5 note — anchor the Botanic Gardens' UNESCO World Heritage landscape.",
    ],
  },
  {
    title: "Urban Rainforest Canopy",
    icon: "🌿",
    paragraphs: [
      "Singapore's urban canopy is deliberately engineered: ecological corridors connect the central nature reserves, park connectors thread through housing estates, and roadside planting programmes ensure every resident lives within 400m of a park.",
      "The Heritage Trees within this matrix serve as ecological anchor points — seed sources, wildlife habitats, and cultural landmarks that maintain biodiversity in one of the world's most intensively developed islands.",
    ],
  },
];

const STORIES: StorySection[] = [
  {
    title: "The Tembusu & the Five-Dollar Note",
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    paragraphs: [
      "The Tembusu (<i>Cyrtophyllum fragrans</i>) on Singapore's five-dollar note stands in the Singapore Botanic Gardens near the main gate. Over 150 years old, its wide-spreading canopy and fragrant nocturnal flowers make it one of the island's most beloved trees.",
      "The tree's image was chosen for its representation of strength, stability, and resilience — qualities that mirror the nation's own journey from fishing village to global city.",
    ],
  },
  {
    title: "Tropical Guardians",
    icon: "🌿",
    paragraphs: [
      "Singapore sits at the crossroads of the Sundaland biodiversity hotspot — one of the richest concentrations of species on Earth. Despite occupying just 733 km², the island hosts over 2,100 native plant species. Heritage Trees serve as living libraries of this botanical wealth.",
      "Each Heritage Tree is a keystone: fruiting figs feed hornbills and flying foxes, dipterocarp canopies shelter epiphytes and mosses, and temple trees anchor cultural landscapes spanning Chinese, Malay, Indian, and Peranakan heritage.",
    ],
  },
];

const SingaporeAtlasPage = () => (
  <DatasetAtlasPage
    datasetKey="sg-heritage-trees"
    narrativeSections={NARRATIVES}
    storySections={STORIES}
    extraStat={{ label: "Nature Reserves", value: 4, icon: Leaf }}
  />
);

export default SingaporeAtlasPage;
