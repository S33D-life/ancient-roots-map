import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SeedPlanter from "@/components/SeedPlanter";
import TreeHeartPool from "@/components/TreeHeartPool";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, MapPin, Music, Camera, MessageSquare, FileText,
  Loader2, Sparkles, X, ChevronLeft, ChevronRight, ExternalLink, Share2, Map, Mic, BookOpen, Bird,
} from "lucide-react";
import AddOfferingDialog from "@/components/AddOfferingDialog";
import ProposeEditDrawer from "@/components/ProposeEditDrawer";
import MeetingTimer, { type Meeting, type TimerStatus } from "@/components/MeetingTimer";
import OfferingHistory from "@/components/OfferingHistory";
import BirdsongOfferingFlow from "@/components/BirdsongOfferingFlow";
import BirdsongTab from "@/components/BirdsongTab";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import type { Database } from "@/integrations/supabase/types";

type Tree = Database["public"]["Tables"]["trees"]["Row"];
type Offering = Database["public"]["Tables"]["offerings"]["Row"];
type OfferingType = Database["public"]["Enums"]["offering_type"];

const offeringIcons: Record<OfferingType, React.ReactNode> = {
  photo: <Camera className="h-4 w-4" />,
  song: <Music className="h-4 w-4" />,
  poem: <FileText className="h-4 w-4" />,
  story: <MessageSquare className="h-4 w-4" />,
  nft: <Sparkles className="h-4 w-4" />,
  voice: <Mic className="h-4 w-4" />,
  book: <BookOpen className="h-4 w-4" />,
};

const offeringLabels: Record<OfferingType, string> = {
  photo: "Memories",
  song: "Songs",
  poem: "Poems",
  story: "Musings",
  nft: "NFTs",
  voice: "Voices",
  book: "Books",
};

const TreeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree] = useState<Tree | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
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

    const fetchOfferings = async () => {
      const { data, error } = await supabase
        .from("offerings")
        .select("*")
        .eq("tree_id", id)
        .order("created_at", { ascending: false });
      if (error) console.error("Error fetching offerings:", error);
      else setOfferings(data || []);
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

    Promise.all([fetchTree(), fetchOfferings(), fetchMeetings(), fetchBirdsongCount()]).then(() => setLoading(false));

    const channel = supabase
      .channel(`offerings-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offerings", filter: `tree_id=eq.${id}` },
        () => fetchOfferings()
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

  const getOfferingsByType = (type: OfferingType) =>
    offerings.filter((o) => o.type === type);

  const handleAddOffering = (type: OfferingType) => {
    setSelectedType(type);
    setAddOfferingOpen(true);
  };

  const photoOfferings = getOfferingsByType("photo").filter((o) => o.media_url);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          to="/map"
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 font-serif text-sm tracking-wide transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map
        </Link>

        {/* Tree Info Card */}
        <div className="relative mb-10 rounded-xl border border-border overflow-hidden bg-card/60 backdrop-blur">
          {/* Decorative top accent */}
          <div
            className="h-1"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4), transparent)",
            }}
          />
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-wide">
                  {tree.name}
                </h1>
                <p className="text-muted-foreground italic font-serif text-lg mt-1">
                  {tree.species}
                  {(() => {
                    const hive = getHiveForSpecies(tree.species);
                    if (!hive) return null;
                    return (
                      <button
                        onClick={() => navigate(`/hive/${hive.slug}`)}
                        className="ml-2 inline-flex items-center gap-1 text-xs font-serif px-2 py-0.5 rounded-full border transition-colors hover:text-primary"
                        style={{ borderColor: `hsl(${hive.accentHsl} / 0.4)`, color: `hsl(${hive.accentHsl})` }}
                      >
                        {hive.icon} {hive.displayName}
                      </button>
                    );
                  })()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 font-serif text-xs gap-1.5"
                  onClick={() => setProposeEditOpen(true)}
                >
                  <FileText className="h-3.5 w-3.5" /> Propose Edit
                </Button>
                {(tree.latitude || tree.what3words) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 font-serif text-xs gap-1.5"
                    onClick={() => {
                      if (tree.latitude && tree.longitude) {
                        navigate(`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=16`);
                      } else if (tree.what3words) {
                        navigate(`/map?w3w=${tree.what3words}`);
                      }
                    }}
                  >
                    <Map className="h-3.5 w-3.5" /> View on Map
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async () => {
                    const shareData = {
                      title: tree.name,
                      text: `${tree.name} — a ${tree.species} on the Ancient Friends Map`,
                      url: window.location.href,
                    };
                    try {
                      if (navigator.share) {
                        await navigator.share(shareData);
                      } else {
                        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                        const { toast } = await import("sonner");
                        toast.success("Link copied to clipboard!");
                      }
                    } catch (e) {
                      if ((e as Error).name !== 'AbortError') {
                        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                        const { toast } = await import("sonner");
                        toast.success("Link copied to clipboard!");
                      }
                    }
                  }}
                  title="Share this tree"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {tree.grove_scale && (
                  <Badge
                    variant="outline"
                    className="border-primary/50 text-primary font-serif text-xs tracking-widest uppercase"
                  >
                    {tree.grove_scale.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm mt-4 mb-4">
              <MapPin className="h-4 w-4 text-primary/70" />
              <span className="font-mono text-muted-foreground tracking-wider">
                {tree.what3words}
              </span>
            </div>

            {tree.description && (
              <div className="border-l-2 border-primary/30 pl-4 my-4">
                <p className={`text-foreground/80 font-serif leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
                  {tree.description}
                </p>
                {tree.description.length > 150 && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="text-primary/70 hover:text-primary text-sm font-serif mt-1 transition-colors"
                  >
                    {descExpanded ? 'Read less' : 'Read more...'}
                  </button>
                )}
              </div>
            )}

            {/* Collapsible metadata details */}
            {(tree.nation || tree.state || tree.bioregion || tree.estimated_age) && (
              <div className="mt-4">
                <button
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-serif transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${detailsOpen ? 'rotate-180' : ''}`} />
                  {detailsOpen ? 'Hide details' : 'Show details'}
                </button>
                {detailsOpen && (
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-3 font-serif animate-fade-in">
                    {tree.nation && <span className="bg-secondary/50 px-3 py-1 rounded-full">🌍 {tree.nation}</span>}
                    {tree.state && <span className="bg-secondary/50 px-3 py-1 rounded-full">📍 {tree.state}</span>}
                    {tree.bioregion && <span className="bg-secondary/50 px-3 py-1 rounded-full">🌿 {tree.bioregion}</span>}
                    {tree.estimated_age && (
                      <span className="bg-secondary/50 px-3 py-1 rounded-full">🕰️ ~{tree.estimated_age} years</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Meeting Timer */}
        <div className="mb-6">
          <MeetingTimer
            treeId={id!}
            treeName={tree.name}
            userId={userId}
            onMeetingChange={setActiveMeeting}
            onStatusChange={setMeetingStatus}
          />
        </div>

        {/* Seed Economy */}
        <div className="mb-6">
          <SeedPlanter
            treeId={id!}
            treeLat={tree.latitude}
            treeLng={tree.longitude}
            userId={userId}
          />
        </div>

        {/* Tree Heart Pool */}
        <div className="mb-10">
          <TreeHeartPool treeId={id!} userId={userId} />
        </div>

        {/* Birdsong Offering Button */}
        <div className="mb-6">
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
        </div>

        {/* Offerings Section */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="h-px flex-1"
            style={{
              background: "linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)",
            }}
          />
          <h2 className="text-2xl font-serif text-primary tracking-widest uppercase">
            Offerings
          </h2>
          <div
            className="h-px flex-1"
            style={{
              background: "linear-gradient(270deg, hsl(var(--primary) / 0.4), transparent)",
            }}
          />
        </div>

        {/* Gate: offerings require active/expiring meeting */}
        {userId && meetingStatus !== "active" && meetingStatus !== "expiring" && (
          <div className="mb-6 p-4 rounded-lg border border-border/40 bg-secondary/20 text-center">
            <p className="text-sm text-muted-foreground font-serif">
              {meetingStatus === "expired"
                ? "Your offering window has closed. Meet this Ancient Friend again to open a new 12-hour window."
                : meetingStatus === "none"
                ? "Meet this Ancient Friend to open a 12-hour offering window."
                : "This meeting cannot be used for offerings."}
            </p>
          </div>
        )}

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
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-serif text-foreground/90 tracking-wide">
                  {offeringLabels[type]}
                </h3>
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

              {getOfferingsByType(type).length === 0 ? (
                <EmptyOffering type={type} label={offeringLabels[type]} onAdd={() => handleAddOffering(type)} />
              ) : type === "photo" ? (
                <PhotoGrid
                  offerings={getOfferingsByType(type)}
                  onImageClick={(i) => setLightboxIndex(i)}
                />
              ) : type === "poem" || type === "story" ? (
                <motion.div className="space-y-4" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
                  {getOfferingsByType(type).map((offering) => (
                    <motion.div key={offering.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.35, ease: "easeOut" }}>
                      <LiteraryCard offering={offering} type={type} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : type === "song" ? (
                <motion.div className="space-y-4" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
                  {getOfferingsByType(type).map((offering) => (
                    <motion.div key={offering.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.35, ease: "easeOut" }}>
                      <SongCard offering={offering} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : type === "book" ? (
                <BookShelf offerings={getOfferingsByType(type)} />
              ) : (
                <motion.div className="grid gap-4 md:grid-cols-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
                  {getOfferingsByType(type).map((offering) => (
                    <motion.div key={offering.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.35, ease: "easeOut" }}>
                      <NftCard offering={offering} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          ))}

          <TabsContent value="birdsong">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-serif text-foreground/90 tracking-wide">Birdsong</h3>
              <Button
                size="sm"
                onClick={() => setBirdsongOpen(true)}
                className="font-serif tracking-wider text-xs gap-1.5"
              >
                <Bird className="h-3 w-3" />
                Add Birdsong
              </Button>
            </div>
            <BirdsongTab treeId={id!} />
          </TabsContent>
        </Tabs>

        {/* Birdsong Offering Flow */}
        {tree && (
          <BirdsongOfferingFlow
            treeId={id!}
            treeName={tree.name}
            treeLat={tree.latitude ? Number(tree.latitude) : null}
            treeLng={tree.longitude ? Number(tree.longitude) : null}
            open={birdsongOpen}
            onOpenChange={setBirdsongOpen}
            onOfferingSaved={() => setBirdsongCount((c) => c + 1)}
          />
        )}

        {/* Offering History — grouped by meeting */}
        {userId && allMeetings.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)" }}
              />
              <h2 className="text-xl font-serif text-primary tracking-widest uppercase">
                Offering History
              </h2>
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.4), transparent)" }}
              />
            </div>
            <OfferingHistory offerings={offerings} meetings={allMeetings} />
          </div>
        )}
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
        type={selectedType}
        meetingId={activeMeeting?.id}
      />

      <ProposeEditDrawer
        open={proposeEditOpen}
        onOpenChange={setProposeEditOpen}
        tree={tree}
      />
    </div>
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
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

const LiteraryCard = ({ offering, type }: { offering: Offering; type: OfferingType }) => (
  <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden">
    <div
      className="h-0.5"
      style={{
        background:
          type === "poem"
            ? "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)"
            : "linear-gradient(90deg, transparent, hsl(var(--accent) / 0.3), transparent)",
      }}
    />
    <CardContent className="p-5 md:p-6">
      <h4 className="font-serif text-lg text-primary mb-3 tracking-wide">{offering.title}</h4>
      {offering.content && (
        <div
          className={`font-serif leading-relaxed text-foreground/85 ${
            type === "poem"
              ? "whitespace-pre-wrap text-center italic border-l-0"
              : "whitespace-pre-wrap border-l-2 border-primary/20 pl-4"
          }`}
        >
          {offering.content}
        </div>
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
        </div>
      </div>
    </CardContent>
  </Card>
);

const SongCard = ({ offering }: { offering: Offering }) => (
  <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <Music className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif text-lg text-primary tracking-wide">{offering.title}</h4>
          {offering.content && (
            <p className="text-sm text-foreground/70 font-serif mt-1">{offering.content}</p>
          )}
          {offering.media_url && (
            <audio controls className="w-full mt-3 rounded-lg" style={{ height: 36 }}>
              <source src={offering.media_url} />
            </audio>
          )}
          <div className="flex items-center flex-wrap gap-3 mt-3">
            <p className="text-[10px] text-muted-foreground/60 font-serif tracking-widest uppercase">
              {new Date(offering.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {offering.nft_link && offering.nft_link.includes("apple.com") && (
              <a
                href={offering.nft_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary font-serif tracking-wider"
              >
                <ExternalLink className="h-3 w-3" />
                Apple Music
              </a>
            )}
            <button
              onClick={() => shareOffering(offering)}
              className="text-muted-foreground/60 hover:text-primary transition-colors"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <SealedByLabel staff={offering.sealed_by_staff} />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const NftCard = ({ offering }: { offering: Offering }) => (
  <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden group hover:border-primary/40 transition-colors">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="font-serif text-base text-primary tracking-wide">{offering.title}</h4>
      </div>
      {offering.content && (
        <p className="text-sm text-foreground/70 font-serif">{offering.content}</p>
      )}
      {offering.nft_link && (
        <a
          href={offering.nft_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs font-serif text-primary/80 hover:text-primary underline underline-offset-4 tracking-wider"
        >
          View on marketplace →
        </a>
      )}
      <div className="flex items-center justify-between mt-3">
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
        </div>
      </div>
    </CardContent>
  </Card>
);

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
