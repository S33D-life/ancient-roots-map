import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Music, TreeDeciduous, Signal, Leaf, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import treeRadioArt from "@/assets/tree-radio-art.jpeg";
import TREE_SPECIES from "@/data/treeSpecies";

/* ── Species name helpers ────────────────────────────────── */

const speciesLookup = new Map(
  TREE_SPECIES.map(s => [s.common.toLowerCase(), s])
);
const scientificLookup = new Map(
  TREE_SPECIES.map(s => [s.scientific.toLowerCase(), s])
);

function resolveSpecies(raw: string): { common: string; latin: string } {
  const lower = raw.toLowerCase().trim();
  const byCommon = speciesLookup.get(lower);
  if (byCommon) return { common: byCommon.common, latin: byCommon.scientific };
  const byLatin = scientificLookup.get(lower);
  if (byLatin) return { common: byLatin.common, latin: byLatin.scientific };
  // Check aliases
  for (const sp of TREE_SPECIES) {
    if (sp.aliases?.some(a => a.toLowerCase() === lower)) {
      return { common: sp.common, latin: sp.scientific };
    }
  }
  return { common: raw, latin: "" };
}

/* ── Types ───────────────────────────────────────────────── */

interface SongOffering {
  id: string;
  title: string;
  content: string | null;
  media_url: string | null;
  tree_id: string;
  tree_name: string;
  species: string;
  created_at: string;
}

interface ItunesPreview {
  previewUrl: string;
  artworkUrl: string;
  artistName: string;
  trackName: string;
}

type StationType = "species" | "tree" | "all";
interface Station {
  type: StationType;
  id: string; // species name or tree_id
  label: string;
  species: string;
  songCount: number;
}

/* ── Helpers ─────────────────────────────────────────────── */

function extractSearch(title: string): string {
  return title.replace(/\s+by\s+/i, " ").trim();
}

async function fetchItunes(query: string): Promise<ItunesPreview | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`
    );
    const data = await res.json();
    if (data.results?.length) {
      const r = data.results[0];
      return {
        previewUrl: r.previewUrl,
        artworkUrl: r.artworkUrl100?.replace("100x100", "300x300") || r.artworkUrl100,
        artistName: r.artistName,
        trackName: r.trackName,
      };
    }
  } catch { /* silent */ }
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

/* ── Component ───────────────────────────────────────────── */

const EarthRadioRoom = () => {
  const navigate = useNavigate();
  const [allSongs, setAllSongs] = useState<SongOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<SongOffering[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [preview, setPreview] = useState<ItunesPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Station state
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [tunerOpen, setTunerOpen] = useState(true);

  // Audio refs for crossfade
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio-reactive "signal" bars
  const [signalLevel, setSignalLevel] = useState(0);

  /* ── Fetch all song offerings with tree data ── */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: songData } = await supabase
        .from("offerings")
        .select("id, title, content, media_url, tree_id, created_at")
        .eq("type", "song")
        .order("created_at", { ascending: false });

      if (!songData?.length) { setAllSongs([]); setLoading(false); return; }

      const treeIds = [...new Set(songData.map(s => s.tree_id))];
      const { data: treesData } = await supabase
        .from("trees")
        .select("id, name, species")
        .in("id", treeIds);

      const treeMap = new Map(treesData?.map(t => [t.id, t]) || []);
      const enriched: SongOffering[] = songData.map(s => {
        const tree = treeMap.get(s.tree_id);
        return {
          id: s.id,
          title: s.title,
          content: s.content,
          media_url: s.media_url,
          tree_id: s.tree_id,
          tree_name: tree?.name || "Unknown Tree",
          species: tree?.species || "Unknown",
          created_at: s.created_at,
        };
      });
      setAllSongs(enriched);
      setLoading(false);
    };
    fetch();
  }, []);

  /* ── Build stations from songs ── */
  const { speciesStations, treeStations, allStation } = useMemo(() => {
    const speciesMap = new Map<string, SongOffering[]>();
    const treeMap = new Map<string, { name: string; species: string; songs: SongOffering[] }>();

    allSongs.forEach(s => {
      if (!speciesMap.has(s.species)) speciesMap.set(s.species, []);
      speciesMap.get(s.species)!.push(s);

      if (!treeMap.has(s.tree_id)) treeMap.set(s.tree_id, { name: s.tree_name, species: s.species, songs: [] });
      treeMap.get(s.tree_id)!.songs.push(s);
    });

    const speciesStations: Station[] = Array.from(speciesMap.entries())
      .map(([species, songs]) => {
        const resolved = resolveSpecies(species);
        return {
          type: "species" as StationType,
          id: species,
          label: `${resolved.common} Radio`,
          species: resolved.common,
          songCount: songs.length,
        };
      })
      .sort((a, b) => b.songCount - a.songCount);

    const treeStations: Station[] = Array.from(treeMap.entries())
      .map(([id, data]) => ({
        type: "tree" as StationType,
        id,
        label: data.name,
        species: data.species,
        songCount: data.songs.length,
      }))
      .sort((a, b) => b.songCount - a.songCount);

    const allStation: Station = {
      type: "all",
      id: "all",
      label: "TETOL Radio",
      species: "All",
      songCount: allSongs.length,
    };

    return { speciesStations, treeStations, allStation };
  }, [allSongs]);

  /* ── Set default station once data loads ── */
  useEffect(() => {
    if (!loading && allSongs.length > 0 && !activeStation) {
      setActiveStation(allStation);
    }
  }, [loading, allSongs.length]);

  /* ── Update playlist when station changes ── */
  useEffect(() => {
    if (!activeStation) return;
    let filtered: SongOffering[];
    if (activeStation.type === "all") {
      filtered = allSongs;
    } else if (activeStation.type === "species") {
      filtered = allSongs.filter(s => s.species === activeStation.id);
    } else {
      filtered = allSongs.filter(s => s.tree_id === activeStation.id);
    }

    // Algorithm: balance recency + variety, avoid repetition
    const recent = filtered.slice(0, Math.ceil(filtered.length * 0.4));
    const rest = filtered.slice(Math.ceil(filtered.length * 0.4));
    const curated = [...shuffle(recent), ...shuffle(rest)];

    setPlaylist(curated);
    setCurrentIndex(0);
  }, [activeStation, allSongs]);

  /* ── Fetch iTunes preview on track change ── */
  useEffect(() => {
    if (!playlist.length) return;
    const song = playlist[currentIndex];
    if (!song) return;
    setPreviewLoading(true);
    setPreview(null);
    fetchItunes(extractSearch(song.title)).then(p => {
      setPreview(p);
      setPreviewLoading(false);
    });
  }, [currentIndex, playlist]);

  /* ── Crossfade audio ── */
  useEffect(() => {
    if (!preview?.previewUrl) return;

    const newAudio = new Audio(preview.previewUrl);
    newAudio.volume = 0;
    newAudio.muted = isMuted;

    // Fade out old, fade in new
    if (audioRef.current) {
      const oldAudio = audioRef.current;
      const fadeSteps = 20;
      const fadeDuration = 1200;
      let step = 0;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = setInterval(() => {
        step++;
        const progress = step / fadeSteps;
        oldAudio.volume = Math.max(0, volume * (1 - progress));
        newAudio.volume = Math.min(volume, volume * progress);
        if (step >= fadeSteps) {
          clearInterval(fadeIntervalRef.current!);
          oldAudio.pause();
        }
      }, fadeDuration / fadeSteps);
    } else {
      newAudio.volume = volume;
    }

    audioRef.current = newAudio;
    newAudio.addEventListener("ended", () => {
      setCurrentIndex(prev => (prev + 1) % playlist.length);
    });

    if (isPlaying) newAudio.play().catch(() => {});

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [preview?.previewUrl]);

  // Sync play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Signal level animation
  useEffect(() => {
    if (!isPlaying) { setSignalLevel(0); return; }
    const interval = setInterval(() => {
      setSignalLevel(Math.random() * 0.6 + 0.4);
    }, 300);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const skipNext = useCallback(() => {
    if (!playlist.length) return;
    setCurrentIndex(prev => (prev + 1) % playlist.length);
    setIsPlaying(true);
  }, [playlist.length]);

  const skipPrev = useCallback(() => {
    if (!playlist.length) return;
    setCurrentIndex(prev => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  }, [playlist.length]);

  const currentSong = playlist[currentIndex];

  /* ── Render ───────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="font-serif text-sm text-muted-foreground tracking-widest">Tuning in…</p>
        </div>
      </div>
    );
  }

  if (allSongs.length === 0) {
    return (
      <div className="text-center py-16">
        <Radio className="h-12 w-12 text-primary/20 mx-auto mb-4" />
        <h3 className="font-serif text-lg text-foreground/70 mb-2">No broadcasts yet</h3>
        <p className="text-sm text-muted-foreground font-serif max-w-md mx-auto">
          Song offerings at mapped trees become radio stations. Visit the Atlas and offer a song to a tree to begin broadcasting.
        </p>
        <Button variant="ghost" className="mt-4 font-serif" onClick={() => navigate("/map")}>
          Visit the Atlas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ── The Radio Console — single hero image with overlaid controls ── */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-xl">
        {/* Background art — the tree radio console */}
        <img
          src={treeRadioArt}
          alt="Earth Radio"
          className="w-full h-auto object-cover"
        />

        {/* Subtle overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

        {/* ── Overlaid Now Playing + Controls ── */}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Album art */}
            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden border border-primary/30 flex-shrink-0 shadow-lg backdrop-blur-sm bg-card/30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={preview?.artworkUrl || "placeholder"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full"
                >
                  {previewLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : preview?.artworkUrl ? (
                    <img src={preview.artworkUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/30">
                      <Music className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              {isPlaying && (
                <div className="absolute inset-0 rounded-xl border-2 border-primary/30 animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Track info + controls */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <p className="text-[10px] text-foreground/50 font-serif uppercase tracking-[0.2em] mb-0.5">
                {activeStation?.label || "Earth Radio"}
              </p>
              <h3 className="text-base md:text-xl font-serif text-foreground truncate drop-shadow-md">
                {preview?.trackName || currentSong?.title || "—"}
              </h3>
              <p className="text-xs text-foreground/60 font-serif truncate mt-0.5 drop-shadow-sm">
                {preview?.artistName || currentSong?.content || ""}
              </p>
              {currentSong && (() => {
                const resolved = resolveSpecies(currentSong.species);
                return (
                  <p className="text-[10px] text-primary/60 font-serif mt-1 italic flex items-center gap-1 justify-center md:justify-start flex-wrap drop-shadow-sm">
                    <TreeDeciduous className="h-3 w-3 inline" />
                    offered to {currentSong.tree_name}
                    <span className="text-primary/40">· {resolved.common}</span>
                  </p>
                );
              })()}

              {/* Transport controls */}
              <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-foreground/50 hover:text-foreground transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button onClick={skipPrev} className="text-foreground/50 hover:text-foreground transition-colors" aria-label="Previous track">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all hover:scale-105 backdrop-blur-sm"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.1))",
                    borderColor: isPlaying ? "hsl(var(--primary) / 0.6)" : "hsl(var(--primary) / 0.3)",
                    boxShadow: isPlaying ? "0 0 24px hsl(var(--primary) / 0.25)" : "none",
                  }}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-5 w-5 text-primary" /> : <Play className="h-5 w-5 text-primary ml-0.5" />}
                </button>
                <button onClick={skipNext} className="text-foreground/50 hover:text-foreground transition-colors" aria-label="Next track">
                  <SkipForward className="h-4 w-4" />
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                  className="w-16 h-1 accent-primary opacity-60 hover:opacity-100 transition-opacity hidden sm:block"
                  aria-label="Volume"
                />
              </div>
            </div>

            {/* Signal bars */}
            <div className="hidden md:flex items-end gap-0.5 h-5 flex-shrink-0">
              {[0.3, 0.5, 0.7, 0.9, 1.0].map((threshold, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full transition-all duration-300"
                  style={{
                    height: `${6 + i * 3}px`,
                    backgroundColor: signalLevel >= threshold
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground) / 0.2)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Playlist info */}
          <div className="mt-3 pt-2 border-t border-foreground/10 flex items-center justify-between text-[10px] text-foreground/40 font-serif">
            <span>{currentIndex + 1} / {playlist.length} in rotation</span>
            <span>{allSongs.length} offerings · {speciesStations.length} species · {treeStations.length} trees</span>
            <button
              onClick={() => { setPlaylist(shuffle(playlist)); setCurrentIndex(0); }}
              className="hover:text-foreground/70 transition-colors tracking-wider"
            >
              ⟳ Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* ── Station Tuner — below the console ── */}
      <div className="rounded-xl border border-primary/20 bg-card/50 backdrop-blur overflow-hidden mt-6">
        <button
          className="w-full px-4 py-3 flex items-center justify-between text-left"
          onClick={() => setTunerOpen(!tunerOpen)}
        >
          <span className="font-serif text-sm text-primary tracking-wider flex items-center gap-2">
            <TreeDeciduous className="h-4 w-4" />
            Station Tuner
          </span>
          <span className={`text-primary/50 text-xs transition-transform ${tunerOpen ? "rotate-180" : ""}`}>▼</span>
        </button>

        <AnimatePresence>
          {tunerOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* All station */}
                <StationButton
                  station={allStation}
                  isActive={activeStation?.id === "all"}
                  onClick={() => setActiveStation(allStation)}
                  icon={<Radio className="h-3.5 w-3.5" />}
                />

                {/* Species */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-serif uppercase tracking-widest mb-2">
                    Species Broadcasts
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {speciesStations.map(s => (
                      <StationButton
                        key={s.id}
                        station={s}
                        isActive={activeStation?.id === s.id && activeStation?.type === "species"}
                        onClick={() => setActiveStation(s)}
                        icon={<Leaf className="h-3 w-3" />}
                      />
                    ))}
                  </div>
                </div>

                {/* Individual trees */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-serif uppercase tracking-widest mb-2">
                    Individual Trees
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {treeStations.map(s => (
                      <StationButton
                        key={s.id}
                        station={s}
                        isActive={activeStation?.id === s.id && activeStation?.type === "tree"}
                        onClick={() => setActiveStation(s)}
                        icon={<TreeDeciduous className="h-3 w-3" />}
                        showSpecies
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visit tree link */}
      {currentSong && (
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-serif gap-1 text-muted-foreground"
            onClick={() => navigate(`/tree/${currentSong.tree_id}`)}
          >
            <Eye className="h-3 w-3" />
            Visit this Ancient Friend
          </Button>
        </div>
      )}

      {/* CSS for radio bars */}
      <style>{`
        @keyframes radioBar {
          0% { height: 3px; }
          100% { height: 10px; }
        }
      `}</style>
    </div>
  );
};

/* ── Station Button ── */

function StationButton({
  station,
  isActive,
  onClick,
  icon,
  showSpecies,
}: {
  station: Station;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  showSpecies?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs font-serif ${
        isActive
          ? "bg-primary/15 border border-primary/30 text-foreground"
          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent"
      }`}
      aria-pressed={isActive}
    >
      <span className={isActive ? "text-primary" : "text-muted-foreground/60"}>
        {icon}
      </span>
      <span className="flex-1 truncate">{station.label}</span>
      {showSpecies && (() => {
        const resolved = resolveSpecies(station.species);
        return (
          <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-serif">
            {resolved.common}
          </Badge>
        );
      })()}
      <span className="text-[10px] text-muted-foreground/50">
        {station.songCount}
      </span>
      {isActive && (
        <span className="flex gap-0.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-0.5 bg-primary rounded-full"
              style={{
                animation: `radioBar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                height: "8px",
              }}
            />
          ))}
        </span>
      )}
    </button>
  );
}

export default EarthRadioRoom;
