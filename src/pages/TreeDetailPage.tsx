import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ContextualWhisper from "@/components/ContextualWhisper";
import TreeLoreSection from "@/components/TreeLoreSection";
import HeartCanopyPulse from "@/components/HeartCanopyPulse";
import WishTagSigils from "@/components/WishTagSigils";
import {
  TreePageHero,
  TreeStorySection,
  TreeOfferingsPreview,
  TreeWishesSection,
  TreeRadioBlock,
  TreeMapJourneyAnchor,
  TreeHiveConnections,
  TreeHeartRewards,
} from "@/components/tree-sections";
import SeedPlanter from "@/components/SeedPlanter";
import TreeHeartPool from "@/components/TreeHeartPool";
import SpeciesAttestation from "@/components/SpeciesAttestation";
import BloomingClock from "@/components/BloomingClock";
import TreeShareCard from "@/components/TreeShareCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, MapPin, Music, Camera, MessageSquare, FileText,
  Loader2, Sparkles, X, ChevronLeft, ChevronRight, ExternalLink, Share2, Map, Mic, BookOpen, Bird, TreeDeciduous,
} from "lucide-react";
import AddOfferingDialog from "@/components/AddOfferingDialog";
import ProposeEditDrawer from "@/components/ProposeEditDrawer";
import MeetingTimer, { type Meeting, type TimerStatus } from "@/components/MeetingTimer";
import OfferingHistory from "@/components/OfferingHistory";
import BirdsongOfferingFlow from "@/components/BirdsongOfferingFlow";
import BirdsongTab from "@/components/BirdsongTab";
import EncounterClusterPanel from "@/components/EncounterClusterPanel";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import type { Database } from "@/integrations/supabase/types";
import { useOfferings, offeringLabels } from "@/hooks/use-offerings";
import type { OfferingType, Offering } from "@/hooks/use-offerings";
import { useTreeSources } from "@/hooks/use-tree-sources";
import { useTreeCheckins, useCheckinStats } from "@/hooks/use-tree-checkins";
import ContributeSourceModal from "@/components/ContributeSourceModal";
import TreeSourcesDisplay from "@/components/TreeSourcesDisplay";
import CanopyCheckinModal from "@/components/CanopyCheckinModal";
import CanopyVisitsTimeline from "@/components/CanopyVisitsTimeline";
import TreeMarkets from "@/components/TreeMarkets";
import StewardshipLeaderboard from "@/components/StewardshipLeaderboard";
import LinkedVolumesPanel from "@/components/LinkedVolumesPanel";
import SendWhisperModal from "@/components/SendWhisperModal";
import WhisperCollector from "@/components/WhisperCollector";
import { checkWhispersAtTree, type TreeWhisper } from "@/hooks/use-whispers";
import WeatherCard from "@/components/WeatherCard";
import TreeCheckinButton from "@/components/TreeCheckinButton";
import SkystampSeal from "@/components/SkystampSeal";
import OfferingQuoteBlock from "@/components/OfferingQuoteBlock";
import OfferingCard from "@/components/OfferingCard";
import InfluenceUpvoteButton from "@/components/InfluenceUpvoteButton";
import OfferingSortControls, { type OfferingSortMode } from "@/components/OfferingSortControls";
import { InfluenceTokenProvider } from "@/contexts/InfluenceTokenContext";
import { useBloomStatus } from "@/hooks/use-bloom-status";
import PhenologyBadge from "@/components/PhenologyBadge";
import PhenologyObservationButton from "@/components/PhenologyObservationButton";
import PresenceRitual from "@/components/PresenceRitual";
import { useTreePresence } from "@/hooks/use-tree-presence";
import { useTreePresenceCount } from "@/hooks/use-presence-spiral";
import { goToTreeOnMap } from "@/utils/mapNavigation";
type Tree = Database["public"]["Tables"]["trees"]["Row"];

const offeringIcons: Record<OfferingType, React.ReactNode> = {
  photo: <Camera className="h-4 w-4" />,
  song: <Music className="h-4 w-4" />,
  poem: <FileText className="h-4 w-4" />,
  story: <MessageSquare className="h-4 w-4" />,
  nft: <Sparkles className="h-4 w-4" />,
  voice: <Mic className="h-4 w-4" />,
  book: <BookOpen className="h-4 w-4" />,
};

const TreeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOfferingOpen, setAddOfferingOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OfferingType>("photo");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [meetingStatus, setMeetingStatus] = useState<TimerStatus>("none");
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [proposeEditOpen, setProposeEditOpen] = useState(false);
  const [birdsongOpen, setBirdsongOpen] = useState(false);
  const [birdsongCount, setBirdsongCount] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("photo");
  const [sortMode, setSortMode] = useState<OfferingSortMode>("new");
  const [sectionTab, setSectionTab] = useState<string>("overview");
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [contributeSourceOpen, setContributeSourceOpen] = useState(false);
  const [canopyCheckinOpen, setCanopyCheckinOpen] = useState(false);
  const [whisperModalOpen, setWhisperModalOpen] = useState(false);
  const [whisperContextLabel, setWhisperContextLabel] = useState<string | null>(null);
  const [availableWhispers, setAvailableWhispers] = useState<TreeWhisper[]>([]);
  const [ecoBelonging, setEcoBelonging] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [presenceOpen, setPresenceOpen] = useState(false);

  // Capture referral params from shared tree links
  useEffect(() => {
    const invite = searchParams.get("invite");
    const from = searchParams.get("from");
    if (invite) {
      localStorage.setItem("s33d_invite_code", invite);
      if (from === "share") {
        localStorage.setItem("s33d_inspiration_source", "share");
        if (id) sessionStorage.setItem("s33d_shared_tree_id", id);
      }
    }
  }, [searchParams, id]);

  // Centralized offerings via shared hook (with realtime)
  const { offerings, refetch: refetchOfferings, getByType: getOfferingsByType, getByRole } = useOfferings({ treeId: id, realtime: true });
  const stewardshipOfferings = useMemo(() => getByRole("stewardship"), [getByRole]);
  const anchoredOfferings = useMemo(() => getByRole("anchored"), [getByRole]);
  const [showAnchored, setShowAnchored] = useState(false);
  const { verified: verifiedSources, pending: pendingSources, loading: sourcesLoading, refetch: refetchSources } = useTreeSources(id);
  const { checkins, loading: checkinsLoading, refetch: refetchCheckins } = useTreeCheckins(id);
  const checkinStats = useCheckinStats(id, userId);
  const bloomStatus = useBloomStatus(tree?.species);
  const { presenceCompleted, completedToday, recordCompletion } = useTreePresence({
    treeId: id,
    treeSpecies: tree?.species || "",
    userId,
    treeLat: tree?.latitude,
    treeLng: tree?.longitude,
  });
  const presenceCount = useTreePresenceCount(userId, id);

  // Check for available whispers at this tree
  useEffect(() => {
    if (!userId || !tree) return;
    checkWhispersAtTree(userId, tree.id, tree.species).then(setAvailableWhispers);
  }, [userId, tree]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  // Handle ?add=type query param
  useEffect(() => {
    const addType = searchParams.get("add");
    if (addType === "birdsong") {
      setActiveTab("birdsong");
      setBirdsongOpen(true);
      setSearchParams({}, { replace: true });
    } else if (addType && ["photo", "song", "poem", "story", "nft"].includes(addType)) {
      setSelectedType(addType as OfferingType);
      setAddOfferingOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle whisper deep-link from map popup/tree cards
  useEffect(() => {
    if (!tree) return;
    if (searchParams.get("whisper") !== "1") return;
    if (searchParams.get("context") === "map") setWhisperContextLabel("Opened from map popup");
    setWhisperModalOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("whisper");
    next.delete("context");
    setSearchParams(next, { replace: true });
  }, [tree, searchParams, setSearchParams]);

  useEffect(() => {
    if (!id) return;

    const fetchTree = async () => {
      const { data, error } = await supabase
        .from("trees")
        .select("*")
        .eq("id", id)
        .single();
      if (error) console.error("Error fetching tree:", error);
      else setTree(data);
    };

    const fetchMeetings = async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("tree_id", id)
        .order("created_at", { ascending: false });
      if (!error && data) setAllMeetings(data as Meeting[]);
    };

    const fetchBirdsongCount = async () => {
      const { count } = await supabase
        .from("birdsong_offerings")
        .select("id", { count: "exact", head: true })
        .eq("tree_id", id);
      setBirdsongCount(count || 0);
    };

    const fetchEcoBelonging = async () => {
      const { data } = await supabase
        .from("bio_region_trees")
        .select("bio_region_id")
        .eq("tree_id", id);
      if (data && data.length > 0) {
        const { data: regions } = await supabase
          .from("bio_regions")
          .select("id, name, type")
          .in("id", data.map(d => d.bio_region_id));
        if (regions) setEcoBelonging(regions as Array<{ id: string; name: string; type: string }>);
      }
    };

    Promise.all([fetchTree(), fetchMeetings(), fetchBirdsongCount(), fetchEcoBelonging()]).then(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Tree not found</p>
          <Link to="/map" className="block text-center mt-4 text-primary hover:underline">
            Return to Map
          </Link>
        </div>
      </div>
    );
  }

  // getOfferingsByType provided by useOfferings hook

  const handleAddOffering = (type: OfferingType) => {
    setSelectedType(type);
    setAddOfferingOpen(true);
  };

  const photoOfferings = getOfferingsByType("photo").filter((o) => o.media_url);

  /** Sort offerings by selected mode */
  const sortOfferings = (items: Offering[]) => {
    const now = Date.now();
    const sorted = [...items];
    switch (sortMode) {
      case "hot":
        return sorted.sort((a, b) => ((b as any).hot_score || 0) - ((a as any).hot_score || 0));
      case "top_24h":
        return sorted
          .filter((o) => now - new Date(o.created_at).getTime() < 86400000)
          .sort((a, b) => ((b as any).influence_score || 0) - ((a as any).influence_score || 0));
      case "top_7d":
        return sorted
          .filter((o) => now - new Date(o.created_at).getTime() < 604800000)
          .sort((a, b) => ((b as any).influence_score || 0) - ((a as any).influence_score || 0));
      case "top_all":
        return sorted.sort((a, b) => ((b as any).influence_score || 0) - ((a as any).influence_score || 0));
      default: // "new"
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  return (
    <InfluenceTokenProvider userId={userId}>
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-4xl">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/map");
            }
          }}
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 font-serif text-sm tracking-wide transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        {/* ══════ MASTER TEMPLATE: Sacred Hero ══════ */}
        <TreePageHero
          tree={tree}
          photoUrl={getOfferingsByType("photo")[0]?.media_url || null}
          onMakeOffering={() => setAddOfferingOpen(true)}
          onAddWish={() => setSectionTab("overview")}
          onViewMap={() => {
            goToTreeOnMap(navigate, {
              treeId: tree.id,
              lat: tree.latitude,
              lng: tree.longitude,
              w3w: tree.what3words,
              source: "tree",
            });
          }}
          onWhisper={() => {
            setWhisperContextLabel("Opened from tree profile hero");
            setWhisperModalOpen(true);
          }}
          onShare={() => setShareCardOpen(true)}
          ecoBelonging={ecoBelonging}
          onNavigateHive={(slug) => navigate(`/hive/${slug}`)}
        />

        {tree && (
          <TreeShareCard
            open={shareCardOpen}
            onOpenChange={setShareCardOpen}
            tree={{
              id: tree.id,
              name: tree.name,
              species: tree.species,
              imageUrl: getOfferingsByType("photo")[0]?.media_url || null,
              location: [tree.state, tree.nation].filter(Boolean).join(", ") || null,
            }}
          />
        )}

        {/* ══════ Top-Level Section Tabs ══════ */}
        <Tabs value={sectionTab} onValueChange={setSectionTab} className="w-full mt-2">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/20 border border-border/40 mb-6 h-10 rounded-lg">
            <TabsTrigger value="overview" className="font-serif text-xs tracking-wider data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Overview
            </TabsTrigger>
            <TabsTrigger value="encounters" className="font-serif text-xs tracking-wider data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Encounters
            </TabsTrigger>
            <TabsTrigger value="offerings" className="font-serif text-xs tracking-wider data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Offerings
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ── */}
          <TabsContent value="overview" className="space-y-8">
            {/* Story + Structured Data (two-column) */}
            <TreeStorySection tree={tree} ecoBelonging={ecoBelonging} />

            {/* Offerings Preview */}
            <TreeOfferingsPreview
              offerings={offerings}
              onAddOffering={() => setAddOfferingOpen(true)}
              treeName={tree.name}
            />

            {/* Wishes Section */}
            <TreeWishesSection
              treeId={id!}
              treeName={tree.name}
              wishTags={(tree as any).wish_tags}
              isAnchorNode={(tree as any).is_anchor_node}
            />

            {/* Tree Radio */}
            <TreeRadioBlock
              treeId={id!}
              treeName={tree.name}
              species={tree.species}
              radioTheme={(tree as any).radio_theme}
            />

            {/* Map Journey Anchor */}
            <TreeMapJourneyAnchor
              treeId={tree.id}
              treeName={tree.name}
              lat={tree.latitude}
              lng={tree.longitude}
              w3w={tree.what3words}
            />

            {/* Hive Connections */}
            <TreeHiveConnections
              species={tree.species}
              ecoBelonging={ecoBelonging}
            />

            {/* Heart Rewards */}
            <TreeHeartRewards />

            {/* Vine divider */}
            <div className="vine-divider" />

            {/* Weather */}
            <WeatherCard latitude={tree.latitude} longitude={tree.longitude} />

            {/* Photo Gallery */}
            {photoOfferings.length > 0 && (
              <PhotoGrid offerings={photoOfferings} onImageClick={(i) => setLightboxIndex(i)} />
            )}

            {/* Tree Heart Pool */}
            <TreeHeartPool treeId={id!} userId={userId} />

            {/* Blooming Clock */}
            {tree?.species && (
              <BloomingClock species={tree.species} region={tree.nation} />
            )}

            {/* Species Attestation */}
            <SpeciesAttestation treeId={id!} treeSpecies={tree.species} userId={userId} />

            {/* Sources */}
            <TreeSourcesDisplay
              verified={verifiedSources}
              pending={pendingSources}
              loading={sourcesLoading}
              onContribute={() => setContributeSourceOpen(true)}
            />

            {/* Stewardship Leaderboard */}
            <StewardshipLeaderboard treeId={id!} />
          </TabsContent>

          {/* ── ENCOUNTERS TAB ── */}
          <TabsContent value="encounters" className="space-y-6">
            {/* Encounter Cluster */}
            <EncounterClusterPanel tree={tree} />

            {/* 333s Presence Ritual */}
            {userId && (
              <Card className="bg-card/60 backdrop-blur border-primary/20">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <TreeDeciduous className="w-5 h-5 text-primary/60" />
                    <div>
                      <p className="font-serif text-sm text-foreground">Tree Presence (333s)</p>
                      <p className="text-xs text-muted-foreground font-serif">
                        {presenceCompleted
                          ? completedToday ? `✓ Presence completed today · ${presenceCount} total` : `✓ Presence completed · ${presenceCount} total`
                          : "Be still with this tree to unlock minting"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={presenceCompleted ? "outline" : "mystical"}
                    size="sm"
                    className="font-serif text-xs shrink-0"
                    onClick={() => setPresenceOpen(true)}
                    disabled={completedToday}
                  >
                    {completedToday ? "Done Today" : presenceCompleted ? "Re-enter" : "Begin Presence"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Meeting Timer */}
            <MeetingTimer
              treeId={id!}
              treeName={tree.name}
              treeSpecies={tree.species}
              userId={userId}
              onMeetingChange={setActiveMeeting}
              onStatusChange={setMeetingStatus}
            />

            {/* Canopy Visits Timeline */}
            <CanopyVisitsTimeline
              checkins={checkins}
              stats={checkinStats}
              loading={checkinsLoading}
              onCheckin={() => setCanopyCheckinOpen(true)}
              userId={userId}
              onRefresh={refetchCheckins}
            />

            {/* Seed Economy */}
            <SeedPlanter
              treeId={id!}
              treeLat={tree.latitude}
              treeLng={tree.longitude}
              userId={userId}
              treeSpecies={tree.species}
            />

            {/* Whispers */}
            {userId && tree && (
              <Button
                onClick={() => setWhisperModalOpen(true)}
                variant="outline"
                className="w-full font-serif tracking-wider gap-2 border-primary/30 hover:bg-primary/10"
              >
                <MessageSquare className="h-4 w-4" />
                Send a Whisper Through This Tree
              </Button>
            )}

            {availableWhispers.length > 0 && userId && tree && (
              <WhisperCollector
                whispers={availableWhispers}
                userId={userId}
                treeId={tree.id}
                treeName={tree.name}
                onCollected={() => {
                  if (userId && tree) {
                    checkWhispersAtTree(userId, tree.id, tree.species).then(setAvailableWhispers);
                  }
                }}
              />
            )}

            {/* Anchored Memories */}
            {anchoredOfferings.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAnchored(!showAnchored)}
                  className="w-full flex items-center gap-3 mb-4"
                >
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--accent) / 0.3), transparent)" }} />
                  <span className="text-lg font-serif text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                    🏡 Anchored Memories
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAnchored ? "rotate-180" : ""}`} />
                    <span className="text-xs opacity-60">({anchoredOfferings.length})</span>
                  </span>
                  <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--accent) / 0.3), transparent)" }} />
                </button>
                <AnimatePresence>
                  {showAnchored && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        {anchoredOfferings.map((off) => (
                          <Card key={off.id} className="bg-card/30 backdrop-blur border-l-2 border-l-accent/40 border-border/20" style={{ boxShadow: "inset 0 0 20px hsl(var(--accent) / 0.03)" }}>
                            <CardContent className="p-3 flex items-center gap-3">
                              {off.media_url && off.type === "photo" && (
                                <img src={off.media_url} alt={off.title} className="w-12 h-12 rounded object-cover shrink-0 opacity-90" loading="lazy" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-serif text-sm text-foreground/80 truncate">{off.title}</p>
                                <span className="text-[10px] text-muted-foreground/60 font-mono">
                                  {new Date(off.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-[10px] font-serif shrink-0 capitalize border-accent/30 text-accent-foreground/60 gap-1">
                                🌿 {off.type}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* ── OFFERINGS TAB ── */}
          <TabsContent value="offerings" className="space-y-6">
            {/* Gate: offerings require active/expiring meeting */}
            {userId && meetingStatus !== "active" && meetingStatus !== "expiring" && (
              <div className="p-4 rounded-lg border border-border/40 bg-secondary/20 text-center">
                <p className="text-sm text-muted-foreground font-serif">
                  {meetingStatus === "expired"
                    ? "Your offering window has closed. Meet this Ancient Friend again to open a new 12-hour window."
                    : meetingStatus === "none"
                    ? "Meet this Ancient Friend to open a 12-hour offering window."
                    : "This meeting cannot be used for offerings."}
                </p>
              </div>
            )}

            {/* Birdsong Button */}
            <Button
              onClick={() => setBirdsongOpen(true)}
              variant="outline"
              className="w-full font-serif tracking-wider gap-2 border-primary/30 hover:bg-primary/10"
            >
              <Bird className="h-4 w-4" />
              Offer a Birdsong
              {birdsongCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] h-5">{birdsongCount}</Badge>
              )}
            </Button>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start bg-secondary/30 border border-border/50 mb-6 flex-wrap h-auto gap-1 p-1.5 rounded-lg">
                {(Object.keys(offeringLabels) as OfferingType[]).map((type) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="flex items-center gap-1.5 font-serif text-xs tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    {offeringIcons[type]}
                    {offeringLabels[type]}
                    <span className="text-[10px] opacity-60">
                      ({getOfferingsByType(type).length})
                    </span>
                  </TabsTrigger>
                ))}
                <TabsTrigger
                  value="birdsong"
                  className="flex items-center gap-1.5 font-serif text-xs tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                >
                  <Bird className="h-4 w-4" />
                  Birdsong
                  <span className="text-[10px] opacity-60">({birdsongCount})</span>
                </TabsTrigger>
              </TabsList>

              {(Object.keys(offeringLabels) as OfferingType[]).map((type) => (
                <TabsContent key={type} value={type}>
                  <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
                    <h3 className="text-lg font-serif text-foreground/90 tracking-wide">
                      {offeringLabels[type]}
                    </h3>
                    <div className="flex items-center gap-2">
                      <OfferingSortControls value={sortMode} onChange={setSortMode} />
                      <Button
                        size="sm"
                        onClick={() => handleAddOffering(type)}
                        disabled={meetingStatus !== "active" && meetingStatus !== "expiring"}
                        className="font-serif tracking-wider text-xs gap-1.5"
                        title={meetingStatus !== "active" && meetingStatus !== "expiring" ? "Meet this Ancient Friend first" : undefined}
                      >
                        <Sparkles className="h-3 w-3" />
                        Add {offeringLabels[type].slice(0, -1)}
                      </Button>
                    </div>
                  </div>

                  {getOfferingsByType(type).length === 0 ? (
                    <EmptyOffering type={type} label={offeringLabels[type]} onAdd={() => handleAddOffering(type)} />
                  ) : type === "photo" ? (
                    <PhotoGrid offerings={sortOfferings(getOfferingsByType(type))} onImageClick={(i) => setLightboxIndex(i)} />
                  ) : type === "book" ? (
                    <BookShelf offerings={sortOfferings(getOfferingsByType(type))} />
                  ) : (
                    <motion.div className={`space-y-4 ${["nft", "voice"].includes(type) ? "grid gap-4 md:grid-cols-2" : ""}`} initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
                      {sortOfferings(getOfferingsByType(type)).map((offering) => (
                        <motion.div key={offering.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.35, ease: "easeOut" }}>
                          <OfferingCard offering={offering} treeId={id!} userId={userId} treeSpecies={tree?.species} treeNation={tree?.nation} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>
              ))}

              <TabsContent value="birdsong">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-serif text-foreground/90 tracking-wide">Birdsong</h3>
                  <Button size="sm" onClick={() => setBirdsongOpen(true)} className="font-serif tracking-wider text-xs gap-1.5">
                    <Bird className="h-3 w-3" /> Add Birdsong
                  </Button>
                </div>
                <BirdsongTab treeId={id!} />
              </TabsContent>
            </Tabs>

            {/* Offering History */}
            {userId && allMeetings.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)" }} />
                  <h2 className="text-xl font-serif text-primary tracking-widest uppercase">
                    Offering History
                  </h2>
                  <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.4), transparent)" }} />
                </div>
                <OfferingHistory offerings={offerings} meetings={allMeetings} />
              </div>
            )}

            {/* Linked Volumes & Markets (secondary context) */}
            <LinkedVolumesPanel treeId={id!} />
            <TreeMarkets treeId={id!} treeSpecies={tree.species} />
          </TabsContent>
        </Tabs>

      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photoOfferings.length > 0 && (
        <Lightbox
          offerings={photoOfferings}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}

      <AddOfferingDialog
        open={addOfferingOpen}
        onOpenChange={setAddOfferingOpen}
        treeId={id!}
        treeSpecies={tree?.species}
        type={selectedType}
        meetingId={activeMeeting?.id}
      />

      <ProposeEditDrawer
        open={proposeEditOpen}
        onOpenChange={setProposeEditOpen}
        tree={tree}
      />

      <ContributeSourceModal
        open={contributeSourceOpen}
        onOpenChange={setContributeSourceOpen}
        treeId={id!}
        treeName={tree?.name || ""}
        onSourceAdded={refetchSources}
      />

      <CanopyCheckinModal
        open={canopyCheckinOpen}
        onOpenChange={setCanopyCheckinOpen}
        treeId={id!}
        treeName={tree?.name || ""}
        treeSpecies={tree?.species || ""}
        treeLat={tree?.latitude}
        treeLng={tree?.longitude}
        onCheckinComplete={refetchCheckins}
      />

      {tree && (
        <SendWhisperModal
          open={whisperModalOpen}
          onOpenChange={(open) => {
            setWhisperModalOpen(open);
            if (!open) setWhisperContextLabel(null);
          }}
          treeId={tree.id}
          treeName={tree.name}
          treeSpecies={tree.species}
          contextLabel={whisperContextLabel || undefined}
        />
      )}

      {/* Edit proposal nudge — appears once per tree */}
      <ContextualWhisper
        id={`edit-nudge-${id}`}
        message="🔍 Spot something that needs updating? Help keep the record accurate."
        cta={{ label: "Propose Edit", to: "#" }}
        delay={8000}
        position="bottom-right"
      />

      {/* 333s Presence Ritual Overlay */}
      <PresenceRitual
        open={presenceOpen}
        treeName={tree?.name || "Tree"}
        onComplete={async (reflection) => {
          setPresenceOpen(false);
          if (userId && id) {
            const result = await recordCompletion(reflection);
            if (result && !result.alreadyRewarded) {
              const { toast } = await import("sonner");
              toast.success("🌿 Presence Complete", {
                description: `+${result.heartsAwarded} Hearts earned`,
              });
            }
          }
        }}
        onCancel={() => setPresenceOpen(false)}
      />
    </div>
    </InfluenceTokenProvider>
  );
};

/* ---------- Shared ---------- */

const shareOffering = async (offering: Offering, treeName?: string) => {
  const typeLabel = offering.type === "poem" ? "poem" : offering.type === "song" ? "song" : offering.type === "story" ? "musing" : offering.type === "nft" ? "NFT" : "memory";
  const text = `"${offering.title}" — a ${typeLabel} offering${treeName ? ` for ${treeName}` : ""} on the Ancient Friends Map`;
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: offering.title, text, url });
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      const { toast } = await import("sonner");
      toast.success("Link copied to clipboard!");
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") {
      await navigator.clipboard.writeText(`${text} ${url}`);
      const { toast } = await import("sonner");
      toast.success("Link copied to clipboard!");
    }
  }
};

const getStaffImageFromCode = (code: string): string | null => {
  const prefix = code.split("-")[0]?.toLowerCase();
  if (!prefix) return null;
  return `/images/staffs/${prefix}.jpeg`;
};

const SealedByLabel = ({ staff }: { staff: string | null }) => {
  if (!staff) return null;
  const img = getStaffImageFromCode(staff);
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-primary/70 font-serif tracking-widest uppercase">
      {img && (
        <img
          src={img}
          alt={staff}
          className="w-4 h-4 rounded-full object-cover border border-primary/30"
        />
      )}
      <span className="opacity-60">⚘</span> Sealed by {staff}
    </span>
  );
};

/* ---------- Sub-components ---------- */

const EmptyOffering = ({
  type,
  label,
  onAdd,
}: {
  type: OfferingType;
  label: string;
  onAdd: () => void;
}) => (
  <div
    className="relative rounded-xl border border-dashed border-primary/30 p-10 text-center overflow-hidden"
    style={{
      background:
        "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.06), transparent 70%)",
    }}
  >
    <div className="text-4xl mb-3 opacity-40">
      {type === "photo" ? "📷" : type === "song" ? "🎵" : type === "poem" ? "📜" : type === "story" ? "✍️" : type === "book" ? "📖" : type === "voice" ? "🎙️" : "✨"}
    </div>
    <p className="text-muted-foreground font-serif mb-4">
      No {label.toLowerCase()} yet. Be the first to leave an offering.
    </p>
    <Button variant="outline" size="sm" onClick={onAdd} className="font-serif tracking-wider text-xs">
      <Sparkles className="h-3 w-3 mr-1.5" />
      Add the first {label.slice(0, -1).toLowerCase()}
    </Button>
  </div>
);

const PhotoGrid = ({
  offerings,
  onImageClick,
}: {
  offerings: Offering[];
  onImageClick: (index: number) => void;
}) => {
  const photoIndex = offerings.filter((o) => o.media_url);
  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 gap-3"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {offerings.map((offering) => (
        <motion.div
          key={offering.id}
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="group relative rounded-lg overflow-hidden border border-border/50 cursor-pointer aspect-square"
          onClick={() => {
            const idx = photoIndex.findIndex((p) => p.id === offering.id);
            if (idx >= 0) onImageClick(idx);
          }}
        >
          {offering.media_url ? (
            <img
              src={offering.media_url}
              alt={offering.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/30">
              <Camera className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
           <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-sm font-serif text-foreground truncate">{offering.title}</p>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                {new Date(offering.created_at).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); shareOffering(offering); }}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <SealedByLabel staff={offering.sealed_by_staff} />
                <SkystampSeal skyStampId={(offering as any).sky_stamp_id} compact />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};


/* ---------- Book Shelf ---------- */

const spineColors = [
  "from-emerald-800 to-emerald-950",
  "from-amber-800 to-amber-950",
  "from-violet-800 to-violet-950",
  "from-rose-800 to-rose-950",
  "from-blue-800 to-blue-950",
  "from-teal-800 to-teal-950",
  "from-orange-800 to-orange-950",
  "from-indigo-800 to-indigo-950",
  "from-stone-700 to-stone-900",
  "from-cyan-800 to-cyan-950",
];

const genreBadgeColors: Record<string, string> = {
  Nature: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Fiction: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Poetry: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  Science: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Philosophy: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Mythology: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Memoir: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  History: "bg-stone-500/20 text-stone-300 border-stone-500/30",
};

const parseBookContent = (content: string | null) => {
  if (!content) return { author: "", genre: null as string | null, quote: null as string | null, reflection: null as string | null };
  const lines = content.split("\n");
  const author = lines[0] || "";
  const genreLine = lines.find(l => l.startsWith("Genre: "));
  const genre = genreLine ? genreLine.replace("Genre: ", "") : null;
  const quoteStart = content.indexOf('"');
  const quoteEnd = content.lastIndexOf('"');
  const quote = quoteStart >= 0 && quoteEnd > quoteStart ? content.slice(quoteStart + 1, quoteEnd) : null;
  // Reflection is remaining text after genre/quote lines
  const nonMeta = lines.filter(l => l && l !== author && !l.startsWith("Genre: ") && !(l.startsWith('"') && l.endsWith('"')));
  const reflection = nonMeta.length > 0 ? nonMeta.join("\n").trim() : null;
  return { author, genre, quote, reflection };
};

const BookShelf = ({ offerings }: { offerings: Offering[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Shelf view — spines */}
      <div
        className="relative rounded-xl border border-border/30 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(var(--card) / 0.6) 0%, hsl(var(--secondary) / 0.3) 100%)",
        }}
      >
        {/* Shelf surface */}
        <div className="px-4 pt-6 pb-3">
          <motion.div
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {offerings.map((offering, i) => {
              const { author, genre } = parseBookContent(offering.content);
              const isExpanded = expandedId === offering.id;
              const colorIdx = i % spineColors.length;

              return (
                <motion.button
                  key={offering.id}
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : offering.id)}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex-shrink-0 rounded-sm overflow-hidden transition-all duration-300 ${
                    isExpanded ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{ width: isExpanded ? 100 : 44, height: 160 }}
                  title={`${offering.title} — ${author}`}
                >
                  {/* Spine gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${spineColors[colorIdx]}`} />

                  {/* Spine texture lines */}
                  <div className="absolute inset-x-0 top-2 h-px bg-white/10" />
                  <div className="absolute inset-x-0 bottom-2 h-px bg-white/10" />
                  <div className="absolute left-1 inset-y-0 w-px bg-white/5" />

                  {/* Title on spine (rotated) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-white/90 font-serif text-[10px] leading-tight tracking-wider whitespace-nowrap max-w-[140px] truncate"
                      style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                        transform: "rotate(180deg)",
                      }}
                    >
                      {offering.title}
                    </span>
                  </div>

                  {/* Front cover (when expanded) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/80 flex flex-col items-center justify-center p-2 text-center"
                      >
                        <BookOpen className="h-4 w-4 text-white/60 mb-1" />
                        <p className="text-white/90 font-serif text-[9px] leading-tight line-clamp-3">
                          {offering.title}
                        </p>
                        <p className="text-white/50 text-[8px] mt-0.5 line-clamp-1">{author}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Shelf edge */}
        <div
          className="h-3 border-t border-border/20"
          style={{
            background: "linear-gradient(180deg, hsl(var(--secondary) / 0.6), hsl(var(--secondary) / 0.3))",
            boxShadow: "0 -2px 8px hsl(var(--secondary) / 0.3)",
          }}
        />
      </div>

      {/* Expanded book detail */}
      <AnimatePresence>
        {expandedId && (
          <motion.div
            key={expandedId}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {(() => {
              const offering = offerings.find(o => o.id === expandedId);
              if (!offering) return null;
              const { author, genre, quote, reflection } = parseBookContent(offering.content);
              const colorIdx = offerings.indexOf(offering) % spineColors.length;

              return (
                <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden">
                  <div
                    className="h-0.5"
                    style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)" }}
                  />
                  <CardContent className="p-5 md:p-6">
                    <div className="flex gap-4">
                      {/* Mini book cover */}
                      <div
                        className={`w-16 h-24 rounded-sm bg-gradient-to-b ${spineColors[colorIdx]} flex items-center justify-center shrink-0 shadow-lg`}
                      >
                        <BookOpen className="h-6 w-6 text-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-lg text-primary tracking-wide">{offering.title}</h4>
                        <p className="text-sm text-muted-foreground/70 font-serif">{author}</p>
                        {genre && (
                          <Badge
                            variant="outline"
                            className={`mt-1.5 text-[10px] px-1.5 py-0 border ${genreBadgeColors[genre] || "bg-muted/30 text-muted-foreground border-border"}`}
                          >
                            {genre}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {quote && (
                      <blockquote className="border-l-2 border-primary/30 pl-3 mt-4 italic text-sm font-serif text-foreground/70 leading-relaxed">
                        "{quote}"
                      </blockquote>
                    )}

                    {reflection && (
                      <p className="text-sm font-serif text-foreground/60 leading-relaxed mt-3">
                        {reflection}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-[10px] text-muted-foreground/60 font-serif tracking-widest uppercase">
                        {new Date(offering.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => shareOffering(offering)}
                          className="text-muted-foreground/60 hover:text-primary transition-colors"
                          title="Share"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <SealedByLabel staff={offering.sealed_by_staff} />
                        <SkystampSeal skyStampId={(offering as any).sky_stamp_id} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Lightbox = ({
  offerings,
  index,
  onClose,
  onChange,
}: {
  offerings: Offering[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) => {
  const current = offerings[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      {offerings.length > 1 && (
        <>
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
            onClick={(e) => {
              e.stopPropagation();
              onChange((index - 1 + offerings.length) % offerings.length);
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
            onClick={(e) => {
              e.stopPropagation();
              onChange((index + 1) % offerings.length);
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      <div className="max-w-4xl max-h-[85vh] px-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.media_url!}
          alt={current.title}
          className="max-w-full max-h-[75vh] object-contain rounded-lg mx-auto"
        />
        <div className="text-center mt-4">
          <p className="font-serif text-lg text-primary">{current.title}</p>
          {current.content && (
            <p className="text-sm text-muted-foreground font-serif mt-1">{current.content}</p>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-2 tracking-widest">
            {index + 1} / {offerings.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TreeDetailPage;
