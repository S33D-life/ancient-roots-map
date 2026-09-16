/**
 * AncestralInscriptions — names discovered in the digital bark.
 *
 * Not a list of memorials: a few quiet marks resting in the twin's surface.
 * Touching one opens the Ancestral Root portal, and from there — where the
 * grove permits it — the Ethereal Tree itself.
 *
 * The living tree is never carved. The digital twin remembers.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  isTreeRootAuthority,
  listPendingTreeRoots,
  listTreeInscriptions,
  reviewGroveRoot,
  rootTypeLabel,
  type TreeInscription,
} from "@/repositories/grove-roots";
import { getLifeGrove, listOfferings } from "@/repositories/life-groves";
import FullscreenTreeView from "@/components/life-groves/FullscreenTreeView";
import { SignatureMark } from "@/components/life-groves/RootSignaturePad";

interface Props {
  treeId: string;
}

export default function AncestralInscriptions({ treeId }: Props) {
  const { userId } = useCurrentUser();
  const qc = useQueryClient();
  const [portal, setPortal] = useState<TreeInscription | null>(null);

  const { data: marks = [] } = useQuery({
    queryKey: ["tree-inscriptions", treeId],
    queryFn: () => listTreeInscriptions(treeId),
  });

  const { data: isAuthority = false } = useQuery({
    queryKey: ["tree-root-authority", treeId, userId],
    queryFn: () => isTreeRootAuthority(treeId, userId),
    enabled: !!userId,
  });

  const { data: waiting = [] } = useQuery({
    queryKey: ["tree-roots-pending", treeId],
    queryFn: () => listPendingTreeRoots(treeId),
    enabled: isAuthority,
  });

  const review = useMutation({
    mutationFn: (v: { id: string; decision: "active" | "declined" }) =>
      reviewGroveRoot(v.id, v.decision, v.decision === "declined" ? "Not welcomed here" : undefined),
    onSuccess: () => {
      toast.success("The bark remembers your decision.");
      qc.invalidateQueries({ queryKey: ["tree-inscriptions", treeId] });
      qc.invalidateQueries({ queryKey: ["tree-roots-pending", treeId] });
    },
    onError: (e: unknown) =>
      toast.error((e as { message?: string })?.message || "That could not be settled."),
  });

  if (marks.length === 0 && waiting.length === 0) return null;

  return (
    <section aria-label="Roots in the digital bark" className="my-10">
      <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 text-center">
        Names in the bark
      </p>

      {marks.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-5">
          {marks.map((m) => (
            <button
              key={m.root_id}
              type="button"
              onClick={() => setPortal(m)}
              aria-label={`Open the ${rootTypeLabel(m.root_type).toLowerCase()} root ${m.inscription_text ?? ""}`}
              className="group relative min-h-[44px] px-3 py-2 rounded-md
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {m.signature_strokes?.length ? (
                <SignatureMark
                  strokes={m.signature_strokes}
                  label={`Handwritten mark: ${m.inscription_text ?? `${rootTypeLabel(m.root_type)} inscription`}`}
                  className="h-14 w-28 opacity-55 transition-opacity duration-700 group-hover:opacity-90"
                />
              ) : (
                <span className="font-serif tracking-[0.42em] text-base md:text-lg text-foreground/55 group-hover:text-foreground/90 transition-colors duration-700">
                  {m.inscription_text}
                </span>
              )}
              <span
                aria-hidden
                className="block h-px mt-1 bg-foreground/15 group-hover:bg-primary/40 transition-colors duration-700"
              />
            </button>
          ))}
        </div>
      )}

      {isAuthority && waiting.length > 0 && (
        <div className="mt-6 max-w-md mx-auto rounded-2xl border border-border/40 bg-card/40 p-4">
          <p className="font-serif text-sm text-foreground mb-2">Roots reaching towards this friend</p>
          <ul className="space-y-3">
            {waiting.map((w) => (
              <li key={w.id} className="text-sm font-serif">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
                  {rootTypeLabel(w.root_type)} root
                </p>
                <p className="tracking-[0.3em] text-foreground/85">{w.inscription_text}</p>
                {w.dedication && (
                  <p className="text-[11px] italic text-muted-foreground/80">{w.dedication}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    className="font-serif"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: w.id, decision: "active" })}
                  >
                    Welcome it
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="font-serif"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: w.id, decision: "declined" })}
                  >
                    Not here
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AncestralRootPortal mark={portal} onClose={() => setPortal(null)} />
    </section>
  );
}

/* ---------------- the portal ---------------- */

function AncestralRootPortal({
  mark,
  onClose,
}: {
  mark: TreeInscription | null;
  onClose: () => void;
}) {
  const [entered, setEntered] = useState(false);
  const groveId = mark?.life_grove_id;
  const canEnter = !!mark?.can_enter;

  const { data: grove } = useQuery({
    queryKey: ["life-grove", groveId],
    queryFn: () => (groveId ? getLifeGrove(groveId) : null),
    enabled: !!groveId && canEnter,
  });

  const { data: offerings = [] } = useQuery({
    queryKey: ["life-grove-offerings", groveId],
    queryFn: () => (groveId ? listOfferings(groveId) : []),
    enabled: !!groveId && canEnter && !!grove,
  });

  return (
    <>
      <Sheet
        open={!!mark && !entered}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <SheetContent side="bottom" className="rounded-t-3xl border-border/40 pb-10">
          {mark && (
            <div className="max-w-md mx-auto text-center pt-2">
              {mark.signature_strokes?.length ? (
                <SignatureMark
                  strokes={mark.signature_strokes}
                  label={`Handwritten mark: ${mark.inscription_text ?? `${rootTypeLabel(mark.root_type)} inscription`}`}
                  className="mx-auto h-28 w-64"
                />
              ) : (
                <p className="font-serif tracking-[0.42em] text-2xl text-foreground">
                  {mark.inscription_text}
                </p>
              )}
              {mark.signature_strokes?.length && (
                <p className="sr-only">{mark.inscription_text}</p>
              )}
              <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 mt-3">
                {rootTypeLabel(mark.root_type)} root
              </p>
              {mark.remembered_name && (
                <p className="font-serif text-base italic text-muted-foreground/90 mt-3">
                  {mark.remembered_name}
                </p>
              )}
              {mark.grove_title && (
                <p className="font-serif text-[11px] uppercase tracking-[0.25em] text-muted-foreground/70 mt-1">
                  {mark.grove_title}
                </p>
              )}
              {mark.dedication && (
                <p className="font-serif text-sm text-foreground/85 mt-4">{mark.dedication}</p>
              )}
              {mark.rooted_year && (
                <p className="font-serif text-[11px] text-muted-foreground/60 mt-2">
                  rooted here in {mark.rooted_year}
                </p>
              )}

              <div className="mt-7">
                {canEnter ? (
                  <Button
                    className="h-14 px-8 font-serif text-xs uppercase tracking-[0.3em]"
                    disabled={!grove}
                    onClick={() => setEntered(true)}
                  >
                    {grove ? "Enter the Ethereal Tree" : "Opening…"}
                  </Button>
                ) : (
                  <p className="font-serif text-sm italic text-muted-foreground/80">
                    The tree beyond this mark is held privately by its family.
                  </p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {grove && (
        <FullscreenTreeView
          open={entered}
          onClose={() => {
            setEntered(false);
            onClose();
          }}
          archetype={grove.tree_archetype_species}
          groveTitle={grove.grove_title}
          treeName={grove.tree_name}
          rememberedName={grove.remembered_or_celebrated_name}
          offerings={offerings}
        />
      )}
    </>
  );
}
