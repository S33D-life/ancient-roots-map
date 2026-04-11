/**
 * TreeAliveness — subtle, observational line reflecting a tree's activity.
 * Uses existing checkin + offering data. No new queries.
 * Tone: calm, present, alive.
 */
import { useMemo } from "react";
import { Leaf } from "lucide-react";

interface TreeAlivenessProps {
  checkinCount: number;
  offeringCount: number;
  treeName?: string;
}

const TreeAliveness = ({ checkinCount, offeringCount, treeName }: TreeAlivenessProps) => {
  const line = useMemo(() => {
    // Reciprocity — tree responds to activity
    if (offeringCount >= 10 && checkinCount >= 10) {
      return "This tree has received many offerings";
    }
    if (checkinCount >= 10) {
      return "This tree is being visited often";
    }
    if (offeringCount >= 5) {
      return "Some wanderers return to care for this tree";
    }
    if (checkinCount >= 3 || offeringCount >= 2) {
      return "This tree is being gently tended";
    }
    if (checkinCount === 0 && offeringCount === 0) {
      return "This tree has been quiet";
    }
    // Light activity — still alive
    return null;
  }, [checkinCount, offeringCount]);

  if (!line) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <Leaf className="w-3 h-3 text-primary/25" />
      <p className="text-[11px] font-serif text-muted-foreground/45 tracking-wide">
        {line}
      </p>
    </div>
  );
};

export default TreeAliveness;
