/**
 * LifeGroveInvitePage — invite-route to leave an offering.
 * Route: /life-grove-invite/:inviteToken
 *
 * NOTE: insertion is permitted to anyone via RLS for the prototype. The grove is
 * resolved via SECURITY DEFINER RPC `get_life_grove_by_invite_token` so an
 * invalid token shows a soft empty state instead of exposing data.
 * TODO: add a server-side `consume_grove_invite_token` RPC that validates token
 * and inserts atomically once the prototype graduates.
 */
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  createOffering,
  getLifeGroveByToken,
  listOfferings,
} from "@/repositories/life-groves";
import EtherealTreePreview from "@/components/life-groves/EtherealTreePreview";
import { OFFERING_TYPES, type OfferingType, type TreeArchetype } from "@/lib/life-groves/types";
import { assignOfferingPosition } from "@/lib/life-groves/positions";

export default function LifeGroveInvitePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: grove, isLoading, isError } = useQuery({
    queryKey: ["life-grove-by-token", inviteToken],
    queryFn: () => (inviteToken ? getLifeGroveByToken(inviteToken) : null),
    enabled: !!inviteToken,
    retry: 1,
  });

  const [contributorName, setContributorName] = useState("");
  const [contributorEmail, setContributorEmail] = useState("");
  const [offeringType, setOfferingType] = useState<OfferingType>("story");
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [visibility, setVisibility] = useState<"family_only" | "public">("family_only");
  const [consent, setConsent] = useState(false);
  const [success, setSuccess] = useState(false);

  const archetype = (grove?.tree_archetype_species ?? "oak") as TreeArchetype;

  const submit = useMutation({
    mutationFn: async () => {
      if (!grove) throw new Error("This invitation could not be found.");
      if (!consent) throw new Error("Please confirm you understand the offering will be added.");
      if (!contributorName.trim() && !user) throw new Error("Please share your name.");
      if (!bodyText.trim() && !mediaUrl.trim() && !title.trim()) {
        throw new Error("Add a title, words, or a link.");
      }
      await createOffering({
        life_grove_id: grove.id,
        contributor_user_id: user?.id ?? null,
        contributor_name: contributorName.trim() || (user?.email ?? "A Wanderer"),
        contributor_email: contributorEmail.trim() || user?.email || null,
        offering_type: offeringType,
        title: title.trim() || null,
        body_text: bodyText.trim() || null,
        media_url: mediaUrl.trim() || null,
        visibility,
        memory_position_data: null,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      toast("Your offering has been added to the branches.");
      if (grove?.id) {
        queryClient.invalidateQueries({ queryKey: ["life-grove-offerings", grove.id] });
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not hang the offering.";
      toast(msg);
    },
  });

  const offeringMeta = useMemo(
    () => OFFERING_TYPES.find((o) => o.value === offeringType),
    [offeringType],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen botanical-heartwood">
        <Header />
        <main className="max-w-md mx-auto px-4 py-24 text-center" style={{ paddingTop: "var(--content-top)" }}>
          <p className="font-serif text-sm text-muted-foreground/80">Listening for the tree…</p>
        </main>
      </div>
    );
  }

  if (!grove || isError) {
    return (
      <div className="min-h-screen botanical-heartwood">
        <Header />
        <main className="max-w-md mx-auto px-4 py-24 text-center" style={{ paddingTop: "var(--content-top)" }}>
          <h1 className="font-serif text-2xl text-foreground mb-2">This invitation has faded</h1>
          <p className="text-sm font-serif text-muted-foreground/80 mb-6">
            The link may have been mistyped, the grove may have been closed,
            or the invitation may have been retired by its keeper.
          </p>
          <Button asChild variant="outline">
            <a href="/heartwood/life-groves">Return to Life Groves</a>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen botanical-heartwood">
      <Header />
      <main className="max-w-2xl mx-auto px-4 pb-24" style={{ paddingTop: "var(--content-top)" }}>
        <header className="text-center mb-6">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
            Life Grove · {grove.grove_type}
          </p>
          <h1 className="font-serif text-3xl text-foreground mt-2">
            {grove.grove_title}
          </h1>
          {grove.remembered_or_celebrated_name && (
            <p className="font-serif italic text-muted-foreground/90 mt-1">
              for {grove.remembered_or_celebrated_name}
            </p>
          )}
          <div className="my-4">
            <EtherealTreePreview archetype={archetype} treeName={grove.tree_name} size="md" />
          </div>
          {grove.story_intro && (
            <p className="font-serif text-sm text-muted-foreground/90 max-w-md mx-auto">
              {grove.story_intro}
            </p>
          )}
        </header>

        {success ? (
          <section className="text-center rounded-2xl border border-primary/30 bg-card/40 p-8">
            <p className="font-serif text-xl text-foreground">
              Your offering has been added to the branches.
            </p>
            <p className="font-serif text-sm italic text-muted-foreground/80 mt-2">
              The tree carries it now.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSuccess(false);
                setTitle("");
                setBodyText("");
                setMediaUrl("");
              }}
            >
              Leave another
            </Button>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cName" className="font-serif text-sm">Your name</Label>
                <Input
                  id="cName"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder={user?.email ?? "How shall the tree know you?"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cEmail" className="font-serif text-sm">Email (optional)</Label>
                <Input
                  id="cEmail"
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="Only if you wish"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-serif text-sm">Type of offering</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {OFFERING_TYPES.filter((t) => t.value !== "video").map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setOfferingType(t.value)}
                    className={`p-2 rounded-xl border bg-card/40 text-center ${offeringType === t.value ? "border-primary/60 ring-1 ring-primary/30" : "border-border/40"}`}
                  >
                    <span className="text-base block" aria-hidden>{t.glyph}</span>
                    <span className="text-[11px] font-serif text-foreground">{t.label}</span>
                  </button>
                ))}
              </div>
              {offeringMeta && (
                <p className="text-[11px] font-serif italic text-muted-foreground/70">
                  {offeringMeta.label} · added as {offeringMeta.glyph}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="font-serif text-sm">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A short heading"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body" className="font-serif text-sm">Words</Label>
              <Textarea
                id="body"
                rows={5}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="A story, a memory, a recipe, a poem…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media" className="font-serif text-sm">Media link (optional)</Label>
              <Input
                id="media"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://… (photo, song, video)"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-serif text-sm">Visibility</Label>
              <div className="flex gap-2">
                {(["family_only", "public"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={`flex-1 p-2 rounded-xl border bg-card/40 text-sm font-serif ${visibility === v ? "border-primary/60 ring-1 ring-primary/30" : "border-border/40"}`}
                  >
                    {v === "family_only" ? "Family only" : "Public"}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs font-serif text-muted-foreground/90">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5"
              />
              <span>I understand this offering will become part of this Life Grove library.</span>
            </label>

            <Button
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
              className="w-full"
              size="lg"
            >
              {submit.isPending ? "Hanging…" : "Hang Offering in the Tree"}
            </Button>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
