import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import OnboardingTour from "@/components/OnboardingTour";
import TetolBridge from "@/components/TetolBridge";
import S33dEntrance from "@/components/S33dEntrance";

const Index = () => {
  const [showEntrance, setShowEntrance] = useState(true);
  const handleEntranceComplete = useCallback(() => setShowEntrance(false), []);

  if (showEntrance) {
    return <S33dEntrance onComplete={handleEntranceComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
      </main>
      <TetolBridge />
      <OnboardingTour />
      <Footer />
    </div>
  );
};

export default Index;
