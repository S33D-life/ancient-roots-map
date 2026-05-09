import { useState } from "react";
import { Flower2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlooms } from "@/hooks/use-blooms";
import { useCurrentUser } from "@/hooks/use-current-user";
import AddBloomOfferingDialog from "./AddBloomOfferingDialog";
import BloomGallery from "./BloomGallery";
import SeasonalTimeline from "./SeasonalTimeline";
import BloomPatternHints from "./BloomPatternHints";
import { toast } from "sonner";

interface Props {
  treeId: string;
}

export default function BloomsNearbySection({ treeId }: Props) {
  const { userId } = useCurrentUser();
  const { data: blooms = [], isLoading } = useBlooms(treeId);
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    if (!userId) {
      toast("Sign in to leave a bloom offering");
      return;
    }
    setOpen(true);
  };

  return (
    <section className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
            <Flower2 className="h-5 w-5 text-primary" />
            Blooms Nearby
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-prose">
            Leave a flower nearby as an offering to the seasons surrounding this tree.
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Bloom
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground italic">Listening for blooms…</p>
      ) : blooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-primary/30 bg-muted/20 p-6 text-center space-y-2">
          <p className="font-serif text-foreground">No blooms have been noticed here yet.</p>
          <p className="text-sm text-muted-foreground italic">
            Be the first to notice a flower nearby — your offering becomes this tree's first seasonal memory.
          </p>
        </div>
      ) : (
        <>
          <BloomPatternHints blooms={blooms} />
          <BloomGallery blooms={blooms} />
          <SeasonalTimeline blooms={blooms} />
        </>
      )}

      <AddBloomOfferingDialog treeId={treeId} open={open} onOpenChange={setOpen} />
    </section>
  );
}
