import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, CheckCircle2, ExternalLink, Flower2, Leaf, MapPin, ShieldCheck, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useZoomPan } from "@/hooks/use-zoom-pan";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getSeedLifeImageUrl,
  useAddSeedLifeNote,
  useAddSeedLifeValidation,
  useSeedLifeEntry,
  useSeedLifeGuardians,
  useSeedLifeNotes,
  useSeedLifeValidationSummary,
} from "@/hooks/use-seed-life-gallery";

const VALIDATION_LABELS: Record<string, string> = {
  unverified: "Unverified",
  community_validated: "Community validated",
  curator_validated: "Curator validated",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 p-4 md:p-5 backdrop-blur-sm space-y-3">
      <h3 className="font-serif text-lg text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export default function SeedLifeDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { data: seed, isLoading } = useSeedLifeEntry(slug);
  const { data: guardians = [] } = useSeedLifeGuardians(seed?.id);
  const { data: notes = [] } = useSeedLifeNotes(seed?.id);
  const { userId } = useCurrentUser();
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteStage, setNoteStage] = useState<string>("none");
  const [noteContent, setNoteContent] = useState("");

  const noteMutation = useAddSeedLifeNote();
  const validationMutation = useAddSeedLifeValidation();
  const imageZoom = useZoomPan({ minScale: 1, maxScale: 6 });

  const validationTargets = useMemo(
    () => (seed ? [seed.id, ...notes.map((note) => note.id)] : []),
    [seed, notes],
  );
  const { data: validationSummary = {} } = useSeedLifeValidationSummary(validationTargets);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to gallery
        </Button>
        <div className="h-[28rem] rounded-3xl bg-muted/30 animate-pulse" />
      </div>
    );
  }

  if (!seed) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to gallery
        </Button>
        <div className="rounded-2xl border border-border/60 bg-card/40 p-8 text-center text-muted-foreground">
          This seed could not be found.
        </div>
      </div>
    );
  }

  const imageUrl = getSeedLifeImageUrl(seed.image_path || seed.image_thumb_path);
  const seedValidation = validationSummary[seed.id] ?? {
    count: seed.validation_count,
    validatedByCurrentUser: false,
  };

  const handleNoteSubmit = () => {
    if (!seed || !noteContent.trim()) return;
    noteMutation.mutate(
      {
        seed_id: seed.id,
        title: noteTitle,
        content: noteContent,
        cultivation_stage: noteStage === "none" ? undefined : noteStage,
      },
      {
        onSuccess: () => {
          setShowNoteForm(false);
          setNoteTitle("");
          setNoteStage("none");
          setNoteContent("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to gallery
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] items-start">
        <div className="rounded-[1.75rem] border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div
            {...imageZoom.containerProps}
            className="relative h-[22rem] md:h-[32rem] overflow-hidden bg-gradient-to-br from-background via-muted/30 to-secondary/30 cursor-grab active:cursor-grabbing"
          >
            {imageUrl ? (
              <div className="absolute left-0 top-0 h-full w-full" style={imageZoom.transformStyle}>
                <div className="flex h-full w-full items-center justify-center p-8 md:p-12">
                  <img
                    src={imageUrl}
                    alt={seed.image_alt || seed.common_name}
                    className="max-h-full max-w-full object-contain select-none pointer-events-none"
                    loading="lazy"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground font-serif text-sm">
                Seed image coming soon
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
            <span>Pinch, scroll, or drag to study the seed closely.</span>
            <Button variant="ghost" size="sm" onClick={imageZoom.reset} disabled={!imageZoom.isZoomed}>
              Reset view
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-border/60 bg-card/50 p-5 md:p-6 backdrop-blur-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground">{seed.use_category}</Badge>
                  <Badge variant="outline" className="border-border/70">{seed.species_group}</Badge>
                  <Badge className="bg-primary/15 text-primary border-transparent">
                    {seedValidation.count} validations
                  </Badge>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif text-foreground">{seed.common_name}</h2>
                  {seed.latin_name && (
                    <p className="text-sm italic text-muted-foreground mt-1">{seed.latin_name}</p>
                  )}
                </div>
              </div>
              <Badge className="bg-muted text-muted-foreground border-transparent">
                {seed.verification_status === "curator_validated" && <ShieldCheck className="w-3 h-3 mr-1" />}
                {VALIDATION_LABELS[seed.verification_status] || seed.verification_status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              {seed.origin_label && <p><span className="text-foreground/80">Origin:</span> {seed.origin_label}</p>}
              {seed.region_label && (
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {seed.region_label}</p>
              )}
              {seed.description && <p className="leading-relaxed text-foreground/75">{seed.description}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => validationMutation.mutate({ targetType: "seed", targetId: seed.id, seedId: seed.id })}
                disabled={!userId || validationMutation.isPending || seedValidation.validatedByCurrentUser}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {seedValidation.validatedByCurrentUser ? "Validated" : "Validate seed"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowNoteForm((open) => !open)}>
                <Sprout className="w-4 h-4 mr-1" /> Add growing note
              </Button>
              {seed.archive_link && (
                <a href={seed.archive_link} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4 mr-1" /> Archive source
                  </Button>
                </a>
              )}
            </div>

            {!userId && (
              <p className="text-xs text-muted-foreground">Sign in to validate this seed or add growing notes.</p>
            )}
          </div>

          {showNoteForm && (
            <div className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3 animate-fade-in">
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <Input
                  placeholder="Note title (optional)"
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.target.value)}
                />
                <Select value={noteStage} onValueChange={setNoteStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cultivation stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any stage</SelectItem>
                    <SelectItem value="sowing">Sowing</SelectItem>
                    <SelectItem value="sprouting">Sprouting</SelectItem>
                    <SelectItem value="flowering">Flowering</SelectItem>
                    <SelectItem value="fruiting">Fruiting</SelectItem>
                    <SelectItem value="saving">Saving seed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="What have you learned while growing or storing this seed?"
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                className="min-h-[110px]"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleNoteSubmit} disabled={!userId || noteMutation.isPending || !noteContent.trim()}>
                  {noteMutation.isPending ? "Saving…" : "Share note"}
                </Button>
                <Button variant="ghost" onClick={() => setShowNoteForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Identity">
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <p className="text-foreground/70">Common name</p>
              <p className="font-serif text-foreground">{seed.common_name}</p>
            </div>
            <div>
              <p className="text-foreground/70">Latin name</p>
              <p className="font-serif text-foreground">{seed.latin_name || "Still unfolding"}</p>
            </div>
            <div>
              <p className="text-foreground/70">Origin</p>
              <p className="font-serif text-foreground">{seed.origin_label || "Shared by the community"}</p>
            </div>
            <div>
              <p className="text-foreground/70">Region</p>
              <p className="font-serif text-foreground">{seed.region_label || "Not yet mapped"}</p>
            </div>
          </div>
        </Section>

        <Section title="Seed characteristics">
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div>
              <p className="text-foreground/70">Size</p>
              <p className="text-foreground">{seed.seed_size || "Not yet recorded"}</p>
            </div>
            <div>
              <p className="text-foreground/70">Germination</p>
              <p className="text-foreground leading-relaxed">{seed.germination_notes || "Community notes will gather here."}</p>
            </div>
            <div>
              <p className="text-foreground/70">Storage</p>
              <p className="text-foreground leading-relaxed">{seed.storage_notes || "Storage guidance is still being added."}</p>
            </div>
          </div>
        </Section>

        <Section title="Growth journey">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { stage: "seed", label: "Seed" },
              { stage: "plant", label: "Plant" },
              { stage: "flower", label: "Flower" },
              { stage: "fruit", label: "Fruit" },
            ].map((stage) => {
              const current = seed.growth_journey.find((item) => item.stage === stage.stage);
              return (
                <div key={stage.stage} className="rounded-2xl border border-border/50 bg-background/40 p-3 space-y-2 min-h-[9rem]">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{stage.label}</p>
                  <p className="font-serif text-sm text-foreground leading-relaxed">
                    {current?.description || "Waiting for a steward’s note."}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Relationships">
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
            <div className="rounded-2xl bg-background/30 p-3">
              <p className="flex items-center gap-2 text-foreground/80 mb-1"><Flower2 className="w-4 h-4" /> Pollinators</p>
              <p>{seed.relationship_notes.pollinators || "Not yet documented"}</p>
            </div>
            <div className="rounded-2xl bg-background/30 p-3">
              <p className="flex items-center gap-2 text-foreground/80 mb-1"><Leaf className="w-4 h-4" /> Soil</p>
              <p>{seed.relationship_notes.soil || "Soil preferences are still unfolding"}</p>
            </div>
            <div className="rounded-2xl bg-background/30 p-3">
              <p className="flex items-center gap-2 text-foreground/80 mb-1"><Sprout className="w-4 h-4" /> Uses</p>
              <p>{seed.relationship_notes.uses || seed.use_category}</p>
            </div>
            <div className="rounded-2xl bg-background/30 p-3">
              <p className="flex items-center gap-2 text-foreground/80 mb-1"><Leaf className="w-4 h-4" /> Companions</p>
              <p>{seed.relationship_notes.companions || "Companion notes have not been added yet"}</p>
            </div>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Section title="Guardians">
          {guardians.length === 0 ? (
            <p className="text-sm text-muted-foreground">No library or pod guardian has been linked yet.</p>
          ) : (
            <div className="space-y-3">
              {guardians.map((guardian) => (
                <div key={guardian.id} className="rounded-2xl border border-border/50 bg-background/30 p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-secondary/70">Held by</Badge>
                    <p className="font-serif text-foreground">
                      {guardian.library?.name || guardian.pod_name || "Unnamed guardian"}
                    </p>
                  </div>
                  {guardian.library && (
                    <p className="text-xs text-muted-foreground">
                      {[guardian.library.city, guardian.library.region, guardian.library.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {guardian.pod_name && guardian.library && (
                    <p className="text-xs text-muted-foreground">Pod: {guardian.pod_name}</p>
                  )}
                  {guardian.note && <p className="text-sm text-foreground/75 leading-relaxed">{guardian.note}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Growing notes">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No growing notes yet — be the first to leave one.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => {
                const summary = validationSummary[note.id] ?? {
                  count: note.validation_count,
                  validatedByCurrentUser: false,
                };

                return (
                  <div key={note.id} className="rounded-2xl border border-border/50 bg-background/30 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {note.title && <p className="font-serif text-foreground">{note.title}</p>}
                        {note.cultivation_stage && <Badge variant="outline">{note.cultivation_stage}</Badge>}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{note.content}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{summary.count} validations</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => validationMutation.mutate({ targetType: "note", targetId: note.id, seedId: seed.id })}
                        disabled={!userId || validationMutation.isPending || summary.validatedByCurrentUser}
                      >
                        {summary.validatedByCurrentUser ? "Validated" : "Validate note"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}