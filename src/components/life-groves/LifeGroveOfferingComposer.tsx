/**
 * LifeGroveOfferingComposer — find something, hang it in the tree.
 *
 * A focused, mobile-first composer. Choose what you are offering, then see
 * only the controls that offering needs. Everything else stays out of the way.
 *
 * All media capability is reused from the shared offering-kit, which is the
 * same code Ancient Friends uses.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  PhotoOfferingPicker,
  PoemOfferingInput,
  SongOfferingSearch,
  BookOfferingSearch,
  VoiceOfferingRecorder,
  type PhotoOfferingResult,
  type PoemOfferingData,
  type SelectedSongData,
  type BookOfferingData,
  type VoiceOfferingData,
} from "@/components/offering-kit";
import { OFFERING_TYPES, type OfferingType } from "@/lib/life-groves/types";
import { assignOfferingPosition } from "@/lib/life-groves/positions";
import { createOffering, listOfferings } from "@/repositories/life-groves";

type Visibility = "family_only" | "public";

interface Props {
  open: boolean;
  onClose: () => void;
  groveId: string;
  groveTitle: string;
  /** Who the grove is for — used in the gentle prompts. */
  rememberedName?: string | null;
  /** The grove's own privacy, used to preselect visibility. */
  grovePrivacy?: string | null;
  contributorUserId: string;
  onHung?: () => void;
}

const WRITING_TYPES: OfferingType[] = ["story", "letter"];

function draftKey(groveId: string, type: OfferingType) {
  return `s33d.grove-draft.${groveId}.${type}`;
}

export default function LifeGroveOfferingComposer({
  open,
  onClose,
  groveId,
  groveTitle,
  rememberedName,
  grovePrivacy,
  contributorUserId,
  onHung,
}: Props) {
  const [type, setType] = useState<OfferingType | null>(null);
  const [title, setTitle] = useState("");
  const [words, setWords] = useState("");
  const [photo, setPhoto] = useState<PhotoOfferingResult | null>(null);
  const [song, setSong] = useState<SelectedSongData | null>(null);
  const [book, setBook] = useState<BookOfferingData | null>(null);
  const [voice, setVoice] = useState<VoiceOfferingData | null>(null);
  const [poem, setPoem] = useState<PoemOfferingData>({ poemTitle: "", poet: "", text: "", sourceUrl: "" });
  const [flowerName, setFlowerName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("family_only");
  const [saving, setSaving] = useState(false);

  const meta = useMemo(() => OFFERING_TYPES.find((t) => t.value === type), [type]);
  const forWhom = rememberedName || groveTitle;

  // Preselect the grove's own privacy; never widen family material silently.
  useEffect(() => {
    setVisibility(grovePrivacy === "public" ? "public" : "family_only");
  }, [grovePrivacy, open]);

  // Restore a written draft so a dismissed keyboard never loses a memory.
  useEffect(() => {
    if (!type || !WRITING_TYPES.includes(type)) return;
    const saved = sessionStorage.getItem(draftKey(groveId, type));
    if (saved) setWords((w) => w || saved);
  }, [type, groveId]);

  useEffect(() => {
    if (!type || !WRITING_TYPES.includes(type)) return;
    if (words) sessionStorage.setItem(draftKey(groveId, type), words);
  }, [words, type, groveId]);

  const reset = useCallback(() => {
    setType(null);
    setTitle("");
    setWords("");
    setPhoto(null);
    setSong(null);
    setBook(null);
    setVoice(null);
    setPoem({ poemTitle: "", poet: "", text: "", sourceUrl: "" });
    setFlowerName("");
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  /** Is there enough here to hang? */
  const ready = (() => {
    switch (type) {
      case "photo": return !!photo;
      case "song": return !!song;
      case "book": return !!book;
      case "voice_note": return !!voice;
      case "poem": return poem.text.trim().length > 0 || poem.poemTitle.trim().length > 0;
      case "recipe": return title.trim().length > 0 || !!photo || words.trim().length > 0;
      case "bloom": return flowerName.trim().length > 0 || !!photo || words.trim().length > 0;
      case "story":
      case "letter": return words.trim().length > 0;
      default: return false;
    }
  })();

  const hang = async () => {
    if (!type || !ready) return;
    setSaving(true);
    try {
      // Attribution follows the profile, never an email address.
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", contributorUserId)
        .maybeSingle();
      const displayName = (profile as { full_name?: string } | null)?.full_name?.trim() || "A Wanderer";

      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      let metadata: Record<string, unknown> | null = null;
      let finalTitle: string | null = title.trim() || null;
      let body: string | null = words.trim() || null;

      switch (type) {
        case "photo":
          mediaUrl = photo!.url;
          mediaType = "image";
          metadata = { width: photo!.width, height: photo!.height };
          break;
        case "song":
          mediaUrl = song!.externalUrl ?? song!.youtubeUrl ?? null;
          mediaType = "song";
          finalTitle = song!.title;
          body = song!.message?.trim() || body;
          metadata = {
            artist: song!.artist,
            album: song!.album,
            artworkUrl: song!.artworkUrl,
            previewUrl: song!.previewUrl,
            externalUrl: song!.externalUrl,
            youtubeEmbedUrl: song!.youtubeEmbedUrl ?? null,
            source: song!.source,
          };
          break;
        case "book":
          mediaType = "book";
          finalTitle = book!.title;
          body = [book!.quote, book!.reflection].filter(Boolean).join("\n\n") || body;
          metadata = { author: book!.author, coverUrl: book!.coverUrl, quote: book!.quote };
          break;
        case "voice_note":
          mediaUrl = voice!.audioUrl;
          mediaType = "audio";
          body = voice!.message?.trim() || body;
          metadata = { duration: voice!.duration };
          break;
        case "poem":
          mediaType = "poem";
          finalTitle = poem.poemTitle.trim() || finalTitle;
          body = poem.text.trim() || body;
          metadata = { poet: poem.poet.trim() || null, sourceUrl: poem.sourceUrl.trim() || null };
          break;
        case "recipe":
          mediaType = photo ? "image" : null;
          mediaUrl = photo?.url ?? null;
          break;
        case "bloom":
          mediaType = photo ? "image" : null;
          mediaUrl = photo?.url ?? null;
          finalTitle = flowerName.trim() || finalTitle;
          metadata = { flower: flowerName.trim() || null };
          break;
        default:
          mediaUrl = photo?.url ?? null;
          mediaType = photo ? "image" : null;
      }

      let position;
      try {
        position = assignOfferingPosition(await listOfferings(groveId));
      } catch {
        position = assignOfferingPosition([]);
      }

      await createOffering({
        life_grove_id: groveId,
        contributor_user_id: contributorUserId,
        contributor_name: displayName,
        offering_type: type,
        title: finalTitle,
        body_text: body,
        media_url: mediaUrl,
        visibility,
        memory_position_data: position,
        ...(mediaType ? { media_type: mediaType } : {}),
        ...(metadata ? { media_metadata: metadata } : {}),
      } as never);

      if (type && WRITING_TYPES.includes(type)) sessionStorage.removeItem(draftKey(groveId, type));
      toast("Your offering is hanging in the branches.");
      onHung?.();
      close();
    } catch (err) {
      toast(err instanceof Error ? err.message : "The tree could not take that offering.");
    } finally {
      setSaving(false);
    }
  };

  const hangLabel = (() => {
    switch (type) {
      case "photo": return "Hang photo in the tree";
      case "song": return "Hang song";
      case "book": return "Hang book";
      case "poem": return "Hang poem";
      case "voice_note": return "Hang voice memory";
      case "letter": return "Hang letter";
      case "recipe": return "Hang recipe";
      case "bloom": return "Hang flower memory";
      default: return "Hang memory";
    }
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-background"
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 15%, hsl(var(--primary) / 0.07), transparent 60%)" }}
          />

          {/* Header */}
          <div className="relative px-5 pt-4 pb-2 flex items-start gap-3">
            <button
              onClick={() => (type ? reset() : close())}
              className="mt-1 p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-xl text-primary tracking-wide">
                {type ? meta?.label : "What would you like to hang in the tree?"}
              </h2>
              <p className="text-xs text-muted-foreground/60 font-serif mt-1">
                {type ? `for ${forWhom}` : `Every offering becomes part of ${forWhom}'s living story`}
              </p>
            </div>
          </div>

          <div className="relative flex-1 overflow-y-auto overscroll-contain px-5 pb-10 pt-2">
            {/* Step 1 — choose */}
            {!type && (
              <div className="grid grid-cols-2 min-[390px]:grid-cols-3 gap-2">
                {OFFERING_TYPES.filter((o) => o.value !== "video").map((o) => (
                  <motion.button
                    key={o.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setType(o.value)}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 min-h-[92px] rounded-2xl border border-border/20 hover:border-primary/30 active:bg-primary/10 transition-all"
                    style={{
                      background: "radial-gradient(ellipse at 30% 50%, hsl(var(--primary) / 0.04), transparent 70%)",
                    }}
                  >
                    <span className="text-2xl">{o.glyph}</span>
                    <span className="font-serif text-[13px] text-foreground/90 leading-tight text-center">
                      {o.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Step 2 — only what this offering needs */}
            {type && (
              <div className="space-y-5 max-w-xl mx-auto">
                {type === "photo" && (
                  <>
                    <PhotoOfferingPicker
                          visibility={visibility} pathPrefix={groveId} value={photo} onChange={setPhoto} />
                    {photo && (
                      <>
                        <Textarea
                          value={words}
                          onChange={(e) => setWords(e.target.value)}
                          placeholder="Add a few words…"
                          rows={3}
                          className="font-serif text-base resize-none"
                        />
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="font-serif text-base"
                        />
                      </>
                    )}
                  </>
                )}

                {type === "song" && (
                  song ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/40 p-3">
                        {song.artworkUrl && (
                          <img src={song.artworkUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                        )}
                        <div className="min-w-0">
                          <p className="font-serif text-base text-foreground truncate">{song.title}</p>
                          <p className="font-serif text-xs text-muted-foreground/70 truncate">{song.artist}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="font-serif text-xs" onClick={() => setSong(null)}>
                        Choose a different song
                      </Button>
                    </div>
                  ) : (
                    <SongOfferingSearch
                      treeName={groveTitle}
                      onComplete={(d) => setSong(d)}
                      onCancel={() => setType(null)}
                    />
                  )
                )}

                {type === "book" && (
                  book ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 rounded-2xl border border-border/30 bg-card/40 p-3">
                        {book.coverUrl && (
                          <img src={book.coverUrl} alt="" className="w-12 h-16 rounded object-cover" />
                        )}
                        <div className="min-w-0">
                          <p className="font-serif text-base text-foreground">{book.title}</p>
                          <p className="font-serif text-xs text-muted-foreground/70">{book.author}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="font-serif text-xs" onClick={() => setBook(null)}>
                        Choose a different book
                      </Button>
                    </div>
                  ) : (
                    <BookOfferingSearch onComplete={(d) => setBook(d)} onCancel={() => setType(null)} />
                  )
                )}

                {type === "poem" && <PoemOfferingInput value={poem} onChange={setPoem} />}

                {type === "voice_note" && (
                  voice ? (
                    <div className="space-y-4">
                      <audio controls src={voice.audioUrl} className="w-full" />
                      <Button variant="ghost" size="sm" className="font-serif text-xs" onClick={() => setVoice(null)}>
                        Record again
                      </Button>
                      <Textarea
                        value={words}
                        onChange={(e) => setWords(e.target.value)}
                        placeholder="Add a few words…"
                        rows={3}
                        className="font-serif text-base resize-none"
                      />
                    </div>
                  ) : (
                    <VoiceOfferingRecorder onComplete={(d) => setVoice(d)} onCancel={() => setType(null)} />
                  )
                )}

                {(type === "story" || type === "letter") && (
                  <>
                    <Textarea
                      value={words}
                      onChange={(e) => setWords(e.target.value)}
                      placeholder={type === "letter" ? "Write a letter…" : "Tell a memory…"}
                      rows={14}
                      autoFocus
                      className="font-serif text-base leading-relaxed resize-none"
                    />
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title (optional)"
                      className="font-serif text-base"
                    />
                    <PhotoOfferingPicker
                          visibility={visibility}
                      pathPrefix={groveId}
                      value={photo}
                      onChange={setPhoto}
                      label="Add a photograph (optional)"
                    />
                  </>
                )}

                {type === "recipe" && (
                  <>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Granny's quince butter…"
                      className="font-serif text-base"
                      autoFocus
                    />
                    <Textarea
                      value={words}
                      onChange={(e) => setWords(e.target.value)}
                      placeholder="However you remember it…"
                      rows={10}
                      className="font-serif text-base leading-relaxed resize-none"
                    />
                    <PhotoOfferingPicker
                          visibility={visibility}
                      pathPrefix={groveId}
                      value={photo}
                      onChange={setPhoto}
                      label="Add a photograph (optional)"
                    />
                  </>
                )}

                {type === "bloom" && (
                  <>
                    <Input
                      value={flowerName}
                      onChange={(e) => setFlowerName(e.target.value)}
                      placeholder="Which flower?"
                      className="font-serif text-base"
                      autoFocus
                    />
                    <Textarea
                      value={words}
                      onChange={(e) => setWords(e.target.value)}
                      placeholder="Why this flower?"
                      rows={5}
                      className="font-serif text-base resize-none"
                    />
                    <PhotoOfferingPicker
                          visibility={visibility}
                      pathPrefix={groveId}
                      value={photo}
                      onChange={setPhoto}
                      label="Add a photograph (optional)"
                    />
                  </>
                )}

                {/* Final choice — who may see this */}
                <div className="pt-2">
                  <p className="font-serif text-xs text-muted-foreground/60 mb-2">Who may see this?</p>
                  <div className="flex gap-1 p-1 rounded-xl bg-card/40 border border-border/30">
                    {(["family_only", "public"] as Visibility[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVisibility(v)}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg font-serif text-xs transition-colors",
                          visibility === v ? "bg-primary/10 text-foreground" : "text-muted-foreground/70",
                        )}
                      >
                        {v === "family_only" ? "Family only" : "Anyone who wanders past"}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="font-serif text-[11px] italic text-muted-foreground/50 text-center pt-1">
                  Hanging this places it in {forWhom}'s Heartwood Library, where the family can find it.
                </p>

                <Button
                  onClick={hang}
                  disabled={!ready || saving}
                  className="w-full h-14 font-serif text-base tracking-wide"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {hangLabel}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
