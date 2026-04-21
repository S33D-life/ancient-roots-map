/**
 * TreeRadioBlock — Mini radio section embedded in tree profile.
 * Shows a single-track player or placeholder if no audio exists.
 * Now supports YouTube song offerings with inline embed playback.
 */
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Radio, Play, Pause, Volume2, VolumeX, Music, Youtube, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Props {
  treeId: string;
  treeName: string;
  species: string;
  radioTheme?: string | null;
}

interface RadioSong {
  title: string;
  artist: string | null;
  previewUrl: string | null;
  youtubeEmbedUrl: string | null;
  youtubeVideoId: string | null;
  thumbnailUrl: string | null;
}

const TreeRadioBlock = ({ treeId, treeName, species, radioTheme }: Props) => {
  const [song, setSong] = useState<RadioSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showYTEmbed, setShowYTEmbed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSong = async () => {
      const { data } = await (supabase
        .from("offerings")
        .select("title, content, media_url, youtube_embed_url, youtube_video_id, thumbnail_url") as any)
        .eq("tree_id", treeId)
        .eq("type", "song")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const s = data[0];

        // If this is a YouTube offering, use it directly
        if (s.youtube_video_id) {
          setSong({
            title: s.title,
            artist: s.content,
            previewUrl: null,
            youtubeEmbedUrl: s.youtube_embed_url,
            youtubeVideoId: s.youtube_video_id,
            thumbnailUrl: s.thumbnail_url,
          });
          setLoading(false);
          return;
        }

        // Otherwise try iTunes preview
        try {
          const query = s.title.replace(/\s+by\s+/i, " ").trim();
          const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`);
          const json = await res.json();
          if (json.results?.length) {
            setSong({
              title: json.results[0].trackName,
              artist: json.results[0].artistName,
              previewUrl: json.results[0].previewUrl,
              youtubeEmbedUrl: null,
              youtubeVideoId: null,
              thumbnailUrl: null,
            });
          } else {
            setSong({
              title: s.title,
              artist: s.content,
              previewUrl: s.media_url,
              youtubeEmbedUrl: null,
              youtubeVideoId: null,
              thumbnailUrl: null,
            });
          }
        } catch {
          setSong({
            title: s.title,
            artist: s.content,
            previewUrl: s.media_url,
            youtubeEmbedUrl: null,
            youtubeVideoId: null,
            thumbnailUrl: null,
          });
        }
      }
      setLoading(false);
    };
    fetchSong();
  }, [treeId]);

  useEffect(() => {
    if (!song?.previewUrl) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(song.previewUrl);
    audio.muted = isMuted;
    audioRef.current = audio;
    if (isPlaying) audio.play().catch(() => {});
    return () => { audio.pause(); };
  }, [song?.previewUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  const isYouTube = !!song?.youtubeVideoId;

  const handlePlayClick = () => {
    if (isYouTube) {
      // Stop any audio preview before showing YT embed
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setShowYTEmbed(!showYTEmbed);
    } else {
      // Collapse any active YT embed before playing audio
      setShowYTEmbed(false);
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent)" }} />
        <h2 className="text-lg font-serif text-primary tracking-[0.2em] uppercase flex items-center gap-2">
          <Radio className="w-4 h-4" /> {radioTheme || "Hear the Tree"}
        </h2>
        <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }} />
      </div>

      <div
        className="rounded-xl border border-border/30 overflow-hidden"
        style={{ background: "linear-gradient(160deg, hsl(var(--card) / 0.7), hsl(var(--secondary) / 0.3))" }}
      >
        <div className="p-4 flex items-center gap-4">
          {/* YouTube thumbnail or waveform */}
          {isYouTube && song.thumbnailUrl ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
              <img src={song.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5">
                <Youtube className="w-3 h-3 text-white drop-shadow-sm" />
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-0.5 h-8 shrink-0">
              {[3, 5, 7, 4, 6, 3, 5, 4, 6, 3].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: isPlaying ? `${h * 3}px` : `${h}px`,
                    background: `hsl(var(--primary) / ${isPlaying ? 0.5 : 0.2})`,
                    transition: "height 0.5s ease, background 0.5s ease",
                    animation: isPlaying ? `waveBreath ${1.2 + i * 0.15}s ease-in-out infinite alternate` : "none",
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-serif">Loading…</p>
            </div>
          ) : song ? (
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm text-foreground truncate">{song.title}</p>
              {song.artist && <p className="text-xs text-muted-foreground font-serif truncate">{song.artist}</p>}
            </div>
          ) : (
            <div className="flex-1">
              <p className="text-xs text-muted-foreground/60 font-serif">
                Coming Soon — Submit a Sound Offering
              </p>
            </div>
          )}

          {song && (song.previewUrl || isYouTube) && (
            <div className="flex items-center gap-2 shrink-0">
              {!isYouTube && (
                <button onClick={() => setIsMuted(!isMuted)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={handlePlayClick}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-primary/30 hover:border-primary/60 transition-all glow-subtle"
                style={{ background: "hsl(var(--card) / 0.8)" }}
              >
                {(isPlaying || showYTEmbed) ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary ml-0.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Inline YouTube embed */}
        <AnimatePresence>
          {showYTEmbed && song?.youtubeEmbedUrl && (
            <motion.div
              className="px-4 pb-4"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  src={`${song.youtubeEmbedUrl}?autoplay=1&rel=0`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  title={song.title}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end">
        <Link
          to={`/library/music-room?tree=${treeId}`}
          className="inline-flex items-center gap-1 text-[11px] font-serif tracking-wide text-muted-foreground/70 hover:text-primary transition-colors"
        >
          Wander the Music Room <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
};

export default TreeRadioBlock;
