import { ScrollText } from "lucide-react";
import { CURRENT_CIRCLE, approvedCircleUrl, type CurrentCircle } from "../../../supabase/functions/_shared/currentCircle";

/** A doorway to the existing Deck; the original Council context stays open. */
export default function CouncilDeckDoorway({ circle = CURRENT_CIRCLE }: { circle?: CurrentCircle }) {
  const url = circle.approval === "approved" ? approvedCircleUrl(circle.links.councilDeck) : undefined;
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex min-h-11 max-w-full items-center gap-2 py-2 font-serif text-sm text-primary underline underline-offset-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ScrollText className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Open the Council Deck</span>
    </a>
  );
}
