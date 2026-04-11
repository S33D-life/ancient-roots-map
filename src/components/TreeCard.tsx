import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { MapPin, Heart, Map, Share2, Sparkles, Users, TreePine, Wind, Eye, Scroll, ExternalLink } from "lucide-react";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import { type TreeCardData, getTreeTier, TIER_LABELS, TIER_COLORS, getSpeciesHue } from "@/utils/treeCardTypes";
import { type EncounterCluster } from "@/utils/treeEncounterClustering";
import SendWhisperModal from "@/components/SendWhisperModal";
import TreeWhisperButton from "@/components/TreeWhisperButton";
import { goToTreeOnMap } from "@/utils/mapNavigation";
import QuickSeedButton from "@/components/QuickSeedButton";
import { useCurrentUser } from "@/hooks/use-current-user";

export type TreeCardVariant = "gallery" | "compact";

/** Presence signal for tree cards — matches popup format */
export interface TreeCardPresence {
  presence_state: "here_now" | "recently_met";
  presence_count: number;
}

interface TreeCardProps {
  tree: TreeCardData;
  variant?: TreeCardVariant;
  cluster?: EncounterCluster;
  offeringCount?: number;
  heroPhotoUrl?: string | null;
  birdsongCount?: number;
  whisperCount?: number;
  wishlistPulseActive?: boolean;
  /** Live presence signal from the map layer */
  presence?: TreeCardPresence | null;
  onSelect?: (tree: TreeCardData) => void;
  onWishlist?: (treeId: string) => void;
  onShare?: (name: string, description: string, url: string) => void;
  onNFTree?: (data: { id: string; name: string; species: string; photoUrl?: string | null }) => void;
  /** Called when user clicks "Claim / Visit" on a research tree */
  onVerify?: (tree: TreeCardData) => void;
}

/* ── Research badge strip (shared) ── */
const ResearchBadges = ({ tree }: { tree: TreeCardData }) => {
  const r = tree.research;
  if (!r) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-serif border-amber-500/30 bg-amber-500/10 text-amber-400">
        {r.verified ? "Verified" : "Seed Tree"}
      </Badge>
      {r.recordKind === "grove" && (
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-serif border-primary/20 bg-primary/5 text-primary">
          Grove
        </Badge>
      )}
      {r.sources?.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-primary transition-colors"
          title={s.title}
        >
          <Scroll className="w-2.5 h-2.5" />
          {s.program || (s.title.length > 18 ? s.title.slice(0, 16) + "…" : s.title)}
          {s.year ? ` (${s.year})` : ""}
          <ExternalLink className="w-2 h-2" />
        </a>
      ))}
    </div>
  );
};

const TreeCard = ({
  tree,
  variant = "gallery",
  cluster,
  offeringCount = 0,
  heroPhotoUrl,
  birdsongCount = 0,
  whisperCount = 0,
  wishlistPulseActive = false,
  presence,
  onSelect,
  onWishlist,
  onShare,
  onNFTree,
  onVerify,
}: TreeCardProps) => {
  const navigate = useNavigate();
  const { userId: currentUserId } = useCurrentUser();
  const [whisperOpen, setWhisperOpen] = useState(false);
  const age = tree.estimated_age ?? 0;
  const tier = useMemo(() => getTreeTier(age, offeringCount), [age, offeringCount]);
  const tierStyle = TIER_COLORS[tier];
  const speciesHue = getSpeciesHue(tree.species);
  const isResearch = !!tree.research?.isResearch;
  const hive = useMemo(() => getHiveForSpecies(tree.species), [tree.species]);

  const isClustered = cluster?.isClustered ?? false;
  const encounterCount = cluster?.encounters?.length ?? 0;
  const wandererCount = cluster?.wandererCount ?? 0;

  const handleClick = () => onSelect?.(tree);

  const handleMapNav = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToTreeOnMap(navigate, {
      treeId: tree.id,
      lat: tree.latitude ?? undefined,
      lng: tree.longitude ?? undefined,
      w3w: tree.what3words ?? undefined,
      zoom: 16,
      source: "tree",
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(
      tree.name,
      `${tree.name} — a ${tree.species} on the Ancient Friends Map`,
      `${window.location.origin}/tree/${tree.id}`
    );
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWishlist?.(tree.id);
  };

  const handleNFTree = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNFTree?.({ id: tree.id, name: tree.name, species: tree.species, photoUrl: heroPhotoUrl });
  };

  const handleVerify = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVerify?.(tree);
  };

  const openWhisper = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setWhisperOpen(true);
  };

  /* ── Compact variant (map sidebar, search results) ── */
  if (variant === "compact") {
    return (
      <>
      <Card
        className="border-border/40 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
        onClick={handleClick}
      >
        <div className="flex gap-3 p-3 relative">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted/30">
            {heroPhotoUrl ? (
              <img src={heroPhotoUrl} alt={tree.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <TreePine className="w-6 h-6 text-muted-foreground/30" />
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-serif text-sm text-primary truncate leading-tight">{tree.name}</h4>
            <p className="text-[11px] italic truncate" style={{ color: `hsl(${speciesHue}, 45%, 55%)` }}>
              {tree.species}
            </p>
            <div className="flex flex-col gap-1 mt-0.5">
              {/* Presence signal */}
              {presence && (
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: presence.presence_state === "here_now" ? "hsl(145, 50%, 55%)" : "hsl(210, 30%, 58%)" }}>
                  <span className="inline-block w-[5px] h-[5px] rounded-full shrink-0" style={{
                    background: presence.presence_state === "here_now" ? "hsl(145, 55%, 48%)" : "hsl(210, 35%, 58%)",
                    boxShadow: presence.presence_state === "here_now" ? "0 0 5px hsla(145, 55%, 48%, 0.5)" : "none",
                    opacity: presence.presence_state === "here_now" ? 1 : 0.7,
                  }} />
                  {presence.presence_state === "here_now"
                    ? presence.presence_count > 1 ? `${presence.presence_count} wanderers here now` : "Someone is here now"
                    : presence.presence_count > 1 ? `${presence.presence_count} wanderers here recently` : "Recently met"}
                </div>
              )}
              {/* Line 1: activity */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80">
                {offeringCount > 0 && <span className="text-primary/70">✦ {offeringCount}</span>}
                {birdsongCount > 0 && <span>🐦 {birdsongCount}</span>}
                {whisperCount > 0 && (
                  <span className="flex items-center gap-0.5 text-muted-foreground/60">
                    <Wind className="w-2.5 h-2.5" /> {whisperCount}
                  </span>
                )}
              </div>
              {/* Line 2: identity */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                {hive && <span>{hive.icon} {hive.displayName}</span>}
                {age > 0 && <span>🌿 ~{age}y</span>}
              </div>
            </div>
            {isResearch && <ResearchBadges tree={tree} />}
          </div>
          {/* Seed + Tier badges */}
          <div className="self-start flex items-center gap-1.5">
            <QuickSeedButton
              treeId={tree.id}
              treeLat={tree.latitude ?? null}
              treeLng={tree.longitude ?? null}
              userId={currentUserId}
              variant="icon"
              className="w-7 h-7"
            />
            <TreeWhisperButton onClick={openWhisper} className="h-7 w-7" />
            <Badge variant="outline" className={`text-[9px] h-5 ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} font-serif`}>
            {isResearch ? "Seed" : TIER_LABELS[tier]}
            </Badge>
          </div>
        </div>
      </Card>
      <SendWhisperModal
        open={whisperOpen}
        onOpenChange={setWhisperOpen}
        treeId={tree.id}
        treeName={tree.name}
        treeSpecies={tree.species}
        contextLabel={tree.what3words ? `/${tree.what3words}` : undefined}
      />
      </>
    );
  }

  /* ── Gallery variant (full card) ── */
  return (
    <>
    <Card className="border-border/40 hover:border-primary/25 transition-all duration-400 relative group">
      {/* Hero image */}
      {heroPhotoUrl && (
        <div className="relative w-full h-36 overflow-hidden rounded-t-lg">
          <img src={heroPhotoUrl} alt={tree.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Tier + encounter badges */}
      <div className="absolute top-2 left-2 z-10 flex gap-1.5">
        <Badge variant="outline" className={`text-[9px] h-5 ${isResearch ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : `${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`} font-serif backdrop-blur-sm`}>
          {isResearch ? (tree.research?.verified ? "Verified" : "Seed Tree") : TIER_LABELS[tier]}
        </Badge>
        {isResearch && tree.research?.recordKind === "grove" && (
          <Badge variant="outline" className="text-[9px] h-5 font-serif border-primary/20 bg-primary/5 text-primary backdrop-blur-sm">
            Grove
          </Badge>
        )}
      </div>
      {isClustered && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <TreeWhisperButton onClick={openWhisper} />
          <Badge variant="secondary" className="font-serif text-[10px] gap-1 bg-accent/20 text-accent border-accent/30 backdrop-blur-sm">
            <Users className="h-3 w-3" />
            {encounterCount} encounters
          </Badge>
        </div>
      )}
      {!isClustered && !isResearch && (
        <div className="absolute top-2 right-2 z-10">
          <TreeWhisperButton onClick={openWhisper} />
        </div>
      )}

      <CardHeader className="cursor-pointer pt-3 pb-1.5 pr-12" onClick={handleClick}>
        <CardTitle className="font-serif text-primary line-clamp-1 text-base leading-snug tracking-wide">
          {tree.name}
        </CardTitle>
        <p className="text-[11px] italic mt-0.5 font-serif" style={{ color: `hsl(${speciesHue}, 45%, 55%)` }}>
          {tree.species}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="cursor-pointer" onClick={handleClick}>
          {/* Two-line metadata layout */}
          <div className="flex flex-col gap-1.5">
            {/* Line 1: Activity / Presence — brighter */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              {isClustered && encounterCount > 0 && (
                <span className="font-serif text-muted-foreground/80">
                  🌿 Visited {encounterCount} time{encounterCount !== 1 ? "s" : ""}
                </span>
              )}
              {isClustered && wandererCount > 1 && (
                <span className="font-serif text-muted-foreground/70">
                  · {wandererCount} wanderers
                </span>
              )}
              {offeringCount > 0 && (
                <span className="text-primary/70">✦ {offeringCount}</span>
              )}
              {birdsongCount > 0 && (
                <span className="text-muted-foreground/70">🐦 {birdsongCount}</span>
              )}
              {whisperCount > 0 && (
                <span className="flex items-center gap-0.5 text-muted-foreground/60" title={`${whisperCount} whisper${whisperCount !== 1 ? "s" : ""}`}>
                  <Wind className="w-3 h-3" /> {whisperCount}
                </span>
              )}
            </div>

            {/* Line 2: Identity / Grounding — softer */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              {hive && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-2 font-serif border-border/25 bg-muted/15 text-muted-foreground/60"
                >
                  {hive.icon} {hive.displayName}
                </Badge>
              )}
              {age > 0 && (
                <span className="text-muted-foreground/50 font-serif">🌿 ~{age}y</span>
              )}
              {tree.what3words && (
                <span className="flex items-center gap-1 text-muted-foreground/40 font-serif truncate max-w-[140px]">
                  <MapPin className="w-3 h-3 shrink-0" />/{tree.what3words}
                </span>
              )}
            </div>
          </div>

          {/* Research source badges */}
          {isResearch && <div className="mt-1.5"><ResearchBadges tree={tree} /></div>}

          {tree.description && (
            <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed mt-2">{tree.description}</p>
          )}
        </div>

        {/* Action bar */}
        <div className="mt-3 pt-3 border-t border-border/20 flex gap-1.5">
          {isResearch ? (
            /* Research tree actions: Map + Verify */
            <>
              {(tree.latitude || tree.longitude) && (
                <Button variant="outline" size="sm" onClick={handleMapNav} className="flex-1 text-xs gap-1.5 font-serif h-8 border-border/30 text-muted-foreground hover:text-primary">
                  <Map className="w-3.5 h-3.5" /> View on Map
                </Button>
              )}
              {(tree.latitude || tree.longitude) && onVerify && (
                <Button variant="outline" size="sm" onClick={handleVerify} className="flex-1 text-xs gap-1.5 font-serif h-8 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300">
                  <Eye className="w-3.5 h-3.5" /> Claim / Visit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleShare} title="Share" className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-primary">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            /* Mapped tree actions (unchanged) */
            <>
              <QuickSeedButton
                treeId={tree.id}
                treeLat={tree.latitude ?? null}
                treeLng={tree.longitude ?? null}
                userId={currentUserId}
                variant="button"
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleWishlist} className="flex-1 text-xs gap-1.5 font-serif h-8 border-border/30 text-muted-foreground hover:text-primary">
                <Heart
                  className="w-3.5 h-3.5 transition-all duration-300"
                  style={wishlistPulseActive ? {
                    transform: "scale(1.3)",
                    color: "hsl(var(--primary))",
                    filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.4))",
                  } : undefined}
                />
                Wish
              </Button>
              {(tree.latitude || tree.what3words) && (
                <Button variant="ghost" size="sm" onClick={handleMapNav} title="View on Map" className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-primary">
                  <Map className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleShare} title="Share" className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-primary">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
    <SendWhisperModal
      open={whisperOpen}
      onOpenChange={setWhisperOpen}
      treeId={tree.id}
      treeName={tree.name}
      treeSpecies={tree.species}
      contextLabel={tree.what3words ? `/${tree.what3words}` : undefined}
    />
    </>
  );
};

export default TreeCard;
