/**
 * LifeGrovesLandingPage — entrance into Life Groves.
 * Route: /heartwood/life-groves
 */
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { listMyLifeGroves } from "@/repositories/life-groves";
import EtherealTreePreview from "@/components/life-groves/EtherealTreePreview";
import { GROVE_TYPES } from "@/lib/life-groves/types";

export default function LifeGrovesLandingPage() {
  const navigate = useNavigate();
  const { userId, isLoading: loadingUser } = useCurrentUser();

  const { data: groves = [], isLoading: loadingGroves } = useQuery({
    queryKey: ["life-groves", userId],
    queryFn: () => (userId ? listMyLifeGroves(userId) : Promise.resolve([])),
    enabled: !!userId,
  });

  return (
    <div className="min-h-screen botanical-heartwood">
      <Header />
      <main
        className="relative z-10 max-w-5xl mx-auto px-4 pb-24"
        style={{ paddingTop: "var(--content-top)" }}
      >
        <section className="text-center max-w-2xl mx-auto mb-12">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
            Heartwood
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mt-2 mb-3">
            Life Groves
          </h1>
          <p className="font-serif text-base text-muted-foreground/90">
            Grow a living tree-library for births, memorials, celebrations, families,
            and meaningful moments.
          </p>
          <p className="font-serif text-sm italic text-muted-foreground/70 mt-4">
            “The tree grows in the world. The Heartwood keeps the library.”
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          {[
            { title: "Create a Life Grove", body: "Begin the seed of a new living library." },
            { title: "Choose an Ethereal Tree", body: "Oak, Yew, Hazel, Apple, Olive, Beech, Ash…" },
            { title: "Invite Others", body: "Gather offerings into the tree’s branches." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-border/40 bg-card/40 p-5">
              <h3 className="font-serif text-base text-foreground">{c.title}</h3>
              <p className="text-xs font-serif text-muted-foreground/80 mt-1">{c.body}</p>
            </div>
          ))}
        </section>

        <section className="text-center mb-12">
          <p className="font-serif text-xs uppercase tracking-[0.25em] text-muted-foreground/70 mb-3">
            Possible groves
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {GROVE_TYPES.filter((g) => g.value !== "custom").map((g) => (
              <span
                key={g.value}
                className="px-3 py-1 rounded-full text-xs font-serif border border-border/40 bg-card/40 text-muted-foreground/90"
              >
                {g.label}
              </span>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-3 mb-14">
          <Button onClick={() => navigate("/heartwood/life-groves/new")}>
            Create a Life Grove
          </Button>
          <Button variant="outline" onClick={() => navigate("/library")}>
            Explore Heartwood
          </Button>
        </div>

        {userId && groves.length > 0 && (
          <section className="mb-16">
            <h2 className="font-serif text-xl text-foreground mb-4">Your Groves</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groves.map((g) => (
                <Link
                  key={g.id}
                  to={`/heartwood/life-groves/${g.id}`}
                  className="rounded-2xl border border-border/40 bg-card/40 p-4 hover:border-primary/40 transition-all"
                >
                  <EtherealTreePreview
                    archetype={g.tree_archetype_species}
                    size="sm"
                    treeName={g.tree_name}
                  />
                  <p className="font-serif text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mt-2">
                    {g.grove_type}
                  </p>
                  <h3 className="font-serif text-base text-foreground mt-1">
                    {g.grove_title}
                  </h3>
                  {g.remembered_or_celebrated_name && (
                    <p className="text-xs font-serif text-muted-foreground/80 italic">
                      for {g.remembered_or_celebrated_name}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {!userId && (
          <p className="text-center text-sm font-serif text-muted-foreground/80 mb-12">
            <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to
            create your first Life Grove.
          </p>
        )}

        <p className="text-center text-xs font-serif italic text-muted-foreground/60">
          Life Groves are part of Heartwood — a living library where love keeps growing.
        </p>
      </main>
      <Footer />
    </div>
  );
}
