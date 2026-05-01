/**
 * CouncilScrollEmbed — The "living scroll" of the Council invitation.
 * Embeds the current Notion invitation page. Update COUNCIL_INVITATION_URL
 * each new/full moon — everything else updates automatically.
 */
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Single source of truth for the current Council invitation. Update per cycle. */
export const COUNCIL_INVITATION_URL =
  "https://clammy-viscount-ddb.notion.site/2ee15b58480d80c28ccce97480f7a69d";

/** Notion embed URL (uses the /ebd/ path for an embeddable view). */
const COUNCIL_INVITATION_EMBED_URL =
  "https://clammy-viscount-ddb.notion.site/ebd/2ee15b58480d80c28ccce97480f7a69d";

const CouncilScrollEmbed = () => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || errored) return;
    const t = setTimeout(() => {
      if (!loadedRef.current) setErrored(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [errored]);

  const openInNotion = () => {
    window.open(COUNCIL_INVITATION_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-xl border border-primary/20 bg-[hsl(var(--card)/0.55)] backdrop-blur-sm p-4 md:p-5 space-y-4 shadow-[0_0_24px_-12px_hsl(var(--primary)/0.45)]"
    >
      {/* Soft gold glow edge */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-primary/15" />

      {/* Header */}
      <div className="flex items-start gap-2.5">
        <ScrollText className="h-5 w-5 text-primary/70 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-serif tracking-wide text-foreground/90">
            Council Scroll
          </h3>
          <p className="text-xs md:text-sm font-serif italic text-muted-foreground/70 leading-relaxed mt-0.5">
            The full invitation lives here as a shared scroll. Read, prepare, and step in when ready.
          </p>
        </div>
      </div>

      {/* Embed container */}
      <div className="relative rounded-lg overflow-hidden border border-border/30 bg-card/30">
        {!loaded && !errored && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/60 backdrop-blur-sm">
            <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground/50 font-serif mt-3 italic">
              Unrolling the scroll…
            </p>
          </div>
        )}

        {errored ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4 text-center">
            <p className="text-sm text-muted-foreground font-serif italic">
              The scroll could not unfurl here.
            </p>
            <Button variant="outline" size="sm" onClick={openInNotion} className="gap-2 font-serif">
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Notion
            </Button>
          </div>
        ) : (
          <iframe
            src={COUNCIL_INVITATION_EMBED_URL}
            className="w-full h-[520px] md:h-[680px] block"
            frameBorder={0}
            loading="lazy"
            allowFullScreen
            title="Council Invitation Scroll"
            onLoad={() => { loadedRef.current = true; setLoaded(true); }}
            onError={() => setErrored(true)}
          />
        )}

        {/* Optional fade gradient at bottom */}
        {loaded && !errored && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[hsl(var(--card)/0.6)] to-transparent" />
        )}
      </div>

      {/* Fallback link */}
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={openInNotion}
          className="gap-2 font-serif tracking-wide"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Full Scroll in Notion
        </Button>
        <p className="text-[10px] font-serif italic text-muted-foreground/50">
          If the scroll doesn't appear, open it in Notion.
        </p>
      </div>
    </motion.section>
  );
};

export default CouncilScrollEmbed;
