import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Map from "@/components/Map";
import atlasSplash from "@/assets/atlas-splash.jpeg";
import atlasLandingBg from "@/assets/atlas-landing-bg.jpeg";
import atlasSplash2 from "@/assets/atlas-splash-2.jpeg";
import { TreeDeciduous, Users, Globe, Map as MapIcon, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAP_CHOICES = [
  {
    key: "collective",
    label: "Collective Atlas",
    desc: "All community trees",
    icon: Globe,
  },
  {
    key: "personal",
    label: "Personal Groves",
    desc: "Your mapped trees",
    icon: Users,
  },
  {
    key: "encounter",
    label: "Claim Tree Encounter",
    desc: "Log a new tree find",
    icon: TreeDeciduous,
  },
];

const SPECIES_QUICK = [
  { key: "all", label: "All Species" },
  { key: "Oak", label: "Oak" },
  { key: "Yew", label: "Yew" },
  { key: "Beech", label: "Beech" },
  { key: "Ash", label: "Ash" },
  { key: "Holly", label: "Holly" },
];

const MapPage = () => {
  const [splashPhase, setSplashPhase] = useState<"s33d" | "ancient" | "fading" | "done">("s33d");
  const [showLanding, setShowLanding] = useState(true);
  const [selectedView, setSelectedView] = useState("collective");
  const [selectedSpecies, setSelectedSpecies] = useState("all");

  useEffect(() => {
    const t1 = setTimeout(() => setSplashPhase("ancient"), 2000);
    const t2 = setTimeout(() => setSplashPhase("fading"), 4500);
    const t3 = setTimeout(() => setSplashPhase("done"), 5300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (splashPhase !== "done") {
    return (
      <div className="fixed inset-0 z-50" style={{ background: 'hsl(120 40% 12%)' }}>
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            splashPhase === "s33d" ? "opacity-100" : "opacity-0"
          }`}
        >
          <img src={atlasSplash} alt="S33D" className="max-w-xs w-1/2 rounded-lg animate-fade-in" loading="eager" decoding="async" />
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            splashPhase === "ancient" ? "opacity-100" : splashPhase === "fading" ? "opacity-0" : "opacity-0"
          }`}
        >
          <img src={atlasSplash2} alt="Ancient Friends" className="max-w-sm w-2/3 rounded-lg" loading="eager" decoding="async" />
        </div>
      </div>
    );
  }

  if (showLanding) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <Header />
        <div className="absolute inset-0">
          <img src={atlasLandingBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background/80" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-24 pb-12 px-4">
          <Compass className="w-12 h-12 text-amber-400/80 mb-4" style={{ filter: 'drop-shadow(0 0 12px hsl(35 80% 40% / 0.5))' }} />
          <h1 className="text-4xl md:text-5xl font-serif text-amber-400/90 tracking-wider mb-2 text-center" style={{ textShadow: '0 0 30px hsl(35 80% 30% / 0.5)' }}>
            ARBOREAL ATLAS
          </h1>
          <p className="text-amber-200/50 font-serif text-sm md:text-base mb-10 text-center">
            Choose your path through the ancient groves
          </p>

          {/* Map View */}
          <div className="w-full max-w-md mb-8">
            <h3 className="text-xs uppercase tracking-widest text-amber-300/50 mb-3 text-center">Map View</h3>
            <div className="grid grid-cols-3 gap-3">
              {MAP_CHOICES.map((choice) => {
                const Icon = choice.icon;
                const isActive = selectedView === choice.key;
                return (
                  <button
                    key={choice.key}
                    onClick={() => setSelectedView(choice.key)}
                    className={`group relative rounded-xl border p-4 text-left transition-all duration-300 ${
                      isActive
                        ? "border-amber-500/60 scale-105"
                        : "border-amber-700/30 hover:border-amber-600/50 hover:scale-[1.02]"
                    }`}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, hsl(28 35% 16% / 0.95), hsl(25 30% 12% / 0.95))'
                        : 'linear-gradient(135deg, hsl(28 30% 10% / 0.85), hsl(25 25% 8% / 0.9))',
                    }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl" style={{ background: 'radial-gradient(circle at center, hsl(35 70% 40% / 0.15), transparent 70%)' }} />
                    )}
                    <Icon className={`w-5 h-5 mb-2 relative z-10 ${isActive ? 'text-amber-400' : 'text-amber-300/60'}`} />
                    <h4 className={`font-serif text-sm mb-0.5 relative z-10 ${isActive ? 'text-amber-300' : 'text-amber-300/80'}`}>{choice.label}</h4>
                    <p className="text-amber-200/40 text-xs relative z-10">{choice.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Species Quick Filter */}
          <div className="w-full max-w-md mb-10">
            <h3 className="text-xs uppercase tracking-widest text-amber-300/50 mb-3 text-center">Species Filter</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {SPECIES_QUICK.map((sp) => {
                const isActive = selectedSpecies === sp.key;
                return (
                  <button
                    key={sp.key}
                    onClick={() => setSelectedSpecies(sp.key)}
                    className={`rounded-full px-4 py-1.5 text-xs font-serif transition-all border ${
                      isActive
                        ? "border-amber-500/60 text-amber-300 bg-amber-900/30"
                        : "border-amber-700/30 text-amber-300/60 hover:border-amber-600/40 hover:text-amber-300/80"
                    }`}
                  >
                    {sp.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enter Button */}
          <Button
            onClick={() => setShowLanding(false)}
            className="gap-2 px-8 py-3 text-base font-serif rounded-xl border border-amber-500/50 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, hsl(28 40% 18%), hsl(35 50% 22%))',
              color: 'hsl(42 95% 55%)',
              textShadow: '0 0 8px hsla(42, 95%, 55%, 0.5)',
            }}
          >
            <MapIcon className="w-5 h-5" />
            Enter the Atlas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at center, hsl(100 20% 32%), hsl(95 25% 24%) 60%, hsl(90 22% 16%) 100%)' }}>
      <Header />
      <Map initialView={selectedView} initialSpecies={selectedSpecies} />
    </div>
  );
};

export default MapPage;
