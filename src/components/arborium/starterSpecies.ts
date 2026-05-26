/**
 * starterSpecies — Beginner field guide seeds for The Arborium.
 * Intentionally short. Future per-species pages will extend this.
 */
import type { SpeciesSeed } from "./SpeciesCard";

export const STARTER_SPECIES: SpeciesSeed[] = [
  {
    slug: "oak",
    common: "Oak",
    latin: "Quercus",
    description:
      "Slow, broad, deep-rooted. The oak holds whole worlds inside its canopy — galls, lichens, jays, acorns, centuries.",
    clue: "Look for lobed leaves and acorns sitting in tiny wooden cups.",
    emoji: "🌳",
    questHint: "Find an oak nearby",
  },
  {
    slug: "yew",
    common: "Yew",
    latin: "Taxus baccata",
    description:
      "The quiet elder of churchyards. Yews can live thousands of years, hollowing inward as they age.",
    clue: "Flat dark-green needles, reddish flaking bark, soft red berries (seed inside is toxic).",
    emoji: "🌲",
    questHint: "Visit an ancient yew",
  },
  {
    slug: "willow",
    common: "Willow",
    latin: "Salix",
    description:
      "River-keeper and weeper. Willows lean toward water and bend with every weather.",
    clue: "Long, slender leaves and supple branches that sway low to streams.",
    emoji: "🌿",
    questHint: "Walk a willow's water",
  },
  {
    slug: "beech",
    common: "Beech",
    latin: "Fagus sylvatica",
    description:
      "Cathedral of light. Beech woods hold a hushed, silver-trunked stillness in every season.",
    clue: "Smooth grey bark and coppery leaves that often cling through winter.",
    emoji: "🍂",
    questHint: "Sit beneath a beech",
  },
  {
    slug: "hawthorn",
    common: "Hawthorn",
    latin: "Crataegus",
    description:
      "The threshold tree of hedgerows. Hawthorn marks edges — between field and wood, world and otherworld.",
    clue: "Thorny twigs, white May blossom, deep red berries (haws) in autumn.",
    emoji: "🌸",
    questHint: "Greet a hedgerow hawthorn",
  },
];
