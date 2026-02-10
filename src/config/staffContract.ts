/**
 * Ancient Friends Staff NFT — On-chain contract configuration
 * Contract: StaffNFT (AFSTAFF) on Base
 * Source: https://github.com/S33D-life/Ancient-Friends-/tree/main/contracts
 */

// ── Contract address ──────────────────────────────────────────────
// TODO: Replace with deployed address once available
export const STAFF_CONTRACT_ADDRESS = "";

// ── Chain config ──────────────────────────────────────────────────
export const BASE_CHAIN_ID = 8453;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const BASE_RPC_URL = "https://mainnet.base.org";
export const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";

// Use testnet until mainnet deploy is confirmed
export const ACTIVE_CHAIN_ID: number = BASE_SEPOLIA_CHAIN_ID;
export const ACTIVE_RPC_URL = BASE_SEPOLIA_RPC_URL;

// ── Explorer & marketplace links ──────────────────────────────────
export const getBaseScanUrl = (tokenId: number) =>
  ACTIVE_CHAIN_ID === BASE_CHAIN_ID
    ? `https://basescan.org/token/${STAFF_CONTRACT_ADDRESS}?a=${tokenId}`
    : `https://sepolia.basescan.org/token/${STAFF_CONTRACT_ADDRESS}?a=${tokenId}`;

export const getOpenSeaUrl = (tokenId: number) =>
  ACTIVE_CHAIN_ID === BASE_CHAIN_ID
    ? `https://opensea.io/assets/base/${STAFF_CONTRACT_ADDRESS}/${tokenId}`
    : `https://testnets.opensea.io/assets/base-sepolia/${STAFF_CONTRACT_ADDRESS}/${tokenId}`;

export const getContractBaseScanUrl = () =>
  ACTIVE_CHAIN_ID === BASE_CHAIN_ID
    ? `https://basescan.org/address/${STAFF_CONTRACT_ADDRESS}`
    : `https://sepolia.basescan.org/address/${STAFF_CONTRACT_ADDRESS}`;

// ── IPFS metadata ─────────────────────────────────────────────────
export const METADATA_CID = "bafybeifhxjg25llq53foszdeyzujn4dgo3tc3hnbavqbsrdtn3cctbe6hq";
export const getMetadataUrl = (tokenId: number) =>
  `https://gateway.pinata.cloud/ipfs/${METADATA_CID}/${tokenId}.json`;
export const getImageUrl = (tokenId: number) =>
  `https://gateway.pinata.cloud/ipfs/${METADATA_CID}/${tokenId}.jpg`;

// ── 36 Origin Spiral species ──────────────────────────────────────
export const SPECIES_CODES = [
  "GOA", "PLUM", "BEE", "RHOD", "CHERRY", "ROW",
  "PINE", "BOX", "OAK", "PRIVET", "WILLOW", "SYC",
  "HAZ", "HORN", "YEW", "ASH", "HOL", "SWE",
  "APP", "IVY", "ELD", "HAW", "PLA", "BUCK",
  "BIR", "ROSE", "BUD", "CRAB", "DAWN", "HORS",
  "JAPA", "MED", "PEAR", "SLOE", "WITC", "ALD",
] as const;

export type SpeciesCode = (typeof SPECIES_CODES)[number];

// Map species codes to full names and local image paths
export const SPECIES_MAP: Record<SpeciesCode, { name: string; image: string }> = {
  GOA:    { name: "Goat Willow",       image: "/images/staffs/goa.jpeg" },
  PLUM:   { name: "Plum",             image: "/images/staffs/plum.jpeg" },
  BEE:    { name: "Beech",            image: "/images/staffs/bee.jpeg" },
  RHOD:   { name: "Rhododendron",     image: "/images/staffs/rhod.jpeg" },
  CHERRY: { name: "Cherry",           image: "/images/staffs/cher.jpeg" },
  ROW:    { name: "Rowan",            image: "/images/staffs/row.jpeg" },
  PINE:   { name: "Pine",             image: "/images/staffs/pine.jpeg" },
  BOX:    { name: "Box",              image: "/images/staffs/box.jpeg" },
  OAK:    { name: "English Oak",      image: "/images/staffs/oak.jpeg" },
  PRIVET: { name: "Privet",           image: "/images/staffs/priv.jpeg" },
  WILLOW: { name: "Weeping Willow",   image: "/images/staffs/wil.jpeg" },
  SYC:    { name: "Sycamore",         image: "/images/staffs/syc.jpeg" },
  HAZ:    { name: "Hazel",            image: "/images/staffs/haz.jpeg" },
  HORN:   { name: "Hornbeam",         image: "/images/staffs/horn.jpeg" },
  YEW:    { name: "Ancient Yew",      image: "/images/staffs/yew.jpeg" },
  ASH:    { name: "Common Ash",       image: "/images/staffs/ash.jpeg" },
  HOL:    { name: "Holly",            image: "/images/staffs/hol.jpeg" },
  SWE:    { name: "Sweet Chestnut",   image: "/images/staffs/swe.jpeg" },
  APP:    { name: "Apple",            image: "/images/staffs/app.jpeg" },
  IVY:    { name: "Ivy",              image: "/images/staffs/ivy.jpeg" },
  ELD:    { name: "Elder",            image: "/images/staffs/eld.jpeg" },
  HAW:    { name: "Hawthorn",         image: "/images/staffs/haw.jpeg" },
  PLA:    { name: "Plane",            image: "/images/staffs/pla.jpeg" },
  BUCK:   { name: "Buckthorn",        image: "/images/staffs/buck.jpeg" },
  BIR:    { name: "Silver Birch",     image: "/images/staffs/bir.jpeg" },
  ROSE:   { name: "Rose",             image: "/images/staffs/rose.jpeg" },
  BUD:    { name: "Buddleia",         image: "/images/staffs/bud.jpeg" },
  CRAB:   { name: "Crab Apple",       image: "/images/staffs/crab.jpeg" },
  DAWN:   { name: "Dawn Redwood",     image: "/images/staffs/dawn.jpeg" },
  HORS:   { name: "Horse Chestnut",   image: "/images/staffs/hors.jpeg" },
  JAPA:   { name: "Japanese Maple",   image: "/images/staffs/japa.jpeg" },
  MED:    { name: "Medlar",           image: "/images/staffs/med.jpeg" },
  PEAR:   { name: "Pear",             image: "/images/staffs/pear.jpeg" },
  SLOE:   { name: "Blackthorn",       image: "/images/staffs/sloe.jpeg" },
  WITC:   { name: "Witch Hazel",      image: "/images/staffs/witc.jpeg" },
  ALD:    { name: "Alder",            image: "/images/staffs/ald.jpeg" },
};

// ── Circle config ─────────────────────────────────────────────────
export const CIRCLES = [
  { id: 0, name: "Origin Spiral", speciesCode: null, count: 36 },
  { id: 1, name: "Oak Circle 1",  speciesCode: "OAK" as SpeciesCode, count: 12 },
  { id: 2, name: "Oak Circle 2",  speciesCode: "OAK" as SpeciesCode, count: 12 },
  { id: 3, name: "Oak Circle 3",  speciesCode: "OAK" as SpeciesCode, count: 12 },
  { id: 4, name: "Yew Circle 1",  speciesCode: "YEW" as SpeciesCode, count: 12 },
  { id: 5, name: "Yew Circle 2",  speciesCode: "YEW" as SpeciesCode, count: 12 },
  { id: 6, name: "Yew Circle 3",  speciesCode: "YEW" as SpeciesCode, count: 12 },
  { id: 7, name: "Ash Circle",    speciesCode: "ASH" as SpeciesCode, count: 12 },
  { id: 8, name: "Beech Circle",  speciesCode: "BEE" as SpeciesCode, count: 12 },
  { id: 9, name: "Holly Circle",  speciesCode: "HOL" as SpeciesCode, count: 12 },
] as const;

// ── Minimal ABI for read-only queries ─────────────────────────────
export const STAFF_NFT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function staffData(uint256 tokenId) view returns (uint8 speciesId, uint8 circleId, uint8 variantId, uint8 staffNumber, uint256 mintedAt, bool isOriginSpiral)",
  "function getStaffData(uint256 tokenId) view returns (tuple(uint8 speciesId, uint8 circleId, uint8 variantId, uint8 staffNumber, uint256 mintedAt, bool isOriginSpiral))",
  "function getSpeciesName(uint8 speciesId) view returns (string)",
  "function getCircleName(uint8 circleId) pure returns (string)",
  "function getVariantName(uint8 variantId) pure returns (string)",
  "function totalMinted() view returns (uint256)",
  "function remainingSupply() view returns (uint256)",
  "function getMintingStatus() view returns (bool originMinted, uint256 circlesMinted, uint256 totalMinted, uint256 remaining)",
  "function tokenURI(uint256 tokenId) view returns (string)",
] as const;

// ── Helper: resolve species code to local image ───────────────────
export function getStaffImage(code: string): string {
  const upper = code.toUpperCase() as SpeciesCode;
  return SPECIES_MAP[upper]?.image || "/images/staffs/oak.jpeg";
}

// ── Helper: format staff code from on-chain data ──────────────────
export function formatStaffCode(speciesId: number, circleId: number, staffNumber: number): string {
  const species = SPECIES_CODES[speciesId] || "UNK";
  return `${species}-C${circleId}S${staffNumber}`;
}
