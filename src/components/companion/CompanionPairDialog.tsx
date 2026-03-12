import { useState } from "react";
import { Smartphone, X, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCompanion } from "@/contexts/CompanionContext";

/**
 * CompanionPairDialog — desktop overlay that shows a pairing code + QR.
 * Users scan or type the code on their mobile device to pair.
 */

interface CompanionPairDialogProps {
  className?: string;
}

export default function CompanionPairDialog({ className }: CompanionPairDialogProps) {
  const { session, paired, startSession, disconnect } = useCompanion();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (!session) startSession();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setOpen(false);
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
        title={paired ? "Companion connected" : "Pair mobile controller"}
        aria-label={paired ? "Companion connected" : "Pair mobile controller"}
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
              className="relative w-[340px] max-w-[90vw] rounded-2xl border border-border/30 bg-card p-6 shadow-2xl"
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
                <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>

                <div>
                  <h3 className="text-lg font-serif text-foreground">
                    {paired ? "Controller Connected" : "Companion Mode"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {paired
                      ? "Your mobile device is connected as a controller."
                      : "Scan the QR code or enter the code on your mobile device."}
                  </p>
                </div>

                {!paired && session && (
                  <>
                    {/* QR Code */}
                    <div className="rounded-xl border border-border/30 bg-secondary/20 p-3">
                      <img
                        src={qrApiUrl}
                        alt="Companion pairing QR code"
                        width={180}
                        height={180}
                        className="rounded-lg"
                        loading="eager"
                      />
                    </div>

                    {/* Short code */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">Or enter this code:</span>
                      <span className="text-2xl font-mono font-bold tracking-[0.3em] text-primary select-all">
                        {session.code}
                      </span>
                    </div>

                    {/* URL hint */}
                    <p className="text-[10px] text-muted-foreground/60">
                      Open <span className="font-mono">/companion</span> on your phone
                    </p>
                  </>
                )}

                {paired && (
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-serif min-h-[44px]
                      bg-destructive/10 border border-destructive/20 text-destructive
                      hover:bg-destructive/20 transition-colors"
                  >
                    <WifiOff className="w-4 h-4" />
                    Disconnect
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
