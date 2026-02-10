import { useState } from "react";
import walletBg from "@/assets/wallet-connect-bg.jpeg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, CheckCircle2, TreeDeciduous, ExternalLink } from "lucide-react";
import { getOwnedStaffs, type OwnedStaff } from "@/utils/staffNftReader";
import {
  STAFF_CONTRACT_ADDRESS,
  SPECIES_CODES,
  SPECIES_MAP,
  getBaseScanUrl,
  getOpenSeaUrl,
  type SpeciesCode,
} from "@/config/staffContract";

// Mock staff NFT data — used when contract address is not configured
const MOCK_STAFF_NFTS: OwnedStaff[] = [
  { tokenId: 1, speciesId: 0, circleId: 0, variantId: 1, staffNumber: 13, isOriginSpiral: true, code: "GOA-C0S13", name: "Goat Willow Staff", species: "Goat Willow", image: "/images/staffs/goa.jpeg" },
  { tokenId: 9, speciesId: 8, circleId: 0, variantId: 1, staffNumber: 13, isOriginSpiral: true, code: "OAK-C0S13", name: "English Oak Staff", species: "English Oak", image: "/images/staffs/oak.jpeg" },
  { tokenId: 15, speciesId: 14, circleId: 0, variantId: 1, staffNumber: 13, isOriginSpiral: true, code: "YEW-C0S13", name: "Ancient Yew Staff", species: "Ancient Yew", image: "/images/staffs/yew.jpeg" },
  { tokenId: 16, speciesId: 15, circleId: 0, variantId: 1, staffNumber: 13, isOriginSpiral: true, code: "ASH-C0S13", name: "Common Ash Staff", species: "Common Ash", image: "/images/staffs/ash.jpeg" },
];

interface WalletConnectProps {
  onWalletLinked?: (address: string, staff: OwnedStaff) => void;
  compact?: boolean;
}

const WalletConnect = ({ onWalletLinked, compact = false }: WalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ownedStaffs, setOwnedStaffs] = useState<OwnedStaff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<OwnedStaff | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLive, setIsLive] = useState(!!STAFF_CONTRACT_ADDRESS);
  const { toast } = useToast();

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const openMetaMaskDeepLink = () => {
    const dappUrl = window.location.href.replace(/^https?:\/\//, "");
    window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
  };

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0] as string;
        setWalletAddress(address);

        setIsVerifying(true);

        if (STAFF_CONTRACT_ADDRESS) {
          // Real on-chain query
          const staffs = await getOwnedStaffs(address);
          setOwnedStaffs(staffs);
          setIsLive(true);
          toast({
            title: "Wallet connected",
            description: staffs.length > 0
              ? `Found ${staffs.length} Non-Fungible Twig${staffs.length > 1 ? "s" : ""} on Base`
              : "No Non-Fungible Twigs found in this wallet",
          });
        } else {
          // Mock fallback
          await new Promise((r) => setTimeout(r, 1500));
          const count = Math.floor(Math.random() * 3) + 1;
          const shuffled = [...MOCK_STAFF_NFTS].sort(() => 0.5 - Math.random());
          setOwnedStaffs(shuffled.slice(0, count));
          setIsLive(false);
          toast({
            title: "Wallet connected (demo mode)",
            description: `Contract address not set — showing ${count} mock twig${count > 1 ? "s" : ""}`,
          });
        }

        setIsVerifying(false);
      } else if (isMobile()) {
        openMetaMaskDeepLink();
      } else {
        toast({
          title: "No wallet found",
          description: "Please install MetaMask or another Ethereum wallet to connect",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Wallet connect error:", err);
      toast({
        title: "Connection failed",
        description: err?.message || "Could not connect to wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
      setIsVerifying(false);
    }
  };

  const handleSelectStaff = (staff: OwnedStaff) => {
    setSelectedStaff(staff);
    localStorage.setItem("linked_staff_code", staff.code);
    localStorage.setItem("linked_staff_name", staff.name);
    localStorage.setItem("linked_staff_token_id", String(staff.tokenId));
    onWalletLinked?.(walletAddress!, staff);
    toast({
      title: "Staff linked!",
      description: `${staff.name} (${staff.code}) is now your identity twig`,
    });
  };

  // Compact mode: just a button for the auth page
  if (compact && !walletAddress) {
    return (
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        Connect Wallet — Non-Fungible Twig
      </Button>
    );
  }

  // No wallet connected yet
  if (!walletAddress) {
    return (
      <Card className="border-mystical bg-card/50 backdrop-blur overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <img src={walletBg} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        </div>
        <CardContent className="p-6 text-center space-y-4 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-secondary/80 flex items-center justify-center backdrop-blur">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-xl text-foreground mb-1">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground">
              Link your Ethereum wallet to verify your Non-Fungible Twig ownership on Base
            </p>
          </div>
          <Button
            variant="sacred"
            onClick={handleConnect}
            disabled={isConnecting}
            className="gap-2"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Wallet connected — verifying NFTs
  if (isVerifying) {
    return (
      <Card className="border-mystical bg-card/50 backdrop-blur">
        <CardContent className="p-6 text-center space-y-4">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
          <div>
            <p className="font-serif text-lg text-foreground">Searching the forest...</p>
            <p className="text-sm text-muted-foreground">
              {STAFF_CONTRACT_ADDRESS
                ? `Querying Base chain for ${shortenAddress(walletAddress)}`
                : `Verifying Non-Fungible Twigs for ${shortenAddress(walletAddress)}`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Staff already selected
  if (selectedStaff) {
    return (
      <Card className="border-mystical bg-card/50 backdrop-blur overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0">
              <img
                src={selectedStaff.image}
                alt={selectedStaff.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-serif text-foreground truncate">{selectedStaff.name}</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{selectedStaff.code}</p>
              <p className="text-xs text-muted-foreground">{shortenAddress(walletAddress)}</p>
            </div>
            {isLive && STAFF_CONTRACT_ADDRESS && (
              <div className="flex flex-col gap-1">
                <a
                  href={getOpenSeaUrl(selectedStaff.tokenId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  OpenSea <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href={getBaseScanUrl(selectedStaff.tokenId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  BaseScan <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show owned NFTs to select
  return (
    <Card className="border-mystical bg-card/50 backdrop-blur">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg text-foreground">Your Non-Fungible Twigs</h3>
            <p className="text-xs text-muted-foreground">
              {shortenAddress(walletAddress)}
              {!isLive && " · demo mode"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-primary text-sm">
            <TreeDeciduous className="w-4 h-4" />
            <span>{ownedStaffs.length} found</span>
          </div>
        </div>

        <div className="grid gap-3">
          {ownedStaffs.map((staff) => (
            <button
              key={staff.tokenId}
              onClick={() => handleSelectStaff(staff)}
              className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary bg-background/50 hover:bg-secondary/50 transition-mystical text-left w-full"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-border flex-shrink-0">
                <img
                  src={staff.image}
                  alt={staff.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-foreground">{staff.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{staff.code}</p>
                <p className="text-xs text-muted-foreground">{staff.species}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-muted-foreground">#{staff.tokenId}</span>
                {isLive && STAFF_CONTRACT_ADDRESS && (
                  <a
                    href={getOpenSeaUrl(staff.tokenId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    View <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </button>
          ))}
        </div>

        {ownedStaffs.length === 0 && (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">No Non-Fungible Twigs found in this wallet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletConnect;
