import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { ACTIVE_RPC_URLS, STAFF_CONTRACT_ADDRESS, STAFF_NFT_ABI } from "@/config/staffContract";

interface VerifyResult {
  tokenId: number;
  tokenURI: string | null;
  staffData: unknown | null;
}

export function useStaff(address?: string | null) {
  const [staffBalance, setStaffBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifiedToken, setVerifiedToken] = useState<VerifyResult | null>(null);

  const clearVerification = useCallback(() => {
    setVerifyError(null);
    setVerifiedToken(null);
  }, []);

  const getContract = useCallback(async () => {
    let lastError: unknown = null;

    for (const rpcUrl of ACTIVE_RPC_URLS) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(STAFF_CONTRACT_ADDRESS, STAFF_NFT_ABI, provider);
        // probe once so broken RPCs fail fast
        await provider.getBlockNumber();
        return contract;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("No RPC endpoint available");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBalance = async () => {
      if (!address || !STAFF_CONTRACT_ADDRESS) {
        setStaffBalance(0);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const contract = await getContract();
        const balance = await contract.balanceOf(address);
        if (!cancelled) setStaffBalance(Number(balance));
      } catch (err) {
        if (!cancelled) {
          setStaffBalance(0);
          setError(err instanceof Error ? err.message : "Could not read Staff balance");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadBalance();

    return () => {
      cancelled = true;
    };
  }, [address, getContract]);

  const verifyTokenId = useCallback(async (tokenIdInput: string) => {
    const tokenId = Number(tokenIdInput);
    if (!address) {
      setVerifyError("Connect a wallet first.");
      return;
    }
    if (!Number.isInteger(tokenId) || tokenId <= 0) {
      setVerifyError("Enter a valid numeric token ID.");
      return;
    }
    if (!STAFF_CONTRACT_ADDRESS) {
      setVerifyError("Staff contract address is not configured.");
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifiedToken(null);

    try {
      const contract = await getContract();

      const owner = String(await contract.ownerOf(tokenId)).toLowerCase();
      if (owner !== address.toLowerCase()) {
        throw new Error("This token is not owned by the connected wallet.");
      }

      let tokenURI: string | null = null;
      let staffData: unknown | null = null;

      try {
        tokenURI = await contract.tokenURI(tokenId);
      } catch {
        tokenURI = null;
      }

      try {
        staffData = await contract.getStaffData(tokenId);
      } catch {
        staffData = null;
      }

      setVerifiedToken({ tokenId, tokenURI, staffData });
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Token verification failed.");
    } finally {
      setVerifyLoading(false);
    }
  }, [address, getContract]);

  return {
    isStaffHolder: staffBalance > 0,
    staffBalance,
    isLoading,
    error,
    verifyTokenId,
    verifyLoading,
    verifyError,
    verifiedToken,
    clearVerification,
  };
}
