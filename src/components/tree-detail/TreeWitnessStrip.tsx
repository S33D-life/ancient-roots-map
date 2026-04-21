/**
 * TreeWitnessStrip — surfaces the tree's most recent offering with a
 * prominent resonance CTA right beneath the hero, so witnessing is unmissable.
 *
 * Reuses OfferingResonanceButton (no new system). Shows nothing when the
 * tree has no offerings yet.
 */
import { Sparkles } from "lucide-react";
import OfferingResonanceButton from "@/components/OfferingResonanceButton";
import type { Offering } from "@/hooks/use-offerings";

interface Props {
  offerings: Offering[];
  userId: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  song: "a song",
  photo: "a photo",
  story: "a story",
  reflection: "a reflection",
  quote: "a quote",
  book: "a book",
  poem: "a poem",
};

const TreeWitnessStrip = ({ offerings, userId }: Props) => {
  // Most recent non-empty offering
  const recent = offerings?.[0];
  if (!recent) return null;

  const label = TYPE_LABEL[recent.type as string] || "an offering";
  const initialCount =
    typeof (recent as any).resonance_count === "number"
      ? (recent as any).resonance_count
      : 0;

  return (
    <div
      className="mt-4 mb-6 mx-auto max-w-2xl rounded-2xl border border-primary/20 px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--card) / 0.6))",
      }}
    >
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "hsl(var(--primary) / 0.1)" }}
      >
        <Sparkles className="w-4 h-4 text-primary/80" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-serif tracking-[0.18em] uppercase text-primary/70">
          Witness this tree
        </p>
        <p className="text-xs sm:text-sm font-serif text-foreground/85 truncate leading-snug">
          {label.charAt(0).toUpperCase() + label.slice(1)} was left here:
          <span className="italic text-foreground"> {recent.title}</span>
        </p>
      </div>

      <div className="shrink-0 scale-110 sm:scale-125 min-w-[44px] min-h-[44px] flex items-center justify-center">
        <OfferingResonanceButton
          offeringId={recent.id}
          userId={userId}
          initialCount={initialCount}
        />
      </div>
    </div>
  );
};

export default TreeWitnessStrip;
