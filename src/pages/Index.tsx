import { useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContextualWhisper from "@/components/ContextualWhisper";
import TetolBridge from "@/components/TetolBridge";
import S33dEntrance from "@/components/S33dEntrance";
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
import CanopySection from "@/components/tree-sections/CanopySection";
import TrunkSection from "@/components/tree-sections/TrunkSection";
import GroundSection from "@/components/tree-sections/GroundSection";
import NetworkPulseOverlay from "@/components/tree-sections/NetworkPulseOverlay";
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

      {/* Tree Scroll Indicator — desktop only */}
      <TreeScrollIndicator
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <main className="flex-1">
        {/* ── CROWN — yOur Golden Dream ── */}
        <CrownSection />

        {/* ── CANOPY — Council of Life ── */}
        <CanopySection />

        {/* ── TRUNK — HeARTwood Library ── */}
        <TrunkSection />

        {/* ── THRESHOLD — Gateway / Navigation Hub ── */}
        <div id="atlas-hero" className="relative overflow-hidden">
          <SectionAtmosphere theme="threshold" />
          <div className="min-h-[40vh] flex flex-col items-center justify-center px-6 py-16 relative z-10">
            <div className="vine-divider mb-8" />
            <p className="text-[9px] uppercase tracking-[0.35em] font-serif text-muted-foreground/40 mb-3">
              The Threshold
            </p>
            <p className="text-muted-foreground/50 font-serif text-xs text-center max-w-xs leading-relaxed">
              The door between earth and sky. Step down into the roots, or climb into the canopy.
            </p>
            <div className="vine-divider mt-8" />
          </div>
        </div>

        {/* ── GROUND — Ancient Friend Landing (scroll anchor) ── */}
        <GroundSection />

        {/* ── ROOTS — Atlas Content (Ancient Friends Network) ── */}
        <div id="atlas-content" className="relative overflow-hidden">
          <SectionAtmosphere theme="roots" />
          <IdentitySection />
          <DiscoveryRow />
          <div className="section-divider max-w-xl mx-auto" />
          <ParticipationSection />
          <SupportDiscoveryRow />
          <div className="section-divider max-w-xl mx-auto" />
          <WisdomOfTheGrove />
          <TetolNavSection />
        </div>
      </main>
      <TetolBridge />
      <ContextualWhisper
        id="home-explore"
        message="Every ancient tree has a story. Tap the Atlas to discover one near you."
        cta={{ label: "Open Atlas", to: "/map" }}
        delay={4000}
        position="bottom-center"
      />
      <Footer />
    </div>
  );
};

export default Index;
