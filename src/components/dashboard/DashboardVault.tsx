import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Archive, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import { useWallet } from "@/hooks/use-wallet";
import VaultHeartBalance from "./vault/VaultHeartBalance";
import VaultSproutingSeeds from "./vault/VaultSproutingSeeds";
import VaultHeartLedger from "./vault/VaultHeartLedger";
import VaultTreeReservoirs from "./vault/VaultTreeReservoirs";
import VaultLotteryTracker from "./vault/VaultLotteryTracker";
import VaultParticles from "./vault/VaultParticles";
import VaultWalletCard from "./vault/VaultWalletCard";

interface Props {
  userId: string;
}

const DashboardVault = ({ userId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [treeCount, setTreeCount] = useState(0);
  const [offeringCount, setOfferingCount] = useState(0);
  const [plantCount, setPlantCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [heartFilter, setHeartFilter] = useState<string | null>(null);
  const wallet = useWallet(userId);

  const handleSegmentClick = useCallback((label: string) => {
    setHeartFilter(prev => prev === label ? null : label);
  }, []);

  const {
    heartBreakdown,
    allSeeds,
    seedsRemaining,
    totalSeedHeartsEarned,
  } = useSeedEconomy(userId);

  useEffect(() => {
    const fetchCounts = async () => {
      const [treesRes, offeringsRes, plantsRes, wishlistRes] = await Promise.all([
        supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId),
        supabase.from("offerings").select("*", { count: "exact", head: true }).eq("created_by", userId),
        supabase.from("greenhouse_plants").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("tree_wishlist").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      setTreeCount(treesRes.count || 0);
      setOfferingCount(offeringsRes.count || 0);
      setPlantCount(plantsRes.count || 0);
      setWishlistCount(wishlistRes.count || 0);
      setLoading(false);
    };
    fetchCounts();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate total hearts matching the Header's formula
  const baseHearts = treeCount * 10;
  const milestones: [number, number, number][] = [
    [treeCount, 1, 10], [treeCount, 5, 25], [treeCount, 10, 50],
    [treeCount, 25, 100], [treeCount, 50, 200], [treeCount, 100, 500], [treeCount, 250, 1000],
    [offeringCount, 1, 5], [offeringCount, 10, 30], [offeringCount, 25, 75],
    [offeringCount, 50, 200], [offeringCount, 100, 500],
    [plantCount, 1, 5], [plantCount, 5, 20], [plantCount, 15, 60],
    [wishlistCount, 3, 15], [wishlistCount, 10, 50],
  ];
  const milestoneHearts = milestones.reduce((sum, [count, threshold, hearts]) =>
    count >= threshold ? sum + hearts : sum, 0);
  const totalHearts = baseHearts + milestoneHearts + totalSeedHeartsEarned;

  return (
    <motion.div
      className="relative space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <VaultParticles />
      {/* Section header with wallet status */}
      <div className="flex items-center gap-2.5">
        <Archive className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <h2 className="text-lg font-serif text-foreground tracking-wide">Heartwood Vault</h2>
          <p className="text-[11px] text-muted-foreground font-serif">
            Your living treasury of Hearts, Seeds, and Tree Bonds
          </p>
        </div>
        {wallet.status === "connected" && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/30 border border-border/40">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_hsl(var(--primary))]" />
            <span className="text-[10px] font-mono text-muted-foreground">{wallet.shortAddress}</span>
          </div>
        )}
      </div>

      {/* Wallet Connection Card */}
      <VaultWalletCard wallet={wallet} />

      {/* Primary: Heart Balance Ring */}
      <VaultHeartBalance
        total={totalHearts}
        wanderer={heartBreakdown.wanderer}
        sower={heartBreakdown.sower}
        windfall={heartBreakdown.windfall}
        baseHearts={baseHearts}
        milestoneHearts={milestoneHearts}
        seedsRemaining={seedsRemaining}
        activeFilter={heartFilter}
        onSegmentClick={handleSegmentClick}
      />

      {/* Active Seeds / Bloom Timers */}
      <VaultSproutingSeeds seeds={allSeeds} userId={userId} />

      {/* Two-column layout for mid sections on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Heart Ledger */}
        <VaultHeartLedger
          userId={userId}
          externalFilter={heartFilter}
          onFilterChange={(f) => setHeartFilter(f || null)}
        />

        {/* Lottery Tracker */}
        <VaultLotteryTracker userId={userId} />
      </div>

      {/* Tree Reservoirs */}
      <VaultTreeReservoirs />
    </motion.div>
  );
};

export default DashboardVault;
