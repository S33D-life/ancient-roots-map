import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOwnedStaffs, type OwnedStaff } from "@/utils/staffNftReader";
import { STAFF_CONTRACT_ADDRESS, ACTIVE_CHAIN_ID } from "@/config/staffContract";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface CachedStaff {
  id: string;
  token_id: number;
  species: string;
  species_code: string;
  circle_id: number;
  staff_number: number;
  is_origin_spiral: boolean;
  image_url: string | null;
  owner_address: string | null;
}

interface WalletState {
  status: WalletStatus;
  address: string | null;
  shortAddress: string | null;
  chainId: number | null;
  chainName: string | null;
  isCorrectNetwork: boolean;
  staffs: OwnedStaff[];
  activeStaff: CachedStaff | null;
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

const CHAIN_PARAMS: Record<number, { chainName: string; rpcUrls: string[]; blockExplorerUrls: string[]; nativeCurrency: { name: string; symbol: string; decimals: number } }> = {
  84532: {
    chainName: "Base Sepolia",
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
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
    activeStaff: null,
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
        .select("wallet_address, active_staff_id")
        .eq("id", userId)
        .maybeSingle();

      // Load active staff from DB regardless of wallet connection
      if ((data as any)?.active_staff_id) {
        const { data: staffData } = await supabase
          .from("staffs")
          .select("*")
          .eq("id", (data as any).active_staff_id)
          .single();
        if (staffData) {
          setState(prev => ({ ...prev, activeStaff: staffData as unknown as CachedStaff }));
        }
      }

      if (data?.wallet_address && (window as any).ethereum) {
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
            fetchStaffs(match);
          }
        } catch {
          // Silently fail
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

  /** Sync owned staffs to the staffs table */
  const syncStaffsToDB = async (staffs: OwnedStaff[], ownerAddress: string) => {
    if (!userId || staffs.length === 0) return;

    for (const staff of staffs) {
      await supabase
        .from("staffs")
        .upsert({
          id: staff.code,
          token_id: staff.tokenId,
          species_id: staff.speciesId,
          circle_id: staff.circleId,
          variant_id: staff.variantId,
          staff_number: staff.staffNumber,
          is_origin_spiral: staff.isOriginSpiral,
          species: staff.species,
          species_code: staff.code.split("-")[0],
          image_url: staff.image,
          owner_address: ownerAddress.toLowerCase(),
          owner_user_id: userId,
          verified_at: new Date().toISOString(),
        } as any, { onConflict: "id" });
    }

    // Auto-select first staff if none active
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_staff_id")
      .eq("id", userId)
      .maybeSingle();

    if (!(profile as any)?.active_staff_id && staffs.length > 0) {
      await setActiveStaff(staffs[0].code);
    }
  };

  const fetchStaffs = async (address: string) => {
    try {
      if (STAFF_CONTRACT_ADDRESS) {
        const staffs = await getOwnedStaffs(address);
        setState(prev => ({ ...prev, staffs, isLive: true }));
        await syncStaffsToDB(staffs, address);
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

  const setActiveStaff = async (staffId: string | null) => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ active_staff_id: staffId } as any)
      .eq("id", userId);

    if (staffId) {
      const { data } = await supabase
        .from("staffs")
        .select("*")
        .eq("id", staffId)
        .maybeSingle();
      setState(prev => ({ ...prev, activeStaff: data as unknown as CachedStaff }));
      localStorage.setItem("linked_staff_code", staffId);
      localStorage.setItem("linked_staff_name", (data as any)?.species || staffId);
      localStorage.setItem("linked_staff_token_id", String((data as any)?.token_id || ""));
    } else {
      setState(prev => ({ ...prev, activeStaff: null }));
      localStorage.removeItem("linked_staff_code");
      localStorage.removeItem("linked_staff_name");
      localStorage.removeItem("linked_staff_token_id");
    }
  };

  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;

    if (!eth) {
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

  const switchToActiveNetwork = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) return false;
    const chainHex = `0x${ACTIVE_CHAIN_ID.toString(16)}`;

    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainHex }],
      });
      return true;
    } catch (err: any) {
      // 4902: unknown chain in wallet
      if (err?.code === 4902 && CHAIN_PARAMS[ACTIVE_CHAIN_ID]) {
        const params = CHAIN_PARAMS[ACTIVE_CHAIN_ID];
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: chainHex, ...params }],
        });
        return true;
      }

      setState(prev => ({
        ...prev,
        error: "Could not switch network automatically. Please select Base Sepolia (84532) in MetaMask.",
      }));
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    setState({
      status: "disconnected",
      address: null,
      shortAddress: null,
      chainId: null,
      chainName: null,
      isCorrectNetwork: false,
      staffs: [],
      activeStaff: state.activeStaff, // Keep active staff — it persists in profile
      linkedStaff: null,
      error: null,
      isLive: !!STAFF_CONTRACT_ADDRESS,
    });
    await persistWallet(null);
  }, [userId, state.activeStaff]);

  const selectStaff = useCallback((staff: OwnedStaff) => {
    setState(prev => ({ ...prev, linkedStaff: staff }));
    setActiveStaff(staff.code);
  }, [userId]);

  const clearActiveStaff = useCallback(() => {
    setActiveStaff(null);
  }, [userId]);

  const hasMetaMask = typeof window !== "undefined" && !!(window as any).ethereum;

  return {
    ...state,
    connect,
    disconnect,
    switchToActiveNetwork,
    selectStaff,
    clearActiveStaff,
    hasMetaMask,
  };
}
