import { useCallback, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { TreeDeciduous } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import S33dEntrance from "@/components/S33dEntrance";
import WelcomeBanner from "@/components/WelcomeBanner";
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

const Index = () => {
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
      <WelcomeBanner />

      {/* Tree Scroll Indicator — desktop only */}
      <TreeScrollIndicator
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <main className="flex-1" style={{ paddingTop: 'var(--content-top)' }}>
        {/* ── Discovery Row — Countries & Hives (moved up for fast access) ── */}
        <DiscoveryRow />

        {/* ── CROWN — yOur Golden Dream ── */}
        <CrownSection />

        {/* ── Below-fold sections lazy-loaded for faster FCP ── */}
        <Suspense fallback={null}>
          {/* ── CANOPY — Council of Life ── */}
          <CanopySection />

          {/* ── TRUNK — HeARTwood Library ── */}
          <TrunkSection />

          {/* ── GROUND — Ancient Friend Landing (scroll anchor) ── */}
          <GroundSection />

          {/* ── ROOTS — Atlas Content (Ancient Friends Network) ── */}
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
              <h3 className="text-sm font-serif text-muted-foreground uppercase tracking-wider mb-3">Recent Ecosystem Activity</h3>
              <ActivityFeed limit={6} compact />
            </div>
            <div className="section-divider max-w-xl mx-auto" />
            <div className="max-w-2xl mx-auto px-4 py-6">
              <WhisperEchoesFeed limit={6} />
            </div>
            <WisdomOfTheGrove />
            <TetolNavSection />
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
      {/* Gateway return CTA */}
      <div className="flex justify-center py-10">
        <Link
          to="/"
          className="group flex items-center gap-3 px-8 py-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
        >
          <TreeDeciduous className="w-5 h-5 text-primary" />
          <span className="font-serif text-base text-foreground group-hover:text-primary transition-colors">
            Enter the Tree
          </span>
        </Link>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
