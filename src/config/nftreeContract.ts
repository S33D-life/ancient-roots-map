/**
 * NFTree contract configuration — on-chain collectible minting on Base.
 * 
 * The contract address is set via VITE_NFTREE_CONTRACT_ADDRESS env var.
 * Until the contract is deployed, this will be empty and the UI will
 * show "coming soon" instead of the mint button.
 */

import NFTREE_ABI_JSON from "@/contracts/NFTree.abi.json";

export const NFTREE_CONTRACT_ADDRESS =
  (import.meta.env.VITE_NFTREE_CONTRACT_ADDRESS as string | undefined) || "";

export const NFTREE_ABI = NFTREE_ABI_JSON;

import { ACTIVE_CHAIN_ID, BASE_CHAIN_ID } from "@/config/staffContract";

/** Transaction explorer link */
export const getNFTreeBaseScanUrl = (txHash: string) =>
  ACTIVE_CHAIN_ID === BASE_CHAIN_ID
    ? `https://basescan.org/tx/${txHash}`
    : `https://sepolia.basescan.org/tx/${txHash}`;

/** OpenSea link for a minted NFTree token */
export const getNFTreeOpenSeaUrl = (tokenId: number) => {
  if (!NFTREE_CONTRACT_ADDRESS) return "";
  return ACTIVE_CHAIN_ID === BASE_CHAIN_ID
    ? `https://opensea.io/assets/base/${NFTREE_CONTRACT_ADDRESS}/${tokenId}`
    : `https://testnets.opensea.io/assets/base-sepolia/${NFTREE_CONTRACT_ADDRESS}/${tokenId}`;
};

/** BaseScan contract page */
export const getNFTreeContractUrl = () => {
  if (!NFTREE_CONTRACT_ADDRESS) return "";
  return ACTIVE_CHAIN_ID === BASE_CHAIN_ID
    ? `https://basescan.org/address/${NFTREE_CONTRACT_ADDRESS}`
    : `https://sepolia.basescan.org/address/${NFTREE_CONTRACT_ADDRESS}`;
};
