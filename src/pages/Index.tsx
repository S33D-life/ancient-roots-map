import { useCallback } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
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

const Index = () => {
  const { showEntrance, dismissEntrance } = useEntranceOnce("index");
  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);
  const { activeSection, scrollToSection } = useTreeScroll();
  useVineFade();

  if (showEntrance) {
    return <S33dEntrance onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
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

        {/* ── THRESHOLD — Atlas Hero (scroll starts here) ── */}
        <div id="atlas-hero">
          <Hero />
        </div>

        {/* ── ROOTS — Atlas Content ── */}
        <div id="atlas-content">
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
