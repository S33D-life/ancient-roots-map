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
  DiscoveryRow,
  ParticipationSection,
  SupportDiscoveryRow,
  TetolNavSection,
} from "@/components/HomeSections";
import { WisdomOfTheGrove } from "@/components/WisdomOfTheGrove";

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
        <Hero />
        <IdentitySection />
        <DiscoveryRow />
        <div className="section-divider max-w-xl mx-auto" />
        <ParticipationSection />
        <SupportDiscoveryRow />
        <div className="section-divider max-w-xl mx-auto" />
        <WisdomOfTheGrove />
        <TetolNavSection />
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
