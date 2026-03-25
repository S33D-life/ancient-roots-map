import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseAppleMusicInput } from "@/utils/appleMusicParser";
import {
  Search, Music, Play, Pause, X, Check, ChevronRight,
  Plus, Disc3, Loader2, Sparkles, ExternalLink, Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

/* ---------- Types ---------- */

interface CatalogSong {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  artwork_url: string | null;
  preview_url: string | null;
  external_url: string | null;
  source: string;
  similarity?: number;
}

interface iTunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackViewUrl: string;
}

export interface SelectedSongData {
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
  externalUrl: string | null;
  source: "catalog" | "itunes" | "custom";
  message: string;
}

interface MusicOfferingFlowProps {
  treeId: string;
  treeName?: string;
  onComplete: (data: SelectedSongData) => void;
  onCancel: () => void;
}

/* ---------- Helpers ---------- */

function normalizeITunes(r: iTunesResult): CatalogSong {
  return {
    id: `itunes-${r.trackId}`,
    title: r.trackName,
    artist: r.artistName,
    album: r.collectionName,
    genre: null,
    artwork_url: r.artworkUrl100,
    preview_url: r.previewUrl,
    external_url: r.trackViewUrl,
    source: "itunes",
  };
}

/* ---------- Shimmer Skeleton ---------- */

const ShimmerRow = () => (
  <div className="flex items-center gap-3 p-3 animate-pulse">
    <div className="w-11 h-11 rounded-lg bg-secondary/60" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 w-3/4 rounded bg-secondary/50" />
      <div className="h-2.5 w-1/2 rounded bg-secondary/40" />
    </div>
  </div>
);

/* ---------- Song Row ---------- */

const SongRow = ({
  song,
  isPlaying,
  onSelect,
  onTogglePreview,
}: {
  song: CatalogSong;
  isPlaying: boolean;
  onSelect: () => void;
  onTogglePreview: () => void;
}) => (
  <motion.button
    type="button"
    onClick={onSelect}
    className="flex items-center gap-3 p-3 w-full text-left rounded-lg hover:bg-primary/5 transition-colors group"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.2 }}
  >
    {/* Album art or placeholder */}
    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-secondary/40">
      {song.artwork_url ? (
        <img src={song.artwork_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Disc3 className="h-5 w-5 text-muted-foreground/30" />
        </div>
      )}
      {song.preview_url && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onTogglePreview(); }}
        >
          {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
        </button>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-serif text-foreground truncate">{song.title}</p>
      <p className="text-[11px] text-muted-foreground truncate">
        {song.artist}
        {song.album && <span className="text-muted-foreground/50"> · {song.album}</span>}
      </p>
    </div>

    {song.genre && (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/30 shrink-0 hidden sm:inline-flex">
        {song.genre}
      </Badge>
    )}

    {song.source === "itunes" && (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/20 text-primary/60 shrink-0">
        Apple Music
      </Badge>
    )}
  </motion.button>
);

/* ---------- Post-Offering Reward Moment ---------- */

const OfferingSealed = ({ songTitle, treeName }: { songTitle: string; treeName?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-8 space-y-4"
  >
    <motion.div
      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
      style={{
        background: "radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(120 40% 30% / 0.15))",
        boxShadow: "0 0 30px hsl(var(--primary) / 0.2), 0 0 60px hsl(120 40% 40% / 0.1)",
      }}
      animate={{
        boxShadow: [
          "0 0 20px hsl(45 90% 60% / 0.2), 0 0 40px hsl(120 40% 40% / 0.1)",
          "0 0 30px hsl(45 90% 60% / 0.35), 0 0 60px hsl(120 40% 40% / 0.2)",
          "0 0 20px hsl(45 90% 60% / 0.2), 0 0 40px hsl(120 40% 40% / 0.1)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Music className="h-7 w-7 text-primary" />
    </motion.div>
    <div>
      <p className="font-serif text-base text-foreground/90">Your offering now lives with this tree</p>
      {treeName && (
        <p className="text-xs text-muted-foreground/60 font-serif mt-1">
          "{songTitle}" echoes through {treeName}
        </p>
      )}
    </div>
  </motion.div>
);

/* ---------- Main Component ---------- */

const MusicOfferingFlow = ({ treeId, treeName, onComplete, onCancel }: MusicOfferingFlowProps) => {
  // Search state
  const [query, setQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<CatalogSong[]>([]);
  const [itunesResults, setItunesResults] = useState<CatalogSong[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [linkResolving, setLinkResolving] = useState(false);

  // Recent songs for this tree
  const [recentSongs, setRecentSongs] = useState<{ title: string; artist: string }[]>([]);

  // Selection state
  const [selectedSong, setSelectedSong] = useState<CatalogSong | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customArtist, setCustomArtist] = useState("");

  // Message
  const [message, setMessage] = useState("");

  // Audio
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Debounce
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step: "search" | "confirm"
  const step = selectedSong || customMode ? "confirm" : "search";
  const showSearchResults = !selectedSong && !customMode;

  // Fetch recent songs on mount
  useEffect(() => {
    supabase
      .rpc("get_recent_tree_songs", { p_tree_id: treeId })
      .then(({ data }) => {
        if (data) setRecentSongs(data.map((d: any) => ({ title: d.title, artist: d.artist || "" })));
      });
  }, [treeId]);

  // Search handler
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setCatalogResults([]); setItunesResults([]); setHasSearched(false); return; }
    setSearching(true);
    setHasSearched(true);

    try {
      const [catalogRes, itunesRes] = await Promise.allSettled([
        supabase.rpc("search_songs", { query: q, result_limit: 8 }),
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=6`)
          .then(r => r.json()),
      ]);

      if (catalogRes.status === "fulfilled" && catalogRes.value.data) {
        setCatalogResults(catalogRes.value.data as CatalogSong[]);
      }

      if (itunesRes.status === "fulfilled" && itunesRes.value.results) {
        const catalogTitles = new Set(
          (catalogRes.status === "fulfilled" && catalogRes.value.data || [])
            .map((c: any) => `${c.title.toLowerCase()}|${c.artist.toLowerCase()}`)
        );
        const filtered = (itunesRes.value.results as iTunesResult[])
          .filter(r => !catalogTitles.has(`${r.trackName.toLowerCase()}|${r.artistName.toLowerCase()}`))
          .map(normalizeITunes);
        setItunesResults(filtered);
      }
    } catch {
      // Graceful fallback
    } finally {
      setSearching(false);
    }
  }, []);

  // Resolve any music link
  const resolveMusicLink = useCallback(async (input: string): Promise<boolean> => {
    const urlMatch = input.match(/https?:\/\/[^\s"'<>)}\]]+/i);
    if (!urlMatch) return false;
    const url = urlMatch[0];

    const isMusic = /open\.spotify\.com|spotify\.link|youtube\.com|youtu\.be|music\.youtube\.com|music\.apple\.com|itunes\.apple\.com/i.test(url);
    if (!isMusic) return false;

    setLinkResolving(true);
    setSearching(true);
    setHasSearched(true);

    try {
      if (/music\.apple\.com|itunes\.apple\.com/i.test(url)) {
        const parsed = parseAppleMusicInput(input);
        if (parsed.trackId) {
          const res = await fetch(`https://itunes.apple.com/lookup?id=${parsed.trackId}&entity=song`);
          const data = await res.json();
          const track = data.results?.find((r: any) => r.wrapperType === "track");
          if (track) {
            handleSelect(normalizeITunes(track as iTunesResult));
            return true;
          }
        }
      }

      const { data, error } = await supabase.functions.invoke("resolve-music-link", {
        body: { url },
      });

      if (error || !data || data.error) return false;

      const song: CatalogSong = {
        id: `resolved-${Date.now()}`,
        title: data.title || "Unknown",
        artist: data.artist || "",
        album: data.album || null,
        genre: null,
        artwork_url: data.artwork_url || null,
        preview_url: data.preview_url || null,
        external_url: data.external_url || url,
        source: data.source === "spotify" ? "spotify" : data.source === "youtube" ? "youtube" : "itunes",
      };
      handleSelect(song);
      return true;
    } catch {
      return false;
    } finally {
      setLinkResolving(false);
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (/open\.spotify\.com|spotify\.link|youtube\.com|youtu\.be|music\.youtube\.com|music\.apple\.com|itunes\.apple\.com/i.test(value)) {
      searchTimerRef.current = setTimeout(async () => {
        const resolved = await resolveMusicLink(value);
        if (!resolved) performSearch(value);
      }, 300);
      return;
    }

    searchTimerRef.current = setTimeout(() => performSearch(value), 300);
  };

  // Audio controls
  const togglePreview = (url: string) => {
    if (playingUrl === url) {
      stopPreview();
    } else {
      stopPreview();
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingUrl(null);
      audioRef.current = audio;
      setPlayingUrl(url);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingUrl(null);
  };

  // Selection
  const handleSelect = (song: CatalogSong) => {
    stopPreview();
    setSelectedSong(song);
    setCustomMode(false);
  };

  const handleCustom = () => {
    stopPreview();
    setCustomMode(true);
    setSelectedSong(null);
    setCustomTitle(query);
  };

  const handleBack = () => {
    setSelectedSong(null);
    setCustomMode(false);
  };

  // Submit
  const handleSubmit = () => {
    stopPreview();
    if (customMode) {
      onComplete({
        title: customTitle.trim(),
        artist: customArtist.trim(),
        album: null,
        artworkUrl: null,
        previewUrl: null,
        externalUrl: null,
        source: "custom",
        message: message.trim(),
      });
    } else if (selectedSong) {
      onComplete({
        title: selectedSong.title,
        artist: selectedSong.artist,
        album: selectedSong.album,
        artworkUrl: selectedSong.artwork_url,
        previewUrl: selectedSong.preview_url,
        externalUrl: selectedSong.external_url,
        source: selectedSong.source === "itunes" ? "itunes" : "catalog",
        message: message.trim(),
      });
    }
  };

  const allResults = [...catalogResults, ...itunesResults];
  const canSubmit = customMode ? customTitle.trim().length > 0 : !!selectedSong;

  return (
    <div className="space-y-4 pb-2">
      {/* Tree context anchor */}
      {treeName && (
        <p className="text-[10px] font-serif tracking-widest uppercase text-center text-muted-foreground/50">
          Offering to: <span className="text-primary/70">{treeName}</span>
        </p>
      )}

      {/* Search — always visible */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
        <Input
          value={query}
          onChange={(e) => { handleQueryChange(e.target.value); if (selectedSong) { setSelectedSong(null); setCustomMode(false); } }}
          onFocus={(e) => {
            // Scroll into view on mobile when keyboard opens
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
          }}
          placeholder="Search or paste a Spotify / YouTube link…"
          className="pl-11 pr-10 font-serif h-14 text-base sm:text-sm rounded-xl bg-secondary/15 border-border/20
            focus:border-primary/40 focus:bg-secondary/25 transition-all placeholder:text-muted-foreground/35"
          autoFocus={!selectedSong}
        />
        {searching && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary/60" />
        )}
      </div>

      <AnimatePresence mode="wait">
        {showSearchResults ? (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Empty state — intent */}
            {!query && !hasSearched && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 space-y-4"
              >
                <motion.div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                  style={{
                    background: "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 70%)",
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 0px hsl(var(--primary) / 0)",
                      "0 0 20px hsl(var(--primary) / 0.15)",
                      "0 0 0px hsl(var(--primary) / 0)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Music className="h-7 w-7 text-primary/50" />
                </motion.div>
                <p className="text-sm font-serif text-foreground/70">
                  What song would you like to offer{treeName ? ` to ${treeName}` : ""}?
                </p>

                {/* Recent songs */}
                {recentSongs.length > 0 && (
                  <div className="pt-4 border-t border-border/15">
                    <p className="text-[10px] text-muted-foreground/40 font-serif tracking-widest uppercase mb-2.5">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Recently offered here
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {recentSongs.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleQueryChange(s.title)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/30 hover:bg-secondary/50
                            text-foreground/60 font-serif transition-colors"
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Shimmer loading */}
            {searching && allResults.length === 0 && (
              <div className="rounded-xl border border-border/20 overflow-hidden bg-card/30 backdrop-blur">
                {[0, 1, 2, 3].map(i => <ShimmerRow key={i} />)}
              </div>
            )}

            {/* Results */}
            {allResults.length > 0 && (
              <div className="rounded-xl border border-border/20 overflow-hidden bg-card/30 backdrop-blur max-h-[45vh] overflow-y-auto overscroll-contain">
                {catalogResults.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-secondary/15 border-b border-border/15">
                      <p className="text-[9px] font-serif tracking-widest uppercase text-muted-foreground/40">
                        <Disc3 className="w-3 h-3 inline mr-1" />
                        Sacred Catalog
                      </p>
                    </div>
                    <AnimatePresence>
                      {catalogResults.map(song => (
                        <SongRow
                          key={song.id}
                          song={song}
                          isPlaying={playingUrl === song.preview_url}
                          onSelect={() => handleSelect(song)}
                          onTogglePreview={() => song.preview_url && togglePreview(song.preview_url)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {itunesResults.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 bg-secondary/15 border-b border-border/15">
                      <p className="text-[9px] font-serif tracking-widest uppercase text-muted-foreground/40">
                        <Music className="w-3 h-3 inline mr-1" />
                        Apple Music
                      </p>
                    </div>
                    <AnimatePresence>
                      {itunesResults.map(song => (
                        <SongRow
                          key={song.id}
                          song={song}
                          isPlaying={playingUrl === song.preview_url}
                          onSelect={() => handleSelect(song)}
                          onTogglePreview={() => song.preview_url && togglePreview(song.preview_url)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* No results */}
            {hasSearched && !searching && allResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-5 space-y-3"
              >
                <p className="text-sm text-muted-foreground/60 font-serif">
                  No songs found for "{query}"
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCustom}
                  className="font-serif text-xs tracking-wider gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  Add your own song
                </Button>
              </motion.div>
            )}

            {/* Custom entry option */}
            {hasSearched && !searching && allResults.length > 0 && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleCustom}
                  className="text-[11px] text-primary/50 hover:text-primary font-serif tracking-wider transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Can't find it? Add your own
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* ---------- Confirm ---------- */
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Back to search */}
            <button
              type="button"
              onClick={handleBack}
              className="text-[11px] text-muted-foreground hover:text-foreground font-serif tracking-wider transition-colors inline-flex items-center gap-1"
            >
              ← Choose a different song
            </button>

            {/* Custom entry form */}
            {customMode && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="w-12 h-12 rounded-lg bg-secondary/40 flex items-center justify-center shrink-0">
                    <Plus className="h-5 w-5 text-primary/60" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)}
                      placeholder="Song title *"
                      className="font-serif text-base sm:text-sm h-10 sm:h-9 bg-transparent border-border/30"
                      autoFocus
                    />
                    <Input
                      value={customArtist}
                      onChange={(e) => setCustomArtist(e.target.value)}
                      onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)}
                      placeholder="Artist name"
                      className="font-serif text-base sm:text-sm h-9 sm:h-8 bg-transparent border-border/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Selected song confirmation card */}
            {selectedSong && (
              <div className="relative rounded-xl border border-primary/25 overflow-hidden">
                <div
                  className="h-0.5"
                  style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)" }}
                />
                <div className="p-4 flex items-center gap-4 bg-primary/5">
                  {/* Album art */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-secondary/40 shadow-lg">
                    {selectedSong.artwork_url ? (
                      <img src={selectedSong.artwork_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                    {selectedSong.preview_url && (
                      <button
                        type="button"
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                        onClick={() => togglePreview(selectedSong.preview_url!)}
                      >
                        {playingUrl === selectedSong.preview_url ? (
                          <Pause className="h-5 w-5 text-white" />
                        ) : (
                          <Play className="h-5 w-5 text-white" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base text-foreground truncate">{selectedSong.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{selectedSong.artist}</p>
                    {selectedSong.album && (
                      <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">{selectedSong.album}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/30">
                        {selectedSong.source === "itunes" ? "Apple Music" : selectedSong.source === "spotify" ? "Spotify" : selectedSong.source === "youtube" ? "YouTube" : "Sacred Catalog"}
                      </Badge>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {selectedSong.external_url && (
                  <a
                    href={selectedSong.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-[10px] text-primary/50 hover:text-primary font-serif tracking-wider border-t border-border/15 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    Listen on {selectedSong.source === "itunes" ? "Apple Music" : selectedSong.source === "spotify" ? "Spotify" : selectedSong.source === "youtube" ? "YouTube" : "streaming"}
                  </a>
                )}
              </div>
            )}

            {/* Why this song? */}
            <div className="space-y-1.5">
              <label className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/50">
                Why this song? <span className="normal-case tracking-normal text-muted-foreground/30">(optional)</span>
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)}
                placeholder="What does this song mean to you, or to this tree?"
                rows={2}
                className="font-serif text-base sm:text-sm leading-relaxed bg-secondary/10 border-border/20 resize-none
                  focus:border-primary/30 transition-all"
              />
            </div>

            {/* Actions */}
            <Button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="w-full font-serif tracking-wider gap-2 h-12 rounded-xl text-sm"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))"
                  : undefined,
                boxShadow: canSubmit ? "0 4px 20px hsl(var(--primary) / 0.25)" : undefined,
              }}
            >
              <Sparkles className="h-4 w-4" />
              Offer this song
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MusicOfferingFlow;
