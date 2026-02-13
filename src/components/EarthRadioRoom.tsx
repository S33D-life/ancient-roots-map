import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Music, TreeDeciduous, Leaf, Eye, Shuffle,
} from "lucide-react";
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
  id: string;
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
        artworkUrl: r.artworkUrl100?.replace("100x100", "600x600") || r.artworkUrl100,
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

/* ── Waveform visualizer ─────────────────────────────────── */

function WaveformBars({ active, barCount = 5 }: { active: boolean; barCount?: number }) {
  return (
    <div className="flex items-end gap-[3px] h-4">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={active ? {
            height: [4, 12 + Math.random() * 6, 6, 14 + Math.random() * 4, 4],
          } : { height: 4 }}
          transition={active ? {
            duration: 0.8 + i * 0.1,
            repeat: Infinity,
            ease: "easeInOut",
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
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
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [tunerOpen, setTunerOpen] = useState(false);
  const [trackChanging, setTrackChanging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch all song offerings with tree data ── */
  useEffect(() => {
    const load = async () => {
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
          id: s.id, title: s.title, content: s.content, media_url: s.media_url,
          tree_id: s.tree_id, tree_name: tree?.name || "Unknown Tree",
          species: tree?.species || "Unknown", created_at: s.created_at,
        };
      });
      setAllSongs(enriched);
      setLoading(false);
    };
    load();
  }, []);

  /* ── Build stations ── */
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
        return { type: "species" as StationType, id: species, label: `${resolved.common} Radio`, species: resolved.common, songCount: songs.length };
      })
      .sort((a, b) => b.songCount - a.songCount);

    const treeStations: Station[] = Array.from(treeMap.entries())
      .map(([id, data]) => ({ type: "tree" as StationType, id, label: data.name, species: data.species, songCount: data.songs.length }))
      .sort((a, b) => b.songCount - a.songCount);

    const allStation: Station = { type: "all", id: "all", label: "TETOL Radio", species: "All", songCount: allSongs.length };
    return { speciesStations, treeStations, allStation };
  }, [allSongs]);

  /* ── Default station ── */
  useEffect(() => {
    if (!loading && allSongs.length > 0 && !activeStation) setActiveStation(allStation);
  }, [loading, allSongs.length]);

  /* ── Playlist from station ── */
  useEffect(() => {
    if (!activeStation) return;
    let filtered: SongOffering[];
    if (activeStation.type === "all") filtered = allSongs;
    else if (activeStation.type === "species") filtered = allSongs.filter(s => s.species === activeStation.id);
    else filtered = allSongs.filter(s => s.tree_id === activeStation.id);

    const recent = filtered.slice(0, Math.ceil(filtered.length * 0.4));
    const rest = filtered.slice(Math.ceil(filtered.length * 0.4));
    setPlaylist([...shuffle(recent), ...shuffle(rest)]);
    setCurrentIndex(0);
  }, [activeStation, allSongs]);

  /* ── iTunes preview ── */
  useEffect(() => {
    if (!playlist.length) return;
    const song = playlist[currentIndex];
    if (!song) return;
    setPreviewLoading(true);
    setPreview(null);
    setTrackChanging(true);
    fetchItunes(extractSearch(song.title)).then(p => {
      setPreview(p);
      setPreviewLoading(false);
      setTimeout(() => setTrackChanging(false), 600);
    });
  }, [currentIndex, playlist]);

  /* ── Crossfade audio ── */
  useEffect(() => {
    if (!preview?.previewUrl) return;
    const newAudio = new Audio(preview.previewUrl);
    newAudio.volume = 0;
    newAudio.muted = isMuted;

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
        if (step >= fadeSteps) { clearInterval(fadeIntervalRef.current!); oldAudio.pause(); }
      }, fadeDuration / fadeSteps);
    } else {
      newAudio.volume = volume;
    }

    audioRef.current = newAudio;
    newAudio.addEventListener("ended", () => setCurrentIndex(prev => (prev + 1) % playlist.length));
    if (isPlaying) newAudio.play().catch(() => {});
    return () => { if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current); };
  }, [preview?.previewUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full"
          />
          <p className="font-serif text-sm text-muted-foreground tracking-[0.2em]">Tuning in…</p>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (allSongs.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Radio className="h-8 w-8 text-primary/40" />
        </div>
        <h3 className="font-serif text-xl text-foreground mb-2">No broadcasts yet</h3>
        <p className="text-sm text-muted-foreground font-serif max-w-sm mx-auto leading-relaxed">
          Song offerings at mapped trees become living radio stations. Visit the Atlas and offer a song to a tree to begin broadcasting.
        </p>
        <Button variant="ghost" className="mt-6 font-serif gap-2" onClick={() => navigate("/map")}>
          <TreeDeciduous className="h-4 w-4" />
          Visit the Atlas
        </Button>
      </div>
    );
  }

  const resolved = currentSong ? resolveSpecies(currentSong.species) : null;

  return (
    <div className="space-y-6">
      {/* ── Hero Console ── */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-2xl">
        {/* Background art with ambient motion */}
        <motion.div
          className="relative"
          animate={isPlaying ? { scale: [1, 1.01, 1] } : {}}
          transition={isPlaying ? { duration: 8, repeat: Infinity, ease: "easeInOut" } : {}}
        >
          <img src={treeRadioArt} alt="Earth Radio" className="w-full h-auto object-cover" />
        </motion.div>

        {/* Gradient overlay — stronger for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />

        {/* Playing glow ring around the console */}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{ boxShadow: [
              "inset 0 0 30px hsl(var(--primary) / 0.05)",
              "inset 0 0 60px hsl(var(--primary) / 0.12)",
              "inset 0 0 30px hsl(var(--primary) / 0.05)",
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* ── Station Badge — top-left corner ── */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4">
          <motion.button
            onClick={() => setTunerOpen(!tunerOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-primary/30 bg-background/60"
            whileTap={{ scale: 0.95 }}
          >
            <Radio className="h-3.5 w-3.5 text-primary" />
            <span className="font-serif text-xs text-foreground tracking-wider">
              {activeStation?.label || "Earth Radio"}
            </span>
            <WaveformBars active={isPlaying} barCount={3} />
          </motion.button>
        </div>

        {/* ── Now Playing + Controls — bottom overlay ── */}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 lg:p-8">
          <div className="flex items-end gap-4 md:gap-6">
            {/* Album Artwork — prominent */}
            <AnimatePresence mode="wait">
              <motion.div
                key={preview?.artworkUrl || "placeholder"}
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border border-primary/30 flex-shrink-0 shadow-xl"
              >
                {previewLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-card/80 backdrop-blur">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full"
                    />
                  </div>
                ) : preview?.artworkUrl ? (
                  <img src={preview.artworkUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-card/80">
                    <Music className="h-10 w-10 text-primary/25" />
                  </div>
                )}
                {/* Playing pulse ring */}
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-primary/40 pointer-events-none"
                    animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Track Info */}
            <div className="flex-1 min-w-0 pb-1">
              {/* Track title — large, high contrast */}
              <AnimatePresence mode="wait">
                <motion.h3
                  key={preview?.trackName || currentSong?.title || "none"}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.35 }}
                  className="text-lg md:text-2xl font-serif text-foreground truncate leading-tight"
                  style={{ textShadow: "0 2px 12px hsl(var(--background) / 0.8)" }}
                >
                  {preview?.trackName || currentSong?.title || "—"}
                </motion.h3>
              </AnimatePresence>

              {/* Artist */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={preview?.artistName || "none"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-sm md:text-base text-foreground/70 font-serif truncate mt-1"
                  style={{ textShadow: "0 1px 8px hsl(var(--background) / 0.6)" }}
                >
                  {preview?.artistName || currentSong?.content || ""}
                </motion.p>
              </AnimatePresence>

              {/* Offering context — subtle, collapsible detail */}
              {currentSong && resolved && (
                <p className="text-xs text-primary/50 font-serif mt-2 flex items-center gap-1.5 flex-wrap"
                   style={{ textShadow: "0 1px 6px hsl(var(--background) / 0.5)" }}>
                  <TreeDeciduous className="h-3 w-3 text-primary/40 flex-shrink-0" />
                  <span>offered to <span className="text-primary/70">{currentSong.tree_name}</span></span>
                  {resolved.latin && (
                    <span className="text-primary/30 italic">· {resolved.latin}</span>
                  )}
                </p>
              )}

              {/* ── Transport Controls ── */}
              <div className="flex items-center gap-3 mt-4">
                {/* Mute */}
                <motion.button
                  onClick={() => setIsMuted(!isMuted)}
                  whileTap={{ scale: 0.85 }}
                  className="text-foreground/40 hover:text-foreground/80 transition-colors p-1"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </motion.button>

                {/* Previous */}
                <motion.button
                  onClick={skipPrev}
                  whileTap={{ scale: 0.85 }}
                  className="text-foreground/40 hover:text-foreground/80 transition-colors p-1"
                  aria-label="Previous track"
                >
                  <SkipBack className="h-5 w-5" />
                </motion.button>

                {/* Play/Pause — hero button */}
                <motion.button
                  onClick={() => setIsPlaying(!isPlaying)}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.08 }}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 transition-colors backdrop-blur-sm"
                  style={{
                    background: isPlaying
                      ? "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.15))"
                      : "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.08))",
                    borderColor: isPlaying ? "hsl(var(--primary) / 0.6)" : "hsl(var(--primary) / 0.3)",
                    boxShadow: isPlaying
                      ? "0 0 28px hsl(var(--primary) / 0.25), 0 0 8px hsl(var(--primary) / 0.15)"
                      : "none",
                  }}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isPlaying ? "pause" : "play"}
                      initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: 30 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isPlaying
                        ? <Pause className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        : <Play className="h-5 w-5 md:h-6 md:w-6 text-primary ml-0.5" />}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>

                {/* Next */}
                <motion.button
                  onClick={skipNext}
                  whileTap={{ scale: 0.85 }}
                  className="text-foreground/40 hover:text-foreground/80 transition-colors p-1"
                  aria-label="Next track"
                >
                  <SkipForward className="h-5 w-5" />
                </motion.button>

                {/* Volume slider — desktop */}
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                  className="w-20 h-1 accent-primary opacity-50 hover:opacity-100 transition-opacity hidden sm:block ml-1"
                  aria-label="Volume"
                />
              </div>
            </div>

            {/* Waveform visualizer — desktop */}
            <div className="hidden md:flex items-center pb-2">
              <WaveformBars active={isPlaying} barCount={7} />
            </div>
          </div>

          {/* Rotation info bar */}
          <div className="mt-3 pt-2 border-t border-foreground/10 flex items-center justify-between text-[10px] text-foreground/35 font-serif">
            <span className="tracking-wider">{currentIndex + 1} / {playlist.length} in rotation</span>
            <span className="hidden sm:inline">{allSongs.length} offerings · {speciesStations.length} species</span>
            <motion.button
              onClick={() => { setPlaylist(shuffle(playlist)); setCurrentIndex(0); }}
              whileTap={{ scale: 0.9, rotate: 180 }}
              className="hover:text-foreground/60 transition-colors flex items-center gap-1"
            >
              <Shuffle className="h-3 w-3" />
              <span className="tracking-wider">Shuffle</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Station Tuner ── */}
      <motion.div
        className="rounded-xl border border-primary/15 bg-card/40 backdrop-blur-sm overflow-hidden"
        layout
      >
        <button
          className="w-full px-4 py-3.5 flex items-center justify-between text-left group"
          onClick={() => setTunerOpen(!tunerOpen)}
        >
          <span className="font-serif text-sm text-primary/90 tracking-wider flex items-center gap-2.5">
            <Radio className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
            Station Tuner
          </span>
          <motion.span
            animate={{ rotate: tunerOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-primary/40 text-xs"
          >
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {tunerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* All station */}
                <StationButton
                  station={allStation}
                  isActive={activeStation?.id === "all"}
                  onClick={() => { setActiveStation(allStation); setTunerOpen(false); }}
                  icon={<Radio className="h-3.5 w-3.5" />}
                  isPlaying={isPlaying && activeStation?.id === "all"}
                />

                {/* Species */}
                {speciesStations.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground/70 font-serif uppercase tracking-[0.2em] mb-2 px-1">
                      Species Broadcasts
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                      {speciesStations.map(s => (
                        <StationButton
                          key={s.id}
                          station={s}
                          isActive={activeStation?.id === s.id && activeStation?.type === "species"}
                          onClick={() => { setActiveStation(s); setTunerOpen(false); }}
                          icon={<Leaf className="h-3 w-3" />}
                          isPlaying={isPlaying && activeStation?.id === s.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Trees */}
                {treeStations.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground/70 font-serif uppercase tracking-[0.2em] mb-2 px-1">
                      Individual Trees
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                      {treeStations.map(s => {
                        const r = resolveSpecies(s.species);
                        return (
                          <StationButton
                            key={s.id}
                            station={s}
                            isActive={activeStation?.id === s.id && activeStation?.type === "tree"}
                            onClick={() => { setActiveStation(s); setTunerOpen(false); }}
                            icon={<TreeDeciduous className="h-3 w-3" />}
                            subtitle={r.common}
                            isPlaying={isPlaying && activeStation?.id === s.id}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Visit tree link */}
      {currentSong && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-serif gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/tree/${currentSong.tree_id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
            Visit this Ancient Friend
          </Button>
        </div>
      )}

      {/* CSS for radio bars fallback */}
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
  station, isActive, onClick, icon, subtitle, isPlaying,
}: {
  station: Station;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  subtitle?: string;
  isPlaying?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-xs font-serif ${
        isActive
          ? "bg-primary/10 border border-primary/25 text-foreground"
          : "hover:bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"
      }`}
      aria-pressed={isActive}
    >
      <span className={`flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/50"}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="block truncate">{station.label}</span>
        {subtitle && (
          <span className="block text-[10px] text-muted-foreground/50 truncate">{subtitle}</span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground/40 tabular-nums flex-shrink-0">
        {station.songCount}
      </span>
      {isActive && isPlaying && <WaveformBars active barCount={3} />}
      {isActive && !isPlaying && (
        <div className="w-2 h-2 rounded-full bg-primary/40 flex-shrink-0" />
      )}
    </motion.button>
  );
}

export default EarthRadioRoom;
