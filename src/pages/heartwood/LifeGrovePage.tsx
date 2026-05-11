/**
 * LifeGrovePage — single Life Grove view.
 * Route: /heartwood/life-groves/:id
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getLifeGrove, listOfferings } from "@/repositories/life-groves";
import EtherealOfferingTree, {
  OfferingPreviewCard,
} from "@/components/life-groves/EtherealOfferingTree";
import HeartwoodLibraryTabs from "@/components/life-groves/HeartwoodLibraryTabs";
import InviteLinkPanel from "@/components/life-groves/InviteLinkPanel";
import RootedTreeSection from "@/components/life-groves/RootedTreeSection";
import { GROVE_TYPES, TREE_ARCHETYPES, type LifeGroveOffering } from "@/lib/life-groves/types";

export default function LifeGrovePage() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useCurrentUser();
  const [selected, setSelected] = useState<LifeGroveOffering | null>(null);

  const { data: grove, isLoading, isError } = useQuery({
    queryKey: ["life-grove", id],
    queryFn: () => (id ? getLifeGrove(id) : null),
    enabled: !!id,
    retry: 1,
  });

  const { data: offerings = [], isLoading: loadingOfferings } = useQuery({
    queryKey: ["life-grove-offerings", id],
    queryFn: () => (id ? listOfferings(id) : []),
    enabled: !!id && !!grove,
    refetchOnMount: true,
  });

  // Clear selection if the chosen offering disappears after refetch.
  useEffect(() => {
    if (selected && !offerings.some((o) => o.id === selected.id)) {
      setSelected(null);
    }
  }, [offerings, selected]);

  if (isLoading) {
    return (
      <div className="min-h-screen botanical-heartwood">
        <Header />
        <main
          className="max-w-3xl mx-auto px-4 py-24 text-center"
          style={{ paddingTop: "var(--content-top)" }}
          aria-busy="true"
        >
          <p className="font-serif text-sm text-muted-foreground/80">Stirring the branches…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!grove || isError) {
    return (
      <div className="min-h-screen botanical-heartwood">
        <Header />
        <main className="max-w-md mx-auto px-4 py-24 text-center" style={{ paddingTop: "var(--content-top)" }}>
          <h1 className="font-serif text-2xl text-foreground mb-2">This grove is quiet</h1>
          <p className="text-sm font-serif text-muted-foreground/80 mb-6">
            It may be a private grove, or the link may have faded.
            If a keeper has shared it with you, ask for a fresh invitation link.
          </p>
          <Button asChild><Link to="/heartwood/life-groves">Back to Life Groves</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const archetypeLabel = TREE_ARCHETYPES.find((a) => a.value === grove.tree_archetype_species)?.label ?? "Tree";
  const groveLabel = GROVE_TYPES.find((g) => g.value === grove.grove_type)?.label ?? grove.grove_type;
  const isOwner = userId && userId === grove.created_by;

  return (
    <div className="min-h-screen botanical-heartwood">
      <Header />
      <main className="max-w-4xl mx-auto px-4 pb-24" style={{ paddingTop: "var(--content-top)" }}>
        {/* Ethereal Tree Header */}
        <section className="text-center mb-10">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
            Heartwood · {groveLabel}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground mt-2">
            {grove.grove_title}
          </h1>
          <p className="font-serif text-xs uppercase tracking-[0.25em] text-muted-foreground/60 mt-2">
            an Ethereal {archetypeLabel}
          </p>
          {grove.remembered_or_celebrated_name && (
            <p className="font-serif text-base italic text-muted-foreground/90 mt-2">
              for {grove.remembered_or_celebrated_name}
            </p>
          )}
          <div
            className="relative my-8 mx-auto"
            style={{ maxWidth: 420 }}
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-0 rounded-full blur-3xl opacity-60"
              style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.18), transparent 70%)" }}
            />
            <div className="relative z-10">
              <EtherealOfferingTree
                archetype={grove.tree_archetype_species}
                treeName={grove.tree_name}
                offerings={offerings}
                selectedId={selected?.id ?? null}
                onSelect={setSelected}
                size={400}
              />
            </div>
          </div>
          {selected ? (
            <div className="max-w-md mx-auto text-left">
              <OfferingPreviewCard offering={selected} onClose={() => setSelected(null)} />
            </div>
          ) : offerings.length === 0 ? (
            <p className="font-serif text-sm italic text-muted-foreground/80 max-w-xl mx-auto">
              The branches are waiting. Hang the first offering.
            </p>
          ) : (
            <p className="font-serif text-sm italic text-muted-foreground/80 max-w-xl mx-auto">
              Tap a glyph to read what is hanging in the branches.
            </p>
          )}
        </section>

        {/* Meta */}
        {(grove.story_intro || grove.location_text || grove.event_date) && (
          <section className="rounded-2xl border border-border/40 bg-card/40 p-5 mb-8 text-sm font-serif text-foreground/90 space-y-2">
            {grove.story_intro && <p>{grove.story_intro}</p>}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground/80">
              {grove.location_text && <span>📍 {grove.location_text}</span>}
              {grove.event_date && <span>📅 {grove.event_date}</span>}
              <span>🕯 {offerings.length} offering{offerings.length === 1 ? "" : "s"}</span>
            </div>
          </section>
        )}

        <RootedTreeSection grove={grove} />

        {/* Library */}
        <section className="mb-8">
          <h2 className="font-serif text-xl text-foreground mb-3">Heartwood Library</h2>
          {loadingOfferings ? (
            <p className="font-serif text-sm italic text-muted-foreground/70 py-6 text-center">
              Gathering offerings…
            </p>
          ) : (
            <HeartwoodLibraryTabs offerings={offerings} />
          )}
        </section>

        {/* Invite */}
        {isOwner && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <InviteLinkPanel inviteToken={grove.invite_token} />
            <div className="rounded-xl border border-border/40 bg-card/40 p-4 flex flex-col justify-center">
              <p className="font-serif text-sm text-foreground mb-2">Leave an offering</p>
              <p className="text-xs font-serif text-muted-foreground/80 mb-3">
                Add a story, photo, song, or poem yourself.
              </p>
              <Button asChild>
                <Link to={`/life-grove-invite/${grove.invite_token}`}>Hang an Offering</Link>
              </Button>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
