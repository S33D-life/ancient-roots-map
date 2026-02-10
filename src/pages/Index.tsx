import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import OnboardingTour from "@/components/OnboardingTour";
import TetolBridge from "@/components/TetolBridge";

const Index = () => {
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
