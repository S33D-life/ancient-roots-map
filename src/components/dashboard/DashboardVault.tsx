import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserOfferingCount } from "@/repositories/offerings";
import { Archive, Loader2, Wand2, RotateCcw, TreeDeciduous, Music, Heart, Users, Sprout, ScrollText, Activity, Wallet, Gem, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ActivityFeed = lazy(() => import("@/components/ActivityFeed"));
const EcosystemMomentum = lazy(() => import("@/components/EcosystemMomentum"));
const PersonalJourneySummary = lazy(() => import("@/components/PersonalJourneySummary"));
const HeartEconomyDashboard = lazy(() => import("@/components/HeartEconomyDashboard"));
const LineageTree = lazy(() => import("@/components/LineageTree"));
const OfflineEncounterPanel = lazy(() => import("@/components/OfflineEncounterPanel"));
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import { useSpeciesTokens } from "@/hooks/use-species-tokens";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { AwakeningAnimation } from "@/components/StaffCeremony";
import { SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";
import VaultHeartBalance from "./vault/VaultHeartBalance";
import VaultSproutingSeeds from "./vault/VaultSproutingSeeds";
import VaultHeartLedger from "./vault/VaultHeartLedger";
import VaultTreeReservoirs from "./vault/VaultTreeReservoirs";
import VaultLotteryTracker from "./vault/VaultLotteryTracker";
import VaultParticles from "./vault/VaultParticles";
import VaultWalletCard from "./vault/VaultWalletCard";
import VaultTokenWallet from "./vault/VaultTokenWallet";
import VaultValueTree from "./vault/VaultValueTree";
import VaultPatronBadge from "./vault/VaultPatronBadge";
import VaultSection from "./vault/VaultSection";
import CosmicClock from "@/components/CosmicClock";

const STORAGE_KEY = "s33d_vault_open_section";

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
  const [showReawaken, setShowReawaken] = useState(false);
  const [councilCount, setCouncilCount] = useState(0);
  const wallet = useWallet(userId);
  const speciesTokens = useSpeciesTokens(userId);

  // Persisted open section — only one open at a time
  const [openSection, setOpenSection] = useState<string | null>(() => {
    try { return sessionStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  const handleToggle = useCallback((id: string) => {
    setOpenSection(prev => {
      const next = prev === id ? null : id;
      try { if (next) sessionStorage.setItem(STORAGE_KEY, next); else sessionStorage.removeItem(STORAGE_KEY); } catch {}
      return next;
    });
  }, []);

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
      const [treesRes, offeringsCount, plantsRes, wishlistRes] = await Promise.all([
        supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId),
        getUserOfferingCount(userId),
        supabase.from("greenhouse_plants").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("tree_wishlist").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      setTreeCount(treesRes.count || 0);
      setOfferingCount(offeringsCount);
      setPlantCount(plantsRes.count || 0);
      setWishlistCount(wishlistRes.count || 0);
      setLoading(false);
    };
    fetchCounts();
  }, [userId]);

  useEffect(() => {
    supabase
      .from("council_participation_rewards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .then(({ count }) => setCouncilCount(count || 0));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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
      className="relative space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <VaultParticles />

      {/* Context */}
      <p className="text-[11px] font-serif text-muted-foreground/70 text-center italic leading-relaxed">
        Every tree mapped, every offering given, every seed planted — it all gathers here.
      </p>

      {/* Summary stats — always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { icon: <TreeDeciduous className="w-3.5 h-3.5" />, value: treeCount, label: "Trees Mapped", color: "hsl(120 40% 45%)" },
          { icon: <Music className="w-3.5 h-3.5" />, value: offeringCount, label: "Offerings", color: "hsl(var(--primary))" },
          { icon: <Heart className="w-3.5 h-3.5" />, value: totalHearts, label: "Hearts Earned", color: "hsl(0 65% 55%)" },
          { icon: <Users className="w-3.5 h-3.5" />, value: councilCount, label: "Councils", color: "hsl(42 80% 50%)" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm p-3 text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-1" style={{ color: m.color }}>
              {m.icon}
            </div>
            <p className="text-lg font-serif text-foreground">{m.value}</p>
            <p className="text-[9px] text-muted-foreground font-serif">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <Archive className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <h2 className="text-lg font-serif text-foreground tracking-wide">IAM Heartwood Vault</h2>
          <p className="text-[11px] text-muted-foreground font-serif">
            {wallet.activeStaff
              ? `Anchored to ${wallet.activeStaff.id} · ${wallet.activeStaff.species}`
              : "The inner chamber where encounters become lasting value"
            }
          </p>
        </div>
        {wallet.activeStaff && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Wand2 className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-foreground">{wallet.activeStaff.id}</span>
          </div>
        )}
        {!wallet.activeStaff && wallet.status === "connected" && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/30 border border-border/40">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_hsl(var(--primary))]" />
            <span className="text-[10px] font-mono text-muted-foreground">{wallet.shortAddress}</span>
          </div>
        )}
      </div>

      {/* ═══ ACCORDION SECTIONS ═══ */}
      <div className="space-y-2">

        {/* Identity — Wallet + Staff + Patron Badge */}
        <VaultSection
          id="identity"
          icon={<Wallet className="w-4 h-4" />}
          title="Identity & Staff"
          subtitle="Wallet, staff patronage, re-awakening"
          isOpen={openSection === "identity"}
          onToggle={handleToggle}
        >
          <VaultWalletCard wallet={wallet} />
          {wallet.activeStaff && <VaultPatronBadge staff={wallet.activeStaff} userId={userId} />}
          {wallet.activeStaff && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 font-serif text-xs border-primary/20 hover:border-primary/40"
              onClick={() => setShowReawaken(true)}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-awaken Staff
            </Button>
          )}
        </VaultSection>

        {/* Flow — Hearts + Seeds */}
        <VaultSection
          id="flow"
          icon={<Heart className="w-4 h-4" />}
          title="Flow"
          subtitle="Hearts, seeds, and the living economy"
          badge={totalHearts}
          isOpen={openSection === "flow"}
          onToggle={handleToggle}
          accent="0 65% 55%"
          allowFullscreen
        >
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
            userId={userId}
          />
          <VaultSproutingSeeds seeds={allSeeds} userId={userId} />
          <VaultTokenWallet
            totalHearts={totalHearts}
            speciesBalances={speciesTokens.speciesBalances}
            totalSpeciesHearts={speciesTokens.totalSpeciesHearts}
            globalInfluence={speciesTokens.influenceGlobal}
            influenceByHive={speciesTokens.influenceByHive}
            history={speciesTokens.history}
          />
          <VaultValueTree userId={userId} totalHearts={totalHearts} />
        </VaultSection>

        {/* Trees — Reservoirs + Lottery */}
        <VaultSection
          id="trees"
          icon={<TreeDeciduous className="w-4 h-4" />}
          title="Trees"
          subtitle="Reservoirs and lottery"
          badge={treeCount}
          isOpen={openSection === "trees"}
          onToggle={handleToggle}
          accent="120 40% 45%"
        >
          <VaultTreeReservoirs />
          <VaultLotteryTracker userId={userId} />
        </VaultSection>

        {/* Journey — Scrolls + Activity */}
        <VaultSection
          id="journey"
          icon={<ScrollText className="w-4 h-4" />}
          title="Journey"
          subtitle="Ledger, activity, and personal story"
          isOpen={openSection === "journey"}
          onToggle={handleToggle}
          allowFullscreen
        >
          <VaultHeartLedger
            userId={userId}
            externalFilter={heartFilter}
            onFilterChange={(f) => setHeartFilter(f || null)}
            compact
          />
          <Suspense fallback={null}>
            <PersonalJourneySummary userId={userId} />
          </Suspense>
          <div className="space-y-2">
            <h3 className="text-xs font-serif text-muted-foreground uppercase tracking-wider">Recent Activity</h3>
            <Suspense fallback={<div className="h-20 bg-card/20 animate-pulse rounded-xl" />}>
              <ActivityFeed userId={userId} limit={6} compact />
            </Suspense>
          </div>
        </VaultSection>

        {/* Rhythms — Cosmic Clock + Ecosystem */}
        <VaultSection
          id="rhythms"
          icon={<Clock className="w-4 h-4" />}
          title="Rhythms"
          subtitle="Cosmic clock and forest momentum"
          isOpen={openSection === "rhythms"}
          onToggle={handleToggle}
        >
          <CosmicClock variant="full" />
          <Suspense fallback={null}>
            <EcosystemMomentum showDiscovery compact={false} />
          </Suspense>
        </VaultSection>

        {/* Heart Flow — Economy Dashboard */}
        <VaultSection
          id="heart-flow"
          icon={<Activity className="w-4 h-4" />}
          title="Heart Flow"
          subtitle="Where your hearts are growing"
          isOpen={openSection === "heart-flow"}
          onToggle={handleToggle}
          accent="0 65% 55%"
        >
          <Suspense fallback={<div className="h-20 bg-card/20 animate-pulse rounded-xl" />}>
            <HeartEconomyDashboard userId={userId} />
          </Suspense>
        </VaultSection>

        {/* Lineage — Invitation tree */}
        <VaultSection
          id="lineage"
          icon={<Users className="w-4 h-4" />}
          title="Lineage"
          subtitle="Your path into the forest"
          isOpen={openSection === "lineage"}
          onToggle={handleToggle}
        >
          <Suspense fallback={<div className="h-20 bg-card/20 animate-pulse rounded-xl" />}>
            <LineageTree userId={userId} />
          </Suspense>
        </VaultSection>
      </div>

      {/* Offline Encounters */}
      <Suspense fallback={null}>
        <OfflineEncounterPanel />

      {/* Re-awaken overlay */}
      <AnimatePresence>
        {showReawaken && wallet.activeStaff && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: "hsla(0, 0%, 0%, 0.85)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AwakeningAnimation
              staffImage={
                wallet.activeStaff.species_code && SPECIES_MAP[wallet.activeStaff.species_code as SpeciesCode]
                  ? SPECIES_MAP[wallet.activeStaff.species_code as SpeciesCode].image
                  : `/images/staffs/${wallet.activeStaff.species_code?.toLowerCase() || "oak"}.jpeg`
              }
              onComplete={() => setShowReawaken(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue the journey */}
      <div className="rounded-xl border border-border/20 bg-card/20 p-4 space-y-3">
        <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-[0.15em]">Continue the journey</p>
        <div className="flex flex-wrap gap-2">
          {[
            { emoji: "🗺️", label: "Visit a tree", to: "/map" },
            { emoji: "🌳", label: "Value Tree", to: "/value-tree" },
            { emoji: "🐝", label: "Species Hives", to: "/hives" },
          ].map(link => (
            <a
              key={link.to}
              href={link.to}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/25 bg-card/30 text-[10px] font-serif text-muted-foreground hover:text-foreground hover:border-primary/25 transition-all"
            >
              <span>{link.emoji}</span> {link.label}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardVault;
