/**
 * WhispersPage — "My Whispers" inbox with Waiting / Collected tabs.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useWaitingWhispers, useCollectedWhispers, useSentWhispers, type TreeWhisper } from "@/hooks/use-whispers";
import Header from "@/components/Header";
import PageShell from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircle, TreeDeciduous, Send, Inbox, Archive } from "lucide-react";
import { Link } from "react-router-dom";

const DELIVERY_LABELS: Record<string, string> = {
  ANY_TREE: "🌳 Any Ancient Friend",
  SPECIFIC_TREE: "📍 Specific Tree",
  SPECIES_MATCH: "🌿 Species Match",
};

function WhisperCard({ whisper, variant }: { whisper: TreeWhisper; variant: "waiting" | "collected" | "sent" }) {
  const [treeName, setTreeName] = useState<string>("");

  useEffect(() => {
    supabase
      .from("trees")
      .select("name")
      .eq("id", whisper.tree_anchor_id)
      .single()
      .then(({ data }) => setTreeName(data?.name || "Unknown"));
  }, [whisper.tree_anchor_id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/20 transition-colors">
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
              {whisper.collected_at && (
                <p className="text-[10px] text-muted-foreground/50 mt-2 font-serif">
                  Collected {new Date(whisper.collected_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground/40 font-serif">
            {new Date(whisper.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function WhispersPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { whispers: waiting, loading: waitingLoading } = useWaitingWhispers(userId);
  const { whispers: collected, loading: collectedLoading } = useCollectedWhispers(userId);
  const { whispers: sent, loading: sentLoading } = useSentWhispers(userId);

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
