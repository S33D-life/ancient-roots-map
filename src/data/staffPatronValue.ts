/**
 * Staff Patron Value — Canonical data for the patron offering.
 * Defines the four dimensions of value for founding staff patrons.
 */

export const PATRON_DONATION_GBP = 3_300;
export const PATRON_STARTING_HEARTS = 3_333;
export const PATRON_INFLUENCE_BONUS = 33;
export const PATRON_SPECIES_HEARTS_BONUS = 33;

export interface PatronValueDimension {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: string[];
}

export const PATRON_VALUE_DIMENSIONS: PatronValueDimension[] = [
  {
    id: "receives",
    title: "What You Receive",
    icon: "🪄",
    color: "hsl(42, 85%, 55%)",
    items: [
      "Handcrafted staff — one of 36 Origin Spiral staffs or 108 Circle staffs",
      "Patron NFT — your access key to the Staff Room and ecosystem",
      `${PATRON_STARTING_HEARTS.toLocaleString()} starting S33D Hearts`,
      `${PATRON_SPECIES_HEARTS_BONUS} Species Hearts for your staff's tree lineage`,
      `${PATRON_INFLUENCE_BONUS} Influence — founding voice in council governance`,
      "Early access to Staff Room, mapping journeys, and ecosystem features",
      "Home tree pathway — your first anchored Ancient Friend",
    ],
  },
  {
    id: "seeds",
    title: "What Your Donation Seeds",
    icon: "🌱",
    color: "hsl(150, 50%, 45%)",
    items: [
      "Treasury growth — sustaining the Ancient Friends commons",
      "App development — building tools for ecological stewardship",
      "Value Tree growth — expanding the S33D Heart economy",
      "TEOTAG Accelerator — funding builder cycles for artists, botanists, and stewards",
      "Future Proof of Flow economy — ecological participation rewards",
      "Pod, library, and infrastructure development",
      "Ancient tree protection and mapping worldwide",
    ],
  },
  {
    id: "grows",
    title: "What Can Grow From Your Staff",
    icon: "🌳",
    color: "hsl(120, 45%, 50%)",
    items: [
      "Mapped trees — every tree you discover earns more hearts",
      "Offerings — poems, songs, photos, and stories gifted to trees",
      "Nested NFTrees — digital companions for your physical tree visits",
      "Future staff lineage — your staff may seed circle expansions",
      "Species-heart flows — deeper bonds with specific tree families",
      "Council influence — guide ecosystem governance through stewardship",
    ],
  },
  {
    id: "founding",
    title: "Your Founding Role",
    icon: "👑",
    color: "hsl(280, 60%, 55%)",
    items: [
      "Part of the founding circle of the Ancient Friends Staff Room",
      "Founding patron recognition in the living ledger",
      "First-mover influence in council governance",
      "Soulbound stewardship — your role cannot be traded, only deepened",
      "Direct connection to the Initial Garden Offering channel",
      "Your staff becomes a living economic and ceremonial node",
    ],
  },
];

/** Flow visualization for how a donation flows through the ecosystem */
export const PATRON_FLOW_STEPS = [
  { label: "Donation", sublabel: `£${PATRON_DONATION_GBP.toLocaleString()}`, icon: "💰" },
  { label: "Staff Claim", sublabel: "Origin or Circle", icon: "🪄" },
  { label: "Starting Hearts", sublabel: `${PATRON_STARTING_HEARTS.toLocaleString()} S33D`, icon: "❤️" },
  { label: "Map · Offer · Grow", sublabel: "Earn more hearts", icon: "🌿" },
  { label: "Living Economy", sublabel: "Value Tree flows", icon: "🌳" },
];
