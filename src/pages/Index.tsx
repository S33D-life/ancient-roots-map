import { useCallback } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import ContextualWhisper from "@/components/ContextualWhisper";
import TetolBridge from "@/components/TetolBridge";
import S33dEntrance from "@/components/S33dEntrance";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import {
  IdentitySection,
  ParticipationSection,
  MapPreviewSection,
  LivingScrollSection,
  TetolNavSection,
} from "@/components/HomeSections";

const Index = () => {
  const { showEntrance, dismissEntrance } = useEntranceOnce("index");
  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);

  if (showEntrance) {
    return <S33dEntrance onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* 1. Hero — identity, stats, CTA */}
        <Hero />

        {/* 2. Poetic tagline + value points */}
        <IdentitySection />

        {/* 3. Participation pathways */}
        <ParticipationSection />

        {/* 4. Interactive map preview */}
        <MapPreviewSection />

        {/* 5. Living scroll — wisdom showcase */}
        <LivingScrollSection />

        {/* 6. TETOL navigation anchors */}
        <TetolNavSection />
      </main>
      <TetolBridge />
      <ContextualWhisper
        id="home-explore"
        message="Every ancient tree has a story. Tap the Atlas to discover one near you."
        cta={{ label: "Open Atlas", to: "/map" }}
        delay={3000}
        position="bottom-center"
      />
      <Footer />
    </div>
  );
};

export default Index;
