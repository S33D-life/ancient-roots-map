import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import goldenDreamSplash from "@/assets/golden-dream-splash.jpeg";

const GoldenDreamPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setShowSplash(false), 1000);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-opacity duration-1000 ${fadeOut ? "opacity-0" : "opacity-100"}`}
        style={{ backgroundColor: "hsl(120 50% 10%)" }}
        onClick={() => { setFadeOut(true); setTimeout(() => setShowSplash(false), 500); }}
      >
        <img
          src={goldenDreamSplash}
          alt="yOur Golden Dream"
          className="max-w-sm w-3/4 rounded-full animate-fade-in"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <iframe
            src="https://clammy-viscount-ddb.notion.site/ebd//21615b58480d802187b2cff864277413"
            width="100%"
            height="800"
            frameBorder="0"
            allowFullScreen
            className="rounded-xl border border-border/40"
            title="yOur Golden Dream"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GoldenDreamPage;
