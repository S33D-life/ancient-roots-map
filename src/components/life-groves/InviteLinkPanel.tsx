import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { getPublicAppUrl } from "@/utils/ogMeta";

interface Props {
  inviteToken: string;
}

export default function InviteLinkPanel({ inviteToken }: Props) {
  const url = getPublicAppUrl(`/life-grove-invite/${inviteToken}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Invitation link copied.");
    } catch {
      toast("Could not copy — select and copy the link manually.");
    }
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-2">
      <p className="font-serif text-sm text-foreground">Invite Others</p>
      <p className="text-xs font-serif text-muted-foreground/80">
        Anyone with this link can leave an offering for the tree.
      </p>
      <div className="flex gap-2">
        <Input value={url} readOnly className="text-xs" />
        <Button onClick={copy} variant="outline" size="sm" className="shrink-0">
          <Copy className="w-4 h-4 mr-1" /> Copy
        </Button>
      </div>
    </div>
  );
}
