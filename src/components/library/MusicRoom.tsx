/**
 * MusicRoom — Browse-first view for music offerings across the forest.
 *
 * A living grid of album artwork pulled from existing song offerings.
 * Foundation for a future universal offering browser.
 *
 * Scope dial (Tree · Species · Forest):
 *   - Tree   → only the entry tree
 *   - Species → all offerings on trees of the same species
 *   - Forest → every song offering
 *
 * Entered with `?tree=:id` to anchor scope to a specific tree.
 * Cards open the tree page (existing offering surface).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Radio, TreeDeciduous, Globe2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Scope = "tree" | "species" | "forest";

interface SongRow {
  id: string;
  title: string;
  content: string | null;          // typically "Artist — Album"
  thumbnail_url: string | null;
  youtube_video_id: string | null;
  tree_id: string;
  created_by: string | null;
  created_at: string;
  // joined
  tree_name: string;
  tree_species: string;
  // resolved
  artist: string;
  artwork: string | null;
  offered_by: string | null;
}

/* ── Helpers ───────────────────────────────────────────── */

function parseArtist(content: string | null): string {
  if (!content) return "Unknown artist";
  // Common format: "Artist — Album" or "Artist - Album"
  const dash = content.split(/\s+[—–-]\s+/)[0];
  return (dash || content).trim();
}

function resolveArtwork(s: { thumbnail_url: string | null; youtube_video_id: string | null }): string | null {
  if (s.thumbnail_url) {
    // Upgrade iTunes thumbs from 100x100 to 600x600 when possible
    return s.thumbnail_url.replace("100x100", "600x600");
  }
  if (s.youtube_video_id) {
    return `https://i.ytimg.com/vi/${s.youtube_video_id}/hqdefault.jpg`;
  }
  return null;
}

/** Tiny deterministic scale variation for organic feel. */
function scaleFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const n = Math.abs(h) % 100;
  return 0.94 + (n / 100) * 0.12; // 0.94 — 1.06
}

/* ── Component ──────────────────────────────────────────── */

const MusicRoom = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const treeParam = params.get("tree");

  const [scope, setScope] = useState<Scope>(treeParam ? "tree" : "forest");
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextTree, setContextTree] = useState<{ id: string; name: string; species: string } | null>(null);

  /* ── Load all song offerings + tree + profile data ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data: offData } = await supabase
        .from("offerings")
        .select("id, title, content, thumbnail_url, youtube_video_id, tree_id, created_by, created_at")
        .eq("type", "song")
        .order("created_at", { ascending: false });

      if (!offData?.length) {
        if (!cancelled) { setSongs([]); setLoading(false); }
        return;
      }

      const treeIds = Array.from(new Set(offData.map((o) => o.tree_id))).filter(Boolean);
      const userIds = Array.from(new Set(offData.map((o) => o.created_by).filter(Boolean) as string[]));

      const [{ data: trees }, { data: profiles }] = await Promise.all([
        supabase.from("trees").select("id, name, species").in("id", treeIds),
        userIds.length
          ? supabase.from("profiles").select("id, full_name").in("id", userIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const treeMap = new Map((trees || []).map((t: any) => [t.id, t]));
      const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const enriched: SongRow[] = offData.map((o: any) => {
        const t = treeMap.get(o.tree_id);
        const p = o.created_by ? profMap.get(o.created_by) : null;
        return {
          ...o,
          tree_name: t?.name ?? "an unknown tree",
          tree_species: t?.species ?? "",
          artist: parseArtist(o.content),
          artwork: resolveArtwork(o),
          offered_by: p?.full_name ?? null,
        };
      });

      if (cancelled) return;
      setSongs(enriched);

      if (treeParam) {
        const t = treeMap.get(treeParam);
        if (t) setContextTree({ id: t.id, name: t.name, species: t.species });
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [treeParam]);

  /* ── Apply scope filter ── */
  const visible = useMemo(() => {
    if (!treeParam || !contextTree) {
      // No anchor tree: forest is all that makes sense
      return songs;
    }
    if (scope === "tree") return songs.filter((s) => s.tree_id === contextTree.id);
    if (scope === "species")
      return songs.filter(
        (s) => s.tree_species && s.tree_species.toLowerCase() === contextTree.species.toLowerCase()
      );
    return songs;
  }, [scope, songs, contextTree, treeParam]);

  /* ── Forest view: prioritise context tree's offerings first ── */
  const ordered = useMemo(() => {
    if (!contextTree || scope !== "forest") return visible;
    const here: SongRow[] = [];
    const elsewhere: SongRow[] = [];
    for (const s of visible) (s.tree_id === contextTree.id ? here : elsewhere).push(s);
    return [...here, ...elsewhere];
  }, [visible, contextTree, scope]);

  const setScopeAndUrl = (next: Scope) => {
    setScope(next);
  };

  const clearTreeContext = () => {
    const next = new URLSearchParams(params);
    next.delete("tree");
    setParams(next, { replace: true });
    setContextTree(null);
    setScope("forest");
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <header className="space-y-3 text-center">
        <div className="flex items-center justify-center gap-2 text-primary/80">
          <Music className="w-4 h-4" />
          <p className="font-serif text-[11px] tracking-[0.25em] uppercase">A Living Music Room</p>
          <Music className="w-4 h-4" />
        </div>
        <p className="font-serif italic text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Songs offered to trees by wanderers. Wander the grove by tree, by kin, or across the whole forest.
        </p>
        {contextTree && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
            <span className="font-serif">Anchored at</span>
            <Link
              to={`/tree/${contextTree.id}`}
              className="font-serif text-primary/90 hover:text-primary underline-offset-4 hover:underline"
            >
              {contextTree.name}
            </Link>
            <button
              onClick={clearTreeContext}
              className="text-[10px] tracking-wider uppercase text-muted-foreground/60 hover:text-foreground/80 transition-colors"
              aria-label="Clear tree anchor"
            >
              · release
            </button>
          </div>
        )}
      </header>

      {/* ── Scope dial ── */}
      <div className="flex justify-center">
        <div
          className="inline-flex items-center gap-1 rounded-full border border-border/40 p-1"
          style={{ background: "hsl(var(--card) / 0.5)" }}
          role="tablist"
          aria-label="Scope"
        >
          {([
            { key: "tree", label: "Tree", icon: TreeDeciduous, disabled: !contextTree },
            { key: "species", label: "Species", icon: Radio, disabled: !contextTree },
            { key: "forest", label: "Forest", icon: Globe2, disabled: false },
          ] as const).map((opt) => {
            const Icon = opt.icon;
            const active = scope === opt.key;
            return (
              <button
                key={opt.key}
                role="tab"
                aria-selected={active}
                disabled={opt.disabled}
                onClick={() => !opt.disabled && setScopeAndUrl(opt.key)}
                className="relative px-4 py-1.5 rounded-full text-xs font-serif tracking-wide transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {active && (
                  <motion.span
                    layoutId="music-scope-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "hsl(var(--primary) / 0.85)" }}
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="w-3 h-3" />
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!contextTree && (
        <p className="text-center text-[11px] font-serif italic text-muted-foreground/60 -mt-4">
          Enter from a tree to filter by Tree or Species.
        </p>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl animate-pulse"
              style={{ background: "hsl(var(--muted) / 0.3)" }}
            />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Music className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="font-serif italic text-sm text-muted-foreground">
            {scope === "tree"
              ? "No songs have been offered here yet."
              : scope === "species"
              ? "No kin of this species has been sung to yet."
              : "The forest is quiet. Be the first to offer a song."}
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {ordered.map((s) => {
            const isHere = contextTree && s.tree_id === contextTree.id && scope === "forest";
            return (
              <SongCard
                key={s.id}
                song={s}
                emphasised={!!isHere}
                onOpen={() => navigate(`/tree/${s.tree_id}`)}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

/* ── Card ──────────────────────────────────────────────── */

function SongCard({
  song,
  emphasised,
  onOpen,
}: {
  song: SongRow;
  emphasised: boolean;
  onOpen: () => void;
}) {
  const scale = scaleFor(song.id);
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3 }}
      className="group relative text-left flex flex-col gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl"
      style={{ transform: `scale(${scale})` }}
    >
      {/* Artwork */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden transition-shadow duration-500"
        style={{
          background: "linear-gradient(155deg, hsl(var(--muted) / 0.4), hsl(var(--card) / 0.6))",
          boxShadow: emphasised
            ? "0 6px 28px hsl(var(--primary) / 0.18)"
            : "0 2px 14px hsl(0 0% 0% / 0.18)",
        }}
      >
        {song.artwork ? (
          <img
            src={song.artwork}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Soft glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 90%, hsl(var(--primary) / 0.18), transparent 65%)",
          }}
        />

        {/* Subtle bottom gradient for legibility on hover caption */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {emphasised && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-serif tracking-wider uppercase backdrop-blur-sm"
            style={{
              background: "hsl(var(--primary) / 0.22)",
              color: "hsl(var(--primary-foreground))",
              border: "1px solid hsl(var(--primary) / 0.35)",
            }}
          >
            Here
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="px-1 space-y-0.5">
        <p className="font-serif text-sm text-foreground/90 truncate leading-snug">{song.title}</p>
        <p className="text-xs text-muted-foreground/80 truncate font-serif italic">{song.artist}</p>
        <p className="text-[10px] text-muted-foreground/60 truncate font-serif">
          {song.offered_by ? <>offered by {song.offered_by} · </> : null}
          at {song.tree_name}
        </p>
      </div>
    </motion.button>
  );
}

export default MusicRoom;
