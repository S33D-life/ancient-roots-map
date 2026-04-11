import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TreePine, Heart, WifiOff, RotateCcw, AlertCircle, Scan, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSharedEncounter } from "@/hooks/use-shared-encounter";
import type { SharedEncounterState } from "@/lib/companion-types";

interface Props {
  onBack: () => void;
  /** Pre-filled tree context if user is near a tree */
  treeContext?: { treeId: string; treeName: string };
  /** Current user info */
  user?: { userId: string; displayName: string };
}

export default function SharedEncounterView({ onBack, treeContext, user }: Props) {
  const [subMode, setSubMode] = useState<"choose" | "host" | "join">("choose");
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");

  const fallbackUser = user ?? { userId: "anon", displayName: "Wanderer" };
  const { session, encounter, paired, pairTimedOut, hostEncounter, joinEncounter, leave } = useSharedEncounter();

  const handleHost = () => {
    if (!treeContext) return;
    hostEncounter(treeContext.treeId, treeContext.treeName, fallbackUser);
    setSubMode("host");
  };

  const handleJoin = () => {
    setError("");
    const normalized = codeInput.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length !== 6) { setError("Enter a 6-character code"); return; }
    joinEncounter(normalized, fallbackUser);
  };

  const qrUrl = session
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/companion?encounter=${session.code}`)}&bgcolor=0a0a08&color=c8a96e&margin=2&format=svg`
    : "";

  if (paired && encounter) {
    return <EncounterActive encounter={encounter} onLeave={leave} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-xs flex flex-col items-center gap-5">
        {/* Back */}
        <button onClick={onBack} className="self-start flex items-center gap-1 text-xs text-muted-foreground min-h-[32px]">
          <ArrowLeft className="w-3 h-3" /> Back
        </button>

        <div className="p-4 rounded-full" style={{ background: "hsl(42 50% 50% / 0.1)", border: "1px solid hsl(42 50% 50% / 0.2)" }}>
          <Users className="w-8 h-8" style={{ color: "hsl(42 50% 60%)" }} />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-serif text-foreground">Shared Encounter</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {treeContext
              ? `Connect at ${treeContext.treeName}`
              : "Join another wanderer at a tree"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!session && subMode === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full flex flex-col gap-3">
              {treeContext && (
                <button onClick={handleHost}
                  className="w-full py-3 rounded-xl text-sm font-serif min-h-[48px] transition-all active:scale-[0.98]"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  Bring someone here
                </button>
              )}
              <button onClick={() => setSubMode("join")}
                className="w-full py-3 rounded-xl text-sm font-serif min-h-[48px] transition-all active:scale-[0.98]"
                style={{ background: "hsl(var(--secondary) / 0.3)", border: "1px solid hsl(var(--border) / 0.25)", color: "hsl(var(--foreground))" }}>
                Enter encounter code
              </button>

              {/* Info card */}
              <div className="w-full rounded-xl p-3 space-y-1.5 mt-1" style={{ background: "hsl(var(--secondary) / 0.12)", border: "1px solid hsl(var(--border) / 0.12)" }}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-serif">How it works</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-none">
                  <li className="flex items-start gap-2"><span>🌳</span> Both wanderers must be at the same tree</li>
                  <li className="flex items-start gap-2"><span>🤝</span> Connect via QR or short code</li>
                  <li className="flex items-start gap-2"><span>💛</span> Shared encounters earn 3× hearts</li>
                  <li className="flex items-start gap-2"><span>📍</span> Dual presence strengthens tree verification</li>
                </ul>
              </div>
            </motion.div>
          )}

          {!session && subMode === "join" && (
            <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full flex flex-col gap-3">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABCD23"
                className="text-center text-2xl font-mono tracking-[0.3em] h-14 uppercase"
                autoFocus inputMode="text" autoCapitalize="characters" autoComplete="off"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              {error && <p className="text-xs text-destructive text-center">{error}</p>}
              <button onClick={handleJoin}
                className="w-full py-3 rounded-xl text-sm font-serif min-h-[48px] active:scale-[0.98] transition-all"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                Join encounter
              </button>
              <button onClick={() => setSubMode("choose")} className="text-xs text-muted-foreground min-h-[32px]">Back</button>
            </motion.div>
          )}

          {session && !paired && (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center gap-4">
              {pairTimedOut ? (
                <>
                  <AlertCircle className="w-8 h-8 text-destructive" />
                  <p className="text-sm text-foreground font-serif">Could not connect</p>
                  <button onClick={() => { leave(); setSubMode("choose"); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-serif min-h-[44px]"
                    style={{ background: "hsl(var(--secondary) / 0.3)", border: "1px solid hsl(var(--border) / 0.25)" }}>
                    <RotateCcw className="w-4 h-4" /> Try again
                  </button>
                </>
              ) : session.role === "host" ? (
                <>
                  {/* QR for host */}
                  <div className="rounded-xl border border-border/30 p-3" style={{ background: "hsl(var(--secondary) / 0.15)" }}>
                    <img src={qrUrl} alt="Encounter QR" width={160} height={160} className="rounded-lg" loading="eager" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">Share this code with the other wanderer:</span>
                    <span className="text-2xl font-mono font-bold tracking-[0.3em] text-primary select-all">{session.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                    <Scan className="w-3 h-3" />
                    <span>Waiting for another wanderer to join…</span>
                  </div>
                  <button onClick={leave} className="text-xs text-muted-foreground min-h-[36px]">Cancel</button>
                </>
              ) : (
                <>
                  <Users className="w-8 h-8 text-primary animate-pulse" />
                  <p className="text-sm text-muted-foreground font-serif">
                    Connecting to encounter <span className="text-primary font-mono">{session.code}</span>…
                  </p>
                  <button onClick={leave} className="text-xs text-muted-foreground min-h-[36px]">Cancel</button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/** Active encounter UI shown once two users are connected */
function EncounterActive({ encounter, onLeave }: { encounter: SharedEncounterState; onLeave: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-xs flex flex-col items-center gap-5">
        {/* Connection glow */}
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
            style={{ background: "hsl(42 60% 55% / 0.2)", filter: "blur(12px)" }}
          />
          <div className="relative p-4 rounded-full" style={{ background: "hsl(42 50% 50% / 0.15)", border: "1px solid hsl(42 50% 50% / 0.3)" }}>
            <TreePine className="w-8 h-8" style={{ color: "hsl(42 50% 60%)" }} />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-serif text-foreground">{encounter.treeName}</h2>
          <p className="text-sm mt-1" style={{ color: "hsl(42 50% 60%)" }}>This encounter is shared</p>
        </div>

        {/* Participants */}
        <div className="w-full rounded-xl p-3" style={{ background: "hsl(var(--secondary) / 0.12)", border: "1px solid hsl(var(--border) / 0.15)" }}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-serif mb-2">Present</p>
          <div className="space-y-2">
            {encounter.participants.map((p) => (
              <div key={p.userId} className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-serif text-foreground">{p.displayName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reward info */}
        <div className="w-full rounded-xl p-3 text-center" style={{
          background: "linear-gradient(135deg, hsl(42 50% 50% / 0.08), hsl(120 20% 25% / 0.08))",
          border: "1px solid hsl(42 50% 50% / 0.2)",
        }}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Heart className="w-4 h-4" style={{ color: "hsl(42 50% 60%)" }} />
            <span className="text-sm font-serif" style={{ color: "hsl(42 50% 60%)" }}>3× hearts active</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            This shared encounter strengthens the tree's position and earns triple hearts for offerings, whispers, and presence
          </p>
        </div>

        {/* Verification badge */}
        {encounter.verified && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-serif"
            style={{ background: "hsl(120 25% 25% / 0.2)", color: "hsl(120 30% 65%)", border: "1px solid hsl(120 25% 35% / 0.3)" }}>
            <span>📍</span> Dual presence verified — tree confidence increased
          </div>
        )}

        {/* Leave */}
        <button
          onClick={onLeave}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-serif min-h-[44px]
            transition-colors"
          style={{ background: "hsl(var(--destructive) / 0.1)", border: "1px solid hsl(var(--destructive) / 0.2)", color: "hsl(var(--destructive))" }}
        >
          <WifiOff className="w-4 h-4" />
          Leave encounter
        </button>
      </div>
    </motion.div>
  );
}
