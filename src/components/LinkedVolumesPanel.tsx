import { BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useLinkedVolumes } from "@/hooks/use-collaborator-volumes";
import CollaboratorVolumeCard from "@/components/CollaboratorVolumeCard";

interface Props {
  treeId: string;
}

/**
 * LinkedVolumesPanel — displays Collaborator Volumes that are
 * in "ripple" state and linked to a specific tree.
 * For use on TreeDetailPage under Story/Scrolls.
 */
const LinkedVolumesPanel = ({ treeId }: Props) => {
  const { volumes, loading } = useLinkedVolumes(treeId);
  const [open, setOpen] = useState(false);

  if (loading) return null;
  if (volumes.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full group">
        <div className="flex items-center gap-2 py-2.5 cursor-pointer select-none">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-serif text-sm text-primary tracking-wide flex-1 text-left">
            Linked Volumes
          </span>
          <Badge variant="outline" className="text-[9px] font-serif">{volumes.length}</Badge>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pb-2">
          {volumes.map((vol) => (
            <CollaboratorVolumeCard key={vol.id} volume={vol} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default LinkedVolumesPanel;
