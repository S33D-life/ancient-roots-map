import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Leaf, ImagePlus, X, Share2, Lock, Trash2, Sprout, Sun,
} from "lucide-react";

/* ---------- Floating Pollen / Light Motes ---------- */
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
        // wrap
        if (m.y < -10) { m.y = h() + 10; m.x = Math.random() * w(); }
        if (m.x < -10) m.x = w() + 10;
        if (m.x > w() + 10) m.x = -10;

        // warm pollen glow
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(50, 70%, 80%, ${Math.max(0.05, a)})`;
        ctx.fill();

        // soft halo
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

interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string | null;
  photo_url: string | null;
  is_shared: boolean;
  notes: string | null;
  created_at: string;
}

const Greenhouse = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [communityPlants, setCommunityPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"mine" | "community">("mine");
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
        .from("greenhouse_plants")
        .select("*")
        .eq("is_shared", true)
        .order("created_at", { ascending: false });
      setCommunityPlants((shared as Plant[]) || []);
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

  const displayPlants = viewMode === "mine" ? plants : communityPlants;

  return (
    <div className="relative min-h-[60vh]">
      {/* Ambient daylight gradient background */}
      <div
        className="absolute inset-0 -z-10 rounded-2xl overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, hsla(90, 40%, 85%, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, hsla(140, 30%, 80%, 0.3) 0%, transparent 50%),
            linear-gradient(180deg, hsla(80, 25%, 95%, 0.9) 0%, hsla(90, 20%, 92%, 0.8) 50%, hsla(100, 15%, 88%, 0.7) 100%)
          `,
        }}
      />
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
                  Your houseplants &amp; saplings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Daylight indicator */}
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

        {/* View toggle — frosted glass tabs */}
        <div className="px-6 py-3" style={{ background: 'hsla(90, 20%, 93%, 0.7)' }}>
          <div
            className="inline-flex rounded-xl p-1 gap-1"
            style={{
              background: 'hsla(90, 15%, 88%, 0.6)',
              border: '1px solid hsla(90, 20%, 80%, 0.4)',
            }}
          >
            <button
              onClick={() => setViewMode("mine")}
              className="px-4 py-2 rounded-lg font-serif text-xs tracking-wider flex items-center gap-1.5 transition-all duration-300"
              style={{
                background: viewMode === "mine" ? 'hsla(0, 0%, 100%, 0.9)' : 'transparent',
                color: viewMode === "mine" ? 'hsl(120, 30%, 35%)' : 'hsl(90, 15%, 50%)',
                boxShadow: viewMode === "mine" ? '0 1px 4px hsla(0, 0%, 0%, 0.06)' : 'none',
              }}
            >
              <Leaf className="h-3 w-3" />
              My Plants ({plants.length})
            </button>
            <button
              onClick={() => setViewMode("community")}
              className="px-4 py-2 rounded-lg font-serif text-xs tracking-wider flex items-center gap-1.5 transition-all duration-300"
              style={{
                background: viewMode === "community" ? 'hsla(0, 0%, 100%, 0.9)' : 'transparent',
                color: viewMode === "community" ? 'hsl(120, 30%, 35%)' : 'hsl(90, 15%, 50%)',
                boxShadow: viewMode === "community" ? '0 1px 4px hsla(0, 0%, 0%, 0.06)' : 'none',
              }}
            >
              <Share2 className="h-3 w-3" />
              Community ({communityPlants.length})
            </button>
          </div>
        </div>

        {/* Plant grid — breathing space */}
        <div className="px-6 py-6" style={{ background: 'hsla(90, 15%, 95%, 0.5)' }}>
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
          ) : displayPlants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-12 text-center"
              style={{
                background: `
                  radial-gradient(ellipse at 50% 80%, hsla(120, 30%, 85%, 0.3) 0%, transparent 60%),
                  hsla(0, 0%, 100%, 0.4)
                `,
                border: '1px dashed hsla(120, 25%, 65%, 0.4)',
              }}
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Leaf className="h-12 w-12 mx-auto mb-4" style={{ color: 'hsla(120, 25%, 65%, 0.4)' }} />
              </motion.div>
              <p className="font-serif text-sm mb-1" style={{ color: 'hsl(30, 20%, 40%)' }}>
                {viewMode === "mine"
                  ? userId
                    ? "A quiet space, ready for growth."
                    : "Log in to start your greenhouse."
                  : "No shared plants yet. Be the first to share!"}
              </p>
              <p className="text-xs mb-4" style={{ color: 'hsl(90, 15%, 55%)' }}>
                {viewMode === "mine" && userId && "Add your first houseplant or sapling to begin."}
              </p>
              {viewMode === "mine" && userId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  className="font-serif text-xs rounded-xl"
                  style={{
                    borderColor: 'hsla(120, 25%, 60%, 0.4)',
                    color: 'hsl(120, 30%, 40%)',
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Plant
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {displayPlants.map((plant, i) => (
                  <motion.div
                    key={plant.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                  >
                    <PlantCard
                      plant={plant}
                      isOwner={plant.user_id === userId}
                      onToggleShare={() => toggleShare(plant)}
                      onDelete={() => deletePlant(plant.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
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

/* ---------- Plant Card — glass terracotta pot ---------- */

const PlantCard = ({
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
    {/* Image area — soft rounded container */}
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
      {/* Soft bottom gradient for text readability */}
      <div
        className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
        style={{
          background: 'linear-gradient(transparent, hsla(0, 0%, 100%, 0.4))',
        }}
      />
    </div>

    {/* Info — warm wood-toned card bottom */}
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
            {plant.is_shared ? "Make Private" : "Share"}
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

/* ---------- Add Plant Dialog — glass greenhouse panel ---------- */

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
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      });
      if (error) throw error;
      toast({ title: "Plant added! 🌱" });
      setName("");
      setSpecies("");
      setNotes("");
      setPhotoUrl(null);
      setPreviewUrl(null);
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
        className="max-w-md p-0 rounded-2xl overflow-hidden"
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
              Add Plant
            </DialogTitle>
            <p className="text-xs font-serif tracking-wider mt-1" style={{ color: 'hsl(90, 15%, 50%)' }}>
              Log a houseplant or sapling in your greenhouse
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 mt-3">
          <div className="space-y-1.5">
            <Label className="font-serif text-[11px] tracking-widest uppercase" style={{ color: 'hsl(90, 15%, 50%)' }}>
              Name *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              placeholder="e.g. Kitchen Fern"
              maxLength={100}
              required
              className="font-serif rounded-xl"
              style={{
                background: 'hsla(0, 0%, 100%, 0.7)',
                borderColor: 'hsla(90, 20%, 75%, 0.5)',
                color: 'hsl(30, 20%, 25%)',
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-serif text-[11px] tracking-widest uppercase" style={{ color: 'hsl(90, 15%, 50%)' }}>
              Species
            </Label>
            <Input
              value={species}
              onChange={(e) => setSpecies(e.target.value.slice(0, 100))}
              placeholder="e.g. Nephrolepis exaltata"
              maxLength={100}
              className="font-serif italic rounded-xl"
              style={{
                background: 'hsla(0, 0%, 100%, 0.7)',
                borderColor: 'hsla(90, 20%, 75%, 0.5)',
                color: 'hsl(30, 20%, 25%)',
              }}
            />
          </div>

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
                className="w-full rounded-xl p-6 text-center transition-all duration-300"
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
                <ImagePlus className="h-6 w-6 mx-auto mb-2" style={{ color: 'hsla(120, 20%, 65%, 0.5)' }} />
                <p className="text-xs font-serif" style={{ color: 'hsl(90, 15%, 55%)' }}>Click to upload a photo</p>
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
          <div className="space-y-1.5">
            <Label className="font-serif text-[11px] tracking-widest uppercase" style={{ color: 'hsl(90, 15%, 50%)' }}>
              Notes
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Any notes about this plant..."
              maxLength={500}
              className="font-serif rounded-xl"
              style={{
                background: 'hsla(0, 0%, 100%, 0.7)',
                borderColor: 'hsla(90, 20%, 75%, 0.5)',
                color: 'hsl(30, 20%, 25%)',
              }}
            />
          </div>

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
              {uploading ? "Uploading..." : "Add Plant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Greenhouse;
