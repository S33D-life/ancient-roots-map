import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronDown, Layers } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
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
// CoreLoopBar removed — unused import
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, MapPin, Music, Camera, MessageSquare, FileText,
  Loader2, Sparkles, X, ChevronLeft, ChevronRight, ExternalLink, Share2, Map, Mic, BookOpen, Bird, TreeDeciduous,
} from "lucide-react";
import { useSpeciesResolution } from "@/hooks/use-species-resolution";
import type { Database } from "@/integrations/supabase/types";
import { useOfferings, offeringLabels } from "@/hooks/use-offerings";
import type { OfferingType, Offering } from "@/hooks/use-offerings";
import { useTreeSources } from "@/hooks/use-tree-sources";
import { useTreeCheckins, useCheckinStats } from "@/hooks/use-tree-checkins";
import { useTreeCheckinStatus } from "@/hooks/use-tree-checkin-status";
import { useTreeContributions } from "@/hooks/use-tree-contributions";
import { checkWhispersAtTree, type TreeWhisper } from "@/hooks/use-whispers";
import type { Meeting, TimerStatus } from "@/components/MeetingTimer";
import type { OfferingSortMode } from "@/components/OfferingSortControls";
import { useBloomStatus } from "@/hooks/use-bloom-status";
import { useTeotagPageContext } from "@/hooks/use-teotag-page-context";
import { useTreePresence } from "@/hooks/use-tree-presence";
import { useSingleTreePresence } from "@/hooks/use-single-tree-presence";
import { useTreePresenceCount } from "@/hooks/use-presence-spiral";
import { useTreeProximityGate } from "@/hooks/use-tree-proximity-gate";
import { goToTreeOnMap } from "@/utils/mapNavigation";
import OfferingCard from "@/components/OfferingCard";
import InfluenceUpvoteButton from "@/components/InfluenceUpvoteButton";
import { PhotoGrid, Lightbox, BookShelf, SealedByLabel, shareOffering } from "@/components/tree-detail/TreeDetailSubComponents";
import EmptyOffering from "@/components/tree-detail/EmptyOffering";
const ProximityGateMessage = lazy(() => import("@/components/ProximityGateMessage"));
const CollectHeartsButton = lazy(() => import("@/components/CollectHeartsButton"));

// Lazy-loaded secondary components (modals, panels, below-fold)
const ContextualWhisper = lazy(() => import("@/components/ContextualWhisper"));
const WhyThisMatters = lazy(() => import("@/components/WhyThisMatters"));
const TreeLoreSection = lazy(() => import("@/components/TreeLoreSection"));
const HeartCanopyPulse = lazy(() => import("@/components/HeartCanopyPulse"));
const WishTagSigils = lazy(() => import("@/components/WishTagSigils"));
const TreeJourneyInvitations = lazy(() => import("@/components/tree-sections/TreeJourneyInvitations"));
const SeedPlanter = lazy(() => import("@/components/SeedPlanter"));
const WhisperRipple = lazy(() => import("@/components/WhisperRipple"));
const TreeHeartPool = lazy(() => import("@/components/TreeHeartPool"));
const SpeciesAttestation = lazy(() => import("@/components/SpeciesAttestation"));
const GroveContext = lazy(() => import("@/components/GroveContext"));
const TreePulseIndicator = lazy(() => import("@/components/TreePulseIndicator"));
const PathwayContext = lazy(() => import("@/components/PathwayContext"));
const BloomingClock = lazy(() => import("@/components/BloomingClock"));
const NearbyTreesExplorer = lazy(() => import("@/components/NearbyTreesExplorer"));
const TreeShareCard = lazy(() => import("@/components/TreeShareCard"));
const GreetingCardDialog = lazy(() => import("@/components/greeting-cards/GreetingCardDialog"));
const SeasonalMomentPanel = lazy(() => import("@/components/SeasonalMomentPanel"));
const AddOfferingDialog = lazy(() => import("@/components/AddOfferingDialog"));
const OfferingGateway = lazy(() => import("@/components/OfferingGateway"));
const ProposeEditDrawer = lazy(() => import("@/components/ProposeEditDrawer"));
const MeetingTimer = lazy(() => import("@/components/MeetingTimer"));
const OfferingHistory = lazy(() => import("@/components/OfferingHistory"));
const BirdsongOfferingFlow = lazy(() => import("@/components/BirdsongOfferingFlow"));
const BirdsongTab = lazy(() => import("@/components/BirdsongTab"));
const EncounterClusterPanel = lazy(() => import("@/components/EncounterClusterPanel"));
const ContributeSourceModal = lazy(() => import("@/components/ContributeSourceModal"));
const TreeSourcesDisplay = lazy(() => import("@/components/TreeSourcesDisplay"));
const CanopyCheckinModal = lazy(() => import("@/components/CanopyCheckinModal"));
const CanopyVisitsTimeline = lazy(() => import("@/components/CanopyVisitsTimeline"));
const TreeCheckinStatusLight = lazy(() => import("@/components/TreeCheckinStatusLight"));
const QuickCheckinButton = lazy(() => import("@/components/QuickCheckinButton"));
const TreeActivityStats = lazy(() => import("@/components/TreeActivityStats"));
const TreeMarkets = lazy(() => import("@/components/TreeMarkets"));
const StewardshipLeaderboard = lazy(() => import("@/components/StewardshipLeaderboard"));
const LinkedVolumesPanel = lazy(() => import("@/components/LinkedVolumesPanel"));
const TreeStewardshipLog = lazy(() => import("@/components/stewardship/TreeStewardshipLog"));
const TreeGuardianRoles = lazy(() => import("@/components/stewardship/TreeGuardianRoles"));
const SendWhisperModal = lazy(() => import("@/components/SendWhisperModal"));
const AddContributionPanel = lazy(() => import("@/components/contributions/AddContributionPanel"));
const ContributionFeed = lazy(() => import("@/components/contributions/ContributionFeed"));
const WhisperCollector = lazy(() => import("@/components/WhisperCollector"));
const TreeArrivalPanel = lazy(() => import("@/components/TreeArrivalPanel"));
const TreeDetailPresenceBlock = lazy(() => import("@/components/TreeDetailPresenceBlock"));
const WeatherCard = lazy(() => import("@/components/WeatherCard"));
const TreeCheckinButton = lazy(() => import("@/components/TreeCheckinButton"));
const SkystampSeal = lazy(() => import("@/components/SkystampSeal"));
const OfferingQuoteBlock = lazy(() => import("@/components/OfferingQuoteBlock"));
const OfferingSortControls = lazy(() => import("@/components/OfferingSortControls"));
const PhenologyBadge = lazy(() => import("@/components/PhenologyBadge"));
const PhenologyObservationButton = lazy(() => import("@/components/PhenologyObservationButton"));
const PresenceRitual = lazy(() => import("@/components/PresenceRitual"));
const CoWitnessPanel = lazy(() => import("@/components/witness/CoWitnessPanel"));
const WitnessedBadge = lazy(() => import("@/components/witness/WitnessedBadge"));
const TreeRelationshipCard = lazy(() => import("@/components/tree-sections/TreeRelationshipCard"));
const StewardToolsSection = lazy(() => import("@/components/StewardToolsSection"));
const TreeActivityTimeline = lazy(() => import("@/components/TreeActivityTimeline"));
const TreeDiscoveryPaths = lazy(() => import("@/components/tree-sections/TreeDiscoveryPaths"));
const LocationRefinementFlow = lazy(() => import("@/components/LocationRefinementFlow"));
const LocationConfidenceBadge = lazy(() => import("@/components/LocationConfidenceBadge"));
import { useTreeRelationship } from "@/hooks/use-tree-relationship";
import { useTreeEditPermission } from "@/hooks/use-tree-edit-permission";
import TabErrorBoundary from "@/components/TabErrorBoundary";
import { InfluenceTokenProvider } from "@/contexts/InfluenceTokenContext";
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
  useDocumentTitle(tree ? `${tree.name} — ${tree.species}` : "Tree");
  const [loading, setLoading] = useState(true);
  const [addOfferingOpen, setAddOfferingOpen] = useState(false);
  const [gatewayOpen, setGatewayOpen] = useState(false);
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
  const [sectionTab, setSectionTab] = useState<string>(() => {
    const tabParam = searchParams.get("tab");
    return tabParam === "encounters" || tabParam === "offerings" ? tabParam : "overview";
  });
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [greetingCardOpen, setGreetingCardOpen] = useState(false);
  const [contributeSourceOpen, setContributeSourceOpen] = useState(false);
  const [canopyCheckinOpen, setCanopyCheckinOpen] = useState(false);
  const [whisperModalOpen, setWhisperModalOpen] = useState(false);
  const [whisperRippleVisible, setWhisperRippleVisible] = useState(false);
  const [whisperContextLabel, setWhisperContextLabel] = useState<string | null>(null);
  const [availableWhispers, setAvailableWhispers] = useState<TreeWhisper[]>([]);
  const [ecoBelonging, setEcoBelonging] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [presenceOpen, setPresenceOpen] = useState(false);
  const [showLoreWhisper, setShowLoreWhisper] = useState(true);
  const [refinementOpen, setRefinementOpen] = useState(searchParams.get("refine") === "1");
  const [witnessCount, setWitnessCount] = useState(0);
  const witnessSessionId = searchParams.get("witness") || undefined;

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
  const { data: treeContributions = [] } = useTreeContributions(id);
  const { role: editRole, canDirectEdit, loading: editPermLoading, userId: editUserId } = useTreeEditPermission(id);
  const { presenceCompleted, completedToday, recordCompletion } = useTreePresence({
    treeId: id,
    treeSpecies: tree?.species || "",
    userId,
    treeLat: tree?.latitude,
    treeLng: tree?.longitude,
  });
  const presenceCount = useTreePresenceCount(userId, id);
  const treeDetailPresence = useSingleTreePresence(id);
  const { progress: relationship } = useTreeRelationship(id, userId);
  const proximityGate = useTreeProximityGate({
    treeId: id,
    treeLat: tree?.latitude,
    treeLng: tree?.longitude,
    userId,
  });
  const checkinStatus = useTreeCheckinStatus({
    treeId: id,
    userId,
    createdBy: tree?.created_by,
    gateStatus: proximityGate.status,
    graceMs: proximityGate.graceMs,
  });

  // Feed TEOTAG context with tree page data (must be above early returns)
  useTeotagPageContext({
    tree: tree ? {
      id: tree.id,
      name: tree.name,
      species: tree.species ?? undefined,
      latitude: tree.latitude ?? undefined,
      longitude: tree.longitude ?? undefined,
      bloomStatus: bloomStatus?.label ?? undefined,
      offeringCount: offerings.length,
    } : undefined,
  });

  // Check for available whispers at this tree
  useEffect(() => {
    if (!userId || !tree) return;
    checkWhispersAtTree(userId, tree.id, tree.species).then(setAvailableWhispers);
  }, [userId, tree]);

  // Auto-dismiss poetry whisper after 8 seconds
  useEffect(() => {
    if (!tree?.lore_text) return;
    const timer = setTimeout(() => setShowLoreWhisper(false), 8000);
    return () => clearTimeout(timer);
  }, [tree?.lore_text]);

  // Fetch witness count for this tree
  useEffect(() => {
    if (!id) return;
    supabase
      .from("witness_sessions" as any)
      .select("id", { count: "exact", head: true })
      .eq("tree_id", id)
      .eq("status", "witnessed")
      .then(({ count }) => setWitnessCount(count || 0));
  }, [id]);

  useEffect(() => {
    const handler = () => {
      setWhisperRippleVisible(true);
      setTimeout(() => setWhisperRippleVisible(false), 2000);
    };
    window.addEventListener("whisper-sent", handler);
    return () => window.removeEventListener("whisper-sent", handler);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id ?? null));
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
        .maybeSingle();
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

    // Record digital encounter (fire-and-forget, lightweight)
    const recordPageView = async () => {
      const sessionId = sessionStorage.getItem("s33d_session") || (() => {
        const sid = crypto.randomUUID();
        sessionStorage.setItem("s33d_session", sid);
        return sid;
      })();
      await supabase.from("tree_page_views" as any).insert({
        tree_id: id,
        user_id: userId || null,
        session_id: sessionId,
      } as any);
    };
    recordPageView();

    Promise.all([fetchTree(), fetchMeetings(), fetchBirdsongCount(), fetchEcoBelonging()]).then(() => setLoading(false));

    // Realtime subscription for photo processing updates
    const channel = supabase
      .channel(`tree-photo-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trees', filter: `id=eq.${id}` },
        (payload) => {
          const updated = payload.new as any;
          if (updated.photo_status) {
            setTree((prev) => prev ? { ...prev, ...updated } : prev);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Handle merged tree redirect
  if (!loading && tree && (tree as any).merged_into_tree_id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-16 text-center space-y-6 max-w-md"
        >
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-primary/10 border border-primary/20">
            <TreeDeciduous className="h-8 w-8 text-primary/60" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-lg text-foreground/90">Records Merged</h2>
            <p className="text-sm text-muted-foreground font-serif">
              This Ancient Friend has been merged with another record to maintain an accurate atlas.
            </p>
          </div>
          <Link
            to={`/tree/${(tree as any).merged_into_tree_id}`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-serif text-sm tracking-wide transition-colors"
          >
            <TreeDeciduous className="h-4 w-4" />
            Visit the unified record →
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md"
        >
          <div className="text-4xl mb-2">🌿</div>
          <p className="text-muted-foreground font-serif">
            This Ancient Friend could not be found — it may have moved to another part of the forest.
          </p>
          <Link to="/map" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-serif text-sm transition-colors">
            <Map className="h-4 w-4" />
            Return to the Map
          </Link>
        </motion.div>
      </div>
    );
  }

  // getOfferingsByType provided by useOfferings hook

  const handleAddOffering = (type: OfferingType) => {
    if (!proximityGate.isUnlocked) return;
    setSelectedType(type);
    setAddOfferingOpen(true);
  };

  const openOfferingGateway = () => {
    if (!proximityGate.isUnlocked) return;
    setGatewayOpen(true);
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

      {/* Poetry Whisper — lore_text fade-in */}
      <AnimatePresence>
        {tree.lore_text && showLoreWhisper && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-20 left-0 right-0 z-30 flex justify-center pointer-events-none px-4"
          >
            <div
              className="max-w-sm rounded-xl px-5 py-3 backdrop-blur-md border text-center pointer-events-auto"
              style={{
                background: 'hsl(var(--card) / 0.85)',
                borderColor: 'hsl(var(--border) / 0.3)',
              }}
            >
              <p className="text-xs font-serif italic text-foreground/70 leading-relaxed">
                "{tree.lore_text.length > 140 ? tree.lore_text.slice(0, 140).trim() + '…' : tree.lore_text}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 pb-20 max-w-4xl overflow-x-hidden" style={{ paddingTop: 'var(--content-top)' }}>
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
          onMakeOffering={openOfferingGateway}
          onAddPhoto={() => handleAddOffering("photo")}
          onAddSong={() => handleAddOffering("song")}
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
            if (!proximityGate.isUnlocked) return;
            setWhisperContextLabel("Opened from tree profile hero");
            setWhisperModalOpen(true);
          }}
          onShare={() => setShareCardOpen(true)}
          onGreetingCard={() => setGreetingCardOpen(true)}
          ecoBelonging={ecoBelonging}
          onNavigateHive={(slug) => navigate(`/hive/${slug}`)}
          presenceLocked={!proximityGate.isUnlocked && proximityGate.status !== "checking"}
          graceLabel={proximityGate.graceLabel}
          checkinLight={checkinStatus.light}
          onRetryPhoto={async () => {
            // Re-fetch the tree to get current photo_original_url, then re-trigger processing
            const { data: freshTree } = await supabase.from("trees").select("*").eq("id", tree.id).single();
            if (freshTree) setTree(freshTree);
          }}
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

        {tree && (
          <GreetingCardDialog
            open={greetingCardOpen}
            onOpenChange={setGreetingCardOpen}
            tree={{
              name: tree.name,
              species: tree.species,
              imageUrl: getOfferingsByType("photo")[0]?.media_url || null,
              location: [tree.state, tree.nation].filter(Boolean).join(", ") || null,
            }}
            whispers={availableWhispers.map((w) => w.message_content)}
          />
        )}

        {/* ══════ Primary Check-In Prompt + Presence Signal ══════ */}
        {userId && tree && (
          <Suspense fallback={null}>
            <TreeDetailPresenceBlock
              tree={tree}
              proximityGate={proximityGate}
              meetingStatus={meetingStatus}
              checkinStats={checkinStats}
              onCheckin={() => setCanopyCheckinOpen(true)}
              treePresence={treeDetailPresence}
              availableWhispers={availableWhispers}
              hasHearts={false}
              onGoToEncounters={() => setSectionTab("encounters")}
            />
          </Suspense>
        )}

        {/* ══════ Top-Level Section Tabs ══════ */}
        <Tabs value={sectionTab} onValueChange={setSectionTab} className="w-full mt-2">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/20 border border-border/40 mb-6 h-10 rounded-lg">
            <TabsTrigger value="overview" className="font-serif text-xs tracking-wider data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Overview
            </TabsTrigger>
            <TabsTrigger value="encounters" className="font-serif text-xs tracking-wider data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5">
              Encounters
              {checkinStats && (checkinStats.totalVisits ?? 0) > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-mono">{checkinStats.totalVisits}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="offerings" className="font-serif text-xs tracking-wider data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5">
              Offerings
              {(offerings.length + birdsongCount) > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-mono">{offerings.length + birdsongCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ── */}
          <TabsContent value="overview" className="space-y-8">
            {/* ═══ PRIMARY ZONE — Identity, Story, Connection ═══ */}

            {/* Proximity Gate — shown only when locked */}
            {!proximityGate.isUnlocked && proximityGate.status !== "checking" && proximityGate.status !== "unlocked_grace" && (
              <Suspense fallback={null}>
                <ProximityGateMessage
                  status={proximityGate.status}
                  graceLabel={proximityGate.graceLabel}
                  treeName={tree?.name}
                />
              </Suspense>
            )}

            {/* Collective Activity Stats */}
            <Suspense fallback={null}>
              <TreeActivityStats treeId={id!} />
            </Suspense>

            {/* Relationship Journey Card */}
            {userId && relationship && (
              <Suspense fallback={null}>
                <TreeRelationshipCard
                  progress={relationship}
                  treeName={tree.name}
                  onCoWitness={() => {}}
                  onMakeOffering={openOfferingGateway}
                />
              </Suspense>
            )}

            {/* Story + Structured Data */}
            <TreeStorySection tree={tree} ecoBelonging={ecoBelonging} />

            {/* Photo Gallery */}
            {photoOfferings.length > 0 && (
              <PhotoGrid offerings={photoOfferings} onImageClick={(i) => setLightboxIndex(i)} />
            )}

            {/* Offerings Preview */}
            <TreeOfferingsPreview
              offerings={offerings}
              onAddOffering={openOfferingGateway}
              treeName={tree.name}
            />

            {/* Recent Activity Timeline */}
            {id && (
              <Suspense fallback={null}>
                <TreeActivityTimeline treeId={id} limit={5} />
              </Suspense>
            )}

            {/* Map Journey Anchor */}
            <TreeMapJourneyAnchor
              treeId={tree.id}
              treeName={tree.name}
              lat={tree.latitude}
              lng={tree.longitude}
              w3w={tree.what3words}
            />

            {/* Nearby Ancient Friends */}
            <Suspense fallback={null}>
              <NearbyTreesExplorer
                treeId={tree.id}
                lat={tree.latitude}
                lng={tree.longitude}
                species={tree.species}
              />
            </Suspense>

            {/* ═══ SECONDARY ZONE — Collapsed by default ═══ */}
            <Collapsible open={secondaryOpen} onOpenChange={setSecondaryOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-3 py-3 group cursor-pointer">
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent)" }} />
                  <span className="text-sm font-serif text-muted-foreground tracking-wider uppercase flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Layers className="h-3.5 w-3.5" />
                    More about this tree
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${secondaryOpen ? "rotate-180" : ""}`} />
                  </span>
                  <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8 pt-4"
                >
                  {/* Seasonal Moment */}
                  <SeasonalMomentPanel
                    onPromptSelect={(prompt) => {
                      if (prompt.suggestedType) {
                        setActiveTab(prompt.suggestedType);
                        handleAddOffering(prompt.suggestedType as OfferingType);
                      } else {
                        openOfferingGateway();
                      }
                    }}
                  />

                  {/* Universal Contribution Entry Point */}
                  <AddContributionPanel treeId={id!} treeName={tree.name} />

                  {/* Community Contributions Feed */}
                  <ContributionFeed contributions={treeContributions} treeId={id!} />

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

                  {/* Journey Invitations */}
                  <TreeJourneyInvitations
                    species={tree.species}
                    treeId={id!}
                    treeName={tree.name}
                    onAddOffering={openOfferingGateway}
                  />

                  {/* Discovery Paths — country, hive, bioregion */}
                  <Suspense fallback={null}>
                    <TreeDiscoveryPaths
                      species={tree.species}
                      country={tree.nation}
                      ecoBelonging={ecoBelonging}
                    />
                  </Suspense>

                  {/* Hive Connections */}
                  <TreeHiveConnections species={tree.species} ecoBelonging={ecoBelonging} />

                  {/* Heart Rewards */}
                  <TreeHeartRewards />

                  <div className="vine-divider" />

                  {/* Weather */}
                  <WeatherCard latitude={tree.latitude} longitude={tree.longitude} />

                  {/* Tree Heart Pool */}
                  <TreeHeartPool treeId={id!} userId={userId} />

                  {/* Blooming Clock */}
                  {tree?.species && (
                    <BloomingClock species={tree.species} region={tree.nation} />
                  )}

                  {/* Species Attestation */}
                  <SpeciesAttestation treeId={id!} treeSpecies={tree.species} userId={userId} />

                  {/* Grove Membership */}
                  <Suspense fallback={null}>
                    <GroveContext treeId={id!} treeLat={tree.latitude} treeLng={tree.longitude} treeSpecies={tree.species} />
                  </Suspense>

                  {/* Forest Pulse */}
                  <Suspense fallback={null}>
                    <TreePulseIndicator treeId={id!} />
                  </Suspense>

                  {/* Mycelial Pathways */}
                  <Suspense fallback={null}>
                    <PathwayContext treeId={id!} treeLat={tree.latitude} treeLng={tree.longitude} />
                  </Suspense>

                  {/* Sources */}
                  <TreeSourcesDisplay
                    verified={verifiedSources}
                    pending={pendingSources}
                    loading={sourcesLoading}
                    onContribute={() => setContributeSourceOpen(true)}
                  />

                  {/* Steward Tools */}
                  <Suspense fallback={null}>
                    <StewardToolsSection
                      tree={tree}
                      treeId={id!}
                      userId={editUserId}
                      role={editRole}
                      canDirectEdit={canDirectEdit}
                      loading={editPermLoading}
                      onProposeEdit={() => setProposeEditOpen(true)}
                      onTreeUpdated={(updated) => setTree(updated)}
                    />
                  </Suspense>

                  {/* Stewardship Log */}
                  <TreeStewardshipLog treeId={id!} treeName={tree.name} userId={userId} />

                  {/* Tree Guardians */}
                  <TreeGuardianRoles treeId={id!} />

                  {/* Stewardship Leaderboard */}
                  <StewardshipLeaderboard treeId={id!} />
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* ── ENCOUNTERS TAB ── */}
          <TabsContent value="encounters" className="space-y-6">
            <TabErrorBoundary tabName="Encounters">
            <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary/50" /></div>}>

            {/* Encounters intro — always visible */}
            <div className="text-center py-4">
              <h3 className="text-lg font-serif text-foreground/90 tracking-wide mb-1">Encounters</h3>
              <p className="text-xs text-muted-foreground font-serif">Moments of being with this Ancient Friend</p>
            </div>

            {/* Encounter Cluster */}
            <EncounterClusterPanel tree={tree} />

            {/* Tree Arrival Panel — unified staggered reveal */}
            {userId && tree && (
              <Suspense fallback={null}>
                <TreeArrivalPanel
                  treeId={tree.id}
                  treeName={tree.name}
                  treeSpecies={tree.species || ""}
                  userId={userId}
                  isNearby={proximityGate.status === "unlocked_present" || proximityGate.status === "unlocked_grace"}
                  isCheckedIn={meetingStatus === "active" || meetingStatus === "expiring"}
                  onCheckIn={() => setCanopyCheckinOpen(true)}
                  onWhisperCollected={() => {
                    checkWhispersAtTree(userId, tree.id, tree.species).then(setAvailableWhispers);
                  }}
                />
              </Suspense>
            )}

            {!userId && (
              <Card className="bg-secondary/20 border-border/30">
                <CardContent className="p-6 text-center space-y-2">
                  <TreeDeciduous className="w-8 h-8 text-primary/40 mx-auto" />
                  <p className="text-sm font-serif text-muted-foreground">
                    Sign in to record encounters, check in, and begin your relationship with this tree.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 333s Presence Ritual — deeper layer of encounter */}
            {userId && (
              <Card className="bg-card/60 backdrop-blur border-primary/20">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <TreeDeciduous className="w-5 h-5 text-primary/60" />
                    <div>
                      <p className="font-serif text-sm text-foreground">Deepen your presence</p>
                      <p className="text-xs text-muted-foreground font-serif">
                        {presenceCompleted
                          ? completedToday ? `✓ Presence completed today · ${presenceCount} total` : `✓ Presence held ${presenceCount} time${presenceCount !== 1 ? "s" : ""}`
                          : "333 seconds of stillness — be fully here with this tree"}
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
                    {completedToday ? "Done Today" : presenceCompleted ? "Re-enter" : "Begin"}
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

            {/* Co-Witness Scan */}
            {userId && tree && (
              <Suspense fallback={null}>
                <CoWitnessPanel
                  treeId={id!}
                  treeName={tree.name}
                  userId={userId}
                />
              </Suspense>
            )}

            {/* Location Refinement */}
            {userId && tree && tree.latitude != null && tree.longitude != null && (
              <Suspense fallback={null}>
                <div id="refine-location-section" ref={(el) => {
                  if (el && searchParams.get("refine") === "1" && !refinementOpen) {
                    setTimeout(() => {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                      setRefinementOpen(true);
                    }, 400);
                  }
                }}>
                  {refinementOpen ? (
                    <LocationRefinementFlow
                      treeId={tree.id}
                      treeName={tree.name}
                      treeLat={Number(tree.latitude)}
                      treeLng={Number(tree.longitude)}
                      userId={userId}
                      onComplete={() => setRefinementOpen(false)}
                      onDismiss={() => setRefinementOpen(false)}
                    />
                  ) : (
                    <Card className={`bg-card/60 backdrop-blur border-border/40 transition-all duration-700 ${searchParams.get("refine") === "1" ? "ring-2 ring-primary/40 animate-pulse" : ""}`}>
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <MapPin className="w-4 h-4 text-primary/60 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-serif text-sm text-foreground">Refine location</p>
                            <p className="text-xs text-muted-foreground font-serif truncate">
                              Stand by the tree and place the pin as accurately as you can
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <LocationConfidenceBadge
                            confidence={tree.location_confidence}
                            refinementCount={tree.refinement_count}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="font-serif text-xs"
                            onClick={() => setRefinementOpen(true)}
                          >
                            Refine
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </Suspense>
            )}

            </Suspense>
            </TabErrorBoundary>
          </TabsContent>

          {/* ── OFFERINGS TAB ── */}
          <TabsContent value="offerings" className="space-y-6">
            <TabErrorBoundary tabName="Offerings">
            <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary/50" /></div>}>

            {/* Offerings intro — always visible */}
            <div className="text-center py-4">
              <h3 className="text-lg font-serif text-foreground/90 tracking-wide mb-1">Offerings</h3>
              <p className="text-xs text-muted-foreground font-serif">Songs, photos, poems, stories, seeds, and whispers placed at this Ancient Friend</p>
            </div>

            {/* Auth / meeting gate — subtle inline hint, not a blocking wall */}
            {!userId && (
              <div className="p-3 rounded-lg border border-border/30 bg-secondary/10 text-center">
                <p className="text-xs text-muted-foreground font-serif">
                  Sign in to leave offerings at this Ancient Friend.
                </p>
              </div>
            )}

            {/* Seed Planter (moved from Encounters) */}
            <SeedPlanter
              treeId={id!}
              treeLat={tree.latitude}
              treeLng={tree.longitude}
              userId={userId}
              treeSpecies={tree.species}
            />

            {/* Whispers (moved from Encounters) */}
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

            {/* Empty state — only when truly no offerings, no birdsong */}
            {offerings.length === 0 && birdsongCount === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-2" />
                <p className="text-sm font-serif text-muted-foreground">No offerings placed here yet.</p>
                <p className="text-xs text-muted-foreground/60 font-serif mt-1">Be the first to leave something meaningful.</p>
                {userId && (meetingStatus === "active" || meetingStatus === "expiring") && (
                  <Button
                    size="sm"
                    onClick={openOfferingGateway}
                    className="mt-4 font-serif tracking-wider text-xs gap-1.5"
                  >
                    <Sparkles className="h-3 w-3" />
                    Leave the first offering
                  </Button>
                )}
              </div>
            ) : (
              <>
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
                  <TabsList className="w-full justify-start bg-secondary/30 border border-border/50 mb-6 flex-wrap h-auto gap-1 p-1.5 rounded-lg overflow-x-auto max-w-[calc(100vw-2rem)]">
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

                  {(Object.keys(offeringLabels) as OfferingType[]).map((type) => {
                    const canAdd = meetingStatus === "active" || meetingStatus === "expiring";
                    return (
                      <TabsContent key={type} value={type}>
                        <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
                          <h3 className="text-lg font-serif text-foreground/90 tracking-wide">
                            {offeringLabels[type]}
                          </h3>
                          <div className="flex items-center gap-2">
                            <OfferingSortControls value={sortMode} onChange={setSortMode} />
                            {canAdd ? (
                              <Button
                                size="sm"
                                onClick={() => handleAddOffering(type)}
                                className="font-serif tracking-wider text-xs gap-1.5"
                              >
                                <Sparkles className="h-3 w-3" />
                                Add {offeringLabels[type].slice(0, -1)}
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 font-serif italic">
                                Meet this tree to unlock
                              </span>
                            )}
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
                    );
                  })}

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
              </>
            )}

            {/* Anchored Memories (moved from Encounters — these are offerings) */}
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
            </Suspense>
            </TabErrorBoundary>
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

      <Suspense fallback={null}>
        <OfferingGateway
          open={gatewayOpen}
          onClose={() => setGatewayOpen(false)}
          onSelect={(type) => {
            // Map gateway types to offering types (gratitude/intention → story)
            const typeMap: Record<string, OfferingType> = {
              photo: "photo", song: "song", book: "book", story: "story",
              poem: "poem", voice: "voice", nft: "nft",
              quote: "story", wish: "poem", gratitude: "story", intention: "story",
              seasonal_observation: "story", encounter: "story", data: "story",
            };
            const offeringType = typeMap[type] || "story";
            setSelectedType(offeringType);
            // Open flow immediately, then close gateway — eliminates flash
            setAddOfferingOpen(true);
            requestAnimationFrame(() => setGatewayOpen(false));
          }}
          treeName={tree?.name}
        />
      </Suspense>

      <AddOfferingDialog
        open={addOfferingOpen}
        onOpenChange={setAddOfferingOpen}
        treeId={id!}
        treeSpecies={tree?.species}
        treeName={tree?.name}
        type={selectedType}
        meetingId={activeMeeting?.id}
        onChangeType={() => {
          // Open gateway first, then close dialog in next frame — no flash
          setGatewayOpen(true);
          requestAnimationFrame(() => setAddOfferingOpen(false));
        }}
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
        onCheckinComplete={() => { refetchCheckins(); proximityGate.recordVisitNow(); }}
      />

      {tree && (
        <SendWhisperModal
          open={whisperModalOpen}
          onOpenChange={(open) => {
            setWhisperModalOpen(open);
            if (!open) {
              setWhisperContextLabel(null);
            }
          }}
          treeId={tree.id}
          treeName={tree.name}
          treeSpecies={tree.species}
          contextLabel={whisperContextLabel || undefined}
        />
      )}

      {/* Whisper ripple celebration — triggered by successful send event */}
      <WhisperRipple visible={whisperRippleVisible} />

      {/* Why This Matters — offerings explanation for first 3 visits */}
      <WhyThisMatters
        id="tree-offerings-why"
        message="Offerings are gifts to a tree — a song, a story, a photo, a reflection. They become part of the tree's living record and earn you S33D Hearts."
        delay={4000}
      />

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
        treeId={id}
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

// Sub-components extracted to src/components/tree-detail/
// PhotoGrid, Lightbox, BookShelf, SealedByLabel, shareOffering, EmptyOffering
// are imported at the top of this file.

export default TreeDetailPage;
