import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import goldenDreamSplash from "@/assets/golden-dream-splash.jpeg";
import goldenDreamBanner from "@/assets/golden-dream-banner.jpeg";
import goldenDreamNight from "@/assets/golden-dream-night.jpeg";

const GoldenDreamPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [coverDismissed, setCoverDismissed] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur"
          onClick={() => setIsFullscreen(false)}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
        <iframe
          src="https://clammy-viscount-ddb.notion.site/ebd//21615b58480d802187b2cff864277413"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          title="yOur Golden Dream"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="h-4 w-4" />
              Full Screen
            </Button>
          </div>
          {/* Banner */}
          <div className="rounded-xl overflow-hidden border border-border/40 mb-4 flex justify-center">
            <img
              src={goldenDreamBanner}
              alt="yOur Golden Dream"
              className="w-[65%] h-64 md:h-80 object-cover"
            />
          </div>

          <div className="relative rounded-xl border border-border/40 overflow-hidden">
            <iframe
              src="https://clammy-viscount-ddb.notion.site/ebd//21615b58480d802187b2cff864277413"
              width="100%"
              height="800"
              frameBorder="0"
              allowFullScreen
              title="yOur Golden Dream"
            />
            {/* Night mode cover */}
            {isDark && !coverDismissed && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-700"
                onClick={() => setCoverDismissed(true)}
              >
                <img
                  src={goldenDreamNight}
                  alt="yOur Golden Dream"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <p className="text-xs font-serif tracking-[0.3em] uppercase animate-pulse" style={{ color: 'hsl(40 60% 65%)' }}>
                    Tap to enter
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GoldenDreamPage;
