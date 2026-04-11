import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Play, Pause, SkipForward, Volume2, VolumeX, Music, X, TreeDeciduous, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SongOffering {
  id: string;
  title: string;
  content: string | null;
  nft_link: string | null;
  media_url: string | null;
  tree_name: string;
  species: string;
  youtube_video_id?: string | null;
  youtube_embed_url?: string | null;
  thumbnail_url?: string | null;
}

interface ItunesPreview {
  previewUrl: string;
  artworkUrl: string;
  artistName: string;
  trackName: string;
}

// Extract search term from offering title (strip "by" suffix pattern)
function extractSearchTerm(title: string): string {
  // e.g. "Hallelujah by Leonard Cohen" → "Hallelujah Leonard Cohen"
  return title.replace(/\s+by\s+/i, " ").trim();
}

async function fetchItunesPreview(query: string): Promise<ItunesPreview | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`
    );
    const data = await res.json();
    if (data.results?.length > 0) {
      const r = data.results[0];
      return {
        previewUrl: r.previewUrl,
        artworkUrl: r.artworkUrl100?.replace("100x100", "200x200") || r.artworkUrl100,
        artistName: r.artistName,
        trackName: r.trackName,
      };
    }
  } catch (e) {
    console.warn("iTunes lookup failed:", e);
  }
  return null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface TreeRadioProps {
  speciesFilter: string;
}

const TreeRadio = ({ speciesFilter }: TreeRadioProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [songs, setSongs] = useState<SongOffering[]>([]);
  const [playlist, setPlaylist] = useState<SongOffering[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<ItunesPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [localSpecies, setLocalSpecies] = useState(speciesFilter);
  const [availableSpecies, setAvailableSpecies] = useState<string[]>([]);
  const [showTuner, setShowTuner] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilter = localSpecies;

  // Fetch available species that have song offerings
  useEffect(() => {
    const fetchSpecies = async () => {
      const { data } = await supabase
        .from("offerings")
        .select("tree_id")
        .eq("type", "song");
      if (!data || data.length === 0) return;

      const treeIds = [...new Set(data.map((d) => d.tree_id))];
      const { data: treesData } = await supabase
        .from("trees")
        .select("species")
        .in("id", treeIds);

      if (treesData) {
        const unique = [...new Set(treesData.map((t) => t.species))].sort();
        setAvailableSpecies(unique);
      }
    };
    fetchSpecies();
  }, []);

  // Fetch songs by species
  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      let query = (supabase
        .from("offerings")
        .select("id, title, content, nft_link, media_url, tree_id, youtube_video_id, youtube_embed_url, thumbnail_url") as any)
        .eq("type", "song");

      const { data: songData } = await query;
      if (!songData || songData.length === 0) {
        setSongs([]);
        setLoading(false);
        return;
      }

      const treeIds = [...new Set(songData.map((s: any) => s.tree_id))] as string[];
      const { data: treesData } = await supabase
        .from("trees")
        .select("id, name, species")
        .in("id", treeIds);

      const treeMap = new Map(treesData?.map((t) => [t.id, t]) || []);

      const enriched: SongOffering[] = songData
        .map((s: any) => {
          const tree = treeMap.get(s.tree_id);
          return {
            id: s.id,
            title: s.title,
            content: s.content,
            nft_link: s.nft_link,
            media_url: s.media_url,
            tree_name: tree?.name || "Unknown Tree",
            species: tree?.species || "Unknown",
            youtube_video_id: s.youtube_video_id || null,
            youtube_embed_url: s.youtube_embed_url || null,
            thumbnail_url: s.thumbnail_url || null,
          };
        })
        .filter((s) => {
          if (activeFilter === "all") return true;
          return s.species.toLowerCase().includes(activeFilter.toLowerCase());
        });

      setSongs(enriched);
      setPlaylist(shuffle(enriched));
      setCurrentIndex(0);
      setLoading(false);
    };

    fetchSongs();
  }, [activeFilter]);

  // Fetch iTunes preview when current song changes
  useEffect(() => {
    if (playlist.length === 0) return;
    const song = playlist[currentIndex];
    if (!song) return;

    setPreviewLoading(true);
    setCurrentPreview(null);

    const searchTerm = extractSearchTerm(song.title);
    fetchItunesPreview(searchTerm).then((preview) => {
      setCurrentPreview(preview);
      setPreviewLoading(false);
    });
  }, [currentIndex, playlist]);

  // Audio playback
  useEffect(() => {
    if (!currentPreview?.previewUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(currentPreview.previewUrl);
    audio.muted = isMuted;
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      // Auto-advance
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    });

    if (isPlaying) {
      audio.play().catch(console.warn);
    }

    return () => {
      audio.pause();
      audio.removeEventListener("ended", () => {});
    };
  }, [currentPreview?.previewUrl]);

  // Sync play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(console.warn);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Sync mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const skipNext = useCallback(() => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  }, [playlist.length]);

  const currentSong = playlist[currentIndex];
  const stationName = activeFilter === "all" ? "TETOL" : activeFilter;

  return (
    <>
      {/* Radio toggle button */}
      <button
        onClick={() => {
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
            navigate("/radio");
          } else {
            clickTimerRef.current = setTimeout(() => {
              clickTimerRef.current = null;
              setIsOpen(!isOpen);
            }, 300);
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif tracking-wider transition-all border"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, hsl(28 40% 18%), hsl(35 50% 22%))"
            : "hsl(var(--background) / 0.9)",
          borderColor: isOpen ? "hsl(42 70% 45% / 0.6)" : "hsl(var(--border))",
          color: isOpen ? "hsl(42 95% 55%)" : "hsl(var(--foreground))",
          backdropFilter: "blur(12px)",
        }}
      >
        <Radio className="h-3.5 w-3.5" />
        Tree Radio
        {isPlaying && (
          <span className="flex gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 bg-current rounded-full"
                style={{
                  animation: `radioBar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                  height: "8px",
                }}
              />
            ))}
          </span>
        )}
      </button>

      {/* Radio panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-12 right-0 w-72 rounded-xl border overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(160deg, hsl(28 30% 14%), hsl(25 25% 10%))",
              borderColor: "hsl(42 50% 30% / 0.4)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: "hsl(42 40% 25% / 0.3)" }}
            >
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-amber-400/80" />
                <span className="font-serif text-sm text-amber-300/90 tracking-wider">
                  {stationName} Radio
                </span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-amber-300/40 hover:text-amber-300/80 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grove Tuner */}
            <div className="px-4 py-2 border-b relative" style={{ borderColor: "hsl(42 40% 25% / 0.3)" }}>
              <button
                onClick={() => setShowTuner(!showTuner)}
                className="flex items-center gap-2 w-full text-left"
              >
                <TreeDeciduous className="h-3.5 w-3.5 text-amber-400/60" />
                <span className="text-[11px] font-serif text-amber-300/70 tracking-wider flex-1">
                  Tuned to: <span className="text-amber-200/90">{stationName}</span>
                </span>
                <ChevronDown className={`h-3 w-3 text-amber-400/50 transition-transform ${showTuner ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showTuner && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pb-1 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      <button
                        onClick={() => { setLocalSpecies("all"); setShowTuner(false); }}
                        className={`text-[10px] font-serif px-2 py-1 rounded-full border transition-all ${
                          activeFilter === "all"
                            ? "bg-amber-400/20 border-amber-400/40 text-amber-200"
                            : "border-amber-400/15 text-amber-300/50 hover:text-amber-300 hover:border-amber-400/30"
                        }`}
                      >
                        TETOL
                      </button>
                      {availableSpecies.map((sp) => (
                        <button
                          key={sp}
                          onClick={() => { setLocalSpecies(sp); setShowTuner(false); }}
                          className={`text-[10px] font-serif px-2 py-1 rounded-full border transition-all ${
                            activeFilter.toLowerCase() === sp.toLowerCase()
                              ? "bg-amber-400/20 border-amber-400/40 text-amber-200"
                              : "border-amber-400/15 text-amber-300/50 hover:text-amber-300 hover:border-amber-400/30"
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Content */}
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                </div>
              ) : songs.length === 0 ? (
                <div className="text-center py-6">
                  <Music className="h-8 w-8 text-amber-400/20 mx-auto mb-2" />
                  <p className="text-amber-300/50 text-xs font-serif">
                    No songs shared with {stationName.toLowerCase()} trees yet
                  </p>
                </div>
              ) : (
                <>
                  {/* Now Playing */}
                  <div className="flex items-start gap-3 mb-4">
                    {/* Artwork */}
                    <div
                      className="w-14 h-14 rounded-lg border flex-shrink-0 overflow-hidden flex items-center justify-center"
                      style={{
                        borderColor: "hsl(42 40% 30% / 0.4)",
                        background: "hsl(42 20% 12%)",
                      }}
                    >
                      {previewLoading ? (
                        <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                      ) : currentPreview?.artworkUrl ? (
                        <img
                          src={currentPreview.artworkUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="h-6 w-6 text-amber-400/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-amber-400/50 font-serif uppercase tracking-widest mb-0.5">
                        Now Playing
                      </p>
                      <p className="text-sm text-amber-200/90 font-serif truncate">
                        {currentPreview?.trackName || currentSong?.title || "—"}
                      </p>
                      <p className="text-xs text-amber-300/50 font-serif truncate">
                        {currentPreview?.artistName || currentSong?.content || ""}
                      </p>
                      <p className="text-[10px] text-amber-400/30 font-serif mt-0.5 italic truncate">
                        offered to {currentSong?.tree_name}
                      </p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-amber-300/50 hover:text-amber-300 transition-colors"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, hsl(35 50% 25%), hsl(28 40% 20%))",
                        borderColor: "hsl(42 60% 40% / 0.5)",
                        boxShadow: isPlaying
                          ? "0 0 16px hsl(42 70% 40% / 0.3)"
                          : "none",
                      }}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 text-amber-300" />
                      ) : (
                        <Play className="h-4 w-4 text-amber-300 ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={skipNext}
                      className="text-amber-300/50 hover:text-amber-300 transition-colors"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Station info */}
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "hsl(42 40% 20% / 0.3)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-400/40 font-serif tracking-widest uppercase">
                        {playlist.length} song{playlist.length !== 1 ? "s" : ""} in rotation
                      </span>
                      <button
                        onClick={() => {
                          setPlaylist(shuffle(songs));
                          setCurrentIndex(0);
                        }}
                        className="text-[10px] text-amber-400/50 hover:text-amber-400 font-serif tracking-wider transition-colors"
                      >
                        ⟳ Shuffle
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dial decoration */}
            <div
              className="h-1.5"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(42 60% 35% / 0.4) 20%, hsl(42 70% 45% / 0.6) 50%, hsl(42 60% 35% / 0.4) 80%, transparent)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframe for equalizer bars */}
      <style>{`
        @keyframes radioBar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </>
  );
};

export default TreeRadio;
