import { useState } from "react";
import { Smartphone, X, Wifi, WifiOff, Monitor, Scan, Users, TreePine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCompanion } from "@/contexts/CompanionContext";
import type { CompanionFlowMode } from "@/lib/companion-types";

/**
 * CompanionPairDialog — desktop overlay with two modes:
 * 1. Controller: pair phone as remote
 * 2. Shared Encounter: connect with another wanderer
 */

interface CompanionPairDialogProps {
  className?: string;
}

export default function CompanionPairDialog({ className }: CompanionPairDialogProps) {
  const { session, paired, startSession, disconnect } = useCompanion();
  const [open, setOpen] = useState(false);
  const [flowMode, setFlowMode] = useState<CompanionFlowMode | null>(null);

  const handleOpen = () => {
    if (!session && !flowMode) {
      // Show mode selector first
    } else if (!session) {
      startSession();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (!paired) setFlowMode(null);
  };

  const handleDisconnect = () => {
    disconnect();
    setFlowMode(null);
    setOpen(false);
  };

  const handleSelectController = () => {
    setFlowMode("controller");
    if (!session) startSession();
  };

  // Build the companion URL for QR
  const companionUrl = session
    ? `${window.location.origin}/companion?code=${session.code}`
    : "";

  const qrApiUrl = session
    ? `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(companionUrl)}&bgcolor=0a0a08&color=c8a96e&margin=2&format=svg`
    : "";

  return (
    <>
      {/* Trigger button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-1.5 rounded-full backdrop-blur-md transition-all duration-200",
          "bg-card/65 border border-border/20 text-foreground/80",
          "hover:brightness-125 active:scale-95 px-3 py-1.5 min-h-[36px]",
          paired && "border-primary/40 bg-primary/10",
          className,
        )}
        title={paired ? "Companion connected" : "Companion Mode"}
        aria-label={paired ? "Companion connected" : "Companion Mode"}
      >
        {paired ? (
          <Wifi className="w-4 h-4 text-primary" />
        ) : (
          <Smartphone className="w-4 h-4" />
        )}
        <span className="hidden md:inline text-xs font-serif">
          {paired ? "Paired" : "Companion"}
        </span>
      </motion.button>

      {/* Dialog overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25 }}
              className="relative w-[400px] max-w-[92vw] rounded-2xl border border-border/30 bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center gap-4 text-center">
                <AnimatePresence mode="wait">
                  {/* ── Mode selector ── */}
                  {!flowMode && !paired && (
                    <motion.div key="selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                        <Smartphone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-serif text-foreground">Companion Mode</h3>
                        <p className="text-sm text-muted-foreground mt-1">Choose how to connect</p>
                      </div>

                      <div className="w-full flex flex-col gap-3 mt-2">
                        <button
                          onClick={handleSelectController}
                          className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:brightness-110 active:scale-[0.98]"
                          style={{ background: "hsl(var(--secondary) / 0.15)", border: "1px solid hsl(var(--border) / 0.2)" }}
                        >
                          <div className="p-2 rounded-lg shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                            <Monitor className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-serif text-foreground">Use as Controller</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Use your phone to guide this screen — map, gallery, rooms
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => setFlowMode("encounter")}
                          className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:brightness-110 active:scale-[0.98]"
                          style={{ background: "hsl(42 50% 50% / 0.06)", border: "1px solid hsl(42 50% 50% / 0.15)" }}
                        >
                          <div className="p-2 rounded-lg shrink-0" style={{ background: "hsl(42 50% 50% / 0.12)" }}>
                            <Users className="w-5 h-5" style={{ color: "hsl(42 50% 60%)" }} />
                          </div>
                          <div>
                            <p className="text-sm font-serif text-foreground">Shared Encounter</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Meet another wanderer at a tree — earn 3× hearts
                            </p>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Controller pairing (existing) ── */}
                  {flowMode === "controller" && !paired && session && (
                    <motion.div key="controller-pair" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                        <Monitor className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-serif text-foreground">Controller Mode</h3>
                        <p className="text-sm text-muted-foreground mt-1">Scan or enter the code on your phone</p>
                      </div>

                      <div className="rounded-xl border border-border/30 bg-secondary/20 p-3">
                        <img src={qrApiUrl} alt="Controller pairing QR code" width={180} height={180} className="rounded-lg" loading="eager" />
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">Or enter this code:</span>
                        <span className="text-2xl font-mono font-bold tracking-[0.3em] text-primary select-all">{session.code}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 w-full rounded-xl border border-border/20 bg-secondary/10 p-3">
                        <div className="flex items-start gap-2">
                          <Monitor className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-serif text-foreground">Desktop</p>
                            <p className="text-[10px] text-muted-foreground">Main display</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Smartphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-serif text-foreground">Phone</p>
                            <p className="text-[10px] text-muted-foreground">Controller</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                        <Scan className="w-3 h-3" />
                        <span>Open <span className="font-mono">/companion</span> on your phone</span>
                      </div>

                      <button onClick={() => { setFlowMode(null); disconnect(); }}
                        className="text-xs text-muted-foreground min-h-[32px]">← Back</button>
                    </motion.div>
                  )}

                  {/* ── Encounter info (desktop side) ── */}
                  {flowMode === "encounter" && !paired && (
                    <motion.div key="encounter-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center gap-4">
                      <div className="p-3 rounded-full" style={{ background: "hsl(42 50% 50% / 0.1)", border: "1px solid hsl(42 50% 50% / 0.2)" }}>
                        <Users className="w-6 h-6" style={{ color: "hsl(42 50% 60%)" }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-serif text-foreground">Shared Encounter</h3>
                        <p className="text-sm text-muted-foreground mt-1">Two wanderers, one tree</p>
                      </div>

                      <div className="w-full rounded-xl p-4 text-left space-y-2" style={{ background: "hsl(var(--secondary) / 0.1)", border: "1px solid hsl(var(--border) / 0.12)" }}>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-serif">How it works</p>
                        <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
                          <li className="flex items-start gap-2"><span>🌳</span> Both wanderers must be physically present at the same tree</li>
                          <li className="flex items-start gap-2"><span>📱</span> One creates the encounter, the other joins via code or QR</li>
                          <li className="flex items-start gap-2"><span>🤝</span> Shared presence verifies the tree's location</li>
                          <li className="flex items-start gap-2"><span>💛</span> All actions during the encounter earn 3× hearts</li>
                        </ul>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Open <span className="font-mono text-primary">/companion</span> on your phone to start or join an encounter
                      </p>

                      <button onClick={() => setFlowMode(null)}
                        className="text-xs text-muted-foreground min-h-[32px]">← Back</button>
                    </motion.div>
                  )}

                  {/* ── Connected state ── */}
                  {paired && (
                    <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                        <Smartphone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-serif text-foreground">Controller Connected</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your mobile device is controlling this desktop view.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/5 border border-primary/15 w-full">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                        </span>
                        <span className="text-sm font-serif text-primary">Live — actions sync in real-time</span>
                      </div>

                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-serif min-h-[44px]
                          bg-destructive/10 border border-destructive/20 text-destructive
                          hover:bg-destructive/20 transition-colors"
                      >
                        <WifiOff className="w-4 h-4" />
                        Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
