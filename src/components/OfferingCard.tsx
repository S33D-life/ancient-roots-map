/**
 * OfferingCard — unified offering card used across Tree, Hive, Atlas, and Dashboard pages.
 * Renders literary (poem/story), song, nft, voice, and compact list variants.
 * Includes: quote block, influence upvote, skystamp seal, staff sigil, share.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Share2, Music, Sparkles, ExternalLink, Camera, FileText, MessageSquare, Mic, BookOpen, Eye, EyeOff, Users, Trash2 } from "lucide-react";
import OfferingResonanceButton from "@/components/OfferingResonanceButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OfferingQuoteBlock from "@/components/OfferingQuoteBlock";
import InfluenceUpvoteButton from "@/components/InfluenceUpvoteButton";
import SkystampSeal from "@/components/SkystampSeal";
import type { Database } from "@/integrations/supabase/types";

type Offering = Database["public"]["Tables"]["offerings"]["Row"];
type OfferingType = Database["public"]["Enums"]["offering_type"];

const typeIcons: Record<OfferingType, React.ReactNode> = {
  photo: <Camera className="h-3.5 w-3.5" />,
  song: <Music className="h-3.5 w-3.5" />,
  poem: <FileText className="h-3.5 w-3.5" />,
  story: <MessageSquare className="h-3.5 w-3.5" />,
  nft: <Sparkles className="h-3.5 w-3.5" />,
  voice: <Mic className="h-3.5 w-3.5" />,
  book: <BookOpen className="h-3.5 w-3.5" />,
};

const visibilityIcons: Record<string, React.ReactNode> = {
  private: <EyeOff className="h-2.5 w-2.5" />,
  tribe: <Users className="h-2.5 w-2.5" />,
  public: <Eye className="h-2.5 w-2.5" />,
};

export type OfferingCardVariant = "full" | "compact";

export interface OfferingCardProps {
  offering: Offering;
  /** Display variant: 'full' for rich cards, 'compact' for list rows */
  variant?: OfferingCardVariant;
  /** Tree context for influence voting */
  treeId?: string;
  treeSpecies?: string | null;
  treeNation?: string | null;
  /** Current user ID for influence voting + delete */
  userId?: string | null;
  /** Show link to tree page */
  treeName?: string | null;
  showTreeLink?: boolean;
  /** Called when user deletes their offering */
  onDelete?: (offeringId: string) => void;
}

/* ── Helper ── */

const getStaffImageFromCode = (code: string): string | null => {
  const prefix = code.split("-")[0]?.toLowerCase();
  if (!prefix) return null;
  return `/images/staffs/${prefix}.jpeg`;
};

const SealedByLabel = ({ staff }: { staff: string | null }) => {
  if (!staff) return null;
  const img = getStaffImageFromCode(staff);
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-primary/70 font-serif tracking-widest uppercase">
      {img && (
        <img src={img} alt={staff} className="w-4 h-4 rounded-full object-cover border border-primary/30" />
      )}
      <span className="opacity-60">⚘</span> Sealed by {staff}
    </span>
  );
};

const shareOffering = async (offering: Offering) => {
  const url = `${window.location.origin}/tree/${offering.tree_id}`;
  const text = `"${offering.title}" — an offering at S33D`;
  try {
    if (navigator.share) {
      await navigator.share({ title: offering.title, text, url });
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") {
      await navigator.clipboard.writeText(`${text} ${url}`);
    }
  }
};

const DateLabel = ({ date }: { date: string }) => (
  <p className="text-[10px] text-muted-foreground/60 font-serif tracking-widest uppercase">
    {new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
  </p>
);

/* ── Influence + Meta footer shared across all full variants ── */

const CardFooter = ({
  offering,
  treeId,
  treeSpecies,
  treeNation,
  userId,
}: {
  offering: Offering;
  treeId?: string;
  treeSpecies?: string | null;
  treeNation?: string | null;
  userId?: string | null;
}) => (
  <div className="flex items-center justify-between mt-4">
    <DateLabel date={offering.created_at} />
    <div className="flex items-center gap-3">
      {treeId && (
        <InfluenceUpvoteButton
          offeringId={offering.id}
          treeId={treeId}
          treeSpecies={treeSpecies}
          treeNation={treeNation}
          userId={userId ?? null}
          influenceScore={offering.influence_score || 0}
        />
      )}
      <button
        onClick={() => shareOffering(offering)}
        className="text-muted-foreground/60 hover:text-primary transition-colors"
        title="Share"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>
      <SealedByLabel staff={offering.sealed_by_staff} />
      <SkystampSeal skyStampId={offering.sky_stamp_id} />
    </div>
  </div>
);

const QuoteSection = ({ offering }: { offering: Offering }) => {
  if (!offering.quote_text) return null;
  return (
    <OfferingQuoteBlock
      text={offering.quote_text}
      author={offering.quote_author}
      source={offering.quote_source}
    />
  );
};

/* ══════════════════════════════════════════
   FULL CARD VARIANTS
   ══════════════════════════════════════════ */

const LiteraryFull = ({ offering, treeId, treeSpecies, treeNation, userId }: OfferingCardProps) => {
  const isPoemStyle = offering.type === "poem";
  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden">
      <div
        className="h-0.5"
        style={{
          background: isPoemStyle
            ? "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)"
            : "linear-gradient(90deg, transparent, hsl(var(--accent) / 0.3), transparent)",
        }}
      />
      <CardContent className="p-5 md:p-6">
        <h4 className="font-serif text-lg text-primary mb-3 tracking-wide">{offering.title}</h4>
        {offering.content && (
          <div
            className={`font-serif leading-relaxed text-foreground/85 ${
              isPoemStyle
                ? "whitespace-pre-wrap text-center italic border-l-0"
                : "whitespace-pre-wrap border-l-2 border-primary/20 pl-4"
            }`}
          >
            {offering.content}
          </div>
        )}
        <QuoteSection offering={offering} />
        <CardFooter offering={offering} treeId={treeId} treeSpecies={treeSpecies} treeNation={treeNation} userId={userId} />
      </CardContent>
    </Card>
  );
};

const SongFull = ({ offering, treeId, treeSpecies, treeNation, userId }: OfferingCardProps) => (
  <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <Music className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif text-lg text-primary tracking-wide">{offering.title}</h4>
          {offering.content && (
            <p className="text-sm text-foreground/70 font-serif mt-1">{offering.content}</p>
          )}
          <QuoteSection offering={offering} />
          {offering.media_url && (
            <audio controls className="w-full mt-3 rounded-lg" style={{ height: 36 }}>
              <source src={offering.media_url} />
            </audio>
          )}
          <div className="flex items-center flex-wrap gap-3 mt-3">
            <DateLabel date={offering.created_at} />
            {offering.nft_link && offering.nft_link.includes("apple.com") && (
              <a
                href={offering.nft_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary font-serif tracking-wider"
              >
                <ExternalLink className="h-3 w-3" /> Apple Music
              </a>
            )}
            {treeId && (
              <InfluenceUpvoteButton
                offeringId={offering.id}
                treeId={treeId}
                treeSpecies={treeSpecies}
                treeNation={treeNation}
                userId={userId ?? null}
                influenceScore={offering.influence_score || 0}
                compact
              />
            )}
            <button onClick={() => shareOffering(offering)} className="text-muted-foreground/60 hover:text-primary transition-colors" title="Share">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <SealedByLabel staff={offering.sealed_by_staff} />
            <SkystampSeal skyStampId={offering.sky_stamp_id} />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const NftFull = ({ offering, treeId, treeSpecies, treeNation, userId }: OfferingCardProps) => (
  <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden group hover:border-primary/40 transition-colors">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="font-serif text-base text-primary tracking-wide">{offering.title}</h4>
      </div>
      {offering.content && (
        <p className="text-sm text-foreground/70 font-serif">{offering.content}</p>
      )}
      <QuoteSection offering={offering} />
      {offering.nft_link && (
        <a
          href={offering.nft_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs font-serif text-primary/80 hover:text-primary underline underline-offset-4 tracking-wider"
        >
          View on marketplace →
        </a>
      )}
      <CardFooter offering={offering} treeId={treeId} treeSpecies={treeSpecies} treeNation={treeNation} userId={userId} />
    </CardContent>
  </Card>
);

const PhotoFull = ({ offering, treeId, treeSpecies, treeNation, userId }: OfferingCardProps) => (
  <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden group hover:border-primary/20 transition-all">
    {offering.media_url && (
      <div className="relative overflow-hidden">
        <img
          src={offering.media_url}
          alt={offering.title}
          className="w-full max-h-64 object-cover group-hover:scale-[1.02] transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
      </div>
    )}
    <CardContent className="p-5">
      <h4 className="font-serif text-lg text-primary tracking-wide">{offering.title}</h4>
      {offering.content && (
        <p className="text-sm text-foreground/70 font-serif mt-2 whitespace-pre-wrap">{offering.content}</p>
      )}
      <QuoteSection offering={offering} />
      <CardFooter offering={offering} treeId={treeId} treeSpecies={treeSpecies} treeNation={treeNation} userId={userId} />
    </CardContent>
  </Card>
);

const GenericFull = ({ offering, treeId, treeSpecies, treeNation, userId }: OfferingCardProps) => (
  <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-2">
        {typeIcons[offering.type]}
        <h4 className="font-serif text-base text-primary tracking-wide">{offering.title}</h4>
      </div>
      {offering.content && (
        <p className="text-sm text-foreground/70 font-serif whitespace-pre-wrap">{offering.content}</p>
      )}
      {offering.media_url && offering.type === "voice" && (
        <audio controls className="w-full mt-3 rounded-lg" style={{ height: 36 }}>
          <source src={offering.media_url} />
        </audio>
      )}
      <QuoteSection offering={offering} />
      <CardFooter offering={offering} treeId={treeId} treeSpecies={treeSpecies} treeNation={treeNation} userId={userId} />
    </CardContent>
  </Card>
);

/* ══════════════════════════════════════════
   COMPACT VARIANT (list rows)
   ══════════════════════════════════════════ */

const CompactRow = ({
  offering,
  treeId,
  treeSpecies,
  treeNation,
  userId,
  treeName,
  showTreeLink,
  onDelete,
}: OfferingCardProps) => {
  const isAuthor = userId && offering.created_by === userId;
  return (
    <Card className={`backdrop-blur border-border/40 ${
      offering.tree_role === "stewardship" ? "bg-card/60 border-l-2 border-l-primary/40" : "bg-card/40"
    }`}>
      <CardContent className="p-3 flex items-center gap-3">
        {offering.media_url && offering.type === "photo" && (
          <img src={offering.media_url} alt={offering.title} className="w-12 h-12 rounded object-cover shrink-0" loading="lazy" />
        )}
        <span className="text-primary/70 shrink-0">{typeIcons[offering.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm text-foreground truncate">{offering.title}</p>
          {showTreeLink && treeName && (
            <Link to={`/tree/${offering.tree_id}`} className="text-[11px] text-primary/70 hover:text-primary font-serif transition-colors">
              at {treeName}
            </Link>
          )}
          <span className="text-[10px] text-muted-foreground/50 ml-2 font-mono">
            {new Date(offering.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </span>
        </div>
        {/* Influence upvote in compact mode */}
        {treeId && (
          <InfluenceUpvoteButton
            offeringId={offering.id}
            treeId={treeId}
            treeSpecies={treeSpecies}
            treeNation={treeNation}
            userId={userId ?? null}
            influenceScore={offering.influence_score || 0}
            compact
          />
        )}
        <Badge variant="outline" className={`text-[10px] font-serif shrink-0 capitalize gap-0.5 ${
          offering.tree_role === "stewardship" ? "border-primary/30 text-primary" : "border-border/30"
        }`}>
          {offering.tree_role === "stewardship" ? "📋" : "🌿"}
          {offering.visibility && offering.visibility !== "public" && visibilityIcons[offering.visibility]}
          {offering.type}
        </Badge>
        {isAuthor && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onDelete(offering.id)}
            aria-label="Delete offering"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */

const OfferingCard = (props: OfferingCardProps) => {
  const { offering, variant = "full" } = props;

  if (variant === "compact") {
    return <CompactRow {...props} />;
  }

  // Full variant — pick by type
  switch (offering.type) {
    case "poem":
    case "story":
      return <LiteraryFull {...props} />;
    case "song":
      return <SongFull {...props} />;
    case "nft":
      return <NftFull {...props} />;
    case "photo":
      return <PhotoFull {...props} />;
    default:
      return <GenericFull {...props} />;
  }
};

export default OfferingCard;
