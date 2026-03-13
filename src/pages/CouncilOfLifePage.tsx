import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMapFocus } from "@/hooks/use-map-focus";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import TetolBridge from "@/components/TetolBridge";
import { Maximize2, Minimize2, ScrollText, Users, Podcast, CalendarDays, BarChart3, TreePine, MapPin, Sparkles, Bug, Eye, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LevelEntrance from "@/components/LevelEntrance";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { HostAPodModal } from "@/components/HostAPodModal";
import DigitalFireVote from "@/components/DigitalFireVote";
import CouncilSparkIcon from "@/components/CouncilSparkIcon";
import councilHomeBg from "@/assets/council-home-bg.jpeg";

const councilRooms = [
  {
    id: "records",
    title: "Council Records",
    description: "Browse the archives of past councils",
    icon: ScrollText,
    notionUrl: "https://clammy-viscount-ddb.notion.site/ebd/1e415b58480d8042a722ef57e01e3228",
  },
  {
    id: "join",
    title: "Join Council",
    description: "Become a member of the Council of Life",
    icon: Users,
    externalUrl: "https://t.me/s33dlife",
  },
  {
    id: "pod",
    title: "Host a Pod",
    description: "Start a local pod gathering",
    icon: Podcast,
    comingSoon: true,
  },
  {
    id: "markets",
    title: "Cycle Markets",
    description: "Participatory ecological forecasting",
    icon: BarChart3,
    internalUrl: "/library/rhythms",
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
  const navigate = useNavigate();
  const { focusMap } = useMapFocus();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { showEntrance, dismissEntrance } = useEntranceOnce("council");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [podModalOpen, setPodModalOpen] = useState(false);
  const [linkedTrees, setLinkedTrees] = useState<Array<{ id: string; name: string; species: string }>>([]);
  const [linkedRegions, setLinkedRegions] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [recentSparks, setRecentSparks] = useState<Array<{ id: string; title: string; report_type: string; status: string; upvotes_count: number; created_at: string }>>([]);

  // Fetch linked trees and bio-regions for all councils
  useEffect(() => {
    supabase
      .from("council_trees")
      .select("tree_id, trees:tree_id(id, name, species)")
      .limit(12)
      .then(({ data }) => {
        if (data) {
          setLinkedTrees(
            data
              .map((d: any) => d.trees)
              .filter(Boolean)
          );
        }
      });
    supabase
      .from("council_bio_regions")
      .select("bio_region_id, bio_regions:bio_region_id(id, name, type)")
      .limit(8)
      .then(({ data }) => {
        if (data) {
          setLinkedRegions(
            data
              .map((d: any) => d.bio_regions)
              .filter(Boolean)
          );
        }
      });
    // Fetch recent council sparks
    supabase
      .from("bug_reports")
      .select("id, title, report_type, status, upvotes_count, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecentSparks(data as any);
      });
  }, []);

  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);

  if (showEntrance) {
    return <LevelEntrance phases={[{ src: councilHomeBg, alt: "The Canopy" }]} phaseDuration={1200} fadeDuration={600} onComplete={handleEntranceComplete} />;
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="relative pt-20 pb-8">
        <TetolBreadcrumb />
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
          <p className="text-center text-muted-foreground mb-4 text-lg font-serif italic">
            Gather around the ancient table
          </p>
          <p className="text-center text-muted-foreground/60 mb-12 text-xs font-serif max-w-md mx-auto">
            Stewardship through collective wisdom — where contributions become harvest and harvest guides the commons.
          </p>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {councilRooms.map((room) => {
              const Icon = room.icon;
              const isComingSoon = 'comingSoon' in room && room.comingSoon;
              return (
                <Card
                  key={room.id}
                  className={`relative bg-card/60 backdrop-blur-sm border-border/50 transition-all duration-300 group ${
                    isComingSoon
                      ? "opacity-75 cursor-pointer"
                      : "cursor-pointer hover:bg-card/80 hover:border-primary/40"
                  }`}
                  onClick={() => {
                    if (isComingSoon) {
                      setPodModalOpen(true);
                    } else if ('internalUrl' in room && room.internalUrl) {
                      navigate(room.internalUrl);
                    } else if ('externalUrl' in room && room.externalUrl) {
                      window.open(room.externalUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      setActiveRoom(room.id);
                    }
                  }}
                >
                  {isComingSoon && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5"
                    >
                      Coming Soon
                    </Badge>
                  )}
                  <CardHeader className="text-center p-4 md:p-6">
                    <Icon className={`h-8 w-8 mx-auto mb-2 transition-colors ${
                      isComingSoon ? "text-muted-foreground" : "text-primary group-hover:text-accent"
                    }`} />
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

          {/* Linked Trees & Bio-Regions */}
          {(linkedTrees.length > 0 || linkedRegions.length > 0) && (
            <div className="mt-10 space-y-4">
              {linkedTrees.length > 0 && (
                <div>
                  <h3 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3 flex items-center gap-1.5">
                    <TreePine className="h-3 w-3" /> Council Trees
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {linkedTrees.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => focusMap({ type: "tree", id: t.id, source: "tree" })}
                        className="text-xs font-serif px-3 py-1.5 rounded-lg border border-border/30 hover:border-primary/30 transition-colors bg-card/40"
                      >
                        {t.name} <span className="text-muted-foreground/50">· {t.species}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {linkedRegions.length > 0 && (
                <div>
                  <h3 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Bio-Regions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {linkedRegions.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => navigate(`/atlas/bio-regions/${r.id}`)}
                        className="text-xs font-serif px-3 py-1.5 rounded-lg border border-border/30 hover:border-primary/30 transition-colors bg-card/40"
                      >
                        {r.name} <span className="text-muted-foreground/50">· {r.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Sparks */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 flex items-center gap-1.5">
                <CouncilSparkIcon className="w-3.5 h-3.5" /> Recent Sparks
              </h3>
              <button
                onClick={() => navigate("/bug-garden")}
                className="text-[10px] text-primary/60 hover:text-primary transition-colors font-serif"
              >
                View all →
              </button>
            </div>
            {recentSparks.length > 0 ? (
              <div className="space-y-2">
                {recentSparks.map((spark) => {
                  const TypeIcon = spark.report_type === "bug" ? Bug : spark.report_type === "ux_improvement" ? Eye : Lightbulb;
                  const statusLabel = spark.status === "new" ? "🌱 Planted" : spark.status === "fixed" ? "✅ Integrated" : spark.status === "in_progress" ? "🔨 Growing" : "📋 " + spark.status;
                  return (
                    <button
                      key={spark.id}
                      onClick={() => navigate("/bug-garden")}
                      className="w-full text-left text-xs font-serif px-3 py-2 rounded-lg border border-border/30 hover:border-primary/30 transition-colors bg-card/40 flex items-center gap-2"
                    >
                      <TypeIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{spark.title}</span>
                      <span className="text-[10px] text-muted-foreground/50 shrink-0">{statusLabel}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/40 font-serif italic text-center py-4">
                No sparks yet — be the first to offer one ✨
              </p>
            )}
          </div>

          {/* Digital Fire Vote */}
          <div className="mt-10">
            <DigitalFireVote />
          </div>

          {/* Loop-closure: cross-links to related features */}
          <div className="mt-10 rounded-xl border border-border/20 bg-card/30 p-4 space-y-3">
            <h3 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50">
              Continue your journey
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate("/value-tree")} className="loop-card font-serif">
                <span className="text-primary">❤️ Value Tree</span>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">See how Hearts flow</p>
              </button>
              <button onClick={() => navigate("/support")} className="loop-card font-serif">
                <span className="text-primary">🌱 Support S33D</span>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">Contribute beyond governance</p>
              </button>
              <button onClick={() => navigate("/map")} className="loop-card font-serif">
                <span className="text-primary">🗺️ Atlas</span>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">Map an Ancient Friend</p>
              </button>
              <button onClick={() => navigate("/library")} className="loop-card font-serif">
                <span className="text-primary">📚 Library</span>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">Browse offerings & stories</p>
              </button>
            </div>
          </div>
        </div>
        <TetolBridge />
      </main>
      <Footer />

      <HostAPodModal open={podModalOpen} onOpenChange={setPodModalOpen} />
    </div>
  );
};

export default CouncilOfLifePage;
