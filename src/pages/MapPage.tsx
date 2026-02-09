import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Map from "@/components/Map";
import atlasSplash from "@/assets/atlas-splash.jpeg";
import atlasSplash2 from "@/assets/atlas-splash-2.jpeg";
import scrollBg from "@/assets/ancient-scroll-bg.jpeg";

const MapPage = () => {
  const [splashPhase, setSplashPhase] = useState<"s33d" | "ancient" | "fading" | "done">("s33d");

  useEffect(() => {
    const t1 = setTimeout(() => setSplashPhase("ancient"), 2000);
    const t2 = setTimeout(() => setSplashPhase("fading"), 4500);
    const t3 = setTimeout(() => setSplashPhase("done"), 5300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (splashPhase !== "done") {
    return (
      <div className="fixed inset-0 z-50" style={{ background: 'hsl(120 40% 12%)' }}>
        {/* Scroll background */}
        <img
          src={scrollBg}
          alt=""
          className="absolute inset-0 w-full h-full object-contain opacity-60"
          style={{ mixBlendMode: 'luminosity' }}
        />

        {/* S33D Screen */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            splashPhase === "s33d" ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={atlasSplash}
            alt="S33D"
            className="max-w-xs w-1/2 rounded-lg animate-fade-in"
            style={{ mixBlendMode: 'multiply', filter: 'sepia(0.3) contrast(1.1)' }}
          />
        </div>

        {/* Ancient Friends Screen */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            splashPhase === "ancient" ? "opacity-100" : splashPhase === "fading" ? "opacity-0" : "opacity-0"
          }`}
        >
          <img
            src={atlasSplash2}
            alt="Ancient Friends"
            className="max-w-sm w-2/3 rounded-lg"
            style={{ mixBlendMode: 'multiply', filter: 'sepia(0.2) contrast(1.05)' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at center, hsl(100 20% 32%), hsl(95 25% 24%) 60%, hsl(90 22% 16%) 100%)' }}>
      <Header />
      <Map />
    </div>
  );
};

export default MapPage;
