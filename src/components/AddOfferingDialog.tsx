import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, ImagePlus, X, Sparkles, Search, Music, ExternalLink, Play, Pause } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type OfferingType = Database["public"]["Enums"]["offering_type"];

interface iTunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackViewUrl: string;
}

interface AddOfferingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  type: OfferingType;
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
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const AddOfferingDialog = ({ open, onOpenChange, treeId, type }: AddOfferingDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [nftLink, setNftLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sealedByStaff, setSealedByStaff] = useState(() => {
    return localStorage.getItem("linked_staff_code") || "";
  });
  const [songSearch, setSongSearch] = useState("");
  const [songResults, setSongResults] = useState<iTunesResult[]>([]);
  const [songSearching, setSongSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState<iTunesResult | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const cfg = typeConfig[type];

  // iTunes music search
  const searchMusic = useCallback(async (query: string) => {
    if (!query.trim()) { setSongResults([]); return; }
    setSongSearching(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=8`
      );
      const data = await res.json();
      setSongResults(data.results || []);
    } catch {
      setSongResults([]);
    } finally {
      setSongSearching(false);
    }
  }, []);

  const handleSongSearchChange = (value: string) => {
    setSongSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchMusic(value), 400);
  };

  const selectSong = (song: iTunesResult) => {
    setSelectedSong(song);
    setTitle(song.trackName);
    setContent(`${song.artistName} — ${song.collectionName}`);
    setMediaUrl(song.previewUrl || "");
    setNftLink(song.trackViewUrl || "");
    setSongResults([]);
    setSongSearch("");
    stopPreview();
  };

  const togglePreview = (url: string) => {
    if (playingPreview === url) {
      stopPreview();
    } else {
      stopPreview();
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingPreview(null);
      audioRef.current = audio;
      setPlayingPreview(url);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingPreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Please select an image under 10MB", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMediaUrl("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Missing title", description: "Please provide a title", variant: "destructive" });
      return;
    }
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

      const { error } = await supabase.from("offerings").insert({
        tree_id: treeId,
        type,
        title: title.trim(),
        content: content.trim() || null,
        media_url: finalMediaUrl,
        nft_link: type === "nft" ? nftLink.trim() || null : null,
        created_by: user.id,
        sealed_by_staff: sealedByStaff.trim() || null,
      });
      if (error) throw error;

      toast({
        title: `${cfg.singular} added! ✨`,
        description: `Your ${cfg.singular.toLowerCase()} has been sealed`,
        action: (
          <Button variant="outline" size="sm" className="font-serif text-xs" asChild>
            <a href={`/tree/${treeId}`}>View on map →</a>
          </Button>
        ),
      });
      setTitle("");
      setContent("");
      setMediaUrl("");
      setNftLink("");
      setSealedByStaff("");
      clearSelectedFile();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error adding offering", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto p-0">
        {/* Header with accent */}
        <div
          className="h-0.5"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)",
          }}
        />
        <div className="px-6 pt-5 pb-0">
          <DialogHeader>
            <DialogTitle className="text-primary font-serif text-xl tracking-wide flex items-center gap-2">
              <span className="text-2xl">{cfg.emoji}</span>
              Add {cfg.singular}
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-serif tracking-wider mt-1">
              Leave an offering for this ancient friend
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder={`Give your ${cfg.singular.toLowerCase()} a title`}
              maxLength={200}
              required
              className="font-serif"
            />
          </div>

          {/* Photo upload */}
          {type === "photo" && (
            <div className="space-y-3">
              <Label className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
                Photo
              </Label>

              {previewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={previewUrl} alt="Preview" className="w-full h-52 object-cover" />
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
              ) : (
                <>
                  {/* Drop zone */}
                  <div
                    className={`relative rounded-lg border-2 border-dashed transition-colors p-8 text-center cursor-pointer ${
                      dragActive ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/40"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-serif">
                      Drop image here or tap to browse
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">Max 10MB</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-2 font-serif text-xs"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </Button>
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="bg-card px-2 text-muted-foreground/60 font-serif tracking-wider">
                        or paste a URL
                      </span>
                    </div>
                  </div>
                  <Input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="text-xs"
                  />
                </>
              )}
            </div>
          )}

          {/* Song Search */}
          {type === "song" && (
            <div className="space-y-3">
              <Label className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
                Search Apple Music
              </Label>

              {/* Selected song preview */}
              {selectedSong && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <img
                    src={selectedSong.artworkUrl100}
                    alt={selectedSong.trackName}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-foreground truncate">{selectedSong.trackName}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedSong.artistName}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => { setSelectedSong(null); setTitle(""); setContent(""); setMediaUrl(""); setNftLink(""); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Search input */}
              {!selectedSong && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      value={songSearch}
                      onChange={(e) => handleSongSearchChange(e.target.value)}
                      placeholder="Search by song, artist, or album..."
                      className="pl-9 font-serif"
                    />
                    {songSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Results */}
                  {songResults.length > 0 && (
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-border/50 divide-y divide-border/30 bg-card">
                      {songResults.map((song) => (
                        <div
                          key={song.trackId}
                          className="flex items-center gap-3 p-2.5 hover:bg-primary/5 cursor-pointer transition-colors group"
                          onClick={() => selectSong(song)}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={song.artworkUrl100}
                              alt={song.trackName}
                              className="w-10 h-10 rounded object-cover"
                            />
                            {song.previewUrl && (
                              <button
                                type="button"
                                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); togglePreview(song.previewUrl); }}
                              >
                                {playingPreview === song.previewUrl ? (
                                  <Pause className="h-4 w-4 text-white" />
                                ) : (
                                  <Play className="h-4 w-4 text-white" />
                                )}
                              </button>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-serif text-foreground truncate">{song.trackName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{song.artistName} — {song.collectionName}</p>
                          </div>
                          <Music className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {songSearch && !songSearching && songResults.length === 0 && (
                    <p className="text-xs text-muted-foreground/60 font-serif text-center py-3">
                      No results found. Try a different search.
                    </p>
                  )}

                  {/* Manual URL fallback */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="bg-card px-2 text-muted-foreground/60 font-serif tracking-wider">
                        or paste an audio URL
                      </span>
                    </div>
                  </div>
                  <Input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://example.com/song.mp3"
                    className="text-xs"
                  />
                </>
              )}

              {/* Apple Music link if selected */}
              {selectedSong?.trackViewUrl && (
                <a
                  href={selectedSong.trackViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-primary/70 hover:text-primary font-serif tracking-wider"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on Apple Music
                </a>
              )}
            </div>
          )}

          {/* NFT Link */}
          {type === "nft" && (
            <div className="space-y-1.5">
              <Label htmlFor="nftLink" className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
                NFT Link
              </Label>
              <Input
                id="nftLink"
                type="url"
                value={nftLink}
                onChange={(e) => setNftLink(e.target.value)}
                placeholder="https://opensea.io/..."
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="content" className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              {cfg.contentLabel}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 5000))}
              placeholder={cfg.placeholder}
              maxLength={5000}
              rows={type === "poem" || type === "story" ? 8 : 3}
              className="font-serif leading-relaxed"
            />
            <p className="text-[10px] text-right text-muted-foreground/40">
              {content.length} / 5000
            </p>
          </div>

          {/* Sealed by Staff */}
          <div className="space-y-1.5">
            <Label htmlFor="sealed-staff" className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              ⚘ Sealed by Staff
            </Label>
            <Input
              id="sealed-staff"
              value={sealedByStaff}
              onChange={(e) => setSealedByStaff(e.target.value.slice(0, 50))}
              placeholder="e.g. OAK-C1S03"
              maxLength={50}
              className="font-serif text-sm"
            />
            <p className="text-[10px] text-muted-foreground/50 font-serif">
              Your staff identity that seals this offering
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-serif text-xs tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 font-serif text-xs tracking-wider gap-1.5"
            >
              {(loading || uploading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {uploading ? "Uploading..." : `Add ${cfg.singular}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOfferingDialog;
