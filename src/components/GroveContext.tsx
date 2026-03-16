/**
 * GroveContext — shows grove membership on tree pages.
 * Displays local and species grove affiliations for a given tree.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trees, Leaf, ChevronRight } from "lucide-react";
import { useGroveDetection } from "@/hooks/use-grove-detection";
import { STRENGTH_LABELS, STRENGTH_COLORS, type GroveStrength } from "@/utils/groveDetection";

interface GroveContextProps {
  treeId: string;
  treeLat?: number;
  treeLng?: number;
  treeSpecies?: string;
}

export default function GroveContext({ treeId, treeLat, treeLng, treeSpecies }: GroveContextProps) {
  const { data } = useGroveDetection();

  const affiliations = useMemo(() => {
    if (!data) return { local: null, species: null };

    const local = data.local.find(g => g.trees.some(t => t.id === treeId));
    const species = data.species.find(g => g.trees.some(t => t.id === treeId));

    return { local, species };
  }, [data, treeId]);

  if (!affiliations.local && !affiliations.species) return null;

  return (
    <div className="space-y-2">
      {affiliations.local && (
        <Link to="/groves" className="block group">
          <Card className="border-primary/10 bg-card/60 hover:border-primary/25 transition-all">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-primary/10">
                <Trees className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-foreground group-hover:text-primary transition-colors truncate">
                  Part of {affiliations.local.suggested_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {affiliations.local.trees.length} nearby trees · Local Grove
                </p>
              </div>
              <Badge variant="outline" className={`text-[8px] ${STRENGTH_COLORS[affiliations.local.grove_strength]}`}>
                {STRENGTH_LABELS[affiliations.local.grove_strength]}
              </Badge>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}
      {affiliations.species && (
        <Link to="/groves" className="block group">
          <Card className="border-primary/10 bg-card/60 hover:border-primary/25 transition-all">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-primary/10">
                <Leaf className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-foreground group-hover:text-primary transition-colors truncate">
                  Part of {affiliations.species.suggested_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {affiliations.species.trees.length} {affiliations.species.species_common || "same-species"} trees · Species Grove
                </p>
              </div>
              <Badge variant="outline" className={`text-[8px] ${STRENGTH_COLORS[affiliations.species.grove_strength]}`}>
                {STRENGTH_LABELS[affiliations.species.grove_strength]}
              </Badge>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
