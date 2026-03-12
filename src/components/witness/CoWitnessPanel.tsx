/**
 * CoWitnessPanel — full flow for co-witness tree scanning.
 * Start a session, invite a second warden, confirm together.
 * Includes optional environmental sensing for Tree Health Snapshots.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Loader2,
  MapPin,
  Check,
  X,
  QrCode,
  Copy,
  Shield,
  Heart,
  Camera,
  Eye,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWitnessSession } from "@/hooks/use-witness-session";
import { useToast } from "@/hooks/use-toast";
import { WITNESS_BONUS_HEARTS } from "@/lib/witness-types";
import EnvironmentCapture from "./EnvironmentCapture";
import SnapshotBadge from "./SnapshotBadge";
import type { TreeHealthSnapshot, SnapshotQuality } from "@/lib/env-snapshot-types";

interface CoWitnessPanelProps {
  treeId: string;
  treeName: string;
  userId: string | null;
}

export default function CoWitnessPanel({
  treeId,
  treeName,
  userId,
}: CoWitnessPanelProps) {
  const [open, setOpen] = useState(false);
  const {
    session,
    loading,
    error,
    startSession,
    joinSession,
    findNearbySession,
    confirmWitness,
    cancelSession,
    clearError,
    lightReading,
    soundReading,
    setLightReading,
    setSoundReading,
  } = useWitnessSession(treeId);
  const { toast } = useToast();
  const [nearbySession, setNearbySession] = useState<any | null>(null);
  const [checkingNearby, setCheckingNearby] = useState(false);

  const handleOpen = useCallback(async () => {
    if (!userId) {
      toast({
        title: "Sign in to co-witness",
        variant: "destructive",
      });
      return;
    }
    setOpen(true);
    // Check for existing nearby sessions
    setCheckingNearby(true);
    const found = await findNearbySession();
    setNearbySession(found);
    setCheckingNearby(false);
  }, [userId, findNearbySession, toast]);

  const handleClose = useCallback(() => {
    setOpen(false);
    clearError();
  }, [clearError]);

  const handleStart = useCallback(async () => {
    await startSession();
  }, [startSession]);

  const handleJoin = useCallback(
    async (sessionId: string) => {
      await joinSession(sessionId);
    },
    [joinSession]
  );

  const handleConfirm = useCallback(async () => {
    await confirmWitness();
    toast({ title: "Confirmation recorded ✓" });
  }, [confirmWitness, toast]);

  const handleCancel = useCallback(async () => {
    await cancelSession();
    toast({ title: "Session cancelled" });
  }, [cancelSession, toast]);

  const shareUrl = session
    ? `${window.location.origin}/tree/${treeId}?witness=${session.id}`
    : "";

  const qrUrl = session
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=0a0a08&color=c8a96e&margin=2&format=svg`
    : "";

  const copyLink = useCallback(() => {
    navigator.clipboard?.writeText(shareUrl);
    toast({ title: "Link copied" });
  }, [shareUrl, toast]);

  // Check if session has been witnessed
  const isWitnessed = session?.status === "witnessed";
  const isWaiting = session?.status === "waiting";
  const isJoined = session?.status === "joined" || session?.status === "confirming";
  const myRole =
    session && userId
      ? userId === session.initiator_id
        ? "initiator"
        : "joiner"
      : null;
  const myConfirmed =
    myRole === "initiator"
      ? session?.initiator_confirmed
      : session?.joiner_confirmed;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 font-serif text-xs tracking-wider border-primary/30 hover:bg-primary/10"
        onClick={handleOpen}
      >
        <Users className="w-3.5 h-3.5" />
        Co-Witness
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg tracking-wide flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {isWitnessed
                ? "Witnessed! 🌿"
                : isJoined
                  ? "Confirm Together"
                  : isWaiting
                    ? "Awaiting Second Warden"
                    : "Co-Witness Scan"}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Error state */}
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="mt-2 w-full"
                >
                  Try again
                </Button>
              </motion.div>
            )}

            {/* WITNESSED — success */}
            {isWitnessed && (
              <motion.div
                key="witnessed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-primary/15 mx-auto flex items-center justify-center">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-serif text-foreground">
                    This tree has been co-witnessed.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Both wardens confirmed the record.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-serif gap-1 border-primary/30"
                >
                  <Heart className="w-3 h-3 text-primary" />+
                  {session?.hearts_awarded || WITNESS_BONUS_HEARTS} S33D Hearts
                  each
                </Badge>
              </motion.div>
            )}

            {/* JOINED / CONFIRMING — dual confirmation */}
            {isJoined && !error && (
              <motion.div
                key="confirming"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground font-serif text-center">
                  Both wardens are present at{" "}
                  <span className="text-foreground">{treeName}</span>.
                  <br />
                  Confirm the tree record together.
                </p>

                {/* Confirmation status */}
                <div className="grid grid-cols-2 gap-3">
                  <ConfirmCard
                    label="Warden 1"
                    confirmed={session?.initiator_confirmed ?? false}
                    isYou={myRole === "initiator"}
                  />
                  <ConfirmCard
                    label="Warden 2"
                    confirmed={session?.joiner_confirmed ?? false}
                    isYou={myRole === "joiner"}
                  />
                </div>

                {/* Data capture hints */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-serif">
                    Tip: Capture multiple angles — one from each side of the
                    canopy.
                  </span>
                </div>

                <div className="flex gap-2">
                  {!myConfirmed && (
                    <Button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 gap-2 font-serif tracking-wider"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Confirm
                    </Button>
                  )}
                  {myConfirmed && (
                    <div className="flex-1 flex items-center justify-center gap-2 text-sm text-primary font-serif">
                      <Check className="w-4 h-4" />
                      Waiting for other warden…
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="text-muted-foreground min-w-[44px] min-h-[44px]"
                    title="Cancel session"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* WAITING — show QR / link for second warden */}
            {isWaiting && !error && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground font-serif text-center">
                  Share this with another warden standing at{" "}
                  <span className="text-foreground">{treeName}</span>.
                </p>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="rounded-xl border border-border/30 bg-secondary/20 p-3">
                    <img
                      src={qrUrl}
                      alt="Witness session QR code"
                      width={160}
                      height={160}
                      className="rounded-lg"
                      loading="eager"
                    />
                  </div>
                </div>

                {/* Copy link */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  className="w-full gap-2 font-serif text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Invite Link
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="font-serif">Waiting for second warden…</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="w-full text-muted-foreground font-serif text-xs"
                >
                  Cancel Session
                </Button>
              </motion.div>
            )}

            {/* INITIAL — no session yet */}
            {!session && !error && (
              <motion.div
                key="initial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground font-serif text-center">
                  Invite another warden to co-witness this tree. Both must be
                  within 50m of the canopy.
                </p>

                <div className="rounded-lg border border-border/40 bg-secondary/10 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-serif">
                    <Shield className="w-4 h-4 text-primary/60" />
                    <span className="text-foreground">
                      Verified by dual GPS confirmation
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-serif">
                    <Heart className="w-4 h-4 text-primary/60" />
                    <span className="text-foreground">
                      +{WITNESS_BONUS_HEARTS} bonus S33D Hearts for each warden
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-serif">
                    <Camera className="w-4 h-4 text-primary/60" />
                    <span className="text-foreground">
                      Dual-device capture for richer records
                    </span>
                  </div>
                </div>

                {/* Nearby session alert */}
                {checkingNearby && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="font-serif">
                      Checking for nearby sessions…
                    </span>
                  </div>
                )}

                {nearbySession && (
                  <Button
                    onClick={() => handleJoin(nearbySession.id)}
                    disabled={loading}
                    className="w-full gap-2 font-serif tracking-wider"
                    variant="default"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    Join Nearby Session
                  </Button>
                )}

                <Button
                  onClick={handleStart}
                  disabled={loading}
                  className="w-full gap-2 font-serif tracking-wider"
                  variant={nearbySession ? "outline" : "default"}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  Start Witness Session
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Small card showing confirmation status for one warden */
function ConfirmCard({
  label,
  confirmed,
  isYou,
}: {
  label: string;
  confirmed: boolean;
  isYou: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 text-center space-y-1 transition-colors ${
        confirmed
          ? "border-primary/40 bg-primary/5"
          : "border-border/40 bg-secondary/10"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
          confirmed ? "bg-primary/15" : "bg-muted/30"
        }`}
      >
        {confirmed ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <MapPin className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <p className="text-xs font-serif text-foreground">{label}</p>
      {isYou && (
        <Badge variant="outline" className="text-[9px] font-serif">
          You
        </Badge>
      )}
      <p className="text-[10px] text-muted-foreground">
        {confirmed ? "Confirmed" : "Pending"}
      </p>
    </div>
  );
}
