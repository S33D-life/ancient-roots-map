/**
 * ID_BRANCHES — Deterministic field-guide branches for the Arborium Tree ID Starter.
 *
 * Each branch maps one clue type (leaf, bark, buds…) to a single question and a set of
 * plain-language answers. Each answer carries the slugs of matching starter species.
 *
 * v1: fully deterministic — answers map directly to species slugs from STARTER_SPECIES.
 * Future: connect answers to Quest Cave objectives, map species-filter params, and
 * photo-ID confidence layers as those systems mature.
 */

export interface IDBranchAnswer {
  id: string;
  label: string;
  hint: string;
  /** Slugs matching STARTER_SPECIES entries */
  species: string[];
}

export interface IDBranch {
  label: string;
  question: string;
  answers: IDBranchAnswer[];
}

export const ID_BRANCHES: Record<string, IDBranch> = {
  leaf: {
    label: "Leaf Shape",
    question: "What kind of leaves can you see?",
    answers: [
      {
        id: "lobed",
        label: "Lobed or rounded",
        hint: "Rounded finger-like curves, scalloped edges, or soft lobes.",
        species: ["oak", "hawthorn"],
      },
      {
        id: "needle",
        label: "Needles",
        hint: "Flat or sharp evergreen needles in two neat rows along the twig.",
        species: ["yew"],
      },
      {
        id: "long-narrow",
        label: "Long and narrow",
        hint: "Slender, willow-thin leaves — almost always near water.",
        species: ["willow"],
      },
      {
        id: "oval-wavy",
        label: "Oval or wavy edged",
        hint: "Smooth oval leaves with a slight wave along the margin.",
        species: ["beech"],
      },
    ],
  },

  bark: {
    label: "Bark Texture",
    question: "What does the bark look and feel like?",
    answers: [
      {
        id: "furrowed",
        label: "Deeply furrowed or rugged",
        hint: "Heavy ridges, rough to the touch — like an old map.",
        species: ["oak", "willow"],
      },
      {
        id: "reddish-flaking",
        label: "Reddish, soft, or gently flaking",
        hint: "Warm reddish-brown, fibrous in places, soft compared to oak.",
        species: ["yew"],
      },
      {
        id: "smooth-grey",
        label: "Smooth silver-grey",
        hint: "Clean, pale, almost skin-like — no ridges at all.",
        species: ["beech"],
      },
      {
        id: "thorny",
        label: "Thorny twigs or dense hedging",
        hint: "Sharp thorns on the stems; often forms field boundaries.",
        species: ["hawthorn"],
      },
    ],
  },

  buds: {
    label: "Buds & Twigs",
    question: "What can you see on the twigs or buds?",
    answers: [
      {
        id: "thorns",
        label: "Sharp thorns on the stem",
        hint: "Hard, rigid thorns — they don't bend.",
        species: ["hawthorn"],
      },
      {
        id: "clustered-buds",
        label: "Clustered buds at twig tips",
        hint: "Several small buds bunched together at the end of each twig.",
        species: ["oak"],
      },
      {
        id: "flexible-red",
        label: "Flexible reddish-brown twigs",
        hint: "Pliable twigs that bend without snapping — often near water.",
        species: ["willow"],
      },
      {
        id: "pointed-smooth",
        label: "Smooth grey twigs with pointed buds",
        hint: "Clean, pale twigs with long cigar-shaped buds.",
        species: ["beech"],
      },
      {
        id: "evergreen-needles",
        label: "Evergreen needles — no obvious buds",
        hint: "Dark flat needles present all year. No leaf-drop in autumn.",
        species: ["yew"],
      },
    ],
  },

  seeds: {
    label: "Seeds & Fruits",
    question: "What kind of seed, fruit, or case can you find?",
    answers: [
      {
        id: "acorns",
        label: "Acorns",
        hint: "Small nut sitting in a scaly wooden cup.",
        species: ["oak"],
      },
      {
        id: "red-berries-yew",
        label: "Soft red berries with a dark seed",
        hint: "Bright, fleshy, cup-shaped. The seed inside is toxic — do not eat.",
        species: ["yew"],
      },
      {
        id: "catkins-fluffy",
        label: "Catkins or cottony fluff",
        hint: "Dangling catkins in spring, or white fluffy seeds drifting in air.",
        species: ["willow"],
      },
      {
        id: "beech-mast",
        label: "Beech mast — spiky triangular cases",
        hint: "Small prickly husks, each holding two or three triangular nuts.",
        species: ["beech"],
      },
      {
        id: "haws",
        label: "Haws — deep red berries in clusters",
        hint: "Dense clusters of dark red berries on thorny branches in autumn.",
        species: ["hawthorn"],
      },
    ],
  },

  flowers: {
    label: "Flowers & Catkins",
    question: "What flowering sign can you see?",
    answers: [
      {
        id: "spring-catkins",
        label: "Dangling catkins in spring",
        hint: "Hanging yellow-green catkins appear before or alongside the first leaves.",
        species: ["oak", "willow"],
      },
      {
        id: "may-blossom",
        label: "Dense white blossom in May",
        hint: "Thick clusters of small white flowers with a heavy, sweet scent.",
        species: ["hawthorn"],
      },
      {
        id: "subtle-spring",
        label: "Subtle spring flowers — mast later in autumn",
        hint: "Inconspicuous flowers in spring; spiky mast cases follow in autumn.",
        species: ["beech"],
      },
      {
        id: "no-flower",
        label: "No obvious flowers — evergreen all year",
        hint: "Always dark and green. Soft red berries appear in autumn.",
        species: ["yew"],
      },
    ],
  },

  silhouette: {
    label: "Whole-Tree Shape",
    question: "Step back — what shape does the whole tree make?",
    answers: [
      {
        id: "broad-spreading",
        label: "Broad, spreading crown",
        hint: "Wide, generous canopy that fills the sky in all directions.",
        species: ["oak"],
      },
      {
        id: "dark-evergreen",
        label: "Dense dark evergreen — no seasonal change",
        hint: "Heavy and dark, often in churchyards. No leaves drop in autumn.",
        species: ["yew"],
      },
      {
        id: "weeping-river",
        label: "Weeping or river-edge form",
        hint: "Long branches drooping toward the ground or trailing over water.",
        species: ["willow"],
      },
      {
        id: "tall-silver",
        label: "Tall with smooth silver trunk",
        hint: "Columns of pale trunks rising through hushed, dim woodland.",
        species: ["beech"],
      },
      {
        id: "hedgerow-thorny",
        label: "Small, thorny hedgerow tree",
        hint: "Dense, spiny, low — often marking the edge of a field.",
        species: ["hawthorn"],
      },
    ],
  },

  season: {
    label: "Season",
    question: "What seasonal clue can you see right now?",
    answers: [
      {
        id: "spring-catkins-s",
        label: "Spring catkins",
        hint: "Catkins visible before or just as the leaves begin to open.",
        species: ["oak", "willow"],
      },
      {
        id: "may-blossom-s",
        label: "May blossom",
        hint: "One of the most visible spring signs — thick white flowering.",
        species: ["hawthorn"],
      },
      {
        id: "copper-autumn",
        label: "Copper-brown leaves or mast in autumn",
        hint: "Warm brown leaves clinging into winter, or spiky mast cases falling.",
        species: ["beech"],
      },
      {
        id: "red-berries-s",
        label: "Red berries in autumn or winter",
        hint: "Bright berries on dark needles — vivid against bare winter woodland.",
        species: ["yew"],
      },
      {
        id: "autumn-acorns",
        label: "Acorns in autumn",
        hint: "Acorns on the ground or still on the twigs — September to October.",
        species: ["oak"],
      },
      {
        id: "winter-evergreen",
        label: "Evergreen in winter — still green when others are bare",
        hint: "Dark and present when all the deciduous trees have dropped their leaves.",
        species: ["yew"],
      },
    ],
  },
};
