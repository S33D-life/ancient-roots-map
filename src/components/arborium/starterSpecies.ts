/**
 * starterSpecies — Beginner field guide seeds for The Arborium.
 *
 * ID-first structure: each species surfaces three distinct learning layers so
 * wanderers can identify before they name.
 *
 *   idClue       → the single clearest visual clue to look for now
 *   seasonalClue → when to look and what changes
 *   lookFor      → one specific detail to seek out in the field
 */

export interface SpeciesSeed {
  slug: string;
  common: string;
  latin: string;
  tagline: string;
  idClue: string;
  seasonalClue: string;
  lookFor: string;
  emoji: string;
  questHint?: string;
}

export const STARTER_SPECIES: SpeciesSeed[] = [
  {
    slug: "oak",
    common: "Oak",
    latin: "Quercus",
    tagline: "Slow, broad, ancient. A world in one canopy.",
    idClue: "Lobed leaves with rounded, finger-like curves. Small acorns sit in scaly wooden cups.",
    seasonalClue: "Acorns ripen in autumn. Dangling catkins appear in spring before the leaves unfurl.",
    lookFor: "Deeply furrowed, rugged bark on older trees. Look for oak galls — small round growths — on summer leaves.",
    emoji: "🌳",
    questHint: "Find your first oak",
  },
  {
    slug: "yew",
    common: "Yew",
    latin: "Taxus baccata",
    tagline: "The quiet elder. Alive before history began.",
    idClue: "Flat, dark-green needles in two neat rows along the twig. Reddish, flaking bark. Soft red berries — the seed inside is toxic.",
    seasonalClue: "Red berries appear in autumn and winter, bright against dark needles.",
    lookFor: "Twisted, ancient trunks in churchyards. Very old yews hollow from the inside out.",
    emoji: "🌲",
    questHint: "Visit an ancient yew",
  },
  {
    slug: "willow",
    common: "Willow",
    latin: "Salix",
    tagline: "River-keeper and weeper. Always near water.",
    idClue: "Long, slender, narrow leaves. Supple drooping branches that trail toward the ground.",
    seasonalClue: "Catkins appear very early in spring — often the first sign of the new season in trees.",
    lookFor: "Near streams, rivers, and wet meadows. The low sweep of branches close to the water's edge.",
    emoji: "🌿",
    questHint: "Walk a willow's water",
  },
  {
    slug: "beech",
    common: "Beech",
    latin: "Fagus sylvatica",
    tagline: "Cathedral trunks. A hushed silver light.",
    idClue: "Smooth, pale silver-grey bark — very clean and distinctive. Oval leaves with a slightly wavy edge.",
    seasonalClue: "Coppery brown leaves often cling through winter. Beech mast — small spiky cases — falls in autumn.",
    lookFor: "A clean, un-textured trunk almost like pale skin, rising through dense woodland.",
    emoji: "🍂",
    questHint: "Sit beneath a beech",
  },
  {
    slug: "hawthorn",
    common: "Hawthorn",
    latin: "Crataegus",
    tagline: "The threshold tree. First to bloom, first to fruit.",
    idClue: "Sharp thorns on the twigs. Small lobed leaves. White blossom in May, then deep red berries (haws) in autumn.",
    seasonalClue: "White May blossom is one of the most visible signs of spring. Red haws last well into winter.",
    lookFor: "Hedgerows, field edges, and old boundaries. Often one of the oldest trees in a landscape.",
    emoji: "🌸",
    questHint: "Greet a hedgerow hawthorn",
  },
];
