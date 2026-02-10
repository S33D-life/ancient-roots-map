import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Maximize2, Minimize2, ScrollText, Users, Podcast, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import councilSplashFire from "@/assets/council-splash-fire.png";
import councilHomeBg from "@/assets/council-home-bg.jpeg";

const councilRooms = [
  {
    id: "records",
    title: "Council Records",
    description: "Browse the archives of past councils",
    icon: ScrollText,
    notionUrl: "https://clammy-viscount-ddb.notion.site/ebd//1e415b58480d8042a722ef57e01e3228",
  },
  {
    id: "join",
    title: "Join Council",
    description: "Become a member of the Council of Life",
    icon: Users,
    notionUrl: "https://t.me/s/s33dlife",
  },
  {
    id: "pod",
    title: "Host a Pod",
    description: "Start a local pod gathering",
    icon: Podcast,
    externalUrl: "https://t.me/s33dlife",
  },
  {
    id: "next",
    title: "Next Council",
    description: "Upcoming council dates and details",
    icon: CalendarDays,
    externalUrl: "https://t.me/s33dlife",
  },
];

const CouncilOfLifePage = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 3000);
    const hideTimer = setTimeout(() => setShowSplash(false), 4000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (showSplash) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-1000 ${fadeOut ? "opacity-0" : "opacity-100"}`}
        style={{ backgroundColor: "hsl(25, 30%, 8%)" }}
      >
        <img
          src={councilSplashFire}
          alt="Council of Life"
          className="max-w-2xl w-[90%] rounded-xl shadow-2xl animate-scale-in"
        />
      </div>
    );
  }

  if (isFullscreen && activeRoom) {
    const room = councilRooms.find((r) => r.id === activeRoom);
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
    const room = councilRooms.find((r) => r.id === activeRoom);
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
                ← Back to Council
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
            <iframe
              src={room?.notionUrl}
              width="100%"
              height="800"
              frameBorder="0"
              allowFullScreen
              className="rounded-xl border border-border/40"
              title={room?.title}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Home screen — like HeARTwood Library
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="relative pt-20 pb-8">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={councilHomeBg}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/90" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-center mb-3 tracking-wider drop-shadow-lg">
            Council of Life
          </h1>
          <p className="text-center text-muted-foreground mb-12 text-lg font-serif italic">
            Gather around the ancient table
          </p>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {councilRooms.map((room) => {
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
      </main>
      <Footer />
    </div>
  );
};

export default CouncilOfLifePage;
