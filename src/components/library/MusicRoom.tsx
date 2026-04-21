/**
 * MusicRoom — A living room inside the HeARTwood Library.
 *
 * Composition:
 *   ┌─────────────────────────────────┐
 *   │  Tree Radio (the hearth)        │  ← focal listening centre
 *   ├─────────────────────────────────┤
 *   │  Shared scope dial · search     │  ← one tuning system
 *   ├─────────────────────────────────┤
 *   │  Music Library (records grid)   │  ← surrounding shelves
 *   └─────────────────────────────────┘
 *
 * Scope dial (Tree · Species · Forest) governs BOTH Tree Radio and the
 * Library grid — one shared tuning interface.
 *
 * Entered with `?tree=:id` to anchor scope to a specific tree, in which
 * case Tree Radio broadcasts from that tree first and the library
 * widens outward.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Radio, TreeDeciduous, Globe2, Search, X, ArrowRight, ExternalLink, Library } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import OfferingResonanceButton from "@/components/OfferingResonanceButton";
import { useCurrentUser } from "@/hooks/use-current-user";
import MusicRoomTreeRadio from "@/components/library/MusicRoomTreeRadio";

type Scope = "tree" | "species" | "forest";

interface SongRow {
  id: string;
  title: string;
  content: string | null;          // typically "Artist — Album"
  thumbnail_url: string | null;
  youtube_video_id: string | null;
  youtube_embed_url: string | null;
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
  const dash = content.split(/\s+[—–-]\s+/)[0];
  return (dash || content).trim();
}

function resolveArtwork(s: { thumbnail_url: string | null; youtube_video_id: string | null }): string | null {
  if (s.thumbnail_url) return s.thumbnail_url.replace("100x100", "600x600");
  if (s.youtube_video_id) return `https://i.ytimg.com/vi/${s.youtube_video_id}/hqdefault.jpg`;
  return null;
}

/** Tiny deterministic hash for organic per-card variation. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function scaleFor(id: string): number {
  return 0.94 + ((hashId(id) % 100) / 100) * 0.12; // 0.94 — 1.06
}

/* ── Botanical placeholder ─────────────────────────────── */

/**
 * BotanicalRecord — a record-like placeholder for songs without artwork.
 * Uses deterministic colour/leaf variation so each song has its own face.
 */
function BotanicalRecord({ song }: { song: SongRow }) {
  const h = hashId(song.id);
  // Warm, earthy palette anchored by the project's primary
  const palettes = [
    { a: 28, b: 38 },   // amber
    { a: 142, b: 110 }, // moss
    { a: 200, b: 220 }, // dusk
    { a: 14, b: 28 },   // ember
    { a: 280, b: 260 }, // wild plum
    { a: 165, b: 145 }, // pine
  ];
  const p = palettes[h % palettes.length];
  const leafCount = 3 + (h % 3); // 3-5 leaves
  const initial = (song.artist?.[0] || song.title?.[0] || "♪").toUpperCase();
  const ringRotate = (h % 360);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(circle at 30% 25%, hsl(${p.a} 30% 22% / 0.95), hsl(${p.b} 25% 10%) 75%)`,
      }}
      aria-hidden
    >
      {/* Vinyl rings */}
      <div
        className="absolute inset-[14%] rounded-full"
        style={{
          background: `repeating-radial-gradient(circle at center,
            hsl(${p.a} 25% 14%) 0px,
            hsl(${p.a} 30% 18%) 1px,
            hsl(${p.a} 22% 12%) 4px,
            hsl(${p.a} 28% 16%) 5px)`,
          boxShadow: `inset 0 0 24px hsl(${p.b} 30% 4% / 0.6), 0 0 1px hsl(${p.a} 30% 30% / 0.4)`,
          transform: `rotate(${ringRotate}deg)`,
        }}
      />
      {/* Centre label */}
      <div
        className="absolute inset-[36%] rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, hsl(${p.a} 40% 30%), hsl(${p.b} 35% 18%))`,
          boxShadow: `inset 0 0 8px hsl(${p.b} 40% 8% / 0.6), 0 0 0 2px hsl(${p.a} 30% 14%)`,
        }}
      >
        <span
          className="font-serif text-lg select-none"
          style={{ color: `hsl(${p.a} 40% 80% / 0.85)` }}
        >
          {initial}
        </span>
      </div>
      {/* Centre hole */}
      <div
        className="absolute inset-[47.5%] rounded-full"
        style={{ background: `hsl(${p.b} 30% 6%)`, boxShadow: `inset 0 0 4px hsl(${p.b} 30% 2%)` }}
      />
      {/* Botanical leaves drifting around the disc */}
      {Array.from({ length: leafCount }).map((_, i) => {
        const angle = (360 / leafCount) * i + (h % 60);
        const dist = 38 + ((h >> i) % 8); // % from center
        const leafRot = angle + 90;
        return (
          <span
            key={i}
            className="absolute text-base select-none"
            style={{
              left: `${50 + Math.cos((angle * Math.PI) / 180) * dist}%`,
              top: `${50 + Math.sin((angle * Math.PI) / 180) * dist}%`,
              transform: `translate(-50%, -50%) rotate(${leafRot}deg)`,
              color: `hsl(${p.a + 20} 35% 55% / 0.45)`,
              filter: "blur(0.2px)",
            }}
          >
            🍃
          </span>
        );
      })}
      {/* Soft top sheen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(160deg, hsl(0 0% 100% / 0.06), transparent 45%, transparent 80%, hsl(0 0% 0% / 0.18))",
        }}
      />
    </div>
  );
}

/* ── Component ──────────────────────────────────────────── */

const MusicRoom = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const treeParam = params.get("tree");
  const { userId } = useCurrentUser();

  const [scope, setScope] = useState<Scope>(treeParam ? "tree" : "forest");
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextTree, setContextTree] = useState<{ id: string; name: string; species: string } | null>(null);
  const [search, setSearch] = useState("");
  const [activeSong, setActiveSong] = useState<SongRow | null>(null);

  /* ── Load all song offerings + tree + profile data ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data: offData } = await supabase
        .from("offerings")
        .select("id, title, content, thumbnail_url, youtube_video_id, youtube_embed_url, tree_id, created_by, created_at")
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
  const scoped = useMemo(() => {
    if (!treeParam || !contextTree) return songs;
    if (scope === "tree") return songs.filter((s) => s.tree_id === contextTree.id);
    if (scope === "species")
      return songs.filter(
        (s) => s.tree_species && s.tree_species.toLowerCase() === contextTree.species.toLowerCase()
      );
    return songs;
  }, [scope, songs, contextTree, treeParam]);

  /* ── Apply search ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((s) =>
      [s.title, s.artist, s.tree_name, s.offered_by]
        .filter(Boolean)
        .some((field) => (field as string).toLowerCase().includes(q))
    );
  }, [scoped, search]);

  /* ── Forest view: prioritise context tree's offerings first ── */
  const ordered = useMemo(() => {
    if (!contextTree || scope !== "forest") return filtered;
    const here: SongRow[] = [];
    const elsewhere: SongRow[] = [];
    for (const s of filtered) (s.tree_id === contextTree.id ? here : elsewhere).push(s);
    return [...here, ...elsewhere];
  }, [filtered, contextTree, scope]);

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
      <header className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2 text-primary/80">
          <Music className="w-4 h-4" />
          <p className="font-serif text-[11px] tracking-[0.25em] uppercase">A Living Music Room</p>
          <Music className="w-4 h-4" />
        </div>
        <p className="font-serif italic text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Tune into a tree, then wander the wider forest of songs offered by other hands.
        </p>
        {contextTree && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80 pt-1">
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

      {/* ── Tree Radio — the hearth ── */}
      <MusicRoomTreeRadio
        scopedSongs={ordered}
        anchorTree={contextTree}
        scopeLabel={scope}
        onOpenSong={(s) => setActiveSong(s)}
      />

      {/* ── Shared tuning interface (Tree Radio + Library both respond) ── */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <div
            className="inline-flex items-center gap-1 rounded-full border border-border/40 p-1"
            style={{ background: "hsl(var(--card) / 0.5)" }}
            role="tablist"
            aria-label="Tune by Tree, Species, or Forest"
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
                  onClick={() => !opt.disabled && setScope(opt.key)}
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
          <p className="text-center text-[11px] font-serif italic text-muted-foreground/60">
            Enter from a tree to filter by Tree or Species.
          </p>
        )}

        {/* Search */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-sm flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the library…"
              className="w-full pl-9 pr-9 py-2 rounded-full text-xs font-serif placeholder:italic placeholder:text-muted-foreground/50 outline-none border border-border/40 focus:border-primary/40 transition-colors"
              style={{ background: "hsl(var(--card) / 0.5)", color: "hsl(var(--foreground))" }}
              aria-label="Search the music library"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 p-0.5 rounded-full text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Music Library — the surrounding shelves ── */}
      <section className="space-y-4 pt-2">
        <div className="flex items-end justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <Library className="w-3.5 h-3.5 text-muted-foreground/70" />
            <h3 className="font-serif text-[11px] tracking-[0.22em] uppercase text-muted-foreground/80">
              Records in the grove
            </h3>
          </div>
          {!loading && (
            <p className="text-[10px] font-serif italic text-muted-foreground/50">
              {ordered.length} {ordered.length === 1 ? "record" : "records"}
              {search && " found"}
            </p>
          )}
        </div>

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
          <div className="text-center py-12 space-y-3">
            <Music className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="font-serif italic text-sm text-muted-foreground">
              {search
                ? "No record matches your search."
                : scope === "tree"
                ? "No songs have been offered here yet — be the first to leave one."
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
              const isHere = !!(contextTree && s.tree_id === contextTree.id && scope === "forest");
              return (
                <SongCard
                  key={s.id}
                  song={s}
                  emphasised={isHere}
                  onOpen={() => setActiveSong(s)}
                />
              );
            })}
          </motion.div>
        )}
      </section>


      {/* ── Detail panel ── */}
      <SongDetail
        song={activeSong}
        userId={userId}
        onClose={() => setActiveSong(null)}
        onGoToTree={(id) => {
          setActiveSong(null);
          navigate(`/tree/${id}`);
        }}
      />
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
          <BotanicalRecord song={song} />
        )}

        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 90%, hsl(var(--primary) / 0.18), transparent 65%)",
          }}
        />

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

/* ── Detail panel ──────────────────────────────────────── */

function SongDetail({
  song,
  userId,
  onClose,
  onGoToTree,
}: {
  song: SongRow | null;
  userId: string | null;
  onClose: () => void;
  onGoToTree: (treeId: string) => void;
}) {
  const open = !!song;
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={null}
      contentClassName="max-w-md p-0 overflow-hidden border-border/40"
    >
      {song && (
        <div className="flex flex-col">
          {/* Artwork */}
          <div
            className="relative w-full aspect-square"
            style={{
              background: "linear-gradient(155deg, hsl(var(--muted) / 0.4), hsl(var(--card) / 0.6))",
            }}
          >
            {song.artwork ? (
              <img src={song.artwork} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <BotanicalRecord song={song} />
            )}
            {/* fade into the card body */}
            <div
              className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, transparent, hsl(var(--background) / 0.95))",
              }}
            />
          </div>

          {/* Body */}
          <div className="px-6 pb-6 -mt-6 relative space-y-4">
            <div className="space-y-1">
              <p className="font-serif text-[10px] tracking-[0.2em] uppercase text-primary/80">A song offered</p>
              <h2 className="font-serif text-lg leading-tight text-foreground">{song.title}</h2>
              <p className="text-sm text-muted-foreground italic font-serif">{song.artist}</p>
            </div>

            <div className="space-y-2 text-xs font-serif text-muted-foreground/90 border-t border-border/30 pt-4">
              {song.offered_by && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground/60">Offered by</span>
                  <span className="text-foreground/85 truncate">{song.offered_by}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground/60">At</span>
                <span className="text-foreground/85 truncate">{song.tree_name}</span>
              </div>
              {song.tree_species && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground/60">Species</span>
                  <span className="text-foreground/70 italic truncate">{song.tree_species}</span>
                </div>
              )}
            </div>

            {/* Witness — resonance gesture */}
            <div
              className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-primary/20"
              style={{ background: "hsl(var(--primary) / 0.04)" }}
            >
              <p className="text-[10px] font-serif tracking-[0.18em] uppercase text-primary/70">
                Did this move you?
              </p>
              <div className="scale-150">
                <OfferingResonanceButton
                  offeringId={song.id}
                  userId={userId}
                  initialCount={0}
                />
              </div>
              <p className="text-[10px] font-serif italic text-muted-foreground/60">
                {userId ? "Tap the heart to witness" : "Sign in to witness"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => onGoToTree(song.tree_id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-serif tracking-wide transition-colors"
                style={{
                  background: "hsl(var(--primary) / 0.9)",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                Go to tree <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {song.youtube_video_id && (
                <a
                  href={`https://www.youtube.com/watch?v=${song.youtube_video_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-2 text-[11px] font-serif tracking-wide text-muted-foreground hover:text-foreground border border-border/40 transition-colors"
                >
                  Listen on YouTube <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </ResponsiveDialog>
  );
}

export default MusicRoom;
