/**
 * AncestralRootsSection — "Rooted in the living world".
 *
 * Shows where this Ethereal Tree has rooted into Ancient Friends, and lets
 * grove stewards begin a new rooting. The Root is the relationship; the
 * inscription is the mark it will leave on the Ancient Friend's digital twin.
 *
 * Authority is the database's to decide — this only shows the path.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useGroveAuthority } from "@/hooks/use-grove-authority";
import {
  createGroveRoot,
  listGroveRoots,
  removeGroveRoot,
  reviewGroveRootProposal,
  searchAncientFriends,
  tendGroveRootInscription,
  type AncientFriendResult,
  type EntryMode,
  type PortalDisclosure,
} from "@/repositories/grove-roots";
import RootSignaturePad, {
  SignatureMark,
  type SignatureStrokes,
} from "@/components/life-groves/RootSignaturePad";

interface Props {
  groveId: string;
}

export default function AncestralRootsSection({ groveId }: Props) {
  const qc = useQueryClient();
  const { isSteward, isContributor, userId } = useGroveAuthority(groveId);
  const [open, setOpen] = useState(false);
  const [tendingRoot, setTendingRoot] = useState<(typeof roots)[number] | null>(null);

  const { data: roots = [], isLoading } = useQuery({
    queryKey: ["grove-roots", groveId],
    queryFn: () => listGroveRoots(groveId),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["grove-roots", groveId] });

  const remove = useMutation({
    mutationFn: (v: { rootId: string; mine: boolean }) =>
      removeGroveRoot(v.rootId, v.mine ? "Withdrawn by the person who suggested it" : "Let go by a steward"),
    onSuccess: () => {
      toast.success("Let go. Its history remains.");
      refresh();
    },
    onError: (e: unknown) => toast.error(describe(e)),
  });

  const review = useMutation({
    mutationFn: (v: { rootId: string; decision: "accept" | "decline"; note?: string }) =>
      reviewGroveRootProposal(v.rootId, v.decision, v.note),
    onSuccess: (_d, v) => {
      toast.success(
        v.decision === "accept"
          ? "Taken up. The Ancient Friend will be asked to welcome it."
          : "Set aside, with your words kept.",
      );
      refresh();
    },
    onError: (e: unknown) => toast.error(describe(e)),
  });

  const suggested = roots.filter((r) => r.status === "proposed");
  const active = roots.filter((r) => r.status === "active");
  const waiting = roots.filter((r) => r.status === "pending");
  const declined = roots.filter((r) => r.status === "declined");

  return (
    <section
      aria-label="Rooted in the living world"
      className="rounded-2xl border border-border/40 bg-card/40 p-5 mb-8"
    >
      <h2 className="font-serif text-lg text-foreground mb-1">Rooted in the living world</h2>
      <p className="font-serif text-xs italic text-muted-foreground/70 mb-4">
        Don't carve the living tree. Let the digital twin remember.
      </p>

      {isLoading ? (
        <p className="font-serif text-sm italic text-muted-foreground/70">Following the roots…</p>
      ) : roots.length === 0 ? (
        <p className="font-serif text-sm text-foreground/90">
          This tree has not yet reached towards an Ancient Friend.
        </p>
      ) : (
        <ul className="space-y-3">
          {[...suggested, ...active, ...waiting, ...declined].map((r) => {
            const mine = !!userId && r.created_by === userId;
            return (
              <li
                key={r.root_id}
                className={`rounded-xl border p-3 ${
                  r.status === "proposed"
                    ? "border-primary/35 bg-primary/5"
                    : "border-border/40 bg-background/40"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    to={`/tree/${r.tree_id}`}
                    className="font-serif text-sm text-primary underline decoration-primary/40 underline-offset-4"
                  >
                    {r.tree_name || "An Ancient Friend"}
                  </Link>
                  <span className="font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
                    {r.status === "active"
                      ? "Welcomed"
                      : r.status === "pending"
                        ? "Awaiting welcome"
                        : r.status === "proposed"
                          ? "Suggested"
                          : "Not welcomed"}
                  </span>
                </div>
                {r.inscription_text && (
                  <p className="font-serif tracking-[0.3em] text-sm text-foreground/85 mt-1">
                    {r.inscription_text}
                  </p>
                )}
                <SignatureMark
                  strokes={r.signature_strokes}
                  label={`Handwritten mark: ${r.inscription_text || "ancestral inscription"}`}
                  className="mt-2 h-16 w-36 opacity-75"
                />
                {r.status === "proposed" && (
                  <p className="font-serif text-[11px] italic text-muted-foreground/70 mt-1">
                    {mine
                      ? "Your suggestion rests here until a steward takes it up."
                      : "Suggested by someone welcomed into this grove. A steward decides whether it travels on."}
                  </p>
                )}
                {r.status === "pending" && (
                  <p className="font-serif text-[11px] italic text-muted-foreground/70 mt-1">
                    A keeper of that Ancient Friend will decide whether the mark may rest there.
                  </p>
                )}
                {r.status === "declined" && r.review_note && (
                  <p className="font-serif text-[11px] italic text-muted-foreground/70 mt-1">
                    {r.review_note}
                  </p>
                )}

                {r.status === "proposed" && isSteward && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      size="sm"
                      className="font-serif"
                      disabled={review.isPending}
                      onClick={() => review.mutate({ rootId: r.root_id, decision: "accept" })}
                    >
                      Take it up
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="font-serif"
                      disabled={review.isPending}
                      onClick={() => {
                        const note = window.prompt("A few words for the person who suggested it:");
                        if (note && note.trim()) {
                          review.mutate({ rootId: r.root_id, decision: "decline", note: note.trim() });
                        }
                      }}
                    >
                      Set it aside
                    </Button>
                  </div>
                )}

                {((isSteward && r.status !== "declined") ||
                  (mine && r.status === "proposed")) && (
                  <button
                    type="button"
                    onClick={() => remove.mutate({ rootId: r.root_id, mine: mine && r.status === "proposed" })}
                    className="mt-2 font-serif text-[11px] uppercase tracking-[0.22em]
                      text-muted-foreground/60 hover:text-foreground min-h-[44px]"
                  >
                    {mine && r.status === "proposed" ? "Withdraw my suggestion" : "Let this root go"}
                  </button>
                )}
                {isSteward && (r.status === "active" || r.status === "pending") && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="mt-2 font-serif"
                    onClick={() => setTendingRoot(r)}
                  >
                    Tend inscription
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {isContributor && (
        <div className="mt-4">
          <Button
            variant="outline"
            className="font-serif text-xs uppercase tracking-[0.25em] h-12"
            onClick={() => setOpen(true)}
          >
            {isSteward ? "+ Root into an Ancient Friend" : "+ Suggest a root"}
          </Button>
        </div>
      )}

      <RootIntoAncientFriendDialog
        groveId={groveId}
        isSteward={isSteward}
        open={open}
        onClose={() => setOpen(false)}
        onRooted={() => qc.invalidateQueries({ queryKey: ["grove-roots", groveId] })}
      />
      <TendInscriptionDialog
        root={tendingRoot}
        onClose={() => setTendingRoot(null)}
        onTended={refresh}
      />
    </section>
  );
}

/* ---------------- the rooting rite ---------------- */

function RootIntoAncientFriendDialog({
  groveId,
  isSteward,
  open,
  onClose,
  onRooted,
}: {
  groveId: string;
  isSteward: boolean;
  open: boolean;
  onClose: () => void;
  onRooted: () => void;
}) {
  const [term, setTerm] = useState("");
  const [chosen, setChosen] = useState<AncientFriendResult | null>(null);
  const [inscription, setInscription] = useState("");
  const [dedication, setDedication] = useState("");
  const [disclosure, setDisclosure] = useState<PortalDisclosure>("mark_only");
  const [entryMode, setEntryMode] = useState<EntryMode>("members_only");
  const [visible, setVisible] = useState(true);
  const [signature, setSignature] = useState<SignatureStrokes>([]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["ancient-friend-search", term],
    queryFn: () => searchAncientFriends(term),
    enabled: open && term.trim().length >= 2 && !chosen,
  });

  const create = useMutation({
    mutationFn: () =>
      createGroveRoot({
        groveId,
        treeId: chosen!.id,
        inscriptionText: inscription.trim(),
        dedication: dedication.trim() || null,
        inscriptionVisibility: visible ? "public" : "private",
        portalDisclosure: disclosure,
        entryMode,
        signatureStrokes: signature,
      }),
    onSuccess: () => {
      toast.success(
        isSteward
          ? "The root reaches out. It will be marked once welcomed."
          : "Your suggestion rests with the grove's stewards.",
      );
      reset();
      onClose();
      onRooted();
    },
    onError: (e: unknown) => toast.error(describe(e)),
  });

  function reset() {
    setTerm("");
    setChosen(null);
    setInscription("");
    setDedication("");
    setDisclosure("mark_only");
    setEntryMode("members_only");
    setVisible(true);
    setSignature([]);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Root into an Ancient Friend</DialogTitle>
          <DialogDescription className="font-serif text-xs italic">
            A root is the relationship. An inscription is the mark it leaves.
          </DialogDescription>
        </DialogHeader>

        {!chosen ? (
          <div className="space-y-3">
            <Label htmlFor="af-search" className="font-serif text-sm">
              Search the atlas
            </Label>
            <Input
              id="af-search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="A name, or a species…"
              className="text-base"
            />
            {isFetching && (
              <p className="font-serif text-xs italic text-muted-foreground/70">Looking…</p>
            )}
            <ul className="space-y-2">
              {results.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setChosen(t)}
                    className="w-full text-left rounded-xl border border-border/40 bg-card/40
                      p-3 min-h-[56px] hover:border-primary/50 transition"
                  >
                    <p className="font-serif text-sm text-foreground">{t.name || "Unnamed friend"}</p>
                    <p className="font-serif text-[11px] text-muted-foreground/80">{t.species}</p>
                  </button>
                </li>
              ))}
            </ul>
            {term.trim().length >= 2 && !isFetching && results.length === 0 && (
              <p className="font-serif text-xs italic text-muted-foreground/70">
                No friend by that name yet.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
              <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
                The pairing
              </p>
              <p className="font-serif text-base text-foreground mt-1">
                {chosen.name || "An Ancient Friend"}
              </p>
              <p className="font-serif text-[11px] text-muted-foreground/80">{chosen.species}</p>
              <button
                type="button"
                onClick={() => setChosen(null)}
                className="font-serif text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mt-2 min-h-[44px]"
              >
                Choose another
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscription" className="font-serif text-sm">
                The inscription
              </Label>
              <Input
                id="inscription"
                value={inscription}
                onChange={(e) => setInscription(e.target.value.slice(0, 48))}
                placeholder="MAITHE"
                className="text-base font-serif tracking-[0.3em] text-center"
              />
              <p className="font-serif text-[11px] italic text-muted-foreground/70">
                A short mark — a name, initials, a word. It is all a passer-by will read.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-serif text-sm">Handwritten mark (optional)</Label>
              <RootSignaturePad value={signature} onChange={setSignature} />
              <p className="font-serif text-[11px] italic text-muted-foreground/70">
                Draw with a finger, pen or pointer. The written inscription remains its spoken name.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dedication" className="font-serif text-sm">
                A dedication (optional)
              </Label>
              <Textarea
                id="dedication"
                rows={2}
                value={dedication}
                onChange={(e) => setDedication(e.target.value.slice(0, 280))}
                className="text-base"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="font-serif text-sm text-foreground">Who may read the mark</legend>
              <Choice
                active={visible}
                onClick={() => setVisible(true)}
                title="Anyone visiting the Ancient Friend"
                hint="The mark rests in its digital bark."
              />
              <Choice
                active={!visible}
                onClick={() => setVisible(false)}
                title="Only this grove"
                hint="The root is held quietly, unseen by visitors."
              />
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="font-serif text-sm text-foreground">What the mark says of you</legend>
              <Choice
                active={disclosure === "mark_only"}
                onClick={() => setDisclosure("mark_only")}
                title="The mark alone"
                hint="No remembered name, no grove title."
              />
              <Choice
                active={disclosure === "named"}
                onClick={() => setDisclosure("named")}
                title="The mark, the name and the grove"
                hint="Visitors may read who is remembered here."
              />
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="font-serif text-sm text-foreground">Who may enter the tree</legend>
              <Choice
                active={entryMode === "members_only"}
                onClick={() => setEntryMode("members_only")}
                title="Only the grove's own people"
                hint="Others see the mark and stop there."
              />
              <Choice
                active={entryMode === "as_grove_permits"}
                onClick={() => setEntryMode("as_grove_permits")}
                title="Whoever the grove already allows"
                hint="This never widens the grove's own privacy."
              />
            </fieldset>

            <Button
              className="w-full h-14 font-serif"
              disabled={!inscription.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending
                ? "Reaching…"
                : isSteward
                  ? "Root into this Ancient Friend"
                  : "Suggest this root"}
            </Button>
            <p className="font-serif text-[11px] italic text-muted-foreground/70 text-center">
              {isSteward
                ? "A keeper of that Ancient Friend welcomes the root before the mark appears."
                : "A steward of this grove takes up the suggestion first; the Ancient Friend's keeper welcomes it after."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TendInscriptionDialog({
  root,
  onClose,
  onTended,
}: {
  root: Awaited<ReturnType<typeof listGroveRoots>>[number] | null;
  onClose: () => void;
  onTended: () => void;
}) {
  const [text, setText] = useState("");
  const [signature, setSignature] = useState<SignatureStrokes>([]);
  const [started, setStarted] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      tendGroveRootInscription({
        rootId: root?.root_id ?? "",
        inscriptionText: text.trim() || null,
        signatureStrokes: started && signature.length ? signature : null,
        clearSignature: started && signature.length === 0,
      }),
    onSuccess: () => {
      toast.success("The inscription rests anew in the bark.");
      onTended();
      onClose();
    },
    onError: (e: unknown) => toast.error(describe(e)),
  });

  const prepare = () => {
    setText(root?.inscription_text ?? "");
    setSignature(root?.signature_strokes ?? []);
    setStarted(false);
  };

  return (
    <Dialog
      open={!!root}
      onOpenChange={(open) => {
        if (!open) onClose();
        else prepare();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onOpenAutoFocus={prepare}>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Tend the inscription</DialogTitle>
          <DialogDescription className="font-serif text-xs italic">
            Renew the mark without changing the Root beneath it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tended-inscription" className="font-serif text-sm">The spoken inscription</Label>
            <Input
              id="tended-inscription"
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, 48))}
              className="text-base font-serif tracking-[0.3em] text-center"
            />
          </div>
          <div className="space-y-2" onPointerDown={() => setStarted(true)}>
            <Label className="font-serif text-sm">The handwritten mark</Label>
            <RootSignaturePad value={signature} onChange={(next) => { setStarted(true); setSignature(next); }} />
          </div>
          <Button
            className="w-full h-14 font-serif"
            disabled={!text.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Tending…" : "Let the bark remember"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Choice({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full text-left p-3 rounded-xl border bg-card/40 transition min-h-[56px] ${
        active ? "border-primary/60 ring-1 ring-primary/30" : "border-border/40"
      }`}
    >
      <p className="font-serif text-sm text-foreground">{title}</p>
      <p className="font-serif text-[11px] text-muted-foreground/80 mt-0.5">{hint}</p>
    </button>
  );
}

function describe(e: unknown): string {
  const m = (e as { message?: string })?.message ?? "";
  if (m.includes("steward_only")) return "Only a steward of this grove may decide on a suggestion.";
  if (m.includes("contributor_only")) return "Only people welcomed into this grove may suggest a root.";
  if (m.includes("not_a_suggestion")) return "That root has already moved on.";
  if (m.includes("reason_required")) return "Please leave a few words with your decision.";
  if (m.includes("root_already_exists")) return "This grove is already rooted in that Ancient Friend.";
  if (m.includes("tree_merged")) return "That Ancient Friend has been merged into another record.";
  if (m.includes("invalid_signature")) return "That mark held too much detail. Try a simpler gesture.";
  return m || "Something would not settle. Please try again.";
}
