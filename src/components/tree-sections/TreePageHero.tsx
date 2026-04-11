/**
 * TreePageHero — Sacred arrival hero section for tree profile pages.
 * Full-width immersive layout with soft parallax, pulsing tree-ring halo,
 * gold leaf vignette, and primary CTAs.
 */
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Sparkles, Heart, Share2, Map, Wind, ImageIcon, Camera, Music, Lock } from "lucide-react";
import type { CheckinLight } from "@/hooks/use-tree-checkin-status";
import { Button } from "@/components/ui/button";
import TreePhotoStatus from "@/components/TreePhotoStatus";
import type { PhotoProcessingStatus } from "@/utils/backgroundPhotoProcessor";
import FullscreenShell from "@/components/FullscreenShell";
import FullscreenToggle from "@/components/FullscreenToggle";
import ZoomPanLayer from "@/components/ZoomPanLayer";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { Badge } from "@/components/ui/badge";
import HeartCanopyPulse from "@/components/HeartCanopyPulse";
import LeafAtmosphere from "@/components/LeafAtmosphere";
import PhenologyBadge from "@/components/PhenologyBadge";
import { getHiveForSpecies, type HiveInfo } from "@/utils/hiveUtils";
import type { SpeciesResolution } from "@/services/speciesResolver";
import type { Database } from "@/integrations/supabase/types";

const StaffPatronMapperBadge = lazy(() => import("@/components/tree-sections/StaffPatronMapperBadge"));
const TreeCheckinStatusLight = lazy(() => import("@/components/TreeCheckinStatusLight"));

type Tree = Database["public"]["Tables"]["trees"]["Row"];

interface TreePageHeroProps {
  tree: Tree;
  photoUrl: string | null;
  onMakeOffering: () => void;
  onAddPhoto?: () => void;
  onAddSong?: () => void;
  onAddWish: () => void;
  onViewMap: () => void;
  onShare: () => void;
  onGreetingCard?: () => void;
  onWhisper?: () => void;
  ecoBelonging: Array<{ id: string; name: string; type: string }>;
  onNavigateHive?: (slug: string) => void;
  onRetryPhoto?: () => void;
  /** True when offerings/whispers are gated by presence */
  presenceLocked?: boolean;
  /** Grace period label e.g. "8h 23m remaining" */
  graceLabel?: string | null;
  /** Check-in status light */
  checkinLight?: CheckinLight;
  /** Pre-resolved species data from parent */
  speciesResolution?: SpeciesResolution | null;
}

const TreePageHero = ({
  tree,
  photoUrl,
  onMakeOffering,
  onAddPhoto,
  onAddSong,
  onAddWish,
  onViewMap,
  onShare,
  onGreetingCard,
  onWhisper,
  ecoBelonging,
  onNavigateHive,
  onRetryPhoto,
  presenceLocked = false,
  graceLabel,
  checkinLight,
  speciesResolution,
}: TreePageHeroProps) => {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { isFullscreen: imageFullscreen, enterFullscreen: openImageFS, exitFullscreen: closeImageFS } = useFullscreen();
  const isAnchor = (tree as any).is_anchor_node;
  const photoStatus = ((tree as any).photo_status || "none") as PhotoProcessingStatus;
  const photoOriginalUrl = (tree as any).photo_original_url as string | null;

  // Determine the best available photo for display
  const displayPhoto = photoUrl
    || (tree as any).photo_processed_url
    || photoOriginalUrl;

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY * 0.3);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hive = speciesResolution?.hive ?? getHiveForSpecies(tree.species);
  const location = [tree.state, tree.nation].filter(Boolean).join(", ");

  return (
    <>
    <motion.div
      ref={heroRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative -mx-4 md:-mx-8 mb-10 overflow-hidden rounded-b-2xl"
      style={{ maxHeight: "min(85vh, 680px)" }}
    >
      {/* Background with parallax */}
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${scrollY}px)` }}
      >
        {displayPhoto ? (
          <img
            src={displayPhoto}
            alt={tree.name}
            className="w-full h-full object-cover opacity-30 cursor-pointer"
            loading="eager"
            onClick={() => openImageFS()}
            role="button"
            aria-label="View image fullscreen"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
            }}
          />
        )}

        {/* Photo processing status overlay */}
        <TreePhotoStatus
          status={photoStatus}
          originalUrl={photoOriginalUrl}
          onRetry={onRetryPhoto}
        />
        {/* Gold leaf vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, hsl(42 80% 55% / 0.06), transparent 50%),
              radial-gradient(ellipse at 70% 80%, hsl(42 80% 55% / 0.04), transparent 40%),
              linear-gradient(180deg, hsl(var(--background) / 0.3), hsl(var(--background) / 0.85) 60%, hsl(var(--background)))
            `,
          }}
        />
      </div>

      {/* Tree-ring pulse halo */}
      {isAnchor && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
          <div
            className="w-64 h-64 md:w-80 md:h-80 rounded-full pulse-cta"
            style={{
              background: "radial-gradient(circle, hsl(42 80% 55% / 0.04), transparent 70%)",
              border: "1px solid hsl(42 80% 55% / 0.06)",
            }}
          />
        </div>
      )}

      {/* Heart Canopy Pulse for anchor nodes */}
      {isAnchor && <HeartCanopyPulse treeName={tree.name} />}

      {/* Drifting leaf motes — sparse, max 2 visible */}
      <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
        <LeafAtmosphere variant="heartwood" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 md:px-10 pt-10 pb-8 md:pt-20 md:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Name */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1
              className="text-3xl md:text-5xl font-serif tracking-wide leading-tight"
              style={{ textShadow: "0 2px 12px hsl(var(--background) / 0.7), 0 1px 3px hsl(var(--background) / 0.5)" }}
            >
              {tree.name}
            </h1>
          </div>

          {/* Subtitle / Archetype */}
          {(tree as any).archetype && (
            <p className="text-sm md:text-base font-serif text-primary/70 tracking-widest uppercase mb-4">
              {(tree as any).archetype}
            </p>
          )}

          {/* Quote / Lore excerpt */}
          {(tree as any).lore_text && (
            <blockquote className="text-foreground/60 font-serif italic text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-6">
              "{(tree as any).lore_text.split("\n")[0]}"
            </blockquote>
          )}

          {/* Metadata pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-xs font-serif text-muted-foreground">
            <span className="bg-secondary/50 px-3 py-1 rounded-full">
              {speciesResolution?.displayName || tree.species}
              {speciesResolution?.scientificName && speciesResolution.scientificName !== (speciesResolution?.displayName || tree.species) && (
                <span className="text-[10px] italic text-muted-foreground/50 ml-1.5">
                  {speciesResolution.scientificName}
                </span>
              )}
            </span>
            {speciesResolution?.family && (
              <span className="bg-secondary/30 px-2.5 py-0.5 rounded-full text-[10px] text-muted-foreground/60">
                {speciesResolution.family}
              </span>
            )}
            {tree.estimated_age && (
              <span className="bg-secondary/50 px-3 py-1 rounded-full">~{tree.estimated_age} years</span>
            )}
            {location && (
              <span className="bg-secondary/50 px-3 py-1 rounded-full inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {location}
              </span>
            )}
            {ecoBelonging.map((br) => (
              <span key={br.id} className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                🌿 {br.name}
              </span>
            ))}
            {hive && onNavigateHive && (
              <button
                onClick={() => onNavigateHive(hive.slug)}
                className="bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 transition-colors inline-flex items-center gap-1"
              >
                {hive.icon} {hive.displayName}
              </button>
            )}
          </div>

          {/* Staff patron badge if mapped by patron */}
          <div className="flex justify-center mb-4">
            <Suspense fallback={null}>
              <StaffPatronMapperBadge mapperId={tree.created_by} />
            </Suspense>
          </div>

          {/* Phenology */}
          {tree.species && (
            <div className="flex justify-center mb-6">
              <PhenologyBadge
                speciesKey={tree.species.toLowerCase().replace(/ /g, "_")}
                speciesName={tree.species}
              />
            </div>
          )}

          {/* Primary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={onMakeOffering}
              className={`font-serif tracking-wider gap-2 ${presenceLocked ? "opacity-50 cursor-not-allowed" : "glow-subtle"}`}
              size="lg"
              disabled={presenceLocked}
            >
              {presenceLocked ? <Lock className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />} Make an Offering
            </Button>
            <Button
              onClick={onAddWish}
              variant="outline"
              className="font-serif tracking-wider gap-2 border-primary/30 hover:bg-primary/10"
              size="lg"
            >
              <Heart className="h-4 w-4" /> Add a Wish
            </Button>
          </div>

          {/* Unified Status Row — single source of presence state */}
          {checkinLight && (
            <div className="flex items-center justify-center mt-3">
              <Suspense fallback={null}>
                <TreeCheckinStatusLight light={checkinLight} size="md" showLabel timeRemaining={graceLabel} />
              </Suspense>
            </div>
          )}

          {/* Quick shortcuts — direct to flow, skip gateway */}
          {(onAddPhoto || onAddSong) && !presenceLocked && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {onAddPhoto && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddPhoto}
                  className="font-serif text-xs gap-1.5 text-muted-foreground hover:text-primary"
                >
                  <Camera className="h-3.5 w-3.5" /> Photo
                </Button>
              )}
              {onAddSong && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddSong}
                  className="font-serif text-xs gap-1.5 text-muted-foreground hover:text-primary"
                >
                  <Music className="h-3.5 w-3.5" /> Song
                </Button>
              )}
            </div>
          )}

          {/* Secondary actions */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="ghost" size="sm" className="font-serif text-xs gap-1.5" onClick={onViewMap}>
              <Map className="h-3.5 w-3.5" /> View on Atlas
            </Button>
            {onWhisper && (
              <Button
                variant="ghost"
                size="sm"
                className={`font-serif text-xs gap-1.5 ${presenceLocked ? "opacity-40 cursor-not-allowed" : ""}`}
                onClick={onWhisper}
                disabled={presenceLocked}
              >
                {presenceLocked ? <Lock className="h-3.5 w-3.5" /> : <Wind className="h-3.5 w-3.5" />} Whisper
              </Button>
            )}
            <Button variant="ghost" size="sm" className="font-serif text-xs gap-1.5" onClick={onShare}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            {onGreetingCard && (
              <Button variant="ghost" size="sm" className="font-serif text-xs gap-1.5" onClick={onGreetingCard}>
                <ImageIcon className="h-3.5 w-3.5" /> Card
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16"
        style={{ background: "linear-gradient(transparent, hsl(var(--background)))" }}
      />
    </motion.div>

    {/* Fullscreen image viewer */}
    <FullscreenShell active={imageFullscreen} tone="dark">
      {photoUrl && (
        <ZoomPanLayer className="flex-1 flex items-center justify-center">
          <div className="p-4">
            <img
              src={photoUrl}
              alt={tree.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </ZoomPanLayer>
      )}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none" data-capture-exclude>
        <p className="font-serif text-sm text-foreground/60">{tree.name}</p>
        {tree.species && <p className="text-xs text-muted-foreground mt-0.5">{tree.species}</p>}
      </div>
      <FullscreenToggle isFullscreen onToggle={closeImageFS} position="top-right" />
    </FullscreenShell>
    </>
  );
};

export default TreePageHero;
