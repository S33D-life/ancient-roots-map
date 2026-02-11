import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import TetolBridge from "@/components/TetolBridge";
import { Maximize2, Minimize2, BookOpen, Cherry, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "next-themes";
import CrownEntrance from "@/components/CrownEntrance";
import goldenDreamBanner from "@/assets/golden-dream-splash-2.png";
import goldenDreamNight from "@/assets/golden-dream-night.jpeg";

const goldenDreamRooms = [
  {
    id: "current",
    title: "Current Version",
    description: "The Current S33D Blue Print",
    icon: BookOpen,
    notionUrl: "https://clammy-viscount-ddb.notion.site/ebd//21615b58480d802187b2cff864277413",
  },
  {
    id: "fruit",
    title: "Popular Fruit",
    description: "Next S33D likely to Sprout",
    icon: Cherry,
    notionUrl: "https://clammy-viscount-ddb.notion.site/ebd//21615b58480d802187b2cff864277413",
  },
  {
    id: "archives",
    title: "Archives",
    description: "Past versions of the Golden Dream",
    icon: Archive,
    externalUrl: "https://www.icloud.com/iclouddrive/0a8LpBMrWx1WVlDW9HOdNI0-Q#Golden_Dream_V2.0",
  },
];

const GoldenDreamPage = () => {
  const [showEntrance, setShowEntrance] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [coverDismissed, setCoverDismissed] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleEntranceComplete = useCallback(() => setShowEntrance(false), []);

  if (showEntrance) {
    return <CrownEntrance onComplete={handleEntranceComplete} />;
  }

  if (isFullscreen && activeRoom) {
    const room = goldenDreamRooms.find((r) => r.id === activeRoom);
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
          src={room?.notionUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          title={room?.title}
        />
      </div>
    );
  }

  if (activeRoom) {
    const room = goldenDreamRooms.find((r) => r.id === activeRoom);
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-28 pb-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveRoom(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Golden Dream
              </Button>
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

            <div className="relative rounded-xl border border-border/40 overflow-hidden">
              <iframe
                src={room?.notionUrl}
                width="100%"
                height="800"
                frameBorder="0"
                allowFullScreen
                title={room?.title}
              />
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
  }

  // Home screen
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="relative pt-20 pb-8">
        <TetolBreadcrumb />
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={goldenDreamBanner}
            alt=""
            className="w-full h-full object-cover brightness-125 saturate-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/70" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 30%, hsl(42 95% 55% / 0.25), transparent 60%)' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-center mb-3 tracking-wider drop-shadow-lg">
            yOur Golden Dream
          </h1>
          <p className="text-center text-muted-foreground mb-12 text-lg font-serif italic">
            A living vision for the future
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {goldenDreamRooms.map((room) => {
              const Icon = room.icon;
              return (
                <Card
                  key={room.id}
                  className="cursor-pointer bg-card/60 backdrop-blur-sm border-border/50 hover:bg-card/80 hover:border-primary/40 hover:glow-subtle transition-all duration-300 group"
                  onClick={() => {
                    if ('externalUrl' in room && room.externalUrl) {
                      window.open(room.externalUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      setActiveRoom(room.id);
                    }
                  }}
                >
                  <CardHeader className="text-center p-4 md:p-6">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-accent transition-colors" />
                    <CardTitle className="text-base md:text-lg font-serif tracking-wide">
                      {room.title}
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      {room.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
        <TetolBridge />
      </main>
      <Footer />
    </div>
  );
};

export default GoldenDreamPage;
