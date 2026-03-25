import { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTeotagPageContext } from "@/hooks/use-teotag-page-context";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import EcosystemContextBanner from "@/components/EcosystemContextBanner";
import Header from "@/components/Header";
import HeartwoodBackground from "@/components/HeartwoodBackground";
import StaffQRCode from "@/components/StaffQRCode";
import OptimizedImage from "@/components/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft, TreeDeciduous, ScrollText, Share2, ExternalLink,
  Loader2, Eye, Wand2, MapPin, ChevronLeft, ChevronRight,
  Heart, Calendar, Users, ChevronDown, Milestone, Clock,
  Image as ImageIcon, Music, FileText, Sparkles,
} from "lucide-react";
import {
  getGridStaffs, getSpiralStaffs, getSpeciesStaffCounts,
  getCircleDescription, isContractConfigured, getBaseScanUrl,
} from "@/utils/staffRoomData";
import {
  SPECIES_MAP, getOpenSeaUrl, STAFF_CONTRACT_ADDRESS,
  getMetadataUrl, type SpeciesCode,
} from "@/config/staffContract";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

/* ─── Types ─────────────────────────────────────────────────── */

interface LinkedTree {
  id: string;
  name: string;
  species: string;
  what3words: string | null;
  created_at: string;
}

interface EncounterRecord {
  offeringId: string;
  treeId: string;
  treeName: string;
  treeSpecies: string;
  type: string;
  title: string;
  createdAt: string;
  content: string | null;
}

interface TimelineMilestone {
  date: string;
  label: string;
  icon: React.ReactNode;
  detail?: string;
}

/* ─── Offering type icon helper ─────────────────────────────── */
function offeringIcon(type: string) {
  switch (type) {
    case "photo": return <ImageIcon className="w-3.5 h-3.5" />;
    case "song": return <Music className="w-3.5 h-3.5" />;
    case "poem": case "story": return <FileText className="w-3.5 h-3.5" />;
    case "nft": return <Sparkles className="w-3.5 h-3.5" />;
    default: return <ScrollText className="w-3.5 h-3.5" />;
  }
}

/* ─── Section divider ───────────────────────────────────────── */
function SectionDivider({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)" }} />
      <h2 className="text-lg font-serif text-primary tracking-widest uppercase flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.4), transparent)" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAFF DETAIL PAGE — Identity Vessel
   ═══════════════════════════════════════════════════════════════ */
export default function StaffDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [linkedTrees, setLinkedTrees] = useState<LinkedTree[]>([]);
  const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [ceremonyLogs, setCeremonyLogs] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"lineage" | "timeline">("lineage");
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);

  /* ── Staff lookup ──────────────────────────────────────────── */
  const allGrid = useMemo(() => getGridStaffs(), []);
  const allSpiral = useMemo(() => getSpiralStaffs(), []);

  const staffIndex = allGrid.findIndex(
    (s) => s.code.toLowerCase() === (code || "").toLowerCase()
  );
  const staff = staffIndex >= 0 ? allGrid[staffIndex] : null;
  const isOrigin = staffIndex >= 0 && staffIndex < 36;
  const spiralData = isOrigin ? allSpiral[staffIndex] : null;

  const prevStaff = staffIndex > 0 ? allGrid[staffIndex - 1] : null;
  const nextStaff = staffIndex >= 0 && staffIndex < allGrid.length - 1 ? allGrid[staffIndex + 1] : null;

  const speciesCode = staff
    ? (staff.code.includes("-") ? staff.code.split("-")[0] : staff.code).toUpperCase()
    : "";
  const counts = useMemo(() => getSpeciesStaffCounts(), []);
  const total = counts[speciesCode] || 1;
  // Feed TEOTAG context with staff data
  useTeotagPageContext(
    staff
      ? { staff: { code: staff.code, staffName: staff.speciesName, species: staff.speciesName } }
      : {},
  );

  /* ── Data fetch: offerings + trees + ceremonies ────────────── */
  useEffect(() => {
    if (!code) return;
    const fetchAll = async () => {
      setLoadingData(true);

      // Fetch all offerings sealed by this staff
      const { data: offeringsData } = await supabase
        .from("offerings")
        .select("id, tree_id, type, title, content, created_at")
        .eq("sealed_by_staff", code)
        .order("created_at", { ascending: true })
        .limit(200);

      if (offeringsData && offeringsData.length > 0) {
        const treeIds = [...new Set(offeringsData.map((d) => d.tree_id))];
        const { data: treesData } = await supabase
          .from("trees")
          .select("id, name, species, what3words, created_at")
          .in("id", treeIds);

        const treeMap = new Map((treesData || []).map((t) => [t.id, t]));
        setLinkedTrees((treesData as LinkedTree[]) || []);

        setEncounters(
          offeringsData.map((o) => {
            const tree = treeMap.get(o.tree_id);
            return {
              offeringId: o.id,
              treeId: o.tree_id,
              treeName: tree?.name || "Unknown Tree",
              treeSpecies: tree?.species || "Unknown",
              type: o.type,
              title: o.title,
              createdAt: o.created_at,
              content: o.content,
            };
          })
        );
      } else {
        setLinkedTrees([]);
        setEncounters([]);
      }

      // Fetch ceremony logs
      const { data: cLogs } = await supabase
        .from("ceremony_logs")
        .select("*")
        .eq("staff_code", code)
        .order("created_at", { ascending: false })
        .limit(10);
      setCeremonyLogs((cLogs as any[]) || []);

      // Fetch owner
      const { data: staffRow } = await supabase
        .from("staffs")
        .select("owner_user_id")
        .eq("id", code)
        .single();
      if (staffRow?.owner_user_id) {
        const { data: profiles } = await supabase
          .rpc("get_safe_profiles", { p_ids: [staffRow.owner_user_id] });
        if (profiles?.[0]?.full_name) setOwnerName(profiles[0].full_name);
      }

      setLoadingData(false);
    };
    fetchAll();
  }, [code]);

  /* ── Derived data ──────────────────────────────────────────── */
  const treeEncounterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    encounters.forEach((e) => {
      counts[e.treeId] = (counts[e.treeId] || 0) + 1;
    });
    return counts;
  }, [encounters]);

  const uniqueSpecies = useMemo(() => {
    return [...new Set(linkedTrees.map((t) => t.species))].sort();
  }, [linkedTrees]);

  const filteredTrees = useMemo(() => {
    if (!speciesFilter) return linkedTrees;
    return linkedTrees.filter((t) => t.species === speciesFilter);
  }, [linkedTrees, speciesFilter]);

  const milestones = useMemo((): TimelineMilestone[] => {
    const ms: TimelineMilestone[] = [];

    // First ceremony
    if (ceremonyLogs.length > 0) {
      const first = ceremonyLogs[ceremonyLogs.length - 1];
      ms.push({
        date: first.created_at,
        label: "Staff Awakened",
        icon: <Wand2 className="w-4 h-4" />,
        detail: first.staff_name ? `Named "${first.staff_name}"` : undefined,
      });
    }

    // Encounter milestones
    const treeIdsSeen = new Set<string>();
    encounters.forEach((e) => {
      if (!treeIdsSeen.has(e.treeId)) {
        treeIdsSeen.add(e.treeId);
        const count = treeIdsSeen.size;
        if (count === 1 || count === 5 || count === 10 || count === 25 || count === 50 || count === 100) {
          ms.push({
            date: e.createdAt,
            label: count === 1 ? "First Ancient Friend" : `${count} Ancient Friends`,
            icon: <TreeDeciduous className="w-4 h-4" />,
            detail: e.treeName,
          });
        }
      }
    });

    // Offering milestones
    [1, 10, 25, 50, 100].forEach((threshold) => {
      if (encounters.length >= threshold) {
        const enc = encounters[threshold - 1];
        ms.push({
          date: enc.createdAt,
          label: threshold === 1 ? "First Offering" : `${threshold} Offerings Sealed`,
          icon: <ScrollText className="w-4 h-4" />,
        });
      }
    });

    return ms.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [encounters, ceremonyLogs]);

  /* ── Share handler ─────────────────────────────────────────── */
  const handleShare = async () => {
    const entity: import("@/utils/shareUtils").ShareEntity = {
      type: "staff",
      id: code || "",
      name: staff?.speciesName,
      species: staff?.speciesName,
    };
    const opts: import("@/utils/shareUtils").ShareOptions = {
      entity,
      caption: `${staff?.speciesName || "A"} Staff — a walking vessel in the Ancient Friends grove.`,
    };
    try {
      if (navigator.share) {
        const { nativeShare } = await import("@/utils/shareUtils");
        await nativeShare(opts);
      } else {
        const { copyShareLink } = await import("@/utils/shareUtils");
        await copyShareLink(opts);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const { copyShareLink } = await import("@/utils/shareUtils");
        await copyShareLink(opts);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  /* ── Not found ─────────────────────────────────────────────── */
  if (!staff) {
    return (
      <div className="min-h-screen relative bg-background">
        <HeartwoodBackground />
        <Header />
        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground mb-2">Staff Not Found</h1>
          <p className="text-muted-foreground font-serif mb-6">
            No staff matches the code "{code}".
          </p>
          <Link to="/library/staff-room" className="text-primary hover:underline font-serif">
            ← Return to Staff Room
          </Link>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER — The Vessel
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen relative bg-background">
      <HeartwoodBackground />
      <Header />

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-20 max-w-3xl">
        {/* ── Navigation ──────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/library/staff-room"
            className="inline-flex items-center text-muted-foreground hover:text-primary font-serif text-sm tracking-wide transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Staff Room
          </Link>
          <div className="flex items-center gap-1">
            {prevStaff ? (
              <Button variant="ghost" size="sm" className="gap-1 font-serif text-xs" onClick={() => navigate(`/staff/${prevStaff.code}`)}>
                <ChevronLeft className="w-4 h-4" /> {prevStaff.code}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled><ChevronLeft className="w-4 h-4" /></Button>
            )}
            <span className="text-xs text-muted-foreground font-mono">{staffIndex + 1}/{allGrid.length}</span>
            {nextStaff ? (
              <Button variant="ghost" size="sm" className="gap-1 font-serif text-xs" onClick={() => navigate(`/staff/${nextStaff.code}`)}>
                {nextStaff.code} <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled><ChevronRight className="w-4 h-4" /></Button>
            )}
          </div>
        </div>


        {/* ════════════════════════════════════════════════════════
           1. VESSEL HEADER
           ════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col items-center text-center">
            {/* Staff visual with aura */}
            <div className="relative mb-6">
              {/* Breathing aura glow */}
              <div
                className="absolute -inset-6 rounded-full motion-safe:animate-[vesselBreathe_6s_ease-in-out_infinite] pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.12), transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
              <div
                className="w-52 md:w-64 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-primary/20 relative"
                style={{ boxShadow: "0 0 50px hsl(var(--primary) / 0.12), 0 20px 40px rgba(0,0,0,0.3)" }}
              >
                <OptimizedImage
                  src={staff.img}
                  alt={`${staff.speciesName} staff vessel`}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Identity */}
            <h1
              className="text-3xl md:text-4xl font-serif text-primary tracking-wide"
              style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.3)" }}
            >
              {staff.speciesName}
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              {staff.code} · Token #{String(staff.tokenId).padStart(3, "0")}
            </p>

            {/* Badges — minimal */}
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {isOrigin && (
                <Badge className="bg-primary/15 text-primary border-primary/30 font-serif text-xs">
                  Origin Spiral #{staffIndex + 1}
                </Badge>
              )}
              {ownerName && (
                <Badge variant="outline" className="font-serif text-xs">
                  Steward: {ownerName}
                </Badge>
              )}
              {!loadingData && (
                <Badge variant="outline" className="font-serif text-xs">
                  {linkedTrees.length} Ancient Friend{linkedTrees.length !== 1 ? "s" : ""} · {encounters.length} Offering{encounters.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {/* Physical metadata for Origin staffs */}
            {spiralData?.length && (
              <p className="text-xs text-muted-foreground mt-2 font-serif italic">
                {spiralData.length} · {spiralData.weight}
              </p>
            )}

            {/* Actions — subtle, not primary */}
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-serif text-muted-foreground hover:text-primary" onClick={handleShare}>
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
              {isContractConfigured() && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-serif text-muted-foreground hover:text-primary"
                  onClick={() => window.open(getBaseScanUrl(staff.tokenId), "_blank")}>
                  <Eye className="w-3.5 h-3.5" /> On-Chain
                </Button>
              )}
              <StaffQRCode staffCode={staff.code} size={80} />
            </div>

            {/* Ecosystem cross-links */}
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <Link
                to="/value-tree?tab=origin-staff"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/30 bg-card/20 text-[10px] font-serif text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                🌳 Value Tree — Origin Staff
              </Link>
              {linkedTrees.length > 0 && (
                <Link
                  to={`/map?treeId=${linkedTrees[0].id}&arrival=tree`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/30 bg-card/20 text-[10px] font-serif text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  🗺 View on Map
                </Link>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── View mode toggle ──────────────────────────────────── */}
        <div className="flex justify-center mb-2">
          <div className="inline-flex rounded-lg p-1" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
            {([
              { mode: "lineage" as const, label: "Lineage", icon: <TreeDeciduous className="w-3.5 h-3.5" /> },
              { mode: "timeline" as const, label: "Path", icon: <Milestone className="w-3.5 h-3.5" /> },
            ]).map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-serif transition-all",
                  viewMode === mode
                    ? "bg-primary/20 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "lineage" ? (
            <motion.div
              key="lineage"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* ════════════════════════════════════════════════════
                 2. LINEAGE — Ancient Friends Thread
                 ════════════════════════════════════════════════════ */}
              <SectionDivider title="Lineage" icon={<TreeDeciduous className="w-4 h-4" />} />

              {/* Species filter */}
              {uniqueSpecies.length > 1 && (
                <div className="flex gap-1.5 flex-wrap mb-4">
                  <button
                    onClick={() => setSpeciesFilter(null)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-serif transition-all",
                      !speciesFilter ? "bg-primary/20 text-primary" : "bg-card/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All ({linkedTrees.length})
                  </button>
                  {uniqueSpecies.map((sp) => (
                    <button
                      key={sp}
                      onClick={() => setSpeciesFilter(sp === speciesFilter ? null : sp)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-serif transition-all",
                        speciesFilter === sp ? "bg-primary/20 text-primary" : "bg-card/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sp} ({linkedTrees.filter((t) => t.species === sp).length})
                    </button>
                  ))}
                </div>
              )}

              {loadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : filteredTrees.length === 0 ? (
                <div className="rounded-xl border border-border/30 bg-card/20 p-10 text-center">
                  <TreeDeciduous className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-serif text-muted-foreground text-sm">
                    This staff has not yet walked among the Ancient Friends.
                  </p>
                  <p className="font-serif text-muted-foreground/50 text-xs mt-1">
                    Seal an offering with this staff to begin its lineage.
                  </p>
                </div>
              ) : (
                /* Bead-chain lineage thread */
                <div className="relative pl-6">
                  {/* Vertical thread line */}
                  <div
                    className="absolute left-[11px] top-2 bottom-2 w-px"
                    style={{ background: "linear-gradient(180deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.1))" }}
                  />

                  <div className="space-y-3">
                    {filteredTrees.map((tree, i) => {
                      const encounterCount = treeEncounterCounts[tree.id] || 0;
                      const treeEncounters = encounters.filter((e) => e.treeId === tree.id);

                      return (
                        <Collapsible key={tree.id}>
                          <div className="relative">
                            {/* Bead dot */}
                            <div
                              className="absolute -left-6 top-3 w-[9px] h-[9px] rounded-full border-2 border-primary/60 bg-background"
                              style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.3)" }}
                            />

                            <CollapsibleTrigger asChild>
                              <div
                                className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-4 cursor-pointer
                                  hover:border-primary/30 hover:bg-card/50 transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <TreeDeciduous className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-serif text-sm text-foreground truncate">{tree.name}</p>
                                    <p className="text-xs text-muted-foreground font-serif italic">{tree.species}</p>
                                  </div>
                                  <div className="text-right shrink-0 flex items-center gap-2">
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                      {encounterCount} breath{encounterCount !== 1 ? "s" : ""}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-data-[state=open]:rotate-180" />
                                  </div>
                                </div>
                                {tree.what3words && (
                                  <p className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1 mt-1.5 ml-13">
                                    <MapPin className="w-2.5 h-2.5" /> {tree.what3words}
                                  </p>
                                )}
                              </div>
                            </CollapsibleTrigger>

                            {/* ════════════════════════════════════════
                               3. BREATH RECORDS — Expandable encounters
                               ════════════════════════════════════════ */}
                            <CollapsibleContent>
                              <div className="mt-1 ml-4 border-l border-border/20 pl-4 space-y-2 py-2">
                                {treeEncounters.map((enc) => (
                                  <div
                                    key={enc.offeringId}
                                    className="rounded-lg p-3 text-xs space-y-1"
                                    style={{ background: "hsl(var(--secondary) / 0.2)", border: "1px solid hsl(var(--border) / 0.2)" }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-foreground/80">
                                        {offeringIcon(enc.type)}
                                        <span className="font-serif capitalize">{enc.type}</span>
                                      </div>
                                      <span className="text-muted-foreground/60 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(enc.createdAt), "d MMM yyyy")}
                                      </span>
                                    </div>
                                    <p className="font-serif text-foreground/70">{enc.title}</p>
                                    {enc.content && (
                                      <p className="text-muted-foreground/60 font-serif italic line-clamp-2 mt-1">
                                        {enc.content}
                                      </p>
                                    )}
                                  </div>
                                ))}

                                {/* Navigate to tree */}
                                <button
                                  onClick={() => navigate(`/tree/${tree.id}`)}
                                  className="text-[11px] text-primary/70 hover:text-primary font-serif flex items-center gap-1 pt-1 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" /> Visit {tree.name}
                                </button>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* ════════════════════════════════════════════════════════
               4. PATH TIMELINE
               ════════════════════════════════════════════════════════ */
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SectionDivider title="Path" icon={<Milestone className="w-4 h-4" />} />

              {loadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : milestones.length === 0 ? (
                <div className="rounded-xl border border-border/30 bg-card/20 p-10 text-center">
                  <Milestone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-serif text-muted-foreground text-sm">
                    No milestones yet — the path begins with the first offering.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6">
                  {/* Vertical path line */}
                  <div
                    className="absolute left-[11px] top-2 bottom-2 w-px"
                    style={{ background: "linear-gradient(180deg, hsl(38 70% 50% / 0.5), hsl(var(--primary) / 0.1))" }}
                  />

                  <div className="space-y-4">
                    {milestones.map((ms, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative"
                      >
                        {/* Milestone dot */}
                        <div
                          className="absolute -left-6 top-3 w-[11px] h-[11px] rounded-full border-2 border-amber-500/70 bg-amber-500/20"
                          style={{ boxShadow: "0 0 10px hsl(38 80% 50% / 0.4)" }}
                        />

                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "linear-gradient(135deg, hsl(38 40% 15% / 0.3), hsl(var(--card) / 0.2))",
                            border: "1px solid hsl(38 50% 40% / 0.2)",
                          }}
                        >
                          <div className="flex items-center gap-2 text-amber-400/80">
                            {ms.icon}
                            <span className="font-serif text-sm">{ms.label}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(ms.date), "d MMMM yyyy")}
                          </p>
                          {ms.detail && (
                            <p className="text-xs text-foreground/50 font-serif italic mt-1">{ms.detail}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Ceremony History (if exists) ─────────────────────── */}
        {ceremonyLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <SectionDivider title="Ceremonies" icon={<Wand2 className="w-4 h-4" />} />
            <div className="space-y-2">
              {ceremonyLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="rounded-lg p-3 text-xs space-y-1"
                  style={{ background: "hsl(var(--secondary) / 0.15)", border: "1px solid hsl(var(--border) / 0.2)" }}
                >
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[10px] capitalize">{log.ceremony_type}</Badge>
                    <span className="text-muted-foreground/60">
                      {format(new Date(log.created_at), "d MMM yyyy")}
                    </span>
                  </div>
                  {log.staff_name && <p className="text-foreground/70 font-serif">{log.staff_name}</p>}
                  {log.cid && (
                    <p className="text-muted-foreground/50 font-mono text-[10px] truncate">CID: {log.cid}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Lore — quiet reflective text ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 mb-8"
        >
          <div className="rounded-xl border border-border/20 bg-card/10 p-6">
            <p className="font-serif text-foreground/40 leading-relaxed text-sm italic text-center">
              The staff remembers every tree it has visited, every offering it has sealed,
              and every grove it has entered. It is not a collectible — it is the walking
              creator's embodied identity, carrying the lineage of the Ancient Friends.
            </p>
          </div>
        </motion.div>

        {/* ── Bottom nav ───────────────────────────────────────── */}
        <div className="flex items-center justify-between py-6 border-t border-border/20">
          {prevStaff ? (
            <Button variant="ghost" size="sm" className="gap-2 font-serif text-xs text-muted-foreground" onClick={() => navigate(`/staff/${prevStaff.code}`)}>
              <ChevronLeft className="w-4 h-4" /> {prevStaff.speciesName}
            </Button>
          ) : <div />}
          {nextStaff ? (
            <Button variant="ghost" size="sm" className="gap-2 font-serif text-xs text-muted-foreground" onClick={() => navigate(`/staff/${nextStaff.code}`)}>
              {nextStaff.speciesName} <ChevronRight className="w-4 h-4" />
            </Button>
          ) : <div />}
        </div>
      </main>

      {/* Breathing aura keyframe */}
      <style>{`
        @keyframes vesselBreathe {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
