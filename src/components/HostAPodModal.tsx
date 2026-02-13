import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Podcast, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HostAPodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HostAPodModal = ({ open, onOpenChange }: HostAPodModalProps) => {
  const handleJoinCouncil = () => {
    const confirmed = window.confirm(
      "You are about to leave S33D and visit an external site (t.me/s33dlife). Continue?"
    );
    if (confirmed) {
      window.open("https://t.me/s33dlife", "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Podcast className="h-6 w-6 text-primary" />
            <DialogTitle className="font-serif text-xl">
              Host a Pod — Coming Soon
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed space-y-3">
            <p>
              Pod-hosting is being prepared for launch. Pods are small, local
              gatherings where friends of the trees meet in person — sharing
              stories, planting seeds, and deepening their connection to the
              living world.
            </p>
            <p>
              When this feature launches you'll be able to register your own
              pod, invite wanderers nearby, and log your gatherings on the
              council record.
            </p>
            <p className="text-muted-foreground italic">
              In the meantime, join the Council of Life to stay informed.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleJoinCouncil} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Join Council
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { HostAPodModal };
