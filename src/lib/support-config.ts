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
        period: "per week",
        label: "Weekly Seed",
        description: "A gentle weekly rhythm of support — like rain nurturing the grove.",
        stripeLink: "", // Stripe payment link URL — set when ready
        emoji: "🌱",
      },
      {
        id: "monthly",
        amount: "£3.33",
        period: "per month",
        label: "Monthly Root",
        description: "Steady monthly support that helps the roots grow deeper.",
        stripeLink: "", // Stripe payment link URL — set when ready
        emoji: "🌿",
      },
      {
        id: "personal-grove",
        amount: "£3.33",
        period: "per month",
        label: "Personal Grove",
        description: "Your own living grove — receive a monthly flow of S33D Hearts, unlock private offerings, and feed the commons ecosystem through your Heartwood Vault.",
        stripeLink: "", // Stripe payment link URL — set when ready
        emoji: "🌳",
        featured: true,
      },
    ],
  },

  /** Fiat donation links (Stripe Payment Links or similar) */
  fiat: {
    oneOff: "", // Stripe payment link URL — set when ready
    monthly: "", // Stripe subscription link URL — set when ready
    enabled: false, // flip when Stripe links are configured
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
    checkoutUrl: "",
    checkoutLabel: "",
    enabled: false,
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
