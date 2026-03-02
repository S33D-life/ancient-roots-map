import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, Map, Share2, Sparkles, Users, TreePine } from "lucide-react";
import { type TreeCardData, type OfferingSummary, getTreeTier, TIER_LABELS, TIER_COLORS, getSpeciesHue } from "@/utils/treeCardTypes";
import { type EncounterCluster } from "@/utils/treeEncounterClustering";

export type TreeCardVariant = "gallery" | "compact";

interface TreeCardProps {
  tree: TreeCardData;
  variant?: TreeCardVariant;
  /** Encounter cluster when in gallery mode */
  cluster?: EncounterCluster;
  /** Offering count for this tree */
  offeringCount?: number;
  /** First photo URL for hero image */
  heroPhotoUrl?: string | null;
  /** Birdsong count */
  birdsongCount?: number;
  /** Whether a wishlist animation is playing */
  wishlistPulseActive?: boolean;
  /** Callbacks */
  onSelect?: (tree: TreeCardData) => void;
  onWishlist?: (treeId: string) => void;
  onShare?: (name: string, description: string, url: string) => void;
  onNFTree?: (data: { id: string; name: string; species: string; photoUrl?: string | null }) => void;
}

const TreeCard = ({
  tree,
  variant = "gallery",
  cluster,
  offeringCount = 0,
  heroPhotoUrl,
  birdsongCount = 0,
  wishlistPulseActive = false,
  onSelect,
  onWishlist,
  onShare,
  onNFTree,
}: TreeCardProps) => {
  const navigate = useNavigate();
  const age = tree.estimated_age ?? 0;
  const tier = useMemo(() => getTreeTier(age, offeringCount), [age, offeringCount]);
  const tierStyle = TIER_COLORS[tier];
  const speciesHue = getSpeciesHue(tree.species);

  const isClustered = cluster?.isClustered ?? false;
  const encounterCount = cluster?.encounters?.length ?? 0;
  const wandererCount = cluster?.wandererCount ?? 0;

  const handleClick = () => onSelect?.(tree);

  const handleMapNav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tree.latitude && tree.longitude) {
      navigate(`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=16&treeId=${tree.id}`);
    } else if (tree.what3words) {
      navigate(`/map?w3w=${tree.what3words}&treeId=${tree.id}`);
    }
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

  /* ── Compact variant (map sidebar, search results) ── */
  if (variant === "compact") {
    return (
      <Card
        className="border-border/40 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
        onClick={handleClick}
      >
        <div className="flex gap-3 p-3">
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
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {age > 0 && <span>🌿 ~{age}y</span>}
              {offeringCount > 0 && <span className="text-primary/70">✦ {offeringCount}</span>}
              {birdsongCount > 0 && <span>🐦 {birdsongCount}</span>}
            </div>
          </div>
          {/* Tier badge */}
          <Badge variant="outline" className={`self-start text-[9px] h-5 ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} font-serif`}>
            {TIER_LABELS[tier]}
          </Badge>
        </div>
      </Card>
    );
  }

  /* ── Gallery variant (full card) ── */
  return (
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
        <Badge variant="outline" className={`text-[9px] h-5 ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} font-serif backdrop-blur-sm`}>
          {TIER_LABELS[tier]}
        </Badge>
      </div>
      {isClustered && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="font-serif text-[10px] gap-1 bg-accent/20 text-accent border-accent/30 backdrop-blur-sm">
            <Users className="h-3 w-3" />
            {encounterCount} encounters
          </Badge>
        </div>
      )}

      <CardHeader className="cursor-pointer pt-3 pb-2" onClick={handleClick}>
        <CardTitle className="font-serif text-primary line-clamp-1 text-base leading-tight tracking-wide">
          {tree.name}
        </CardTitle>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="font-serif text-[11px]" style={{ borderColor: `hsl(${speciesHue}, 35%, 45%)`, color: `hsl(${speciesHue}, 45%, 55%)` }}>
            {tree.species}
          </Badge>
          {age > 0 && (
            <span className="text-[11px] text-muted-foreground">🌿 ~{age} years</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 text-sm cursor-pointer" onClick={handleClick}>
          {tree.what3words && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-xs">/{tree.what3words}</span>
            </div>
          )}
          {tree.description && (
            <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">{tree.description}</p>
          )}

          {/* Offering + birdsong summary */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
            {offeringCount > 0 && <span className="text-primary/70">✦ {offeringCount} offering{offeringCount !== 1 ? "s" : ""}</span>}
            {birdsongCount > 0 && <span>🐦 {birdsongCount} birdsong{birdsongCount !== 1 ? "s" : ""}</span>}
          </div>

          {/* Wanderer avatars */}
          {isClustered && wandererCount > 1 && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground/70 font-serif">
                {wandererCount} wanderer{wandererCount > 1 ? "s" : ""}
              </span>
              <div className="flex -space-x-1.5">
                {cluster!.encounters.slice(0, 3).map((enc) => (
                  <div key={enc.id} className="w-5 h-5 rounded-full bg-secondary border border-card flex items-center justify-center text-[8px]">
                    🌳
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action bar — simplified */}
        <div className="mt-3 pt-3 border-t border-border/20 flex gap-1.5">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default TreeCard;
