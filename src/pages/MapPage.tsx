import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Map from "@/components/Map";
import atlasSplash from "@/assets/atlas-splash.jpeg";

const MapPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => setShowSplash(false), 800);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 ${splashFading ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: 'hsl(120 40% 18%)' }}
      >
        <img
          src={atlasSplash}
          alt="S33D - Ancient Friend Arboreal Atlas"
          className="max-w-md w-3/4 animate-fade-in"
        />
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
