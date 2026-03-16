/**
 * PathwayContext — shows mycelial pathway connections on tree and grove pages.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, ChevronRight } from "lucide-react";
import { usePathwayDetection } from "@/hooks/use-pathway-detection";
import {
  PATHWAY_STRENGTH_LABELS,
  PATHWAY_STRENGTH_COLORS,
  type PathwayStrength,
} from "@/utils/pathwayDetection";

interface PathwayContextProps {
  /** Tree ID — find pathways through groves containing this tree */
  treeId?: string;
  /** Grove ID — find pathways connected to this grove */
  groveId?: string;
  /** Tree lat/lng for proximity matching */
  treeLat?: number;
  treeLng?: number;
}

export default function PathwayContext({ treeId, groveId, treeLat, treeLng }: PathwayContextProps) {
  const { data } = usePathwayDetection();

  const connectedPathways = useMemo(() => {
    if (!data?.all) return [];

    return data.all.filter(pathway => {
      // Match by grove ID
      if (groveId) {
        return pathway.groves.some(g => g.grove_id === groveId);
      }
      // Match by proximity to tree
      if (treeLat && treeLng) {
        return pathway.groves.some(g => {
          const dist = Math.sqrt(
            Math.pow(g.lat - treeLat, 2) + Math.pow(g.lng - treeLng, 2)
          );
          return dist < 0.05; // ~5km rough
        });
      }
      return false;
    }).slice(0, 3);
  }, [data, groveId, treeLat, treeLng]);

  if (connectedPathways.length === 0) return null;

  return (
    <div className="space-y-2">
      {connectedPathways.map((pathway, i) => (
        <Link to="/pathways" key={i} className="block group">
          <Card className="border-primary/10 bg-card/60 hover:border-primary/25 transition-all">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-primary/10">
                <Network className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-foreground group-hover:text-primary transition-colors truncate">
                  Connected through {pathway.suggested_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {pathway.distance_km} km · {pathway.groves.map(g => g.name).join(" → ")}
                </p>
              </div>
              <Badge variant="outline" className={`text-[9px] shrink-0 ${PATHWAY_STRENGTH_COLORS[pathway.strength]}`}>
                {PATHWAY_STRENGTH_LABELS[pathway.strength]}
              </Badge>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
