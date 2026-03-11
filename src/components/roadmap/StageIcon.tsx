/**
 * Shared StageIcon — renders the correct icon for each roadmap growth stage.
 */
import { Sprout, Leaf, TreeDeciduous, Sparkles } from "lucide-react";
import type { RoadmapStage } from "@/data/roadmap-forest";

const StageIcon = ({ stage, className = "" }: { stage: RoadmapStage; className?: string }) => {
  const base = `shrink-0 ${className}`;
  switch (stage) {
    case "seed":    return <Sprout className={base} />;
    case "sprout":  return <Leaf className={base} />;
    case "rooted":  return <TreeDeciduous className={base} />;
    case "ancient": return <Sparkles className={base} />;
  }
};

export default StageIcon;
