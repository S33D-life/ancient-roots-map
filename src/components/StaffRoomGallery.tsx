import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import JourneyBridge from "@/components/JourneyBridge";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutGrid, Maximize, List, ChevronLeft, ChevronRight, X,
  Share2, Eye, Heart, TreeDeciduous, ScrollText, ExternalLink,
  Wand2, Filter, Sparkles, Shield, Users, Crown,
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

type ViewMode = "list" | "gallery" | "fullscreen";
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

function StaffDetailContent({ staff, onViewOnChain, onViewLegend }: { staff: StaffItem; onViewOnChain: () => void; onViewLegend: () => void }) {
  const counts = getSpeciesStaffCounts();
  const upperCode = staff.isOrigin ? staff.code : staff.code.split("-")[0];
  const total = counts[upperCode] || 1;

  return (
    <div className="space-y-4">
      <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-border/40">
        <img src={staff.image} alt={`${staff.speciesName} staff`} className="w-full h-full object-cover" />
      </div>
      <div className="space-y-2 text-sm">
        <Row label="Code" value={<span className="font-mono">{staff.code}</span>} />
        <Row label="Species" value={staff.speciesName} />
        <Row label="Token" value={`#${String(staff.tokenId).padStart(3, "0")}`} />
        {staff.length && <Row label="Length" value={staff.length} />}
        {staff.weight && <Row label="Weight" value={staff.weight} />}
        <Row label="Collection" value={`${total} staff${total > 1 ? "s" : ""}`} />
        <Row label="Circles" value={getCircleDescription(upperCode)} />
      </div>
      <p className="text-xs text-muted-foreground italic">
        {staff.isOrigin
          ? `The ${staff.speciesName} staff — position #${staff.index + 1} on the sacred spiral. Hand-crafted from fallen wood, each staff carries the spirit of its species.`
          : `Circle staff ${staff.code} — one of ${total} ${staff.speciesName} staffs in the Ancient Friends collection.`}
      </p>
      <div className="flex justify-center">
        <StaffQRCode staffCode={staff.code} size={80} />
      </div>
      <CeremonyHistory staffCode={staff.code} />
      <Button className="w-full gap-2 font-serif text-sm" onClick={onViewLegend}>
        <ExternalLink className="w-4 h-4" /> View Full Legend
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="gap-2 font-serif text-xs" onClick={() =>
          handleShare(`${staff.speciesName} Staff`, `${staff.speciesName} staff (${staff.code}) — one of 144 sacred staffs.`)
        }>
          <Share2 className="w-3.5 h-3.5" /> Share
        </Button>
        <Button variant="outline" size="sm" className="gap-2 font-serif text-xs" onClick={onViewOnChain}>
          <Eye className="w-3.5 h-3.5" /> On-Chain
        </Button>
        <Button variant="outline" size="sm" className="gap-2 font-serif text-xs" onClick={onViewLegend}>
          <ScrollText className="w-3.5 h-3.5" /> Lore Scroll
        </Button>
        <Button variant="outline" size="sm" className="gap-2 font-serif text-xs" onClick={onViewLegend}>
          <TreeDeciduous className="w-3.5 h-3.5" /> Linked Trees
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
      style={{ background: "radial-gradient(ellipse at center, hsl(28 30% 12%), hsl(80 15% 6%))" }}
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
  const isMobile = useIsMobile();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ explorer: false });
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
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
    const params = new URLSearchParams(window.location.search);
    const staffParam = params.get("staff");
    if (!staffParam) return;
    const idx = allStaffs.findIndex(s => s.code.toLowerCase() === staffParam.toLowerCase());
    if (idx >= 0) {
      setFilter("all");
      setActiveIndex(idx);
      setExpandedSections(prev => ({ ...prev, explorer: true }));
      setDetailOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("staff");
      window.history.replaceState({}, "", url.toString());
    }
  }, [allStaffs]);

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

  // ── View mode toggle (for Staffs tab) ─────────────────────────
  const ViewToggle = () => (
    <div className="flex items-center gap-1 rounded-lg p-1 bg-secondary/50">
      {([
        { mode: "list" as ViewMode, icon: List, label: "List" },
        { mode: "gallery" as ViewMode, icon: LayoutGrid, label: "Gallery" },
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

  // ── LIST VIEW ─────────────────────────────────────────────────
  const ListView = () => (
    <div className="space-y-2">
      {filteredStaffs.map((staff, i) => (
        <div key={staff.tokenId} className="flex items-center gap-4 p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-card/80 cursor-pointer transition-all group"
          onClick={() => { setActiveIndex(i); setDetailOpen(true); }} role="button" aria-label={`View ${staff.speciesName} staff`}>
          <div className="w-12 h-16 rounded-md overflow-hidden border border-border/40 flex-shrink-0">
            <img src={staff.image} alt={staff.speciesName} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm text-foreground truncate">{staff.speciesName}</p>
            <p className="text-xs text-muted-foreground font-mono">{staff.code} · #{String(staff.tokenId).padStart(3, "0")}</p>
          </div>
          {staff.length && (
            <div className="hidden sm:block text-right">
              <p className="text-xs text-muted-foreground">{staff.length}</p>
              <p className="text-xs text-muted-foreground">{staff.weight}</p>
            </div>
          )}
          <Badge variant="outline" className="text-[10px] flex-shrink-0">Minted</Badge>
        </div>
      ))}
    </div>
  );

  // ── GALLERY VIEW ──────────────────────────────────────────────
  const GalleryView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {filteredStaffs.map((staff, i) => (
        <Card key={staff.tokenId} className="border-border/40 hover:border-primary/50 transition-all group cursor-pointer overflow-hidden hover:shadow-[var(--glow-subtle)]"
          onClick={() => { setActiveIndex(i); setDetailOpen(true); }} role="button" aria-label={`View ${staff.speciesName} staff`}>
          <CardContent className="p-3 text-center">
            <div className="w-full aspect-[3/4] rounded-md overflow-hidden border border-border/30 mb-2 group-hover:border-primary/40 transition-colors">
              <OptimizedImage src={staff.image} alt={`Staff ${staff.code}`} className="w-full h-full" />
            </div>
            <p className="text-xs font-serif font-medium text-foreground truncate">
              {staff.code.includes("-") ? staff.code : staff.speciesName}
            </p>
            <p className="text-[10px] text-muted-foreground">#{String(staff.tokenId).padStart(3, "0")}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // ── FULL-SCREEN VIEW ──────────────────────────────────────────
  const FullScreenView = () => (
    <motion.div className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "radial-gradient(ellipse at 30% 70%, hsl(28 25% 10% / 0.95), hsl(80 15% 6% / 0.98))", backdropFilter: "blur(20px)" }}
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

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <>
      {/* Entrance animation */}
      <AnimatePresence>
        {showEntrance && <StaffRoomEntrance onComplete={dismissEntrance} />}
      </AnimatePresence>

      <div className="space-y-6">

        {/* ═══ 1. HERO SECTION ═══ */}
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
            The founding circle of 36 origin staffs forms the ceremonial heart of the S33D ecosystem.
          </p>
          <div className="h-px max-w-xs mx-auto" style={{ background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.4), transparent)" }} />
        </motion.div>

        {/* ═══ Staff Ceremony — shown when no staff connected or user triggers it ═══ */}
        <AnimatePresence>
          {(showCeremony || !hasLinkedStaff) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <StaffCeremony
                onComplete={() => { setShowCeremony(false); setHasLinkedStaff(true); }}
                onCancel={() => { setShowCeremony(false); setHasLinkedStaff(true); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 2. SPIRAL OF SPECIES — Primary visual navigation ═══ */}
        <Suspense fallback={<div className="h-64 rounded-2xl bg-card/20 animate-pulse" />}>
          <LazySpiralOfSpecies />
        </Suspense>

        <SectionDivider />

        {/* ═══ 3. FOUNDING CIRCLE ═══ */}
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
              <h3 className="font-serif text-lg text-foreground tracking-wide">The 36 Origin Staffs</h3>
            </div>
            <p className="text-xs font-serif text-muted-foreground max-w-md mx-auto leading-relaxed">
              The founding spiral — each hand-crafted from a distinct fallen branch. Together they form the ceremonial heart from which the entire ecosystem grows.
            </p>
          </div>

          {/* Claim progress */}
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs font-serif text-muted-foreground mb-1.5">
              <span>Staffs Claimed</span>
              <span className="text-foreground font-bold">
                {claimedCount} / 36
              </span>
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

        {/* ═══ 4. STAFF CEREMONY ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-primary/15 bg-card/30 backdrop-blur-sm p-5 space-y-3">
            <div className="text-center space-y-2">
              <Wand2 className="w-5 h-5 text-primary mx-auto" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" }} />
              <h3 className="font-serif text-base text-foreground">The Staff Ceremony</h3>
              <p className="text-xs font-serif text-muted-foreground max-w-md mx-auto leading-relaxed">
                Claiming a staff is a ceremonial act. You choose your species, receive your staff code, and map your first Ancient Friend tree — planting the seed of your presence in the living network.
              </p>
            </div>
            {hasLinkedStaff ? (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-serif gap-1.5"
                  onClick={() => setShowCeremony(!showCeremony)}
                  style={{ borderColor: "hsla(42, 60%, 50%, 0.3)", color: "hsl(42, 80%, 60%)" }}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {showCeremony ? "Close Ceremony" : "Begin Ceremony"}
                </Button>
              </div>
            ) : (
              <p className="text-center text-[10px] font-serif text-muted-foreground italic">
                Connect a staff above to begin your ceremony.
              </p>
            )}
          </div>
        </motion.section>

        <SectionDivider />

        {/* ═══ 5. FOUNDING PATRON OFFERING ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
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
        </motion.section>

        <SectionDivider />

        {/* ═══ 6. STAFF EXPLORER ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
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
        </motion.section>

        <SectionDivider />

        {/* ═══ 7. STAFF IMPACT ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <TreeDeciduous className="w-4 h-4 text-primary" />
              <h3 className="font-serif text-lg text-foreground tracking-wide">Ecosystem Impact</h3>
            </div>
            <p className="text-xs font-serif text-muted-foreground max-w-md mx-auto">
              The living effect of staffs on the Ancient Friends network — hearts flowing, trees mapped, offerings recorded, and species circles forming.
            </p>
          </div>

          {/* ═══ 8. VAULT INTEGRATION — Personal staff panel ═══ */}
          <Suspense fallback={<div className="h-48 rounded-2xl bg-card/20 animate-pulse" />}>
            <LazyStaffImpactPanel />
          </Suspense>

          {/* Spiral Navigator — detailed 144-staff structure */}
          <Suspense fallback={<div className="h-64 rounded-2xl bg-card/20 animate-pulse" />}>
            <LazyStaffSpiralNavigator />
          </Suspense>

          {/* Activity Feed */}
          <div className="space-y-2 mt-6">
            <h4 className="text-xs font-serif text-muted-foreground uppercase tracking-wider text-center">Recent Ecosystem Activity</h4>
            <Suspense fallback={<div className="h-20 bg-card/20 animate-pulse rounded-xl" />}>
              <LazyActivityFeed limit={6} compact />
            </Suspense>
          </div>
        </motion.section>
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
