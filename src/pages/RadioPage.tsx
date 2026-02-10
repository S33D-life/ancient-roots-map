import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import treeRadioArt from "@/assets/tree-radio-art.jpeg";

interface SongOffering {
  id: string;
  title: string;
  content: string | null;
  nft_link: string | null;
  media_url: string | null;
  tree_name: string;
  species: string;
}

interface ItunesPreview {
  previewUrl: string;
  artworkUrl: string;
  artistName: string;
  trackName: string;
}

function extractSearchTerm(title: string): string {
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
        artworkUrl: r.artworkUrl100?.replace("100x100", "600x600") || r.artworkUrl100,
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

const STATIONS = [
  { key: "all", label: "All Species" },
  { key: "yew", label: "Yew" },
  { key: "oak", label: "Oak" },
  { key: "beech", label: "Beech" },
  { key: "ash", label: "Ash" },
  { key: "holly", label: "Holly" },
];

const RadioPage = () => {
  const [station, setStation] = useState("all");
  const [songs, setSongs] = useState<SongOffering[]>([]);
  const [playlist, setPlaylist] = useState<SongOffering[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPreview, setCurrentPreview] = useState<ItunesPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<number>(0);

  // Fetch songs
  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      const { data: songData } = await supabase
        .from("offerings")
        .select("id, title, content, nft_link, media_url, tree_id")
        .eq("type", "song");

      if (!songData || songData.length === 0) {
        setSongs([]);
        setPlaylist([]);
        setLoading(false);
        return;
      }

      const treeIds = [...new Set(songData.map((s) => s.tree_id))];
      const { data: treesData } = await supabase
        .from("trees")
        .select("id, name, species")
        .in("id", treeIds);

      const treeMap = new Map(treesData?.map((t) => [t.id, t]) || []);

      const enriched: SongOffering[] = songData.map((s) => {
        const tree = treeMap.get(s.tree_id);
        return {
          id: s.id,
          title: s.title,
          content: s.content,
          nft_link: s.nft_link,
          media_url: s.media_url,
          tree_name: tree?.name || "Unknown Tree",
          species: tree?.species || "Unknown",
        };
      }).filter((s) => {
        if (station === "all") return true;
        return s.species.toLowerCase().includes(station.toLowerCase());
      });

      setSongs(enriched);
      setPlaylist(shuffle(enriched));
      setCurrentIndex(0);
      setLoading(false);
    };

    fetchSongs();
  }, [station]);

  // Fetch preview
  useEffect(() => {
    if (playlist.length === 0) return;
    const song = playlist[currentIndex];
    if (!song) return;

    setPreviewLoading(true);
    setCurrentPreview(null);
    setProgress(0);

    fetchItunesPreview(extractSearchTerm(song.title)).then((preview) => {
      setCurrentPreview(preview);
      setPreviewLoading(false);
    });
  }, [currentIndex, playlist]);

  // Audio playback
  useEffect(() => {
    if (!currentPreview?.previewUrl) return;
    if (audioRef.current) audioRef.current.pause();

    const audio = new Audio(currentPreview.previewUrl);
    audio.muted = isMuted;
    audioRef.current = audio;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
      progressRef.current = requestAnimationFrame(updateProgress);
    };

    audio.addEventListener("ended", () => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    });

    audio.addEventListener("play", () => {
      progressRef.current = requestAnimationFrame(updateProgress);
    });

    if (isPlaying) audio.play().catch(console.warn);

    return () => {
      audio.pause();
      cancelAnimationFrame(progressRef.current);
    };
  }, [currentPreview?.previewUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(console.warn);
    else audioRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  const skipNext = useCallback(() => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  }, [playlist.length]);

  const skipPrev = useCallback(() => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  }, [playlist.length]);

  const currentSong = playlist[currentIndex];
  const stationLabel = STATIONS.find(s => s.key === station)?.label || "All Species";

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src={treeRadioArt} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/85 backdrop-blur-md" />
      </div>

      <Header />

      <main className="flex-1 relative z-10 container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Back link */}
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 font-serif"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Library
          </Link>

          {/* Station header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <Radio className="w-6 h-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-serif text-foreground tracking-wide">
                Tree Radio
              </h1>
            </div>
            <p className="text-sm text-muted-foreground font-serif">
              Every tree has a song. Tune into the living soundtrack of the grove.
            </p>
          </div>

          {/* Station picker */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {STATIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setStation(s.key)}
                className={`px-4 py-2 rounded-full text-xs font-serif tracking-wider border transition-all ${
                  station === s.key
                    ? "bg-primary/15 border-primary/50 text-primary"
                    : "bg-card/40 border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Player card */}
          <motion.div
            layout
            className="rounded-2xl border overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(160deg, hsl(28 30% 14%), hsl(25 25% 10%))",
              borderColor: "hsl(42 50% 30% / 0.4)",
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : songs.length === 0 ? (
              <div className="text-center py-20 px-4">
                <Music className="h-12 w-12 text-primary/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-serif">
                  No songs offered to {stationLabel.toLowerCase()} trees yet
                </p>
                <Button variant="ghost" size="sm" className="mt-4 font-serif" asChild>
                  <Link to="/map">Offer a song on the Atlas</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Artwork */}
                <div className="relative aspect-square max-h-[360px] w-full overflow-hidden bg-black/30">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPreview?.artworkUrl || currentIndex}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {previewLoading ? (
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : currentPreview?.artworkUrl ? (
                        <img
                          src={currentPreview.artworkUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="h-16 w-16 text-primary/20" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(25_25%_10%)] via-transparent to-transparent" />
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-muted/20">
                  <div
                    className="h-full bg-primary/70 transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Info + controls */}
                <div className="p-6 space-y-4">
                  {/* Now Playing info */}
                  <div className="text-center">
                    <p className="text-[10px] text-primary/50 font-serif uppercase tracking-[0.2em] mb-1">
                      {stationLabel} Radio · {currentIndex + 1}/{playlist.length}
                    </p>
                    <h2 className="text-lg font-serif text-amber-200/90 truncate">
                      {currentPreview?.trackName || currentSong?.title || "—"}
                    </h2>
                    <p className="text-sm text-amber-300/50 font-serif truncate">
                      {currentPreview?.artistName || currentSong?.content || ""}
                    </p>
                    <p className="text-[11px] text-primary/30 font-serif mt-1 italic">
                      offered to {currentSong?.tree_name}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-amber-300/50 hover:text-amber-300 transition-colors"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={skipPrev}
                      className="text-amber-300/60 hover:text-amber-300 transition-colors"
                    >
                      <SkipBack className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-14 h-14 rounded-full flex items-center justify-center border transition-all hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, hsl(35 50% 25%), hsl(28 40% 20%))",
                        borderColor: "hsl(42 60% 40% / 0.5)",
                        boxShadow: isPlaying ? "0 0 24px hsl(42 70% 40% / 0.3)" : "none",
                      }}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 text-amber-300" />
                      ) : (
                        <Play className="h-5 w-5 text-amber-300 ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={skipNext}
                      className="text-amber-300/60 hover:text-amber-300 transition-colors"
                    >
                      <SkipForward className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => {
                        setPlaylist(shuffle(songs));
                        setCurrentIndex(0);
                      }}
                      className="text-amber-300/50 hover:text-amber-300 transition-colors text-sm font-serif"
                    >
                      ⟳
                    </button>
                  </div>
                </div>

                {/* Dial decoration */}
                <div
                  className="h-1.5"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, hsl(42 60% 35% / 0.4) 20%, hsl(42 70% 45% / 0.6) 50%, hsl(42 60% 35% / 0.4) 80%, transparent)",
                  }}
                />
              </>
            )}
          </motion.div>

          {/* Playlist */}
          {!loading && playlist.length > 0 && (
            <div className="mt-6 rounded-xl border border-border/30 bg-card/30 backdrop-blur overflow-hidden">
              <div className="px-4 py-3 border-b border-border/20">
                <h3 className="text-xs font-serif uppercase tracking-[0.15em] text-muted-foreground">
                  Queue · {playlist.length} songs
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {playlist.map((song, i) => (
                  <button
                    key={song.id}
                    onClick={() => { setCurrentIndex(i); setIsPlaying(true); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-primary/5 transition-colors border-b border-border/10 last:border-0 ${
                      i === currentIndex ? "bg-primary/10" : ""
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground/50 w-5 text-right font-mono">
                      {i === currentIndex && isPlaying ? "▶" : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-serif truncate ${i === currentIndex ? "text-primary" : "text-foreground/80"}`}>
                        {song.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 truncate">
                        {song.tree_name} · {song.species}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes radioBar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default RadioPage;
