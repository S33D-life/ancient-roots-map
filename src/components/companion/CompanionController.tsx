import { useState } from "react";
import { WifiOff, Wifi, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCompanionSession } from "@/hooks/use-companion-session";
import type { CompanionRoomState } from "@/lib/companion-types";
import { Input } from "@/components/ui/input";
import MapController from "./controllers/MapController";
import StaffController from "./controllers/StaffController";
import GalleryController from "./controllers/GalleryController";
import LedgerController from "./controllers/LedgerController";

/**
 * CompanionController — the full mobile controller page.
 * Handles joining a session and rendering room-specific controls.
 */

export default function CompanionController() {
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");

  const { session, paired, roomState, joinSession, sendCommand, disconnect } =
    useCompanionSession({
      role: "controller",
    });

  const handleJoin = () => {
    setError("");
    const normalized = codeInput.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length !== 6) {
      setError("Enter a 6-character code");
      return;
    }
    joinSession(normalized);
  };

  const fallbackState: CompanionRoomState = roomState ?? {
    room: "unknown",
    isFullscreen: false,
  };

  // Render the room-specific controller
  const renderController = () => {
    switch (fallbackState.room) {
      case "map":
        return <MapController roomState={fallbackState} send={sendCommand} />;
      case "staff":
        return <StaffController roomState={fallbackState} send={sendCommand} />;
      case "gallery":
      case "tree":
      case "card":
        return <GalleryController roomState={fallbackState} send={sendCommand} />;
      case "ledger":
        return <LedgerController roomState={fallbackState} send={sendCommand} />;
      default:
        return (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground font-serif">
              Waiting for desktop to enter a room…
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Open a fullscreen view on desktop to see controls here.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          <span className="text-sm font-serif text-foreground">S33D Companion</span>
        </div>
        {paired && (
          <button
            onClick={disconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif
              bg-destructive/10 border border-destructive/20 text-destructive
              hover:bg-destructive/20 transition-colors"
          >
            <WifiOff className="w-3.5 h-3.5" />
            Disconnect
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {!session ? (
            /* Pairing form */
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-xs flex flex-col items-center gap-5"
            >
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                <Wifi className="w-8 h-8 text-primary" />
              </div>

              <div className="text-center">
                <h2 className="text-lg font-serif text-foreground">Pair with Desktop</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the 6-character code shown on your desktop screen.
                </p>
              </div>

              <div className="w-full flex flex-col gap-3">
                <Input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABCD23"
                  className="text-center text-2xl font-mono tracking-[0.3em] h-14 uppercase"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
                {error && (
                  <p className="text-xs text-destructive text-center">{error}</p>
                )}
                <button
                  onClick={handleJoin}
                  className="w-full py-3 rounded-xl text-sm font-serif
                    bg-primary text-primary-foreground
                    hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  Connect
                </button>
              </div>
            </motion.div>
          ) : !paired ? (
            /* Connecting */
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                  <Wifi className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-serif">
                Connecting to <span className="text-primary font-mono">{session.code}</span>…
              </p>
              <button
                onClick={disconnect}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            /* Controller surface */
            <motion.div
              key="controller"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-xs"
            >
              {/* Connected indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs text-primary font-serif">Connected</span>
              </div>

              {renderController()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
