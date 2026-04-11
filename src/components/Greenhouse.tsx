import { useState, useEffect, useRef, useCallback } from "react";
import greenhouseCover from "@/assets/greenhouse-cover.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Plus, Loader2, Leaf, ImagePlus, X, Share2, Lock, Trash2, Sprout, Sun,
  TreeDeciduous, MapPin, Shield, ChevronRight, Flower2, TreePine,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Floating Pollen / Light Motes — warm greenhouse dust
   ═══════════════════════════════════════════════════════ */
const MOTE_COUNT = 35;

interface Mote {
  x: number; y: number; r: number; dx: number; dy: number;
  alpha: number; phase: number; speed: number;
}

const GreenhouseMotes = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.width;
    const h = () => canvas.height;

    const motes: Mote[] = Array.from({ length: MOTE_COUNT }, () => ({
      x: Math.random() * (canvas.width || 600),
      y: Math.random() * (canvas.height || 400),
      r: Math.random() * 2.5 + 1,
      dx: (Math.random() - 0.5) * 0.3,
      dy: -(Math.random() * 0.15 + 0.05),
      alpha: Math.random() * 0.4 + 0.15,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      t += 1;
      for (const m of motes) {
        m.x += m.dx + Math.sin(t * m.speed + m.phase) * 0.15;
        m.y += m.dy;
        const a = m.alpha + Math.sin(t * m.speed * 1.5 + m.phase) * 0.12;
        if (m.y < -10) { m.y = h() + 10; m.x = Math.random() * w(); }
        if (m.x < -10) m.x = w() + 10;
        if (m.x > w() + 10) m.x = -10;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(50, 70%, 80%, ${Math.max(0.05, a)})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(90, 40%, 85%, ${Math.max(0.01, a * 0.2)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
};

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */
type PlantType = "houseplant" | "sapling" | "cutting" | "seedling";
type LifecycleStage = "seed" | "seedling" | "sapling" | "growing" | "ready_to_plant" | "planted";

interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string | null;
  photo_url: string | null;
  is_shared: boolean;
  notes: string | null;
  created_at: string;
  plant_type: PlantType;
  lifecycle_stage: LifecycleStage;
  origin_tree_id: string | null;
  origin_grove_id: string | null;
  seed_source: string | null;
  lineage_story: string | null;
  target_grove_id: string | null;
}

const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  seed: "Seed", seedling: "Seedling", sapling: "Sapling",
  growing: "Growing", ready_to_plant: "Ready to Plant", planted: "Planted",
};
const LIFECYCLE_ICONS: Record<LifecycleStage, string> = {
  seed: "🌰", seedling: "🌱", sapling: "🪴",
  growing: "🌿", ready_to_plant: "✨", planted: "🌳",
};
const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  houseplant: "Houseplant", sapling: "Sapling", cutting: "Cutting", seedling: "Seedling",
};

/* Growth stage progress (0-1) */
const LIFECYCLE_PROGRESS: Record<LifecycleStage, number> = {
  seed: 0.1, seedling: 0.25, sapling: 0.45,
  growing: 0.65, ready_to_plant: 0.85, planted: 1.0,
};

/* ═══════════════════════════════════════════════════════
   Section Header — bench-like warm divider
   ═══════════════════════════════════════════════════════ */
const SectionBench = ({
  icon,
  title,
  subtitle,
  count,
  accentHue = 120,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  accentHue?: number;
}) => (
  <div
    className="flex items-center gap-3 px-5 py-4 rounded-xl mb-4"
    style={{
      background: `linear-gradient(135deg, hsla(${accentHue}, 20%, 92%, 0.6), hsla(${accentHue}, 15%, 88%, 0.4))`,
      border: `1px solid hsla(${accentHue}, 25%, 75%, 0.3)`,
    }}
  >
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      style={{
        background: `hsla(${accentHue}, 30%, 80%, 0.5)`,
        border: `1px solid hsla(${accentHue}, 25%, 65%, 0.3)`,
      }}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-serif text-sm tracking-wide" style={{ color: `hsl(${accentHue - 90 < 0 ? accentHue + 270 : accentHue - 90}, 20%, 30%)` }}>
        {title}
      </h3>
      <p className="text-[10px] font-serif tracking-wider" style={{ color: `hsl(${accentHue}, 15%, 50%)` }}>
        {subtitle}
      </p>
    </div>
    <span
      className="text-[10px] font-serif tracking-widest px-2.5 py-1 rounded-full"
      style={{
        background: `hsla(${accentHue}, 25%, 85%, 0.5)`,
        color: `hsl(${accentHue}, 25%, 40%)`,
        border: `1px solid hsla(${accentHue}, 20%, 70%, 0.3)`,
      }}
    >
      {count}
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════
   Growth Progress Bar — thin organic bar
   ═══════════════════════════════════════════════════════ */
const GrowthBar = ({ stage }: { stage: LifecycleStage }) => {
  const progress = LIFECYCLE_PROGRESS[stage];
  return (
    <div className="mt-2">
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: 'hsla(90, 15%, 85%, 0.5)' }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            background: progress >= 0.85
              ? 'linear-gradient(90deg, hsl(120, 40%, 55%), hsl(80, 50%, 50%))'
              : 'linear-gradient(90deg, hsl(120, 30%, 60%), hsl(100, 35%, 55%))',
          }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] font-serif" style={{ color: 'hsl(90, 15%, 55%)' }}>
          {LIFECYCLE_ICONS[stage]} {LIFECYCLE_LABELS[stage]}
        </span>
        {stage === "ready_to_plant" && (
          <span className="text-[8px] font-serif" style={{ color: 'hsl(45, 60%, 45%)' }}>
            ✨ Ready for the forest
          </span>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Sapling Card — richer than houseplant card
   ═══════════════════════════════════════════════════════ */
const SaplingCard = ({
  plant,
  isOwner,
  onToggleShare,
  onDelete,
}: {
  plant: Plant;
  isOwner: boolean;
  onToggleShare: () => void;
  onDelete: () => void;
}) => (
  <motion.div
    layout
    className="rounded-2xl overflow-hidden group"
    style={{
      background: 'hsla(0, 0%, 100%, 0.7)',
      border: '1px solid hsla(90, 30%, 72%, 0.45)',
      boxShadow: '0 2px 16px hsla(90, 25%, 40%, 0.07)',
    }}
  >
    {/* Image / placeholder */}
    <div className="aspect-[5/3] relative overflow-hidden" style={{ background: 'hsla(85, 18%, 90%, 0.5)' }}>
      {plant.photo_url ? (
        <img
          src={plant.photo_url}
          alt={plant.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            {plant.lifecycle_stage === "seed" ? (
              <span className="text-3xl">🌰</span>
            ) : plant.lifecycle_stage === "seedling" ? (
              <Sprout className="h-10 w-10" style={{ color: 'hsla(120, 30%, 60%, 0.5)' }} />
            ) : (
              <TreeDeciduous className="h-10 w-10" style={{ color: 'hsla(120, 25%, 60%, 0.4)' }} />
            )}
          </motion.div>
        </div>
      )}
      {/* Stage badge overlay */}
      <div
        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-serif tracking-wider flex items-center gap-1"
        style={{
          background: 'hsla(0, 0%, 100%, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid hsla(120, 25%, 70%, 0.3)',
          color: 'hsl(120, 30%, 38%)',
        }}
      >
        {LIFECYCLE_ICONS[plant.lifecycle_stage]} {LIFECYCLE_LABELS[plant.lifecycle_stage]}
      </div>
      {plant.is_shared && (
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-serif tracking-widest flex items-center gap-1"
          style={{
            background: 'hsla(0, 0%, 100%, 0.85)',
            color: 'hsl(120, 30%, 40%)',
            backdropFilter: 'blur(8px)',
            border: '1px solid hsla(120, 25%, 70%, 0.3)',
          }}
        >
          <Share2 className="h-2.5 w-2.5" />
          SHARED
        </div>
      )}
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(transparent, hsla(0, 0%, 100%, 0.5))' }}
      />
    </div>

    {/* Info section */}
    <div className="p-4" style={{ background: 'linear-gradient(180deg, hsla(0, 0%, 100%, 0.3), hsla(30, 20%, 95%, 0.3))' }}>
      <h4 className="font-serif text-sm truncate" style={{ color: 'hsl(30, 25%, 25%)' }}>
        {plant.name}
      </h4>
      {plant.species && (
        <p className="text-[11px] italic truncate mt-0.5" style={{ color: 'hsl(90, 15%, 50%)' }}>
          {plant.species}
        </p>
      )}

      {/* Growth bar */}
      <GrowthBar stage={plant.lifecycle_stage} />

      {/* Seed source / lineage */}
      {plant.seed_source && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <span className="text-[10px]">🌰</span>
          <p className="text-[10px] font-serif truncate" style={{ color: 'hsl(30, 20%, 48%)' }}>
            {plant.seed_source}
          </p>
        </div>
      )}
      {plant.lineage_story && (
        <p className="text-[9px] mt-1.5 italic line-clamp-2 leading-relaxed" style={{ color: 'hsl(30, 15%, 52%)' }}>
          "{plant.lineage_story}"
        </p>
      )}

      {/* Owner controls */}
      {isOwner && (
        <div
          className="flex items-center justify-between mt-3 pt-3"
          style={{ borderTop: '1px solid hsla(90, 20%, 80%, 0.4)' }}
        >
          <button
            onClick={onToggleShare}
            className="text-[10px] font-serif flex items-center gap-1 transition-colors duration-200"
            style={{ color: 'hsl(90, 20%, 50%)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(120, 35%, 40%)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(90, 20%, 50%)')}
          >
            {plant.is_shared ? <Lock className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
            {plant.is_shared ? "Heartwood" : "Share"}
          </button>
          <button
            onClick={onDelete}
            className="text-[10px] transition-colors duration-200 p-1 rounded-lg"
            style={{ color: 'hsl(90, 15%, 60%)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(0, 60%, 50%)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(90, 15%, 60%)')}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════
   Houseplant Card — simpler, original style
   ═══════════════════════════════════════════════════════ */
const HouseplantCard = ({
  plant,
  isOwner,
  onToggleShare,
  onDelete,
}: {
  plant: Plant;
  isOwner: boolean;
  onToggleShare: () => void;
  onDelete: () => void;
}) => (
  <div
    className="rounded-2xl overflow-hidden group transition-all duration-500"
    style={{
      background: 'hsla(0, 0%, 100%, 0.65)',
      border: '1px solid hsla(90, 25%, 75%, 0.4)',
      boxShadow: '0 2px 12px hsla(90, 20%, 40%, 0.06)',
    }}
  >
    <div className="aspect-[4/3] relative overflow-hidden" style={{ background: 'hsla(90, 15%, 90%, 0.5)' }}>
      {plant.photo_url ? (
        <img
          src={plant.photo_url}
          alt={plant.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Leaf className="h-10 w-10" style={{ color: 'hsla(120, 20%, 70%, 0.4)' }} />
          </motion.div>
        </div>
      )}
      {plant.is_shared && (
        <div
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-serif tracking-widest flex items-center gap-1"
          style={{
            background: 'hsla(0, 0%, 100%, 0.85)',
            color: 'hsl(120, 30%, 40%)',
            backdropFilter: 'blur(8px)',
            border: '1px solid hsla(120, 25%, 70%, 0.3)',
          }}
        >
          <Share2 className="h-2.5 w-2.5" />
          SHARED
        </div>
      )}
      <div
        className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
        style={{ background: 'linear-gradient(transparent, hsla(0, 0%, 100%, 0.4))' }}
      />
    </div>
    <div className="p-3.5" style={{ background: 'linear-gradient(180deg, hsla(0, 0%, 100%, 0.3), hsla(30, 20%, 95%, 0.3))' }}>
      <h4 className="font-serif text-sm truncate" style={{ color: 'hsl(30, 25%, 25%)' }}>
        {plant.name}
      </h4>
      {plant.species && (
        <p className="text-[11px] italic truncate mt-0.5" style={{ color: 'hsl(90, 15%, 50%)' }}>
          {plant.species}
        </p>
      )}
      {isOwner && (
        <div
          className="flex items-center justify-between mt-2.5 pt-2.5"
          style={{ borderTop: '1px solid hsla(90, 20%, 80%, 0.4)' }}
        >
          <button
            onClick={onToggleShare}
            className="text-[10px] font-serif flex items-center gap-1 transition-colors duration-200"
            style={{ color: 'hsl(90, 20%, 50%)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(120, 35%, 40%)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(90, 20%, 50%)')}
          >
            {plant.is_shared ? <Lock className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
            {plant.is_shared ? "Heartwood" : "Share"}
          </button>
          <button
            onClick={onDelete}
            className="text-[10px] transition-colors duration-200 p-1 rounded-lg"
            style={{ color: 'hsl(90, 15%, 60%)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(0, 60%, 50%)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(90, 15%, 60%)')}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   Navigation Links — ecosystem connections
   ═══════════════════════════════════════════════════════ */
const GreenhouseNav = () => (
  <div
    className="flex gap-2 flex-wrap px-5 py-3 rounded-xl mt-4"
    style={{
      background: 'hsla(30, 20%, 92%, 0.5)',
      border: '1px solid hsla(30, 20%, 80%, 0.3)',
    }}
  >
    {[
      { to: "/map", icon: <MapPin className="h-3 w-3" />, label: "Map" },
      { to: "/atlas", icon: <TreePine className="h-3 w-3" />, label: "Atlas" },
      { to: "/groves", icon: <TreeDeciduous className="h-3 w-3" />, label: "Groves" },
      { to: "/pulse", icon: <Flower2 className="h-3 w-3" />, label: "Forest Pulse" },
      { to: "/library", icon: <Flower2 className="h-3 w-3" />, label: "Library" },
    ].map(link => (
      <Link
        key={link.to}
        to={link.to}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-serif text-[10px] tracking-wider transition-all duration-200"
        style={{
          background: 'hsla(0, 0%, 100%, 0.5)',
          color: 'hsl(90, 20%, 42%)',
          border: '1px solid hsla(90, 20%, 78%, 0.3)',
        }}
      >
        {link.icon}
        {link.label}
        <ChevronRight className="h-2.5 w-2.5 opacity-40" />
      </Link>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════
   Main Greenhouse Component
   ═══════════════════════════════════════════════════════ */
const Greenhouse = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [communityPlants, setCommunityPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      await fetchPlants(user?.id ?? null);
    };
    init();
  }, []);

  const fetchPlants = async (uid: string | null) => {
    setLoading(true);
    try {
      if (uid) {
        const { data } = await supabase
          .from("greenhouse_plants")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });
        setPlants((data as Plant[]) || []);
      }
      const { data: shared } = await supabase
        .rpc("get_shared_plants", { result_limit: 50 });
      setCommunityPlants((shared as unknown as Plant[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleShare = async (plant: Plant) => {
    const { error } = await supabase
      .from("greenhouse_plants")
      .update({ is_shared: !plant.is_shared })
      .eq("id", plant.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: plant.is_shared ? "Made private" : "Shared with community!" });
      fetchPlants(userId);
    }
  };

  const deletePlant = async (id: string) => {
    const { error } = await supabase.from("greenhouse_plants").delete().eq("id", id);
    if (!error) {
      toast({ title: "Plant removed" });
      fetchPlants(userId);
    }
  };

  /* Categorise plants */
  const houseplants = plants.filter(p => p.plant_type === "houseplant");
  const forestSaplings = plants.filter(p => p.plant_type !== "houseplant" && !p.lineage_story && !p.origin_tree_id);
  const lineageSaplings = plants.filter(p => p.plant_type !== "houseplant" && (!!p.lineage_story || !!p.origin_tree_id));

  return (
    <div className="relative min-h-[60vh]">
      {/* Cover image background */}
      <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
        <img src={greenhouseCover} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
      </div>
      {/* Floating pollen / light motes */}
      <div className="absolute inset-0 -z-[5] rounded-2xl overflow-hidden">
        <GreenhouseMotes />
      </div>

      {/* Glass panel frame */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: '1px solid hsla(90, 30%, 70%, 0.4)',
          boxShadow: '0 4px 30px hsla(90, 20%, 40%, 0.08), inset 0 1px 0 hsla(60, 40%, 95%, 0.5)',
        }}
      >
        {/* Header — warm wood shelf */}
        <div
          className="px-6 py-5"
          style={{
            background: 'linear-gradient(180deg, hsla(30, 35%, 88%, 0.95) 0%, hsla(35, 30%, 85%, 0.9) 100%)',
            borderBottom: '1px solid hsla(30, 30%, 70%, 0.3)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, hsla(120, 35%, 65%, 0.25), hsla(90, 40%, 75%, 0.2))',
                  border: '1px solid hsla(120, 30%, 60%, 0.3)',
                  boxShadow: '0 2px 8px hsla(120, 30%, 50%, 0.1)',
                }}
              >
                <Sprout className="h-5 w-5" style={{ color: 'hsl(120, 35%, 45%)' }} />
              </motion.div>
              <div>
                <h2 className="text-xl font-serif tracking-wide" style={{ color: 'hsl(30, 30%, 25%)' }}>
                  Greenhouse
                </h2>
                <p className="text-xs font-serif tracking-wider" style={{ color: 'hsl(30, 20%, 50%)' }}>
                  The cradle of the forest
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  background: 'hsla(45, 60%, 90%, 0.6)',
                  border: '1px solid hsla(45, 50%, 75%, 0.3)',
                }}
              >
                <Sun className="h-3 w-3" style={{ color: 'hsl(40, 70%, 50%)' }} />
                <span className="text-[10px] font-serif tracking-widest" style={{ color: 'hsl(40, 40%, 40%)' }}>
                  DAYLIGHT
                </span>
              </motion.div>

              {userId && (
                <Button
                  onClick={() => setAddOpen(true)}
                  size="sm"
                  className="font-serif text-xs tracking-wider gap-1.5 rounded-xl shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, hsl(120, 30%, 50%), hsl(140, 35%, 45%))',
                    color: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsla(120, 25%, 55%, 0.5)',
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Add Plant
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Content: sectioned greenhouse layout ── */}
        <div className="px-6 py-6 space-y-6" style={{ background: 'hsla(90, 15%, 95%, 0.5)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-6 w-6" style={{ color: 'hsl(120, 30%, 55%)' }} />
              </motion.div>
              <p className="text-xs font-serif tracking-wider" style={{ color: 'hsl(90, 20%, 55%)' }}>
                Tending the greenhouse…
              </p>
            </div>
          ) : (
            <>
              {/* ═══ Section 1: My Plants — personal houseplants ═══ */}
              <section>
                <SectionBench
                  icon={<Leaf className="h-4 w-4" style={{ color: 'hsl(120, 30%, 45%)' }} />}
                  title="My Plants"
                  subtitle="Personal houseplants & indoor gardens"
                  count={houseplants.length}
                  accentHue={120}
                />
                {houseplants.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    <AnimatePresence mode="popLayout">
                      {houseplants.map((plant, i) => (
                        <motion.div
                          key={plant.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.05, duration: 0.4 }}
                        >
                          <HouseplantCard
                            plant={plant}
                            isOwner={plant.user_id === userId}
                            onToggleShare={() => toggleShare(plant)}
                            onDelete={() => deletePlant(plant.id)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <EmptyBench
                    message={userId ? "A quiet windowsill, ready for your first plant." : "Log in to start your greenhouse."}
                    action={userId ? () => setAddOpen(true) : undefined}
                  />
                )}
              </section>

              {/* ═══ Section 2: Forest Saplings — growing for the forest ═══ */}
              <section>
                <SectionBench
                  icon={<TreeDeciduous className="h-4 w-4" style={{ color: 'hsl(100, 35%, 42%)' }} />}
                  title="Forest Saplings"
                  subtitle="Growing for groves & restoration"
                  count={forestSaplings.length}
                  accentHue={100}
                />
                {forestSaplings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                      {forestSaplings.map((plant, i) => (
                        <motion.div
                          key={plant.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.06, duration: 0.4 }}
                        >
                          <SaplingCard
                            plant={plant}
                            isOwner={plant.user_id === userId}
                            onToggleShare={() => toggleShare(plant)}
                            onDelete={() => deletePlant(plant.id)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <EmptyBench
                    message="No forest saplings yet. Grow a sapling to help the forest."
                    action={userId ? () => setAddOpen(true) : undefined}
                    variant="forest"
                  />
                )}
              </section>

              {/* ═══ Section 3: Lineage Saplings — connected to Ancient Friends ═══ */}
              <section>
                <SectionBench
                  icon={<Shield className="h-4 w-4" style={{ color: 'hsl(35, 50%, 45%)' }} />}
                  title="Lineage Saplings"
                  subtitle="Connected to Ancient Friends & sacred groves"
                  count={lineageSaplings.length}
                  accentHue={35}
                />
                {lineageSaplings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                      {lineageSaplings.map((plant, i) => (
                        <motion.div
                          key={plant.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.06, duration: 0.4 }}
                        >
                          <SaplingCard
                            plant={plant}
                            isOwner={plant.user_id === userId}
                            onToggleShare={() => toggleShare(plant)}
                            onDelete={() => deletePlant(plant.id)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <EmptyBench
                    message="No lineage saplings yet. Grow a seed from an Ancient Friend."
                    variant="lineage"
                  />
                )}
              </section>

              {/* ═══ Community Saplings (shared) ═══ */}
              {communityPlants.length > 0 && (
                <section>
                  <SectionBench
                    icon={<Share2 className="h-4 w-4" style={{ color: 'hsl(200, 30%, 45%)' }} />}
                    title="Community Garden"
                    subtitle="Shared by the S33D community"
                    count={communityPlants.length}
                    accentHue={200}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {communityPlants.slice(0, 8).map((plant, i) => (
                      <motion.div
                        key={plant.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.35 }}
                      >
                        <HouseplantCard
                          plant={plant}
                          isOwner={false}
                          onToggleShare={() => {}}
                          onDelete={() => {}}
                        />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* ═══ Navigation links ═══ */}
              <GreenhouseNav />
            </>
          )}
        </div>
      </div>

      {userId && (
        <AddPlantDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          userId={userId}
          onAdded={() => fetchPlants(userId)}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Empty Bench — poetic empty state
   ═══════════════════════════════════════════════════════ */
const EmptyBench = ({
  message,
  action,
  variant = "default",
}: {
  message: string;
  action?: () => void;
  variant?: "default" | "forest" | "lineage";
}) => {
  const hue = variant === "forest" ? 100 : variant === "lineage" ? 35 : 120;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-8 text-center"
      style={{
        background: `radial-gradient(ellipse at 50% 80%, hsla(${hue}, 25%, 85%, 0.25) 0%, transparent 60%), hsla(0, 0%, 100%, 0.35)`,
        border: `1px dashed hsla(${hue}, 25%, 65%, 0.35)`,
      }}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {variant === "forest" ? (
          <TreeDeciduous className="h-8 w-8 mx-auto mb-3" style={{ color: `hsla(${hue}, 20%, 65%, 0.4)` }} />
        ) : variant === "lineage" ? (
          <Shield className="h-8 w-8 mx-auto mb-3" style={{ color: `hsla(${hue}, 30%, 60%, 0.4)` }} />
        ) : (
          <Leaf className="h-8 w-8 mx-auto mb-3" style={{ color: `hsla(${hue}, 20%, 65%, 0.4)` }} />
        )}
      </motion.div>
      <p className="font-serif text-xs" style={{ color: `hsl(${hue - 10}, 15%, 45%)` }}>
        {message}
      </p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action}
          className="mt-3 font-serif text-xs rounded-xl"
          style={{
            borderColor: `hsla(${hue}, 25%, 60%, 0.4)`,
            color: `hsl(${hue}, 30%, 40%)`,
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Plant
        </Button>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   Add Plant Dialog — glass greenhouse panel
   ═══════════════════════════════════════════════════════ */
const AddPlantDialog = ({
  open,
  onOpenChange,
  userId,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  onAdded: () => void;
}) => {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [notes, setNotes] = useState("");
  const [plantType, setPlantType] = useState<PlantType>("houseplant");
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>("growing");
  const [seedSource, setSeedSource] = useState("");
  const [lineageStory, setLineageStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isSapling = plantType !== "houseplant";

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("greenhouse").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("greenhouse").getPublicUrl(path);
      setPhotoUrl(publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("greenhouse_plants").insert({
        user_id: userId,
        name: name.trim(),
        species: species.trim() || null,
        photo_url: photoUrl,
        notes: notes.trim() || null,
        plant_type: plantType,
        lifecycle_stage: isSapling ? lifecycleStage : "growing",
        seed_source: seedSource.trim() || null,
        lineage_story: lineageStory.trim() || null,
      } as any);
      if (error) throw error;
      toast({ title: isSapling ? "Sapling recorded! 🌿" : "Plant added! 🌱" });
      setName(""); setSpecies(""); setNotes("");
      setPlantType("houseplant"); setLifecycleStage("growing");
      setSeedSource(""); setLineageStory("");
      setPhotoUrl(null); setPreviewUrl(null);
      onOpenChange(false);
      onAdded();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, hsla(80, 25%, 95%, 0.98), hsla(90, 20%, 92%, 0.98))',
          border: '1px solid hsla(90, 25%, 78%, 0.5)',
          boxShadow: '0 20px 60px hsla(90, 20%, 20%, 0.15), 0 1px 3px hsla(0, 0%, 0%, 0.04)',
        }}
      >
        {/* Warm wood accent bar */}
        <div
          className="h-1"
          style={{
            background: 'linear-gradient(90deg, hsla(120, 30%, 60%, 0.3), hsl(120, 35%, 55%), hsla(120, 30%, 60%, 0.3))',
          }}
        />

        <div className="px-6 pt-5 pb-0">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl tracking-wide flex items-center gap-2.5" style={{ color: 'hsl(30, 25%, 25%)' }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'hsla(120, 30%, 85%, 0.5)',
                  border: '1px solid hsla(120, 25%, 70%, 0.3)',
                }}
              >
                <Sprout className="h-4 w-4" style={{ color: 'hsl(120, 35%, 45%)' }} />
              </div>
              Add to Greenhouse
            </DialogTitle>
            <p className="text-xs font-serif tracking-wider mt-1" style={{ color: 'hsl(90, 15%, 50%)' }}>
              {isSapling ? "A new sapling for the forest" : "Log a houseplant or sapling"}
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 mt-3">
          {/* Plant type — warm botanical chips */}
          <div className="space-y-1.5">
            <Label className="font-serif text-[11px] tracking-widest uppercase" style={{ color: 'hsl(90, 15%, 50%)' }}>
              What are you growing?
            </Label>
            <div className="flex gap-1.5 flex-wrap">
              {(["houseplant", "sapling", "seedling", "cutting"] as PlantType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPlantType(t)}
                  className="px-3 py-2 rounded-xl font-serif text-[11px] tracking-wider transition-all duration-300"
                  style={{
                    background: plantType === t
                      ? 'linear-gradient(135deg, hsla(120, 30%, 82%, 0.7), hsla(100, 25%, 85%, 0.6))'
                      : 'hsla(90, 15%, 92%, 0.4)',
                    color: plantType === t ? 'hsl(120, 35%, 28%)' : 'hsl(90, 15%, 50%)',
                    border: `1px solid ${plantType === t ? 'hsla(120, 30%, 60%, 0.5)' : 'hsla(90, 15%, 80%, 0.3)'}`,
                    boxShadow: plantType === t ? '0 2px 8px hsla(120, 25%, 50%, 0.1)' : 'none',
                  }}
                >
                  {t === "houseplant" ? "🪴" : t === "sapling" ? "🌱" : t === "seedling" ? "🌰" : "✂️"} {PLANT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <FormField
            label="Name"
            required
            value={name}
            onChange={setName}
            placeholder={isSapling ? "e.g. Young Olive from Trevi" : "e.g. Kitchen Fern"}
            maxLength={100}
          />

          {/* Species */}
          <FormField
            label="Species"
            value={species}
            onChange={setSpecies}
            placeholder="e.g. Olea europaea"
            maxLength={100}
            italic
          />

          {/* Photo upload */}
          <div className="space-y-1.5">
            <Label className="font-serif text-[11px] tracking-widest uppercase" style={{ color: 'hsl(90, 15%, 50%)' }}>
              Photo
            </Label>
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid hsla(90, 20%, 80%, 0.5)' }}>
                <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-lg"
                  onClick={() => { setPreviewUrl(null); setPhotoUrl(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
                {uploading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'hsla(0, 0%, 100%, 0.7)', backdropFilter: 'blur(4px)' }}
                  >
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(120, 30%, 50%)' }} />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl p-5 text-center transition-all duration-300"
                style={{
                  border: '2px dashed hsla(120, 25%, 70%, 0.4)',
                  background: 'hsla(120, 20%, 95%, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsla(120, 30%, 55%, 0.5)';
                  e.currentTarget.style.background = 'hsla(120, 25%, 92%, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsla(120, 25%, 70%, 0.4)';
                  e.currentTarget.style.background = 'hsla(120, 20%, 95%, 0.3)';
                }}
              >
                <ImagePlus className="h-5 w-5 mx-auto mb-1.5" style={{ color: 'hsla(120, 20%, 65%, 0.5)' }} />
                <p className="text-[10px] font-serif" style={{ color: 'hsl(90, 15%, 55%)' }}>Upload a photo</p>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Notes */}
          <FormField
            label="Notes"
            value={notes}
            onChange={setNotes}
            placeholder="Care notes, observations…"
            maxLength={500}
          />

          {/* ── Sapling-specific fields ── */}
          <AnimatePresence>
            {isSapling && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Divider */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-px flex-1" style={{ background: 'hsla(90, 20%, 75%, 0.4)' }} />
                  <span className="text-[9px] font-serif tracking-widest" style={{ color: 'hsl(90, 15%, 55%)' }}>
                    FOREST DETAILS
                  </span>
                  <div className="h-px flex-1" style={{ background: 'hsla(90, 20%, 75%, 0.4)' }} />
                </div>

                {/* Lifecycle stage */}
                <div className="space-y-1.5">
                  <Label className="font-serif text-[11px] tracking-widest uppercase" style={{ color: 'hsl(90, 15%, 50%)' }}>
                    Growth Stage
                  </Label>
                  <div className="flex gap-1 flex-wrap">
                    {(["seed", "seedling", "sapling", "growing", "ready_to_plant"] as LifecycleStage[]).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setLifecycleStage(s)}
                        className="px-2.5 py-1.5 rounded-lg font-serif text-[10px] tracking-wider transition-all duration-200"
                        style={{
                          background: lifecycleStage === s
                            ? 'linear-gradient(135deg, hsla(120, 30%, 82%, 0.7), hsla(90, 25%, 85%, 0.6))'
                            : 'hsla(90, 15%, 92%, 0.4)',
                          color: lifecycleStage === s ? 'hsl(120, 35%, 28%)' : 'hsl(90, 15%, 50%)',
                          border: `1px solid ${lifecycleStage === s ? 'hsla(120, 30%, 60%, 0.4)' : 'hsla(90, 15%, 80%, 0.3)'}`,
                        }}
                      >
                        {LIFECYCLE_ICONS[s]} {LIFECYCLE_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seed source */}
                <FormField
                  label="Seed Source"
                  value={seedSource}
                  onChange={setSeedSource}
                  placeholder="e.g. Trevi Olive Grove, seed exchange"
                  maxLength={200}
                />

                {/* Lineage story */}
                <FormField
                  label="Lineage Story"
                  value={lineageStory}
                  onChange={setLineageStory}
                  placeholder="The story of this seed — where it came from, which tree…"
                  maxLength={500}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-serif text-xs rounded-xl"
              style={{
                borderColor: 'hsla(90, 20%, 75%, 0.5)',
                color: 'hsl(90, 15%, 45%)',
                background: 'hsla(0, 0%, 100%, 0.5)',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 font-serif text-xs tracking-wider gap-1.5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, hsl(120, 30%, 50%), hsl(140, 35%, 45%))',
                color: 'hsl(0, 0%, 100%)',
                border: '1px solid hsla(120, 25%, 55%, 0.5)',
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sprout className="h-3 w-3" />}
              {uploading ? "Uploading…" : isSapling ? "Plant Sapling" : "Add Plant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════
   FormField — reusable glass input
   ═══════════════════════════════════════════════════════ */
const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required,
  italic,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
  required?: boolean;
  italic?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label className="font-serif text-[11px] tracking-widest uppercase" style={{ color: 'hsl(90, 15%, 50%)' }}>
      {label} {required && "*"}
    </Label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
      placeholder={placeholder}
      maxLength={maxLength}
      required={required}
      className={`font-serif rounded-xl ${italic ? "italic" : ""}`}
      style={{
        background: 'hsla(0, 0%, 100%, 0.7)',
        borderColor: 'hsla(90, 20%, 75%, 0.5)',
        color: 'hsl(30, 20%, 25%)',
      }}
    />
  </div>
);

export default Greenhouse;
