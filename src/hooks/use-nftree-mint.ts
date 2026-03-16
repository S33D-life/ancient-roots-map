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
 *
 * Recovery:
 *   - Before submitting the tx, mintId + authorization are persisted to
 *     localStorage so that if the browser closes mid-flow, the mint can
 *     be reconciled on next load via `reconcilePending()`.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_CHAIN_ID, ACTIVE_RPC_URLS, STAFF_CONTRACT_ADDRESS } from "@/config/staffContract";
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

/* ── localStorage recovery key ── */
const PENDING_MINT_KEY = "nftree_pending_mint";

interface PendingMint {
  mintId: string;
  txHash: string;
  timestamp: number;
}

function savePendingMint(pm: PendingMint) {
  try { localStorage.setItem(PENDING_MINT_KEY, JSON.stringify(pm)); } catch { /* noop */ }
}

function loadPendingMint(): PendingMint | null {
  try {
    const raw = localStorage.getItem(PENDING_MINT_KEY);
    if (!raw) return null;
    const pm = JSON.parse(raw) as PendingMint;
    // Expire after 1 hour — if tx hasn't confirmed by then, it's lost
    if (Date.now() - pm.timestamp > 3600_000) {
      localStorage.removeItem(PENDING_MINT_KEY);
      return null;
    }
    return pm;
  } catch { return null; }
}

function clearPendingMint() {
  try { localStorage.removeItem(PENDING_MINT_KEY); } catch { /* noop */ }
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
  const reconcileAttempted = useRef(false);

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
    setResult(null);
    setTxHash(null);
  }, []);

  /**
   * Reconciliation: attempt to recover a mint whose tx succeeded
   * but whose DB confirmation was lost (e.g. browser closed mid-flow).
   */
  const reconcile = useCallback(
    async (mintId: string, txHashToCheck: string): Promise<MintResult | null> => {
      try {
        const eth = (window as any).ethereum;
        if (!eth || !NFTREE_CONTRACT_ADDRESS) return null;

        const provider = new ethers.BrowserProvider(eth);
        const receipt = await provider.getTransactionReceipt(txHashToCheck);
        if (!receipt) return null; // tx still pending or unknown

        if (receipt.status !== 1) {
          // tx failed on-chain — mark DB accordingly
          await supabase
            .from("nftree_mints" as any)
            .update({ mint_status: "failed", error_message: "Transaction reverted on-chain" } as any)
            .eq("id", mintId);
          clearPendingMint();
          return null;
        }

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

        clearPendingMint();
        return { tokenId: tokenId || 0, txHash: txHashToCheck, explorerUrl, marketplaceUrl, mintId };
      } catch {
        return null;
      }
    },
    []
  );

  /**
   * Auto-reconcile on mount: if there's a pending mint in localStorage,
   * try to recover it from chain state.
   */
  useEffect(() => {
    if (reconcileAttempted.current) return;
    reconcileAttempted.current = true;

    const pending = loadPendingMint();
    if (!pending) return;

    reconcile(pending.mintId, pending.txHash).then((recovered) => {
      if (recovered) {
        setResult(recovered);
        setTxHash(recovered.txHash);
        setStage("success");
        toast.success("Recovered NFTree mint!", {
          description: `Token #${recovered.tokenId} was confirmed on-chain.`,
        });
      }
    });
  }, [reconcile]);

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

        // ── Step 2: Check staff + re-verify ownership on-chain ──
        setStage("checking_staff");
        if (!activeStaff)
          throw new Error(
            "No active Staff selected. Please select a Staff NFT in your Vault."
          );
        if (!activeStaff.token_id)
          throw new Error("Invalid Staff NFT — missing token ID.");

        // Re-verify Staff ownership on-chain before proceeding
        if (STAFF_CONTRACT_ADDRESS) {
          let verified = false;
          for (const rpcUrl of ACTIVE_RPC_URLS) {
            try {
              const readProvider = new ethers.JsonRpcProvider(rpcUrl);
              const staffContract = new ethers.Contract(
                STAFF_CONTRACT_ADDRESS,
                ["function ownerOf(uint256 tokenId) view returns (address)"],
                readProvider
              );
              const onChainOwner = await staffContract.ownerOf(activeStaff.token_id);
              if (onChainOwner.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new Error(
                  "Your wallet no longer owns this Staff NFT. Please select a different Staff."
                );
              }
              verified = true;
              break;
            } catch (rpcErr: any) {
              if (rpcErr.message?.includes("no longer owns")) throw rpcErr;
              // Try next RPC
            }
          }
          if (!verified) {
            throw new Error("Could not verify Staff NFT ownership on-chain. Please try again.");
          }
        }

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

        // ── CRITICAL: persist tx hash to localStorage BEFORE waiting ──
        // If the browser closes after this point, we can reconcile on reload.
        setTxHash(tx.hash);
        savePendingMint({ mintId, txHash: tx.hash, timestamp: Date.now() });

        setStage("confirming");

        // Update DB with tx hash immediately (best-effort, localStorage is the safety net)
        await supabase
          .from("nftree_mints" as any)
          .update({ tx_hash: tx.hash, mint_status: "confirming" } as any)
          .eq("id", mintId);

        // ── Step 5: Wait for confirmation ──
        const receipt = await tx.wait(1);

        if (!receipt || receipt.status !== 1) {
          clearPendingMint();
          await supabase
            .from("nftree_mints" as any)
            .update({ mint_status: "failed", error_message: "Transaction reverted on-chain" } as any)
            .eq("id", mintId);
          throw new Error("Transaction failed on-chain. No NFTree was minted.");
        }

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

        // Clear recovery state — mint is fully recorded
        clearPendingMint();

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

  return { stage, error, result, txHash, mint, reset, reconcile };
}
