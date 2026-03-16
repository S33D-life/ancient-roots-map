/**
 * TETOL Living Ecosystem Map — data model.
 * Modular: add new nodes/connections by extending these arrays.
 */

export type EcoNodeType = "tree" | "partner" | "orbit" | "community" | "alternative" | "proposal";
export type OrbitRing = "creation" | "knowledge" | "blockchain" | "wallet" | "hardware";
export type DependencyLevel = "core" | "important" | "optional";

/** 5 = fully decentralised, 1 = centralised service */
export type SovereigntyScore = 1 | 2 | 3 | 4 | 5;

export const SOVEREIGNTY_LABELS: Record<SovereigntyScore, string> = {
  5: "Fully Decentralised",
  4: "Open Ecosystem",
  3: "Hybrid Platform",
  2: "Managed Platform",
  1: "Centralised Service",
};

export const SOVEREIGNTY_COLORS: Record<SovereigntyScore, string> = {
  5: "hsl(160, 55%, 50%)",
  4: "hsl(140, 45%, 50%)",
  3: "hsl(42, 55%, 55%)",
  2: "hsl(25, 55%, 55%)",
  1: "hsl(0, 50%, 55%)",
};

export type ProposalCategory =
  | "alternative-tool"
  | "wallet-integration"
  | "decentralised-replacement"
  | "resilience-improvement"
  | "sustainability-upgrade";

export const PROPOSAL_CATEGORIES: { id: ProposalCategory; label: string; emoji: string }[] = [
  { id: "alternative-tool", label: "Alternative Tools", emoji: "🔧" },
  { id: "wallet-integration", label: "Wallet Integrations", emoji: "👛" },
  { id: "decentralised-replacement", label: "Decentralised Replacements", emoji: "🌐" },
  { id: "resilience-improvement", label: "Resilience Improvements", emoji: "🛡️" },
  { id: "sustainability-upgrade", label: "Sustainability Upgrades", emoji: "🌱" },
];

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
  /** Dependency level for infrastructure nodes */
  dependencyLevel?: DependencyLevel;
  /** IDs of alternative infrastructure nodes */
  alternatives?: string[];
  /** If this node is an alternative, which primary node it replaces */
  alternativeFor?: string;
  /** Sovereignty / decentralisation score (1–5) */
  sovereigntyScore?: SovereigntyScore;
  /** For proposal nodes: which category */
  proposalCategory?: ProposalCategory;
  /** For proposal nodes: which layer it attaches to */
  proposalAttachesTo?: "orbit" | "resilience" | "mycelium";
}

export interface EcoConnection {
  from: string;
  to: string;
  type: "trunk" | "mycelium" | "orbit-link" | "proposal-link" | "resilience";
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
    sovereigntyScore: 4,
  },
  {
    id: "conscious-evolution",
    label: "Conscious Evolution",
    emoji: "🧬",
    type: "partner",
    partnerOrder: 1,
    description:
      "A partner in evolving human consciousness through ecological awareness, community practice, and regenerative living.",
    sovereigntyScore: 5,
  },
  {
    id: "protocol-love",
    label: "Protocol Love / CoGov",
    emoji: "💜",
    type: "partner",
    partnerOrder: 2,
    description:
      "Collaborative governance protocols that inform how councils, proposals, and community decisions flow through S33D.",
    sovereigntyScore: 4,
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
    sovereigntyScore: 5,
  },
  {
    id: "lilith",
    label: "Lilith",
    emoji: "🌙",
    type: "partner",
    partnerOrder: 4,
    description:
      "A creative and spiritual collaborator exploring the feminine, the wild, and the sacred in ecological work.",
    sovereigntyScore: 5,
  },
];

// ── Orbiting Infrastructure ──
export const ORBIT_NODES: EcoNode[] = [
  // Creation orbit
  { id: "lovable", label: "Lovable", emoji: "💖", type: "orbit", orbit: "creation", orbitAngle: 0, description: "The AI-native development platform powering S33D's front-end evolution.", supports: ["trunk", "canopy"], dependencyLevel: "core", alternatives: ["alt-cursor", "alt-bolt"], sovereigntyScore: 2 },
  { id: "openai", label: "OpenAI", emoji: "🤖", type: "orbit", orbit: "creation", orbitAngle: 72, description: "Language AI models supporting content generation, tree identification, and community tools.", supports: ["trunk"], dependencyLevel: "important", alternatives: ["alt-anthropic-api", "alt-gemini"], sovereigntyScore: 1 },
  { id: "claude", label: "Claude", emoji: "🧠", type: "orbit", orbit: "creation", orbitAngle: 144, description: "Anthropic's AI assistant — co-architect of the S33D codebase and design system.", supports: ["trunk", "crown"], dependencyLevel: "important", alternatives: ["alt-openai-api", "alt-gemini"], sovereigntyScore: 1 },
  { id: "github", label: "GitHub", emoji: "🐙", type: "orbit", orbit: "creation", orbitAngle: 216, description: "Version control and open-source collaboration. The living codebase of S33D.", supports: ["trunk"], dependencyLevel: "core", alternatives: ["alt-gitlab", "alt-codeberg"], sovereigntyScore: 3 },
  { id: "design-tools", label: "Design Tools", emoji: "🎨", type: "orbit", orbit: "creation", orbitAngle: 288, description: "Figma, image generation, and design systems that shape the visual language of the forest.", supports: ["trunk", "crown"], dependencyLevel: "optional", alternatives: ["alt-penpot"], sovereigntyScore: 2 },

  // Knowledge orbit
  { id: "notion", label: "Notion", emoji: "📝", type: "orbit", orbit: "knowledge", orbitAngle: 90, description: "The living knowledge base — documentation, roadmap, council notes, and community records.", supports: ["canopy", "trunk"], dependencyLevel: "important", alternatives: ["alt-coda", "alt-obsidian", "alt-git-docs"], sovereigntyScore: 2 },

  // Blockchain orbit
  { id: "ethereum", label: "Ethereum", emoji: "⟠", type: "orbit", orbit: "blockchain", orbitAngle: 30, description: "The primary chain for heart tokens, NFTrees, and on-chain attestations.", supports: ["roots", "trunk"], dependencyLevel: "core", alternatives: ["alt-polygon", "alt-base"], sovereigntyScore: 4 },
  { id: "bitcoin", label: "Bitcoin", emoji: "₿", type: "orbit", orbit: "blockchain", orbitAngle: 150, description: "The original chain — a philosophical anchor and potential future integration layer.", supports: ["roots"], dependencyLevel: "optional", sovereigntyScore: 5 },
  { id: "polkadot", label: "Polkadot / Unique", emoji: "⚡", type: "orbit", orbit: "blockchain", orbitAngle: 270, description: "Polkadot parachain ecosystem and Unique Network for advanced NFT standards.", supports: ["roots", "trunk"], dependencyLevel: "optional", sovereigntyScore: 4 },

  // Wallet orbit
  { id: "metamask", label: "MetaMask", emoji: "🦊", type: "orbit", orbit: "wallet", orbitAngle: 0, description: "The most widely used Ethereum wallet — primary entry point for on-chain S33D interactions.", supports: ["roots"], dependencyLevel: "important", alternatives: ["walletconnect", "rainbow", "coinbase-wallet", "phantom"], sovereigntyScore: 3 },
  { id: "walletconnect", label: "WalletConnect", emoji: "🔵", type: "orbit", orbit: "wallet", orbitAngle: 72, description: "Open protocol connecting mobile wallets to the S33D ecosystem.", supports: ["roots"], dependencyLevel: "important", sovereigntyScore: 4 },
  { id: "rainbow", label: "Rainbow", emoji: "🌈", type: "orbit", orbit: "wallet", orbitAngle: 144, description: "A beautiful, user-friendly Ethereum wallet aligned with the S33D ethos.", supports: ["roots"], dependencyLevel: "optional", sovereigntyScore: 3 },
  { id: "coinbase-wallet", label: "Coinbase Wallet", emoji: "🪙", type: "orbit", orbit: "wallet", orbitAngle: 216, description: "Institutional-grade wallet access for broader community reach.", supports: ["roots"], dependencyLevel: "optional", sovereigntyScore: 2 },
  { id: "phantom", label: "Phantom", emoji: "👻", type: "orbit", orbit: "wallet", orbitAngle: 288, description: "Multi-chain wallet supporting Solana and Ethereum ecosystems.", supports: ["roots"], dependencyLevel: "optional", sovereigntyScore: 3 },

  // Hardware orbit
  { id: "apple-computers", label: "Apple Computers", emoji: "💻", type: "orbit", orbit: "hardware", orbitAngle: 45, description: "Primary development and creation hardware for building the S33D ecosystem.", supports: ["trunk"], dependencyLevel: "important", alternatives: ["alt-linux"], sovereigntyScore: 1 },
  { id: "iphones", label: "iPhones", emoji: "📱", type: "orbit", orbit: "hardware", orbitAngle: 165, description: "Mobile field devices for tree mapping, companion mode, and on-the-ground stewardship.", supports: ["roots", "trunk"], dependencyLevel: "important", alternatives: ["alt-android"], sovereigntyScore: 1 },
  { id: "field-devices", label: "Field Devices", emoji: "📡", type: "orbit", orbit: "hardware", orbitAngle: 285, description: "GPS units, sensors, and mobile tools used for precision tree mapping and environmental data collection.", supports: ["roots"], dependencyLevel: "optional", sovereigntyScore: 3 },
];

// ── Alternative / Resilience Nodes ──
export const ALTERNATIVE_NODES: EcoNode[] = [
  // Creation alternatives
  { id: "alt-cursor", label: "Cursor", emoji: "⌨️", type: "alternative", alternativeFor: "lovable", description: "AI-powered code editor — alternative development environment if primary platform is unavailable.", sovereigntyScore: 2 },
  { id: "alt-bolt", label: "Bolt.new", emoji: "⚡", type: "alternative", alternativeFor: "lovable", description: "Browser-based AI coding — rapid prototyping alternative.", sovereigntyScore: 2 },
  { id: "alt-anthropic-api", label: "Anthropic API", emoji: "🧠", type: "alternative", alternativeFor: "openai", description: "Anthropic's API as a direct replacement for OpenAI language models.", sovereigntyScore: 1 },
  { id: "alt-openai-api", label: "OpenAI API", emoji: "🤖", type: "alternative", alternativeFor: "claude", description: "OpenAI API as a direct replacement for Claude-based workflows.", sovereigntyScore: 1 },
  { id: "alt-gemini", label: "Google Gemini", emoji: "💎", type: "alternative", alternativeFor: "openai", description: "Google's multimodal AI — alternative for content generation and reasoning.", sovereigntyScore: 1 },
  { id: "alt-gitlab", label: "GitLab", emoji: "🦊", type: "alternative", alternativeFor: "github", description: "Self-hostable Git platform with CI/CD — decentralised alternative to GitHub.", sovereigntyScore: 4 },
  { id: "alt-codeberg", label: "Codeberg", emoji: "🏔️", type: "alternative", alternativeFor: "github", description: "Non-profit, community-run Git hosting — aligned with open-source values.", sovereigntyScore: 5 },
  { id: "alt-penpot", label: "Penpot", emoji: "🖌️", type: "alternative", alternativeFor: "design-tools", description: "Open-source design tool — community-owned alternative to Figma.", sovereigntyScore: 5 },

  // Knowledge alternatives
  { id: "alt-coda", label: "Coda", emoji: "📄", type: "alternative", alternativeFor: "notion", description: "Flexible doc platform combining documents, spreadsheets, and apps.", sovereigntyScore: 2 },
  { id: "alt-obsidian", label: "Obsidian", emoji: "🗄️", type: "alternative", alternativeFor: "notion", description: "Local-first, Markdown-based knowledge management — no vendor lock-in.", sovereigntyScore: 4 },
  { id: "alt-git-docs", label: "Git-based Docs", emoji: "📂", type: "alternative", alternativeFor: "notion", description: "Documentation as code — Markdown in Git for permanent, version-controlled knowledge.", sovereigntyScore: 5 },

  // Blockchain alternatives
  { id: "alt-polygon", label: "Polygon", emoji: "🟣", type: "alternative", alternativeFor: "ethereum", description: "EVM-compatible L2 — lower gas costs while maintaining Ethereum security.", sovereigntyScore: 4 },
  { id: "alt-base", label: "Base", emoji: "🔵", type: "alternative", alternativeFor: "ethereum", description: "Coinbase L2 built on Optimism — accessible on-ramp to on-chain activity.", sovereigntyScore: 3 },

  // Hardware alternatives
  { id: "alt-linux", label: "Linux Machines", emoji: "🐧", type: "alternative", alternativeFor: "apple-computers", description: "Open-source hardware/OS — decentralised and community-maintained development platform.", sovereigntyScore: 5 },
  { id: "alt-android", label: "Android Devices", emoji: "🤖", type: "alternative", alternativeFor: "iphones", description: "Open mobile ecosystem — broader global reach for field mapping and companion mode.", sovereigntyScore: 3 },
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

// ── Example Proposal Nodes (provisional) ──
export const PROPOSAL_NODES: EcoNode[] = [
  {
    id: "proposal-ipfs-storage",
    label: "IPFS Storage",
    emoji: "📦",
    type: "proposal",
    description: "Decentralised file storage for tree photos and offerings — community-proposed resilience layer.",
    proposalCategory: "decentralised-replacement",
    proposalAttachesTo: "orbit",
    sovereigntyScore: 5,
  },
  {
    id: "proposal-ceramic-identity",
    label: "Ceramic Identity",
    emoji: "🆔",
    type: "proposal",
    description: "Decentralised identity protocol — sovereign wanderer profiles without platform lock-in.",
    proposalCategory: "decentralised-replacement",
    proposalAttachesTo: "orbit",
    sovereigntyScore: 5,
  },
  {
    id: "proposal-solar-nodes",
    label: "Solar Validators",
    emoji: "☀️",
    type: "proposal",
    description: "Community-run solar-powered validator nodes — sustainability upgrade for blockchain infrastructure.",
    proposalCategory: "sustainability-upgrade",
    proposalAttachesTo: "resilience",
    sovereigntyScore: 5,
  },
  {
    id: "proposal-frame-wallet",
    label: "Frame Wallet",
    emoji: "🖼️",
    type: "proposal",
    description: "Privacy-focused desktop wallet — additional wallet integration for sovereignty-conscious wanderers.",
    proposalCategory: "wallet-integration",
    proposalAttachesTo: "orbit",
    sovereigntyScore: 4,
  },
];

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

// ── Resilience connections (alternative → primary) ──
export const RESILIENCE_CONNECTIONS: EcoConnection[] = ALTERNATIVE_NODES.map((alt) => ({
  from: alt.id,
  to: alt.alternativeFor!,
  type: "resilience" as const,
  label: "alternative",
}));

// ── Proposal connections ──
export const PROPOSAL_CONNECTIONS: EcoConnection[] = PROPOSAL_NODES.map((p) => ({
  from: p.id,
  to: "community-proposals",
  type: "proposal-link" as const,
  label: "proposed",
}));

// ── Orbit metadata ──
export const ORBIT_RINGS: { id: OrbitRing; label: string; radius: number; color: string }[] = [
  { id: "creation", label: "Creation Tools", radius: 200, color: "hsl(42, 60%, 55%)" },
  { id: "knowledge", label: "Knowledge", radius: 260, color: "hsl(200, 50%, 55%)" },
  { id: "blockchain", label: "Blockchain", radius: 320, color: "hsl(270, 45%, 60%)" },
  { id: "wallet", label: "Wallets", radius: 380, color: "hsl(160, 45%, 50%)" },
  { id: "hardware", label: "Hardware", radius: 440, color: "hsl(20, 50%, 55%)" },
];

// ── Dependency colors ──
export const DEPENDENCY_COLORS: Record<DependencyLevel, string> = {
  core: "hsl(0, 60%, 55%)",
  important: "hsl(42, 60%, 55%)",
  optional: "hsl(160, 40%, 50%)",
};

export const DEPENDENCY_LABELS: Record<DependencyLevel, string> = {
  core: "Core — single point of failure risk",
  important: "Important — alternatives available",
  optional: "Optional — ecosystem enrichment",
};

export function getAllNodes(includeAlternatives = false, includeProposals = false): EcoNode[] {
  const base = [...TREE_NODES, ...PARTNER_NODES, ...ORBIT_NODES, COMMUNITY_NODE];
  let result = includeAlternatives ? [...base, ...ALTERNATIVE_NODES] : base;
  if (includeProposals) result = [...result, ...PROPOSAL_NODES];
  return result;
}
