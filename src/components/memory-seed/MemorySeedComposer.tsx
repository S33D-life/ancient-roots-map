/**
 * MemorySeedComposer — first prototype of the unified Whispered Offerings
 * composer. Lets a wanderer leave a story / song / book / poem / quote /
 * recipe / photo as either:
 *
 *   • offering — hung in the branches of this tree (visible from afar)
 *   • whisper  — carried through the Ancient Friends roots, picked up
 *                only when kin meet a qualifying tree
 *
 * Writes to existing tables — no new schema:
 *   • offerings (offering mode)
 *   • tree_whispers (whisper mode, via sendWhisper helper)
 *
 * ── Data mapping notes (no schema change yet) ───────────────────────────
 *   • quote / recipe / bloom  → folded into offerings.type = "story"
 *     (quote also writes quote_text + quote_author when applicable).
 *   • voice_note              → offerings.type = "voice"
 *   • photo                   → offerings.type = "photo", media_url only
 *                               (no upload pipeline yet — paste a URL).
 *   • whispers                → recipientScope hard-coded "PUBLIC" for now.
 *   • same_species delivery   → uses treeSpeciesKey when present, else
 *                               falls back to the raw treeSpecies string.
 *
 * Scope deliberately narrow: no AI, no payments, no upload, no encryption.
 */
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { sendWhisper } from "@/hooks/use-whispers";
import { useTreeResonance } from "@/hooks/use-tree-resonance";

// ── Types ────────────────────────────────────────────────────

export type SeedType =
  | "story"
  | "song"
  | "book"
  | "poem"
  | "quote"
  | "recipe"
  | "photo"
  | "artwork"
  | "voice_note"
  | "bloom";

/**
 * Destination for a memory seed:
 *   • offering — hung in the branches at this tree (public, visible from afar)
 *   • whisper  — sent through the roots, unlocked when kin meet a qualifying tree
 *   • both     — hung AND sent (creates one of each, linked by metadata when safe)
 */
export type Destination = "offering" | "whisper" | "both";
export type WhisperUnlock = "any_ancient_friend" | "same_tree" | "same_species";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  treeSpecies?: string | null;
  /** Optional canonical species_key for SPECIES_MATCH whispers. */
  treeSpeciesKey?: string | null;
  treeName?: string | null;
  /** Optional coordinates — when present, enable proximity-aware guidance. */
  treeLat?: number | null;
  treeLng?: number | null;
}

interface SeedTypeMeta {
  value: SeedType;
  label: string;
  hint: string;
  /** Whether to surface a media_url field. */
  showMediaUrl?: boolean;
  /** Whether to surface an author/artist field. */
  authorLabel?: string;
  /** When true, the type is a placeholder and we save it as `story`. */
  placeholder?: boolean;
}

const TYPES: SeedTypeMeta[] = [
  { value: "story",  label: "Story",   hint: "A short memory, encounter, or reflection." },
  { value: "song",   label: "Song",    hint: "Paste a Spotify, YouTube, or Apple Music link.", showMediaUrl: true, authorLabel: "Artist" },
  { value: "book",   label: "Book",    hint: "Title and author. A note if you wish.", authorLabel: "Author" },
  { value: "poem",   label: "Poem",    hint: "A few lines for the canopy." },
  { value: "quote",  label: "Quote",   hint: "A line worth remembering.", authorLabel: "Attributed to" },
  { value: "recipe", label: "Recipe",  hint: "A small recipe tied to this place or season." },
  { value: "photo",  label: "Photo",   hint: "Paste a photo URL for now (upload coming).", showMediaUrl: true },
  { value: "artwork", label: "Painting / artwork", hint: "Title, artist, and a link to the image if you have one.", showMediaUrl: true, authorLabel: "Artist" },
  { value: "voice_note", label: "Voice note", hint: "Voice notes coming soon.", placeholder: true },
  { value: "bloom",  label: "Bloom",   hint: "Bloom offerings coming soon.", placeholder: true },
];

const WHISPER_UNLOCKS: { value: WhisperUnlock; label: string; hint: string }[] = [
  { value: "any_ancient_friend", label: "Any Ancient Friend", hint: "Carried to the next kin who meets any tree." },
  { value: "same_tree",          label: "This same tree",     hint: "Only opens when kin return to this tree." },
  { value: "same_species",       label: "Any tree of this species", hint: "Opens at any tree sharing this species." },
];

// ── Validation ───────────────────────────────────────────────

const Schema = z.object({
  type: z.enum([
    "story", "song", "book", "poem", "quote", "recipe", "photo", "voice_note", "bloom",
  ]),
  title: z.string().trim().max(120, "Keep the title under 120 characters."),
  body: z.string().trim().max(2000, "Keep the body under 2000 characters."),
  mediaUrl: z.string().trim().max(500).url("That doesn't look like a valid URL.").or(z.literal("")),
  author: z.string().trim().max(120).or(z.literal("")),
  note: z.string().trim().max(500).or(z.literal("")),
});

/** Map a SeedType to a value accepted by the offerings.type enum. */
function toOfferingType(t: SeedType): "story" | "song" | "book" | "poem" | "photo" | "voice" {
  if (t === "song")  return "song";
  if (t === "book")  return "book";
  if (t === "poem")  return "poem";
  if (t === "photo") return "photo";
  if (t === "voice_note") return "voice";
  // story / quote / recipe / bloom → stored as story for now (TODO: enum extension)
  return "story";
}

// ── Component ────────────────────────────────────────────────

export default function MemorySeedComposer({
  open,
  onOpenChange,
  treeId,
  treeSpecies,
  treeSpeciesKey,
  treeName,
  treeLat,
  treeLng,
}: Props) {
  const { userId, isLoading: userLoading } = useCurrentUser();
  const [destination, setDestination] = useState<Destination>("offering");
  const [destinationTouched, setDestinationTouched] = useState(false);
  const [type, setType] = useState<SeedType>("story");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [unlock, setUnlock] = useState<WhisperUnlock>("any_ancient_friend");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Destination | null>(null);

  const meta = TYPES.find((t) => t.value === type)!;

  const resonance = useTreeResonance({
    treeId,
    treeLat,
    treeLng,
    treeSpecies,
    userId,
    enabled: open,
  });

  // Soft default: when far from the tree, lean toward whisper.
  // Only applied until the wanderer touches the tabs themselves.
  useEffect(() => {
    if (!open || destinationTouched) return;
    if (resonance.distanceMeters == null) return;
    setDestination(resonance.nearOfferingRange ? "offering" : "whisper");
  }, [open, destinationTouched, resonance.distanceMeters, resonance.nearOfferingRange]);

  // Reset state on close.
  useEffect(() => {
    if (!open) {
      setTitle(""); setBody(""); setMediaUrl(""); setAuthor(""); setNote("");
      setType("story"); setDestination("offering"); setUnlock("any_ancient_friend");
      setSubmitting(false); setConfirmed(null); setDestinationTouched(false);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    if (meta.placeholder) return false;
    if (!userId) return false;
    // At least one of title / body / mediaUrl must be filled.
    if (!title.trim() && !body.trim() && !mediaUrl.trim()) return false;
    return true;
  }, [meta.placeholder, userId, title, body, mediaUrl]);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Please sign in to leave an offering or whisper.");
      return;
    }
    const parsed = Schema.safeParse({ type, title, body, mediaUrl, author, note });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSubmitting(true);
    try {
      if (destination === "offering") {
        await saveAsOffering();
      } else {
        await saveAsWhisper();
      }
      setConfirmed(destination);
      window.dispatchEvent(new CustomEvent(
        destination === "offering" ? "offering-created" : "whisper-sent",
      ));
    } catch (err) {
      console.error("MemorySeedComposer error:", err);
      toast.error(
        destination === "offering"
          ? "The offering could not settle in the branches. Try again."
          : "The whisper could not enter the roots. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  async function saveAsOffering() {
    const offType = toOfferingType(type);
    const composedTitle =
      title.trim() ||
      (type === "song" && author ? `${author}` : "") ||
      (type === "book" && author ? `${title || "Untitled"} — ${author}` : "") ||
      `${meta.label}`;
    const composedContent = [
      body.trim(),
      author.trim() ? `— ${author.trim()}` : "",
      note.trim() ? `Note: ${note.trim()}` : "",
      type === "recipe" ? "(Recipe offering)" : "",
      type === "quote"  ? "(Quote offering)"  : "",
    ].filter(Boolean).join("\n\n");

    const insertBody: Record<string, unknown> = {
      tree_id: treeId,
      type: offType,
      title: composedTitle.slice(0, 120),
      content: composedContent || null,
      media_url: mediaUrl.trim() || null,
      created_by: userId,
      visibility: "public",
      tree_role: "offering",
      impact_weight: 1.0,
    };
    if (type === "quote") {
      insertBody.quote_text = body.trim() || null;
      insertBody.quote_author = author.trim() || null;
    }

    const { error } = await supabase.from("offerings").insert(insertBody as never);
    if (error) throw error;
  }

  async function saveAsWhisper() {
    const message = [
      title.trim() ? `**${title.trim()}**` : "",
      body.trim(),
      author.trim() ? `— ${author.trim()}` : "",
      note.trim() ? `(${note.trim()})` : "",
      mediaUrl.trim() ? mediaUrl.trim() : "",
    ].filter(Boolean).join("\n\n");

    if (!message) throw new Error("Whisper has no content");

    const deliveryScope =
      unlock === "same_tree" ? "SPECIFIC_TREE"
      : unlock === "same_species" ? "SPECIES_MATCH"
      : "ANY_TREE";

    const { error } = await sendWhisper({
      senderUserId: userId!,
      recipientScope: "PUBLIC",
      treeAnchorId: treeId,
      messageContent: message.slice(0, 2000),
      mediaUrl: mediaUrl.trim() || undefined,
      deliveryScope,
      deliveryTreeId: deliveryScope === "SPECIFIC_TREE" ? treeId : undefined,
      deliverySpeciesKey:
        deliveryScope === "SPECIES_MATCH"
          ? (treeSpeciesKey || treeSpecies || undefined)
          : undefined,
      isActive: true,
    });
    if (error) throw error;
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Share an Offering or Whisper
          </DialogTitle>
          <DialogDescription className="font-serif italic text-xs">
            Offerings hang in the branches. Whispers travel through the roots.
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <ConfirmationView
            destination={confirmed}
            onClose={() => onOpenChange(false)}
          />
        ) : !userId && !userLoading ? (
          <div className="py-6 text-center">
            <p className="font-serif text-sm text-muted-foreground/80 mb-4">
              Sign in to leave a memory seed for this tree.
            </p>
            <Button asChild variant="outline">
              <a href="/auth">Sign in</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <ResonancePanel resonance={resonance} treeName={treeName} />

            <Tabs
              value={destination}
              onValueChange={(v) => { setDestinationTouched(true); setDestination(v as Destination); }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="offering" className="flex-1 font-serif text-xs">
                  Leave Offering
                </TabsTrigger>
                <TabsTrigger value="whisper" className="flex-1 font-serif text-xs">
                  Send Whisper
                </TabsTrigger>
              </TabsList>
              <TabsContent value="offering" className="mt-3">
                <p className="font-serif text-xs italic text-muted-foreground/80">
                  Offerings can be seen from afar once placed
                  {treeName ? ` in “${treeName}”'s branches.` : " in this tree's branches."}
                </p>
              </TabsContent>
              <TabsContent value="whisper" className="mt-3 space-y-3">
                <p className="font-serif text-xs italic text-muted-foreground/80">
                  Whispers wait until someone checks in beneath the right tree.
                </p>
                <div className="space-y-1.5">
                  <Label className="font-serif text-xs">Who can find this whisper?</Label>
                  <Select value={unlock} onValueChange={(v) => setUnlock(v as WhisperUnlock)}>
                    <SelectTrigger className="text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WHISPER_UNLOCKS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          <div>
                            <div>{u.label}</div>
                            <div className="text-[11px] italic text-muted-foreground/70">{u.hint}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-1.5">
              <Label className="font-serif text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as SeedType)}>
                <SelectTrigger className="text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} disabled={t.placeholder}>
                      {t.label}{t.placeholder ? " · coming soon" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="font-serif text-[11px] italic text-muted-foreground/70">{meta.hint}</p>
            </div>

            {meta.placeholder ? (
              <p className="font-serif text-xs italic text-muted-foreground/80">
                This seed type is being prepared. Choose Story, Song, Book, Poem, Quote,
                Recipe, or Photo for now.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="font-serif text-xs" htmlFor="seed-title">Title</Label>
                  <Input
                    id="seed-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    placeholder={type === "song" ? "Song title" : "A short title"}
                    className="text-base"
                  />
                </div>

                {meta.authorLabel && (
                  <div className="space-y-1.5">
                    <Label className="font-serif text-xs" htmlFor="seed-author">{meta.authorLabel}</Label>
                    <Input
                      id="seed-author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      maxLength={120}
                      className="text-base"
                    />
                  </div>
                )}

                {meta.showMediaUrl && (
                  <div className="space-y-1.5">
                    <Label className="font-serif text-xs" htmlFor="seed-media">
                      {type === "song" ? "Song link" : "Media URL"}
                    </Label>
                    <Input
                      id="seed-media"
                      type="url"
                      inputMode="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      maxLength={500}
                      placeholder="https://…"
                      className="text-base"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="font-serif text-xs" htmlFor="seed-body">
                    {type === "quote" ? "Quote" : type === "recipe" ? "Recipe" : "Body"}
                  </Label>
                  <Textarea
                    id="seed-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder={
                      type === "poem" ? "A few lines…" :
                      type === "quote" ? "A line worth remembering." :
                      type === "recipe" ? "Ingredients and gentle steps." :
                      "Share what you wish to leave."
                    }
                    className="text-base resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground/60">{body.length}/2000</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-serif text-xs" htmlFor="seed-note">Note (optional)</Label>
                  <Input
                    id="seed-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    placeholder="Anything else?"
                    className="text-base"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {destination === "offering" ? "Hang in the branches" : "Send through the roots"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Confirmation ─────────────────────────────────────────────

function ConfirmationView({
  destination,
  onClose,
}: { destination: Destination; onClose: () => void }) {
  const isWhisper = destination === "whisper";
  return (
    <div className="py-6 text-center space-y-4">
      <div className="mx-auto w-24 h-24 grid place-items-center" aria-hidden>
        {isWhisper ? <RootsTrail /> : <BranchGlyph />}
      </div>
      <p className="font-serif text-base text-foreground">
        {isWhisper
          ? "Your whisper has entered the roots."
          : "Your offering has been hung in the branches."}
      </p>
      <p className="font-serif text-xs italic text-muted-foreground/80">
        {isWhisper
          ? "It will wait quietly until kin meet the right tree."
          : "Others may now find it on this tree."}
      </p>
      <Button onClick={onClose} variant="outline" size="sm">Close</Button>
    </div>
  );
}

function RootsTrail() {
  return (
    <svg viewBox="0 0 64 64" width="80" height="80" className="text-primary/70">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M32 6 L32 28">
          <animate attributeName="stroke-dasharray" from="0,30" to="30,0" dur="1.6s" fill="freeze" />
        </path>
        <path d="M32 28 C 22 36, 16 46, 12 58">
          <animate attributeName="stroke-dasharray" from="0,60" to="60,0" dur="2s" begin="0.3s" fill="freeze" />
        </path>
        <path d="M32 28 C 42 36, 48 46, 52 58">
          <animate attributeName="stroke-dasharray" from="0,60" to="60,0" dur="2s" begin="0.3s" fill="freeze" />
        </path>
        <path d="M32 28 C 30 40, 30 50, 32 60">
          <animate attributeName="stroke-dasharray" from="0,40" to="40,0" dur="1.8s" begin="0.5s" fill="freeze" />
        </path>
        <circle cx="12" cy="58" r="1.6" fill="currentColor" />
        <circle cx="52" cy="58" r="1.6" fill="currentColor" />
        <circle cx="32" cy="60" r="1.6" fill="currentColor" />
      </g>
    </svg>
  );
}

function BranchGlyph() {
  return (
    <svg viewBox="0 0 64 64" width="80" height="80" className="text-primary/70">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M32 58 L32 18" />
        <path d="M32 30 C 22 26, 16 18, 14 10" />
        <path d="M32 30 C 42 26, 48 18, 50 10" />
        <circle cx="14" cy="10" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="50" cy="10" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="32" cy="18" r="3" fill="currentColor" opacity="0.7" />
      </g>
    </svg>
  );
}

// ── Resonance hints (presence-aware, never blocking) ─────────

function ResonancePanel({
  resonance,
  treeName,
}: {
  resonance: ReturnType<typeof useTreeResonance>;
  treeName?: string | null;
}) {
  const lines: string[] = [];

  // Proximity guidance
  if (resonance.distanceMeters != null) {
    if (resonance.nearOfferingRange) {
      lines.push("This memory may wish to remain in the branches.");
    } else {
      const km = resonance.distanceMeters >= 1000
        ? `${(resonance.distanceMeters / 1000).toFixed(1)}km`
        : `${Math.round(resonance.distanceMeters)}m`;
      lines.push(`You are about ${km} away — this memory may travel more gently through the roots.`);
    }
  }

  // Returning visitor
  if (resonance.visitedBefore) {
    lines.push(
      treeName
        ? `You have walked with ${treeName} before.`
        : "You have walked with this tree before.",
    );
  }

  // Borrowed staff resonance
  if (resonance.staffResonance) {
    lines.push(`Your borrowed staff stirs quietly here — it resonates with ${resonance.staffResonance} paths.`);
  }

  // Life Grove link
  if (resonance.lifeGroveLink) {
    lines.push("This tree also carries a living family canopy.");
  }

  if (lines.length === 0) return null;

  return (
    <div
      className="rounded-lg px-3 py-2.5 space-y-1"
      style={{
        background: "hsl(var(--primary) / 0.05)",
        border: "1px solid hsl(var(--primary) / 0.15)",
      }}
    >
      {lines.map((l, i) => (
        <p key={i} className="font-serif italic text-[12px] leading-relaxed text-foreground/70">
          {l}
        </p>
      ))}
    </div>
  );
}
