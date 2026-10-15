/**
 * AncestralInscriptions — names discovered in the digital bark.
 *
 * Not a list of memorials: a few quiet marks resting in the twin's surface.
 * Touching one opens the Root portal, and from there — where the
 * grove permits it — the Ethereal Tree itself.
 *
 * The living tree is never carved. The digital twin remembers.
 */
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTreeInscriptions } from "@/hooks/use-tree-inscriptions";
import { rootPortalParams } from "@/lib/ancestralRootNavigation";
import type { LifeGrove, LifeGroveOffering } from "@/lib/life-groves/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  isTreeRootAuthority,
  listPendingTreeRoots,
  reviewGroveRoot,
  rootTypeLabel,
  type TreeInscription,
} from "@/repositories/grove-roots";
import { getLifeGrove, listOfferings } from "@/repositories/life-groves";
import FullscreenTreeView from "@/components/life-groves/FullscreenTreeView";
import { SignatureMark } from "@/components/life-groves/RootSignaturePad";

export interface RootPreview {
  marks: TreeInscription[];
  grove: Pick<LifeGrove, "id" | "grove_title" | "tree_name" | "remembered_or_celebrated_name" | "tree_archetype_species"> | null;
  offerings: LifeGroveOffering[];
}
interface Props { treeId: string; showEmpty?: boolean; preview?: RootPreview; }

export default function AncestralInscriptions({ treeId, showEmpty = false, preview }: Props) {
  const { userId } = useCurrentUser();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { data: cachedMarks = [], isLoading, isError, isFetching } = useTreeInscriptions(treeId, preview?.marks);
  // A cached entry capability is not a fresh permission check.
  const marks = !preview && (isError || isFetching) ? [] : cachedMarks;
  const portal = marks.find((mark) => mark.root_id === params.get("root")) ?? null;
  const setPortal = (mark: TreeInscription | null) => {
    const previousId = params.get("root");
    setParams(rootPortalParams(params, mark?.root_id ?? null));
    if (!mark && previousId) requestAnimationFrame(() => document.getElementById(`root-mark-${previousId}`)?.focus());
  };

  const { data: cachedAuthority = false, isFetching: authorityFetching, isError: authorityError } = useQuery({
    queryKey: ["tree-root-authority", treeId, userId],
    queryFn: () => isTreeRootAuthority(treeId, userId),
    enabled: !!userId && !preview,
  });

  const isAuthority = cachedAuthority && !authorityFetching && !authorityError;

  const { data: waiting = [] } = useQuery({
    queryKey: ["tree-roots-pending", treeId, userId],
    queryFn: () => listPendingTreeRoots(treeId),
    enabled: isAuthority && !preview,
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

  if (!showEmpty && marks.length === 0 && waiting.length === 0) return null;

  return (
    <section aria-label="Roots in the digital bark" className="my-10">
      {showEmpty && <div className="text-center mb-6">
        <h3 className="font-serif text-xl text-primary">Ancestral Roots</h3>
        <p className="font-serif text-sm text-muted-foreground mt-2">A name resting in the digital bark. A doorway to a Life Grove, where its people permit.</p>
        <p className="text-xs text-muted-foreground mt-2">The Root is a relationship. Family memories stay in their Grove.</p>
      </div>}
      {showEmpty && isLoading && <p role="status">Following the roots…</p>}
      {showEmpty && isError && <p role="status">These roots could not be opened. Please try again later.</p>}
      {showEmpty && !isLoading && !isError && !marks.length && <p className="text-center font-serif text-muted-foreground">No Ancestral Roots resting here yet.</p>}
      <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 text-center">
        Names in the bark
      </p>

      {marks.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-5">
          {marks.map((m) => (
            <button
              key={m.root_id}
              id={`root-mark-${m.root_id}`}
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

      <RootPortal key={`${portal?.root_id ?? "closed"}-${userId ?? "anonymous"}`} mark={portal} onClose={() => setPortal(null)} preview={preview} />
    </section>
  );
}

/* ---------------- the portal ---------------- */

function RootPortal({
  mark,
  onClose,
  preview,
}: {
  mark: TreeInscription | null;
  onClose: () => void;
  preview?: RootPreview;
}) {
  const [params, setParams] = useSearchParams();
  const { userId } = useCurrentUser();
  const requestedEntry = params.get("rootView") === "grove" && !!mark?.can_enter;
  const setEntered = (value: boolean) => setParams(rootPortalParams(params, mark?.root_id ?? null, value));
  const groveId = mark?.life_grove_id;
  const canEnter = !!mark?.can_enter;

  const { data: cachedGrove, isError: groveError, isFetching: groveFetching } = useQuery({
    queryKey: ["root-portal-grove", groveId, userId],
    queryFn: () => (groveId ? getLifeGrove(groveId) : null),
    enabled: !!groveId && canEnter && !preview,
    refetchOnMount: "always",
    ...(preview ? { initialData: preview.grove } : {}),
  });

  const grove = !preview && (groveError || groveFetching) ? null : cachedGrove;
  const groveUnavailable = canEnter && !grove && !groveFetching;
  const entered = requestedEntry && !!grove;

  const { data: cachedOfferings = [], isError: offeringsError, isFetching: offeringsFetching } = useQuery({
    queryKey: ["root-portal-offerings", groveId, userId],
    queryFn: () => (groveId ? listOfferings(groveId) : []),
    enabled: !!groveId && canEnter && !!grove && !preview,
    ...(preview ? { initialData: preview.offerings } : {}),
  });

  const offerings = !preview && (offeringsError || offeringsFetching) ? [] : cachedOfferings;

  useEffect(() => {
    if (mark && !canEnter && params.has("rootView")) setParams(rootPortalParams(params, mark.root_id), { replace: true });
  }, [mark, canEnter, params, setParams]);

  return (
    <>
      <Sheet
        open={!!mark && !entered}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <SheetContent side="bottom" className="rounded-t-3xl border-border/40 pb-10 max-h-[85dvh] overflow-y-auto">
          <SheetTitle className="sr-only">Ancestral Root portal</SheetTitle>
          <SheetDescription className="sr-only">An inscription may be public while the Life Grove remains private.</SheetDescription>
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
                {groveUnavailable && <p role="status" className="mb-3 text-sm text-muted-foreground">This Grove is unavailable or your permission has changed. Its memories have not been opened.</p>}
                {canEnter ? (
                  <Button
                    className="h-14 px-8 font-serif text-xs uppercase tracking-[0.3em]"
                    disabled={!grove}
                    onClick={() => setEntered(true)}
                  >
                    {grove ? "Enter the Ethereal Tree" : groveUnavailable ? "Grove unavailable" : "Opening…"}
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

      {canEnter && grove && (
        <FullscreenTreeView
          open={entered}
          onClose={() => {
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
