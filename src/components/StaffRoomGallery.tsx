import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import JourneyBridge from "@/components/JourneyBridge";
import { useNavigate as useRouterNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutGrid, Maximize, List, ChevronLeft, ChevronRight, X,
  Share2, Eye, Heart, TreeDeciduous, ScrollText, ExternalLink,
  Wand2, Filter, Sparkles, Shield, Users, Crown, Compass,
  MapPin, BookOpen,
} from "lucide-react";
import {
  getSpiralStaffs, getGridStaffs, getSpeciesStaffCounts,
  getCircleDescription, isContractConfigured, getBaseScanUrl,
  type SpiralStaff, type GridStaff,
} from "@/utils/staffRoomData";
import { SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";
import IpfsMetadataViewer from "@/components/IpfsMetadataViewer";
import StaffQRCode from "@/components/StaffQRCode";
import CuratorAssignPanel from "@/components/CuratorAssignPanel";
import StaffCeremony from "@/components/StaffCeremony";
import MintingStatusDashboard from "@/components/MintingStatusDashboard";
import OptimizedImage from "@/components/OptimizedImage";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LazyStaffPatronValueCard = lazy(() => import("@/components/economy/StaffPatronValueCard"));
const LazyCeremonialCircle = lazy(() => import("@/components/staff/CeremonialCircle"));
const LazyStaffSpiralNavigator = lazy(() => import("@/components/staff/StaffSpiralNavigator"));
const LazySpiralOfSpecies = lazy(() => import("@/components/staff/SpiralOfSpecies"));
const LazyStaffImpactPanel = lazy(() => import("@/components/staff/StaffImpactPanel"));
const LazyActivityFeed = lazy(() => import("@/components/ActivityFeed"));

type ViewMode = "carousel" | "list" | "gallery" | "fullscreen";
type StaffFilter = "all" | "origin" | "yew" | "oak" | "ash" | "beech" | "holly";

/** Unified staff item for all views */
interface StaffItem {
  index: number;
  tokenId: number;
  code: string;
  speciesName: string;
  image: string;
  isOrigin: boolean;
  circle?: string;
  length?: string;
  weight?: string;
}

function buildStaffItems(): StaffItem[] {
  const spiral = getSpiralStaffs();
  const grid = getGridStaffs();
  return grid.map((g, i) => {
    const originMatch = i < 36 ? spiral[i] : undefined;
    return {
      index: i,
      tokenId: g.tokenId,
      code: g.code,
      speciesName: g.speciesName,
      image: g.img,
      isOrigin: i < 36,
      circle: i >= 36 ? g.code.split("-")[0] : undefined,
      length: originMatch?.length,
      weight: originMatch?.weight,
    };
  });
}

const FILTER_OPTIONS: { value: StaffFilter; label: string }[] = [
  { value: "all", label: "All 144" },
  { value: "origin", label: "Origin Spiral (36)" },
  { value: "yew", label: "Yew Circles" },
  { value: "oak", label: "Oak Circles" },
  { value: "ash", label: "Ash Circle" },
  { value: "beech", label: "Beech Circle" },
  { value: "holly", label: "Holly Circle" },
];

function filterStaffs(items: StaffItem[], filter: StaffFilter): StaffItem[] {
  if (filter === "all") return items;
  if (filter === "origin") return items.filter((s) => s.isOrigin);
  const codeMap: Record<string, string> = {
    yew: "YEW", oak: "OAK", ash: "ASH", beech: "BEE", holly: "HOL",
  };
  const target = codeMap[filter];
  return items.filter((s) => !s.isOrigin && s.code.toUpperCase().startsWith(target));
}

const handleShare = async (title: string, text: string) => {
  const url = `${window.location.origin}/library/staff-room`;
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copied to clipboard!");
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copied to clipboard!");
    }
  }
};

// ── Section Divider ───────────────────────────────────────────────
function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("py-2", className)}>
      <div className="h-px max-w-md mx-auto" style={{ background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.3), transparent)" }} />
    </div>
  );
}

// ── Spiral Mini-Map ──────────────────────────────────────────────
function SpiralMiniMap({ currentIndex, totalOrigin, onSelect }: {
  currentIndex: number;
  totalOrigin: number;
  onSelect: (idx: number) => void;
}) {
  const dots = useMemo(() => {
    const goldenAngle = 137.508;
    const scale = 12;
    return Array.from({ length: totalOrigin }, (_, i) => {
      const angle = i * goldenAngle * (Math.PI / 180);
      const r = scale * Math.sqrt(i + 1);
      return { x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) };
    });
  }, [totalOrigin]);

  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20 md:w-24 md:h-24 opacity-70 hover:opacity-100 transition-opacity">
      <polyline points={dots.map((d) => `${d.x},${d.y}`).join(" ")} fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={i === currentIndex ? 2.5 : 1}
          fill={i === currentIndex ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"}
          className="cursor-pointer transition-all" onClick={() => onSelect(i)} />
      ))}
    </svg>
  );
}

// ── Detail Drawer Content ────────────────────────────────────────
function CeremonyHistory({ staffCode }: { staffCode: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("ceremony_logs" as any).select("*")
        .eq("staff_code", staffCode).order("created_at", { ascending: false }).limit(10);
      setLogs((data as any[]) || []);
      setLoading(false);
    };
    load();
  }, [staffCode]);

  if (loading) return <div className="text-xs text-muted-foreground animate-pulse py-2">Loading ceremony history…</div>;
  if (!logs.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-serif text-muted-foreground uppercase tracking-wider">Ceremony History</h4>
      {logs.map((log: any) => (
        <div key={log.id} className="rounded-lg p-2.5 text-xs space-y-1 bg-secondary/30 border border-border/30">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-[10px] capitalize">{log.ceremony_type}</Badge>
            <span className="text-muted-foreground text-[10px]">
              {new Date(log.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          {log.staff_name && <p className="text-foreground font-serif">{log.staff_name}</p>}
          {log.cid && <p className="text-muted-foreground font-mono truncate" title={log.cid}>CID: {log.cid}</p>}
          {log.anchor_tx_hash && <p className="text-muted-foreground font-mono truncate" title={log.anchor_tx_hash}>Anchor: {log.anchor_tx_hash}</p>}
        </div>
      ))}
    </div>
  );
}

function StaffDetailContent({ staff, onViewOnChain, onViewLegend, onNavigate }: {
  staff: StaffItem;
  onViewOnChain: () => void;
  onViewLegend: () => void;
  onNavigate?: (path: string) => void;
}) {
  const counts = getSpeciesStaffCounts();
  const upperCode = staff.isOrigin ? staff.code : staff.code.split("-")[0];
  const total = counts[upperCode] || 1;

  return (
    <div className="space-y-5">
      {/* Status badge */}
      <div className="flex items-center justify-center gap-2">
        {staff.isOrigin ? (
          <Badge className="bg-primary/15 text-primary border-primary/30 font-serif text-[10px] gap-1 px-2.5 py-1">
            <Crown className="w-3 h-3" /> Founding Spiral · #{staff.index + 1}
          </Badge>
        ) : (
          <Badge variant="outline" className="font-serif text-[10px] gap-1 px-2.5 py-1">
            <Compass className="w-3 h-3" /> Origin Circle · {staff.circle || upperCode}
          </Badge>
        )}
      </div>

      {/* Image */}
      <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-border/30 shadow-lg">
        <img src={staff.image} alt={`${staff.speciesName} staff`} className="w-full h-full object-cover" />
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-sm">
        <Row label="Code" value={<span className="font-mono text-xs">{staff.code}</span>} />
        <Row label="Species" value={staff.speciesName} />
        <Row label="Token" value={`#${String(staff.tokenId).padStart(3, "0")}`} />
        {staff.length && <Row label="Length" value={staff.length} />}
        {staff.weight && <Row label="Weight" value={staff.weight} />}
        <Row label="Collection" value={`${total} staff${total > 1 ? "s" : ""}`} />
        <Row label="Circles" value={getCircleDescription(upperCode)} />
      </div>

      {/* Lore */}
      <p className="text-xs text-muted-foreground italic leading-relaxed">
        {staff.isOrigin
          ? `The ${staff.speciesName} staff — position #${staff.index + 1} on the founding spiral. Hand-crafted from fallen wood, each staff carries the spirit of its species.`
          : `Circle staff ${staff.code} — one of ${total} ${staff.speciesName} staffs in the Ancient Friends collection.`}
      </p>

      {/* ═══ Connection Links — deep links into the wider ecosystem ═══ */}
      <div
        className="rounded-xl border border-border/20 p-3 space-y-2"
        style={{ background: "hsl(var(--card) / 0.4)" }}
      >
        <h4 className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Connections</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate?.("/map")}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/20 text-xs font-serif text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all touch-manipulation"
          >
            <TreeDeciduous className="w-3.5 h-3.5 text-primary/60" />
            <span>Map Room</span>
          </button>
          <button
            onClick={() => onNavigate?.("/vault")}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/20 text-xs font-serif text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all touch-manipulation"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary/60" />
            <span>Vault</span>
          </button>
          <button
            onClick={() => onNavigate?.("/nftree-studio")}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/20 text-xs font-serif text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all touch-manipulation"
          >
            <Wand2 className="w-3.5 h-3.5 text-primary/60" />
            <span>NFTree Studio</span>
          </button>
          <button
            onClick={() => onNavigate?.("/value-tree")}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/20 text-xs font-serif text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all touch-manipulation"
          >
            <Heart className="w-3.5 h-3.5 text-primary/60" />
            <span>Value Tree</span>
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <StaffQRCode staffCode={staff.code} size={80} />
      </div>

      <CeremonyHistory staffCode={staff.code} />

      {/* Primary action */}
      <Button className="w-full gap-2 font-serif text-sm" onClick={onViewLegend}>
        <ExternalLink className="w-4 h-4" /> View Full Legend
      </Button>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="gap-2 font-serif text-xs h-9 touch-manipulation" onClick={() =>
          handleShare(`${staff.speciesName} Staff`, `${staff.speciesName} staff (${staff.code}) — one of 144 sacred staffs.`)
        }>
          <Share2 className="w-3.5 h-3.5" /> Share
        </Button>
        <Button variant="outline" size="sm" className="gap-2 font-serif text-xs h-9 touch-manipulation" onClick={onViewOnChain}>
          <Eye className="w-3.5 h-3.5" /> On-Chain
        </Button>
      </div>

      <CuratorAssignPanel staffCode={staff.code} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border/30 pb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

// ── Entrance Animation ───────────────────────────────────────────
function StaffRoomEntrance({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, hsl(var(--card)), hsl(var(--background)))" }}
      initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8, delay: 1.0 }}
      onAnimationComplete={onComplete}
    >
      <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Wand2 className="w-12 h-12 text-primary mx-auto mb-4" style={{ filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.6))" }} />
        <h2 className="font-serif text-3xl text-primary tracking-wide">The Staff Room</h2>
        <p className="text-muted-foreground text-sm mt-2 font-serif italic">144 sacred staffs await…</p>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── Main Component ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
export default function StaffRoomGallery() {
  const routerNavigate = useRouterNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>("carousel");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [onChainStaff, setOnChainStaff] = useState<StaffItem | null>(null);
  const [showEntrance, setShowEntrance] = useState(() => {
    if (sessionStorage.getItem("staffRoomEntered")) return false;
    return true;
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMinting, setShowMinting] = useState(false);
  const [showCeremony, setShowCeremony] = useState(false);
  const [hasLinkedStaff, setHasLinkedStaff] = useState(() => !!localStorage.getItem("linked_staff_code"));
  const [claimedCount, setClaimedCount] = useState(0);

  // Tab state — derive from search params for deep linking
  const activeTab = searchParams.get("tab") || "explorer";
  const setActiveTab = useCallback((tab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "explorer") next.delete("tab");
      else next.set("tab", tab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const allStaffs = useMemo(() => buildStaffItems(), []);
  const filteredStaffs = useMemo(() => filterStaffs(allStaffs, filter), [allStaffs, filter]);
  const activeStaff = filteredStaffs[activeIndex] || filteredStaffs[0];

  // Fetch actual claimed staff count from ceremony_logs
  useEffect(() => {
    supabase
      .from("ceremony_logs" as any)
      .select("staff_code", { count: "exact", head: false })
      .eq("ceremony_type", "awakening")
      .then(({ data }) => {
        const unique = new Set((data || []).map((d: any) => d.staff_code));
        setClaimedCount(unique.size);
      });
  }, []);

  // Deep-link: open a specific staff from ?staff=CODE
  useEffect(() => {
    const staffParam = searchParams.get("staff");
    if (!staffParam) return;
    const idx = allStaffs.findIndex(s => s.code.toLowerCase() === staffParam.toLowerCase());
    if (idx >= 0) {
      setFilter("all");
      setActiveIndex(idx);
      setActiveTab("explorer");
      setDetailOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("staff");
        next.set("tab", "explorer");
        return next;
      }, { replace: true });
    }
  }, [allStaffs, searchParams, setSearchParams, setActiveTab]);

  // Body scroll lock + prefetch for fullscreen mode
  useEffect(() => {
    if (viewMode !== "fullscreen") return;
    document.body.style.overflow = "hidden";
    const prefetch = (idx: number) => {
      const s = filteredStaffs[idx];
      if (s) { const img = new Image(); img.src = s.image; }
    };
    prefetch(activeIndex - 1);
    prefetch(activeIndex + 1);
    return () => { document.body.style.overflow = ""; };
  }, [activeIndex, filteredStaffs, viewMode]);

  const navigate = useCallback((dir: 1 | -1) => {
    setActiveIndex((prev) => {
      const next = prev + dir;
      if (next < 0 || next >= filteredStaffs.length) return prev;
      return next;
    });
  }, [filteredStaffs.length]);

  // Keyboard navigation
  useEffect(() => {
    if (viewMode !== "fullscreen") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); navigate(1); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); navigate(-1); }
      else if (e.key === "Escape") setViewMode("gallery");
      else if (e.key === "i" || e.key === "Enter") setDetailOpen(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewMode, navigate]);

  // Swipe for fullscreen
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      navigate(dx < 0 ? 1 : -1);
    } else if (dy < -60 && Math.abs(dy) > Math.abs(dx)) {
      setDetailOpen(true);
    }
    touchStart.current = null;
  }, [navigate]);

  const dismissEntrance = useCallback(() => {
    setShowEntrance(false);
    sessionStorage.setItem("staffRoomEntered", "1");
  }, []);

  // ── View mode toggle (for Explorer tab) ─────────────────────────
  const ViewToggle = () => (
    <div className="flex items-center gap-1 rounded-lg p-1 bg-secondary/50">
      {([
        { mode: "carousel" as ViewMode, icon: ChevronRight, label: "Carousel" },
        { mode: "gallery" as ViewMode, icon: LayoutGrid, label: "Gallery" },
        { mode: "list" as ViewMode, icon: List, label: "List" },
        { mode: "fullscreen" as ViewMode, icon: Maximize, label: "Full Screen" },
      ]).map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => { setViewMode(mode); setActiveIndex(0); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-serif transition-all",
            viewMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={`${label} view`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );

  // ── CAROUSEL VIEW ─────────────────────────────────────────────
  const CarouselView = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
      align: "center",
      containScroll: "trimSnaps",
      loop: false,
      startIndex: 0,
      dragFree: false,
      skipSnaps: false,
    });
    const [selectedIdx, setSelectedIdx] = useState(0);

    // Reset carousel when filter changes
    useEffect(() => {
      if (!emblaApi) return;
      emblaApi.scrollTo(0, true);
      setSelectedIdx(0);
    }, [emblaApi, filter]);

    useEffect(() => {
      if (!emblaApi) return;
      const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap());
      emblaApi.on("select", onSelect);
      return () => { emblaApi.off("select", onSelect); };
    }, [emblaApi]);

    const currentStaff = filteredStaffs[selectedIdx];
    const circleLabel = currentStaff?.isOrigin
      ? "Founding Spiral"
      : currentStaff?.circle || currentStaff?.code.split("-")[0];

    // Tap-zone navigation: tap left/right 20% of carousel to scroll
    const handleTapZone = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!emblaApi) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const zone = x / rect.width;
      if (zone < 0.2) {
        emblaApi.scrollPrev();
      } else if (zone > 0.8) {
        emblaApi.scrollNext();
      }
    }, [emblaApi]);

    return (
      <div className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-3 text-xs font-serif text-muted-foreground">
          <span className="tabular-nums text-foreground font-medium">{selectedIdx + 1} <span className="text-muted-foreground/60">/ {filteredStaffs.length}</span></span>
          {circleLabel && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span>{circleLabel}</span>
            </>
          )}
        </div>

        {/* Embla carousel with tap zones */}
        <div className="relative">
          {/* Invisible tap zones for left/right navigation */}
          <div
            className="absolute inset-0 z-10 pointer-events-none md:hidden"
            style={{ pointerEvents: "auto" }}
            onClick={handleTapZone}
          />

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4" style={{ touchAction: "pan-y pinch-zoom" }}>
              {filteredStaffs.map((staff, i) => (
                <div
                  key={staff.tokenId}
                  className="flex-[0_0_72%] sm:flex-[0_0_45%] md:flex-[0_0_30%] min-w-0"
                >
                  <div
                    className={cn(
                      "rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 touch-manipulation",
                      i === selectedIdx
                        ? "border-primary/40 shadow-[0_4px_24px_hsl(var(--primary)/0.15)] scale-100"
                        : "border-border/20 opacity-60 scale-[0.95]"
                    )}
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i); setDetailOpen(true); }}
                  >
                    {/* Image */}
                    <div className="aspect-[3/4] overflow-hidden" style={{ background: "hsl(var(--card) / 0.5)" }}>
                      <img
                        src={staff.image}
                        alt={`${staff.speciesName} staff`}
                        className="w-full h-full object-cover"
                        loading={Math.abs(i - selectedIdx) < 3 ? "eager" : "lazy"}
                      />
                    </div>
                    {/* Info */}
                    <div className="p-3 space-y-1" style={{ background: "hsl(var(--card) / 0.8)" }}>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-serif text-sm text-foreground truncate">{staff.speciesName}</h4>
                        {staff.isOrigin && <Crown className="w-3 h-3 text-primary shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">{staff.code} · #{String(staff.tokenId).padStart(3, "0")}</p>
                      {staff.length && (
                        <p className="text-[10px] text-muted-foreground">{staff.length} · {staff.weight}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop nav arrows */}
        <div className="hidden md:flex items-center justify-center gap-3">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="p-2 rounded-full border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            aria-label="Previous staff"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="p-2 rounded-full border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            aria-label="Next staff"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tap hint on mobile */}
        <p className="text-center text-[10px] font-serif text-muted-foreground/50 md:hidden">
          Swipe to browse · Tap edges to skip · Tap card to open
        </p>
      </div>
    );
  };

  // ── LIST VIEW ─────────────────────────────────────────────────
  const ListView = () => (
    <div className="space-y-2">
      {filteredStaffs.map((staff, i) => (
        <div
          key={staff.tokenId}
          className={cn(
            "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all group min-h-[56px] touch-manipulation",
            staff.isOrigin
              ? "border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.07] hover:border-primary/40"
              : "border-border/40 bg-card/50 hover:bg-card/80 hover:border-border/60"
          )}
          onClick={() => { setActiveIndex(i); setDetailOpen(true); }}
          role="button"
          aria-label={`View ${staff.speciesName} staff`}
        >
          <div className="w-12 h-16 rounded-md overflow-hidden border border-border/30 flex-shrink-0 group-hover:border-primary/30 transition-colors shadow-sm">
            <img src={staff.image} alt={staff.speciesName} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-serif text-sm text-foreground truncate">{staff.speciesName}</p>
              {staff.isOrigin && <Crown className="w-3 h-3 text-primary shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{staff.code} · #{String(staff.tokenId).padStart(3, "0")}</p>
          </div>
          {staff.length && (
            <div className="hidden sm:block text-right">
              <p className="text-[11px] text-muted-foreground">{staff.length}</p>
              <p className="text-[11px] text-muted-foreground">{staff.weight}</p>
            </div>
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] flex-shrink-0",
              staff.isOrigin && "border-primary/30 text-primary"
            )}
          >
            {staff.isOrigin ? "Origin" : "Minted"}
          </Badge>
        </div>
      ))}
    </div>
  );

  // ── GALLERY VIEW ──────────────────────────────────────────────
  const GalleryView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {filteredStaffs.map((staff, i) => (
        <Card
          key={staff.tokenId}
          className={cn(
            "transition-all group cursor-pointer overflow-hidden touch-manipulation",
            staff.isOrigin
              ? "border-primary/25 hover:border-primary/50 hover:shadow-[0_4px_20px_hsl(var(--primary)/0.15)]"
              : "border-border/30 hover:border-border/60 hover:shadow-[0_4px_16px_hsl(var(--foreground)/0.06)]"
          )}
          onClick={() => { setActiveIndex(i); setDetailOpen(true); }}
          role="button"
          aria-label={`View ${staff.speciesName} staff`}
        >
          <CardContent className="p-2.5 md:p-3 text-center">
            <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden border border-border/20 mb-2 group-hover:border-primary/30 transition-colors">
              <OptimizedImage src={staff.image} alt={`Staff ${staff.code}`} className="w-full h-full" />
              {staff.isOrigin && (
                <div className="absolute top-1 right-1">
                  <Crown className="w-3 h-3 text-primary drop-shadow-sm" />
                </div>
              )}
            </div>
            <p className="text-xs font-serif font-medium text-foreground truncate leading-snug">
              {staff.speciesName}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
              {staff.code} · #{String(staff.tokenId).padStart(3, "0")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // ── FULL-SCREEN VIEW ──────────────────────────────────────────
  const FullScreenView = () => (
    <motion.div className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "radial-gradient(ellipse at 30% 70%, hsl(var(--card) / 0.95), hsl(var(--background) / 0.98))", backdropFilter: "blur(20px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode("gallery")} className="p-2 rounded-full bg-card/50 backdrop-blur text-foreground hover:bg-card/80 transition-colors" aria-label="Exit full screen">
            <X className="w-4 h-4" />
          </button>
          <span className="font-serif text-sm text-muted-foreground">{activeIndex + 1} / {filteredStaffs.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={cn("p-2 rounded-full backdrop-blur transition-colors", showFilters ? "bg-primary/20 text-primary" : "bg-card/50 text-foreground hover:bg-card/80")} aria-label="Toggle filters">
            <Filter className="w-4 h-4" />
          </button>
          <button onClick={() => setDetailOpen(true)} className="p-2 rounded-full bg-card/50 backdrop-blur text-foreground hover:bg-card/80 transition-colors" aria-label="View details">
            <ScrollText className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            {FILTER_OPTIONS.map((f) => (
              <button key={f.value} onClick={() => { setFilter(f.value); setActiveIndex(0); }}
                className={cn("px-3 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all",
                  filter === f.value ? "bg-primary text-primary-foreground" : "bg-card/60 text-muted-foreground hover:text-foreground backdrop-blur")}>
                {f.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex items-center justify-center relative px-4">
        {activeIndex > 0 && (
          <button onClick={() => navigate(-1)} className="absolute left-2 md:left-6 p-3 rounded-full bg-card/40 backdrop-blur text-foreground hover:bg-card/70 transition-all z-10" aria-label="Previous staff">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <AnimatePresence mode="wait">
          {activeStaff && (
            <motion.div key={activeStaff.tokenId} className="flex flex-col items-center max-w-sm w-full cursor-pointer"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={() => setDetailOpen(true)}>
              <div className="w-full max-w-[280px] md:max-w-[320px] aspect-[3/4] rounded-xl overflow-hidden border-2 border-primary/20 shadow-2xl"
                style={{ boxShadow: "0 0 60px hsl(var(--primary) / 0.15), 0 25px 50px rgba(0,0,0,0.4)" }}>
                <img src={activeStaff.image} alt={`${activeStaff.speciesName} staff`} className="w-full h-full object-cover" />
              </div>
              <div className="mt-5 text-center">
                <h3 className="font-serif text-2xl text-primary tracking-wide">{activeStaff.speciesName}</h3>
                <p className="text-sm text-muted-foreground font-mono mt-1">{activeStaff.code} · #{String(activeStaff.tokenId).padStart(3, "0")}</p>
                {activeStaff.length && <p className="text-xs text-muted-foreground mt-1">{activeStaff.length} · {activeStaff.weight}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {activeIndex < filteredStaffs.length - 1 && (
          <button onClick={() => navigate(1)} className="absolute right-2 md:right-6 p-3 rounded-full bg-card/40 backdrop-blur text-foreground hover:bg-card/70 transition-all z-10" aria-label="Next staff">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center pb-4 px-4 gap-4">
        {filter === "all" || filter === "origin" ? (
          <SpiralMiniMap currentIndex={activeStaff?.isOrigin ? activeStaff.index : -1} totalOrigin={36}
            onSelect={(i) => { const idx = filteredStaffs.findIndex((s) => s.index === i); if (idx >= 0) setActiveIndex(idx); }} />
        ) : (
          <div className="flex gap-1">
            {filteredStaffs.map((_, i) => (
              <button key={i} onClick={() => setActiveIndex(i)} className={cn("w-2 h-2 rounded-full transition-all", i === activeIndex ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50")} aria-label={`Go to staff ${i + 1}`} />
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground font-serif hidden md:block">← → navigate · i details · esc exit</p>
      </div>
    </motion.div>
  );

  // ── TAB DEFINITIONS ───────────────────────────────────────────
  const TABS = [
    { value: "explorer", label: "Explorer", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { value: "overview", label: "Overview", icon: <Compass className="w-3.5 h-3.5" /> },
    { value: "impact", label: "Impact", icon: <TreeDeciduous className="w-3.5 h-3.5" /> },
    { value: "patronage", label: "Patronage", icon: <Crown className="w-3.5 h-3.5" /> },
    { value: "ceremony", label: "Ceremony", icon: <Wand2 className="w-3.5 h-3.5" /> },
  ];

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <>
      {/* Entrance animation */}
      <AnimatePresence>
        {showEntrance && <StaffRoomEntrance onComplete={dismissEntrance} />}
      </AnimatePresence>

      <div className="space-y-5">

        {/* ═══ HERO — always visible above tabs ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3 py-4"
        >
          <div className="flex items-center justify-center gap-2.5">
            <Wand2 className="w-5 h-5 text-primary" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" }} />
            <h2 className="font-serif text-2xl md:text-3xl text-foreground tracking-wide">The Staff Room</h2>
          </div>
          <p className="text-sm font-serif text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Home of the 144 Ancient Friends staffs — hand-crafted from fallen wood, each carrying the spirit of its species.
          </p>
          <div className="h-px max-w-xs mx-auto" style={{ background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.4), transparent)" }} />
        </motion.div>

        {/* Ceremony moved to its own tab */}

        {/* ═══ TABBED CONTENT ═══ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-1 bg-card/40 backdrop-blur-sm border border-border/20 rounded-xl p-1.5 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 font-serif text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg px-3 py-2"
              >
                {tab.icon}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ─── OVERVIEW TAB ─── */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Spiral of Species */}
            <Suspense fallback={<div className="h-64 rounded-2xl bg-card/20 animate-pulse" />}>
              <LazySpiralOfSpecies />
            </Suspense>

            {/* ── The Staffs — grounded overview ── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6 }}
              className="space-y-8 pt-4"
            >
              <div className="text-center">
                <h3 className="font-serif text-xl text-foreground tracking-wide">The Staffs</h3>
                <div className="h-px max-w-[80px] mx-auto mt-3" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)" }} />
              </div>

              {/* A. Core meaning */}
              <div className="max-w-md mx-auto text-center space-y-2">
                <span className="text-lg">🌳</span>
                <p className="text-sm font-serif text-muted-foreground leading-relaxed">
                  Staffs are guardian markers within the S33D ecosystem.
                </p>
                <p className="text-sm font-serif text-muted-foreground leading-relaxed">
                  Each one carries the presence of a tree<br />and the path of those who walk with it.
                </p>
              </div>

              <div className="h-px max-w-[60px] mx-auto" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--muted-foreground) / 0.15), transparent)" }} />

              {/* B. Functional role */}
              <div className="max-w-md mx-auto text-center space-y-3">
                <span className="text-lg">🗝️</span>
                <p className="text-xs font-serif text-muted-foreground uppercase tracking-widest">Staffs act as keys to</p>
                <div className="grid grid-cols-2 gap-2.5 max-w-xs mx-auto">
                  {[
                    { icon: <MapPin className="w-3.5 h-3.5" />, text: "Map & mint Ancient Friends" },
                    { icon: <BookOpen className="w-3.5 h-3.5" />, text: "Curate the Heartwood Library" },
                    { icon: <Shield className="w-3.5 h-3.5" />, text: "Access & grow the Vault" },
                    { icon: <Users className="w-3.5 h-3.5" />, text: "Join the living community" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-start gap-2 text-left p-2.5 rounded-xl border border-border/15 bg-card/20">
                      <div className="text-primary mt-0.5 shrink-0">{item.icon}</div>
                      <p className="text-[11px] font-serif text-muted-foreground leading-snug">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px max-w-[60px] mx-auto" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--muted-foreground) / 0.15), transparent)" }} />

              {/* C. System role */}
              <div className="max-w-md mx-auto text-center space-y-2">
                <span className="text-lg">❤️</span>
                <p className="text-xs font-serif text-muted-foreground uppercase tracking-widest">They anchor</p>
                <div className="space-y-1.5">
                  <p className="text-sm font-serif text-muted-foreground">Encounters at trees</p>
                  <p className="text-sm font-serif text-muted-foreground">Records in the Library</p>
                  <p className="text-sm font-serif text-muted-foreground">Flows of S33D Hearts</p>
                </div>
              </div>

              <div className="h-px max-w-[60px] mx-auto" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--muted-foreground) / 0.15), transparent)" }} />

              {/* D. Gentle actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-serif text-xs gap-1.5 rounded-xl border-border/20"
                  onClick={() => setActiveTab("explorer")}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  View your staff
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-serif text-xs gap-1.5 rounded-xl border-border/20"
                  onClick={() => routerNavigate("/map")}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Map a tree
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-serif text-xs gap-1.5 rounded-xl border-border/20"
                  onClick={() => routerNavigate("/library")}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Enter the Heartwood
                </Button>
              </div>
            </motion.section>

          </TabsContent>

          {/* ─── CEREMONY TAB ─── */}
          <TabsContent value="ceremony" className="space-y-5 mt-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
              <Wand2 className="w-6 h-6 text-primary mx-auto" style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.4))" }} />
              <h3 className="font-serif text-lg text-foreground">The Staff Ceremony</h3>
              <p className="text-xs font-serif text-muted-foreground max-w-md mx-auto leading-relaxed">
                Claiming a staff is a ceremonial act. You choose your species, receive your staff code, and map your first Ancient Friend tree.
              </p>
              <div className="h-px max-w-xs mx-auto" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }} />
            </motion.div>
            <StaffCeremony
              onComplete={() => { setShowCeremony(false); setHasLinkedStaff(true); }}
              onCancel={() => { setShowCeremony(false); setHasLinkedStaff(true); }}
            />
          </TabsContent>

          {/* ─── EXPLORER TAB ─── */}
          <TabsContent value="explorer" className="space-y-4 mt-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <h3 className="font-serif text-lg text-foreground tracking-wide">Staff Explorer</h3>
              </div>
              <p className="text-xs font-serif text-muted-foreground">
                Browse all 144 staffs by species and status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <ViewToggle />
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={(v) => { setFilter(v as StaffFilter); setActiveIndex(0); }}>
                  <SelectTrigger className="w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="text-xs font-serif" onClick={() => setShowMinting(!showMinting)}>
                  {showMinting ? "Hide" : "Show"} Minting
                </Button>
              </div>
            </div>

            {viewMode === "carousel" && <CarouselView />}
            {viewMode === "list" && <ListView />}
            {viewMode === "gallery" && <GalleryView />}

            <AnimatePresence>
              {viewMode === "fullscreen" && <FullScreenView />}
            </AnimatePresence>

            <AnimatePresence>
              {showMinting && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <MintingStatusDashboard />
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ─── PATRONAGE TAB ─── */}
          <TabsContent value="patronage" className="space-y-5 mt-4">
            {/* Founding Spiral — the 36 handcrafted Origin Staffs */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <h3 className="font-serif text-lg text-foreground tracking-wide">The Founding Spiral</h3>
                </div>
                <p className="text-xs font-serif text-muted-foreground max-w-md mx-auto leading-relaxed">
                  36 handcrafted staffs forming the root system of the Ancient Friends ecosystem. Each staff is a founding seed. The 108 Species Staffs form the Origin Circle.
                </p>
              </div>

              {/* Claim progress */}
              <div className="max-w-sm mx-auto">
                <div className="flex items-center justify-between text-xs font-serif text-muted-foreground mb-1.5">
                  <span>Staffs Claimed</span>
                  <span className="text-foreground font-bold">{claimedCount} / 36</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-secondary/50">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min((claimedCount / 36) * 100, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
              </div>

              <Suspense fallback={<div className="h-48 rounded-2xl bg-card/20 animate-pulse" />}>
                <LazyCeremonialCircle />
              </Suspense>
            </motion.section>

            <SectionDivider />

            <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6 space-y-4">
              <div className="text-center space-y-2">
                <Crown className="w-6 h-6 text-primary mx-auto" style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.4))" }} />
                <h3 className="text-lg font-serif text-foreground">The Founding Patron Offering</h3>
                <p className="text-xs font-serif text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Claim a handcrafted staff and enter a living role in the Ancient Friends ecosystem. Each patron receives 3,333 S33D Hearts, 33 Species Hearts, and 33 Influence — seeds to grow your presence across the network.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {[
                  { icon: <Heart className="w-3.5 h-3.5" />, label: "3,333 S33D Hearts", color: "hsl(0, 65%, 55%)" },
                  { icon: <Sparkles className="w-3.5 h-3.5" />, label: "33 Species Hearts", color: "hsl(var(--primary))" },
                  { icon: <Shield className="w-3.5 h-3.5" />, label: "33 Influence", color: "hsl(42, 80%, 50%)" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-2.5 rounded-xl border border-border/20 bg-card/20">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                      {item.icon}
                    </div>
                    <p className="text-[9px] font-serif text-muted-foreground leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>

              <Suspense fallback={<div className="h-32 bg-card/20 animate-pulse rounded-xl" />}>
                <LazyStaffPatronValueCard />
              </Suspense>

              <div className="text-center pt-2">
                <Button
                  className="font-serif text-sm gap-2 px-6"
                  onClick={() => {
                    if (!hasLinkedStaff) {
                      setShowCeremony(true);
                      setActiveTab("overview");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      routerNavigate("/vault");
                    }
                  }}
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(42 80% 45%))" }}
                >
                  <Crown className="w-4 h-4" />
                  {hasLinkedStaff ? "View Your Vault" : "Claim a Staff"}
                </Button>
              </div>
            </div>

            {/* Stewardship Recognition */}
            <SectionDivider />

            <div className="rounded-2xl border border-primary/10 bg-primary/5 backdrop-blur-sm p-5 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h4 className="font-serif text-sm text-foreground tracking-wide">Heartwood Stewardship</h4>
              </div>
              <p className="text-xs font-serif text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Origin Staff holders steward the Heartwood freely — guardians of entrusted memories, long-term legacy, and the roots of this living system.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {[
                  "Lifetime Heartwood access",
                  "Entrusted memory stewardship",
                  "Founding guardian recognition",
                ].map(right => (
                  <span key={right} className="text-[9px] font-serif px-2.5 py-1 rounded-full border border-primary/15 bg-primary/5 text-primary/80">
                    {right}
                  </span>
                ))}
              </div>
              <p className="text-[9px] font-serif text-muted-foreground/50 italic">
                Hearts help keep entrusted memories alive — stewardship energy for the grove.
              </p>
            </div>
          </TabsContent>

          {/* ─── IMPACT TAB ─── */}
          <TabsContent value="impact" className="space-y-5 mt-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <TreeDeciduous className="w-4 h-4 text-primary" />
                <h3 className="font-serif text-lg text-foreground tracking-wide">Ecosystem Impact</h3>
              </div>
              <p className="text-xs font-serif text-muted-foreground max-w-md mx-auto">
                The living effect of staffs on the Ancient Friends network — hearts flowing, trees mapped, offerings recorded, and species circles forming.
              </p>
            </div>

            <Suspense fallback={<div className="h-48 rounded-2xl bg-card/20 animate-pulse" />}>
              <LazyStaffImpactPanel />
            </Suspense>

            <Suspense fallback={<div className="h-64 rounded-2xl bg-card/20 animate-pulse" />}>
              <LazyStaffSpiralNavigator />
            </Suspense>

            <div className="space-y-2 mt-6">
              <h4 className="text-xs font-serif text-muted-foreground uppercase tracking-wider text-center">Recent Ecosystem Activity</h4>
              <Suspense fallback={<div className="h-20 bg-card/20 animate-pulse rounded-xl" />}>
                <LazyActivityFeed limit={6} compact />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail drawer */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={cn("overflow-y-auto", isMobile ? "max-h-[85vh] rounded-t-2xl" : "w-[400px]")}>
          <SheetHeader>
            <SheetTitle className="font-serif text-xl text-primary">{activeStaff?.speciesName || "Staff Details"}</SheetTitle>
          </SheetHeader>
          {activeStaff && (
            <div className="mt-4">
              <StaffDetailContent
                staff={activeStaff}
                onViewOnChain={() => { setDetailOpen(false); setOnChainStaff(activeStaff); }}
                onViewLegend={() => { setDetailOpen(false); routerNavigate(`/staff/${activeStaff.code}`); }}
                onNavigate={(path) => { setDetailOpen(false); routerNavigate(path); }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* On-chain IPFS viewer dialog */}
      {onChainStaff && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setOnChainStaff(null)}>
          <div className="max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto rounded-xl border border-primary/40 bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-2">
              <button onClick={() => setOnChainStaff(null)} className="p-1 rounded-full hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <IpfsMetadataViewer tokenId={onChainStaff.tokenId} fallbackImage={onChainStaff.image} />
          </div>
        </div>
      )}

      {/* Journey Bridge */}
      <div className="max-w-3xl mx-auto px-4">
        <JourneyBridge current="staff" hasStaff={hasLinkedStaff} />
      </div>
    </>
  );
}
