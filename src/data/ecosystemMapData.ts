/**
 * TETOL Living Ecosystem Map — data model.
 * Modular: add new nodes/connections by extending these arrays.
 */

export type EcoNodeType = "tree" | "partner" | "orbit" | "community";
export type OrbitRing = "creation" | "knowledge" | "blockchain" | "wallet" | "hardware";

export interface EcoNode {
  id: string;
  label: string;
  emoji: string;
  type: EcoNodeType;
  /** For tree nodes: vertical layer index (0=crown, 3=roots) */
  treeLayer?: number;
  /** For partner nodes */
  partnerOrder?: number;
  /** For orbit nodes */
  orbit?: OrbitRing;
  orbitAngle?: number; // degrees
  description: string;
  url?: string;
  /** What part of the tree this supports (for orbit nodes) */
  supports?: string[];
}

export interface EcoConnection {
  from: string;
  to: string;
  type: "trunk" | "mycelium" | "orbit-link" | "proposal-link";
  label?: string;
}

// ── Core Tree ──
export const TREE_NODES: EcoNode[] = [
  {
    id: "crown",
    label: "yOur Golden Dream",
    emoji: "👑",
    type: "tree",
    treeLayer: 0,
    description:
      "The crown of the tree — the shared vision. A regenerative economy where every tree, every wanderer, and every community thrives together.",
  },
  {
    id: "canopy",
    label: "Council of Life",
    emoji: "🌿",
    type: "tree",
    treeLayer: 1,
    description:
      "The canopy — governance and collective wisdom. Councils, bio-regions, and community decisions shape the direction of the ecosystem.",
  },
  {
    id: "trunk",
    label: "Heartwood Library",
    emoji: "📚",
    type: "tree",
    treeLayer: 2,
    description:
      "The trunk — the living archive. Stories, offerings, songs, books, and knowledge flow through the heartwood of the community.",
  },
  {
    id: "roots",
    label: "Ancient Friends",
    emoji: "🌳",
    type: "tree",
    treeLayer: 3,
    description:
      "The roots — the Atlas of trees. Every mapped tree anchors the ecosystem in the real, living world. Roots connect all life.",
  },
];

// ── Mycelium Partners ──
export const PARTNER_NODES: EcoNode[] = [
  {
    id: "blockshare",
    label: "Blockshare",
    emoji: "🔗",
    type: "partner",
    partnerOrder: 0,
    description:
      "Blockchain infrastructure partner. Helps anchor tree data and hearts on-chain for permanence and transparency.",
    url: "https://blockshare.net",
  },
  {
    id: "conscious-evolution",
    label: "Conscious Evolution",
    emoji: "🧬",
    type: "partner",
    partnerOrder: 1,
    description:
      "A partner in evolving human consciousness through ecological awareness, community practice, and regenerative living.",
  },
  {
    id: "protocol-love",
    label: "Protocol Love / CoGov",
    emoji: "💜",
    type: "partner",
    partnerOrder: 2,
    description:
      "Collaborative governance protocols that inform how councils, proposals, and community decisions flow through S33D.",
  },
  {
    id: "into-the-mythica",
    label: "Into the Mythica",
    emoji: "✨",
    type: "partner",
    partnerOrder: 3,
    description:
      "Storytelling and mythic narrative partner. Weaving the deeper story of humanity's relationship with the living world.",
    url: "https://intothemythica.com",
  },
  {
    id: "lilith",
    label: "Lilith",
    emoji: "🌙",
    type: "partner",
    partnerOrder: 4,
    description:
      "A creative and spiritual collaborator exploring the feminine, the wild, and the sacred in ecological work.",
  },
];

// ── Orbiting Infrastructure ──
export const ORBIT_NODES: EcoNode[] = [
  // Creation orbit
  { id: "lovable", label: "Lovable", emoji: "💖", type: "orbit", orbit: "creation", orbitAngle: 0, description: "The AI-native development platform powering S33D's front-end evolution.", supports: ["trunk", "canopy"] },
  { id: "openai", label: "OpenAI", emoji: "🤖", type: "orbit", orbit: "creation", orbitAngle: 72, description: "Language AI models supporting content generation, tree identification, and community tools.", supports: ["trunk"] },
  { id: "claude", label: "Claude", emoji: "🧠", type: "orbit", orbit: "creation", orbitAngle: 144, description: "Anthropic's AI assistant — co-architect of the S33D codebase and design system.", supports: ["trunk", "crown"] },
  { id: "github", label: "GitHub", emoji: "🐙", type: "orbit", orbit: "creation", orbitAngle: 216, description: "Version control and open-source collaboration. The living codebase of S33D.", supports: ["trunk"] },
  { id: "design-tools", label: "Design Tools", emoji: "🎨", type: "orbit", orbit: "creation", orbitAngle: 288, description: "Figma, image generation, and design systems that shape the visual language of the forest.", supports: ["trunk", "crown"] },

  // Knowledge orbit
  { id: "notion", label: "Notion", emoji: "📝", type: "orbit", orbit: "knowledge", orbitAngle: 90, description: "The living knowledge base — documentation, roadmap, council notes, and community records.", supports: ["canopy", "trunk"] },

  // Blockchain orbit
  { id: "ethereum", label: "Ethereum", emoji: "⟠", type: "orbit", orbit: "blockchain", orbitAngle: 30, description: "The primary chain for heart tokens, NFTrees, and on-chain attestations.", supports: ["roots", "trunk"] },
  { id: "bitcoin", label: "Bitcoin", emoji: "₿", type: "orbit", orbit: "blockchain", orbitAngle: 150, description: "The original chain — a philosophical anchor and potential future integration layer.", supports: ["roots"] },
  { id: "polkadot", label: "Polkadot / Unique", emoji: "⚡", type: "orbit", orbit: "blockchain", orbitAngle: 270, description: "Polkadot parachain ecosystem and Unique Network for advanced NFT standards.", supports: ["roots", "trunk"] },

  // Wallet orbit
  { id: "metamask", label: "MetaMask", emoji: "🦊", type: "orbit", orbit: "wallet", orbitAngle: 0, description: "The most widely used Ethereum wallet — primary entry point for on-chain S33D interactions.", supports: ["roots"] },
  { id: "walletconnect", label: "WalletConnect", emoji: "🔵", type: "orbit", orbit: "wallet", orbitAngle: 72, description: "Open protocol connecting mobile wallets to the S33D ecosystem.", supports: ["roots"] },
  { id: "rainbow", label: "Rainbow", emoji: "🌈", type: "orbit", orbit: "wallet", orbitAngle: 144, description: "A beautiful, user-friendly Ethereum wallet aligned with the S33D ethos.", supports: ["roots"] },
  { id: "coinbase-wallet", label: "Coinbase Wallet", emoji: "🪙", type: "orbit", orbit: "wallet", orbitAngle: 216, description: "Institutional-grade wallet access for broader community reach.", supports: ["roots"] },
  { id: "phantom", label: "Phantom", emoji: "👻", type: "orbit", orbit: "wallet", orbitAngle: 288, description: "Multi-chain wallet supporting Solana and Ethereum ecosystems.", supports: ["roots"] },

  // Hardware orbit
  { id: "apple-computers", label: "Apple Computers", emoji: "💻", type: "orbit", orbit: "hardware", orbitAngle: 45, description: "Primary development and creation hardware for building the S33D ecosystem.", supports: ["trunk"] },
  { id: "iphones", label: "iPhones", emoji: "📱", type: "orbit", orbit: "hardware", orbitAngle: 165, description: "Mobile field devices for tree mapping, companion mode, and on-the-ground stewardship.", supports: ["roots", "trunk"] },
  { id: "field-devices", label: "Field Devices", emoji: "📡", type: "orbit", orbit: "hardware", orbitAngle: 285, description: "GPS units, sensors, and mobile tools used for precision tree mapping and environmental data collection.", supports: ["roots"] },
];

// ── Community Proposals ──
export const COMMUNITY_NODE: EcoNode = {
  id: "community-proposals",
  label: "Community Proposals",
  emoji: "💡",
  type: "community",
  description:
    "The living edge of the ecosystem. Community members can propose new infrastructure tools, wallet options, partners, and sustainability improvements. Proposals connect to existing infrastructure or the mycelium network.",
};

// ── Connections ──
export const CONNECTIONS: EcoConnection[] = [
  // Trunk flow
  { from: "crown", to: "canopy", type: "trunk" },
  { from: "canopy", to: "trunk", type: "trunk" },
  { from: "trunk", to: "roots", type: "trunk" },

  // Mycelium
  { from: "roots", to: "blockshare", type: "mycelium" },
  { from: "roots", to: "conscious-evolution", type: "mycelium" },
  { from: "roots", to: "protocol-love", type: "mycelium" },
  { from: "roots", to: "into-the-mythica", type: "mycelium" },
  { from: "roots", to: "lilith", type: "mycelium" },

  // Community proposals
  { from: "community-proposals", to: "roots", type: "proposal-link", label: "Propose partners" },
  { from: "community-proposals", to: "canopy", type: "proposal-link", label: "Propose governance" },
];

// ── Orbit metadata ──
export const ORBIT_RINGS: { id: OrbitRing; label: string; radius: number; color: string }[] = [
  { id: "creation", label: "Creation Tools", radius: 200, color: "hsl(42, 60%, 55%)" },
  { id: "knowledge", label: "Knowledge", radius: 260, color: "hsl(200, 50%, 55%)" },
  { id: "blockchain", label: "Blockchain", radius: 320, color: "hsl(270, 45%, 60%)" },
  { id: "wallet", label: "Wallets", radius: 380, color: "hsl(160, 45%, 50%)" },
  { id: "hardware", label: "Hardware", radius: 440, color: "hsl(20, 50%, 55%)" },
];

export function getAllNodes(): EcoNode[] {
  return [...TREE_NODES, ...PARTNER_NODES, ...ORBIT_NODES, COMMUNITY_NODE];
}
