import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOwnedStaffs, type OwnedStaff } from "@/utils/staffNftReader";
import { STAFF_CONTRACT_ADDRESS, ACTIVE_CHAIN_ID, BASE_CHAIN_ID } from "@/config/staffContract";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

interface WalletState {
  status: WalletStatus;
  address: string | null;
  shortAddress: string | null;
  chainId: number | null;
  chainName: string | null;
  isCorrectNetwork: boolean;
  staffs: OwnedStaff[];
  linkedStaff: OwnedStaff | null;
  error: string | null;
  isLive: boolean;
}

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  84532: "Base Sepolia",
  137: "Polygon",
  10: "Optimism",
  42161: "Arbitrum",
};

const shorten = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

export function useWallet(userId?: string) {
  const [state, setState] = useState<WalletState>({
    status: "disconnected",
    address: null,
    shortAddress: null,
    chainId: null,
    chainName: null,
    isCorrectNetwork: false,
    staffs: [],
    linkedStaff: null,
    error: null,
    isLive: !!STAFF_CONTRACT_ADDRESS,
  });

  // Restore from profile on mount
  useEffect(() => {
    if (!userId) return;
    const restore = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", userId)
        .single();
      if (data?.wallet_address && (window as any).ethereum) {
        // Check if still connected
        try {
          const accounts: string[] = await (window as any).ethereum.request({ method: "eth_accounts" });
          const match = accounts.find(a => a.toLowerCase() === data.wallet_address!.toLowerCase());
          if (match) {
            const chainHex = await (window as any).ethereum.request({ method: "eth_chainId" });
            const chainId = parseInt(chainHex, 16);
            setState(prev => ({
              ...prev,
              status: "connected",
              address: match,
              shortAddress: shorten(match),
              chainId,
              chainName: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
              isCorrectNetwork: chainId === ACTIVE_CHAIN_ID,
            }));
            // Fetch staffs in background
            fetchStaffs(match);
          }
        } catch {
          // Silently fail — user can reconnect
        }
      }
    };
    restore();
  }, [userId]);

  // Listen for account/chain changes
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (state.address && accounts[0].toLowerCase() !== state.address.toLowerCase()) {
        setState(prev => ({
          ...prev,
          address: accounts[0],
          shortAddress: shorten(accounts[0]),
          staffs: [],
          linkedStaff: null,
        }));
        fetchStaffs(accounts[0]);
        persistWallet(accounts[0]);
      }
    };

    const handleChainChanged = (chainHex: string) => {
      const chainId = parseInt(chainHex, 16);
      setState(prev => ({
        ...prev,
        chainId,
        chainName: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
        isCorrectNetwork: chainId === ACTIVE_CHAIN_ID,
      }));
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [state.address]);

  const fetchStaffs = async (address: string) => {
    try {
      if (STAFF_CONTRACT_ADDRESS) {
        const staffs = await getOwnedStaffs(address);
        setState(prev => ({ ...prev, staffs, isLive: true }));
      }
    } catch {
      // Non-critical
    }
  };

  const persistWallet = async (address: string | null) => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ wallet_address: address } as any)
      .eq("id", userId);
  };

  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;

    if (!eth) {
      // Mobile deep link or error
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const dappUrl = window.location.href.replace(/^https?:\/\//, "");
        window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
        return;
      }
      setState(prev => ({
        ...prev,
        status: "error",
        error: "MetaMask not detected. Please install MetaMask to connect your wallet.",
      }));
      return;
    }

    setState(prev => ({ ...prev, status: "connecting", error: null }));

    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      const chainHex = await eth.request({ method: "eth_chainId" });
      const chainId = parseInt(chainHex, 16);

      setState(prev => ({
        ...prev,
        status: "connected",
        address,
        shortAddress: shorten(address),
        chainId,
        chainName: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
        isCorrectNetwork: chainId === ACTIVE_CHAIN_ID,
        error: null,
      }));

      await persistWallet(address);
      await fetchStaffs(address);
    } catch (err: any) {
      const message = err?.code === 4001
        ? "Connection rejected — you can try again anytime."
        : err?.message || "Could not connect wallet.";
      setState(prev => ({ ...prev, status: "error", error: message }));
    }
  }, [userId]);

  const disconnect = useCallback(async () => {
    setState({
      status: "disconnected",
      address: null,
      shortAddress: null,
      chainId: null,
      chainName: null,
      isCorrectNetwork: false,
      staffs: [],
      linkedStaff: null,
      error: null,
      isLive: !!STAFF_CONTRACT_ADDRESS,
    });
    await persistWallet(null);
    localStorage.removeItem("linked_staff_code");
    localStorage.removeItem("linked_staff_name");
    localStorage.removeItem("linked_staff_token_id");
  }, [userId]);

  const selectStaff = useCallback((staff: OwnedStaff) => {
    setState(prev => ({ ...prev, linkedStaff: staff }));
    localStorage.setItem("linked_staff_code", staff.code);
    localStorage.setItem("linked_staff_name", staff.name);
    localStorage.setItem("linked_staff_token_id", String(staff.tokenId));
  }, []);

  const hasMetaMask = typeof window !== "undefined" && !!(window as any).ethereum;

  return {
    ...state,
    connect,
    disconnect,
    selectStaff,
    hasMetaMask,
  };
}
