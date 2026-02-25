import { useState, useEffect } from "react";
import { Gift, Send, Link2, Loader2, CheckCircle2, Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useMarketSeeds } from "@/hooks/use-market-seeds";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

/**
 * GiftSeedSender — modal to send daily gift seeds to friends (in-app or invite link).
 * Each gift seed sprouts into a heart when the friend activates it.
 */
const GiftSeedSender = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string; avatar_url: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { giftSeedsRemaining, sendGiftToUser, sendGiftViaInvite } = useMarketSeeds(userId);

  const searchProfiles = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.rpc("search_discoverable_profiles", {
      search_query: q,
      result_limit: 8,
    });
    setSearchResults((data || []).filter((p: any) => p.id !== userId));
    setSearching(false);
  };

  const handleSendToUser = async (recipientId: string, name: string) => {
    setSending(true);
    const ok = await sendGiftToUser(recipientId, 1, message || undefined);
    setSending(false);
    if (ok) {
      setSuccess(true);
      toast({ title: "Seed sent! 🌱", description: `Gift seed sent to ${name}. It sprouts into a heart when they log in.` });
      setTimeout(() => { setSuccess(false); setSearchQuery(""); setMessage(""); }, 2500);
    }
  };

  const handleCreateInvite = async () => {
    setSending(true);
    const code = await sendGiftViaInvite(1, message || undefined);
    setSending(false);
    if (code) {
      setInviteCode(code);
      toast({ title: "Invite seed created! 🌱", description: "Share the link with a friend." });
    }
  };

  const inviteUrl = inviteCode
    ? `${window.location.origin}/auth?gift=${inviteCode}`
    : null;

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-serif text-xs gap-1.5">
          <Gift className="w-3.5 h-3.5" />
          Gift Seeds
          {giftSeedsRemaining > 0 && (
            <Badge variant="secondary" className="text-[9px] ml-1 px-1.5 py-0">
              {giftSeedsRemaining}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Send Gift Seeds
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs font-serif text-muted-foreground mb-2">
          You have <span className="text-primary font-medium">{giftSeedsRemaining}</span> gift seed{giftSeedsRemaining !== 1 ? "s" : ""} remaining today.
          Each seed sprouts into a heart when your friend activates it.
        </p>

        {giftSeedsRemaining === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm font-serif text-muted-foreground">All gift seeds sent today! 🌿</p>
            <p className="text-[11px] font-serif text-muted-foreground/70 mt-1">Seeds refresh at midnight.</p>
          </div>
        ) : (
          <Tabs defaultValue="friend">
            <TabsList className="w-full">
              <TabsTrigger value="friend" className="font-serif text-xs gap-1 flex-1">
                <Users className="w-3 h-3" /> Send to Friend
              </TabsTrigger>
              <TabsTrigger value="invite" className="font-serif text-xs gap-1 flex-1">
                <Link2 className="w-3 h-3" /> Invite Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friend" className="space-y-3 mt-3">
              <Input
                placeholder="Search wanderers by name…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchProfiles(e.target.value);
                }}
                className="font-serif text-sm"
              />
              <Input
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="font-serif text-xs"
              />

              <AnimatePresence>
                {success ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 py-4 text-primary"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-serif text-sm">Seed sent!</span>
                  </motion.div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {searching && <p className="text-xs text-muted-foreground font-serif">Searching…</p>}
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSendToUser(p.id, p.full_name || "Wanderer")}
                        disabled={sending}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/30 hover:border-primary/30 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-xs font-serif text-primary">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            (p.full_name || "?")[0]
                          )}
                        </div>
                        <span className="text-sm font-serif text-foreground flex-1">{p.full_name || "Wanderer"}</span>
                        <Send className="w-3.5 h-3.5 text-primary shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="invite" className="space-y-3 mt-3">
              <Input
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="font-serif text-xs"
              />

              {inviteUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                    <span className="text-xs font-serif text-foreground truncate flex-1">{inviteUrl}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteUrl);
                        toast({ title: "Copied!" });
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] font-serif text-muted-foreground">
                    Share this link. The seed sprouts into a heart when your friend signs up.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-serif text-xs"
                    onClick={() => { setInviteCode(null); setMessage(""); }}
                  >
                    Create another
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full font-serif text-xs gap-1.5"
                  onClick={handleCreateInvite}
                  disabled={sending}
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  Generate Invite Seed
                </Button>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GiftSeedSender;
