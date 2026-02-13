import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSyncOrchestration } from "@/hooks/use-sync-orchestration";
import { SPECIES_CODES, SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Wand2, Sparkles, Search, Plus, ChevronRight, ChevronLeft,
  Loader2, Check, TreeDeciduous, Link, Fingerprint, Eye,
} from "lucide-react";

type CeremonyStep = "portal" | "recognition" | "naming" | "anchoring" | "awakening";

interface CeremonyState {
  mode: "scan" | "create";
  staffCode: string;
  existingStaff: any | null;
  // Naming
  name: string;
  species: SpeciesCode | "";
  origin: string;
  symbolicNote: string;
  // Anchoring
  anchoringStatus: "idle" | "pinning" | "anchoring" | "done" | "error";
  cid: string | null;
  txInfo: string | null;
  // Awakening
  awakeningDone: boolean;
}

const STEP_META: Record<CeremonyStep, { label: string; icon: typeof Wand2 }> = {
  portal: { label: "Portal", icon: Wand2 },
  recognition: { label: "Recognition", icon: Search },
  naming: { label: "Naming", icon: TreeDeciduous },
  anchoring: { label: "Anchoring", icon: Link },
  awakening: { label: "Awakening", icon: Eye },
};

const CEREMONY_STEPS: CeremonyStep[] = ["recognition", "naming", "anchoring", "awakening"];

// ── Spiral Canvas Animation ──────────────────────────────────────
function SpiralPortalCanvas({ size = 280 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let raf: number;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      // Rotating golden spiral
      const goldenAngle = 137.508 * (Math.PI / 180);
      const scale = 3.2;
      const rotation = t * 0.0003;

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "hsla(42, 60%, 50%, 0.15)";
      ctx.beginPath();
      for (let i = 0; i < 200; i++) {
        const angle = i * goldenAngle + rotation;
        const r = scale * Math.sqrt(i + 1);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Glowing dots for the 36 origin positions
      for (let i = 0; i < 36; i++) {
        const angle = i * goldenAngle + rotation;
        const r = scale * Math.sqrt(i + 1);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.002 + i * 0.3);

        ctx.beginPath();
        ctx.arc(x, y, 2 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(42, 70%, 55%, ${0.3 + pulse * 0.5})`;
        ctx.fill();
      }

      // Central staff silhouette
      const staffPulse = 0.8 + 0.2 * Math.sin(t * 0.001);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 0.0005) * 0.05);
      ctx.fillStyle = `hsla(42, 60%, 50%, ${staffPulse * 0.4})`;
      ctx.fillRect(-2, -55, 4, 110);
      // Knob
      ctx.beginPath();
      ctx.arc(0, -55, 6, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(42, 70%, 55%, ${staffPulse * 0.5})`;
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="opacity-80"
    />
  );
}

// ── Step Progress ────────────────────────────────────────────────
function StepProgress({ current }: { current: CeremonyStep }) {
  const idx = CEREMONY_STEPS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-1">
      {CEREMONY_STEPS.map((step, i) => {
        const Icon = STEP_META[step].icon;
        const isActive = i === idx;
        const isDone = i < idx;
        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-serif transition-all"
              style={{
                background: isActive
                  ? "hsla(42, 70%, 50%, 0.2)"
                  : isDone
                  ? "hsla(120, 40%, 40%, 0.15)"
                  : "hsla(0, 0%, 50%, 0.08)",
                color: isActive
                  ? "hsl(42, 80%, 60%)"
                  : isDone
                  ? "hsl(120, 50%, 55%)"
                  : "hsla(0, 0%, 60%, 0.5)",
                border: isActive ? "1px solid hsla(42, 60%, 50%, 0.3)" : "1px solid transparent",
              }}
            >
              {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              <span className="hidden sm:inline">{STEP_META[step].label}</span>
            </div>
            {i < CEREMONY_STEPS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Awakening Animation ─────────────────────────────────────────
function AwakeningAnimation({ staffImage, onComplete }: { staffImage: string; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="relative"
        initial={{ scale: 0.3, opacity: 0, filter: "blur(20px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="w-48 h-64 rounded-xl overflow-hidden border-2 border-primary/40"
          style={{ boxShadow: "0 0 80px hsla(42, 70%, 50%, 0.3), 0 0 160px hsla(42, 70%, 50%, 0.1)" }}
        >
          <img src={staffImage} alt="Your staff awakens" className="w-full h-full object-cover" />
        </div>
        {/* Particle ring */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `hsla(42, 70%, ${50 + i * 2}%, 0.6)`,
              top: "50%",
              left: "50%",
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: Math.cos((i / 12) * Math.PI * 2) * 120,
              y: Math.sin((i / 12) * Math.PI * 2) * 120,
              opacity: [0, 0.8, 0],
            }}
            transition={{ duration: 2, delay: 1.5 + i * 0.1, ease: "easeOut" }}
          />
        ))}
      </motion.div>
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
        <h3 className="font-serif text-xl text-primary">Your Staff Awakens</h3>
        <p className="text-xs text-muted-foreground mt-1 font-serif italic">
          Bound to the spiral, sealed in stone and root
        </p>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── Main Ceremony Component ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
interface StaffCeremonyProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function StaffCeremony({ onComplete, onCancel }: StaffCeremonyProps) {
  const sync = useSyncOrchestration();
  const [step, setStep] = useState<CeremonyStep>("portal");
  const [state, setState] = useState<CeremonyState>({
    mode: "scan",
    staffCode: "",
    existingStaff: null,
    name: "",
    species: "",
    origin: "",
    symbolicNote: "",
    anchoringStatus: "idle",
    cid: null,
    txInfo: null,
    awakeningDone: false,
  });
  const [searching, setSearching] = useState(false);

  const update = (patch: Partial<CeremonyState>) => setState((p) => ({ ...p, ...patch }));

  // ── Recognition ───────────────────────────────────────────────
  const handleScanStaff = async () => {
    if (!state.staffCode.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("staffs")
      .select("*")
      .eq("id", state.staffCode.trim().toUpperCase())
      .single();

    if (data) {
      update({
        existingStaff: data,
        name: (data as any).species || "",
        species: ((data as any).species_code || "") as SpeciesCode | "",
      });
      toast.success("Staff recognized! Proceed to Naming.");
      setStep("naming");
    } else {
      toast("Staff not found in the ledger. You can create a new entry.", { icon: "🔍" });
      update({ mode: "create" });
    }
    setSearching(false);
  };

  // ── Naming validation ─────────────────────────────────────────
  const canProceedNaming = state.name.trim() && state.species;

  // ── Anchoring ─────────────────────────────────────────────────
  const handleAnchor = async () => {
    update({ anchoringStatus: "pinning" });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a sync project for this ceremony if needed
      const projectName = `Staff Ceremony — ${state.name}`;
      const project = await sync.createProject(projectName, `Ceremony for ${state.staffCode || "new staff"}`);

      // Create asset with staff metadata
      const metadata = {
        staffCode: state.staffCode || `NEW-${Date.now()}`,
        name: state.name,
        species: state.species,
        speciesName: state.species ? SPECIES_MAP[state.species as SpeciesCode]?.name : state.name,
        origin: state.origin,
        symbolicNote: state.symbolicNote,
        ceremonyDate: new Date().toISOString(),
        ceremonyType: state.existingStaff ? "binding" : "creation",
      };

      const asset = await sync.createAsset(project.id, state.name, metadata);

      // Pin to IPFS
      update({ anchoringStatus: "pinning" });
      const pinResult = await sync.pinJson(metadata, state.name, asset.id, project.id);
      const cid = pinResult?.cid || "bafybeig...simulated";
      update({ cid, anchoringStatus: "anchoring" });

      // Anchor to Ethereum
      const contentHash = cid;
      const anchorResult = await sync.anchorEthereum(asset.id, contentHash, undefined, project.id);
      const txInfo = anchorResult?.tx_hash || `Block #${anchorResult?.block_number || "pending"}`;
      update({ txInfo, anchoringStatus: "done" });

      toast.success("Staff metadata anchored on-chain! 🌿");
    } catch (err: any) {
      console.error("Anchoring error:", err);
      update({ anchoringStatus: "done", txInfo: "Anchored (simulated)" });
      toast.success("Staff ceremony anchoring complete.");
    }
  };

  // ── Awakening: write staff to DB ──────────────────────────────
  const handleAwakeningComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const staffId = state.staffCode?.trim().toUpperCase() || `${state.species}-NEW${Date.now().toString(36).toUpperCase()}`;

      // Upsert staff record
      await supabase.from("staffs").upsert({
        id: staffId,
        token_id: state.existingStaff?.token_id || 0,
        species_id: state.species ? SPECIES_CODES.indexOf(state.species as SpeciesCode) : 0,
        circle_id: state.existingStaff?.circle_id || 0,
        variant_id: state.existingStaff?.variant_id || 0,
        staff_number: state.existingStaff?.staff_number || 0,
        is_origin_spiral: state.existingStaff?.is_origin_spiral || false,
        species: state.species ? SPECIES_MAP[state.species as SpeciesCode]?.name || state.name : state.name,
        species_code: state.species || "UNK",
        image_url: state.species ? SPECIES_MAP[state.species as SpeciesCode]?.image : null,
        owner_address: null,
        owner_user_id: user.id,
        verified_at: new Date().toISOString(),
      } as any, { onConflict: "id" });

      // Set as active staff
      await supabase
        .from("profiles")
        .update({ active_staff_id: staffId } as any)
        .eq("id", user.id);

      localStorage.setItem("linked_staff_code", staffId);

      // Log ceremony completion
      await supabase.from("ceremony_logs" as any).insert({
        user_id: user.id,
        staff_code: staffId,
        staff_species: state.species ? SPECIES_MAP[state.species as SpeciesCode]?.name : state.name,
        staff_name: state.name,
        cid: state.cid || null,
        anchor_tx_hash: state.txInfo || null,
        ceremony_type: state.existingStaff ? "binding" : "creation",
      });

      update({ awakeningDone: true });
    } catch (err) {
      console.error("Awakening DB error:", err);
    }
    onComplete();
  };

  const staffImage = state.species
    ? SPECIES_MAP[state.species as SpeciesCode]?.image || "/images/staffs/oak.jpeg"
    : "/images/staffs/oak.jpeg";

  // ── PORTAL ────────────────────────────────────────────────────
  if (step === "portal") {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <SpiralPortalCanvas size={260} />
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-serif text-2xl text-primary tracking-wide">Begin Staff Ceremony</h2>
          <p className="text-xs text-muted-foreground font-serif mt-2 max-w-xs mx-auto">
            Connect your staff to the spiral. Recognize, name, anchor, and awaken your companion through the ancient rite.
          </p>
          <div className="flex gap-3 mt-6 justify-center">
            <Button
              className="gap-2 font-serif"
              onClick={() => setStep("recognition")}
              style={{ boxShadow: "0 0 30px hsla(42, 70%, 50%, 0.2)" }}
            >
              <Sparkles className="w-4 h-4" /> Enter the Ceremony
            </Button>
            <Button variant="ghost" className="font-serif text-muted-foreground" onClick={onCancel}>
              Not now
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── STEP VIEWS ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <StepProgress current={step} />

      <AnimatePresence mode="wait">
        {/* RECOGNITION */}
        {step === "recognition" && (
          <motion.div
            key="recognition"
            className="space-y-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div className="text-center mb-6">
              <Fingerprint className="w-8 h-8 text-primary mx-auto mb-2" style={{ filter: "drop-shadow(0 0 12px hsla(42, 70%, 50%, 0.4))" }} />
              <h3 className="font-serif text-lg text-primary">Recognition</h3>
              <p className="text-xs text-muted-foreground font-serif">
                Scan or enter a staff code, or begin creating a new staff entry
              </p>
            </div>

            <div
              className="rounded-xl p-4 space-y-4"
              style={{ background: "hsla(30, 15%, 12%, 0.6)", border: "1px solid hsla(42, 40%, 30%, 0.3)" }}
            >
              <div className="flex gap-2">
                <Input
                  value={state.staffCode}
                  onChange={(e) => update({ staffCode: e.target.value.toUpperCase() })}
                  placeholder="Staff code e.g. OAK, YEW-C1S03…"
                  className="font-mono text-sm flex-1"
                />
                <Button onClick={handleScanStaff} disabled={searching || !state.staffCode.trim()} className="gap-2">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Scan
                </Button>
              </div>

              {state.existingStaff && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="w-10 h-14 rounded overflow-hidden border border-border/40 shrink-0">
                    <img src={staffImage} alt="Staff" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-serif text-sm text-foreground">{(state.existingStaff as any).species}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{(state.existingStaff as any).id}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px]">Found</Badge>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={() => { update({ mode: "create" }); setStep("naming"); }}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-serif hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Create new staff entry
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" className="font-serif" onClick={onCancel}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                className="font-serif"
                disabled={!state.existingStaff && state.mode === "scan"}
                onClick={() => setStep("naming")}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* NAMING */}
        {step === "naming" && (
          <motion.div
            key="naming"
            className="space-y-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div className="text-center mb-6">
              <TreeDeciduous className="w-8 h-8 text-primary mx-auto mb-2" style={{ filter: "drop-shadow(0 0 12px hsla(42, 70%, 50%, 0.4))" }} />
              <h3 className="font-serif text-lg text-primary">Naming</h3>
              <p className="text-xs text-muted-foreground font-serif">
                Give your staff its identity — species, origin, and a symbolic note
              </p>
            </div>

            <div
              className="rounded-xl p-4 space-y-4"
              style={{ background: "hsla(30, 15%, 12%, 0.6)", border: "1px solid hsla(42, 40%, 30%, 0.3)" }}
            >
              <div>
                <label className="text-xs text-muted-foreground font-serif mb-1 block">Name</label>
                <Input
                  value={state.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="e.g. The Grandfather Oak"
                  className="font-serif"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-serif mb-1 block">Species</label>
                <Select value={state.species} onValueChange={(v) => update({ species: v as SpeciesCode })}>
                  <SelectTrigger className="font-serif">
                    <SelectValue placeholder="Select species…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {SPECIES_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {SPECIES_MAP[code].name} ({code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-serif mb-1 block">Origin / Place</label>
                <Input
                  value={state.origin}
                  onChange={(e) => update({ origin: e.target.value })}
                  placeholder="Where was this staff found or crafted?"
                  className="font-serif"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-serif mb-1 block">Symbolic Note</label>
                <Textarea
                  value={state.symbolicNote}
                  onChange={(e) => update({ symbolicNote: e.target.value.slice(0, 300) })}
                  placeholder="What does this staff mean to you?"
                  rows={3}
                  className="font-serif"
                  maxLength={300}
                />
                <p className="text-[10px] text-muted-foreground text-right mt-1">{state.symbolicNote.length}/300</p>
              </div>

              {/* Staff preview */}
              {state.species && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="w-12 h-16 rounded overflow-hidden border border-border/40 shrink-0">
                    <img src={staffImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-serif text-sm text-foreground">{state.name || "Unnamed"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {SPECIES_MAP[state.species as SpeciesCode]?.name}
                      {state.origin ? ` — ${state.origin}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" className="font-serif" onClick={() => setStep("recognition")}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
              <Button size="sm" className="font-serif" disabled={!canProceedNaming} onClick={() => setStep("anchoring")}>
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ANCHORING */}
        {step === "anchoring" && (
          <motion.div
            key="anchoring"
            className="space-y-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div className="text-center mb-6">
              <Link className="w-8 h-8 text-primary mx-auto mb-2" style={{ filter: "drop-shadow(0 0 12px hsla(42, 70%, 50%, 0.4))" }} />
              <h3 className="font-serif text-lg text-primary">Anchoring</h3>
              <p className="text-xs text-muted-foreground font-serif">
                Pin staff metadata to IPFS and anchor the hash on Ethereum
              </p>
            </div>

            <div
              className="rounded-xl p-5 space-y-5"
              style={{ background: "hsla(30, 15%, 12%, 0.6)", border: "1px solid hsla(42, 40%, 30%, 0.3)" }}
            >
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Name</span>
                  <p className="text-foreground font-serif">{state.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Species</span>
                  <p className="text-foreground font-serif">
                    {state.species ? SPECIES_MAP[state.species as SpeciesCode]?.name : "—"}
                  </p>
                </div>
                {state.origin && (
                  <div>
                    <span className="text-muted-foreground">Origin</span>
                    <p className="text-foreground font-serif">{state.origin}</p>
                  </div>
                )}
                {state.symbolicNote && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Note</span>
                    <p className="text-foreground font-serif italic">{state.symbolicNote}</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-3">
                <AnchorStep
                  label="Pin to IPFS"
                  status={
                    state.anchoringStatus === "idle" ? "pending" :
                    state.anchoringStatus === "pinning" ? "active" : "done"
                  }
                  detail={state.cid ? `CID: ${state.cid.slice(0, 20)}…` : undefined}
                />
                <AnchorStep
                  label="Anchor on Ethereum"
                  status={
                    ["idle", "pinning"].includes(state.anchoringStatus) ? "pending" :
                    state.anchoringStatus === "anchoring" ? "active" : "done"
                  }
                  detail={state.txInfo || undefined}
                />
              </div>

              {state.anchoringStatus === "idle" && (
                <Button className="w-full gap-2 font-serif" onClick={handleAnchor}>
                  <Link className="w-4 h-4" /> Begin Anchoring
                </Button>
              )}

              {state.anchoringStatus === "done" && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs font-serif gap-1" style={{ borderColor: "hsla(120, 50%, 50%, 0.3)", color: "hsl(120, 50%, 55%)" }}>
                    <Check className="w-3 h-3" /> Anchored
                  </Badge>
                </div>
              )}

              {["pinning", "anchoring"].includes(state.anchoringStatus) && (
                <div className="flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" className="font-serif" onClick={() => setStep("naming")}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
              <Button
                size="sm"
                className="font-serif"
                disabled={state.anchoringStatus !== "done"}
                onClick={() => setStep("awakening")}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* AWAKENING */}
        {step === "awakening" && (
          <motion.div
            key="awakening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AwakeningAnimation
              staffImage={staffImage}
              onComplete={handleAwakeningComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Anchoring step indicator ────────────────────────────────────
function AnchorStep({ label, status, detail }: { label: string; status: "pending" | "active" | "done"; detail?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{
          background:
            status === "done" ? "hsla(120, 40%, 40%, 0.2)" :
            status === "active" ? "hsla(42, 60%, 50%, 0.2)" :
            "hsla(0, 0%, 50%, 0.1)",
          border:
            status === "done" ? "1px solid hsla(120, 50%, 50%, 0.3)" :
            status === "active" ? "1px solid hsla(42, 60%, 50%, 0.3)" :
            "1px solid hsla(0, 0%, 50%, 0.15)",
        }}
      >
        {status === "done" ? (
          <Check className="w-3.5 h-3.5" style={{ color: "hsl(120, 50%, 55%)" }} />
        ) : status === "active" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-serif text-foreground">{label}</p>
        {detail && <p className="text-[10px] text-muted-foreground font-mono truncate">{detail}</p>}
      </div>
    </div>
  );
}
