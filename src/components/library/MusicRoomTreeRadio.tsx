/**
 * MusicRoomTreeRadio — the hearth of the Music Room.
 *
 * An inline Tree Radio hero that sits at the top of the Music Room and
 * broadcasts a song from the currently scoped collection (Tree · Species
 * · Forest). When entered with `?tree=:id`, the anchor tree's offerings
 * are prioritised as the broadcast source.
 *
 * Reuses the existing iTunes-preview pattern from TreeRadio.tsx but
 * presented as a calm, central listening centre — not a popover button.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Radio,
  ArrowRight,
  TreeDeciduous,
  Music,
} from "lucide-react";

interface SongRow {
  id: string;
  title: string;
  artist: string;
  artwork: string | null;
  youtube_video_id: string | null;
  tree_id: string;
  tree_name: string;
  tree_species: string;
  offered_by: string | null;
  // Music Room may pass extra fields (content, thumbnail_url, etc.) — allow them through.
  [key: string]: unknown;
}

interface ItunesPreview {
  previewUrl: string;
  artworkUrl: string;
  artistName: string;
  trackName: string;
}

interface Props {
  /** Songs already filtered by the Music Room's shared scope dial */
  scopedSongs: SongRow[];
  /** Tree we're anchored to (if entered via ?tree=:id) */
  anchorTree: { id: string; name: string; species: string } | null;
  /** Current scope (for the small status label) */
  scopeLabel: "tree" | "species" | "forest";
  /** Open the song in the room's detail panel */
  onOpenSong: (song: SongRow) => void;
}

function extractSearchTerm(title: string): string {
  return title.replace(/\s+by\s+/i, " ").trim();
}

async function fetchItunesPreview(query: string): Promise<ItunesPreview | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`,
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

const MusicRoomTreeRadio = ({ scopedSongs, anchorTree, scopeLabel, onOpenSong }: Props) => {
  /** Broadcast playlist: anchor-tree songs first when in forest mode, else as-given. */
  const playlist = useMemo(() => {
    if (!anchorTree || scopeLabel !== "forest") return scopedSongs;
    const here: SongRow[] = [];
    const elsewhere: SongRow[] = [];
    for (const s of scopedSongs) (s.tree_id === anchorTree.id ? here : elsewhere).push(s);
    return [...here, ...elsewhere];
  }, [scopedSongs, anchorTree, scopeLabel]);

  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [preview, setPreview] = useState<ItunesPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset broadcast when playlist identity meaningfully changes
  useEffect(() => {
    setIndex(0);
  }, [playlist.length, anchorTree?.id, scopeLabel]);

  const current = playlist[index];

  // Resolve preview for current song
  useEffect(() => {
    if (!current) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreview(null);
    fetchItunesPreview(extractSearchTerm(current.title)).then((p) => {
      if (!cancelled) {
        setPreview(p);
        setPreviewLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [current?.id]);

  // Audio element lifecycle
  useEffect(() => {
    if (!preview?.previewUrl) return;
    if (audioRef.current) audioRef.current.pause();

    const audio = new Audio(preview.previewUrl);
    audio.muted = isMuted;
    audioRef.current = audio;

    const onEnded = () => {
      if (playlist.length > 0) setIndex((i) => (i + 1) % playlist.length);
    };
    audio.addEventListener("ended", onEnded);

    if (isPlaying) audio.play().catch(() => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview?.previewUrl]);

  // Sync play/pause toggling
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [isPlaying]);

  // Sync mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  const skipNext = () => {
    if (playlist.length === 0) return;
    setIndex((i) => (i + 1) % playlist.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!current) return;
    setIsPlaying((p) => !p);
  };

  const stationLabel =
    scopeLabel === "tree" && anchorTree
      ? anchorTree.name
      : scopeLabel === "species" && anchorTree
        ? `${anchorTree.species} kin`
        : anchorTree
          ? "The wider forest"
          : "The whole forest";

  /* ── Empty state ── */
  if (playlist.length === 0) {
    return (
      <section
        className="relative overflow-hidden rounded-3xl border border-primary/20 px-6 py-10 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(28 35% 18% / 0.55), hsl(var(--card) / 0.6) 70%)",
        }}
      >
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 mb-3">
          <Radio className="w-5 h-5 text-primary/70" />
        </div>
        <p className="font-serif text-sm text-foreground/85">Tree Radio is quiet.</p>
        <p className="font-serif italic text-xs text-muted-foreground mt-1">
          Be the first to leave a song beneath this tree.
        </p>
      </section>
    );
  }

  const artwork = preview?.artworkUrl || current?.artwork || null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-primary/25"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, hsl(28 45% 22% / 0.7), hsl(25 30% 10% / 0.85) 70%), linear-gradient(160deg, hsl(var(--card) / 0.6), hsl(var(--background) / 0.8))",
        boxShadow: "0 20px 60px -20px hsl(var(--primary) / 0.35)",
      }}
      aria-label="Tree Radio — the listening centre of the room"
    >
      {/* Soft warm glow behind the hearth */}
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(42 85% 55% / 0.18), transparent 65%)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative px-5 sm:px-7 pt-6 pb-7 flex flex-col items-center gap-5">
        {/* Station label */}
        <div className="flex items-center gap-2 text-[10px] font-serif tracking-[0.28em] uppercase text-primary/80">
          <Radio className="w-3.5 h-3.5" />
          <span>Tree Radio</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-foreground/70 normal-case tracking-[0.12em] italic font-serif">
            {stationLabel}
          </span>
        </div>

        {/* Vinyl + artwork */}
        <button
          type="button"
          onClick={() => current && onOpenSong(current)}
          className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
          aria-label={current ? `Open ${current.title}` : "Currently broadcasting"}
        >
          <div
            className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden"
            style={{
              boxShadow:
                "0 12px 40px hsl(0 0% 0% / 0.45), inset 0 0 0 6px hsl(28 30% 8% / 0.6)",
            }}
          >
            {/* Spinning record */}
            <motion.div
              className="absolute inset-0"
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={
                isPlaying
                  ? { duration: 12, ease: "linear", repeat: Infinity }
                  : { duration: 0.4 }
              }
            >
              {artwork ? (
                <img
                  src={artwork}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-radial-gradient(circle at center, hsl(28 30% 14%) 0px, hsl(28 35% 20%) 2px, hsl(28 25% 12%) 5px, hsl(28 30% 18%) 7px)",
                  }}
                />
              )}
              {/* Centre label */}
              <div
                className="absolute inset-[38%] rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle, hsl(42 60% 35%), hsl(28 50% 18%))",
                  boxShadow:
                    "inset 0 0 6px hsl(0 0% 0% / 0.4), 0 0 0 2px hsl(28 30% 12%)",
                }}
              >
                <Music className="w-3.5 h-3.5 text-amber-100/80" />
              </div>
              {/* Centre hole */}
              <div
                className="absolute inset-[48%] rounded-full"
                style={{ background: "hsl(28 30% 6%)" }}
              />
            </motion.div>

            {/* Sheen */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(140deg, hsl(0 0% 100% / 0.08), transparent 45%, transparent 80%, hsl(0 0% 0% / 0.25))",
              }}
            />
          </div>

          {/* Soft pulse ring while playing */}
          {isPlaying && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: "1px solid hsl(42 85% 55% / 0.4)" }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
            />
          )}
        </button>

        {/* Now playing */}
        <div className="text-center space-y-1 px-2 max-w-md">
          <p className="font-serif text-base sm:text-lg text-foreground/95 leading-snug truncate">
            {current?.title || "Tuning in…"}
          </p>
          <p className="font-serif italic text-sm text-muted-foreground truncate">
            {current?.artist}
          </p>
          {current && (
            <p className="text-[11px] font-serif text-muted-foreground/70 truncate">
              offered{current.offered_by ? <> by {current.offered_by}</> : null} at{" "}
              <Link
                to={`/tree/${current.tree_id}`}
                className="text-primary/80 hover:text-primary underline-offset-4 hover:underline"
              >
                {current.tree_name}
              </Link>
            </p>
          )}
        </div>

        {/* Transport controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground/80 hover:text-foreground transition-colors border border-border/40"
            style={{ background: "hsl(var(--background) / 0.5)" }}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={!current || (previewLoading && !preview)}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(140deg, hsl(42 85% 55%), hsl(28 70% 38%))",
              color: "hsl(28 60% 12%)",
              boxShadow: "0 6px 20px hsl(42 85% 45% / 0.45)",
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {previewLoading && !preview ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={skipNext}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground/80 hover:text-foreground transition-colors border border-border/40"
            style={{ background: "hsl(var(--background) / 0.5)" }}
            aria-label="Next song"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Hint */}
        {!preview && !previewLoading && current && (
          <p className="text-[10px] font-serif italic text-muted-foreground/60 text-center max-w-xs">
            No preview available — open the record to listen on its source.
          </p>
        )}

        {/* Quick path: into the song */}
        {current && (
          <div className="flex items-center gap-3 text-[11px] font-serif text-muted-foreground/70">
            <button
              type="button"
              onClick={() => onOpenSong(current)}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              Open record <ArrowRight className="w-3 h-3" />
            </button>
            <span className="text-muted-foreground/30">·</span>
            <Link
              to={`/tree/${current.tree_id}`}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <TreeDeciduous className="w-3 h-3" />
              Visit the tree
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default MusicRoomTreeRadio;
