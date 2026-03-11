import { useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContextualWhisper from "@/components/ContextualWhisper";
import TetolBridge from "@/components/TetolBridge";
import S33dEntrance from "@/components/S33dEntrance";
import WelcomeBanner from "@/components/WelcomeBanner";
import EcosystemOverview from "@/components/EcosystemOverview";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { useVineFade } from "@/hooks/use-vine-fade";
import {
  IdentitySection,
  DiscoveryRow,
  ParticipationSection,
  SupportDiscoveryRow,
  TetolNavSection,
} from "@/components/HomeSections";
import { WisdomOfTheGrove } from "@/components/WisdomOfTheGrove";
import { useTreeScroll } from "@/hooks/use-tree-scroll";
import TreeScrollIndicator from "@/components/TreeScrollIndicator";
import CrownSection from "@/components/tree-sections/CrownSection";
import WhisperEchoesFeed from "@/components/WhisperEchoesFeed";
import CanopySection from "@/components/tree-sections/CanopySection";
import TrunkSection from "@/components/tree-sections/TrunkSection";
import GroundSection from "@/components/tree-sections/GroundSection";
import NetworkPulseOverlay from "@/components/tree-sections/NetworkPulseOverlay";
import SectionAtmosphere from "@/components/tree-sections/SectionAtmosphere";
import { useTimeOfDay } from "@/hooks/use-time-of-day";
import { useSeasonalTheme } from "@/hooks/use-seasonal-theme";
import { useNetworkPulse } from "@/hooks/use-network-pulse";
import { useTreeVitality } from "@/hooks/use-tree-vitality";

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
      <NetworkPulseOverlay latestEvent={latestEvent} vitality={vitality} />
      <Header />
      <WelcomeBanner />

      {/* Tree Scroll Indicator — desktop only */}
      <TreeScrollIndicator
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <main className="flex-1">
        {/* ── Discovery Row — Countries & Hives (moved up for fast access) ── */}
        <DiscoveryRow />

        {/* ── CROWN — yOur Golden Dream ── */}
        <CrownSection />

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
          <div className="section-divider max-w-xl mx-auto" />
          <div className="max-w-2xl mx-auto px-4 py-6">
            <WhisperEchoesFeed limit={6} />
          </div>
          <WisdomOfTheGrove />
          <TetolNavSection />
        </div>
      </main>
      <TetolBridge />
      <ContextualWhisper
        id="home-explore"
        message="Every ancient tree has a story. Tap the Atlas to discover one near you."
        cta={{ label: "Open Atlas", to: "/map" }}
        delay={8000}
        position="bottom-center"
      />
      <Footer />
    </div>
  );
};

export default Index;
