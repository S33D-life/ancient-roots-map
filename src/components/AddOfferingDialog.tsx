import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type OfferingType = Database['public']['Enums']['offering_type'];

interface AddOfferingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  type: OfferingType;
}

const typeLabels: Record<OfferingType, { singular: string; contentLabel: string; placeholder: string }> = {
  photo: { singular: "Memory", contentLabel: "Caption", placeholder: "What memory does this capture?" },
  song: { singular: "Song", contentLabel: "Description", placeholder: "Tell us about this song..." },
  poem: { singular: "Poem", contentLabel: "Poem", placeholder: "Write your poem here..." },
  story: { singular: "Musing", contentLabel: "Your Thoughts", placeholder: "Share your thoughts about this tree..." },
  nft: { singular: "NFT", contentLabel: "Description", placeholder: "Describe this NFT..." },
};

const AddOfferingDialog = ({ open, onOpenChange, treeId, type }: AddOfferingDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [nftLink, setNftLink] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const labels = typeLabels[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a title",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to add offerings",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from('offerings').insert({
        tree_id: treeId,
        type,
        title: title.trim(),
        content: content.trim() || null,
        media_url: mediaUrl.trim() || null,
        nft_link: type === 'nft' ? nftLink.trim() || null : null,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: `${labels.singular} added!`,
        description: `Your ${labels.singular.toLowerCase()} has been saved`,
      });

      // Reset form
      setTitle("");
      setContent("");
      setMediaUrl("");
      setNftLink("");
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error adding offering",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-serif">Add {labels.singular}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Give your ${labels.singular.toLowerCase()} a title`}
              required
            />
          </div>

          {(type === 'photo' || type === 'song') && (
            <div className="space-y-2">
              <Label htmlFor="mediaUrl">
                {type === 'photo' ? 'Image URL' : 'Audio URL'}
              </Label>
              <Input
                id="mediaUrl"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={type === 'photo' ? 'https://example.com/image.jpg' : 'https://example.com/song.mp3'}
              />
              <p className="text-xs text-muted-foreground">
                Paste a URL to your {type === 'photo' ? 'image' : 'audio file'}
              </p>
            </div>
          )}

          {type === 'nft' && (
            <div className="space-y-2">
              <Label htmlFor="nftLink">NFT Link</Label>
              <Input
                id="nftLink"
                type="url"
                value={nftLink}
                onChange={(e) => setNftLink(e.target.value)}
                placeholder="https://opensea.io/..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">{labels.contentLabel}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={labels.placeholder}
              rows={type === 'poem' || type === 'story' ? 6 : 3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add {labels.singular}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOfferingDialog;
