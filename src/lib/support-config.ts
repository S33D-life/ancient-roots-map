/**
 * Support page configuration — single source of truth for donation rails,
 * wallet addresses, and feature flags.
 */

export const SUPPORT_CONFIG = {
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
    /** Optional external checkout (e.g. The Giving Block) */
    checkoutUrl: "",
    checkoutLabel: "",
    enabled: false, // flip when real addresses are set
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
    url: "", // internal route or external URL
    isExternal: false,
  },
} as const;
