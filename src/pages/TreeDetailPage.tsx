import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, MapPin, Music, Camera, MessageSquare, FileText,
  Loader2, Sparkles, X, ChevronLeft, ChevronRight, ExternalLink, Share2,
} from "lucide-react";
import AddOfferingDialog from "@/components/AddOfferingDialog";
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
};

const offeringLabels: Record<OfferingType, string> = {
  photo: "Memories",
  song: "Songs",
  poem: "Poems",
  story: "Musings",
  nft: "NFTs",
};

const TreeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree] = useState<Tree | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOfferingOpen, setAddOfferingOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OfferingType>("photo");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Handle ?add=type query param
  useEffect(() => {
    const addType = searchParams.get("add") as OfferingType | null;
    if (addType && ["photo", "song", "poem", "story", "nft"].includes(addType)) {
      setSelectedType(addType);
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

    Promise.all([fetchTree(), fetchOfferings()]).then(() => setLoading(false));

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
                </p>
              </div>
              <div className="flex items-center gap-2">
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

        <Tabs defaultValue="photo" className="w-full">
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
                  className="font-serif tracking-wider text-xs gap-1.5"
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
        type={selectedType}
      />
    </div>
  );
};

/* ---------- Shared ---------- */

const getStaffImageFromCode = (code: string): string | null => {
  // Code format: "OAK-C1S03" → extract prefix before "-"
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
      {type === "photo" ? "📷" : type === "song" ? "🎵" : type === "poem" ? "📜" : type === "story" ? "✍️" : "✨"}
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
              <SealedByLabel staff={offering.sealed_by_staff} />
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
        <SealedByLabel staff={offering.sealed_by_staff} />
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
        <SealedByLabel staff={offering.sealed_by_staff} />
      </div>
    </CardContent>
  </Card>
);

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
