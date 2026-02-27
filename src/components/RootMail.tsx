/**
 * RootMail — asynchronous tree letters.
 * Users leave letters "to" a tree, discoverable by others after 24h.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Props {
  treeId: string;
  userId: string;
  treeName?: string;
}

interface Letter {
  id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  discovered_by: string | null;
}

const RootMail = ({ treeId, userId, treeName }: Props) => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [undiscovered, setUndiscovered] = useState<Letter[]>([]);

  useEffect(() => {
    const fetch = async () => {
      // Letters I've written to this tree
      const { data: mine } = await supabase
        .from("root_mail")
        .select("id, content, is_anonymous, created_at, discovered_by")
        .eq("tree_id", treeId)
        .eq("author_id", userId)
        .order("created_at", { ascending: false });
      setLetters((mine as Letter[]) || []);

      // Letters waiting to be discovered at this tree (not mine)
      const { data: waiting } = await supabase
        .from("root_mail")
        .select("id, content, is_anonymous, created_at, discovered_by")
        .eq("tree_id", treeId)
        .neq("author_id", userId)
        .is("discovered_by", null)
        .lte("visible_after", new Date().toISOString());
      setUndiscovered((waiting as Letter[]) || []);
    };
    fetch();
  }, [treeId, userId]);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);

    const { error } = await supabase.from("root_mail").insert({
      author_id: userId,
      tree_id: treeId,
      content: content.trim(),
      is_anonymous: true,
    });

    if (!error) {
      toast("💌 Letter left at this tree", { description: "Others can discover it after 24 hours" });
      setContent("");
      setShowCompose(false);
      setLetters(prev => [
        { id: crypto.randomUUID(), content: content.trim(), is_anonymous: true, created_at: new Date().toISOString(), discovered_by: null },
        ...prev,
      ]);
    }
    setSending(false);
  };

  const handleDiscover = async (letterId: string) => {
    const { error } = await supabase
      .from("root_mail")
      .update({ discovered_by: userId, discovered_at: new Date().toISOString() })
      .eq("id", letterId);

    if (!error) {
      toast("📜 You discovered a Root Mail letter!");
      setUndiscovered(prev => prev.filter(l => l.id !== letterId));
    }
  };

  return (
    <div className="rounded-xl border p-3 space-y-3" style={{
      background: "hsl(var(--card) / 0.5)",
      borderColor: "hsl(var(--border) / 0.3)",
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary/70" />
          <h4 className="font-serif text-xs text-foreground/80">Root Mail</h4>
        </div>
        {undiscovered.length > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">
            {undiscovered.length} waiting
          </span>
        )}
      </div>

      {/* Undiscovered letters */}
      <AnimatePresence>
        {undiscovered.map(letter => (
          <motion.div
            key={letter.id}
            className="rounded-lg border p-3 space-y-2"
            style={{
              background: "hsl(var(--accent) / 0.05)",
              borderColor: "hsl(var(--accent) / 0.2)",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <p className="text-xs font-serif text-foreground/60 italic">
              A letter awaits at {treeName || "this tree"}…
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs font-serif gap-1.5"
              onClick={() => handleDiscover(letter.id)}
            >
              <Eye className="w-3 h-3" /> Open Letter
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Compose */}
      {showCompose ? (
        <div className="space-y-2">
          <Textarea
            placeholder={`Write a letter to ${treeName || "this Ancient Friend"}…`}
            value={content}
            onChange={e => setContent(e.target.value)}
            className="text-sm font-serif min-h-[80px] resize-none"
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 text-xs font-serif gap-1"
              onClick={handleSend}
              disabled={sending || !content.trim()}
            >
              <Send className="w-3 h-3" /> Leave Letter
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-serif"
              onClick={() => { setShowCompose(false); setContent(""); }}
            >
              Cancel
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center font-serif">
            Anonymous by default · Visible to others after 24h
          </p>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs font-serif gap-1.5"
          onClick={() => setShowCompose(true)}
          style={{ borderColor: "hsl(var(--primary) / 0.2)" }}
        >
          <Send className="w-3 h-3" /> Write a Letter
        </Button>
      )}

      {/* My letters */}
      {letters.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: "hsl(var(--border) / 0.2)" }}>
          <p className="text-[10px] text-muted-foreground/50 font-serif">Your letters</p>
          {letters.slice(0, 3).map(l => (
            <div key={l.id} className="text-xs font-serif text-foreground/60 flex justify-between items-start">
              <span className="line-clamp-1 flex-1">{l.content}</span>
              <span className="text-[9px] text-muted-foreground/40 ml-2 shrink-0">
                {l.discovered_by ? "📖" : "⏳"} {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RootMail;
