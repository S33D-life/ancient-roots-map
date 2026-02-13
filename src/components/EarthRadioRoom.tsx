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
import treeRadioBg from "@/assets/tree-radio-bg.png";
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

/* ── Floating particles ────────────────────────────────────── */

function RadioParticles() {
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsl(${35 + Math.random() * 15} ${50 + Math.random() * 30}% ${55 + Math.random() * 20}% / ${0.15 + Math.random() * 0.2})`,
          }}
          animate={{
            y: [0, -(30 + Math.random() * 60), 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
            opacity: [0.1, 0.35, 0.1],
          }}
          transition={{
            duration: 8 + Math.random() * 12,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
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

  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="relative -mx-4 -mt-4 md:-mx-0 md:-mt-0 min-h-[80vh] overflow-hidden rounded-none md:rounded-2xl">
      {/* ── Background layer with parallax ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${treeRadioBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          backgroundAttachment: prefersReduced ? 'scroll' : 'fixed',
        }}
      />

      {/* ── Gradient overlays for readability ── */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: 'linear-gradient(to bottom, hsl(160 30% 8% / 0.55) 0%, hsl(160 25% 10% / 0.45) 40%, hsl(35 40% 12% / 0.7) 75%, hsl(28 35% 8% / 0.85) 100%)',
        }}
      />

      {/* ── Ambient glow behind controls ── */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          left: '50%',
          top: '55%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '60%',
          background: 'radial-gradient(ellipse at center, hsl(35 60% 35% / 0.12) 0%, transparent 70%)',
        }}
      />

      {/* ── Floating particles ── */}
      <RadioParticles />

      {/* ── Content — floats above the scene ── */}
      <div className="relative z-10 flex flex-col items-center px-4 py-8 md:py-12 min-h-[80vh]">

        {/* ── Station Badge ── */}
        <div className="w-full flex justify-center mb-6">
          <motion.button
            onClick={() => setTunerOpen(!tunerOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'hsl(28 30% 12% / 0.6)',
              borderColor: 'hsl(42 50% 40% / 0.3)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Radio className="h-3.5 w-3.5" style={{ color: 'hsl(42 80% 60%)' }} />
            <span className="font-serif text-xs tracking-wider" style={{ color: 'hsl(40 60% 85%)' }}>
              {activeStation?.label || "Earth Radio"}
            </span>
            <WaveformBars active={isPlaying} barCount={3} />
          </motion.button>
        </div>

        {/* ── Hero Console — glass card ── */}
        <div
          className="w-full max-w-lg rounded-2xl overflow-hidden border"
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            background: 'linear-gradient(160deg, hsl(28 25% 10% / 0.65), hsl(25 20% 8% / 0.75))',
            borderColor: 'hsl(42 50% 35% / 0.25)',
            boxShadow: '0 8px 40px hsl(28 40% 10% / 0.5), 0 0 60px hsl(35 60% 30% / 0.08)',
          }}
        >
          {/* Album art + Now Playing */}
          <div className="p-5 md:p-6">
            <div className="flex items-end gap-4 md:gap-5">
              {/* Artwork */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={preview?.artworkUrl || "placeholder"}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden flex-shrink-0"
                  style={{
                    border: '1px solid hsl(42 40% 35% / 0.3)',
                    boxShadow: isPlaying
                      ? '0 0 24px hsl(35 60% 40% / 0.3), 0 4px 16px hsl(0 0% 0% / 0.4)'
                      : '0 4px 16px hsl(0 0% 0% / 0.4)',
                  }}
                >
                  {previewLoading ? (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'hsl(28 20% 12%)' }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 rounded-full"
                        style={{ borderColor: 'hsl(42 50% 40% / 0.3)', borderTopColor: 'hsl(42 70% 55%)' }}
                      />
                    </div>
                  ) : preview?.artworkUrl ? (
                    <img src={preview.artworkUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'hsl(28 20% 12%)' }}>
                      <Music className="h-10 w-10" style={{ color: 'hsl(42 40% 40% / 0.3)' }} />
                    </div>
                  )}
                  {isPlaying && (
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{ border: '2px solid hsl(42 60% 50% / 0.4)' }}
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Track info */}
              <div className="flex-1 min-w-0 pb-1">
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={preview?.trackName || currentSong?.title || "none"}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.35 }}
                    className="text-lg md:text-xl font-serif truncate leading-tight"
                    style={{ color: 'hsl(40 60% 88%)', textShadow: '0 2px 8px hsl(0 0% 0% / 0.5)' }}
                  >
                    {preview?.trackName || currentSong?.title || "—"}
                  </motion.h3>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={preview?.artistName || "none"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="text-sm font-serif truncate mt-1"
                    style={{ color: 'hsl(42 50% 70%)' }}
                  >
                    {preview?.artistName || currentSong?.content || ""}
                  </motion.p>
                </AnimatePresence>

                {currentSong && resolved && (
                  <p className="text-xs font-serif mt-2 flex items-center gap-1.5 flex-wrap"
                     style={{ color: 'hsl(120 20% 55% / 0.6)' }}>
                    <TreeDeciduous className="h-3 w-3 flex-shrink-0" style={{ color: 'hsl(120 25% 50% / 0.5)' }} />
                    <span>offered to <span style={{ color: 'hsl(120 25% 60% / 0.8)' }}>{currentSong.tree_name}</span></span>
                    {resolved.latin && (
                      <span className="italic" style={{ color: 'hsl(120 15% 50% / 0.4)' }}>· {resolved.latin}</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* ── Transport Controls ── */}
            <div className="flex items-center justify-center gap-4 mt-5">
              <motion.button
                onClick={() => setIsMuted(!isMuted)}
                whileTap={{ scale: 0.85 }}
                className="p-1.5 transition-colors"
                style={{ color: 'hsl(40 40% 65% / 0.5)' }}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </motion.button>

              <motion.button
                onClick={skipPrev}
                whileTap={{ scale: 0.85 }}
                className="p-1.5 transition-colors"
                style={{ color: 'hsl(40 40% 65% / 0.5)' }}
                aria-label="Previous track"
              >
                <SkipBack className="h-5 w-5" />
              </motion.button>

              {/* Play/Pause — hero button */}
              <motion.button
                onClick={() => setIsPlaying(!isPlaying)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                className="w-14 h-14 rounded-full flex items-center justify-center border-2"
                style={{
                  backdropFilter: 'blur(8px)',
                  background: isPlaying
                    ? 'linear-gradient(135deg, hsl(35 50% 28% / 0.7), hsl(28 40% 20% / 0.6))'
                    : 'linear-gradient(135deg, hsl(35 40% 22% / 0.6), hsl(28 30% 15% / 0.5))',
                  borderColor: isPlaying ? 'hsl(42 60% 50% / 0.5)' : 'hsl(42 40% 35% / 0.3)',
                  boxShadow: isPlaying
                    ? '0 0 30px hsl(42 70% 40% / 0.25), 0 0 8px hsl(42 60% 45% / 0.15)'
                    : 'none',
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
                      ? <Pause className="h-6 w-6" style={{ color: 'hsl(42 80% 65%)' }} />
                      : <Play className="h-6 w-6 ml-0.5" style={{ color: 'hsl(42 70% 60%)' }} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>

              <motion.button
                onClick={skipNext}
                whileTap={{ scale: 0.85 }}
                className="p-1.5 transition-colors"
                style={{ color: 'hsl(40 40% 65% / 0.5)' }}
                aria-label="Next track"
              >
                <SkipForward className="h-5 w-5" />
              </motion.button>

              <input
                type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="w-16 h-1 accent-primary opacity-40 hover:opacity-80 transition-opacity hidden sm:block"
                aria-label="Volume"
              />
            </div>

            {/* Rotation info */}
            <div className="mt-4 pt-3 flex items-center justify-between text-[10px] font-serif" style={{ borderTop: '1px solid hsl(42 30% 25% / 0.2)', color: 'hsl(40 30% 55% / 0.4)' }}>
              <span className="tracking-wider">{currentIndex + 1} / {playlist.length} in rotation</span>
              <span className="hidden sm:inline">{allSongs.length} offerings · {speciesStations.length} species</span>
              <motion.button
                onClick={() => { setPlaylist(shuffle(playlist)); setCurrentIndex(0); }}
                whileTap={{ scale: 0.9, rotate: 180 }}
                className="flex items-center gap-1 transition-colors"
                style={{ color: 'hsl(40 30% 55% / 0.4)' }}
              >
                <Shuffle className="h-3 w-3" />
                <span className="tracking-wider">Shuffle</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Station Tuner — glass panel ── */}
        <motion.div
          className="w-full max-w-lg mt-4 rounded-xl overflow-hidden border"
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            background: 'hsl(28 20% 10% / 0.5)',
            borderColor: 'hsl(42 40% 30% / 0.2)',
          }}
          layout
        >
          <button
            className="w-full px-4 py-3.5 flex items-center justify-between text-left group"
            onClick={() => setTunerOpen(!tunerOpen)}
          >
            <span className="font-serif text-sm tracking-wider flex items-center gap-2.5" style={{ color: 'hsl(42 60% 70% / 0.9)' }}>
              <Radio className="h-4 w-4 transition-colors" style={{ color: 'hsl(42 50% 55% / 0.6)' }} />
              Station Tuner
            </span>
            <motion.span
              animate={{ rotate: tunerOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-xs"
              style={{ color: 'hsl(42 40% 50% / 0.4)' }}
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
                  <StationButton
                    station={allStation}
                    isActive={activeStation?.id === "all"}
                    onClick={() => { setActiveStation(allStation); setTunerOpen(false); }}
                    icon={<Radio className="h-3.5 w-3.5" />}
                    isPlaying={isPlaying && activeStation?.id === "all"}
                  />

                  {speciesStations.length > 0 && (
                    <div>
                      <p className="text-[10px] font-serif uppercase tracking-[0.2em] mb-2 px-1" style={{ color: 'hsl(40 25% 50% / 0.5)' }}>
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

                  {treeStations.length > 0 && (
                    <div>
                      <p className="text-[10px] font-serif uppercase tracking-[0.2em] mb-2 px-1" style={{ color: 'hsl(40 25% 50% / 0.5)' }}>
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
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-serif gap-1.5"
              style={{ color: 'hsl(40 30% 65% / 0.6)' }}
              onClick={() => navigate(`/tree/${currentSong.tree_id}`)}
            >
              <Eye className="h-3.5 w-3.5" />
              Visit this Ancient Friend
            </Button>
          </div>
        )}
      </div>
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
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-xs font-serif border"
      style={{
        background: isActive ? 'hsl(35 40% 18% / 0.5)' : 'transparent',
        borderColor: isActive ? 'hsl(42 50% 40% / 0.25)' : 'transparent',
        color: isActive ? 'hsl(40 60% 85%)' : 'hsl(40 20% 60% / 0.6)',
      }}
      aria-pressed={isActive}
    >
      <span className="flex-shrink-0" style={{ color: isActive ? 'hsl(42 70% 60%)' : 'hsl(40 20% 50% / 0.4)' }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="block truncate">{station.label}</span>
        {subtitle && (
          <span className="block text-[10px] truncate" style={{ color: 'hsl(40 15% 50% / 0.4)' }}>{subtitle}</span>
        )}
      </div>
      <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: 'hsl(40 20% 50% / 0.35)' }}>
        {station.songCount}
      </span>
      {isActive && isPlaying && <WaveformBars active barCount={3} />}
      {isActive && !isPlaying && (
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'hsl(42 60% 50% / 0.4)' }} />
      )}
    </motion.button>
  );
}

export default EarthRadioRoom;
