/**
 * OfferingWhisperPreview — compact read-only offering card shown inside
 * whisper cards when a whisper carries an offering_id.
 *
 * Renders a thumbnail + type + title without duplicating the full
 * OfferingCard treatment. Links to the tree page so the recipient
 * can see the full offering in context.
 */
import { Loader2, Camera, Music, FileText, MessageSquare, BookOpen, Mic, Palette, HandHeart, Sparkles, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { useWhisperOffering } from "@/hooks/use-offering-whisper";
import type { Database } from "@/integrations/supabase/types";

type OfferingType = Database["public"]["Enums"]["offering_type"];

const TYPE_ICON: Record<OfferingType, React.ReactNode> = {
  photo:   <Camera    className="w-3.5 h-3.5" />,
  song:    <Music     className="w-3.5 h-3.5" />,
  poem:    <FileText  className="w-3.5 h-3.5" />,
  story:   <MessageSquare className="w-3.5 h-3.5" />,
  nft:     <Sparkles  className="w-3.5 h-3.5" />,
  voice:   <Mic       className="w-3.5 h-3.5" />,
  book:    <BookOpen  className="w-3.5 h-3.5" />,
  art:     <Palette   className="w-3.5 h-3.5" />,
  prayer:  <HandHeart className="w-3.5 h-3.5" />,
};

const TYPE_LABEL: Record<OfferingType, string> = {
  photo:  "Memory",
  song:   "Song",
  poem:   "Poem",
  story:  "Musing",
  nft:    "NFT",
  voice:  "Voice",
  book:   "Book",
  art:    "Art",
  prayer: "Prayer",
};

interface Props {
  offeringId: string;
  /** Show a link to the full offering */
  linkToTree?: boolean;
}

export default function OfferingWhisperPreview({ offeringId, linkToTree = true }: Props) {
  const { data: offering, isLoading, isError } = useWhisperOffering(offeringId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5 flex items-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/50 shrink-0" />
        <span className="text-[11px] font-serif text-muted-foreground/60 italic">Loading offering…</span>
      </div>
    );
  }

  if (isError || !offering) {
    return (
      <div className="rounded-xl border border-border/20 bg-muted/10 px-3 py-2 text-[11px] font-serif text-muted-foreground/50 italic">
        Offering no longer available
      </div>
    );
  }

  const type = offering.type as OfferingType;
  const thumbnail = offering.thumbnail_url || offering.photos?.[0] || null;
  const treeRoute = ROUTES.TREE(offering.tree_id);

  const inner = (
    <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5 flex items-center gap-3 group-hover:bg-primary/10 transition-colors">
      {/* Thumbnail or type icon */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={offering.title}
          className="w-10 h-10 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary/60">
          {TYPE_ICON[type] ?? <Sparkles className="w-3.5 h-3.5" />}
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] font-serif text-muted-foreground/60 uppercase tracking-widest mb-0.5">
          {TYPE_ICON[type]}
          <span>{TYPE_LABEL[type] ?? type}</span>
        </div>
        <p className="text-[12px] font-serif text-foreground/85 truncate leading-snug">
          {offering.title}
        </p>
        {offering.content && (
          <p className="text-[11px] font-serif text-muted-foreground/60 truncate mt-0.5 italic">
            {offering.content.slice(0, 80)}{offering.content.length > 80 ? "…" : ""}
          </p>
        )}
      </div>

      {/* Link indicator */}
      {linkToTree && (
        <ExternalLink className="w-3 h-3 text-muted-foreground/30 shrink-0" />
      )}
    </div>
  );

  if (linkToTree) {
    return (
      <Link to={treeRoute} className="block group">
        {inner}
      </Link>
    );
  }

  return inner;
}
