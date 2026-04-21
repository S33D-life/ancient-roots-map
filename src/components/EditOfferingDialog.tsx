/**
 * EditOfferingDialog — lightweight in-place editor for an existing offering.
 *
 * Editable fields (creator-only):
 *   - title
 *   - content / caption
 *   - photos (add / remove, max 3) — for any type
 *   - quote block (text / author / source)
 *   - visibility
 *   - youtube_url (for song offerings)
 *   - nft_link (for nft offerings)
 *
 * Preserves original `created_at`; the DB trigger maintains `updated_at`.
 * Type cannot be changed in this first phase.
 */
import { useEffect, useState } from "react";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, X } from "lucide-react";
import OfferingPhotoTray, { type PhotoSlot } from "@/components/offering/OfferingPhotoTray";
import OfferingQuoteInput, { type QuoteData } from "@/components/OfferingQuoteInput";
import OfferingVisibilityPicker, { type OfferingVisibility } from "@/components/OfferingVisibilityPicker";
import { MAX_OFFERING_PHOTOS, getOfferingPhotos } from "@/utils/offeringPhotos";
import { extractYouTubeVideoId, buildYouTubeEmbedUrl, getYouTubeThumbnail } from "@/utils/youtubeUtils";
import type { Database } from "@/integrations/supabase/types";

type Offering = Database["public"]["Tables"]["offerings"]["Row"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offering: Offering;
  /** Called with the updated offering row after a successful save */
  onSaved?: (updated: Offering) => void;
}

const TYPE_LABEL: Record<string, string> = {
  photo: "memory",
  song: "song",
  poem: "poem",
  story: "musing",
  nft: "NFT",
  voice: "voice offering",
  book: "book offering",
};

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const EditOfferingDialog = ({ open, onOpenChange, offering, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // ── Form state (initialised from `offering` whenever it opens) ──
  const [title, setTitle] = useState(offering.title);
  const [content, setContent] = useState(offering.content || "");
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [quote, setQuote] = useState<QuoteData>({
    text: offering.quote_text || "",
    author: offering.quote_author || "",
    source: offering.quote_source || "",
  });
  const [visibility, setVisibility] = useState<OfferingVisibility>(
    (offering.visibility as OfferingVisibility) || "public"
  );
  const [youtubeUrl, setYoutubeUrl] = useState(offering.youtube_url || "");
  const [nftLink, setNftLink] = useState(offering.nft_link || "");

  // Reset whenever a new offering / fresh open
  useEffect(() => {
    if (!open) return;
    setTitle(offering.title);
    setContent(offering.content || "");
    setQuote({
      text: offering.quote_text || "",
      author: offering.quote_author || "",
      source: offering.quote_source || "",
    });
    setVisibility((offering.visibility as OfferingVisibility) || "public");
    setYoutubeUrl(offering.youtube_url || "");
    setNftLink(offering.nft_link || "");
    // Map existing photos into PhotoSlot shape (already-uploaded URLs)
    const existing = getOfferingPhotos(offering).map<PhotoSlot>((url) => ({
      id: `existing-${url}`,
      file: null,
      previewUrl: url,
      uploadedUrl: url,
      status: "ready",
    }));
    setPhotos(existing);
  }, [open, offering]);

  const supportsPhotos = true; // any offering type may carry photos
  const isSong = offering.type === "song";
  const isNft = offering.type === "nft";

  // ── Photo handlers ──
  const handleAddPhotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_OFFERING_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const next: PhotoSlot[] = [];
    Array.from(files).slice(0, remaining).forEach((file) => {
      if (file.size > MAX_UPLOAD_SIZE) {
        toast({
          title: "Image too large",
          description: `${file.name} is over ${MAX_UPLOAD_SIZE / 1024 / 1024}MB.`,
          variant: "destructive",
        });
        return;
      }
      next.push({
        id: `new-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        uploadedUrl: null,
        status: "ready",
      });
    });
    setPhotos((p) => [...p, ...next]);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((p) => p.filter((slot) => slot.id !== id));
  };

  // Upload any new photos and return final ordered URL array
  const uploadPendingPhotos = async (): Promise<string[]> => {
    const finalUrls: string[] = [];
    for (const slot of photos) {
      if (slot.uploadedUrl) {
        finalUrls.push(slot.uploadedUrl);
        continue;
      }
      if (!slot.file) continue;

      const ext = slot.file.name.split(".").pop() || "jpg";
      const path = `offerings/${offering.tree_id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error } = await supabase.storage
        .from("offerings")
        .upload(path, slot.file, { cacheControl: "3600", upsert: false });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data: pub } = supabase.storage.from("offerings").getPublicUrl(path);
      finalUrls.push(pub.publicUrl);
    }
    return finalUrls;
  };

  // ── Save ──
  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const photoUrls = await uploadPendingPhotos();

      const update: Record<string, any> = {
        title: title.trim(),
        content: content.trim() || null,
        quote_text: quote.text.trim() || null,
        quote_author: quote.author.trim() || null,
        quote_source: quote.source.trim() || null,
        visibility,
        photos: photoUrls,
        // Keep media_url in sync for legacy single-photo readers
        media_url: photoUrls[0] || (offering.type === "voice" || offering.type === "song" ? offering.media_url : null),
      };

      // Song-specific: youtube embedding
      if (isSong) {
        const trimmed = youtubeUrl.trim();
        if (trimmed) {
          const vid = extractYouTubeVideoId(trimmed);
          if (vid) {
            update.youtube_url = trimmed;
            update.youtube_video_id = vid;
            update.youtube_embed_url = buildYouTubeEmbedUrl(vid);
            update.thumbnail_url = getYouTubeThumbnail(vid);
          } else {
            update.youtube_url = trimmed;
          }
        } else {
          update.youtube_url = null;
          update.youtube_video_id = null;
          update.youtube_embed_url = null;
        }
      }

      if (isNft) {
        update.nft_link = nftLink.trim() || null;
      }

      const { data, error } = await supabase
        .from("offerings")
        .update(update)
        .eq("id", offering.id)
        .select("*")
        .single();

      if (error) throw error;

      toast({ title: "Offering updated", description: "Your changes have been saved." });
      onSaved?.(data as Offering);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Could not save",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tend your offering"
      description={`Refine the ${TYPE_LABEL[offering.type] || "offering"} you placed at this tree.`}
    >
      <div className="space-y-4 pb-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-title" className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
            Title
          </Label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 140))}
            maxLength={140}
            className="font-serif"
          />
        </div>

        {/* Content / caption */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-content" className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
            {offering.type === "poem" ? "Poem" : offering.type === "photo" ? "Caption" : "Words"}
          </Label>
          <Textarea
            id="edit-content"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 4000))}
            rows={offering.type === "poem" || offering.type === "story" ? 6 : 3}
            maxLength={4000}
            className="font-serif resize-none"
          />
        </div>

        {/* Photos (any type) */}
        {supportsPhotos && (
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
              Photos <span className="text-muted-foreground/50 normal-case tracking-normal">({photos.length}/{MAX_OFFERING_PHOTOS})</span>
            </Label>
            <OfferingPhotoTray
              photos={photos}
              maxPhotos={MAX_OFFERING_PHOTOS}
              onAdd={handleAddPhotos}
              onRemove={handleRemovePhoto}
              uploadingCount={0}
            />
          </div>
        )}

        {/* Song-specific */}
        {isSong && (
          <div className="space-y-1.5">
            <Label htmlFor="edit-youtube" className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
              YouTube link <span className="text-muted-foreground/40 normal-case tracking-normal">(optional)</span>
            </Label>
            <Input
              id="edit-youtube"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              className="font-serif text-sm"
            />
          </div>
        )}

        {/* NFT-specific */}
        {isNft && (
          <div className="space-y-1.5">
            <Label htmlFor="edit-nft" className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
              Marketplace link
            </Label>
            <Input
              id="edit-nft"
              value={nftLink}
              onChange={(e) => setNftLink(e.target.value)}
              placeholder="https://opensea.io/…"
              className="font-serif text-sm"
            />
          </div>
        )}

        {/* Quote block */}
        <OfferingQuoteInput value={quote} onChange={setQuote} />

        {/* Visibility */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
            Visibility
          </Label>
          <OfferingVisibilityPicker value={visibility} onChange={setVisibility} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="font-serif"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="font-serif gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save changes
              </>
            )}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 font-serif text-center">
          Tending the truth of your offering · the moment of placing it remains.
        </p>
      </div>
    </ResponsiveDialog>
  );
};

export default EditOfferingDialog;
