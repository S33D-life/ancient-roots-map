/**
 * Support page configuration — single source of truth for donation rails,
 * wallet addresses, and feature flags.
 */

export const SUPPORT_CONFIG = {
  /** Recurring support tiers */
  recurring: {
    enabled: true,
    tiers: [
      {
        id: "weekly",
        amount: "£3.33",
        amountMinor: 333,
        period: "per week",
        label: "Weekly Seed",
        description: "A gentle weekly rhythm of support — like rain nurturing the grove.",
        emoji: "🌱",
      },
      {
        id: "monthly",
        amount: "£3.33",
        amountMinor: 333,
        period: "per month",
        label: "Monthly Root",
        description: "Steady monthly support that helps the roots grow deeper.",
        emoji: "🌿",
      },
      {
        id: "personal-grove",
        amount: "£33",
        amountMinor: 3300,
        period: "per month",
        label: "Personal Grove",
        description: "Your own living grove — receive a monthly flow of S33D Hearts, unlock private offerings, and feed the commons ecosystem through your Heartwood Vault.",
        emoji: "🌳",
        featured: true,
      },
    ],
  },

  /** One-off support */
  oneOff: {
    enabled: true,
    presets: [333, 1100, 3300], // in pence
    labels: ["£3.33", "£11", "£33"],
    minAmount: 100, // £1 minimum
  },

  /** Crypto wallet addresses */
  crypto: {
    wallets: [
      {
        label: "Ethereum (ETH)",
        symbol: "ETH",
        address: "0x1234...your-eth-address",
        network: "Ethereum Mainnet / Base / Arbitrum",
      },
      {
        label: "Bitcoin (BTC)",
        symbol: "BTC",
        address: "bc1q...your-btc-address",
        network: "Bitcoin Mainnet",
      },
    ] as const,
    enabled: true,
  },

  /** External donation rails */
  external: {
    giveth: {
      url: "https://giveth.io/project/s33dlife",
      label: "Donate on Giveth",
    },
  },

  /** Pitch deck — hidden until ready */
  pitchDeck: {
    enabled: false,
    url: "",
    isExternal: false,
  },
} as const;
