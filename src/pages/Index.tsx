import { useCallback, lazy, Suspense } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import S33dEntrance from "@/components/S33dEntrance";
import BetaGardenBanner from "@/components/BetaGardenBanner";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { useVineFade } from "@/hooks/use-vine-fade";
import { DiscoveryRow } from "@/components/HomeSections";
import { useTreeScroll } from "@/hooks/use-tree-scroll";
import TreeScrollIndicator from "@/components/TreeScrollIndicator";
import CrownSection from "@/components/tree-sections/CrownSection";
import { useTimeOfDay } from "@/hooks/use-time-of-day";
import { useSeasonalTheme } from "@/hooks/use-seasonal-theme";
import { useNetworkPulse } from "@/hooks/use-network-pulse";
import { useTreeVitality } from "@/hooks/use-tree-vitality";
import { PageSkeleton } from "@/components/ui/page-skeleton";

// Lazy-load below-the-fold sections to reduce initial bundle
const NetworkPulseOverlay = lazy(() => import("@/components/tree-sections/NetworkPulseOverlay"));
const CanopySection = lazy(() => import("@/components/tree-sections/CanopySection"));
const TrunkSection = lazy(() => import("@/components/tree-sections/TrunkSection"));
const GroundSection = lazy(() => import("@/components/tree-sections/GroundSection"));
const SectionAtmosphere = lazy(() => import("@/components/tree-sections/SectionAtmosphere"));
const EcosystemOverview = lazy(() => import("@/components/EcosystemOverview"));
const EcosystemPulse = lazy(() => import("@/components/EcosystemPulse"));
const ActivityFeed = lazy(() => import("@/components/ActivityFeed"));
const WhisperEchoesFeed = lazy(() => import("@/components/WhisperEchoesFeed"));
const WisdomOfTheGrove = lazy(() => import("@/components/WisdomOfTheGrove").then(m => ({ default: m.WisdomOfTheGrove })));
const TetolBridge = lazy(() => import("@/components/TetolBridge"));
const ContextualWhisper = lazy(() => import("@/components/ContextualWhisper"));
const IdentitySection = lazy(() => import("@/components/HomeSections").then(m => ({ default: m.IdentitySection })));
const ParticipationSection = lazy(() => import("@/components/HomeSections").then(m => ({ default: m.ParticipationSection })));
const SupportDiscoveryRow = lazy(() => import("@/components/HomeSections").then(m => ({ default: m.SupportDiscoveryRow })));
const TetolNavSection = lazy(() => import("@/components/HomeSections").then(m => ({ default: m.TetolNavSection })));
const ForestInteractionLayers = lazy(() => import("@/components/ForestInteractionLayers"));

/** Minimal loading shimmer for lazy sections */
const SectionShimmer = () => (
  <div className="py-16 flex justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary/60 animate-spin" />
  </div>
);

const Index = () => {
  useDocumentTitle("Ancient Friends — A Living Atlas of the World's Oldest Trees");
  const { showEntrance, dismissEntrance } = useEntranceOnce("index");
  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);
  const { activeSection, scrollToSection } = useTreeScroll();
  useVineFade();
  useTimeOfDay();
  useSeasonalTheme();
  const { latestEvent } = useNetworkPulse();
  const { data: vitality } = useTreeVitality();

  if (showEntrance) {
    return <S33dEntrance onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Network Pulse — the tree's nervous system */}
      <Suspense fallback={null}>
        <NetworkPulseOverlay latestEvent={latestEvent} vitality={vitality} />
      </Suspense>
      <Header />

      {/* Tree Scroll Indicator — desktop only */}
      <TreeScrollIndicator
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <main className="flex-1" style={{ paddingTop: 'var(--content-top)' }}>
        {/* Beta garden tone-setter */}
        <BetaGardenBanner />

        {/* ── Below-fold sections lazy-loaded for faster FCP ── */}
        <Suspense fallback={<SectionShimmer />}>
          {/* ── CROWN — yOur Golden Dream ── */}
          <CrownSection />

          {/* ── CANOPY — Council of Life ── */}
          <CanopySection />

          {/* ── TRUNK — HeARTwood Library ── */}
          <TrunkSection />
        </Suspense>

        {/* ── SEED — S33D Gateway Hero (the central seed layer) ── */}
        <Suspense fallback={<SectionShimmer />}>
          <GroundSection />
        </Suspense>

        {/* ── Discovery shortcuts — Countries & Hives ── */}
        <DiscoveryRow />

        {/* ── Interaction Layers — Offerings, Whispers, Tree Radio ── */}
        <Suspense fallback={<SectionShimmer />}>
          <ForestInteractionLayers />
        </Suspense>

        {/* ── ROOTS — Atlas Content (Ancient Friends Network) ── */}
        <Suspense fallback={<SectionShimmer />}>
          <div id="atlas-content" className="relative overflow-hidden">
            <SectionAtmosphere theme="roots" />
            <IdentitySection />
            <div className="section-divider max-w-xl mx-auto" />
            <ParticipationSection />
            <SupportDiscoveryRow />
            <div className="section-divider max-w-xl mx-auto" />
            <EcosystemOverview />
            <EcosystemPulse />
            <div className="section-divider max-w-xl mx-auto" />
            {/* Global Activity Feed */}
            <div className="max-w-2xl mx-auto px-4 py-6">
              <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4 space-y-3">
                <h3 className="text-sm font-serif text-foreground/80 uppercase tracking-wider">Recent Ecosystem Activity</h3>
                <ActivityFeed limit={6} compact />
              </div>
            </div>
            <WisdomOfTheGrove />
          </div>
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <TetolBridge />
        <ContextualWhisper
          id="home-explore"
          message="Every ancient tree has a story. Tap the Atlas to discover one near you."
          cta={{ label: "Open Atlas", to: "/map" }}
          delay={8000}
          position="bottom-center"
        />
      </Suspense>

      <Footer />
      {/* Bottom safe area spacer for standalone PWA mode */}
      <div className="shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }} />
    </div>
  );
};

export default Index;
