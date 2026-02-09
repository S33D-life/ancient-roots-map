import { useState } from "react";
import walletBg from "@/assets/wallet-connect-bg.jpeg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, CheckCircle2, TreeDeciduous } from "lucide-react";

// Mock staff NFT data — will be replaced with real contract calls
const MOCK_STAFF_NFTS = [
  { tokenId: 1, name: "Oak Staff", code: "OAK-C0S13", species: "English Oak", image: "/images/staffs/oak.jpeg" },
  { tokenId: 2, name: "Yew Staff", code: "YEW-A1S07", species: "Ancient Yew", image: "/images/staffs/yew.jpeg" },
  { tokenId: 3, name: "Ash Staff", code: "ASH-B2S21", species: "Common Ash", image: "/images/staffs/ash.jpeg" },
  { tokenId: 4, name: "Willow Staff", code: "WIL-D3S09", species: "Weeping Willow", image: "/images/staffs/wil.jpeg" },
];

interface StaffNFT {
  tokenId: number;
  name: string;
  code: string;
  species: string;
  image: string;
}

interface WalletConnectProps {
  onWalletLinked?: (address: string, staff: StaffNFT) => void;
  compact?: boolean;
}

const WalletConnect = ({ onWalletLinked, compact = false }: WalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ownedStaffs, setOwnedStaffs] = useState<StaffNFT[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffNFT | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      // Check for MetaMask / injected provider
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0] as string;
        setWalletAddress(address);

        // Mock: simulate NFT ownership check with a short delay
        setIsVerifying(true);
        await new Promise((r) => setTimeout(r, 1500));

        // Mock: return 1-3 random staffs as "owned"
        const count = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...MOCK_STAFF_NFTS].sort(() => 0.5 - Math.random());
        setOwnedStaffs(shuffled.slice(0, count));
        setIsVerifying(false);

        toast({
          title: "Wallet connected",
          description: `Found ${count} Non-Fungible Twig${count > 1 ? "s" : ""} in your wallet`,
        });
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
    }
  };

  const handleSelectStaff = (staff: StaffNFT) => {
    setSelectedStaff(staff);
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
              Link your Ethereum wallet to verify your Non-Fungible Twig ownership
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
              Verifying Non-Fungible Twigs for {shortenAddress(walletAddress)}
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
            <p className="text-xs text-muted-foreground">{shortenAddress(walletAddress)}</p>
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
              <Wallet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
