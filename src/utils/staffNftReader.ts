import { ethers } from "ethers";
import {
  STAFF_CONTRACT_ADDRESS,
  ACTIVE_RPC_URL,
  STAFF_NFT_ABI,
  SPECIES_CODES,
  SPECIES_MAP,
  formatStaffCode,
  type SpeciesCode,
} from "@/config/staffContract";

export interface OwnedStaff {
  tokenId: number;
  speciesId: number;
  circleId: number;
  variantId: number;
  staffNumber: number;
  isOriginSpiral: boolean;
  code: string;
  name: string;
  species: string;
  image: string;
}

/**
 * Query the StaffNFT contract to find all tokens owned by an address.
 * Uses a Base RPC provider (read-only, no wallet needed).
 */
export async function getOwnedStaffs(ownerAddress: string): Promise<OwnedStaff[]> {
  if (!STAFF_CONTRACT_ADDRESS) {
    console.warn("Staff contract address not configured — using mock data");
    return [];
  }

  try {
    const provider = new ethers.JsonRpcProvider(ACTIVE_RPC_URL);
    const contract = new ethers.Contract(STAFF_CONTRACT_ADDRESS, STAFF_NFT_ABI, provider);

    const balance = await contract.balanceOf(ownerAddress);
    const count = Number(balance);

    if (count === 0) return [];

    // The contract is ERC721 but not ERC721Enumerable, so we need to
    // scan token IDs 1-144 to find which are owned by this address.
    const owned: OwnedStaff[] = [];
    const totalMinted = Number(await contract.totalMinted());

    const ownerLower = ownerAddress.toLowerCase();

    // Check ownership of all minted tokens in parallel (batched)
    const batchSize = 20;
    for (let start = 1; start <= totalMinted; start += batchSize) {
      const end = Math.min(start + batchSize, totalMinted + 1);
      const promises = [];
      for (let tokenId = start; tokenId < end; tokenId++) {
        promises.push(
          contract.ownerOf(tokenId).then((owner: string) => ({
            tokenId,
            owner: owner.toLowerCase(),
          })).catch(() => null)
        );
      }

      const results = await Promise.all(promises);

      for (const result of results) {
        if (result && result.owner === ownerLower) {
          try {
            const data = await contract.getStaffData(result.tokenId);
            const speciesId = Number(data.speciesId);
            const circleId = Number(data.circleId);
            const variantId = Number(data.variantId);
            const staffNumber = Number(data.staffNumber);
            const speciesCode = SPECIES_CODES[speciesId] || "UNK";
            const speciesInfo = SPECIES_MAP[speciesCode as SpeciesCode];

            owned.push({
              tokenId: result.tokenId,
              speciesId,
              circleId,
              variantId,
              staffNumber,
              isOriginSpiral: data.isOriginSpiral,
              code: formatStaffCode(speciesId, circleId, staffNumber),
              name: `${speciesInfo?.name || speciesCode} Staff`,
              species: speciesInfo?.name || speciesCode,
              image: speciesInfo?.image || "/images/staffs/oak.jpeg",
            });
          } catch {
            // Skip tokens with data errors
          }
        }
      }
    }

    return owned;
  } catch (error) {
    console.error("Error querying staff contract:", error);
    return [];
  }
}

/**
 * Get minting status from the contract
 */
export async function getMintingStatus() {
  if (!STAFF_CONTRACT_ADDRESS) return null;

  try {
    const provider = new ethers.JsonRpcProvider(ACTIVE_RPC_URL);
    const contract = new ethers.Contract(STAFF_CONTRACT_ADDRESS, STAFF_NFT_ABI, provider);
    const [originMinted, circlesMinted, totalMinted, remaining] = await contract.getMintingStatus();
    return {
      originMinted,
      circlesMinted: Number(circlesMinted),
      totalMinted: Number(totalMinted),
      remaining: Number(remaining),
    };
  } catch {
    return null;
  }
}
