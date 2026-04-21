/**
 * WhispersPage — "My Whispers" inbox with Waiting / Collected tabs.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useWaitingWhispers, useCollectedWhispers, useSentWhispers, type TreeWhisper } from "@/hooks/use-whispers";
import { useWaitingMycelialWhispers, useSentMycelialWhispers } from "@/hooks/use-mycelial-whispers";
import Header from "@/components/Header";
import PageShell from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircle, TreeDeciduous, Send, Inbox, Archive, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import WhisperGroupManager from "@/components/WhisperGroupManager";

const CHANNEL_META: Record<string, { icon: string; label: string; tone: string }> = {
  tree: { icon: "🌳", label: "This tree", tone: "border-primary/30 text-primary" },
  species: { icon: "🌿", label: "Species", tone: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300" },
  mycelium: { icon: "🍄", label: "The forest", tone: "border-amber-500/30 text-amber-700 dark:text-amber-300" },
};

const DELIVERY_LABELS: Record<string, string> = {
  ANY_TREE: "🌳 Any Ancient Friend",
  SPECIFIC_TREE: "📍 Specific Tree",
  SPECIES_MATCH: "🌿 Species Match",
};

function WhisperCard({ whisper, variant }: { whisper: TreeWhisper; variant: "waiting" | "collected" | "sent" }) {
  const [treeName, setTreeName] = useState<string>("");
  const [collectedTreeName, setCollectedTreeName] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [collectionCount, setCollectionCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("trees")
      .select("name")
      .eq("id", whisper.tree_anchor_id)
      .maybeSingle()
      .then(({ data }) => setTreeName(data?.name || "Unknown"));
  }, [whisper.tree_anchor_id]);

  // For "sent" variant: resolve recipient name + collection telemetry
  useEffect(() => {
    if (variant !== "sent") return;

    if (whisper.recipient_scope === "PRIVATE" && whisper.recipient_user_id) {
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", whisper.recipient_user_id)
        .maybeSingle()
        .then(({ data }) => setRecipientName((data as any)?.full_name || "a wanderer"));
    }

    if (whisper.collected_tree_id) {
      supabase
        .from("trees")
        .select("name")
        .eq("id", whisper.collected_tree_id)
        .maybeSingle()
        .then(({ data }) => setCollectedTreeName(data?.name || ""));
    }

    if (whisper.recipient_scope === "PUBLIC") {
      supabase
        .from("tree_whisper_collections" as any)
        .select("id", { count: "exact", head: true })
        .eq("whisper_id", whisper.id)
        .then(({ count }) => setCollectionCount(typeof count === "number" ? count : 0));
    }
  }, [variant, whisper.id, whisper.recipient_scope, whisper.recipient_user_id, whisper.collected_tree_id]);

  // Derive sender-facing status
  const sentStatus: "collected" | "waiting" =
    variant === "sent" && (whisper.status === "collected" || (collectionCount ?? 0) > 0)
      ? "collected"
      : "waiting";

  const ageDays = Math.floor(
    (Date.now() - new Date(whisper.created_at).getTime()) / (1000 * 60 * 60 * 24),
  );
  const isStalled = variant === "sent" && sentStatus === "waiting" && ageDays >= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/20 transition-colors ${
        isStalled ? "border-amber-500/30" : ""
      }`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TreeDeciduous className="w-4 h-4 text-primary/70" />
              <Link
                to={`/tree/${whisper.tree_anchor_id}`}
                className="text-sm font-serif text-primary hover:underline"
              >
                {treeName}
              </Link>
            </div>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-[9px] font-serif border-primary/20">
                {whisper.recipient_scope === "PUBLIC" ? "Shared" : "Private"}
              </Badge>
              <Badge variant="outline" className="text-[9px] font-serif border-border/30">
                {DELIVERY_LABELS[whisper.delivery_scope] || whisper.delivery_scope}
              </Badge>
            </div>
          </div>

          {variant === "waiting" ? (
            <div className="border-l-2 border-primary/20 pl-3">
              <p className="text-xs font-serif text-muted-foreground italic">
                A whisper waits within this tree…
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-1 font-serif">
                {whisper.delivery_scope === "ANY_TREE"
                  ? "Check in at any Ancient Friend to collect."
                  : whisper.delivery_scope === "SPECIFIC_TREE"
                  ? "Visit this specific tree to collect."
                  : `Visit any ${whisper.delivery_species_key?.replace(/_/g, " ")} to collect.`}
              </p>
            </div>
          ) : (
            <div className="border-l-2 border-primary/30 pl-3">
              <p className="text-sm font-serif text-foreground/90 leading-relaxed italic">
                "{whisper.message_content}"
              </p>
              {variant === "collected" && whisper.collected_at && (
                <p className="text-[10px] text-muted-foreground/50 mt-2 font-serif">
                  Collected {new Date(whisper.collected_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Sender-facing status panel */}
          {variant === "sent" && (
            <div
              className="rounded-lg px-3 py-2 text-[10px] font-serif flex flex-wrap items-center gap-x-3 gap-y-1"
              style={{
                background:
                  sentStatus === "collected"
                    ? "hsl(var(--primary) / 0.08)"
                    : isStalled
                    ? "hsl(38 92% 50% / 0.08)"
                    : "hsl(var(--muted) / 0.4)",
              }}
            >
              {sentStatus === "collected" ? (
                <>
                  <span className="text-primary">✓ Collected</span>
                  {whisper.recipient_scope === "PRIVATE" ? (
                    <>
                      <span className="text-muted-foreground/70">
                        by {recipientName || "the recipient"}
                      </span>
                      {whisper.collected_at && (
                        <span className="text-muted-foreground/50">
                          {new Date(whisper.collected_at).toLocaleDateString()}
                        </span>
                      )}
                      {collectedTreeName && (
                        <span className="text-muted-foreground/60">
                          at {collectedTreeName}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground/70">
                      {collectionCount ?? 0}{" "}
                      {collectionCount === 1 ? "wanderer" : "wanderers"} received
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className={isStalled ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/80"}>
                    {isStalled ? "⏳ Stalled" : "⋯ Waiting"}
                  </span>
                  <span className="text-muted-foreground/60">
                    {whisper.recipient_scope === "PRIVATE"
                      ? `${recipientName || "Recipient"} hasn't visited yet`
                      : whisper.recipient_scope === "PUBLIC"
                      ? `${collectionCount ?? 0} have collected`
                      : "Awaiting collection"}
                  </span>
                  <span className="text-muted-foreground/50">
                    {ageDays === 0 ? "today" : `${ageDays}d ago`}
                  </span>
                </>
              )}
            </div>
          )}

          {variant !== "sent" && (
            <div className="text-[10px] text-muted-foreground/40 font-serif">
              {new Date(whisper.created_at).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function WhispersPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id ?? null));
  }, []);

  const { whispers: waiting, loading: waitingLoading } = useWaitingWhispers(userId);
  const { whispers: collected, loading: collectedLoading } = useCollectedWhispers(userId);
  const { whispers: sent, loading: sentLoading } = useSentWhispers(userId);
  const { rows: mycelialWaiting, loading: mycelialWaitingLoading } = useWaitingMycelialWhispers(userId);
  const { whispers: mycelialSent, loading: mycelialSentLoading } = useSentMycelialWhispers(userId);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageShell>
        <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1))",
              }}
            >
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-primary tracking-wide">
                Whispers in the Canopy
              </h1>
              <p className="text-xs text-muted-foreground font-serif">
                Messages waiting within the trees
              </p>
            </div>
          </div>

          {/* Whisper explanation */}
          <div className="mb-6 p-4 rounded-xl border border-primary/15 bg-primary/5">
            <p className="text-xs font-serif text-foreground/70 leading-relaxed">
              Whispers are messages left beneath Ancient Friend trees. To send a whisper, you must be near a mapped tree — they are location-based offerings tied to place, carried through the mycelial network.
            </p>
          </div>

          {/* 🍄 Mycelial Whispers */}
          {userId && (mycelialWaiting.length > 0 || mycelialSent.length > 0 || mycelialWaitingLoading) && (
            <section className="mb-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>🍄</span>
                <h2 className="text-lg font-serif text-primary tracking-wide">Mycelial Whispers</h2>
                <Sparkles className="w-3.5 h-3.5 text-primary/50" />
              </div>
              <p className="text-[11px] font-serif text-muted-foreground -mt-2">
                Whispers carried through the network — open them at a tree to receive their hearts.
              </p>

              {mycelialWaitingLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
                </div>
              ) : mycelialWaiting.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider font-serif text-muted-foreground/70">
                    Waiting in the roots
                  </p>
                  {mycelialWaiting.map(({ whisper }) => {
                    const meta = CHANNEL_META[whisper.channel_type] ?? CHANNEL_META.mycelium;
                    return (
                      <motion.button
                        key={whisper.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(whisper.channel_type === "tree" && whisper.channel_id ? `/tree/${whisper.channel_id}` : `/tree/${whisper.tree_anchor_id}`)}
                        className="w-full text-left"
                      >
                        <Card className="border-border/40 bg-card/60 hover:border-primary/30 transition-colors">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="text-2xl" aria-hidden>{meta.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-serif text-foreground/90 italic truncate">
                                A whisper waits for you beneath the roots…
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 font-serif mt-0.5">
                                {whisper.channel_type === "tree"
                                  ? "Open at the anchor tree"
                                  : whisper.channel_type === "species"
                                  ? "Open at any tree of its species"
                                  : "Open at any Ancient Friend"}
                              </p>
                            </div>
                            <Badge variant="outline" className={`text-[9px] font-serif ${meta.tone}`}>
                              {meta.label}
                            </Badge>
                          </CardContent>
                        </Card>
                      </motion.button>
                    );
                  })}
                </div>
              ) : null}

              {mycelialSent.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider font-serif text-muted-foreground/70">
                    Sent into the network
                  </p>
                  {mycelialSent.map(w => {
                    const meta = CHANNEL_META[w.channel_type] ?? CHANNEL_META.mycelium;
                    return (
                      <motion.div
                        key={w.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-border/40 bg-card/60">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base" aria-hidden>{meta.icon}</span>
                                <Badge variant="outline" className={`text-[9px] font-serif ${meta.tone}`}>
                                  {meta.label}
                                </Badge>
                              </div>
                              <span className="text-[10px] text-muted-foreground/60 font-serif">
                                {new Date(w.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-serif text-foreground/85 italic leading-relaxed border-l-2 border-primary/20 pl-3">
                              "{w.message_content}"
                            </p>
                            <div className="flex items-center justify-between text-[10px] font-serif text-muted-foreground">
                              <span>{w.opened_count} of {w.total_count} opened</span>
                              <span className="text-primary/70">−{w.hearts_cost} ♥ sent</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {userId && (
            <div className="mb-8">
              <WhisperGroupManager userId={userId} />
            </div>
          )}

          {!userId ? (
            <Card className="border-border/40">
              <CardContent className="p-8 text-center">
                <p className="font-serif text-muted-foreground">
                  Sign in to view your whispers.
                </p>
                <Link to="/auth" className="text-primary font-serif text-sm hover:underline mt-2 block">
                  Sign In
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="waiting" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="waiting" className="font-serif text-xs gap-1.5">
                  <Inbox className="w-3.5 h-3.5" />
                  Waiting
                  {waiting.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1.5">
                      {waiting.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="collected" className="font-serif text-xs gap-1.5">
                  <Archive className="w-3.5 h-3.5" />
                  Collected
                </TabsTrigger>
                <TabsTrigger value="sent" className="font-serif text-xs gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Sent
                  {sent.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1.5">
                      {sent.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="waiting" className="space-y-3">
                {waitingLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : waiting.length === 0 ? (
                  <div className="text-center py-12">
                    <TreeDeciduous className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-serif text-muted-foreground">
                      No whispers waiting. Visit an Ancient Friend to discover messages.
                    </p>
                  </div>
                ) : (
                  waiting.map(w => <WhisperCard key={w.id} whisper={w} variant="waiting" />)
                )}
              </TabsContent>

              <TabsContent value="collected" className="space-y-3">
                {collectedLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : collected.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-serif text-muted-foreground">
                      No whispers collected yet.
                    </p>
                  </div>
                ) : (
                  collected.map(w => <WhisperCard key={w.id} whisper={w} variant="collected" />)
                )}
              </TabsContent>

              <TabsContent value="sent" className="space-y-3">
                {sentLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : sent.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-serif text-muted-foreground">
                      You haven't sent any whispers yet.
                    </p>
                  </div>
                ) : (
                  sent.map(w => <WhisperCard key={w.id} whisper={w} variant="collected" />)
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </PageShell>
    </div>
  );
}
