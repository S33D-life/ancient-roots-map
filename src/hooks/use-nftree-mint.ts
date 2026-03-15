/**
 * useNFTreeMint — EIP-712 authorized mint flow for NFTree on Base.
 *
 * Trust model:
 *   1. Frontend requests authorization from the backend edge function.
 *   2. Backend verifies: auth user, wallet, staff ownership (DB + on-chain),
 *      generates real metadata, signs EIP-712 authorization.
 *   3. Frontend submits `mintAuthorized(...)` to the NFTree contract.
 *   4. Contract verifies: signature, expiry, nonce, staff ownership on-chain.
 *   5. Frontend records confirmation back to DB.
 *
 * The user wallet pays gas and sends the transaction, but cannot mint
 * without a fresh backend authorization. The backend cannot force a mint
 * to a wallet that doesn't own the Staff.
 */
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_CHAIN_ID } from "@/config/staffContract";
import {
  NFTREE_CONTRACT_ADDRESS,
  NFTREE_ABI,
  getNFTreeBaseScanUrl,
  getNFTreeOpenSeaUrl,
} from "@/config/nftreeContract";
import type { CachedStaff } from "@/hooks/use-wallet";
import { toast } from "sonner";

export type MintStage =
  | "idle"
  | "checking_wallet"
  | "checking_staff"
  | "authorizing"
  | "awaiting_signature"
  | "confirming"
  | "recording"
  | "success"
  | "error";

export interface MintResult {
  tokenId: number;
  txHash: string;
  explorerUrl: string;
  marketplaceUrl: string;
  mintId: string;
}

interface UseMintParams {
  walletAddress: string | null;
  isCorrectNetwork: boolean;
  activeStaff: CachedStaff | null;
  switchNetwork: () => Promise<boolean>;
}

export function useNFTreeMint({
  walletAddress,
  isCorrectNetwork,
  activeStaff,
  switchNetwork,
}: UseMintParams) {
  const [stage, setStage] = useState<MintStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MintResult | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
    setResult(null);
    setTxHash(null);
  }, []);

  const mint = useCallback(
    async (params: {
      treeId: string;
      offeringId?: string;
      title?: string;
      description?: string;
      imageUri?: string;
    }) => {
      const { treeId, offeringId, title, description, imageUri } = params;
      setError(null);
      setResult(null);
      setTxHash(null);

      try {
        // ── Step 1: Check wallet ──
        setStage("checking_wallet");
        if (!walletAddress) throw new Error("Please connect your wallet first.");

        const eth = (window as any).ethereum;
        if (!eth) throw new Error("MetaMask not detected.");

        if (!isCorrectNetwork) {
          const switched = await switchNetwork();
          if (!switched) throw new Error("Please switch to Base network to mint.");
        }

        // ── Step 2: Check staff ──
        setStage("checking_staff");
        if (!activeStaff)
          throw new Error(
            "No active Staff selected. Please select a Staff NFT in your Vault."
          );
        if (!activeStaff.token_id)
          throw new Error("Invalid Staff NFT — missing token ID.");

        if (!NFTREE_CONTRACT_ADDRESS) {
          throw new Error(
            "NFTree contract is not yet deployed. Minting will be available soon."
          );
        }

        // ── Step 3: Request backend authorization ──
        setStage("authorizing");
        const { data: authData, error: authError } =
          await supabase.functions.invoke("mint-nftree", {
            body: {
              treeId,
              offeringId: offeringId || null,
              staffId: activeStaff.id,
              staffTokenId: activeStaff.token_id,
              minterAddress: walletAddress,
              title: title || null,
              description: description || null,
              imageUri: imageUri || null,
            },
          });

        if (authError || authData?.error) {
          throw new Error(
            authData?.error || authError?.message || "Mint authorization failed."
          );
        }

        // Handle pending_deployment (contract not live yet)
        if (authData.status === "pending_deployment") {
          throw new Error(authData.message || "NFTree contract not yet deployed.");
        }

        const { mintId, authorization } = authData;
        if (!authorization?.signature) {
          throw new Error("No authorization received from backend.");
        }

        // ── Step 4: Submit on-chain transaction ──
        setStage("awaiting_signature");
        const provider = new ethers.BrowserProvider(eth);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          NFTREE_CONTRACT_ADDRESS,
          NFTREE_ABI,
          signer
        );

        // Update DB to 'submitted' before sending tx
        await supabase
          .from("nftree_mints" as any)
          .update({ mint_status: "submitted" } as any)
          .eq("id", mintId);

        const tx = await contract.mintAuthorized(
          authorization.metadataUri,
          authorization.staffTokenId,
          authorization.treeRef,
          authorization.offeringRef,
          authorization.nonce,
          authorization.deadline,
          authorization.signature
        );

        setTxHash(tx.hash);
        setStage("confirming");

        // Update DB with tx hash immediately
        await supabase
          .from("nftree_mints" as any)
          .update({ tx_hash: tx.hash, mint_status: "confirming" } as any)
          .eq("id", mintId);

        // ── Step 5: Wait for confirmation ──
        const receipt = await tx.wait(1);

        // Parse token ID from NFTreeMinted event
        let tokenId: number | null = null;
        let blockNumber: number | null = receipt.blockNumber || null;

        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
            if (parsed?.name === "NFTreeMinted") {
              tokenId = Number(parsed.args.tokenId);
              break;
            }
          } catch {
            // Not our event
          }
        }

        // ── Step 6: Record confirmation in DB ──
        setStage("recording");
        const explorerUrl = getNFTreeBaseScanUrl(tx.hash);
        const marketplaceUrl = tokenId ? getNFTreeOpenSeaUrl(tokenId) : "";

        await supabase
          .from("nftree_mints" as any)
          .update({
            token_id: tokenId,
            block_number: blockNumber,
            mint_status: "confirmed",
            confirmed_at: new Date().toISOString(),
            explorer_url: explorerUrl,
            marketplace_url: marketplaceUrl,
            contract_address: NFTREE_CONTRACT_ADDRESS,
          } as any)
          .eq("id", mintId);

        // Update offering with NFT link
        if (offeringId && explorerUrl) {
          await supabase
            .from("offerings")
            .update({ nft_link: explorerUrl } as any)
            .eq("id", offeringId);
        }

        const mintResult: MintResult = {
          tokenId: tokenId || 0,
          txHash: tx.hash,
          explorerUrl,
          marketplaceUrl,
          mintId,
        };

        setResult(mintResult);
        setStage("success");
        toast.success("NFTree sealed on-chain!", {
          description: `Token #${tokenId} anchored on Base`,
        });

        return mintResult;
      } catch (err: any) {
        const message =
          err?.code === "ACTION_REJECTED" || err?.code === 4001
            ? "Transaction was rejected in wallet."
            : err?.message || "Minting failed. Please try again.";

        setError(message);
        setStage("error");
        toast.error("Mint failed", { description: message });
        return null;
      }
    },
    [walletAddress, isCorrectNetwork, activeStaff, switchNetwork]
  );

  /**
   * Reconciliation: attempt to recover a mint whose tx succeeded
   * but whose DB confirmation was lost (e.g. browser closed mid-flow).
   */
  const reconcile = useCallback(
    async (mintId: string, txHashToCheck: string) => {
      try {
        const eth = (window as any).ethereum;
        if (!eth || !NFTREE_CONTRACT_ADDRESS) return null;

        const provider = new ethers.BrowserProvider(eth);
        const receipt = await provider.getTransactionReceipt(txHashToCheck);
        if (!receipt || receipt.status !== 1) return null;

        const contract = new ethers.Contract(
          NFTREE_CONTRACT_ADDRESS,
          NFTREE_ABI,
          provider
        );

        let tokenId: number | null = null;
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
            if (parsed?.name === "NFTreeMinted") {
              tokenId = Number(parsed.args.tokenId);
              break;
            }
          } catch {
            // skip
          }
        }

        const explorerUrl = getNFTreeBaseScanUrl(txHashToCheck);
        const marketplaceUrl = tokenId ? getNFTreeOpenSeaUrl(tokenId) : "";

        await supabase
          .from("nftree_mints" as any)
          .update({
            token_id: tokenId,
            block_number: receipt.blockNumber,
            mint_status: "confirmed",
            confirmed_at: new Date().toISOString(),
            explorer_url: explorerUrl,
            marketplace_url: marketplaceUrl,
            tx_hash: txHashToCheck,
            contract_address: NFTREE_CONTRACT_ADDRESS,
          } as any)
          .eq("id", mintId);

        return { tokenId, txHash: txHashToCheck, explorerUrl, marketplaceUrl };
      } catch {
        return null;
      }
    },
    []
  );

  return { stage, error, result, txHash, mint, reset, reconcile };
}
