/**
 * ImmutableTreeCard — sacred, permanent display for trees
 * that have been anchored as Immutable Ancient Friends.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Shield, MapPin, Scroll, Eye, TreeDeciduous, Heart,
  Lock, Sparkles, Calendar, User, ExternalLink, Map as MapIcon,
} from "lucide-react";

interface ImmutableTreeProps {
  tree: {
    id: string;
    tree_name: string | null;
    species_scientific: string;
    species_common: string | null;
    locality_text: string;
    province: string | null;
    latitude: number | null;
    longitude: number | null;
    description: string | null;
    height_m: number | null;
    girth_or_stem: string | null;
    crown_spread: string | null;
    immutable_record_id: string | null;
    immutable_anchor_reference: string | null;
    metadata_hash: string | null;
    anchored_at: string | null;
    verified_by: string | null;
    source_doc_title: string;
    source_doc_url: string;
    source_doc_year: number;
  };
  onMapNavigate?: () => void;
}

const ImmutableTreeCard = ({ tree, onMapNavigate }: ImmutableTreeProps) => {
  const name = tree.tree_name || tree.species_common || tree.species_scientific;
  const anchorDate = tree.anchored_at
    ? new Date(tree.anchored_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <Card className="relative overflow-hidden border-[hsl(42_80%_50%/0.35)] bg-gradient-to-b from-[hsl(42_30%_12%/0.6)] to-card/80 backdrop-blur-sm shadow-[0_0_20px_hsl(42_80%_50%/0.08)]">
      {/* Sacred gold top edge */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(42_80%_50%)] to-transparent opacity-60" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-3.5 h-3.5 text-[hsl(42_80%_55%)] shrink-0" />
              <Badge className="text-[9px] px-1.5 py-0 bg-[hsl(42_80%_50%/0.15)] text-[hsl(42_80%_55%)] border-[hsl(42_80%_50%/0.3)]">
                Immutable Ancient Friend
              </Badge>
            </div>
            <CardTitle className="text-base font-serif text-foreground truncate">
              {name}
            </CardTitle>
            <p className="text-xs text-muted-foreground italic truncate mt-0.5">
              {tree.species_scientific}
            </p>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-full border-2 border-[hsl(42_80%_50%/0.4)] bg-[hsl(42_30%_12%)] flex items-center justify-center shadow-[0_0_12px_hsl(42_80%_50%/0.2)]">
            <Shield className="w-5 h-5 text-[hsl(42_80%_55%)]" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{tree.locality_text}{tree.province ? `, ${tree.province}` : ""}</span>
        </div>

        {/* Measurements */}
        {(tree.height_m || tree.girth_or_stem || tree.crown_spread) && (
          <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
            {tree.height_m && <span>H: {tree.height_m}m</span>}
            {tree.girth_or_stem && <span>G: {tree.girth_or_stem}</span>}
            {tree.crown_spread && <span>C: {tree.crown_spread}</span>}
          </div>
        )}

        {/* Description */}
        {tree.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {tree.description}
          </p>
        )}

        {/* Immutable Record Panel */}
        <div className="rounded-lg border border-[hsl(42_80%_50%/0.2)] bg-[hsl(42_30%_12%/0.4)] p-3 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[hsl(42_80%_55%)]" />
            <p className="text-[10px] font-serif font-medium text-[hsl(42_80%_55%)] tracking-wider uppercase">
              Recorded in the Eternal Grove
            </p>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-[11px]">
            {tree.immutable_record_id && (
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Record:</span>
                <span className="text-foreground font-mono text-[10px] truncate">
                  {tree.immutable_record_id}
                </span>
              </div>
            )}

            {anchorDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Anchored:</span>
                <span className="text-foreground">{anchorDate}</span>
              </div>
            )}

            {tree.verified_by && (
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Steward:</span>
                <span className="text-foreground font-mono text-[10px] truncate">
                  {tree.verified_by.slice(0, 8)}…
                </span>
              </div>
            )}

            {tree.metadata_hash && (
              <div className="flex items-center gap-2">
                <Scroll className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Metadata:</span>
                <span className="text-foreground font-mono text-[10px] truncate">
                  {tree.metadata_hash.slice(0, 16)}…
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Provenance source */}
        <a
          href={tree.source_doc_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Scroll className="w-3 h-3" />
          {tree.source_doc_title} ({tree.source_doc_year})
          <ExternalLink className="w-2.5 h-2.5" />
        </a>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {tree.latitude && (
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={onMapNavigate}>
              <MapIcon className="w-3 h-3 mr-1" /> View on Map
            </Button>
          )}
          <Button variant="sacred" size="sm" className="h-7 text-xs px-2" asChild>
            <Link to={`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=16&immutable=on`}>
              <Eye className="w-3 h-3 mr-1" /> Witness
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImmutableTreeCard;
