import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Map from "@/components/Map";
import atlasSplash from "@/assets/atlas-splash.jpeg";
import atlasSplash2 from "@/assets/atlas-splash-2.jpeg";

const MapPage = () => {
  const [splashPhase, setSplashPhase] = useState<"s33d" | "ancient" | "fading" | "done">("s33d");

  useEffect(() => {
    // Phase 1: S33D logo for 2s
    const t1 = setTimeout(() => setSplashPhase("ancient"), 2000);
    // Phase 2: Ancient Friends for 2.5s
    const t2 = setTimeout(() => setSplashPhase("fading"), 4500);
    // Phase 3: Fade out
    const t3 = setTimeout(() => setSplashPhase("done"), 5300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (splashPhase !== "done") {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* S33D Screen */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            splashPhase === "s33d" ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: 'hsl(120 40% 18%)' }}
        >
          <img
            src={atlasSplash}
            alt="S33D"
            className="max-w-md w-3/4 animate-fade-in"
          />
        </div>

        {/* Ancient Friends Screen */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            splashPhase === "ancient" ? "opacity-100" : splashPhase === "fading" ? "opacity-0" : "opacity-0"
          }`}
        >
          <img
            src={atlasSplash2}
            alt="Ancient Friends"
            className="w-full h-full object-cover"
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
