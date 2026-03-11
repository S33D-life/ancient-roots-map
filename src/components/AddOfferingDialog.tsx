import { useState, useRef, useCallback, useEffect } from "react";
import SeasonalMomentPanel from "@/components/SeasonalMomentPanel";
import type { OfferingPrompt } from "@/hooks/use-seasonal-offerings";
import { useWandererSearch, WandererProfile } from "@/hooks/use-fellow-wanderers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, ImagePlus, X, Sparkles, Search, UserPlus, Mic, BookOpen, ChevronDown, Settings2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import MusicOfferingFlow, { type SelectedSongData } from "@/components/MusicOfferingFlow";
import VoiceOfferingFlow, { type VoiceOfferingData } from "@/components/VoiceOfferingFlow";
import BookOfferingFlow, { type BookOfferingData } from "@/components/BookOfferingFlow";
import OfferingCelebration from "@/components/OfferingCelebration";
import RewardReceipt from "@/components/RewardReceipt";
import OfferingVisibilityPicker, { type OfferingVisibility } from "@/components/OfferingVisibilityPicker";
import TreeRolePicker, { type TreeRole } from "@/components/TreeRolePicker";
import { issueRewards, type RewardResult } from "@/utils/issueRewards";
import { createOrReuseSkystamp } from "@/hooks/use-skystamp";
import OfferingQuoteInput, { type QuoteData } from "@/components/OfferingQuoteInput";
import type { Database } from "@/integrations/supabase/types";

type OfferingType = Database["public"]["Enums"]["offering_type"];

interface AddOfferingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  treeSpecies?: string;
  type: OfferingType;
  meetingId?: string | null;
}

const typeConfig: Record<
  OfferingType,
  { singular: string; contentLabel: string; placeholder: string; emoji: string }
> = {
  photo: { singular: "Memory", contentLabel: "Caption", placeholder: "What memory does this capture?", emoji: "📷" },
  song: { singular: "Song", contentLabel: "Description", placeholder: "Tell us about this song...", emoji: "🎵" },
  poem: { singular: "Poem", contentLabel: "Poem", placeholder: "Write your poem here...", emoji: "📜" },
  story: { singular: "Musing", contentLabel: "Your Thoughts", placeholder: "Share your thoughts about this tree...", emoji: "✍️" },
  nft: { singular: "NFT", contentLabel: "Description", placeholder: "Describe this NFT...", emoji: "✨" },
  voice: { singular: "Voice", contentLabel: "Reflection", placeholder: "What inspired this offering?", emoji: "🎙️" },
  book: { singular: "Book", contentLabel: "Reflection", placeholder: "Why are you offering this story?", emoji: "📖" },
};

/** Quick-select offering types shown as pills */
const QUICK_TYPES: { value: OfferingType; emoji: string; label: string }[] = [
  { value: "photo", emoji: "📷", label: "Memory" },
  { value: "story", emoji: "✍️", label: "Musing" },
  { value: "poem", emoji: "📜", label: "Poem" },
  { value: "song", emoji: "🎵", label: "Song" },
  { value: "voice", emoji: "🎙️", label: "Voice" },
  { value: "book", emoji: "📖", label: "Book" },
  { value: "nft", emoji: "✨", label: "NFT" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const resizeImage = (file: File, maxDim = 2048, quality = 0.82): Promise<File> =>
  new Promise((resolve, reject) => {
    if (file.size <= MAX_UPLOAD_SIZE) { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });

const AddOfferingDialog = ({ open, onOpenChange, treeId, treeSpecies, type: initialType, meetingId }: AddOfferingDialogProps) => {
  const [activeType, setActiveType] = useState<OfferingType>(initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [nftLink, setNftLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sealedByStaff, setSealedByStaff] = useState(() => localStorage.getItem("linked_staff_code") || "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const { toast } = useToast();
  const { results: tagResults, searching: tagSearching, search: searchTags, clearResults: clearTagResults } = useWandererSearch();
  const [taggedUsers, setTaggedUsers] = useState<WandererProfile[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const tagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState({ emoji: "✨", message: "", subtitle: "" });
  const [rewardResult, setRewardResult] = useState<RewardResult | null>(null);
  const [showRewardReceipt, setShowRewardReceipt] = useState(false);
  const [visibility, setVisibility] = useState<OfferingVisibility>(initialType === "photo" ? "public" : "tribe");
  const [treeRole, setTreeRole] = useState<TreeRole>("anchored");
  const [quote, setQuote] = useState<QuoteData>({ text: "", author: "", source: "" });

  // Sync type when prop changes
  useEffect(() => { setActiveType(initialType); }, [initialType]);

  const cfg = typeConfig[activeType];

  // Smart role suggestion
  const STEWARDSHIP_KEYWORDS = /\b(species|season|blossom|leaf|bark|trunk|girth|height|canopy|wildlife|bird|fungi|lichen|moss|root|branch|crown|measurement|survey|observation|ecology|habitat|biodiversity|pollinator|insect|growth|decay|disease|health|circumference|diameter)\b/i;
  const ANCHORED_KEYWORDS = /\b(family|memory|remember|childhood|grandmother|grandfather|mother|father|love|heart|wedding|birthday|song|prayer|wish|dream|story|personal|feeling|emotion|grief|joy|peace|meditation)\b/i;

  useEffect(() => {
    const text = `${title} ${content}`;
    if (text.trim().length < 5) return;
    if (STEWARDSHIP_KEYWORDS.test(text)) setTreeRole("stewardship");
    else if (ANCHORED_KEYWORDS.test(text)) setTreeRole("anchored");
  }, [title, content]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 50MB", variant: "destructive" });
      return;
    }
    try {
      const processed = await resizeImage(file);
      setSelectedFile(processed);
      setPreviewUrl(URL.createObjectURL(processed));
      setMediaUrl("");
      if (processed !== file) {
        toast({ title: "Image optimized", description: `Resized from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(processed.size / 1024 / 1024).toFixed(1)}MB` });
      }
    } catch {
      toast({ title: "Processing failed", description: "Could not process the image", variant: "destructive" });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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
    const { error } = await supabase.storage.from("offerings").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("offerings").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const resetForm = () => {
    setTitle(""); setContent(""); setMediaUrl(""); setNftLink(""); setSealedByStaff(""); setTaggedUsers([]); setQuote({ text: "", author: "", source: "" }); clearSelectedFile();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!title.trim()) {
      toast({ title: "Missing title", description: "Please provide a title", variant: "destructive" });
      return;
    }
    submittingRef.current = true;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not authenticated", description: "Please sign in to add offerings", variant: "destructive" });
        return;
      }

      let finalMediaUrl = mediaUrl.trim() || null;
      if (selectedFile) {
        setUploading(true);
        try {
          finalMediaUrl = await uploadFile(selectedFile, user.id);
        } catch (uploadErr: any) {
          toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
          return;
        } finally {
          setUploading(false);
        }
      }

      const impactWeight = treeRole === "stewardship" ? 2.0 : 1.0;
      const quoteText = quote.text.trim() || null;
      const quoteAuthor = quoteText ? (quote.author.trim() || null) : null;
      const quoteSource = quoteText ? (quote.source.trim() || null) : null;

      const { data: insertedOffering, error } = await (supabase.from("offerings") as any).insert({
        tree_id: treeId,
        type: activeType,
        title: title.trim(),
        content: content.trim() || null,
        media_url: finalMediaUrl,
        nft_link: activeType === "nft" ? nftLink.trim() || null : null,
        created_by: user.id,
        sealed_by_staff: sealedByStaff.trim() || null,
        meeting_id: meetingId || null,
        visibility: activeType === "photo" ? "public" : visibility,
        tree_role: treeRole,
        impact_weight: impactWeight,
        quote_text: quoteText,
        quote_author: quoteAuthor,
        quote_source: quoteSource,
      }).select("id").single();
      if (error) throw error;

      // Skystamp (fire-and-forget)
      if (insertedOffering) {
        supabase.from("trees").select("latitude, longitude").eq("id", treeId).single().then(async ({ data: treeData }) => {
          if (treeData?.latitude && treeData?.longitude) {
            const stampId = await createOrReuseSkystamp({ lat: treeData.latitude, lng: treeData.longitude, userId: user.id, treeId, offeringId: insertedOffering.id });
            if (stampId) await supabase.from("offerings").update({ sky_stamp_id: stampId } as any).eq("id", insertedOffering.id);
          }
        });
      }

      // Save tags
      if (taggedUsers.length > 0 && insertedOffering) {
        await supabase.from("offering_tags").insert(taggedUsers.map((t) => ({ offering_id: insertedOffering.id, tagged_user_id: t.id, tagged_by: user.id })));
      }

      // Dispatch offering-created event for First Walk and other listeners
      window.dispatchEvent(new CustomEvent("offering-created"));

      // Issue rewards
      let earnedReward: RewardResult | null = null;
      if (treeSpecies) {
        const s33dOverride = treeRole === "stewardship" ? 2 : 1;
        const rr = await issueRewards({ userId: user.id, treeId, treeSpecies, actionType: "offering", s33dAmount: s33dOverride });
        if (rr && (rr.s33dHearts > 0 || rr.speciesHearts > 0 || rr.influence > 0)) { earnedReward = rr; setRewardResult(rr); }
      }

      setCelebrationMsg({ emoji: cfg.emoji, message: `${cfg.singular} sealed!`, subtitle: `Your ${cfg.singular.toLowerCase()} has been offered` });
      setShowCelebration(true);
      setTimeout(() => { setShowCelebration(false); if (earnedReward) { setShowRewardReceipt(true); } else { onOpenChange(false); } }, 2000);
      resetForm();
      return;
    } catch (err: any) {
      toast({ title: "Error adding offering", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // Song offering
  const handleSongComplete = async (data: SelectedSongData) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Not authenticated", description: "Please sign in to add offerings", variant: "destructive" }); return; }
      const impactWeight = treeRole === "stewardship" ? 2.0 : 1.0;
      const { data: insertedOffering, error } = await supabase.from("offerings").insert({
        tree_id: treeId, type: "song" as const, title: data.title,
        content: data.message || `${data.artist}${data.album ? ` — ${data.album}` : ""}`,
        media_url: data.previewUrl || null, nft_link: data.externalUrl || null, created_by: user.id,
        sealed_by_staff: sealedByStaff.trim() || null, meeting_id: meetingId || null, visibility, tree_role: treeRole, impact_weight: impactWeight,
      }).select("id").single();
      if (error) throw error;
      if (insertedOffering) {
        supabase.from("trees").select("latitude, longitude").eq("id", treeId).single().then(async ({ data: treeData }) => {
          if (treeData?.latitude && treeData?.longitude) {
            const stampId = await createOrReuseSkystamp({ lat: treeData.latitude, lng: treeData.longitude, userId: user.id, treeId, offeringId: insertedOffering.id });
            if (stampId) await supabase.from("offerings").update({ sky_stamp_id: stampId } as any).eq("id", insertedOffering.id);
          }
        });
      }
      if (taggedUsers.length > 0 && insertedOffering) {
        await supabase.from("offering_tags").insert(taggedUsers.map((t) => ({ offering_id: insertedOffering.id, tagged_user_id: t.id, tagged_by: user.id })));
      }
      window.dispatchEvent(new CustomEvent("offering-created"));
      let earnedReward: RewardResult | null = null;
      if (treeSpecies) {
        const rr = await issueRewards({ userId: user.id, treeId, treeSpecies, actionType: "offering" });
        if (rr && (rr.s33dHearts > 0 || rr.speciesHearts > 0 || rr.influence > 0)) { earnedReward = rr; setRewardResult(rr); }
      }
      setCelebrationMsg({ emoji: "🎵", message: "Song offering sealed!", subtitle: `"${data.title}" by ${data.artist}` });
      setShowCelebration(true);
      resetForm();
      setTimeout(() => { setShowCelebration(false); if (earnedReward) { setShowRewardReceipt(true); } else { onOpenChange(false); } }, 2000);
    } catch (err: any) {
      toast({ title: "Error adding offering", description: err.message, variant: "destructive" });
    } finally { setLoading(false); submittingRef.current = false; }
  };

  // Voice offering
  const handleVoiceComplete = async (data: VoiceOfferingData) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Not authenticated", description: "Please sign in to add offerings", variant: "destructive" }); return; }
      const impactWeight = treeRole === "stewardship" ? 2.0 : 1.0;
      const { data: insertedOffering, error } = await supabase.from("offerings").insert({
        tree_id: treeId, type: "voice" as const,
        title: `Voice Offering (${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, "0")})`,
        content: data.message || null, media_url: data.audioUrl, created_by: user.id,
        sealed_by_staff: sealedByStaff.trim() || null, meeting_id: meetingId || null, visibility, tree_role: treeRole, impact_weight: impactWeight,
      }).select("id").single();
      if (error) throw error;
      if (taggedUsers.length > 0 && insertedOffering) {
        await supabase.from("offering_tags").insert(taggedUsers.map((t) => ({ offering_id: insertedOffering.id, tagged_user_id: t.id, tagged_by: user.id })));
      }
      window.dispatchEvent(new CustomEvent("offering-created"));
      let earnedReward: RewardResult | null = null;
      if (treeSpecies) {
        const rr = await issueRewards({ userId: user.id, treeId, treeSpecies, actionType: "offering" });
        if (rr && (rr.s33dHearts > 0 || rr.speciesHearts > 0 || rr.influence > 0)) { earnedReward = rr; setRewardResult(rr); }
      }
      setCelebrationMsg({ emoji: "🎙️", message: "Voice offering sealed!", subtitle: "Your voice has been offered" });
      setShowCelebration(true);
      resetForm();
      setTimeout(() => { setShowCelebration(false); if (earnedReward) { setShowRewardReceipt(true); } else { onOpenChange(false); } }, 2000);
    } catch (err: any) {
      toast({ title: "Error adding offering", description: err.message, variant: "destructive" });
    } finally { setLoading(false); submittingRef.current = false; }
  };

  // Book offering
  const handleBookComplete = async (data: BookOfferingData) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Not authenticated", description: "Please sign in to add offerings", variant: "destructive" }); return; }
      const contentParts = [data.author];
      if (data.genre) contentParts.push(`Genre: ${data.genre}`);
      if (data.quote) contentParts.push(`\n"${data.quote}"`);
      if (data.reflection) contentParts.push(`\n${data.reflection}`);
      const impactWeight = treeRole === "stewardship" ? 2.0 : 1.0;
      const { data: insertedOffering, error } = await supabase.from("offerings").insert({
        tree_id: treeId, type: "book" as const, title: data.title, content: contentParts.join("\n"),
        media_url: data.coverUrl || null, created_by: user.id, sealed_by_staff: sealedByStaff.trim() || null,
        meeting_id: meetingId || null, visibility, tree_role: treeRole, impact_weight: impactWeight,
      }).select("id").single();
      if (error) throw error;
      if (taggedUsers.length > 0 && insertedOffering) {
        await supabase.from("offering_tags").insert(taggedUsers.map((t) => ({ offering_id: insertedOffering.id, tagged_user_id: t.id, tagged_by: user.id })));
      }
      window.dispatchEvent(new CustomEvent("offering-created"));
      let earnedReward: RewardResult | null = null;
      if (treeSpecies) {
        const rr = await issueRewards({ userId: user.id, treeId, treeSpecies, actionType: "offering" });
        if (rr && (rr.s33dHearts > 0 || rr.speciesHearts > 0 || rr.influence > 0)) { earnedReward = rr; setRewardResult(rr); }
      }
      setCelebrationMsg({ emoji: "📖", message: "Book offering sealed!", subtitle: `"${data.title}" by ${data.author}` });
      setShowCelebration(true);
      resetForm();
      setTimeout(() => { setShowCelebration(false); if (earnedReward) { setShowRewardReceipt(true); } else { onOpenChange(false); } }, 2000);
    } catch (err: any) {
      toast({ title: "Error adding offering", description: err.message, variant: "destructive" });
    } finally { setLoading(false); submittingRef.current = false; }
  };

  // Delegated flows for song/voice/book
  if (activeType === "song") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto p-0">
          <OfferingCelebration active={showCelebration} emoji={celebrationMsg.emoji} message={celebrationMsg.message} subtitle={celebrationMsg.subtitle} onComplete={() => setShowCelebration(false)} />
          {/* Ambient glow bar */}
          <div className="h-1 rounded-t-lg" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)" }} />
          <div className="px-6 pt-5 pb-0">
            <DialogHeader>
              <DialogTitle className="text-primary font-serif text-xl tracking-wide flex items-center gap-2">
                <span className="text-2xl">🎵</span> Song Offering
              </DialogTitle>
              <p className="text-xs text-muted-foreground/70 font-serif tracking-wider mt-1">
                Let music flow through this Ancient Friend
              </p>
            </DialogHeader>
            {/* Type switcher */}
            <TypeSwitcher activeType={activeType} onChange={setActiveType} />
          </div>
          <div className="px-6 pb-6 mt-2">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <MusicOfferingFlow treeId={treeId} onComplete={handleSongComplete} onCancel={() => onOpenChange(false)} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (activeType === "voice") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto p-0">
          <OfferingCelebration active={showCelebration} emoji={celebrationMsg.emoji} message={celebrationMsg.message} subtitle={celebrationMsg.subtitle} onComplete={() => setShowCelebration(false)} />
          <div className="h-1 rounded-t-lg" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)" }} />
          <div className="px-6 pt-5 pb-0">
            <DialogHeader>
              <DialogTitle className="text-primary font-serif text-xl tracking-wide flex items-center gap-2">
                <span className="text-2xl">🎙️</span> Voice Offering
              </DialogTitle>
              <p className="text-xs text-muted-foreground/70 font-serif tracking-wider mt-1">
                Speak into the canopy — your voice becomes part of this tree
              </p>
            </DialogHeader>
            <TypeSwitcher activeType={activeType} onChange={setActiveType} />
          </div>
          <div className="px-6 pb-6 mt-2">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <VoiceOfferingFlow treeId={treeId} onComplete={handleVoiceComplete} onCancel={() => onOpenChange(false)} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (activeType === "book") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto p-0">
          <OfferingCelebration active={showCelebration} emoji={celebrationMsg.emoji} message={celebrationMsg.message} subtitle={celebrationMsg.subtitle} onComplete={() => setShowCelebration(false)} />
          <div className="h-1 rounded-t-lg" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)" }} />
          <div className="px-6 pt-5 pb-0">
            <DialogHeader>
              <DialogTitle className="text-primary font-serif text-xl tracking-wide flex items-center gap-2">
                <span className="text-2xl">📖</span> Book Offering
              </DialogTitle>
              <p className="text-xs text-muted-foreground/70 font-serif tracking-wider mt-1">
                Place a story in this Ancient Friend's living archive
              </p>
            </DialogHeader>
            <TypeSwitcher activeType={activeType} onChange={setActiveType} />
          </div>
          <div className="px-6 pb-6 mt-2">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <BookOfferingFlow treeId={treeId} onComplete={handleBookComplete} onCancel={() => onOpenChange(false)} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto p-0">
          <OfferingCelebration active={showCelebration} emoji={celebrationMsg.emoji} message={celebrationMsg.message} subtitle={celebrationMsg.subtitle} onComplete={() => setShowCelebration(false)} />

          {/* Ambient glow bar */}
          <div className="h-1 rounded-t-lg" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)" }} />

          {/* Ambient radial background */}
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.04), transparent 60%)" }}
          />

          <div className="px-6 pt-5 pb-0 relative">
            <DialogHeader>
              <DialogTitle className="text-primary font-serif text-xl tracking-wide flex items-center gap-2">
                <motion.span
                  className="text-2xl"
                  key={cfg.emoji}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {cfg.emoji}
                </motion.span>
                {cfg.singular} Offering
              </DialogTitle>
              <p className="text-xs text-muted-foreground/70 font-serif tracking-wider mt-1">
                Offer {["a", "e", "i", "o", "u"].includes(cfg.singular[0]?.toLowerCase()) ? "an" : "a"} {cfg.singular.toLowerCase()} to this Ancient Friend
              </p>
            </DialogHeader>

            {/* Type switcher */}
            <TypeSwitcher activeType={activeType} onChange={setActiveType} />
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 mt-2 relative">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="font-serif text-xs tracking-wider text-muted-foreground uppercase">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 200))}
                placeholder={`Name your ${cfg.singular.toLowerCase()}`}
                className="bg-secondary/20 border-border/50 font-serif"
                maxLength={200}
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="font-serif text-xs tracking-wider text-muted-foreground uppercase">{cfg.contentLabel}</Label>
              <Textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 5000))}
                placeholder={cfg.placeholder}
                maxLength={5000}
                className="bg-secondary/20 border-border/50 font-serif min-h-[100px]"
              />
            </div>

            {/* Photo upload */}
            {activeType === "photo" && (
              <div className="space-y-2">
                <Label className="font-serif text-xs tracking-wider text-muted-foreground uppercase">Photo</Label>
                {previewUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-border/50">
                    <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-cover" />
                    <button type="button" onClick={clearSelectedFile} className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/40 hover:border-primary/30 hover:bg-primary/[0.02]"
                    }`}
                    style={{ background: dragActive ? undefined : "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.03), transparent 70%)" }}
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.08)" }}>
                      <ImagePlus className="h-6 w-6 text-primary/50" />
                    </div>
                    <p className="text-sm text-muted-foreground/70 font-serif mb-3">Drop a photo here, or choose one</p>
                    <div className="flex justify-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="font-serif text-xs gap-1.5 border-primary/20">
                        <ImagePlus className="h-3 w-3" /> Gallery
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} className="font-serif text-xs gap-1.5 border-primary/20">
                        <Camera className="h-3 w-3" /> Camera
                      </Button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                  </div>
                )}
              </div>
            )}

            {/* Media URL for non-photo */}
            {activeType !== "photo" && (
              <div className="space-y-2">
                <Label htmlFor="media" className="font-serif text-xs tracking-wider text-muted-foreground uppercase">Media URL (optional)</Label>
                <Input id="media" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://..." className="bg-secondary/20 border-border/50 font-serif" />
              </div>
            )}

            {/* NFT link */}
            {activeType === "nft" && (
              <div className="space-y-2">
                <Label htmlFor="nft" className="font-serif text-xs tracking-wider text-muted-foreground uppercase">NFT Link</Label>
                <Input id="nft" value={nftLink} onChange={e => setNftLink(e.target.value)} placeholder="OpenSea / Rarible link..." className="bg-secondary/20 border-border/50 font-serif" />
              </div>
            )}

            {/* Tree role picker — always visible as it's important */}
            <TreeRolePicker value={treeRole} onChange={setTreeRole} disabled={loading} />

            {/* ─── Collapsible advanced options ─── */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full py-2 text-xs font-serif text-muted-foreground/60 hover:text-muted-foreground transition-colors group"
                >
                  <div className="h-px flex-1 bg-border/20" />
                  <Settings2 className="w-3 h-3" />
                  <span>More options</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                  <div className="h-px flex-1 bg-border/20" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                {/* Quote */}
                <OfferingQuoteInput value={quote} onChange={setQuote} />

                {/* Visibility (not for photos) */}
                {activeType !== "photo" && (
                  <OfferingVisibilityPicker value={visibility} onChange={setVisibility} disabled={loading} />
                )}

                {/* Staff seal */}
                <div className="space-y-2">
                  <Label htmlFor="staff" className="font-serif text-xs tracking-wider text-muted-foreground uppercase">Sealed by Staff (optional)</Label>
                  <Input id="staff" value={sealedByStaff} onChange={e => setSealedByStaff(e.target.value)} placeholder="Staff code..." className="bg-secondary/20 border-border/50 font-serif" />
                </div>

                {/* Tag wanderers */}
                <div className="space-y-2">
                  <Label className="font-serif text-xs tracking-wider text-muted-foreground uppercase flex items-center gap-1"><UserPlus className="h-3 w-3" /> Tag Wanderers</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={tagQuery}
                      onChange={e => {
                        setTagQuery(e.target.value);
                        if (tagTimerRef.current) clearTimeout(tagTimerRef.current);
                        if (e.target.value.length >= 2) {
                          tagTimerRef.current = setTimeout(() => searchTags(e.target.value), 300);
                        } else { clearTagResults(); }
                      }}
                      placeholder="Search by name..."
                      className="bg-secondary/20 border-border/50 font-serif pl-8"
                    />
                  </div>
                  {tagResults.length > 0 && (
                    <div className="border border-border/50 rounded-lg max-h-32 overflow-y-auto">
                      {tagResults.filter(r => !taggedUsers.find(t => t.id === r.id)).map(r => (
                        <button key={r.id} type="button" className="flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary/30 text-left" onClick={() => { setTaggedUsers(prev => [...prev, r]); setTagQuery(""); clearTagResults(); }}>
                          <Avatar className="h-5 w-5"><AvatarImage src={r.avatar_url || undefined} /><AvatarFallback className="text-[8px]">{(r.full_name || "?")[0]}</AvatarFallback></Avatar>
                          <span className="text-xs font-serif">{r.full_name || "Unknown"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {taggedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {taggedUsers.map(t => (
                        <Badge key={t.id} variant="secondary" className="gap-1 text-[10px] font-serif">
                          {t.full_name || "Unknown"}
                          <button type="button" onClick={() => setTaggedUsers(prev => prev.filter(x => x.id !== t.id))}><X className="h-2.5 w-2.5" /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || uploading}
                className="w-full font-serif tracking-wider gap-2 h-11"
                style={{
                  background: loading || uploading ? undefined : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
                  boxShadow: loading || uploading ? undefined : "0 4px 14px hsl(var(--primary) / 0.25)",
                }}
              >
                {loading || uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {uploading ? "Uploading..." : `Offer ${cfg.singular}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <RewardReceipt
        visible={showRewardReceipt}
        onClose={() => { setShowRewardReceipt(false); setRewardResult(null); onOpenChange(false); }}
        speciesHearts={rewardResult?.speciesHearts}
        speciesFamily={rewardResult?.speciesFamily}
        influence={rewardResult?.influence}
        actionLabel="Offering"
      />
    </>
  );
};

/** Inline type switcher — scrollable pill bar */
const TypeSwitcher = ({ activeType, onChange }: { activeType: OfferingType; onChange: (t: OfferingType) => void }) => (
  <div className="flex gap-1.5 overflow-x-auto py-3 -mx-1 px-1 scrollbar-none">
    {QUICK_TYPES.map((t) => (
      <button
        key={t.value}
        type="button"
        onClick={() => onChange(t.value)}
        className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-serif transition-all ${
          activeType === t.value
            ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
            : "border-border/30 text-muted-foreground/60 hover:border-primary/20 hover:text-foreground/80"
        }`}
      >
        <span className="text-sm">{t.emoji}</span>
        <span>{t.label}</span>
      </button>
    ))}
  </div>
);

export default AddOfferingDialog;
