/**
 * CouncilRoom — Jitsi Meet embed for live Council gatherings.
 * Isolated, reusable, future-ready for Jitsi External API swap.
 */
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Maximize2, Minimize2, Radio, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const JITSI_BASE = "https://meet.jit.si";

/** Sanitise a string into a URL-safe, human-readable room slug. */
function toRoomSlug(raw: string): string {
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "S33D-Council-of-Life";
}

interface CouncilRoomProps {
  /** If provided, used as the room name directly. */
  councilTitle?: string;
  /** Moon phase label, e.g. "Full Moon". */
  moonPhase?: string;
  /** Optional metadata for the header area. */
  meta?: {
    date?: string;
    host?: string;
    treeOfWeek?: string;
    plantOfWeek?: string;
    bookOfWeek?: string;
  };
}

const CouncilRoom = ({ councilTitle, moonPhase, meta }: CouncilRoomProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Timeout fallback: if iframe hasn't loaded after 10s, show error state
  useEffect(() => {
    if (iframeLoaded || iframeError) return;
    const timer = setTimeout(() => {
      if (!iframeLoaded) setIframeError(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [iframeLoaded, iframeError]);

  const roomName = useMemo(() => {
    if (councilTitle) return toRoomSlug(`S33D-${councilTitle}`);
    if (moonPhase) return toRoomSlug(`S33D-${moonPhase}-Council`);
    return "S33D-Council-of-Life";
  }, [councilTitle, moonPhase]);

  const roomUrl = `${JITSI_BASE}/${roomName}`;
  const embedUrl = `${roomUrl}#config.prejoinPageEnabled=true&config.disableDeepLinking=true`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(roomUrl).then(() => {
      toast.success("Room link copied");
    });
  }, [roomUrl]);

  const handleOpenNewTab = useCallback(() => {
    window.open(roomUrl, "_blank", "noopener,noreferrer");
  }, [roomUrl]);

  /* ── Fullscreen wrapper ── */
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-card/80 backdrop-blur">
          <p className="font-serif text-sm text-foreground/80 tracking-wide">Council Chamber</p>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)} aria-label="Exit fullscreen">
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
        <iframe
          src={embedUrl}
          className="flex-1 w-full"
          allow="camera; microphone; fullscreen; display-capture"
          allowFullScreen
          title="Council Room"
        />
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-4"
    >
      {/* ── Chamber header ── */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Radio className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-serif">
            Council room is live
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-foreground/90">
          Enter the Council Chamber
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground/60 font-serif max-w-md mx-auto leading-relaxed italic">
          Gather beneath the branches, listen, share, and leave a trace in the living ledger.
        </p>

        {/* Future metadata area — collapsible */}
        {meta && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors font-serif mt-1"
          >
            Session details {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
        {meta && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground/50 font-serif"
          >
            {meta.date && <span>📅 {meta.date}</span>}
            {meta.host && <span>🌿 Host: {meta.host}</span>}
            {meta.treeOfWeek && <span>🌳 Tree: {meta.treeOfWeek}</span>}
            {meta.plantOfWeek && <span>🌱 Plant: {meta.plantOfWeek}</span>}
            {meta.bookOfWeek && <span>📖 Book: {meta.bookOfWeek}</span>}
          </motion.div>
        )}
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={handleCopyLink} aria-label="Copy room link">
          <Copy className="w-3 h-3" /> Copy link
        </Button>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={handleOpenNewTab} aria-label="Open room in new tab">
          <ExternalLink className="w-3 h-3" /> New tab
        </Button>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={() => setIsFullscreen(true)} aria-label="Fullscreen">
          <Maximize2 className="w-3 h-3" /> Fullscreen
        </Button>
      </div>

      {/* ── Embed container ── */}
      <div className="relative rounded-xl border border-border/30 overflow-hidden shadow-lg bg-card/20">
        {/* Loading state */}
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-card/60 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground/50 font-serif mt-3">Preparing the chamber…</p>
          </div>
        )}

        {/* Error fallback */}
        {iframeError && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-sm text-muted-foreground font-serif">The chamber could not be opened here.</p>
            <Button variant="outline" size="sm" onClick={handleOpenNewTab} className="gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> Open room directly
            </Button>
          </div>
        )}

        {!iframeError && (
          <iframe
            src={embedUrl}
            className="w-full min-h-[65vh] md:min-h-[700px]"
            allow="camera; microphone; fullscreen; display-capture"
            allowFullScreen
            title="Council Room"
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeError(true)}
          />
        )}
      </div>

      {/* ── Future ledger placeholder ── */}
      <div className="rounded-xl border border-border/15 bg-card/10 p-4 text-center space-y-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30 font-serif">
          Session ledger
        </p>
        <p className="text-[10px] text-muted-foreground/25 font-serif italic">
          Notes · Attendance · Scroll — coming soon
        </p>
      </div>
    </motion.section>
  );
};

export default CouncilRoom;
