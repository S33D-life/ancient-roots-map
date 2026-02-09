import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, ImagePlus, X } from "lucide-react";
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const AddOfferingDialog = ({ open, onOpenChange, treeId, type }: AddOfferingDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [nftLink, setNftLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const labels = typeLabels[type];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMediaUrl(""); // clear any manual URL
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const uploadFile = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${treeId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("offerings")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("offerings")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

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

      let finalMediaUrl = mediaUrl.trim() || null;

      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        try {
          finalMediaUrl = await uploadFile(selectedFile, user.id);
        } catch (uploadErr: any) {
          toast({
            title: "Upload failed",
            description: uploadErr.message,
            variant: "destructive",
          });
          return;
        } finally {
          setUploading(false);
        }
      }

      const { error } = await supabase.from("offerings").insert({
        tree_id: treeId,
        type,
        title: title.trim(),
        content: content.trim() || null,
        media_url: finalMediaUrl,
        nft_link: type === "nft" ? nftLink.trim() || null : null,
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
      clearSelectedFile();
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
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary font-serif">Add {labels.singular}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder={`Give your ${labels.singular.toLowerCase()} a title`}
              maxLength={200}
              required
            />
          </div>

          {/* Photo upload section */}
          {type === "photo" && (
            <div className="space-y-3">
              <Label>Photo</Label>

              {/* Preview */}
              {previewUrl && (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={clearSelectedFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {!selectedFile && (
                <>
                  {/* Upload buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                      Choose Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </Button>
                  </div>

                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Or paste URL */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">or paste a URL</span>
                    </div>
                  </div>
                  <Input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </>
              )}
            </div>
          )}

          {/* Song URL */}
          {type === "song" && (
            <div className="space-y-2">
              <Label htmlFor="mediaUrl">Audio URL</Label>
              <Input
                id="mediaUrl"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/song.mp3"
              />
              <p className="text-xs text-muted-foreground">
                Paste a URL to your audio file
              </p>
            </div>
          )}

          {type === "nft" && (
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
              onChange={(e) => setContent(e.target.value.slice(0, 5000))}
              placeholder={labels.placeholder}
              maxLength={5000}
              rows={type === "poem" || type === "story" ? 6 : 3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Uploading..." : `Add ${labels.singular}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOfferingDialog;
