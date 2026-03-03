/**
 * TreeMapJourneyAnchor — "See this tree in the Arboreal Atlas" button.
 * Triggers a ceremonial zoom journey when clicked.
 */
import { Map, ArrowRight } from "lucide-react";
import { useMapFocus } from "@/hooks/use-map-focus";
import { Button } from "@/components/ui/button";

interface Props {
  treeId: string;
  treeName: string;
  lat?: number | null;
  lng?: number | null;
  w3w?: string | null;
}

const TreeMapJourneyAnchor = ({ treeId, treeName, lat, lng, w3w }: Props) => {
  const { focusMap } = useMapFocus();

  if (!lat && !w3w) return null;

  const handleJourney = () => {
    if (lat && lng) {
      focusMap({ type: "tree", id: treeId, lat, lng, source: "tree", journey: true });
    } else if (w3w) {
      focusMap({ type: "tree", id: treeId, w3w, source: "tree", journey: true });
    }
  };

  return (
    <section
      className="rounded-xl border border-border/30 overflow-hidden cursor-pointer group transition-colors hover:border-primary/30"
      style={{ background: "linear-gradient(135deg, hsl(var(--card) / 0.5), hsl(var(--secondary) / 0.3))" }}
      onClick={handleJourney}
    >
      <div className="p-5 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 glow-subtle group-hover:glow-sacred transition-all"
          style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.2)" }}
        >
          <Map className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-serif text-sm text-foreground">See {treeName} in the Arboreal Atlas</p>
          <p className="text-xs text-muted-foreground/60 font-serif">Ceremonial journey to the tree's location</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </section>
  );
};

export default TreeMapJourneyAnchor;
