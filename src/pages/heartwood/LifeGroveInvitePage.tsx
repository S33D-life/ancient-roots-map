/**
 * LifeGroveInvitePage — the ordinary grove invitation.
 * Route: /life-grove-invite/:inviteToken
 *
 * Accepting this invitation grants CONTRIBUTOR access only: you may hang
 * offerings where the grove allows it. It never grants stewardship, which is
 * always a separate, deliberate act by the grove's primary steward.
 *
 * The invitation is redeemed server-side by `join_life_grove_with_token`,
 * which requires a signed-in Wanderer. There is no anonymous contribution.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getLifeGroveByToken } from "@/repositories/life-groves";
import { joinGroveWithToken } from "@/repositories/life-grove-stewardship";
import EtherealTreePreview from "@/components/life-groves/EtherealTreePreview";
import LifeGroveOfferingComposer from "@/components/life-groves/LifeGroveOfferingComposer";
import type { TreeArchetype } from "@/lib/life-groves/types";

export default function LifeGroveInvitePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const { user, userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [joined, setJoined] = useState(false);

  const { data: grove, isLoading, isError } = useQuery({
    queryKey: ["life-grove-by-token", inviteToken],
    queryFn: () => (inviteToken ? getLifeGroveByToken(inviteToken) : null),
    enabled: !!inviteToken,
    retry: 1,
  });

  // Redeem the invitation once, for a signed-in Wanderer only.
  useEffect(() => {
    if (!inviteToken || !userId || joined) return;
    joinGroveWithToken(inviteToken)
      .then(() => {
        setJoined(true);
        queryClient.invalidateQueries({ queryKey: ["grove-authority"] });
      })
      .catch((err) => {
        toast(err instanceof Error ? err.message : "This invitation could not bloom.");
      });
  }, [inviteToken, userId, joined, queryClient]);

  const archetype = (grove?.tree_archetype_species ?? "oak") as TreeArchetype;

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
            <Link to="/heartwood/life-groves">Return to Life Groves</Link>
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
        <header className="text-center mb-8">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
            Life Grove · {grove.grove_type}
          </p>
          <h1 className="font-serif text-3xl text-foreground mt-2">{grove.grove_title}</h1>
          {grove.remembered_or_celebrated_name && (
            <p className="font-serif italic text-muted-foreground/90 mt-1">
              for {grove.remembered_or_celebrated_name}
            </p>
          )}
          <div className="my-5">
            <EtherealTreePreview archetype={archetype} treeName={grove.tree_name} size="md" />
          </div>
          {grove.story_intro && (
            <p className="font-serif text-sm text-muted-foreground/90 max-w-md mx-auto">{grove.story_intro}</p>
          )}
        </header>

        <section className="text-center rounded-2xl border border-border/40 bg-card/40 p-6">
          {user ? (
            <>
              <p className="font-serif text-lg text-foreground mb-1">You have been welcomed into this grove.</p>
              <p className="font-serif text-sm italic text-muted-foreground/80 mb-6">
                Find something — a photograph, a song, a voice — and hang it in the tree.
              </p>
              <Button className="h-14 px-8 font-serif text-base" onClick={() => setComposerOpen(true)}>
                Hang an Offering
              </Button>
            </>
          ) : (
            <>
              <p className="font-serif text-lg text-foreground mb-1">Sign in to accept this invitation</p>
              <p className="font-serif text-sm italic text-muted-foreground/80 mb-6">
                So the tree knows whose hand hung the offering.
              </p>
              <Button asChild className="h-12 px-8 font-serif">
                <Link to="/auth">Sign in</Link>
              </Button>
            </>
          )}
        </section>
      </main>

      {userId && (
        <LifeGroveOfferingComposer
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          groveId={grove.id}
          groveTitle={grove.grove_title}
          rememberedName={grove.remembered_or_celebrated_name}
          grovePrivacy={grove.privacy}
          contributorUserId={userId}
          onHung={() => queryClient.invalidateQueries({ queryKey: ["life-grove-offerings", grove.id] })}
        />
      )}
      <Footer />
    </div>
  );
}
