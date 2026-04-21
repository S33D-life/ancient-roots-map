import { useState, useRef, useCallback, useEffect } from "react";
import SeasonalMomentPanel from "@/components/SeasonalMomentPanel";
import type { OfferingPrompt } from "@/hooks/use-seasonal-offerings";
import { useWandererSearch, WandererProfile } from "@/hooks/use-fellow-wanderers";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, ImagePlus, X, Sparkles, Search, UserPlus, Mic, BookOpen, ChevronDown } from "lucide-react";
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
import { upsertBookshelfEntry } from "@/repositories/bookshelf-upsert";
import OfferingQuoteInput, { type QuoteData } from "@/components/OfferingQuoteInput";
import OfferingPhotoTray, { type PhotoSlot } from "@/components/offering/OfferingPhotoTray";
import { MAX_OFFERING_PHOTOS } from "@/utils/offeringPhotos";
import { isOnline } from "@/utils/offlineSync";
import { queueMultiPhotoOffering } from "@/utils/offlineActions";
import { useConnectivity } from "@/hooks/use-connectivity";
import type { Database } from "@/integrations/supabase/types";

type OfferingType = Database["public"]["Enums"]["offering_type"];

interface AddOfferingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  treeSpecies?: string;
  treeName?: string;
  type: OfferingType;
  meetingId?: string | null;
  /** Called when user wants to return to the gateway to pick a different type */
  onChangeType?: () => void;
}

const typeConfig: Record<
  OfferingType,
  { singular: string; contentLabel: string; placeholder: string; emoji: string }
> = {
  photo: { singular: "Memory", contentLabel: "Caption", placeholder: "What memory does this capture?", emoji: "📸" },
  song: { singular: "Song", contentLabel: "Description", placeholder: "Paste or search for a song…", emoji: "🎵" },
  poem: { singular: "Poem", contentLabel: "Poem", placeholder: "Write your poem here...", emoji: "📜" },
  story: { singular: "Musing", contentLabel: "Your Thoughts", placeholder: "Share your thoughts about this tree...", emoji: "✍️" },
  nft: { singular: "NFT", contentLabel: "Description", placeholder: "Describe this NFT...", emoji: "✨" },
  voice: { singular: "Voice", contentLabel: "Reflection", placeholder: "What inspired this offering?", emoji: "🎙️" },
  book: { singular: "Book", contentLabel: "Reflection", placeholder: "Why are you offering this story?", emoji: "📖" },
};

/** Quick-select offering types — primary first, then secondary */
const PRIMARY_TYPES: { value: OfferingType; emoji: string; label: string }[] = [
  { value: "photo", emoji: "📸", label: "Memory" },
  { value: "song", emoji: "🎵", label: "Song" },
  { value: "story", emoji: "✍️", label: "Musing" },
  { value: "poem", emoji: "📜", label: "Poem" },
];

const SECONDARY_TYPES: { value: OfferingType; emoji: string; label: string }[] = [
  { value: "voice", emoji: "🎙️", label: "Voice" },
  { value: "book", emoji: "📖", label: "Book" },
  { value: "nft", emoji: "✨", label: "NFT" },
];

const QUICK_TYPES = [...PRIMARY_TYPES, ...SECONDARY_TYPES];

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

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const AddOfferingDialog = ({ open, onOpenChange, treeId, treeSpecies, treeName, type: initialType, meetingId, onChangeType }: AddOfferingDialogProps) => {
  const [activeType, setActiveType] = useState<OfferingType>(initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [nftLink, setNftLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([]);
  const [uploadingPhotoIds, setUploadingPhotoIds] = useState<Set<string>>(new Set());
  /** Slot ids whose upload failed and are awaiting retry. */
  const [failedPhotoIds, setFailedPhotoIds] = useState<Set<string>>(new Set());
  /** Map of slot id → uploaded public URL (preserves order via lookup). */
  const [uploadedUrlsById, setUploadedUrlsById] = useState<Record<string, string>>({});
  const [uploadBatch, setUploadBatch] = useState<{ total: number; done: number; failed: boolean } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sealedByStaff, setSealedByStaff] = useState(() => localStorage.getItem("linked_staff_code") || "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const submittingRef = useRef(false);
  const { toast } = useToast();
  const { online } = useConnectivity();
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

  const addPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 50MB", variant: "destructive" });
      return;
    }
    if (photoSlots.length >= MAX_OFFERING_PHOTOS) {
      toast({ title: "Limit reached", description: `Up to ${MAX_OFFERING_PHOTOS} photos per offering` });
      return;
    }
    try {
      const processed = await resizeImage(file);
      const slot: PhotoSlot = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: processed,
        previewUrl: URL.createObjectURL(processed),
      };
      setPhotoSlots((prev) => [...prev, slot].slice(0, MAX_OFFERING_PHOTOS));
      setMediaUrl("");
    } catch {
      toast({ title: "Processing failed", description: "Could not process the image", variant: "destructive" });
    }
  };

  const removePhoto = (id: string) => {
    setPhotoSlots((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (!files) return;
    const remaining = MAX_OFFERING_PHOTOS - photoSlots.length;
    Array.from(files).slice(0, remaining).forEach(addPhoto);
  };

  const clearAllPhotos = () => {
    photoSlots.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotoSlots([]);
  };

  const uploadFile = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${treeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("offerings").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("offerings").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const resetForm = () => {
    setTitle(""); setContent(""); setMediaUrl(""); setNftLink(""); setSealedByStaff(""); setTaggedUsers([]); setQuote({ text: "", author: "", source: "" }); clearAllPhotos();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || loading) return;

    // Auto-generate title if the user didn't provide one
    const resolvedTitle = title.trim() || content.trim().slice(0, 60).replace(/\n/g, " ") || `Untitled ${cfg.singular}`;

    submittingRef.current = true;
    setLoading(true);

    // Timeout fallback — 30s max
    const timeout = setTimeout(() => {
      if (submittingRef.current) {
        submittingRef.current = false;
        setLoading(false);
        setUploading(false);
        toast({ title: "Request timed out", description: "Something went wrong — try again", variant: "destructive" });
      }
    }, 30000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not authenticated", description: "Please sign in to add offerings", variant: "destructive" });
        submittingRef.current = false;
        setLoading(false);
        clearTimeout(timeout);
        return;
      }

      // ── Offline branch: queue the whole offering (record + photo blobs) in
      // IndexedDB. The sync engine will upload photos and create the row when
      // connectivity returns. Currently scoped to photo offerings.
      if (!isOnline() && activeType === "photo" && photoSlots.length > 0) {
        try {
          const dataUrls = await Promise.all(photoSlots.map((p) => fileToDataUrl(p.file)));
          const impactWeight = treeRole === "stewardship" ? 2.0 : 1.0;
          const quoteText = quote.text.trim() || null;
          const quoteAuthor = quoteText ? (quote.author.trim() || null) : null;
          const quoteSource = quoteText ? (quote.source.trim() || null) : null;
          await queueMultiPhotoOffering({
            payload: {
              tree_id: treeId,
              type: activeType,
              title: resolvedTitle,
              content: content.trim() || null,
              created_by: user.id,
              sealed_by_staff: sealedByStaff.trim() || null,
              meeting_id: meetingId || null,
              visibility: activeType === "photo" ? "public" : visibility,
              tree_role: treeRole,
              impact_weight: impactWeight,
              quote_text: quoteText,
              quote_author: quoteAuthor,
              quote_source: quoteSource,
              // photos + media_url are filled in by the sync engine after upload
            },
            photoDataUrls: dataUrls,
            label: `${cfg.singular}${treeName ? ` to ${treeName}` : ""}`,
          });
          const treePart = treeName ? ` to ${treeName}` : "";
          setCelebrationMsg({
            emoji: "📦",
            message: `${cfg.singular} saved offline${treePart}`,
            subtitle: `${dataUrls.length} ${dataUrls.length === 1 ? "photo" : "photos"} will upload when you're back online`,
          });
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            onOpenChange(false);
          }, 2400);
          resetForm();
          return;
        } catch (queueErr: any) {
          toast({
            title: "Couldn't save offline",
            description: queueErr?.message || "Please try again",
            variant: "destructive",
          });
          submittingRef.current = false;
          setLoading(false);
          clearTimeout(timeout);
          return;
        }
      }

      let finalMediaUrl = mediaUrl.trim() || null;
      let uploadedPhotos: string[] = [];
      if (photoSlots.length > 0) {
        setUploading(true);
        setUploadingPhotoIds(new Set(photoSlots.map((p) => p.id)));
        setUploadBatch({ total: photoSlots.length, done: 0, failed: false });
        try {
          // Upload all photos in parallel; clear each from the "uploading" set as it finishes
          uploadedPhotos = await Promise.all(
            photoSlots.map(async (p) => {
              const url = await uploadFile(p.file, user.id);
              setUploadingPhotoIds((prev) => {
                const next = new Set(prev);
                next.delete(p.id);
                return next;
              });
              setUploadBatch((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
              return url;
            }),
          );
          finalMediaUrl = uploadedPhotos[0] || finalMediaUrl;
        } catch (uploadErr: any) {
          // Mid-flight failure — if we lost connection, fall back to the
          // offline queue so the user doesn't lose their offering.
          if (activeType === "photo" && !isOnline()) {
            try {
              const dataUrls = await Promise.all(photoSlots.map((p) => fileToDataUrl(p.file)));
              const impactWeight = treeRole === "stewardship" ? 2.0 : 1.0;
              const quoteText = quote.text.trim() || null;
              await queueMultiPhotoOffering({
                payload: {
                  tree_id: treeId,
                  type: activeType,
                  title: resolvedTitle,
                  content: content.trim() || null,
                  created_by: user.id,
                  sealed_by_staff: sealedByStaff.trim() || null,
                  meeting_id: meetingId || null,
                  visibility: activeType === "photo" ? "public" : visibility,
                  tree_role: treeRole,
                  impact_weight: impactWeight,
                  quote_text: quoteText,
                  quote_author: quoteText ? quote.author.trim() || null : null,
                  quote_source: quoteText ? quote.source.trim() || null : null,
                },
                photoDataUrls: dataUrls,
                label: `${cfg.singular}${treeName ? ` to ${treeName}` : ""}`,
              });
              setUploadBatch(null);
              setCelebrationMsg({
                emoji: "📦",
                message: `${cfg.singular} saved offline`,
                subtitle: "Photos will upload when you're back online",
              });
              setShowCelebration(true);
              setTimeout(() => { setShowCelebration(false); onOpenChange(false); }, 2400);
              resetForm();
              return;
            } catch {
              /* fall through to error toast */
            }
          }
          setUploadBatch((prev) => (prev ? { ...prev, failed: true } : prev));
          toast({ title: "Upload failed", description: uploadErr.message || "One or more photos failed to upload — try again", variant: "destructive" });
          submittingRef.current = false;
          setLoading(false);
          setUploading(false);
          setUploadingPhotoIds(new Set());
          clearTimeout(timeout);
          return;
        } finally {
          setUploading(false);
          setUploadingPhotoIds(new Set());
          // Keep batch visible briefly so the user sees the "all ready" state, then clear
          setTimeout(() => setUploadBatch(null), 1500);
        }
      }

      const impactWeight = treeRole === "stewardship" ? 2.0 : 1.0;
      const quoteText = quote.text.trim() || null;
      const quoteAuthor = quoteText ? (quote.author.trim() || null) : null;
      const quoteSource = quoteText ? (quote.source.trim() || null) : null;

      const { data: insertedOffering, error } = await (supabase.from("offerings") as any).insert({
        tree_id: treeId,
        type: activeType,
        title: resolvedTitle,
        content: content.trim() || null,
        media_url: finalMediaUrl,
        photos: uploadedPhotos,
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

      const treePart = treeName ? ` to ${treeName}` : "";
      setCelebrationMsg({ emoji: cfg.emoji, message: `${cfg.singular} sealed${treePart}`, subtitle: "Your offering is now part of this tree's story" });
      setShowCelebration(true);
      setTimeout(() => { setShowCelebration(false); if (earnedReward) { setShowRewardReceipt(true); } else { onOpenChange(false); } }, 2400);
      resetForm();
      return;
    } catch (err: any) {
      toast({ title: "Something went wrong", description: "Try again — your content is still here", variant: "destructive" });
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // Song offering
  const handleSongComplete = async (data: SelectedSongData) => {
    if (submittingRef.current || loading) return;
    submittingRef.current = true;
    setLoading(true);
    const timeout = setTimeout(() => {
      if (submittingRef.current) { submittingRef.current = false; setLoading(false); toast({ title: "Request timed out", description: "Something went wrong — try again", variant: "destructive" }); }
    }, 30000);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Not authenticated", description: "Please sign in to add offerings", variant: "destructive" }); return; }
      const impactWeight = treeRole === "stewardship" ? 2.0 : 1.0;
      const { data: insertedOffering, error } = await (supabase.from("offerings") as any).insert({
        tree_id: treeId, type: "song" as const, title: data.title,
        content: data.message || `${data.artist}${data.album ? ` — ${data.album}` : ""}`,
        media_url: data.previewUrl || data.artworkUrl || null, nft_link: data.externalUrl || null, created_by: user.id,
        sealed_by_staff: sealedByStaff.trim() || null, meeting_id: meetingId || null, visibility, tree_role: treeRole, impact_weight: impactWeight,
        youtube_url: data.youtubeUrl || null,
        youtube_video_id: data.youtubeVideoId || null,
        youtube_embed_url: data.youtubeEmbedUrl || null,
        thumbnail_url: data.thumbnailUrl || data.artworkUrl || null,
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
      toast({ title: "Something went wrong", description: "Try again — your selection is still here", variant: "destructive" });
    } finally { clearTimeout(timeout); setLoading(false); submittingRef.current = false; }
  };

  // Voice offering
  const handleVoiceComplete = async (data: VoiceOfferingData) => {
    if (submittingRef.current || loading) return;
    submittingRef.current = true;
    setLoading(true);
    const timeout = setTimeout(() => {
      if (submittingRef.current) { submittingRef.current = false; setLoading(false); toast({ title: "Request timed out", description: "Something went wrong — try again", variant: "destructive" }); }
    }, 30000);
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
      toast({ title: "Something went wrong", description: "Try again — your recording is still here", variant: "destructive" });
    } finally { clearTimeout(timeout); setLoading(false); submittingRef.current = false; }
  };

  // Book offering
  const handleBookComplete = async (data: BookOfferingData) => {
    if (submittingRef.current || loading) return;
    submittingRef.current = true;
    setLoading(true);
    const timeout = setTimeout(() => {
      if (submittingRef.current) { submittingRef.current = false; setLoading(false); toast({ title: "Request timed out", description: "Something went wrong — try again", variant: "destructive" }); }
    }, 30000);
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
      // Upsert bookshelf entry (deduplicates by title+author, merges tree links)
      upsertBookshelfEntry({
        user_id: user.id,
        title: data.title,
        author: data.author,
        cover_url: data.coverUrl || null,
        quote: data.quote || null,
        reflection: data.reflection || null,
        visibility: visibility === "private" ? "private" : "public",
        linked_tree_ids: [treeId],
        offering_id: insertedOffering?.id || null,
        source: data.isCustom ? "manual" : "google_books",
      }).catch(err => console.warn("Bookshelf upsert skipped:", err));
      window.dispatchEvent(new CustomEvent("offering-created"));
      let earnedReward: RewardResult | null = null;
      if (treeSpecies) {
        const rr = await issueRewards({ userId: user.id, treeId, treeSpecies, actionType: "offering" });
        if (rr && (rr.s33dHearts > 0 || rr.speciesHearts > 0 || rr.influence > 0)) { earnedReward = rr; setRewardResult(rr); }
      }
      setCelebrationMsg({ emoji: "📖", message: "Your book has been placed", subtitle: `"${data.title}" is now in the Library` });
      setShowCelebration(true);
      resetForm();
      setTimeout(() => { setShowCelebration(false); if (earnedReward) { setShowRewardReceipt(true); } else { onOpenChange(false); } }, 2000);
    } catch (err: any) {
      toast({ title: "Something went wrong", description: "Try again — your entry is still here", variant: "destructive" });
    } finally { clearTimeout(timeout); setLoading(false); submittingRef.current = false; }
  };

  const celebrationOverlay = <OfferingCelebration active={showCelebration} emoji={celebrationMsg.emoji} message={celebrationMsg.message} subtitle={celebrationMsg.subtitle} onComplete={() => setShowCelebration(false)} />;

  // Delegated flows for song/voice/book
  if (activeType === "song") {
    return (
      <ResponsiveDialog
        open={open}
        onOpenChange={(v) => { if (!loading) onOpenChange(v); }}
        overlay={celebrationOverlay}
        title={<span className="flex items-center gap-2"><span className="text-2xl">🎵</span> Song Offering</span>}
        subtitle={<>{treeName ? `Place a song beneath ${treeName}` : "Let music flow through this Ancient Friend"}{onChangeType && <> · <button type="button" onClick={onChangeType} className="text-[11px] font-serif text-muted-foreground/50 hover:text-primary/70 transition-colors">← Change type</button></>}</>}
        fullscreenMobile
      >
        {/* Type pre-selected from gateway — no switcher */}
        <div className="mt-2 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs font-serif text-muted-foreground">Submitting…</p>
              </div>
            </div>
          )}
          <MusicOfferingFlow treeId={treeId} treeName={treeName} onComplete={handleSongComplete} onCancel={() => onOpenChange(false)} />
        </div>
      </ResponsiveDialog>
    );
  }

  if (activeType === "voice") {
    return (
      <ResponsiveDialog
        open={open}
        onOpenChange={(v) => { if (!loading) onOpenChange(v); }}
        overlay={celebrationOverlay}
        title={<span className="flex items-center gap-2"><span className="text-2xl">🎙️</span> Voice Offering</span>}
        subtitle={<>Speak into the canopy — your voice becomes part of this tree{onChangeType && <> · <button type="button" onClick={onChangeType} className="text-[11px] font-serif text-muted-foreground/50 hover:text-primary/70 transition-colors">← Change type</button></>}</>}
        fullscreenMobile
      >
        {/* Type pre-selected from gateway — no switcher */}
        <div className="mt-2 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs font-serif text-muted-foreground">Submitting…</p>
              </div>
            </div>
          )}
          <VoiceOfferingFlow treeId={treeId} onComplete={handleVoiceComplete} onCancel={() => onOpenChange(false)} />
        </div>
      </ResponsiveDialog>
    );
  }

  if (activeType === "book") {
    return (
      <ResponsiveDialog
        open={open}
        onOpenChange={(v) => { if (!loading) onOpenChange(v); }}
        overlay={celebrationOverlay}
        title={<span className="flex items-center gap-2"><span className="text-2xl">📖</span> Book Offering</span>}
        subtitle={<>Place a story in this Ancient Friend's living archive{onChangeType && <> · <button type="button" onClick={onChangeType} className="text-[11px] font-serif text-muted-foreground/50 hover:text-primary/70 transition-colors">← Change type</button></>}</>}
        fullscreenMobile
      >
        {/* Type pre-selected from gateway — no switcher */}
        <div className="mt-2 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs font-serif text-muted-foreground">Submitting…</p>
              </div>
            </div>
          )}
          <BookOfferingFlow treeId={treeId} onComplete={handleBookComplete} onCancel={() => onOpenChange(false)} />
        </div>
      </ResponsiveDialog>
    );
  }

  const changeTypeLink = onChangeType ? (
    <button
      type="button"
      onClick={onChangeType}
      className="text-[11px] font-serif text-muted-foreground/50 hover:text-primary/70 transition-colors mt-0.5"
    >
      ← Change type
    </button>
  ) : null;

  const titleNode = (
    <span className="flex items-center gap-2">
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
    </span>
  );

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(v) => { if (!loading) onOpenChange(v); }}
        overlay={celebrationOverlay}
        title={titleNode}
        subtitle={<>{treeName ? `Offering to ${treeName}` : `Offer ${["a", "e", "i", "o", "u"].includes(cfg.singular[0]?.toLowerCase()) ? "an" : "a"} ${cfg.singular.toLowerCase()} to this Ancient Friend`}{changeTypeLink && <> · {changeTypeLink}</>}</>}
        fullscreenMobile
      >

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* ─── PRIMARY GESTURE — type-specific hero area ─── */}

          {/* PHOTO: tray of up to 3 photos, then title + caption */}
          {activeType === "photo" && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`rounded-xl transition-all ${dragActive ? "ring-2 ring-primary/40 bg-primary/5 p-2" : ""}`}
              >
                <OfferingPhotoTray
                  photos={photoSlots}
                  onAdd={addPhoto}
                  onRemove={removePhoto}
                  onReorder={(next) => setPhotoSlots(next)}
                  uploadingIds={uploadingPhotoIds}
                  uploadProgress={uploadBatch ?? undefined}
                  offline={!online}
                  disabled={loading}
                />
              </div>
              {/* Title appears after first photo */}
              <AnimatePresence>
                {(photoSlots.length > 0 || title.length > 0) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value.slice(0, 200))}
                      placeholder="Name this memory"
                      className="bg-secondary/10 border-border/30 font-serif text-base"
                      maxLength={200}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Caption — softer, optional feel */}
              <AnimatePresence>
                {(photoSlots.length > 0 || content.length > 0) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <Textarea
                      id="content"
                      value={content}
                      onChange={e => setContent(e.target.value.slice(0, 5000))}
                      placeholder="What does this capture? (optional)"
                      maxLength={5000}
                      className="bg-secondary/10 border-border/30 font-serif min-h-[60px] text-base resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* MUSING / POEM / NFT: content-first hero */}
          {activeType !== "photo" && (
            <>
              {/* The writing area is the hero — big, inviting, immediate */}
              <Textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 5000))}
                placeholder={cfg.placeholder}
                maxLength={5000}
                className="bg-secondary/10 border-border/30 font-serif min-h-[120px] text-base resize-none"
                autoFocus
              />

              {/* Title appears after user starts writing */}
              <AnimatePresence>
                {(content.length > 0 || title.length > 0) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value.slice(0, 200))}
                      placeholder={`Name your ${cfg.singular.toLowerCase()}`}
                      className="bg-secondary/10 border-border/30 font-serif"
                      maxLength={200}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* NFT link — shown immediately for NFT type */}
              {activeType === "nft" && (
                <div className="space-y-1.5">
                  <Label htmlFor="nft" className="font-serif text-[10px] tracking-wider text-muted-foreground/50 uppercase">NFT Link</Label>
                  <Input id="nft" value={nftLink} onChange={e => setNftLink(e.target.value)} placeholder="OpenSea / Rarible link…" className="bg-secondary/10 border-border/30 font-serif" />
                </div>
              )}
            </>
          )}

          {/* ─── Collapsible: everything secondary ─── */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 w-full py-1 text-[10px] font-serif text-muted-foreground/35 hover:text-muted-foreground/55 transition-colors"
              >
                <div className="h-px flex-1 bg-border/10" />
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                <span>Add details</span>
                <div className="h-px flex-1 bg-border/10" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              {/* Seasonal prompt */}
              <SeasonalMomentPanel
                compact
                onPromptSelect={(prompt: OfferingPrompt) => {
                  if (prompt.suggestedType) {
                    setActiveType(prompt.suggestedType as OfferingType);
                  }
                }}
              />

              {/* Tree role */}
              <TreeRolePicker value={treeRole} onChange={setTreeRole} disabled={loading} />

              {/* Quote */}
              <OfferingQuoteInput value={quote} onChange={setQuote} />

              {/* Media URL for non-photo */}
              {activeType !== "photo" && (
                <div className="space-y-1.5">
                  <Label htmlFor="media" className="font-serif text-[10px] tracking-wider text-muted-foreground/50 uppercase">Media URL (optional)</Label>
                  <Input id="media" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://…" className="bg-secondary/10 border-border/30 font-serif" />
                </div>
              )}

              {/* Visibility (not for photos) */}
              {activeType !== "photo" && (
                <OfferingVisibilityPicker value={visibility} onChange={setVisibility} disabled={loading} />
              )}

              {/* Staff seal */}
              <div className="space-y-1.5">
                <Label htmlFor="staff" className="font-serif text-[10px] tracking-wider text-muted-foreground/50 uppercase">Sealed by Staff (optional)</Label>
                <Input id="staff" value={sealedByStaff} onChange={e => setSealedByStaff(e.target.value)} placeholder="Staff code…" className="bg-secondary/10 border-border/30 font-serif" />
              </div>

              {/* Tag wanderers */}
              <div className="space-y-1.5">
                <Label className="font-serif text-[10px] tracking-wider text-muted-foreground/50 uppercase flex items-center gap-1"><UserPlus className="h-3 w-3" /> Tag Wanderers</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    value={tagQuery}
                    onChange={e => {
                      setTagQuery(e.target.value);
                      if (tagTimerRef.current) clearTimeout(tagTimerRef.current);
                      if (e.target.value.length >= 2) {
                        tagTimerRef.current = setTimeout(() => searchTags(e.target.value), 300);
                      } else { clearTagResults(); }
                    }}
                    placeholder="Search by name…"
                    className="bg-secondary/10 border-border/30 font-serif pl-8"
                  />
                </div>
                {tagResults.length > 0 && (
                  <div className="border border-border/30 rounded-lg max-h-32 overflow-y-auto">
                    {tagResults.filter(r => !taggedUsers.find(t => t.id === r.id)).map(r => (
                      <button key={r.id} type="button" className="flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary/20 text-left" onClick={() => { setTaggedUsers(prev => [...prev, r]); setTagQuery(""); clearTagResults(); }}>
                        <Avatar className="h-5 w-5"><AvatarImage src={r.avatar_url || undefined} /><AvatarFallback className="text-[8px]">{(r.full_name || "?")[0]}</AvatarFallback></Avatar>
                        <span className="text-xs font-serif truncate">{r.full_name || "Unknown"}</span>
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

          {/* Submit — sticky on mobile */}
          <div className="pt-1 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-2 -mx-1 px-1">
            <Button
              type="submit"
              disabled={loading || uploading}
              className="w-full font-serif tracking-wider gap-2 h-12 text-sm active:scale-[0.98] transition-transform"
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
              {uploading ? "Uploading…" : loading ? "Sealing offering…" : treeName ? `Offer to ${treeName}` : `Offer ${cfg.singular}`}
            </Button>
            {!loading && !uploading && (
              <p className="text-[10px] text-center text-muted-foreground/30 font-serif mt-2 italic">
                Your offering becomes part of this tree's living story
              </p>
            )}
          </div>
        </form>
      </ResponsiveDialog>
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

/** Inline type switcher — scrollable pill bar with reduced visual weight */
const TypeSwitcher = ({ activeType, onChange }: { activeType: OfferingType; onChange: (t: OfferingType) => void }) => {
  const [showMore, setShowMore] = useState(() =>
    SECONDARY_TYPES.some((t) => t.value === activeType)
  );

  // Persist last-used tab
  useEffect(() => {
    try { localStorage.setItem("s33d-last-offering-type", activeType); } catch {}
  }, [activeType]);

  const renderPill = (t: { value: OfferingType; emoji: string; label: string }) => (
    <button
      key={t.value}
      type="button"
      onClick={() => onChange(t.value)}
      className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-serif transition-all duration-200 ${
        activeType === t.value
          ? "bg-primary/15 text-primary border border-primary/30"
          : "text-muted-foreground/50 hover:text-muted-foreground/80 border border-transparent"
      }`}
    >
      <span className="text-sm">{t.emoji}</span>
      <span className={activeType === t.value ? "font-medium" : ""}>{t.label}</span>
    </button>
  );

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-1 scrollbar-none">
      {PRIMARY_TYPES.map(renderPill)}
      {!showMore ? (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="shrink-0 px-2 py-1.5 rounded-full text-[10px] font-serif text-muted-foreground/40 hover:text-muted-foreground/70 border border-dashed border-border/30 transition-all"
        >
          More…
        </button>
      ) : (
        SECONDARY_TYPES.map(renderPill)
      )}
    </div>
  );
};

export default AddOfferingDialog;
