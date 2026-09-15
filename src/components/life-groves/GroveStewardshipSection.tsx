/**
 * GroveStewardshipSection — tending the tree.
 *
 * Offerings grow the branches. Stewardship tends the tree.
 * Everything here is offered only to those the database already trusts;
 * every action is independently enforced server-side.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, History, Leaf, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import type { LifeGrove } from "@/lib/life-groves/types";
import { groveFieldLabel, tendingSourceLabel } from "@/lib/life-groves/stewardship";
import {
  acceptGroveProposal,
  declineGroveProposal,
  grantGroveSteward,
  listGroveContributorContacts,
  listGroveProposals,
  listGroveStewards,
  listGroveTendingHistory,
  revokeGroveSteward,
} from "@/repositories/life-grove-stewardship";
import { useGroveAuthority } from "@/hooks/use-grove-authority";
import TendGroveSheet from "./TendGroveSheet";
import ProposeEditDialog from "./ProposeEditDialog";

interface Props {
  grove: LifeGrove;
}

export default function GroveStewardshipSection({ grove }: Props) {
  const qc = useQueryClient();
  const { userId, isSteward, isPrimarySteward, isContributor } = useGroveAuthority(grove.id);
  const [tending, setTending] = useState(false);
  const [proposing, setProposing] = useState(false);

  const { data: proposals = [] } = useQuery({
    queryKey: ["grove-proposals", grove.id],
    queryFn: () => listGroveProposals(grove.id),
    enabled: !!userId && isContributor,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["grove-tending-history", grove.id],
    queryFn: () => listGroveTendingHistory(grove.id),
    enabled: !!userId && isContributor,
  });

  const { data: stewards = [] } = useQuery({
    queryKey: ["grove-stewards", grove.id],
    queryFn: () => listGroveStewards(grove.id),
    enabled: !!userId && isContributor,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["grove-contacts", grove.id],
    queryFn: () => listGroveContributorContacts(grove.id),
    enabled: !!userId && isSteward,
  });

  if (!userId || !isContributor) return null;

  const pending = proposals.filter((p) => p.status === "pending");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["grove-proposals", grove.id] });
    qc.invalidateQueries({ queryKey: ["grove-tending-history", grove.id] });
    qc.invalidateQueries({ queryKey: ["life-grove", grove.id] });
  };

  const accept = async (id: string) => {
    try {
      await acceptGroveProposal(id);
      toast("Accepted. The grove has been tended.");
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "That could not be accepted.");
    }
  };

  const decline = async (id: string) => {
    try {
      await declineGroveProposal(id);
      toast("Declined, with thanks.");
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "That could not be declined.");
    }
  };

  const grant = async (uid: string) => {
    try {
      await grantGroveSteward(grove.id, uid);
      toast("Stewardship granted.");
      qc.invalidateQueries({ queryKey: ["grove-stewards", grove.id] });
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Stewardship could not be granted.");
    }
  };

  const revoke = async (uid: string) => {
    try {
      await revokeGroveSteward(grove.id, uid);
      toast("Stewardship withdrawn. Their offerings remain.");
      qc.invalidateQueries({ queryKey: ["grove-stewards", grove.id] });
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Stewardship could not be withdrawn.");
    }
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-serif text-xl text-foreground">Tending</h2>
        {isSteward ? (
          <Button variant="outline" size="sm" className="font-serif text-xs gap-2" onClick={() => setTending(true)}>
            <Leaf className="h-3.5 w-3.5" /> Tend this Grove
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="font-serif text-xs" onClick={() => setProposing(true)}>
            Propose an edit
          </Button>
        )}
      </div>

      <p className="font-serif text-xs italic text-muted-foreground/60 mb-4">
        Offerings grow the branches. Stewardship tends the tree.
      </p>

      <Accordion type="multiple" className="rounded-2xl border border-border/40 bg-card/30 px-4">
        {/* Proposals */}
        <AccordionItem value="proposals">
          <AccordionTrigger className="font-serif text-sm">
            Proposed edits
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-2 font-serif text-[10px]">{pending.length}</Badge>
            )}
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            {proposals.length === 0 && (
              <p className="font-serif text-xs italic text-muted-foreground/60">Nothing has been proposed yet.</p>
            )}
            {proposals.map((p) => (
              <div key={p.id} className="rounded-xl border border-border/30 bg-background/40 p-3 space-y-2">
                <p className="font-serif text-xs text-muted-foreground/70">
                  {groveFieldLabel(p.field_name)} · {p.status.replace(/_/g, " ")}
                </p>
                <p className="font-serif text-sm text-foreground/90 break-words">
                  <span className="line-through text-muted-foreground/60">{p.current_value || "empty"}</span>
                  {" → "}
                  <span>{p.proposed_value}</span>
                </p>
                {p.explanation && (
                  <p className="font-serif text-xs italic text-muted-foreground/70">“{p.explanation}”</p>
                )}
                {isSteward && p.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="font-serif text-xs gap-1.5 h-8" onClick={() => accept(p.id)}>
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button size="sm" variant="ghost" className="font-serif text-xs gap-1.5 h-8" onClick={() => decline(p.id)}>
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Tending history */}
        <AccordionItem value="history">
          <AccordionTrigger className="font-serif text-sm gap-2">
            <span className="flex items-center gap-2"><History className="h-3.5 w-3.5" /> Tending history</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-2">
            {history.length === 0 && (
              <p className="font-serif text-xs italic text-muted-foreground/60">
                Nothing has changed since the grove was planted.
              </p>
            )}
            {history.map((h) => (
              <div key={h.id} className="text-xs font-serif text-muted-foreground/80 border-l border-border/40 pl-3 py-1">
                <span className="text-foreground/90">{groveFieldLabel(h.field_name)}</span>
                {" · "}
                <span className="text-muted-foreground/60">{tendingSourceLabel(h.source)}</span>
                <div className="mt-0.5 break-words">
                  <span className="line-through text-muted-foreground/50">{h.old_value || "empty"}</span>
                  {" → "}
                  <span>{h.new_value || "empty"}</span>
                </div>
                <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {new Date(h.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Stewards */}
        <AccordionItem value="stewards" className="border-b-0">
          <AccordionTrigger className="font-serif text-sm gap-2">
            <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Stewards</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="font-serif text-xs text-muted-foreground/70">
              The keeper who planted this grove is its primary steward. Stewardship is always granted
              deliberately — an invitation link never confers it.
            </p>
            {stewards.map((s) => {
              const who = contacts.find((c) => c.user_id === s.user_id);
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 text-xs font-serif">
                  <span className="text-foreground/90">{who?.display_name ?? "A Wanderer"}</span>
                  {isPrimarySteward && (
                    <Button size="sm" variant="ghost" className="h-7 font-serif text-[11px]"
                      onClick={() => revoke(s.user_id)}>
                      Withdraw
                    </Button>
                  )}
                </div>
              );
            })}

            {isPrimarySteward && (
              <div className="pt-2 space-y-2">
                <p className="font-serif text-[11px] text-muted-foreground/60">
                  Invite someone who has already offered to this grove:
                </p>
                {contacts
                  .filter((c) => c.user_id !== grove.created_by && !stewards.some((s) => s.user_id === c.user_id))
                  .map((c) => (
                    <div key={c.user_id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-serif text-xs text-foreground/90 truncate">{c.display_name}</p>
                        {c.email && (
                          <p className="font-serif text-[10px] text-muted-foreground/50 truncate">{c.email}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="h-7 font-serif text-[11px]"
                        onClick={() => grant(c.user_id)}>
                        Make steward
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {isSteward && <TendGroveSheet open={tending} onOpenChange={setTending} grove={grove} />}
      {!isSteward && userId && (
        <ProposeEditDialog open={proposing} onOpenChange={setProposing} grove={grove} userId={userId} />
      )}
    </section>
  );
}
