import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { WifiOff, Wifi, Smartphone, AlertCircle, RotateCcw, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCompanionSession } from "@/hooks/use-companion-session";
import type { CompanionRoomState } from "@/lib/companion-types";
import { Input } from "@/components/ui/input";
import { hapticSuccess } from "@/lib/haptics";
import MapController from "./controllers/MapController";
import StaffController from "./controllers/StaffController";
import GalleryController from "./controllers/GalleryController";
import LedgerController from "./controllers/LedgerController";
import RoomNav from "./controllers/RoomNav";
import PointerPad from "./controllers/PointerPad";
import FullscreenToggle from "./controllers/FullscreenToggle";

export default function CompanionController() {
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get("code") ?? "";
  const [codeInput, setCodeInput] = useState(urlCode);
  const [error, setError] = useState("");
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

  const { session, paired, pairTimedOut, roomState, joinSession, sendCommand, disconnect } =
    useCompanionSession({ role: "controller" });

  useEffect(() => {
    if (urlCode && urlCode.length === 6 && !autoJoinAttempted && !session) {
      setAutoJoinAttempted(true);
      setCodeInput(urlCode.toUpperCase());
      joinSession(urlCode);
    }
  }, [urlCode, autoJoinAttempted, session, joinSession]);

  // Haptic on successful pair
  useEffect(() => {
    if (paired) hapticSuccess();
  }, [paired]);

  const handleJoin = () => {
    setError("");
    const normalized = codeInput.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length !== 6) {
      setError("Enter a 6-character code");
      return;
    }
    joinSession(normalized);
  };

  const handleRetry = () => {
    disconnect();
    setError("");
  };

  const fallbackState: CompanionRoomState = roomState ?? { room: "unknown", isFullscreen: false };

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
              Use the room buttons above to navigate, or open a fullscreen view on desktop.
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
        {(paired || session) && (
          <button
            onClick={disconnect}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif transition-colors min-h-[36px]",
              paired
                ? "bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20"
                : "bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground",
            )}
          >
            <WifiOff className="w-3.5 h-3.5" />
            {paired ? "Disconnect" : "Cancel"}
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {!session ? (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <div className="w-full max-w-xs flex flex-col items-center gap-5">
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
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  />
                  {error && <p className="text-xs text-destructive text-center">{error}</p>}
                  <button
                    onClick={handleJoin}
                    className="w-full py-3 rounded-xl text-sm font-serif min-h-[48px] bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </motion.div>
          ) : !paired ? (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                  {pairTimedOut ? (
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  ) : (
                    <Wifi className="w-8 h-8 text-primary animate-pulse" />
                  )}
                </div>
                {pairTimedOut ? (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-foreground font-serif">Could not connect</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Code <span className="font-mono text-primary">{session.code}</span> may be expired or incorrect.
                      </p>
                    </div>
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-serif min-h-[44px] bg-secondary/40 border border-border/30 text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Try again
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground font-serif">
                      Connecting to <span className="text-primary font-mono">{session.code}</span>…
                    </p>
                    <button
                      onClick={disconnect}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="controller"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col"
            >
              {/* Connected indicator */}
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs text-primary font-serif">Connected</span>
              </div>

              {/* Quick room navigation */}
              <RoomNav currentRoom={fallbackState.room} send={sendCommand} />

              {/* Room-specific controls */}
              <div className="flex-1 flex flex-col items-center justify-center max-w-xs mx-auto w-full">
                {renderController()}
              </div>

              {/* Pointer pad */}
              <div className="px-4 pb-2">
                <PointerPad send={sendCommand} />
              </div>

              {/* Fullscreen toggle */}
              <div className="px-4 pb-4">
                <FullscreenToggle isFullscreen={fallbackState.isFullscreen} send={sendCommand} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
